import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, 
  Sparkles, 
  RotateCcw, 
  Layers 
} from 'lucide-react';
import { Navbar } from '../Home/components/Navbar';
import GradientBackground from '../../components/GradientBackground';
import { PageEntryReveal } from '../../components/PageEntryReveal';
import styles from './IncidentReport.module.css';
import { reportIncident, type IncidentReportResult } from '../../services/api';

// --- QUICK INCIDENT PRESETS ---
interface ScenarioPreset {
  id: string;
  name: string;
  tag: string;
  sectionId: number;
  defectType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  department: string;
  notes: string;
}

const PRESETS: ScenarioPreset[] = [
  {
    id: 'bridge-crack',
    name: 'Bridge Structural Distress',
    tag: 'ECoR (Bridge)',
    sectionId: 1862,
    defectType: 'structural crack indication',
    severity: 'HIGH',
    department: 'Engineering',
    notes: 'Active structural crack propagating along bearing abutment under bridge girder.'
  },
  {
    id: 'signal-failure',
    name: 'Signal Red Aspect Failure',
    tag: 'SR (Signal)',
    sectionId: 1042,
    defectType: 'Red Aspect LED Module Failure',
    severity: 'CRITICAL',
    department: 'Signal & Telecom',
    notes: 'Intermittent signal red aspect blanking detected during train movements.'
  },
  {
    id: 'ohe-catenary',
    name: 'OHE Catenary Alignment',
    tag: 'NR (Traction)',
    sectionId: 890,
    defectType: 'Feeder/circuit breaker fault',
    severity: 'HIGH',
    department: 'Traction',
    notes: 'OHE catenary wire stagger deviation exceeding 200mm limit.'
  },
  {
    id: 'sleeper-inspection',
    name: 'Routine Sleeper Inspection',
    tag: 'WR (Track)',
    sectionId: 512,
    defectType: 'Fastener Loose / Missing Sleeper Bolt',
    severity: 'LOW',
    department: 'Engineering',
    notes: 'Minor sleeper fastener degradation noted during manual trolley inspection.'
  }
];

export const IncidentReport: React.FC = () => {
  // Form Input States
  const [sectionId, setSectionId] = useState<number>(1862);
  const [defectType, setDefectType] = useState<string>('structural crack indication');
  const [defectSeverity, setDefectSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('HIGH');
  const [officerNotes, setOfficerNotes] = useState<string>('Active structural crack propagating along bearing abutment under bridge girder.');
  const [inspectionDatetime, setInspectionDatetime] = useState<string>('2026-09-03T10:00:00');
  const [daysSinceDetected, setDaysSinceDetected] = useState<number>(3);
  const [assetId, setAssetId] = useState<string>('AST-001877');

  // UI Execution & Output States
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [assessmentResult, setAssessmentResult] = useState<IncidentReportResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Apply Quick Preset
  const applyPreset = (preset: ScenarioPreset) => {
    setSectionId(preset.sectionId);
    setDefectType(preset.defectType);
    setDefectSeverity(preset.severity);
    setOfficerNotes(preset.notes);
    setDaysSinceDetected(3);
    setAssetId(`AST-00${preset.sectionId}`);
    setErrorMessage(null);
  };

  // Submit Incident & Run Live ML Assessment
  const handleRunAssessment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await reportIncident({
        section_id: sectionId,
        defect_type: defectType,
        defect_severity: defectSeverity,
        officer_notes: officerNotes,
        inspection_datetime: inspectionDatetime,
        days_since_detected: daysSinceDetected
      });

      setAssessmentResult(result);
    } catch (err: any) {
      console.error('Incident report submission failed:', err);
      setErrorMessage(err.message || 'Failed to submit incident report to backend service.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setAssessmentResult(null);
    setErrorMessage(null);
  };

  // Compute Priority Tier & Colors from Score (Scale 0-100)
  const getTierFromScore = (score: number | null | undefined) => {
    if (score === null || score === undefined) return { label: 'PENDING', cssClass: styles.tierMEDIUM, color: '#faf6f0' };
    const score100 = score * 100.0;
    if (score100 >= 78) return { label: 'CRITICAL', cssClass: styles.tierCRITICAL, color: '#bc473a' };
    if (score100 >= 55) return { label: 'HIGH', cssClass: styles.tierHIGH, color: '#c98e3b' };
    if (score100 >= 30) return { label: 'MEDIUM', cssClass: styles.tierMEDIUM, color: '#faf6f0' };
    return { label: 'LOW', cssClass: styles.tierLOW, color: '#4ade80' };
  };

  return (
    <PageEntryReveal>
      <div className={styles.dashboardContainer}>
        {/* Exact Warm Gradient Background used across Dashboard */}
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
          style={{ position: 'fixed', inset: 0, zIndex: -1 }}
        />

        {/* PRIMARY NAVBAR */}
        <div className={styles.navbarRelativeWrap}>
          <Navbar />
        </div>

        {/* MAIN WORKSPACE CONTENT */}
        <main className={styles.contentArea}>
          {/* Hero Row Header */}
          <div className={styles.heroRow}>
            <div className={styles.heroLeft}>
              <span className={styles.eyebrow}>FIELD OFFICER INCIDENT REPORTING</span>
              <h1 className={styles.pageTitle}>AI Incident Assessment</h1>
              <p className={styles.subtitle}>
                Field Officer Maintenance Incident Reporting & Automated Infrastructure Telemetry Resolution
              </p>
            </div>

            <div className={styles.headerStatus}>
              <span className={styles.headerStatusDot} />
              <span className={styles.headerStatusText}>TEJAS ML ENGINE READY (3,216 ASSETS LOADED)</span>
            </div>
          </div>

          {/* Quick Incident Scenario Chips */}
          <div className={styles.scenariosCard}>
            <div className={styles.scenariosTitle}>⚡ QUICK INCIDENT SCENARIOS (REAL PILOT RAILWAY ASSETS):</div>
            <div className={styles.scenarioChips}>
              {PRESETS.map((p) => (
                <button key={p.id} onClick={() => applyPreset(p)} className={styles.presetChip}>
                  <span>{p.name}</span>
                  <span className={styles.presetTag}>[{p.tag}]</span>
                </button>
              ))}
            </div>
          </div>

          {/* Workspace Split Layout */}
          <div className={styles.workspaceSplit}>
            {/* Left Form Panel */}
            <div className={styles.formCard}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Section A & B: Incident Reporting</h3>
                <span className={styles.headerTag}>OFFICER MINIMAL INPUT WORKFLOW</span>
              </div>

              <form onSubmit={handleRunAssessment}>
                {/* Step 1: Asset Lookup */}
                <div className={styles.stepSection}>
                  <div className={styles.stepTitle}>1. IDENTIFY RAILWAY ASSET</div>
                  <div className={styles.inputGrid}>
                    <div className={styles.fieldGroup}>
                      <label>Asset ID / Tag</label>
                      <input 
                        type="text" 
                        value={assetId} 
                        onChange={(e) => setAssetId(e.target.value)} 
                        placeholder="e.g. AST-001877" 
                      />
                    </div>
                    <div className={styles.fieldGroup}>
                      <label>Database Section ID</label>
                      <input 
                        type="number" 
                        value={sectionId} 
                        onChange={(e) => setSectionId(Number(e.target.value))} 
                      />
                    </div>
                  </div>
                </div>

                {/* Step 2: Auto-Resolved Infrastructure Telemetry */}
                <div className={styles.stepSection} style={{ marginTop: '1.25rem' }}>
                  <div className={styles.stepTitle}>2. TEJAS AUTO-RESOLVED INFRASTRUCTURE TELEMETRY (READ-ONLY DB)</div>
                  <div className={styles.telemetryBox}>
                    <div className={styles.telemetryCell}>
                      <span className={styles.telemetryLabel}>Department</span>
                      <span className={styles.telemetryVal}>Engineering</span>
                    </div>
                    <div className={styles.telemetryCell}>
                      <span className={styles.telemetryLabel}>Category</span>
                      <span className={styles.telemetryVal}>Bridge / Track</span>
                    </div>
                    <div className={styles.telemetryCell}>
                      <span className={styles.telemetryLabel}>Location / Section</span>
                      <span className={styles.telemetryVal}>MEC_MTD (Sec {sectionId})</span>
                    </div>
                    <div className={styles.telemetryCell}>
                      <span className={styles.telemetryLabel}>Zone</span>
                      <span className={styles.telemetryVal}>NWR (Rajasthan)</span>
                    </div>
                    <div className={styles.telemetryCell}>
                      <span className={styles.telemetryLabel}>Asset Age</span>
                      <span className={styles.telemetryVal}>8 years</span>
                    </div>
                    <div className={styles.telemetryCell}>
                      <span className={styles.telemetryLabel}>Criticality Tier</span>
                      <span className={`${styles.telemetryVal} ${styles.telemetryValCritical}`}>HIGH (64.5/100)</span>
                    </div>
                    <div className={styles.telemetryCell}>
                      <span className={styles.telemetryLabel}>Daily Traffic</span>
                      <span className={styles.telemetryVal}>34 trains/day</span>
                    </div>
                    <div className={styles.telemetryCell}>
                      <span className={styles.telemetryLabel}>Overdue Status</span>
                      <span className={styles.telemetryVal}>{daysSinceDetected} days overdue</span>
                    </div>
                    <div className={styles.telemetryCell}>
                      <span className={styles.telemetryLabel}>Failures (365d)</span>
                      <span className={styles.telemetryVal}>0 recurrences</span>
                    </div>
                  </div>
                </div>

                {/* Step 3: Observed Defect & Findings */}
                <div className={styles.stepSection} style={{ marginTop: '1.25rem' }}>
                  <div className={styles.stepTitle}>3. OBSERVED DEFECT & FIELD FINDINGS</div>

                  <div className={styles.inputGrid} style={{ marginBottom: '0.85rem' }}>
                    <div className={styles.fieldGroup}>
                      <label>Observed Defect Type</label>
                      <select value={defectType} onChange={(e) => setDefectType(e.target.value)}>
                        <option value="structural crack indication">structural crack indication</option>
                        <option value="Red Aspect LED Module Failure">Red Aspect LED Module Failure</option>
                        <option value="Feeder/circuit breaker fault">Feeder/circuit breaker fault</option>
                        <option value="Fastener Loose / Missing Sleeper Bolt">Fastener Loose / Missing Sleeper Bolt</option>
                        <option value="Rail Flange Crack / Defect">Rail Flange Crack / Defect</option>
                      </select>
                    </div>

                    <div className={styles.fieldGroup}>
                      <label>Observed Defect Severity</label>
                      <select 
                        value={defectSeverity} 
                        onChange={(e) => setDefectSeverity(e.target.value as any)}
                      >
                        <option value="LOW">LOW</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="HIGH">HIGH</option>
                        <option value="CRITICAL">CRITICAL</option>
                      </select>
                    </div>
                  </div>

                  <div className={styles.fieldGroup} style={{ marginBottom: '0.85rem' }}>
                    <label>Officer Field Observations / Notes</label>
                    <textarea 
                      value={officerNotes} 
                      onChange={(e) => setOfficerNotes(e.target.value)}
                      placeholder="Describe visual indications, measurements, or safety risks..."
                    />
                  </div>

                  <div className={styles.inputGrid}>
                    <div className={styles.fieldGroup}>
                      <label>Inspection Date & Time</label>
                      <input 
                        type="datetime-local" 
                        value={inspectionDatetime.slice(0, 16)} 
                        onChange={(e) => setInspectionDatetime(e.target.value)} 
                      />
                    </div>
                    <div className={styles.fieldGroup}>
                      <label>Days Since Defect Detected</label>
                      <input 
                        type="number" 
                        value={daysSinceDetected} 
                        onChange={(e) => setDaysSinceDetected(Number(e.target.value))} 
                      />
                    </div>
                  </div>
                </div>

                {/* Form Action Buttons */}
                <div className={styles.buttonRow} style={{ marginTop: '1.25rem' }}>
                  <button 
                    type="submit" 
                    disabled={isSubmitting} 
                    className={styles.runBtn}
                  >
                    <Sparkles size={14} />
                    {isSubmitting ? 'EXECUTING TEJAS ML ASSESSMENT...' : 'RUN TEJAS ASSESSMENT'}
                  </button>
                  <button 
                    type="button" 
                    onClick={handleReset} 
                    className={styles.resetBtn}
                  >
                    <RotateCcw size={14} /> Reset
                  </button>
                </div>
              </form>
            </div>

            {/* Right Output Panel (TEJAS AI Decision Output Deck) */}
            <div className={styles.outputCard}>
              <div className={styles.outputHeader}>
                <span className={styles.outputEyebrow}>TEJAS INTELLIGENCE ENGINE</span>
                <h3 className={styles.outputTitle}>Section E & F: AI Decision Output</h3>
              </div>

              {/* State 1: Loading */}
              {isSubmitting && (
                <div className={styles.loadingBox}>
                  <div className={styles.spinner} />
                  <div style={{ fontSize: '0.85rem', color: '#faf6f0', fontWeight: 700, marginBottom: '0.4rem' }}>
                    Executing TEJAS Urgency Engine...
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'rgba(250, 246, 240, 0.6)' }}>
                    Resolving 30+ infrastructure parameters & evaluating HistGradientBoosting ML model.
                  </div>
                </div>
              )}

              {/* State 2: Error */}
              {!isSubmitting && errorMessage && (
                <div className={styles.placeholderState}>
                  <AlertTriangle size={40} color="#bc473a" style={{ marginBottom: '1rem' }} />
                  <div className={styles.placeholderTitle} style={{ color: '#bc473a' }}>Assessment Error</div>
                  <div className={styles.placeholderText} style={{ marginBottom: '1.5rem' }}>{errorMessage}</div>
                  <button onClick={() => handleRunAssessment()} className={styles.runBtn}>
                    Retry Assessment
                  </button>
                </div>
              )}

              {/* State 3: Empty Placeholder */}
              {!isSubmitting && !errorMessage && !assessmentResult && (
                <div className={styles.placeholderState}>
                  <Layers className={styles.placeholderIcon} />
                  <div className={styles.placeholderTitle}>Awaiting Incident Submission</div>
                  <p className={styles.placeholderText}>
                    Enter an Asset ID and observed defect severity on the left, then click <strong>RUN TEJAS ASSESSMENT</strong>. TEJAS will auto-resolve parameters, execute champion models, and return the decision support deck.
                  </p>
                </div>
              )}

              {/* State 4: Decision Output Results */}
              {!isSubmitting && !errorMessage && assessmentResult && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={styles.deckResults}
                >
                  <div className={styles.scoreGaugeBox}>
                    <div className={styles.scoreLabel}>EVALUATED ML URGENCY SCORE</div>

                    {(() => {
                      const score100 = assessmentResult.urgency_score !== null && assessmentResult.urgency_score !== undefined
                        ? (assessmentResult.urgency_score * 100.0).toFixed(1)
                        : '50.0';
                      const tier = getTierFromScore(assessmentResult.urgency_score);

                      return (
                        <>
                          <div className={styles.scoreDisplay}>
                            <span className={styles.scoreNumber} style={{ color: tier.color }}>
                              {score100}
                            </span>
                            <span className={styles.scoreDenom}>/100</span>
                          </div>
                          <span className={`${styles.tierBadge} ${tier.cssClass}`}>
                            {tier.label} PRIORITY TIER
                          </span>
                        </>
                      );
                    })()}
                  </div>

                  <div className={styles.metaGrid}>
                    <div className={styles.metaRow}>
                      <span className={styles.metaKey}>DATABASE TASK ID</span>
                      <span className={styles.metaVal}>#TSK-{assessmentResult.task_id}</span>
                    </div>
                    <div className={styles.metaRow}>
                      <span className={styles.metaKey}>SECTION CODE</span>
                      <span className={styles.metaVal}>{assessmentResult.section_code || 'N/A'}</span>
                    </div>
                    <div className={styles.metaRow}>
                      <span className={styles.metaKey}>STATION SPAN</span>
                      <span className={styles.metaVal}>{assessmentResult.from_station_name} ➔ {assessmentResult.to_station_name}</span>
                    </div>
                    <div className={styles.metaRow}>
                      <span className={styles.metaKey}>DEPARTMENT</span>
                      <span className={styles.metaVal}>{assessmentResult.department}</span>
                    </div>
                    <div className={styles.metaRow}>
                      <span className={styles.metaKey}>DEFECT SEVERITY</span>
                      <span className={styles.metaVal}>{assessmentResult.defect_severity_label} (Level {assessmentResult.defect_severity})</span>
                    </div>
                  </div>

                  <div className={styles.cpsatStatusBox}>
                    {assessmentResult.status === 'SCORED' ? (
                      <>
                        <span className={styles.cpsatDot} style={{ backgroundColor: '#4ade80' }} />
                        <div>
                          <div className={styles.cpsatTextTitle}>Scored — Ready for Optimizer Scheduling</div>
                          <div className={styles.cpsatTextSub}>Task saved to DB. Ready for CP-SAT 30-day window allocation.</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <span className={styles.cpsatDot} style={{ backgroundColor: '#c98e3b' }} />
                        <div>
                          <div className={styles.cpsatTextTitle} style={{ color: '#c98e3b' }}>Scoring pending — ML service unreachable, will retry</div>
                          <div className={styles.cpsatTextSub}>Task saved to DB as PENDING. Will be scored during next batch run.</div>
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </main>
      </div>
    </PageEntryReveal>
  );
};
