import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  ArrowRight
} from 'lucide-react';
import GradientBackground from '../components/GradientBackground';
import { Navbar } from './Home/components/Navbar';
import { ScrollReveal, ScrollLine } from '../components/motion/ScrollSystem';
import styles from './Maintenance.module.css';
import { PageEntryReveal } from '../components/PageEntryReveal';

// --- Count-up helper component for clean numerical transitions ---
const CountUp: React.FC<{ value: number; decimals?: number }> = ({ value, decimals = 0 }) => {
  const [current, setCurrent] = useState(0);
  React.useEffect(() => {
    let start = 0;
    const end = value;
    const duration = 800; // ms
    const stepTime = 16;
    const steps = duration / stepTime;
    const increment = (end - start) / steps;
    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      setCurrent(prev => {
        const next = prev + increment;
        if (currentStep >= steps) {
          clearInterval(timer);
          return end;
        }
        return next;
      });
    }, stepTime);
    return () => clearInterval(timer);
  }, [value]);
  return <>{decimals > 0 ? current.toFixed(decimals) : Math.floor(current)}</>;
};

// --- Premium Motion Variations ---
const pageVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05
    }
  }
};

const headerEyebrowVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] }
  }
};

const headerTitleVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: 0.08 }
  }
};

const headerDescVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.16 }
  }
};

const childVariants = {
  hidden: { opacity: 0, y: 14, scale: 0.985 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] }
  }
};

const sectionRevealVariants = {
  hidden: { opacity: 0, y: 25 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] }
  }
};

type PriorityType = 'All' | 'Critical' | 'High' | 'Medium' | 'Low';

interface TaskRecord {
  id: string;
  asset: string;
  defect: string;
  dept: string;
  priority: string;
  due: string;
  status: string;
  criticality: number;
  severity: string;
  overdue: number;
  frequency: string;
  traffic: string;
  recommendWindow: string;
  compatible: string;
  downtime: string;
}

const mockTasks: TaskRecord[] = [
  { 
    id: 'TSK-892', 
    asset: 'Track Segment T1', 
    defect: 'Rail weld crack at KM 42.4', 
    dept: 'Engineering', 
    priority: 'Critical', 
    due: 'Today', 
    status: 'Urgent', 
    criticality: 94, 
    severity: 'High', 
    overdue: 12, 
    frequency: '4 occurrences', 
    traffic: 'High', 
    recommendWindow: '10:30 — 12:00', 
    compatible: 'S&T Point Machine Maintenance', 
    downtime: '2.5 Hours' 
  },
  { 
    id: 'TSK-904', 
    asset: 'Junction Point 4A', 
    defect: 'Point machine feedback error', 
    dept: 'S&T', 
    priority: 'High', 
    due: 'Tomorrow', 
    status: 'Open', 
    criticality: 88, 
    severity: 'High', 
    overdue: 3, 
    frequency: '2 occurrences', 
    traffic: 'High', 
    recommendWindow: '14:00 — 15:30', 
    compatible: 'Track Inspection', 
    downtime: '1.5 Hours' 
  },
  { 
    id: 'TSK-911', 
    asset: 'OHE Line 3', 
    defect: 'Overhead wire sag detected', 
    dept: 'Traction', 
    priority: 'High', 
    due: 'Today', 
    status: 'Assigned', 
    criticality: 82, 
    severity: 'Medium', 
    overdue: 1, 
    frequency: '1 occurrence', 
    traffic: 'Medium', 
    recommendWindow: '11:00 — 12:30', 
    compatible: 'Insulator Cleaning', 
    downtime: '2.0 Hours' 
  },
  { 
    id: 'TSK-924', 
    asset: 'Bridge 104', 
    defect: 'Expansion joint concrete wear', 
    dept: 'Engineering', 
    priority: 'Medium', 
    due: 'In 3 Days', 
    status: 'Scheduled', 
    criticality: 78, 
    severity: 'Medium', 
    overdue: 0, 
    frequency: '3 occurrences', 
    traffic: 'Low', 
    recommendWindow: '08:00 — 10:00', 
    compatible: 'Track Grinding', 
    downtime: '3.0 Hours' 
  },
  { 
    id: 'TSK-935', 
    asset: 'Signal S12', 
    defect: 'Aspect lamp voltage fluctuation', 
    dept: 'S&T', 
    priority: 'Low', 
    due: 'In 5 Days', 
    status: 'Open', 
    criticality: 65, 
    severity: 'Low', 
    overdue: 0, 
    frequency: '0 occurrences', 
    traffic: 'Medium', 
    recommendWindow: '15:00 — 16:30', 
    compatible: 'Cable Routing Checks', 
    downtime: '1.0 Hours' 
  }
];

const mockRiskAssets = [
  { name: 'Track Segment T1', risk: 'HIGH RISK', val: 94, state: 'Critical', intervention: 'S&T block sync' },
  { name: 'Junction Point 4A', risk: 'HIGH RISK', val: 88, state: 'Critical', intervention: 'Inspection' },
  { name: 'OHE Line 3', risk: 'ELEVATED', val: 76, state: 'Elevated', intervention: 'Tension check' },
  { name: 'Bridge 104', risk: 'ELEVATED', val: 71, state: 'Elevated', intervention: 'Concrete patching' },
  { name: 'Signal S12', risk: 'STABLE', val: 42, state: 'Stable', intervention: 'Aspect bulb change' },
];

const mockInterventions = [
  { date: '10 AUG 2026', asset: 'Track Segment T1', intervention: 'Joint inspection & bolting', dept: 'Engineering', result: 'COMPLETED' },
  { date: '15 JUL 2026', asset: 'Track Segment T1', intervention: 'Ballast dressing', dept: 'Engineering', result: 'COMPLETED' },
  { date: '28 JUN 2026', asset: 'Junction Point 4A', intervention: 'Switch rail replacement', dept: 'Engineering', result: 'COMPLETED' },
  { date: '12 JUN 2026', asset: 'Signal S12', intervention: 'Relay room module swap', dept: 'S&T', result: 'COMPLETED' },
  { date: '04 JUN 2026', asset: 'OHE Line 3', intervention: 'Tension wire adjustment', dept: 'Traction', result: 'COMPLETED' },
];

const workflowSteps = [
  { name: 'Detected', count: 47 },
  { name: 'Prioritized', count: 32 },
  { name: 'Assigned', count: 18 },
  { name: 'Scheduled', count: 11 },
  { name: 'Executing', count: 5 },
  { name: 'Verified', count: 26 }
];

export const Maintenance: React.FC = () => {
  const [selectedTask, setSelectedTask] = useState<TaskRecord>(mockTasks[0]);
  const [filterPriority, setFilterPriority] = useState<PriorityType>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Filter tasks based on triage selections, search text, and dropdowns
  const filteredTasks = mockTasks.filter(task => {
    const matchesPriority = filterPriority === 'All' || task.priority.toLowerCase() === filterPriority.toLowerCase();
    const matchesSearch = task.asset.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          task.defect.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          task.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = deptFilter === 'All' || task.dept.toLowerCase() === deptFilter.toLowerCase();
    const matchesStatus = statusFilter === 'All' || task.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesPriority && matchesSearch && matchesDept && matchesStatus;
  });

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical':
        return styles.badgeCritical;
      case 'high':
        return styles.badgeHigh;
      case 'medium':
        return styles.badgeMedium;
      default:
        return styles.badgeLow;
    }
  };

  const getRiskLabelClass = (state: string) => {
    switch (state.toLowerCase()) {
      case 'critical':
        return styles.riskHigh;
      case 'elevated':
        return styles.riskElevated;
      default:
        return styles.riskStable;
    }
  };

  const getRiskBarClass = (state: string) => {
    switch (state.toLowerCase()) {
      case 'critical':
        return styles.riskBarCritical;
      case 'elevated':
        return styles.riskBarElevated;
      default:
        return styles.riskBarStable;
    }
  };

  return (
    <div className={styles.maintenanceContainer}>
      <GradientBackground
        gradientOrigin="bottom-middle"
        noiseIntensity={0.65}
        noisePatternAlpha={30}
        noisePatternSize={90}
        noisePatternRefreshInterval={2}
        colors={[
          { color: 'rgba(210,186,152,1)', stop: '10.5%' },
          { color: 'rgba(222,200,168,1)', stop: '16%' },
          { color: 'rgba(232,212,182,1)', stop: '17.5%' },
          { color: 'rgba(240,224,200,1)', stop: '25%' },
          { color: 'rgba(245,233,215,1)', stop: '40%' },
          { color: 'rgba(248,240,228,1)', stop: '65%' },
          { color: 'rgba(252,248,240,1)', stop: '100%' },
        ]}
        style={{ position: 'fixed', inset: 0, zIndex: -1 }}
      />

      {/* PRIMARY GLOBAL NAVBAR */}
      <div className={styles.navbarRelativeWrap}>
        <Navbar />
      </div>

      <motion.main 
        className={styles.contentArea}
        variants={pageVariants}
        initial="hidden"
        animate="visible"
      >
        {/* S01: HERO SECTION */}
        <section className={styles.heroRow}>
          <div className={styles.heroLeft}>
            <PageEntryReveal delay={0.15} duration={1.1}>
              <motion.span className={styles.eyebrow} variants={headerEyebrowVariants}>
                OPERATIONS CONSOLE
              </motion.span>
            </PageEntryReveal>
            
            <div style={{ margin: '4px 0' }}>
              <PageEntryReveal delay={0.35} duration={1.25}>
                <motion.h1 className={styles.pageTitle} variants={headerTitleVariants}>
                  Maintenance Control
                </motion.h1>
              </PageEntryReveal>
            </div>
            
            <motion.p className={styles.subtitle} variants={headerDescVariants}>
              Prioritize defects, understand asset risk, and move critical maintenance into the right operational window.
            </motion.p>
          </div>
          <motion.div className={styles.heroRight} variants={childVariants}>
            <div className={styles.statusIndicatorBlock}>
              <span className={styles.indicatorLabel}>OPEN TASKS</span>
              <span className={styles.indicatorValue}>
                <CountUp value={47} />
              </span>
            </div>
            <div style={{ width: '1px', height: '32px', backgroundColor: 'var(--color-border)', alignSelf: 'center' }} />
            <div className={styles.statusIndicatorBlock}>
              <span className={styles.indicatorLabel}>CRITICAL</span>
              <span className={`${styles.indicatorValue} ${styles.indicatorValueCritical}`}>
                <CountUp value={8} />
              </span>
            </div>
          </motion.div>
        </section>

        {/* S02: HEALTH STRIP */}
        <motion.section className={styles.healthStrip} variants={childVariants}>
          <div className={styles.healthMetric}>
            <span className={styles.metricLabel}>OPEN TASKS</span>
            <span className={styles.metricValue}>
              <CountUp value={47} />
            </span>
          </div>
          <div className={styles.healthMetric}>
            <span className={styles.metricLabel}>CRITICAL</span>
            <span className={`${styles.metricValue} ${styles.metricValueCritical}`}>
              <CountUp value={8} />
            </span>
          </div>
          <div className={styles.healthMetric}>
            <span className={styles.metricLabel}>OVERDUE</span>
            <span className={styles.metricValue}>
              <CountUp value={12} />
            </span>
          </div>
          <div className={styles.healthMetric}>
            <span className={styles.metricLabel}>AVG. RESOLUTION</span>
            <span className={styles.metricValue}>
              <CountUp value={2.8} decimals={1} /> DAYS
            </span>
          </div>
        </motion.section>

        <ScrollLine />

        {/* S03: TRIAGE CONTROL */}
        <motion.section 
          className={styles.triageContainer} 
          variants={sectionRevealVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          <ScrollReveal>
            <div className={styles.sectionHeader}>
              <span className={`${styles.sectionEyebrow} reveal-target`}>RISK SPECTRUM</span>
              <h2 className={`${styles.sectionTitle} reveal-target`}>Maintenance Triage</h2>
              <div className="reveal-line" style={{ height: '1.5px', backgroundColor: 'var(--color-border)', width: '100%', transformOrigin: 'left', margin: '0.5rem 0 1rem' }} />
              <p className={`${styles.sectionDesc} reveal-target`}>
                TEJAS ranks maintenance activity using asset condition, defect severity, operational impact and urgency.
              </p>
            </div>
          </ScrollReveal>

          <div className={styles.prioritySpectrum}>
            {[
              { level: 'Critical', count: 8, percentage: 40, theme: styles.priorityCritical },
              { level: 'High', count: 14, percentage: 65, theme: '' },
              { level: 'Medium', count: 17, percentage: 80, theme: '' },
              { level: 'Low', count: 8, percentage: 35, theme: '' }
            ].map((p) => (
              <motion.button
                key={p.level}
                onClick={() => setFilterPriority(p.level as PriorityType)}
                className={`${styles.priorityCard} ${p.theme} ${filterPriority.toLowerCase() === p.level.toLowerCase() ? styles.priorityCardActive : ''}`}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className={styles.priorityCardHeader}>
                  <span className={styles.priorityCardName}>{p.level}</span>
                  <span className={styles.priorityCardCount}>{p.count}</span>
                </div>
                <div className={styles.priorityBarTrack}>
                  <motion.div 
                    className={styles.priorityBarFill} 
                    initial={{ width: 0 }}
                    whileInView={{ width: `${p.percentage}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
              </motion.button>
            ))}
          </div>
        </motion.section>

        {/* S04 & S05: WORKSPACE SPLIT (QUEUE + DETAIL) */}
        <motion.section 
          className={styles.workspaceSplit}
          variants={sectionRevealVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          {/* QUEUE */}
          <div className={styles.taskQueueContainer}>
            <div className={styles.triageFilterRow}>
              <div className={styles.filterTabs}>
                {['All', 'Critical', 'High', 'Medium', 'Low'].map((p) => (
                  <button
                    key={p}
                    onClick={() => setFilterPriority(p as PriorityType)}
                    className={`${styles.filterTab} ${filterPriority === p ? styles.filterTabActive : ''}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <div className={styles.searchBoxWrap}>
                <Search className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Search task, asset or defect..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles.searchInput}
                />
              </div>
              <div className={styles.extraFilters}>
                <select 
                  value={deptFilter} 
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className={styles.selectFilter}
                >
                  <option value="All">All Departments</option>
                  <option value="Engineering">Engineering</option>
                  <option value="S&T">S&T</option>
                  <option value="Traction">Traction</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={styles.selectFilter}
                >
                  <option value="All">All Statuses</option>
                  <option value="Urgent">Urgent</option>
                  <option value="Open">Open</option>
                  <option value="Assigned">Assigned</option>
                  <option value="Scheduled">Scheduled</option>
                </select>
              </div>
            </div>

            <div className={styles.queueList}>
              <AnimatePresence mode="popLayout">
                {filteredTasks.map((task) => (
                  <motion.div
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    className={`${styles.queueRow} ${selectedTask.id === task.id ? styles.queueRowActive : ''}`}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                  >
                    <span className={styles.colId}>{task.id}</span>
                    <span className={styles.colAsset}>{task.asset}</span>
                    <span className={styles.colDefect}>{task.defect}</span>
                    <span className={styles.colDept}>{task.dept}</span>
                    <div className={styles.colPriority}>
                      <span className={`${styles.badge} ${getPriorityBadgeClass(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {filteredTasks.length === 0 && (
                <p style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>
                  No tasks matched your active filter.
                </p>
              )}
            </div>
          </div>

          {/* DETAIL PANEL */}
          <AnimatePresence mode="wait">
            <motion.div 
              className={styles.detailPanel} 
              key={selectedTask.id}
              initial={{ opacity: 0, x: 15, y: 5 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: -10, y: -5 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className={styles.detailHeader}>
                <span className={styles.detailAssetType}>{selectedTask.dept} • {selectedTask.id}</span>
                <motion.h3 
                  className={styles.detailAssetTitle}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.05 }}
                >
                  {selectedTask.asset}
                </motion.h3>
                <p className={styles.detailDefect}>{selectedTask.defect}</p>
              </div>

              <div className={styles.infoGrid}>
                <div className={styles.infoBlock}>
                  <span className={styles.infoLabel}>PRIORITY</span>
                  <span className={`${styles.infoValue} ${styles.infoValueHighlight}`}>{selectedTask.priority}</span>
                </div>
                <div className={styles.infoBlock}>
                  <span className={styles.infoLabel}>ASSET CRITICALITY</span>
                  <span className={styles.infoValue}>{selectedTask.criticality}%</span>
                </div>
                <div className={styles.infoBlock}>
                  <span className={styles.infoLabel}>DEFECT SEVERITY</span>
                  <span className={styles.infoValue}>{selectedTask.severity}</span>
                </div>
                <div className={styles.infoBlock}>
                  <span className={styles.infoLabel}>DAYS OVERDUE</span>
                  <span className={styles.infoValue}>{selectedTask.overdue} Days</span>
                </div>
                <div className={styles.infoBlock}>
                  <span className={styles.infoLabel}>FAILURE FREQUENCY</span>
                  <span className={styles.infoValue}>{selectedTask.frequency}</span>
                </div>
                <div className={styles.infoBlock}>
                  <span className={styles.infoLabel}>TRAFFIC IMPACT</span>
                  <span className={styles.infoValue}>{selectedTask.traffic}</span>
                </div>
              </div>

              {/* S06: AI RECOMMENDATION */}
              <div className={styles.recommendSection}>
                <span className={styles.recommendEyebrow}>TEJAS RECOMMENDS</span>
                <h4 className={styles.recommendTitle}>
                  ALLOCATE PRIORITY BLOCK WINDOW WITHIN 24H
                </h4>
                <p className={styles.recommendReason}>
                  "Asset criticality of {selectedTask.criticality}%, defect severity, and primary-route traffic impact indicate that delaying this intervention increases operational exposure."
                </p>

                <div className={styles.recommendMetrics}>
                  <div>
                    <span className={styles.recommendMetricLabel}>RECOMMENDED WINDOW</span>
                    <div className={styles.recommendMetricValue}>{selectedTask.recommendWindow}</div>
                  </div>
                  <div>
                    <span className={styles.recommendMetricLabel}>COMPATIBLE WORK</span>
                    <div className={styles.recommendMetricValue}>{selectedTask.compatible}</div>
                  </div>
                  <div>
                    <span className={styles.recommendMetricLabel}>ESTIMATED IMPACT</span>
                    <div className={styles.recommendMetricValue}>{selectedTask.downtime} downtime</div>
                  </div>
                </div>

                <div className={styles.recommendActionRow}>
                  <motion.button 
                    className={styles.recommendBtn}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    VIEW OPTIMIZATION
                    <ArrowRight width={12} height={12} />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.section>

        {/* S07: ASSET RISK / CONDITION */}
        <motion.section 
          className={styles.riskContainer} 
          variants={sectionRevealVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          <ScrollReveal>
            <div className={styles.sectionHeader}>
              <span className={`${styles.sectionEyebrow} reveal-target`}>RISK EVALUATION</span>
              <h2 className={`${styles.sectionTitle} reveal-target`}>Asset Risk</h2>
              <div className="reveal-line" style={{ height: '1.5px', backgroundColor: 'var(--color-border)', width: '100%', transformOrigin: 'left', margin: '0.5rem 0 1rem' }} />
              <p className={`${styles.sectionDesc} reveal-target`}>
                Horizontal condition mapping of core segments and critical railway hardware assets requiring operational review.
              </p>
            </div>
          </ScrollReveal>

          <div className={styles.riskGrid}>
            {mockRiskAssets.map((asset, idx) => (
              <div key={asset.name} className={styles.riskRow}>
                <span className={styles.riskAssetName}>{asset.name}</span>
                <span className={`${styles.riskLabel} ${getRiskLabelClass(asset.state)}`}>{asset.risk}</span>
                <div className={styles.riskBarContainer}>
                  <motion.div 
                    className={`${styles.riskBarFill} ${getRiskBarClass(asset.state)}`} 
                    initial={{ width: 0 }}
                    whileInView={{ width: `${asset.val}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
                <span className={styles.riskNextIntervention}>Next Intervention: {asset.intervention}</span>
              </div>
            ))}
          </div>
        </motion.section>

        <ScrollLine />

        {/* S08: WORKFLOW LIFECYCLE */}
        <motion.section 
          className={styles.workflowContainer} 
          variants={sectionRevealVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          <ScrollReveal>
            <div className={styles.sectionHeader}>
              <span className={`${styles.sectionEyebrow} reveal-target`}>LIFECYCLE STATUS</span>
              <h2 className={`${styles.sectionTitle} reveal-target`}>From Defect to Resolution</h2>
              <div className="reveal-line" style={{ height: '1.5px', backgroundColor: 'var(--color-border)', width: '100%', transformOrigin: 'left', margin: '0.5rem 0 1rem' }} />
              <p className={`${styles.sectionDesc} reveal-target`}>
                Unified tracking of operational stages for all reported Indian Railways maintenance tasks.
              </p>
            </div>
          </ScrollReveal>

          <div className={styles.workflowTrack}>
            {workflowSteps.map((step, idx) => (
              <motion.div 
                key={step.name} 
                className={`${styles.workflowStep} ${step.name === 'Executing' ? styles.workflowStepActive : ''}`}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
              >
                <span className={styles.stepCount}>{step.count}</span>
                <span className={styles.stepName}>{step.name}</span>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* S09: RECENT INTERVENTIONS */}
        <motion.section 
          className={styles.interventionsList} 
          variants={sectionRevealVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          <div className={styles.sectionHeader}>
            <span className={styles.sectionEyebrow}>HISTORY LOG</span>
            <h2 className={styles.sectionTitle}>Recent Interventions</h2>
            <p className={styles.sectionDesc}>
              A chronological ledger of recently resolved maintenance activities and operational results.
            </p>
          </div>

          <div className={styles.interventionsList}>
            {mockInterventions.map((item, idx) => (
              <motion.div 
                key={idx} 
                className={styles.interventionRow}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
              >
                <span className={styles.intDate}>{item.date}</span>
                <span className={styles.intAsset}>{item.asset}</span>
                <span className={styles.intDesc}>{item.intervention}</span>
                <span className={styles.intResult}>{item.result}</span>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* S10: ACTION BOTTOM AREA */}
        <motion.footer 
          className={styles.actionFooter} 
          variants={sectionRevealVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <motion.button 
            className={styles.btnSecondary}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
          >
            EXPORT MAINTENANCE REPORT
          </motion.button>
          <motion.button 
            className={styles.btnSecondary}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
          >
            VIEW ALL TASKS
          </motion.button>
          <motion.button 
            className={styles.btnPrimary}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
          >
            + CREATE MAINTENANCE TASK
          </motion.button>
        </motion.footer>
      </motion.main>
    </div>
  );
};

export default Maintenance;
