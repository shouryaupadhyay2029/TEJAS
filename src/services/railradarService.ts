/**
 * TEJAS RailRadar API Integration Service
 * API Key Quota Guard: Max 1,000 requests/month constraint
 * Implements persistent localStorage caching, quota tracking, and fallback synthesis.
 */

export interface TrainSourceDest {
  code: string;
  name: string;
  lat?: number;
  lng?: number;
}

export interface RailRadarTrainDetail {
  number: string;
  name: string;
  type: string;
  category?: string;
  source: TrainSourceDest;
  destination: TrainSourceDest;
  runDays?: string[];
  distance?: number;
  duration?: number;
  avgSpeed?: number;
  maxSpeed?: number;
  totalHalts?: number;
  coachPosition?: string;
  classes?: string[];
  halts?: Array<{
    sn: number;
    stationCode: string;
    stationName: string;
    arrivalTime: string;
    departureTime: string;
    distance: number;
    platform?: string;
  }>;
  cachedFrom?: 'LIVE_API' | 'CACHE' | 'FALLBACK';
}

export interface QuotaInfo {
  usedThisMonth: number;
  monthlyLimit: number;
  remaining: number;
  isCapped: boolean;
}

const API_KEY = 'rg_34e7ce766d9a4802bac0ce7faefd840f';
const BASE_URL = 'https://api.railradar.in/v1';
const MONTHLY_LIMIT = 1000;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 Hours cache duration

// Seed Fallback Data for Common Key Indian Railway Trains
const FALLBACK_TRAINS: Record<string, RailRadarTrainDetail> = {
  '12919': {
    number: '12919',
    name: 'Malwa SF Express',
    type: 'SUPERFAST',
    source: { code: 'DADN', name: 'Dr. Ambedkar Nagar' },
    destination: { code: 'SVDK', name: 'Shri Mata Vaishno Devi Katra' },
    avgSpeed: 56.9,
    maxSpeed: 144.9,
    distance: 1630.3,
    totalHalts: 50,
    coachPosition: 'ENG-SLRD-GEN-S6-S5-S4-S3-S2-S1-PC-M2-M1-B4-B3-B2-B1-A2-A1-H1-GEN-LPR',
    classes: ['1A', '2A', '3A', '3E', 'SL'],
    halts: [
      { sn: 1, stationCode: 'DADN', stationName: 'Dr Ambedkar Nagar', arrivalTime: '12:15', departureTime: '12:15', distance: 0, platform: '1' },
      { sn: 2, stationCode: 'INDB', stationName: 'Indore Junction', arrivalTime: '12:35', departureTime: '12:45', distance: 21, platform: '4' },
      { sn: 3, stationCode: 'UJN', stationName: 'Ujjain Junction', arrivalTime: '13:50', departureTime: '14:05', distance: 83, platform: '1' },
      { sn: 4, stationCode: 'BPL', stationName: 'Bhopal Junction', arrivalTime: '17:25', departureTime: '17:35', distance: 266, platform: '2' },
      { sn: 5, stationCode: 'VGLJ', stationName: 'VGL Jhansi Junction', arrivalTime: '21:30', departureTime: '21:38', distance: 558, platform: '4' },
      { sn: 6, stationCode: 'GWL', stationName: 'Gwalior Junction', arrivalTime: '22:50', departureTime: '22:52', distance: 655, platform: '2' },
      { sn: 7, stationCode: 'AGC', stationName: 'Agra Cantt', arrivalTime: '00:45', departureTime: '00:50', distance: 774, platform: '3' },
      { sn: 8, stationCode: 'NDLS', stationName: 'New Delhi', arrivalTime: '04:15', departureTime: '04:30', distance: 968, platform: '7' },
      { sn: 9, stationCode: 'LDH', stationName: 'Ludhiana Junction', arrivalTime: '08:40', departureTime: '08:50', distance: 1281, platform: '2' },
      { sn: 10, stationCode: 'JAT', stationName: 'Jammu Tawi', arrivalTime: '14:10', departureTime: '14:20', distance: 1543, platform: '1' },
      { sn: 11, stationCode: 'SVDK', stationName: 'SMVD Katra', arrivalTime: '16:30', departureTime: '16:30', distance: 1630, platform: '3' }
    ]
  },
  '22436': {
    number: '22436',
    name: 'Vande Bharat Express',
    type: 'VANDE BHARAT',
    source: { code: 'NDLS', name: 'New Delhi' },
    destination: { code: 'BSB', name: 'Varanasi Junction' },
    avgSpeed: 96.5,
    maxSpeed: 130.0,
    distance: 759.0,
    totalHalts: 4,
    coachPosition: 'ENG-C1-C2-C3-C4-C5-C6-C7-EC1-EC2-C8-C9-C10-C11-C12-ENG',
    classes: ['CC', 'EC'],
    halts: [
      { sn: 1, stationCode: 'NDLS', stationName: 'New Delhi', arrivalTime: '06:00', departureTime: '06:00', distance: 0, platform: '16' },
      { sn: 2, stationCode: 'CNB', stationName: 'Kanpur Central', arrivalTime: '10:08', departureTime: '10:10', distance: 440, platform: '9' },
      { sn: 3, stationCode: 'PRYJ', stationName: 'Prayagraj Junction', arrivalTime: '12:08', departureTime: '12:10', distance: 634, platform: '6' },
      { sn: 4, stationCode: 'BSB', stationName: 'Varanasi Junction', arrivalTime: '14:00', departureTime: '14:00', distance: 759, platform: '1' }
    ]
  },
  '12236': {
    number: '12236',
    name: 'Rajdhani Express',
    type: 'RAJDHANI',
    source: { code: 'NDLS', name: 'New Delhi' },
    destination: { code: 'HWH', name: 'Howrah Junction' },
    avgSpeed: 88.2,
    maxSpeed: 130.0,
    distance: 1447.0,
    totalHalts: 8,
    coachPosition: 'ENG-H1-A1-A2-A3-B1-B2-B3-B4-B5-B6-PC-B7-B8-B9-B10-EOG',
    classes: ['1A', '2A', '3A'],
    halts: [
      { sn: 1, stationCode: 'NDLS', stationName: 'New Delhi', arrivalTime: '16:55', departureTime: '16:55', distance: 0, platform: '9' },
      { sn: 2, stationCode: 'CNB', stationName: 'Kanpur Central', arrivalTime: '21:35', departureTime: '21:40', distance: 440, platform: '5' },
      { sn: 3, stationCode: 'PRYJ', stationName: 'Prayagraj Junction', arrivalTime: '23:45', departureTime: '23:47', distance: 634, platform: '4' },
      { sn: 4, stationCode: 'DDU', stationName: 'Pt Deen Dayal Upadhyaya', arrivalTime: '01:40', departureTime: '01:50', distance: 787, platform: '2' },
      { sn: 5, stationCode: 'GAYA', stationName: 'Gaya Junction', arrivalTime: '03:55', departureTime: '03:58', distance: 992, platform: '1' },
      { sn: 6, stationCode: 'DHN', stationName: 'Dhanbad Junction', arrivalTime: '06:30', departureTime: '06:35', distance: 1193, platform: '1' },
      { sn: 7, stationCode: 'ASN', stationName: 'Asansol Junction', arrivalTime: '07:35', departureTime: '07:40', distance: 1251, platform: '5' },
      { sn: 8, stationCode: 'HWH', stationName: 'Howrah Junction', arrivalTime: '09:55', departureTime: '09:55', distance: 1447, platform: '9' }
    ]
  },
  '12419': {
    number: '12419',
    name: 'Gomti Express',
    type: 'SUPERFAST',
    source: { code: 'LKO', name: 'Lucknow Charbagh' },
    destination: { code: 'NDLS', name: 'New Delhi' },
    avgSpeed: 58.4,
    maxSpeed: 110.0,
    distance: 512.0,
    totalHalts: 16,
    coachPosition: 'ENG-SLRD-GEN-D1-D2-D3-D4-D5-C1-C2-D6-D7-D8-GEN-SLRD',
    classes: ['CC', '2S'],
    halts: [
      { sn: 1, stationCode: 'LKO', stationName: 'Lucknow Charbagh', arrivalTime: '05:45', departureTime: '05:45', distance: 0, platform: '1' },
      { sn: 2, stationCode: 'ON', stationName: 'Unnao Junction', arrivalTime: '06:38', departureTime: '06:40', distance: 54, platform: '2' },
      { sn: 3, stationCode: 'CNB', stationName: 'Kanpur Central', arrivalTime: '07:15', departureTime: '07:25', distance: 72, platform: '1' },
      { sn: 4, stationCode: 'ETW', stationName: 'Etawah Junction', arrivalTime: '09:03', departureTime: '09:05', distance: 211, platform: '2' },
      { sn: 5, stationCode: 'TDL', stationName: 'Tundla Junction', arrivalTime: '10:35', departureTime: '10:40', distance: 303, platform: '3' },
      { sn: 6, stationCode: 'ALJN', stationName: 'Aligarh Junction', arrivalTime: '11:45', departureTime: '11:47', distance: 381, platform: '4' },
      { sn: 7, stationCode: 'NDLS', stationName: 'New Delhi', arrivalTime: '15:00', departureTime: '15:00', distance: 512, platform: '8' }
    ]
  }
};

/**
 * Get current monthly API quota usage status
 */
export function getRailRadarQuotaInfo(): QuotaInfo {
  if (typeof window === 'undefined') {
    return { usedThisMonth: 0, monthlyLimit: MONTHLY_LIMIT, remaining: MONTHLY_LIMIT, isCapped: false };
  }

  const date = new Date();
  const currentMonthKey = `rr_quota_${date.getFullYear()}_${date.getMonth() + 1}`;
  const used = parseInt(localStorage.getItem(currentMonthKey) || '0', 10);
  const remaining = Math.max(0, MONTHLY_LIMIT - used);
  
  return {
    usedThisMonth: used,
    monthlyLimit: MONTHLY_LIMIT,
    remaining,
    isCapped: used >= 950 // Safety threshold to prevent quota exhaustion
  };
}

/**
 * Increment API request counter in local storage
 */
function recordQuotaUsage(): void {
  if (typeof window === 'undefined') return;
  const date = new Date();
  const currentMonthKey = `rr_quota_${date.getFullYear()}_${date.getMonth() + 1}`;
  const current = parseInt(localStorage.getItem(currentMonthKey) || '0', 10);
  localStorage.setItem(currentMonthKey, (current + 1).toString());
}

/**
 * Dynamic fallback generator for unknown train numbers when quota cap is hit or offline
 */
function generateDynamicFallback(trainNo: string): RailRadarTrainDetail {
  return {
    number: trainNo,
    name: `Express #${trainNo}`,
    type: 'EXPRESS',
    source: { code: 'BSB', name: 'Varanasi Junction' },
    destination: { code: 'NDLS', name: 'New Delhi' },
    avgSpeed: 64.5,
    maxSpeed: 110.0,
    distance: 759.0,
    totalHalts: 6,
    coachPosition: 'ENG-SLRD-GEN-S1-S2-S3-S4-B1-B2-A1-GEN-SLRD',
    classes: ['2A', '3A', 'SL'],
    halts: [
      { sn: 1, stationCode: 'BSB', stationName: 'Varanasi Junction', arrivalTime: '08:00', departureTime: '08:00', distance: 0, platform: '1' },
      { sn: 2, stationCode: 'PRYJ', stationName: 'Prayagraj Junction', arrivalTime: '10:30', departureTime: '10:35', distance: 125, platform: '3' },
      { sn: 3, stationCode: 'CNB', stationName: 'Kanpur Central', arrivalTime: '13:15', departureTime: '13:25', distance: 319, platform: '2' },
      { sn: 4, stationCode: 'TDL', stationName: 'Tundla Junction', arrivalTime: '16:40', departureTime: '16:45', distance: 550, platform: '4' },
      { sn: 5, stationCode: 'NDLS', stationName: 'New Delhi', arrivalTime: '20:10', departureTime: '20:10', distance: 759, platform: '5' }
    ],
    cachedFrom: 'FALLBACK'
  };
}

/**
 * Fetch Train Timetable & Details from RailRadar API with strict quota caching
 */
export async function fetchRailRadarTrain(trainNo: string): Promise<RailRadarTrainDetail | null> {
  const cleanNo = trainNo.trim();
  if (!cleanNo) return null;

  const cacheKey = `rr_cache_v2_train_${cleanNo}`;

  // 1. Check Persistent Storage (LocalStorage with 24h expiration)
  if (typeof window !== 'undefined') {
    try {
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        const isFresh = Date.now() - parsed.timestamp < CACHE_TTL_MS;
        if (isFresh && parsed.data) {
          return { ...parsed.data, cachedFrom: 'CACHE' };
        }
      }
    } catch (e) {
      console.warn('LocalStorage cache read error:', e);
    }
  }

  // 2. Check Quota Cap Safety Guard
  const quota = getRailRadarQuotaInfo();
  if (quota.isCapped) {
    console.warn(`RailRadar monthly quota safety threshold reached (${quota.usedThisMonth}/${MONTHLY_LIMIT}). Serving local fallback.`);
    if (FALLBACK_TRAINS[cleanNo]) {
      return { ...FALLBACK_TRAINS[cleanNo], cachedFrom: 'FALLBACK' };
    }
    return generateDynamicFallback(cleanNo);
  }

  // 3. Make Live HTTP Request with Bearer Token
  try {
    const response = await fetch(`${BASE_URL}/trains/${cleanNo}?haltsOnly=true`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const json = await response.json();
      if (json.success && json.data && json.data.train) {
        // Record API call usage
        recordQuotaUsage();

        const trainData: RailRadarTrainDetail = {
          ...json.data.train,
          cachedFrom: 'LIVE_API'
        };
        if (json.data.halts) {
          trainData.halts = json.data.halts;
        }

        // Save into LocalStorage cache
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(cacheKey, JSON.stringify({
              timestamp: Date.now(),
              data: trainData
            }));
          } catch (e) {}
        }
        return trainData;
      }
    }
  } catch (err) {
    console.warn(`RailRadar API network error for train #${cleanNo}, switching to local fallback:`, err);
  }

  // 4. Fallback to pre-seeded train data or smart generator if offline / error
  if (FALLBACK_TRAINS[cleanNo]) {
    return { ...FALLBACK_TRAINS[cleanNo], cachedFrom: 'FALLBACK' };
  }

  return generateDynamicFallback(cleanNo);
}

/**
 * Fetch Physical GIS Track Route Geometry (GeoJSON LineString) from RailRadar API
 * Returns array of [lat, lng] coordinates for rendering on Leaflet map
 */
export async function fetchRailRadarTrainRoute(trainNo: string): Promise<[number, number][] | null> {
  const cleanNo = trainNo.trim();
  if (!cleanNo) return null;

  const cacheKey = `rr_cache_route_${cleanNo}`;

  // 1. Check LocalStorage Cache
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < CACHE_TTL_MS) {
          return parsed.coordinates;
        }
      }
    } catch (e) {}
  }

  // 2. Quota Check
  const quota = getRailRadarQuotaInfo();
  if (quota.isCapped) return null;

  // 3. Live API Call to /v1/trains/{no}/route
  try {
    const response = await fetch(`${BASE_URL}/trains/${cleanNo}/route`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const json = await response.json();
      if (json.success && json.data?.geojson?.geometry?.coordinates) {
        recordQuotaUsage();
        // GeoJSON uses [lng, lat], Leaflet uses [lat, lng]
        const rawCoords: [number, number][] = json.data.geojson.geometry.coordinates;
        const leafletCoords: [number, number][] = rawCoords.map(([lng, lat]) => [lat, lng]);

        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(cacheKey, JSON.stringify({
              timestamp: Date.now(),
              coordinates: leafletCoords
            }));
          } catch (e) {}
        }
        return leafletCoords;
      }
    }
  } catch (err) {
    console.warn(`RailRadar route geometry error for train #${cleanNo}:`, err);
  }

  return null;
}


