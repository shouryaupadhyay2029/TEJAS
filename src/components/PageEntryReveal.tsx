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
  delay = 0.2,
  duration = 0.85,
}) => {
  return (
    <div style={{ position: 'relative', display: 'inline-block', verticalAlign: 'bottom' }}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: duration,
          ease: [0.16, 1, 0.3, 1],
          delay: delay,
        }}
        style={{ opacity: 1 }}
      >
        {children}
      </motion.div>
    </div>
  );
};

export default PageEntryReveal;
