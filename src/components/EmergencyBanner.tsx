import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Volume2, VolumeX, ExternalLink, ChevronRight } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

export const EmergencyBanner: React.FC = () => {
  const { activeEmergency, acknowledgeEmergency, isAudioMuted, toggleAudioMute } = useNotifications();
  const { user } = useAuth();
  const navigate = useNavigate();

  const isFieldOfficer = Boolean(
    user?.role?.includes('FIELD') ||
    user?.role?.startsWith('FIELD_OFFICER_')
  );

  // Emergency siren banner is exclusive to Higher Authorities (Operations Controller, DRM, DOM, SSE)
  // Field officers reporting defects will not have their local screen interrupted by siren overlays
  if (!activeEmergency || isFieldOfficer) return null;

  const rawScore = activeEmergency.urgencyScore ?? 94.2;
  const score = rawScore <= 1 ? rawScore * 100 : rawScore;
  const dept = activeEmergency.department || 'RAILWAYS';
  const location = activeEmergency.routeLocation || activeEmergency.sectionCode || 'VARANASI SEC';

  const handleViewDefect = () => {
    acknowledgeEmergency(activeEmergency.id);
    navigate('/defects');
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -40, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -40, scale: 0.98 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 9999,
          width: '100%',
          background: 'linear-gradient(135deg, rgba(26, 18, 18, 0.96) 0%, rgba(18, 14, 14, 0.98) 100%)',
          color: '#faf6f0',
          padding: '10px 24px',
          boxSizing: 'border-box',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 8px 32px rgba(188, 71, 58, 0.25), inset 0 -1px 0 rgba(220, 53, 69, 0.3)',
          borderBottom: '1.5px solid rgba(220, 53, 69, 0.4)',
        }}
      >
        {/* Left Side: Pulsing Icon & Crisp Summary */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
          <motion.div
            animate={{ scale: [1, 1.15, 1], boxShadow: ['0 0 0px rgba(220,53,69,0.4)', '0 0 16px rgba(220,53,69,0.8)', '0 0 0px rgba(220,53,69,0.4)'] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
            style={{
              backgroundColor: '#bc473a',
              color: '#ffffff',
              borderRadius: '8px',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <ShieldAlert size={20} />
          </motion.div>

          <div style={{ minWidth: 0, flex: 1 }}>
            {/* Top Meta Line: Status Pill + Dept + Location */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '2px' }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '0.64rem',
                  fontWeight: 900,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  backgroundColor: 'rgba(220, 53, 69, 0.25)',
                  color: '#ff6b6b',
                  border: '1px solid rgba(220, 53, 69, 0.4)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                }}
              >
                CRITICAL SIREN • {score.toFixed(1)}% RISK
              </span>

              <span
                style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '0.64rem',
                  fontWeight: 800,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'rgba(250, 246, 240, 0.9)',
                  padding: '2px 6px',
                  borderRadius: '3px',
                }}
              >
                {dept}
              </span>

              <span style={{ fontSize: '0.7rem', color: 'rgba(250, 246, 240, 0.7)', fontFamily: 'var(--font-mono, monospace)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                📍 {location}
              </span>
            </div>

            {/* Crisp Title & Description */}
            <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-sans, sans-serif)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {activeEmergency.title}: <span style={{ fontWeight: 400, color: 'rgba(250, 246, 240, 0.85)' }}>{activeEmergency.message}</span>
            </h4>
          </div>
        </div>

        {/* Right Side: Mute Control & View Defect Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, marginLeft: '16px' }}>
          {/* Siren Mute Toggle */}
          <button
            onClick={toggleAudioMute}
            title={isAudioMuted ? 'Unmute Emergency Siren' : 'Mute Emergency Siren'}
            style={{
              background: isAudioMuted ? 'rgba(255, 255, 255, 0.08)' : 'rgba(220, 53, 69, 0.2)',
              border: `1px solid ${isAudioMuted ? 'rgba(255, 255, 255, 0.2)' : 'rgba(220, 53, 69, 0.5)'}`,
              color: isAudioMuted ? 'rgba(250, 246, 240, 0.7)' : '#ff6b6b',
              padding: '6px 10px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.7rem',
              fontFamily: 'var(--font-mono, monospace)',
              fontWeight: 700,
              transition: 'all 0.2s ease',
            }}
          >
            {isAudioMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            <span>{isAudioMuted ? 'MUTED' : 'SIREN ON'}</span>
          </button>

          {/* View Defect Direct Officer Navigation Button */}
          <button
            onClick={handleViewDefect}
            style={{
              background: 'linear-gradient(135deg, #bc473a 0%, #a2382c 100%)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              padding: '7px 14px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 800,
              fontSize: '0.72rem',
              fontFamily: 'var(--font-sans, sans-serif)',
              letterSpacing: '0.04em',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 10px rgba(188, 71, 58, 0.4)',
              transition: 'all 0.15s ease',
            }}
          >
            <ExternalLink size={14} />
            <span>VIEW DEFECT</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
