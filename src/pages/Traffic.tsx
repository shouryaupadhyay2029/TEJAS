import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Train, 
  TrendingUp, 
  Clock, 
  Search, 
  ShieldCheck, 
  Zap, 
  MapPin,
  X,
  Radio
} from 'lucide-react';
import styles from './Traffic.module.css';
import { Navbar } from './Home/components/Navbar';
import GradientBackground from '../components/GradientBackground';
import { PageEntryReveal } from '../components/PageEntryReveal';
import apiClient from '../api/apiClient';

interface TrafficSummary {
  total_sections: number;
  total_trains: number;
  total_daily_movements: number;
  avg_trains_per_section: number;
  max_section_trains: number;
  peak_hours_window: string;
  best_offpeak_window: string;
}

interface HourlyDensity {
  hour: number;
  label: string;
  train_count: number;
  status: 'PEAK' | 'MODERATE' | 'OPTIMAL_BLOCK_WINDOW';
  density_pct: number;
}

interface SectionTraffic {
  section_id: number;
  section_code: string;
  from_station_code: string;
  from_station_name: string;
  to_station_code: string;
  to_station_name: string;
  daily_train_count: number;
  criticality_score: number;
}

interface TrainSearchResult {
  train_id: number;
  train_number: string;
  train_name: string;
  source_code: string;
  source_name: string;
  dest_code: string;
  dest_name: string;
  total_stops: number;
  stops: Array<{
    stop_sequence: number;
    station_code: string;
    station_name: string;
    arrival_time: string | null;
    departure_time: string | null;
    distance_km: number;
  }>;
}

const PRESET_TRAINS = [
  { num: '12301', name: 'Rajdhani Exp' },
  { num: '22436', name: 'Vande Bharat' },
  { num: '12451', name: 'Shram Shakti' },
  { num: '12801', name: 'Purushottam Exp' }
];

export const Traffic: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sectionSearch, setSectionSearch] = useState('');
  const [selectedSection, setSelectedSection] = useState<SectionTraffic | null>(null);

  // 1. Fetch Summary
  const { data: summary, isLoading: loadingSummary } = useQuery<TrafficSummary>({
    queryKey: ['trafficSummary'],
    queryFn: async () => {
      const res = await apiClient.get('/traffic/summary');
      return res.data;
    }
  });

  // 2. Fetch Hourly Density Curve
  const { data: density = [], isLoading: loadingDensity } = useQuery<HourlyDensity[]>({
    queryKey: ['hourlyDensity', selectedSection?.section_id],
    queryFn: async () => {
      const url = selectedSection?.section_id 
        ? `/traffic/hourly-density?section_id=${selectedSection.section_id}`
        : `/traffic/hourly-density`;
      const res = await apiClient.get(url);
      return res.data;
    }
  });

  // 3. Fetch All Sections Traffic
  const { data: sectionsTraffic = [], isLoading: loadingSections } = useQuery<SectionTraffic[]>({
    queryKey: ['allSectionsTraffic'],
    queryFn: async () => {
      const res = await apiClient.get('/sections/traffic/all');
      return res.data;
    }
  });

  // 4. Fetch Train Search Results
  const { data: trainResults = [] } = useQuery<TrainSearchResult[]>({
    queryKey: ['searchTrains', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const res = await apiClient.get(`/traffic/trains/search?query=${encodeURIComponent(searchQuery)}`);
      return res.data;
    },
    enabled: searchQuery.trim().length > 0
  });

  // Filter sections by search query
  const filteredSections = sectionsTraffic.filter(sec => {
    if (!sectionSearch.trim()) return true;
    const q = sectionSearch.toLowerCase();
    return (
      sec.section_code.toLowerCase().includes(q) ||
      sec.from_station_code.toLowerCase().includes(q) ||
      sec.from_station_name.toLowerCase().includes(q) ||
      sec.to_station_code.toLowerCase().includes(q) ||
      sec.to_station_name.toLowerCase().includes(q)
    );
  });

  return (
    <PageEntryReveal>
      <div style={{ position: 'relative', minHeight: '100vh' }}>
        <GradientBackground
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
        <Navbar />

        <div className={styles.container}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.titleGroup}>
              <span className={styles.headerEyebrow}>OPERATIONS CONSOLE</span>
              <h1 className={styles.title}>Traffic & Timetable Intelligence</h1>
              <p className={styles.subtitle}>
                Real-time Indian Railways train movement density, section congestion analytics, and off-peak track block window identification.
              </p>
            </div>
            <div className={styles.headerBadge}>
              <span className={styles.liveDot} />
              <span>TIMETABLE TELEMETRY ACTIVE</span>
            </div>
          </div>

          {/* KPI Highlights Grid */}
          <div className={styles.kpiGrid}>
            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <span className={styles.kpiLabel}>Monitored Network</span>
                <div className={`${styles.kpiIcon} ${styles.iconBlue}`}>
                  <MapPin size={20} />
                </div>
              </div>
              <div className={styles.kpiValue}>
                {loadingSummary ? '...' : summary ? `${summary.total_sections.toLocaleString()} Sections` : '--'}
              </div>
              <div className={styles.kpiSubtext}>
                {summary ? `${summary.total_trains.toLocaleString()} active trains in database` : 'Loading database...'}
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <span className={styles.kpiLabel}>Daily Movements</span>
                <div className={`${styles.kpiIcon} ${styles.iconPurple}`}>
                  <Train size={20} />
                </div>
              </div>
              <div className={styles.kpiValue}>
                {loadingSummary ? '...' : summary ? summary.total_daily_movements.toLocaleString() : '--'}
              </div>
              <div className={styles.kpiSubtext}>
                {summary ? `~${summary.avg_trains_per_section} trains/section average` : 'Calculating section traffic...'}
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <span className={styles.kpiLabel}>Peak Rush Hours</span>
                <div className={`${styles.kpiIcon} ${styles.iconAmber}`}>
                  <TrendingUp size={20} />
                </div>
              </div>
              <div className={styles.kpiValue}>
                {loadingSummary ? '...' : summary ? summary.peak_hours_window : '--'}
              </div>
              <div className={styles.kpiSubtext}>High passenger & freight throughput</div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <span className={styles.kpiLabel}>Best Block Window</span>
                <div className={`${styles.kpiIcon} ${styles.iconEmerald}`}>
                  <ShieldCheck size={20} />
                </div>
              </div>
              <div className={styles.kpiValue}>
                {loadingSummary ? '...' : summary ? summary.best_offpeak_window : '--'}
              </div>
              <div className={styles.kpiSubtext}>Optimal low-density maintenance slot</div>
            </div>
          </div>

          {/* 24-Hour Network Traffic Visualizer */}
          <div className={styles.visualizerCard}>
            <div className={styles.sectionHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <h2 className={styles.sectionTitle}>
                  <Clock size={22} color="#7c3aed" />
                  24-Hour Hourly Train Movement Density
                </h2>
                {selectedSection && (
                  <div className={styles.filterBanner}>
                    <Radio size={14} color="#10b981" />
                    <span>Corridor: {selectedSection.from_station_code} → {selectedSection.to_station_code} ({selectedSection.daily_train_count} trains/day)</span>
                    <button 
                      onClick={() => setSelectedSection(null)}
                      className={styles.resetBtn}
                      title="Reset to network average"
                    >
                      <X size={12} /> Reset Filter
                    </button>
                  </div>
                )}
              </div>

              <div className={styles.legend}>
                <div className={styles.legendItem}>
                  <div className={styles.dotPeak}></div>
                  <span>Peak Congestion (≥70%)</span>
                </div>
                <div className={styles.legendItem}>
                  <div className={styles.dotMod}></div>
                  <span>Moderate Traffic</span>
                </div>
                <div className={styles.legendItem}>
                  <div className={styles.dotOptimal}></div>
                  <span>Optimal Block Window</span>
                </div>
              </div>
            </div>

            <div className={styles.chartContainer}>
              {loadingDensity ? (
                <div style={{ width: '100%', textAlign: 'center', padding: '3rem 0', color: '#6b635b' }}>
                  Loading 24-Hour Traffic Density...
                </div>
              ) : (
                density.map((item) => (
                  <div key={item.hour} className={styles.barWrapper}>
                    <div className={styles.tooltip}>
                      {item.label} — {item.train_count} trains ({item.density_pct}%)
                    </div>
                    <div 
                      className={`
                        ${styles.bar} 
                        ${item.status === 'PEAK' ? styles.barPeak : item.status === 'MODERATE' ? styles.barMod : styles.barOptimal}
                      `}
                      style={{ height: `${Math.max(item.density_pct, 12)}%` }}
                    />
                    <span className={styles.hourLabel}>{item.label}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Two Column Grid: Section Congestion & Train Timetable Finder */}
          <div className={styles.twoColGrid}>
            {/* Section Congestion Heatmap Table */}
            <div className={styles.card}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>
                  <Zap size={20} color="#d97706" />
                  High-Density Railway Corridors
                </h2>
                <span style={{ fontSize: '0.8rem', color: '#6b635b', fontWeight: 700 }}>
                  {filteredSections.length.toLocaleString()} Sections
                </span>
              </div>

              <div className={styles.tableFilterBar}>
                <div style={{ position: 'relative', width: '100%' }}>
                  <Search size={16} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: '#8c8278' }} />
                  <input
                    type="text"
                    className={styles.tableSearchInput}
                    placeholder="Search corridor station code or name (e.g., NDLS, CNB, Kanpur)..."
                    value={sectionSearch}
                    onChange={(e) => setSectionSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.tableWrapper}>
                <table className={styles.trafficTable}>
                  <thead>
                    <tr>
                      <th>Section Code</th>
                      <th>Corridor Stations</th>
                      <th>Daily Trains</th>
                      <th>Criticality (% Density)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingSections ? (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', padding: '2.5rem', color: '#6b635b' }}>
                          Loading Section Density Data...
                        </td>
                      </tr>
                    ) : filteredSections.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: '#786f68' }}>
                          No sections match "{sectionSearch}".
                        </td>
                      </tr>
                    ) : (
                      filteredSections.slice(0, 12).map((sec) => {
                        const isSelected = selectedSection?.section_id === sec.section_id;
                        const critPct = Number(sec.criticality_score) * 100;
                        const barColor = critPct >= 70 ? '#ef4444' : critPct >= 40 ? '#f59e0b' : '#10b981';

                        return (
                          <tr 
                            key={sec.section_id}
                            onClick={() => setSelectedSection(sec)}
                            className={isSelected ? styles.activeRow : undefined}
                            style={{ cursor: 'pointer' }}
                          >
                            <td>
                              <strong style={{ color: '#1e1b19', fontFamily: 'monospace' }}>{sec.section_code}</strong>
                            </td>
                            <td>
                              <strong style={{ color: '#1e1b19' }}>{sec.from_station_code} → {sec.to_station_code}</strong>
                              <div style={{ fontSize: '0.75rem', color: '#786f68', marginTop: '2px' }}>
                                {sec.from_station_name} to {sec.to_station_name}
                              </div>
                            </td>
                            <td>
                              <strong>{sec.daily_train_count}</strong> trains/day
                            </td>
                            <td>
                              <span className={`
                                ${styles.badge} 
                                ${critPct >= 70 ? styles.badgeHigh : critPct >= 40 ? styles.badgeMed : styles.badgeLow}
                              `}>
                                {critPct.toFixed(1)}% Density
                              </span>
                              <div className={styles.densityTrack}>
                                <div 
                                  className={styles.densityFill} 
                                  style={{ width: `${Math.min(100, Math.max(8, critPct))}%`, background: barColor }} 
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Train Timetable & Route Inspector */}
            <div className={styles.card}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>
                  <Search size={20} color="#2563eb" />
                  Train Timetable Search
                </h2>
              </div>

              {/* Preset Quick Search Chips */}
              <div className={styles.presetChips}>
                {PRESET_TRAINS.map((p) => (
                  <button 
                    key={p.num} 
                    className={styles.presetChip}
                    onClick={() => setSearchQuery(p.num)}
                  >
                    #{p.num} {p.name}
                  </button>
                ))}
              </div>

              <div className={styles.searchBox}>
                <Search className={styles.searchIcon} size={18} />
                <input 
                  type="text"
                  className={styles.searchInput}
                  placeholder="Search train number or name (e.g. 12301, Rajdhani)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {searchQuery.trim().length === 0 ? (
                <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#786f68', fontSize: '0.875rem', background: 'rgba(250, 246, 238, 0.5)', borderRadius: '12px', border: '1px dashed rgba(210,195,175,0.6)' }}>
                  Type a train number (e.g. <strong>12301</strong>) or click a quick preset above to view full station schedules.
                </div>
              ) : trainResults.length === 0 ? (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#786f68', fontSize: '0.875rem' }}>
                  No trains found matching "{searchQuery}". Try searching "12301" or "Rajdhani".
                </div>
              ) : (
                <div>
                  {trainResults.slice(0, 3).map((tr) => (
                    <div key={tr.train_id} className={styles.trainCard}>
                      <div className={styles.trainHeader}>
                        <div className={styles.trainName}>{tr.train_name || 'Express Train'}</div>
                        <div className={styles.trainNumber}>#{tr.train_number}</div>
                      </div>
                      <div className={styles.trainRoute}>
                        {tr.source_code} ({tr.source_name}) → {tr.dest_code} ({tr.dest_name})
                      </div>

                      <div className={styles.stopTimeline}>
                        {tr.stops.slice(0, 5).map((s) => (
                          <div key={s.stop_sequence} className={styles.stopItem}>
                            <span className={styles.stopStation}>
                              {s.stop_sequence}. {s.station_code} ({s.station_name})
                            </span>
                            <span className={styles.stopTime}>
                              {s.arrival_time ? `Arr: ${s.arrival_time}` : 'Origin'} | {s.departure_time ? `Dep: ${s.departure_time}` : 'Terminus'}
                            </span>
                          </div>
                        ))}
                        {tr.stops.length > 5 && (
                          <div style={{ fontSize: '0.75rem', color: '#6b635b', fontStyle: 'italic', marginTop: '0.2rem' }}>
                            + {tr.stops.length - 5} intermediate station stops...
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageEntryReveal>
  );
};

export default Traffic;
