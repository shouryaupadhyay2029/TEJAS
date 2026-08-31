import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView, animate, useScroll, useTransform } from 'framer-motion';
import { TransitionLink } from '../../components/PageTransition';
import GradientBackground from '../../components/GradientBackground';
import { Noise } from '../../components/GradientBackground';
import styles from './HomeContent.module.css';

/* ── Shared ──────────────────────────────────────────── */
const ease = [0.16, 1, 0.3, 1] as const;

function AnimatedCounter({ from = 0, to, suffix = '', duration = 1.6, delay = 0 }: { from?: number; to: number; suffix?: string; duration?: number; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-20px' });
  const [hasRun, setHasRun] = useState(false);

  useEffect(() => {
    if (inView && !hasRun) {
      // Respect prefers-reduced-motion
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReduced) {
        if (ref.current) ref.current.textContent = String(to) + suffix;
        setHasRun(true);
        return;
      }

      const controls = animate(from, to, {
        duration,
        delay,
        ease: 'easeOut',
        onUpdate(value) {
          if (ref.current) {
            ref.current.textContent = Math.floor(value).toLocaleString() + suffix;
          }
        },
        onComplete() {
          setHasRun(true);
        }
      });
      return () => controls.stop();
    } else if (!inView && !hasRun) {
      if (ref.current) {
        ref.current.textContent = String(from) + suffix;
      }
    }
  }, [inView, from, to, suffix, duration, delay, hasRun]);

  return <span ref={ref}>{from}{suffix}</span>;
}

function Reveal({
  children,
  delay = 0,
  className,
  x = 0,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  x?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 15, x: x !== 0 ? (x > 0 ? 15 : -15) : 0 }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      exit={{ opacity: 0, y: 15 }}
      viewport={{ once: false, margin: '-40px' }}
      transition={{ duration: 0.65, delay, ease }}
    >
      {children}
    </motion.div>
  );
}

function Rule({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div
      className={styles.rule}
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      exit={{ scaleX: 0 }}
      viewport={{ once: false }}
      style={{ originX: 0 }}
      transition={{ duration: 0.8, delay, ease }}
    />
  );
}

function SectionLabel({ num, label }: { num: string; label: string }) {
  return (
    <div className={styles.sectionLabel}>
      <span className={styles.sectionNum}>{num}</span>
      <span className={styles.sectionTag}>{label}</span>
    </div>
  );
}

/* ── Process step data ───────────────────────────────── */
const processSteps = [
  { num: '01', title: 'ASSET\nCONDITION',   desc: 'Maintenance tasks, defects and operational constraints enter the system.' },
  { num: '02', title: 'PRIORITY\nSCORING',   desc: 'AI-assisted analysis ranks tasks by urgency and operational impact.' },
  { num: '03', title: 'DEPART-\nMENT COORD', desc: 'Tasks across Engineering, S&T and Traction are evaluated together.' },
  { num: '04', title: 'BLOCK\nOPTIMIZATION',desc: 'Constraint-aware scheduling finds feasible, efficient work windows.' },
  { num: '05', title: 'EXECUTION\nPLAN',      desc: 'A coordinated, prioritized maintenance plan is produced.' },
];

/* ── Capability rows ─────────────────────────────────── */
const capabilities = [
  { tag: 'MAINTENANCE', title: 'Maintenance Intelligence', desc: 'AI-assisted maintenance prioritization, defect tracking and task management across the railway network.', to: '/maintenance' },
  { tag: 'PLANNING',    title: 'Block Planning',           desc: 'Coordinated block planning across Engineering, S&T and Traction within shared work windows.', to: '/block-planning' },
  { tag: 'OPTIMIZATION',title: 'Schedule Optimization',   desc: 'CP-SAT constraint-aware optimization generates feasible and efficient block schedules.', to: '/optimization' },
  { tag: 'ASSETS',      title: 'Asset Intelligence',       desc: 'Centralized asset registry, condition history, maintenance records and defect intelligence.', to: '/assets' },
  { tag: 'REPORTS',     title: 'Operational Insights',     desc: 'Clear data-driven visibility into maintenance status, block utilization and planning outcomes.', to: '/reports' },
];

/* ── Value metrics ───────────────────────────────────── */
const metrics = [
  { label: 'ASSET AVAILABILITY',       val: 99.4, suffix: '%',  text: 'Better in-service reliability through prioritized, timely maintenance.' },
  { label: 'BLOCK UTILIZATION',        val: 92.1, suffix: '%',  text: 'Higher utilization of available track time through coordinated scheduling.' },
  { label: 'MAINTENANCE ACTIONS',      val: 1240, suffix: '+',  text: 'Improved alignment across Engineering, S&T and Traction teams.' },
  { label: 'PLANNING TIME REDUCTION',  val: 65,   suffix: '%',  text: 'Faster turnaround on block plans with constraint-aware optimization.' },
];

/* ── Before / After ─────────────────────────────────── */
const before = [
  'Isolated maintenance requests per department',
  'Department-wise planning without shared visibility',
  'Manual coordination across Engineering, S&T, Traction',
  'Conflicting block requirements and scheduling gaps',
  'Limited insight into maintenance priorities',
];
const after = [
  'Prioritized maintenance workload across the network',
  'Shared operational view for all departments',
  'Coordinated work windows aligned to block availability',
  'Constraint-aware schedules with fewer conflicts',
  'Clearer decisions supported by asset intelligence',
];

/* ── Nav links ───────────────────────────────────────── */
const navLinks = ['HOME', 'DASHBOARD', 'MAINTENANCE', 'PLANNING', 'ASSETS', 'REPORTS'];
const navPaths = ['/', '/dashboard', '/maintenance', '/block-planning', '/assets', '/reports'];

/* ── WORKFLOW MILESTONE COMPONENT ────────────────────── */
interface MilestoneProps {
  step: {
    num: string;
    label: string;
    img: string;
    offset: number;
  };
}

const WorkflowMilestone: React.FC<MilestoneProps> = ({ step }) => {
  const ref = useRef<HTMLDivElement>(null);
  
  // Track scroll position of this card relative to viewport
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  // Interpolate scale: 0.97 -> 1.02 -> 0.97
  const scrollScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.97, 1.02, 0.97]);

  // Interpolate subtle parallax vertical offset: offset + 12 -> offset -> offset - 12
  const scrollY = useTransform(scrollYProgress, [0, 0.5, 1], [step.offset + 12, step.offset, step.offset - 12]);

  // Interpolate image glide position inside the container: -8% to 8%
  const imgY = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);

  // Subtle contrast: 0.95 -> 1.05 -> 0.95
  const scrollContrast = useTransform(scrollYProgress, [0, 0.5, 1], [0.95, 1.05, 0.95]);

  // Subtle border definition opacity: 0.08 -> 0.25 -> 0.08
  const scrollBorderOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.08, 0.25, 0.08]);

  // Subtle shadow intensity factor: 0.02 -> 0.08 -> 0.02
  const scrollShadowOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.02, 0.08, 0.02]);

  return (
    <motion.div
      ref={ref}
      className={styles.milestoneItem}
      style={{
        y: scrollY,
        scale: scrollScale
      }}
      variants={{
        hidden: { opacity: 0, y: step.offset + 30 },
        show: { opacity: 1, y: step.offset, transition: { duration: 0.8, ease } }
      }}
    >
      {/* Image Container with desaturated on-hover transition */}
      <motion.div 
        className={styles.imageContainer}
        style={{
          boxShadow: useTransform(scrollShadowOpacity, (val: number) => `0 6px 24px rgba(30, 27, 25, ${val})`),
          borderColor: useTransform(scrollBorderOpacity, (val: number) => `rgba(30, 27, 25, ${val})`),
          filter: useTransform(scrollContrast, (val: number) => `contrast(${val})`),
          borderWidth: '1px',
          borderStyle: 'solid'
        }}
      >
        <motion.img 
          src={step.img} 
          alt={step.label} 
          className={styles.workflowImage} 
          style={{
            y: imgY,
            scale: 1.15
          }}
          whileHover={{
            scale: 1.20
          }}
          transition={{ duration: 0.8, ease }}
        />
      </motion.div>

      {/* Label Group */}
      <motion.div 
        className={styles.milestoneLabelWrap}
        variants={{
          hidden: { opacity: 0, y: 8 },
          show: { opacity: 1, y: 0, transition: { duration: 0.4, ease, delay: 0.15 } }
        }}
      >
        <span className={styles.milestoneNum}>{step.num}</span>
        <span className={styles.milestoneLabel}>{step.label}</span>
      </motion.div>
    </motion.div>
  );
};

/* ── COMPONENT ───────────────────────────────────────── */
const HomeContent: React.FC = () => {
  const [capHovered, setCapHovered] = useState<number | null>(null);

  return (
    <div className={styles.content}>

      {/* Animated grain — same settings as hero Noise component */}
      <div className={styles.noiseLayer}>
        <Noise
          patternSize={90}
          patternAlpha={30}
          intensity={0.65}
          patternRefreshInterval={2}
        />
      </div>

      <div className={styles.sectionsWrap}>

      {/* ═══════════════════════════════════════════════════
          S01 — THE APPROACH
      ═══════════════════════════════════════════════════ */}
      <section className={styles.section} id="approach">
        <div className={styles.sectionInner}>
          <Rule />
          <div className={styles.approachHeader}>
            <Reveal delay={0.05}>
              <SectionLabel num="01" label="THE TEJAS APPROACH" />
            </Reveal>
            <Reveal delay={0.12}>
              <h2 className={styles.approachHeadline}>
                From maintenance tasks to coordinated operations.
              </h2>
            </Reveal>
          </div>

          <div className={styles.processFlow}>
            {processSteps.map((step, i) => (
              <Reveal key={step.num} delay={0.08 + i * 0.09} className={styles.processStep}>
                <span className={styles.processNum}>{step.num}</span>
                <div className={styles.processConnector}>
                  <span className={styles.processDot} />
                  {i < processSteps.length - 1 && <span className={styles.processLine} />}
                </div>
                <h4 className={styles.processTitle}>
                  {step.title.split('\n').map((l, j) => <span key={j}>{l}</span>)}
                </h4>
                <p className={styles.processDesc}>{step.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          S02 — HOW IT WORKS
      ═══════════════════════════════════════════════════ */}
      <section className={styles.section} id="how" style={{ overflow: 'visible' }}>
        <div className={styles.sectionInner} style={{ overflow: 'visible' }}>
          <Rule />
          <div className={styles.howHeader}>
            <Reveal delay={0.05}>
              <SectionLabel num="02" label="HOW IT WORKS" />
            </Reveal>
            <Reveal delay={0.1}>
              <h2 className={styles.howHeadline}>The operational journey from data to resolution.</h2>
            </Reveal>
          </div>

          <motion.div 
            className={styles.workflowContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              hidden: {},
              show: {
                transition: {
                  staggerChildren: 0.15
                }
              }
            }}
          >
            <div className={styles.milestonesWrap}>
              {[
                { num: '01', label: 'COLLECT DATA', img: '/DATA.png', offset: -24 },
                { num: '02', label: 'BUILD ASSET PROFILE', img: '/ASSET.png', offset: 24 },
                { num: '03', label: 'DETECT DEFECTS', img: '/DETECTION.png', offset: -12 },
                { num: '04', label: 'ASSESS RISK', img: '/PRIORITY.png', offset: 12 },
                { num: '05', label: 'COORDINATE WORK', img: '/3_STEP.png', offset: -24 },
                { num: '06', label: 'EXECUTE & MONITOR', img: '/FINAL.png', offset: 24 },
              ].map((step) => (
                <WorkflowMilestone step={step} key={step.num} />
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          S03 — INTELLIGENCE LAYER
      ═══════════════════════════════════════════════════ */}
      <section className={styles.section} id="intelligence">
        <div className={styles.sectionInner}>
          <Rule />
          <div className={styles.intelGrid}>
            <div className={styles.intelLeft}>
              <Reveal delay={0.05}>
                <SectionLabel num="03" label="THE INTELLIGENCE LAYER" />
              </Reveal>
              <Reveal delay={0.1}>
                <h2 className={styles.intelHeadline}>
                  The decision is human.
                  <br />The search is intelligent.
                </h2>
              </Reveal>
              <Reveal delay={0.18}>
                <p className={styles.intelBody}>
                  TEJAS assists railway personnel by analyzing maintenance
                  information and operational constraints to surface priorities
                  and scheduling opportunities — not to replace the judgement
                  of the people who know the railway.
                </p>
                <p className={styles.intelBody} style={{ marginTop: '1rem' }}>
                  TEJAS is decision support for railway operations. Every plan
                  it produces remains within the control and review of the
                  maintenance and operations team.
                </p>
              </Reveal>
            </div>

            <Reveal delay={0.22} className={styles.intelRight}>
              <div className={styles.intelSignals}>
                {[
                  ['PRIORITY SCORE',        'Urgency + condition + operational impact'],
                  ['DEFECT HISTORY',        'Pattern analysis across asset lifecycle'],
                  ['ASSET CONDITION',       'Current status from inspection records'],
                  ['OPERATIONAL CONSTRAINTS','Traffic, safety and block availability'],
                  ['BLOCK AVAILABILITY',    'Compatible windows across departments'],
                ].map(([label, desc], i) => (
                  <motion.div
                    key={label}
                    className={styles.intelSignal}
                    initial={{ opacity: 0, x: 16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.3 + i * 0.07, ease }}
                  >
                    <span className={styles.signalDot} />
                    <div>
                      <span className={styles.signalLabel}>{label}</span>
                      <span className={styles.signalDesc}>{desc}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          S04 — WHAT CHANGES
      ═══════════════════════════════════════════════════ */}
      <section className={styles.section} id="changes">
        <div className={styles.sectionInner}>
          <Rule />
          <Reveal delay={0.05}>
            <SectionLabel num="04" label="WHAT CHANGES" />
          </Reveal>

          <div className={styles.changeGrid}>
            <div className={styles.changeCol}>
              <Reveal delay={0.1}>
                <div className={styles.changeHeader}>
                  <span className={styles.changeHeaderLabel}>BEFORE</span>
                </div>
              </Reveal>
              <div className={styles.changeList}>
                {before.map((item, i) => (
                  <Reveal key={i} delay={0.12 + i * 0.06}>
                    <div className={styles.changeItem + ' ' + styles.changeItemBefore}>
                      <span className={styles.changeMark}>—</span>
                      <span>{item}</span>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>

            <div className={styles.changeDivider} />

            <div className={styles.changeCol}>
              <Reveal delay={0.1}>
                <div className={styles.changeHeader}>
                  <span className={styles.changeHeaderLabel + ' ' + styles.changeHeaderAfter}>AFTER TEJAS</span>
                </div>
              </Reveal>
              <div className={styles.changeList}>
                {after.map((item, i) => (
                  <Reveal key={i} delay={0.14 + i * 0.06}>
                    <div className={styles.changeItem + ' ' + styles.changeItemAfter}>
                      <span className={styles.changeMark + ' ' + styles.changeMarkAfter}>+</span>
                      <span>{item}</span>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          S05 — PLATFORM CAPABILITIES
      ═══════════════════════════════════════════════════ */}
      <section className={styles.sectionCapabilities} id="capabilities">
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
          style={{ position: 'relative', height: 'auto' }}
        >
          <div className={styles.sectionInner} style={{ padding: '7rem 4rem' }}>
            <Rule />
            <Reveal delay={0.05}>
              <SectionLabel num="05" label="PLATFORM CAPABILITIES" />
            </Reveal>
            <Reveal delay={0.1}>
              <h2 className={styles.capHeadline}>Everything in one operational platform.</h2>
            </Reveal>

            <div
              className={styles.capList}
              onMouseLeave={() => setCapHovered(null)}
            >
              {capabilities.map((cap, i) => (
                <Reveal key={cap.tag} delay={0.08 + i * 0.06}>
                  <TransitionLink
                    to={cap.to}
                    label={cap.tag}
                    className={styles.capRow}
                    style={{
                      opacity: capHovered === null ? 1 : capHovered === i ? 1 : 0.3,
                      transition: 'opacity 0.3s ease',
                      display: 'flex',
                      textDecoration: 'none',
                    }}
                    onMouseEnter={() => setCapHovered(i)}
                  >
                    <span className={styles.capTag}>{cap.tag}</span>
                    <div className={styles.capBody}>
                      <span className={styles.capTitle}>{cap.title}</span>
                      <span className={styles.capDesc}>{cap.desc}</span>
                    </div>
                    <motion.span
                      className={styles.capArrow}
                      animate={{ x: capHovered === i ? 8 : 0 }}
                      transition={{ duration: 0.25, ease }}
                    >
                      →
                    </motion.span>
                  </TransitionLink>
                </Reveal>
              ))}
            </div>
          </div>
        </GradientBackground>
      </section>

      {/* ═══════════════════════════════════════════════════
          S06 — OPERATIONAL VALUE
      ═══════════════════════════════════════════════════ */}
      <section className={styles.section} id="value">
        <div className={styles.sectionInner}>
          <Rule />
          <Reveal delay={0.05}>
            <SectionLabel num="06" label="OPERATIONAL VALUE" />
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className={styles.valueHeadline}>Designed to improve what matters.</h2>
          </Reveal>
          <Reveal delay={0.14}>
            <p className={styles.valueNote}>Illustrative platform metrics — not historical claims.</p>
          </Reveal>

          <div className={styles.metricsGrid}>
            {metrics.map((m, i) => (
              <Reveal key={m.label} delay={0.1 + i * 0.08} className={styles.metricItem}>
                <Rule delay={0.1 + i * 0.08} />
                <span className={styles.metricVal}>
                  <AnimatedCounter to={m.val} suffix={m.suffix} delay={0.25 + i * 0.1} />
                </span>
                <span className={styles.metricLabel}>{m.label}</span>
                <span className={styles.metricText}>{m.text}</span>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════════ */}
      <footer className={styles.footer} style={{ position: 'relative' }}>
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
          style={{ position: 'relative', height: 'auto' }}
        >
          <div className={styles.footerInner} style={{ padding: '9rem 4rem 5rem', position: 'relative', overflow: 'hidden' }}>
            {/* Large faded backdrop text */}
            <div className={styles.footerBackdropText}>TEJAS</div>

            <div className={styles.footerTop}>
              {/* Brand */}
              <div className={styles.footerBrand}>
                <span className={styles.footerLogo}>TEJAS</span>
                <span className={styles.footerTagline}>For Indian Railways</span>
                <p className={styles.footerDesc}>
                  AI-assisted railway maintenance planning and coordinated block optimization.
                </p>
              </div>

              {/* Nav */}
               <nav className={styles.footerNav}>
                {navLinks.map((link, i) => (
                  <TransitionLink key={link} to={navPaths[i]} label={link} className={`${styles.footerLink} nav-underline-anim`}>
                    {link}
                  </TransitionLink>
                ))}
              </nav>
            </div>

            <div className={styles.footerBottom}>
              <span className={styles.footerRule} />
              <span className={styles.footerCopy}>
                © 2026 TEJAS Railway Maintenance & Automatic Block-Planning.
              </span>
            </div>
          </div>
        </GradientBackground>
      </footer>

      </div>{/* /sectionsWrap */}

    </div>
  );
};

export default HomeContent;
