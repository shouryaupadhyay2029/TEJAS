import datetime
from run_cpsat_block_optimizer import (
    CandidateWindow,
    generate_candidate_windows,
    build_and_solve_cpsat_model,
    DEPARTMENT_DURATIONS
)

def test_cpsat_optimizer_logic():
    print("="*60)
    print("RUNNING CP-SAT OPTIMIZATION LOGIC UNIT TEST")
    print("="*60)

    # 1. Setup Mock Scored Tasks across 2 sections
    mock_tasks = [
        {
            "task_id": 101,
            "department": "ENGINEERING",
            "section_id": 1,
            "section_code": "SEC-A",
            "defect_type": "Rail Crack",
            "defect_severity": 5,
            "days_overdue": 12,
            "urgency_score": 0.95,
            "status": "SCORED"
        },
        {
            "task_id": 102,
            "department": "SIGNAL_TELECOM",
            "section_id": 1,
            "section_code": "SEC-A",
            "defect_type": "Signal Fault",
            "defect_severity": 4,
            "days_overdue": 5,
            "urgency_score": 0.88,
            "status": "SCORED"
        },
        {
            "task_id": 103,
            "department": "TRACTION_DISTRIBUTION",
            "section_id": 1,
            "section_code": "SEC-A",
            "defect_type": "OHE Sag",
            "defect_severity": 4,
            "days_overdue": 2,
            "urgency_score": 0.91,
            "status": "SCORED"
        },
        {
            "task_id": 104,
            "department": "ENGINEERING",
            "section_id": 2,
            "section_code": "SEC-B",
            "defect_type": "Weld Defect",
            "defect_severity": 3,
            "days_overdue": 0,
            "urgency_score": 0.50,
            "status": "SCORED"
        },
        {
            "task_id": 105,
            "department": "TRACTION_DISTRIBUTION",
            "section_id": 2,
            "section_code": "SEC-B",
            "defect_type": "Insulator Flashover",
            "defect_severity": 5,
            "days_overdue": 15,
            "urgency_score": 0.99,
            "status": "SCORED"
        }
    ]

    start_date = datetime.date(2026, 9, 5)
    days = 3
    dates = [start_date + datetime.timedelta(days=d) for d in range(days)]

    # 2. Setup mock availability slots
    # Section 1: Day 0: 09:00 - 13:00 FREE (4 hours free: 9, 10, 11, 12)
    #            Day 1: 14:00 - 18:00 FREE
    # Section 2: Day 0: 10:00 - 12:00 FREE (2 hours free -> TRD needing 3h cannot fit Day 0, Eng can fit)
    #            Day 1: 01:00 - 05:00 FREE (4 hours free -> TRD can fit)
    slots_map = {}
    for sec_id in [1, 2]:
        for d in dates:
            for h in range(24):
                slots_map[(sec_id, d, h)] = False

    # Section 1 free hours
    for h in [9, 10, 11, 12]:
        slots_map[(1, dates[0], h)] = True
    for h in [14, 15, 16, 17]:
        slots_map[(1, dates[1], h)] = True

    # Section 2 free hours
    for h in [10, 11]:
        slots_map[(2, dates[0], h)] = True
    for h in [1, 2, 3, 4]:
        slots_map[(2, dates[1], h)] = True

    # 3. Generate candidate windows
    all_cands, task_cands, infeasible_reasons = generate_candidate_windows(
        mock_tasks, slots_map, start_date, days
    )

    print(f"Total tasks: {len(mock_tasks)}")
    print(f"Candidate windows generated: {len(all_cands)}")
    for t_id, cands in task_cands.items():
        print(f"  Task {t_id}: {len(cands)} feasible window(s)")

    # 4. Solve CP-SAT model
    status, status_name, scheduled_blocks, scheduled_ids = build_and_solve_cpsat_model(
        tasks=mock_tasks,
        all_candidates=all_cands,
        task_candidates=task_cands,
        days=days,
        max_section_capacity=2,
        time_limit_sec=10
    )

    print(f"\nSolver Status: {status_name}")
    print(f"Scheduled Tasks Count: {len(scheduled_blocks)} / {len(mock_tasks)}")
    for b in scheduled_blocks:
        print(f"  -> Task {b['task_id']} ({b['department']}) on Section {b['section_id']}: Date {b['slot_date']} at {b['start_hour']:02d}:00-{b['end_hour']:02d}:00")

    # Assertions
    assert status_name in ["OPTIMAL", "FEASIBLE"], "Solver should find optimal/feasible solution"
    assert len(scheduled_blocks) >= 4, "Should schedule eligible tasks"
    assert 101 in scheduled_ids, "High urgency Engineering task 101 should be scheduled"
    assert 102 in scheduled_ids, "S&T task 102 should be scheduled"
    assert 105 in scheduled_ids, "Critical TRD task 105 should be scheduled on Section 2 Day 1"

    print("\nALL OPTIMIZATION LOGIC UNIT TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_cpsat_optimizer_logic()
