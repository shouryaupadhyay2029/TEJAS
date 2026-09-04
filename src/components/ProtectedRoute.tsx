import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-bg-base)',
        color: '#1e1b19'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600 }}>
          <RefreshCw size={20} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
          <span>Authenticating Personnel Credentials...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-bg-base)',
        color: '#1e1b19',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(16px)',
          borderRadius: '16px',
          padding: '2.5rem',
          maxWidth: '500px',
          border: '1px solid rgba(188, 71, 58, 0.3)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.05)'
        }}>
          <AlertTriangle size={48} color="var(--color-railway-red)" style={{ marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: '#1e1b19' }}>
            Access Restricted
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
            Your active role <strong>({user.role})</strong> is not authorized to access this operational workspace section.
          </p>
          <a
            href="/dashboard"
            style={{
              display: 'inline-block',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              backgroundColor: 'var(--color-railway-red)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.85rem',
              textDecoration: 'none'
            }}
          >
            Return to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
