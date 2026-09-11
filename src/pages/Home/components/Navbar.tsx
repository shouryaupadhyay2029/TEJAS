import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, LogOut, UserCheck, AlertTriangle, Bell, Volume2, VolumeX, ChevronDown, ChevronUp, MapPin, Clock, Wrench, ShieldAlert } from 'lucide-react';
import styles from '../Home.module.css';

import { TransitionLink } from '../../../components/PageTransition';
import { useAuth } from '../../../context/AuthContext';
import { useNotifications } from '../../../context/NotificationContext';

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
  { to: '/defects', label: 'DEFECTS', num: '03' },
  { to: '/block-planning', label: 'PLANNING', num: '04' },
  { to: '/optimization', label: 'OPTIMIZATION', num: '05' },
  { to: '/traffic', label: 'TRAFFIC', num: '06' },
  { to: '/gis-map', label: 'GIS MAP', num: '07' },
  { to: '/reports', label: 'REPORTS', num: '08' },
];

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [bellDrawerOpen, setBellDrawerOpen] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const { user, isAuthenticated, logout } = useAuth();
  const { isAudioMuted, toggleAudioMute, unreadCount, notifications, acknowledgeEmergency, markAllRead } = useNotifications();
  const navigate = useNavigate();

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  // Check if logged in user is from Engineering, S&T, Traction, or Field Officer roles
  const isFieldDepartmentUser = Boolean(
    isAuthenticated &&
    user &&
    (
      user.role?.includes('FIELD') ||
      user.role?.includes('SSE') ||
      user.department?.toUpperCase().includes('ENG') ||
      user.department?.toUpperCase().includes('S&T') ||
      user.department?.toUpperCase().includes('SIGNAL') ||
      user.department?.toUpperCase().includes('TRACTION') ||
      user.department?.toUpperCase().includes('TRD')
    )
  );

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
          {navLinks.map(({ to, label }) => {
            const isDashboard = label === 'DASHBOARD';

            return (
              <motion.div key={to} variants={linkVariant} style={{ position: 'relative' }}>
                <TransitionLink to={to} label={label} className={`${styles.navLink} nav-underline-anim`}>
                  {label}
                </TransitionLink>

                {/* Smooth Animated Field Officer Prompt - DIRECTLY BELOW DASHBOARD ONLY */}
                {isDashboard && isFieldDepartmentUser && (
                  <motion.div
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/defects');
                    }}
                    initial={{ opacity: 0, y: -4, scale: 0.88 }}
                    animate={{ opacity: 1, y: [0, -4, 0], scale: 1 }}
                    transition={{
                      opacity: { duration: 0.4 },
                      y: { repeat: Infinity, duration: 2.2, ease: 'easeInOut' }
                    }}
                    title="Click to report field defects"
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'linear-gradient(135deg, #bc473a 0%, #a8382b 100%)',
                      color: '#ffffff',
                      fontSize: '0.58rem',
                      fontWeight: 900,
                      padding: '3.5px 9px',
                      borderRadius: '6px',
                      whiteSpace: 'nowrap',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: '0 4px 16px rgba(188, 71, 58, 0.48), 0 0 10px rgba(188, 71, 58, 0.3)',
                      cursor: 'pointer',
                      zIndex: 100,
                      letterSpacing: '0.07em',
                      border: '1px solid rgba(255, 255, 255, 0.35)',
                      pointerEvents: 'auto'
                    }}
                  >
                    {/* Upward pointing arrow caret */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '-5px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 0,
                        height: 0,
                        borderLeft: '5px solid transparent',
                        borderRight: '5px solid transparent',
                        borderBottom: '5px solid #bc473a'
                      }}
                    />
                    <AlertTriangle size={11} color="#ffffff" />
                    <span>REPORT DEFECTS HERE</span>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </motion.div>

        {/* RIGHT — Identity Badge, Audio Control, Bell Drawer & Login/Logout CTA */}
        <motion.div
          className={styles.navRight}
          variants={{ hidden: { opacity: 0, y: -10 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.55, ease } } }}
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', position: 'relative' }}
        >
          {/* AUDIO MUTE TOGGLE BUTTON */}
          <button
            onClick={toggleAudioMute}
            title={isAudioMuted ? 'Unmute Emergency Siren Audio' : 'Mute Emergency Siren Audio'}
            style={{
              background: 'rgba(255, 255, 255, 0.75)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(0,0,0,0.1)',
              borderRadius: '8px',
              padding: '6px 10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.68rem',
              fontWeight: 800,
              fontFamily: 'var(--font-mono, monospace)',
              color: isAudioMuted ? '#bc473a' : '#1e1b19',
              transition: 'all 0.2s ease',
            }}
          >
            {isAudioMuted ? <VolumeX size={14} color="#bc473a" /> : <Volume2 size={14} color="#27ae60" />}
            <span>{isAudioMuted ? 'MUTED' : 'AUDIO ON'}</span>
          </button>

          {/* NOTIFICATION BELL WITH DROPDOWN DRAWER */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setBellDrawerOpen(prev => !prev)}
              title="Notifications & Live Alerts"
              style={{
                background: 'rgba(255, 255, 255, 0.75)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(0,0,0,0.1)',
                borderRadius: '8px',
                padding: '6px 10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              <Bell size={15} color="#1e1b19" />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    backgroundColor: '#bc473a',
                    color: '#faf6f0',
                    fontSize: '0.55rem',
                    fontWeight: 900,
                    fontFamily: 'var(--font-mono, monospace)',
                    borderRadius: '99px',
                    padding: '1px 5px',
                    lineHeight: 1,
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </button>

            {/* DROPDOWN NOTIFICATION DRAWER */}
            <AnimatePresence>
              {bellDrawerOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 10px)',
                    right: 0,
                    width: '380px',
                    backgroundColor: 'rgba(252, 248, 240, 0.97)',
                    color: '#1e1b19',
                    borderRadius: '10px',
                    boxShadow: '0 16px 40px rgba(30, 27, 25, 0.22)',
                    backdropFilter: 'blur(16px)',
                    border: '1.5px solid rgba(30, 27, 25, 0.15)',
                    padding: '16px',
                    zIndex: 1000,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1.5px solid rgba(30, 27, 25, 0.1)', paddingBottom: '8px' }}>
                    <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.08em', color: '#bc473a' }}>
                      OPERATIONS FEED ({notifications.length})
                    </span>
                    <button
                      onClick={markAllRead}
                      style={{ background: 'none', border: 'none', color: 'rgba(30, 27, 25, 0.65)', fontSize: '0.62rem', cursor: 'pointer', fontFamily: 'var(--font-mono, monospace)', fontWeight: 700 }}
                    >
                      CLEAR ALL
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '380px', overflowY: 'auto', paddingRight: '2px' }}>
                    {notifications.length === 0 ? (
                      <p style={{ fontSize: '0.75rem', color: 'rgba(30, 27, 25, 0.6)', textAlign: 'center', margin: '1rem 0' }}>No active notifications</p>
                    ) : (
                      notifications.map(n => {
                        const isExpanded = !!expandedIds[n.id];
                        const dept = n.department || 'OPERATIONS';
                        const score = n.urgencyScore !== undefined ? (n.urgencyScore <= 1 ? n.urgencyScore * 100 : n.urgencyScore) : null;
                        
                        return (
                          <div
                            key={n.id}
                            onClick={(e) => toggleExpand(n.id, e)}
                            style={{
                              padding: '12px',
                              borderRadius: '6px',
                              background: n.type === 'EMERGENCY' ? 'rgba(188, 71, 58, 0.08)' : 'rgba(255, 255, 255, 0.75)',
                              border: '1px solid rgba(30, 27, 25, 0.1)',
                              borderLeft: `4px solid ${n.type === 'EMERGENCY' ? '#bc473a' : n.type === 'OPPORTUNITY' ? '#27ae60' : n.type === 'ATTENTION' ? '#e59866' : '#d2b48c'}`,
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              boxShadow: isExpanded ? '0 4px 12px rgba(30, 27, 25, 0.08)' : 'none',
                            }}
                          >
                            {/* Short View Top Bar: Department badge + Relative time + Expand Arrow */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.62rem', fontFamily: 'var(--font-mono, monospace)', fontWeight: 700 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{
                                  background: dept === 'ENGINEERING' ? 'rgba(188, 71, 58, 0.15)' : dept === 'S&T' ? 'rgba(39, 174, 96, 0.15)' : dept === 'TRACTION' ? 'rgba(229, 152, 102, 0.15)' : 'rgba(30, 27, 25, 0.08)',
                                  color: dept === 'ENGINEERING' ? '#bc473a' : dept === 'S&T' ? '#27ae60' : dept === 'TRACTION' ? '#d35400' : '#1e1b19',
                                  padding: '2px 6px',
                                  borderRadius: '3px',
                                  letterSpacing: '0.04em'
                                }}>
                                  {dept}
                                </span>
                                <span style={{ color: n.type === 'EMERGENCY' ? '#bc473a' : n.type === 'OPPORTUNITY' ? '#27ae60' : 'rgba(30,27,25,0.7)' }}>
                                  {n.type}
                                </span>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(30, 27, 25, 0.6)' }}>
                                <span>{n.timestamp}</span>
                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </div>
                            </div>

                            {/* Short Title & Message */}
                            <h6 style={{ margin: '6px 0 0', fontSize: '0.84rem', fontWeight: 800, color: '#1e1b19' }}>{n.title}</h6>
                            <p style={{ margin: '3px 0 0', fontSize: '0.74rem', color: 'rgba(30, 27, 25, 0.8)', lineHeight: 1.4 }}>{n.message}</p>

                            {!isExpanded && (
                              <div style={{ marginTop: '6px', fontSize: '0.62rem', color: '#bc473a', fontWeight: 700, fontFamily: 'var(--font-mono, monospace)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span>Click to expand report details</span>
                                <ChevronDown size={12} />
                              </div>
                            )}

                            {/* Expanded Detailed View */}
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.2 }}
                                  style={{
                                    marginTop: '10px',
                                    paddingTop: '10px',
                                    borderTop: '1px dashed rgba(30, 27, 25, 0.15)',
                                    fontSize: '0.72rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '6px',
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {/* Exact Time & Date */}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(30, 27, 25, 0.85)' }}>
                                    <Clock size={13} color="#bc473a" />
                                    <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono, monospace)', fontSize: '0.68rem' }}>
                                      REPORTED: {n.reportedExactTime || n.timestamp}
                                    </span>
                                  </div>

                                  {/* Route / Location */}
                                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', color: 'rgba(30, 27, 25, 0.85)' }}>
                                    <MapPin size={13} color="#bc473a" style={{ marginTop: '2px', flexShrink: 0 }} />
                                    <span>
                                      <strong>LOCATION:</strong> {n.routeLocation || n.sectionCode || 'Varanasi Division Mainline'}
                                    </span>
                                  </div>

                                  {/* Subsystem & Department */}
                                  {n.subsystem && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(30, 27, 25, 0.85)' }}>
                                      <Wrench size={13} color="#bc473a" style={{ flexShrink: 0 }} />
                                      <span>
                                        <strong>SUBSYSTEM:</strong> {n.subsystem}
                                      </span>
                                    </div>
                                  )}

                                  {/* Urgency Score Index */}
                                  {score !== null && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                      <ShieldAlert size={13} color={score > 90 ? '#bc473a' : '#e59866'} />
                                      <span style={{
                                        fontFamily: 'var(--font-mono, monospace)',
                                        fontSize: '0.68rem',
                                        fontWeight: 800,
                                        color: score > 90 ? '#bc473a' : '#d35400',
                                        background: score > 90 ? 'rgba(188, 71, 58, 0.12)' : 'rgba(229, 152, 102, 0.15)',
                                        padding: '2px 6px',
                                        borderRadius: '3px'
                                      }}>
                                        AI RISK INDEX: {score.toFixed(1)}% {score > 90 ? '(AUDIO SIREN THRESHOLD MET)' : '(SIREN MUTED - SCORE <= 90%)'}
                                      </span>
                                    </div>
                                  )}

                                  {/* Detailed Observations */}
                                  {n.detailedObservations && (
                                    <div style={{ background: 'rgba(255, 255, 255, 0.8)', padding: '6px 8px', borderRadius: '4px', borderLeft: '3px solid #1e1b19', marginTop: '4px' }}>
                                      <strong style={{ display: 'block', fontSize: '0.68rem', color: '#1e1b19', fontFamily: 'var(--font-mono, monospace)' }}>OBSERVATIONS:</strong>
                                      <span style={{ color: 'rgba(30, 27, 25, 0.85)', lineHeight: 1.35 }}>{n.detailedObservations}</span>
                                    </div>
                                  )}

                                  {/* Recommended Protocol / Action */}
                                  {n.recommendedAction && (
                                    <div style={{ background: 'rgba(39, 174, 96, 0.08)', padding: '6px 8px', borderRadius: '4px', borderLeft: '3px solid #27ae60', marginTop: '2px' }}>
                                      <strong style={{ display: 'block', fontSize: '0.68rem', color: '#27ae60', fontFamily: 'var(--font-mono, monospace)' }}>RECOMMENDED ACTION:</strong>
                                      <span style={{ color: 'rgba(30, 27, 25, 0.85)', lineHeight: 1.35 }}>{n.recommendedAction}</span>
                                    </div>
                                  )}

                                  {/* Acknowledge Button inside card for emergencies */}
                                  {n.type === 'EMERGENCY' && !n.acknowledged && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        acknowledgeEmergency(n.id);
                                      }}
                                      style={{
                                        marginTop: '6px',
                                        background: '#bc473a',
                                        color: '#faf6f0',
                                        border: 'none',
                                        padding: '6px 12px',
                                        borderRadius: '4px',
                                        fontSize: '0.68rem',
                                        fontWeight: 800,
                                        fontFamily: 'var(--font-mono, monospace)',
                                        cursor: 'pointer',
                                        letterSpacing: '0.04em',
                                      }}
                                    >
                                      ACKNOWLEDGE & STOP ALARM
                                    </button>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
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
