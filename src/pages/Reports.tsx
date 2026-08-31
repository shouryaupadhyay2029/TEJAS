import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from './Home/components/Navbar';
import GradientBackground from '../components/GradientBackground';
import { ScrollReveal } from '../components/motion/ScrollSystem';
import { PageEntryReveal } from '../components/PageEntryReveal';
import styles from './Reports.module.css';

// --- DATA STRUCTURES ---
interface ReportBrief {
  id: string;
  title: string;
  date: string;
  type: string;
  description: string;
  executiveSummary: string;
  keyMetrics: { label: string; val: string }[];
  observations: string[];
  recommendations: string[];
}

const mockReports: ReportBrief[] = [
  {
    id: 'REP-01',
    title: 'Weekly Operations Report',
    date: '29 AUG 2026',
    type: 'Weekly Operations',
    description: 'Network performance, asset availability, and overall operational summary.',
    executiveSummary: 'This report compiles operations and performance parameters across all divisions for the final week of August 2026. General line availability metrics remain steady, supported by successful preemptive track stabilisation work.',
    keyMetrics: [
      { label: 'ASSET AVAILABILITY', val: '99.4%' },
      { label: 'BLOCK WINDOW ACCURACY', val: '94.2%' },
      { label: 'COORDINATED SAVINGS', val: '2.5 hrs' }
    ],
    observations: [
      'Track availability reached a peak of 99.4% following coordinated sleeper joint repairs at KM 42.',
      'S&T point machines experienced minor switch rail gap adjustments but maintained high operational safety factors.',
      'Traction OHE tension logs met the standard Class B criteria with minimal deviation.'
    ],
    recommendations: [
      'Implement secondary joint inspections on the Engineering lines prior to high-traffic cargo runs.',
      'Calibrate torque parameters on Point Machine 4A to offset degradation curves.'
    ]
  },
  {
    id: 'REP-02',
    title: 'Maintenance Intelligence Report',
    date: '28 AUG 2026',
    type: 'Asset Maintenance',
    description: 'Asset condition, defects breakdown, and critical maintenance priorities.',
    executiveSummary: 'An intelligence digest mapping defect density against track categories. Overdue maintenance tasks have decreased by 4.2% thanks to targeted engineering schedules.',
    keyMetrics: [
      { label: 'OPEN MAINTENANCE TASKS', val: '47' },
      { label: 'CRITICAL TASKS', val: '8' },
      { label: 'AVG. RESOLUTION TIME', val: '2.8 Days' }
    ],
    observations: [
      'Critical tasks are concentrated around high-traffic track segment junctions.',
      'Sleeper cracking occurrences have leveled off due to aggressive replacement campaigns.',
      'Traction reports 0 critical defects on Overhead Equipment lines.'
    ],
    recommendations: [
      'Prioritize immediate structural abutment grouting on Bridge 104.',
      'Lubricate Point Machine switch rails on S&T sector 4B within the next coordinate window.'
    ]
  },
  {
    id: 'REP-03',
    title: 'Block Optimization Report',
    date: '27 AUG 2026',
    type: 'Block Coordination',
    description: 'Coordinated maintenance windows and downtime reduction through CP-SAT solver.',
    executiveSummary: 'This report evaluates the performance of the TEJAS CP-SAT block optimizer. Multi-department alignment successfully reduced cumulative track blocking times by 2.5 hours per maintenance cycle.',
    keyMetrics: [
      { label: 'UNCOORDINATED BLOCKS', val: '6.0 hrs' },
      { label: 'TEJAS OPTIMIZED BLOCKS', val: '3.5 hrs' },
      { label: 'DOWNTIME SAVED', val: '2.5 hrs' }
    ],
    observations: [
      'Coordinating S&T cable replacements with track stabilization yielded the highest cumulative window efficiency.',
      'Traction overhead maintenance was aligned with scheduled ballast dressing runs.'
    ],
    recommendations: [
      'Default to coordinated block configurations on all Class A track lines.',
      'Establish automatic priority schedules for Traction teams during weekend freight operations.'
    ]
  },
  {
    id: 'REP-04',
    title: 'Asset Reliability Report',
    date: '25 AUG 2026',
    type: 'Infrastructure Analysis',
    description: 'Infrastructure condition and historical reliability trends.',
    executiveSummary: 'An assessment of physical network assets, analyzing mean-time-between-failures (MTBF) and critical risk sectors.',
    keyMetrics: [
      { label: 'OPTIMAL ASSETS', val: '1,146' },
      { label: 'DEGRADED ASSETS', val: '120' },
      { label: 'CRITICAL ASSETS', val: '18' }
    ],
    observations: [
      'MTBF on signal circuits improved by 8% due to systematic LED aspect upgrades.',
      'Track segment T1 shows the highest operational risk index due to cumulative traffic impact.'
    ],
    recommendations: [
      'Deploy localized ultrasonic test sweeps on KM 42 track lines.',
      'Initiate Class C routine visual checks on newly upgraded color light signals.'
    ]
  }
];

export const Reports: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('7 DAYS');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedAssetClass, setSelectedAssetClass] = useState('ALL ASSETS');
  
  // Selected report drawer state
  const [activeDoc, setActiveDoc] = useState<ReportBrief | null>(null);

  // Stagger entry variables
  const eyebrowVariants = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { delay: 0.15, duration: 0.6 } } };
  const titleVariants = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { delay: 0.35, duration: 0.7 } } };
  const subtitleVariants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { delay: 0.55, duration: 0.7 } } };
  const rightStatsVariants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { delay: 0.65, duration: 0.7 } } };
  const fadeDividerVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { delay: 0.85, duration: 0.8 } } };

  // Generate action trigger
  const handleGenerateReport = () => {
    alert("Compiling live telemetry logs... Initializing CP-SAT summary model... Report generated successfully.");
  };

  return (
    <div className={styles.reportsPage}>
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
      
      {/* Global Navigation */}
      <div className={styles.navbarRelativeWrap}>
        <Navbar />
      </div>

      <div className={styles.contentWrapper}>
        
        {/* S01: PAGE HERO */}
        <div className={styles.heroRow}>
          <div className={styles.heroLeft}>
            <PageEntryReveal delay={0.15} duration={1.1}>
              <motion.span className={styles.eyebrow} variants={eyebrowVariants} initial="hidden" animate="visible">
                OPERATIONS INTELLIGENCE
              </motion.span>
            </PageEntryReveal>
            
            <div style={{ margin: '4px 0' }}>
              <PageEntryReveal delay={0.35} duration={1.25}>
                <motion.h1 className={styles.pageTitle} variants={titleVariants} initial="hidden" animate="visible">
                  Reports &amp; Analysis
                </motion.h1>
              </PageEntryReveal>
            </div>
            
            <motion.p className={styles.subtitle} variants={subtitleVariants} initial="hidden" animate="visible">
              Turn operational activity, asset behaviour and maintenance performance into actionable intelligence.
            </motion.p>
          </div>

          <motion.div className={styles.heroRight} variants={rightStatsVariants} initial="hidden" animate="visible">
            <div className={styles.statusIndicatorBlock}>
              <span className={styles.indicatorLabel}>REPORTING PERIOD</span>
              <span className={styles.indicatorValue}>23–29 AUG 2026</span>
            </div>
            <div style={{ width: '1px', height: '32px', backgroundColor: 'var(--color-border)', alignSelf: 'center' }} />
            <div className={styles.statusIndicatorBlock}>
              <span className={styles.indicatorLabel}>LAST GENERATED</span>
              <span className={styles.indicatorValue}>Today, 14:30</span>
            </div>
          </motion.div>
        </div>

        <motion.div className={styles.dividerLine} variants={fadeDividerVariants} initial="hidden" animate="visible" />

        {/* S02: REPORT CONTROL BAR */}
        <ScrollReveal>
          <div className={styles.controlBar}>
            <div className={styles.controlGroup}>
              {['7 DAYS', '30 DAYS', '90 DAYS', 'CUSTOM'].map((period) => (
                <button 
                  key={period} 
                  className={`${styles.controlBtn} ${selectedPeriod === period ? styles.controlBtnActive : ''}`}
                  onClick={() => setSelectedPeriod(period)}
                >
                  {period}
                </button>
              ))}
            </div>

            <select 
              value={selectedDept} 
              onChange={(e) => setSelectedDept(e.target.value)}
              className={styles.selectInput}
            >
              <option value="ALL">ALL DEPARTMENTS</option>
              <option value="ENGINEERING">ENGINEERING</option>
              <option value="S&T">S&T</option>
              <option value="TRACTION">TRACTION</option>
            </select>

            <select 
              value={selectedAssetClass} 
              onChange={(e) => setSelectedAssetClass(e.target.value)}
              className={styles.selectInput}
            >
              <option value="ALL ASSETS">ALL ASSET CLASSES</option>
              <option value="TRACKS">TRACK SEGMENTS</option>
              <option value="SIGNALS">SIGNALS</option>
              <option value="POINTS">POINT MACHINES</option>
              <option value="OHE">OVERHEAD EQUIPMENT</option>
            </select>

            <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
              <button className={styles.secondaryBtn}>EXPORT</button>
              <button className={styles.actionBtn} onClick={handleGenerateReport}>GENERATE REPORT</button>
            </div>
          </div>
        </ScrollReveal>

        {/* S03: EXECUTIVE OPERATIONS SUMMARY */}
        <ScrollReveal>
          <div className={styles.sectionBlock}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Executive Summary</h2>
              <p className={styles.sectionDesc}>A concise view of network performance during the selected reporting period.</p>
            </div>

            <div className={styles.metricsGrid}>
              <div className={styles.metricCell}>
                <span className={styles.indicatorLabel}>ASSET AVAILABILITY</span>
                <span className={styles.metricValue}>99.4%</span>
                <span className={styles.metricChange}>+0.2% OVER L7D</span>
              </div>
              <div className={styles.metricCell}>
                <span className={styles.indicatorLabel}>BLOCK UTILIZATION</span>
                <span className={styles.metricValue}>92.1%</span>
                <span className={styles.metricChange}>+1.5% OVER L7D</span>
              </div>
              <div className={styles.metricCell}>
                <span className={styles.indicatorLabel}>MAINTENANCE RESOLUTION</span>
                <span className={styles.metricValue}>87%</span>
                <span className={styles.metricChange}>+4.2% OVER L7D</span>
              </div>
              <div className={styles.metricCell}>
                <span className={styles.indicatorLabel}>DOWNTIME AVOIDED</span>
                <span className={styles.metricValue}>18.6 HRS</span>
                <span className={styles.metricChange}>+12% EFFICIENCY</span>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* S04 & S05: NETWORK PERFORMANCE CHART & MAINTENANCE */}
        <div className={styles.twoColGrid}>
          {/* SVG Line Chart */}
          <ScrollReveal>
            <div className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <h3 className={styles.chartTitle}>7-Day Asset Availability</h3>
                <span className={styles.chartAnnotation}>TREND: Network availability continues to improve.</span>
              </div>

              <div className={styles.chartContainer}>
                <svg className={styles.chartSvg} viewBox="0 0 500 200">
                  {/* Grid Lines */}
                  <line x1="50" y1="20" x2="450" y2="20" className={styles.gridLine} />
                  <line x1="50" y1="80" x2="450" y2="80" className={styles.gridLine} />
                  <line x1="50" y1="140" x2="450" y2="140" className={styles.gridLine} />
                  <line x1="50" y1="170" x2="450" y2="170" className={styles.referenceLine} />

                  {/* Reference Line Label */}
                  <text x="455" y="172" className={styles.chartLabel} textAnchor="start">Target 99.0%</text>

                  {/* Plotted engineering-style line path */}
                  {/* Values: 98.9 (175px), 99.1 (130px), 99.0 (150px), 99.3 (90px), 99.2 (110px), 99.2 (110px), 99.4 (70px) */}
                  <path 
                    d="M 50 175 L 116 130 L 182 150 L 248 90 L 314 110 L 380 110 L 446 70" 
                    className={styles.chartPath} 
                  />

                  {/* Data Nodes */}
                  <circle cx="50" cy="175" r="3.5" className={styles.chartNode} />
                  <circle cx="116" cy="130" r="3.5" className={styles.chartNode} />
                  <circle cx="182" cy="150" r="3.5" className={styles.chartNode} />
                  <circle cx="248" cy="90" r="3.5" className={styles.chartNode} />
                  <circle cx="314" cy="110" r="3.5" className={styles.chartNode} />
                  <circle cx="380" cy="110" r="3.5" className={styles.chartNode} />
                  <circle cx="446" cy="70" r="3.5" className={styles.chartNode} />

                  {/* Node Values */}
                  <text x="50" y="165" className={styles.chartLabel} textAnchor="middle">98.9%</text>
                  <text x="116" y="120" className={styles.chartLabel} textAnchor="middle">99.1%</text>
                  <text x="182" y="140" className={styles.chartLabel} textAnchor="middle">99.0%</text>
                  <text x="248" y="80" className={styles.chartLabel} textAnchor="middle">99.3%</text>
                  <text x="314" y="100" className={styles.chartLabel} textAnchor="middle">99.2%</text>
                  <text x="380" y="100" className={styles.chartLabel} textAnchor="middle">99.2%</text>
                  <text x="446" y="60" className={styles.chartLabel} textAnchor="middle">99.4%</text>

                  {/* Day Axis */}
                  <text x="50" y="195" className={styles.chartLabel} textAnchor="middle">23 AUG</text>
                  <text x="116" y="195" className={styles.chartLabel} textAnchor="middle">24 AUG</text>
                  <text x="182" y="195" className={styles.chartLabel} textAnchor="middle">25 AUG</text>
                  <text x="248" y="195" className={styles.chartLabel} textAnchor="middle">26 AUG</text>
                  <text x="314" y="195" className={styles.chartLabel} textAnchor="middle">27 AUG</text>
                  <text x="380" y="195" className={styles.chartLabel} textAnchor="middle">28 AUG</text>
                  <text x="446" y="195" className={styles.chartLabel} textAnchor="middle">29 AUG</text>
                </svg>
              </div>
            </div>
          </ScrollReveal>

          {/* Maintenance Performance */}
          <ScrollReveal>
            <div className={styles.chartCard}>
              <h3 className={styles.chartTitle} style={{ marginBottom: '2rem' }}>Maintenance Performance</h3>
              <div className={styles.severityLayout}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                  <div className={styles.statusIndicatorBlock} style={{ textAlign: 'left' }}>
                    <span className={styles.indicatorLabel} style={{ textAlign: 'left' }}>OPEN TASKS</span>
                    <span className={styles.indicatorValue} style={{ fontSize: '1.5rem', textAlign: 'left' }}>47</span>
                  </div>
                  <div className={styles.statusIndicatorBlock} style={{ textAlign: 'left' }}>
                    <span className={styles.indicatorLabel} style={{ textAlign: 'left' }}>CRITICAL</span>
                    <span className={styles.indicatorValue} style={{ fontSize: '1.5rem', color: 'var(--color-railway-red)', textAlign: 'left' }}>8</span>
                  </div>
                  <div className={styles.statusIndicatorBlock} style={{ textAlign: 'left' }}>
                    <span className={styles.indicatorLabel} style={{ textAlign: 'left' }}>OVERDUE</span>
                    <span className={styles.indicatorValue} style={{ fontSize: '1.5rem', textAlign: 'left' }}>12</span>
                  </div>
                  <div className={styles.statusIndicatorBlock} style={{ textAlign: 'left' }}>
                    <span className={styles.indicatorLabel} style={{ textAlign: 'left' }}>AVG. RESOLUTION</span>
                    <span className={styles.indicatorValue} style={{ fontSize: '1.5rem', textAlign: 'left' }}>2.8 DAYS</span>
                  </div>
                </div>

                {/* Severity breakdown spectrum */}
                <div>
                  <span className={styles.indicatorLabel} style={{ marginBottom: '1rem', display: 'block' }}>Severity Breakdown</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div className={styles.severityRow} style={{ margin: 0 }}>
                      <span className={styles.severityLabel}>CRITICAL</span>
                      <span className={styles.severityValue} style={{ color: 'var(--color-railway-red)' }}>4</span>
                    </div>
                    <div className={styles.severityRow} style={{ margin: 0 }}>
                      <span className={styles.severityLabel}>HIGH</span>
                      <span className={styles.severityValue}>12</span>
                    </div>
                    <div className={styles.severityRow} style={{ margin: 0 }}>
                      <span className={styles.severityLabel}>MEDIUM</span>
                      <span className={styles.severityValue}>19</span>
                    </div>
                    <div className={styles.severityRow} style={{ margin: 0 }}>
                      <span className={styles.severityLabel}>LOW</span>
                      <span className={styles.severityValue}>12</span>
                    </div>
                  </div>

                  <div className={styles.severitySpectrum}>
                    <div className={styles.spectrumSegment} style={{ width: '8.5%', backgroundColor: 'var(--color-railway-red)' }} />
                    <div className={styles.spectrumSegment} style={{ width: '25.5%', backgroundColor: '#bc6c25' }} />
                    <div className={styles.spectrumSegment} style={{ width: '40.4%', backgroundColor: '#dda15e' }} />
                    <div className={styles.spectrumSegment} style={{ width: '25.6%', backgroundColor: 'var(--color-border-strong)' }} />
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* S06: ASSET CONDITION ANALYSIS */}
        <ScrollReveal>
          <div className={styles.sectionBlock}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Asset Condition Analysis</h2>
              <p className={styles.sectionDesc}>Distribution of physical infrastructure condition segments across the registry.</p>
            </div>

            <div className={styles.twoColGrid} style={{ gridTemplateColumns: '1.8fr 1fr' }}>
              <div className={styles.distributionContainer}>
                <div className={styles.distributionRows}>
                  <div className={styles.distRow}>
                    <span className={styles.distLabelCol}>OPTIMAL</span>
                    <div className={styles.distValueBar}>
                      <div className={styles.distValueFill} style={{ width: '89.2%' }} />
                    </div>
                    <span className={styles.distValCol}>1,146</span>
                  </div>
                  <div className={styles.distRow}>
                    <span className={styles.distLabelCol}>DEGRADED</span>
                    <div className={styles.distValueBar}>
                      <div className={styles.distValueFill} style={{ width: '9.3%', backgroundColor: 'var(--color-text-muted)' }} />
                    </div>
                    <span className={styles.distValCol}>120</span>
                  </div>
                  <div className={styles.distRow}>
                    <span className={styles.distLabelCol}>CRITICAL</span>
                    <div className={styles.distValueBar}>
                      <div className={styles.distValueFill} style={{ width: '1.5%', backgroundColor: 'var(--color-railway-red)' }} />
                    </div>
                    <span className={styles.distValCol}>18</span>
                  </div>
                </div>
              </div>

              <div className={styles.insightBlock}>
                <span className={styles.indicatorLabel} style={{ color: 'var(--color-railway-red)', marginBottom: '8px' }}>OBSERVATION</span>
                <p style={{ fontStyle: 'italic', fontSize: '0.92rem', color: '#1e1b19', lineHeight: '1.6', margin: 0 }}>
                  Track infrastructure represents the highest concentration of critical assets.
                </p>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* S07: DEPARTMENT PERFORMANCE COMPARE MATRIX */}
        <ScrollReveal>
          <div className={styles.sectionBlock}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Department Performance Matrix</h2>
              <p className={styles.sectionDesc}>Comparison index of active coordination parameters across zones.</p>
            </div>

            <div style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-surface)' }}>
              <table className={styles.matrixTable}>
                <thead>
                  <tr>
                    <th className={styles.matrixTh}>DEPARTMENT</th>
                    <th className={styles.matrixTh}>ACTIVE TASKS</th>
                    <th className={styles.matrixTh}>COMPLETED TASKS</th>
                    <th className={styles.matrixTh}>AVG. RESOLUTION</th>
                    <th className={styles.matrixTh}>BLOCK UTILIZATION</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className={`${styles.matrixTd} ${styles.matrixRowTitle}`}>ENGINEERING</td>
                    <td className={styles.matrixTd}>18</td>
                    <td className={styles.matrixTd}>42</td>
                    <td className={styles.matrixTd}>3.2 Days</td>
                    <td className={styles.matrixTd}>94.5%</td>
                  </tr>
                  <tr>
                    <td className={`${styles.matrixTd} ${styles.matrixRowTitle}`}>S&amp;T</td>
                    <td className={styles.matrixTd}>15</td>
                    <td className={styles.matrixTd}>38</td>
                    <td className={styles.matrixTd}>2.1 Days</td>
                    <td className={styles.matrixTd}>91.2%</td>
                  </tr>
                  <tr>
                    <td className={`${styles.matrixTd} ${styles.matrixRowTitle}`}>TRACTION</td>
                    <td className={styles.matrixTd}>14</td>
                    <td className={styles.matrixTd}>31</td>
                    <td className={styles.matrixTd}>2.9 Days</td>
                    <td className={styles.matrixTd}>90.4%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </ScrollReveal>

        {/* S08: TEJAS OPTIMIZATION IMPACT */}
        <ScrollReveal>
          <div className={styles.sectionBlock}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Optimization Impact</h2>
              <p className={styles.sectionDesc}>Measured operational value generated through coordinated planning and CP-SAT optimization.</p>
            </div>

            <div className={styles.twoColGrid} style={{ gridTemplateColumns: '1fr 1.6fr', alignItems: 'center' }}>
              <div className={styles.statusIndicatorBlock} style={{ textAlign: 'left' }}>
                <span className={styles.indicatorLabel}>ESTIMATED DOWNTIME AVOIDED</span>
                <span className={styles.metricValue} style={{ fontSize: '3.5rem', marginTop: '0.5rem' }}>18.6 HRS</span>
                <span className={styles.metricChange} style={{ fontSize: '0.72rem' }}>SAVINGS ACCUMULATED THIS QUARTER</span>
              </div>

              {/* Converging track coordination visualization */}
              <div style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-surface)', padding: '2.5rem 2rem' }}>
                <span className={styles.indicatorLabel} style={{ marginBottom: '1.5rem', display: 'block' }}>Window Coordination Flow</span>
                <div className={styles.convergeVisual}>
                  {/* Uncoordinated line */}
                  <div className={styles.convergeTrack}>
                    <div className={styles.convergeActiveWindow} style={{ left: '15%', width: '60%' }} />
                    <span className={styles.convergeLabel} style={{ left: '15%' }}>UNCOORDINATED BLOCKS: 6.0 HRS</span>
                  </div>

                  {/* Coordinated converged line */}
                  <div className={styles.convergeTrack}>
                    <div className={styles.convergeActiveWindow} style={{ left: '30%', width: '35%' }} />
                    <div className={styles.convergeCenterNode} />
                    <span className={styles.convergeLabel} style={{ left: '30%' }}>TEJAS COORDINATED: 3.5 HRS (SAVED 2.5 HRS)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* S09: OPERATIONAL briefing INSIGHTS */}
        <ScrollReveal>
          <div className={styles.sectionBlock}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Operational Insights</h2>
              <p className={styles.sectionDesc}>Analyst briefing notes generated from network metrics.</p>
            </div>

            <div className={styles.insightList}>
              <div className={styles.insightRow}>
                <span className={styles.insightNum}>01</span>
                <h4 className={styles.insightTitle}>MAINTENANCE PRESSURE</h4>
                <p className={styles.insightText}>Critical maintenance backlog remains concentrated around high-traffic track assets.</p>
              </div>
              <div className={styles.insightRow}>
                <span className={styles.insightNum}>02</span>
                <h4 className={styles.insightTitle}>BLOCK EFFICIENCY</h4>
                <p className={styles.insightText}>Coordinated maintenance windows continue to reduce cumulative track downtime.</p>
              </div>
              <div className={styles.insightRow}>
                <span className={styles.insightNum}>03</span>
                <h4 className={styles.insightTitle}>ASSET RELIABILITY</h4>
                <p className={styles.insightText}>Overall asset availability remains above 99%.</p>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* S10: REPORT ARCHIVE ROW */}
        <ScrollReveal>
          <div className={styles.sectionBlock}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Report Archive</h2>
              <p className={styles.sectionDesc}>Select a generated dossier to read briefing observations and export logs.</p>
            </div>

            <div className={styles.reportList}>
              {mockReports.map((report) => (
                <div 
                  key={report.id} 
                  className={styles.reportRow}
                  onClick={() => setActiveDoc(report)}
                >
                  <div className={styles.reportRowLeft}>
                    <span className={styles.reportRowTitle}>{report.title}</span>
                    <span className={styles.reportRowMeta}>{report.date} · {report.type}</span>
                    <p className={styles.reportRowDesc}>{report.description}</p>
                  </div>
                  <div className={styles.reportRowRight}>
                    <span className={styles.viewReportAffordance}>VIEW DOSSIER →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* S11: READY FOR REVIEW / GENERATION */}
        <ScrollReveal>
          <div className={styles.reviewSection}>
            <h2 className={styles.reviewTitle}>Ready for Review</h2>
            <p className={styles.reviewDesc}>Generate current operations report compiling active metrics across sectors.</p>
            <button className={styles.actionBtn} onClick={handleGenerateReport}>GENERATE REPORT →</button>
          </div>
        </ScrollReveal>

        {/* FOOTER */}
        <footer className={styles.footer}>
          <div className={styles.footerLeft}>
            <span className={styles.footerLogo}>TEJAS</span>
            <span className={styles.footerCopy}>© 2026 Indian Railways · Ministry of Railways</span>
          </div>
          <div className={styles.footerRight}>
            OPERATIONAL INTEL UNIT
          </div>
        </footer>

      </div>

      {/* S12: REPORT DETAIL OVERLAY BRIEFING */}
      <AnimatePresence>
        {activeDoc && (
          <>
            <motion.div 
              className={styles.drawerOverlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveDoc(null)}
            />
            <motion.div 
              className={styles.sideDrawer}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className={styles.drawerHeader}>
                <div>
                  <span className={styles.docMeta}>{activeDoc.id} · BRIEFING DOSSIER</span>
                  <h2 className={styles.docTitle}>{activeDoc.title}</h2>
                  <span className={styles.docMeta} style={{ color: 'var(--color-text-muted)', display: 'block', marginTop: '4px' }}>
                    GENERATED: {activeDoc.date}
                  </span>
                </div>
                <button className={styles.closeBtn} onClick={() => setActiveDoc(null)}>
                  CLOSE [X]
                </button>
              </div>

              {/* EXECUTIVE SUMMARY */}
              <div className={styles.docSection}>
                <h3 className={styles.docSectionTitle}>EXECUTIVE SUMMARY</h3>
                <p className={styles.docText}>{activeDoc.executiveSummary}</p>
              </div>

              {/* KEY DOSSIER METRICS */}
              <div className={styles.docSection}>
                <h3 className={styles.docSectionTitle}>KEY DOSSIER METRICS</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                  {activeDoc.keyMetrics.map((km, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
                      <span className={styles.indicatorLabel}>{km.label}</span>
                      <span style={{ fontWeight: 800, color: '#1e1b19' }}>{km.val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* KEY OBSERVATIONS */}
              <div className={styles.docSection}>
                <h3 className={styles.docSectionTitle}>KEY OBSERVATIONS</h3>
                <ul style={{ paddingLeft: '1.2rem', margin: 0, color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: '1.7' }}>
                  {activeDoc.observations.map((obs, i) => (
                    <li key={i} style={{ marginBottom: '8px' }}>{obs}</li>
                  ))}
                </ul>
              </div>

              {/* RECOMMENDATIONS */}
              <div className={styles.docSection}>
                <h3 className={styles.docSectionTitle}>RECOMMENDATIONS</h3>
                <ul style={{ paddingLeft: '1.2rem', margin: 0, color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: '1.7' }}>
                  {activeDoc.recommendations.map((rec, i) => (
                    <li key={i} style={{ marginBottom: '8px' }}>{rec}</li>
                  ))}
                </ul>
              </div>

              {/* EXPORT OPTIONS */}
              <div style={{ marginTop: '4rem', display: 'flex', gap: '12px' }}>
                <button className={styles.actionBtn} style={{ flex: 1 }} onClick={() => alert("Dossier exported to PDF logs.")}>
                  EXPORT DOSSIER PDF
                </button>
                <button className={styles.secondaryBtn} style={{ flex: 1 }} onClick={() => alert("Telemetry records exported as CSV.")}>
                  EXPORT RAW CSV
                </button>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Reports;
