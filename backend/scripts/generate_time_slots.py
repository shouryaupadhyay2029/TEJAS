import os
import sys
import logging
import argparse
import datetime
import pandas as pd
import numpy as np
from sqlalchemy import text
from sqlalchemy.orm import Session

# Add backend root to sys.path to import app modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import SessionLocal, engine
from app.models import Section, SectionTrainMovement, SectionTimeSlot

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("generate_time_slots")

def parse_time_obj(t):
    if isinstance(t, str):
        try:
            parts = [int(p) for p in t.split(':')]
            return datetime.time(parts[0], parts[1], parts[2] if len(parts) > 2 else 0)
        except Exception:
            return datetime.time(0, 0, 0)
    return t

def movement_overlaps_hour(dep_time, arr_time, slot_hour: int, buffer_minutes: int) -> bool:
    dep_time = parse_time_obj(dep_time)
    arr_time = parse_time_obj(arr_time)
    if not dep_time or not arr_time:
        return False

    buf_sec = buffer_minutes * 60
    dep_sec = dep_time.hour * 3600 + dep_time.minute * 60 + dep_time.second
    arr_sec = arr_time.hour * 3600 + arr_time.minute * 60 + arr_time.second
    
    # Handle overnight movements crossing midnight
    if arr_sec < dep_sec:
        arr_sec += 86400
        
    start_sec = dep_sec - buf_sec
    end_sec = arr_sec + buf_sec
    
    slot_start = slot_hour * 3600
    slot_end = (slot_hour + 1) * 3600
    
    # Check primary interval overlap
    if max(start_sec, slot_start) < min(end_sec, slot_end):
        return True
        
    # Check wrapped interval if start_sec < 0
    if start_sec < 0:
        if max(start_sec + 86400, slot_start) < min(end_sec + 86400, slot_end):
            return True
            
    # Check wrapped interval if end_sec > 86400
    if end_sec > 86400:
        if max(start_sec - 86400, slot_start) < min(end_sec - 86400, slot_end):
            return True
            
    return False

def compute_daily_slot_templates(db: Session, buffer_minutes: int):
    logger.info("Fetching section train movements...")
    query = text("""
        SELECT section_id, departure_from_station, arrival_at_station
        FROM section_train_movements;
    """)
    movements_rows = db.execute(query).fetchall()
    
    # Group movements by section_id
    section_movements = {}
    for sec_id, dep_t, arr_t in movements_rows:
        if dep_t is not None and arr_t is not None:
            section_movements.setdefault(sec_id, []).append((dep_t, arr_t))
            
    logger.info("Fetching total sections list...")
    all_sections = [s[0] for s in db.execute(text("SELECT section_id FROM sections;")).fetchall()]
    
    logger.info(f"Pre-computing 24-hour daily slot templates for {len(all_sections)} sections...")
    
    # section_id -> list of 24 dicts: {hour: 0..23, is_free: bool, count: int}
    templates = {}
    
    for sec_id in all_sections:
        movs = section_movements.get(sec_id, [])
        sec_template = []
        
        for h in range(24):
            if not movs:
                sec_template.append((h, True, 0))
            else:
                count = sum(1 for dep_t, arr_t in movs if movement_overlaps_hour(dep_t, arr_t, h, buffer_minutes))
                sec_template.append((h, count == 0, count))
                
        templates[sec_id] = sec_template
        
    return templates, len(all_sections)

def execute_dry_run(templates: dict, num_sections: int, days: int):
    total_free = 0
    total_busy = 0
    
    for sec_id, hours_data in templates.items():
        for h, is_free, count in hours_data:
            if is_free:
                total_free += 1
            else:
                total_busy += 1
                
    total_daily_slots = total_free + total_busy
    total_slots = total_daily_slots * days
    
    pct_free = (total_free / total_daily_slots) * 100
    pct_busy = (total_busy / total_daily_slots) * 100
    
    print("\n" + "="*70)
    print("DRY-RUN TIME SLOTS GENERATION STATS")
    print("="*70)
    print(f"Total Sections:             {num_sections}")
    print(f"Days Range:                 {days} days")
    print(f"Slots Per Section/Day:      24 hours")
    print(f"Total Slot Records (30d):   {total_slots:,}")
    print(f"\n--- Slot Availability Distribution ---")
    print(f"  FREE Slots:               {total_free * days:,} ({pct_free:.2f}%)")
    print(f"  BUSY Slots:               {total_busy * days:,} ({pct_busy:.2f}%)")
    print("="*70 + "\n")
    
    return pct_free, pct_busy

import io

def generate_and_insert_slots(db: Session, templates: dict, start_date: datetime.date, days: int):
    dates = [start_date + datetime.timedelta(days=d) for d in range(days)]
    min_date = dates[0]
    max_date = dates[-1]
    
    logger.info(f"Clearing existing section_time_slots from {min_date} to {max_date}...")
    db.execute(
        text("DELETE FROM section_time_slots WHERE slot_date >= :min_date AND slot_date <= :max_date;"),
        {"min_date": min_date, "max_date": max_date}
    )
    db.commit()
    
    logger.info("Streaming time slot batches into database...")
    insert_sql = text("""
        INSERT INTO section_time_slots (section_id, slot_date, slot_hour, is_free, train_count_in_slot)
        VALUES (:section_id, :slot_date, :slot_hour, :is_free, :train_count_in_slot)
    """)
    
    batch = []
    total_inserted = 0
    batch_size = 50000
    
    for d in dates:
        for sec_id, hours_data in templates.items():
            for h, is_free, cnt in hours_data:
                batch.append({
                    "section_id": sec_id,
                    "slot_date": d,
                    "slot_hour": h,
                    "is_free": is_free,
                    "train_count_in_slot": cnt
                })
                if len(batch) >= batch_size:
                    db.execute(insert_sql, batch)
                    db.commit()
                    total_inserted += len(batch)
                    logger.info(f"Inserted {total_inserted:,} time slot records...")
                    batch = []
                    
    if batch:
        db.execute(insert_sql, batch)
        db.commit()
        total_inserted += len(batch)
        
    logger.info(f"Successfully populated {total_inserted:,} section_time_slots records.")
    return total_inserted

def main():
    parser = argparse.ArgumentParser(description="Generate hourly time slots for section availability in TEJAS.")
    parser.add_argument("--start-date", type=str, default=datetime.date.today().isoformat(), help="Start date (YYYY-MM-DD, default today).")
    parser.add_argument("--days", type=int, default=30, help="Number of days to generate (default 30).")
    parser.add_argument("--buffer-minutes", type=int, default=10, help="Buffer minutes around train movement times (default 10).")
    parser.add_argument("--dry-run", action="store_true", help="Perform dry-run computation and display distribution stats only.")
    args = parser.parse_args()

    try:
        start_date = datetime.date.fromisoformat(args.start_date)
    except ValueError:
        logger.error(f"Invalid date format: {args.start_date}. Expected YYYY-MM-DD.")
        sys.exit(1)

    db = SessionLocal()
    try:
        templates, num_sections = compute_daily_slot_templates(db, args.buffer_minutes)
        pct_free, pct_busy = execute_dry_run(templates, num_sections, args.days)
        
        if args.dry_run:
            logger.info("Dry-run flag specified. Skipping DB insertion.")
            return
            
        if pct_free > 95.0 or pct_busy > 95.0:
            logger.error(f"Availability ratio is extreme (Free: {pct_free:.2f}%, Busy: {pct_busy:.2f}%). Aborting real insert for diagnostic review.")
            sys.exit(1)
            
        inserted_count = generate_and_insert_slots(db, templates, start_date, args.days)
        
        print("\n" + "="*70)
        print("TIME SLOTS GENERATION COMPLETE")
        print("="*70)
        print(f"Total Slots Inserted: {inserted_count:,}")
        print(f"Date Range:           {start_date} to {start_date + datetime.timedelta(days=args.days - 1)}")
        print("="*70 + "\n")
        
    except Exception as e:
        logger.exception(f"Error generating time slots: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    main()
