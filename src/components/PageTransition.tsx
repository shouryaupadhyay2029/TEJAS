import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

type Direction = 'left' | 'right' | 'top' | 'bottom';

interface TransitionContextProps {
  navigateWithTransition: (to: string, label: string, dir?: Direction) => void;
  isTransitioning: boolean;
}

const TransitionContext = createContext<TransitionContextProps | undefined>(undefined);

export const useTransitionNavigate = () => {
  const context = useContext(TransitionContext);
  if (!context) {
    throw new Error('useTransitionNavigate must be used within PageTransitionProvider');
  }
  return context.navigateWithTransition;
};

// --- Reusable Custom Transition Link Component ---
export const TransitionLink: React.FC<{
  to: string;
  label: string;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
} & React.AnchorHTMLAttributes<HTMLAnchorElement>> = ({ to, label, className, children, onClick, ...props }) => {
  const navigateWithTransition = useTransitionNavigate();
  const location = useLocation();

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick();
    }
    if (location.pathname === to) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    navigateWithTransition(to, label);
  };

  return (
    <a href={to} onClick={handleClick} className={className} {...props}>
      {children}
    </a>
  );
};

// --- Provider Component wrapping Router ---
export const PageTransitionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionText, setTransitionText] = useState('');
  const [direction, setDirection] = useState<Direction>('right');

  // Config mapping path to label and direction
  const getRouteConfig = (path: string): { label: string; direction: Direction } => {
    const p = path.toLowerCase();
    if (p === '/' || p === '') {
      return { label: 'HOME', direction: 'left' };
    }
    if (p.includes('dashboard')) {
      return { label: 'DASHBOARD', direction: 'right' };
    }
    if (p.includes('maintenance')) {
      return { label: 'MAINTENANCE', direction: 'bottom' };
    }
    if (p.includes('planning') || p.includes('block-planning')) {
      return { label: 'PLANNING', direction: 'left' };
    }
    if (p.includes('assets')) {
      return { label: 'ASSETS', direction: 'top' };
    }
    if (p.includes('reports')) {
      return { label: 'REPORTS', direction: 'right' };
    }
    if (p.includes('optimization') || p.includes('optimizer')) {
      return { label: 'OPTIMIZER', direction: 'bottom' };
    }
    if (p.includes('defects')) {
      return { label: 'DEFECTS', direction: 'top' };
    }
    if (p.includes('login')) {
      return { label: 'ACCESS', direction: 'right' };
    }
    return { label: 'TEJAS', direction: 'right' };
  };

  const navigateWithTransition = (to: string, label: string, dir?: Direction) => {
    if (isTransitioning) return;

    // Detect config if not explicitly overridden
    const config = getRouteConfig(to);
    const targetLabel = label || config.label;
    const targetDir = dir || config.direction;

    setTransitionText(targetLabel);
    setDirection(targetDir);
    setIsTransitioning(true);

    // Timeline:
    // 0ms - Slide in starts
    // 1000ms - Band centered on screen, trigger route change underneath
    setTimeout(() => {
      navigate(to);
      window.scrollTo(0, 0);
    }, 1000);

    // 2000ms - Transition exits, animation finishes
    setTimeout(() => {
      setIsTransitioning(false);
    }, 2000);
  };

  // Listen to browser back/forward buttons to prevent broken states
  useEffect(() => {
    setIsTransitioning(false);
  }, [location.pathname]);

  // Motion keyframes for physical sheet passing across screen
  const getKeyframes = () => {
    switch (direction) {
      case 'left':
        return {
          x: ['-100vw', '0vw', '0vw', '100vw'],
          y: [0, 0, 0, 0]
        };
      case 'right':
        return {
          x: ['100vw', '0vw', '0vw', '-100vw'],
          y: [0, 0, 0, 0]
        };
      case 'top':
        return {
          x: [0, 0, 0, 0],
          y: ['-100vh', '0vh', '0vh', '100vh']
        };
      case 'bottom':
      default:
        return {
          x: [0, 0, 0, 0],
          y: ['100vh', '0vh', '0vh', '-100vh']
        };
    }
  };

  const keyframes = getKeyframes();

  return (
    <TransitionContext.Provider value={{ navigateWithTransition, isTransitioning }}>
      {children}

      {isTransitioning && (
        <motion.div
          style={{
            position: 'fixed',
            top: 'calc(50% - clamp(90px, 12vh, 130px))',
            left: 0,
            width: '100vw',
            height: 'clamp(180px, 24vh, 260px)',
            zIndex: 99999,
            backgroundColor: '#1e1b19',
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.15'/%3E%3C/svg%3E")`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
            pointerEvents: 'none',
            borderTop: '2px solid rgba(210, 186, 152, 0.35)',
            borderBottom: '2px solid rgba(210, 186, 152, 0.35)',
          }}
          animate={{
            x: keyframes.x,
            y: keyframes.y,
          }}
          transition={{
            duration: 2.0,
            ease: [0.76, 0, 0.24, 1],
            times: [0, 0.25, 0.75, 1], // 500ms entry, 1000ms hold, 500ms exit
          }}
        >
          {/* Horizontal Oversized Typographic Box */}
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' }}>
            
            {/* Background Parallax Layer */}
            <motion.div
              style={{
                position: 'absolute',
                fontFamily: "'Gondens', sans-serif",
                fontSize: 'clamp(7.2rem, 14.5vh, 12rem)',
                fontWeight: 900,
                color: 'rgba(210, 186, 152, 0.06)',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                letterSpacing: '0.04em',
                lineHeight: 1,
                userSelect: 'none',
                zIndex: 1,
              }}
              animate={{ x: [-32, 32], scale: [0.96, 1.02] }}
              transition={{ duration: 2.0, ease: [0.76, 0, 0.24, 1] }}
            >
              {transitionText}
            </motion.div>

            {/* Foreground Focus Layer */}
            <motion.div
              style={{
                position: 'relative',
                fontFamily: "'Gondens', sans-serif",
                fontSize: 'clamp(6rem, 12vh, 10rem)',
                fontWeight: 900,
                color: '#faf6f0',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                letterSpacing: '0.03em',
                lineHeight: 1,
                zIndex: 2,
              }}
              animate={{ x: [-12, 12], scale: [0.98, 1.01], letterSpacing: ['0.02em', '0.06em'] }}
              transition={{ duration: 2.0, ease: [0.76, 0, 0.24, 1] }}
            >
              {transitionText}
            </motion.div>

          </div>
        </motion.div>
      )}
    </TransitionContext.Provider>
  );
};
