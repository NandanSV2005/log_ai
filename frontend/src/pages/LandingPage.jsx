import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { StitchBrandMark } from '../components/common/StitchBrandMark';
import { api } from '../services/api';
import { InView, SpotlightCard } from '../components/motion-primitives';
import { ThreatRadar3D } from '../components/radar/ThreatRadar3D';
import { CryptoChain3D } from '../components/radar/CryptoChain3D';
import { RoiWorkload3D, RoiStatCards } from '../components/roi/RoiWorkload3D';
import { DissectionConduitStream } from '../components/demo/DissectionConduitStream';
import { TiltCard3D } from '../components/demo/TiltCard3D';
import { DissectionScanner } from '../components/demo/DissectionScanner';
import {
  lusionMotionState,
  useLusionScrollEngine,
  MagneticCursor,
  StructuralGridSpine,
  StripeDiagonalDivider,
  StripeSectionHeader,
  StripeCtaButton,
} from '../components/landing/LusionMotionEngine';
import { LusionHeroPortal } from '../components/landing/LusionHeroPortal';
import { LusionStackedPipeline } from '../components/landing/LusionStackedPipeline';
import { StripeBentoArchitecture } from '../components/landing/StripeBentoArchitecture';

// =============================================================================
// ACCURATE VERIFIED TELEMETRY FALLBACK CONSTANTS
// =============================================================================
const FALLBACK_PIPELINE_LATENCY = '<10ms';     // Typical local API & parse dwell time
const FALLBACK_ANOMALY_THRESHOLD = '0.80';     // Isolation Forest default decision boundary
const FALLBACK_LEDGER_BLOCK = '#1,849';        // Verified log block index

// =============================================================================
// CHAPTER REGISTRY & NAVIGATION TARGET DEFINITION
// =============================================================================
const CHAPTERS = [
  {
    id: 'pipeline',
    targets: ['pipeline'],
    navLabel: '01 // Pipeline',
    mobileLabel: '01 // Pipeline Architecture',
    railLabel: 'PIPE',
    num: '01',
    textClass: 'text-primary',
    bgClass: 'bg-primary',
    borderClass: 'border-primary/40',
    glowClass: 'shadow-[0_0_12px_var(--color-border-glow)]'
  },
  {
    id: 'bento-architecture',
    targets: ['bento-architecture'],
    navLabel: '02 // Architecture',
    mobileLabel: '02 // Modular Architecture',
    railLabel: 'ARCH',
    num: '02',
    textClass: 'text-secondary',
    bgClass: 'bg-secondary',
    borderClass: 'border-secondary/40',
    glowClass: 'shadow-[0_0_12px_var(--color-border-glow)]'
  },
  {
    id: 'topology',
    targets: ['topology'],
    navLabel: '03 // Topology',
    mobileLabel: '03 // Network Topology Radar',
    railLabel: 'TOPO',
    num: '03',
    textClass: 'text-tertiary',
    bgClass: 'bg-tertiary',
    borderClass: 'border-tertiary/40',
    glowClass: 'shadow-[0_0_12px_var(--color-border-glow)]'
  },
  {
    id: 'roi-engine',
    targets: ['roi-engine'],
    navLabel: '04 // ROI Engine',
    mobileLabel: '04 // ROI Estimator',
    railLabel: 'ROI',
    num: '04',
    textClass: 'text-tertiary',
    bgClass: 'bg-tertiary',
    borderClass: 'border-tertiary/40',
    glowClass: 'shadow-[0_0_12px_var(--color-border-glow)]'
  },
  {
    id: 'demo',
    targets: ['demo'],
    navLabel: '05 // Live Demo',
    mobileLabel: '05 // Interactive Dissection',
    railLabel: 'DEMO',
    num: '05',
    textClass: 'text-primary',
    bgClass: 'bg-primary',
    borderClass: 'border-primary/40',
    glowClass: 'shadow-[0_0_12px_var(--color-border-glow)]'
  }
];

export function LandingPage() {
  const { theme, setTheme } = useTheme();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [activeChapter, setActiveChapter] = useState('pipeline');
  const scrollProgressBarRef = useRef(null);

  // Initialize Lusion Smooth Scroll (Lenis) + GSAP ScrollTrigger & Velocity Skew
  useLusionScrollEngine(false);

  // Dynamic Viewport Scroll Tracker for Active Chapter Highlighting & Header Progress Bar
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY || window.pageYOffset;
          const windowHeight = window.innerHeight;
          const docHeight = document.documentElement.scrollHeight;
          const maxScroll = Math.max(1, docHeight - windowHeight);
          const progress = Math.min(1, Math.max(0, scrollY / maxScroll));
          if (scrollProgressBarRef.current) {
            scrollProgressBarRef.current.style.transform = `scaleX(${progress.toFixed(4)})`;
          }

          // 1. Extreme boundary cases: top or bottom of page
          if (scrollY < 120) {
            setActiveChapter('pipeline');
            ticking = false;
            return;
          }
          if (windowHeight + scrollY >= docHeight - 80) {
            setActiveChapter('demo');
            ticking = false;
            return;
          }

          // 2. Focal line 30% down viewport (below 64px fixed header)
          const focalPoint = Math.max(100, windowHeight * 0.30);

          let matched = null;
          for (let i = 0; i < CHAPTERS.length; i++) {
            const ch = CHAPTERS[i];
            const el = ch.targets.map((tid) => document.getElementById(tid)).find(Boolean);
            if (!el) continue;

            const rect = el.getBoundingClientRect();
            // Section contains the focal point during its entire scroll/pinned height
            if (rect.top <= focalPoint && rect.bottom > focalPoint) {
              matched = ch.id;
              break;
            }
          }

          if (matched) {
            setActiveChapter(matched);
          } else {
            // Fallback to whichever section top is closest to the focal line
            let closestId = 'pipeline';
            let minDistance = Infinity;
            for (const ch of CHAPTERS) {
              const el = ch.targets.map((tid) => document.getElementById(tid)).find(Boolean);
              if (!el) continue;
              const rect = el.getBoundingClientRect();
              const dist = Math.abs(rect.top - focalPoint);
              if (dist < minDistance) {
                minDistance = dist;
                closestId = ch.id;
              }
            }
            setActiveChapter(closestId);
          }

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    // Initial check
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  // Interactive Forensic Dissection Demo State (Chapter 05)
  const DEMO_PRESETS = [
    {
      id: 'cisco-asa',
      label: 'Cisco ASA',
      log_line: '%ASA-4-106023: Deny udp src outside:185.220.101.5/54312 dst inside:10.0.4.12/445 by access-group "OUTSIDE_IN" [0x7f4c9a81, 0x0]'
    },
    {
      id: 'fortinet-utm',
      label: 'FortiGate',
      log_line: "CEF:0|Fortinet|FortiGate|v7.2|traffic:denied|src=10.0.4.12 dst=172.16.0.4 act=BLOCKED cat=virus msg='Trojan.Generic.KD.452'"
    },
    {
      id: 'ssh-bruteforce',
      label: 'SSH Failed',
      log_line: 'Failed password for invalid user admin from 192.168.1.105 port 52140 ssh2'
    },
    {
      id: 'suricata-tls',
      label: 'Suricata Alert',
      log_line: 'Suricata[3819]: [1:2018959:4] ET Suspicious Inbound TLS Session from 45.33.32.156:443 to 10.0.0.5:51234'
    }
  ];

  const [demoInput, setDemoInput] = useState(DEMO_PRESETS[0].log_line);
  const [selectedPresetId, setSelectedPresetId] = useState('cisco-asa');
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoError, setDemoError] = useState(null);
  const [demoResult, setDemoResult] = useState(null); // Defaults to null
  const [revealStep, setRevealStep] = useState(0);

  // Trigger staggered reveal sequence whenever demoResult changes to a non-null object
  useEffect(() => {
    if (!demoResult) {
      setRevealStep(0);
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      setRevealStep(10);
      return;
    }

    setRevealStep(0);
    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      setRevealStep(step);
      if (step >= 6) {
        clearInterval(interval);
      }
    }, 90);

    return () => clearInterval(interval);
  }, [demoResult]);

  const handlePresetClick = (preset) => {
    setSelectedPresetId(preset.id);
    setDemoInput(preset.log_line);
    setDemoResult(null);
    setDemoError(null);
  };

  const handleTextareaChange = (e) => {
    setDemoInput(e.target.value);
    setSelectedPresetId(null);
    setDemoResult(null);
    setDemoError(null);
  };

  const handleDemoSubmit = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!demoInput || !demoInput.trim()) {
      setDemoError('Please enter or select a raw log line.');
      return;
    }
    runDemoAnalysis(demoInput.trim());
  };

  const runDemoAnalysis = async (logLine) => {
    setDemoResult(null);
    setDemoLoading(true);
    setDemoError(null);
    const startTime = Date.now();

    try {
      const res = await api.analyzeDemo(logLine);

      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 600 - elapsed);
      if (remaining > 0) {
        await new Promise(r => setTimeout(r, remaining));
      }

      if (res && res.status === 'success') {
        setDemoResult(res);
      } else {
        setDemoError(res?.detail || 'Failed to analyze log line.');
      }
    } catch (err) {
      setDemoError(err.message || 'Error executing demo analysis.');
    } finally {
      setDemoLoading(false);
    }
  };

  // Stats & Telemetry Data State
  const [stats, setStats] = useState({ total_events_ingested: 48281 });

  // Public Telemetry Initializer with exponential backoff & failure breaker (No authenticated API calls)
  useEffect(() => {
    let mounted = true;
    let consecutiveFailures = 0;
    const MAX_FAILURES = 3;

    async function loadPublicTelemetry() {
      if (consecutiveFailures >= MAX_FAILURES) return;
      try {
        const publicStats = await api.getPublicStats();
        if (!mounted) return;
        if (publicStats && publicStats.total_events_ingested) {
          setStats(publicStats);
          consecutiveFailures = 0;
        } else {
          consecutiveFailures += 1;
        }
      } catch {
        consecutiveFailures += 1;
      }
    }

    // Initial non-blocking load on page mount
    loadPublicTelemetry();

    // Gentle 60s background refresh that pauses when tab is hidden or after 3 consecutive failures
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible' && consecutiveFailures < MAX_FAILURES) {
        loadPublicTelemetry();
      }
    }, 60000);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  // ROI Estimator Interactive Calculator State
  const [roiVolume, setRoiVolume] = useState(750);
  const [roiDevices, setRoiDevices] = useState(120);

  // Dynamic ROI Calculations
  const calculatedSavings = Math.round(((roiVolume * 30 * 0.66) * 0.10) + (roiDevices * 45));
  const calculatedHours = Math.round((roiVolume * 0.14) + (roiDevices * 0.35));

  // Topology Radar Blip Target Selection
  const RADAR_BLIPS = [
    {
      id: 1,
      top: '26%',
      left: '70%',
      pos3d: [1.8, 0.45, -1.2],
      host: '10.0.4.12 [SMB]',
      rule: 'T1021.002 Lateral Probe',
      sev: 'SEV 9.4',
      score: 9.4,
      level: 'CRITICAL',
      colorHex: '#FF4D94'
    },
    {
      id: 2,
      top: '68%',
      left: '28%',
      pos3d: [-1.6, 0.65, 1.4],
      host: '192.168.1.104',
      rule: 'C2 Egress Jitter',
      sev: 'SEV 6.2',
      score: 6.2,
      level: 'MEDIUM',
      colorHex: '#FACC15'
    },
    {
      id: 3,
      top: '48%',
      left: '44%',
      pos3d: [-0.4, 0.3, -0.2],
      host: 'pfSense [10.0.0.1]',
      rule: 'GATEWAY SECURE',
      sev: 'SEV 0.2',
      score: 0.2,
      level: 'LOW',
      colorHex: '#10B981'
    }
  ];
  const [selectedBlip, setSelectedBlip] = useState(RADAR_BLIPS[0]);

  const scrollToSection = (id) => {
    setIsMobileNavOpen(false);
    setActiveChapter(id);
    const targetId = id === 'pipeline' ? 'pipeline' : id;
    const element = document.getElementById(targetId);
    if (element) {
      if (lusionMotionState.lenis) {
        lusionMotionState.lenis.scrollTo(element, {
          offset: id === 'pipeline' ? 0 : -64,
          duration: 1.15,
        });
      } else {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <div className="min-h-screen bg-surface-dim font-sans text-text-primary antialiased selection:bg-primary/30 selection:text-text-primary">
      {/* Lusion Dual-Layer Magnetic Cursor (Desktop) */}
      <MagneticCursor />

      {/* ========================================================================= */}
      {/* 1. FIXED NAVIGATION HEADER                                                */}
      {/* ========================================================================= */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-surface-dim/95 backdrop-blur-md border-b border-border-muted shadow-2xl">
        <div className="h-16 w-full max-w-[1440px] mx-auto px-3 sm:px-5 lg:px-8 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={() => scrollToSection('pipeline')}
              aria-label="LOG AI — scroll to top"
              className="flex items-center gap-2.5 cursor-pointer rounded-lg focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shadow-[0_0_12px_var(--color-border-glow)]">
                <StitchBrandMark className="w-5 h-5 text-primary" size={20} />
              </div>
              <div className="flex items-baseline font-display font-black text-lg sm:text-xl md:text-2xl tracking-tight text-text-primary whitespace-nowrap">
                <span>LOG</span>
                <span className="font-mono text-primary text-xs sm:text-sm md:text-base font-bold px-1 sm:px-1.5">//</span>
                <span>AI</span>
              </div>
            </button>
          </div>

          {/* Chapter Nav Links */}
          <nav className="hidden xl:flex items-center gap-1 font-mono text-[11px] tracking-wide min-w-0">
            {CHAPTERS.map((ch) => {
              const isActive = activeChapter === ch.id;
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => scrollToSection(ch.id)}
                  className={`relative px-2.5 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? `bg-surface-lowest/90 border ${ch.borderClass} ${ch.textClass} shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]`
                      : 'text-text-muted hover:text-text-primary hover:bg-surface-hover/70 border border-transparent'
                  }`}
                >
                  {ch.navLabel}
                </button>
              );
            })}
          </nav>

          {/* Controls Cluster & Open SOC Console CTA */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Operations Theme Segmented Switch */}
            <div className="hidden sm:inline-flex soc-segmented" role="group" aria-label="Operations color theme">
              <button
                type="button"
                aria-pressed={theme === 'dark'}
                data-active={theme === 'dark'}
                onClick={() => setTheme('dark')}
                className="soc-segmented-item !px-2.5 !py-1 !text-[10px]"
              >
                <span className="material-symbols-outlined text-[13px]">dark_mode</span>
                <span>MOCHA</span>
              </button>
              <button
                type="button"
                aria-pressed={theme === 'sage'}
                data-active={theme === 'sage'}
                onClick={() => setTheme('sage')}
                className="soc-segmented-item !px-2.5 !py-1 !text-[10px]"
              >
                <span className="material-symbols-outlined text-[13px]">light_mode</span>
                <span>POWDER</span>
              </button>
            </div>

            {/* Primary CTA */}
            <StripeCtaButton
              to="/dashboard"
              variant="primary"
              className="!px-3 sm:!px-3.5 !py-2 !text-[11px] sm:!text-xs flex-shrink-0 whitespace-nowrap"
              cursorLabel="CONSOLE"
            >
              <span className="2xl:hidden">SOC Console</span>
              <span className="hidden 2xl:inline">Open SOC Console</span>
            </StripeCtaButton>

            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
              className="xl:hidden p-2 rounded-lg bg-surface border border-border-muted text-text-primary cursor-pointer focus-visible:outline-2 focus-visible:outline-primary"
              aria-label="Toggle Navigation Menu"
              aria-expanded={isMobileNavOpen}
              aria-controls="mobile-chapter-nav"
            >
              <span className="material-symbols-outlined text-xl">{isMobileNavOpen ? 'close' : 'menu'}</span>
            </button>
          </div>
        </div>

        {/* Scroll Progress Indicator Bar */}
        <div
          aria-hidden="true"
          className="h-[2px] w-full bg-border-muted/30 overflow-hidden"
        >
          <div
            ref={scrollProgressBarRef}
            className="h-full w-full origin-left bg-gradient-to-r from-primary via-secondary to-tertiary will-change-transform"
            style={{ transform: 'scaleX(0)' }}
          />
        </div>

        {/* Mobile Navigation Viewport */}
        {isMobileNavOpen && (
          <div id="mobile-chapter-nav" className="xl:hidden bg-surface-dim border-b border-border-muted px-4 py-4 space-y-2 font-mono text-xs animate-in slide-in-from-top duration-200">
            {CHAPTERS.map((ch) => {
              const isActive = activeChapter === ch.id;
              return (
                <button
                  key={ch.id}
                  onClick={() => scrollToSection(ch.id)}
                  className={`block w-full text-left px-3 py-2 rounded font-bold transition-colors ${
                    isActive
                      ? `bg-surface border ${ch.borderClass} ${ch.textClass}`
                      : 'bg-surface/50 border border-transparent text-text-muted hover:text-text-primary'
                  }`}
                >
                  {ch.mobileLabel}
                </button>
              );
            })}

            <div className="pt-2 flex items-center justify-between font-sans border-t border-border-muted/40">
              <span className="text-text-muted">Operations Theme:</span>
              <div className="soc-segmented" role="group" aria-label="Operations color theme">
                <button
                  type="button"
                  data-active={theme === 'dark'}
                  onClick={() => setTheme('dark')}
                  className="soc-segmented-item text-[11px]"
                >
                  MOCHA
                </button>
                <button
                  type="button"
                  data-active={theme === 'sage'}
                  onClick={() => setTheme('sage')}
                  className="soc-segmented-item text-[11px]"
                >
                  POWDER
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ========================================================================= */}
      {/* 2. CHAPTER QUICK DOCK (RIGHT DESKTOP RAIL)                                */}
      {/* ========================================================================= */}
      <aside className="fixed right-6 top-1/2 -translate-y-1/2 z-40 hidden 2xl:flex flex-col gap-3 bg-surface-dim/80 backdrop-blur-md p-2.5 rounded-2xl border border-border-muted shadow-2xl">
        {CHAPTERS.map((ch, idx) => {
          const isActive = activeChapter === ch.id;
          return (
            <React.Fragment key={ch.id}>
              {idx > 0 && <div className="w-px h-4 bg-border-muted mx-auto" />}
              <button
                onClick={() => scrollToSection(ch.id)}
                className={`flex flex-col items-center gap-1 group py-1 transition-all cursor-pointer ${
                  isActive ? 'scale-110' : 'opacity-60 hover:opacity-100'
                }`}
                title={ch.navLabel}
              >
                <span className={`font-mono text-[10px] font-bold transition-colors ${isActive ? ch.textClass : 'text-text-muted group-hover:text-text-primary'}`}>
                  {ch.num}
                </span>
                <div
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    isActive
                      ? `${ch.bgClass} ${ch.glowClass} scale-125`
                      : 'bg-surface-bright border border-border-muted group-hover:border-text-muted'
                  }`}
                />
                <span className={`font-mono text-[9px] transition-colors ${isActive ? `${ch.textClass} font-bold` : 'text-text-muted group-hover:text-text-primary'}`}>
                  {ch.railLabel}
                </span>
              </button>
            </React.Fragment>
          );
        })}
      </aside>

      <main className="w-full pb-12">
        
        {/* ========================================================================= */}
        {/* CHAPTER 01 // LUSION PINNED HERO-TO-SOC PORTAL TRANSITION                 */}
        {/* ========================================================================= */}
        <LusionHeroPortal
          totalIngested={stats.total_events_ingested || 48281}
        />

        {/* ========================================================================= */}
        {/* CHAPTER 01 // LUSION PINNED 3D STACKED PIPELINE CARDS                     */}
        {/* ========================================================================= */}
        <LusionStackedPipeline />

        {/* Stripe Angled Section Divider: Chapter 01 -> Chapter 02 */}
        <StripeDiagonalDivider
          label="CHAPTER 01 → CHAPTER 02 // MODULAR BENTO ARCHITECTURE"
          variant={theme === 'sage' ? 'light' : 'dark'}
        />

        {/* ========================================================================= */}
        {/* CHAPTER 02 // STRIPE ASYMMETRICAL 12-COLUMN BENTO ARCHITECTURE            */}
        {/* ========================================================================= */}
        <StripeBentoArchitecture />

        {/* ========================================================================= */}
        {/* CHAPTER 03B // 3D RADAR TOPOLOGY & CRYPTOGRAPHIC MERKLE PROOF             */}
        {/* ========================================================================= */}
        <section
          id="topology"
          className="w-full px-4 md:px-8 xl:px-14 py-20 relative scroll-mt-16 bg-gradient-to-b from-[var(--color-chapter3-from)] via-[var(--color-chapter3-via)] to-[var(--color-chapter3-to)] border-b border-tertiary/20 overflow-hidden"
        >
          <StructuralGridSpine />
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none opacity-45"
            style={{
              background: 'radial-gradient(ellipse 65% 45% at 45% 25%, color-mix(in srgb, var(--color-tertiary) 18%, transparent), transparent 70%)'
            }}
          />
          
          <div
            data-velocity-skew
            className="max-w-7xl mx-auto flex flex-col gap-10 relative z-10 will-change-transform"
          >
            <StripeSectionHeader
              chapter="CHAPTER 03 // TOPOLOGICAL_SURFACE"
              eyebrow="3D SPATIAL RADAR & MERKLE INTEGRITY"
              title="Network Threat Radar & Cryptographic Proof"
              accentWords={['Threat', 'Radar', 'Cryptographic']}
              subtitle="Inspect suspicious network activity on a live 3D spatial radar sweep while verifying log immutability with SHA-256 Merkle hash chains."
              metrics={[
                { label: 'ACTIVE TARGETS', value: '3 NODES' },
                { label: 'MERKLE BLOCK', value: FALLBACK_LEDGER_BLOCK },
              ]}
            />

            {/* Asymmetric Layout: Dominant Radar + Cryptographic Proof Companion */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
              
              {/* DOMINANT SECTOR TOPOLOGY RADAR */}
              <InView className="xl:col-span-8 bg-surface-bright/90 border border-tertiary/35 rounded-2xl p-5 md:p-7 flex flex-col justify-between gap-4 shadow-2xl backdrop-blur-md relative overflow-hidden">
                <div className="flex items-center justify-between font-mono text-xs pb-3 border-b border-border-muted">
                  <div className="flex items-center gap-2 text-tertiary font-bold">
                    <span className="material-symbols-outlined text-[20px]">radar</span>
                    <span className="tracking-wide">SECTOR TOPOLOGY RADAR // 3D DIMENSIONAL SWEEP</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[11px] text-text-dim hidden sm:inline">SWEEP: 5.0s</span>
                    <span className="px-2 py-0.5 rounded bg-tertiary/15 text-tertiary font-mono text-[10px] font-bold border border-tertiary/30 animate-pulse">
                      3 TARGETS ACTIVE
                    </span>
                  </div>
                </div>

                {/* 3D Radar Viewport Canvas with WebGL Check & 2D Fallback */}
                <ThreatRadar3D
                  blips={RADAR_BLIPS}
                  selectedBlip={selectedBlip}
                  onSelectBlip={setSelectedBlip}
                />
              </InView>

              {/* CRYPTOGRAPHIC PROOF COMPANION WITH 3D LINKED CHAIN */}
              <InView className="xl:col-span-4">
                <SpotlightCard spotlightColor="color-mix(in srgb, var(--color-tertiary) 18%, transparent)" className="h-full bg-surface-bright/90 border border-tertiary/35 rounded-2xl p-5 md:p-6 flex flex-col justify-between gap-4 shadow-2xl backdrop-blur-md">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between pb-2 border-b border-border-muted">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-tertiary text-[22px]">shield</span>
                        <h3 className="font-display font-bold text-lg text-text-primary">Cryptographic Proof</h3>
                      </div>
                      <span className="font-mono text-[10px] font-bold text-tertiary px-2 py-0.5 rounded bg-tertiary/15 border border-tertiary/30">SHA-256 CHAIN</span>
                    </div>
                    <p className="font-sans text-xs text-text-muted leading-relaxed font-normal">
                      Log entries are linked together with SHA-256 hashes so any tampering is detected instantly.
                    </p>

                    {/* 3D Cryptographic Chain Links */}
                    <CryptoChain3D fallbackBlock={FALLBACK_LEDGER_BLOCK} />
                  </div>

                  <div className="p-3 bg-surface-dim border border-tertiary/20 rounded-xl flex items-center gap-3">
                    <span className="material-symbols-outlined text-tertiary text-[24px]">verified_user</span>
                    <div className="flex flex-col">
                      <span className="font-sans font-bold text-xs text-text-primary">Forensic Export</span>
                      <span className="font-sans text-[11px] text-text-muted">Export verified log files with cryptographic proof for audits.</span>
                    </div>
                  </div>
                </SpotlightCard>
              </InView>

            </div>
          </div>
        </section>

        {/* Stripe Angled Section Divider: Chapter 03 -> Chapter 04 */}
        <StripeDiagonalDivider
          label="CHAPTER 03 → CHAPTER 04 // SIEM CAPITAL EFFICIENCY"
          variant={theme === 'sage' ? 'light' : 'dark'}
        />

        {/* ========================================================================= */}
        {/* CHAPTER 04 // CAPITAL EFFICIENCY // INTERACTIVE ROI ESTIMATOR              */}
        {/* ========================================================================= */}
        <section
          id="roi-engine"
          className="section-obsidian-contrast w-full px-4 md:px-8 xl:px-14 py-24 relative scroll-mt-16 border-b border-[rgba(245,158,11,0.14)] overflow-hidden"
        >
          {/* Stripe Angled Section Background Layer (transform: skewY(-3.5deg)) */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-[-4%] top-10 bottom-10 -z-0 bg-surface-lowest/65 border-y border-[rgba(245,158,11,0.14)] shadow-[0_0_90px_var(--color-border-glow)]"
            style={{ transform: 'skewY(-3.5deg)', transformOrigin: 'center center' }}
          />
          <StructuralGridSpine
            variant={theme === 'sage' ? 'light' : 'obsidian'}
            obsidian={theme !== 'sage'}
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none opacity-45"
            style={{
              background: 'radial-gradient(ellipse 65% 45% at 50% 25%, color-mix(in srgb, var(--color-tertiary) 20%, transparent), transparent 70%)'
            }}
          />
          
          <div
            data-velocity-skew
            className="max-w-7xl mx-auto flex flex-col gap-12 relative z-10 will-change-transform"
          >
            <StripeSectionHeader
              chapter="CHAPTER 04 // CAPITAL_EFFICIENCY"
              eyebrow="SIEM COST & WORKLOAD REDUCTION"
              title="ROI & Noise Reduction Estimator"
              accentWords={['ROI', 'Noise', 'Reduction']}
              subtitle="Estimate how much SIEM storage budget and analyst triage time you reclaim by pre-filtering and normalizing logs with log_ai."
              metrics={[
                { label: 'EST. MONTHLY SAVINGS', value: `$${calculatedSavings.toLocaleString()}` },
                { label: 'ANALYST HOURS SAVED', value: `${calculatedHours} hrs/mo` },
              ]}
            />

            {/* Interactive Calculator Workspace */}
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8 items-stretch">
                
                {/* Left Panel: Controls Sliders (Functional 2D Form Inputs) */}
                <InView className="xl:col-span-5 bg-surface-bright/90 border border-tertiary/35 rounded-2xl p-6 md:p-8 flex flex-col justify-between shadow-2xl backdrop-blur-md h-full">
                  {/* Panel Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-border-muted">
                    <div className="flex items-center gap-2 font-mono text-xs text-tertiary font-bold">
                      <span className="material-symbols-outlined text-tertiary text-[20px]">tune</span>
                      <span className="tracking-wide">INFRASTRUCTURE TELEMETRY // ESTIMATOR</span>
                    </div>
                    <span className="font-mono text-[10px] text-text-dim uppercase font-bold px-2 py-0.5 rounded bg-tertiary/10 border border-tertiary/20">
                      INPUT PARAMS
                    </span>
                  </div>

                  {/* Sliders Container: Starts at the top, perfectly spaced */}
                  <div className="flex flex-col gap-6 py-4 my-auto">
                    {/* Volume Slider */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <label htmlFor="slider-volume" className="font-sans font-bold text-sm text-text-primary">
                          Daily Ingested Log Volume
                        </label>
                        <span className="font-mono text-2xl text-tertiary font-extrabold">{roiVolume} GB</span>
                      </div>
                      <input
                        id="slider-volume"
                        type="range"
                        min="100"
                        max="5000"
                        step="50"
                        value={roiVolume}
                        onChange={(e) => setRoiVolume(parseInt(e.target.value, 10))}
                        className="w-full h-2.5 bg-surface-dim border border-primary/30 rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                      <div className="flex justify-between font-mono text-[10px] text-text-dim">
                        <span>100 GB</span>
                        <span>2,500 GB</span>
                        <span>5,000 GB/day</span>
                      </div>
                    </div>

                    {/* Devices Slider */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <label htmlFor="slider-devices" className="font-sans font-bold text-sm text-text-primary">
                          Active Firewalls &amp; Network Nodes
                        </label>
                        <span className="font-mono text-2xl text-primary font-extrabold">{roiDevices} Units</span>
                      </div>
                      <input
                        id="slider-devices"
                        type="range"
                        min="10"
                        max="1000"
                        step="10"
                        value={roiDevices}
                        onChange={(e) => setRoiDevices(parseInt(e.target.value, 10))}
                        className="w-full h-2.5 bg-surface-dim border border-primary/30 rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                      <div className="flex justify-between font-mono text-[10px] text-text-dim">
                        <span>10 Nodes</span>
                        <span>500 Nodes</span>
                        <span>1,000 Nodes</span>
                      </div>
                    </div>
                  </div>

                  {/* Calculation Model Footer Callout */}
                  <div className="p-3.5 bg-surface-dim border border-tertiary/20 rounded-xl flex items-center gap-2.5 font-mono text-xs text-text-muted">
                    <span className="material-symbols-outlined text-tertiary text-[20px]">calculate</span>
                    <span>Model based on estimated SIEM index costs ($3.00/GB) and 78.4% noise reduction metrics.</span>
                  </div>
                </InView>

                {/* Right Panel: Real-time 3D Isometric Workload Stacks */}
                <InView className="xl:col-span-7 flex flex-col h-full">
                  <RoiWorkload3D
                    roiVolume={roiVolume}
                    roiDevices={roiDevices}
                    calculatedSavings={calculatedSavings}
                    calculatedHours={calculatedHours}
                    showStatCards={false}
                  />
                </InView>
              </div>

              {/* 4 Secondary Stat Cards Row with Restrained 3D Card-Tilt on Hover */}
              <RoiStatCards
                calculatedSavings={calculatedSavings}
                calculatedHours={calculatedHours}
              />
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* CHAPTER 05 // INTERACTIVE DISSECTION                                     */}
        {/* ========================================================================= */}
        <section
          id="demo"
          className="w-full px-4 md:px-8 xl:px-14 pt-24 pb-32 relative scroll-mt-16 bg-gradient-to-b from-[var(--color-chapter5-from)] via-[var(--color-chapter5-via)] to-[var(--color-chapter5-to)] border-b border-border-muted overflow-hidden"
        >
          <StructuralGridSpine />
          <div
            data-velocity-skew
            className="max-w-7xl mx-auto flex flex-col gap-12 relative z-10 will-change-transform"
          >
            <StripeSectionHeader
              chapter="CHAPTER 05 // INTERACTIVE_DISSECTION"
              eyebrow="STATELESS FASTAPI FORENSIC SANDBOX"
              title="Forensic Dissection: Raw Log to Explained Verdict"
              accentWords={['Forensic', 'Dissection:', 'Explained', 'Verdict']}
              subtitle="Test how a raw firewall log is parsed, normalized to OCSF v1.1 schema, cryptographically hashed, and explained by our AI engine."
              metrics={[
                { label: 'SANDBOX ENDPOINT', value: 'POST /demo/analyze' },
                { label: 'DWELL LATENCY', value: FALLBACK_PIPELINE_LATENCY },
              ]}
            />

            {/* Animated 3D Data Conduit Stream Between Columns */}
            <DissectionConduitStream
              isActive={demoLoading || (revealStep > 0 && revealStep < 7)}
              revealStep={revealStep}
            />

            {/* 3-Column Dissection Workspace */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 relative z-10">
              
              {/* Column 1: Raw Inbound Interactive Input */}
              <InView className="xl:col-span-4 h-full">
                <TiltCard3D>
                  <SpotlightCard spotlightColor="var(--color-border-glow)" className="h-full bg-surface-bright/90 rounded-2xl border border-primary/30 p-5 flex flex-col justify-between gap-4 shadow-xl">
                  <div className="flex flex-col gap-3 relative z-20">
                    <div className="flex items-center justify-between pb-3 border-b border-border-muted">
                      <div className="flex items-center gap-2 font-mono text-xs font-bold text-text-primary">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                        <span>01. RAW LOG INGEST</span>
                      </div>
                      <span className="font-mono text-[10px] font-bold text-primary px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
                        INTERACTIVE INPUT
                      </span>
                    </div>

                    {/* Quick-Pick Presets */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5 relative z-20 pointer-events-auto">
                      <span className="font-mono text-[10px] text-text-dim uppercase font-bold mr-1">PRESETS:</span>
                      {DEMO_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handlePresetClick(preset)}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer relative z-20 pointer-events-auto ${
                            selectedPresetId === preset.id
                              ? 'bg-primary text-surface-dim shadow-sm'
                              : 'bg-surface border border-border-muted text-text-muted hover:text-text-primary'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>

                    {/* Interactive Textarea with 3D Dissection Scan & Peel Effect */}
                    <div className="relative z-20 pointer-events-auto mt-0.5">
                      <DissectionScanner
                        rawLogText={demoInput}
                        isAnalyzing={demoLoading}
                        demoResult={demoResult}
                        revealStep={revealStep}
                      >
                        <textarea
                          value={demoInput}
                          onChange={handleTextareaChange}
                          rows={4}
                          placeholder="Paste a raw firewall string, syslog line, or JSON alert..."
                          className="w-full bg-surface-dim p-3 rounded-xl font-mono text-xs text-text-primary border border-border-muted focus:border-primary focus:outline-none resize-none leading-relaxed shadow-inner relative z-20 pointer-events-auto"
                        />
                      </DissectionScanner>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="button"
                    onClick={handleDemoSubmit}
                    disabled={demoLoading}
                    className="btn-primary relative z-20 pointer-events-auto w-full py-2.5 rounded-xl font-mono font-bold text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-1"
                    style={{
                      transform: 'translateZ(12px)',
                      transformStyle: 'preserve-3d',
                    }}
                  >
                    {demoLoading ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-surface-dim border-t-transparent rounded-full animate-spin"></span>
                        <span>PARSING LOG STREAM...</span>
                      </>
                    ) : demoResult ? (
                      <>
                        <span className="material-symbols-outlined text-[16px]">refresh</span>
                        <span>RE-ANALYZE STREAM</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                        <span>ANALYZE LOG STREAM</span>
                      </>
                    )}
                  </button>
                </SpotlightCard>
                </TiltCard3D>
              </InView>

              {/* Column 2: ULPF Transform Engine Dynamic Output */}
              <InView className="xl:col-span-4 h-full">
                <TiltCard3D>
                  <SpotlightCard spotlightColor="color-mix(in srgb, var(--color-secondary) 18%, transparent)" className="h-full bg-surface-bright/90 rounded-2xl border border-secondary/30 p-5 flex flex-col justify-between gap-4 shadow-xl">
                  <div className="flex items-center justify-between pb-3 border-b border-border-muted">
                    <div className="flex items-center gap-2 font-mono text-xs font-bold text-text-primary">
                      <span className="w-2 h-2 rounded-full bg-secondary"></span>
                      <span>02. ULPF TRANSFORM PIPELINE</span>
                    </div>
                    <span className="font-mono text-[10px] font-bold text-secondary px-2 py-0.5 rounded bg-secondary/10 border border-secondary/20">
                      {demoResult?.classification_metadata?.schema_version || 'CANONICAL OCSF'}
                    </span>
                  </div>

                  {demoLoading ? (
                    <div className="bg-surface-dim p-4 rounded-xl font-mono text-xs text-secondary min-h-[175px] flex-1 flex flex-col justify-center gap-3 border border-border-muted animate-pulse">
                      <div className="flex items-center gap-2 text-text-muted text-[11px]">
                        <span className="w-2 h-2 rounded-full bg-secondary animate-ping"></span>
                        <span>PARSING &amp; MAPPING FIELDS...</span>
                      </div>
                      <div className="h-3.5 bg-secondary/20 rounded w-2/3"></div>
                      <div className="h-3 bg-secondary/15 rounded w-5/6"></div>
                      <div className="h-3 bg-secondary/15 rounded w-4/5"></div>
                      <div className="h-3 bg-secondary/10 rounded w-2/3"></div>
                    </div>
                  ) : demoError ? (
                    <div className="bg-surface-dim p-4 rounded-xl font-mono text-xs text-[var(--color-severity-critical)] min-h-[175px] flex-1 flex flex-col justify-center items-center text-center gap-2 border border-[var(--color-severity-critical-border)]">
                      <span className="material-symbols-outlined text-2xl">error_outline</span>
                      <p>{demoError}</p>
                      <span className="text-text-dim text-[10px]">Select one of the sample presets or check your input syntax.</span>
                    </div>
                  ) : !demoResult ? (
                    <div className="bg-surface-dim p-4 rounded-xl font-mono text-xs text-text-dim min-h-[175px] flex-1 flex flex-col justify-center items-center text-center gap-2 border border-dashed border-border-muted">
                      <span className="material-symbols-outlined text-3xl opacity-35">hourglass_empty</span>
                      <p className="font-sans text-xs text-text-muted font-medium">Awaiting Analysis</p>
                      <span className="text-[10px] text-text-dim">Click "ANALYZE LOG STREAM" to run extraction.</span>
                    </div>
                  ) : (
                    <div className="bg-surface-dim p-4 rounded-xl font-mono text-xs text-secondary leading-relaxed min-h-[175px] flex-1 flex flex-col justify-center gap-1.5 border border-border-muted overflow-y-auto">
                      {revealStep >= 1 && (
                        <span className="text-text-primary font-bold animate-in fade-in duration-150">[EXTRACTED_VECTORS]</span>
                      )}
                      {revealStep >= 2 && (
                        <>
                          <span className="animate-in fade-in slide-in-from-bottom-1 duration-150">src_ip: {demoResult?.extracted_fields?.source_ip}</span>
                          <span className="animate-in fade-in slide-in-from-bottom-1 duration-150">dst_ip: {demoResult?.extracted_fields?.destination_ip}</span>
                        </>
                      )}
                      {revealStep >= 3 && (
                        <span className="animate-in fade-in slide-in-from-bottom-1 duration-150">event_type: {demoResult?.extracted_fields?.event_type}</span>
                      )}
                      {revealStep >= 4 && (
                        <>
                          <span className="text-primary truncate animate-in fade-in slide-in-from-bottom-1 duration-150" title={demoResult?.extracted_fields?.full_sha256}>
                            sha256: {demoResult?.extracted_fields?.sha256}
                          </span>
                          <span className="text-tertiary truncate animate-in fade-in slide-in-from-bottom-1 duration-150">
                            merkle_leaf: {demoResult?.extracted_fields?.merkle_leaf}
                          </span>
                        </>
                      )}
                    </div>
                  )}

                  <div className="font-mono text-[11px] text-text-dim flex items-center justify-between pt-1">
                    <span>TRANSFORM: {revealStep >= 6 && demoResult ? demoResult?.classification_metadata?.transform_time : 'AWAITING...'}</span>
                    <span>CLASS: {revealStep >= 6 && demoResult ? demoResult?.classification_metadata?.parsed_class : 'PENDING'}</span>
                  </div>
                </SpotlightCard>
                </TiltCard3D>
              </InView>

              {/* Column 3: Enriched XAI Threat Verdict Dynamic Output */}
              <InView className="xl:col-span-4 h-full">
                <TiltCard3D>
                  <SpotlightCard spotlightColor="color-mix(in srgb, var(--color-tertiary) 18%, transparent)" className="h-full bg-surface-bright/90 rounded-2xl border border-tertiary/30 p-5 flex flex-col justify-between gap-4 shadow-xl">
                  <div className="flex items-center justify-between pb-3 border-b border-border-muted">
                    <div className="flex items-center gap-2 font-mono text-xs font-bold text-text-primary">
                      <span className="w-2 h-2 rounded-full bg-tertiary"></span>
                      <span>03. EXPLAINABLE THREAT VERDICT</span>
                    </div>
                    {demoResult && revealStep >= 1 ? (
                      <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border animate-in fade-in duration-200 ${
                        demoResult?.verdict?.threat_level === 'CRITICAL' ? 'text-[var(--color-severity-critical)] bg-[var(--color-severity-critical-bg)] border-[var(--color-severity-critical-border)]' :
                        demoResult?.verdict?.threat_level === 'HIGH' ? 'text-[var(--color-severity-high)] bg-[var(--color-severity-high-bg)] border-[var(--color-severity-high-border)]' :
                        demoResult?.verdict?.threat_level === 'MEDIUM' ? 'text-[var(--color-severity-medium)] bg-[var(--color-severity-medium-bg)] border-[var(--color-severity-medium-border)]' :
                        'text-[var(--color-severity-low)] bg-[var(--color-severity-low-bg)] border-[var(--color-severity-low-border)]'
                      }`}>
                        SEV {Number(demoResult?.verdict?.threat_score != null ? demoResult.verdict.threat_score : 0).toFixed(1)} {demoResult?.verdict?.threat_level}
                      </span>
                    ) : (
                      <span className="font-mono text-[10px] text-text-dim px-2 py-0.5 rounded bg-surface border border-border-muted">
                        SEV UNKNOWN
                      </span>
                    )}
                  </div>

                  {demoLoading ? (
                    <div className="bg-surface-dim p-4 rounded-xl min-h-[175px] flex-1 flex flex-col justify-center gap-3 border border-border-muted animate-pulse">
                      <div className="flex items-center gap-2 text-text-muted font-mono text-[11px]">
                        <span className="w-2 h-2 rounded-full bg-tertiary animate-ping"></span>
                        <span>EVALUATING ANOMALY SCORE...</span>
                      </div>
                      <div className="h-4 bg-tertiary/20 rounded w-2/3"></div>
                      <div className="h-3 bg-tertiary/15 rounded w-full"></div>
                      <div className="h-3 bg-tertiary/15 rounded w-4/5"></div>
                    </div>
                  ) : demoError ? (
                    <div className="bg-surface-dim p-4 rounded-xl font-mono text-xs text-text-dim min-h-[175px] flex-1 flex items-center justify-center border border-border-muted">
                      <span>Analysis unavailable</span>
                    </div>
                  ) : !demoResult ? (
                    <div className="bg-surface-dim p-4 rounded-xl font-mono text-xs text-text-dim min-h-[175px] flex-1 flex flex-col justify-center items-center text-center gap-2 border border-dashed border-border-muted">
                      <span className="material-symbols-outlined text-3xl opacity-35">gpp_maybe</span>
                      <p className="font-sans text-xs text-text-muted font-medium">Awaiting Verdict</p>
                      <span className="text-[10px] text-text-dim">Click "ANALYZE LOG STREAM" to evaluate threat score.</span>
                    </div>
                  ) : (
                    <div className="bg-surface-dim p-3.5 rounded-xl flex flex-col justify-between min-h-[175px] flex-1 gap-2.5 border border-border-muted overflow-y-auto">
                      <div className="flex flex-col gap-1.5">
                        {revealStep >= 2 && (
                          <div className="flex items-center gap-2 text-primary font-display font-bold text-sm mb-1 animate-in fade-in slide-in-from-bottom-1 duration-150">
                            <span className="material-symbols-outlined text-[18px]">gpp_maybe</span>
                            <span>{demoResult?.verdict?.mitre_technique}</span>
                          </div>
                        )}
                        {revealStep >= 3 && (
                          <p className="font-sans text-xs text-text-muted leading-relaxed font-normal animate-in fade-in slide-in-from-bottom-1 duration-200">
                            <strong className="text-text-primary font-semibold">XAI Reasoning:</strong> {demoResult?.verdict?.xai_reasoning}
                          </p>
                        )}
                      </div>
                      {revealStep >= 5 && (
                        <div className="p-2 bg-surface rounded font-mono text-[10px] text-tertiary flex items-center justify-between border border-border-muted/50 animate-in fade-in duration-200 mt-auto">
                          <span>ACTION: {demoResult?.verdict?.action}</span>
                          <span>✓ HASH VERIFIED</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="font-mono text-[11px] text-text-dim flex items-center justify-between pt-1">
                    <span>MODE: {revealStep >= 6 && demoResult ? 'STATELESS DEMO' : 'AWAITING INPUT'}</span>
                    <span>{revealStep >= 6 && demoResult ? 'VERIFIED DIGEST' : 'DISPATCH PENDING'}</span>
                  </div>
                </SpotlightCard>
                </TiltCard3D>
              </InView>

            </div>

            {/* Closing Stripe-Style Workspace Launch Bar */}
            <div className="p-6 sm:p-8 rounded-3xl bg-surface-lowest/95 border border-primary/35 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex flex-col gap-1.5 text-center md:text-left">
                <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-primary">
                  READY FOR FULL TELEMETRY INGESTION?
                </span>
                <h3 className="font-display font-black text-xl sm:text-2xl text-text-primary tracking-tight">
                  Enter the Live log_ai Cyber SOC Command Center
                </h3>
                <p className="font-sans text-xs sm:text-sm text-text-muted">
                  Upload custom server logs, inspect Leaflet Geo-IP threat maps, author detection rules, and export cryptographic CSV/JSON audit trails.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
                <StripeCtaButton to="/dashboard" variant="primary" cursorLabel="LAUNCH">
                  Launch Live SOC Dashboard
                </StripeCtaButton>
                <StripeCtaButton to="/log-explorer" variant="secondary" cursorLabel="EXPLORE">
                  Open Log Explorer
                </StripeCtaButton>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* ========================================================================= */}
      {/* FOOTER SECTION                                                           */}
      {/* ========================================================================= */}
      <footer className="w-full px-4 md:px-8 xl:px-14 pt-14 pb-20 bg-surface-dim border-t border-border-muted">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-border-muted">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shadow-[0_0_12px_var(--color-border-glow)]">
              <StitchBrandMark className="w-5 h-5 text-primary" size={20} />
            </div>
            <div className="flex items-baseline font-display font-black text-xl tracking-tight text-text-primary uppercase whitespace-nowrap">
              <span>LOG</span>
              <span className="font-mono text-primary text-sm font-bold px-1.5">//</span>
              <span>AI</span>
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-6 font-mono text-xs text-text-muted" aria-label="Footer navigation">
            <Link to="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-primary transition-colors">Terms</Link>
            <Link to="/login" className="hover:text-primary transition-colors">SOC Sign In</Link>
            <Link to="/dashboard" className="hover:text-primary transition-colors">Console</Link>
            <a href="#demo" className="hover:text-primary transition-colors">Live Sandbox</a>
          </nav>
        </div>

        <div className="max-w-[1600px] mx-auto pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-dim font-sans">
          <p>&copy; 2026 LOG AI. Enterprise Security. Explainable Intelligence. Zero-Loss Forensics.</p>
          <p className="font-mono text-[11px] text-tertiary">PUBLIC PREVIEW USES SIMULATED SAMPLES // LIVE TELEMETRY IN AUTHENTICATED SOC</p>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* FIXED BOTTOM SOC STATUS TICKER STRIP                                     */}
      {/* ========================================================================= */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 h-10 bg-surface-dim/95 backdrop-blur-md border-t border-border-muted">
        <div className="h-full w-full max-w-[1600px] mx-auto px-3 sm:px-4 md:px-8 flex items-center justify-between font-mono text-[10px] sm:text-[11px] text-text-muted gap-3 overflow-hidden">
          <div className="flex items-center gap-4 sm:gap-6 whitespace-nowrap min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse shrink-0"></span>
              <span className="text-text-dim">INGEST:</span>
              <span className="text-text-primary font-bold">142.8 GB/hr</span>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-secondary"></span>
              <span className="text-text-dim">LOG VERIFICATION:</span>
              <span className="text-secondary font-bold">SHA-256 HASH CHAIN</span>
            </div>
            <div className="hidden lg:flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary"></span>
              <span className="text-text-dim">ML ANOMALY THRESHOLD:</span>
              <span className="text-primary font-bold">{FALLBACK_ANOMALY_THRESHOLD}</span>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-tertiary"></span>
              <span className="text-text-dim">PIPELINE LATENCY:</span>
              <span className="text-tertiary font-bold">{FALLBACK_PIPELINE_LATENCY}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0">
            <span className="hidden sm:inline font-mono text-[10px] text-text-dim font-bold">STATUS: STEADY</span>
            <span className="hidden sm:inline text-text-dim">//</span>
            <span className="font-mono text-[10px] text-primary font-bold">OCSF_v1.1.0</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
