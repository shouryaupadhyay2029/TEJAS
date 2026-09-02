import React from 'react';
import { motion } from 'framer-motion';
import { TransitionLink } from '../../components/PageTransition';
import GradientBackground from '../../components/GradientBackground';
import Navbar from './components/Navbar';
import HomeContent from './HomeContent';
import styles from './Home.module.css';

/* ── Shared ease ─────────────────────────────────────── */
const ease = [0.16, 1, 0.3, 1] as const;

/* ── Variants ────────────────────────────────────────── */
const titleVariant = {
  hidden: { opacity: 0, scale: 0.82, y: 12 },
  show: {
    opacity: 1, scale: 1, y: 0,
    transition: { duration: 0.9, delay: 0.25, ease }
  },
};

const ctaVariant = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: 0.65, ease }
  },
};

/* ── Floating feature data with positions & drift ──── */
const features = [
  {
    num: '01',
    title: 'AI MAINTENANCE\nPRIORITIZATION',
    desc: 'Rank maintenance tasks by asset condition, defects, urgency and operational factors.',
    // position: left-side, upper
    style: { top: '18%', left: '2.5%' },
    drift: { y: [0, -11, 0], duration: 5.2, delay: 0 },
  },
  {
    num: '02',
    title: 'DEFECT &\nASSET INTELLIGENCE',
    desc: 'Centralize asset condition, defect history and maintenance records.',
    // position: left-side, mid
    style: { top: '44%', left: '4%' },
    drift: { y: [0, -8, 0], duration: 4.5, delay: 0.9 },
  },
  {
    num: '03',
    title: 'COORDINATED\nBLOCK PLANNING',
    desc: 'Align Engineering, S&T and Traction activities within shared work windows.',
    // position: left-side, lower
    style: { top: '67%', left: '2%' },
    drift: { y: [0, -13, 0], duration: 6.0, delay: 1.8 },
  },
  {
    num: '04',
    title: 'BLOCK\nOPTIMIZATION',
    desc: 'CP-SAT constraint solving finds feasible, efficient block schedules.',
    // position: left-center, near bottom
    style: { top: '76%', left: '22%' },
    drift: { y: [0, -9, 0], duration: 4.8, delay: 0.5 },
  },
  {
    num: '05',
    title: 'OPERATIONAL\nINSIGHTS',
    desc: 'Data-driven visibility for better planning and faster decisions.',
    // position: between left and center, mid-low
    style: { top: '33%', left: '15%' },
    drift: { y: [0, -10, 0], duration: 5.6, delay: 1.4 },
  },
];

/* ── Benefits with right-side float positions ─────── */
const benefits = [
  {
    num: '01',
    label: 'REDUCED\nDOWNTIME',
    sub: 'Less reactive, more planned maintenance.',
    style: { top: '19%', right: '3%' },
    drift: { y: [0, -10, 0], duration: 4.9, delay: 0.3 },
  },
  {
    num: '02',
    label: 'BETTER ASSET\nAVAILABILITY',
    sub: 'Higher in-service reliability across the fleet.',
    style: { top: '36%', right: '7%' },
    drift: { y: [0, -8, 0], duration: 5.5, delay: 1.1 },
  },
  {
    num: '03',
    label: 'COORDINATED\nWORK',
    sub: 'Multi-department alignment in one system.',
    style: { top: '54%', right: '3%' },
    drift: { y: [0, -12, 0], duration: 6.2, delay: 0.7 },
  },
  {
    num: '04',
    label: 'OPTIMIZED\nBLOCK WINDOWS',
    sub: 'Maximum utilization of available track time.',
    style: { top: '70%', right: '9%' },
    drift: { y: [0, -9, 0], duration: 4.6, delay: 1.6 },
  },
  {
    num: '05',
    label: 'FASTER\nDECISIONS',
    sub: 'Clear signals, less ambiguity, quicker action.',
    style: { top: '81%', right: '22%' },
    drift: { y: [0, -11, 0], duration: 5.8, delay: 0.0 },
  },
];


/* ── Component ───────────────────────────────────────── */
export const Home: React.FC = () => {
  return (
    <div className={`${styles.homeContainer} page-fade-enter`}>
      <div className={styles.heroSection}>
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
        >
          {/* Navbar — self-animating */}
          <Navbar />

          {/* ── Floating features overlay (left side) ──── */}
          <div className={styles.floatingOverlay}>
            {features.map((f, i) => (
              <motion.div
                key={f.num}
                className={styles.floatingItem}
                style={f.style}
                /* entrance: fade + rise */
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: 1,
                  y: f.drift.y,
                }}
                transition={{
                  opacity: { duration: 0.7, delay: 0.3 + i * 0.15, ease },
                  y: {
                    duration: f.drift.duration,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: f.drift.delay,
                  },
                }}
              >
                <span className={styles.floatNum}>{f.num}</span>
                <div className={styles.floatBody}>
                  {f.title.split('\n').map((line, li) => (
                    <span key={li} className={styles.floatTitleLine}>{line}</span>
                  ))}
                  <span className={styles.floatDesc}>{f.desc}</span>
                </div>
              </motion.div>
            ))}
            {/* Benefits floating on the right */}
            {benefits.map((b, i) => (
              <motion.div
                key={b.num}
                className={`${styles.floatingItem} ${styles.floatingItemRight}`}
                style={b.style}
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: 1,
                  y: b.drift.y,
                }}
                transition={{
                  opacity: { duration: 0.7, delay: 0.35 + i * 0.15, ease },
                  y: {
                    duration: b.drift.duration,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: b.drift.delay,
                  },
                }}
              >
                <div className={styles.floatBody}>
                  {b.label.split('\n').map((line, li) => (
                    <span key={li} className={styles.floatTitleLine}>{line}</span>
                  ))}
                  <span className={styles.floatDesc}>{b.sub}</span>
                </div>
                <span className={styles.floatNum}>{b.num}</span>
              </motion.div>
            ))}
          </div>

          {/* ── Center only — TEJAS + CTAs ───────────────── */}
          <div className={styles.heroCenter}>
            <motion.h1
              className={styles.heroTitle}
              variants={titleVariant}
              initial="hidden"
              animate="show"
            >
              <span className={styles.titleWrapper}>
                TEJAS
                <span className={styles.sealDisc}>
                  <span className={styles.sealCenterDot} />
                  <span className={styles.sealTextRotationWrapper}>
                    <svg viewBox="0 0 100 100" className={styles.sealSvg}>
                      <path
                        id="sealCirclePath"
                        d="M 50, 50 m -38, 0 a 38,38 0 1, 1 76, 0 a 38,38 0 1, 1 -76, 0"
                        fill="none"
                      />
                      <text>
                        <textPath href="#sealCirclePath" className={styles.sealTextPath}>
                          FOR INDIAN RAILWAYS • INDIAN RAILWAYS •
                        </textPath>
                      </text>
                    </svg>
                  </span>
                </span>
              </span>
            </motion.h1>
            <motion.div
              className={styles.ctaGroup}
              variants={ctaVariant}
              initial="hidden"
              animate="show"
            >
              <TransitionLink to="/login" label="ACCESS" className={`${styles.ctaPrimary} interactive-hover`}>
                ACCESS DASHBOARD
              </TransitionLink>
              <TransitionLink to="/dashboard" label="DASHBOARD" className={`${styles.ctaSecondary} interactive-hover`}>
                SEE HOW IT WORKS
              </TransitionLink>
            </motion.div>
          </div>
        </GradientBackground>
      </div>

      {/* ── Content sections below hero ─────────────── */}
      <HomeContent />

    </div>
  );
};

export default Home;
