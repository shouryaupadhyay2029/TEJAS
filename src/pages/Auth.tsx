import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTransitionNavigate } from '../components/PageTransition';
import GradientBackground from '../components/GradientBackground';
import Navbar from './Home/components/Navbar';
import styles from './Auth.module.css';

const ease = [0.16, 1, 0.3, 1] as const;

export const Auth: React.FC = () => {
  const navigateWithTransition = useTransitionNavigate();

  // Input states
  const [operatorId, setOperatorId] = useState('');
  const [password, setPassword] = useState('');
  const [rememberDevice, setRememberDevice] = useState(false);

  // Status transitions: 'idle' | 'authorizing' | 'granted'
  const [authStatus, setAuthStatus] = useState<'idle' | 'authorizing' | 'granted'>('idle');

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (authStatus !== 'idle') return;

    // Trigger simulation
    setAuthStatus('authorizing');
  };

  // Run transition sequence after authorization completes
  useEffect(() => {
    if (authStatus === 'authorizing') {
      const authTimer = setTimeout(() => {
        setAuthStatus('granted');
      }, 1200);

      return () => clearTimeout(authTimer);
    }

    if (authStatus === 'granted') {
      const redirectTimer = setTimeout(() => {
        // Naturally transition into dashboard using TEJAS custom page fade transition
        navigateWithTransition('/dashboard', 'DASHBOARD');
      }, 900);

      return () => clearTimeout(redirectTimer);
    }
  }, [authStatus, navigateWithTransition]);

  return (
    <div className={styles.authContainer}>
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
      />

      {/* Global Navigation Header */}
      <div className={styles.navbarRelativeWrap}>
        <Navbar />
      </div>

      {/* Content Canvas */}
      <div className={styles.contentWrapper}>
        <div className={styles.twoColLayout}>
          {/* LEFT SIDE: Editorial Brand Identity */}
          <motion.div
            className={styles.leftPanel}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease }}
          >
            <span className={styles.authEyebrow}>OPERATIONS CONSOLE</span>
            <h1 className={styles.authTitle}>
              Access the
              <span className={styles.authTitleHighlight}>TEJAS</span>
              Operations
              <br />
              Console.
            </h1>
            <p className={styles.authDesc}>
              Secure access to maintenance intelligence, coordinated planning and live railway operations.
            </p>

            {/* System Status Tracker */}
            <div className={styles.statusIndicator}>
              <span className={styles.statusDot} />
              <span className={styles.statusText}>SYSTEM STATUS: OPERATIONAL</span>
            </div>

            {/* Subtle Route Line Diagram Graphic */}
            <div className={styles.routeGraphicContainer}>
              <svg className={styles.trackSvg} viewBox="0 0 400 36">
                {/* Parallel main lines */}
                <motion.line
                  x1="0" y1="12" x2="400" y2="12"
                  stroke="rgba(30, 27, 25, 0.15)"
                  strokeWidth="1.2"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.5, ease, delay: 0.6 }}
                />
                <motion.line
                  x1="0" y1="24" x2="400" y2="24"
                  stroke="rgba(30, 27, 25, 0.15)"
                  strokeWidth="1.2"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.5, ease, delay: 0.7 }}
                />

                {/* Left diagonal cross-over line */}
                <motion.line
                  x1="80" y1="12" x2="110" y2="24"
                  stroke="rgba(30, 27, 25, 0.15)"
                  strokeWidth="1.2"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.8, ease, delay: 1.0 }}
                />

                {/* Right junction loop line */}
                <motion.path
                  d="M 220 24 Q 240 36, 260 24"
                  fill="none"
                  stroke="rgba(30, 27, 25, 0.15)"
                  strokeWidth="1.2"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.9, ease, delay: 1.2 }}
                />

                {/* Single Red Node Indicator at the crossover junction */}
                <motion.circle
                  cx="110" cy="24" r="3.5"
                  fill="#bc473a"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 1.6 }}
                />
              </svg>
            </div>
          </motion.div>

          {/* RIGHT SIDE: Authentication Form Panel */}
          <motion.div
            className={styles.rightPanel}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25, ease }}
          >
            <form onSubmit={handleFormSubmit} className={styles.formContainer}>
              <div className={styles.formHeader}>
                <h3 className={styles.formTitle}>SECURE ACCESS</h3>
              </div>

              {/* ID Input */}
              <div className={styles.formGroup}>
                <label htmlFor="operatorId">EMPLOYEE / OPERATOR ID</label>
                <input
                  type="text"
                  id="operatorId"
                  className={styles.inputField}
                  required
                  placeholder="IR-XXXXX"
                  value={operatorId}
                  onChange={(e) => setOperatorId(e.target.value)}
                  disabled={authStatus !== 'idle'}
                />
              </div>

              {/* Password Input */}
              <div className={styles.formGroup}>
                <label htmlFor="password">PASSWORD</label>
                <input
                  type="password"
                  id="password"
                  className={styles.inputField}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={authStatus !== 'idle'}
                />
              </div>

              {/* Remember checkbox */}
              <div 
                className={styles.checkboxGroup}
                onClick={() => authStatus === 'idle' && setRememberDevice(!rememberDevice)}
              >
                <input
                  type="checkbox"
                  className={styles.checkboxInput}
                  checked={rememberDevice}
                  readOnly
                  disabled={authStatus !== 'idle'}
                />
                <span className={styles.checkboxLabel}>REMEMBER THIS DEVICE</span>
              </div>

              {/* Submission Button / Transition States */}
              <AnimatePresence mode="wait">
                {authStatus === 'idle' ? (
                  <motion.button
                    key="submit-btn"
                    type="submit"
                    className={styles.submitBtn}
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    ENTER DASHBOARD <span className={styles.btnArrow}>→</span>
                  </motion.button>
                ) : (
                  <motion.div
                    key="status-indicator"
                    className={styles.authStatusPanel}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.35, ease }}
                  >
                    <span className={styles.authStatusHeader}>
                      {authStatus === 'authorizing' ? 'SECURITY CHECK' : 'SYSTEM PROTOCOL'}
                    </span>
                    <span className={styles.authStatusBody}>
                      {authStatus === 'authorizing'
                        ? 'AUTHORIZING OPERATIONS ACCESS...'
                        : 'TEJAS OPERATIONS CONSOLE: ACCESS GRANTED'}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>

            {/* Muted institutional statements */}
            <div className={styles.formFooter}>
              <p className={styles.formFooterText}>Authorized personnel only.</p>
              <p className={styles.formFooterText}>
                Access is monitored and recorded by the TEJAS operations security system.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
