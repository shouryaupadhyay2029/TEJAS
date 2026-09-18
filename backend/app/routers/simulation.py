"""
TEJAS — What-If Block Scenario Simulator
POST /api/simulation/what-if

Runs a Google OR-Tools CP-SAT solver against a synthetic (deterministic)
train schedule for the given section to calculate the exact delay impact of
a proposed maintenance block before a controller grants approval.
"""

import hashlib
import logging
import random
import uuid
from typing import List, Optional

from fastapi import APIRouter
from ortools.sat.python import cp_model
from pydantic import BaseModel

logger = logging.getLogger("simulation_router")

router = APIRouter(prefix="/simulation", tags=["simulation"])

# ---------------------------------------------------------------------------
# Cost weights
# ---------------------------------------------------------------------------
PASSENGER_DELAY_COST = 10   # cost units per minute of passenger delay
FREIGHT_DELAY_COST = 4      # cost units per minute of freight delay

# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------

class WhatIfRequest(BaseModel):
    section_code: str = "VAR-LKO-SEC1"
    proposed_start_time: str = "14:00"          # "HH:MM" 24-hr IST
    proposed_duration_minutes: int = 180
    departments: List[str] = ["ENGINEERING", "SIGNAL_TELECOM", "TRACTION"]
    priority_weight: str = "FREIGHT_THROUGHPUT"  # or "PASSENGER_PUNCTUALITY"


class SimMetrics(BaseModel):
    predicted_freight_delay_minutes: int
    line_capacity_saved_percent: float
    passenger_train_impact_count: int
    co_location_efficiency_score: float


class ImpactedTrain(BaseModel):
    train_no: str
    name: str
    type: str                   # "PASSENGER" | "FREIGHT"
    scheduled_pass_min: int     # minutes from 00:00
    delay_minutes: int
    action: str                 # "NORMAL_RUN" | "HELD_AT_STATION_LOOP" | "SPEED_RESTRICTION"


class WhatIfResponse(BaseModel):
    simulation_id: str
    section_code: str
    proposed_window: str
    metrics: SimMetrics
    impacted_trains: List[ImpactedTrain]
    verdict: str                        # OPTIMAL_APPROVAL | HIGH_CONGESTION_RISK | REROUTE_SUGGESTED
    ai_recommendation: str
    alternate_suggested_window: Optional[str] = None
    alternate_window_saving_minutes: Optional[int] = None


# ---------------------------------------------------------------------------
# Synthetic train schedule generator
# Deterministic: seeded from section_code so results are reproducible.
# ---------------------------------------------------------------------------

# Named express / passenger trains (cycling pool)
PASSENGER_POOL = [
    ("12236", "Rajdhani Express"),
    ("12302", "Howrah Rajdhani"),
    ("12952", "Mumbai Rajdhani"),
    ("12004", "Lucknow Shatabdi"),
    ("12034", "New Delhi Shatabdi"),
    ("12554", "Vaishali Express"),
    ("12230", "Lucknow Mail"),
    ("12418", "Prayagraj Express"),
    ("12312", "Kalka Mail"),
]

# Named freight rakes
FREIGHT_POOL = [
    ("BOXN-774", "Coal Freight Rake"),
    ("BOXN-812", "Iron Ore Rake"),
    ("BCN-441",  "Cement Goods Rake"),
    ("BTPN-226", "POL Tank Rake"),
    ("BCNA-339", "Container Freight"),
    ("BOXNHL-19","Heavy Mineral Rake"),
]

DAYS_PER_WEEK = 7  # trains pass every day; we model a single day


def _seed_from_section(section_code: str) -> int:
    """Stable integer seed from section code string."""
    return int(hashlib.md5(section_code.encode()).hexdigest()[:8], 16)


def generate_train_schedule(section_code: str) -> List[dict]:
    """
    Generate a deterministic daily train schedule for the section.
    Returns list of dicts: {train_no, name, type, pass_min}
    where pass_min = minutes from 00:00 when the train passes through the section.
    """
    rng = random.Random(_seed_from_section(section_code))

    trains = []

    # 7-12 passenger trains spread across 04:00-23:00
    n_pass = rng.randint(7, 12)
    pass_pool = PASSENGER_POOL[:]
    rng.shuffle(pass_pool)
    used_pass_slots: set = set()

    for i in range(n_pass):
        # spread in 04:00 (240 min) to 23:00 (1380 min)
        while True:
            t = rng.randint(240, 1380)
            # keep trains at least 30 min apart
            if all(abs(t - s) >= 30 for s in used_pass_slots):
                used_pass_slots.add(t)
                break
        train_no, name = pass_pool[i % len(pass_pool)]
        trains.append({
            "train_no": train_no,
            "name": name,
            "type": "PASSENGER",
            "pass_min": t,
        })

    # 5-9 freight rakes spread across 00:00-23:30
    n_freight = rng.randint(5, 9)
    freight_pool = FREIGHT_POOL[:]
    rng.shuffle(freight_pool)
    used_freight_slots: set = set()

    for i in range(n_freight):
        while True:
            t = rng.randint(0, 1410)
            if all(abs(t - s) >= 45 for s in used_freight_slots):
                used_freight_slots.add(t)
                break
        train_no, name = freight_pool[i % len(freight_pool)]
        trains.append({
            "train_no": train_no,
            "name": name,
            "type": "FREIGHT",
            "pass_min": t,
        })

    return trains


# ---------------------------------------------------------------------------
# CP-SAT simulation core
# ---------------------------------------------------------------------------

def _time_str_to_minutes(t: str) -> int:
    """Convert 'HH:MM' to minutes from midnight."""
    h, m = t.split(":")
    return int(h) * 60 + int(m)


def _minutes_to_time_str(m: int) -> str:
    h = (m // 60) % 24
    mn = m % 60
    return f"{h:02d}:{mn:02d}"


def run_cpsat_simulation(
    trains: List[dict],
    closure_start_min: int,
    duration_min: int,
    priority_weight: str,
    departments: List[str],
) -> dict:
    """
    Runs CP-SAT model for ONE proposed window.

    Decision variables:
      delay_i (IntVar) — extra delay minutes imposed on train i (≥ 0).

    Constraints:
      - If train i's scheduled pass_min falls within [closure_start, closure_start+duration):
          delay_i ≥ (closure_start + duration) - pass_min_i   (train must wait until block ends)
      - Otherwise:
          delay_i = 0                                          (train runs normally)

    Objective: minimise weighted sum of delay costs.

    Returns dict with metrics.
    """
    closure_end_min = closure_start_min + duration_min
    SCALE = 1  # we work in integer minutes

    model = cp_model.CpModel()

    delay_vars = []
    for train in trains:
        pass_min = train["pass_min"]
        if closure_start_min <= pass_min < closure_end_min:
            # Train is inside the closure window — must be delayed
            min_delay = closure_end_min - pass_min
            # Allow solver to potentially schedule train slightly earlier too,
            # but practically it can only be held (delay ≥ min_delay).
            d = model.new_int_var(min_delay, min_delay + 120, f"delay_{train['train_no']}")
            # Fix to minimum feasible delay (no rerouting in this model)
            model.add(d == min_delay)
        else:
            d = model.new_int_var(0, 0, f"delay_{train['train_no']}_noimpact")
        delay_vars.append(d)

    # Objective: minimise total weighted delay cost
    if priority_weight == "PASSENGER_PUNCTUALITY":
        p_cost = PASSENGER_DELAY_COST * 2
        f_cost = FREIGHT_DELAY_COST
    else:  # FREIGHT_THROUGHPUT
        p_cost = PASSENGER_DELAY_COST
        f_cost = FREIGHT_DELAY_COST * 2

    cost_terms = []
    for i, train in enumerate(trains):
        coeff = p_cost if train["type"] == "PASSENGER" else f_cost
        cost_terms.append(coeff * delay_vars[i])

    model.minimize(sum(cost_terms))

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 5.0
    status = solver.solve(model)

    # Collect results
    impacted = []
    total_freight_delay = 0
    total_passenger_delay = 0
    passenger_impact_count = 0

    for i, train in enumerate(trains):
        delay_val = solver.value(delay_vars[i]) if status in (cp_model.OPTIMAL, cp_model.FEASIBLE) else 0

        if delay_val > 0:
            if train["type"] == "PASSENGER":
                passenger_impact_count += 1
                total_passenger_delay += delay_val
                action = "SPEED_RESTRICTION" if delay_val < 20 else "HELD_AT_STATION_LOOP"
            else:
                total_freight_delay += delay_val
                action = "HELD_AT_STATION_LOOP"
        else:
            action = "NORMAL_RUN"

        impacted.append({
            "train_no": train["train_no"],
            "name": train["name"],
            "type": train["type"],
            "scheduled_pass_min": train["pass_min"],
            "delay_minutes": delay_val,
            "action": action,
        })

    # Sort: impacted trains first, then by scheduled time
    impacted.sort(key=lambda x: (-x["delay_minutes"], x["scheduled_pass_min"]))

    # Co-location efficiency: more departments co-located → higher score
    dept_count = len(departments)
    base_efficiency = 72.0 + dept_count * 6.5
    # Bonus if no passenger trains impacted
    if passenger_impact_count == 0:
        base_efficiency = min(base_efficiency + 10.0, 99.9)
    co_loc_score = round(base_efficiency + (total_freight_delay == 0) * 5.0, 1)
    co_loc_score = min(co_loc_score, 99.9)

    # Line capacity saved — based on how many departments are co-located vs sequential
    # For a single dept, there is still a baseline capacity gain from optimised timing
    if dept_count == 1:
        capacity_saved_pct = round(8.0 + (duration_min / 60) * 2.5, 1)  # small baseline gain
    else:
        avg_dept_hrs = duration_min / 60
        sequential_hrs = dept_count * avg_dept_hrs
        capacity_saved_pct = round(((sequential_hrs - avg_dept_hrs) / sequential_hrs) * 100, 1)

    return {
        "impacted": impacted,
        "predicted_freight_delay_minutes": total_freight_delay,
        "passenger_train_impact_count": passenger_impact_count,
        "total_passenger_delay": total_passenger_delay,
        "line_capacity_saved_percent": capacity_saved_pct,
        "co_location_efficiency_score": co_loc_score,
        "solver_status": status,
    }


def find_alternate_window(
    trains: List[dict],
    closure_start_min: int,
    duration_min: int,
    priority_weight: str,
    departments: List[str],
) -> Optional[dict]:
    """
    Sweep ±120 minutes around the proposed start in 30-minute steps.
    Return the best alternate window if it's meaningfully better than the proposed one.
    """
    proposed_result = run_cpsat_simulation(trains, closure_start_min, duration_min, priority_weight, departments)
    proposed_cost = (
        proposed_result["predicted_freight_delay_minutes"] * FREIGHT_DELAY_COST
        + proposed_result["passenger_train_impact_count"] * 30 * PASSENGER_DELAY_COST
    )

    best_cost = proposed_cost
    best_start = None
    best_result = None

    for delta in range(-120, 130, 30):
        if delta == 0:
            continue
        candidate_start = closure_start_min + delta
        if candidate_start < 0 or candidate_start + duration_min > 1440:
            continue

        result = run_cpsat_simulation(trains, candidate_start, duration_min, priority_weight, departments)
        cand_cost = (
            result["predicted_freight_delay_minutes"] * FREIGHT_DELAY_COST
            + result["passenger_train_impact_count"] * 30 * PASSENGER_DELAY_COST
        )

        if cand_cost < best_cost:
            best_cost = cand_cost
            best_start = candidate_start
            best_result = result

    if best_start is not None and best_result is not None:
        saving = proposed_result["predicted_freight_delay_minutes"] - best_result["predicted_freight_delay_minutes"]
        return {
            "start_min": best_start,
            "end_min": best_start + duration_min,
            "saving_minutes": max(saving, 0),
        }
    return None


# ---------------------------------------------------------------------------
# Verdict logic
# ---------------------------------------------------------------------------

def compute_verdict(
    freight_delay: int,
    passenger_impact: int,
    duration_min: int,
    priority_weight: str,
    alternate: Optional[dict],
) -> tuple[str, str]:
    """
    Returns (verdict_code, ai_recommendation).
    Thresholds reflect realistic Indian railway operations:
    - Freight holds at loops are normal practice up to ~90 min
    - Even 1 delayed Rajdhani/Shatabdi is a significant event
    """
    if priority_weight == "PASSENGER_PUNCTUALITY":
        # Passenger-focused: strict on express/mail train delays
        if passenger_impact == 0 and freight_delay <= 120:
            verdict = "OPTIMAL_APPROVAL"
        elif passenger_impact <= 1 and freight_delay <= 180:
            verdict = "HIGH_CONGESTION_RISK"
        else:
            verdict = "REROUTE_SUGGESTED"
    else:
        # Freight-focused: higher tolerance for freight holds, strict on passenger trains
        if passenger_impact == 0 and freight_delay <= 90:
            verdict = "OPTIMAL_APPROVAL"
        elif passenger_impact <= 2 and freight_delay <= 200:
            verdict = "HIGH_CONGESTION_RISK"
        else:
            verdict = "REROUTE_SUGGESTED"

    # Build recommendation string
    dept_phrase = "multi-dept work"
    if verdict == "OPTIMAL_APPROVAL":
        rec = (
            f"Grant block. Co-locates {dept_phrase}, saving significant line capacity. "
            f"Freight impact minimal ({freight_delay} min total hold). "
            f"{passenger_impact} passenger train(s) unaffected. Proceed with approval."
        )
    elif verdict == "HIGH_CONGESTION_RISK":
        if alternate:
            alt_start = _minutes_to_time_str(alternate["start_min"])
            alt_end = _minutes_to_time_str(alternate["end_min"])
            rec = (
                f"Moderate congestion risk. {passenger_impact} passenger train(s) delayed, "
                f"{freight_delay} min freight hold. Consider shifting window to "
                f"{alt_start}–{alt_end} IST (saves ~{alternate['saving_minutes']} min freight delay). "
                f"Proceed cautiously or reschedule."
            )
        else:
            rec = (
                f"Moderate congestion risk. {passenger_impact} passenger train(s) delayed, "
                f"{freight_delay} min total freight hold. Reduce block duration or split into sub-blocks."
            )
    else:  # REROUTE_SUGGESTED
        if alternate:
            alt_start = _minutes_to_time_str(alternate["start_min"])
            alt_end = _minutes_to_time_str(alternate["end_min"])
            rec = (
                f"HIGH IMPACT. {passenger_impact} passenger trains delayed, {freight_delay} min freight hold "
                f"exceeds safe threshold. SHIFT WINDOW TO {alt_start}–{alt_end} IST "
                f"(saves ~{alternate['saving_minutes']} min delay). Do NOT grant block at proposed time."
            )
        else:
            rec = (
                f"HIGH IMPACT. {passenger_impact} passenger trains delayed, {freight_delay} min freight hold. "
                f"No safe alternate window found within ±2 hrs. Consider night possession (00:00–05:00) "
                f"or split the work across multiple off-peak slots."
            )

    return verdict, rec


# ---------------------------------------------------------------------------
# Main endpoint
# ---------------------------------------------------------------------------

@router.post("/what-if", response_model=WhatIfResponse)
def run_what_if_simulation(req: WhatIfRequest) -> WhatIfResponse:
    """
    Runs a CP-SAT What-If simulation for a proposed maintenance block.
    Calculates delay impact on the section's train schedule and recommends
    whether the controller should approve, flag risk, or reroute the window.
    """
    logger.info(f"Running what-if simulation: {req.section_code} @ {req.proposed_start_time} for {req.proposed_duration_minutes} min")

    # Generate deterministic synthetic train schedule
    trains = generate_train_schedule(req.section_code)

    # Parse proposed window
    closure_start_min = _time_str_to_minutes(req.proposed_start_time)
    duration_min = max(30, min(req.proposed_duration_minutes, 480))  # clamp 30–480 min
    closure_end_min = closure_start_min + duration_min

    # Run primary CP-SAT simulation
    result = run_cpsat_simulation(
        trains=trains,
        closure_start_min=closure_start_min,
        duration_min=duration_min,
        priority_weight=req.priority_weight,
        departments=req.departments,
    )

    # Find alternate window
    alternate = find_alternate_window(
        trains=trains,
        closure_start_min=closure_start_min,
        duration_min=duration_min,
        priority_weight=req.priority_weight,
        departments=req.departments,
    )

    # Compute verdict
    verdict, ai_rec = compute_verdict(
        freight_delay=result["predicted_freight_delay_minutes"],
        passenger_impact=result["passenger_train_impact_count"],
        duration_min=duration_min,
        priority_weight=req.priority_weight,
        alternate=alternate,
    )

    # Build simulation ID
    sim_id = f"SIM-{abs(hash(req.section_code + req.proposed_start_time)) % 9000 + 1000}"

    # Proposed window string
    proposed_window = f"{_minutes_to_time_str(closure_start_min)} – {_minutes_to_time_str(closure_end_min)} IST"

    # Alternate window string
    alt_window_str: Optional[str] = None
    alt_saving: Optional[int] = None
    if alternate:
        alt_start_str = _minutes_to_time_str(alternate["start_min"])
        alt_end_str = _minutes_to_time_str(alternate["end_min"])
        alt_saving = alternate["saving_minutes"]
        alt_window_str = f"{alt_start_str} – {alt_end_str} IST (Saves {alt_saving} min freight delay)"

    # Build impacted trains response (top 10 for readability)
    impacted_trains = [
        ImpactedTrain(
            train_no=t["train_no"],
            name=t["name"],
            type=t["type"],
            scheduled_pass_min=t["scheduled_pass_min"],
            delay_minutes=t["delay_minutes"],
            action=t["action"],
        )
        for t in result["impacted"][:10]
    ]

    return WhatIfResponse(
        simulation_id=sim_id,
        section_code=req.section_code,
        proposed_window=proposed_window,
        metrics=SimMetrics(
            predicted_freight_delay_minutes=result["predicted_freight_delay_minutes"],
            line_capacity_saved_percent=result["line_capacity_saved_percent"],
            passenger_train_impact_count=result["passenger_train_impact_count"],
            co_location_efficiency_score=result["co_location_efficiency_score"],
        ),
        impacted_trains=impacted_trains,
        verdict=verdict,
        ai_recommendation=ai_rec,
        alternate_suggested_window=alt_window_str,
        alternate_window_saving_minutes=alt_saving,
    )
