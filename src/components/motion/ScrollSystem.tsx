import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { AnimatePresence, motion } from 'framer-motion';

// Register GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

interface ScrollContextProps {
  lenis: Lenis | null;
  velocity: number;
  direction: number;
  progress: number;
}

const ScrollContext = createContext<ScrollContextProps>({
  lenis: null,
  velocity: 0,
  direction: 0,
  progress: 0,
});

export const useScrollState = () => useContext(ScrollContext);

// --- 1. Global Scroll Provider ---
export const ScrollProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lenisInstance, setLenisInstance] = useState<Lenis | null>(null);

  // Keep numerical tracking in Refs to avoid React re-renders on scroll frames
  const scrollData = useRef({
    velocity: 0,
    direction: 0,
    progress: 0,
  });

  useEffect(() => {
    // Respect accessibility prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // Initialize Lenis
    const lenis = new Lenis({
      duration: 0.8,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // smooth inertia curve
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.85,
      touchMultiplier: 1.0,
    });

    // Synchronize ScrollTrigger with Lenis
    lenis.on('scroll', (e) => {
      ScrollTrigger.update();
      
      const velocity = Math.abs(e.velocity);
      const direction = e.direction;
      const progress = e.progress;

      // Update refs
      scrollData.current = {
        velocity,
        direction,
        progress,
      };

      // Update global CSS variables for high-performance CSS animation bindings
      document.documentElement.style.setProperty('--scroll-velocity', `${velocity}`);
      document.documentElement.style.setProperty('--scroll-direction', `${direction}`);
      document.documentElement.style.setProperty('--scroll-progress', `${progress}`);
    });

    // Sync Lenis frame loop with GSAP ticker
    function update(time: number) {
      lenis.raf(time * 1000);
    }
    gsap.ticker.add(update);

    // Bind ScrollTrigger to Lenis scroll
    ScrollTrigger.scrollerProxy(document.body, {
      scrollTop(value) {
        return arguments.length ? lenis.scrollTo(value!) : lenis.scroll;
      },
      getBoundingClientRect() {
        return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
      },
    });

    setLenisInstance(lenis);

    return () => {
      gsap.ticker.remove(update);
      lenis.destroy();
      ScrollTrigger.clearMatchMedia();
    };
  }, []);

  return (
    <ScrollContext.Provider 
      value={{ 
        lenis: lenisInstance, 
        get velocity() { return scrollData.current.velocity; },
        get direction() { return scrollData.current.direction; },
        get progress() { return scrollData.current.progress; },
      }}
    >
      {children}
      <BackToTop />
    </ScrollContext.Provider>
  );
};

// --- 2. Alignment Reveal System Component ---
export const ScrollReveal: React.FC<{
  children: React.ReactNode;
  delay?: number;
}> = ({ children, delay = 0 }) => {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    const anim = gsap.fromTo(
      el.querySelectorAll('.reveal-target'),
      { x: -35, opacity: 0 },
      {
        x: 0,
        opacity: 1,
        duration: 0.8,
        ease: 'power3.out',
        stagger: 0.08,
        delay,
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        },
      }
    );

    const lineAnim = gsap.fromTo(
      el.querySelectorAll('.reveal-line'),
      { scaleX: 0 },
      {
        scaleX: 1,
        duration: 0.9,
        ease: 'power2.out',
        delay,
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        },
      }
    );

    return () => {
      anim.scrollTrigger?.kill();
      lineAnim.scrollTrigger?.kill();
    };
  }, [delay]);

  return (
    <div ref={elementRef} style={{ position: 'relative', width: '100%' }}>
      {children}
    </div>
  );
};

// --- 3. Parallax Motion System Component ---
export const ScrollParallax: React.FC<{
  children: React.ReactNode;
  speed?: number; // e.g. -0.15, 0.15
}> = ({ children, speed = 0.1 }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const anim = gsap.to(el, {
      yPercent: speed * 100,
      ease: 'none',
      scrollTrigger: {
        trigger: el,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    });

    return () => {
      anim.scrollTrigger?.kill();
    };
  }, [speed]);

  return (
    <div ref={containerRef} style={{ willChange: 'transform' }}>
      {children}
    </div>
  );
};

// --- 4. Signature TEJAS "Rail Line" Component ---
export const ScrollLine: React.FC<{
  className?: string;
}> = ({ className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    const node = nodeRef.current;
    if (!el || !node) return;

    const anim = gsap.fromTo(
      node,
      { left: '10%' },
      {
        left: '90%',
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.1,
        },
      }
    );

    return () => {
      anim.scrollTrigger?.kill();
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className={className} 
      style={{ 
        position: 'relative', 
        width: '100%', 
        height: '1px', 
        backgroundColor: 'rgba(30, 27, 25, 0.1)', 
        margin: '2rem 0',
      }}
    >
      <div 
        ref={nodeRef}
        className="rail-node"
        style={{
          position: 'absolute',
          top: '-3.5px',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: '#bc473a',
          transform: 'translateX(-50%)',
          transition: 'transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
        }}
      />
    </div>
  );
};

// --- 5. Convergence Component ---
export const ScrollConvergence: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const anim = gsap.fromTo(
      el.querySelectorAll('.converge-item'),
      { x: (i) => (i % 2 === 0 ? -45 : 45), opacity: 0.3 },
      {
        x: 0,
        opacity: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          end: 'top 30%',
          scrub: 0.2,
        },
      }
    );

    return () => {
      anim.scrollTrigger?.kill();
    };
  }, []);

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      {children}
    </div>
  );
};

// --- 6. Selective Pinned Moment Component ---
export const ScrollPin: React.FC<{
  children: React.ReactNode;
  height?: string; // total pin travel scroll distance
}> = ({ children, height = '150vh' }) => {
  const pinRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const pin = pinRef.current;
    const content = contentRef.current;
    if (!pin || !content) return;

    const anim = ScrollTrigger.create({
      trigger: pin,
      start: 'top top',
      end: () => `+=${pin.offsetHeight}`,
      pin: content,
      scrub: true,
      anticipatePin: 1,
    });

    return () => {
      anim.kill();
    };
  }, []);

  return (
    <div ref={pinRef} style={{ width: '100%', minHeight: height, position: 'relative' }}>
      <div ref={contentRef} style={{ width: '100%', height: '100vh', display: 'flex', alignItems: 'center' }}>
        {children}
      </div>
    </div>
  );
};

// --- 7. Global Back To Top Scroll Control Component ---
export const BackToTop: React.FC = () => {
  const { lenis } = useScrollState();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!lenis) return;

    const handleScroll = (inst: any) => {
      setShow(inst.scroll > 500);
    };

    lenis.on('scroll', handleScroll);
    return () => {
      lenis.off('scroll', handleScroll);
    };
  }, [lenis]);

  const handleScrollToTop = () => {
    lenis?.scrollTo(0);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          className="global-back-to-top"
          onClick={handleScrollToTop}
          initial={{ opacity: 0, x: 30, scale: 0.96 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 30, scale: 0.96 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          aria-label="Back to top"
        >
          <span className="global-back-to-top-arrow">↑</span>
          <span className="global-back-to-top-rotation">
            <svg viewBox="0 0 100 100" className="global-back-to-top-svg">
              <path
                id="globalBackToTopPath"
                d="M 50, 50 m -37, 0 a 37,37 0 1, 1 74, 0 a 37,37 0 1, 1 -74, 0"
                fill="none"
              />
              <text>
                <textPath href="#globalBackToTopPath" className="global-back-to-top-textpath">
                  • BACK TO TOP • BACK TO TOP •
                </textPath>
              </text>
            </svg>
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  );
};
