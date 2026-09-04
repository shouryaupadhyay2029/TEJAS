import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.auth import get_current_user
from app.models import User, Section, SectionTimeSlot, SectionTrafficSummary, Station
from app.schemas import SectionOut, SectionTrafficOut, SectionAvailabilityResponse, SlotItem


router = APIRouter(prefix="/sections", tags=["sections"])

@router.get("/traffic/all", response_model=List[SectionTrafficOut])
def get_all_section_traffic(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns all section traffic summary metrics joined with section and station details.
    This is the primary endpoint consumed by the ML model.
    """
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
        ORDER BY st.daily_train_count DESC, st.criticality_score DESC;
    """)
    
    rows = db.execute(query).mappings().all()
    return list(rows)

@router.get("/all", response_model=List[SectionOut])
def get_all_sections(
    limit: int = Query(default=100, ge=1, le=1000),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Utility endpoint returning paginated sections with readable from/to station details.
    """
    sections = (
        db.query(Section)
        .options(joinedload(Section.from_station), joinedload(Section.to_station))
        .order_by(Section.section_id.asc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return sections

@router.get("/{section_id}/availability", response_model=SectionAvailabilityResponse)
def get_section_availability(
    section_id: int,
    start_date: Optional[datetime.date] = Query(default=None),
    days: int = Query(default=7, ge=1, le=31),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns section_time_slots rows for a given section within the date range.
    Returns 404 if section_id does not exist.
    Returns 200 with an empty list and warning message if slots have not been generated yet.
    """
    # 1. Check if section exists
    section = db.query(Section).filter(Section.section_id == section_id).first()
    if not section:
        raise HTTPException(status_code=404, detail=f"Section {section_id} not found")
        
    # 2. Default start_date to today if not provided
    if start_date is None:
        start_date = datetime.date.today()
        
    end_date = start_date + datetime.timedelta(days=days)
    
    # 3. Query slots
    slots = (
        db.query(SectionTimeSlot)
        .filter(
            SectionTimeSlot.section_id == section_id,
            SectionTimeSlot.slot_date >= start_date,
            SectionTimeSlot.slot_date < end_date
        )
        .order_by(SectionTimeSlot.slot_date.asc(), SectionTimeSlot.slot_hour.asc())
        .all()
    )
    
    if not slots:
        return SectionAvailabilityResponse(
            section_id=section_id,
            slots=[],
            warning="Time slots have not been generated yet for this section."
        )
        
    return SectionAvailabilityResponse(
        section_id=section_id,
        slots=slots,
        warning=None
    )
