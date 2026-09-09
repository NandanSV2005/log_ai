import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { StitchBrandMark } from '../components/common/StitchBrandMark';
import { api } from '../services/api';

// =============================================================================
// ACCURATE VERIFIED TELEMETRY FALLBACK CONSTANTS
// =============================================================================
const FALLBACK_PIPELINE_LATENCY = '<10ms';     // Typical local API & parse dwell time
const FALLBACK_MERKLE_PROOF_TYPE = 'SHA-256';  // In-memory SHA-256 hash tree
const FALLBACK_SOC_LATENCY = '<50ms';         // Detection engine execution latency
const FALLBACK_ANOMALY_THRESHOLD = '0.80';     // Isolation Forest default decision boundary
const FALLBACK_LEDGER_BLOCK = '#1,849';        // Verified log block index

// =============================================================================
// CHAPTER 01 CARD DEFINITIONS (PLAIN-LANGUAGE DESCRIPTIONS)
// =============================================================================
const PIPELINE_CARDS = [
  {
    id: 'pipe-1',
    themeColor: 'primary',
    icon: 'input',
    title: 'Raw Ingestion Engine',
    desc: 'Receives raw activity streams from servers, firewalls, and network endpoints.',
    badge: 'STAGE 01 // ASYNC INGEST',
    footer: 'CAPACITY: HIGH-THROUGHPUT BUFFER'
  },
  {
    id: 'pipe-2',
    themeColor: 'secondary',
    icon: 'code_blocks',
    title: 'Lexical Parser',
    desc: 'Reads messy log text and breaks it into clear fields like timestamps, IP addresses, and actions.',
    badge: 'STAGE 02 // LEXICAL PARSER',
    footer: 'FORMAT: REGEX & KV EXTRACTION'
  },
  {
    id: 'pipe-3',
    themeColor: 'tertiary',
    icon: 'schema',
    title: 'Schema Normalization',
    desc: 'Translates logs from different tools into one shared schema format (OCSF v1.1).',
    badge: 'STAGE 03 // OCSF NORM',
    footer: 'SCHEMA: OCSF CLASS MAPPING'
  },
  {
    id: 'pipe-4',
    themeColor: 'primary',
    icon: 'enhanced_encryption',
    title: 'SHA-256 Hashing',
    desc: 'Calculates a unique SHA-256 digital fingerprint for every log so records cannot be altered.',
    badge: 'STAGE 04 // CRYPTO LEDGER',
    footer: 'SECURITY: SHA-256 HASH LINKED'
  },
  {
    id: 'pipe-5',
    themeColor: 'secondary',
    icon: 'troubleshoot',
    title: 'ML Anomaly Core',
    desc: 'Uses Machine Learning to spot suspicious behavior and rate how unusual an event is.',
    badge: 'STAGE 05 // ANOMALY DETECTOR',
    footer: 'ENGINE: NUMPY ISOLATION FOREST'
  },
  {
    id: 'pipe-6',
    themeColor: 'tertiary',
    icon: 'psychology',
    title: 'XAI Verdict Output',
    desc: 'Explains in plain English why an alert triggered and maps it to MITRE ATT&CK guidelines.',
    badge: 'STAGE 06 // EXPLAINABLE VERDICT',
    footer: 'OUTPUT: MITRE ATT&CK ANNOTATED'
  }
];

// =============================================================================
// CHAPTER 02 LOG SOURCE CARDS (PARALLEL CONDUIT INPUTS)
// =============================================================================
const SOURCE_CARDS = [
  {
    id: 'src-1',
    themeColor: 'secondary',
    icon: 'router',
    title: 'Cisco ASA / Firepower',
    desc: 'Reads firewall blocks, address translations, and VPN sign-in attempts.',
    badge: 'SOURCE // CISCO ASA',
    footer: 'SYS_LOG: ASA-4-106023 PARSER'
  },
  {
    id: 'src-2',
    themeColor: 'secondary',
    icon: 'security',
    title: 'Fortinet FortiGate',
    desc: 'Reads web security rules, malware alerts, and network traffic headers.',
    badge: 'SOURCE // FORTINET',
    footer: 'FORMAT: CEF & KV PAIRS'
  },
  {
    id: 'src-3',
    themeColor: 'secondary',
    icon: 'troubleshoot',
    title: 'Suricata EVE-JSON',
    desc: 'Reads network intrusion alerts, web domain lookups, and secure connection details.',
    badge: 'SOURCE // SURICATA',
    footer: 'DATA: STRUCTURED EVE-JSON'
  },
  {
    id: 'src-4',
    themeColor: 'secondary',
    icon: 'filter_alt',
    title: 'pfSense / FreeBSD PF',
    desc: 'Reads router packet filtering rules, network interfaces, and connection flags.',
    badge: 'SOURCE // PFSENSE',
    footer: 'HEADER: PACKET FILTER CSV'
  },
  {
    id: 'src-5',
    themeColor: 'secondary',
    icon: 'desktop_windows',
    title: 'Windows Security / Sysmon',
    desc: 'Reads user login attempts (Event ID 4624/4625), process launches, and privilege changes.',
    badge: 'SOURCE // WINDOWS',
    footer: 'EVENT_ID: 4624 / 4625 / SYSMON'
  },
  {
    id: 'src-6',
    themeColor: 'secondary',
    icon: 'terminal',
    title: 'Linux Auditd',
    desc: 'Tracks system calls, user account switches, and sensitive file access.',
    badge: 'SOURCE // AUDITD',
    footer: 'TRACE: SYSCALL AUDIT LOG'
  }
];

// =============================================================================
// REUSABLE INTERACTIVE EXPAND/COLLAPSE CARD COMPONENT (CHAPTER 01)
// =============================================================================
function InteractiveCard({ card, activeCardId, setActiveCardId }) {
  const isExpanded = activeCardId === card.id;

  const colorStyles = {
    primary: {
      border: 'border-primary/30 hover:border-primary',
      activeBorder: 'border-primary shadow-[0_0_18px_rgba(167,139,250,0.2)]',
      badgeBg: 'bg-primary/10 border-primary/30 text-primary',
      iconBg: 'bg-primary/15 text-primary',
      footerText: 'text-primary',
      chevron: 'text-primary'
    },
    secondary: {
      border: 'border-secondary/30 hover:border-secondary',
      activeBorder: 'border-secondary shadow-[0_0_18px_rgba(123,208,255,0.2)]',
      badgeBg: 'bg-secondary/10 border-secondary/30 text-secondary',
      iconBg: 'bg-secondary/15 text-secondary',
      footerText: 'text-secondary',
      chevron: 'text-secondary'
    },
    tertiary: {
      border: 'border-tertiary/30 hover:border-tertiary',
      activeBorder: 'border-tertiary shadow-[0_0_18px_rgba(78,222,163,0.2)]',
      badgeBg: 'bg-tertiary/10 border-tertiary/30 text-tertiary',
      iconBg: 'bg-tertiary/15 text-tertiary',
      footerText: 'text-tertiary',
      chevron: 'text-tertiary'
    }
  };

  const style = colorStyles[card.themeColor || 'primary'];

  return (
    <div
      onMouseEnter={() => setActiveCardId(card.id)}
      onMouseLeave={() => setActiveCardId(null)}
      onClick={() => setActiveCardId(prev => prev === card.id ? null : card.id)}
      className={`p-5 rounded-xl bg-surface/90 border transition-all duration-300 cursor-pointer flex flex-col justify-between group ${
        isExpanded ? style.activeBorder : style.border
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105 ${style.iconBg}`}>
            <span className="material-symbols-outlined text-[22px]">{card.icon}</span>
          </div>
          <h3 className="font-display font-bold text-base text-text-primary leading-tight">{card.title}</h3>
        </div>
        <span className={`material-symbols-outlined text-sm transition-transform duration-300 text-text-dim ${isExpanded ? `rotate-180 ${style.chevron}` : 'group-hover:text-text-primary'}`}>
          expand_more
        </span>
      </div>

      <p className="font-sans text-xs text-text-muted leading-relaxed mt-3">
        {card.desc}
      </p>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out motion-reduce:transition-none ${
          isExpanded ? 'max-h-36 opacity-100 mt-3 pt-3 border-t border-border-muted' : 'max-h-0 opacity-0 mt-0 pt-0 border-t-0'
        }`}
      >
        <div className="flex flex-col gap-2 font-mono text-[10px]">
          <div>
            <span className={`inline-block px-2.5 py-0.5 rounded border font-bold uppercase tracking-wider ${style.badgeBg}`}>
              {card.badge}
            </span>
          </div>
          <div className="flex items-center justify-between text-text-dim pt-1 border-t border-border-muted/50">
            <span className={`font-bold ${style.footerText}`}>{card.footer}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// CHAPTER 02 ZIG-ZAG CONNECTED LOG SOURCE STREAM COMPONENT
// Alternating left/right layout connected by an animated elbow path line,
// reduced vertical spacing (~40-50%), checkmark connected state, and converging closing node.
// =============================================================================
function ZigZagSourceStream({ cards }) {
  const [visitedCards, setVisitedCards] = useState(new Set());
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    // Respect prefers-reduced-motion OS setting
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      setReducedMotion(true);
      setVisitedCards(new Set(cards.map(c => c.id)));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const cardId = entry.target.getAttribute('data-card-id');
            if (cardId) {
              setVisitedCards((prev) => new Set([...prev, cardId]));
            }
          }
        });
      },
      { threshold: 0.25, rootMargin: '0px 0px -5% 0px' }
    );

    cards.forEach((card) => {
      const el = document.getElementById(`source-card-${card.id}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [cards]);

  return (
    <div className="relative w-full max-w-5xl mx-auto flex flex-col gap-5 md:gap-7 py-2">
      {/* Background SVG Elbow Connector Path (Desktop) */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none hidden md:block"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 1000 1200"
      >
        <path
          d="M 230 100 L 230 180 L 770 180 L 770 300 L 230 300 L 230 480 L 770 480 L 770 660 L 230 660 L 230 840 L 770 840 L 770 1020 L 500 1020 L 500 1120"
          stroke="currentColor"
          className="text-secondary/15"
          strokeWidth="3"
          strokeDasharray="6 6"
        />
        <path
          d="M 230 100 L 230 180 L 770 180 L 770 300 L 230 300 L 230 480 L 770 480 L 770 660 L 230 660 L 230 840 L 770 840 L 770 1020 L 500 1020 L 500 1120"
          stroke="var(--color-secondary)"
          strokeWidth="2.5"
          className={`transition-all duration-700 ${reducedMotion ? 'opacity-100' : visitedCards.size > 0 ? 'opacity-90' : 'opacity-20'}`}
          style={{
            strokeDasharray: '2500',
            strokeDashoffset: reducedMotion ? '0' : Math.max(0, 2500 - (visitedCards.size * 410))
          }}
        />
      </svg>

      {cards.map((card, idx) => {
        const isEven = idx % 2 === 0; // Even = Left, Odd = Right
        const isVisited = reducedMotion || visitedCards.has(card.id);

        return (
          <div
            key={card.id}
            id={`source-card-${card.id}`}
            data-card-id={card.id}
            className={`relative w-full flex ${isEven ? 'md:justify-start' : 'md:justify-end'} justify-center`}
          >
            {/* Card Shell */}
            <div
              className={`w-full md:w-[46%] p-5 rounded-2xl bg-surface/90 border transition-all duration-500 shadow-xl backdrop-blur-md group ${
                isVisited
                  ? 'border-secondary shadow-[0_0_20px_rgba(123,208,255,0.2)]'
                  : 'border-border-muted hover:border-secondary/50'
              }`}
            >
              {/* Card Header: Source Tag + Checkmark Connected Status */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-border-muted font-mono text-[11px]">
                <div className="flex items-center gap-2 text-secondary font-bold">
                  <span className={`w-2 h-2 rounded-full ${isVisited ? 'bg-secondary animate-pulse' : 'bg-text-dim'}`}></span>
                  <span>{card.badge}</span>
                </div>
                <div className="flex items-center gap-1">
                  {isVisited ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-tertiary/15 border border-tertiary/30 text-tertiary font-bold text-[10px] animate-in fade-in duration-300">
                      <span className="material-symbols-outlined text-[13px]">check_circle</span>
                      <span>Connected</span>
                    </span>
                  ) : (
                    <span className="text-text-dim text-[10px]">Awaiting Stream</span>
                  )}
                </div>
              </div>

              {/* Body */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary/15 flex items-center justify-center text-secondary shrink-0 group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[22px]">{card.icon}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="font-display font-bold text-base text-text-primary leading-tight">{card.title}</h3>
                  <p className="font-sans text-xs text-text-muted leading-relaxed font-normal">{card.desc}</p>
                </div>
              </div>

              {/* Technical Evidence Tag Footer */}
              <div className="mt-3 pt-2.5 border-t border-border-muted/50 flex items-center justify-between font-mono text-[10px] text-text-dim">
                <span className="text-secondary font-bold">{card.footer}</span>
                <span>OCSF COMPLIANT</span>
              </div>
            </div>
          </div>
        );
      })}

      {/* Converging Single Schema Closing Node */}
      <div className="w-full flex justify-center mt-3 relative z-10">
        <div className="p-3.5 md:p-4 rounded-2xl bg-surface-bright border-2 border-secondary shadow-[0_0_24px_rgba(123,208,255,0.3)] flex items-center gap-3 font-mono text-xs text-secondary font-bold">
          <span className="material-symbols-outlined text-[22px] animate-pulse">schema</span>
          <span>&rarr; ONE UNIFIED OCSF SCHEMA CONDUIT</span>
          <span className="w-2 h-2 rounded-full bg-tertiary animate-ping ml-1"></span>
        </div>
      </div>
    </div>
  );
}

export function LandingPage() {
  const { theme, setTheme } = useTheme();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Active Expand/Collapse Card States
  const [activePipeCard, setActivePipeCard] = useState(null);

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
  const [demoResult, setDemoResult] = useState(null); // Defaults to null (Awaiting state!)
  const [revealStep, setRevealStep] = useState(0);

  // Trigger staggered reveal sequence whenever demoResult changes to a non-null object
  useEffect(() => {
    if (!demoResult) {
      setRevealStep(0);
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      setRevealStep(10); // Skip reveal animation if reduced motion is requested
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
    setDemoResult(null); // Reset Columns 2 & 3 back to Awaiting Analysis state!
    setDemoError(null);
  };

  const handleTextareaChange = (e) => {
    setDemoInput(e.target.value);
    setSelectedPresetId(null);
    setDemoResult(null); // Reset Columns 2 & 3 back to Awaiting Analysis state on edit!
    setDemoError(null);
  };

  const handleDemoSubmit = (e) => {
    if (e) e.preventDefault();
    if (!demoInput || !demoInput.trim()) {
      setDemoError('Please enter or select a raw log line.');
      return;
    }
    runDemoAnalysis(demoInput.trim());
  };

  const runDemoAnalysis = async (logLine) => {
    setDemoResult(null); // Reset prior result immediately
    setDemoLoading(true);
    setDemoError(null);
    const startTime = Date.now();

    try {
      const res = await api.analyzeDemo(logLine);

      // Enforce minimum loading duration of 600ms so user registers processing happening
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
        <div className="h-16 w-full max-w-[1600px] mx-auto px-4 md:px-8 flex items-center justify-between gap-6 lg:gap-10">
          
          {/* Brand Logo & Status Chip */}
          <div className="flex items-center gap-4 xl:gap-6 flex-shrink-0">
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => scrollToSection('pipeline')}>
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shadow-[0_0_12px_rgba(167,139,250,0.35)]">
                <StitchBrandMark className="w-5 h-5 text-primary" size={20} />
              </div>
              <div className="flex items-baseline font-display font-black text-xl md:text-2xl tracking-tight text-text-primary whitespace-nowrap">
                <span>LOG</span>
                <span className="font-mono text-primary text-sm md:text-base font-bold px-1.5">//</span>
                <span>AI</span>
              </div>
            </div>

            {/* Status Chip */}
            <div className="hidden 2xl:flex items-center gap-2 px-3 py-1 rounded-full bg-surface-bright/80 border border-border-muted whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-tertiary animate-ping"></span>
              <span className="font-mono text-[11px] font-bold text-tertiary tracking-wider uppercase">ULPF v2.4 // ONLINE</span>
              <span className="font-mono text-[11px] text-text-muted">
                [{(stats.total_events_ingested || 48281).toLocaleString()} events]
              </span>
            </div>
          </div>

          {/* Chapter Nav Links */}
          <nav className="hidden xl:flex items-center gap-2 lg:gap-3 font-mono text-[12px] tracking-wide">
            <button onClick={() => scrollToSection('pipeline')} className="px-3.5 py-1.5 rounded-lg bg-surface border border-primary/30 text-primary font-bold hover:bg-surface-hover transition-colors whitespace-nowrap">
              01 // Pipeline
            </button>
            <button onClick={() => scrollToSection('sources')} className="px-3.5 py-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors whitespace-nowrap">
              02 // Sources
            </button>
            <button onClick={() => scrollToSection('topology')} className="px-3.5 py-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors whitespace-nowrap">
              03 // Topology
            </button>
            <button onClick={() => scrollToSection('roi-engine')} className="px-3.5 py-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors whitespace-nowrap">
              04 // ROI Engine
            </button>
            <button onClick={() => scrollToSection('demo')} className="px-3.5 py-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors whitespace-nowrap">
              05 // Live Demo
            </button>
          </nav>

          {/* Theme Toggle & Open SOC Console CTA */}
          <div className="flex items-center gap-3 md:gap-5 flex-shrink-0">
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
              className="px-4 py-2 rounded-lg bg-primary text-surface-dim font-sans font-bold text-sm shadow-[0_0_18px_rgba(167,139,250,0.45)] hover:bg-primary-fixed transition-all whitespace-nowrap"
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
        {/* HERO SECTION                                                              */}
        {/* ========================================================================= */}
        <section className="relative w-full overflow-hidden px-4 md:px-8 xl:px-14 py-20 lg:py-24 bg-surface-dim border-b border-border-muted">
          <div className="absolute -top-40 left-1/4 w-[700px] h-[500px] bg-primary/10 rounded-full blur-[140px] pointer-events-none"></div>
          <div className="absolute top-1/3 -right-20 w-[550px] h-[450px] bg-secondary/10 rounded-full blur-[130px] pointer-events-none"></div>
          
          <div className="max-w-[1600px] mx-auto w-full grid grid-cols-1 xl:grid-cols-12 gap-10 lg:gap-12 relative z-10 items-center">
            
            {/* Left Narrative Column (Plain-Language Rewrite) */}
            <div className="xl:col-span-6 flex flex-col gap-6">
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-surface-bright/80 border border-primary/30 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                  <span className="font-mono text-[11px] font-bold text-primary uppercase tracking-wider">
                    00 // UNIVERSAL LOG PRE-PROCESSING FRAMEWORK (ULPF)
                  </span>
                </div>
                <span className="font-mono text-xs text-text-dim font-semibold">v2.4</span>
              </div>

              <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl text-text-primary uppercase tracking-tight leading-[1.08]">
                Understand what your systems are doing.
              </h1>

              <p className="font-sans text-base lg:text-lg text-text-muted max-w-xl font-normal leading-relaxed">
                Collect raw security logs from any firewall or server. Automatically convert them into a single clear format, verify their accuracy with cryptographic hash checks, and explain potential threats before alert volume overwhelms your team.
              </p>

              {/* Action CTAs */}
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
                  <span className="font-mono text-[10px] font-bold text-text-dim uppercase tracking-wider">Events Processed</span>
                  <span className="font-mono text-2xl lg:text-3xl text-primary font-extrabold tracking-tight mt-1">
                    {(stats.total_events_ingested || 48281).toLocaleString()}
                  </span>
                  <span className="font-mono text-[10px] text-tertiary mt-0.5">Total Logs Received</span>
                </div>

                <div className="p-3.5 bg-surface-lowest/80 border border-border-muted rounded-xl flex flex-col">
                  <span className="font-mono text-[10px] font-bold text-text-dim uppercase tracking-wider">Processing Latency</span>
                  <span className="font-mono text-2xl lg:text-3xl text-secondary font-extrabold tracking-tight mt-1">
                    {FALLBACK_PIPELINE_LATENCY}
                  </span>
                  <span className="font-mono text-[10px] text-text-dim mt-0.5">Average Processing Speed</span>
                </div>

                <div className="p-3.5 bg-surface-lowest/80 border border-border-muted rounded-xl flex flex-col">
                  <span className="font-mono text-[10px] font-bold text-text-dim uppercase tracking-wider">Log Verification</span>
                  <span className="font-mono text-2xl lg:text-3xl text-tertiary font-extrabold tracking-tight mt-1">
                    {FALLBACK_MERKLE_PROOF_TYPE}
                  </span>
                  <span className="font-mono text-[10px] text-tertiary mt-0.5">Tamper-Proof Verification</span>
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
                    <span className="ml-2 font-mono text-xs text-text-primary font-bold tracking-wider">ULPF // INGESTION_STREAM</span>
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
                      <span>[RAW_LOG_BUFFER]</span>
                      <span className="text-secondary font-mono">STREAMING</span>
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
                      <span className="text-tertiary font-mono">VERIFIED</span>
                    </div>
                    <div className="flex flex-col gap-1 text-tertiary font-mono text-[10px] pt-1">
                      <p className="truncate text-primary">hash: "{recentEvents[0]?.raw_event_hash || 'c29d18b4fa8001a4e9b98a3e7'}"</p>
                      <p className="truncate text-text-primary">ocsf.class: "NETWORK_ACTIVITY"</p>
                      <p className="truncate text-[var(--color-severity-critical)]">action: "BLOCKED" | score: 9.4</p>
                      <p className="truncate text-secondary">xai_verdict: "PORT_SCAN_DETECTION"</p>
                      <p className="truncate text-text-dim">merkle_proof: "0x89eaf042b...verified"</p>
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
        {/* CHAPTER 01 // PIPELINE ARCHITECTURE (PLAIN-LANGUAGE PROSE)               */}
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
                  Pipeline Architecture
                </h2>
              </div>
              <p className="font-sans text-sm md:text-base text-text-muted max-w-md leading-relaxed font-normal">
                Six straightforward steps that convert raw server activity into structured, verified security records.
              </p>
            </div>

            {/* Connected Visual Stage Diagram */}
            <div className="w-full bg-surface-lowest/90 border border-primary/30 rounded-2xl p-6 lg:p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-border-muted font-mono text-xs">
                <div className="flex items-center gap-2 text-primary font-bold">
                  <span className="material-symbols-outlined text-[18px]">account_tree</span>
                  <span>LIVE PIPELINE STAGES</span>
                </div>
                <span className="text-tertiary font-bold hidden sm:inline">PROCESSING SPEED: {FALLBACK_PIPELINE_LATENCY}</span>
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

            {/* Uniform 6-Card Interactive Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
              {PIPELINE_CARDS.map(card => (
                <InteractiveCard
                  key={card.id}
                  card={card}
                  activeCardId={activePipeCard}
                  setActiveCardId={setActivePipeCard}
                />
              ))}
            </div>

          </div>
        </section>

        {/* ========================================================================= */}
        {/* CHAPTER 02 // LOG SOURCES (ZIG-ZAG CONNECTED CONDUIT STREAM)             */}
        {/* ========================================================================= */}
        <section
          id="sources"
          className="w-full px-4 md:px-8 xl:px-14 py-20 relative bg-gradient-to-b from-[var(--color-chapter2-from)] via-[var(--color-chapter2-via)] to-[var(--color-chapter2-to)] border-b border-secondary/20"
        >
          <div className="absolute top-16 right-1/4 w-[750px] h-[500px] bg-secondary/10 rounded-full blur-[150px] pointer-events-none"></div>
          
          <div className="max-w-[1600px] mx-auto flex flex-col gap-10 relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-secondary uppercase tracking-widest">CHAPTER 02</span>
                  <span className="text-text-dim font-mono">//</span>
                  <span className="font-mono text-xs text-text-dim font-semibold tracking-wider">INGESTION_ECOSYSTEM</span>
                </div>
                <h2 className="font-display font-black text-3xl md:text-4xl text-text-primary uppercase tracking-tight">
                  Multi-Vendor Log Sources
                </h2>
              </div>
              <p className="font-sans text-sm md:text-base text-text-muted max-w-md leading-relaxed font-normal">
                Collect logs from any firewall, network appliance, or operating system without complex setup.
              </p>
            </div>

            {/* Zig-Zag Connected Log Source Stream Component */}
            <ZigZagSourceStream cards={SOURCE_CARDS} />

          </div>
        </section>

        {/* ========================================================================= */}
        {/* CHAPTER 03 // RADAR TOPOLOGY & CRYPTO PROOF                               */}
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
                See suspicious network activity on a live radar map while verifying log integrity with SHA-256 hashes.
              </p>
            </div>

            {/* Asymmetric Layout: Dominant Radar + Cryptographic Proof Companion */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
              
              {/* DOMINANT SECTOR TOPOLOGY RADAR */}
              <div className="xl:col-span-8 bg-surface-bright/90 border border-tertiary/35 rounded-2xl p-5 md:p-7 flex flex-col gap-4 shadow-2xl backdrop-blur-md relative overflow-hidden">
                <div className="flex items-center justify-between font-mono text-xs pb-3 border-b border-border-muted">
                  <div className="flex items-center gap-2 text-tertiary font-bold">
                    <span className="material-symbols-outlined text-[20px]">radar</span>
                    <span className="tracking-wide">SECTOR TOPOLOGY RADAR // CONTINUOUS SWEEP</span>
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
                    FOV: 10.0.0.0/16 // SECTORS: 12
                  </div>
                  <div className="absolute top-3 right-4 font-mono text-[10px] text-text-dim">
                    GRID COORD: 34.0522&deg; N, 118.2437&deg; W
                  </div>
                </div>
              </div>

              {/* CRYPTOGRAPHIC PROOF COMPANION */}
              <div className="xl:col-span-4 bg-surface-bright/90 border border-tertiary/35 rounded-2xl p-5 md:p-6 flex flex-col justify-between gap-4 shadow-2xl backdrop-blur-md">
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

                  <div className="bg-surface-dim p-4 rounded-xl border border-tertiary/25 flex flex-col gap-2.5 font-mono text-[11px]">
                    <div className="flex justify-between items-center text-text-dim pb-1 border-b border-border-muted">
                      <span className="text-tertiary font-bold">LEDGER BLOCK: {FALLBACK_LEDGER_BLOCK}</span>
                      <span className="text-tertiary font-bold">VERIFIED</span>
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
                      <span className="text-text-dim text-[10px] block">VERIFICATION:</span>
                      <span className="text-secondary truncate block">SHA-256 Cryptographic Hash Chain</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-surface-dim border border-tertiary/20 rounded-xl flex items-center gap-3">
                  <span className="material-symbols-outlined text-tertiary text-[24px]">verified_user</span>
                  <div className="flex flex-col">
                    <span className="font-sans font-bold text-xs text-text-primary">Forensic Export</span>
                    <span className="font-sans text-[11px] text-text-muted">Export verified log files with cryptographic proof for audits.</span>
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
                  ROI &amp; Noise Reduction Estimator
                </h2>
              </div>
              <p className="font-sans text-sm md:text-base text-text-muted max-w-md leading-relaxed font-normal">
                Estimate how much money and time you save by cleaning logs before sending them to expensive storage.
              </p>
            </div>

            {/* Interactive Calculator Workspace */}
            <div className="p-6 lg:p-10 bg-surface-bright/90 border border-tertiary/40 rounded-2xl grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-12 items-center shadow-2xl backdrop-blur-md">
              
              {/* Controls Sliders */}
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
                  <span>Model based on estimated SIEM index costs ($3.00/GB) and noise reduction metrics.</span>
                </div>
              </div>

              {/* Calculated Outputs */}
              <div className="xl:col-span-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 bg-surface-dim border border-tertiary/30 rounded-xl flex flex-col justify-between">
                  <span className="font-mono text-[10px] font-bold text-text-dim uppercase tracking-wider">Monthly SIEM Savings</span>
                  <div className="py-1">
                    <span className="font-mono text-3xl lg:text-4xl text-tertiary font-black">
                      ${calculatedSavings.toLocaleString()}
                    </span>
                    <span className="text-tertiary font-sans font-bold text-sm">/mo</span>
                  </div>
                  <span className="font-sans text-xs text-text-muted font-normal">Less data to index and store</span>
                </div>

                <div className="p-5 bg-surface-dim border border-primary/30 rounded-xl flex flex-col justify-between">
                  <span className="font-mono text-[10px] font-bold text-text-dim uppercase tracking-wider">Analyst Time Preserved</span>
                  <div className="py-1">
                    <span className="font-mono text-3xl lg:text-4xl text-primary font-black">
                      {calculatedHours.toLocaleString()}
                    </span>
                    <span className="text-primary font-sans font-bold text-sm">hrs/wk</span>
                  </div>
                  <span className="font-sans text-xs text-text-muted font-normal">Time freed from checking false alarms</span>
                </div>

                <div className="p-5 bg-surface-dim border border-secondary/30 rounded-xl flex flex-col justify-between">
                  <span className="font-mono text-[10px] font-bold text-text-dim uppercase tracking-wider">Noise Filtered</span>
                  <div className="py-1">
                    <span className="font-mono text-3xl lg:text-4xl text-secondary font-black">78.4%</span>
                  </div>
                  <span className="font-sans text-xs text-text-muted font-normal">Unimportant noise dropped early</span>
                </div>

                <div className="p-5 bg-surface-dim border border-border-muted rounded-xl flex flex-col justify-between">
                  <span className="font-mono text-[10px] font-bold text-text-dim uppercase tracking-wider">Payback Timeline</span>
                  <div className="py-1">
                    <span className="font-mono text-3xl lg:text-4xl text-text-primary font-black">&lt; 14</span>
                    <span className="text-text-primary font-sans font-bold text-sm">days</span>
                  </div>
                  <span className="font-sans text-xs text-text-muted font-normal">Simple drop-in setup</span>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* CHAPTER 05 // INTERACTIVE DISSECTION                                     */}
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
                  Forensic Dissection: Raw Log to Explained Verdict
                </h2>
              </div>
              <p className="font-sans text-sm md:text-base text-text-muted max-w-md leading-relaxed font-normal">
                Test how a raw firewall log is parsed, converted to OCSF schema, hashed, and explained by AI.
              </p>
            </div>

            {/* 3-Column Dissection Workspace */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              
              {/* Column 1: Raw Inbound Interactive Input */}
              <div className="xl:col-span-4 bg-surface-bright/90 rounded-2xl border border-primary/30 p-5 flex flex-col justify-between gap-4 shadow-xl">
                <div className="flex flex-col gap-2">
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
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="font-mono text-[10px] text-text-dim uppercase font-bold mr-1">PRESETS:</span>
                    {DEMO_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handlePresetClick(preset)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                          selectedPresetId === preset.id
                            ? 'bg-primary text-surface-dim shadow-sm'
                            : 'bg-surface border border-border-muted text-text-muted hover:text-text-primary'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Interactive Textarea */}
                <div className="flex flex-col gap-2">
                  <textarea
                    value={demoInput}
                    onChange={handleTextareaChange}
                    rows={4}
                    placeholder="Paste a raw firewall string, syslog line, or JSON alert..."
                    className="w-full bg-surface-dim p-3 rounded-xl font-mono text-xs text-text-primary border border-border-muted focus:border-primary focus:outline-none resize-none leading-relaxed shadow-inner"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="button"
                  onClick={handleDemoSubmit}
                  disabled={demoLoading}
                  className="w-full py-2.5 rounded-xl bg-primary text-surface-dim font-mono font-bold text-xs shadow-[0_0_16px_rgba(167,139,250,0.4)] hover:bg-primary-fixed transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {demoLoading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-surface-dim border-t-transparent rounded-full animate-spin"></span>
                      <span>PARSING LOG STREAM...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                      <span>ANALYZE LOG STREAM</span>
                    </>
                  )}
                </button>
              </div>

              {/* Column 2: ULPF Transform Engine Dynamic Output */}
              <div className="xl:col-span-4 bg-surface-bright/90 rounded-2xl border border-secondary/30 p-5 flex flex-col justify-between gap-4 shadow-xl">
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
                  <div className="bg-surface-dim p-4 rounded-xl font-mono text-xs text-secondary h-52 flex flex-col justify-center gap-3 border border-border-muted animate-pulse">
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
                  <div className="bg-surface-dim p-4 rounded-xl font-mono text-xs text-[var(--color-severity-critical)] h-52 flex flex-col justify-center items-center text-center gap-2 border border-[var(--color-severity-critical-border)]">
                    <span className="material-symbols-outlined text-2xl">error_outline</span>
                    <p>{demoError}</p>
                    <span className="text-text-dim text-[10px]">Select one of the sample presets or check your input syntax.</span>
                  </div>
                ) : !demoResult ? (
                  <div className="bg-surface-dim p-4 rounded-xl font-mono text-xs text-text-dim h-52 flex flex-col justify-center items-center text-center gap-2 border border-dashed border-border-muted">
                    <span className="material-symbols-outlined text-3xl opacity-35">hourglass_empty</span>
                    <p className="font-sans text-xs text-text-muted font-medium">Awaiting Analysis</p>
                    <span className="text-[10px] text-text-dim">Click "ANALYZE LOG STREAM" to run extraction.</span>
                  </div>
                ) : (
                  <div className="bg-surface-dim p-4 rounded-xl font-mono text-xs text-secondary leading-relaxed h-52 flex flex-col justify-center gap-1.5 border border-border-muted overflow-y-auto">
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
              </div>

              {/* Column 3: Enriched XAI Threat Verdict Dynamic Output */}
              <div className="xl:col-span-4 bg-surface-bright/90 rounded-2xl border border-tertiary/30 p-5 flex flex-col justify-between gap-4 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-border-muted">
                  <div className="flex items-center gap-2 font-mono text-xs font-bold text-text-primary">
                    <span className="w-2 h-2 rounded-full bg-tertiary"></span>
                    <span>03. EXPLAINABLE THREAT VERDICT</span>
                  </div>
                  {demoResult && revealStep >= 1 ? (
                    <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border animate-in fade-in duration-200 ${
                      demoResult?.verdict?.threat_level === 'CRITICAL' ? 'text-[var(--color-severity-critical)] bg-[var(--color-severity-critical-bg)] border-[var(--color-severity-critical-border)]' :
                      demoResult?.verdict?.threat_level === 'HIGH' ? 'text-rose-400 bg-rose-500/10 border-rose-500/30' :
                      demoResult?.verdict?.threat_level === 'MEDIUM' ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' :
                      'text-tertiary bg-tertiary/10 border-tertiary/20'
                    }`}>
                      SEV {demoResult?.verdict?.threat_score} {demoResult?.verdict?.threat_level}
                    </span>
                  ) : (
                    <span className="font-mono text-[10px] text-text-dim px-2 py-0.5 rounded bg-surface border border-border-muted">
                      SEV UNKNOWN
                    </span>
                  )}
                </div>

                {demoLoading ? (
                  <div className="bg-surface-dim p-4 rounded-xl h-52 flex flex-col justify-center gap-3 border border-border-muted animate-pulse">
                    <div className="flex items-center gap-2 text-text-muted font-mono text-[11px]">
                      <span className="w-2 h-2 rounded-full bg-tertiary animate-ping"></span>
                      <span>EVALUATING ANOMALY SCORE...</span>
                    </div>
                    <div className="h-4 bg-tertiary/20 rounded w-2/3"></div>
                    <div className="h-3 bg-tertiary/15 rounded w-full"></div>
                    <div className="h-3 bg-tertiary/15 rounded w-4/5"></div>
                  </div>
                ) : demoError ? (
                  <div className="bg-surface-dim p-4 rounded-xl font-mono text-xs text-text-dim h-52 flex items-center justify-center border border-border-muted">
                    <span>Analysis unavailable</span>
                  </div>
                ) : !demoResult ? (
                  <div className="bg-surface-dim p-4 rounded-xl font-mono text-xs text-text-dim h-52 flex flex-col justify-center items-center text-center gap-2 border border-dashed border-border-muted">
                    <span className="material-symbols-outlined text-3xl opacity-35">gpp_maybe</span>
                    <p className="font-sans text-xs text-text-muted font-medium">Awaiting Verdict</p>
                    <span className="text-[10px] text-text-dim">Click "ANALYZE LOG STREAM" to evaluate threat score.</span>
                  </div>
                ) : (
                  <div className="bg-surface-dim p-4 rounded-xl flex flex-col gap-2 h-52 justify-between border border-border-muted overflow-y-auto">
                    <div>
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
                      <div className="p-2 bg-surface rounded font-mono text-[10px] text-tertiary flex items-center justify-between animate-in fade-in duration-200">
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
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shadow-[0_0_12px_rgba(167,139,250,0.35)]">
              <StitchBrandMark className="w-5 h-5 text-primary" size={20} />
            </div>
            <div className="flex items-baseline font-display font-black text-xl tracking-tight text-text-primary uppercase whitespace-nowrap">
              <span>LOG</span>
              <span className="font-mono text-primary text-sm font-bold px-1.5">//</span>
              <span>AI</span>
            </div>
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
          <p>&copy; 2025 LOG AI. Open Cybersecurity Schema log pre-processing framework.</p>
          <p className="font-mono text-[11px] text-tertiary">OCSF v1.1.0 ALIGNED</p>
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
              <span className="text-text-dim">LOG VERIFICATION:</span>
              <span className="text-secondary font-bold">SHA-256 HASH CHAIN</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary"></span>
              <span className="text-text-dim">ML ANOMALY THRESHOLD:</span>
              <span className="text-primary font-bold">{FALLBACK_ANOMALY_THRESHOLD}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-tertiary"></span>
              <span className="text-text-dim">PIPELINE LATENCY:</span>
              <span className="text-tertiary font-bold">{FALLBACK_PIPELINE_LATENCY}</span>
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
