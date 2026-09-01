import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { api } from '../services/api';

export function SettingsPage({ pollingInterval, setPollingInterval, airGapped, setAirGapped }) {
  const { theme, setTheme } = useTheme();
  const [resetMessage, setResetMessage] = useState('');
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleResetData = async () => {
    setIsResetting(true);
    setResetMessage('');
    try {
      const res = await api.resetData();
      setResetMessage(res.message || 'Telemetry data cleared successfully.');
      setShowConfirmReset(false);
    } catch (err) {
      setResetMessage(`Reset Error: ${err.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <header className="glass-panel p-6 rounded-2xl border border-border-muted flex items-center gap-3 shadow-xl">
        <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary border border-primary/30 flex items-center justify-center">
          <span className="material-symbols-outlined text-2xl">settings</span>
        </div>
        <div>
          <h1 className="text-xl font-bold text-text-primary">SOC Platform Settings & Workspace Configuration</h1>
          <p className="text-xs text-text-muted">Manage theme design system, telemetry refresh frequency, tenant isolation, and data controls</p>
        </div>
      </header>

      {/* CATEGORY 1: APPEARANCE & THEME ENGINE */}
      <div className="glass-panel p-6 rounded-2xl border border-border-muted space-y-4 shadow-lg">
        <div className="flex items-center gap-2 border-b border-border-muted pb-3 font-mono text-xs">
          <span className="material-symbols-outlined text-primary text-xl">palette</span>
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">Appearance & Visual Theme System</h2>
        </div>
        <p className="text-xs text-text-muted">
          Select between Cyber Void (High-contrast Dark) and Sage Green design system variants.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div
            onClick={() => setTheme('dark')}
            className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
              theme === 'dark'
                ? 'border-primary bg-primary/10 shadow-lg'
                : 'border-border-muted bg-surface-dim hover:border-text-muted'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-sm text-text-primary flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                Cyber Void (Dark Mode)
              </span>
              {theme === 'dark' && <span className="material-symbols-outlined text-primary">check_circle</span>}
            </div>
            <p className="text-xs text-text-muted">
              Deep dark background (`#0f131c`) with violet accents (`#a78bfa`). Ideal for low-light SOC command centers.
            </p>
          </div>

          <div
            onClick={() => setTheme('sage')}
            className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
              theme === 'sage'
                ? 'border-primary bg-primary/10 shadow-lg'
                : 'border-border-muted bg-surface-dim hover:border-text-muted'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-sm text-text-primary flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-600"></span>
                Sage Green Mode
              </span>
              {theme === 'sage' && <span className="material-symbols-outlined text-primary">check_circle</span>}
            </div>
            <p className="text-xs text-text-muted">
              Stone-sage background (`#fafaf5`) with organic olive accents (`#718355`). Clean daylight visibility.
            </p>
          </div>
        </div>
      </div>

      {/* CATEGORY 2: APPLICATION TELEMETRY & POLLING */}
      <div className="glass-panel p-6 rounded-2xl border border-border-muted space-y-4 shadow-lg">
        <div className="flex items-center gap-2 border-b border-border-muted pb-3 font-mono text-xs">
          <span className="material-symbols-outlined text-primary text-xl">tune</span>
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">Telemetry Ingestion & Refresh Controls</h2>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1 font-mono text-xs">
          <div>
            <div className="font-bold text-text-primary">Real-Time Polling Interval</div>
            <div className="text-[11px] text-text-muted mt-0.5">Controls frequency of background API calls to `/api/v1/dashboard/stats`</div>
          </div>
          <div className="flex gap-2">
            {[1000, 2000, 5000, 10000].map((ms) => (
              <button
                key={ms}
                onClick={() => setPollingInterval && setPollingInterval(ms)}
                className={`px-3 py-1.5 rounded-lg border font-bold ${
                  pollingInterval === ms
                    ? 'bg-primary text-surface-lowest border-primary shadow'
                    : 'bg-surface-dim border-border-muted text-text-muted hover:border-primary/50'
                }`}
              >
                {ms / 1000}s
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CATEGORY 3: SECURITY & PRIVACY */}
      <div className="glass-panel p-6 rounded-2xl border border-border-muted space-y-4 shadow-lg">
        <div className="flex items-center gap-2 border-b border-border-muted pb-3 font-mono text-xs">
          <span className="material-symbols-outlined text-primary text-xl">shield_lock</span>
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">Security Controls & Air-Gapped Mode</h2>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs">
          <div>
            <div className="font-bold text-text-primary">Air-Gapped Sovereign Mode</div>
            <div className="text-[11px] text-text-muted mt-0.5">Strict offline resolution only; prevents external network tile lookups.</div>
          </div>
          <button
            onClick={() => setAirGapped && setAirGapped(!airGapped)}
            className={`px-4 py-2 rounded-xl border font-bold transition-all ${
              airGapped
                ? 'bg-emerald-500 text-surface-lowest border-emerald-500'
                : 'bg-surface-dim border-border-muted text-text-muted hover:text-text-primary'
            }`}
          >
            {airGapped ? 'ENABLED (OFFLINE)' : 'DISABLED (ONLINE)'}
          </button>
        </div>
      </div>

      {/* CATEGORY 4: DATA MAINTENANCE & RESET */}
      <div className="glass-panel p-6 rounded-2xl border border-border-muted space-y-4 shadow-lg">
        <div className="flex items-center gap-2 border-b border-border-muted pb-3 font-mono text-xs">
          <span className="material-symbols-outlined text-rose-400 text-xl">delete_forever</span>
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">Telemetry Maintenance & Data Cleanup</h2>
        </div>

        <p className="text-xs text-text-muted font-sans">
          Clear temporary ingested event logs, reset baseline ML threat scores, and flush cached incident clusters for active tenant.
        </p>

        {!showConfirmReset ? (
          <button
            onClick={() => setShowConfirmReset(true)}
            className="px-4 py-2 rounded-xl bg-rose-500/20 border border-rose-500/50 text-rose-400 font-mono text-xs font-bold hover:bg-rose-500/30 transition-all"
          >
            Clear Telemetry & Incident Logs
          </button>
        ) : (
          <div className="p-4 rounded-xl bg-surface-dim border border-rose-500/60 font-mono text-xs space-y-3">
            <div className="text-rose-400 font-bold">Are you sure you want to clear telemetry logs?</div>
            <div className="flex gap-3">
              <button
                onClick={handleResetData}
                disabled={isResetting}
                className="px-4 py-2 rounded-xl bg-rose-500 text-white font-bold hover:bg-rose-600 transition-all"
              >
                {isResetting ? 'Clearing...' : 'Confirm Reset Data'}
              </button>
              <button
                onClick={() => setShowConfirmReset(false)}
                className="btn-secondary px-4 py-2 rounded-xl font-bold"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {resetMessage && (
          <div className="p-3 rounded-xl bg-surface-dim border border-border-muted font-mono text-xs text-emerald-400">
            {resetMessage}
          </div>
        )}
      </div>

    </div>
  );
}
