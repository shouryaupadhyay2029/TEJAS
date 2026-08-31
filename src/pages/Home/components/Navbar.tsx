import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import styles from '../Home.module.css';

import { TransitionLink } from '../../../components/PageTransition';

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
  { to: '/',              label: 'HOME',        num: '01' },
  { to: '/dashboard',     label: 'DASHBOARD',   num: '02' },
  { to: '/maintenance',   label: 'MAINTENANCE', num: '03' },
  { to: '/block-planning',label: 'PLANNING',    num: '04' },
  { to: '/assets',        label: 'ASSETS',      num: '05' },
  { to: '/reports',       label: 'REPORTS',     num: '06' },
];

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  
  const location = useLocation();
  const currentPath = location.pathname;

  // Find active node based on current path
  const activeLinkObj = navLinks.find(link => link.to === currentPath) || navLinks[0];
  const activeNum = activeLinkObj.num;
  const activeLabel = activeLinkObj.label;

  return (
    <>
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
              <TransitionLink to={to} label={label} className={`${styles.navLink} nav-underline-anim`}>
                {label}
              </TransitionLink>
            </motion.div>
          ))}
        </motion.div>

        {/* RIGHT — CTA pill: fades in last */}
        <motion.div
          className={styles.navRight}
          variants={{ hidden: { opacity: 0, y: -10 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.55, ease } } }}
        >
          <TransitionLink to="/login" label="ACCESS" className={`${styles.orderButton} interactive-hover`}>
            ACCESS DASHBOARD
          </TransitionLink>
        </motion.div>

        {/* MOBILE HAMBURGER BUTTON */}
        <div className={styles.hamburgerButton} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X size={24} color="#1e1b19" /> : <Menu size={24} color="#1e1b19" />}
        </div>
      </motion.nav>

      {/* MOBILE MENU OVERLAY */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className={styles.mobileMenuOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease }}
          >
            {/* Header section in overlay */}
            <div className={styles.mobileMenuHeader}>
              <div className={styles.logoGroup} style={{ opacity: 1 }}>
                <div className={styles.logoWrapper}>
                  <div className={styles.logoCircle}>TEJ</div>
                  <span className={styles.logoTextOutside}>AS</span>
                </div>
                <div className={styles.logoDivider} />
                <span className={styles.logoTagline}>
                  FOR INDIAN<br />RAILWAYS
                </span>
              </div>
              <div className={styles.hamburgerButtonClose} onClick={() => setMobileMenuOpen(false)}>
                <X size={24} color="#1e1b19" />
              </div>
            </div>

            {/* Content section */}
            <div className={styles.mobileMenuContent}>
              {/* Leftaligned index list */}
              <motion.div 
                className={styles.mobileLinksList}
                variants={{
                  hidden: {},
                  show: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } }
                }}
                initial="hidden"
                animate="show"
              >
                {navLinks.map(({ to, label, num }, idx) => (
                  <motion.div
                    key={to}
                    variants={{
                      hidden: { y: 24, opacity: 0 },
                      show: { y: 0, opacity: 1, transition: { duration: 0.7, ease } }
                    }}
                    style={{ width: '100%' }}
                  >
                    <TransitionLink
                      to={to}
                      label={label}
                      className={`${styles.mobileMenuRow} ${hoveredIdx === idx ? styles.mobileMenuRowActive : ''}`}
                      style={{
                        paddingLeft: hoveredIdx === idx ? '8px' : '0px',
                        opacity: hoveredIdx === null ? 1 : hoveredIdx === idx ? 1 : 0.4
                      }}
                      onMouseEnter={() => setHoveredIdx(idx)}
                      onMouseLeave={() => setHoveredIdx(null)}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span className={styles.mobileMenuNum}>{num}</span>
                      <span className={styles.mobileMenuLabel}>{label}</span>
                      <span className={styles.menuWipeLine} />
                    </TransitionLink>
                  </motion.div>
                ))}
              </motion.div>

              {/* Current active section elements */}
              <div className={styles.mobileMenuPosition}>
                <div className={styles.mobileMenuPositionLine} />
                <span className={styles.mobileMenuPosNum}>TEJAS / {activeNum}</span>
                <span className={styles.mobileMenuPosLabel}>{activeLabel}</span>
              </div>
            </div>

            {/* Bottom compact dashboard button */}
            <div className={styles.mobileCtaWrapper}>
              <TransitionLink
                to="/login"
                label="ACCESS"
                className={styles.mobileMenuCta}
                onClick={() => setMobileMenuOpen(false)}
              >
                ACCESS DASHBOARD →
              </TransitionLink>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
