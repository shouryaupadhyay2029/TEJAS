import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import BlockSchedule, MaintenanceTask, Section
from app.schemas import (
    BlockScheduleCreate,
    BlockScheduleOut,
    BlockScheduleDetailOut,
    BlockScheduleBatchCreateResponse
)

router = APIRouter(prefix="/block-schedule", tags=["block-schedule"])

@router.post("", response_model=BlockScheduleBatchCreateResponse)
def create_block_schedule_batch(
    items: List[BlockScheduleCreate],
    db: Session = Depends(get_db)
):
    """
    Batch endpoint consumed by CP-SAT solver to post generated maintenance block schedules.
    Validates task eligibility (must be status 'SCORED'), section existence, hours, and horizon.
    Updates maintenance task status to 'SCHEDULED'.
    """
    if not items:
        return {"created": [], "skipped": []}
        
    created_ids = []
    skipped_items = []
    
    # Pre-fetch tasks and sections
    task_ids = [item.task_id for item in items]
    section_ids = [item.section_id for item in items]
    
    tasks_db = db.query(MaintenanceTask).filter(MaintenanceTask.task_id.in_(task_ids)).all()
    tasks_map = {t.task_id: t for t in tasks_db}
    
    sections_db = db.query(Section).filter(Section.section_id.in_(section_ids)).all()
    sections_set = {s.section_id for s in sections_db}
    
    for item in items:
        # 1. Task validation
        if item.task_id not in tasks_map:
            skipped_items.append({"task_id": item.task_id, "reason": f"Task {item.task_id} not found"})
            continue
            
        task_obj = tasks_map[item.task_id]
        if task_obj.status != 'SCORED':
            skipped_items.append({"task_id": item.task_id, "reason": f"Task status is '{task_obj.status}', expected 'SCORED'"})
            continue
            
        # 2. Section validation
        if item.section_id not in sections_set:
            skipped_items.append({"task_id": item.task_id, "reason": f"Section {item.section_id} not found"})
            continue
            
        # 3. Hours validation
        if not (0 <= item.start_hour < item.end_hour <= 24):
            skipped_items.append({"task_id": item.task_id, "reason": "Invalid hours: start_hour must be < end_hour and within 0-24"})
            continue
            
        # 4. Horizon validation
        if item.horizon not in ['WEEKLY', 'MONTHLY']:
            skipped_items.append({"task_id": item.task_id, "reason": "Invalid horizon: must be 'WEEKLY' or 'MONTHLY'"})
            continue
            
        # Create block schedule record
        block = BlockSchedule(
            task_id=item.task_id,
            section_id=item.section_id,
            slot_date=item.slot_date,
            start_hour=item.start_hour,
            end_hour=item.end_hour,
            horizon=item.horizon,
            approved_by_control_office=False
        )
        db.add(block)
        task_obj.status = 'SCHEDULED'
        
        db.flush()  # Obtain block_id
        created_ids.append(block.block_id)
        
    db.commit()
    
    return {
        "created": created_ids,
        "skipped": skipped_items
    }

@router.get("", response_model=List[BlockScheduleDetailOut])
def get_block_schedule(
    horizon: str = Query(..., description="Schedule horizon: 'WEEKLY' or 'MONTHLY'"),
    start_date: Optional[datetime.date] = Query(default=None),
    end_date: Optional[datetime.date] = Query(default=None),
    db: Session = Depends(get_db)
):
    """
    Returns block schedule entries for a horizon, joined with task and station details for UI rendering.
    """
    if horizon not in ['WEEKLY', 'MONTHLY']:
        raise HTTPException(status_code=422, detail="horizon query parameter must be 'WEEKLY' or 'MONTHLY'")
        
    sql_str = """
        SELECT 
            b.block_id,
            b.task_id,
            b.section_id,
            sec.section_code,
            sf.station_name AS from_station_name,
            st_to.station_name AS to_station_name,
            m.department,
            m.defect_type,
            m.defect_severity,
            m.urgency_score,
            b.slot_date,
            b.start_hour,
            b.end_hour,
            b.horizon,
            b.created_at,
            b.approved_by_control_office
        FROM block_schedule b
        JOIN maintenance_tasks m ON b.task_id = m.task_id
        JOIN sections sec ON b.section_id = sec.section_id
        JOIN stations sf ON sec.from_station_id = sf.station_id
        JOIN stations st_to ON sec.to_station_id = st_to.station_id
        WHERE b.horizon = :horizon
    """
    params = {"horizon": horizon}
    
    if start_date:
        sql_str += " AND b.slot_date >= :start_date"
        params["start_date"] = start_date
        
    if end_date:
        sql_str += " AND b.slot_date <= :end_date"
        params["end_date"] = end_date
        
    sql_str += " ORDER BY b.slot_date ASC, b.start_hour ASC, b.block_id ASC;"
    
    rows = db.execute(text(sql_str), params).mappings().all()
    return list(rows)

@router.patch("/{block_id}/approve", response_model=BlockScheduleDetailOut)
def approve_block_schedule(
    block_id: int,
    db: Session = Depends(get_db)
):
    """
    Records Control Office / DRM human approval for a scheduled maintenance block.
    """
    block = db.query(BlockSchedule).filter(BlockSchedule.block_id == block_id).first()
    if not block:
        raise HTTPException(status_code=404, detail=f"Block schedule record {block_id} not found")
        
    block.approved_by_control_office = True
    db.commit()
    
    # Return detail object
    query = text("""
        SELECT 
            b.block_id,
            b.task_id,
            b.section_id,
            sec.section_code,
            sf.station_name AS from_station_name,
            st_to.station_name AS to_station_name,
            m.department,
            m.defect_type,
            m.defect_severity,
            m.urgency_score,
            b.slot_date,
            b.start_hour,
            b.end_hour,
            b.horizon,
            b.created_at,
            b.approved_by_control_office
        FROM block_schedule b
        JOIN maintenance_tasks m ON b.task_id = m.task_id
        JOIN sections sec ON b.section_id = sec.section_id
        JOIN stations sf ON sec.from_station_id = sf.station_id
        JOIN stations st_to ON sec.to_station_id = st_to.station_id
        WHERE b.block_id = :block_id;
    """)
    
    row = db.execute(query, {"block_id": block_id}).mappings().first()
    return dict(row)
