from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import MaintenanceTask
from app.schemas import (
    MaintenanceTaskForOptimizerOut,
    MaintenanceTaskUrgencyUpdate,
    MaintenanceTaskBatchUrgencyResponse
)

router = APIRouter(prefix="/maintenance-tasks", tags=["maintenance-tasks"])

@router.get("/pending/for-optimizer", response_model=List[MaintenanceTaskForOptimizerOut])
def get_pending_tasks_for_optimizer(db: Session = Depends(get_db)):
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
    db: Session = Depends(get_db)
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
