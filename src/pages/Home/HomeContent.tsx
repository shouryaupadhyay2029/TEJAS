import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link as RouterLink } from 'react-router-dom';
import GradientBackground from '../../components/GradientBackground';
import { Noise } from '../../components/GradientBackground';
import styles from './HomeContent.module.css';

/* ── Shared ──────────────────────────────────────────── */
const ease = [0.16, 1, 0.3, 1] as const;

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
      initial={{ opacity: 0, y: 20, x }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.7, delay, ease }}
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
      viewport={{ once: true }}
      style={{ originX: 0 }}
      transition={{ duration: 0.9, delay, ease }}
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
  { label: 'ASSET AVAILABILITY',       text: 'Better in-service reliability through prioritized, timely maintenance.' },
  { label: 'BLOCK UTILIZATION',        text: 'Higher utilization of available track time through coordinated scheduling.' },
  { label: 'MAINTENANCE COORDINATION', text: 'Improved alignment across Engineering, S&T and Traction teams.' },
  { label: 'PLANNING EFFICIENCY',      text: 'Faster turnaround on block plans with constraint-aware optimization.' },
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
          S01 — THE PROBLEM
      ═══════════════════════════════════════════════════ */}
      <section className={styles.section} id="problem">
        <div className={styles.sectionInner}>
          <Rule />
          <div className={styles.problemGrid}>
            <div className={styles.problemLeft}>
              <Reveal delay={0.05}>
                <SectionLabel num="01" label="THE PROBLEM" />
              </Reveal>
              <Reveal delay={0.12}>
                <h2 className={styles.problemStatement}>
                  Railway maintenance isn't just about fixing assets.
                  <em> It's about finding the right time to fix them.</em>
                </h2>
              </Reveal>
            </div>

            <div className={styles.problemRight}>
              <Reveal delay={0.2}>
                <p className={styles.problemBody}>
                  Maintenance activities across Engineering, S&T and Traction
                  departments compete for a limited supply of railway blocks —
                  tightly controlled windows when track sections can be taken
                  out of service.
                </p>
                <p className={styles.problemBody} style={{ marginTop: '1.25rem' }}>
                  At the same time, asset condition, defect urgency, traffic
                  requirements and operational constraints are constantly
                  shifting. Without a unified system, coordination remains
                  manual, visibility is fragmented and opportunities for
                  efficient combined maintenance are missed.
                </p>
              </Reveal>

              <Reveal delay={0.28}>
                <div className={styles.indicators}>
                  {['Asset Condition Tracking', 'Multi-Department Scheduling', 'Block Window Optimization'].map((ind, i) => (
                    <div key={i} className={styles.indicator}>
                      <span className={styles.indicatorDot} />
                      <span className={styles.indicatorLabel}>{ind}</span>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          S02 — THE APPROACH
      ═══════════════════════════════════════════════════ */}
      <section className={styles.section} id="approach">
        <div className={styles.sectionInner}>
          <Rule />
          <div className={styles.approachHeader}>
            <Reveal delay={0.05}>
              <SectionLabel num="02" label="THE TEJAS APPROACH" />
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
          S03 — WHY TEJAS
      ═══════════════════════════════════════════════════ */}
      <section className={styles.section} id="why">
        <div className={styles.sectionInner}>
          <Rule />
          <Reveal delay={0.05}>
            <SectionLabel num="03" label="WHY TEJAS" />
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className={styles.whyHeadline}>
              One system.&nbsp; Three departments.&nbsp; One coordinated plan.
            </h2>
          </Reveal>

          <div className={styles.deptDiagram}>
            {/* Left — three departments */}
            <div className={styles.deptList}>
              {['ENGINEERING', 'S&T', 'TRACTION'].map((dept, i) => (
                <Reveal key={dept} delay={0.15 + i * 0.1} className={styles.deptItem}>
                  <span className={styles.deptLabel}>{dept}</span>
                  <span className={styles.deptConnector} />
                </Reveal>
              ))}
            </div>

            {/* Center — optimizer */}
            <Reveal delay={0.35} className={styles.deptCenter}>
              <div className={styles.optimizerBox}>
                <span className={styles.optimizerEyebrow}>TEJAS</span>
                <span className={styles.optimizerTitle}>OPTIMIZER</span>
              </div>
            </Reveal>

            {/* Right — output */}
            <Reveal delay={0.45} className={styles.deptOutput} x={20}>
              <span className={styles.deptOutputArrow}>→</span>
              <div>
                <span className={styles.deptOutputTitle}>COORDINATED PLAN</span>
                <p className={styles.deptOutputDesc}>
                  Instead of planning each department independently, TEJAS identifies opportunities to combine compatible maintenance work into shared block windows — reducing conflicts and maximising the use of available track time.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          S04 — HOW IT WORKS
      ═══════════════════════════════════════════════════ */}
      <section className={styles.section} id="how">
        <div className={styles.sectionInner}>
          <Rule />
          <div className={styles.howHeader}>
            <Reveal delay={0.05}>
              <SectionLabel num="04" label="HOW IT WORKS" />
            </Reveal>
            <Reveal delay={0.1}>
              <h2 className={styles.howHeadline}>Four steps from task to plan.</h2>
            </Reveal>
          </div>

          <div className={styles.timeline}>
            {[
              { n: '01', title: 'CAPTURE',    body: 'Maintenance tasks, asset information, defect records and operational constraints enter the system from all departments.' },
              { n: '02', title: 'PRIORITIZE', body: 'AI-assisted analysis evaluates asset condition, defect severity and urgency to determine which tasks require greater attention.' },
              { n: '03', title: 'COORDINATE', body: 'Tasks from Engineering, S&T and Traction are evaluated for compatible work windows and combined scheduling opportunities.' },
              { n: '04', title: 'OPTIMIZE',   body: 'Constraint-aware scheduling using CP-SAT generates feasible, efficient block plans that respect traffic and operational requirements.' },
            ].map((step, i) => (
              <Reveal key={step.n} delay={0.08 + i * 0.1} className={styles.timelineStep}>
                <div className={styles.timelineLeft}>
                  <span className={styles.timelineNum}>{step.n}</span>
                  {i < 3 && <span className={styles.timelineTrack} />}
                </div>
                <div className={styles.timelineRight}>
                  <h4 className={styles.timelineTitle}>{step.title}</h4>
                  <p className={styles.timelineBody}>{step.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          S05 — INTELLIGENCE LAYER
      ═══════════════════════════════════════════════════ */}
      <section className={styles.section} id="intelligence">
        <div className={styles.sectionInner}>
          <Rule />
          <div className={styles.intelGrid}>
            <div className={styles.intelLeft}>
              <Reveal delay={0.05}>
                <SectionLabel num="05" label="THE INTELLIGENCE LAYER" />
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
          S06 — WHAT CHANGES
      ═══════════════════════════════════════════════════ */}
      <section className={styles.section} id="changes">
        <div className={styles.sectionInner}>
          <Rule />
          <Reveal delay={0.05}>
            <SectionLabel num="06" label="WHAT CHANGES" />
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
          S07 — PLATFORM CAPABILITIES
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
              <SectionLabel num="07" label="PLATFORM CAPABILITIES" />
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
                  <RouterLink
                    to={cap.to}
                    className={styles.capRow}
                    style={{
                      opacity: capHovered === null ? 1 : capHovered === i ? 1 : 0.3,
                      transition: 'opacity 0.3s ease',
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
                  </RouterLink>
                </Reveal>
              ))}
            </div>
          </div>
        </GradientBackground>
      </section>

      {/* ═══════════════════════════════════════════════════
          S08 — OPERATIONAL VALUE
      ═══════════════════════════════════════════════════ */}
      <section className={styles.section} id="value">
        <div className={styles.sectionInner}>
          <Rule />
          <Reveal delay={0.05}>
            <SectionLabel num="08" label="OPERATIONAL VALUE" />
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
                <span className={styles.metricLabel}>{m.label}</span>
                <span className={styles.metricText}>{m.text}</span>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          S09 — BUILT FOR RAILWAY
      ═══════════════════════════════════════════════════ */}
      <section className={styles.section} id="railway">
        <div className={styles.sectionInner}>
          <Rule />
          <Reveal delay={0.05}>
            <SectionLabel num="09" label="BUILT FOR RAILWAY OPERATIONS" />
          </Reveal>
          <Reveal delay={0.12}>
            <h2 className={styles.statementHeadline}>
              Maintenance doesn't happen in isolation.
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className={styles.statementBody}>
              Railway maintenance operates within a network of assets,
              departments, traffic requirements, safety considerations
              and limited work windows — all of which must be accounted
              for in every plan. TEJAS is built with this complexity in mind.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          S10 — FINAL CTA
      ═══════════════════════════════════════════════════ */}
      <section className={styles.ctaSection} id="cta">
        <div className={styles.sectionInner}>
          <Rule />
          <Reveal delay={0.08}>
            <h2 className={styles.ctaHeadline}>Ready to plan the next block?</h2>
          </Reveal>
          <Reveal delay={0.16}>
            <p className={styles.ctaBody}>
              Explore how TEJAS brings maintenance prioritization, coordinated planning
              and optimization into one operational platform.
            </p>
          </Reveal>
          <Reveal delay={0.24}>
            <div className={styles.ctaButtons}>
              <RouterLink to="/login" className={styles.ctaPrimary}>
                ACCESS DASHBOARD
              </RouterLink>
              <RouterLink to="/dashboard" className={styles.ctaSecondary}>
                EXPLORE THE PLATFORM
              </RouterLink>
            </div>
          </Reveal>
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
                  <RouterLink key={link} to={navPaths[i]} className={styles.footerLink}>
                    {link}
                  </RouterLink>
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
