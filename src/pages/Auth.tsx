import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ShieldCheck, ArrowRight, AlertTriangle } from 'lucide-react';
import { Navbar } from './Home/components/Navbar';
import GradientBackground from '../components/GradientBackground';
import { PageEntryReveal } from '../components/PageEntryReveal';
import styles from './Auth.module.css';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';

export const Auth: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [officerId, setOfficerId] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await apiClient.post('/auth/login', {
        officer_id: officerId.trim(),
        password: password
      });

      const { access_token, role, officer_id, department } = response.data;

      // Update global auth state
      login(access_token, role, officer_id, department);

      // Navigate to operational dashboard
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Login authentication error:', err);
      if (err.response && err.response.status === 401) {
        setErrorMessage('Invalid Officer Designation ID or Security Passkey.');
      } else if (err.response && err.response.data && err.response.data.detail) {
        setErrorMessage(err.response.data.detail);
      } else {
        setErrorMessage('Authentication service unavailable. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
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

            {errorMessage && (
              <div style={{
                padding: '0.85rem 1rem',
                backgroundColor: 'rgba(188,71,58,0.1)',
                border: '1px solid rgba(188,71,58,0.3)',
                borderRadius: '8px',
                color: '#bc473a',
                fontSize: '0.85rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertTriangle size={18} />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className={styles.authForm}>
              <div className={styles.fieldGroup}>
                <label>Officer Designation ID</label>
                <input 
                  type="text" 
                  value={officerId} 
                  onChange={(e) => setOfficerId(e.target.value)} 
                  placeholder="e.g. IR-OFFICER-ENG01"
                  required
                />
              </div>

              <div className={styles.fieldGroup}>
                <label>Security Passkey</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="Enter Security Passkey"
                  required
                />
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
