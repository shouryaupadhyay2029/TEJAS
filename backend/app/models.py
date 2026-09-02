import datetime
from sqlalchemy import (
    Column, Integer, String, Numeric, Boolean, Date, Time, DateTime,
    ForeignKey, UniqueConstraint, CheckConstraint, func, SmallInteger
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from app.database import Base

class Station(Base):
    __tablename__ = "stations"

    station_id = Column(Integer, primary_key=True, index=True)
    station_code = Column(String, unique=True, nullable=False)
    station_name = Column(String, nullable=False)

class Train(Base):
    __tablename__ = "trains"

    train_id = Column(Integer, primary_key=True, index=True)
    train_number = Column(String, unique=True, nullable=False)
    train_name = Column(String, nullable=True)
    source_station_id = Column(Integer, ForeignKey("stations.station_id"), nullable=True)
    destination_station_id = Column(Integer, ForeignKey("stations.station_id"), nullable=True)

    source_station = relationship("Station", foreign_keys=[source_station_id])
    destination_station = relationship("Station", foreign_keys=[destination_station_id])

class TrainSchedule(Base):
    __tablename__ = "train_schedule"

    schedule_id = Column(Integer, primary_key=True, index=True)
    train_id = Column(Integer, ForeignKey("trains.train_id"), nullable=False)
    station_id = Column(Integer, ForeignKey("stations.station_id"), nullable=False)
    stop_sequence = Column(Integer, nullable=False)
    arrival_time = Column(Time, nullable=True)
    departure_time = Column(Time, nullable=True)
    distance_km = Column(Numeric, nullable=True)

    __table_args__ = (
        UniqueConstraint("train_id", "stop_sequence", name="uq_train_stop_sequence"),
    )

    train = relationship("Train")
    station = relationship("Station")

class RawTimetableStaging(Base):
    __tablename__ = "raw_timetable_staging"

    id = Column(Integer, primary_key=True, index=True)
    raw_row = Column(JSONB, nullable=True)
    loaded_at = Column(DateTime, server_default=func.now())
    processed = Column(Boolean, default=False)

class Section(Base):
    __tablename__ = "sections"

    section_id = Column(Integer, primary_key=True, index=True)
    from_station_id = Column(Integer, ForeignKey("stations.station_id"), nullable=False)
    to_station_id = Column(Integer, ForeignKey("stations.station_id"), nullable=False)
    section_code = Column(String, unique=True, nullable=True)

    __table_args__ = (
        UniqueConstraint("from_station_id", "to_station_id", name="uq_section_stations"),
    )

    from_station = relationship("Station", foreign_keys=[from_station_id])
    to_station = relationship("Station", foreign_keys=[to_station_id])

class SectionTrainMovement(Base):
    __tablename__ = "section_train_movements"

    movement_id = Column(Integer, primary_key=True, index=True)
    section_id = Column(Integer, ForeignKey("sections.section_id"), nullable=False)
    train_id = Column(Integer, ForeignKey("trains.train_id"), nullable=False)
    departure_from_station = Column(Time, nullable=False)
    arrival_at_station = Column(Time, nullable=False)
    day_of_week = Column(SmallInteger, nullable=True)

    section = relationship("Section")
    train = relationship("Train")

class SectionTrafficSummary(Base):
    __tablename__ = "section_traffic_summary"

    section_id = Column(Integer, ForeignKey("sections.section_id"), primary_key=True)
    daily_train_count = Column(Integer, nullable=False, default=0)
    criticality_score = Column(Numeric, nullable=False, default=0)
    last_computed_at = Column(DateTime, server_default=func.now())

    section = relationship("Section")

class SectionTimeSlot(Base):
    __tablename__ = "section_time_slots"

    slot_id = Column(Integer, primary_key=True, index=True)
    section_id = Column(Integer, ForeignKey("sections.section_id"), nullable=False)
    slot_date = Column(Date, nullable=False)
    slot_hour = Column(SmallInteger, nullable=False)
    is_free = Column(Boolean, nullable=False)
    train_count_in_slot = Column(Integer, nullable=False, default=0)

    __table_args__ = (
        UniqueConstraint("section_id", "slot_date", "slot_hour", name="uq_section_slot_datetime"),
        CheckConstraint("slot_hour BETWEEN 0 AND 23", name="chk_slot_hour_range"),
    )

    section = relationship("Section")

class MaintenanceTask(Base):
    __tablename__ = "maintenance_tasks"

    task_id = Column(Integer, primary_key=True, index=True)
    department = Column(String, nullable=False)
    section_id = Column(Integer, ForeignKey("sections.section_id"), nullable=False)
    defect_type = Column(String, nullable=False)
    defect_severity = Column(SmallInteger, nullable=False)
    days_overdue = Column(Integer, nullable=False, default=0)
    reported_at = Column(DateTime, server_default=func.now())
    urgency_score = Column(Numeric, nullable=True)
    status = Column(String, nullable=False, default="PENDING")

    __table_args__ = (
        CheckConstraint("department IN ('ENGINEERING','SIGNAL_TELECOM','TRACTION_DISTRIBUTION')", name="chk_task_department"),
        CheckConstraint("defect_severity BETWEEN 1 AND 5", name="chk_task_severity"),
        CheckConstraint("status IN ('PENDING','SCORED','SCHEDULED','COMPLETED')", name="chk_task_status"),
    )

    section = relationship("Section")

class BlockSchedule(Base):
    __tablename__ = "block_schedule"

    block_id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("maintenance_tasks.task_id"), nullable=False)
    section_id = Column(Integer, ForeignKey("sections.section_id"), nullable=False)
    slot_date = Column(Date, nullable=False)
    start_hour = Column(SmallInteger, nullable=False)
    end_hour = Column(SmallInteger, nullable=False)
    horizon = Column(String, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    approved_by_control_office = Column(Boolean, nullable=False, default=False)

    __table_args__ = (
        CheckConstraint("horizon IN ('WEEKLY','MONTHLY')", name="chk_block_horizon"),
    )

    task = relationship("MaintenanceTask")
    section = relationship("Section")
