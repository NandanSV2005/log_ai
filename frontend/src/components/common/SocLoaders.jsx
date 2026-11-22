import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { StitchBrandMark } from './StitchBrandMark';

/**
 * Concept 1: Orbital Boot / Engine Initialization Loader
 * Adapts automatically to both Mocha Brown (dark) and Powder Blue (sage) via CSS tokens.
 */
export function OrbitalBootLoader({
  isVisible = true,
  statusText = 'INITIALIZING OCSF v1.1 ENGINE',
  progress = 64,
  fullScreen = true,
  onSkip,
}) {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const onChange = (e) => setReducedMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          role="status"
          aria-live="polite"
          aria-label={statusText}
          initial={reducedMotion ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reducedMotion ? { opacity: 0 } : { opacity: 0, transition: { duration: 0.28, ease: 'easeOut' } }}
          className={`${
            fullScreen ? 'fixed inset-0 z-[200]' : 'absolute inset-0 z-40 rounded-[inherit]'
          } flex flex-col items-center justify-center bg-surface-dim/95 backdrop-blur-md px-6 select-none overflow-hidden`}
        >
          {/* Architectural Grid Backdrop */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                'linear-gradient(to right, var(--color-border) 1px, transparent 1px), linear-gradient(to bottom, var(--color-border) 1px, transparent 1px)',
              backgroundSize: '44px 44px',
            }}
          />

          <div className="relative z-10 flex flex-col items-center gap-6 max-w-sm w-full text-center">
            {/* Concentric Orbital Ring Assembly */}
            <div className="relative w-28 h-28 flex items-center justify-center">
              {/* Outer Ring */}
              <svg
                viewBox="0 0 120 120"
                className={`absolute inset-0 w-full h-full ${reducedMotion ? '' : 'animate-[spin_7s_linear_infinite]'}`}
                aria-hidden="true"
              >
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke="var(--color-border)"
                  strokeWidth="1"
                  strokeDasharray="6 6"
                />
                <path
                  d="M 60 6 A 54 54 0 0 1 114 60"
                  fill="none"
                  stroke="var(--color-primary)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <circle cx="60" cy="6" r="3" fill="var(--color-primary)" />
                <circle cx="114" cy="60" r="2.5" fill="var(--color-secondary)" />
              </svg>

              {/* Inner Counter-Rotating Ring */}
              <svg
                viewBox="0 0 120 120"
                className={`absolute inset-3 w-[calc(100%-1.5rem)] h-[calc(100%-1.5rem)] ${
                  reducedMotion ? '' : 'animate-[spin_4.5s_linear_infinite_reverse]'
                }`}
                aria-hidden="true"
              >
                <circle
                  cx="60"
                  cy="60"
                  r="48"
                  fill="none"
                  stroke="var(--color-tertiary)"
                  strokeOpacity="0.3"
                  strokeWidth="1"
                />
                <path
                  d="M 60 108 A 48 48 0 0 1 12 60"
                  fill="none"
                  stroke="var(--color-secondary)"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                />
                <circle cx="12" cy="60" r="2.5" fill="var(--color-tertiary)" />
              </svg>

              {/* Center Brand Monogram */}
              <div className="w-12 h-12 rounded-xl bg-surface-lowest border border-primary/40 shadow-[0_0_24px_var(--color-border-glow)] flex items-center justify-center text-primary">
                <StitchBrandMark size={26} />
              </div>
            </div>

            {/* Brand Title + Status */}
            <div className="space-y-2 w-full">
              <div className="font-display font-black text-lg tracking-wider text-text-primary uppercase">
                LOG <span className="font-mono text-primary">//</span> AI
              </div>
              <div className="font-mono text-[11px] font-bold tracking-widest text-text-muted uppercase">
                {statusText} <span className="text-primary">// {progress}%</span>
              </div>

              {/* Progress Track */}
              <div className="w-full h-1 rounded-full bg-surface-lowest border border-border-muted overflow-hidden mt-2">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, Math.max(8, progress))}%`,
                    background: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))',
                  }}
                />
              </div>
            </div>

            {onSkip && (
              <button
                type="button"
                onClick={onSkip}
                className="font-mono text-[10px] uppercase tracking-wider text-text-dim hover:text-primary transition-colors cursor-pointer"
              >
                Skip Intro &rarr;
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Concept 2: Forensic Ingestion & Pipeline Process Overlay
 * Displays multi-step verification progress during uploads, rule tests, and exports.
 */
export function ForensicProcessOverlay({
  isOpen = false,
  title = 'FORENSIC PIPELINE EXECUTION',
  steps = [
    '01. RAW WIRE CAPTURE',
    '02. SHA-256 MERKLE SEAL',
    '03. ISOLATION FOREST XAI',
  ],
  activeStepIndex = 1,
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          role="status"
          aria-live="polite"
          aria-label={title}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[180] flex items-center justify-center px-4 bg-black/55 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md rounded-2xl bg-surface border border-border-muted border-t-2 border-t-primary p-5 sm:p-6 shadow-2xl space-y-4 font-mono"
          >
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-border-muted">
              <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                <span>{title}</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-surface-dim border border-border-muted text-text-muted">
                SOC ENGINE
              </span>
            </div>

            {/* Animated Telemetry Waveform Bar */}
            <div className="relative h-2 w-full rounded-full bg-surface-dim border border-border-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.round(((activeStepIndex + 1) / Math.max(1, steps.length)) * 100)}%`,
                  background: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary), var(--color-tertiary))',
                }}
              />
            </div>

            {/* Sequential Pipeline Steps */}
            <div className="space-y-2 text-[11px]">
              {steps.map((label, idx) => {
                const isDone = idx < activeStepIndex;
                const isCurrent = idx === activeStepIndex;
                return (
                  <div
                    key={label}
                    className={`flex items-center justify-between gap-3 p-2.5 rounded-xl border transition-colors ${
                      isCurrent
                        ? 'bg-primary/10 border-primary/40 text-text-primary font-bold'
                        : isDone
                          ? 'bg-surface-dim border-border-muted text-[var(--color-severity-low)]'
                          : 'bg-surface-dim/50 border-border-muted/60 text-text-dim'
                    }`}
                  >
                    <span className="truncate">{label}</span>
                    <span className="shrink-0 text-[10px] uppercase">
                      {isDone ? '✓ DONE' : isCurrent ? 'PROCESSING...' : 'QUEUED'}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Concept 3: Threat Topology / Radar Preloader
 * Used inside map/3D radar viewports while resolving Geo-IP nodes or compiling WebGL shaders.
 */
export function RadarPreloader({
  label = 'CALIBRATING THREAT TOPOLOGY',
  progress = 82,
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-surface-dim/92 p-6 text-center select-none"
    >
      {/* Dot Matrix Grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-20 bg-[radial-gradient(var(--color-tertiary)_1px,transparent_1px)] [background-size:20px_20px]"
      />

      <div className="relative z-10 flex flex-col items-center gap-4 max-w-xs w-full">
        {/* Precision Radar Aperture */}
        <div className="relative w-28 h-28 rounded-full border border-border-muted bg-surface-lowest/80 flex items-center justify-center shadow-[0_0_24px_var(--color-border-glow)] overflow-hidden">
          <svg viewBox="0 0 120 120" className="w-full h-full" aria-hidden="true">
            <circle cx="60" cy="60" r="20" fill="none" stroke="var(--color-tertiary)" strokeOpacity="0.25" strokeWidth="1" />
            <circle cx="60" cy="60" r="38" fill="none" stroke="var(--color-tertiary)" strokeOpacity="0.3" strokeWidth="1" />
            <circle cx="60" cy="60" r="54" fill="none" stroke="var(--color-tertiary)" strokeOpacity="0.35" strokeWidth="1" />
            <line x1="6" y1="60" x2="114" y2="60" stroke="var(--color-border)" strokeWidth="0.75" />
            <line x1="60" y1="6" x2="60" y2="114" stroke="var(--color-border)" strokeWidth="0.75" />
            <g className="animate-radar-sweep" style={{ transformOrigin: '60px 60px' }}>
              <path d="M 60 60 L 114 60 A 54 54 0 0 0 98 22 Z" fill="var(--color-primary)" fillOpacity="0.28" />
              <line x1="60" y1="60" x2="114" y2="60" stroke="var(--color-primary)" strokeWidth="1.75" />
            </g>
          </svg>
        </div>

        <div className="w-full space-y-2 font-mono">
          <div className="text-[11px] font-bold tracking-widest text-text-primary uppercase">
            {label} <span className="text-primary">// {progress}%</span>
          </div>
          <div className="grid grid-cols-8 gap-1">
            {Array.from({ length: 8 }).map((_, i) => {
              const filled = ((i + 1) / 8) * 100 <= progress;
              return (
                <div
                  key={i}
                  className={`h-1.5 rounded-sm transition-colors ${
                    filled ? 'bg-primary' : 'bg-surface-lowest border border-border-muted'
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Subtle Inline Variant for Chapter 05 Live Dissection Sandbox
 */
export function InlineDissectionStepper({ activeStep = 1 }) {
  const steps = ['01. PARSE', '02. SHA-256 SEAL', '03. XAI VERDICT'];
  return (
    <div className="grid grid-cols-3 gap-1.5 font-mono text-[10px] w-full">
      {steps.map((s, idx) => {
        const isDone = idx < activeStep;
        const isCur = idx === activeStep;
        return (
          <div
            key={s}
            className={`px-2 py-1.5 rounded-lg border text-center truncate font-bold transition-colors ${
              isCur
                ? 'bg-primary/15 border-primary/50 text-primary animate-pulse'
                : isDone
                  ? 'bg-[var(--color-severity-low-bg)] border-[var(--color-severity-low-border)] text-[var(--color-severity-low)]'
                  : 'bg-surface border-border-muted text-text-dim'
            }`}
          >
            {s}
          </div>
        );
      })}
    </div>
  );
}
