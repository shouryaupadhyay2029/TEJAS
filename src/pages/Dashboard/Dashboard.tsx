import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, RotateCcw, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import GradientBackground from '../../components/GradientBackground';
import { Navbar } from '../Home/components/Navbar';
import {
  kpis,
  highPriorityTasks,
  timelineBlocks,
  assetTrendData,
  recentActivities,
  mockAssets,
  aiRecommendation
} from './data/mockData';
import type { AssetDetail, TaskRecord } from './data/mockData';
import styles from './Dashboard.module.css';
import { PageEntryReveal } from '../../components/PageEntryReveal';

type SectionType =
  | 'overview'
  | 'maintenance'
  | 'assets'
  | 'planning'
  | 'optimizer'
  | 'coordination'
  | 'live'
  | 'analytics'
  | 'alerts';

// --- Premium Motion Variations ---
const pageVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: [0.22, 1, 0.36, 1],
      staggerChildren: 0.05,
    }
  },
  exit: {
    opacity: 1
  }
};

const childVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] }
  }
};

export const Dashboard: React.FC = () => {
  const [activeSection, setActiveSection] = useState<SectionType>('overview');
  const [selectedTask, setSelectedTask] = useState<TaskRecord | null>(highPriorityTasks[0]);
  const [selectedAsset, setSelectedAsset] = useState<AssetDetail | null>(mockAssets[0]);
  const [assetSearch, setAssetSearch] = useState('');

  // States for interactive animations
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationComplete, setOptimizationComplete] = useState(false);
  const [hoveredCoordDept, setHoveredCoordDept] = useState<'Engineering' | 'S&T' | 'Traction' | null>(null);

  // Filter assets based on search query
  const filteredAssets = mockAssets.filter(
    (asset) =>
      asset.name.toLowerCase().includes(assetSearch.toLowerCase()) ||
      asset.id.toLowerCase().includes(assetSearch.toLowerCase()) ||
      asset.type.toLowerCase().includes(assetSearch.toLowerCase())
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return styles.explainValueCritical;
      case 'High':
        return styles.explainValueHigh;
      default:
        return '';
    }
  };

  const getProgressColorClass = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return styles.explainProgressCritical;
      case 'High':
        return styles.explainProgressHigh;
      default:
        return '';
    }
  };

  const triggerOptimization = () => {
    setIsOptimizing(true);
    setOptimizationComplete(false);
    setTimeout(() => {
      setIsOptimizing(false);
      setOptimizationComplete(true);
    }, 1800);
  };

  return (
    <div className={styles.dashboardContainer}>
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

      {/* PRIMARY NAVBAR */}
      <div className={styles.navbarRelativeWrap}>
        <Navbar />
      </div>

      {/* SECONDARY DASHBOARD NAVBAR */}
      <div className={styles.secondaryNavbar}>
        <div className={styles.secondaryNavContainer}>
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'maintenance', label: 'Maintenance Priority' },
            { id: 'assets', label: 'Asset Intelligence' },
            { id: 'planning', label: 'Block Planning' },
            { id: 'optimizer', label: 'Tejas Optimizer' },
            { id: 'coordination', label: 'Coordination Center' },
            { id: 'live', label: 'Live Operations' },
            { id: 'analytics', label: 'Analytics & Reports' },
            { id: 'alerts', label: 'Alerts & Decisions', badge: 3 },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id as SectionType)}
              className={`${styles.secondaryNavItem} ${activeSection === item.id ? styles.secondaryActiveNavItem : ''}`}
            >
              {item.label}
              {item.badge && <span className={styles.secondaryAlertBadge}>{item.badge}</span>}
              {activeSection === item.id && (
                <motion.span
                  layoutId="secondaryNavbarActiveLine"
                  className={styles.secondaryActiveLine}
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN WORKSPACE CONTENT */}
      <main className={styles.contentArea}>
        <AnimatePresence mode="wait">
          {/* S01: DASHBOARD OVERVIEW */}
          {activeSection === 'overview' && (
            <motion.div
              key="overview"
              variants={pageVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className={styles.workspaceHeaderWrap}>
                <div className={styles.workspaceHeader}>
                  <PageEntryReveal delay={0.15} duration={1.1}>
                    <span className={styles.headerEyebrow}>OPERATIONS CONSOLE</span>
                  </PageEntryReveal>
                  <div style={{ margin: '4px 0' }}>
                    <PageEntryReveal delay={0.35} duration={1.25}>
                      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 400 }}>Operations Overview</h1>
                    </PageEntryReveal>
                  </div>
                  <p>High-level summary of active blocks, tasks, and system observations.</p>
                </div>
                <div className={styles.headerStatus}>
                  <span className={styles.headerStatusDot} />
                  <span>SYSTEM STATUS: OPERATIONAL</span>
                </div>
              </div>
              <div style={{ height: '1.5px', backgroundColor: 'var(--color-border)' }} />

              {/* KPI Strip */}
              <motion.div variants={childVariants} className={styles.kpiGrid} style={{ marginTop: '2.5rem' }}>
                {kpis.map((kpi) => (
                  <div key={kpi.title} className={styles.kpiCard}>
                    <span className={styles.kpiLabel}>{kpi.title}</span>
                    <span className={styles.kpiValue}>{kpi.value}</span>
                    <div className={styles.kpiDivider} />
                    <span className={styles.kpiFooter}>{kpi.change}</span>
                  </div>
                ))}
              </motion.div>

              {/* Concise Status Area */}
              <motion.div variants={childVariants} className={styles.overviewStatusSection} style={{ marginTop: '3.5rem' }}>
                <h3 className={styles.kpiLabel}>Current Observations</h3>

                <div className={`${styles.statusCard} ${styles.statusCardCritical}`}>
                  <div className={`${styles.statusCardIndicator} ${styles.statusCardIndicatorCritical}`} />
                  <span className={`${styles.statusBadge} ${styles.statusBadgeCritical}`}>CRITICAL</span>
                  <div className={styles.statusText}>
                    <h4>Urgent Repairs Overdue</h4>
                    <p>2 high-priority maintenance tasks require immediate block allocation today.</p>
                  </div>
                </div>

                <div className={`${styles.statusCard} ${styles.statusCardConflict}`}>
                  <div className={`${styles.statusCardIndicator} ${styles.statusCardIndicatorConflict}`} />
                  <span className={`${styles.statusBadge} ${styles.statusBadgeConflict}`}>CONFLICT DETECTED</span>
                  <div className={styles.statusText}>
                    <h4>Block Schedule Overlap</h4>
                    <p>Engineering Track Stabilization and S&T Cable Replacement schedules overlap at 14:00 today.</p>
                  </div>
                </div>

                <div className={`${styles.statusCard} ${styles.statusCardOpportunity}`}>
                  <div className={`${styles.statusCardIndicator} ${styles.statusCardIndicatorOpportunity}`} />
                  <span className={`${styles.statusBadge} ${styles.statusBadgeOpportunity}`}>OPTIMIZATION OPT</span>
                  <div className={styles.statusText}>
                    <h4>Coordinated Window Recommendation</h4>
                    <p>3 compatible tasks can be aligned into a single block window to save 2.5 hours of track downtime.</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* S02: MAINTENANCE PRIORITY */}
          {activeSection === 'maintenance' && (
            <motion.div
              key="maintenance"
              variants={pageVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className={styles.workspaceHeaderWrap}>
                <div className={styles.workspaceHeader}>
                  <span className={styles.headerEyebrow}>OPERATIONS CONSOLE</span>
                  <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 400 }}>Maintenance Intelligence</h1>
                  <p>ML-driven task priority distribution and failure risk explanations.</p>
                </div>
                <div className={styles.headerStatus}>
                  <span>UPDATED: JUST NOW</span>
                </div>
              </div>
              <div style={{ height: '1.5px', backgroundColor: 'var(--color-border)' }} />

              <div className={styles.maintenanceGrid} style={{ marginTop: '2.5rem' }}>
                {/* Task List */}
                <motion.div variants={childVariants} className={styles.priorityListSection}>
                  <h3 className={styles.kpiLabel}>High Priority Task Queue</h3>
                  {highPriorityTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className={`${styles.taskItemCard} ${selectedTask?.id === task.id ? styles.taskItemActive : ''}`}
                    >
                      <div className={styles.taskHeader}>
                        <span className={styles.taskId}>{task.id}</span>
                        <span className={styles.taskDeptBadge}>{task.department}</span>
                      </div>
                      <h4 style={{ margin: '4px 0', fontSize: '0.85rem', fontWeight: '800' }}>{task.asset}</h4>
                      <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{task.defect}</p>
                    </div>
                  ))}
                </motion.div>

                {/* Visual Explanation Panel */}
                <motion.div variants={childVariants}>
                  <h3 className={styles.kpiLabel}>AI Decision Explanation</h3>
                  {selectedTask ? (
                    <div className={styles.explanationPanel}>
                      <span className={styles.kpiLabel}>Selected Asset</span>
                      <h2 className={styles.explanationTitle}>{selectedTask.asset}</h2>
                      
                      <div className={styles.explainRow}>
                        <div className={styles.explainRowMeta}>
                          <span className={styles.explainLabel}>Priority Class</span>
                          <span className={`${styles.explainValue} ${getPriorityColor(selectedTask.priority)}`}>
                            {selectedTask.priority.toUpperCase()}
                          </span>
                        </div>
                        <div className={styles.explainBar}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: selectedTask.priority === 'Critical' ? '100%' : '75%' }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                            className={`${styles.explainProgress} ${getProgressColorClass(selectedTask.priority)}`}
                          />
                        </div>
                      </div>

                      <div className={styles.explainRow}>
                        <div className={styles.explainRowMeta}>
                          <span className={styles.explainLabel}>Defect Severity Score</span>
                          <span className={styles.explainValue}>HIGH</span>
                        </div>
                        <div className={styles.explainBar}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: '85%' }}
                            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
                            className={`${styles.explainProgress} ${styles.explainProgressCritical}`}
                          />
                        </div>
                      </div>

                      <div className={styles.explainRow}>
                        <div className={styles.explainRowMeta}>
                          <span className={styles.explainLabel}>Asset Criticality Index</span>
                          <span className={styles.explainValue}>94% (Class A)</span>
                        </div>
                        <div className={styles.explainBar}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: '94%' }}
                            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
                            className={`${styles.explainProgress} ${styles.explainProgressHigh}`}
                          />
                        </div>
                      </div>

                      <div className={styles.explainRow}>
                        <div className={styles.explainRowMeta}>
                          <span className={styles.explainLabel}>Days Overdue</span>
                          <span className={styles.explainValue}>12 days</span>
                        </div>
                        <div className={styles.explainBar}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: '60%' }}
                            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.3 }}
                            className={`${styles.explainProgress} ${styles.explainProgressCritical}`}
                          />
                        </div>
                      </div>

                      <div className={styles.explainRow}>
                        <div className={styles.explainRowMeta}>
                          <span className={styles.explainLabel}>Observed Failure Frequency</span>
                          <span className={styles.explainValue}>4 previous occurrences</span>
                        </div>
                        <div className={styles.explainBar}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: '40%' }}
                            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.4 }}
                            className={`${styles.explainProgress} ${styles.explainProgressHigh}`}
                          />
                        </div>
                      </div>

                      <div className={styles.explainRow}>
                        <div className={styles.explainRowMeta}>
                          <span className={styles.explainLabel}>Operational Traffic Impact</span>
                          <span className={styles.explainValue}>HIGH (Primary trunk line)</span>
                        </div>
                        <div className={styles.explainBar}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: '90%' }}
                            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.5 }}
                            className={`${styles.explainProgress} ${styles.explainProgressCritical}`}
                          />
                        </div>
                      </div>

                      <div className={styles.aiRecommendationBox}>
                        <span className={styles.kpiLabel} style={{ color: 'var(--color-text-secondary)' }}>TEJAS AI RECOMMENDATION</span>
                        <p style={{ fontSize: '0.78rem', color: 'var(--color-text-primary)', margin: '6px 0 0', lineHeight: '1.45', fontWeight: '700' }}>
                          "Allocate priority block window within the next 24 hours. Compatible with S&T Point Machine maintenance."
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.explanationPanel} style={{ textAlign: 'center', padding: '3rem' }}>
                      <p style={{ color: 'var(--color-text-muted)' }}>Select a task to explain priority logic</p>
                    </div>
                  )}
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* S03: ASSET INTELLIGENCE */}
          {activeSection === 'assets' && (
            <motion.div
              key="assets"
              variants={pageVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className={styles.workspaceHeaderWrap}>
                <div className={styles.workspaceHeader}>
                  <span className={styles.headerEyebrow}>OPERATIONS CONSOLE</span>
                  <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 400 }}>Asset Intelligence</h1>
                  <p>Search, trace condition indices, and audit asset service records.</p>
                </div>
                <div className={styles.headerStatus}>
                  <span>5 TOTAL ASSETS AUDITED</span>
                </div>
              </div>
              <div style={{ height: '1.5px', backgroundColor: 'var(--color-border)' }} />

              <motion.div variants={childVariants} style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem' }}>
                <Search size={18} style={{ alignSelf: 'center', color: 'var(--color-text-muted)' }} />
                <input
                  type="text"
                  placeholder="Filter assets by ID, name, or type..."
                  className={styles.searchBar}
                  value={assetSearch}
                  onChange={(e) => setAssetSearch(e.target.value)}
                />
              </motion.div>

              <div className={styles.assetsFlexLayout} style={{ marginTop: '2rem' }}>
                {/* Asset Table */}
                <motion.div variants={childVariants} className={styles.assetsTableWrapper}>
                  <table className={styles.assetsTable}>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Asset Name</th>
                        <th>Type</th>
                        <th>Department</th>
                        <th>Condition</th>
                        <th>Availability</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAssets.map((asset) => (
                        <tr
                          key={asset.id}
                          onClick={() => setSelectedAsset(asset)}
                          className={selectedAsset?.id === asset.id ? styles.assetsTableTrActive : ''}
                        >
                          <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)', fontWeight: '700' }}>{asset.id}</td>
                          <td style={{ fontWeight: '800' }}>{asset.name}</td>
                          <td>{asset.type}</td>
                          <td>{asset.department}</td>
                          <td
                            style={{ fontWeight: '700' }}
                            className={
                              asset.condition === 'Critical'
                                ? styles.explainValueCritical
                                : asset.condition === 'Degraded'
                                ? styles.explainValueHigh
                                : ''
                            }
                          >
                            {asset.condition.toUpperCase()}
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '700' }}>{asset.availability}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </motion.div>

                {/* Profile Inspector Panel */}
                {selectedAsset && (
                  <motion.div variants={childVariants} className={styles.assetProfilePanel}>
                    <div style={{ borderBottom: '1px solid rgba(30, 27, 25, 0.05)', paddingBottom: '12px' }}>
                      <span className={styles.kpiLabel}>Asset dossier</span>
                      <h2 style={{ fontFamily: 'var(--font-display)', margin: '4px 0 0', color: 'var(--color-text-primary)', fontWeight: '400' }}>
                        {selectedAsset.name} ({selectedAsset.id})
                      </h2>
                    </div>

                    <div className={styles.assetProfileGrid}>
                      <div className={styles.profileCard}>
                        <span className={styles.profileLabel}>Condition State</span>
                        <span className={styles.profileValue}>{selectedAsset.condition.toUpperCase()}</span>
                      </div>
                      <div className={styles.profileCard}>
                        <span className={styles.profileLabel}>Current Availability</span>
                        <span className={styles.profileValue}>{selectedAsset.availability}</span>
                      </div>
                      <div className={styles.profileCard}>
                        <span className={styles.profileLabel}>Active Defects</span>
                        <span className={styles.profileValue}>{selectedAsset.defectsCount} open</span>
                      </div>
                      <div className={styles.profileCard}>
                        <span className={styles.profileLabel}>Last Inspected</span>
                        <span className={styles.profileValue}>{selectedAsset.lastMaintenance}</span>
                      </div>
                      <div className={styles.profileCard}>
                        <span className={styles.profileLabel}>Scheduled Action</span>
                        <span className={styles.profileValue}>{selectedAsset.upcomingMaintenance}</span>
                      </div>
                      <div className={styles.profileCard}>
                        <span className={styles.profileLabel}>Division</span>
                        <span className={styles.profileValue}>{selectedAsset.department}</span>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', marginTop: '1.5rem' }}>
                      <div>
                        <h4 className={styles.kpiLabel}>Recent Interventions</h4>
                        <div className={styles.dossierTimeline}>
                          {selectedAsset.maintenanceHistory.map((hist, i) => (
                            <div key={i} className={styles.dossierItem}>
                              <span className={styles.dossierDot} />
                              <strong>{hist.date}</strong>: {hist.action} ({hist.status})
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className={styles.kpiLabel}>Failure Logs</h4>
                        {selectedAsset.failureHistory.length > 0 ? (
                          <div className={styles.dossierTimeline}>
                            {selectedAsset.failureHistory.map((fail, i) => (
                              <div key={i} className={styles.dossierItem}>
                                <span className={styles.dossierDot} style={{ backgroundColor: 'var(--color-critical)' }} />
                                <strong>{fail.date}</strong>: {fail.description}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '6px 0' }}>No historical failures logged.</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* S04: BLOCK PLANNING */}
          {activeSection === 'planning' && (
            <motion.div
              key="planning"
              variants={pageVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className={styles.workspaceHeaderWrap}>
                <div className={styles.workspaceHeader}>
                  <span className={styles.headerEyebrow}>OPERATIONS CONSOLE</span>
                  <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 400 }}>Block Planning Timeline</h1>
                  <p>Trace scheduled, active, and conflicting blocks across departments.</p>
                </div>
                <div className={styles.headerStatus}>
                  <span>DAILY VIEW</span>
                </div>
              </div>
              <div style={{ height: '1.5px', backgroundColor: 'var(--color-border)' }} />

              <div className={styles.planningWorkspace} style={{ marginTop: '2.5rem' }}>
                <motion.div variants={childVariants} className={styles.timelineCard}>
                  <div className={styles.timelineTimelineGrid}>
                    {/* Gantt Header Timeline Axis */}
                    <div className={styles.timelineHeader}>
                      <div className={styles.timelineLabelSpace}>DEPARTMENT</div>
                      <div className={styles.timelineAxis}>
                        {['08:00', '10:00', '12:00', '14:00', '16:00', '18:00'].map((tick) => (
                          <div key={tick} className={styles.timelineTick}>
                            {tick}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Department Tracks */}
                    {(['Engineering', 'S&T', 'Traction'] as const).map((dept) => {
                      const deptBlocks = timelineBlocks.filter((b) => b.department === dept);

                      return (
                        <div key={dept} className={styles.timelineRow}>
                          <div className={styles.timelineRowLabel}>{dept}</div>
                          <div className={styles.timelineBlockContainer}>
                            {deptBlocks.map((block) => {
                              // Calculate position percentage: grid starts at 08:00 and ends at 18:00 (10 hours total span)
                              const totalSpanHours = 10;
                              const startHourOffset = block.startHour - 8;
                              const leftPercent = (startHourOffset / totalSpanHours) * 100;
                              const widthPercent = (block.durationHours / totalSpanHours) * 100;

                              const blockColor =
                                dept === 'Engineering'
                                  ? 'rgba(210, 180, 140, 0.85)'
                                  : dept === 'S&T'
                                  ? 'rgba(229, 152, 102, 0.85)'
                                  : 'rgba(188, 71, 58, 0.85)';

                              return (
                                <motion.div
                                  key={block.id}
                                  initial={{ scaleX: 0, originX: 0 }}
                                  animate={{ scaleX: 1 }}
                                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.35 }}
                                  className={styles.timelineGanttBlock}
                                  style={{
                                    left: `${leftPercent}%`,
                                    width: `${widthPercent}%`,
                                    backgroundColor: blockColor,
                                  }}
                                  title={block.description}
                                >
                                  <span className={styles.blockLabel}>{block.title}</span>
                                  <span className={styles.blockSub}>
                                    {block.durationHours} hrs ({block.startHour}:00)
                                  </span>
                                </motion.div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* S05: TEJAS OPTIMIZER */}
          {activeSection === 'optimizer' && (
            <motion.div
              key="optimizer"
              variants={pageVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className={styles.workspaceHeaderWrap}>
                <div className={styles.workspaceHeader}>
                  <span className={styles.headerEyebrow}>OPERATIONS CONSOLE</span>
                  <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 400 }}>TEJAS Optimizer</h1>
                  <p>Review solver constraints, variables, and optimized coordinate plans.</p>
                </div>
                <div className={styles.headerStatus}>
                  <span className={styles.headerStatusDot} />
                  <span>SOLVER: {isOptimizing ? 'RESOLVING...' : 'ACTIVE'}</span>
                </div>
              </div>
              <div style={{ height: '1.5px', backgroundColor: 'var(--color-border)' }} />

              {/* Solver Workflow Pipeline */}
              <motion.div variants={childVariants} style={{ marginTop: '2.5rem', position: 'relative', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 className={styles.kpiLabel}>Optimization Pipeline</h3>
                  <button
                    onClick={triggerOptimization}
                    disabled={isOptimizing}
                    className={styles.alertBtn}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <RotateCcw size={13} className={isOptimizing ? 'animate-spin' : ''} />
                    {isOptimizing ? 'COMPUTING CP-SAT...' : 'RUN OPTIMIZATION'}
                  </button>
                </div>

                <div className={styles.optimizerFlow}>
                  <div className={styles.flowCard}>
                    <span className={styles.flowCardNum}>INPUT</span>
                    <div className={styles.flowCardTitle}>Maintenance Queue</div>
                  </div>
                  <div className={styles.flowArrow}>
                    <motion.span animate={isOptimizing ? { opacity: [0.3, 1, 0.3], x: [0, 5, 0] } : {}} transition={{ repeat: Infinity, duration: 1 }}>→</motion.span>
                  </div>
                  <div className={styles.flowCard} style={isOptimizing ? { borderColor: 'var(--color-primary)' } : {}}>
                    <span className={styles.flowCardNum}>CONSTRAINTS</span>
                    <div className={styles.flowCardTitle}>CP-SAT Engine</div>
                  </div>
                  <div className={styles.flowArrow}>
                    <motion.span animate={isOptimizing ? { opacity: [0.3, 1, 0.3], x: [0, 5, 0] } : {}} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}>→</motion.span>
                  </div>
                  <div className={styles.flowCard} style={isOptimizing ? { borderColor: 'var(--color-primary)' } : {}}>
                    <span className={styles.flowCardNum}>SOLVER</span>
                    <div className={styles.flowCardTitle}>Bundle Optimization</div>
                  </div>
                  <div className={styles.flowArrow}>
                    <motion.span animate={isOptimizing ? { opacity: [0.3, 1, 0.3], x: [0, 5, 0] } : {}} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}>→</motion.span>
                  </div>
                  <div className={styles.flowCard} style={{ borderColor: '#bc473a' }}>
                    <span className={styles.flowCardNum} style={{ color: '#bc473a' }}>OUTPUT</span>
                    <div className={styles.flowCardTitle} style={{ color: 'var(--color-text-primary)' }}>Coordinated Block</div>
                  </div>
                </div>
              </motion.div>

              {/* Plan Comparison */}
              <div className={styles.comparisonSection} style={{ marginTop: '3rem' }}>
                {/* Left: Uncoordinated Operations */}
                <motion.div variants={childVariants} className={styles.comparisonPanel}>
                  <h3 className={styles.comparisonHeader}>Uncoordinated Operations</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: '1.5' }}>
                    Departments request separate block windows. Assets are taken down sequentially, causing extended total traffic blocks.
                  </p>
                  
                  {/* Visual Timeline Bars */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '1.5rem' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '4px' }}>
                        <span>Engineering Track Stabilization</span>
                        <strong>2.0 Hours</strong>
                      </div>
                      <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(30, 27, 25, 0.05)', borderRadius: '2px' }}>
                        <motion.div
                          initial={{ width: '0%' }}
                          animate={{ width: '33%' }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          style={{ height: '100%', backgroundColor: 'rgba(210, 180, 140, 0.85)', borderRadius: '2px' }}
                        />
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '4px' }}>
                        <span>S&T Signal Cable Replacement</span>
                        <strong>2.5 Hours</strong>
                      </div>
                      <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(30, 27, 25, 0.05)', borderRadius: '2px' }}>
                        <motion.div
                          initial={{ width: '0%' }}
                          animate={{ width: '42%' }}
                          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.15 }}
                          style={{ height: '100%', backgroundColor: 'rgba(229, 152, 102, 0.85)', borderRadius: '2px' }}
                        />
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '4px' }}>
                        <span>Traction OHE Inspection</span>
                        <strong>1.5 Hours</strong>
                      </div>
                      <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(30, 27, 25, 0.05)', borderRadius: '2px' }}>
                        <motion.div
                          initial={{ width: '0%' }}
                          animate={{ width: '25%' }}
                          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                          style={{ height: '100%', backgroundColor: 'rgba(188, 71, 58, 0.85)', borderRadius: '2px' }}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: '2rem', borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
                    <span className={styles.kpiLabel}>Total Downtime</span>
                    <h2 style={{ margin: 0, fontFamily: 'var(--font-mono)', fontWeight: '800' }}>6.0 Hours</h2>
                  </div>
                </motion.div>

                {/* Right: Coordinated Block */}
                <motion.div variants={childVariants} className={styles.comparisonPanel} style={{ borderColor: 'var(--color-primary)' }}>
                  <h3 className={styles.comparisonHeader} style={{ color: 'var(--color-text-secondary)' }}>TEJAS Coordinated Block</h3>
                  
                  <div className={styles.savingsCallout}>
                    <motion.span
                      key={isOptimizing ? 'loading' : 'complete'}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className={styles.savingsNum}
                    >
                      {isOptimizing ? '...' : optimizationComplete ? '3.0' : aiRecommendation.savedDowntime.split(' ')[0]} Hrs
                    </motion.span>
                    <span className={styles.savingsLabel}>Estimated Downtime Saved</span>
                  </div>

                  {/* Overlapped Compressing Timeline */}
                  <div style={{ marginTop: '1rem', padding: '12px', border: '1px solid rgba(210, 180, 140, 0.15)', backgroundColor: 'rgba(210, 180, 140, 0.03)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '8px' }}>
                      <span>Coordinated Solver Window</span>
                      <strong>10:00 AM - 12:00 PM (120 Min)</strong>
                    </div>
                    
                    <div style={{ position: 'relative', width: '100%', height: '24px', backgroundColor: 'rgba(30, 27, 25, 0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                      {/* Overlapped Bars */}
                      <motion.div
                        animate={isOptimizing ? { x: ['0%', '10%', '0%'] } : {}}
                        transition={{ repeat: Infinity, duration: 1 }}
                        style={{ position: 'absolute', left: '15%', right: '35%', top: '3px', bottom: '3px', backgroundColor: 'rgba(30, 27, 25, 0.8)', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <span style={{ fontSize: '0.55rem', color: '#faf6f0', fontWeight: '800', letterSpacing: '0.05em' }}>3 DEPARTMENTS OVERLAPPED</span>
                      </motion.div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem' }}>
                    <div>
                      <span className={styles.kpiLabel}>Optimized Window</span>
                      <span className={styles.profileValue}>{aiRecommendation.suggestedWindow}</span>
                    </div>
                    <div>
                      <span className={styles.kpiLabel}>CP-SAT Target</span>
                      <span className={styles.profileValue}>Block Alignment v4.2</span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* S06: COORDINATION CENTER */}
          {activeSection === 'coordination' && (
            <motion.div
              key="coordination"
              variants={pageVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className={styles.workspaceHeaderWrap}>
                <div className={styles.workspaceHeader}>
                  <span className={styles.headerEyebrow}>OPERATIONS CONSOLE</span>
                  <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 400 }}>Coordination Center</h1>
                  <p>Cross-department compatibility and joint maintenance tracking.</p>
                </div>
                <div className={styles.headerStatus}>
                  <span>3 ACTIVE SUGGESTIONS</span>
                </div>
              </div>
              <div style={{ height: '1.5px', backgroundColor: 'var(--color-border)' }} />

              <div className={styles.coordinationView} style={{ marginTop: '2.5rem' }}>
                {/* SVG Connected Nodes */}
                <motion.div variants={childVariants} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', height: '240px' }}>
                  <svg style={{ position: 'absolute', width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}>
                    {/* Left node connection line */}
                    <motion.line
                      x1="20%" y1="50%" x2="50%" y2="50%"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.8, ease: 'easeInOut', delay: 0.2 }}
                      stroke={hoveredCoordDept === 'Engineering' ? 'var(--color-primary)' : 'rgba(30, 27, 25, 0.15)'}
                      strokeWidth={hoveredCoordDept === 'Engineering' ? 2 : 1}
                      strokeDasharray={hoveredCoordDept === 'Engineering' ? 'none' : '4 4'}
                    />
                    {/* Right node connection line */}
                    <motion.line
                      x1="80%" y1="50%" x2="50%" y2="50%"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.8, ease: 'easeInOut', delay: 0.25 }}
                      stroke={hoveredCoordDept === 'S&T' ? 'var(--color-primary)' : 'rgba(30, 27, 25, 0.15)'}
                      strokeWidth={hoveredCoordDept === 'S&T' ? 2 : 1}
                      strokeDasharray={hoveredCoordDept === 'S&T' ? 'none' : '4 4'}
                    />
                    {/* Top node connection line */}
                    <motion.line
                      x1="50%" y1="20%" x2="50%" y2="50%"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.8, ease: 'easeInOut', delay: 0.3 }}
                      stroke={hoveredCoordDept === 'Traction' ? 'var(--color-primary)' : 'rgba(30, 27, 25, 0.15)'}
                      strokeWidth={hoveredCoordDept === 'Traction' ? 2 : 1}
                      strokeDasharray={hoveredCoordDept === 'Traction' ? 'none' : '4 4'}
                    />
                  </svg>

                  <div style={{ position: 'absolute', left: '15%', top: '40%', zIndex: 1 }}
                       onMouseEnter={() => setHoveredCoordDept('Engineering')}
                       onMouseLeave={() => setHoveredCoordDept(null)}>
                    <div className={styles.coordCircle} style={hoveredCoordDept === 'Engineering' ? { borderColor: 'var(--color-primary)', background: '#faf6f0' } : {}}>
                      Engineering
                    </div>
                  </div>

                  <div style={{ position: 'absolute', right: '15%', top: '40%', zIndex: 1 }}
                       onMouseEnter={() => setHoveredCoordDept('S&T')}
                       onMouseLeave={() => setHoveredCoordDept(null)}>
                    <div className={styles.coordCircle} style={hoveredCoordDept === 'S&T' ? { borderColor: 'var(--color-primary)', background: '#faf6f0' } : {}}>
                      S&T
                    </div>
                  </div>

                  <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: '5%', zIndex: 1 }}
                       onMouseEnter={() => setHoveredCoordDept('Traction')}
                       onMouseLeave={() => setHoveredCoordDept(null)}>
                    <div className={styles.coordCircle} style={hoveredCoordDept === 'Traction' ? { borderColor: 'var(--color-primary)', background: '#faf6f0' } : {}}>
                      Traction
                    </div>
                  </div>

                  <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: '40%', zIndex: 1 }}>
                    <div className={`${styles.coordCircle} ${styles.coordCenterHub}`}>
                      TEJAS Coordinated
                    </div>
                  </div>
                </motion.div>

                {/* Recommendations */}
                <motion.div variants={childVariants} className={styles.compatCard} style={{ borderTop: '2px solid var(--color-primary)' }}>
                  <h3 className={styles.compatTitle}>Compatible Activities Detected</h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ borderBottom: '1px solid rgba(30, 27, 25, 0.05)', paddingBottom: '10px', opacity: hoveredCoordDept && hoveredCoordDept !== 'Engineering' ? 0.35 : 1 }}>
                      <span className={styles.kpiLabel}>Engineering Task</span>
                      <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: '800' }}>Track stabilization (ENG-204)</p>
                      <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>Required: 10:00 - 12:00</span>
                    </div>
                    
                    <div style={{ borderBottom: '1px solid rgba(30, 27, 25, 0.05)', paddingBottom: '10px', opacity: hoveredCoordDept && hoveredCoordDept !== 'S&T' ? 0.35 : 1 }}>
                      <span className={styles.kpiLabel}>S&T Task</span>
                      <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: '800' }}>Signal cable replacement (SNT-409)</p>
                      <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>Required: 10:30 - 12:00</span>
                    </div>
                    
                    <div style={{ opacity: hoveredCoordDept && hoveredCoordDept !== 'Traction' ? 0.35 : 1 }}>
                      <span className={styles.kpiLabel}>Traction Task</span>
                      <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: '800' }}>Overhead wire bracket inspection (TRD-102)</p>
                      <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>Required: 11:00 - 12:00</span>
                    </div>
                  </div>

                  <div style={{ marginTop: '2rem', backgroundColor: 'rgba(210, 180, 140, 0.06)', padding: '16px', borderLeft: '3px solid var(--color-primary)' }}>
                    <span className={styles.kpiLabel} style={{ color: 'var(--color-text-secondary)' }}>Suggested Joint Block Window</span>
                    <p style={{ margin: '4px 0 0', fontSize: '1.25rem', fontFamily: 'var(--font-mono)', fontWeight: '800', color: 'var(--color-text-primary)' }}>
                      10:30 - 12:00 <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: 'var(--color-text-muted)' }}>(90 Mins)</span>
                    </p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* S07: LIVE OPERATIONS */}
          {activeSection === 'live' && (
            <motion.div
              key="live"
              variants={pageVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className={styles.workspaceHeaderWrap}>
                <div className={styles.workspaceHeader}>
                  <span className={styles.headerEyebrow}>OPERATIONS CONSOLE</span>
                  <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 400 }}>Live Operations</h1>
                  <p>Chronological feed of real-time events, telemetry alarms, and block updates.</p>
                </div>
                <div className={styles.headerStatus}>
                  <span className={styles.headerStatusDot} />
                  <span>LIVE TRACKING ACTIVE</span>
                </div>
              </div>
              <div style={{ height: '1.5px', backgroundColor: 'var(--color-border)' }} />

              {/* Timeline Feed */}
              <motion.div variants={childVariants} className={styles.liveTimeline}>
                {recentActivities.map((act, index) => {
                  const isLatest = index === 0;
                  const isDefect = act.type === 'defect';
                  
                  return (
                    <div key={act.id} className={styles.liveTimelineItem} style={{ opacity: isLatest ? 1 : 0.8 }}>
                      <span
                        className={styles.liveTimelineDot}
                        style={{
                          backgroundColor: isDefect ? 'var(--color-critical)' : isLatest ? 'var(--color-primary)' : 'rgba(30, 27, 25, 0.4)',
                          boxShadow: isLatest ? `0 0 6px ${isDefect ? 'var(--color-critical)' : 'var(--color-primary)'}` : 'none'
                        }}
                      />
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'baseline' }}>
                        <span className={styles.feedTime} style={{ fontSize: '0.8rem', color: isDefect ? 'var(--color-critical)' : 'var(--color-text-primary)' }}>
                          {act.time}
                        </span>
                        <div>
                          <strong style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>{act.event}</strong>
                          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                            Telemetry Node ID: #T-{index + 104} | Status: Logged
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            </motion.div>
          )}

          {/* S08: ANALYTICS & REPORTS */}
          {activeSection === 'analytics' && (
            <motion.div
              key="analytics"
              variants={pageVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className={styles.workspaceHeaderWrap}>
                <div className={styles.workspaceHeader}>
                  <span className={styles.headerEyebrow}>OPERATIONS CONSOLE</span>
                  <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 400 }}>Analytics &amp; Reports</h1>
                  <p>Trace asset trends, department workloads, and optimizer cost benefits.</p>
                </div>
                <div className={styles.headerStatus}>
                  <span>GENERATED: TODAY</span>
                </div>
              </div>
              <div style={{ height: '1.5px', backgroundColor: 'var(--color-border)' }} />

              {/* Performance Summary Metrics */}
              <motion.div variants={childVariants} style={{ marginTop: '2.5rem', display: 'flex', gap: '3rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '24px' }}>
                <div>
                  <span className={styles.kpiLabel}>Primary Performance Metric</span>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '3.6rem', margin: '6px 0 0', fontWeight: 'normal', color: 'var(--color-text-primary)', lineHeight: 1 }}>
                    99.4%
                  </h2>
                  <p style={{ margin: '4px 0 0', fontSize: '0.72rem', color: 'var(--color-text-secondary)', fontWeight: '700' }}>ASSET AVAILABILITY INDEX</p>
                </div>

                <div style={{ borderLeft: '1px solid var(--color-border)', paddingLeft: '3rem' }}>
                  <span className={styles.kpiLabel}>Optimizer Savings</span>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '3.6rem', margin: '6px 0 0', fontWeight: 'normal', color: 'var(--color-primary)', lineHeight: 1 }}>
                    18.5 Hrs
                  </h2>
                  <p style={{ margin: '4px 0 0', fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: '700' }}>TOTAL TRACK DOWNTIME PREVENTED</p>
                </div>
              </motion.div>

              <div className={styles.analyticsGrid} style={{ marginTop: '2.5rem' }}>
                <motion.div variants={childVariants} className={styles.analyticsCard}>
                  <span className={styles.kpiLabel}>7-Day Asset Availability Trend</span>
                  <div className={styles.chartContainer}>
                    <div className={styles.barChart}>
                      {assetTrendData.map((data, i) => (
                        <div key={i} className={styles.barCol}>
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${(data.availability - 95) * 40}px` }}
                            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 + i * 0.05 }}
                            className={styles.barBar}
                          />
                          <span className={styles.barLabel}>{data.day}</span>
                          <span style={{ fontSize: '0.58rem', fontFamily: 'var(--font-mono)', fontWeight: '700' }}>
                            {data.availability}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={childVariants} className={styles.analyticsCard}>
                  <span className={styles.kpiLabel}>Task Backlog by Severity</span>
                  <div className={styles.chartContainer}>
                    <div className={styles.barChart}>
                      <div className={styles.barCol}>
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: '140px' }}
                          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                          className={styles.barBar}
                          style={{ backgroundColor: 'var(--color-critical)' }}
                        />
                        <span className={styles.barLabel}>CRITICAL</span>
                        <span style={{ fontSize: '0.62rem', fontWeight: '800' }}>4</span>
                      </div>
                      <div className={styles.barCol}>
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: '90px' }}
                          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
                          className={styles.barBar}
                          style={{ backgroundColor: '#e59866' }}
                        />
                        <span className={styles.barLabel}>HIGH</span>
                        <span style={{ fontSize: '0.62rem', fontWeight: '800' }}>12</span>
                      </div>
                      <div className={styles.barCol}>
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: '70px' }}
                          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
                          className={styles.barBar}
                          style={{ backgroundColor: 'var(--color-primary)' }}
                        />
                        <span className={styles.barLabel}>MEDIUM</span>
                        <span style={{ fontSize: '0.62rem', fontWeight: '800' }}>19</span>
                      </div>
                      <div className={styles.barCol}>
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: '40px' }}
                          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.35 }}
                          className={styles.barBar}
                          style={{ backgroundColor: 'var(--color-text-muted)' }}
                        />
                        <span className={styles.barLabel}>LOW</span>
                        <span style={{ fontSize: '0.62rem', fontWeight: '800' }}>12</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* S09: ALERTS & DECISIONS */}
          {activeSection === 'alerts' && (
            <motion.div
              key="alerts"
              variants={pageVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className={styles.workspaceHeaderWrap}>
                <div className={styles.workspaceHeader}>
                  <span className={styles.headerEyebrow}>OPERATIONS CONSOLE</span>
                  <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 400 }}>Alerts &amp; Action Center</h1>
                  <p>Operational anomalies requiring operator acknowledgement or approval.</p>
                </div>
                <div className={styles.headerStatus}>
                  <span>3 PENDING ITEMS</span>
                </div>
              </div>
              <div style={{ height: '1.5px', backgroundColor: 'var(--color-border)' }} />

              <div className={styles.alertsGrid} style={{ marginTop: '2.5rem' }}>
                <motion.div variants={childVariants} className={`${styles.alertCard} ${styles.alertCardCritical}`}>
                  <div className={`${styles.statusCardIndicator} ${styles.statusCardIndicatorCritical}`} />
                  <div className={styles.alertHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <AlertTriangle size={14} color="var(--color-critical)" />
                      <span className={styles.alertCategory} style={{ color: 'var(--color-critical)' }}>CRITICAL</span>
                    </div>
                    <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>Received 10m ago</span>
                  </div>
                  <h3 className={styles.alertTitle} style={{ fontFamily: 'var(--font-display)', fontWeight: 'normal', fontSize: '1.25rem' }}>Track Joint Defect Class-A Anomaly</h3>
                  
                  <div className={styles.alertBody}>
                    <p>
                      <strong>What Happened:</strong> Weld crack detected on Track Segment T1 (KM 42.4).
                    </p>
                    <p>
                      <strong>Why It Matters:</strong> Major derailment hazard. High-density cargo routes intersect this line.
                    </p>
                    <p>
                      <strong>Action:</strong> Allocate priority emergency block for repair before 18:00 today.
                    </p>
                  </div>
                  <div className={styles.alertAction}>
                    <button className={styles.alertBtn} onClick={() => setActiveSection('maintenance')}>
                      REVIEW TASK
                    </button>
                  </div>
                </motion.div>

                <motion.div variants={childVariants} className={`${styles.alertCard} ${styles.alertCardOpportunity}`}>
                  <div className={`${styles.statusCardIndicator} ${styles.statusCardIndicatorOpportunity}`} />
                  <div className={styles.alertHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={14} color="var(--color-primary)" />
                      <span className={styles.alertCategory} style={{ color: 'var(--color-primary)' }}>OPTIMIZATION OPPORTUNITY</span>
                    </div>
                    <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>Received 35m ago</span>
                  </div>
                  <h3 className={styles.alertTitle} style={{ fontFamily: 'var(--font-display)', fontWeight: 'normal', fontSize: '1.25rem' }}>3 Compatible Block Requests Found</h3>
                  
                  <div className={styles.alertBody}>
                    <p>
                      <strong>What Happened:</strong> Engineering, S&T, and Traction submitted separate block windows for overlapping track lines.
                    </p>
                    <p>
                      <strong>Why It Matters:</strong> Uncoordinated blocks would result in 6.0 hours of total downtime. Coordinated block takes only 3.5 hours.
                    </p>
                    <p>
                      <strong>Action:</strong> Approve CP-SAT Coordinated block recommendation to save 2.5 hours of track closure.
                    </p>
                  </div>
                  <div className={styles.alertAction}>
                    <button className={styles.alertBtn} onClick={() => setActiveSection('optimizer')}>
                      APPLY OPTIMIZATION
                    </button>
                  </div>
                </motion.div>

                <motion.div variants={childVariants} className={`${styles.alertCard} ${styles.alertCardInfo}`}>
                  <div className={`${styles.statusCardIndicator} ${styles.statusCardIndicatorInfo}`} />
                  <div className={styles.alertHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Info size={14} color="var(--color-text-muted)" />
                      <span className={styles.alertCategory} style={{ color: 'var(--color-text-muted)' }}>SYSTEM INFORMATION</span>
                    </div>
                    <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>Received 1h ago</span>
                  </div>
                  <h3 className={styles.alertTitle} style={{ fontFamily: 'var(--font-display)', fontWeight: 'normal', fontSize: '1.25rem' }}>CP-SAT Solver Target Updated</h3>
                  
                  <div className={styles.alertBody}>
                    <p>
                      <strong>What Happened:</strong> Engine updated parameters to CP-SAT Block Alignment v4.2.
                    </p>
                    <p>
                      <strong>Why It Matters:</strong> Refines coordination scoring and decreases joint safety margins.
                    </p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Dashboard;
