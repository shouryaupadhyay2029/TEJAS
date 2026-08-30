import React from 'react';
import { motion } from 'framer-motion';

interface PageEntryRevealProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  blockColor?: string;
}

export const PageEntryReveal: React.FC<PageEntryRevealProps> = ({
  children,
  delay = 0.35,
  duration = 1.25, // ~1100-1400ms
  blockColor = '#1e1b19' // charcoal
}) => {
  return (
    <div style={{ position: 'relative', display: 'inline-block', overflow: 'hidden', verticalAlign: 'bottom' }}>
      {/* Text layer revealed behind the block as it slides right */}
      <motion.div
        initial={{ clipPath: 'inset(0% 100% 0% 0%)' }}
        animate={{
          clipPath: [
            'inset(0% 100% 0% 0%)', // start
            'inset(0% 100% 0% 0%)', // middle (fully covered)
            'inset(0% 0% 0% 0%)'    // end (revealed)
          ]
        }}
        transition={{
          duration: duration,
          times: [0, 0.45, 1],
          ease: [0.22, 1, 0.36, 1],
          delay: delay
        }}
      >
        {children}
      </motion.div>

      {/* Visibly moving rectangular reveal block */}
      <motion.div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: blockColor,
          zIndex: 50,
          pointerEvents: 'none',
        }}
        initial={{ x: '-105%' }}
        animate={{
          x: ['-105%', '0%', '105%']
        }}
        transition={{
          duration: duration,
          times: [0, 0.45, 1],
          ease: [0.22, 1, 0.36, 1],
          delay: delay
        }}
      />
    </div>
  );
};
