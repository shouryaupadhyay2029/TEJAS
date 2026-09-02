import os
import sys
import random
import logging
import argparse
import datetime
import pandas as pd
from sqlalchemy import text
from sqlalchemy.orm import Session

# Add backend root to sys.path to import app modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import SessionLocal
from app.models import MaintenanceTask, Section, SectionTrafficSummary, Station

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("generate_synthetic_tasks")

# Department-specific defect_type pools
DEFECT_POOLS = {
    'ENGINEERING': [
        "Rail fracture",
        "Rail wear (flange/gauge)",
        "Weld defect",
        "Ballast degradation",
        "Track geometry deviation (twist/alignment)",
        "Fastening/clip failure",
        "Formation/subgrade issue",
    ],
    'SIGNAL_TELECOM': [
        "Signal aspect failure",
        "Point machine malfunction",
        "Track circuit failure",
        "Interlocking fault",
        "Cable/communication fault",
        "Level crossing gate fault",
    ],
    'TRACTION_DISTRIBUTION': [
        "OHE wire wear/breakage",
        "Insulator flashover/damage",
        "Feeder/circuit breaker fault",
        "Pantograph interaction issue",
        "Mast/structure damage",
        "Traction substation fault",
    ],
}

DEPARTMENTS = ['ENGINEERING', 'SIGNAL_TELECOM', 'TRACTION_DISTRIBUTION']
DEPT_WEIGHTS = [0.34, 0.33, 0.33]

SEVERITY_LEVELS = [1, 2, 3, 4, 5]
SEVERITY_WEIGHTS = [0.10, 0.20, 0.35, 0.25, 0.10]

def check_existing_data(db: Session, force: bool):
    task_count = db.query(MaintenanceTask).count()
    if task_count > 0:
        if not force:
            logger.error(f"Refusing to run: 'maintenance_tasks' table already contains {task_count} rows. Use --force flag to re-run and regenerate.")
            sys.exit(1)
        else:
            logger.warning(f"Table 'maintenance_tasks' contains {task_count} rows. --force flag specified. Truncating tasks and schedule tables...")
            db.execute(text("TRUNCATE block_schedule, maintenance_tasks CASCADE;"))
            db.commit()
            logger.info("Maintenance tasks truncated successfully.")

def fetch_section_weights(db: Session):
    logger.info("Fetching section IDs and traffic criticality weights...")
    query = text("""
        SELECT s.section_id, COALESCE(st.criticality_score, 0.0) AS criticality_score
        FROM sections s
        LEFT JOIN section_traffic_summary st ON s.section_id = st.section_id;
    """)
    rows = db.execute(query).fetchall()
    if not rows:
        logger.error("No sections found in database. Please run timetable ETL first.")
        sys.exit(1)
        
    section_ids = [r[0] for r in rows]
    # Add a small epsilon (0.01) to criticality scores so every section has a non-zero probability of defect occurrence
    weights = [float(r[1]) + 0.01 for r in rows]
    
    return section_ids, weights

def generate_tasks(db: Session, count: int, section_ids: list, weights: list):
    logger.info(f"Generating {count} realistic synthetic maintenance task records...")
    
    tasks = []
    now = datetime.datetime.now()
    
    for _ in range(count):
        dept = random.choices(DEPARTMENTS, weights=DEPT_WEIGHTS)[0]
        sec_id = random.choices(section_ids, weights=weights)[0]
        defect = random.choice(DEFECT_POOLS[dept])
        severity = random.choices(SEVERITY_LEVELS, weights=SEVERITY_WEIGHTS)[0]
        
        # Exponential distribution for days_overdue (mean ~15 days), capped at 90
        days_overdue = min(int(random.expovariate(1.0 / 15.0)), 90)
        
        # Calculate realistic reported_at timestamp
        hours_offset = random.randint(0, 23)
        mins_offset = random.randint(0, 59)
        reported_at = now - datetime.timedelta(days=days_overdue, hours=hours_offset, minutes=mins_offset)
        
        tasks.append(
            MaintenanceTask(
                department=dept,
                section_id=sec_id,
                defect_type=defect,
                defect_severity=severity,
                days_overdue=days_overdue,
                reported_at=reported_at,
                urgency_score=None,  # Explicitly NULL until ML computes it
                status='PENDING'
            )
        )
        
    db.bulk_save_objects(tasks)
    db.commit()
    logger.info("Successfully inserted synthetic maintenance tasks into database.")

def print_summary(db: Session, count: int):
    tasks_df = pd.read_sql("""
        SELECT task_id, department, section_id, defect_severity, days_overdue, status
        FROM maintenance_tasks;
    """, con=db.bind)
    
    total = len(tasks_df)
    
    print("\n" + "="*75)
    print("SYNTHETIC MAINTENANCE TASKS GENERATION SUMMARY")
    print("="*75)
    print(f"Total Tasks Generated: {total}")
    
    # Department Breakdown
    dept_counts = tasks_df['department'].value_counts()
    print("\n--- Department Breakdown ---")
    for dept, val in dept_counts.items():
        pct = (val / total) * 100
        print(f"  {dept:<25}: {val:>5} ({pct:>5.1f}%)")
        
    # Severity Breakdown
    sev_counts = tasks_df['defect_severity'].value_counts().sort_index()
    print("\n--- Severity Breakdown (1-5) ---")
    for sev, val in sev_counts.items():
        pct = (val / total) * 100
        print(f"  Severity {sev}: {val:>5} ({pct:>5.1f}%)")
        
    # Days Overdue Stats
    print("\n--- Days Overdue Stats ---")
    print(f"  Min:  {tasks_df['days_overdue'].min()} days")
    print(f"  Max:  {tasks_df['days_overdue'].max()} days")
    print(f"  Mean: {tasks_df['days_overdue'].mean():.2f} days")
    
    # Top 5 Sections by assigned tasks
    top_sections_query = text("""
        SELECT 
            m.section_id,
            sec.section_code,
            sf.station_name AS from_station_name,
            st_to.station_name AS to_station_name,
            COUNT(m.task_id) AS task_count,
            st.criticality_score
        FROM maintenance_tasks m
        JOIN sections sec ON m.section_id = sec.section_id
        JOIN stations sf ON sec.from_station_id = sf.station_id
        JOIN stations st_to ON sec.to_station_id = st_to.station_id
        LEFT JOIN section_traffic_summary st ON m.section_id = st.section_id
        GROUP BY m.section_id, sec.section_code, sf.station_name, st_to.station_name, st.criticality_score
        ORDER BY task_count DESC, st.criticality_score DESC
        LIMIT 5;
    """)
    top_sections = db.execute(top_sections_query).fetchall()
    df_top_sec = pd.DataFrame(top_sections, columns=["section_id", "section_code", "from_station_name", "to_station_name", "task_count", "criticality_score"])
    
    print("\n--- Top 5 Sections by Task Volume (Confirming High-Criticality Weighting) ---")
    print(df_top_sec.to_string(index=False))
    print("="*75 + "\n")

def main():
    parser = argparse.ArgumentParser(description="Generate realistic synthetic maintenance defect records for TEJAS.")
    parser.add_argument("--count", type=int, default=500, help="Number of synthetic defect tasks to generate (default: 500).")
    parser.add_argument("--force", action="store_true", help="Force overwrite/truncate existing maintenance tasks.")
    args = parser.parse_args()

    db = SessionLocal()
    try:
        check_existing_data(db, args.force)
        section_ids, weights = fetch_section_weights(db)
        
        # Check oversampling warning threshold (5x section count)
        num_sections = len(section_ids)
        if args.count > (5 * num_sections):
            logger.warning(f"Requested count ({args.count}) exceeds 5x total available sections ({num_sections}). Sections will experience heavy oversampling.")
            
        generate_tasks(db, args.count, section_ids, weights)
        print_summary(db, args.count)
        
    except Exception as e:
        logger.exception(f"Error generating synthetic tasks: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    main()
