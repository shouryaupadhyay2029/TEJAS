from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user
from app.models import User

router = APIRouter(prefix="/traffic", tags=["traffic"])

@router.get("/summary")
def get_traffic_summary(
    db: Session = Depends(get_db)
):
    """
    Returns aggregate network-wide traffic analytics:
    - total_sections
    - total_trains
    - total_daily_movements
    - avg_trains_per_section
    - peak_hours_window
    - best_offpeak_window
    """
    # 1. Total sections & summary metrics
    summary_sql = text("""
        SELECT 
            COUNT(DISTINCT s.section_id) AS total_sections,
            COALESCE(SUM(st.daily_train_count), 0) AS total_daily_movements,
            COALESCE(AVG(st.daily_train_count), 0) AS avg_trains_per_section,
            COALESCE(MAX(st.daily_train_count), 0) AS max_section_trains
        FROM sections s
        LEFT JOIN section_traffic_summary st ON s.section_id = st.section_id;
    """)
    summary_row = db.execute(summary_sql).mappings().first()

    # 2. Total distinct trains
    trains_count_sql = text("SELECT COUNT(*) AS cnt FROM trains;")
    total_trains = db.execute(trains_count_sql).scalar() or 0

    # 3. Peak traffic hours calculation (from section_train_movements)
    hourly_sql = text("""
        SELECT 
            EXTRACT(HOUR FROM departure_from_station)::int AS hour,
            COUNT(*) AS movement_count
        FROM section_train_movements
        GROUP BY hour
        ORDER BY movement_count DESC;
    """)
    hourly_rows = db.execute(hourly_sql).mappings().all()

    peak_hour = hourly_rows[0]["hour"] if hourly_rows else 8
    best_offpeak = hourly_rows[-1]["hour"] if hourly_rows else 2

    return {
        "total_sections": summary_row["total_sections"] if summary_row else 0,
        "total_trains": total_trains,
        "total_daily_movements": summary_row["total_daily_movements"] if summary_row else 0,
        "avg_trains_per_section": round(float(summary_row["avg_trains_per_section"]), 1) if summary_row else 0,
        "max_section_trains": summary_row["max_section_trains"] if summary_row else 0,
        "peak_hours_window": f"{peak_hour:02d}:00 - {(peak_hour+3)%24:02d}:00",
        "best_offpeak_window": f"{best_offpeak:02d}:00 - {(best_offpeak+3)%24:02d}:00"
    }

@router.get("/hourly-density")
def get_hourly_density(
    section_id: Optional[int] = Query(default=None),
    db: Session = Depends(get_db)
):
    """
    Returns 24-hour traffic density breakdown (00:00 to 23:00).
    If section_id is provided, filters for that specific section; otherwise returns network average.
    """
    if section_id:
        sql = text("""
            SELECT 
                EXTRACT(HOUR FROM departure_from_station)::int AS hour,
                COUNT(*) AS train_count
            FROM section_train_movements
            WHERE section_id = :sec_id
            GROUP BY hour
            ORDER BY hour ASC;
        """)
        rows = db.execute(sql, {"sec_id": section_id}).mappings().all()
    else:
        sql = text("""
            SELECT 
                EXTRACT(HOUR FROM departure_from_station)::int AS hour,
                COUNT(*) AS train_count
            FROM section_train_movements
            GROUP BY hour
            ORDER BY hour ASC;
        """)
        rows = db.execute(sql).mappings().all()

    counts_by_hour = {r["hour"]: r["train_count"] for r in rows}

    density = []
    max_count = max(counts_by_hour.values()) if counts_by_hour else 1
    
    for h in range(24):
        cnt = counts_by_hour.get(h, 0)
        # Determine status: high, medium, low (maintenance window)
        ratio = cnt / float(max_count) if max_count > 0 else 0
        if ratio >= 0.7:
            status = "PEAK"
        elif ratio >= 0.3:
            status = "MODERATE"
        else:
            status = "OPTIMAL_BLOCK_WINDOW"

        density.append({
            "hour": h,
            "label": f"{h:02d}:00",
            "train_count": cnt,
            "status": status,
            "density_pct": round(ratio * 100, 1)
        })

    return density

@router.get("/trains/search")
def search_trains(
    query: str = Query(..., min_length=1, description="Train number or train name"),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Search trains by train_number or train_name and return route stop details.
    """
    sql = text("""
        SELECT 
            t.train_id,
            t.train_number,
            t.train_name,
            src.station_code AS source_code,
            src.station_name AS source_name,
            dst.station_code AS dest_code,
            dst.station_name AS dest_name
        FROM trains t
        LEFT JOIN stations src ON t.source_station_id = src.station_id
        LEFT JOIN stations dst ON t.destination_station_id = dst.station_id
        WHERE UPPER(t.train_number) LIKE UPPER(:q) OR UPPER(t.train_name) LIKE UPPER(:q)
        ORDER BY t.train_number ASC
        LIMIT :limit;
    """)
    train_rows = db.execute(sql, {"q": f"%{query}%", "limit": limit}).mappings().all()

    results = []
    for tr in train_rows:
        # Fetch stops
        stops_sql = text("""
            SELECT 
                ts.stop_sequence,
                st.station_code,
                st.station_name,
                TO_CHAR(ts.arrival_time, 'HH24:MI') AS arrival_time,
                TO_CHAR(ts.departure_time, 'HH24:MI') AS departure_time,
                ts.distance_km
            FROM train_schedule ts
            JOIN stations st ON ts.station_id = st.station_id
            WHERE ts.train_id = :tr_id
            ORDER BY ts.stop_sequence ASC;
        """)
        stops = db.execute(stops_sql, {"tr_id": tr["train_id"]}).mappings().all()
        results.append({
            "train_id": tr["train_id"],
            "train_number": tr["train_number"],
            "train_name": tr["train_name"],
            "source_code": tr["source_code"],
            "source_name": tr["source_name"],
            "dest_code": tr["dest_code"],
            "dest_name": tr["dest_name"],
            "total_stops": len(stops),
            "stops": list(stops)
        })

    return results
