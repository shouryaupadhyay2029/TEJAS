import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, CheckCircle2, AlertTriangle, ShieldAlert, X } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

export const ToastContainer: React.FC = () => {
  const { notifications, acknowledgeEmergency } = useNotifications();

  // Show top 3 recent unacknowledged notifications
  const activeToasts = notifications.filter(n => !n.acknowledged).slice(0, 3);

  if (activeToasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '110px',
        right: '24px',
        zIndex: 9990,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '380px',
        width: '100%',
        pointerEvents: 'none',
      }}
    >
      <AnimatePresence>
        {activeToasts.map(toast => {
          const isEmergency = toast.type === 'EMERGENCY';
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.95 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              style={{
                pointerEvents: 'auto',
                backgroundColor: isEmergency ? '#bc473a' : 'rgba(252, 248, 240, 0.96)',
                color: isEmergency ? '#faf6f0' : '#1e1b19',
                padding: '14px 16px',
                borderRadius: '4px',
                boxShadow: '0 12px 32px rgba(30, 27, 25, 0.18)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(30, 27, 25, 0.12)',
                borderLeft: `4px solid ${
                  toast.type === 'EMERGENCY'
                    ? '#faf6f0'
                    : toast.type === 'OPPORTUNITY'
                    ? '#27ae60'
                    : toast.type === 'ATTENTION'
                    ? '#e59866'
                    : '#d2b48c'
                }`,
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                {toast.type === 'EMERGENCY' && <ShieldAlert size={18} color="#faf6f0" style={{ marginTop: '2px', flexShrink: 0 }} />}
                {toast.type === 'OPPORTUNITY' && <CheckCircle2 size={18} color="#27ae60" style={{ marginTop: '2px', flexShrink: 0 }} />}
                {toast.type === 'ATTENTION' && <AlertTriangle size={18} color="#e59866" style={{ marginTop: '2px', flexShrink: 0 }} />}
                {toast.type === 'INFO' && <Info size={18} color="#bc473a" style={{ marginTop: '2px', flexShrink: 0 }} />}

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono, monospace)',
                        fontSize: '0.6rem',
                        fontWeight: 800,
                        letterSpacing: '0.08em',
                        color: isEmergency ? '#faf6f0' : toast.type === 'OPPORTUNITY' ? '#27ae60' : 'rgba(30, 27, 25, 0.7)',
                      }}
                    >
                      {toast.type}
                    </span>
                    <span style={{ fontSize: '0.6rem', color: isEmergency ? 'rgba(250, 246, 240, 0.7)' : 'rgba(30, 27, 25, 0.5)', fontFamily: 'var(--font-mono, monospace)' }}>
                      {toast.timestamp}
                    </span>
                  </div>

                  <h5 style={{ margin: '2px 0 0', fontSize: '0.82rem', fontWeight: 800, color: isEmergency ? '#faf6f0' : '#1e1b19' }}>{toast.title}</h5>
                  <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: isEmergency ? 'rgba(250, 246, 240, 0.9)' : 'rgba(30, 27, 25, 0.75)', lineHeight: 1.4 }}>{toast.message}</p>
                </div>
              </div>

              <button
                onClick={() => acknowledgeEmergency(toast.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: isEmergency ? '#faf6f0' : '#1e1b19',
                  opacity: 0.6,
                  cursor: 'pointer',
                  padding: '2px',
                }}
              >
                <X size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
