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
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-border-muted flex items-center gap-3 shadow-sm">
        <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary border border-primary/30 flex items-center justify-center">
          <span className="material-symbols-outlined text-2xl">settings</span>
        </div>
        <div>
          <h1 className="text-xl font-bold text-text-primary">SOC Platform Settings & Theme Engine</h1>
          <p className="text-xs text-text-muted">Configure visual design system, telemetry refresh, and air-gapped security</p>
        </div>
      </div>

      {/* 1. Theme Engine Settings */}
      <div className="glass-panel p-6 rounded-2xl border border-border-muted space-y-4 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">palette</span>
          <h2 className="text-base font-bold text-text-primary">Appearance & Visual Theme System</h2>
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

      {/* 2. Dashboard Behavior Settings */}
      <div className="glass-panel p-6 rounded-2xl border border-border-muted space-y-4 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">tune</span>
          <h2 className="text-base font-bold text-text-primary">Dashboard Telemetry Refresh Rate</h2>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div>
            <div className="text-xs font-bold text-text-primary">Real-Time Polling Interval</div>
            <div className="text-xs text-text-muted">Controls how frequently the dashboard pulls new normalized events</div>
          </div>

          <select
            value={pollingInterval}
            onChange={(e) => setPollingInterval(Number(e.target.value))}
            className="input-cyber rounded-xl px-4 py-2 text-xs font-mono bg-surface-dim border-border-muted"
          >
            <option value={2000}>2000 ms (2 seconds - High Speed)</option>
            <option value={5000}>5000 ms (5 seconds - Normal)</option>
            <option value={10000}>10000 ms (10 seconds - Low Bandwidth)</option>
          </select>
        </div>
      </div>

      {/* 3. Security Engine Preference */}
      <div className="glass-panel p-6 rounded-2xl border border-border-muted space-y-4 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">shield_locked</span>
          <h2 className="text-base font-bold text-text-primary">Air-Gapped Copilot Security Default</h2>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div>
            <div className="text-xs font-bold text-text-primary">Enforce Air-Gapped Mode by Default</div>
            <div className="text-xs text-text-muted">
              Skips Google Gemini cloud API calls and runs 100% offline local heuristic rule engine
            </div>
          </div>

          <button
            onClick={() => setAirGapped(!airGapped)}
            className={`px-4 py-2 rounded-xl border font-mono font-bold text-xs transition-all ${
              airGapped
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-sm'
                : 'bg-surface-dim text-text-muted border-border-muted'
            }`}
          >
            {airGapped ? 'ENABLED (OFFLINE)' : 'DISABLED (LIVE AI)'}
          </button>
        </div>
      </div>

      {/* 4. Data Management & Reset */}
      <div className="glass-panel p-6 rounded-2xl border border-rose-500/30 bg-rose-500/5 space-y-4 shadow-sm">
        <div className="flex items-center gap-2 text-rose-400">
          <span className="material-symbols-outlined text-xl">delete_forever</span>
          <h2 className="text-base font-bold">Data Management & Incident State Reset</h2>
        </div>
        <p className="text-xs text-text-muted">
          Clears all normalized JSONL event files in storage and resets active incident tracking state. Raw audit log files remain intact.
        </p>

        {resetMessage && (
          <div className="p-3 rounded-lg bg-surface-dim border border-border-muted text-xs font-mono text-primary">
            {resetMessage}
          </div>
        )}

        <div>
          {!showConfirmReset ? (
            <button
              onClick={() => setShowConfirmReset(true)}
              className="px-4 py-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40 text-xs font-bold hover:bg-rose-500 hover:text-white transition-all"
            >
              Clear All Normalized Telemetry Data
            </button>
          ) : (
            <div className="p-4 rounded-xl bg-surface border border-rose-500/40 space-y-3">
              <div className="text-xs font-bold text-rose-400">
                Are you sure? This will delete all normalized event JSONL files!
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleResetData}
                  disabled={isResetting}
                  className="px-4 py-2 rounded-lg bg-rose-500 text-white font-bold text-xs"
                >
                  {isResetting ? 'Clearing...' : 'Confirm Clear Data'}
                </button>
                <button
                  onClick={() => setShowConfirmReset(false)}
                  className="btn-secondary px-4 py-2 rounded-lg text-xs font-bold"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
