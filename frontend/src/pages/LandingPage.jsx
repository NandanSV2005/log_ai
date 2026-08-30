import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

export function LandingPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col font-sans">
      {/* Header Nav */}
      <header className="w-full h-20 border-b border-border-muted bg-surface/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-container border border-border-muted flex items-center justify-center text-primary shadow-sm">
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                security
              </span>
            </div>
            <span className="font-extrabold text-xl tracking-tight text-text-primary">LOG AI</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'sage' : 'dark')}
              className="px-3 py-1.5 rounded-lg border border-border-muted bg-surface-container text-xs font-mono font-bold flex items-center gap-2 hover:border-primary transition-all"
            >
              <span className="material-symbols-outlined text-sm">palette</span>
              <span>{theme === 'dark' ? 'CYBER VOID (DARK)' : 'SAGE GREEN'}</span>
            </button>
            <Link
              to="/login"
              className="btn-secondary px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
            >
              Sign In
            </Link>
            <Link
              to="/dashboard"
              className="btn-primary px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
            >
              <span>Command Center</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-16 flex flex-col items-center justify-center text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-mono font-bold uppercase tracking-wider mb-6">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Zero-Loss Sovereign AI Telemetry & Forensics</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl leading-tight mb-6">
          Autonomous Log Normalization & Real-Time Incident Correlation Engine
        </h1>

        <p className="text-lg sm:text-xl text-text-muted max-w-2xl mb-10 leading-relaxed">
          High-performance security log ingestion powered by OCSF 1.1 standard schemas, client-side WebCrypto Merkle audit chains, and air-gapped Explainable AI (XAI) feature attribution.
        </p>

        <div className="flex flex-wrap justify-center gap-4 mb-16">
          <Link
            to="/dashboard"
            className="btn-primary px-8 py-4 rounded-xl text-base font-extrabold flex items-center gap-3 shadow-lg hover:scale-105 transition-all"
          >
            <span className="material-symbols-outlined">dashboard</span>
            <span>Launch SOC Dashboard</span>
          </Link>
          <Link
            to="/login"
            className="btn-secondary px-8 py-4 rounded-xl text-base font-bold flex items-center gap-3"
          >
            <span className="material-symbols-outlined">lock</span>
            <span>Operator Authentication</span>
          </Link>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left mt-8">
          <div className="glass-panel p-6 rounded-2xl border border-border-muted">
            <div className="w-12 h-12 rounded-xl bg-primary/15 text-primary border border-primary/30 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-2xl">verified</span>
            </div>
            <h3 className="text-lg font-bold text-text-primary mb-2">Merkle Hash Audit Trail</h3>
            <p className="text-sm text-text-muted leading-relaxed">
              Cryptographic SHA-256 hash chains guarantee absolute payload integrity and detect deliberate log tampering with zero false positives.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-border-muted">
            <div className="w-12 h-12 rounded-xl bg-primary/15 text-primary border border-primary/30 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-2xl">psychology</span>
            </div>
            <h3 className="text-lg font-bold text-text-primary mb-2">Explainable AI (XAI)</h3>
            <p className="text-sm text-text-muted leading-relaxed">
              Real-time anomaly scoring with transparent feature attribution breakdown (connection velocity, entropy, port scan heuristics).
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-border-muted">
            <div className="w-12 h-12 rounded-xl bg-primary/15 text-primary border border-primary/30 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-2xl">shield_locked</span>
            </div>
            <h3 className="text-lg font-bold text-text-primary mb-2">100% Air-Gapped Ready</h3>
            <p className="text-sm text-text-muted leading-relaxed">
              Dual-mode operations allow seamless switching between live cloud Gemini 3.6 LLM and a 100% offline local SOC heuristic engine.
            </p>
          </div>
        </div>
      </main>

      <footer className="w-full py-6 border-t border-border-muted bg-surface-dim text-center text-text-dim text-xs font-mono">
        © 2026 LOG AI Security Engine. Authorized SOC Personnel Only.
      </footer>
    </div>
  );
}
