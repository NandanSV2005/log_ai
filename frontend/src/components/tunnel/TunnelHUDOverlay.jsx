import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CHECKPOINTS } from './TunnelCheckpointGates';

const STAGE_DETAILS = [
  {
    id: 1,
    badge: 'STAGE 01 // ASYNC INGEST',
    title: 'Raw Ingestion Engine',
    desc: 'Receives raw activity streams from servers, firewalls, and network endpoints.',
    footer: 'CAPACITY: HIGH-THROUGHPUT BUFFER',
    packetState: 'RAW UNSTRUCTURED SYSLOG STREAM',
    themeColor: 'primary'
  },
  {
    id: 2,
    badge: 'STAGE 02 // LEXICAL PARSER',
    title: 'Lexical Field Parser',
    desc: 'Reads messy log text and breaks it into clear fields like timestamps, IP addresses, and actions.',
    footer: 'FORMAT: REGEX & KV EXTRACTION',
    packetState: 'TOKENIZED KEY-VALUE FIELD BLOCKS',
    themeColor: 'secondary'
  },
  {
    id: 3,
    badge: 'STAGE 03 // OCSF NORM',
    title: 'Schema Normalization',
    desc: 'Translates logs from different tools into one shared schema format (OCSF v1.1).',
    footer: 'SCHEMA: OCSF CLASS MAPPING',
    packetState: 'OCSF 1.1 CANONICAL SCHEMA CORE',
    themeColor: 'tertiary'
  },
  {
    id: 4,
    badge: 'STAGE 04 // CRYPTO LEDGER',
    title: 'SHA-256 Hashing',
    desc: 'Calculates a unique SHA-256 digital fingerprint for every log so records cannot be altered.',
    footer: 'SECURITY: SHA-256 HASH LINKED',
    packetState: 'CRYPTOGRAPHICALLY SEALED LEDGER BLOCK',
    themeColor: 'primary'
  },
  {
    id: 5,
    badge: 'STAGE 05 // ANOMALY DETECTOR',
    title: 'ML Anomaly Core',
    desc: 'Uses Machine Learning to spot suspicious behavior and rate how unusual an event is.',
    footer: 'ENGINE: NUMPY ISOLATION FOREST',
    packetState: 'SCANNED BY DECISION BOUNDARY ENSEMBLE',
    themeColor: 'secondary'
  },
  {
    id: 6,
    badge: 'STAGE 06 // EXPLAINABLE VERDICT',
    title: 'XAI Verdict Output',
    desc: 'Explains in plain English why an alert triggered and maps it to MITRE ATT&CK guidelines.',
    footer: 'OUTPUT: MITRE ATT&CK ANNOTATED',
    packetState: 'VERIFIED HIGH-CONFIDENCE INCIDENT VERDICT',
    themeColor: 'tertiary'
  }
];

export function TunnelHUDOverlay({
  progress = 0,
  stats = {},
  onJumpToStage,
  onSkipToSources
}) {
  // Determine active stage index (0 to 5)
  let activeIndex = 0;
  if (progress < 0.16) activeIndex = 0;
  else if (progress < 0.33) activeIndex = 1;
  else if (progress < 0.50) activeIndex = 2;
  else if (progress < 0.67) activeIndex = 3;
  else if (progress < 0.84) activeIndex = 4;
  else activeIndex = 5;

  const currentStage = STAGE_DETAILS[activeIndex];
  const isHeroState = progress < 0.12;

  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-4 md:p-8 xl:p-12 overflow-hidden">
      {/* Top HUD Status Bar */}
      <header className="w-full flex items-center justify-between gap-4 pointer-events-auto">
        <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-surface/85 border border-primary/30 backdrop-blur-md shadow-lg font-mono text-[11px]">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          <span className="font-bold text-primary tracking-wider uppercase">3D TUNNEL ENGINE // LIVE</span>
          <span className="text-text-dim">|</span>
          <span className="text-text-muted hidden sm:inline">
            Z-TRAVERSAL: {(progress * 100).toFixed(0)}%
          </span>
        </div>

        {/* Stage Scrubber Quick Jump Pills */}
        <nav className="hidden lg:flex items-center gap-1.5 p-1 rounded-full bg-surface-dim/85 border border-border-muted backdrop-blur-md shadow-lg" aria-label="Tunnel Stage Navigation">
          {CHECKPOINTS.map((cp, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={cp.id}
                onClick={() => onJumpToStage && onJumpToStage(idx)}
                className={`px-2.5 py-1 rounded-full font-mono text-[10px] font-bold transition-all ${
                  isActive
                    ? 'bg-primary text-surface-dim shadow-sm scale-105'
                    : 'text-text-dim hover:text-text-primary hover:bg-surface-hover'
                }`}
                title={`Jump to Stage ${cp.number}: ${cp.title}`}
              >
                {cp.number} {cp.title}
              </button>
            );
          })}
        </nav>

        {/* Quick Bypass Button */}
        <button
          onClick={onSkipToSources}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface/80 hover:bg-surface-hover border border-border-muted text-text-muted hover:text-text-primary font-mono text-xs transition-colors backdrop-blur-md"
        >
          <span>Skip to 2D Content</span>
          <span className="material-symbols-outlined text-[15px]">arrow_downward</span>
        </button>
      </header>

      {/* Middle Center / Left Overlay */}
      <div className="w-full max-w-7xl mx-auto my-auto relative pointer-events-none">
        {/* HERO TITLE NARRATIVE (Fades out as user scrolls past 0.12) */}
        <AnimatePresence>
          {isHeroState && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35 }}
              className="max-w-2xl flex flex-col gap-5 pointer-events-auto bg-surface/75 lg:bg-transparent p-6 lg:p-0 rounded-2xl backdrop-blur-md lg:backdrop-blur-none border border-border-muted lg:border-none shadow-xl lg:shadow-none"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface-bright/80 border border-primary/30 rounded-full w-fit">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                <span className="font-mono text-[11px] font-bold text-primary uppercase tracking-wider">
                  00 // UNIVERSAL LOG PRE-PROCESSING FRAMEWORK
                </span>
              </div>

              <h1 className="font-display font-black text-3xl sm:text-5xl lg:text-6xl text-text-primary uppercase tracking-tight leading-[1.08] drop-shadow-sm">
                Understand what your systems are doing.
              </h1>

              <p className="font-sans text-sm sm:text-base text-text-muted leading-relaxed font-normal">
                Collect raw security logs from any firewall or server. Watch the 3D log packet transform through six validation checkpoints as you scroll down the neural pipeline corridor.
              </p>

              {/* KPI Strip */}
              <div className="grid grid-cols-3 gap-2.5 pt-1">
                <div className="p-3 bg-surface-lowest/85 border border-border-muted rounded-xl flex flex-col backdrop-blur-md">
                  <span className="font-mono text-[9px] font-bold text-text-dim uppercase tracking-wider">Events Ingested</span>
                  <span className="font-mono text-lg sm:text-xl text-primary font-bold mt-0.5">
                    {(stats.total_events_ingested || 48281).toLocaleString()}
                  </span>
                </div>
                <div className="p-3 bg-surface-lowest/85 border border-border-muted rounded-xl flex flex-col backdrop-blur-md">
                  <span className="font-mono text-[9px] font-bold text-text-dim uppercase tracking-wider">Latency</span>
                  <span className="font-mono text-lg sm:text-xl text-secondary font-bold mt-0.5">&lt;10ms</span>
                </div>
                <div className="p-3 bg-surface-lowest/85 border border-border-muted rounded-xl flex flex-col backdrop-blur-md">
                  <span className="font-mono text-[9px] font-bold text-text-dim uppercase tracking-wider">Ledger Hash</span>
                  <span className="font-mono text-lg sm:text-xl text-tertiary font-bold mt-0.5">SHA-256</span>
                </div>
              </div>

              {/* Scroll Callout Cue */}
              <div className="flex items-center gap-3 pt-2 text-text-muted font-mono text-xs">
                <div className="w-5 h-8 rounded-full border-2 border-primary/50 flex items-start justify-center p-1">
                  <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="w-1.5 h-1.5 rounded-full bg-primary"
                  />
                </div>
                <span className="animate-pulse text-text-primary font-semibold">Scroll down to enter 3D pipeline tunnel &rarr;</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CHECKPOINT STAGE CARD (Fades in when scrolling past 0.12) */}
        <AnimatePresence mode="wait">
          {!isHeroState && (
            <motion.div
              key={currentStage.id}
              initial={{ opacity: 0, x: -25, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 25, scale: 0.96 }}
              transition={{ duration: 0.28 }}
              className="max-w-md pointer-events-auto p-5 md:p-6 rounded-2xl bg-surface-lowest/90 border border-border-muted shadow-2xl backdrop-blur-xl flex flex-col gap-3"
            >
              {/* Badge & Stage Number */}
              <div className="flex items-center justify-between pb-2 border-b border-border-muted font-mono text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
                  <span className="font-bold text-primary tracking-wider uppercase">
                    {currentStage.badge}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded bg-surface border border-border-muted text-text-dim font-bold">
                  STAGE {currentStage.id} OF 6
                </span>
              </div>

              {/* Stage Title & Description */}
              <div className="flex flex-col gap-1">
                <h2 className="font-display font-black text-xl md:text-2xl text-text-primary uppercase tracking-tight">
                  {currentStage.title}
                </h2>
                <p className="font-sans text-xs md:text-sm text-text-muted leading-relaxed">
                  {currentStage.desc}
                </p>
              </div>

              {/* Packet State Indicator */}
              <div className="p-2.5 rounded-xl bg-surface-dim/90 border border-border-muted flex items-center gap-2.5 font-mono text-[10px]">
                <span className="material-symbols-outlined text-[16px] text-secondary">deployed_code</span>
                <div className="flex flex-col">
                  <span className="text-text-dim font-semibold">PACKET MORPH STATE:</span>
                  <span className="text-secondary font-bold truncate">{currentStage.packetState}</span>
                </div>
              </div>

              {/* Technical Spec Footer */}
              <div className="pt-2 border-t border-border-muted flex items-center justify-between font-mono text-[10px] text-text-dim">
                <span className="text-tertiary font-bold">{currentStage.footer}</span>
                <span>TUNNEL CHECKPOINT #{currentStage.id}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Floating Scrubber Bar & Progress Indicator */}
      <footer className="w-full flex items-center justify-between gap-4 pointer-events-auto font-mono text-xs text-text-dim">
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline">PROGRESS:</span>
          <div className="w-32 sm:w-48 h-2 bg-surface-bright rounded-full overflow-hidden border border-border-muted">
            <div
              className="h-full bg-primary transition-all duration-150 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
            />
          </div>
          <span className="font-bold text-primary">{Math.round(progress * 100)}%</span>
        </div>

        {/* Mobile Stage Dots */}
        <div className="flex lg:hidden items-center gap-1.5">
          {CHECKPOINTS.map((cp, idx) => (
            <button
              key={cp.id}
              onClick={() => onJumpToStage && onJumpToStage(idx)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                idx === activeIndex ? 'bg-primary scale-125' : 'bg-surface-bright'
              }`}
              title={`Stage ${cp.number}`}
            />
          ))}
        </div>

        <div className="text-[11px] text-text-muted hidden md:inline">
          {activeIndex === 5
            ? 'Transitioning to Chapter 02: Multi-Vendor Log Sources ↓'
            : 'Scroll down to travel through next checkpoint ↓'}
        </div>
      </footer>
    </div>
  );
}
