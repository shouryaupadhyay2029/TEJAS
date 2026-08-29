import React from 'react';
import { motion } from 'framer-motion';
import HeroBackground from './HeroBackground';
import styles from '../Home.module.css';

export const Hero: React.FC = () => {
  return (
    <section className={styles.heroSection}>
      {/* Background container fading in */}
      <motion.div
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.4 }}
      >
        <HeroBackground />
      </motion.div>

      {/* Giant "TEJAS" text rising up and fading in */}
      <motion.div 
        className={styles.giantHeroText} 
        aria-hidden="true"
        initial={{ opacity: 0, y: 120 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.6 }}
      >
        TEJAS
      </motion.div>
    </section>
  );
};

export default Hero;
