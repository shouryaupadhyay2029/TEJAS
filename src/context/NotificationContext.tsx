import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  playNotificationChime,
  startEmergencySiren,
  stopEmergencySiren,
  setGlobalAudioMute
} from '../utils/audioAlerts';
import { useAuth } from './AuthContext';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'OPPORTUNITY' | 'ATTENTION' | 'EMERGENCY';
  department?: 'ENGINEERING' | 'S&T' | 'TRACTION' | 'OPERATIONS' | string;
  subsystem?: string;
  urgencyScore?: number; // 0-100 or 0-1
  sectionCode?: string;
  routeLocation?: string;
  reportedExactTime?: string;
  detailedObservations?: string;
  recommendedAction?: string;
  timestamp: string;
  acknowledged?: boolean;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  activeEmergency: NotificationItem | null;
  currentBannerAlert: NotificationItem | null;
  connectionStatus: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED';
  latestTelemetry: any | null;
  isAudioMuted: boolean;
  unreadCount: number;
  toggleAudioMute: () => void;
  acknowledgeEmergency: (id: string) => void;
  triggerNotification: (item: Omit<NotificationItem, 'id' | 'timestamp'>) => void;
  dismissBanner: () => void;
  markAllRead: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const STORAGE_KEY = 'tejas_live_notifications_v3';

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'EMG-101',
    title: 'Weld Crack Class-A Anomaly',
    message: 'Derailment hazard on Track Segment T1 (KM 42.4). ML Urgency Index: 94.2%',
    type: 'EMERGENCY',
    department: 'ENGINEERING',
    subsystem: 'P.Way (USFD Rail Inspection)',
    urgencyScore: 94.2,
    sectionCode: 'VAR-LKO-SEC1',
    routeLocation: 'Varanasi - Lucknow Mainline (KM 42.4, Track T1)',
    reportedExactTime: '10 Sep 2026, 15:22:04 IST',
    detailedObservations: 'Ultrasonic Flaw Detection (USFD) flagged severe 4.5mm rail fracture at thermit weld joint #214 under heavy freight dynamic load.',
    recommendedAction: 'Impose 20 km/h emergency speed restriction (PSR). SSE/P.Way dispatched for joggled fishplate clamping.',
    timestamp: 'Just now',
    acknowledged: false,
  },
  {
    id: 'EMG-102',
    title: 'Point Machine 112B Locking Failure',
    message: 'Point detection contact failure during main line route setting at North Cabin.',
    type: 'EMERGENCY',
    department: 'S&T',
    subsystem: 'Signalling & Interlocking',
    urgencyScore: 91.8,
    sectionCode: 'BSB-YARD-NORTH',
    routeLocation: 'Varanasi Junction Yard North Cabin (Point Switch 112B)',
    reportedExactTime: '10 Sep 2026, 15:18:30 IST',
    detailedObservations: 'Microswitch contact resistance spiked >150 ohms. Point machine fails to achieve electrical end-lock verification within 4 seconds.',
    recommendedAction: 'Signal 4A locked to Red aspect. Manual crank handle issued to S&T Duty ESM.',
    timestamp: '6m ago',
    acknowledged: false,
  },
  {
    id: 'EMG-103',
    title: 'OHE Catenary Tension Drop Anomaly',
    message: 'Pantograph vibration sensor flagged 18% catenary wire tension drop.',
    type: 'EMERGENCY',
    department: 'TRACTION',
    subsystem: 'Overhead Equipment (OHE / Electrical)',
    urgencyScore: 86.5, // 86.5% <= 90% -> Emergency defect, but NO siren audio!
    sectionCode: 'LKO-CNB-SEC2',
    routeLocation: 'Lucknow - Kanpur Section (KM 18.2, UP Line)',
    reportedExactTime: '10 Sep 2026, 14:45:10 IST',
    detailedObservations: 'Dropper wire displacement detected at Mast #18/14. High-speed pantograph entangle risk if uncorrected under current thermal load.',
    recommendedAction: 'Section speed capped at 75 km/h. OHE Tower Wagon scheduled during next available block window.',
    timestamp: '44m ago',
    acknowledged: false,
  },
  {
    id: 'NOT-102',
    title: '3 Compatible Block Requests Found',
    message: 'Engineering, S&T, and Traction submitted overlapping block windows.',
    type: 'OPPORTUNITY',
    department: 'OPERATIONS',
    subsystem: 'Integrated Block Planning Desk',
    routeLocation: 'Pratapgarh - Sultanpur Section (KM 88.0 - KM 104.0)',
    reportedExactTime: '10 Sep 2026, 15:00:00 IST',
    detailedObservations: 'P.Way tamping, Signal cable laying, and OHE insulator cleaning requests overlap cleanly between 16:00 and 18:00 IST.',
    recommendedAction: 'Approve joint multi-department block to save 110 minutes of total section line capacity.',
    timestamp: '15m ago',
    acknowledged: true,
  },
  {
    id: 'NOT-103',
    title: 'CP-SAT Solver Target Updated',
    message: 'Updated to CP-SAT Block Alignment v4.2.',
    type: 'INFO',
    department: 'OPERATIONS',
    subsystem: 'AI Optimization Engine',
    reportedExactTime: '10 Sep 2026, 14:30:00 IST',
    detailedObservations: 'New solver parameters incorporate live freight throughput constraints and crew duty hour limits.',
    timestamp: '45m ago',
    acknowledged: true,
  }
];

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const isFieldReporter = Boolean(
    user?.role?.includes('FIELD') ||
    user?.role?.startsWith('FIELD_OFFICER_')
  );

  // Siren audio is restricted to Higher Authorities (Controller, DRM, DOM, SSE, DRE)
  const isHigherAuthority = !isFieldReporter;

  const [connectionStatus, setConnectionStatus] = useState<'DISCONNECTED' | 'CONNECTING' | 'CONNECTED'>('DISCONNECTED');
  const [latestTelemetry, setLatestTelemetry] = useState<any | null>(null);
  const [currentBannerAlert, setCurrentBannerAlert] = useState<NotificationItem | null>(null);

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (err) {
        console.error('Failed to load notifications from storage', err);
      }
    }
    return DEFAULT_NOTIFICATIONS;
  });

  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('tejas_audio_muted') === 'true';
    }
    return false;
  });

  // Web Speech API Voice Announcement for Critical Emergency Broadcasts
  const speakEmergencyVoice = React.useCallback((defectData: NotificationItem) => {
    try {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();

      const title = defectData?.title || 'Defect Detected';
      const location = defectData?.routeLocation || defectData?.sectionCode || 'Mainline Track';

      const spokenText = `Attention Control Office! Emergency Alert. ${title} detected on ${location}. Immediate safety restriction required.`;

      const utterance = new SpeechSynthesisUtterance(spokenText);
      utterance.rate = 1.0;
      utterance.pitch = 1.1;
      utterance.volume = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const engVoice = voices.find(v => v.lang.includes('en'));
      if (engVoice) utterance.voice = engVoice;

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Text-to-speech announcement failed:', e);
    }
  }, []);

  // Save notifications to localStorage whenever state changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
      } catch (err) {
        console.error('Failed to save notifications to storage', err);
      }
    }
  }, [notifications]);

  // Real-time synchronization across browser tabs/windows
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setNotifications(parsed);
          }
        } catch (err) {
          console.error('Failed to parse cross-tab storage event', err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // WebSocket Live Telemetry Engine Connection & Auto-Reconnect Logic
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const WS_URL = (import.meta.env as any).VITE_WS_URL || 'ws://localhost:8000/ws/telemetry';
    let socket: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connectWebSocket = () => {
      setConnectionStatus('CONNECTING');
      try {
        socket = new WebSocket(WS_URL);

        socket.onopen = () => {
          setConnectionStatus('CONNECTED');
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.event_type === 'DEFECT_REPORTED' || data.type === 'EMERGENCY' || (data.urgencyScore && data.urgencyScore >= 90)) {
              const newItem: NotificationItem = {
                id: data.id || `EMG-${Date.now()}`,
                title: data.title || 'Live ML Defect Alert',
                message: data.message || 'Critical defect detected via live WebSocket telemetry.',
                type: data.type || 'EMERGENCY',
                department: data.department || 'ENGINEERING',
                subsystem: data.subsystem || 'Track Inspection Rake',
                urgencyScore: data.urgencyScore || 95.0,
                sectionCode: data.sectionCode,
                routeLocation: data.routeLocation,
                reportedExactTime: data.reportedExactTime || new Date().toLocaleString('en-IN'),
                detailedObservations: data.detailedObservations,
                recommendedAction: data.recommendedAction,
                timestamp: 'Just now',
                acknowledged: false
              };

              setNotifications(prev => [newItem, ...prev.filter(n => n.id !== newItem.id)]);
              setCurrentBannerAlert(newItem);

              if (isHigherAuthority) {
                speakEmergencyVoice(newItem);
              }
            } else if (data.event_type === 'TELEMETRY_METRIC') {
              setLatestTelemetry(data);
            }
          } catch (err) {
            console.error('Failed to parse WebSocket telemetry JSON:', err);
          }
        };

        socket.onclose = () => {
          setConnectionStatus('DISCONNECTED');
          reconnectTimeout = setTimeout(connectWebSocket, 3000);
        };

        socket.onerror = () => {
          setConnectionStatus('DISCONNECTED');
        };
      } catch (err) {
        setConnectionStatus('DISCONNECTED');
        reconnectTimeout = setTimeout(connectWebSocket, 3000);
      }
    };

    connectWebSocket();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (socket) socket.close();
    };
  }, [isHigherAuthority, speakEmergencyVoice]);

  const getNormalizedScore = (score?: number): number => {
    if (score === undefined || score === null) return 0;
    return score <= 1 ? score * 100 : score;
  };

  // Sound alarm MUST ONLY play when a reported emergency urgency score reaches ABOVE 90%
  const activeEmergency = notifications.find(n => {
    if (n.type !== 'EMERGENCY' || n.acknowledged) return false;
    const score = getNormalizedScore(n.urgencyScore);
    return score > 90;
  }) || null;

  const unreadCount = notifications.filter(n => !n.acknowledged).length;

  // Manage Emergency Siren Playback based on activeEmergency (>90% risk), mute state, and user authority role
  useEffect(() => {
    if (activeEmergency && !isAudioMuted && isHigherAuthority) {
      startEmergencySiren();
    } else {
      stopEmergencySiren();
    }
  }, [activeEmergency, isAudioMuted, isHigherAuthority]);

  const toggleAudioMute = () => {
    setIsAudioMuted(prev => {
      const next = !prev;
      localStorage.setItem('tejas_audio_muted', String(next));
      setGlobalAudioMute(next);
      return next;
    });
  };

  const acknowledgeEmergency = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, acknowledged: true } : n))
    );
    stopEmergencySiren();
    if (currentBannerAlert?.id === id) {
      dismissBanner();
    }
  };

  const dismissBanner = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setCurrentBannerAlert(null);
  };

  const triggerNotification = (item: Omit<NotificationItem, 'id' | 'timestamp'>) => {
    const newItem: NotificationItem = {
      ...item,
      id: `NOT-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      acknowledged: false,
    };

    setNotifications(prev => [newItem, ...prev]);

    const score = getNormalizedScore(item.urgencyScore);
    if (item.type === 'EMERGENCY' && score > 90) {
      setCurrentBannerAlert(newItem);
      if (!isAudioMuted && isHigherAuthority) {
        startEmergencySiren();
        speakEmergencyVoice(newItem);
      }
    } else {
      if (!isAudioMuted) {
        playNotificationChime();
      }
    }
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, acknowledged: true })));
    stopEmergencySiren();
    dismissBanner();
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        activeEmergency,
        currentBannerAlert,
        connectionStatus,
        latestTelemetry,
        isAudioMuted,
        unreadCount,
        toggleAudioMute,
        acknowledgeEmergency,
        triggerNotification,
        dismissBanner,
        markAllRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
