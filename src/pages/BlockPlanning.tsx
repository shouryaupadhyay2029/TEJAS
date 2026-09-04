import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { Navbar } from './Home/components/Navbar';
import GradientBackground from '../components/GradientBackground';
import { ScrollReveal } from '../components/motion/ScrollSystem';
import styles from './BlockPlanning.module.css';
import { PageEntryReveal } from '../components/PageEntryReveal';
import { fetchBlockSchedule, approveBlockSchedule, type BlockScheduleDetail } from '../services/api';

interface PlanningBlock {
  id: string;
  task: string;
  dept: 'Engineering' | 'S&T' | 'Traction';
  start: string;
  end: string;
  leftPercent: number; // css positioning
  widthPercent: number; // css positioning
  duration: string;
  asset: string;
  status: 'Ready' | 'Conflict' | 'Coordinated';
  compatibleWith: string[]; // compatible block IDs
}

const initialBlocks: PlanningBlock[] = [
  {
    id: 'ENG-204',
    task: 'Track Stabilization',
    dept: 'Engineering',
    start: '10:00',
    end: '12:00',
    leftPercent: 20, // 20% along 8:00-18:00
    widthPercent: 20, // 2h out of 10h
    duration: '2.0h',
    asset: 'Track Segment T1',
    status: 'Conflict',
    compatibleWith: ['SNT-409', 'TRD-102']
  },
  {
    id: 'SNT-409',
    task: 'Signal Cable Replacement',
    dept: 'S&T',
    start: '10:30',
    end: '12:00',
    leftPercent: 25,
    widthPercent: 15,
    duration: '1.5h',
    asset: 'Junction J4 Signals',
    status: 'Conflict',
    compatibleWith: ['ENG-204', 'TRD-102']
  },
  {
    id: 'TRD-102',
    task: 'OHE Bracket Inspection',
    dept: 'Traction',
    start: '12:30',
    end: '14:00',
    leftPercent: 45,
    widthPercent: 15,
    duration: '1.5h',
    asset: 'Overhead Mast M12',
    status: 'Ready',
    compatibleWith: ['ENG-204', 'SNT-409']
  },
  {
    id: 'ENG-301',
    task: 'Sleepers Replacement',
    dept: 'Engineering',
    start: '14:30',
    end: '16:30',
    leftPercent: 65,
    widthPercent: 20,
    duration: '2.0h',
    asset: 'Main Line KM 45',
    status: 'Ready',
    compatibleWith: []
  }
];

const mockRequests = [
  { id: 'ENG-204', task: 'Track stabilization', dept: 'Engineering', window: '10:00 — 12:00', duration: '2h', priority: 'HIGH', status: 'PENDING' },
  { id: 'SNT-409', task: 'Signal cable replacement', dept: 'S&T', window: '10:30 — 12:00', duration: '1.5h', priority: 'MEDIUM', status: 'PENDING' },
  { id: 'TRD-102', task: 'OHE bracket inspection', dept: 'Traction', window: '12:30 — 14:00', duration: '1.5h', priority: 'MEDIUM', status: 'PENDING' },
  { id: 'ENG-301', task: 'Sleepers replacement', dept: 'Engineering', window: '14:30 — 16:30', duration: '2h', priority: 'HIGH', status: 'PENDING' }
];

import { useAuth } from '../context/AuthContext';

export const BlockPlanning: React.FC = () => {
  const { user } = useAuth();
  const isDRE = user?.role === 'DIVISIONAL_ENGINEER';

  const [blocks, setBlocks] = useState<PlanningBlock[]>(initialBlocks);
  const [hoveredBlock, setHoveredBlock] = useState<PlanningBlock | null>(null);
  const [popoverPos, setPopoverPos] = useState({ x: 0, y: 0 });
  const [isOptimized, setIsOptimized] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const activeDate = '2026-09-03';

  // Live Backend API States
  const [liveBlocks, setLiveBlocks] = useState<BlockScheduleDetail[]>([]);
  const [approvingBlockId, setApprovingBlockId] = useState<number | null>(null);

  const loadLiveSchedule = async () => {
    try {
      const data = await fetchBlockSchedule('MONTHLY');
      setLiveBlocks(data);
    } catch (err) {
      console.warn('Block schedule API fetch warning, using fallback timeline:', err);
    }
  };

  useEffect(() => {
    loadLiveSchedule();
  }, []);

  const handleApproveBlock = async (blockId: number) => {
    try {
      setApprovingBlockId(blockId);
      await approveBlockSchedule(blockId);
      await loadLiveSchedule();
    } catch (err) {
      console.error('Failed to approve block schedule:', err);
    } finally {
      setApprovingBlockId(null);
    }
  };

  // Trigger optimized state transitions
  const handleOptimize = () => {
    if (isOptimized) {
      // Reset
      setIsOptimizing(true);
      setTimeout(() => {
        setBlocks(initialBlocks);
        setIsOptimized(false);
        setIsOptimizing(false);
      }, 500);
      return;
    }

    setIsOptimizing(true);
    setTimeout(() => {
      // Map coordinated positions (blocks merge into single window 10:30 - 13:30)
      const optimized = blocks.map(b => {
        if (b.id === 'ENG-204') {
          return { ...b, leftPercent: 25, widthPercent: 15, start: '10:30', end: '12:00', status: 'Coordinated' as const };
        }
        if (b.id === 'SNT-409') {
          return { ...b, leftPercent: 25, widthPercent: 15, start: '10:30', end: '12:00', status: 'Coordinated' as const };
        }
        if (b.id === 'TRD-102') {
          return { ...b, leftPercent: 25, widthPercent: 15, start: '10:30', end: '12:00', status: 'Coordinated' as const };
        }
        return b;
      });
      setBlocks(optimized);
      setIsOptimized(true);
      setIsOptimizing(false);
    }, 800);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setPopoverPos({
      x: e.clientX + 15,
      y: e.clientY + 15
    });
  };

  // Check if a block is highlighted (either directly hovered or compatible)
  const getHighlightState = (block: PlanningBlock) => {
    if (!hoveredBlock) return 'normal';
    if (hoveredBlock.id === block.id) return 'hovered';
    if (hoveredBlock.compatibleWith.includes(block.id)) return 'compatible';
    return 'dimmed';
  };

  return (
    <div className={styles.pageContainer}>
      <GradientBackground
        gradientOrigin="bottom-middle"
        noiseIntensity={0.65}
        noisePatternAlpha={30}
        noisePatternSize={90}
        noisePatternRefreshInterval={2}
        colors={[
          { color: 'rgba(202, 218, 235, 1)', stop: '10.5%' },
          { color: 'rgba(215, 228, 242, 1)', stop: '16%' },
          { color: 'rgba(224, 235, 247, 1)', stop: '17.5%' },
          { color: 'rgba(232, 240, 250, 1)', stop: '25%' },
          { color: 'rgba(244, 247, 252, 1)', stop: '35%' },
          { color: 'rgba(244, 247, 252, 1)', stop: '100%' },
          { color: 'rgba(238, 243, 250, 1)', stop: '40%' },
          { color: 'rgba(240, 245, 252, 1)', stop: '65%' },
          { color: 'rgba(244, 248, 253, 1)', stop: '100%' },
        ]}
        style={{ position: 'fixed', inset: 0, zIndex: -1 }}
      />
      <div className={styles.grainTexture} />
      
      {/* GLOBAL NAVBAR */}
      <div className={styles.navbarRelativeWrap}>
        <Navbar />
      </div>

      <div className={styles.contentWrapper}>
        
        {/* S01: HEADER */}
        <ScrollReveal>
          <div className={styles.headerWrap}>
            <div className={styles.headerLeft}>
              <PageEntryReveal delay={0.15} duration={1.1}>
                <span className={`${styles.eyebrow} reveal-target`}>OPERATIONS CONSOLE</span>
              </PageEntryReveal>
              
              <div style={{ margin: '4px 0' }}>
                <PageEntryReveal delay={0.35} duration={1.25}>
                  <h1 className={`${styles.title} reveal-target`}>Block Planning</h1>
                </PageEntryReveal>
              </div>

              <p className={`${styles.desc} reveal-target`}>
                Coordinate track maintenance blocks across Engineering, S&T and Traction departments to align access windows and minimize track downtime.
              </p>
            </div>
            <div className={styles.headerRight}>
              <div className={styles.dateBlock}>
                <span>PLANNING DATE</span>
                <div className={styles.dateValue}>{activeDate}</div>
              </div>
              <div className={styles.statusIndicator}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#bc473a', display: 'inline-block' }} />
                <span>PLANNING SYSTEM ACTIVE</span>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* S02: CONTROL STRIP */}
        <ScrollReveal>
          <div className={styles.controlStrip}>
            <div className={styles.filters}>
              <select className={styles.filterSelect} defaultValue="ALL">
                <option value="ALL">ALL SECTORS</option>
                <option value="NORTHERN">NORTHERN S-LINE</option>
                <option value="GHAT">GHAT SECTION A</option>
              </select>
              <select className={styles.filterSelect} defaultValue="ALL_DEPTS">
                <option value="ALL_DEPTS">ALL DEPARTMENTS</option>
                <option value="ENG">ENGINEERING</option>
                <option value="SNT">S&T</option>
                <option value="TRD">TRACTION</option>
              </select>
            </div>
            <button 
              className={styles.optimizeBtn} 
              onClick={handleOptimize}
              disabled={isOptimizing}
            >
              <Sparkles size={13} className={isOptimizing ? 'animate-spin' : ''} />
              {isOptimizing ? 'Evaluating Paths...' : isOptimized ? 'Restore Original Plan' : 'Optimize Access Windows'}
            </button>
          </div>
        </ScrollReveal>

        {/* S03: TIMELINE AND LANES */}
        <ScrollReveal>
          <div className={styles.timelineSection}>
            <div className={styles.timelineCard}>
              
              {/* Timeline Header Time slots */}
              <div className={styles.timeHeader}>
                <div className={styles.laneLabelHeader}>
                  <span className={styles.laneLabelTitle}>Lane / Segment</span>
                </div>
                <div className={styles.timeSlots}>
                  {['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'].map((time) => (
                    <div key={time} className={styles.timeSlot}>{time}</div>
                  ))}
                </div>
              </div>

              {/* Lanes */}
              <div className={styles.lanesContainer}>
                
                {/* Vertical Guidelines */}
                <div className={styles.verticalGuides}>
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className={styles.verticalGuide} />
                  ))}
                </div>

                {/* Lanes Grid */}
                {(['Engineering', 'S&T', 'Traction'] as const).map((dept) => (
                  <div key={dept} className={styles.lane}>
                    <div className={styles.laneLabel}>{dept.toUpperCase()}</div>
                    
                    <div className={styles.laneContent}>
                      {/* Render Blocks inside lane */}
                      {blocks
                        .filter((b) => b.dept === dept)
                        .map((b) => {
                          const highlight = getHighlightState(b);
                          
                          // Pre-optimized Conflict indicator overlay
                          const hasOverlapConflict = !isOptimized && (b.id === 'ENG-204' || b.id === 'SNT-409');
                          
                          return (
                            <motion.div
                              key={b.id}
                              className={`${styles.block} ${
                                highlight === 'hovered' ? styles.blockHovered : ''
                              } ${
                                highlight === 'dimmed' ? styles.blockDimmed : ''
                              } ${
                                highlight === 'compatible' ? styles.blockCoordinated : ''
                              } ${
                                hasOverlapConflict ? styles.blockConflict : ''
                              }`}
                              style={{
                                left: `${b.leftPercent}%`,
                                width: `${b.widthPercent}%`,
                              }}
                              layout
                              onMouseEnter={() => setHoveredBlock(b)}
                              onMouseLeave={() => setHoveredBlock(null)}
                              onMouseMove={handleMouseMove}
                            >
                              <span className={styles.blockTitle}>{b.task}</span>
                              <span className={styles.blockId}>{b.id} ({b.duration})</span>
                              
                              {hasOverlapConflict && b.id === 'SNT-409' && (
                                <div className={styles.conflictBadge}>
                                  <AlertTriangle size={7} style={{ marginRight: 2, display: 'inline' }} />
                                  OVERLAP CONFLICT
                                </div>
                              )}
                            </motion.div>
                          );
                        })}
                    </div>
                  </div>
                ))}

                {/* Coordinated unified TEJAS BLOCK visualization overlay */}
                {isOptimized && (
                  <motion.div
                    className={styles.tejasCoordinatedBlock}
                    style={{
                      left: '25%', // Spans from 10:30 to 12:00 (which is 25% to 40% on layout scale)
                      width: '15%',
                      top: '32px', // Centered vertically across Engineering and S&T lanes
                      height: '160px',
                    }}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                  >
                    <div className={styles.tejasCoordinatedText} style={{ transform: 'rotate(-90deg)', whiteSpace: 'nowrap' }}>
                      TEJAS window <span>ENG + SNT + TRD</span>
                    </div>
                  </motion.div>
                )}

              </div>

              {/* Track Availability Indicator strip */}
              <div className={styles.availabilitySection}>
                <div className={styles.availabilityTitle}>TRACK ACCESSIBILITY PATH</div>
                <div className={styles.availabilityBarContainer}>
                  {/* segment 1 (08:00 - 10:00) */}
                  <div className={`${styles.availabilitySegment} ${styles.segmentAvailable}`} style={{ width: '20%' }} />
                  {/* segment 2 (10:00 - 12:00) */}
                  <div className={`${styles.availabilitySegment} ${isOptimized ? styles.segmentMaintenance : styles.segmentBlocked}`} style={{ width: '20%' }} />
                  {/* segment 3 (12:00 - 14:00) */}
                  <div className={`${styles.availabilitySegment} ${styles.segmentAvailable}`} style={{ width: '20%' }} />
                  {/* segment 4 (14:00 - 16:30) */}
                  <div className={`${styles.availabilitySegment} ${styles.segmentMaintenance}`} style={{ width: '25%' }} />
                  {/* segment 5 (16:30 - 18:00) */}
                  <div className={`${styles.availabilitySegment} ${styles.segmentAvailable}`} style={{ width: '15%' }} />
                </div>
              </div>

            </div>
          </div>
        </ScrollReveal>

        {/* S04: OPTIMIZATION RESULTS */}
        <ScrollReveal>
          <div className={styles.optimizationGrid}>
            
            {/* Left Card: Current Plan Stats */}
            <div className={styles.optiCard}>
              <div className={styles.optiCardHeader}>
                <span className={styles.optiCardLabel}>TRADITIONAL PLANNING</span>
                <h3 className={styles.optiCardTitle}>Sequential Access</h3>
              </div>
              <div className={styles.optiStats}>
                <div className={styles.optiStatRow}>
                  <span className={styles.optiStatLabel}>Active Block Count</span>
                  <span className={styles.optiStatVal}>4 Blocks</span>
                </div>
                <div className={styles.optiStatRow}>
                  <span className={styles.optiStatLabel}>Engineering Slot</span>
                  <span className={styles.optiStatVal}>2.0 Hours</span>
                </div>
                <div className={styles.optiStatRow}>
                  <span className={styles.optiStatLabel}>S&T Slot</span>
                  <span className={styles.optiStatVal}>1.5 Hours</span>
                </div>
                <div className={styles.optiStatRow}>
                  <span className={styles.optiStatLabel}>Traction Slot</span>
                  <span className={styles.optiStatVal}>1.5 Hours</span>
                </div>
                <div className={styles.optiStatRow} style={{ borderBottom: 'none', paddingTop: '0.5rem' }}>
                  <span className={styles.optiStatLabel} style={{ color: '#1e1b19', fontWeight: 800 }}>Total Line Blockage</span>
                  <span className={styles.optiStatVal} style={{ color: '#bc473a' }}>5.0 Hours</span>
                </div>
              </div>
            </div>

            {/* Right Card: Optimized Saved Stats */}
            <div className={`${styles.optiCard} ${styles.savedCard}`}>
              <div className={styles.optiCardHeader}>
                <span className={styles.optiCardLabel} style={{ color: '#d2b48c' }}>TEJAS INTELLIGENCE</span>
                <h3 className={`${styles.optiCardTitle} ${styles.savedCardTitle}`}>Coordinated Block Window</h3>
              </div>
              
              <div className={styles.optiStats}>
                <span className={styles.savedDesc}>DOWNTIME SAVED</span>
                <motion.div 
                  className={styles.savedHighlight}
                  animate={{ scale: isOptimized ? [1, 1.05, 1] : 1 }}
                  transition={{ duration: 0.4 }}
                >
                  {isOptimized ? '2.5 HRS' : '0.0 HRS'}
                </motion.div>
                <p style={{ fontSize: '0.78rem', color: '#8c827a', lineHeight: 1.4, margin: 0 }}>
                  {isOptimized 
                    ? 'Engineering, S&T and Traction operations unified within a single 1.5-hour track accessibility block.'
                    : 'Analyze overlapping coordinates to combine access slots and release active lines faster.'}
                </p>
              </div>
            </div>

          </div>
        </ScrollReveal>

        {/* S05: BLOCK REQUESTS QUEUE */}
        <ScrollReveal>
          <div className={styles.requestsSection}>
            <div className={styles.requestsHeader}>
              <h3 className={styles.requestsTitle}>Line Block Requests</h3>
              <span style={{ fontSize: '0.72rem', color: '#8c827a', fontFamily: 'var(--font-mono)' }}>
                {liveBlocks.length > 0 ? `${liveBlocks.length} SCHEDULED BLOCKS IN DB` : '4 PENDING OPERATIONS'}
              </span>
            </div>

            <div className={styles.requestRows}>
              {liveBlocks.length > 0 ? (
                liveBlocks.map((b) => (
                  <div key={b.block_id} className={styles.requestRow}>
                    <span className={styles.requestId}>BLK-{b.block_id}</span>
                    <span className={styles.requestTask}>{b.defect_type} ({b.from_station_name}—{b.to_station_name})</span>
                    <span className={styles.requestDept}>{b.department}</span>
                    <span className={styles.requestWindow}>{b.slot_date} ({b.start_hour}:00 - {b.end_hour}:00)</span>
                    <span className={styles.requestDuration}>{b.end_hour - b.start_hour}h</span>
                    <span className={`${styles.priorityBadge} ${b.defect_severity >= 4 ? styles.priorityHIGH : styles.priorityMEDIUM}`}>
                      {b.urgency_score ? (b.urgency_score * 100).toFixed(0) : '85'} SCORE
                    </span>
                    {b.approved_by_control_office ? (
                      <span className={styles.statusPending} style={{ color: 'var(--color-primary)' }}>APPROVED</span>
                    ) : (
                      <button
                        onClick={() => handleApproveBlock(b.block_id)}
                        disabled={approvingBlockId === b.block_id || !isDRE}
                        title={!isDRE ? 'Requires Divisional Engineer access.' : undefined}
                        className={styles.statusPending}
                        style={{
                          cursor: (approvingBlockId === b.block_id || !isDRE) ? 'not-allowed' : 'pointer',
                          background: isDRE ? 'var(--color-primary)' : '#8a7e72',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '3px',
                          padding: '2px 8px',
                          opacity: (approvingBlockId === b.block_id || !isDRE) ? 0.6 : 1
                        }}
                      >
                        {approvingBlockId === b.block_id ? 'APPROVING...' : 'APPROVE SIGN-OFF'}
                      </button>
                    )}
                  </div>
                ))
              ) : (
                mockRequests.map((req) => (
                  <div key={req.id} className={styles.requestRow}>
                    <span className={styles.requestId}>{req.id}</span>
                    <span className={styles.requestTask}>{req.task}</span>
                    <span className={styles.requestDept}>{req.dept}</span>
                    <span className={styles.requestWindow}>{req.window}</span>
                    <span className={styles.requestDuration}>{req.duration}</span>
                    <span className={`${styles.priorityBadge} ${req.priority === 'HIGH' ? styles.priorityHIGH : styles.priorityMEDIUM}`}>
                      {req.priority}
                    </span>
                    <span className={styles.statusPending}>{req.status}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </ScrollReveal>

        {/* S06: DAILY PLANNING SUMMARY */}
        <ScrollReveal>
          <div className={styles.summarySection}>
            <div className={styles.summaryList}>
              <div className={styles.summaryItem}>
                <div className={styles.summaryVal}>8</div>
                <div className={styles.summaryLabel}>Active Blocks</div>
              </div>
              <div className={styles.summaryItem}>
                <div className={styles.summaryVal}>3</div>
                <div className={styles.summaryLabel}>Coordinated Windows</div>
              </div>
              <div className={styles.summaryItem}>
                <div className={styles.summaryVal}>{isOptimized ? '2.5h' : '0h'}</div>
                <div className={styles.summaryLabel}>Downtime Saved</div>
              </div>
              <div className={styles.summaryItem}>
                <div className={styles.summaryVal}>{isOptimized ? '92.1%' : '64.5%'}</div>
                <div className={styles.summaryLabel}>Block Utilization</div>
              </div>
            </div>
          </div>
        </ScrollReveal>

      </div>

      {/* POPUP INFO OVERLAY FOR TIMELINE HOVER */}
      <AnimatePresence>
        {hoveredBlock && createPortal(
          <motion.div
            className={styles.hoverPopover}
            style={{
              position: 'fixed',
              left: popoverPos.x,
              top: popoverPos.y,
              zIndex: 999999,
            }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div className={styles.popoverTitle}>{hoveredBlock.task}</div>
            <div style={{ fontSize: '0.62rem', color: '#d2b48c', fontFamily: 'var(--font-mono)' }}>{hoveredBlock.id}</div>
            <div className={styles.popoverMetadata}>
              <span>{hoveredBlock.start} — {hoveredBlock.end}</span>
              <span>{hoveredBlock.asset}</span>
            </div>
          </motion.div>,
          document.body
        )}
      </AnimatePresence>
    </div>
  );
};

export default BlockPlanning;
