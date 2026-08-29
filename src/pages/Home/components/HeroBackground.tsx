import React from 'react';
import GradientBackground from '../../../components/GradientBackground';
import styles from '../Home.module.css';

export const HeroBackground: React.FC = () => {
  return (
    <div className={styles.heroBgContainer} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
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
    </div>
  );
};

export default HeroBackground;
