import os
import sys
import argparse
import logging
import datetime
import pandas as pd
from sqlalchemy import text
from sqlalchemy.orm import Session

# Add backend root to sys.path to import app modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import SessionLocal, engine
from app.models import (
    Station, Train, TrainSchedule, Section,
    SectionTrainMovement, SectionTrafficSummary
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("load_timetable")

COLUMN_MAP = {
    'Train No': 'train_number',
    'Train Name': 'train_name',
    'SEQ': 'stop_sequence',
    'Station Code': 'station_code',
    'Station Name': 'station_name',
    'Arrival time': 'arrival_time',
    'Departure Time': 'departure_time',
    'Distance': 'distance_km',
    'Source Station': 'source_station_code',
    'Source Station Name': 'source_station_name',
    'Destination Station': 'destination_station_code',
    'Destination Station Name': 'destination_station_name',
}

DATA_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "Train_details_22122017.csv")

def parse_time_str(time_str):
    if pd.isna(time_str) or time_str is None:
        return None
    s = str(time_str).strip()
    if not s or s.lower() == 'none' or s.lower() == 'nan':
        return None
    try:
        parts = s.split(':')
        if len(parts) == 3:
            h, m, sec = int(parts[0]), int(parts[1]), int(parts[2])
            return datetime.time(h % 24, m % 60, sec % 60)
        elif len(parts) == 2:
            h, m = int(parts[0]), int(parts[1])
            return datetime.time(h % 24, m % 60, 0)
    except Exception as e:
        logger.warning(f"Failed to parse time string '{time_str}': {e}")
        return None
    return None

def parse_int_safe(val, default=0):
    if pd.isna(val) or val is None:
        return default
    try:
        return int(float(str(val).strip()))
    except Exception:
        return default

def parse_float_safe(val, default=0.0):
    if pd.isna(val) or val is None:
        return default
    try:
        return float(str(val).strip())
    except Exception:
        return default

def normalize_time(val_str, is_first_stop, is_last_stop, is_arrival):
    """
    Normalizes time string into datetime.time or None.
    If val is '00:00:00' and it's expected absent (origin arrival or terminus departure), returns None.
    """
    parsed = parse_time_str(val_str)
    if parsed is None:
        return None
    
    # 00:00:00 at origin arrival or terminus departure is treated as NULL (no arrival/departure)
    if parsed == datetime.time(0, 0, 0):
        if is_arrival and is_first_stop:
            return None
        if not is_arrival and is_last_stop:
            return None
            
    return parsed

def check_existing_data(db: Session, force: bool):
    train_count = db.query(Train).count()
    if train_count > 0:
        if not force:
            logger.error(f"Refusing to run: 'trains' table already contains {train_count} rows. Use --force flag to re-run and reload.")
            sys.exit(1)
        else:
            logger.warning(f"Table 'trains' contains {train_count} rows. --force flag specified. Truncating existing tables...")
            db.execute(text("TRUNCATE block_schedule, maintenance_tasks, section_train_movements, section_time_slots, section_traffic_summary, sections, train_schedule, trains, stations CASCADE;"))
            db.commit()
            logger.info("Database tables truncated successfully.")

def load_timetable_data(db: Session):
    if not os.path.exists(DATA_FILE):
        logger.error(f"Data file not found at {DATA_FILE}")
        sys.exit(1)

    logger.info(f"Reading dataset in chunks from {DATA_FILE}...")
    
    # Pass 1: Accumulate all rows & deduplicate stations & trains
    chunks = pd.read_csv(DATA_FILE, chunksize=50000, dtype=str)
    
    stations_dict = {}  # station_code -> station_name
    trains_dict = {}    # train_number -> (train_name, source_code, dest_code)
    
    all_rows = []
    total_raw_rows = 0
    
    for chunk in chunks:
        chunk = chunk.rename(columns=COLUMN_MAP)
        total_raw_rows += len(chunk)
        logger.info(f"Processing row chunk: {total_raw_rows} rows read...")
        
        for _, row in chunk.iterrows():
            st_code = str(row['station_code']).strip() if pd.notna(row.get('station_code')) else ''
            st_name = str(row['station_name']).strip() if pd.notna(row.get('station_name')) else ''
            if st_code:
                if st_code not in stations_dict or (st_name and len(st_name) > len(stations_dict[st_code])):
                    stations_dict[st_code] = st_name
                    
            src_code = str(row['source_station_code']).strip() if pd.notna(row.get('source_station_code')) else ''
            src_name = str(row['source_station_name']).strip() if pd.notna(row.get('source_station_name')) else ''
            if src_code and src_code not in stations_dict:
                stations_dict[src_code] = src_name
                
            dst_code = str(row['destination_station_code']).strip() if pd.notna(row.get('destination_station_code')) else ''
            dst_name = str(row['destination_station_name']).strip() if pd.notna(row.get('destination_station_name')) else ''
            if dst_code and dst_code not in stations_dict:
                stations_dict[dst_code] = dst_name
                
            tr_num = str(row['train_number']).strip() if pd.notna(row.get('train_number')) else ''
            tr_name = str(row['train_name']).strip() if pd.notna(row.get('train_name')) else ''
            if tr_num and tr_num not in trains_dict:
                trains_dict[tr_num] = (tr_name, src_code, dst_code)
                
            seq_val = parse_int_safe(row.get('stop_sequence'), default=0)
            if seq_val > 0 and tr_num and st_code:
                all_rows.append({
                    'train_number': tr_num,
                    'stop_sequence': seq_val,
                    'station_code': st_code,
                    'arrival_time': row.get('arrival_time'),
                    'departure_time': row.get('departure_time'),
                    'distance_km': parse_float_safe(row.get('distance_km'), default=0.0),
                })

    logger.info(f"Unique stations discovered: {len(stations_dict)}")
    logger.info(f"Unique trains discovered: {len(trains_dict)}")

    # Bulk insert stations
    station_objects = [
        Station(station_code=code, station_name=name)
        for code, name in stations_dict.items()
    ]
    db.bulk_save_objects(station_objects)
    db.commit()
    
    # Query station_code -> station_id mapping
    station_id_map = {
        s.station_code: s.station_id for s in db.query(Station.station_code, Station.station_id).all()
    }
    logger.info("Stations table populated successfully.")

    # Bulk insert trains
    train_objects = [
        Train(
            train_number=tr_num,
            train_name=tr_data[0],
            source_station_id=station_id_map.get(tr_data[1]),
            destination_station_id=station_id_map.get(tr_data[2])
        )
        for tr_num, tr_data in trains_dict.items()
    ]
    db.bulk_save_objects(train_objects)
    db.commit()

    # Query train_number -> train_id mapping
    train_id_map = {
        t.train_number: t.train_id for t in db.query(Train.train_number, Train.train_id).all()
    }
    logger.info("Trains table populated successfully.")

    # Determine max stop_sequence per train
    df_rows = pd.DataFrame(all_rows)
    max_seq_per_train = df_rows.groupby('train_number')['stop_sequence'].max().to_dict()

    # Build train_schedule records
    schedule_objects = []
    for r in all_rows:
        tr_num = r['train_number']
        tr_id = train_id_map.get(tr_num)
        st_id = station_id_map.get(r['station_code'])
        seq = r['stop_sequence']
        max_seq = max_seq_per_train.get(tr_num, seq)
        
        is_first = (seq == 1)
        is_last = (seq == max_seq)
        
        arr_t = normalize_time(r['arrival_time'], is_first_stop=is_first, is_last_stop=is_last, is_arrival=True)
        dep_t = normalize_time(r['departure_time'], is_first_stop=is_first, is_last_stop=is_last, is_arrival=False)
        
        schedule_objects.append(
            TrainSchedule(
                train_id=tr_id,
                station_id=st_id,
                stop_sequence=seq,
                arrival_time=arr_t,
                departure_time=dep_t,
                distance_km=r['distance_km']
            )
        )

    logger.info(f"Inserting {len(schedule_objects)} train_schedule rows in batches...")
    batch_size = 20000
    for i in range(0, len(schedule_objects), batch_size):
        db.bulk_save_objects(schedule_objects[i:i+batch_size])
        db.commit()
    logger.info("train_schedule table populated successfully.")

    return len(stations_dict), len(trains_dict), len(schedule_objects)

def derive_sections(db: Session):
    logger.info("Deriving sections and section_train_movements from train_schedule...")
    
    # Query all schedules ordered by train_id, stop_sequence
    schedules = (
        db.query(
            TrainSchedule.train_id,
            TrainSchedule.station_id,
            TrainSchedule.stop_sequence,
            TrainSchedule.departure_time,
            TrainSchedule.arrival_time
        )
        .order_by(TrainSchedule.train_id, TrainSchedule.stop_sequence)
        .all()
    )
    
    # Group schedules by train_id
    train_stops = {}
    for s in schedules:
        train_stops.setdefault(s.train_id, []).append(s)
        
    sections_map = {}  # (from_station_id, to_station_id) -> section_id
    movements_list = []
    
    # First pass: collect all unique sections
    unique_sections_set = set()
    for tr_id, stops in train_stops.items():
        for i in range(len(stops) - 1):
            from_st = stops[i].station_id
            to_st = stops[i+1].station_id
            if from_st != to_st:
                unique_sections_set.add((from_st, to_st))
                
    logger.info(f"Unique consecutive station sections found: {len(unique_sections_set)}")
    
    # Fetch station codes for section_code formatting
    station_code_map = {
        s.station_id: s.station_code for s in db.query(Station.station_id, Station.station_code).all()
    }
    
    # Insert unique sections
    section_objects = [
        Section(
            from_station_id=from_id,
            to_station_id=to_id,
            section_code=f"{station_code_map.get(from_id, from_id)}_{station_code_map.get(to_id, to_id)}"
        )
        for from_id, to_id in unique_sections_set
    ]
    db.bulk_save_objects(section_objects)
    db.commit()
    
    # Query section_id map
    for sec in db.query(Section.section_id, Section.from_station_id, Section.to_station_id).all():
        sections_map[(sec.from_station_id, sec.to_station_id)] = sec.section_id
        
    # Derive train movements
    for tr_id, stops in train_stops.items():
        for i in range(len(stops) - 1):
            stop_a = stops[i]
            stop_b = stops[i+1]
            from_id = stop_a.station_id
            to_id = stop_b.station_id
            
            sec_id = sections_map.get((from_id, to_id))
            dep_t = stop_a.departure_time
            arr_t = stop_b.arrival_time
            
            # Skip movement if either departure or arrival is NULL
            if sec_id and dep_t is not None and arr_t is not None:
                movements_list.append(
                    SectionTrainMovement(
                        section_id=sec_id,
                        train_id=tr_id,
                        departure_from_station=dep_t,
                        arrival_at_station=arr_t,
                        day_of_week=None
                    )
                )

    logger.info(f"Inserting {len(movements_list)} section_train_movements rows...")
    batch_size = 20000
    for i in range(0, len(movements_list), batch_size):
        db.bulk_save_objects(movements_list[i:i+batch_size])
        db.commit()
        
    logger.info("Sections and section_train_movements populated successfully.")
    return len(unique_sections_set), len(movements_list)

def main():
    parser = argparse.ArgumentParser(description="Load railway timetable CSV dataset into TEJAS database.")
    parser.add_argument("--force", action="store_true", help="Force overwrite/truncate if database already contains data.")
    args = parser.parse_args()

    db = SessionLocal()
    try:
        check_existing_data(db, args.force)
        n_stations, n_trains, n_schedules = load_timetable_data(db)
        n_sections, n_movements = derive_sections(db)
        
        logger.info("\n" + "="*60)
        logger.info("FINAL SUMMARY COUNTS:")
        logger.info(f"  Stations:                {n_stations}")
        logger.info(f"  Trains:                  {n_trains}")
        logger.info(f"  Train Schedule Rows:     {n_schedules}")
        logger.info(f"  Sections:                {n_sections}")
        logger.info(f"  Section Train Movements: {n_movements}")
        logger.info("="*60)
    except Exception as e:
        logger.exception(f"Fatal error during timetable ETL execution: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    main()
