import React from 'react';
import GradientBackground from '../../../components/GradientBackground';
import styles from '../Home.module.css';

export const HeroBackground: React.FC = () => {
  return (
    <div className={styles.heroBgContainer} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, overflow: 'hidden' }}>
      {/* Home Screen Signature Animated Gradient & Noise */}
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
      />

      {/* Railway Track Animation Video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: 2,
          filter: 'invert(1) hue-rotate(180deg) contrast(1.2) brightness(0.9)',
          mixBlendMode: 'screen',
          pointerEvents: 'none',
        }}
      >
        <source src="/bootup_intro.mp4" type="video/mp4" />
        <source src="/Create_a_cinematic_premium_tr.mp4" type="video/mp4" />
      </video>
    </div>
  );
};

export default HeroBackground;
