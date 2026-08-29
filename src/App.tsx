import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Import TEJAS Pages
import Home from './pages/Home/Home';
import Dashboard from './pages/Dashboard/Dashboard';
import Maintenance from './pages/Maintenance';
import Defects from './pages/Defects';
import BlockPlanning from './pages/BlockPlanning';
import Optimization from './pages/Optimization';
import Assets from './pages/Assets';
import Reports from './pages/Reports';
import Auth from './pages/Auth';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

const NonLandingRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div className="non-landing-page" style={{ minHeight: '100%' }}>{children}</div>;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <main style={{ flex: 1, width: '100%', margin: '0 auto' }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={<NonLandingRoute><Dashboard /></NonLandingRoute>} />
              <Route path="/maintenance" element={<NonLandingRoute><Maintenance /></NonLandingRoute>} />
              <Route path="/defects" element={<NonLandingRoute><Defects /></NonLandingRoute>} />
              <Route path="/block-planning" element={<NonLandingRoute><BlockPlanning /></NonLandingRoute>} />
              <Route path="/optimization" element={<NonLandingRoute><Optimization /></NonLandingRoute>} />
              <Route path="/assets" element={<NonLandingRoute><Assets /></NonLandingRoute>} />
              <Route path="/reports" element={<NonLandingRoute><Reports /></NonLandingRoute>} />
              <Route path="/login" element={<NonLandingRoute><Auth /></NonLandingRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>


        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
