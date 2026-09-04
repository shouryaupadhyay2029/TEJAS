import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Activity, 
  Train, 
  TrendingUp, 
  Clock, 
  Search, 
  ShieldCheck, 
  Zap, 
  MapPin 
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

export const Traffic: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);

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
    queryKey: ['hourlyDensity', selectedSectionId],
    queryFn: async () => {
      const url = selectedSectionId 
        ? `/traffic/hourly-density?section_id=${selectedSectionId}`
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
            <h1 className={styles.title}>
              <Activity size={32} color="#2563eb" />
              Traffic & Timetable Intelligence
            </h1>
            <p className={styles.subtitle}>
              Real-time Indian Railways train movement density, section congestion analytics, and off-peak track block window identification.
            </p>
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
                {loadingSummary ? '...' : summary ? `${summary.total_sections} Sections` : '--'}
              </div>
              <div className={styles.kpiSubtext}>
                {summary ? `${summary.total_trains} active trains in database` : 'Loading database...'}
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
              <h2 className={styles.sectionTitle}>
                <Clock size={22} color="#7c3aed" />
                24-Hour Hourly Train Movement Density
                {selectedSectionId && (
                  <button 
                    onClick={() => setSelectedSectionId(null)}
                    style={{
                      marginLeft: '1rem',
                      fontSize: '0.75rem',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '8px',
                      background: '#1e1b19',
                      color: '#fff',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    Clear Section Filter
                  </button>
                )}
              </h2>
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
                <span style={{ fontSize: '0.8rem', color: '#6b635b', fontWeight: 600 }}>
                  {sectionsTraffic.length.toLocaleString()} Monitored Sections
                </span>
              </div>

              <div className={styles.tableWrapper}>
                <table className={styles.trafficTable}>
                  <thead>
                    <tr>
                      <th>Section Code</th>
                      <th>Corridor Stations</th>
                      <th>Daily Trains</th>
                      <th>Criticality (GMT)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingSections ? (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: '#6b635b' }}>
                          Loading Section Density Data...
                        </td>
                      </tr>
                    ) : (
                      sectionsTraffic.slice(0, 10).map((sec) => (
                        <tr 
                          key={sec.section_id}
                          onClick={() => setSelectedSectionId(sec.section_id)}
                          style={{
                            cursor: 'pointer',
                            background: selectedSectionId === sec.section_id ? 'rgba(37, 99, 235, 0.12)' : undefined
                          }}
                        >
                          <td>
                            <strong style={{ color: '#1e1b19' }}>{sec.section_code}</strong>
                          </td>
                          <td>
                            {sec.from_station_code} → {sec.to_station_code}
                            <div style={{ fontSize: '0.75rem', color: '#786f68' }}>
                              {sec.from_station_name} to {sec.to_station_name}
                            </div>
                          </td>
                          <td>
                            <strong>{sec.daily_train_count}</strong> trains
                          </td>
                          <td>
                            <span className={`
                              ${styles.badge} 
                              ${sec.criticality_score >= 0.7 ? styles.badgeHigh : sec.criticality_score >= 0.4 ? styles.badgeMed : styles.badgeLow}
                            `}>
                              {(Number(sec.criticality_score) * 100).toFixed(1)}% Density
                            </span>
                          </td>
                        </tr>
                      ))
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

              {trainResults.length === 0 ? (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#786f68', fontSize: '0.9rem' }}>
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
