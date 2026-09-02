import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import GradientBackground from '../GradientBackground';
import styles from './BootupScreen.module.css';

interface BootupScreenProps {
  onComplete?: () => void;
  forceShow?: boolean;
}

export const BootupScreen: React.FC<BootupScreenProps> = ({ onComplete, forceShow = false }) => {
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const hasBooted = sessionStorage.getItem('tejas_has_booted');
    if (hasBooted === 'true' && !forceShow) {
      setIsVisible(false);
      if (onComplete) onComplete();
      return;
    }
  }, [forceShow, onComplete]);

  const handleDismiss = () => {
    if (isFadingOut) return;
    setIsFadingOut(true);
    sessionStorage.setItem('tejas_has_booted', 'true');
    
    setTimeout(() => {
      setIsVisible(false);
      if (onComplete) onComplete();
    }, 800);
  };

  useEffect(() => {
    const handleKeyDown = () => {
      handleDismiss();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className={`${styles.overlay} ${isFadingOut ? styles.fadeOut : ''}`}
      onClick={handleDismiss}
      style={{ backgroundColor: '#1e1b19' }}
    >
      {/* Exact Home Screen Signature Animated Gradient & Noise Background */}
      <GradientBackground
        gradientOrigin="center"
        gradientSize="125% 125%"
        colors={[
          { color: '#262220', stop: '0%' },
          { color: '#1e1b19', stop: '70%' },
          { color: '#12100f', stop: '100%' }
        ]}
        noisePatternAlpha={20}
        noiseIntensity={0.4}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}
      />

      {/* Track Line Video Animation */}
      <video
        ref={videoRef}
        className={styles.videoFull}
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={handleDismiss}
      >
        <source src="/bootup_intro.mp4" type="video/mp4" />
        <source src="/Create_a_cinematic_premium_tr.mp4" type="video/mp4" />
      </video>

      {/* Cinematic Blur-Dissolve Entrance for the TEJ / AS Logo */}
      <motion.div
        className={styles.logoCenterContainer}
        initial={{ opacity: 0, scale: 0.94, filter: 'blur(14px)' }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        transition={{ duration: 2.2, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.div
          className={styles.ambientGlow}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2.5, delay: 0.7 }}
        />

        <div className={styles.logoWrapper}>
          <div className={styles.logoCircle}>TEJ</div>
          <span className={styles.logoTextOutside}>AS</span>
        </div>
      </motion.div>
    </div>
  );
};

export default BootupScreen;
