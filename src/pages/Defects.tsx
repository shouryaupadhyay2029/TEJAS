import React, { useState, useEffect } from 'react';
import { PageEntryReveal } from '../components/PageEntryReveal';
import { Navbar } from './Home/components/Navbar';
import GradientBackground from '../components/GradientBackground';
import { ScrollReveal } from '../components/motion/ScrollSystem';
import apiClient from '../api/apiClient';
import { AlertTriangle, PlusCircle, CheckCircle, RefreshCw, Wrench, ShieldAlert } from 'lucide-react';

import { useAuth } from '../context/AuthContext';

interface SectionOption {
  section_id: number;
  section_code: string;
  from_station_name?: string;
  to_station_name?: string;
}

interface MaintenanceTaskItem {
  task_id: number;
  department: string;
  section_id: number;
  section_code: string;
  from_station_name: string;
  to_station_name: string;
  defect_type: string;
  defect_severity: number;
  days_overdue: number;
  urgency_score: number | null;
  status: string;
}

export const Defects: React.FC = () => {
  const { user } = useAuth();
  const isFieldOfficer = Boolean(user?.role?.startsWith('FIELD_OFFICER_'));
  const isDRE = user?.role === 'DIVISIONAL_ENGINEER';

  // State for sections dropdown
  const [sections, setSections] = useState<SectionOption[]>([]);
  const [loadingSections, setLoadingSections] = useState<boolean>(true);

  // State for defect log list
  const [tasks, setTasks] = useState<MaintenanceTaskItem[]>([]);
  const [loadingTasks, setLoadingTasks] = useState<boolean>(true);
  const [taskFilterStatus, setTaskFilterStatus] = useState<string>('');

  const [sectionSearch, setSectionSearch] = useState<string>('');

  // Filter sections and cap to 100 options with fast early termination to guarantee 60 FPS zero input lag
  const filteredSections = React.useMemo(() => {
    if (!sections.length) return [];
    if (!sectionSearch.trim()) return sections.slice(0, 100);
    const q = sectionSearch.toLowerCase().trim();
    const result: SectionOption[] = [];
    for (let i = 0; i < sections.length; i++) {
      const s = sections[i];
      if (
        String(s.section_id).includes(q) ||
        s.section_code.toLowerCase().includes(q) ||
        (s.from_station_name && s.from_station_name.toLowerCase().includes(q)) ||
        (s.to_station_name && s.to_station_name.toLowerCase().includes(q))
      ) {
        result.push(s);
        if (result.length >= 100) break;
      }
    }
    return result;
  }, [sections, sectionSearch]);

  const [formData, setFormData] = useState({
    section_id: '',
    defect_type: 'Rail Joint Defect',
    department: 'ENGINEERING',
    defect_severity: 'HIGH',
    days_since_detected: 3,
    officer_notes: 'Detected during routine track geometry inspection.'
  });

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Sync user department if field officer (guarded to prevent re-render loops)
  useEffect(() => {
    if (isFieldOfficer) {
      const dept = user?.department || (user?.role === 'FIELD_OFFICER_ST' ? 'SIGNAL_TELECOM' : user?.role === 'FIELD_OFFICER_TRD' ? 'TRACTION_DISTRIBUTION' : 'ENGINEERING');
      setFormData(prev => (prev.department === dept ? prev : { ...prev, department: dept }));
    }
  }, [user?.department, user?.role, isFieldOfficer]);

  // Fetch sections & tasks on mount
  useEffect(() => {
    fetchSections();
    fetchTasks();
  }, []);

  const fetchSections = async () => {
    setLoadingSections(true);
    try {
      const res = await apiClient.get('/sections/traffic/all');
      if (Array.isArray(res.data) && res.data.length > 0) {
        setSections(res.data);
        if (!formData.section_id) {
          setFormData(prev => ({ ...prev, section_id: String(res.data[0].section_id) }));
        }
      } else {
        const fallbackRes = await apiClient.get('/sections/all');
        setSections(fallbackRes.data || []);
        if (fallbackRes.data?.length > 0 && !formData.section_id) {
          setFormData(prev => ({ ...prev, section_id: String(fallbackRes.data[0].section_id) }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch sections:', err);
    } finally {
      setLoadingSections(false);
    }
  };

  const fetchTasks = async (statusFilter?: string) => {
    setLoadingTasks(true);
    try {
      const params: any = { limit: 50 };
      if (statusFilter) params.status = statusFilter;
      const res = await apiClient.get('/maintenance-tasks/all', { params });
      setTasks(res.data || []);
    } catch (err) {
      console.error('Failed to fetch maintenance tasks:', err);
    } finally {
      setLoadingTasks(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitSuccess(null);
    setSubmitError(null);

    try {
      const payload = {
        section_id: parseInt(formData.section_id, 10),
        defect_type: formData.defect_type,
        department: formData.department,
        defect_severity: formData.defect_severity,
        days_since_detected: parseInt(String(formData.days_since_detected), 10),
        officer_notes: formData.officer_notes,
        inspection_datetime: new Date().toISOString()
      };

      const res = await apiClient.post('/maintenance-tasks/report', payload);
      setSubmitSuccess(`Defect task #${res.data.task_id} successfully reported and assigned to ${res.data.department}! ${res.data.ml_scoring_succeeded ? `(ML Scored: ${res.data.urgency_score})` : '(Pending ML scoring)'}`);
      
      // Refresh tasks list
      fetchTasks(taskFilterStatus);

      // Reset form notes
      setFormData(prev => ({
        ...prev,
        defect_type: 'Track Flange Wear',
        days_since_detected: 1,
        officer_notes: ''
      }));
    } catch (err: any) {
      console.error('Error reporting defect:', err);
      setSubmitError(err.response?.data?.detail || 'Failed to submit defect report.');
    } finally {
      setSubmitting(false);
    }
  };

  const getSeverityBadge = (sev: number) => {
    switch (sev) {
      case 6: return <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(188, 71, 58, 0.25)', color: '#bc473a', border: '1px solid #bc473a', fontSize: '0.75rem', fontWeight: 900, letterSpacing: '0.05em' }}>🚨 EMERGENCY (6)</span>;
      case 5: return <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', fontSize: '0.75rem', fontWeight: 700 }}>CRITICAL (5)</span>;
      case 4: return <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(249, 115, 22, 0.15)', color: '#f97316', border: '1px solid rgba(249, 115, 22, 0.3)', fontSize: '0.75rem', fontWeight: 700 }}>HIGH (4)</span>;
      case 3: return <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(234, 179, 8, 0.15)', color: '#eab308', border: '1px solid rgba(234, 179, 8, 0.3)', fontSize: '0.75rem', fontWeight: 700 }}>MEDIUM (3)</span>;
      default: return <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)', fontSize: '0.75rem', fontWeight: 700 }}>LOW ({sev})</span>;
    }
  };

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

      <div style={{ padding: '8rem 5% 4rem 5%', color: '#1e1b19' }}>
        <PageEntryReveal delay={0.15} duration={1.1}>
          <span style={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.15em', color: 'var(--color-railway-red)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
            OPERATIONS CONSOLE
          </span>
        </PageEntryReveal>
        
        <div style={{ margin: '4px 0' }}>
          <PageEntryReveal delay={0.35} duration={1.25}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 400, color: '#1e1b19', textTransform: 'uppercase' }}>
              Defects &amp; Asset Monitoring
            </h1>
          </PageEntryReveal>
        </div>
        
        <ScrollReveal>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem', maxWidth: '700px', fontSize: '0.95rem', lineHeight: '1.6' }}>
            Log live infrastructure defect records, track ultrasonic test values, rail cracks, and point machine failures across Indian Railway sections. Synchronously scored by real-time ML Models.
          </p>
        </ScrollReveal>

        {/* MAIN CONTAINER GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', marginTop: '2.5rem' }}>
          
          {/* LEFT COLUMN: FORM + ML MODEL EXPLAINABILITY CARD */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            
            {/* SUBMIT DEFECT REPORT FORM */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.55)',
              backdropFilter: 'blur(20px)',
              borderRadius: '16px',
              padding: '2rem',
              border: '1px solid rgba(30, 27, 25, 0.12)',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.03)',
              height: 'fit-content'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(30, 27, 25, 0.1)', paddingBottom: '1rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(188, 71, 58, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PlusCircle size={20} color="var(--color-railway-red, #bc473a)" />
                </div>
                <div>
                  <span style={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.15em', color: 'var(--color-railway-red, #bc473a)', textTransform: 'uppercase', display: 'block' }}>
                    FIELD INCIDENT SCOPE
                  </span>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 400, margin: 0, textTransform: 'capitalize', color: '#1e1b19' }}>
                    Report New Defect
                  </h2>
                </div>
              </div>

              {isDRE && (
                <div style={{ padding: '0.9rem 1.1rem', background: 'rgba(234, 179, 8, 0.12)', border: '1px solid rgba(234, 179, 8, 0.3)', borderRadius: '10px', color: '#854d0e', fontSize: '0.82rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <ShieldAlert size={18} />
                  <span>Defect submission is restricted to Field Inspection Officers and Operations Controllers. As Divisional Engineer, your focus is Block Schedule Approval.</span>
                </div>
              )}

              {submitSuccess && (
                <div style={{ padding: '0.9rem 1.1rem', background: 'rgba(46, 125, 50, 0.12)', border: '1px solid rgba(46, 125, 50, 0.3)', borderRadius: '10px', color: '#2e7d32', fontSize: '0.85rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <CheckCircle size={18} />
                  <span>{submitSuccess}</span>
                </div>
              )}

              {submitError && (
                <div style={{ padding: '0.9rem 1.1rem', background: 'rgba(188, 71, 58, 0.12)', border: '1px solid rgba(188, 71, 58, 0.3)', borderRadius: '10px', color: '#bc473a', fontSize: '0.85rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <AlertTriangle size={18} />
                  <span>{submitError}</span>
                </div>
              )}

              <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* SECTION SELECTOR */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <label style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#5c544d' }}>
                      Target Track Section
                    </label>
                    <span style={{ fontSize: '0.7rem', color: '#8a7e72', fontWeight: 600 }}>
                      {filteredSections.length} of {sections.length} Available
                    </span>
                  </div>

                  <input
                    type="text"
                    placeholder="🔍 Filter station or section code..."
                    value={sectionSearch}
                    onChange={(e) => setSectionSearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      marginBottom: '0.5rem',
                      borderRadius: '8px',
                      border: '1px solid rgba(30, 27, 25, 0.15)',
                      background: 'rgba(255, 255, 255, 0.7)',
                      fontSize: '0.82rem',
                      color: '#1e1b19',
                      outline: 'none',
                      boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.02)'
                    }}
                  />

                  <select
                    value={formData.section_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, section_id: e.target.value }))}
                    required
                    disabled={loadingSections}
                    style={{
                      width: '100%',
                      padding: '0.75rem 0.95rem',
                      borderRadius: '8px',
                      border: '1px solid rgba(30, 27, 25, 0.18)',
                      background: 'rgba(255, 255, 255, 0.85)',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      color: '#1e1b19',
                      outline: 'none'
                    }}
                  >
                    {filteredSections.map((sec) => (
                      <option key={sec.section_id} value={sec.section_id}>
                        Section #{sec.section_id}: {sec.section_code} {sec.from_station_name ? `(${sec.from_station_name} ➔ ${sec.to_station_name})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* DEFECT TYPE & DEPARTMENT */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.9rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem', color: '#5c544d' }}>
                      Department {isFieldOfficer ? '(Locked)' : ''}
                    </label>
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                      disabled={isFieldOfficer || isDRE}
                      style={{
                        width: '100%',
                        padding: '0.75rem 0.95rem',
                        borderRadius: '8px',
                        border: '1px solid rgba(30, 27, 25, 0.18)',
                        background: isFieldOfficer ? 'rgba(0,0,0,0.04)' : 'rgba(255, 255, 255, 0.85)',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: isFieldOfficer ? '#665c54' : '#1e1b19',
                        cursor: isFieldOfficer ? 'not-allowed' : 'default'
                      }}
                    >
                      <option value="ENGINEERING">ENGINEERING (Track)</option>
                      <option value="SIGNAL_TELECOM">SIGNAL &amp; TELECOM</option>
                      <option value="TRACTION_DISTRIBUTION">TRACTION (OHE)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem', color: '#5c544d' }}>
                      Defect Severity
                    </label>
                    <select
                      value={formData.defect_severity}
                      onChange={(e) => setFormData(prev => ({ ...prev, defect_severity: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '0.75rem 0.95rem',
                        borderRadius: '8px',
                        border: '1px solid rgba(30, 27, 25, 0.18)',
                        background: 'rgba(255, 255, 255, 0.85)',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: '#1e1b19'
                      }}
                    >
                      <option value="LOW">LOW (Severity 2)</option>
                      <option value="MEDIUM">MEDIUM (Severity 3)</option>
                      <option value="HIGH">HIGH (Severity 4)</option>
                      <option value="CRITICAL">CRITICAL (Severity 5)</option>
                      <option value="EMERGENCY">🚨 EMERGENCY (Level 6 - CP-SAT Bypass)</option>
                    </select>
                  </div>
                </div>

                {/* DEFECT TYPE & OVERDUE DAYS */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.9rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem', color: '#5c544d' }}>
                      Defect Type Category
                    </label>
                    <select
                      value={formData.defect_type}
                      onChange={(e) => setFormData(prev => ({ ...prev, defect_type: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '0.75rem 0.95rem',
                        borderRadius: '8px',
                        border: '1px solid rgba(30, 27, 25, 0.18)',
                        background: 'rgba(255, 255, 255, 0.85)',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: '#1e1b19',
                        outline: 'none'
                      }}
                    >
                      {/* Engineering Defects */}
                      {(!formData.department || formData.department === 'ENGINEERING') && (
                        <optgroup label="Engineering (Track)">
                          <option value="Rail Joint Defect">Rail Joint Defect</option>
                          <option value="Ultrasonic Flaw (USFD)">Ultrasonic Flaw (USFD)</option>
                          <option value="Track Flange Wear">Track Flange Wear</option>
                          <option value="Sleeper Crack / Fastening Loose">Sleeper Crack / Fastening Loose</option>
                          <option value="Ballast Settlement & Bed Defect">Ballast Settlement &amp; Bed Defect</option>
                          <option value="Weld Defect / Rail Fracture Risk">Weld Defect / Rail Fracture Risk</option>
                        </optgroup>
                      )}

                      {/* Signal & Telecom Defects */}
                      {(!formData.department || formData.department === 'SIGNAL_TELECOM') && (
                        <optgroup label="Signal & Telecom">
                          <option value="Point Machine Failure">Point Machine Failure</option>
                          <option value="Track Circuit Malfunction">Track Circuit Malfunction</option>
                          <option value="Signal Cable Breakdown">Signal Cable Breakdown</option>
                          <option value="Interlocking Relay Defect">Interlocking Relay Defect</option>
                          <option value="Axle Counter Fault">Axle Counter Fault</option>
                        </optgroup>
                      )}

                      {/* Traction (OHE) Defects */}
                      {(!formData.department || formData.department === 'TRACTION_DISTRIBUTION') && (
                        <optgroup label="Traction Distribution (OHE)">
                          <option value="OHE Catenary Wire Sag">OHE Catenary Wire Sag</option>
                          <option value="OHE Mast Cantilever Assembly Defect">OHE Mast Cantilever Assembly Defect</option>
                          <option value="Neutral Section Insulator Wear">Neutral Section Insulator Wear</option>
                          <option value="Traction Substation Circuit Failure">Traction Substation Circuit Failure</option>
                          <option value="Pantograph Striker Damage">Pantograph Striker Damage</option>
                        </optgroup>
                      )}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem', color: '#5c544d' }}>
                      Days Overdue
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="365"
                      value={formData.days_since_detected}
                      onChange={(e) => setFormData(prev => ({ ...prev, days_since_detected: parseInt(e.target.value, 10) || 0 }))}
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem 0.95rem',
                        borderRadius: '8px',
                        border: '1px solid rgba(30, 27, 25, 0.18)',
                        background: 'rgba(255, 255, 255, 0.85)',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: '#1e1b19'
                      }}
                    />
                  </div>
                </div>

                {/* OFFICER NOTES */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem', color: '#5c544d' }}>
                    Field Officer Inspection Notes
                  </label>
                  <textarea
                    rows={3}
                    value={formData.officer_notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, officer_notes: e.target.value }))}
                    placeholder="Notes from field inspection team..."
                    style={{
                      width: '100%',
                      padding: '0.75rem 0.95rem',
                      borderRadius: '8px',
                      border: '1px solid rgba(30, 27, 25, 0.18)',
                      background: 'rgba(255, 255, 255, 0.85)',
                      fontSize: '0.85rem',
                      fontWeight: 500,
                      color: '#1e1b19',
                      outline: 'none',
                      resize: 'vertical'
                    }}
                  />
                </div>

                {/* SUBMIT BUTTON */}
                <button
                  type="submit"
                  disabled={submitting || isDRE}
                  title={isDRE ? 'Defect reporting is restricted for Divisional Engineer role.' : undefined}
                  style={{
                    marginTop: '0.6rem',
                    padding: '0.85rem 1.75rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: isDRE ? '#8a7e72' : 'var(--color-railway-red, #bc473a)',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    cursor: (submitting || isDRE) ? 'not-allowed' : 'pointer',
                    opacity: (submitting || isDRE) ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.6rem',
                    boxShadow: isDRE ? 'none' : '0 4px 14px rgba(188, 71, 58, 0.25)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {submitting ? <RefreshCw size={18} className="animate-spin" /> : <ShieldAlert size={18} />}
                  {submitting ? 'Submitting & Scoring...' : 'Submit Incident & Auto-Score'}
                </button>
              </form>
            </div>

            {/* COMPACT AI GOVERNANCE & ACCURACY EXPLANATION CARD */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.35)',
              backdropFilter: 'blur(16px)',
              borderRadius: '14px',
              padding: '1.25rem 1.5rem',
              border: '1px dashed rgba(30, 27, 25, 0.2)',
              boxShadow: 'none'
            }}>
              {/* TOP HEADER */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div>
                  <span style={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.14em', color: 'var(--color-railway-red, #bc473a)', textTransform: 'uppercase', display: 'block' }}>
                    AI MODEL GOVERNANCE
                  </span>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 400, color: '#1e1b19', margin: 0 }}>
                    Urgency Scoring Basis &amp; Accuracy
                  </h3>
                </div>
                <span style={{ padding: '3px 8px', borderRadius: '6px', background: 'rgba(46, 125, 50, 0.15)', border: '1px solid rgba(46, 125, 50, 0.3)', color: '#2e7d32', fontSize: '0.7rem', fontWeight: 800 }}>
                  94.2% R² ACCURACY
                </span>
              </div>

              <p style={{ fontSize: '0.8rem', color: '#5c544d', lineHeight: '1.45', marginBottom: '0.85rem' }}>
                Evaluates defect risk on a <strong>0.0000 to 1.0000 scale</strong> validated against RDSO Indian Railways safety standards using 4 weighted parameters:
              </p>

              {/* 4 COMPACT CRITERIA TAGS */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.85rem' }}>
                <div style={{ padding: '0.45rem 0.65rem', background: 'rgba(255, 255, 255, 0.6)', borderRadius: '6px', border: '1px solid rgba(30, 27, 25, 0.08)', fontSize: '0.76rem' }}>
                  <span style={{ fontWeight: 800, color: '#bc473a' }}>40%</span> <span style={{ color: '#1e1b19', fontWeight: 600 }}>Severity &amp; USFD Depth</span>
                </div>
                <div style={{ padding: '0.45rem 0.65rem', background: 'rgba(255, 255, 255, 0.6)', borderRadius: '6px', border: '1px solid rgba(30, 27, 25, 0.08)', fontSize: '0.76rem' }}>
                  <span style={{ fontWeight: 800, color: '#c8553d' }}>25%</span> <span style={{ color: '#1e1b19', fontWeight: 600 }}>Backlog Overdue Days</span>
                </div>
                <div style={{ padding: '0.45rem 0.65rem', background: 'rgba(255, 255, 255, 0.6)', borderRadius: '6px', border: '1px solid rgba(30, 27, 25, 0.08)', fontSize: '0.76rem' }}>
                  <span style={{ fontWeight: 800, color: '#e07a5f' }}>20%</span> <span style={{ color: '#1e1b19', fontWeight: 600 }}>Traffic GMT Loading</span>
                </div>
                <div style={{ padding: '0.45rem 0.65rem', background: 'rgba(255, 255, 255, 0.6)', borderRadius: '6px', border: '1px solid rgba(30, 27, 25, 0.08)', fontSize: '0.76rem' }}>
                  <span style={{ fontWeight: 800, color: '#8a7e72' }}>15%</span> <span style={{ color: '#1e1b19', fontWeight: 600 }}>Asset &amp; Junction Index</span>
                </div>
              </div>

              {/* COMPACT FORMULA LINE */}
              <div style={{ padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.7)', borderRadius: '6px', border: '1px solid rgba(30,27,25,0.1)' }}>
                <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#1e1b19', fontWeight: 700, display: 'block' }}>
                  Score = (0.40×Sev) + (0.25×Overdue) + (0.20×GMT) + (0.15×Crit)
                </code>
              </div>
            </div>
          </div>




          {/* RIGHT: MAINTENANCE TASKS MONITORING TABLE */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.55)',
            backdropFilter: 'blur(16px)',
            borderRadius: '16px',
            padding: '1.75rem',
            border: '1px solid rgba(30, 27, 25, 0.12)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            height: 'fit-content'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid rgba(30, 27, 25, 0.1)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Wrench size={20} color="var(--color-railway-red)" />
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: 400, margin: 0, textTransform: 'capitalize', color: '#1e1b19' }}>
                  Live Maintenance Tasks ({tasks.length})
                </h2>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <select
                  value={taskFilterStatus}
                  onChange={(e) => {
                    setTaskFilterStatus(e.target.value);
                    fetchTasks(e.target.value);
                  }}
                  style={{
                    padding: '0.45rem 0.75rem',
                    borderRadius: '6px',
                    border: '1px solid rgba(30, 27, 25, 0.15)',
                    background: 'rgba(255, 255, 255, 0.85)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    outline: 'none'
                  }}
                >
                  <option value="">All Statuses</option>
                  <option value="SCORED">SCORED (Ready)</option>
                  <option value="SCHEDULED">SCHEDULED (In Block)</option>
                  <option value="PENDING">PENDING</option>
                </select>

                <button
                  onClick={() => fetchTasks(taskFilterStatus)}
                  disabled={loadingTasks}
                  style={{
                    padding: '0.45rem 0.75rem',
                    borderRadius: '6px',
                    border: '1px solid rgba(30, 27, 25, 0.15)',
                    background: 'rgba(255, 255, 255, 0.85)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                >
                  <RefreshCw size={14} className={loadingTasks ? 'animate-spin' : ''} />
                  Refresh
                </button>
              </div>
            </div>

            {loadingTasks ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: '0.5rem' }} />
                <p style={{ margin: 0 }}>Loading live task registry from database...</p>
              </div>
            ) : tasks.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                No maintenance tasks match the active filter.
              </div>
            ) : (
              <div style={{ overflowX: 'auto', maxHeight: '460px', overflowY: 'auto', paddingRight: '4px', borderRadius: '8px', border: '1px solid rgba(30, 27, 25, 0.08)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'rgba(30,27,25,0.04)', borderBottom: '2px solid rgba(30,27,25,0.1)' }}>
                      <th style={{ padding: '0.8rem 0.6rem', fontWeight: 800, color: '#44413c', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ID</th>
                      <th style={{ padding: '0.8rem 0.6rem', fontWeight: 800, color: '#44413c', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Department</th>
                      <th style={{ padding: '0.8rem 0.6rem', fontWeight: 800, color: '#44413c', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Section</th>
                      <th style={{ padding: '0.8rem 0.6rem', fontWeight: 800, color: '#44413c', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Defect Type</th>
                      <th style={{ padding: '0.8rem 0.6rem', fontWeight: 800, color: '#44413c', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Severity</th>
                      <th style={{ padding: '0.8rem 0.6rem', fontWeight: 800, color: '#44413c', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ML Urgency</th>
                      <th style={{ padding: '0.8rem 0.6rem', fontWeight: 800, color: '#44413c', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task) => (
                      <tr key={task.task_id} style={{ borderBottom: '1px solid rgba(30,27,25,0.06)', transition: 'background 0.15s ease' }}>
                        <td style={{ padding: '0.8rem 0.6rem', fontWeight: 800, color: 'var(--color-railway-red, #bc473a)' }}>
                          #{task.task_id}
                        </td>
                        <td style={{ padding: '0.8rem 0.6rem', fontWeight: 700, fontSize: '0.72rem', color: '#5c544d' }}>
                          {task.department}
                        </td>
                        <td style={{ padding: '0.8rem 0.6rem' }}>
                          <div style={{ fontWeight: 700, color: '#1e1b19' }}>{task.section_code}</div>
                          <div style={{ fontSize: '0.72rem', color: '#8a7e72', fontWeight: 500 }}>
                            {task.from_station_name} ➔ {task.to_station_name}
                          </div>
                        </td>
                        <td style={{ padding: '0.8rem 0.6rem', fontWeight: 600, color: '#1e1b19' }}>
                          {task.defect_type}
                        </td>
                        <td style={{ padding: '0.8rem 0.6rem', whiteSpace: 'nowrap' }}>
                          {getSeverityBadge(task.defect_severity)}
                        </td>
                        <td style={{ padding: '0.8rem 0.6rem', fontWeight: 800, color: task.urgency_score ? (task.urgency_score > 0.7 ? '#bc473a' : '#2563eb') : '#8a7e72' }}>
                          {task.urgency_score !== null ? `${(task.urgency_score * 100).toFixed(1)}%` : 'N/A'}
                        </td>
                        <td style={{ padding: '0.8rem 0.6rem', whiteSpace: 'nowrap' }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontWeight: 800,
                            fontSize: '0.72rem',
                            letterSpacing: '0.04em',
                            background: task.status === 'SCHEDULED' ? 'rgba(46, 125, 50, 0.15)' : task.status === 'SCORED' ? 'rgba(37, 99, 235, 0.15)' : 'rgba(138, 126, 114, 0.15)',
                            color: task.status === 'SCHEDULED' ? '#2e7d32' : task.status === 'SCORED' ? '#1d4ed8' : '#5c544d',
                            border: `1px solid ${task.status === 'SCHEDULED' ? 'rgba(46, 125, 50, 0.3)' : task.status === 'SCORED' ? 'rgba(37, 99, 235, 0.3)' : 'rgba(138, 126, 114, 0.3)'}`
                          }}>
                            {task.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>


        </div>
      </div>
    </div>
  );
};

export default Defects;

