from typing import Optional, List, Dict
from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import (
    NetworkGraphResponse, 
    NetworkGraphNode, 
    NetworkGraphEdge, 
    NetworkGraphTaskItem, 
    NetworkGraphMeta
)

router = APIRouter(prefix="/network", tags=["network"])

@router.get("/graph", response_model=NetworkGraphResponse)
def get_network_graph(
    limit: int = Query(default=50, ge=1, le=500, description="Max sections to return"),
    department: Optional[str] = Query(default=None, description="Optional department filter ('ENGINEERING', 'SIGNAL_TELECOM', 'TRACTION_DISTRIBUTION')"),
    db: Session = Depends(get_db)
):
    """
    Returns Network Topology Graph data (deduplicated station nodes and section edges with aggregated defect task context).
    Ranked by MAX(urgency_score) per section DESC (NULLS LAST).
    """
    dept_filter = department.upper() if department else None

    # 1. Total sections available in tasks table matching filter
    total_sections_sql = """
        SELECT COUNT(DISTINCT section_id) AS cnt
        FROM maintenance_tasks
        WHERE 1=1
    """
    total_params = {}
    if dept_filter:
        total_sections_sql += " AND UPPER(department) = :dept"
        total_params["dept"] = dept_filter

    total_sections_cnt = db.execute(text(total_sections_sql), total_params).scalar() or 0

    # 2. Query top 'limit' sections ranked by MAX(urgency_score) DESC NULLS LAST
    ranked_sections_sql = """
        SELECT 
            m.section_id,
            MAX(m.urgency_score) AS max_urgency
        FROM maintenance_tasks m
        WHERE 1=1
    """
    if dept_filter:
        ranked_sections_sql += " AND UPPER(m.department) = :dept"
    ranked_sections_sql += """
        GROUP BY m.section_id
        ORDER BY MAX(m.urgency_score) DESC NULLS LAST, m.section_id ASC
        LIMIT :limit;
    """
    ranked_params = {"limit": limit}
    if dept_filter:
        ranked_params["dept"] = dept_filter

    ranked_rows = db.execute(text(ranked_sections_sql), ranked_params).mappings().all()
    if not ranked_rows:
        return {
            "nodes": [],
            "edges": [],
            "meta": {
                "total_sections_available": total_sections_cnt,
                "limit_applied": limit,
                "department_filter": dept_filter
            }
        }

    selected_section_ids = [r["section_id"] for r in ranked_rows]

    # 3. Fetch section info & criticality score for selected section IDs
    section_info_sql = """
        SELECT 
            sec.section_id,
            sec.section_code,
            sec.from_station_id,
            sec.to_station_id,
            COALESCE(sts.criticality_score, 0.5) AS criticality_score
        FROM sections sec
        LEFT JOIN section_traffic_summary sts ON sec.section_id = sts.section_id
        WHERE sec.section_id IN :section_ids;
    """
    sec_rows = db.execute(text(section_info_sql), {"section_ids": tuple(selected_section_ids)}).mappings().all()
    sec_info_map = {s["section_id"]: s for s in sec_rows}

    # 4. Collect & deduplicate all station IDs involved
    station_ids_set = set()
    for s in sec_rows:
        station_ids_set.add(s["from_station_id"])
        station_ids_set.add(s["to_station_id"])

    stations_sql = """
        SELECT station_id, station_code, station_name
        FROM stations
        WHERE station_id IN :st_ids
        ORDER BY station_name ASC;
    """
    st_rows = db.execute(text(stations_sql), {"st_ids": tuple(station_ids_set)}).mappings().all()
    nodes = [
        {
            "station_id": r["station_id"],
            "station_code": r["station_code"],
            "station_name": r["station_name"]
        }
        for r in st_rows
    ]

    # 5. Fetch maintenance tasks for selected sections (capped at 5 tasks per section, with count)
    tasks_sql = """
        SELECT 
            task_id,
            section_id,
            department,
            defect_type,
            urgency_score,
            status
        FROM maintenance_tasks
        WHERE section_id IN :section_ids
    """
    task_params = {"section_ids": tuple(selected_section_ids)}
    if dept_filter:
        tasks_sql += " AND UPPER(department) = :dept"
        task_params["dept"] = dept_filter
    tasks_sql += " ORDER BY urgency_score DESC NULLS LAST, task_id ASC;"

    all_task_rows = db.execute(text(tasks_sql), task_params).mappings().all()

    # Group tasks per section
    tasks_by_section: Dict[int, List[dict]] = {s_id: [] for s_id in selected_section_ids}
    for t in all_task_rows:
        tasks_by_section[t["section_id"]].append(t)

    # Build edges list preserving ranking order of ranked_rows
    edges = []
    for r in ranked_rows:
        s_id = r["section_id"]
        sec_meta = sec_info_map.get(s_id)
        if not sec_meta:
            continue

        sec_tasks = tasks_by_section.get(s_id, [])
        task_count = len(sec_tasks)
        has_more = task_count > 5
        capped_tasks = [
            {
                "task_id": t["task_id"],
                "urgency_score": t["urgency_score"],
                "department": t["department"],
                "defect_type": t["defect_type"],
                "status": t["status"]
            }
            for t in sec_tasks[:5]
        ]

        edges.append({
            "section_id": s_id,
            "section_code": sec_meta["section_code"],
            "from_station_id": sec_meta["from_station_id"],
            "to_station_id": sec_meta["to_station_id"],
            "criticality_score": float(sec_meta["criticality_score"]),
            "task_count": task_count,
            "max_urgency_score": float(r["max_urgency"]) if r["max_urgency"] is not None else None,
            "tasks": capped_tasks,
            "has_more_tasks": has_more
        })

    return {
        "nodes": nodes,
        "edges": edges,
        "meta": {
            "total_sections_available": total_sections_cnt,
            "limit_applied": limit,
            "department_filter": dept_filter
        }
    }
