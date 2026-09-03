import os
import sys
import logging
import argparse
import subprocess
import time

# Add backend root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("tejas_pipeline_runner")

SCRIPTS_DIR = os.path.dirname(__file__)

def run_script(script_name: str, args_list: list = None) -> bool:
    """Executes a pipeline python script and streams output."""
    script_path = os.path.join(SCRIPTS_DIR, script_name)
    cmd = [sys.executable, script_path] + (args_list or [])
    
    logger.info(f"--- Running Step: {' '.join(cmd)} ---")
    start_t = time.time()
    result = subprocess.run(cmd)
    elapsed = time.time() - start_t
    
    if result.returncode == 0:
        logger.info(f"Step '{script_name}' completed successfully in {elapsed:.2f}s.\n")
        return True
    else:
        logger.error(f"Step '{script_name}' failed with exit code {result.returncode}.\n")
        return False

def main():
    parser = argparse.ArgumentParser(description="TEJAS End-to-End Maintenance & Optimization Pipeline Orchestrator.")
    parser.add_argument("--skip-timetable", action="store_true", help="Skip timetable loading step.")
    parser.add_argument("--skip-traffic", action="store_true", help="Skip section traffic computation step.")
    parser.add_argument("--skip-slots", action="store_true", help="Skip time-slot generation step.")
    parser.add_argument("--skip-tasks", action="store_true", help="Skip synthetic maintenance task generation.")
    parser.add_argument("--skip-ml", action="store_true", help="Skip ML urgency scoring step.")
    parser.add_argument("--horizon", type=str, default="MONTHLY", choices=["WEEKLY", "MONTHLY"], help="Schedule horizon.")
    parser.add_argument("--dry-run", action="store_true", help="Run CP-SAT optimizer in dry-run mode.")
    args = parser.parse_args()

    print("\n" + "="*80)
    print("           TEJAS COMPLETE PIPELINE ORCHESTRATION")
    print("="*80)
    print("  1. Timetable Loading & Network Graph Construction")
    print("  2. Section Traffic Movement & Criticality Computation")
    print("  3. 30-Day Section Hourly Availability Time Slots Generation")
    print("  4. Maintenance Defect Tasks Ingestion")
    print("  5. ML Urgency Prioritization Scoring")
    print("  6. CP-SAT Multi-Objective Maintenance Block Optimization")
    print("="*80 + "\n")

    pipeline_start = time.time()

    # Step 1: Timetable
    if not args.skip_timetable:
        if not run_script("load_timetable.py"):
            logger.warning("Timetable loading step skipped or failed. Continuing...")

    # Step 2: Traffic
    if not args.skip_traffic:
        if not run_script("compute_section_traffic.py"):
            logger.warning("Traffic computation step skipped or failed. Continuing...")

    # Step 3: Slots
    if not args.skip_slots:
        if not run_script("generate_time_slots.py", ["--days", "30"]):
            logger.warning("Time slot generation step skipped or failed. Continuing...")

    # Step 4: Synthetic Tasks
    if not args.skip_tasks:
        if not run_script("generate_synthetic_tasks.py", ["--count", "100"]):
            logger.warning("Task generation step skipped or failed. Continuing...")

    # Step 5: ML Scoring
    if not args.skip_ml:
        if not run_script("score_tasks_via_ml_api.py"):
            logger.warning("ML scoring step skipped or failed. Continuing...")

    # Step 6: CP-SAT Block Optimizer
    optimizer_args = ["--horizon", args.horizon]
    if args.dry_run:
        optimizer_args.append("--dry-run")
        
    success = run_script("run_cpsat_block_optimizer.py", optimizer_args)

    total_time = time.time() - pipeline_start
    print("\n" + "="*80)
    print(f"PIPELINE RUN COMPLETE in {total_time:.2f}s - Solver Status: {'SUCCESS' if success else 'FAILED'}")
    print("="*80 + "\n")

if __name__ == "__main__":
    main()
