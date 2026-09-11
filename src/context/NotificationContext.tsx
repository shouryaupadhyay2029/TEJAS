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
  isAudioMuted: boolean;
  unreadCount: number;
  toggleAudioMute: () => void;
  acknowledgeEmergency: (id: string) => void;
  triggerNotification: (item: Omit<NotificationItem, 'id' | 'timestamp'>) => void;
  markAllRead: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const STORAGE_KEY = 'tejas_live_notifications_clean_v1';

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [];

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  const isFieldReporter = Boolean(
    user?.role?.includes('FIELD') ||
    user?.role?.startsWith('FIELD_OFFICER_')
  );

  // Siren audio is restricted to Higher Authorities (Controller, DRM, DOM, SSE, DRE)
  const isHigherAuthority = !isFieldReporter;

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

  // Real-time synchronization across browser tabs/windows (for DRM, Control Officer, SSE, DOM views)
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
    // Siren ONLY plays on higher authorities' screens (Operations Controller, DRM, DOM, SSE, etc.)
    // It will NEVER sound for the field officer who is reporting the defect!
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
      if (!isAudioMuted) {
        startEmergencySiren();
      }
    } else {
      if (!isAudioMuted) {
        playNotificationChime();
      }
    }
  };

  const markAllRead = () => {
    setNotifications([]);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem('tejas_live_notifications');
        localStorage.removeItem('tejas_live_notifications_v2');
        localStorage.removeItem('tejas_live_notifications_v3');
      } catch (err) {
        console.error('Failed to clear storage keys', err);
      }
    }
    stopEmergencySiren();
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        activeEmergency,
        isAudioMuted,
        unreadCount,
        toggleAudioMute,
        acknowledgeEmergency,
        triggerNotification,
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
