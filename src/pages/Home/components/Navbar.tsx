import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, LogOut, UserCheck } from 'lucide-react';
import styles from '../Home.module.css';

import { TransitionLink } from '../../../components/PageTransition';
import { useAuth } from '../../../context/AuthContext';

const ease = [0.16, 1, 0.3, 1] as const;

/* Parent nav — stagger children */
const navVariant = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const itemVariant = {
  hidden: { opacity: 0, y: -14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
};

const circleVariant = {
  hidden: { opacity: 0, scale: 0.5 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.55, ease } },
};

const logoTextVariant = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0, transition: { duration: 0.45, delay: 0.1, ease } },
};

const linkVariant = {
  hidden: { opacity: 0, y: -8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease } },
};

const navLinks = [
  { to: '/', label: 'HOME', num: '01' },
  { to: '/dashboard', label: 'DASHBOARD', num: '02' },
  { to: '/maintenance', label: 'MAINTENANCE', num: '03' },
  { to: '/block-planning', label: 'PLANNING', num: '04' },
  { to: '/optimization', label: 'OPTIMIZATION', num: '05' },
  { to: '/traffic', label: 'TRAFFIC', num: '06' },
  { to: '/assets', label: 'ASSETS', num: '07' },
  { to: '/reports', label: 'REPORTS', num: '09' },
];

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

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
            <motion.div className={styles.logoCircle} variants={circleVariant}>
              TEJ
            </motion.div>
            <motion.span className={styles.logoTextOutside} variants={logoTextVariant}>
              AS
            </motion.span>
          </div>
          <motion.div className={styles.logoDivider} variants={itemVariant} />
          <motion.span className={styles.logoTagline} variants={itemVariant}>
            FOR INDIAN<br />RAILWAYS
          </motion.span>
        </motion.div>

        {/* CENTER — Nav links */}
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

        {/* RIGHT — Identity Badge & Login/Logout CTA */}
        <motion.div
          className={styles.navRight}
          variants={{ hidden: { opacity: 0, y: -10 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.55, ease } } }}
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
        >
          {isAuthenticated && user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.75)',
                backdropFilter: 'blur(8px)',
                padding: '4px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(0,0,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#1e1b19'
              }}>
                <UserCheck size={14} color="var(--color-railway-red)" />
                <span>{user.officerId}</span>
                <span style={{
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: 'var(--color-railway-red)',
                  color: '#ffffff',
                  fontSize: '0.65rem',
                  textTransform: 'uppercase'
                }}>
                  {user.role.replace('FIELD_OFFICER_', '').replace('_', ' ')}
                </span>
              </div>

              <button
                onClick={handleLogout}
                title="Sign out of operational session"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(188,71,58,0.3)',
                  background: 'rgba(188,71,58,0.08)',
                  color: '#bc473a',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  cursor: 'pointer'
                }}
              >
                <LogOut size={14} />
                <span>LOGOUT</span>
              </button>
            </div>
          ) : (
            <TransitionLink to="/auth" label="ACCESS" className={`${styles.orderButton} interactive-hover`}>
              COMMAND LOGIN
            </TransitionLink>
          )}
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

            <div className={styles.mobileMenuContent}>
              <motion.div
                className={styles.mobileLinksList}
                variants={{
                  hidden: {},
                  show: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } }
                }}
                initial="hidden"
                animate="show"
              >
                {navLinks.map(({ to, label, num }) => (
                  <motion.div key={to} variants={linkVariant}>
                    <TransitionLink to={to} label={label} className={styles.mobileNavLink}>
                      <span className={styles.mobileNavNum}>{num}</span>
                      {label}
                    </TransitionLink>
                  </motion.div>
                ))}
                {isAuthenticated ? (
                  <button onClick={handleLogout} style={{ marginTop: '1rem', padding: '0.75rem', background: '#bc473a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700 }}>
                    LOGOUT ({user?.officerId})
                  </button>
                ) : (
                  <TransitionLink to="/auth" label="ACCESS" style={{ marginTop: '1rem', display: 'block', textAlign: 'center', padding: '0.75rem', background: '#bc473a', color: '#fff', textDecoration: 'none', borderRadius: '8px', fontWeight: 700 }}>
                    COMMAND LOGIN
                  </TransitionLink>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
