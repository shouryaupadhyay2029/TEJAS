import datetime
import logging
from typing import Optional, List
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import MaintenanceTask, SectionTimeSlot, BlockSchedule
from scripts.run_cpsat_block_optimizer import (
    fetch_scored_tasks_from_db,
    fetch_section_time_slots,
    find_earliest_slot_date,
    generate_candidate_windows,
    build_and_solve_cpsat_model,
    save_blocks_to_db,
    DEPARTMENT_DURATIONS
)

logger = logging.getLogger("optimizer_router")

router = APIRouter(prefix="/optimizer", tags=["optimizer"])

class OptimizerRunRequest(BaseModel):
    horizon: str = "MONTHLY"  # "WEEKLY" or "MONTHLY"
    start_date: Optional[datetime.date] = None
    days: Optional[int] = None
    max_capacity: int = 2
    time_limit_sec: int = 60
    dry_run: bool = False

class ScheduledBlockItem(BaseModel):
    task_id: int
    section_id: int
    department: str
    slot_date: datetime.date
    start_hour: int
    end_hour: int
    duration: int

class OptimizerRunResponse(BaseModel):
    status: str
    horizon: str
    start_date: datetime.date
    days: int
    total_tasks: int
    scheduled_tasks: int
    unscheduled_tasks: int
    scheduling_rate_pct: float
    urgency_captured_pct: float
    colocated_windows_count: int
    scheduled_blocks: List[ScheduledBlockItem]
    infeasible_diagnostics: dict
    created_block_ids: List[int]

@router.post("/run", response_model=OptimizerRunResponse)
def run_optimizer(
    req: OptimizerRunRequest,
    db: Session = Depends(get_db)
):
    """
    Triggers the Google OR-Tools CP-SAT constraint optimization engine on-demand.
    Enforces consecutive department durations, section capacity, and co-location synergy.
    """
    if req.horizon not in ["WEEKLY", "MONTHLY"]:
        raise HTTPException(status_code=422, detail="horizon must be 'WEEKLY' or 'MONTHLY'")

    days = req.days if req.days is not None else (7 if req.horizon == "WEEKLY" else 30)
    start_date = req.start_date or find_earliest_slot_date(db)

    # 1. Fetch scored tasks
    tasks = fetch_scored_tasks_from_db(db)
    if not tasks:
        return OptimizerRunResponse(
            status="NO_TASKS",
            horizon=req.horizon,
            start_date=start_date,
            days=days,
            total_tasks=0,
            scheduled_tasks=0,
            unscheduled_tasks=0,
            scheduling_rate_pct=0.0,
            urgency_captured_pct=0.0,
            colocated_windows_count=0,
            scheduled_blocks=[],
            infeasible_diagnostics={},
            created_block_ids=[]
        )

    # 2. Fetch section availability
    unique_section_ids = list({t["section_id"] for t in tasks})
    slots_map = fetch_section_time_slots(db, unique_section_ids, start_date, days)

    # 3. Generate candidate windows
    all_candidates, task_candidates, infeasible_reasons = generate_candidate_windows(
        tasks, slots_map, start_date, days
    )

    # 4. Solve CP-SAT model
    status, status_name, scheduled_blocks, scheduled_task_ids = build_and_solve_cpsat_model(
        tasks=tasks,
        all_candidates=all_candidates,
        task_candidates=task_candidates,
        days=days,
        max_section_capacity=req.max_capacity,
        time_limit_sec=req.time_limit_sec
    )

    # 5. Persist if not dry-run
    created_ids = []
    if scheduled_blocks and not req.dry_run:
        created_ids, _ = save_blocks_to_db(db, scheduled_blocks, req.horizon)

    # Metrics
    total_tasks = len(tasks)
    num_scheduled = len(scheduled_blocks)
    rate_pct = (num_scheduled / total_tasks * 100) if total_tasks > 0 else 0.0

    task_map = {t["task_id"]: t for t in tasks}
    total_urg_scheduled = sum(float(task_map[b["task_id"]].get("urgency_score") or 0.0) for b in scheduled_blocks)
    total_urg_avail = sum(float(t.get("urgency_score") or 0.0) for t in tasks)
    urg_pct = (total_urg_scheduled / total_urg_avail * 100) if total_urg_avail > 0 else 0.0

    # Count co-located windows
    window_dept_map = {}
    for b in scheduled_blocks:
        key = (b["section_id"], b["slot_date"], b["start_hour"])
        window_dept_map.setdefault(key, set()).add(b["department"])
    coloc_count = sum(1 for depts in window_dept_map.values() if len(depts) > 1)

    return OptimizerRunResponse(
        status=status_name,
        horizon=req.horizon,
        start_date=start_date,
        days=days,
        total_tasks=total_tasks,
        scheduled_tasks=num_scheduled,
        unscheduled_tasks=total_tasks - num_scheduled,
        scheduling_rate_pct=round(rate_pct, 2),
        urgency_captured_pct=round(urg_pct, 2),
        colocated_windows_count=coloc_count,
        scheduled_blocks=[ScheduledBlockItem(**b) for b in scheduled_blocks],
        infeasible_diagnostics=infeasible_reasons,
        created_block_ids=created_ids
    )

@router.get("/durations")
def get_department_durations():
    """Returns the operational maintenance duration constraints per railway department."""
    return DEPARTMENT_DURATIONS
