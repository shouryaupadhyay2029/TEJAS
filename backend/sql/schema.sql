-- PostgreSQL Schema for TEJAS Railway Maintenance System

CREATE TABLE IF NOT EXISTS stations (
    station_id SERIAL PRIMARY KEY,
    station_code VARCHAR UNIQUE NOT NULL,
    station_name VARCHAR NOT NULL
);

CREATE TABLE IF NOT EXISTS trains (
    train_id SERIAL PRIMARY KEY,
    train_number VARCHAR UNIQUE NOT NULL,
    train_name VARCHAR,
    source_station_id INT REFERENCES stations(station_id),
    destination_station_id INT REFERENCES stations(station_id)
);

CREATE TABLE IF NOT EXISTS train_schedule (
    schedule_id SERIAL PRIMARY KEY,
    train_id INT NOT NULL REFERENCES trains(train_id),
    station_id INT NOT NULL REFERENCES stations(station_id),
    stop_sequence INT NOT NULL,
    arrival_time TIME,
    departure_time TIME,
    distance_km NUMERIC,
    UNIQUE(train_id, stop_sequence)
);

CREATE TABLE IF NOT EXISTS raw_timetable_staging (
    id SERIAL PRIMARY KEY,
    raw_row JSONB,
    loaded_at TIMESTAMP DEFAULT now(),
    processed BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS sections (
    section_id SERIAL PRIMARY KEY,
    from_station_id INT NOT NULL REFERENCES stations(station_id),
    to_station_id INT NOT NULL REFERENCES stations(station_id),
    section_code VARCHAR UNIQUE,
    UNIQUE(from_station_id, to_station_id)
);

CREATE TABLE IF NOT EXISTS section_train_movements (
    movement_id SERIAL PRIMARY KEY,
    section_id INT NOT NULL REFERENCES sections(section_id),
    train_id INT NOT NULL REFERENCES trains(train_id),
    departure_from_station TIME NOT NULL,
    arrival_at_station TIME NOT NULL,
    day_of_week SMALLINT
);

CREATE TABLE IF NOT EXISTS section_traffic_summary (
    section_id INT PRIMARY KEY REFERENCES sections(section_id),
    daily_train_count INT NOT NULL DEFAULT 0,
    criticality_score NUMERIC NOT NULL DEFAULT 0,
    last_computed_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS section_time_slots (
    slot_id SERIAL PRIMARY KEY,
    section_id INT NOT NULL REFERENCES sections(section_id),
    slot_date DATE NOT NULL,
    slot_hour SMALLINT NOT NULL CHECK (slot_hour BETWEEN 0 AND 23),
    is_free BOOLEAN NOT NULL,
    train_count_in_slot INT NOT NULL DEFAULT 0,
    UNIQUE(section_id, slot_date, slot_hour)
);

CREATE TABLE IF NOT EXISTS maintenance_tasks (
    task_id SERIAL PRIMARY KEY,
    department VARCHAR NOT NULL CHECK (department IN ('ENGINEERING','SIGNAL_TELECOM','TRACTION_DISTRIBUTION')),
    section_id INT NOT NULL REFERENCES sections(section_id),
    defect_type VARCHAR NOT NULL,
    defect_severity SMALLINT NOT NULL CHECK (defect_severity BETWEEN 1 AND 5),
    days_overdue INT NOT NULL DEFAULT 0,
    reported_at TIMESTAMP DEFAULT now(),
    urgency_score NUMERIC,
    status VARCHAR NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','SCORED','SCHEDULED','COMPLETED'))
);

CREATE TABLE IF NOT EXISTS block_schedule (
    block_id SERIAL PRIMARY KEY,
    task_id INT NOT NULL REFERENCES maintenance_tasks(task_id),
    section_id INT NOT NULL REFERENCES sections(section_id),
    slot_date DATE NOT NULL,
    start_hour SMALLINT NOT NULL,
    end_hour SMALLINT NOT NULL,
    horizon VARCHAR NOT NULL CHECK (horizon IN ('WEEKLY','MONTHLY')),
    created_at TIMESTAMP DEFAULT now(),
    approved_by_control_office BOOLEAN NOT NULL DEFAULT false
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_status ON maintenance_tasks(status);
CREATE INDEX IF NOT EXISTS idx_section_time_slots_sec_date ON section_time_slots(section_id, slot_date);
CREATE INDEX IF NOT EXISTS idx_block_schedule_sec_date ON block_schedule(section_id, slot_date);
