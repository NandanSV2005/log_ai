import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { HeaderNav } from './components/common/HeaderNav';
import { Footer } from './components/common/Footer';
import { CopilotWidget } from './components/copilot/CopilotWidget';

import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { LogExplorerPage } from './pages/LogExplorerPage';
import { ForensicsPage } from './pages/ForensicsPage';
import { ThreatIntelPage } from './pages/ThreatIntelPage';
import { SettingsPage } from './pages/SettingsPage';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  const [airGapped, setAirGapped] = useState(true);
  const [pollingInterval, setPollingInterval] = useState(2000);
  const location = useLocation();

  // Check if current route is a public standalone page (Landing, Login, Register)
  const isPublicRoute = ['/', '/login', '/register'].includes(location.pathname);

  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col font-sans transition-colors duration-200">
      {!isPublicRoute && (
        <HeaderNav
          airGapped={airGapped}
          setAirGapped={setAirGapped}
          pollingInterval={pollingInterval}
        />
      )}

      <main className={`flex-1 ${!isPublicRoute ? 'max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6' : ''}`}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage pollingInterval={pollingInterval} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/log-explorer"
            element={
              <ProtectedRoute>
                <LogExplorerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/forensics"
            element={
              <ProtectedRoute>
                <ForensicsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/threat-intel"
            element={
              <ProtectedRoute>
                <ThreatIntelPage airGapped={airGapped} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage
                  pollingInterval={pollingInterval}
                  setPollingInterval={setPollingInterval}
                  airGapped={airGapped}
                  setAirGapped={setAirGapped}
                />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {!isPublicRoute && <Footer />}
      {!isPublicRoute && <CopilotWidget airGapped={airGapped} />}
    </div>
  );
}
