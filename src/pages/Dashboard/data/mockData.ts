export interface KpiCardData {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  status: string;
}

export interface TaskRecord {
  id: string;
  department: 'Engineering' | 'S&T' | 'Traction';
  asset: string;
  defect: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  due: string;
  status: 'Pending' | 'Scheduled' | 'In Progress';
}

export interface TimelineBlock {
  id: string;
  department: 'Engineering' | 'S&T' | 'Traction';
  title: string;
  startHour: number; // e.g. 9 for 09:00
  durationHours: number;
  description: string;
  coordinatedWith?: string[]; // IDs of other blocks it overlaps with
}

export interface TrendPoint {
  day: string;
  availability: number;
  target: number;
}

export interface ActivityLog {
  id: string;
  time: string;
  event: string;
  user: string;
  type: 'task' | 'defect' | 'block' | 'opt';
}

// KPI Data
export const kpis: KpiCardData[] = [
  { title: 'Asset Availability', value: '99.4%', change: '+0.2% vs yesterday', isPositive: true, status: 'OPTIMAL' },
  { title: 'Active Blocks', value: '8', change: '4 scheduled for today', isPositive: true, status: 'RUNNING' },
  { title: 'Pending Maintenance Tasks', value: '47', change: '-3 resolved today', isPositive: true, status: 'STABLE' },
  { title: 'Block Utilization', value: '92.1%', change: '+1.5% this week', isPositive: true, status: 'EFFICIENT' },
];

// Maintenance Priority Distribution
export const priorityDistribution = [
  { priority: 'Critical', count: 4, color: 'var(--color-critical, #bc473a)' },
  { priority: 'High', count: 12, color: '#e59866' },
  { priority: 'Medium', count: 19, color: 'var(--color-primary, #d2b48c)' },
  { priority: 'Low', count: 12, color: 'var(--color-text-muted, #8a7e72)' },
];

// Gantt-style Coordinated Block Timeline
export const timelineBlocks: TimelineBlock[] = [
  {
    id: 'b1',
    department: 'Engineering',
    title: 'Track Tamping (Line 1)',
    startHour: 8,
    durationHours: 4,
    description: 'Track stabilization and alignment corrections between KM 45 and KM 48.',
    coordinatedWith: ['b2', 'b3']
  },
  {
    id: 'b2',
    department: 'S&T',
    title: 'Signal Cable Replacement',
    startHour: 9,
    durationHours: 2.5,
    description: 'Replacing aging signaling cables crossing Track Line 1 at junction KM 46.',
    coordinatedWith: ['b1']
  },
  {
    id: 'b3',
    department: 'Traction',
    title: 'OHE Bracket Inspection',
    startHour: 10,
    durationHours: 2,
    description: 'Inspecting overhead equipment brackets and tension regulators.',
    coordinatedWith: ['b1']
  },
  {
    id: 'b4',
    department: 'Engineering',
    title: 'Sleeper Replacement',
    startHour: 13,
    durationHours: 3.5,
    description: 'Manual replacement of worn concrete sleepers at station loop line.'
  },
  {
    id: 'b5',
    department: 'S&T',
    title: 'Point Machine Lubrication',
    startHour: 14.5,
    durationHours: 1.5,
    description: 'Routine preventive maintenance on junction points 4A and 4B.'
  }
];

// AI Coordinated Block Recommendation
export const aiRecommendation = {
  title: 'Coordinated Block Opportunity Detected',
  description: 'TEJAS Optimizer identified 3 high-priority tasks from different departments that can be bundled into a single coordinated block window today.',
  tasksCombined: [
    'ENG-204 (Track stabilization)',
    'SNT-409 (Signal cable replacements)',
    'TRD-102 (Overhead OHE bracket check)'
  ],
  savedDowntime: '2.5 Hours saved (estimated)',
  suggestedWindow: '10:00 AM - 12:00 PM (120 Mins)',
  optimizationTarget: 'CP-SAT Block Alignment v4.2'
};

// High Priority Tasks
export const highPriorityTasks: TaskRecord[] = [
  {
    id: 'TSK-892',
    department: 'Engineering',
    asset: 'Track Segment T1',
    defect: 'Rail weld crack at KM 42.4',
    priority: 'Critical',
    due: 'Today, 18:00',
    status: 'In Progress'
  },
  {
    id: 'TSK-904',
    department: 'S&T',
    asset: 'Junction Point 4A',
    defect: 'Point machine feedback error',
    priority: 'Critical',
    due: 'Today, 20:00',
    status: 'Scheduled'
  },
  {
    id: 'TSK-911',
    department: 'Traction',
    asset: 'OHE Line 3',
    defect: 'Overhead wire sag detected',
    priority: 'High',
    due: 'Tomorrow, 12:00',
    status: 'Pending'
  },
  {
    id: 'TSK-873',
    department: 'Engineering',
    asset: 'Bridge 104',
    defect: 'Expansion joint concrete wear',
    priority: 'High',
    due: 'In 2 days',
    status: 'Pending'
  },
  {
    id: 'TSK-925',
    department: 'S&T',
    asset: 'Signal S12',
    defect: 'LED aspect cluster failure',
    priority: 'Medium',
    due: 'In 3 days',
    status: 'Pending'
  }
];

// 7-Day Asset Availability Trend
export const assetTrendData: TrendPoint[] = [
  { day: '23 Aug', availability: 98.9, target: 99.0 },
  { day: '24 Aug', availability: 99.1, target: 99.0 },
  { day: '25 Aug', availability: 99.0, target: 99.0 },
  { day: '26 Aug', availability: 99.3, target: 99.0 },
  { day: '27 Aug', availability: 99.2, target: 99.0 },
  { day: '28 Aug', availability: 99.2, target: 99.0 },
  { day: '29 Aug', availability: 99.4, target: 99.0 },
];

// Recent Activities
export const recentActivities: ActivityLog[] = [
  { id: '1', time: '14:24', event: 'Defect reported: Expansion joint wear on Bridge 104', user: 'ENG-INSP-2', type: 'defect' },
  { id: '2', time: '13:10', event: 'Coordinated block b3 approved for Traction OHE check', user: 'DY-COM-HQ', type: 'block' },
  { id: '3', time: '11:45', event: 'CP-SAT optimization job completed: 8 blocks scheduled', user: 'TEJAS-SYS', type: 'opt' },
  { id: '4', time: '09:12', event: 'New maintenance task generated: Point machine 4A', user: 'SNT-MON-1', type: 'task' },
];

// Quick Actions
export const quickActions = [
  { label: 'Create Maintenance Task', route: '/maintenance' },
  { label: 'View Defects', route: '/defects' },
  { label: 'Generate Block Plan', route: '/block-planning' },
  { label: 'Run Optimization', route: '/optimization' },
];

export interface AssetDetail {
  id: string;
  name: string;
  type: string;
  department: 'Engineering' | 'S&T' | 'Traction';
  condition: 'Optimal' | 'Degraded' | 'Critical';
  availability: string;
  lastMaintenance: string;
  upcomingMaintenance: string;
  defectsCount: number;
  maintenanceHistory: { date: string; action: string; status: string }[];
  failureHistory: { date: string; description: string }[];
}

export const mockAssets: AssetDetail[] = [
  {
    id: 'AST-101',
    name: 'Track Segment T1',
    type: 'Track Line',
    department: 'Engineering',
    condition: 'Critical',
    availability: '94.2%',
    lastMaintenance: '2026-08-10',
    upcomingMaintenance: 'Today (Urgent)',
    defectsCount: 3,
    maintenanceHistory: [
      { date: '2026-08-10', action: 'Joint inspection and bolting', status: 'Completed' },
      { date: '2026-07-15', action: 'Ballast dressing', status: 'Completed' }
    ],
    failureHistory: [
      { date: '2026-06-02', description: 'Minor alignment displacement' },
      { date: '2026-04-12', description: 'Sleeper cracking' }
    ]
  },
  {
    id: 'AST-202',
    name: 'Junction Point 4A',
    type: 'Point Machine',
    department: 'S&T',
    condition: 'Critical',
    availability: '97.8%',
    lastMaintenance: '2026-08-20',
    upcomingMaintenance: 'Today (Urgent)',
    defectsCount: 1,
    maintenanceHistory: [
      { date: '2026-08-20', action: 'Lubrication and calibration', status: 'Completed' }
    ],
    failureHistory: [
      { date: '2026-05-18', description: 'Feedback signal failure' }
    ]
  },
  {
    id: 'AST-303',
    name: 'OHE Line 3',
    type: 'Overhead Equipment',
    department: 'Traction',
    condition: 'Degraded',
    availability: '98.5%',
    lastMaintenance: '2026-08-15',
    upcomingMaintenance: 'Tomorrow',
    defectsCount: 2,
    maintenanceHistory: [
      { date: '2026-08-15', action: 'Contact wire height adjustment', status: 'Completed' }
    ],
    failureHistory: []
  },
  {
    id: 'AST-404',
    name: 'Bridge 104',
    type: 'Structural Bridge',
    department: 'Engineering',
    condition: 'Degraded',
    availability: '99.1%',
    lastMaintenance: '2026-07-01',
    upcomingMaintenance: 'In 2 days',
    defectsCount: 1,
    maintenanceHistory: [
      { date: '2026-07-01', action: 'Concrete reinforcement patching', status: 'Completed' }
    ],
    failureHistory: []
  },
  {
    id: 'AST-505',
    name: 'Signal S12',
    type: 'Color Light Signal',
    department: 'S&T',
    condition: 'Optimal',
    availability: '99.9%',
    lastMaintenance: '2026-08-01',
    upcomingMaintenance: 'In 3 days',
    defectsCount: 0,
    maintenanceHistory: [
      { date: '2026-08-01', action: 'LED aspect cluster swap', status: 'Completed' }
    ],
    failureHistory: []
  }
];
