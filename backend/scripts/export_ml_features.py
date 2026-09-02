import os
import sys
import logging
import pandas as pd
from sqlalchemy import text

# Add backend root to sys.path to import app modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import SessionLocal

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("export_ml_features")

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
TRAFFIC_EXPORT_FILE = os.path.join(DATA_DIR, "export_section_traffic_for_ml.csv")
TASKS_EXPORT_FILE = os.path.join(DATA_DIR, "export_maintenance_tasks_for_ml.csv")

def export_section_traffic_features():
    logger.info("Querying section traffic summary features for ML export...")
    
    db = SessionLocal()
    try:
        query = text("""
            SELECT 
                st.section_id,
                sec.section_code,
                sf.station_code AS from_station_code,
                sf.station_name AS from_station_name,
                st_to.station_code AS to_station_code,
                st_to.station_name AS to_station_name,
                st.daily_train_count,
                st.criticality_score,
                st.last_computed_at
            FROM section_traffic_summary st
            JOIN sections sec ON st.section_id = sec.section_id
            JOIN stations sf ON sec.from_station_id = sf.station_id
            JOIN stations st_to ON sec.to_station_id = st_to.station_id
            ORDER BY st.section_id ASC;
        """)
        
        results = db.execute(query).fetchall()
        if not results:
            logger.warning("No traffic summary records found to export.")
            return 0, TRAFFIC_EXPORT_FILE
            
        df = pd.DataFrame(results, columns=[
            "section_id", "section_code", "from_station_code", "from_station_name",
            "to_station_code", "to_station_name", "daily_train_count", "criticality_score", "last_computed_at"
        ])
        
        os.makedirs(DATA_DIR, exist_ok=True)
        df.to_csv(TRAFFIC_EXPORT_FILE, index=False)
        logger.info(f"Exported {len(df)} section traffic rows to {TRAFFIC_EXPORT_FILE}")
        return len(df), TRAFFIC_EXPORT_FILE
        
    except Exception as e:
        logger.exception(f"Error exporting traffic ML features: {e}")
        sys.exit(1)
    finally:
        db.close()

def export_maintenance_tasks_features():
    logger.info("Querying maintenance tasks with section context for ML export...")
    
    db = SessionLocal()
    try:
        query = text("""
            SELECT 
                m.task_id,
                m.department,
                m.section_id,
                sec.section_code,
                sf.station_code AS from_station_code,
                sf.station_name AS from_station_name,
                st_to.station_code AS to_station_code,
                st_to.station_name AS to_station_name,
                m.defect_type,
                m.defect_severity,
                m.days_overdue,
                m.reported_at,
                m.urgency_score,
                m.status,
                COALESCE(st.criticality_score, 0.0) AS section_criticality_score
            FROM maintenance_tasks m
            JOIN sections sec ON m.section_id = sec.section_id
            JOIN stations sf ON sec.from_station_id = sf.station_id
            JOIN stations st_to ON sec.to_station_id = st_to.station_id
            LEFT JOIN section_traffic_summary st ON m.section_id = st.section_id
            ORDER BY m.task_id ASC;
        """)
        
        results = db.execute(query).fetchall()
        if not results:
            logger.warning("No maintenance tasks found to export.")
            return 0, TASKS_EXPORT_FILE
            
        df = pd.DataFrame(results, columns=[
            "task_id", "department", "section_id", "section_code",
            "from_station_code", "from_station_name", "to_station_code", "to_station_name",
            "defect_type", "defect_severity", "days_overdue", "reported_at",
            "urgency_score", "status", "section_criticality_score"
        ])
        
        os.makedirs(DATA_DIR, exist_ok=True)
        df.to_csv(TASKS_EXPORT_FILE, index=False)
        logger.info(f"Exported {len(df)} maintenance task rows to {TASKS_EXPORT_FILE}")
        return len(df), TASKS_EXPORT_FILE
        
    except Exception as e:
        logger.exception(f"Error exporting maintenance tasks ML features: {e}")
        sys.exit(1)
    finally:
        db.close()

def main():
    traffic_rows, traffic_path = export_section_traffic_features()
    tasks_rows, tasks_path = export_maintenance_tasks_features()
    
    print("\n" + "="*75)
    print("ML FEATURE EXPORT SUMMARY")
    print("="*75)
    print(f"1. Section Traffic Dataset:")
    print(f"   - Total Rows:    {traffic_rows}")
    print(f"   - Output Path:   {os.path.abspath(traffic_path)}")
    print(f"\n2. Maintenance Tasks Dataset (Training Row Shape):")
    print(f"   - Total Rows:    {tasks_rows}")
    print(f"   - Output Path:   {os.path.abspath(tasks_path)}")
    print("="*75 + "\n")

if __name__ == "__main__":
    main()
