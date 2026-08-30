import React from 'react';
import { PageEntryReveal } from '../components/PageEntryReveal';
import { Navbar } from './Home/components/Navbar';
import GradientBackground from '../components/GradientBackground';
import { ScrollReveal } from '../components/motion/ScrollSystem';

export const Optimization: React.FC = () => {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg-base)' }}>
      <GradientBackground
        gradientOrigin="bottom-middle"
        noiseIntensity={0.65}
        noisePatternAlpha={30}
        noisePatternSize={90}
        noisePatternRefreshInterval={2}
        colors={[
          { color: 'rgba(210,186,152,1)', stop: '10.5%' },
          { color: 'rgba(222,200,168,1)', stop: '16%' },
          { color: 'rgba(232,212,182,1)', stop: '17.5%' },
          { color: 'rgba(240,224,200,1)', stop: '25%' },
          { color: 'rgba(245,233,215,1)', stop: '40%' },
          { color: 'rgba(248,240,228,1)', stop: '65%' },
          { color: 'rgba(252,248,240,1)', stop: '100%' },
        ]}
      />
      <div style={{ position: 'relative', zIndex: 100 }}>
        <Navbar />
      </div>

      <div style={{ padding: '8rem 5% 4rem 5%', color: '#faf6f0' }}>
        <PageEntryReveal delay={0.15} duration={1.1}>
          <span style={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.15em', color: 'var(--color-railway-red)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
            OPERATIONS CONSOLE
          </span>
        </PageEntryReveal>
        
        <div style={{ margin: '4px 0' }}>
          <PageEntryReveal delay={0.35} duration={1.25}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 400, color: '#1e1b19', textTransform: 'uppercase' }}>Optimization Engine</h1>
          </PageEntryReveal>
        </div>
        
        <ScrollReveal>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '1rem', maxWidth: '600px', fontSize: '0.9rem', lineHeight: '1.6' }}>
            Uncoordinated task solver and scheduler. CP-SAT mathematical engine is fully configured. Ready to coordinate track maintenance blocks.
          </p>
        </ScrollReveal>
      </div>
    </div>
  );
};

export default Optimization;
