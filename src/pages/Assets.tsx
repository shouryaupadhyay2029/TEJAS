import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import { Navbar } from './Home/components/Navbar';
import GradientBackground from '../components/GradientBackground';
import { ScrollReveal } from '../components/motion/ScrollSystem';
import { PageEntryReveal } from '../components/PageEntryReveal';
import styles from './Assets.module.css';

// --- DATA STRUCTURES ---
interface AssetHistory {
  date: string;
  task: string;
  status: string;
}

interface DefectHistory {
  date: string;
  defect: string;
  severity: 'MEDIUM' | 'HIGH' | 'LOW';
  resolution: string;
}

interface OperationalRisk {
  conditionRisk: 'High' | 'Medium' | 'Low';
  trafficImpact: 'High' | 'Medium' | 'Low';
  failureFrequency: string;
  urgency: 'Immediate' | 'Scheduled' | 'Monitoring';
}

interface Asset {
  id: string;
  name: string;
  type: string;
  location: string;
  department: 'Engineering' | 'S&T' | 'Traction';
  condition: 'Critical' | 'Degraded' | 'Optimal';
  availability: number;
  lastInspection: string;
  nextAction: string;
  criticality: 'Class A' | 'Class B' | 'Class C';
  activeDefectsCount: number;
  serviceHistory: AssetHistory[];
  defectHistory: DefectHistory[];
  operationalRisk: OperationalRisk;
}

const mockAssets: Asset[] = [
  {
    id: 'AST-101',
    name: 'Track Segment T1',
    type: 'Track Line',
    location: 'KM 42.4',
    department: 'Engineering',
    condition: 'Critical',
    availability: 94.2,
    lastInspection: '10 Aug 2026',
    nextAction: 'Priority maintenance required',
    criticality: 'Class A',
    activeDefectsCount: 3,
    serviceHistory: [
      { date: '10 AUG 2026', task: 'Joint inspection and bolting', status: 'Completed' },
      { date: '15 JUL 2026', task: 'Ballast dressing', status: 'Completed' },
      { date: '02 JUN 2026', task: 'Alignment inspection', status: 'Completed' },
      { date: '12 APR 2026', task: 'Sleeper condition inspection', status: 'Completed' }
    ],
    defectHistory: [
      { date: '02 JUN 2026', defect: 'Minor alignment displacement', severity: 'MEDIUM', resolution: 'Aligned' },
      { date: '12 APR 2026', defect: 'Sleeper cracking', severity: 'HIGH', resolution: 'Replaced' }
    ],
    operationalRisk: {
      conditionRisk: 'High',
      trafficImpact: 'High',
      failureFrequency: '4 previous occurrences',
      urgency: 'Immediate'
    }
  },
  {
    id: 'AST-202',
    name: 'Junction Point 4A',
    type: 'Point Machine',
    location: 'KM 43.1',
    department: 'S&T',
    condition: 'Critical',
    availability: 97.8,
    lastInspection: '18 Aug 2026',
    nextAction: 'Replace motor assembly',
    criticality: 'Class A',
    activeDefectsCount: 2,
    serviceHistory: [
      { date: '18 AUG 2026', task: 'Motor torque calibration', status: 'Completed' },
      { date: '28 JUL 2026', task: 'Point lubrication & cleaning', status: 'Completed' },
      { date: '10 JUN 2026', task: 'Slide chair adjustment', status: 'Completed' }
    ],
    defectHistory: [
      { date: '28 JUL 2026', defect: 'Torque limit exceeded', severity: 'HIGH', resolution: 'Calibrated' },
      { date: '10 JUN 2026', defect: 'Switch rail gap gap discrepancy', severity: 'MEDIUM', resolution: 'Adjusted' }
    ],
    operationalRisk: {
      conditionRisk: 'High',
      trafficImpact: 'High',
      failureFrequency: '2 previous occurrences',
      urgency: 'Immediate'
    }
  },
  {
    id: 'AST-303',
    name: 'OHE Line 3',
    type: 'Overhead Equipment',
    location: 'KM 45.8',
    department: 'Traction',
    condition: 'Degraded',
    availability: 98.5,
    lastInspection: '05 Aug 2026',
    nextAction: 'Tensioner adjustment scheduled',
    criticality: 'Class B',
    activeDefectsCount: 1,
    serviceHistory: [
      { date: '05 AUG 2026', task: 'Contact wire wear measurement', status: 'Completed' },
      { date: '12 JUL 2026', task: 'Insulator cleaning', status: 'Completed' },
      { date: '18 MAY 2026', task: 'Steady arm replacement', status: 'Completed' }
    ],
    defectHistory: [
      { date: '12 JUL 2026', defect: 'Insulator flashover trace', severity: 'MEDIUM', resolution: 'Cleaned' }
    ],
    operationalRisk: {
      conditionRisk: 'Medium',
      trafficImpact: 'High',
      failureFrequency: '1 previous occurrence',
      urgency: 'Scheduled'
    }
  },
  {
    id: 'AST-404',
    name: 'Bridge 104',
    type: 'Structural Bridge',
    location: 'KM 51.2',
    department: 'Engineering',
    condition: 'Degraded',
    availability: 99.1,
    lastInspection: '22 Jul 2026',
    nextAction: 'Abutment grouting inspection',
    criticality: 'Class A',
    activeDefectsCount: 1,
    serviceHistory: [
      { date: '22 JUL 2026', task: 'Substructure scour inspection', status: 'Completed' },
      { date: '04 MAY 2026', task: 'Bearing lubrication', status: 'Completed' }
    ],
    defectHistory: [
      { date: '04 MAY 2026', defect: 'Minor substructure hairline crack', severity: 'LOW', resolution: 'Monitored' }
    ],
    operationalRisk: {
      conditionRisk: 'Medium',
      trafficImpact: 'High',
      failureFrequency: '0 previous occurrences',
      urgency: 'Monitoring'
    }
  },
  {
    id: 'AST-505',
    name: 'Signal S12',
    type: 'Color Light Signal',
    location: 'KM 46.7',
    department: 'S&T',
    condition: 'Optimal',
    availability: 99.9,
    lastInspection: '24 Aug 2026',
    nextAction: 'Routine visual inspection',
    criticality: 'Class C',
    activeDefectsCount: 0,
    serviceHistory: [
      { date: '24 AUG 2026', task: 'LED aspect replacement', status: 'Completed' },
      { date: '14 JUL 2026', task: 'Aspect power supply unit test', status: 'Completed' }
    ],
    defectHistory: [],
    operationalRisk: {
      conditionRisk: 'Low',
      trafficImpact: 'Medium',
      failureFrequency: '0 previous occurrences',
      urgency: 'Monitoring'
    }
  }
];

export const Assets: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  
  // Filter states
  const [selectedType, setSelectedType] = useState('ALL TYPES');
  const [selectedDept, setSelectedDept] = useState('ALL DEPARTMENTS');
  const [selectedCondition, setSelectedCondition] = useState('ALL CONDITIONS');
  
  // Inspector drawer state
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  // Stagger entry variables
  const headerEyebrowVariants = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { delay: 0.15, duration: 0.6 } } };
  const headerTitleVariants = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { delay: 0.35, duration: 0.7 } } };
  const headerDescVariants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { delay: 0.55, duration: 0.7 } } };
  const rightStatsVariants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { delay: 0.65, duration: 0.7 } } };
  const contentFadeVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { delay: 0.85, duration: 0.8 } } };

  // Filter handlers
  const filteredAssets = mockAssets.filter((asset) => {
    const matchesSearch = 
      asset.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.location.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesType = selectedType === 'ALL TYPES' || asset.type.toUpperCase() === selectedType;
    const matchesDept = selectedDept === 'ALL DEPARTMENTS' || asset.department.toUpperCase() === selectedDept;
    const matchesCondition = selectedCondition === 'ALL CONDITIONS' || asset.condition.toUpperCase() === selectedCondition;
    
    return matchesSearch && matchesType && matchesDept && matchesCondition;
  });

  const getConditionColor = (cond: Asset['condition']) => {
    switch (cond) {
      case 'Critical': return '#bc473a'; // Muted Red
      case 'Degraded': return '#8a7e72'; // Muted Amber/Brown
      case 'Optimal': return '#d2b48c';  // Neutral/Tan
    }
  };

  return (
    <div className={styles.assetsPage}>
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
        
        {/* S01: HERO SECTION */}
        <div className={styles.heroRow}>
          <div className={styles.heroLeft}>
            <PageEntryReveal delay={0.15} duration={1.1}>
              <motion.span className={styles.eyebrow} variants={headerEyebrowVariants} initial="hidden" animate="visible">
                ASSET INTELLIGENCE
              </motion.span>
            </PageEntryReveal>
            
            <div style={{ margin: '4px 0' }}>
              <PageEntryReveal delay={0.35} duration={1.25}>
                <motion.h1 className={styles.pageTitle} variants={headerTitleVariants} initial="hidden" animate="visible">
                  Railway Asset Registry
                </motion.h1>
              </PageEntryReveal>
            </div>
            
            <motion.p className={styles.subtitle} variants={headerDescVariants} initial="hidden" animate="visible">
              A unified view of infrastructure condition, availability, service history, and operational risk across the network.
            </motion.p>
          </div>

          <motion.div className={styles.heroRight} variants={rightStatsVariants} initial="hidden" animate="visible">
            <div className={styles.statusIndicatorBlock}>
              <span className={styles.indicatorLabel}>TOTAL ASSETS</span>
              <span className={styles.indicatorValue}>1,284</span>
            </div>
            <div style={{ width: '1px', height: '32px', backgroundColor: 'var(--color-border)', alignSelf: 'center' }} />
            <div className={styles.statusIndicatorBlock}>
              <span className={styles.indicatorLabel}>CRITICAL</span>
              <span className={`${styles.indicatorValue} styles.indicatorValueCritical`}>18</span>
            </div>
            <div style={{ width: '1px', height: '32px', backgroundColor: 'var(--color-border)', alignSelf: 'center' }} />
            <div className={styles.statusIndicatorBlock}>
              <span className={styles.indicatorLabel}>AVG. AVAILABILITY</span>
              <span className={styles.indicatorValue}>98.7%</span>
            </div>
          </motion.div>
        </div>

        <motion.div className={styles.dividerLine} variants={contentFadeVariants} initial="hidden" animate="visible" />

        {/* S02: ASSET HEALTH OVERVIEW */}
        <ScrollReveal>
          <div className={styles.healthOverview}>
            <h2 className={styles.sectionTitle}>Asset Health Overview</h2>
            
            <div className={styles.healthGrid}>
              <div className={styles.healthCard}>
                <div className={styles.healthCardHeader}>
                  <span className={styles.healthCardLabel}>Operational</span>
                  <span className={styles.healthDot} style={{ backgroundColor: 'var(--color-text-secondary)' }} />
                </div>
                <div className={styles.healthValue}>1,146</div>
                <div className={styles.healthBarTrack}>
                  <div className={styles.healthBarFill} style={{ width: '89.2%', backgroundColor: 'var(--color-text-secondary)' }} />
                </div>
              </div>

              <div className={styles.healthCard}>
                <div className={styles.healthCardHeader}>
                  <span className={styles.healthCardLabel}>Degraded</span>
                  <span className={styles.healthDot} style={{ backgroundColor: 'var(--color-text-muted)' }} />
                </div>
                <div className={styles.healthValue}>120</div>
                <div className={styles.healthBarTrack}>
                  <div className={styles.healthBarFill} style={{ width: '9.3%', backgroundColor: 'var(--color-text-muted)' }} />
                </div>
              </div>

              <div className={styles.healthCard}>
                <div className={styles.healthCardHeader}>
                  <span className={styles.healthCardLabel}>Critical</span>
                  <span className={styles.healthDot} style={{ backgroundColor: 'var(--color-railway-red)' }} />
                </div>
                <div className={styles.healthValue}>18</div>
                <div className={styles.healthBarTrack}>
                  <div className={styles.healthBarFill} style={{ width: '1.4%', backgroundColor: 'var(--color-railway-red)' }} />
                </div>
              </div>

              <div className={styles.healthCard}>
                <div className={styles.healthCardHeader}>
                  <span className={styles.healthCardLabel}>Under Maintenance</span>
                  <span className={styles.healthDot} style={{ backgroundColor: 'rgba(255,255,255,0.3)' }} />
                </div>
                <div className={styles.healthValue}>24</div>
                <div className={styles.healthBarTrack}>
                  <div className={styles.healthBarFill} style={{ width: '1.8%', backgroundColor: 'rgba(255,255,255,0.3)' }} />
                </div>
              </div>
            </div>

            {/* Subtle horizontal health distribution visualization */}
            <div className={styles.distributionTrack}>
              <div className={styles.distSegment} style={{ width: '89.2%', backgroundColor: 'var(--color-text-secondary)' }} />
              <div className={styles.distSegment} style={{ width: '9.3%', backgroundColor: 'var(--color-text-muted)' }} />
              <div className={styles.distSegment} style={{ width: '1.5%', backgroundColor: 'var(--color-railway-red)' }} />
            </div>
          </div>
        </ScrollReveal>

        {/* S03: ASSET REGISTRY & FILTERS */}
        <ScrollReveal>
          <div className={styles.registrySection}>
            <div className={styles.registryIntro}>
              <h2 className={styles.sectionTitle}>Asset Registry</h2>
              <p className={styles.registryDesc}>Search and inspect infrastructure assets across engineering, S&T and traction systems.</p>
            </div>

            <div className={styles.filterBar}>
              <div className={styles.searchWrapper}>
                <Search className={styles.searchIcon} />
                <input 
                  type="text" 
                  placeholder="Search by asset ID, name, location or type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                />
              </div>

              <select 
                value={selectedType} 
                onChange={(e) => setSelectedType(e.target.value)}
                className={styles.selectInput}
              >
                <option value="ALL TYPES">ALL TYPES</option>
                <option value="TRACK LINE">TRACK LINES</option>
                <option value="POINT MACHINE">POINT MACHINES</option>
                <option value="OVERHEAD EQUIPMENT">OVERHEAD EQUIPMENT</option>
                <option value="STRUCTURAL BRIDGE">BRIDGES</option>
                <option value="COLOR LIGHT SIGNAL">SIGNALS</option>
              </select>

              <select 
                value={selectedDept} 
                onChange={(e) => setSelectedDept(e.target.value)}
                className={styles.selectInput}
              >
                <option value="ALL DEPARTMENTS">ALL DEPARTMENTS</option>
                <option value="ENGINEERING">ENGINEERING</option>
                <option value="S&T">S&T</option>
                <option value="TRACTION">TRACTION</option>
              </select>

              <select 
                value={selectedCondition} 
                onChange={(e) => setSelectedCondition(e.target.value)}
                className={styles.selectInput}
              >
                <option value="ALL CONDITIONS">ALL CONDITIONS</option>
                <option value="OPTIMAL">OPTIMAL</option>
                <option value="DEGRADED">DEGRADED</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>

              <button 
                onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
                className={styles.toggleBtn}
              >
                {viewMode === 'list' ? 'LIST VIEW' : 'GRID VIEW'}
              </button>
            </div>

            {/* S04: ASSET LIST OR GRID */}
            <AnimatePresence mode="wait">
              {viewMode === 'list' ? (
                <motion.div 
                  key="list" 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }}
                  className={styles.assetList}
                >
                  <div className={styles.listHeader}>
                    <span>ASSET ID</span>
                    <span>ASSET NAME</span>
                    <span>TYPE</span>
                    <span className={styles.locationCol}>LOCATION / KM</span>
                    <span>DEPARTMENT</span>
                    <span>CONDITION</span>
                    <span className={styles.availabilityCol}>AVAILABILITY</span>
                    <span className={styles.inspectionCol}>LAST INSP</span>
                  </div>

                  {filteredAssets.map((asset) => (
                    <div 
                      key={asset.id} 
                      className={`${styles.assetRow} ${selectedAsset?.id === asset.id ? styles.assetRowActive : ''}`}
                      onClick={() => setSelectedAsset(asset)}
                    >
                      <div className={styles.rowAccent} />
                      <span className={styles.idCell}>{asset.id}</span>
                      <span className={styles.nameCell}>{asset.name}</span>
                      <span className={styles.tagCell}>{asset.type}</span>
                      <span className={`${styles.tagCell} ${styles.locationCol}`}>{asset.location}</span>
                      <span className={styles.tagCell}>{asset.department}</span>
                      <span className={styles.statusTag}>
                        <span className={styles.statusDot} style={{ backgroundColor: getConditionColor(asset.condition) }} />
                        <span style={{ color: getConditionColor(asset.condition) }}>{asset.condition}</span>
                      </span>
                      <span className={`${styles.idCell} ${styles.availabilityCol}`}>{asset.availability}%</span>
                      <span className={`${styles.tagCell} ${styles.inspectionCol}`}>{asset.lastInspection}</span>
                      <span className={styles.viewAssetAffordance}>INSPECT →</span>
                    </div>
                  ))}
                </motion.div>
              ) : (
                <motion.div 
                  key="grid" 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }}
                  className={styles.assetGrid}
                >
                  {filteredAssets.map((asset) => (
                    <div 
                      key={asset.id} 
                      className={styles.assetGridCard}
                      onClick={() => setSelectedAsset(asset)}
                    >
                      <div className={styles.cardHeader}>
                        <span className={styles.idCell}>{asset.id}</span>
                        <span className={styles.statusTag}>
                          <span className={styles.statusDot} style={{ backgroundColor: getConditionColor(asset.condition) }} />
                          <span style={{ color: getConditionColor(asset.condition) }}>{asset.condition}</span>
                        </span>
                      </div>
                      <h3 className={styles.cardTitle}>{asset.name}</h3>
                      <div className={styles.cardMeta}>
                        <span>TYPE: {asset.type}</span>
                        <span>LOCATION: {asset.location}</span>
                        <span>DEPT: {asset.department}</span>
                      </div>
                      <div className={styles.cardFooter}>
                        <span className={styles.idCell}>{asset.availability}% AVAIL</span>
                        <span className={styles.viewAssetAffordance}>INSPECT →</span>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </ScrollReveal>

        {/* S05: OPERATIONAL RISK SPECTER / DYNAMIC SNAPSHOT */}
        <ScrollReveal>
          <div className={styles.snapshotSection}>
            <h2 className={styles.sectionTitle}>Network Asset Snapshot</h2>
            <div className={styles.snapshotGrid}>
              <div className={styles.snapshotSummary}>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: '1.7', margin: 0 }}>
                  A live overview mapping the topological distribution of physical assets across zones. Hairlines structure asset volumes inside Engineering, S&T and Traction domains.
                </p>
              </div>
              <div className={styles.snapshotVisual}>
                <div className={styles.snapshotLine} />
                
                <div className={styles.snapshotNodeRow}>
                  <div className={styles.snapshotConnector} />
                  <span className={styles.snapshotNodeLabel}>ENGINEERING</span>
                  <div className={styles.snapshotNodeValueBar}>
                    <div className={styles.snapshotNodeValueFill} style={{ width: '45%' }} />
                  </div>
                  <span className={styles.snapshotValueLabel}>577</span>
                </div>

                <div className={styles.snapshotNodeRow}>
                  <div className={styles.snapshotConnector} />
                  <span className={styles.snapshotNodeLabel}>S&T</span>
                  <div className={styles.snapshotNodeValueBar}>
                    <div className={styles.snapshotNodeValueFill} style={{ width: '30%' }} />
                  </div>
                  <span className={styles.snapshotValueLabel}>385</span>
                </div>

                <div className={styles.snapshotNodeRow}>
                  <div className={styles.snapshotConnector} />
                  <span className={styles.snapshotNodeLabel}>TRACTION</span>
                  <div className={styles.snapshotNodeValueBar}>
                    <div className={styles.snapshotNodeValueFill} style={{ width: '25%' }} />
                  </div>
                  <span className={styles.snapshotValueLabel}>322</span>
                </div>
              </div>
            </div>
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

      {/* S06: ASSET DETAIL SIDE PANEL SHEET */}
      <AnimatePresence>
        {selectedAsset && (
          <>
            <motion.div 
              className={styles.drawerOverlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAsset(null)}
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
                  <span className={styles.drawerMeta}>{selectedAsset.id}</span>
                  <h2 className={styles.drawerTitle}>{selectedAsset.name}</h2>
                </div>
                <button className={styles.closeBtn} onClick={() => setSelectedAsset(null)}>
                  CLOSE [X]
                </button>
              </div>

              {/* ASSET PROFILE */}
              <div className={styles.drawerSection}>
                <h3 className={styles.drawerSubTitle}>ASSET PROFILE</h3>
                <div className={styles.metricGrid}>
                  <div className={styles.metricItem}>
                    <span className={styles.indicatorLabel}>CURRENT CONDITION</span>
                    <span className={styles.metricVal} style={{ color: getConditionColor(selectedAsset.condition) }}>
                      {selectedAsset.condition}
                    </span>
                  </div>
                  <div className={styles.metricItem}>
                    <span className={styles.indicatorLabel}>AVAILABILITY</span>
                    <span className={styles.metricVal}>{selectedAsset.availability}%</span>
                  </div>
                  <div className={styles.metricItem}>
                    <span className={styles.indicatorLabel}>ASSET CRITICALITY</span>
                    <span className={styles.metricVal}>{selectedAsset.criticality}</span>
                  </div>
                  <div className={styles.metricItem}>
                    <span className={styles.indicatorLabel}>ACTIVE DEFECTS</span>
                    <span className={styles.metricVal} style={{ color: selectedAsset.activeDefectsCount > 0 ? 'var(--color-railway-red)' : 'inherit' }}>
                      {selectedAsset.activeDefectsCount} Open
                    </span>
                  </div>
                  <div className={styles.metricItem}>
                    <span className={styles.indicatorLabel}>LAST INSPECTION</span>
                    <span className={styles.metricVal}>{selectedAsset.lastInspection}</span>
                  </div>
                  <div className={styles.metricItem}>
                    <span className={styles.indicatorLabel}>NEXT ACTION</span>
                    <span className={styles.metricVal} style={{ fontSize: '0.82rem', lineHeight: '1.4', marginTop: '4px' }}>
                      {selectedAsset.nextAction}
                    </span>
                  </div>
                </div>
              </div>

              {/* SERVICE HISTORY */}
              <div className={styles.drawerSection}>
                <h3 className={styles.drawerSubTitle}>SERVICE HISTORY</h3>
                <div className={styles.timeline}>
                  <div className={styles.timelineLine} />
                  {selectedAsset.serviceHistory.map((history, i) => (
                    <div key={i} className={`${styles.timelineNode} ${i === 0 ? styles.timelineNodeActive : ''}`}>
                      <div className={styles.timelineDot} />
                      <span className={styles.timelineDate}>{history.date}</span>
                      <p className={styles.timelineTask}>{history.task} — {history.status}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* DEFECT / FAILURE HISTORY */}
              {selectedAsset.defectHistory.length > 0 && (
                <div className={styles.drawerSection}>
                  <h3 className={styles.drawerSubTitle}>DEFECT & FAILURE RECORD</h3>
                  <div className={styles.defectTable}>
                    {selectedAsset.defectHistory.map((defect, i) => (
                      <div key={i} className={styles.defectItem}>
                        <div>
                          <span className={styles.defectDate}>{defect.date}</span>
                          <p className={styles.defectDesc} style={{ margin: '4px 0 0' }}>{defect.defect}</p>
                        </div>
                        <span 
                          className={styles.severityTag} 
                          style={{ 
                            backgroundColor: defect.severity === 'HIGH' ? 'rgba(188,71,58,0.1)' : 'rgba(255,255,255,0.05)',
                            color: defect.severity === 'HIGH' ? 'var(--color-railway-red)' : 'var(--color-text-muted)'
                          }}
                        >
                          {defect.severity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* OPERATIONAL RISK SPECTER */}
              <div className={styles.drawerSection}>
                <h3 className={styles.drawerSubTitle}>OPERATIONAL RISK</h3>
                
                <div className={styles.riskItem}>
                  <div className={styles.riskHeader}>
                    <span className={styles.riskLabel}>CONDITION RISK</span>
                    <span className={styles.riskValue} style={{ color: selectedAsset.operationalRisk.conditionRisk === 'High' ? 'var(--color-railway-red)' : 'inherit' }}>
                      {selectedAsset.operationalRisk.conditionRisk}
                    </span>
                  </div>
                  <div className={styles.riskTrack}>
                    <div 
                      className={styles.riskPin} 
                      style={{ 
                        left: selectedAsset.operationalRisk.conditionRisk === 'High' ? '85%' : selectedAsset.operationalRisk.conditionRisk === 'Medium' ? '50%' : '15%',
                        backgroundColor: selectedAsset.operationalRisk.conditionRisk === 'High' ? 'var(--color-railway-red)' : 'var(--color-text-secondary)'
                      }} 
                    />
                  </div>
                </div>

                <div className={styles.riskItem}>
                  <div className={styles.riskHeader}>
                    <span className={styles.riskLabel}>TRAFFIC IMPACT</span>
                    <span className={styles.riskValue} style={{ color: selectedAsset.operationalRisk.trafficImpact === 'High' ? 'var(--color-railway-red)' : 'inherit' }}>
                      {selectedAsset.operationalRisk.trafficImpact}
                    </span>
                  </div>
                  <div className={styles.riskTrack}>
                    <div 
                      className={styles.riskPin} 
                      style={{ 
                        left: selectedAsset.operationalRisk.trafficImpact === 'High' ? '85%' : selectedAsset.operationalRisk.trafficImpact === 'Medium' ? '50%' : '15%',
                        backgroundColor: selectedAsset.operationalRisk.trafficImpact === 'High' ? 'var(--color-railway-red)' : 'var(--color-text-secondary)'
                      }} 
                    />
                  </div>
                </div>

                <div className={styles.riskItem}>
                  <div className={styles.riskHeader}>
                    <span className={styles.riskLabel}>FAILURE FREQUENCY</span>
                    <span className={styles.riskValue}>{selectedAsset.operationalRisk.failureFrequency}</span>
                  </div>
                </div>

                <div className={styles.riskItem}>
                  <div className={styles.riskHeader}>
                    <span className={styles.riskLabel}>MAINTENANCE URGENCY</span>
                    <span className={styles.riskValue} style={{ color: selectedAsset.operationalRisk.urgency === 'Immediate' ? 'var(--color-railway-red)' : 'inherit' }}>
                      {selectedAsset.operationalRisk.urgency}
                    </span>
                  </div>
                </div>

              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Assets;
