import os
import sys
import logging
import pandas as pd
import numpy as np
from sqlalchemy import text
from sqlalchemy.orm import Session

# Add backend root to sys.path to import app modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import SessionLocal
from app.models import Section, SectionTrainMovement, SectionTrafficSummary, Station

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("compute_section_traffic")

def compute_and_upsert_traffic_summary(db: Session):
    logger.info("Computing section traffic metrics from section_train_movements...")
    
    # Query distinct train count per section
    # Note: Since day_of_week is largely NULL/daily-recurring, daily_train_count represents 
    # distinct trains utilizing this section across the schedule rather than a true per-calendar-day count.
    raw_query = text("""
        SELECT 
            s.section_id,
            COALESCE(COUNT(DISTINCT m.train_id), 0) AS daily_train_count
        FROM sections s
        LEFT JOIN section_train_movements m ON s.section_id = m.section_id
        GROUP BY s.section_id;
    """)
    
    results = db.execute(raw_query).fetchall()
    if not results:
        logger.warning("No sections found in database.")
        return 0, {}, pd.DataFrame()
        
    df = pd.DataFrame(results, columns=["section_id", "daily_train_count"])
    
    max_train_count = df["daily_train_count"].max()
    
    # Compute both Linear (old) and Log-scale (new) scores for comparison
    # Note: Log-scale normalization (v2). Raw daily_train_count distribution is heavily right-skewed 
    # (mean ~6.21, median 3.0, max 199). Linear normalization compresses ~90% of sections into a 
    # near-zero band, giving the ML model almost no signal across most of the network. Log-scale (using log1p) 
    # compresses the long tail and provides meaningful score separation across low/medium-traffic sections 
    # where most maintenance tasks actually occur.
    df["linear_score"] = (df["daily_train_count"] / float(max_train_count)).round(4) if max_train_count > 0 else 0.0
    
    if max_train_count > 0:
        df["criticality_score"] = (np.log1p(df["daily_train_count"]) / np.log1p(max_train_count)).round(4)
    else:
        df["criticality_score"] = 0.0

    logger.info(f"Upserting log-scale traffic metrics for {len(df)} sections into section_traffic_summary...")
    
    # Perform UPSERT into section_traffic_summary
    upsert_query = text("""
        INSERT INTO section_traffic_summary (section_id, daily_train_count, criticality_score, last_computed_at)
        VALUES (:section_id, :daily_train_count, :criticality_score, NOW())
        ON CONFLICT (section_id) DO UPDATE SET
            daily_train_count = EXCLUDED.daily_train_count,
            criticality_score = EXCLUDED.criticality_score,
            last_computed_at = NOW();
    """)
    
    records = df[["section_id", "daily_train_count", "criticality_score"]].to_dict(orient="records")
    batch_size = 5000
    for i in range(0, len(records), batch_size):
        db.execute(upsert_query, records[i:i+batch_size])
        db.commit()
        
    stats = {
        "count": len(df),
        "min": df["daily_train_count"].min(),
        "max": max_train_count,
        "mean": round(df["daily_train_count"].mean(), 2),
        "median": df["daily_train_count"].median(),
    }
    
    return len(df), stats, df

def get_comparison_table(db: Session, df_full: pd.DataFrame, limit: int = 10):
    query = text("""
        SELECT 
            st.section_id,
            sec.section_code,
            sf.station_name AS from_station_name,
            st_to.station_name AS to_station_name,
            st.daily_train_count,
            st.criticality_score AS log_score
        FROM section_traffic_summary st
        JOIN sections sec ON st.section_id = sec.section_id
        JOIN stations sf ON sec.from_station_id = sf.station_id
        JOIN stations st_to ON sec.to_station_id = st_to.station_id
        ORDER BY st.daily_train_count DESC, st.section_id ASC
        LIMIT :limit;
    """)
    
    rows = db.execute(query, {"limit": limit}).fetchall()
    df_top = pd.DataFrame(rows, columns=["section_id", "section_code", "from_station_name", "to_station_name", "daily_train_count", "log_score"])
    
    # Merge linear_score from df_full for side-by-side comparison
    df_merged = df_top.merge(df_full[["section_id", "linear_score"]], on="section_id", how="left")
    
    # Reorder columns: section_id, section_code, from_station_name, to_station_name, daily_train_count, linear_score, log_score
    df_merged = df_merged[["section_id", "section_code", "from_station_name", "to_station_name", "daily_train_count", "linear_score", "log_score"]]
    return df_merged

def print_traffic_scale_benchmarks(max_count: int):
    sample_counts = [1, 3, 10, 25, 50, 100, 199]
    benchmarks = []
    max_log = np.log1p(max_count)
    for c in sample_counts:
        lin = round(c / float(max_count), 4)
        log_val = round(np.log1p(c) / max_log, 4)
        benchmarks.append({"train_count": c, "linear_score": lin, "log_scale_score": log_val})
        
    df_bench = pd.DataFrame(benchmarks)
    return df_bench

def main():
    db = SessionLocal()
    try:
        total_processed, stats, df_full = compute_and_upsert_traffic_summary(db)
        comparison_df = get_comparison_table(db, df_full, limit=10)
        benchmarks_df = print_traffic_scale_benchmarks(stats["max"])
        
        print("\n" + "="*80)
        print("SECTION TRAFFIC COMPUTATION COMPLETE (LOG-SCALE V2)")
        print("="*80)
        print(f"Total Sections Processed: {total_processed}")
        print("\n--- Daily Train Count Distribution Stats ---")
        print(f"  Min:    {stats.get('min')}")
        print(f"  Max:    {stats.get('max')}")
        print(f"  Mean:   {stats.get('mean')}")
        print(f"  Median: {stats.get('median')}")
        
        print("\n--- Linear vs Log-Scale Score Benchmarks Across Traffic Tiers ---")
        print(benchmarks_df.to_string(index=False))
        
        print("\n--- Top 10 Sections Comparison (Linear Score vs Log-Scale Score) ---")
        print(comparison_df.to_string(index=False))
        print("="*80 + "\n")
        
    except Exception as e:
        logger.exception(f"Error computing section traffic: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    main()
