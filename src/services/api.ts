const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface MaintenanceTask {
  task_id: number;
  department: string;
  section_id: number;
  section_code?: string;
  from_station_name: string;
  to_station_name: string;
  defect_type: string;
  defect_severity: number;
  days_overdue: number;
  urgency_score: number | null;
  status: string;
}

export interface SectionTraffic {
  section_id: number;
  section_code?: string;
  from_station_code: string;
  from_station_name: string;
  to_station_code: string;
  to_station_name: string;
  daily_train_count: number;
  criticality_score: number;
  last_computed_at?: string;
}

export interface SlotItem {
  slot_date: string;
  slot_hour: number;
  is_free: boolean;
  train_count_in_slot: number;
}

export interface SectionAvailabilityResponse {
  section_id: number;
  slots: SlotItem[];
  warning?: string;
}

export interface BlockScheduleDetail {
  block_id: number;
  task_id: number;
  section_id: number;
  section_code?: string;
  from_station_name: string;
  to_station_name: string;
  department: string;
  defect_type: string;
  defect_severity: number;
  urgency_score: number | null;
  slot_date: string;
  start_hour: number;
  end_hour: number;
  horizon: string;
  created_at?: string;
  approved_by_control_office: boolean;
}

export async function fetchMaintenanceTasks(params?: {
  status?: string;
  department?: string;
  limit?: number;
  offset?: number;
}): Promise<MaintenanceTask[]> {
  const query = new URLSearchParams();
  if (params?.status) query.append('status', params.status);
  if (params?.department) query.append('department', params.department);
  if (params?.limit) query.append('limit', params.limit.toString());
  if (params?.offset) query.append('offset', params.offset.toString());

  const response = await fetch(`${API_BASE_URL}/maintenance-tasks/all?${query.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch maintenance tasks: HTTP ${response.status}`);
  }
  return response.json();
}

export async function fetchOptimizerPendingTasks(): Promise<MaintenanceTask[]> {
  const response = await fetch(`${API_BASE_URL}/maintenance-tasks/pending/for-optimizer`);
  if (!response.ok) {
    throw new Error(`Failed to fetch optimizer pending tasks: HTTP ${response.status}`);
  }
  return response.json();
}

export async function fetchSectionTrafficAll(params?: {
  limit?: number;
  offset?: number;
}): Promise<SectionTraffic[]> {
  const query = new URLSearchParams();
  if (params?.limit) query.append('limit', params.limit.toString());
  if (params?.offset) query.append('offset', params.offset.toString());

  const response = await fetch(`${API_BASE_URL}/sections/traffic/all?${query.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch section traffic: HTTP ${response.status}`);
  }
  return response.json();
}

export async function fetchSectionAvailability(
  sectionId: number,
  startDate?: string,
  endDate?: string
): Promise<SectionAvailabilityResponse> {
  const query = new URLSearchParams();
  if (startDate) query.append('start_date', startDate);
  if (endDate) query.append('end_date', endDate);

  const response = await fetch(`${API_BASE_URL}/sections/${sectionId}/availability?${query.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch section availability: HTTP ${response.status}`);
  }
  return response.json();
}

export async function fetchBlockSchedule(
  horizon: 'WEEKLY' | 'MONTHLY' = 'MONTHLY',
  startDate?: string,
  endDate?: string
): Promise<BlockScheduleDetail[]> {
  const query = new URLSearchParams();
  query.append('horizon', horizon);
  if (startDate) query.append('start_date', startDate);
  if (endDate) query.append('end_date', endDate);

  const response = await fetch(`${API_BASE_URL}/block-schedule?${query.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch block schedule: HTTP ${response.status}`);
  }
  return response.json();
}

export async function approveBlockSchedule(blockId: number): Promise<BlockScheduleDetail> {
  const response = await fetch(`${API_BASE_URL}/block-schedule/${blockId}/approve`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to approve block schedule: HTTP ${response.status}`);
  }
  return response.json();
}

export interface IncidentReportPayload {
  section_id: number;
  defect_type: string;
  defect_severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  department?: string;
  officer_notes?: string;
  inspection_datetime?: string;
  days_since_detected: number;
}

export interface IncidentReportResult {
  task_id: number;
  department: string;
  section_id: number;
  section_code?: string;
  from_station_name: string;
  to_station_name: string;
  defect_type: string;
  defect_severity: number;
  defect_severity_label: string;
  days_overdue: number;
  officer_notes?: string;
  reported_at?: string;
  urgency_score?: number | null;
  status: string;
  ml_scoring_succeeded: boolean;
}

export async function reportIncident(payload: IncidentReportPayload): Promise<IncidentReportResult> {
  const response = await fetch(`${API_BASE_URL}/maintenance-tasks/report`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Failed to report incident: HTTP ${response.status}`);
  }
  return response.json();
}

