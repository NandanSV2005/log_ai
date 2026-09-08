import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { StitchBrandMark } from './StitchBrandMark';

export function HeaderNav({ airGapped, setAirGapped, pollingInterval }) {
  const { username, role, isAdmin, logoutUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [istTime, setIstTime] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setIstTime(now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false }) + ' IST');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Close mobile menu on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <header className="w-full bg-surface opacity-100 border-b border-border-muted sticky top-0 z-50 shadow-md backdrop-blur-none transition-colors duration-200">
      {/* Top Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => { closeMobileMenu(); navigate('/dashboard'); }}>
          <div className="w-9 h-9 rounded-lg bg-surface-container border border-border-muted flex items-center justify-center text-primary shadow-sm">
            <StitchBrandMark size={24} />
          </div>
          <div>
            <div className="font-mono text-base font-extrabold tracking-wider uppercase text-text-primary flex items-center gap-2">
              LOG <span className="text-primary">//</span> AI
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary-fixed-dim/20 text-primary border border-primary/30 uppercase font-mono font-bold">
                {theme === 'sage' ? 'SAGE GREEN' : 'CYBER VOID'}
              </span>
            </div>
            <div className="text-[10px] text-text-muted font-mono tracking-wider uppercase">SOC Intelligence Engine</div>
          </div>
        </div>

        {/* Desktop Global Controls & Status */}
        <div className="hidden md:flex items-center gap-3 text-xs font-mono">
          {/* Admin Role Indicator Badge */}
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-md border font-bold ${
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
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-container border border-border-muted text-text-muted">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>LIVE {pollingInterval}MS</span>
          </div>

          {/* IST Clock */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-container border border-border-muted text-text-primary">
            <span className="material-symbols-outlined text-sm text-text-muted">schedule</span>
            <span>{istTime}</span>
          </div>

          {/* Air-Gapped Toggle */}
          <button
            onClick={() => setAirGapped(!airGapped)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border font-semibold transition-all touch-target ${
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
              className="p-1.5 text-text-muted hover:text-rose-400 transition-colors touch-target"
              title="Sign Out of SOC Command Center"
              aria-label="Sign Out"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
            </button>
          </div>
        </div>

        {/* Mobile Hamburger & Quick Status Toggle */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setAirGapped(!airGapped)}
            className={`p-2 rounded-md border text-xs font-mono font-semibold flex items-center justify-center touch-target ${
              airGapped ? 'bg-amber-500/15 text-amber-500 border-amber-500/40' : 'bg-surface-container text-text-muted border-border-muted'
            }`}
            aria-label="Toggle Air Gapped Mode"
          >
            <span className="material-symbols-outlined text-base">
              {airGapped ? 'shield_locked' : 'cloud_done'}
            </span>
          </button>

          <button
            onClick={toggleMobileMenu}
            className="p-2 rounded-lg bg-surface-container border border-border-muted text-text-primary hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary touch-target"
            aria-label={isMobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
            aria-expanded={isMobileMenuOpen}
          >
            <span className="material-symbols-outlined text-2xl">
              {isMobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Desktop Navigation Tab Bar */}
      <div className="hidden md:block border-t border-border-muted bg-surface-dim px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center gap-1 overflow-x-auto py-1 text-sm font-medium">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 rounded-md transition-all whitespace-nowrap touch-target ${
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
              `flex items-center gap-2 px-4 py-2 rounded-md transition-all whitespace-nowrap touch-target ${
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
              `flex items-center gap-2 px-4 py-2 rounded-md transition-all whitespace-nowrap touch-target ${
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
              `flex items-center gap-2 px-4 py-2 rounded-md transition-all whitespace-nowrap touch-target ${
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
              `flex items-center gap-2 px-4 py-2 rounded-md transition-all whitespace-nowrap touch-target ${
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
              `flex items-center gap-2 px-4 py-2 rounded-md transition-all whitespace-nowrap touch-target ${
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

      {/* Mobile Accessible Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-md transition-all duration-200">
          {/* Mobile Drawer Header */}
          <div className="p-4 border-b border-border-muted flex items-center justify-between bg-surface">
            <div className="flex items-center gap-2 font-extrabold text-base text-text-primary tracking-tight">
              <StitchBrandMark className="w-5 h-5 text-primary" />
              <span>SOC NAVIGATION</span>
            </div>
            <button
              onClick={closeMobileMenu}
              className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover touch-target"
              aria-label="Close navigation menu"
            >
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-sm">
            <NavLink
              to="/dashboard"
              onClick={closeMobileMenu}
              className={({ isActive }) =>
                `flex items-center gap-3 p-3 rounded-xl border transition-all touch-target ${
                  isActive
                    ? 'bg-surface-container text-primary border-primary font-bold'
                    : 'bg-surface-dim text-text-muted border-border-muted hover:text-text-primary'
                }`
              }
            >
              <span className="material-symbols-outlined text-xl">dashboard</span>
              <span>Dashboard</span>
            </NavLink>

            <NavLink
              to="/threat-intel"
              onClick={closeMobileMenu}
              className={({ isActive }) =>
                `flex items-center gap-3 p-3 rounded-xl border transition-all touch-target ${
                  isActive
                    ? 'bg-surface-container text-primary border-primary font-bold'
                    : 'bg-surface-dim text-text-muted border-border-muted hover:text-text-primary'
                }`
              }
            >
              <span className="material-symbols-outlined text-xl">security</span>
              <span>Threat Intel</span>
            </NavLink>

            <NavLink
              to="/log-explorer"
              onClick={closeMobileMenu}
              className={({ isActive }) =>
                `flex items-center gap-3 p-3 rounded-xl border transition-all touch-target ${
                  isActive
                    ? 'bg-surface-container text-primary border-primary font-bold'
                    : 'bg-surface-dim text-text-muted border-border-muted hover:text-text-primary'
                }`
              }
            >
              <span className="material-symbols-outlined text-xl">database</span>
              <span>Log Explorer</span>
            </NavLink>

            <NavLink
              to="/forensics"
              onClick={closeMobileMenu}
              className={({ isActive }) =>
                `flex items-center gap-3 p-3 rounded-xl border transition-all touch-target ${
                  isActive
                    ? 'bg-surface-container text-primary border-primary font-bold'
                    : 'bg-surface-dim text-text-muted border-border-muted hover:text-text-primary'
                }`
              }
            >
              <span className="material-symbols-outlined text-xl">search_insights</span>
              <span>Forensics</span>
            </NavLink>

            <NavLink
              to="/rule-studio"
              onClick={closeMobileMenu}
              className={({ isActive }) =>
                `flex items-center gap-3 p-3 rounded-xl border transition-all touch-target ${
                  isActive
                    ? 'bg-surface-container text-primary border-primary font-bold'
                    : 'bg-surface-dim text-text-muted border-border-muted hover:text-text-primary'
                }`
              }
            >
              <span className="material-symbols-outlined text-xl">terminal</span>
              <span>Rule Studio</span>
            </NavLink>

            <NavLink
              to="/settings"
              onClick={closeMobileMenu}
              className={({ isActive }) =>
                `flex items-center gap-3 p-3 rounded-xl border transition-all touch-target ${
                  isActive
                    ? 'bg-surface-container text-primary border-primary font-bold'
                    : 'bg-surface-dim text-text-muted border-border-muted hover:text-text-primary'
                }`
              }
            >
              <span className="material-symbols-outlined text-xl">settings</span>
              <span>Settings</span>
            </NavLink>
          </div>

          {/* Drawer Footer Controls */}
          <div className="p-4 border-t border-border-muted bg-surface space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setTheme(theme === 'dark' ? 'sage' : 'dark')}
                className="px-3 py-2 rounded-lg border border-border-muted bg-surface-dim text-text-primary flex items-center gap-2 touch-target"
              >
                <span className="material-symbols-outlined text-base">palette</span>
                <span>{theme === 'dark' ? 'CYBER VOID' : 'SAGE GREEN'}</span>
              </button>

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 text-primary border border-primary/40 flex items-center justify-center font-bold">
                  {username ? username.substring(0, 2) : 'OP'}
                </div>
                <button
                  onClick={() => { closeMobileMenu(); logoutUser(); }}
                  className="px-3 py-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center gap-1 touch-target font-bold"
                >
                  <span className="material-symbols-outlined text-base">logout</span>
                  <span>Sign Out</span>
                </button>
              </div>
            </div>

            <div className="text-[10px] text-text-muted text-center pt-1 font-mono flex items-center justify-center gap-1.5 flex-wrap">
              <span>{istTime}</span>
              <span>|</span>
              <span>ROLE: {role}</span>
              <span>|</span>
              <span>LIVE: {pollingInterval}MS</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

