import React from 'react';
import { motion } from 'framer-motion';

interface TextRevealBlockProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  blockColor?: string;
}

export const TextRevealBlock: React.FC<TextRevealBlockProps> = ({
  children,
  delay = 0.25,
  duration = 0.95,
  className = '',
  blockColor = '#1e1b19' // charcoal
}) => {
  return (
    <div style={{ position: 'relative', display: 'inline-block', overflow: 'hidden' }} className={className}>
      {/* The actual text revealed progressively */}
      <motion.div
        initial={{ clipPath: 'inset(0% 100% 0% 0%)', opacity: 0 }}
        animate={{ 
          clipPath: 'inset(0% 0% 0% 0%)',
          opacity: 1 
        }}
        transition={{
          duration: duration,
          ease: [0.22, 1, 0.36, 1],
          delay: delay
        }}
      >
        {children}
      </motion.div>

      {/* The sweeping solid alignment block */}
      <motion.div
        style={{
          position: 'absolute',
          top: '-4px',
          bottom: '-4px',
          width: '35%',
          backgroundColor: blockColor,
          zIndex: 10,
          pointerEvents: 'none',
        }}
        initial={{ left: '-35%' }}
        animate={{
          left: ['-35%', '100%']
        }}
        transition={{
          duration: duration,
          ease: [0.22, 1, 0.36, 1],
          delay: delay
        }}
      />
    </div>
  );
};
