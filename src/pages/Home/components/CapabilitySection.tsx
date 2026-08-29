import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Zap, Compass } from 'lucide-react';
import { motion } from 'framer-motion';
import styles from '../Home.module.css';

export const CapabilitySection: React.FC = () => {
  return (
    <motion.section 
      className={styles.introSection}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
    >
      {/* Overlapping Curved Wave Transition */}
      <div className={styles.curveContainer} aria-hidden="true">
        <svg
          viewBox="0 0 1440 400"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          className={styles.curveSvg}
        >
          <path
            d="M0,240 C360,290 1080,290 1440,240 L1440,400 L0,400 Z"
            fill="var(--color-primary, #d2b48c)"
          />
        </svg>
      </div>

      <div className={styles.introContentWrapper}>
        <div className={styles.threeColumnRow}>
          
          {/* Left Column: Description in Uppercase */}
          <div className={styles.introLeftCol}>
            <p className={styles.referenceDescriptionText}>
              TEJAS IS AN INTEGRATED PLATFORM FOR INTELLIGENT RAILWAY MAINTENANCE PLANNING &amp; AUTOMATED BLOCK SCHEDULING OPERATIONS.
            </p>
          </div>

          {/* Center Column: 3 Capsule Pills side-by-side */}
          <div className={styles.introCenterCol}>
            <Link to="/maintenance" className={styles.capsulePill}>
              PLAN
            </Link>
            <Link to="/optimization" className={styles.capsulePillActive}>
              OPTIMIZE
            </Link>
            <Link to="/block-planning" className={styles.capsulePill}>
              EXECUTE
            </Link>
          </div>

          {/* Right Column: Three Metrics items with Icons */}
          <div className={styles.introRightCol}>
            <div className={styles.refMetricItem}>
              <Shield size={16} className={styles.refMetricIcon} />
              <div className={styles.refMetricText}>
                <strong>99.4%</strong>
                <span>AVAILABILITY</span>
              </div>
            </div>
            <div className={styles.refMetricItem}>
              <Zap size={16} className={styles.refMetricIcon} />
              <div className={styles.refMetricText}>
                <strong>1,240+</strong>
                <span>MAIN TASKS</span>
              </div>
            </div>
            <div className={styles.refMetricItem}>
              <Compass size={16} className={styles.refMetricIcon} />
              <div className={styles.refMetricText}>
                <strong>92.1%</strong>
                <span>BLOCK UTIL</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </motion.section>
  );
};

export default CapabilitySection;
