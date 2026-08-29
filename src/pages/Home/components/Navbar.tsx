import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import styles from '../Home.module.css';

const ease = [0.16, 1, 0.3, 1] as const;

/* Parent nav — stagger children */
const navVariant = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

/* Each section of the navbar fades+slides down */
const itemVariant = {
  hidden: { opacity: 0, y: -14 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
};

/* Logo circle: scale in from 0 */
const circleVariant = {
  hidden: { opacity: 0, scale: 0.5 },
  show:   { opacity: 1, scale: 1, transition: { duration: 0.55, ease } },
};

/* "AS" text beside circle: slide in from left */
const logoTextVariant = {
  hidden: { opacity: 0, x: -10 },
  show:   { opacity: 1, x: 0, transition: { duration: 0.45, delay: 0.1, ease } },
};

/* Each nav link: staggered fade up */
const linkVariant = {
  hidden: { opacity: 0, y: -8 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4, ease } },
};

const navLinks = [
  { to: '/',              label: 'HOME' },
  { to: '/dashboard',     label: 'DASHBOARD' },
  { to: '/maintenance',   label: 'MAINTENANCE' },
  { to: '/block-planning',label: 'PLANNING' },
  { to: '/assets',        label: 'ASSETS' },
  { to: '/reports',       label: 'REPORTS' },
];

export const Navbar: React.FC = () => {
  return (
    <motion.nav
      className={styles.navbar}
      variants={navVariant}
      initial="hidden"
      animate="show"
    >
      {/* LEFT — Logo group */}
      <motion.div className={styles.logoGroup} variants={itemVariant}>
        <div className={styles.logoWrapper}>
          {/* Circular logo: scales in */}
          <motion.div className={styles.logoCircle} variants={circleVariant}>
            TEJ
          </motion.div>
          {/* "AS" text: slides in from left */}
          <motion.span className={styles.logoTextOutside} variants={logoTextVariant}>
            AS
          </motion.span>
        </div>
        <motion.div className={styles.logoDivider} variants={itemVariant} />
        <motion.span className={styles.logoTagline} variants={itemVariant}>
          FOR INDIAN<br />RAILWAYS
        </motion.span>
      </motion.div>

      {/* CENTER — Nav links: each staggered */}
      <motion.div
        className={styles.navLinks}
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.2 } } }}
      >
        {navLinks.map(({ to, label }) => (
          <motion.div key={to} variants={linkVariant}>
            <RouterLink to={to} className={styles.navLink}>{label}</RouterLink>
          </motion.div>
        ))}
      </motion.div>

      {/* RIGHT — CTA pill: fades in last */}
      <motion.div
        className={styles.navRight}
        variants={{ hidden: { opacity: 0, y: -10 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.55, ease } } }}
      >
        <RouterLink to="/login" className={styles.orderButton}>
          ACCESS DASHBOARD
        </RouterLink>
      </motion.div>
    </motion.nav>
  );
};

export default Navbar;
