import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

export function HeaderNav({ airGapped, setAirGapped, pollingInterval }) {
  const { username, role, isAdmin, logoutUser } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [utcTime, setUtcTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toISOString().substring(11, 19) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="w-full bg-surface opacity-100 border-b border-border-muted sticky top-0 z-50 shadow-md backdrop-blur-none transition-colors duration-200">
      {/* Top Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
          <div className="w-9 h-9 rounded-lg bg-surface-container border border-border-muted flex items-center justify-center text-primary shadow-sm">
            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              security
            </span>
          </div>
          <div>
            <div className="font-extrabold text-lg text-text-primary tracking-tight flex items-center gap-2">
              LOG AI
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary-fixed-dim/20 text-primary border border-primary/30 uppercase font-mono font-bold">
                {theme === 'sage' ? 'SAGE GREEN' : 'CYBER VOID'}
              </span>
            </div>
            <div className="text-[10px] text-text-muted font-mono tracking-wider uppercase">SOC Intelligence Engine</div>
          </div>
        </div>

        {/* Global Controls & Status */}
        <div className="flex items-center gap-3 text-xs font-mono">
          {/* Admin Role Indicator Badge */}
          <div className={`hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-md border font-bold ${
            isAdmin
              ? 'bg-rose-500/15 text-rose-400 border-rose-500/40'
              : 'bg-surface-container text-text-muted border-border-muted'
          }`}>
            <span className="material-symbols-outlined text-xs">
              {isAdmin ? 'admin_panel_settings' : 'badge'}
            </span>
            <span>ROLE: {role}</span>
          </div>

          {/* Polling Badge */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-container border border-border-muted text-text-muted">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>LIVE {pollingInterval}MS</span>
          </div>

          {/* UTC Clock */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-container border border-border-muted text-text-primary">
            <span className="material-symbols-outlined text-sm text-text-muted">schedule</span>
            <span>{utcTime}</span>
          </div>

          {/* Air-Gapped Toggle */}
          <button
            onClick={() => setAirGapped(!airGapped)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border font-semibold transition-all ${
              airGapped
                ? 'bg-amber-500/15 text-amber-500 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                : 'bg-surface-container text-text-muted border-border-muted hover:text-text-primary'
            }`}
            title="Toggle Local Air-Gapped Heuristic Engine vs Live Gemini API"
          >
            <span className="material-symbols-outlined text-sm">
              {airGapped ? 'shield_locked' : 'cloud_done'}
            </span>
            <span>{airGapped ? 'AIR-GAPPED' : 'LIVE AI'}</span>
          </button>

          {/* User Profile / Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-border-muted">
            <div className="w-7 h-7 rounded-full bg-primary/20 text-primary border border-primary/40 flex items-center justify-center font-bold text-xs uppercase">
              {username ? username.substring(0, 2) : 'OP'}
            </div>
            <button
              onClick={logoutUser}
              className="p-1.5 text-text-muted hover:text-rose-400 transition-colors"
              title="Sign Out of SOC Command Center"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Persistent SPA Tab Bar */}
      <div className="border-t border-border-muted bg-surface-dim px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center gap-1 overflow-x-auto py-1 text-sm font-medium">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 rounded-md transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-surface-container text-primary border border-border-muted shadow-sm font-bold'
                  : 'text-text-muted hover:text-text-primary hover:bg-surface-hover'
              }`
            }
          >
            <span className="material-symbols-outlined text-lg">dashboard</span>
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/threat-intel"
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 rounded-md transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-surface-container text-primary border border-border-muted shadow-sm font-bold'
                  : 'text-text-muted hover:text-text-primary hover:bg-surface-hover'
              }`
            }
          >
            <span className="material-symbols-outlined text-lg">security</span>
            <span>Threat Intel</span>
          </NavLink>

          <NavLink
            id="nav-log-explorer"
            to="/log-explorer"
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 rounded-md transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-surface-container text-primary border border-border-muted shadow-sm font-bold'
                  : 'text-text-muted hover:text-text-primary hover:bg-surface-hover'
              }`
            }
          >
            <span className="material-symbols-outlined text-lg">database</span>
            <span>Log Explorer</span>
          </NavLink>

          <NavLink
            to="/forensics"
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 rounded-md transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-surface-container text-primary border border-border-muted shadow-sm font-bold'
                  : 'text-text-muted hover:text-text-primary hover:bg-surface-hover'
              }`
            }
          >
            <span className="material-symbols-outlined text-lg">search_insights</span>
            <span>Forensics</span>
          </NavLink>

          <NavLink
            to="/rule-studio"
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 rounded-md transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-surface-container text-primary border border-border-muted shadow-sm font-bold'
                  : 'text-text-muted hover:text-text-primary hover:bg-surface-hover'
              }`
            }
          >
            <span className="material-symbols-outlined text-lg">terminal</span>
            <span>Rule Studio</span>
          </NavLink>

          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 rounded-md transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-surface-container text-primary border border-border-muted shadow-sm font-bold'
                  : 'text-text-muted hover:text-text-primary hover:bg-surface-hover'
              }`
            }
          >
            <span className="material-symbols-outlined text-lg">settings</span>
            <span>Settings</span>
          </NavLink>
        </div>
      </div>
    </header>
  );
}
