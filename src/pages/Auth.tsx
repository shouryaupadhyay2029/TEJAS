import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ShieldCheck, ArrowRight } from 'lucide-react';
import { Navbar } from './Home/components/Navbar';
import GradientBackground from '../components/GradientBackground';
import { PageEntryReveal } from '../components/PageEntryReveal';
import styles from './Auth.module.css';

export const Auth: React.FC = () => {
  const navigate = useNavigate();
  const [officerId, setOfficerId] = useState<string>('IR-OFFICER-8924');
  const [passkey, setPasskey] = useState<string>('••••••••••••');
  const [role, setRole] = useState<string>('OPERATIONS_CONTROLLER');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      navigate('/dashboard');
    }, 400);
  };

  return (
    <PageEntryReveal>
      <div className={styles.dashboardContainer}>
        {/* Exact Warm Gradient Background used across TEJAS */}
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
          style={{ position: 'fixed', inset: 0, zIndex: -1 }}
        />

        {/* PRIMARY NAVBAR */}
        <div className={styles.navbarRelativeWrap}>
          <Navbar />
        </div>

        {/* MAIN WORKSPACE CONTENT */}
        <main className={styles.contentArea}>
          <div className={styles.authCard}>
            <div className={styles.authHeader}>
              <span className={styles.eyebrow}>INDIAN RAILWAYS SECURITY PORTAL</span>
              <h1 className={styles.authTitle}>Command Center Access</h1>
              <p className={styles.authSubtitle}>
                Authorized Personnel Authentication & Role-Based Access Control
              </p>
            </div>

            <form onSubmit={handleLogin} className={styles.authForm}>
              <div className={styles.fieldGroup}>
                <label>Officer Designation ID / Email</label>
                <input 
                  type="text" 
                  value={officerId} 
                  onChange={(e) => setOfficerId(e.target.value)} 
                  placeholder="e.g. IR-OFFICER-8924"
                  required
                />
              </div>

              <div className={styles.fieldGroup}>
                <label>Security Passkey</label>
                <input 
                  type="password" 
                  value={passkey} 
                  onChange={(e) => setPasskey(e.target.value)} 
                  placeholder="Enter Passkey"
                  required
                />
              </div>

              <div className={styles.fieldGroup}>
                <label>Access Role / Division</label>
                <select value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="OPERATIONS_CONTROLLER">Operations Controller (Chief Dispatcher)</option>
                  <option value="FIELD_OFFICER_ENG">Field Officer — Engineering (Track & Bridge)</option>
                  <option value="FIELD_OFFICER_ST">Field Officer — Signal & Telecom</option>
                  <option value="FIELD_OFFICER_TRD">Field Officer — Traction Distribution</option>
                  <option value="DIVISIONAL_ENGINEER">Divisional Railway Engineer (DRE)</option>
                </select>
              </div>

              <button type="submit" disabled={isSubmitting} className={styles.submitBtn}>
                {isSubmitting ? (
                  <span>AUTHENTICATING PERSONNEL...</span>
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    <span>AUTHORIZE & ENTER COMMAND CENTER</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <div className={styles.formFooter}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Lock size={12} color="#bc473a" />
                <span>Restricted Access — Ministry of Railways Internal System</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </PageEntryReveal>
  );
};

export default Auth;
