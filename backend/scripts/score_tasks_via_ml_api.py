import os
import sys
import time
import logging
import argparse
import requests
import numpy as np
import pandas as pd
from sqlalchemy import text
from sqlalchemy.orm import Session

# Add backend root to sys.path to import app modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import SessionLocal
from app.models import MaintenanceTask, Section, SectionTrafficSummary

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("score_tasks_via_ml_api")

# SEVERITY MAPPING (numeric 1-5 -> label string)
SEVERITY_MAP = {
    1: "LOW",
    2: "LOW",
    3: "MEDIUM",
    4: "HIGH",
    5: "CRITICAL"
}

def fetch_pending_tasks_with_context(db: Session):
    """
    Query DB for all maintenance tasks with status = 'PENDING',
    joined with section & section_traffic_summary for criticality_score & daily_train_count.
    """
    logger.info("Step 1: Fetching source PENDING tasks with section traffic context from database...")
    query = text("""
        SELECT 
            m.task_id,
            m.department,
            m.section_id,
            m.defect_type,
            m.defect_severity,
            m.days_overdue,
            m.status,
            COALESCE(st.criticality_score, 0.0) AS criticality_score,
            COALESCE(st.daily_train_count, 0) AS daily_train_count
        FROM maintenance_tasks m
        JOIN sections sec ON m.section_id = sec.section_id
        LEFT JOIN section_traffic_summary st ON m.section_id = st.section_id
        WHERE m.status = 'PENDING'
        ORDER BY m.task_id ASC;
    """)
    
    rows = db.execute(query).mappings().all()
    logger.info(f"Retrieved {len(rows)} PENDING maintenance tasks for scoring.")
    return rows

def build_task_ml_payload(row):
    """
    Map DB row to ML teammate's MaintenanceTaskInput schema format:
    {
      "task_id": str(task.task_id),
      "defect_severity_label": SEVERITY_MAP[task.defect_severity],
      "days_overdue": task.days_overdue,
      "trains_per_day": section.daily_train_count,
      "asset_criticality_score": section.criticality_score * 100,
      "failures_last_365d": 0.0,
      "is_real_traffic_data": true
    }
    """
    severity_num = int(row["defect_severity"])
    severity_label = SEVERITY_MAP.get(severity_num, "MEDIUM")
    
    # Rescale criticality score (0.0 - 1.0) to (0.0 - 100.0) for ML model input
    criticality = float(row["criticality_score"]) * 100.0
    
    return {
        "task_id": str(row["task_id"]),
        "defect_severity_label": severity_label,
        "days_overdue": int(row["days_overdue"]),
        "trains_per_day": int(row["daily_train_count"]),
        "asset_criticality_score": round(criticality, 2),
        "failures_last_365d": 0.0,
        "is_real_traffic_data": True
    }

def check_ml_host_available(ml_api_url: str) -> tuple[bool, str]:
    """
    Fast pre-flight check to verify if the ML API host & port are reachable.
    """
    from urllib.parse import urlparse
    import socket

    try:
        parsed = urlparse(ml_api_url)
        host = parsed.hostname or "localhost"
        port = parsed.port or (443 if parsed.scheme == "https" else 80)
        
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(1.5)
        result = sock.connect_ex((host, port))
        sock.close()
        
        if result == 0:
            return True, "Reachable"
        else:
            return False, f"Port {port} on {host} is not open (connect_ex code {result})"
    except Exception as e:
        return False, str(e)

def score_task_via_api(ml_api_url: str, payload: dict, retries: int = 2, delay: float = 0.05):
    """
    POST task payload to ML teammate's /predict endpoint.
    Handles single task or batch response structures cleanly.
    """
    clean_url = ml_api_url.rstrip('/')
    if clean_url.endswith('/predict'):
        endpoint = clean_url
    else:
        endpoint = f"{clean_url}/predict"
    
    for attempt in range(retries + 1):
        try:
            resp = requests.post(endpoint, json=payload, timeout=(1.0, 2.0))
            if resp.status_code == 200:
                data = resp.json()
                # Handle possible response schemas:
                # 1) {"task_id": "1", "urgency_score": 85.5}
                # 2) {"urgency_score": 85.5}
                # 3) {"priority_score": 85.5}
                score = None
                if "urgency_score" in data:
                    score = float(data["urgency_score"])
                elif "priority_score" in data:
                    score = float(data["priority_score"])
                elif "score" in data:
                    score = float(data["score"])
                elif isinstance(data, (int, float)):
                    score = float(data)
                
                if score is not None:
                    return score, None
                else:
                    return None, f"Response JSON missing 'urgency_score' key: {data}"
            else:
                err_msg = f"HTTP {resp.status_code}: {resp.text}"
        except Exception as e:
            err_msg = str(e)
            
        if attempt < retries:
            time.sleep(delay * (attempt + 1))
            
    return None, err_msg

def rescale_score_to_0_1(raw_score: float) -> float:
    """
    Divide urgency_score by 100 if > 1.0 to match DB's 0.0-1.0 convention.
    """
    if raw_score > 1.0:
        rescaled = raw_score / 100.0
    else:
        rescaled = raw_score
        
    return round(max(0.0, min(1.0, rescaled)), 4)

def print_dry_run_analysis(scored_items: list, failed_tasks: list):
    """
    Print detailed summary of scored distribution during --dry-run.
    """
    scores = [item["urgency_score"] for item in scored_items]
    total_scored = len(scores)
    total_failed = len(failed_tasks)
    
    print("\n" + "="*80)
    print("DRY-RUN ANALYSIS SUMMARY (ML TASK URGENCY SCORING)")
    print("="*80)
    print(f"Total Tasks Attempted: {total_scored + total_failed}")
    print(f"Successfully Scored:   {total_scored}")
    print(f"Failed to Score:       {total_failed}")
    
    if total_scored == 0:
        print("\n[WARNING] No tasks were successfully scored.")
        print("="*80 + "\n")
        return
        
    min_score = min(scores)
    max_score = max(scores)
    mean_score = round(float(np.mean(scores)), 4)
    median_score = round(float(np.median(scores)), 4)
    
    print("\n--- Urgency Score Distribution Stats (Post-Rescale 0.0 to 1.0) ---")
    print(f"  Min Score:    {min_score:.4f}")
    print(f"  Max Score:    {max_score:.4f}")
    print(f"  Mean Score:   {mean_score:.4f}")
    print(f"  Median Score: {median_score:.4f}")
    
    # Compute distribution buckets
    b1 = sum(1 for s in scores if 0.0 <= s < 0.25)
    b2 = sum(1 for s in scores if 0.25 <= s < 0.50)
    b3 = sum(1 for s in scores if 0.50 <= s < 0.75)
    b4 = sum(1 for s in scores if 0.75 <= s <= 1.00)
    
    p1 = (b1 / total_scored) * 100
    p2 = (b2 / total_scored) * 100
    p3 = (b3 / total_scored) * 100
    p4 = (b4 / total_scored) * 100
    
    print("\n--- Bucket Distribution ---")
    print(f"  [0.00 - 0.25] (Low):      {b1:5d} tasks ({p1:5.1f}%)")
    print(f"  [0.25 - 0.50] (Medium):   {b2:5d} tasks ({p2:5.1f}%)")
    print(f"  [0.50 - 0.75] (High):     {b3:5d} tasks ({p3:5.1f}%)")
    print(f"  [0.75 - 1.00] (Critical): {b4:5d} tasks ({p4:5.1f}%)")
    
    # Check for anomaly / flat distribution
    max_pct = max(p1, p2, p3, p4)
    if max_pct >= 85.0:
        print("\n[WARNING] Distribution appears heavily clustered in a single bucket (>85%). Check ML model feature scaling.")
    elif min_score == max_score:
        print("\n[WARNING] All scored tasks received identical scores. Verify ML model weights.")
    else:
        print("\n[OK] Distribution shows healthy spread across urgency tiers.")
        
    if failed_tasks:
        print("\n--- Failed Tasks Summary ---")
        for ft in failed_tasks[:10]:
            print(f"  Task ID {ft['task_id']}: {ft['error']}")
        if len(failed_tasks) > 10:
            print(f"  ... and {len(failed_tasks) - 10} more failed tasks.")
            
    print("="*80 + "\n")

def push_scores_to_backend(backend_url: str, scored_items: list, batch_size: int = 50):
    """
    Call PATCH /maintenance-tasks/urgency-score in batches to update DB status to 'SCORED'.
    """
    patch_endpoint = f"{backend_url.rstrip('/')}/maintenance-tasks/urgency-score"
    logger.info(f"Step 6: Pushing {len(scored_items)} scored tasks to backend PATCH endpoint: {patch_endpoint}")
    
    total_updated = 0
    total_skipped = 0
    total_not_found = 0
    
    for i in range(0, len(scored_items), batch_size):
        batch = scored_items[i : i + batch_size]
        payload = batch  # List[{"task_id": int, "urgency_score": float}]
        
        try:
            resp = requests.patch(patch_endpoint, json=payload, timeout=10.0)
            if resp.status_code == 200:
                data = resp.json()
                updated_count = len(data.get("updated", []))
                skipped_count = len(data.get("skipped", []))
                not_found_count = len(data.get("not_found", []))
                
                total_updated += updated_count
                total_skipped += skipped_count
                total_not_found += not_found_count
                
                logger.info(
                    f"Batch {i//batch_size + 1}/{(len(scored_items)-1)//batch_size + 1}: "
                    f"Updated={updated_count}, Skipped={skipped_count}, NotFound={not_found_count}"
                )
            else:
                logger.error(f"Batch {i//batch_size + 1} failed with HTTP {resp.status_code}: {resp.text}")
        except Exception as e:
            logger.exception(f"Error calling PATCH endpoint for batch {i//batch_size + 1}: {e}")
            
    print("\n" + "="*80)
    print("REAL RUN EXECUTION COMPLETE")
    print("="*80)
    print(f"Total Tasks Updated to 'SCORED': {total_updated}")
    print(f"Total Tasks Skipped:             {total_skipped}")
    print(f"Total Tasks Not Found:           {total_not_found}")
    print("="*80 + "\n")

def verify_optimizer_endpoint(backend_url: str):
    """
    Re-query GET /maintenance-tasks/pending/for-optimizer to confirm scored tasks are ready.
    """
    logger.info("Step 7: Verifying GET /maintenance-tasks/pending/for-optimizer endpoint...")
    endpoint = f"{backend_url.rstrip('/')}/maintenance-tasks/pending/for-optimizer"
    
    try:
        resp = requests.get(endpoint, timeout=10.0)
        if resp.status_code == 200:
            tasks = resp.json()
            print("\n--- OPTIMIZER FEED VERIFICATION ---")
            print(f"Total 'SCORED' Tasks Ready for CP-SAT Optimizer: {len(tasks)}")
            if tasks:
                df_top = pd.DataFrame(tasks[:5])
                display_cols = ["task_id", "department", "section_code", "defect_type", "defect_severity", "urgency_score", "status"]
                existing_cols = [c for c in display_cols if c in df_top.columns]
                print("\nTop 5 Scored Tasks Ready for CP-SAT Optimizer:")
                print(df_top[existing_cols].to_string(index=False))
            print("="*80 + "\n")
        else:
            logger.warning(f"Verification call to GET /maintenance-tasks/pending/for-optimizer returned HTTP {resp.status_code}")
    except Exception as e:
        logger.warning(f"Could not reach GET /maintenance-tasks/pending/for-optimizer for verification: {e}")

def main():
    parser = argparse.ArgumentParser(description="Score pending maintenance tasks via ML API and bulk-load into DB.")
    parser.add_argument("--ml-api-url", type=str, required=True, help="URL of the ML model service (e.g. http://localhost:8001)")
    parser.add_argument("--backend-url", type=str, default="http://localhost:8000", help="URL of backend FastAPI server")
    parser.add_argument("--batch-size", type=int, default=50, help="Batch size for PATCH requests to backend")
    parser.add_argument("--dry-run", action="store_true", default=False, help="Fetch and score tasks without writing to DB")
    
    args = parser.parse_args()
    
    db = SessionLocal()
    try:
        pending_rows = fetch_pending_tasks_with_context(db)
        if not pending_rows:
            logger.info("No PENDING tasks found to score.")
            return
            
        scored_items = []
        failed_tasks = []
        
        # Pre-flight check to verify ML endpoint host & port availability
        is_ok, host_msg = check_ml_host_available(args.ml_api_url)
        if not is_ok:
            logger.error(f"Cannot connect to ML API at {args.ml_api_url}: {host_msg}")
            print(f"\n[ERROR] ML API at '{args.ml_api_url}' is unreachable: {host_msg}")
            print("Please ensure the ML model service is running before executing this script.")
            sys.exit(1)

        logger.info(f"Step 2 & 3: Mapping fields and scoring {len(pending_rows)} tasks via ML API at {args.ml_api_url}...")
            
        start_time = time.time()
        for idx, row in enumerate(pending_rows, 1):
            t_id = int(row["task_id"])
            payload = build_task_ml_payload(row)
            
            raw_score, err = score_task_via_api(args.ml_api_url, payload)
            if err is None and raw_score is not None:
                rescaled = rescale_score_to_0_1(raw_score)
                scored_items.append({
                    "task_id": t_id,
                    "urgency_score": rescaled
                })
            else:
                failed_tasks.append({
                    "task_id": t_id,
                    "error": err
                })
                
            if idx % 100 == 0 or idx == len(pending_rows):
                elapsed = time.time() - start_time
                logger.info(f"Scored {idx}/{len(pending_rows)} tasks... ({len(scored_items)} succeeded, {len(failed_tasks)} failed, {elapsed:.1f}s elapsed)")
                
        if args.dry_run:
            print_dry_run_analysis(scored_items, failed_tasks)
        else:
            if scored_items:
                push_scores_to_backend(args.backend_url, scored_items, batch_size=args.batch_size)
                verify_optimizer_endpoint(args.backend_url)
            else:
                logger.error("No tasks were successfully scored. Skipping backend update.")
                
    except Exception as e:
        logger.exception(f"Unhandled error during task scoring run: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    main()
