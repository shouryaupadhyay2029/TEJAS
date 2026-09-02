import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict

class StationOut(BaseModel):
    station_id: int
    station_code: str
    station_name: str

    model_config = ConfigDict(from_attributes=True)

class SectionOut(BaseModel):
    section_id: int
    from_station_id: int
    to_station_id: int
    section_code: Optional[str] = None
    from_station: Optional[StationOut] = None
    to_station: Optional[StationOut] = None

    model_config = ConfigDict(from_attributes=True)

class SectionTrafficOut(BaseModel):
    section_id: int
    section_code: Optional[str] = None
    from_station_code: str
    from_station_name: str
    to_station_code: str
    to_station_name: str
    daily_train_count: int
    criticality_score: float
    last_computed_at: Optional[datetime.datetime] = None

    model_config = ConfigDict(from_attributes=True)

class MaintenanceTaskOut(BaseModel):
    task_id: int
    department: str
    section_id: int
    defect_type: str
    defect_severity: int
    days_overdue: int
    reported_at: Optional[datetime.datetime] = None
    urgency_score: Optional[float] = None
    status: str

    model_config = ConfigDict(from_attributes=True)

class MaintenanceTaskUrgencyUpdate(BaseModel):
    task_id: int
    urgency_score: float

class MaintenanceTaskForOptimizerOut(BaseModel):
    task_id: int
    department: str
    section_id: int
    section_code: Optional[str] = None
    from_station_name: str
    to_station_name: str
    defect_type: str
    defect_severity: int
    days_overdue: int
    urgency_score: Optional[float] = None
    status: str

    model_config = ConfigDict(from_attributes=True)

class TaskSkippedItem(BaseModel):
    task_id: int
    reason: str

class MaintenanceTaskBatchUrgencyResponse(BaseModel):
    updated: List[int]
    skipped: List[TaskSkippedItem]
    not_found: List[int]

class SlotItem(BaseModel):
    slot_date: datetime.date
    slot_hour: int
    is_free: bool
    train_count_in_slot: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)

class SectionAvailabilityOut(BaseModel):
    section_id: int
    slots: List[SlotItem]

    model_config = ConfigDict(from_attributes=True)

class SectionAvailabilityResponse(BaseModel):
    section_id: int
    slots: List[SlotItem]
    warning: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class BlockScheduleCreate(BaseModel):
    task_id: int
    section_id: int
    slot_date: datetime.date
    start_hour: int
    end_hour: int
    horizon: str
    approved_by_control_office: Optional[bool] = False

class BlockScheduleOut(BaseModel):
    block_id: int
    task_id: int
    section_id: int
    slot_date: datetime.date
    start_hour: int
    end_hour: int
    horizon: str
    created_at: Optional[datetime.datetime] = None
    approved_by_control_office: bool

    model_config = ConfigDict(from_attributes=True)

class BlockScheduleDetailOut(BaseModel):
    block_id: int
    task_id: int
    section_id: int
    section_code: Optional[str] = None
    from_station_name: str
    to_station_name: str
    department: str
    defect_type: str
    defect_severity: int
    urgency_score: Optional[float] = None
    slot_date: datetime.date
    start_hour: int
    end_hour: int
    horizon: str
    created_at: Optional[datetime.datetime] = None
    approved_by_control_office: bool

    model_config = ConfigDict(from_attributes=True)

class BlockScheduleBatchCreateResponse(BaseModel):
    created: List[int]
    skipped: List[TaskSkippedItem]
