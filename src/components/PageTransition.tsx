import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

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

// --- Provider Component wrapping Router (Text-Block Entry Reveal) ---
export const PageTransitionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [transitionPhase, setTransitionPhase] = useState<'idle' | 'exit' | 'enter'>('enter');

  const navigateWithTransition = (to: string, _label: string, _dir?: Direction) => {
    setTransitionPhase('exit');
    
    // Smoothly fade out current content before loading the next route
    setTimeout(() => {
      navigate(to);
      window.scrollTo(0, 0);
      setTransitionPhase('enter');
    }, 450);
  };

  useEffect(() => {
    setTransitionPhase('enter');
    // Keep target reveal active until stagger animations settle (1800ms)
    const timer = setTimeout(() => {
      setTransitionPhase('idle');
    }, 1800);
    
    return () => clearTimeout(timer);
  }, [location.pathname]);

  const getContainerClassName = () => {
    if (transitionPhase === 'exit') return 'page-exit-transition';
    if (transitionPhase === 'enter') return 'page-transition-content';
    return '';
  };

  return (
    <TransitionContext.Provider value={{ navigateWithTransition, isTransitioning: transitionPhase !== 'idle' }}>
      <div className={getContainerClassName()}>
        {children}
      </div>
    </TransitionContext.Provider>
  );
};
