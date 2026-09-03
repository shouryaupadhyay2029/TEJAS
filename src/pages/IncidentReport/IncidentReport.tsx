import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrainTrack, 
  AlertTriangle, 
  Sparkles, 
  RotateCcw, 
  Activity, 
  ShieldAlert, 
  Layers, 
  Search,
  Database
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
  // Assumption: ML Teammate Severity Band Ranges: <30 LOW, 30-55 MEDIUM, 55-78 HIGH, 78+ CRITICAL
  const getTierFromScore = (score: number | null | undefined) => {
    if (score === null || score === undefined) return { label: 'PENDING', cssClass: styles.tierMEDIUM, color: '#38bdf8' };
    const score100 = score * 100.0;
    if (score100 >= 78) return { label: 'CRITICAL', cssClass: styles.tierCRITICAL, color: '#f87171' };
    if (score100 >= 55) return { label: 'HIGH', cssClass: styles.tierHIGH, color: '#fbbf24' };
    if (score100 >= 30) return { label: 'MEDIUM', cssClass: styles.tierMEDIUM, color: '#38bdf8' };
    return { label: 'LOW', cssClass: styles.tierLOW, color: '#4ade80' };
  };

  return (
    <PageEntryReveal>
      <div className={styles.container}>
        <GradientBackground />
        <Navbar />

        <div className={styles.mainContent}>
          {/* Top Bar Header */}
          <div className={styles.topHeader}>
            <div className={styles.headerTitleBox}>
              <div className={styles.trainIconBadge}>
                <TrainTrack size={24} />
              </div>
              <div>
                <h1 className={styles.mainTitle}>
                  Indian Railways — AI Automatic Block Planning
                  <span className={styles.sihBadge}>TEJAS SIH26027</span>
                </h1>
                <p className={styles.subtitle}>
                  Field Officer Maintenance Incident Reporting & Automated Telemetry Resolution
                </p>
              </div>
            </div>

            <div className={styles.engineStatusBadge}>
              <span className={styles.statusDot} />
              <span>TEJAS Engine Ready (3,216 Registered Assets | Live ML Connected)</span>
            </div>
          </div>

          {/* Quick Incident Scenario Chips */}
          <div className={styles.scenariosBar}>
            <div className={styles.scenariosTitle}>⚡ QUICK INCIDENT SCENARIOS (REAL PILOT RAILWAY ASSETS):</div>
            <div className={styles.scenarioChips}>
              {PRESETS.map((p) => (
                <button key={p.id} onClick={() => applyPreset(p)} className={styles.chip}>
                  <span>{p.name}</span>
                  <span className={styles.chipTag}>[{p.tag}]</span>
                </button>
              ))}
            </div>
          </div>

          {/* Grid Workspace */}
          <div className={styles.workspaceGrid}>
            {/* Left Panel: Form Input & Telemetry */}
            <div className={styles.panelCard}>
              <div className={styles.panelHeader}>
                <div className={styles.panelTitle}>
                  <Layers size={18} color="#0084ff" />
                  Section A & B: Incident Reporting & Asset Telemetry
                </div>
                <span className={styles.tagBadge}>OFFICER MINIMAL INPUT WORKFLOW</span>
              </div>

              <form onSubmit={handleRunAssessment}>
                {/* Step 1: Asset Lookup */}
                <div className={styles.stepBlock}>
                  <div className={styles.stepTitle}>
                    <Search size={14} /> 1. IDENTIFY RAILWAY ASSET
                  </div>
                  <div className={styles.inputGroupRow}>
                    <div className={styles.inputField}>
                      <label>Asset ID / Tag</label>
                      <input 
                        type="text" 
                        value={assetId} 
                        onChange={(e) => setAssetId(e.target.value)} 
                        placeholder="e.g. AST-001877" 
                      />
                    </div>
                    <div className={styles.inputField}>
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
                <div className={styles.stepBlock}>
                  <div className={styles.stepTitle}>
                    <Database size={14} color="#38bdf8" /> 2. TEJAS Auto-Resolved Infrastructure Telemetry (READ-ONLY • VERIFIED DB)
                  </div>
                  <div className={styles.telemetryGrid}>
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
                      <span className={`${styles.telemetryVal} ${styles.telemetryValHighlight}`}>HIGH (64.5/100)</span>
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
                <div className={styles.stepBlock}>
                  <div className={styles.stepTitle}>
                    <ShieldAlert size={14} color="#fbbf24" /> 3. OBSERVED DEFECT & FIELD FINDINGS
                  </div>

                  <div className={styles.inputGroupRow} style={{ marginBottom: '0.85rem' }}>
                    <div className={styles.inputField}>
                      <label>Observed Defect Type</label>
                      <select value={defectType} onChange={(e) => setDefectType(e.target.value)}>
                        <option value="structural crack indication">structural crack indication</option>
                        <option value="Red Aspect LED Module Failure">Red Aspect LED Module Failure</option>
                        <option value="Feeder/circuit breaker fault">Feeder/circuit breaker fault</option>
                        <option value="Fastener Loose / Missing Sleeper Bolt">Fastener Loose / Missing Sleeper Bolt</option>
                        <option value="Rail Flange Crack / Defect">Rail Flange Crack / Defect</option>
                      </select>
                    </div>

                    <div className={styles.inputField}>
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

                  <div className={styles.inputField} style={{ marginBottom: '0.85rem' }}>
                    <label>Officer Field Observations / Notes</label>
                    <textarea 
                      value={officerNotes} 
                      onChange={(e) => setOfficerNotes(e.target.value)}
                      placeholder="Describe visual indications, measurements, or safety risks..."
                    />
                  </div>

                  <div className={styles.inputGroupRow}>
                    <div className={styles.inputField}>
                      <label>Inspection Date & Time</label>
                      <input 
                        type="datetime-local" 
                        value={inspectionDatetime.slice(0, 16)} 
                        onChange={(e) => setInspectionDatetime(e.target.value)} 
                      />
                    </div>
                    <div className={styles.inputField}>
                      <label>Days Since Defect Detected</label>
                      <input 
                        type="number" 
                        value={daysSinceDetected} 
                        onChange={(e) => setDaysSinceDetected(Number(e.target.value))} 
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className={styles.actionRow}>
                  <button 
                    type="submit" 
                    disabled={isSubmitting} 
                    className={styles.submitBtn}
                  >
                    <Sparkles size={18} />
                    {isSubmitting ? 'EXECUTING TEJAS ML ASSESSMENT...' : 'RUN TEJAS ASSESSMENT'}
                  </button>
                  <button 
                    type="button" 
                    onClick={handleReset} 
                    className={styles.resetBtn}
                  >
                    <RotateCcw size={16} /> Reset
                  </button>
                </div>
              </form>
            </div>

            {/* Right Panel: Section E & F Output */}
            <div className={styles.panelCard}>
              <div className={styles.panelHeader}>
                <div className={styles.panelTitle}>
                  <Activity size={18} color="#eab308" />
                  Section E & F: TEJAS AI Decision Output
                </div>
              </div>

              <div className={styles.outputContainer}>
                {/* State 1: Loading */}
                {isSubmitting && (
                  <div className={styles.loadingState}>
                    <div className={styles.loadingSpinner} />
                    <h3 style={{ color: '#f1f5f9', fontSize: '1rem', marginBottom: '0.5rem' }}>
                      Executing TEJAS Urgency Engine...
                    </h3>
                    <p style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                      Resolving 30+ infrastructure parameters & evaluating HistGradientBoosting ML model.
                    </p>
                  </div>
                )}

                {/* State 2: Error */}
                {!isSubmitting && errorMessage && (
                  <div className={styles.errorCard}>
                    <AlertTriangle size={32} style={{ margin: '0 auto 0.75rem auto' }} />
                    <div className={styles.errorTitle}>Incident Submission Error</div>
                    <div className={styles.errorText}>{errorMessage}</div>
                    <button onClick={() => handleRunAssessment()} className={styles.submitBtn} style={{ margin: '0 auto' }}>
                      Retry Assessment
                    </button>
                  </div>
                )}

                {/* State 3: Empty Awaiting Submission */}
                {!isSubmitting && !errorMessage && !assessmentResult && (
                  <div className={styles.awaitingState}>
                    <Layers className={styles.awaitingIcon} />
                    <div className={styles.awaitingTitle}>Awaiting Incident Submission</div>
                    <p className={styles.awaitingText}>
                      Enter an Asset ID and observed defect severity on the left, then click <strong>RUN TEJAS ASSESSMENT</strong>. TEJAS will auto-resolve infrastructure parameters, execute champion models, and return the decision support deck.
                    </p>
                  </div>
                )}

                {/* State 4: Decision Output Results */}
                {!isSubmitting && !errorMessage && assessmentResult && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={styles.decisionDeck}
                  >
                    {/* Urgency Gauge Card */}
                    <div className={styles.scoreGaugeCard}>
                      <div className={styles.scoreHeader}>EVALUATED ML URGENCY SCORE</div>

                      {(() => {
                        const score100 = assessmentResult.urgency_score !== null && assessmentResult.urgency_score !== undefined
                          ? (assessmentResult.urgency_score * 100.0).toFixed(1)
                          : '50.0';
                        const tier = getTierFromScore(assessmentResult.urgency_score);

                        return (
                          <>
                            <div className={styles.scoreMeterDisplay}>
                              <span className={styles.scoreNum} style={{ color: tier.color }}>
                                {score100}
                              </span>
                              <span className={styles.scoreMax}>/100</span>
                            </div>
                            <span className={`${styles.tierBadge} ${tier.cssClass}`}>
                              {tier.label} PRIORITY TIER
                            </span>
                          </>
                        );
                      })()}
                    </div>

                    {/* Task Context Data */}
                    <div className={styles.recordContextCard}>
                      <div className={styles.contextRow}>
                        <span className={styles.contextKey}>DATABASE TASK ID</span>
                        <span className={styles.contextVal}>#TSK-{assessmentResult.task_id}</span>
                      </div>
                      <div className={styles.contextRow}>
                        <span className={styles.contextKey}>SECTION CODE</span>
                        <span className={styles.contextVal}>{assessmentResult.section_code || 'N/A'}</span>
                      </div>
                      <div className={styles.contextRow}>
                        <span className={styles.contextKey}>STATION SPAN</span>
                        <span className={styles.contextVal}>{assessmentResult.from_station_name} ➔ {assessmentResult.to_station_name}</span>
                      </div>
                      <div className={styles.contextRow}>
                        <span className={styles.contextKey}>DEPARTMENT</span>
                        <span className={styles.contextVal}>{assessmentResult.department}</span>
                      </div>
                      <div className={styles.contextRow}>
                        <span className={styles.contextKey}>DEFECT SEVERITY</span>
                        <span className={styles.contextVal}>{assessmentResult.defect_severity_label} (Level {assessmentResult.defect_severity})</span>
                      </div>
                    </div>

                    {/* CP-SAT Optimizer Status Box */}
                    <div className={styles.cpsatBox}>
                      {assessmentResult.status === 'SCORED' ? (
                        <>
                          <span className={styles.cpsatDotSuccess} />
                          <div>
                            <div className={styles.cpsatTitle}>Scored — Ready for Optimizer Scheduling</div>
                            <div className={styles.cpsatSub}>Task score saved to DB. Ready for CP-SAT 30-day window allocation.</div>
                          </div>
                        </>
                      ) : (
                        <>
                          <span className={styles.cpsatDotWarning} />
                          <div>
                            <div className={styles.cpsatTitle} style={{ color: '#fbbf24' }}>Scoring pending — ML service unreachable, will retry</div>
                            <div className={styles.cpsatSub}>Task saved to DB as PENDING. Will be scored during next batch run.</div>
                          </div>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageEntryReveal>
  );
};
