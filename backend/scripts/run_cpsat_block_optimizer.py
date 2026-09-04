import os
import sys
import logging
import argparse
import datetime
from typing import List, Dict, Tuple, Optional
from collections import defaultdict

import json
import urllib.request
import urllib.error
from sqlalchemy import text
from sqlalchemy.orm import Session
from ortools.sat.python import cp_model

# Add backend root to sys.path to import app modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import SessionLocal, engine
from app.models import MaintenanceTask, SectionTimeSlot, BlockSchedule, Section, Station

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("cpsat_block_optimizer")

# Standard railway maintenance duration by department (in hours)
DEPARTMENT_DURATIONS: Dict[str, int] = {
    "ENGINEERING": 2,
    "SIGNAL_TELECOM": 1,
    "TRACTION_DISTRIBUTION": 3,
}
DEFAULT_DURATION: int = 2

# Objective scaling constants for CP-SAT integer arithmetic
URGENCY_WEIGHT: int = 10000       # Urgency (0.0 to 1.0) scaled up to 10,000
SEVERITY_WEIGHT: int = 500        # Defect severity (1 to 5) -> 500 to 2,500
OVERDUE_WEIGHT: int = 50          # Days overdue bonus per day
EARLY_DAY_WEIGHT: int = 100       # Preference for earlier execution in horizon
COLOCATION_BONUS_WEIGHT: int = 1500  # Bonus per shared co-located department hour

def get_task_duration(department: str) -> int:
    """Returns required consecutive hours for the given department."""
    return DEPARTMENT_DURATIONS.get(department.upper(), DEFAULT_DURATION)

def fetch_scored_tasks_via_api(api_url: str) -> Optional[List[dict]]:
    """Attempt to fetch SCORED maintenance tasks from the FastAPI endpoint."""
    endpoint = f"{api_url.rstrip('/')}/maintenance-tasks/pending/for-optimizer"
    try:
        logger.info(f"Connecting to Backend API: {endpoint}")
        req = urllib.request.Request(endpoint, headers={"Accept": "application/json"})
        with urllib.request.urlopen(req, timeout=5) as response:
            if response.status == 200:
                data = json.loads(response.read().decode("utf-8"))
                logger.info(f"Retrieved {len(data)} SCORED tasks via API.")
                return data
            else:
                logger.warning(f"API returned status {response.status}")
                return None
    except Exception as e:
        logger.warning(f"API unreachable ({e}). Falling back to database...")
        return None

def fetch_scored_tasks_from_db(db: Session) -> List[dict]:
    """Fetch SCORED maintenance tasks with section context directly from PostgreSQL."""
    logger.info("Querying SCORED maintenance tasks from database...")
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
    tasks = [dict(r) for r in rows]
    logger.info(f"Retrieved {len(tasks)} SCORED tasks from database.")
    return tasks

def fetch_section_time_slots(db: Session, section_ids: List[int], start_date: datetime.date, days: int) -> Dict[Tuple[int, datetime.date, int], bool]:
    """
    Fetch section availability time slots.
    Returns mapping: (section_id, slot_date, slot_hour) -> is_free (bool)
    """
    end_date = start_date + datetime.timedelta(days=days)
    logger.info(f"Fetching time slots for {len(section_ids)} sections between {start_date} and {end_date}...")
    
    if not section_ids:
        return {}

    slots_map: Dict[Tuple[int, datetime.date, int], bool] = {}
    
    # Query in batches using SQLAlchemy ORM to ensure cross-database IN clause handling
    batch_size = 500
    for i in range(0, len(section_ids), batch_size):
        batch = section_ids[i:i + batch_size]
        rows = db.query(
            SectionTimeSlot.section_id,
            SectionTimeSlot.slot_date,
            SectionTimeSlot.slot_hour,
            SectionTimeSlot.is_free
        ).filter(
            SectionTimeSlot.section_id.in_(batch),
            SectionTimeSlot.slot_date >= start_date,
            SectionTimeSlot.slot_date < end_date
        ).all()
        
        for r in rows:
            sec_id, s_date, s_hour, is_free = r[0], r[1], int(r[2]), bool(r[3])
            if isinstance(s_date, str):
                s_date = datetime.date.fromisoformat(s_date[:10])
            slots_map[(sec_id, s_date, s_hour)] = is_free
            
    logger.info(f"Loaded {len(slots_map)} total section-hour availability slots.")
    return slots_map

def find_earliest_slot_date(db: Session) -> datetime.date:
    """Find the earliest slot_date available in section_time_slots or fallback to today."""
    row = db.execute(text("SELECT MIN(slot_date) FROM section_time_slots;")).fetchone()
    if row and row[0]:
        val = row[0]
        if isinstance(val, str):
            try:
                return datetime.date.fromisoformat(val[:10])
            except Exception:
                pass
        elif isinstance(val, datetime.date):
            return val
    return datetime.date.today()

class CandidateWindow:
    def __init__(self, task_id: int, section_id: int, department: str, slot_date: datetime.date, start_hour: int, duration: int, day_idx: int):
        self.task_id = task_id
        self.section_id = section_id
        self.department = department
        self.slot_date = slot_date
        self.start_hour = start_hour
        self.end_hour = start_hour + duration
        self.duration = duration
        self.day_idx = day_idx

    @property
    def key(self) -> Tuple[int, datetime.date, int]:
        return (self.task_id, self.slot_date, self.start_hour)

def generate_candidate_windows(
    tasks: List[dict],
    slots_map: Dict[Tuple[int, datetime.date, int], bool],
    start_date: datetime.date,
    days: int
) -> Tuple[List[CandidateWindow], Dict[int, List[CandidateWindow]], Dict[int, str]]:
    """
    Identifies all feasible contiguous free windows for each maintenance task.
    Returns:
      - all_candidates: list of CandidateWindow
      - task_candidates: dict mapping task_id -> list of CandidateWindow
      - infeasible_reasons: dict mapping task_id -> reason why 0 candidate windows exist
    """
    all_candidates: List[CandidateWindow] = []
    task_candidates: Dict[int, List[CandidateWindow]] = defaultdict(list)
    infeasible_reasons: Dict[int, str] = {}
    
    dates = [start_date + datetime.timedelta(days=d) for d in range(days)]

    for task in tasks:
        t_id = task["task_id"]
        sec_id = task["section_id"]
        dept = task["department"]
        duration = get_task_duration(dept)
        
        has_any_slots = False
        valid_windows_for_task = []
        
        for day_idx, s_date in enumerate(dates):
            for start_h in range(0, 24 - duration + 1):
                # Verify that all consecutive hours in [start_h, start_h + duration) are FREE
                window_free = True
                for h in range(start_h, start_h + duration):
                    slot_key = (sec_id, s_date, h)
                    if slot_key in slots_map:
                        has_any_slots = True
                        if not slots_map[slot_key]:
                            window_free = False
                            break
                    else:
                        window_free = False
                        break
                        
                if window_free:
                    cand = CandidateWindow(
                        task_id=t_id,
                        section_id=sec_id,
                        department=dept,
                        slot_date=s_date,
                        start_hour=start_h,
                        duration=duration,
                        day_idx=day_idx
                    )
                    valid_windows_for_task.append(cand)
                    all_candidates.append(cand)
                    
        if valid_windows_for_task:
            task_candidates[t_id] = valid_windows_for_task
        else:
            if not has_any_slots:
                infeasible_reasons[t_id] = f"No section_time_slots data generated for section {sec_id}"
            else:
                infeasible_reasons[t_id] = f"No contiguous {duration}-hour free window available on section {sec_id} in {days}-day horizon"

    return all_candidates, task_candidates, infeasible_reasons

def build_and_solve_cpsat_model(
    tasks: List[dict],
    all_candidates: List[CandidateWindow],
    task_candidates: Dict[int, List[CandidateWindow]],
    days: int,
    max_section_capacity: int = 2,
    time_limit_sec: int = 60
):
    """
    Builds and solves the Google OR-Tools CP-SAT model.
    """
    logger.info("Initializing Google OR-Tools CP-SAT model...")
    model = cp_model.CpModel()
    
    # Task metadata lookup
    task_map = {t["task_id"]: t for t in tasks}

    # 1. DECISION VARIABLES: x[cand.key] = 1 if task is scheduled at this candidate window
    x_vars = {}
    for cand in all_candidates:
        var_name = f"x_t{cand.task_id}_{cand.slot_date}_h{cand.start_hour}"
        x_vars[cand.key] = model.NewBoolVar(var_name)

    # 2. CONSTRAINT: At most one schedule window per task
    for t_id, cands in task_candidates.items():
        model.Add(sum(x_vars[c.key] for c in cands) <= 1)

    # 3. SECTION CAPACITY & NON-CONFLICT CONSTRAINTS
    # For each section, date, and hour: aggregate all tasks whose active interval spans that hour
    # slot_occupancy: (sec_id, slot_date, hour) -> list of (cand, x_var)
    slot_occupancy = defaultdict(list)
    # dept_slot_occupancy: (sec_id, slot_date, hour, dept) -> list of (cand, x_var)
    dept_slot_occupancy = defaultdict(list)

    for cand in all_candidates:
        x_var = x_vars[cand.key]
        for h in range(cand.start_hour, cand.end_hour):
            slot_key = (cand.section_id, cand.slot_date, h)
            slot_occupancy[slot_key].append((cand, x_var))
            dept_slot_occupancy[(cand.section_id, cand.slot_date, h, cand.department)].append((cand, x_var))

    # A. Physical Section Capacity Constraint (total active maintenance teams <= max_section_capacity)
    for slot_key, items in slot_occupancy.items():
        if len(items) > max_section_capacity:
            model.Add(sum(var for _, var in items) <= max_section_capacity)

    # B. Department Non-Conflict Constraint (at most 1 task per department per section-hour)
    for dept_key, items in dept_slot_occupancy.items():
        if len(items) > 1:
            model.Add(sum(var for _, var in items) <= 1)

    # 4. CO-LOCATION SYNERGY MODELING
    # Co-location bonus is awarded when 2+ distinct departments share possession of a section in the same hour
    coloc_vars = []
    for slot_key, items in slot_occupancy.items():
        # Get unique departments that have candidate windows in this slot
        depts_in_slot = list({cand.department for cand, _ in items})
        if len(depts_in_slot) >= 2:
            # We introduce a co-location boolean indicator for this section-date-hour
            coloc_var = model.NewBoolVar(f"coloc_s{slot_key[0]}_{slot_key[1]}_h{slot_key[2]}")
            
            # dept_active[d] = sum of vars for department d
            dept_active_sums = []
            for d in depts_in_slot:
                d_vars = [var for cand, var in items if cand.department == d]
                dept_active_sums.append(sum(d_vars))
                
            # coloc_var <= 1 only if at least 2 distinct departments are scheduled
            # Constraint: 2 * coloc_var <= sum(dept_active_sums)
            model.Add(2 * coloc_var <= sum(dept_active_sums))
            coloc_vars.append(coloc_var)

    # 5. MULTI-CRITERIA OBJECTIVE FUNCTION
    objective_terms = []
    
    for cand in all_candidates:
        t = task_map[cand.task_id]
        urgency = float(t.get("urgency_score") or 0.5)
        severity = int(t.get("defect_severity") or 3)
        days_overdue = int(t.get("days_overdue") or 0)
        
        # Linear score calculation
        urgency_component = int(urgency * URGENCY_WEIGHT)
        severity_component = severity * SEVERITY_WEIGHT
        overdue_component = min(days_overdue, 30) * OVERDUE_WEIGHT
        early_day_component = (days - cand.day_idx) * EARLY_DAY_WEIGHT
        
        task_weight = urgency_component + severity_component + overdue_component + early_day_component
        objective_terms.append(x_vars[cand.key] * task_weight)
        
    for coloc_var in coloc_vars:
        objective_terms.append(coloc_var * COLOCATION_BONUS_WEIGHT)
        
    model.Maximize(sum(objective_terms))

    # 6. SOLVER EXECUTION
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = float(time_limit_sec)
    solver.parameters.num_search_workers = 4
    solver.parameters.log_search_progress = False

    logger.info(f"Solving CP-SAT model ({len(all_candidates)} candidate variables, time limit = {time_limit_sec}s)...")
    status = solver.Solve(model)
    
    status_name = solver.StatusName(status)
    logger.info(f"CP-SAT Solver Finished. Status: {status_name}, Objective Value: {solver.ObjectiveValue() if status in (cp_model.OPTIMAL, cp_model.FEASIBLE) else 'N/A'}")

    # 7. EXTRACT RESULTS
    scheduled_blocks = []
    scheduled_task_ids = set()
    
    if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        for cand in all_candidates:
            if solver.Value(x_vars[cand.key]) == 1:
                scheduled_blocks.append({
                    "task_id": cand.task_id,
                    "section_id": cand.section_id,
                    "department": cand.department,
                    "slot_date": cand.slot_date,
                    "start_hour": cand.start_hour,
                    "end_hour": cand.end_hour,
                    "duration": cand.duration,
                    "day_idx": cand.day_idx
                })
                scheduled_task_ids.add(cand.task_id)

    return status, status_name, scheduled_blocks, scheduled_task_ids

def post_blocks_via_api(api_url: str, blocks: List[dict], horizon: str) -> Optional[dict]:
    """Post scheduled blocks to backend POST /block-schedule."""
    endpoint = f"{api_url.rstrip('/')}/block-schedule"
    payload = [
        {
            "task_id": b["task_id"],
            "section_id": b["section_id"],
            "slot_date": b["slot_date"].isoformat() if isinstance(b["slot_date"], datetime.date) else str(b["slot_date"]),
            "start_hour": b["start_hour"],
            "end_hour": b["end_hour"],
            "horizon": horizon,
            "approved_by_control_office": False
        }
        for b in blocks
    ]
    try:
        logger.info(f"Posting {len(payload)} block schedules to API: {endpoint}")
        data_bytes = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            endpoint,
            data=data_bytes,
            headers={"Content-Type": "application/json", "Accept": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=30) as response:
            if response.status == 200:
                data = json.loads(response.read().decode("utf-8"))
                logger.info(f"API successfully created {len(data.get('created', []))} blocks. Skipped: {len(data.get('skipped', []))}")
                return data
            else:
                logger.error(f"API returned status {response.status}")
                return None
    except Exception as e:
        logger.error(f"Failed to post blocks to API: {e}")
        return None

def save_blocks_to_db(db: Session, blocks: List[dict], horizon: str) -> Tuple[List[int], List[dict]]:
    """Direct database fallback to persist block_schedule and transition task status to 'SCHEDULED'."""
    logger.info(f"Persisting {len(blocks)} scheduled maintenance blocks directly to database...")
    created_ids = []
    skipped_items = []
    
    task_ids = [b["task_id"] for b in blocks]
    tasks_db = db.query(MaintenanceTask).filter(MaintenanceTask.task_id.in_(task_ids)).all()
    tasks_map = {t.task_id: t for t in tasks_db}
    
    for b in blocks:
        t_id = b["task_id"]
        if t_id not in tasks_map:
            skipped_items.append({"task_id": t_id, "reason": "Task not found in DB"})
            continue
            
        task_obj = tasks_map[t_id]
        if task_obj.status != 'SCORED':
            skipped_items.append({"task_id": t_id, "reason": f"Status is {task_obj.status}, expected SCORED"})
            continue
            
        block = BlockSchedule(
            task_id=t_id,
            section_id=b["section_id"],
            slot_date=b["slot_date"],
            start_hour=b["start_hour"],
            end_hour=b["end_hour"],
            horizon=horizon,
            approved_by_control_office=False
        )
        db.add(block)
        task_obj.status = 'SCHEDULED'
        db.flush()
        created_ids.append(block.block_id)
        
    db.commit()
    logger.info(f"Database transaction committed. Created {len(created_ids)} blocks.")
    return created_ids, skipped_items

def print_summary_report(
    tasks: List[dict],
    scheduled_blocks: List[dict],
    scheduled_task_ids: set,
    infeasible_reasons: Dict[int, str],
    horizon: str,
    start_date: datetime.date,
    days: int,
    status_name: str
):
    """Outputs a comprehensive ASCII report detailing optimizer performance."""
    total_tasks = len(tasks)
    num_scheduled = len(scheduled_blocks)
    num_unscheduled = total_tasks - num_scheduled
    sched_pct = (num_scheduled / total_tasks * 100) if total_tasks > 0 else 0.0
    
    task_map = {t["task_id"]: t for t in tasks}
    
    # Calculate Co-location Metrics
    # Group by (section_id, slot_date, start_hour)
    window_groups = defaultdict(list)
    for b in scheduled_blocks:
        window_groups[(b["section_id"], b["slot_date"], b["start_hour"])].append(b)
        
    colocated_groups = [g for g in window_groups.values() if len({item["department"] for item in g}) > 1]
    colocated_tasks_count = sum(len(g) for g in colocated_groups)
    
    total_urgency_scheduled = sum(float(task_map[b["task_id"]].get("urgency_score") or 0.0) for b in scheduled_blocks)
    total_urgency_available = sum(float(t.get("urgency_score") or 0.0) for t in tasks)
    urgency_capture_pct = (total_urgency_scheduled / total_urgency_available * 100) if total_urgency_available > 0 else 0.0

    print("\n" + "="*80)
    print("           TEJAS CP-SAT MAINTENANCE BLOCK OPTIMIZER REPORT")
    print("="*80)
    print(f"  Solver Status:             {status_name}")
    print(f"  Schedule Horizon:          {horizon} ({days} days: {start_date} to {start_date + datetime.timedelta(days=days-1)})")
    print(f"  Total SCORED Tasks:        {total_tasks}")
    print(f"  Tasks Scheduled:           {num_scheduled} ({sched_pct:.1f}%)")
    print(f"  Tasks Unscheduled:         {num_unscheduled} ({100 - sched_pct:.1f}%)")
    print(f"  Total Urgency Captured:    {total_urgency_scheduled:.2f} / {total_urgency_available:.2f} ({urgency_capture_pct:.1f}%)")
    print(f"  Co-located Blocks:         {len(colocated_groups)} windows ({colocated_tasks_count} coordinated tasks)")
    print("="*80)

    # Department breakdown
    dept_stats = defaultdict(lambda: {"total": 0, "scheduled": 0})
    for t in tasks:
        dept_stats[t["department"]]["total"] += 1
    for b in scheduled_blocks:
        dept_stats[b["department"]]["scheduled"] += 1

    print("\n[Department Schedule Breakdown]")
    print(f"{'Department':<26} {'Required Duration':<20} {'Total':<10} {'Scheduled':<12} {'Rate':<10}")
    print("-" * 78)
    for dept, stats in sorted(dept_stats.items()):
        dur = f"{get_task_duration(dept)} hours"
        rate = (stats["scheduled"] / stats["total"] * 100) if stats["total"] > 0 else 0.0
        print(f"{dept:<26} {dur:<20} {stats['total']:<10} {stats['scheduled']:<12} {rate:.1f}%")

    # Sample scheduled blocks table
    if scheduled_blocks:
        print("\n[Sample Recommended Maintenance Blocks (First 10)]")
        print(f"{'Task ID':<10} {'Dept':<22} {'Section':<10} {'Date':<12} {'Window':<15} {'Urgency':<10}")
        print("-" * 78)
        for b in sorted(scheduled_blocks, key=lambda x: (x["slot_date"], x["start_hour"]))[:10]:
            t = task_map[b["task_id"]]
            urg = f"{float(t.get('urgency_score') or 0.0):.2f}"
            win = f"{b['start_hour']:02d}:00-{b['end_hour']:02d}:00"
            sec_code = t.get("section_code") or f"Sec-{b['section_id']}"
            print(f"{b['task_id']:<10} {b['department']:<22} {sec_code:<10} {str(b['slot_date']):<12} {win:<15} {urg:<10}")

    # Unscheduled tasks diagnostic
    unscheduled = [t for t in tasks if t["task_id"] not in scheduled_task_ids]
    if unscheduled:
        print(f"\n[Unscheduled Tasks Diagnostic (Top 5 Highest Urgency)]")
        print(f"{'Task ID':<10} {'Dept':<22} {'Urgency':<10} {'Severity':<10} {'Diagnostic Bottleneck Reason'}")
        print("-" * 80)
        for t in sorted(unscheduled, key=lambda x: float(x.get("urgency_score") or 0.0), reverse=True)[:5]:
            t_id = t["task_id"]
            reason = infeasible_reasons.get(t_id, "Capacity contention / competing higher-priority task")
            urg = f"{float(t.get('urgency_score') or 0.0):.2f}"
            sev = f"{t.get('defect_severity')}"
            print(f"{t_id:<10} {t['department']:<22} {urg:<10} {sev:<10} {reason}")
    print("="*80 + "\n")

def main():
    parser = argparse.ArgumentParser(description="TEJAS CP-SAT Constraint Optimization Engine for Maintenance Blocks.")
    parser.add_argument("--horizon", type=str, default="MONTHLY", choices=["WEEKLY", "MONTHLY"], help="Schedule horizon ('WEEKLY' = 7d, 'MONTHLY' = 30d).")
    parser.add_argument("--start-date", type=str, default=None, help="Start date (YYYY-MM-DD). Defaults to earliest slot date in DB or today.")
    parser.add_argument("--days", type=int, default=None, help="Custom horizon length in days (overrides default 7/30).")
    parser.add_argument("--backend-url", type=str, default="http://localhost:8000", help="FastAPI backend URL. If unreachable, direct DB session is used.")
    parser.add_argument("--max-capacity", type=int, default=2, help="Max simultaneous co-located maintenance operations on one section (default: 2).")
    parser.add_argument("--time-limit", type=int, default=60, help="CP-SAT solver timeout in seconds (default: 60).")
    parser.add_argument("--dry-run", action="store_true", help="Run optimization and print report without committing changes to DB or API.")
    args = parser.parse_args()

    # Determine horizon length
    if args.days is not None:
        days = args.days
    else:
        days = 7 if args.horizon == "WEEKLY" else 30

    db = SessionLocal()
    try:
        # Determine start date
        if args.start_date:
            try:
                start_date = datetime.date.fromisoformat(args.start_date)
            except ValueError:
                logger.error(f"Invalid date format: {args.start_date}. Expected YYYY-MM-DD.")
                sys.exit(1)
        else:
            start_date = find_earliest_slot_date(db)

        logger.info(f"Targeting optimization window: {start_date} to {start_date + datetime.timedelta(days=days-1)} ({days} days, Horizon: {args.horizon})")

        # 1. Ingest Scored Tasks
        tasks = None
        if args.backend_url:
            tasks = fetch_scored_tasks_via_api(args.backend_url)
        if not tasks:
            tasks = fetch_scored_tasks_from_db(db)

        if not tasks:
            logger.warning("No SCORED maintenance tasks found in database/API. Optimization finished.")
            return

        # 2. Ingest Section Availability
        unique_section_ids = list({t["section_id"] for t in tasks})
        slots_map = fetch_section_time_slots(db, unique_section_ids, start_date, days)

        # 3. Candidate Windows
        all_candidates, task_candidates, infeasible_reasons = generate_candidate_windows(
            tasks, slots_map, start_date, days
        )
        logger.info(f"Generated {len(all_candidates)} feasible candidate window variables across {len(task_candidates)} tasks.")

        # 4. Build & Solve CP-SAT Model
        status, status_name, scheduled_blocks, scheduled_task_ids = build_and_solve_cpsat_model(
            tasks=tasks,
            all_candidates=all_candidates,
            task_candidates=task_candidates,
            days=days,
            max_section_capacity=args.max_capacity,
            time_limit_sec=args.time_limit
        )

        # 5. Output ASCII Report
        print_summary_report(
            tasks=tasks,
            scheduled_blocks=scheduled_blocks,
            scheduled_task_ids=scheduled_task_ids,
            infeasible_reasons=infeasible_reasons,
            horizon=args.horizon,
            start_date=start_date,
            days=days,
            status_name=status_name
        )

        # 6. Post / Persist Blocks
        if scheduled_blocks:
            if args.dry_run:
                logger.info("--dry-run specified. Skipping API/Database persistence.")
            else:
                api_posted = False
                if args.backend_url:
                    res = post_blocks_via_api(args.backend_url, scheduled_blocks, args.horizon)
                    if res is not None:
                        api_posted = True
                
                if not api_posted:
                    logger.info("Writing blocks directly to PostgreSQL...")
                    save_blocks_to_db(db, scheduled_blocks, args.horizon)
        else:
            logger.warning("No blocks could be scheduled.")

    except Exception as e:
        logger.exception(f"Fatal error during CP-SAT optimization: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    main()
