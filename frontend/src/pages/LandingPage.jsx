import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { api } from '../services/api';

// =============================================================================
// CENTRALIZED FALLBACK / PLACEHOLDER CONSTANTS
// Highlighting SLA readouts that await dedicated backend telemetry fields.
// =============================================================================
const FALLBACK_PIPELINE_LATENCY = '0.0012s';  // P99 SLA Guarantee
const FALLBACK_MERKLE_PROOF_PCT = '100%';     // Merkle Root Enforced
const FALLBACK_SOC_LATENCY = '4.2ms';         // Real-time SOC Response Latency
const FALLBACK_ANOMALY_THRESHOLD = '99.82%';  // Isolation Forest Confidence Threshold
const FALLBACK_LEDGER_BLOCK = '#1,849,204';   // Sealed Block Height Index

export function LandingPage() {
  const { theme, setTheme } = useTheme();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Stats & Telemetry Data State
  const [stats, setStats] = useState({ total_events_ingested: 48281 });
  const [recentEvents, setRecentEvents] = useState([
    {
      id: 'evt-01',
      timestamp: '2026-09-08 11:42:01',
      event_type: 'cisco_asa:deny:outside_acl',
      action: 'BLOCKED',
      source_ip: '185.220.101.5',
      destination_ip: '10.0.4.12',
      threat_level: 'CRITICAL',
      threat_score: 9.4,
      original_event: '%ASA-4-106023: Deny udp src outside:185.220.101.5/54312 dst inside:10.0.4.12/445 by access-group "OUTSIDE_IN" [0x7f4c9a81, 0x0]',
      raw_event_hash: 'c29d18b4fa8001a4e9b98a3e7'
    },
    {
      id: 'evt-02',
      timestamp: '2026-09-08 11:41:58',
      event_type: 'fortinet:utm:virus',
      action: 'BLOCKED',
      source_ip: '10.0.4.12',
      destination_ip: '172.16.0.4',
      threat_level: 'HIGH',
      threat_score: 8.2,
      original_event: 'CEF:0|Fortinet|FortiGate|v7.2|traffic:denied|src=10.0.4.12 dst=172.16.0.4',
      raw_event_hash: '8f3c49e28ba709320e1d9a'
    },
    {
      id: 'evt-03',
      timestamp: '2026-09-08 11:41:52',
      event_type: 'suricata:alert:tls',
      action: 'PASS',
      source_ip: '192.168.1.104',
      destination_ip: '10.0.0.1',
      threat_level: 'LOW',
      threat_score: 1.2,
      original_event: 'pf: rule 42/(match) pass in on igb0: 192.168.1.104 -> 10.0.0.1:80',
      raw_event_hash: '4ea94dfb19a3d9dc8c7ec7'
    }
  ]);

  // Fetch real telemetry data from API
  useEffect(() => {
    let mounted = true;
    async function loadLiveData() {
      try {
        const [statsRes, eventsRes] = await Promise.all([
          api.getStats().catch(() => null),
          api.getRecentEvents(10).catch(() => null)
        ]);
        if (!mounted) return;
        if (statsRes?.total_events_ingested) {
          setStats(statsRes);
        }
        if (eventsRes?.events && eventsRes.events.length > 0) {
          setRecentEvents(eventsRes.events);
        }
      } catch (err) {
        // Fallback state retained on error
      }
    }
    loadLiveData();
    const timer = setInterval(loadLiveData, 3000);
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
      host: '10.0.4.12 [SMB]',
      rule: 'T1021.002 Lateral Probe',
      sev: 'SEV 9.4',
      score: 9.4,
      level: 'CRITICAL',
      colorClass: 'text-[var(--color-severity-critical)] border-[var(--color-severity-critical-border)] bg-[#160c0e]/95'
    },
    {
      id: 2,
      top: '68%',
      left: '28%',
      host: '192.168.1.104',
      rule: 'C2 Egress Jitter',
      sev: 'SEV 6.2',
      score: 6.2,
      level: 'MEDIUM',
      colorClass: 'text-secondary border-secondary/50 bg-[#0a1824]/95'
    },
    {
      id: 3,
      top: '48%',
      left: '44%',
      host: 'pfSense [10.0.0.1]',
      rule: 'GATEWAY SECURE',
      sev: 'NORMAL',
      score: 0.2,
      level: 'LOW',
      colorClass: 'text-tertiary border-tertiary/50 bg-[#091e17]/95'
    }
  ];
  const [selectedBlip, setSelectedBlip] = useState(RADAR_BLIPS[0]);

  const scrollToSection = (id) => {
    setIsMobileNavOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-surface-dim font-sans text-text-primary antialiased selection:bg-primary/30 selection:text-text-primary">
      
      {/* ========================================================================= */}
      {/* 1. FIXED NAVIGATION HEADER                                                */}
      {/* ========================================================================= */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-surface-dim/90 backdrop-blur-xl border-b border-border-muted shadow-2xl">
        <div className="h-16 w-full max-w-[1600px] mx-auto px-4 md:px-8 flex items-center justify-between">
          
          {/* Brand Logo & Status Indicator */}
          <div className="flex items-center gap-3 md:gap-5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shadow-[0_0_12px_rgba(167,139,250,0.35)]">
              <span className="material-symbols-outlined text-[20px]">security</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-display font-black text-xl md:text-2xl text-text-primary tracking-tight uppercase">
                LOG AI
              </span>
              <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-surface-bright/80 border border-border-muted">
                <span className="w-2 h-2 rounded-full bg-tertiary animate-ping"></span>
                <span className="font-mono text-[11px] font-bold text-tertiary tracking-wider uppercase">ULPF v2.4 // ONLINE</span>
                <span className="font-mono text-[11px] text-text-muted">
                  [{(stats.total_events_ingested || 48281).toLocaleString()} eps]
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation Section Jumpers */}
          <nav className="hidden xl:flex items-center gap-1 font-mono text-[12px] tracking-wide">
            <button onClick={() => scrollToSection('pipeline')} className="px-3 py-1.5 rounded-lg bg-surface border border-primary/30 text-primary font-bold hover:bg-surface-hover transition-colors">
              01 // Pipeline
            </button>
            <button onClick={() => scrollToSection('sources')} className="px-3 py-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors">
              02 // Sources
            </button>
            <button onClick={() => scrollToSection('topology')} className="px-3 py-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors">
              03 // Topology
            </button>
            <button onClick={() => scrollToSection('roi-engine')} className="px-3 py-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors">
              04 // ROI Engine
            </button>
            <button onClick={() => scrollToSection('demo')} className="px-3 py-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors">
              05 // Live Demo
            </button>
          </nav>

          {/* Action CTAs & Theme Switcher */}
          <div className="flex items-center gap-3 md:gap-4">
            <div className="hidden md:flex items-center bg-surface-dim rounded-lg p-1 border border-border-muted">
              <button
                onClick={() => setTheme('dark')}
                className={`px-2.5 py-1 font-mono text-[11px] font-bold rounded transition-all ${
                  theme === 'dark' ? 'bg-primary text-surface-dim shadow-sm' : 'text-text-muted hover:text-text-primary'
                }`}
              >
                CYBERVOID
              </button>
              <button
                onClick={() => setTheme('sage')}
                className={`px-2.5 py-1 font-mono text-[11px] font-bold rounded transition-all ${
                  theme === 'sage' ? 'bg-primary text-surface-dim shadow-sm' : 'text-text-muted hover:text-text-primary'
                }`}
              >
                SAGE
              </button>
            </div>

            <Link
              to="/dashboard"
              className="px-4 py-2 rounded-lg bg-primary text-surface-dim font-sans font-bold text-sm shadow-[0_0_18px_rgba(167,139,250,0.45)] hover:bg-primary-fixed transition-all"
            >
              Open SOC Console
            </Link>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
              className="xl:hidden p-2 rounded-lg bg-surface border border-border-muted text-text-primary"
              aria-label="Toggle Navigation Menu"
            >
              <span className="material-symbols-outlined text-xl">{isMobileNavOpen ? 'close' : 'menu'}</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Viewport */}
        {isMobileNavOpen && (
          <div className="xl:hidden bg-surface-dim border-b border-border-muted px-4 py-4 space-y-2 font-mono text-xs animate-in slide-in-from-top duration-200">
            <button onClick={() => scrollToSection('pipeline')} className="block w-full text-left px-3 py-2 rounded bg-surface border border-border-muted text-primary font-bold">
              01 // Pipeline Architecture
            </button>
            <button onClick={() => scrollToSection('sources')} className="block w-full text-left px-3 py-2 rounded bg-surface border border-border-muted text-text-primary">
              02 // Log Sources
            </button>
            <button onClick={() => scrollToSection('topology')} className="block w-full text-left px-3 py-2 rounded bg-surface border border-border-muted text-text-primary">
              03 // Network Topology Radar
            </button>
            <button onClick={() => scrollToSection('roi-engine')} className="block w-full text-left px-3 py-2 rounded bg-surface border border-border-muted text-text-primary">
              04 // ROI Estimator
            </button>
            <button onClick={() => scrollToSection('demo')} className="block w-full text-left px-3 py-2 rounded bg-surface border border-border-muted text-text-primary">
              05 // Interactive Dissection
            </button>
            <div className="pt-2 flex items-center justify-between font-sans">
              <span className="text-text-muted">Operations Theme:</span>
              <button
                onClick={() => setTheme(theme === 'dark' ? 'sage' : 'dark')}
                className="px-3 py-1 rounded bg-primary text-surface-dim font-mono font-bold text-xs"
              >
                TOGGLE ({theme.toUpperCase()})
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ========================================================================= */}
      {/* 2. CHAPTER QUICK DOCK (RIGHT DESKTOP RAIL)                                */}
      {/* ========================================================================= */}
      <aside className="fixed right-6 top-1/2 -translate-y-1/2 z-40 hidden 2xl:flex flex-col gap-3 bg-surface-dim/80 backdrop-blur-md p-2.5 rounded-2xl border border-border-muted shadow-2xl">
        <button onClick={() => scrollToSection('pipeline')} className="flex flex-col items-center gap-1 group py-1">
          <span className="font-mono text-[10px] text-primary font-bold">01</span>
          <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(167,139,250,0.8)]"></div>
          <span className="font-mono text-[9px] text-text-muted group-hover:text-primary transition-colors">PIPE</span>
        </button>
        <div className="w-px h-4 bg-border-muted mx-auto"></div>
        <button onClick={() => scrollToSection('sources')} className="flex flex-col items-center gap-1 group py-1">
          <span className="font-mono text-[10px] text-secondary font-bold">02</span>
          <div className="w-2.5 h-2.5 rounded-full bg-secondary shadow-[0_0_8px_rgba(123,208,255,0.8)]"></div>
          <span className="font-mono text-[9px] text-text-muted group-hover:text-secondary transition-colors">SRC</span>
        </button>
        <div className="w-px h-4 bg-border-muted mx-auto"></div>
        <button onClick={() => scrollToSection('topology')} className="flex flex-col items-center gap-1 group py-1">
          <span className="font-mono text-[10px] text-tertiary font-bold">03</span>
          <div className="w-2.5 h-2.5 rounded-full bg-tertiary shadow-[0_0_8px_rgba(78,222,163,0.8)]"></div>
          <span className="font-mono text-[9px] text-text-muted group-hover:text-tertiary transition-colors">TOPO</span>
        </button>
        <div className="w-px h-4 bg-border-muted mx-auto"></div>
        <button onClick={() => scrollToSection('roi-engine')} className="flex flex-col items-center gap-1 group py-1">
          <span className="font-mono text-[10px] text-tertiary-container font-bold">04</span>
          <div className="w-2.5 h-2.5 rounded-full bg-tertiary-container"></div>
          <span className="font-mono text-[9px] text-text-muted group-hover:text-tertiary transition-colors">ROI</span>
        </button>
        <div className="w-px h-4 bg-border-muted mx-auto"></div>
        <button onClick={() => scrollToSection('demo')} className="flex flex-col items-center gap-1 group py-1">
          <span className="font-mono text-[10px] text-primary font-bold">05</span>
          <div className="w-2.5 h-2.5 rounded-full bg-primary"></div>
          <span className="font-mono text-[9px] text-text-muted group-hover:text-primary transition-colors">DEMO</span>
        </button>
      </aside>

      <main className="w-full pt-16 pb-12 flex flex-col">
        
        {/* ========================================================================= */}
        {/* HERO SECTION // ATMOSPHERIC GLOW & TELEMETRY INSTRUMENT                  */}
        {/* ========================================================================= */}
        <section className="relative w-full overflow-hidden px-4 md:px-8 xl:px-14 py-20 lg:py-24 bg-surface-dim border-b border-border-muted">
          <div className="absolute -top-40 left-1/4 w-[700px] h-[500px] bg-primary/10 rounded-full blur-[140px] pointer-events-none"></div>
          <div className="absolute top-1/3 -right-20 w-[550px] h-[450px] bg-secondary/10 rounded-full blur-[130px] pointer-events-none"></div>
          
          <div className="max-w-[1600px] mx-auto w-full grid grid-cols-1 xl:grid-cols-12 gap-10 lg:gap-12 relative z-10 items-center">
            
            {/* Left Narrative Column */}
            <div className="xl:col-span-6 flex flex-col gap-6">
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-surface-bright/80 border border-primary/30 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                  <span className="font-mono text-[11px] font-bold text-primary uppercase tracking-wider">
                    00 // UNIVERSAL LOG PRE-PROCESSING FRAMEWORK (ULPF)
                  </span>
                </div>
                <span className="font-mono text-xs text-text-dim font-semibold">v2.4-STABLE</span>
              </div>

              <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl text-text-primary uppercase tracking-tight leading-[1.08]">
                Understand what your systems are doing.
              </h1>

              <p className="font-sans text-base lg:text-lg text-text-muted max-w-xl font-normal leading-relaxed">
                Ingest chaotic, heterogeneous logs across multi-vendor firewalls and distributed edge nodes. Normalize sub-millisecond, cryptographically hash-chain every raw event with Merkle ledger guarantees, and produce explainable threat verdicts before toxic alert volume exhausts your SIEM.
              </p>

              {/* Action CTAs (Strictly 2 buttons, zero repo link) */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={() => scrollToSection('pipeline')}
                  className="px-6 py-3 rounded-xl bg-primary text-surface-dim font-sans font-bold text-sm shadow-[0_0_24px_rgba(167,139,250,0.45)] hover:bg-primary-fixed transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[19px]">account_tree</span>
                  <span>Explore ULPF Pipeline</span>
                </button>
                <button
                  onClick={() => scrollToSection('demo')}
                  className="px-6 py-3 rounded-xl bg-surface-bright hover:bg-surface-hover text-text-primary font-sans font-bold text-sm border border-border-muted transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[19px]">play_circle</span>
                  <span>Live Interactive Demo</span>
                </button>
              </div>

              {/* Diagnostic KPI Stat Strip */}
              <div className="grid grid-cols-3 gap-3 pt-4 max-w-xl">
                <div className="p-3.5 bg-surface-lowest/80 border border-border-muted rounded-xl flex flex-col">
                  <span className="font-mono text-[10px] font-bold text-text-dim uppercase tracking-wider">Ingest Speed</span>
                  <span className="font-mono text-2xl lg:text-3xl text-primary font-extrabold tracking-tight mt-1">
                    {(stats.total_events_ingested || 48281).toLocaleString()}
                  </span>
                  <span className="font-mono text-[10px] text-tertiary mt-0.5">EPS Real-Time</span>
                </div>

                <div className="p-3.5 bg-surface-lowest/80 border border-border-muted rounded-xl flex flex-col">
                  <span className="font-mono text-[10px] font-bold text-text-dim uppercase tracking-wider">Pipeline Latency</span>
                  <span className="font-mono text-2xl lg:text-3xl text-secondary font-extrabold tracking-tight mt-1">
                    {FALLBACK_PIPELINE_LATENCY}
                  </span>
                  <span className="font-mono text-[10px] text-text-dim mt-0.5">P99 SLA Guarantee</span>
                </div>

                <div className="p-3.5 bg-surface-lowest/80 border border-border-muted rounded-xl flex flex-col">
                  <span className="font-mono text-[10px] font-bold text-text-dim uppercase tracking-wider">Tamper Proof</span>
                  <span className="font-mono text-2xl lg:text-3xl text-tertiary font-extrabold tracking-tight mt-1">
                    {FALLBACK_MERKLE_PROOF_PCT}
                  </span>
                  <span className="font-mono text-[10px] text-tertiary mt-0.5">Merkle Root Enforced</span>
                </div>
              </div>
            </div>

            {/* Right HUD Stream Instrument */}
            <div className="xl:col-span-6 relative mt-4 xl:mt-0">
              <div className="relative w-full rounded-2xl bg-surface-lowest border border-border-muted p-4 md:p-6 overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-border-muted">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-severity-critical)]"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-tertiary"></span>
                    <span className="ml-2 font-mono text-xs text-text-primary font-bold tracking-wider">ULPF // INGESTION_STREAM_V2</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-primary px-2 py-0.5 rounded bg-primary/10 border border-primary/20">SHA-256 LEDGER</span>
                    <span className="font-mono text-[10px] text-tertiary font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-ping"></span> LIVE
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-[11px]">
                  {/* Inbound Raw Buffer */}
                  <div className="bg-surface-dim p-3.5 rounded-xl border border-border-muted flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-text-dim text-[10px] font-bold">
                      <span>[RAW_TELEMETRY_BUFFER]</span>
                      <span className="text-secondary">AUTO-FLUSH</span>
                    </div>
                    <div className="flex flex-col gap-1 text-text-muted font-mono text-[10px] opacity-85 pt-1">
                      <p className="text-[var(--color-severity-critical)] truncate">0x7F4A %ASA-4-106023: Deny udp src outside:185.220.101.5</p>
                      <p className="truncate">0x7F4B CEF:0|Fortinet|FortiGate|v7.2|traffic:denied|src=10.0.4.12</p>
                      <p className="text-secondary truncate">0x7F4C pf: rule 42/(match) pass in on igb0: 192.168.1.104</p>
                      <p className="truncate">0x7F4D Suricata[3819]: [1:2018959:4] ET Suspicious Inbound TLS</p>
                      <p className="text-tertiary truncate">0x7F4E {"{EventID:4624,TargetUserName:SYSTEM}"}</p>
                    </div>
                  </div>

                  {/* Canonical OCSF Output */}
                  <div className="bg-surface-dim p-3.5 rounded-xl border border-border-muted flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-text-dim text-[10px] font-bold">
                      <span>[CANONICAL_OCSF_OUTPUT]</span>
                      <span className="text-tertiary">HASH_VERIFIED</span>
                    </div>
                    <div className="flex flex-col gap-1 text-tertiary font-mono text-[10px] pt-1">
                      <p className="truncate text-primary">hash: "{recentEvents[0]?.raw_event_hash || 'c29d18b4fa8001a4e9b98a3e7'}"</p>
                      <p className="truncate text-text-primary">ocsf.class: "NETWORK_ACTIVITY"</p>
                      <p className="truncate text-[var(--color-severity-critical)]">action: "BLOCKED" | sev_score: 9.4</p>
                      <p className="truncate text-secondary">xai_verdict: "PORT_SCAN_DETECTION"</p>
                      <p className="truncate text-text-dim">sig_proof: "0x89eaf042b...verified"</p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 p-2.5 bg-surface-dim border border-border-muted rounded-xl flex items-center justify-between text-[10px] font-mono text-text-dim">
                  <span className="text-primary font-bold">01 INGEST</span>
                  <span>&rarr;</span>
                  <span className="text-secondary font-bold">02 PARSE</span>
                  <span>&rarr;</span>
                  <span className="text-tertiary font-bold">03 OCSF</span>
                  <span>&rarr;</span>
                  <span className="text-primary font-bold">04 HASH</span>
                  <span>&rarr;</span>
                  <span className="text-tertiary font-bold">05 VERDICT</span>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ========================================================================= */}
        {/* CHAPTER 01 // PIPELINE // ASYMMETRIC 6-NODE BUS & FEATURED CARD           */}
        {/* ========================================================================= */}
        <section
          id="pipeline"
          className="w-full px-4 md:px-8 xl:px-14 py-20 relative bg-gradient-to-b from-[var(--color-chapter1-from)] via-[var(--color-chapter1-via)] to-[var(--color-chapter1-to)] border-b border-primary/20"
        >
          <div className="absolute top-10 left-1/3 w-[800px] h-[550px] bg-primary/10 rounded-full blur-[160px] pointer-events-none"></div>
          
          <div className="max-w-[1600px] mx-auto flex flex-col gap-12 relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-primary uppercase tracking-widest">CHAPTER 01</span>
                  <span className="text-text-dim font-mono">//</span>
                  <span className="font-mono text-xs text-text-dim font-semibold tracking-wider">EXECUTION_SEQUENCE</span>
                </div>
                <h2 className="font-display font-black text-3xl md:text-4xl text-text-primary uppercase tracking-tight">
                  Deterministic Pipeline Architecture
                </h2>
              </div>
              <p className="font-sans text-sm md:text-base text-text-muted max-w-md leading-relaxed font-normal">
                Six non-blocking micro-stages converting unstructured socket transmissions into mathematically unalterable forensic evidence records.
              </p>
            </div>

            {/* Connected Visual Stage Diagram */}
            <div className="w-full bg-surface-lowest/90 border border-primary/30 rounded-2xl p-6 lg:p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-border-muted font-mono text-xs">
                <div className="flex items-center gap-2 text-primary font-bold">
                  <span className="material-symbols-outlined text-[18px]">account_tree</span>
                  <span>LIVE PIPELINE TOPOLOGY &amp; HIGH-THROUGHPUT STAGE BUS</span>
                </div>
                <span className="text-tertiary font-bold hidden sm:inline">P99 FLOW: {FALLBACK_PIPELINE_LATENCY} DETERMINISTIC DWELL</span>
              </div>

              <div className="relative w-full">
                <svg className="w-full h-24 hidden md:block" fill="none" preserveAspectRatio="none" viewBox="0 0 1200 80">
                  <path d="M 60 40 L 1140 40" stroke="currentColor" className="text-primary/20" strokeWidth="4"></path>
                  <path className="animate-dash-flow" d="M 60 40 L 1140 40" stroke="url(#pipeGrad)" strokeDasharray="10 14" strokeWidth="2.5"></path>
                  <defs>
                    <linearGradient id="pipeGrad" x1="0" x2="1200" y1="0" y2="0" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="var(--color-primary)"></stop>
                      <stop offset="50%" stopColor="var(--color-secondary)"></stop>
                      <stop offset="100%" stopColor="var(--color-tertiary)"></stop>
                    </linearGradient>
                  </defs>
                </svg>

                <div className="grid grid-cols-2 md:grid-cols-6 gap-3 lg:gap-4 -mt-10 relative z-10">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-xl bg-surface-dim border-2 border-primary flex items-center justify-center text-primary shadow-[0_0_16px_rgba(167,139,250,0.4)] mb-2">
                      <span className="font-mono font-black text-xs">01</span>
                    </div>
                    <span className="font-mono text-[11px] font-bold text-primary uppercase">RAW INGEST</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-xl bg-surface-dim border-2 border-secondary flex items-center justify-center text-secondary shadow-[0_0_16px_rgba(123,208,255,0.3)] mb-2">
                      <span className="font-mono font-black text-xs">02</span>
                    </div>
                    <span className="font-mono text-[11px] font-bold text-secondary uppercase">TOKENIZE</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-xl bg-surface-dim border-2 border-tertiary flex items-center justify-center text-tertiary shadow-[0_0_16px_rgba(78,222,163,0.3)] mb-2">
                      <span className="font-mono font-black text-xs">03</span>
                    </div>
                    <span className="font-mono text-[11px] font-bold text-tertiary uppercase">OCSF NORM</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-xl bg-surface-dim border-2 border-primary flex items-center justify-center text-primary shadow-[0_0_16px_rgba(167,139,250,0.4)] mb-2">
                      <span className="font-mono font-black text-xs">04</span>
                    </div>
                    <span className="font-mono text-[11px] font-bold text-primary uppercase">SHA-256 SEAL</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-xl bg-surface-dim border-2 border-secondary flex items-center justify-center text-secondary shadow-[0_0_16px_rgba(123,208,255,0.3)] mb-2">
                      <span className="font-mono font-black text-xs">05</span>
                    </div>
                    <span className="font-mono text-[11px] font-bold text-secondary uppercase">ANOMALY ML</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-xl bg-surface-dim border-2 border-tertiary flex items-center justify-center text-tertiary shadow-[0_0_16px_rgba(78,222,163,0.4)] mb-2">
                      <span className="font-mono font-black text-xs">06</span>
                    </div>
                    <span className="font-mono text-[11px] font-bold text-tertiary uppercase">XAI VERDICT</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Asymmetric Mixed Grid: Featured Primary Card (Card 1) + 5 Secondary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* Featured Primary Card: Raw Ingestion (Spans 2 columns on lg/xl) */}
              <div className="lg:col-span-2 xl:col-span-2 p-6 rounded-2xl bg-surface-bright/90 border-2 border-primary shadow-[0_0_24px_rgba(167,139,250,0.25)] flex flex-col justify-between gap-4 group">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-[28px]">input</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary font-mono text-[10px] font-bold uppercase tracking-wider">
                    FEATURED ENGINE // STAGE 01
                  </span>
                </div>
                <div>
                  <h3 className="font-display font-black text-xl text-text-primary mb-2">Raw Ingestion &amp; Non-Blocking Buffer</h3>
                  <p className="font-sans text-sm text-text-muted leading-relaxed">
                    High-throughput listeners stream unparsed packets across UDP, TCP, Syslog, eBPF, and cloud endpoints at sub-millisecond connection velocity.
                  </p>
                </div>
                <div className="pt-2 border-t border-border-muted flex items-center justify-between font-mono text-[11px] text-text-dim">
                  <span>CAPACITY: 100,000+ EPS</span>
                  <span className="text-primary font-bold">ZERO PACKET LOSS</span>
                </div>
              </div>

              {/* Secondary Cards 2 through 6 */}
              <div className="p-5 rounded-xl bg-surface/90 border border-secondary/30 hover:border-secondary transition-all flex flex-col justify-between gap-3 group">
                <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[22px]">code_blocks</span>
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-text-primary">Lexical Parse</h3>
                  <p className="font-sans text-xs text-text-muted leading-relaxed">
                    Zero-copy SIMD tokenizers rapidly parse heterogeneous key-values and RFC formats.
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-surface/90 border border-tertiary/30 hover:border-tertiary transition-all flex flex-col justify-between gap-3 group">
                <div className="w-10 h-10 rounded-lg bg-tertiary/10 flex items-center justify-center text-tertiary group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[22px]">schema</span>
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-text-primary">Schema Normalization</h3>
                  <p className="font-sans text-xs text-text-muted leading-relaxed">
                    Harmonizes disparate vendor fields into strict Open Cybersecurity Schema (OCSF v1.1).
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-surface/90 border border-primary/30 hover:border-primary transition-all flex flex-col justify-between gap-3 group">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[22px]">enhanced_encryption</span>
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-text-primary">SHA-256 Hashing</h3>
                  <p className="font-sans text-xs text-text-muted leading-relaxed">
                    Cryptographically seals every log batch into an immutable, hardware-attested Merkle ledger.
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-surface/90 border border-secondary/30 hover:border-secondary transition-all flex flex-col justify-between gap-3 group">
                <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[22px]">troubleshoot</span>
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-text-primary">ML Anomaly Core</h3>
                  <p className="font-sans text-xs text-text-muted leading-relaxed">
                    Sub-millisecond clustering instantly isolates beacon intervals and entropy spikes.
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-surface/90 border border-tertiary/30 hover:border-tertiary transition-all flex flex-col justify-between gap-3 group">
                <div className="w-10 h-10 rounded-lg bg-tertiary/10 flex items-center justify-center text-tertiary group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[22px]">psychology</span>
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-text-primary">XAI Verdict Output</h3>
                  <p className="font-sans text-xs text-text-muted leading-relaxed">
                    Emits natural-language explanations with MITRE ATT&amp;CK mappings for instant triage.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ========================================================================= */}
        {/* CHAPTER 02 // LOG SOURCES // ASYMMETRIC MULTI-VENDOR DECODER GRID         */}
        {/* ========================================================================= */}
        <section
          id="sources"
          className="w-full px-4 md:px-8 xl:px-14 py-20 relative bg-gradient-to-b from-[var(--color-chapter2-from)] via-[var(--color-chapter2-via)] to-[var(--color-chapter2-to)] border-b border-secondary/20"
        >
          <div className="absolute top-16 right-1/4 w-[750px] h-[500px] bg-secondary/10 rounded-full blur-[150px] pointer-events-none"></div>
          
          <div className="max-w-[1600px] mx-auto flex flex-col gap-12 relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-secondary uppercase tracking-widest">CHAPTER 02</span>
                  <span className="text-text-dim font-mono">//</span>
                  <span className="font-mono text-xs text-text-dim font-semibold tracking-wider">INGESTION_ECOSYSTEM</span>
                </div>
                <h2 className="font-display font-black text-3xl md:text-4xl text-text-primary uppercase tracking-tight">
                  Many Heterogeneous Sources — One Strict Conduit
                </h2>
              </div>
              <p className="font-sans text-sm md:text-base text-text-muted max-w-md leading-relaxed font-normal">
                Zero custom grok scripts required. Built-in decoders ingest raw firewall and endpoint formats natively.
              </p>
            </div>

            {/* Asymmetric Mixed Grid: Featured Source 1 (Cisco ASA) + 5 Secondary Sources */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {/* Featured Primary Source Card: Cisco ASA / FTD (Spans 2 columns on lg/xl) */}
              <div className="lg:col-span-2 xl:col-span-2 p-6 rounded-2xl bg-surface-bright/80 border-2 border-secondary shadow-[0_0_20px_rgba(123,208,255,0.25)] flex flex-col justify-between gap-4 group">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-secondary/15 flex items-center justify-center text-secondary group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[28px]">router</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-secondary/15 border border-secondary/30 text-secondary font-mono text-[10px] font-bold uppercase tracking-wider">
                    PRIMARY DECODER // HARDWARE PIPELINE
                  </span>
                </div>
                <div>
                  <h3 className="font-display font-black text-xl text-text-primary mb-2">Cisco ASA / Firepower FTD</h3>
                  <p className="font-sans text-sm text-text-muted leading-relaxed">
                    Decodes 106-series teardowns, NAT translations, VPN lifecycle events, and access-list deny records natively with zero regex overhead.
                  </p>
                </div>
                <div className="pt-2 border-t border-border-muted flex items-center justify-between font-mono text-[11px] text-text-dim">
                  <span>FORMAT: ASA SYS_LOG</span>
                  <span className="text-secondary font-bold">NATIVE FIELD EXTRACTOR</span>
                </div>
              </div>

              {/* Secondary Sources 2 through 6 */}
              <div className="p-6 rounded-xl bg-surface/80 border border-secondary/30 hover:border-secondary transition-all flex flex-col justify-between gap-3 group">
                <div className="w-11 h-11 rounded-lg bg-secondary/15 flex items-center justify-center text-secondary group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[24px]">security</span>
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-text-primary">Fortinet FortiGate</h3>
                  <p className="font-sans text-sm text-text-muted leading-relaxed">
                    Extracts UTM policies, AV signatures, IPS events, and interface bindings.
                  </p>
                </div>
              </div>

              <div className="p-6 rounded-xl bg-surface/80 border border-secondary/30 hover:border-secondary transition-all flex flex-col justify-between gap-3 group">
                <div className="w-11 h-11 rounded-lg bg-secondary/15 flex items-center justify-center text-secondary group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[24px]">troubleshoot</span>
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-text-primary">Suricata EVE-JSON</h3>
                  <p className="font-sans text-sm text-text-muted leading-relaxed">
                    Parses streaming IDS flow alerts, DNS queries, and TLS JA3/JA4 fingerprints.
                  </p>
                </div>
              </div>

              <div className="p-6 rounded-xl bg-surface/80 border border-secondary/30 hover:border-secondary transition-all flex flex-col justify-between gap-3 group">
                <div className="w-11 h-11 rounded-lg bg-secondary/15 flex items-center justify-center text-secondary group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[24px]">filter_alt</span>
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-text-primary">pfSense / FreeBSD PF</h3>
                  <p className="font-sans text-sm text-text-muted leading-relaxed">
                    Processes packet filter CSV headers, rule traces, and state table logs.
                  </p>
                </div>
              </div>

              <div className="p-6 rounded-xl bg-surface/80 border border-secondary/30 hover:border-secondary transition-all flex flex-col justify-between gap-3 group">
                <div className="w-11 h-11 rounded-lg bg-secondary/15 flex items-center justify-center text-secondary group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[24px]">desktop_windows</span>
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-text-primary">Windows EVTX</h3>
                  <p className="font-sans text-sm text-text-muted leading-relaxed">
                    Decodes Kerberos logons, privilege escalations, and Sysmon process telemetry.
                  </p>
                </div>
              </div>

              <div className="p-6 rounded-xl bg-surface/80 border border-secondary/30 hover:border-secondary transition-all flex flex-col justify-between gap-3 group">
                <div className="w-11 h-11 rounded-lg bg-secondary/15 flex items-center justify-center text-secondary group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[24px]">terminal</span>
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-text-primary">Linux Auditd / eBPF</h3>
                  <p className="font-sans text-sm text-text-muted leading-relaxed">
                    Captures deep kernel syscall executions, privilege transitions, and container namespaces.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ========================================================================= */}
        {/* CHAPTER 03 // RADAR TOPOLOGY & CRYPTO PROOF (~70% vs ~30% ASYMMETRIC SPLIT)*/}
        {/* ========================================================================= */}
        <section
          id="topology"
          className="w-full px-4 md:px-8 xl:px-14 py-20 relative bg-gradient-to-b from-[var(--color-chapter3-from)] via-[var(--color-chapter3-via)] to-[var(--color-chapter3-to)] border-b border-tertiary/20"
        >
          <div className="absolute top-10 left-1/4 w-[850px] h-[550px] bg-tertiary/10 rounded-full blur-[170px] pointer-events-none"></div>
          
          <div className="max-w-[1600px] mx-auto flex flex-col gap-10 relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-tertiary uppercase tracking-widest">CHAPTER 03</span>
                  <span className="text-text-dim font-mono">//</span>
                  <span className="font-mono text-xs text-text-dim font-semibold tracking-wider">TOPOLOGICAL_SURFACE</span>
                </div>
                <h2 className="font-display font-black text-3xl md:text-4xl text-text-primary uppercase tracking-tight">
                  Network Threat Radar &amp; Cryptographic Proof
                </h2>
              </div>
              <p className="font-sans text-sm md:text-base text-text-muted max-w-md leading-relaxed font-normal">
                Real-time coordinate tracking of anomalous network entities paired with tamper-evident Merkle ledger proofs.
              </p>
            </div>

            {/* Asymmetric Layout: Dominant Radar (~70% width) + Cryptographic Proof Companion (~30% width) */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
              
              {/* DOMINANT SECTOR TOPOLOGY RADAR (~68% - 70% width) */}
              <div className="xl:col-span-8 bg-surface-bright/90 border border-tertiary/35 rounded-2xl p-5 md:p-7 flex flex-col gap-4 shadow-2xl backdrop-blur-md relative overflow-hidden">
                <div className="flex items-center justify-between font-mono text-xs pb-3 border-b border-border-muted">
                  <div className="flex items-center gap-2 text-tertiary font-bold">
                    <span className="material-symbols-outlined text-[20px]">radar</span>
                    <span className="tracking-wide">SECTOR TOPOLOGY RADAR // AZIMUTH: 360&deg; CONTINUOUS SWEEP</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[11px] text-text-dim hidden sm:inline">SWEEP: 5.0s</span>
                    <span className="px-2 py-0.5 rounded bg-tertiary/15 text-tertiary font-mono text-[10px] font-bold border border-tertiary/30 animate-pulse">
                      2 DETECTIONS ACTIVE
                    </span>
                  </div>
                </div>

                {/* Radar Viewport Canvas */}
                <div className="relative w-full aspect-[16/10] md:aspect-[16/9] bg-surface-dim rounded-xl overflow-hidden border border-border-muted flex items-center justify-center">
                  <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#4edea3_1px,transparent_1px)] [background-size:20px_20px]"></div>

                  {/* Concentric Range Rings */}
                  <div className="absolute w-[85%] h-[85%] rounded-full border border-tertiary/20"></div>
                  <div className="absolute w-[62%] h-[62%] rounded-full border border-tertiary/30"></div>
                  <div className="absolute w-[40%] h-[40%] rounded-full border border-tertiary/40"></div>
                  <div className="absolute w-[18%] h-[18%] rounded-full border border-tertiary/50"></div>

                  {/* Degree Crosshairs */}
                  <div className="absolute w-full h-[1px] bg-tertiary/25"></div>
                  <div className="absolute h-full w-[1px] bg-tertiary/25"></div>
                  <div className="absolute w-full h-[1px] bg-tertiary/15 rotate-45"></div>
                  <div className="absolute w-full h-[1px] bg-tertiary/15 -rotate-45"></div>

                  {/* 360-Degree Rotating Sweep Beam */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-radar">
                    <div className="w-1/2 h-1/2 origin-bottom-right bg-gradient-to-br from-tertiary/30 via-tertiary/5 to-transparent"></div>
                  </div>

                  {/* Radar Target Blips */}
                  {RADAR_BLIPS.map((blip) => (
                    <div
                      key={blip.id}
                      style={{ top: blip.top, left: blip.left }}
                      onClick={() => setSelectedBlip(blip)}
                      className="absolute group cursor-pointer z-20"
                    >
                      <span className="relative flex h-5 w-5">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                          blip.level === 'CRITICAL' ? 'bg-[var(--color-severity-critical)] opacity-80' :
                          blip.level === 'MEDIUM' ? 'bg-secondary opacity-70' : 'bg-tertiary opacity-60'
                        }`}></span>
                        <span className={`relative inline-flex rounded-full h-5 w-5 border-2 border-surface-bright shadow-lg ${
                          blip.level === 'CRITICAL' ? 'bg-[var(--color-severity-critical)]' :
                          blip.level === 'MEDIUM' ? 'bg-secondary' : 'bg-tertiary'
                        }`}></span>
                      </span>

                      {/* Anchored Tooltip Card */}
                      <div className={`absolute -top-16 -left-28 border p-2.5 rounded-lg shadow-2xl w-48 font-mono text-[10px] transition-all ${blip.colorClass}`}>
                        <div className="font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping"></span>
                          <span>ANOMALY // {blip.sev}</span>
                        </div>
                        <div className="text-text-primary font-semibold">HOST: {blip.host}</div>
                        <div className="text-text-dim">{blip.rule}</div>
                      </div>
                    </div>
                  ))}

                  {/* Coordinates Overlay */}
                  <div className="absolute bottom-3 left-4 font-mono text-[11px] text-tertiary/80 font-bold bg-surface-dim/80 px-2.5 py-1 rounded border border-tertiary/20">
                    FOV: 10.0.0.0/16 // SCAN LAT: 0.0004s // SECTORS: 12
                  </div>
                  <div className="absolute top-3 right-4 font-mono text-[10px] text-text-dim">
                    GRID COORD: 34.0522&deg; N, 118.2437&deg; W
                  </div>
                </div>
              </div>

              {/* CRYPTOGRAPHIC PROOF COMPANION (~30% - 32% width) */}
              <div className="xl:col-span-4 bg-surface-bright/90 border border-tertiary/35 rounded-2xl p-5 md:p-6 flex flex-col justify-between gap-4 shadow-2xl backdrop-blur-md">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between pb-2 border-b border-border-muted">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-tertiary text-[22px]">shield</span>
                      <h3 className="font-display font-bold text-lg text-text-primary">Cryptographic Proof</h3>
                    </div>
                    <span className="font-mono text-[10px] font-bold text-tertiary px-2 py-0.5 rounded bg-tertiary/15 border border-tertiary/30">IMMUTABLE</span>
                  </div>
                  <p className="font-sans text-xs text-text-muted leading-relaxed font-normal">
                    Every millisecond batch is SHA-256 chained in hardware enclave memory. Records cannot be rewritten or dropped.
                  </p>

                  <div className="bg-surface-dim p-4 rounded-xl border border-tertiary/25 flex flex-col gap-2.5 font-mono text-[11px]">
                    <div className="flex justify-between items-center text-text-dim pb-1 border-b border-border-muted">
                      <span className="text-tertiary font-bold">LEDGER BLOCK: {FALLBACK_LEDGER_BLOCK}</span>
                      <span className="text-tertiary font-bold">SEALED</span>
                    </div>
                    <div>
                      <span className="text-text-dim text-[10px] block">PREV HASH:</span>
                      <span className="text-text-muted truncate block">0x8f3c49e28ba709320e1d...9a</span>
                    </div>
                    <div>
                      <span className="text-text-dim text-[10px] block">MERKLE ROOT:</span>
                      <span className="text-tertiary truncate block font-bold">0x4ea94dfb19a3d9dc8c7e...c7</span>
                    </div>
                    <div>
                      <span className="text-text-dim text-[10px] block">SIGNATURE:</span>
                      <span className="text-secondary truncate block">ECDSA-P256 hardware token</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-surface-dim border border-tertiary/20 rounded-xl flex items-center gap-3">
                  <span className="material-symbols-outlined text-tertiary text-[24px]">verified_user</span>
                  <div className="flex flex-col">
                    <span className="font-sans font-bold text-xs text-text-primary">Forensic Subpoena Export</span>
                    <span className="font-sans text-[11px] text-text-muted">Tamper-evident signed archives for court discovery.</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* CHAPTER 04 // CAPITAL EFFICIENCY // INTERACTIVE ROI ESTIMATOR              */}
        {/* ========================================================================= */}
        <section
          id="roi-engine"
          className="w-full px-4 md:px-8 xl:px-14 py-20 relative bg-gradient-to-b from-[var(--color-chapter4-from)] via-[var(--color-chapter4-via)] to-[var(--color-chapter4-to)] border-b border-tertiary/30"
        >
          <div className="absolute top-10 left-1/3 w-[850px] h-[500px] bg-tertiary/15 rounded-full blur-[160px] pointer-events-none"></div>
          
          <div className="max-w-[1600px] mx-auto flex flex-col gap-12 relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-tertiary uppercase tracking-widest">CHAPTER 04</span>
                  <span className="text-text-dim font-mono">//</span>
                  <span className="font-mono text-xs text-text-dim font-semibold tracking-wider">CAPITAL_EFFICIENCY</span>
                </div>
                <h2 className="font-display font-black text-3xl md:text-4xl text-text-primary uppercase tracking-tight">
                  ROI &amp; SOC Fatigue Estimator
                </h2>
              </div>
              <p className="font-sans text-sm md:text-base text-text-muted max-w-md leading-relaxed font-normal">
                Calculate the dramatic cost and hours reduction achieved by filtering noise and normalizing schema prior to SIEM ingestion.
              </p>
            </div>

            {/* Interactive Calculator Workspace */}
            <div className="p-6 lg:p-10 bg-surface-bright/90 border border-tertiary/40 rounded-2xl grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-12 items-center shadow-2xl backdrop-blur-md">
              
              {/* Controls Sliders (6 cols) */}
              <div className="xl:col-span-6 flex flex-col gap-6">
                
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
                    className="w-full h-2.5 bg-surface-dim border border-tertiary/30 rounded-lg appearance-none cursor-pointer accent-tertiary"
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

                <div className="p-3 bg-surface-dim border border-tertiary/20 rounded-xl flex items-center gap-2 font-mono text-xs text-text-muted">
                  <span className="material-symbols-outlined text-tertiary text-[20px]">calculate</span>
                  <span>Model based on SIEM index pricing ($3.00/GB) + Tier 1 SOC alert triage pace.</span>
                </div>
              </div>

              {/* Calculated Outputs (6 cols) */}
              <div className="xl:col-span-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 bg-surface-dim border border-tertiary/30 rounded-xl flex flex-col justify-between">
                  <span className="font-mono text-[10px] font-bold text-text-dim uppercase tracking-wider">Monthly SIEM Savings</span>
                  <div className="py-1">
                    <span className="font-mono text-3xl lg:text-4xl text-tertiary font-black">
                      ${calculatedSavings.toLocaleString()}
                    </span>
                    <span className="text-tertiary font-sans font-bold text-sm">/mo</span>
                  </div>
                  <span className="font-sans text-xs text-text-muted font-normal">Payload size compressed ~66%</span>
                </div>

                <div className="p-5 bg-surface-dim border border-primary/30 rounded-xl flex flex-col justify-between">
                  <span className="font-mono text-[10px] font-bold text-text-dim uppercase tracking-wider">Analyst Time Preserved</span>
                  <div className="py-1">
                    <span className="font-mono text-3xl lg:text-4xl text-primary font-black">
                      {calculatedHours.toLocaleString()}
                    </span>
                    <span className="text-primary font-sans font-bold text-sm">hrs/wk</span>
                  </div>
                  <span className="font-sans text-xs text-text-muted font-normal">Freed from triaging noise</span>
                </div>

                <div className="p-5 bg-surface-dim border border-secondary/30 rounded-xl flex flex-col justify-between">
                  <span className="font-mono text-[10px] font-bold text-text-dim uppercase tracking-wider">False Positives Filtered</span>
                  <div className="py-1">
                    <span className="font-mono text-3xl lg:text-4xl text-secondary font-black">78.4%</span>
                  </div>
                  <span className="font-sans text-xs text-text-muted font-normal">Rejected at kernel layer</span>
                </div>

                <div className="p-5 bg-surface-dim border border-border-muted rounded-xl flex flex-col justify-between">
                  <span className="font-mono text-[10px] font-bold text-text-dim uppercase tracking-wider">Payback Timeline</span>
                  <div className="py-1">
                    <span className="font-mono text-3xl lg:text-4xl text-text-primary font-black">&lt; 14</span>
                    <span className="text-text-primary font-sans font-bold text-sm">days</span>
                  </div>
                  <span className="font-sans text-xs text-text-muted font-normal">Instant drop-in deployment</span>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* CHAPTER 05 // INTERACTIVE DISSECTION // FULL THEME SUPPORT               */}
        {/* ========================================================================= */}
        <section
          id="demo"
          className="w-full px-4 md:px-8 xl:px-14 py-20 relative bg-gradient-to-b from-[var(--color-chapter5-from)] via-[var(--color-chapter5-via)] to-[var(--color-chapter5-to)] border-b border-border-muted"
        >
          <div className="max-w-[1600px] mx-auto flex flex-col gap-12 relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-primary uppercase tracking-widest">CHAPTER 05</span>
                  <span className="text-text-dim font-mono">//</span>
                  <span className="font-mono text-xs text-text-dim font-semibold tracking-wider">INTERACTIVE_DISSECTION</span>
                </div>
                <h2 className="font-display font-black text-3xl md:text-4xl text-text-primary uppercase tracking-tight">
                  Forensic Dissection: Raw In &rarr; Explained Alert Out
                </h2>
              </div>
              <p className="font-sans text-sm md:text-base text-text-muted max-w-md leading-relaxed font-normal">
                Observe how a noisy, malformed firewall string undergoes lexical parsing, Merkle proof creation, and AI explanation.
              </p>
            </div>

            {/* 3-Column Dissection Workspace */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              
              {/* Column 1: Raw Inbound */}
              <div className="xl:col-span-4 bg-surface-bright/90 rounded-2xl border border-[var(--color-severity-critical-border)] p-5 flex flex-col justify-between gap-4">
                <div className="flex items-center justify-between pb-3 border-b border-border-muted">
                  <div className="flex items-center gap-2 font-mono text-xs font-bold text-text-primary">
                    <span className="w-2 h-2 rounded-full bg-[var(--color-severity-critical)]"></span>
                    <span>01. RAW UNSTRUCTURED INGEST</span>
                  </div>
                  <span className="font-mono text-[10px] font-bold text-[var(--color-severity-critical)] px-2 py-0.5 rounded bg-[var(--color-severity-critical-bg)] border border-[var(--color-severity-critical-border)]">
                    DIRTY LOG
                  </span>
                </div>
                <div className="bg-surface-dim p-4 rounded-xl font-mono text-xs text-text-muted leading-relaxed h-52 flex flex-col justify-center border border-border-muted">
                  <p>
                    <span className="text-[var(--color-severity-critical)] font-bold">%ASA-4-106023: Deny udp src</span> outside:185.220.101.5/54312 dst inside:10.0.4.12/445 by access-group "OUTSIDE_IN" [0x7f4c9a81, 0x0]
                  </p>
                  <p className="text-text-dim text-[11px] pt-3"># Non-standard timestamp, unnormalized port string, unverified origin signature.</p>
                </div>
                <div className="font-mono text-[11px] text-text-dim flex items-center justify-between pt-1">
                  <span>SOCKET: UDP/514</span>
                  <span>ORIGIN: ASA-5525-X</span>
                </div>
              </div>

              {/* Column 2: ULPF Transform Engine */}
              <div className="xl:col-span-4 bg-surface-bright/90 rounded-2xl border border-secondary/30 p-5 flex flex-col justify-between gap-4">
                <div className="flex items-center justify-between pb-3 border-b border-border-muted">
                  <div className="flex items-center gap-2 font-mono text-xs font-bold text-text-primary">
                    <span className="w-2 h-2 rounded-full bg-secondary"></span>
                    <span>02. ULPF TRANSFORM PIPELINE</span>
                  </div>
                  <span className="font-mono text-[10px] font-bold text-secondary px-2 py-0.5 rounded bg-secondary/10 border border-secondary/20">
                    CANONICAL
                  </span>
                </div>
                <div className="bg-surface-dim p-4 rounded-xl font-mono text-xs text-secondary leading-relaxed h-52 flex flex-col justify-center gap-1.5 border border-border-muted">
                  <span className="text-text-primary font-bold">[EXTRACTED_VECTORS]</span>
                  <span>src_ip: 185.220.101.5 (Tor Exit)</span>
                  <span>dst_ip: 10.0.4.12 (SMB Server)</span>
                  <span>protocol: 17 (UDP) / port: 445</span>
                  <span className="text-primary truncate">sha256: 4f8b22a07c801e9a...</span>
                  <span className="text-tertiary truncate">merkle_leaf: 0x82f489ad...</span>
                </div>
                <div className="font-mono text-[11px] text-text-dim flex items-center justify-between pt-1">
                  <span>TRANSFORM: 0.0009s</span>
                  <span>SCHEMA: OCSF 1.1.0</span>
                </div>
              </div>

              {/* Column 3: Enriched XAI Threat Verdict */}
              <div className="xl:col-span-4 bg-surface-bright/90 rounded-2xl border border-tertiary/30 p-5 flex flex-col justify-between gap-4">
                <div className="flex items-center justify-between pb-3 border-b border-border-muted">
                  <div className="flex items-center gap-2 font-mono text-xs font-bold text-text-primary">
                    <span className="w-2 h-2 rounded-full bg-tertiary"></span>
                    <span>03. EXPLAINABLE THREAT VERDICT</span>
                  </div>
                  <span className="font-mono text-[10px] font-bold text-[var(--color-severity-critical)] px-2 py-0.5 rounded bg-[var(--color-severity-critical-bg)] border border-[var(--color-severity-critical-border)]">
                    SEV 9.4 CRITICAL
                  </span>
                </div>
                <div className="bg-surface-dim p-4 rounded-xl flex flex-col gap-2 h-52 justify-center border border-border-muted">
                  <div className="flex items-center gap-2 text-[var(--color-severity-critical)] font-display font-bold text-sm">
                    <span className="material-symbols-outlined text-[20px]">gpp_maybe</span>
                    <span>T1021.002: Lateral SMB Probe</span>
                  </div>
                  <p className="font-sans text-xs text-text-muted leading-relaxed font-normal">
                    <strong className="text-text-primary font-semibold">XAI Reasoning:</strong> Anomaly score 0.94 triggered due to unauthorized SMB syn-probe originating from verified Tor exit node targeting an internal server.
                  </p>
                  <div className="p-2 bg-surface rounded font-mono text-[10px] text-tertiary flex items-center justify-between">
                    <span>ACTION: BLOCK RULE SENT</span>
                    <span>✓ TAMPER PROVED</span>
                  </div>
                </div>
                <div className="font-mono text-[11px] text-text-dim flex items-center justify-between pt-1">
                  <span>DISPATCH: SIEM + SLACK</span>
                  <span>SOAR ID: #84920</span>
                </div>
              </div>

            </div>
          </div>
        </section>

      </main>

      {/* ========================================================================= */}
      {/* FOOTER SECTION                                                           */}
      {/* ========================================================================= */}
      <footer className="w-full px-4 md:px-8 xl:px-14 py-16 bg-surface-dim border-t border-border-muted">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-border-muted">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shadow-[0_0_12px_rgba(167,139,250,0.35)]">
              <span className="material-symbols-outlined text-[20px]">security</span>
            </div>
            <span className="font-display font-black text-xl text-text-primary tracking-tight uppercase">LOG AI</span>
          </div>

          <nav className="flex flex-wrap items-center gap-6 font-mono text-xs text-text-muted">
            <Link to="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
            <Link to="/security" className="hover:text-primary transition-colors">Security</Link>
            <Link to="/compliance" className="hover:text-primary transition-colors">Compliance</Link>
            <Link to="/terms" className="hover:text-primary transition-colors">Terms</Link>
            <Link to="/contact" className="hover:text-primary transition-colors">Contact</Link>
          </nav>
        </div>

        <div className="max-w-[1600px] mx-auto pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-dim font-sans">
          <p>&copy; 2025 LOG AI Inc. All rights reserved. Enterprise-grade cryptographic log pre-processing.</p>
          <p className="font-mono text-[11px] text-tertiary">ISO/IEC 27001 &amp; SOC2 TYPE II COMPLIANT</p>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* FIXED BOTTOM SOC STATUS TICKER STRIP                                     */}
      {/* ========================================================================= */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 h-10 bg-surface-dim/95 backdrop-blur-md border-t border-border-muted">
        <div className="h-full w-full max-w-[1600px] mx-auto px-4 md:px-8 flex items-center justify-between font-mono text-[11px] text-text-muted overflow-x-auto gap-4">
          <div className="flex items-center gap-6 whitespace-nowrap">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
              <span className="text-text-dim">INGEST:</span>
              <span className="text-text-primary font-bold">142.8 GB/hr</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-secondary"></span>
              <span className="text-text-dim">TAMPER-PROOF LEDGER:</span>
              <span className="text-secondary font-bold">SHA-256 VERIFIED</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary"></span>
              <span className="text-text-dim">ML ANOMALY THRESHOLD:</span>
              <span className="text-primary font-bold">{FALLBACK_ANOMALY_THRESHOLD}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-tertiary"></span>
              <span className="text-text-dim">SOC LATENCY:</span>
              <span className="text-tertiary font-bold">{FALLBACK_SOC_LATENCY}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="font-mono text-[10px] text-text-dim font-bold">STATUS: STEADY</span>
            <span className="text-text-dim">//</span>
            <span className="font-mono text-[10px] text-primary font-bold">OCSF_v1.1.0_ALIGNED</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
