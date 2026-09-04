import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Import TEJAS Auth Context & Protected Route Guard
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Import TEJAS Pages
import Home from './pages/Home/Home';
import Dashboard from './pages/Dashboard/Dashboard';
import Maintenance from './pages/Maintenance';
import Defects from './pages/Defects';
import BlockPlanning from './pages/BlockPlanning';
import Optimization from './pages/Optimization';
import Assets from './pages/Assets';
import Traffic from './pages/Traffic';
import Reports from './pages/Reports';
import Auth from './pages/Auth';
import { IncidentReport } from './pages/IncidentReport/IncidentReport';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

import { PageTransitionProvider } from './components/PageTransition';
import { ScrollProvider } from './components/motion/ScrollSystem';

const NonLandingRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div className="non-landing-page page-fade-enter" style={{ minHeight: '100%' }}>{children}</div>;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <PageTransitionProvider>
            <ScrollProvider>
              <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                <main style={{ flex: 1, width: '100%', margin: '0 auto' }}>
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<Home />} />
                    <Route path="/auth" element={<NonLandingRoute><Auth /></NonLandingRoute>} />
                    <Route path="/login" element={<Navigate to="/auth" replace />} />

                    {/* Protected Operational Workspace Routes */}
                    <Route path="/dashboard" element={
                      <ProtectedRoute>
                        <NonLandingRoute><Dashboard /></NonLandingRoute>
                      </ProtectedRoute>
                    } />
                    <Route path="/maintenance" element={
                      <ProtectedRoute>
                        <NonLandingRoute><Maintenance /></NonLandingRoute>
                      </ProtectedRoute>
                    } />
                    <Route path="/defects" element={
                      <ProtectedRoute>
                        <NonLandingRoute><Defects /></NonLandingRoute>
                      </ProtectedRoute>
                    } />
                    <Route path="/block-planning" element={
                      <ProtectedRoute>
                        <NonLandingRoute><BlockPlanning /></NonLandingRoute>
                      </ProtectedRoute>
                    } />
                    <Route path="/optimization" element={
                      <ProtectedRoute>
                        <NonLandingRoute><Optimization /></NonLandingRoute>
                      </ProtectedRoute>
                    } />
                    <Route path="/traffic" element={
                      <ProtectedRoute>
                        <NonLandingRoute><Traffic /></NonLandingRoute>
                      </ProtectedRoute>
                    } />
                    <Route path="/assets" element={
                      <ProtectedRoute>
                        <NonLandingRoute><Assets /></NonLandingRoute>
                      </ProtectedRoute>
                    } />
                    <Route path="/report" element={
                      <ProtectedRoute>
                        <NonLandingRoute><IncidentReport /></NonLandingRoute>
                      </ProtectedRoute>
                    } />
                    <Route path="/reports" element={
                      <ProtectedRoute>
                        <NonLandingRoute><Reports /></NonLandingRoute>
                      </ProtectedRoute>
                    } />

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </main>
              </div>
            </ScrollProvider>
          </PageTransitionProvider>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
