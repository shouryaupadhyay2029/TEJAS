import React, { useState } from 'react';
import { motion, useInView } from 'framer-motion';
import styles from './FeatureFloat.module.css';

/* ── Data ────────────────────────────────────────────── */
const features = [
  {
    id: 'f1',
    num: '01',
    title: 'AI MAINTENANCE\nPRIORITIZATION',
    desc: 'Rank maintenance tasks using asset condition, defects, urgency and operational factors.',
  },
  {
    id: 'f2',
    num: '02',
    title: 'DEFECT & ASSET\nINTELLIGENCE',
    desc: 'Centralize asset condition, defect history and maintenance records.',
  },
  {
    id: 'f3',
    num: '03',
    title: 'COORDINATED\nBLOCK PLANNING',
    desc: 'Align Engineering, S&T and Traction activities within shared work windows.',
  },
  {
    id: 'f4',
    num: '04',
    title: 'BLOCK\nOPTIMIZATION',
    desc: 'CP-SAT constraint solving finds feasible, efficient block schedules.',
  },
  {
    id: 'f5',
    num: '05',
    title: 'OPERATIONAL\nINSIGHTS',
    desc: 'Data-driven visibility for better planning and faster decisions.',
  },
];

/* ── Staggered entrance variant ──────────────────────── */
const ease = [0.16, 1, 0.3, 1] as const;

const containerVariant = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.11, delayChildren: 0.1 },
  },
};

const itemVariant = {
  hidden: { opacity: 0, y: 22 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.65, ease } },
};

/* ── Component ───────────────────────────────────────── */
const FeatureFloat: React.FC = () => {
  const [hovered, setHovered] = useState<string | null>(null);
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section className={styles.section} ref={ref} aria-label="What We Offer">

      {/* Section eyebrow */}
      <motion.div
        className={styles.sectionEyebrow}
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.6, delay: 0.05, ease }}
      >
        <span className={styles.eyebrowRule} />
        <span className={styles.eyebrowLabel}>WHAT WE OFFER</span>
        <span className={styles.eyebrowRule} />
      </motion.div>

      {/* Floating canvas */}
      <motion.div
        className={styles.canvas}
        variants={containerVariant}
        initial="hidden"
        animate={inView ? 'show' : 'hidden'}
        onMouseLeave={() => setHovered(null)}
      >

        {/* Subtle SVG connector lines */}
        <svg className={styles.connectorSvg} aria-hidden="true">
          {/* F1 → F3 faint diagonal */}
          <line x1="22%" y1="18%" x2="62%" y2="16%" className={styles.connectorLine} />
          {/* F2 → F4 faint diagonal */}
          <line x1="14%" y1="58%" x2="66%" y2="62%" className={styles.connectorLine} />
          {/* F4 → F5 faint vertical curve — approximate with line */}
          <line x1="72%" y1="66%" x2="48%" y2="84%" className={styles.connectorLine} />
        </svg>

        {/* F1 — upper left */}
        <motion.div
          className={`${styles.feature} ${styles.f1}`}
          variants={itemVariant}
          animate={
            hovered === null ? { opacity: 1 } :
            hovered === 'f1' ? { opacity: 1 } :
            { opacity: 0.2 }
          }
          transition={{ duration: 0.35 }}
          onMouseEnter={() => setHovered('f1')}
        >
          <FeatureItem id="f1" feature={features[0]} hovered={hovered} />
        </motion.div>

        {/* F2 — mid left */}
        <motion.div
          className={`${styles.feature} ${styles.f2}`}
          variants={itemVariant}
          animate={
            hovered === null ? { opacity: 1 } :
            hovered === 'f2' ? { opacity: 1 } :
            { opacity: 0.2 }
          }
          transition={{ duration: 0.35 }}
          onMouseEnter={() => setHovered('f2')}
        >
          <FeatureItem id="f2" feature={features[1]} hovered={hovered} />
        </motion.div>

        {/* F3 — upper right */}
        <motion.div
          className={`${styles.feature} ${styles.f3}`}
          variants={itemVariant}
          animate={
            hovered === null ? { opacity: 1 } :
            hovered === 'f3' ? { opacity: 1 } :
            { opacity: 0.2 }
          }
          transition={{ duration: 0.35 }}
          onMouseEnter={() => setHovered('f3')}
        >
          <FeatureItem id="f3" feature={features[2]} hovered={hovered} />
        </motion.div>

        {/* F4 — lower right */}
        <motion.div
          className={`${styles.feature} ${styles.f4}`}
          variants={itemVariant}
          animate={
            hovered === null ? { opacity: 1 } :
            hovered === 'f4' ? { opacity: 1 } :
            { opacity: 0.2 }
          }
          transition={{ duration: 0.35 }}
          onMouseEnter={() => setHovered('f4')}
        >
          <FeatureItem id="f4" feature={features[3]} hovered={hovered} />
        </motion.div>

        {/* F5 — lower center */}
        <motion.div
          className={`${styles.feature} ${styles.f5}`}
          variants={itemVariant}
          animate={
            hovered === null ? { opacity: 1 } :
            hovered === 'f5' ? { opacity: 1 } :
            { opacity: 0.2 }
          }
          transition={{ duration: 0.35 }}
          onMouseEnter={() => setHovered('f5')}
        >
          <FeatureItem id="f5" feature={features[4]} hovered={hovered} />
        </motion.div>

      </motion.div>
    </section>
  );
};

/* ── Individual feature item ─────────────────────────── */
interface FeatureItemProps {
  id: string;
  feature: { num: string; title: string; desc: string };
  hovered: string | null;
}

const FeatureItem: React.FC<FeatureItemProps> = ({ id, feature, hovered }) => {
  const isActive = hovered === id;

  return (
    <div className={styles.featureInner}>
      {/* Accent marker */}
      <motion.span
        className={styles.accentMarker}
        animate={{ width: isActive ? '22px' : '10px', opacity: isActive ? 0.7 : 0.25 }}
        transition={{ duration: 0.3 }}
      />
      <div className={styles.featureContent}>
        <span className={styles.featureNum}>{feature.num}</span>
        <motion.h3
          className={styles.featureTitle}
          animate={{ color: isActive ? 'rgba(250,246,240,1)' : 'rgba(250,246,240,0.72)' }}
          transition={{ duration: 0.3 }}
        >
          {feature.title.split('\n').map((line, i) => (
            <span key={i} className={styles.titleLine}>{line}</span>
          ))}
        </motion.h3>
        <motion.p
          className={styles.featureDesc}
          animate={{ opacity: isActive ? 0.65 : 0.3 }}
          transition={{ duration: 0.3 }}
        >
          {feature.desc}
        </motion.p>
      </div>
    </div>
  );
};

export default FeatureFloat;
