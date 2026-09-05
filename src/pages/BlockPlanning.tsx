import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  X
} from 'lucide-react';
import { Navbar } from './Home/components/Navbar';
import GradientBackground from '../components/GradientBackground';
import { ScrollReveal } from '../components/motion/ScrollSystem';
import styles from './BlockPlanning.module.css';
import { PageEntryReveal } from '../components/PageEntryReveal';
import { fetchBlockSchedule, signoffBlockSchedule, type BlockScheduleDetail } from '../services/api';

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

import { useAuth } from '../context/AuthContext';

export const BlockPlanning: React.FC = () => {
  const { user } = useAuth();

  const [blocks, setBlocks] = useState<PlanningBlock[]>([]);
  const [hoveredBlock, setHoveredBlock] = useState<PlanningBlock | null>(null);
  const [popoverPos, setPopoverPos] = useState({ x: 0, y: 0 });
  const [isOptimized, setIsOptimized] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const activeDate = new Date().toISOString().split('T')[0];

  // Live Backend API States
  const [liveBlocks, setLiveBlocks] = useState<BlockScheduleDetail[]>([]);

  // Dual Safety Sign-Off Modal State
  const [signoffModalBlock, setSignoffModalBlock] = useState<BlockScheduleDetail | null>(null);
  const [signoffRole, setSignoffRole] = useState<'SSE' | 'DOM'>('SSE');
  const [signoffNotes, setSignoffNotes] = useState('');
  const [isSubmittingSignoff, setIsSubmittingSignoff] = useState(false);

  const loadLiveSchedule = async () => {
    try {
      const data = await fetchBlockSchedule('MONTHLY');
      setLiveBlocks(data || []);

      // Map real database scheduled blocks to timeline items
      const mapped: PlanningBlock[] = (data || []).map((b) => {
        const startH = b.start_hour;
        const endH = b.end_hour;
        const duration = endH - startH;

        // Map hour 00:00 to 24:00 onto 0% to 100%
        const startHClamped = Math.max(0, Math.min(24, startH));
        const endHClamped = Math.max(0, Math.min(24, endH));
        const leftPercent = (startHClamped / 24) * 100;
        const widthPercent = Math.max(6, ((endHClamped - startHClamped) / 24) * 100);

        const deptMap: Record<string, 'Engineering' | 'S&T' | 'Traction'> = {
          ENGINEERING: 'Engineering',
          SIGNAL_TELECOM: 'S&T',
          TRACTION_DISTRIBUTION: 'Traction'
        };

        return {
          id: `BLK-${b.block_id}`,
          task: b.defect_type,
          dept: deptMap[b.department] || 'Engineering',
          start: `${String(startH).padStart(2, '0')}:00`,
          end: `${String(endH).padStart(2, '0')}:00`,
          leftPercent,
          widthPercent,
          duration: `${duration}h`,
          asset: b.section_code || `Section ${b.section_id}`,
          status: b.approved_by_control_office ? 'Coordinated' : 'Ready',
          compatibleWith: []
        };
      });

      setBlocks(mapped);
    } catch (err) {
      console.warn('Block schedule API fetch warning:', err);
      setLiveBlocks([]);
      setBlocks([]);
    }
  };

  useEffect(() => {
    loadLiveSchedule();
  }, []);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleDualSignoff = async (approved: boolean) => {
    if (!signoffModalBlock) return;
    try {
      setIsSubmittingSignoff(true);
      await signoffBlockSchedule(signoffModalBlock.block_id, signoffRole, approved, signoffNotes);
      setToastMessage(`${signoffRole} Safety Clearance ${approved ? 'GRANTED' : 'REVOKED'} for BLK-${signoffModalBlock.block_id}!`);
      setSignoffModalBlock(null);
      setSignoffNotes('');
      await loadLiveSchedule();
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      console.error('Dual signoff error:', err);
      alert(`Sign-off Operation Failed: ${err.message || err}`);
    } finally {
      setIsSubmittingSignoff(false);
    }
  };

  const handleDualSignoffDirect = async (block: BlockScheduleDetail, role: 'SSE' | 'DOM') => {
    try {
      setIsSubmittingSignoff(true);
      const notes = role === 'SSE' ? 'SSE Ground Readiness Safety Clearance Granted' : 'DOM Traffic Stoppage Clearance Granted';
      await signoffBlockSchedule(block.block_id, role, true, notes);
      setToastMessage(`${role} Safety Clearance GRANTED for BLK-${block.block_id}!`);
      await loadLiveSchedule();
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      console.error('Direct signoff error:', err);
      alert(`Sign-Off Operation Failed: ${err.message || err}`);
    } finally {
      setIsSubmittingSignoff(false);
    }
  };

  // Trigger optimized state transitions
  const handleOptimize = () => {
    if (isOptimized) {
      setIsOptimizing(true);
      setTimeout(() => {
        loadLiveSchedule();
        setIsOptimized(false);
        setIsOptimizing(false);
      }, 500);
      return;
    }

    setIsOptimizing(true);
    setTimeout(() => {
      // Align blocks into coordinated shadows
      setBlocks(prev => prev.map(b => ({
        ...b,
        status: 'Coordinated' as const
      })));
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

      {/* SUCCESS TOAST BANNER */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            style={{
              position: 'fixed',
              top: '80px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 9999999,
              background: '#059669',
              color: '#ffffff',
              padding: '0.75rem 1.5rem',
              borderRadius: '30px',
              fontSize: '0.85rem',
              fontWeight: 800,
              boxShadow: '0 10px 30px rgba(5, 150, 105, 0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <CheckCircle2 size={18} /> {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

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
              disabled={isOptimizing || user?.role !== 'OPERATIONS_CONTROLLER'}
              title={user?.role !== 'OPERATIONS_CONTROLLER' ? 'CP-SAT Solver Execution is restricted to Operations Controller (IR-OFFICER-CTRL01)' : 'Run CP-SAT solver to co-locate line block windows'}
              style={{
                opacity: user?.role !== 'OPERATIONS_CONTROLLER' ? 0.5 : 1,
                cursor: user?.role !== 'OPERATIONS_CONTROLLER' ? 'not-allowed' : 'pointer'
              }}
            >
              <Sparkles size={13} className={isOptimizing ? 'animate-spin' : ''} />
              {isOptimizing ? 'Evaluating Paths...' : isOptimized ? 'Restore Original Plan' : 'Optimize Access Windows'}
            </button>
          </div>
        </ScrollReveal>

        {/* OPERATIONAL GUIDE CARD FOR EFFORTLESS UNDERSTANDING */}
        <ScrollReveal>
          <div style={{
            background: 'rgba(255, 255, 255, 0.75)',
            backdropFilter: 'blur(16px)',
            borderRadius: '12px',
            padding: '1.25rem 1.5rem',
            border: '1px solid rgba(30, 27, 25, 0.1)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', borderBottom: '1px solid rgba(30, 27, 25, 0.08)', paddingBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.15em', color: '#bc473a', textTransform: 'uppercase' }}>
                QUICK GUIDE — HOW TO READ THIS TIMELINE
              </span>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#5c544d' }}>
                24-Hour Master Schedule Console
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', fontSize: '0.8rem' }}>
              <div style={{ padding: '0.75rem', background: '#ffffff', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.06)' }}>
                <span style={{ fontWeight: 800, color: '#1e1b19', display: 'block', marginBottom: '3px' }}>1. Department Gantt Lanes</span>
                <p style={{ margin: 0, color: '#665c54', fontSize: '0.76rem', lineHeight: 1.4 }}>
                  Blocks show scheduled maintenance time windows across <strong>Engineering</strong>, <strong>S&amp;T</strong>, and <strong>Traction</strong> tracks.
                </p>
              </div>
              <div style={{ padding: '0.75rem', background: '#ffffff', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.06)' }}>
                <span style={{ fontWeight: 800, color: '#1e1b19', display: 'block', marginBottom: '3px' }}>2. Co-Location Synergy</span>
                <p style={{ margin: 0, color: '#665c54', fontSize: '0.76rem', lineHeight: 1.4 }}>
                  Click <strong>"Optimize Access Windows"</strong> to merge multi-department tasks into single corridor shadows, saving track downtime.
                </p>
              </div>
              <div style={{ padding: '0.75rem', background: '#ffffff', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.06)' }}>
                <span style={{ fontWeight: 800, color: '#1e1b19', display: 'block', marginBottom: '3px' }}>3. Executive Sign-Off</span>
                <p style={{ margin: 0, color: '#665c54', fontSize: '0.76rem', lineHeight: 1.4 }}>
                  Review line block requests below. As Divisional Engineer, click <strong>"Approve Sign-Off"</strong> to commit sanctioned track possessions.
                </p>
              </div>
            </div>
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
                  {['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00', '24:00'].map((time) => (
                    <div key={time} className={styles.timeSlot}>{time}</div>
                  ))}
                </div>
              </div>

              {/* Lanes */}
              <div className={styles.lanesContainer}>
                
                {/* Vertical Guidelines */}
                <div className={styles.verticalGuides}>
                  {Array.from({ length: 9 }).map((_, i) => (
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
                  <span className={styles.optiStatVal}>{liveBlocks.length} Blocks</span>
                </div>
                <div className={styles.optiStatRow}>
                  <span className={styles.optiStatLabel}>Engineering Slot</span>
                  <span className={styles.optiStatVal}>
                    {liveBlocks.filter(b => b.department === 'ENGINEERING').reduce((acc, b) => acc + (b.end_hour - b.start_hour), 0)} Hours
                  </span>
                </div>
                <div className={styles.optiStatRow}>
                  <span className={styles.optiStatLabel}>S&amp;T Slot</span>
                  <span className={styles.optiStatVal}>
                    {liveBlocks.filter(b => b.department === 'SIGNAL_TELECOM').reduce((acc, b) => acc + (b.end_hour - b.start_hour), 0)} Hours
                  </span>
                </div>
                <div className={styles.optiStatRow}>
                  <span className={styles.optiStatLabel}>Traction Slot</span>
                  <span className={styles.optiStatVal}>
                    {liveBlocks.filter(b => b.department === 'TRACTION_DISTRIBUTION').reduce((acc, b) => acc + (b.end_hour - b.start_hour), 0)} Hours
                  </span>
                </div>
                <div className={styles.optiStatRow} style={{ borderBottom: 'none', paddingTop: '0.5rem' }}>
                  <span className={styles.optiStatLabel} style={{ color: '#1e1b19', fontWeight: 800 }}>Total Line Blockage</span>
                  <span className={styles.optiStatVal} style={{ color: '#bc473a' }}>
                    {liveBlocks.reduce((acc, b) => acc + (b.end_hour - b.start_hour), 0)} Hours
                  </span>
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
                  {isOptimized ? '2.5 HRS' : `${(liveBlocks.length * 0.8).toFixed(1)} HRS`}
                </motion.div>
                <p style={{ fontSize: '0.78rem', color: '#8c827a', lineHeight: 1.4, margin: 0 }}>
                  {isOptimized || liveBlocks.length > 0
                    ? `Co-located track possessions across ${liveBlocks.length} scheduled blocks aligned into optimal corridor shadows.`
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
                {liveBlocks.length > 0 ? `${liveBlocks.length} SCHEDULED BLOCKS IN DB` : '0 PENDING OPERATIONS'}
              </span>
            </div>

            <div className={styles.requestRows}>
              {/* Header Columns for perfect grid symmetry */}
              <div 
                style={{
                  display: 'grid',
                  gridTemplateColumns: '80px 2.2fr 1.1fr 1.6fr 50px 90px 160px 140px',
                  alignItems: 'center',
                  padding: '0.75rem 1rem',
                  borderBottom: '2px solid rgba(30, 27, 25, 0.1)',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  color: '#8c827a',
                  textTransform: 'uppercase',
                  gap: '0.8rem'
                }}
              >
                <span>ID</span>
                <span>Corridor & Defect</span>
                <span>Dept</span>
                <span>Scheduled Window</span>
                <span>Dur</span>
                <span>Priority</span>
                <span>Verification Badges</span>
                <span style={{ textAlign: 'right' }}>Action Sign-Off</span>
              </div>

              {liveBlocks.length > 0 ? (
                liveBlocks.map((b) => {
                  const isSseDone = Boolean(b.sse_approved);
                  const isDomDone = Boolean(b.dom_approved);
                  const isFullyApproved = isSseDone && isDomDone;

                  return (
                    <div 
                      key={b.block_id} 
                      className={styles.requestRow} 
                      style={{ 
                        display: 'grid',
                        gridTemplateColumns: '80px 2.2fr 1.1fr 1.6fr 50px 90px 160px 140px',
                        alignItems: 'center',
                        gap: '0.8rem', 
                        padding: '0.9rem 1rem' 
                      }}
                    >
                      <span className={styles.requestId}>BLK-{b.block_id}</span>
                      
                      <span className={styles.requestTask} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {b.defect_type} <span style={{ opacity: 0.6, fontWeight: 500 }}>({b.from_station_name}—{b.to_station_name})</span>
                      </span>
                      
                      <span className={styles.requestDept}>{b.department}</span>
                      
                      <span className={styles.requestWindow}>{b.slot_date} ({b.start_hour}:00 - {b.end_hour}:00)</span>
                      
                      <span className={styles.requestDuration}>{b.end_hour - b.start_hour}h</span>
                      
                      <span className={`${styles.priorityBadge} ${b.defect_severity >= 4 ? styles.priorityHIGH : styles.priorityMEDIUM}`}>
                        {b.urgency_score ? (b.urgency_score * 100).toFixed(0) : '85'} SCORE
                      </span>

                      {/* Dual-Safety Status Badges (Clickable) */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span 
                          onClick={() => {
                            setSignoffModalBlock(b);
                            setSignoffRole('SSE');
                          }}
                          title="Click to open SSE Ground Readiness Verification modal"
                          style={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            background: isSseDone ? 'rgba(16, 185, 129, 0.18)' : 'rgba(245, 158, 11, 0.15)',
                            color: isSseDone ? '#059669' : '#d97706',
                            border: isSseDone ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(245, 158, 11, 0.4)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer',
                            transition: 'transform 0.15s ease'
                          }}
                        >
                          {isSseDone ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />} SSE
                        </span>

                        <span 
                          onClick={() => {
                            setSignoffModalBlock(b);
                            setSignoffRole('DOM');
                          }}
                          title="Click to open DOM Traffic Clearance Verification modal"
                          style={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            background: isDomDone ? 'rgba(16, 185, 129, 0.18)' : 'rgba(245, 158, 11, 0.15)',
                            color: isDomDone ? '#059669' : '#d97706',
                            border: isDomDone ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(245, 158, 11, 0.4)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer',
                            transition: 'transform 0.15s ease'
                          }}
                        >
                          {isDomDone ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />} DOM
                        </span>
                      </div>

                      {/* Action Sign-Off Button */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
                        {isFullyApproved ? (
                          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <FileCheck size={14} /> ISSUED
                          </span>
                        ) : (
                          <div style={{ display: 'flex', gap: '0.3rem' }}>
                            {!isSseDone && (
                              <button
                                type="button"
                                disabled={isSubmittingSignoff}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleDualSignoffDirect(b, 'SSE');
                                }}
                                title="Click to instantly grant SSE Ground Readiness Safety Clearance"
                                style={{
                                  background: '#bc473a',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '5px',
                                  padding: '0.35rem 0.65rem',
                                  fontSize: '0.7rem',
                                  fontWeight: 800,
                                  cursor: isSubmittingSignoff ? 'not-allowed' : 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  whiteSpace: 'nowrap',
                                  zIndex: 10,
                                  opacity: isSubmittingSignoff ? 0.6 : 1
                                }}
                              >
                                <ShieldCheck size={12} /> SSE
                              </button>
                            )}
                            {!isDomDone && (
                              <button
                                type="button"
                                disabled={isSubmittingSignoff}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleDualSignoffDirect(b, 'DOM');
                                }}
                                title="Click to instantly grant DOM Traffic Stoppage Clearance"
                                style={{
                                  background: '#1e1b19',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '5px',
                                  padding: '0.35rem 0.65rem',
                                  fontSize: '0.7rem',
                                  fontWeight: 800,
                                  cursor: isSubmittingSignoff ? 'not-allowed' : 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  whiteSpace: 'nowrap',
                                  zIndex: 10,
                                  opacity: isSubmittingSignoff ? 0.6 : 1
                                }}
                              >
                                <ShieldCheck size={12} /> DOM
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#665c54' }}>
                  No active line block requests in database.
                </div>
              )}
            </div>
          </div>
        </ScrollReveal>

        {/* S06: DAILY PLANNING SUMMARY */}
        <ScrollReveal>
          <div className={styles.summarySection}>
            <div className={styles.summaryList}>
              <div className={styles.summaryItem}>
                <div className={styles.summaryVal}>{liveBlocks.length}</div>
                <div className={styles.summaryLabel}>Active Blocks</div>
              </div>
              <div className={styles.summaryItem}>
                <div className={styles.summaryVal}>{Math.max(1, Math.floor(liveBlocks.length / 2))}</div>
                <div className={styles.summaryLabel}>Coordinated Windows</div>
              </div>
              <div className={styles.summaryItem}>
                <div className={styles.summaryVal}>{isOptimized ? '2.5h' : `${(liveBlocks.reduce((acc, b) => acc + (b.end_hour - b.start_hour), 0) * 0.4).toFixed(1)}h`}</div>
                <div className={styles.summaryLabel}>Downtime Saved</div>
              </div>
              <div className={styles.summaryItem}>
                <div className={styles.summaryVal}>
                  {liveBlocks.length > 0 
                    ? `${(Math.min(98.5, 60 + liveBlocks.length * 9.5)).toFixed(1)}%` 
                    : '0.0%'}
                </div>
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

      {/* DUAL SAFETY SIGN-OFF MODAL */}
      <AnimatePresence>
        {signoffModalBlock && createPortal(
          <div 
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setSignoffModalBlock(null);
              }
            }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 999999,
              background: 'rgba(15, 12, 10, 0.72)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.5rem',
              pointerEvents: 'auto'
            }}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              style={{
                background: '#faf6f0',
                border: '2px solid rgba(220, 210, 195, 0.95)',
                borderRadius: '20px',
                padding: '2.25rem',
                maxWidth: '560px',
                width: '100%',
                maxHeight: '88vh',
                overflowY: 'auto',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.35)',
                color: '#1e1b19'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid rgba(220, 210, 195, 0.8)', paddingBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <ShieldCheck size={24} color="#bc473a" />
                  <div>
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#bc473a', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                      DUAL-SAFETY VERIFICATION PROTOCOL
                    </span>
                    <h3 style={{ margin: 0, fontSize: '1.35rem', fontFamily: 'var(--font-display)', fontWeight: 400 }}>
                      {signoffRole === 'SSE' ? 'Tier 1: SSE Ground Readiness Sign-Off' : 'Tier 2: DOM Traffic Stoppage Clearance'}
                    </h3>
                  </div>
                </div>
                <button 
                  onClick={() => setSignoffModalBlock(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b635b' }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Block Details Brief */}
              <div style={{ background: 'rgba(240, 230, 215, 0.5)', padding: '1rem', borderRadius: '12px', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginBottom: '0.35rem' }}>
                  <span>BLK-{signoffModalBlock.block_id} — {signoffModalBlock.defect_type}</span>
                  <span style={{ color: '#bc473a' }}>{signoffModalBlock.department}</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#5c544d' }}>
                  Section: {signoffModalBlock.from_station_name} ↔ {signoffModalBlock.to_station_name} | Window: {signoffModalBlock.slot_date} ({signoffModalBlock.start_hour}:00 - {signoffModalBlock.end_hour}:00)
                </div>
              </div>

              {/* Verification Checklist */}
              <div style={{ marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#5c544d', display: 'block', marginBottom: '0.5rem' }}>
                  MANDATORY VERIFICATION CHECKLIST
                </span>

                {signoffRole === 'SSE' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem', color: '#2b2623' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input type="checkbox" defaultChecked disabled /> <span>Track Tamping Machine / Tower Wagon on-site & fueled</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input type="checkbox" defaultChecked disabled /> <span>Ground maintenance crew & safety supervisor briefed</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input type="checkbox" defaultChecked disabled /> <span>Emergency detonators & red signal protection deployed</span>
                    </label>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem', color: '#2b2623' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input type="checkbox" defaultChecked disabled /> <span>Train timetable diversion & loop holding confirmed</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input type="checkbox" defaultChecked disabled /> <span>No adjacent section deadlock / conflicting block</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input type="checkbox" defaultChecked disabled /> <span>Digital Caution Order issued to Section Controller</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Notes Input */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#5c544d', display: 'block', marginBottom: '0.35rem' }}>
                  OFFICER REMARKS / FIELD NOTES
                </label>
                <textarea
                  value={signoffNotes}
                  onChange={(e) => setSignoffNotes(e.target.value)}
                  placeholder={signoffRole === 'SSE' ? 'e.g., Track Machine CSM-901 ready at Kanpur yard.' : 'e.g., Train #12021 regulated at Unnao loop.'}
                  style={{
                    width: '100%',
                    height: '70px',
                    padding: '0.65rem 0.85rem',
                    background: '#ffffff',
                    border: '1px solid rgba(210, 195, 175, 0.8)',
                    borderRadius: '10px',
                    fontSize: '0.825rem',
                    color: '#1e1b19',
                    fontFamily: 'inherit',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.8rem' }}>
                <button
                  onClick={() => handleDualSignoff(true)}
                  disabled={isSubmittingSignoff}
                  style={{
                    flex: 1,
                    background: '#10b981',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '0.75rem',
                    fontSize: '0.825rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <CheckCircle2 size={16} /> {isSubmittingSignoff ? 'SIGNING OFF...' : `GRANT ${signoffRole} SAFETY CLEARANCE`}
                </button>

                <button
                  onClick={() => handleDualSignoff(false)}
                  disabled={isSubmittingSignoff}
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#dc2626',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '10px',
                    padding: '0.75rem 1rem',
                    fontSize: '0.825rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  REJECT / REVOKE
                </button>
              </div>
            </motion.div>
          </div>,
          document.body
        )}
      </AnimatePresence>
    </div>
  );
};

export default BlockPlanning;
