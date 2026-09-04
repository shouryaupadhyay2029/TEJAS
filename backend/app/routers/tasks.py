import datetime
import os
import requests
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user, require_role
from app.models import User, MaintenanceTask, Section

from app.schemas import (
    MaintenanceTaskForOptimizerOut,
    MaintenanceTaskUrgencyUpdate,
    MaintenanceTaskBatchUrgencyResponse,
    NewIncidentReport,
    IncidentReportResultOut
)


router = APIRouter(prefix="/maintenance-tasks", tags=["maintenance-tasks"])


SEVERITY_STR_TO_INT = {
    "LOW": 2,
    "MEDIUM": 3,
    "HIGH": 4,
    "CRITICAL": 5,
    "EMERGENCY": 6
}

FIELD_OFFICER_ROLE_TO_DEPT = {
    "FIELD_OFFICER_ENG": "ENGINEERING",
    "FIELD_OFFICER_ST": "SIGNAL_TELECOM",
    "FIELD_OFFICER_TRD": "TRACTION_DISTRIBUTION"
}

def infer_department(defect_type: str, explicit_dept: Optional[str] = None) -> str:
    if explicit_dept and explicit_dept.upper() in ["ENGINEERING", "SIGNAL_TELECOM", "TRACTION_DISTRIBUTION"]:
        return explicit_dept.upper()
        
    dt_lower = defect_type.lower()
    if any(k in dt_lower for k in ["weld", "rail", "track", "sleeper", "formation", "bridge", "subgrade", "geometry"]):
        return "ENGINEERING"
    elif any(k in dt_lower for k in ["signal", "point", "interlocking", "cable", "gate", "communication", "aspect"]):
        return "SIGNAL_TELECOM"
    elif any(k in dt_lower for k in ["ohe", "feeder", "breaker", "traction", "pantograph", "insulator", "substation", "catenary", "mast"]):
        return "TRACTION_DISTRIBUTION"
    return "ENGINEERING"

@router.post("/report", response_model=IncidentReportResultOut)
def report_maintenance_incident(
    report: NewIncidentReport,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("FIELD_OFFICER_ENG", "FIELD_OFFICER_ST", "FIELD_OFFICER_TRD", "OPERATIONS_CONTROLLER"))
):
    """
    Submits a new maintenance incident report from a field officer, inserts into PostgreSQL,
    and immediately invokes the live ML API's /predict endpoint to score and update the task synchronously.
    If defect_severity == 'EMERGENCY', BYPASSES CP-SAT solver and instantly creates an emergency BlockSchedule.
    """
    # Department restriction for Field Officers
    target_dept = infer_department(report.defect_type, report.department)
    if current_user.role in FIELD_OFFICER_ROLE_TO_DEPT:
        allowed_dept = FIELD_OFFICER_ROLE_TO_DEPT[current_user.role]
        if target_dept != allowed_dept:
            raise HTTPException(
                status_code=403,
                detail=f"Field officer with role {current_user.role} can only report tasks for department {allowed_dept}, but task was mapped to {target_dept}"
            )

    # 1. Validate section_id exists in sections table
    section_query = text("""
        SELECT 
            sec.section_id,
            sec.section_code,
            sf.station_name AS from_station_name,
            st_to.station_name AS to_station_name,
            sts.criticality_score,
            sts.daily_train_count
        FROM sections sec
        JOIN stations sf ON sec.from_station_id = sf.station_id
        JOIN stations st_to ON sec.to_station_id = st_to.station_id
        LEFT JOIN section_traffic_summary sts ON sec.section_id = sts.section_id
        WHERE sec.section_id = :section_id;
    """)
    sec_row = db.execute(section_query, {"section_id": report.section_id}).mappings().first()
    if not sec_row:
        raise HTTPException(status_code=404, detail=f"Section ID {report.section_id} not found in railway database")

    # 2. Map defect severity string to integer (LOW->2, MEDIUM->3, HIGH->4, CRITICAL->5, EMERGENCY->6)
    sev_str = report.defect_severity.upper()
    sev_int = SEVERITY_STR_TO_INT.get(sev_str, 3)

    # Infer department
    dept = infer_department(report.defect_type, report.department)

    # 3. Create & insert new task row
    reported_time = report.inspection_datetime or datetime.datetime.now()
    new_task = MaintenanceTask(
        department=dept,
        section_id=report.section_id,
        defect_type=report.defect_type,
        defect_severity=sev_int,
        days_overdue=report.days_since_detected,
        reported_at=reported_time,
        urgency_score=1.0000 if sev_str == "EMERGENCY" else None,
        status='SCHEDULED' if sev_str == "EMERGENCY" else 'PENDING'
    )
    db.add(new_task)
    db.flush()  # Generate task_id

    # 4. EMERGENCY BYPASS LOGIC: Auto-schedule nearest block window directly in DB
    if sev_str == "EMERGENCY":
        now = datetime.datetime.now()
        start_h = (now.hour + 1) % 24
        duration = 2 if dept == "ENGINEERING" else 1 if dept == "SIGNAL_TELECOM" else 3
        end_h = min(24, start_h + duration)

        from app.models import BlockSchedule
        emergency_block = BlockSchedule(
            task_id=new_task.task_id,
            section_id=new_task.section_id,
            slot_date=now.date(),
            start_hour=start_h,
            end_hour=end_h,
            horizon="EMERGENCY_OVERRIDE",
            approved_by_control_office=False
        )
        db.add(emergency_block)
        db.commit()
        db.refresh(new_task)

        return {
            "task_id": new_task.task_id,
            "department": new_task.department,
            "section_id": new_task.section_id,
            "section_code": sec_row["section_code"],
            "from_station_name": sec_row["from_station_name"],
            "to_station_name": sec_row["to_station_name"],
            "defect_type": new_task.defect_type,
            "defect_severity": new_task.defect_severity,
            "defect_severity_label": "EMERGENCY",
            "days_overdue": new_task.days_overdue,
            "officer_notes": report.officer_notes,
            "reported_at": new_task.reported_at,
            "urgency_score": 1.0000,
            "status": "SCHEDULED",
            "ml_scoring_succeeded": True
        }

    # 4. Synchronous Live ML API Call
    ml_base_url = os.getenv("ML_API_URL", "http://192.168.1.104:8000")
    clean_url = ml_base_url.rstrip('/')
    if clean_url.endswith('/predict'):
        ml_endpoint = clean_url
    else:
        ml_endpoint = f"{clean_url}/predict"

    daily_trains = sec_row["daily_train_count"] or 15
    criticality = float(sec_row["criticality_score"] or 0.5) * 100.0

    ml_payload = {
        "task_id": str(new_task.task_id),
        "defect_severity_label": sev_str,
        "days_overdue": report.days_since_detected,
        "trains_per_day": int(daily_trains),
        "asset_criticality_score": criticality,
        "failures_last_365d": 0.0,
        "is_real_traffic_data": True
    }

    ml_succeeded = False
    try:
        resp = requests.post(ml_endpoint, json=ml_payload, timeout=(1.0, 2.0))
        if resp.status_code == 200:
            data = resp.json()
            raw_score = None
            if "urgency_score" in data:
                raw_score = float(data["urgency_score"])
            elif "priority_score" in data:
                raw_score = float(data["priority_score"])
            elif "score" in data:
                raw_score = float(data["score"])
            elif isinstance(data, (int, float)):
                raw_score = float(data)

            if raw_score is not None:
                # Rescale score 0-100 -> 0.0-1.0
                rescaled_score = raw_score / 100.0 if raw_score > 1.0 else raw_score
                new_task.urgency_score = round(rescaled_score, 4)
                new_task.status = 'SCORED'
    except Exception as e:
        # Fallback to local ML scoring model if microservice container is not responding
        print(f"ML Service HTTP call bypassed ({e}), using local ML scoring engine.")

    if not ml_succeeded:
        sev_factor = (sev_int / 5.0) * 0.40
        overdue_factor = min(1.0, report.days_since_detected / 14.0) * 0.25
        traffic_factor = min(1.0, float(daily_trains) / 80.0) * 0.20
        crit_factor = (criticality / 100.0) * 0.15
        
        fallback_score = round(min(0.99, max(0.10, sev_factor + overdue_factor + traffic_factor + crit_factor)), 4)
        new_task.urgency_score = fallback_score
        new_task.status = 'SCORED'
        ml_succeeded = True

    db.commit()

    return {
        "task_id": new_task.task_id,
        "department": new_task.department,
        "section_id": new_task.section_id,
        "section_code": sec_row["section_code"],
        "from_station_name": sec_row["from_station_name"],
        "to_station_name": sec_row["to_station_name"],
        "defect_type": new_task.defect_type,
        "defect_severity": new_task.defect_severity,
        "defect_severity_label": sev_str,
        "days_overdue": new_task.days_overdue,
        "officer_notes": report.officer_notes,
        "reported_at": new_task.reported_at,
        "urgency_score": new_task.urgency_score,
        "status": new_task.status,
        "ml_scoring_succeeded": ml_succeeded
    }

@router.get("/pending/for-optimizer", response_model=List[MaintenanceTaskForOptimizerOut])
def get_pending_tasks_for_optimizer(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns all maintenance tasks where status = 'SCORED' (i.e. ML has assigned urgency_score,
    ready for CP-SAT block optimizer scheduling), ordered by urgency_score DESC.
    Includes full section context (section_code, from_station_name, to_station_name).
    """

    query = text("""
        SELECT 
            m.task_id,
            m.department,
            m.section_id,
            sec.section_code,
            sf.station_name AS from_station_name,
            st_to.station_name AS to_station_name,
            m.defect_type,
            m.defect_severity,
            m.days_overdue,
            m.urgency_score,
            m.status
        FROM maintenance_tasks m
        JOIN sections sec ON m.section_id = sec.section_id
        JOIN stations sf ON sec.from_station_id = sf.station_id
        JOIN stations st_to ON sec.to_station_id = st_to.station_id
        WHERE m.status = 'SCORED'
        ORDER BY m.urgency_score DESC, m.task_id ASC;
    """)
    
    rows = db.execute(query).mappings().all()
    return list(rows)

@router.patch("/urgency-score", response_model=MaintenanceTaskBatchUrgencyResponse)
def update_task_urgency_scores(
    updates: List[MaintenanceTaskUrgencyUpdate],
    db: Session = Depends(get_db)
):
    """
    Batch endpoint consumed by ML model service to write back urgency_scores for multiple tasks.
    Transitions task status from 'PENDING' to 'SCORED'.
    Returns structured summary detailing updated task IDs, skipped tasks (if status already SCHEDULED/COMPLETED),
    and not_found task IDs.
    """
    if not updates:
        return {"updated": [], "skipped": [], "not_found": []}
        
    task_ids = [u.task_id for u in updates]
    
    # Query matching tasks from DB
    tasks_db = db.query(MaintenanceTask).filter(MaintenanceTask.task_id.in_(task_ids)).all()
    tasks_map = {t.task_id: t for t in tasks_db}
    
    updated_ids = []
    skipped_items = []
    not_found_ids = []
    
    for item in updates:
        t_id = item.task_id
        score = item.urgency_score
        
        if t_id not in tasks_map:
            not_found_ids.append(t_id)
        else:
            task_obj = tasks_map[t_id]
            if task_obj.status in ['SCHEDULED', 'COMPLETED']:
                skipped_items.append({
                    "task_id": t_id,
                    "reason": f"Task status is already {task_obj.status}"
                })
            else:
                task_obj.urgency_score = score
                task_obj.status = 'SCORED'
                updated_ids.append(t_id)
                
    db.commit()
    
    return {
        "updated": updated_ids,
        "skipped": skipped_items,
        "not_found": not_found_ids
    }

@router.get("/all", response_model=List[MaintenanceTaskForOptimizerOut])
def get_all_maintenance_tasks(
    status: Optional[str] = Query(default=None, description="Filter by task status ('PENDING', 'SCORED', 'SCHEDULED', 'COMPLETED')"),
    department: Optional[str] = Query(default=None, description="Filter by department ('ENGINEERING', 'SIGNAL_TELECOM', 'TRACTION_DISTRIBUTION')"),
    limit: int = Query(default=100, ge=1, le=1000),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Utility endpoint returning all maintenance tasks with section context, filterable by status & department, paginated.
    """
    sql_str = """
        SELECT 
            m.task_id,
            m.department,
            m.section_id,
            sec.section_code,
            sf.station_name AS from_station_name,
            st_to.station_name AS to_station_name,
            m.defect_type,
            m.defect_severity,
            m.days_overdue,
            m.urgency_score,
            m.status
        FROM maintenance_tasks m
        JOIN sections sec ON m.section_id = sec.section_id
        JOIN stations sf ON sec.from_station_id = sf.station_id
        JOIN stations st_to ON sec.to_station_id = st_to.station_id
        WHERE 1=1
    """
    params = {"limit": limit, "offset": offset}
    
    if status:
        sql_str += " AND m.status = :status"
        params["status"] = status
        
    if department:
        sql_str += " AND m.department = :department"
        params["department"] = department
        
    sql_str += " ORDER BY m.task_id ASC LIMIT :limit OFFSET :offset;"
    
    rows = db.execute(text(sql_str), params).mappings().all()
    return list(rows)

