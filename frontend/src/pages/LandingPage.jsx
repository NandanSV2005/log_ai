import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

export function LandingPage() {
  const { theme, setTheme } = useTheme();

  // 1. 6-Stage Processing Pipeline Hover/Click State
  const [activePipelineStage, setActivePipelineStage] = useState(1);

  // 2. Interactive Feature Capabilities Tour Hover/Click State
  const [activeFeature, setActiveFeature] = useState('ingestion');

  // 3. Interactive System Architecture Node Hover/Click State
  const [activeArchNode, setActiveArchNode] = useState('ingestion');

  // 4. Financial Impact Estimator State
  const [logVolume, setLogVolume] = useState(500000);
  const [devicesMonitored, setDevicesMonitored] = useState(25);

  // Calculations for Financial Impact Estimator (Formulas 100% UNCHANGED)
  const hoursSaved = ((logVolume * 0.001 * 0.85 * 3.5 * 30) / 60).toFixed(1);
  const mttrReduction = Math.min(85, (50 + devicesMonitored * 0.2)).toFixed(1);
  const monthlySavings = (hoursSaved * 65).toLocaleString('en-US', { maximumFractionDigits: 0 });

  // Ticker items for live log event feed
  const TICKER_ITEMS = [
    { type: 'ALERT', color: 'text-rose-400', text: '[ALERT] Connection Flood detected on Edge Firewall (Cisco ASA)' },
    { type: 'INFO', color: 'text-text-muted', text: '[INFO] OCSF 1.1 Schema Normalization Pipeline Active' },
    { type: 'WARN', color: 'text-amber-400', text: '[WARN] Anomaly in egress traffic volume (IP: 185.220.100.22)' },
    { type: 'INFO', color: 'text-emerald-400', text: '[INFO] SHA-256 Merkle Chain Integrity: VERIFIED (Zero Tampering)' },
    { type: 'ALERT', color: 'text-rose-400', text: '[ALERT] Multiple failed SSH auth attempts - MITRE T1110' },
  ];

  // 6-Stage Telemetry Processing Pipeline Data (Simplified Plain English Copy)
  const PIPELINE_STAGES = [
    {
      id: 1,
      num: '01',
      name: 'Receive Logs',
      title: 'Stage 1: Receive Raw Logs & Hash Payloads',
      filepath: 'app/storage/raw_writer.py',
      desc: 'Raw logs are collected from network devices and immediately given a tamper-proof SHA-256 fingerprint before processing, ensuring complete data accuracy.',
      payload: '%ASA-4-106023: Deny tcp src outside:185.220.100.22/51422 dst inside:10.0.0.10/80 by access-group "outside_acl"',
      digest: 'a4ea94c43d9dc8c7753255ca0d6e2bb2093560056c170d2f992edb7d36071e3f',
      techBadge: 'Zero-Loss Ingestion',
    },
    {
      id: 2,
      num: '02',
      name: 'Identify Format',
      title: 'Stage 2: Automatic Format Identification',
      filepath: 'app/parsers/dynamic_parser.py',
      desc: 'Stitch automatically recognizes log formats from Cisco, Fortinet, Suricata, and pfSense, extracting key values like IP addresses, ports, and actions.',
      payload: 'Detected Format: Cisco ASA | Action: DENY | Protocol: TCP | SrcIP: 185.220.100.22 | DstIP: 10.0.0.10 | DstPort: 80',
      digest: '3c8e92ba8712df649f109281a8ef1284561029e8471b6501928471209e847120',
      techBadge: 'Format Detector',
    },
    {
      id: 3,
      num: '03',
      name: 'Organize Fields',
      title: 'Stage 3: Organize Fields with OCSF Standards',
      filepath: 'app/normalization/schema.py',
      desc: 'Converts raw log fields into standard OCSF 1.1 formats with consistent names, timestamps, and severity levels so all systems speak the same language.',
      payload: 'UnifiedEvent(event_type="cisco_asa:deny", severity="Warning", threat_level="MEDIUM", threat_score=65.0, status="New")',
      digest: '7a910284712b6501928471209e847120f2b259a563db460ee9d7b9ddf5b18d89',
      techBadge: 'Unified Schema',
    },
    {
      id: 4,
      num: '04',
      name: 'Detect Threats',
      title: 'Stage 4: Detect Suspicious Activity & Anomalies',
      filepath: 'app/detection/anomaly_engine.py',
      desc: 'Evaluates traffic volume, connection patterns, and security rules against baseline activity to calculate an easy-to-understand threat score (0 to 100).',
      payload: 'Threat Score: 65.0 (MEDIUM) | Triggers: ["repeated_deny", "external_source"] | Feature Attribution: action_code (+4.84 z-score)',
      digest: '9f7fe12c98001dcace31357795d410458710a892bfecdac00aee45bce0a96915',
      techBadge: 'Smart Threat Scoring',
    },
    {
      id: 5,
      num: '05',
      name: 'Group Incidents',
      title: 'Stage 5: Group Related Alerts into Incidents',
      filepath: 'app/detection/correlation.py',
      desc: 'Groups related alerts that happen within a 15-minute window and share source IPs into single incident timelines, cutting through alert noise.',
      payload: 'Incident Cluster #inc_a81b5b: Source IP 185.220.100.22 | Events Count: 12 | MITRE Tactics: ["T1110 - Brute Force"]',
      digest: '488480b6ca3f120649476bb2499f7fc43fbe08c16bec56b1d74517b1c38e7477',
      techBadge: 'Alert Correlator',
    },
    {
      id: 6,
      num: '06',
      name: 'Recommend Actions',
      title: 'Stage 6: Clear Explanations & Action Steps',
      filepath: 'app/xai/explainer.py',
      desc: 'Provides clear explanations for why an alert fired along with 3 step-by-step mitigation actions analysts can take immediately.',
      payload: 'XAI Attribution: "Threat score 65.0 driven by action_code z-score (+4.84) and IP denial count. Remediation: Block 185.220.100.22 at firewall."',
      digest: '551029e8471b6501928471209e847120f2b259a563db460ee9d7b9ddf5b18d89',
      techBadge: 'Containment Guidance',
    },
  ];

  const activePipelineObj = PIPELINE_STAGES.find((s) => s.id === activePipelineStage) || PIPELINE_STAGES[0];

  // Interactive Security Capabilities Data (Simplified Plain English Copy)
  const CAPABILITIES_DATA = [
    {
      id: 'ingestion',
      name: 'Collect System Logs',
      icon: 'speed',
      badge: 'HIGH-THROUGHPUT',
      title: 'High-Speed Log Capture & Storage',
      desc: 'Collects log streams from Cisco, Fortinet, Suricata, and pfSense devices continuously without dropping events.',
      problem: 'Solves lost events and uncompressed log storage clutter.',
      connection: 'Sends raw log bytes directly into forensic tamper hashing.',
      metrics: [
        { label: 'Throughput', val: '4.2M EPS' },
        { label: 'Latency', val: '< 2.5ms' },
        { label: 'Format', val: 'Syslog/CEF' },
      ],
      flow: ['Log Sources', 'Edge Listener', 'Storage Writer', 'SHA-256 Hash'],
      route: '/dashboard',
    },
    {
      id: 'normalization',
      name: 'Organize Log Fields',
      icon: 'schema',
      badge: 'OCSF 1.1 SCHEMA',
      title: 'Standardize Fields Across Systems',
      desc: 'Translates different vendor log terms into standard OCSF 1.1 fields with consistent names and timestamps.',
      problem: 'Fixes confusing field names across different security vendors.',
      connection: 'Prepares standardized data for threat scoring algorithms.',
      metrics: [
        { label: 'Schema', val: 'OCSF 1.1' },
        { label: 'Parsers', val: '6 Appliances' },
        { label: 'Precision', val: '100% Mapping' },
      ],
      flow: ['Raw Text Log', 'Format Identification', 'Standard Mapping', 'Unified Event'],
      route: '/log-explorer',
    },
    {
      id: 'detection',
      name: 'Detect Anomalies',
      icon: 'psychology',
      badge: 'SMART DETECTION',
      title: 'Automatic Behavior & Threat Scoring',
      desc: 'Checks traffic patterns and connection bursts against baseline activity to spot unusual behavior automatically.',
      problem: 'Cuts out false alarm fatigue while identifying stealthy threats.',
      connection: 'Calculates clear threat scores from 0.0 to 100.0.',
      metrics: [
        { label: 'Detection Speed', val: '1.4s' },
        { label: 'Engine', val: 'Isolation Forest' },
        { label: 'Scoring', val: '0.0 - 100.0' },
      ],
      flow: ['Organized Event', 'Pattern Analysis', 'Score Calculation', 'Threat Score Output'],
      route: '/dashboard',
    },
    {
      id: 'correlation',
      name: 'Group Related Alerts',
      icon: 'hub',
      badge: 'ALERT GROUPING',
      title: 'Combine Related Events into Incidents',
      desc: 'Bundles related alerts over 15-minute windows that share source IP addresses into a single incident timeline.',
      problem: 'Turns hundreds of individual alerts into one manageable incident.',
      connection: 'Triggers incident timelines and recommended containment steps.',
      metrics: [
        { label: 'Window', val: '15 Mins' },
        { label: 'Clustering', val: 'IP Graph' },
        { label: 'Alert Reduction', val: '85% Fewer Alerts' },
      ],
      flow: ['Single Alert Stream', 'IP Matching', 'Time Window', 'Incident Timeline'],
      route: '/dashboard',
    },
    {
      id: 'threat-intel',
      name: 'Map Threat Locations',
      icon: 'public',
      badge: 'GEOGRAPHIC MAP',
      title: 'Interactive World Threat Map',
      desc: 'Looks up IP subnets offline to map threat locations directly on an interactive vector world map.',
      problem: 'Gives visual origin clarity without relying on third-party cloud APIs.',
      connection: 'Displays threat origins across global perimeter locations.',
      metrics: [
        { label: 'Lookup', val: 'Subnet GeoIP' },
        { label: 'Mode', val: 'Offline Sovereign' },
        { label: 'Projection', val: 'Equirectangular' },
      ],
      flow: ['Attacker IP', 'Subnet Lookup', 'Location Math', 'Map Marker'],
      route: '/threat-intel',
    },
    {
      id: 'forensics',
      name: 'Verify Audit Chains',
      icon: 'verified',
      badge: 'TAMPER PROOF',
      title: 'Cryptographic Log Verification',
      desc: 'Verifies that log files have not been changed or altered using cryptographic SHA-256 Merkle tree hashing.',
      problem: 'Guarantees trustworthy, tamper-proof logs for audit compliance.',
      connection: 'Provides mathematical proof that log records are authentic.',
      metrics: [
        { label: 'Hashing', val: 'SHA-256 Merkle' },
        { label: 'Audit Verdict', val: 'Tamper-Evident' },
        { label: 'Verification', val: 'WebCrypto API' },
      ],
      flow: ['Raw Payload', 'SHA-256 Hash', 'Merkle Root', 'Audit Verdict'],
      route: '/forensics',
    },
    {
      id: 'response',
      name: 'Investigate & Contain',
      icon: 'shield',
      badge: 'ACTION STEPS',
      title: 'Clear Incident Explanations & Action Steps',
      desc: 'Shows exactly why an alert was triggered and provides ready-to-use firewall blocking commands.',
      problem: 'Removes mystery from AI scoring and speeds up incident containment.',
      connection: 'Equips analysts with immediate firewall block syntax.',
      metrics: [
        { label: 'Explanation', val: 'Clear Drivers' },
        { label: 'Playbook', val: '3-Step Mitigation' },
        { label: 'MTTR', val: '80% Faster' },
      ],
      flow: ['Incident Trigger', 'Root Cause Analysis', 'Action Steps', 'Firewall Block'],
      route: '/dashboard',
    },
    {
      id: 'reporting',
      name: 'Export Security Reports',
      icon: 'description',
      badge: 'REPORTS & EXPORTS',
      title: 'Executive Reports & CSV Exports',
      desc: 'Generates exportable summary reports and CSV log files filtered strictly to your organization.',
      problem: 'Makes audit reporting simple for management and compliance teams.',
      connection: 'Saves incident histories for permanent record-keeping.',
      metrics: [
        { label: 'Privacy', val: 'Strict Isolation' },
        { label: 'Format', val: 'CSV & Audit Report' },
        { label: 'Compliance', val: 'SOC 2 Ready' },
      ],
      flow: ['Tenant Scope', 'Filter Data', 'Generate Report', 'CSV Download'],
      route: '/dashboard',
    },
  ];

  const activeCapabilityObj = CAPABILITIES_DATA.find((c) => c.id === activeFeature) || CAPABILITIES_DATA[0];

  // Interactive System Architecture Data (Simplified Plain English Copy)
  const ARCHITECTURE_NODES = [
    {
      id: 'sources',
      name: 'Log Sources',
      type: 'ENTRY POINT',
      desc: 'Network firewalls, VPNs, and gateways sending log messages over standard network protocols.',
      components: ['Cisco ASA Firewall', 'Fortinet FortiGate VPN', 'Suricata IDS/IPS', 'pfSense Gateway'],
    },
    {
      id: 'ingestion',
      name: 'Log Collection',
      type: 'COLLECTION ENGINE',
      desc: 'Receives high-speed log streams, writes raw data to storage, and generates SHA-256 hashes.',
      components: ['Raw Log Listener', 'SHA-256 Hasher', 'Storage Manager'],
    },
    {
      id: 'normalize',
      name: 'Field Normalization',
      type: 'FORMAT STANDARDIZER',
      desc: 'Identifies vendor log formats and maps raw attributes into standard OCSF 1.1 fields.',
      components: ['Format Identifier', 'Field Mapping Module', 'Data Validator'],
    },
    {
      id: 'detection',
      name: 'Threat Detection',
      type: 'SCORING ENGINE',
      desc: 'Evaluates event patterns and rule triggers to assign clear 0-100 threat scores.',
      components: ['Anomaly Detector', 'Security Rules Engine', 'Score Calculator'],
    },
    {
      id: 'correlate',
      name: 'Alert Grouping',
      type: 'EVENT AGGREGATOR',
      desc: 'Combines related alerts sharing source IPs into unified incident timelines.',
      components: ['15-Min Time Window', 'IP Address Matcher', 'Incident Aggregator'],
    },
    {
      id: 'intelligence',
      name: 'Geographic Mapping',
      type: 'LOCATION RESOLVER',
      desc: 'Maps IP addresses to geographic coordinates for display on the threat map.',
      components: ['Offline GeoIP DB', 'World Map Projection', 'Map Pin Overlay'],
    },
    {
      id: 'response',
      name: 'Action & Containment',
      type: 'REMEDIATION STEPS',
      desc: 'Provides clear root-cause explanations and step-by-step firewall block commands.',
      components: ['Explanation Engine', '3-Step Action Guide', 'SOC Command Center'],
    },
  ];

  const activeArchObj = ARCHITECTURE_NODES.find((a) => a.id === activeArchNode) || ARCHITECTURE_NODES[0];

  return (
    <div className="bg-background text-text-primary antialiased min-h-screen flex flex-col relative overflow-x-hidden font-sans">
      <div className="scan-overlay"></div>

      {/* Editorial Navigation Header */}
      <header className="w-full bg-background border-b border-border-muted relative z-20 py-4 px-6 max-w-7xl mx-auto flex justify-between items-center">
        <Link to="/" className="font-extrabold text-xl text-primary tracking-tighter flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            security
          </span>
          <span className="font-serif tracking-normal text-text-primary">LOG AI</span>
          <span className="text-[10px] font-mono border border-border-muted px-2 py-0.5 rounded text-text-muted">
            EDITORIAL BRIEFING
          </span>
        </Link>

        {/* Navbar Anchor Links for Landing Page Sections */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-mono font-bold tracking-wider text-text-muted">
          <a href="#pipeline" className="hover:text-primary transition-colors">PIPELINE</a>
          <a href="#capabilities" className="hover:text-primary transition-colors">CAPABILITIES</a>
          <a href="#topology" className="hover:text-primary transition-colors">TOPOLOGY</a>
          <a href="#estimator" className="hover:text-primary transition-colors">ESTIMATOR</a>
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'sage' : 'dark')}
            className="px-3.5 py-1.5 rounded-lg border border-border-muted bg-surface-dim text-xs font-mono font-bold flex items-center gap-2 hover:border-primary transition-all text-text-primary"
            aria-label="Toggle visual theme mode"
          >
            <span className="material-symbols-outlined text-sm">palette</span>
            <span>{theme === 'dark' ? 'CYBER VOID' : 'SAGE GREEN'}</span>
          </button>

          <Link to="/login" className="btn-secondary px-4 py-1.5 rounded-lg text-xs font-bold font-mono">
            Sign In
          </Link>
          <Link to="/dashboard" className="btn-primary px-4 py-1.5 rounded-lg text-xs font-bold font-mono flex items-center gap-1">
            <span>SOC Console</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>
      </header>

      {/* Mobile Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border-muted z-40 md:hidden flex justify-around py-2 px-1 shadow-md">
        <Link to="/threat-intel" className="flex flex-col items-center text-text-muted hover:text-primary">
          <span className="material-symbols-outlined text-xl">security</span>
          <span className="text-[10px] font-mono mt-1">Intel</span>
        </Link>
        <Link to="/log-explorer" className="flex flex-col items-center text-text-muted hover:text-primary">
          <span className="material-symbols-outlined text-xl">database</span>
          <span className="text-[10px] font-mono mt-1">Logs</span>
        </Link>
        <Link to="/forensics" className="flex flex-col items-center text-text-muted hover:text-primary">
          <span className="material-symbols-outlined text-xl">verified</span>
          <span className="text-[10px] font-mono mt-1">Forensics</span>
        </Link>
        <Link to="/dashboard" className="flex flex-col items-center text-text-muted hover:text-primary">
          <span className="material-symbols-outlined text-xl">dashboard</span>
          <span className="text-[10px] font-mono mt-1">Command</span>
        </Link>
      </nav>

      <main className="flex-grow relative z-10 pb-24 md:pb-0">
        
        {/* CHAPTER 01: HERO BRIEFING (SIMPLIFIED PLAIN ENGLISH COPY) */}
        <section className="max-w-7xl mx-auto px-6 py-12 md:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center border-b border-border-muted">
          
          {/* Editorial Headline & Product Value */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 bg-surface-dim px-3.5 py-1 rounded-full border border-border-muted font-mono text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-bold text-text-primary uppercase tracking-widest">[ STITCH PLATFORM // OVERVIEW ]</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold text-text-primary tracking-tight leading-none font-sans">
              Make Your System Logs <span className="text-primary underline decoration-primary/40 underline-offset-8">Work for You</span>
            </h1>

            <p className="text-base sm:text-lg text-text-muted leading-relaxed font-sans max-w-2xl">
              Stitch brings your security logs together, organizes them automatically, highlights suspicious activity, and helps your team investigate incidents faster.
            </p>

            <div className="flex flex-wrap gap-4 pt-2 font-mono text-xs font-bold">
              <Link
                to="/dashboard"
                className="btn-primary px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg"
              >
                <span>[ ACCESS PLATFORM ]</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
              <a
                href="#pipeline"
                className="btn-secondary px-6 py-3 rounded-xl flex items-center gap-2"
              >
                <span>[ SEE HOW IT WORKS ]</span>
                <span className="material-symbols-outlined text-sm">arrow_downward</span>
              </a>
            </div>
          </div>

          {/* Interactive Live Log Stream Display */}
          <div className="lg:col-span-5 glass-panel p-6 rounded-2xl border border-border-muted space-y-4 shadow-2xl relative overflow-hidden">
            <div className="flex justify-between items-center border-b border-border-muted pb-3 font-mono text-xs">
              <span className="font-bold text-text-primary uppercase tracking-wider">[ LIVE SYSTEM LOG STREAM ]</span>
              <span className="text-emerald-400 font-bold">STREAM ACTIVE</span>
            </div>

            {/* Signal Flow Diagram */}
            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-surface-dim border border-border-muted flex justify-between items-center">
                <span className="text-text-muted">Log Collection Speed:</span>
                <span className="text-emerald-400 font-bold">4.2M EPS</span>
              </div>
              <div className="p-3 rounded-xl bg-surface-dim border border-border-muted flex justify-between items-center">
                <span className="text-text-muted">Field Organization:</span>
                <span className="text-primary font-bold">100% Unified</span>
              </div>
              <div className="p-3 rounded-xl bg-surface-dim border border-border-muted flex justify-between items-center">
                <span className="text-text-muted">Detection Response:</span>
                <span className="text-rose-400 font-bold">1.4s Latency</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-surface-dim border border-border-muted text-center font-mono text-[10px] text-text-dim">
              [ ANNOTATION: AUTOMATIC LOG COLLECTION & THREAT SCORING ]
            </div>
          </div>

        </section>

        {/* Supporting Metrics Bar */}
        <section className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-4 border-b border-border-muted">
          <div className="p-4 rounded-xl bg-surface-dim border border-border-muted font-mono text-center">
            <div className="text-[10px] text-text-dim uppercase tracking-wider">[ LOG PROCESSING ]</div>
            <div className="text-xl font-bold text-text-primary mt-1">OCSF 1.1</div>
            <div className="text-[10px] text-emerald-400 mt-0.5">Unified Fields</div>
          </div>
          <div className="p-4 rounded-xl bg-surface-dim border border-border-muted font-mono text-center">
            <div className="text-[10px] text-text-dim uppercase tracking-wider">[ DETECTION SPEED ]</div>
            <div className="text-xl font-bold text-secondary mt-1">1.4s</div>
            <div className="text-[10px] text-text-muted mt-0.5">Real-Time Scoring</div>
          </div>
          <div className="p-4 rounded-xl bg-surface-dim border border-border-muted font-mono text-center">
            <div className="text-[10px] text-text-dim uppercase tracking-wider">[ DATA INTEGRITY ]</div>
            <div className="text-xl font-bold text-text-primary mt-1">SHA-256</div>
            <div className="text-[10px] text-emerald-400 mt-0.5">Tamper-Proof Audit</div>
          </div>
          <div className="p-4 rounded-xl bg-surface-dim border border-border-muted font-mono text-center">
            <div className="text-[10px] text-text-dim uppercase tracking-wider">[ ALERT GROUPING ]</div>
            <div className="text-xl font-bold text-primary mt-1">15 MIN</div>
            <div className="text-[10px] text-text-muted mt-0.5">Correlated Events</div>
          </div>
        </section>

        {/* Ticker Stream */}
        <div className="w-full bg-surface border-b border-border-muted overflow-hidden h-10 flex items-center relative z-10">
          <div className="animate-marquee-smooth font-mono text-xs text-text-muted gap-8">
            {[...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS].map((item, idx) => (
              <span key={idx} className={`whitespace-nowrap ${item.color} font-medium`}>
                {item.text}
              </span>
            ))}
          </div>
        </div>

        {/* CHAPTER 02: HOW YOUR LOGS BECOME USEFUL DATA */}
        <section id="pipeline" className="max-w-7xl mx-auto px-6 py-16 border-b border-border-muted space-y-8 scroll-mt-24">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-border-muted pb-4">
            <div>
              <div className="text-xs font-mono text-text-muted uppercase tracking-widest">[ CHAPTER 02 // HOW IT WORKS ]</div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-text-primary tracking-tight mt-1">
                How Your Logs Become Useful Data
              </h2>
            </div>
            <p className="text-xs text-text-muted font-sans max-w-md">
              Logs arrive from different systems in different formats. Stitch identifies the format, reads the information, organizes the fields, and checks the data before making it available for search and analysis.
            </p>
          </div>

          <div className="space-y-6">
            {/* Interactive Stage Selector Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 font-mono text-xs">
              {PIPELINE_STAGES.map((stage) => {
                const isActive = activePipelineStage === stage.id;
                return (
                  <button
                    key={stage.id}
                    tabIndex={0}
                    onMouseEnter={() => setActivePipelineStage(stage.id)}
                    onClick={() => setActivePipelineStage(stage.id)}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setActivePipelineStage(stage.id)}
                    className={`p-4 rounded-xl border text-left flex flex-col justify-between h-24 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary ${
                      isActive
                        ? 'bg-primary text-surface-lowest border-primary shadow-xl scale-105 font-bold'
                        : 'bg-surface border-border-muted text-text-muted hover:text-text-primary hover:border-primary/50'
                    }`}
                    aria-label={`Select Stage ${stage.num}: ${stage.name}`}
                  >
                    <span className="text-[10px] opacity-75">{stage.num}</span>
                    <span className="text-xs font-extrabold leading-tight">{stage.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Active Stage Detail Panel */}
            <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-border-muted space-y-4 shadow-2xl transition-all duration-200">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-border-muted pb-4 font-mono">
                <h3 className="text-lg font-bold text-text-primary">{activePipelineObj.title}</h3>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded bg-surface-dim border border-border-muted text-[10px] text-emerald-400 font-bold">
                    {activePipelineObj.techBadge}
                  </span>
                  <span className="px-3 py-1 rounded bg-surface-dim border border-border-muted text-xs text-primary">
                    {activePipelineObj.filepath}
                  </span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-text-muted leading-relaxed font-sans">{activePipelineObj.desc}</p>

              <div className="p-4 rounded-xl bg-surface-dim border border-border-muted font-mono text-xs space-y-2">
                <div className="text-text-dim text-[10px] uppercase tracking-wider">[ SAMPLE LOG TRANSFORMATION ]</div>
                <div className="text-text-primary font-bold">{activePipelineObj.payload}</div>
                <div className="text-emerald-400 text-[11px] pt-1">
                  <span className="text-text-muted">SHA-256 Digest:</span> {activePipelineObj.digest}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CHAPTER 03: EVERYTHING YOU NEED TO MONITOR YOUR SYSTEMS */}
        <section id="capabilities" className="max-w-7xl mx-auto px-6 py-16 border-b border-border-muted space-y-8 scroll-mt-24">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-border-muted pb-4">
            <div>
              <div className="text-xs font-mono text-text-muted uppercase tracking-widest">[ CHAPTER 03 // WHAT YOU CAN DO ]</div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-text-primary tracking-tight mt-1">
                Everything You Need to Monitor Your Systems
              </h2>
            </div>
            <p className="text-xs text-text-muted font-sans max-w-md">
              Explore what you can do with Stitch using hover, tap, or focus. Select any feature to see how it works.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Interactive Capability Selector Bar (Span 4) */}
            <div className="lg:col-span-4 flex flex-col gap-2">
              {CAPABILITIES_DATA.map((cap) => {
                const isSelected = activeFeature === cap.id;
                return (
                  <button
                    key={cap.id}
                    tabIndex={0}
                    onMouseEnter={() => setActiveFeature(cap.id)}
                    onClick={() => setActiveFeature(cap.id)}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setActiveFeature(cap.id)}
                    className={`p-3.5 rounded-xl border text-left transition-all duration-150 flex items-center justify-between group focus:outline-none focus:ring-2 focus:ring-primary ${
                      isSelected
                        ? 'bg-surface-container border-primary shadow-lg ring-1 ring-primary/40'
                        : 'bg-surface-dim border-border-muted hover:border-primary/40 hover:bg-surface-hover'
                    }`}
                    aria-label={`Select capability: ${cap.name}`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                          isSelected ? 'bg-primary text-surface-lowest' : 'bg-surface border border-border-muted text-text-muted group-hover:text-primary'
                        }`}
                      >
                        <span className="material-symbols-outlined text-lg">{cap.icon}</span>
                      </div>
                      <div>
                        <div className={`font-mono text-xs font-bold ${isSelected ? 'text-primary' : 'text-text-primary'}`}>
                          {cap.name}
                        </div>
                        <div className="text-[9px] text-text-dim font-mono">{cap.badge}</div>
                      </div>
                    </div>
                    <span className={`material-symbols-outlined text-sm transition-transform ${isSelected ? 'text-primary translate-x-1' : 'text-text-dim'}`}>
                      chevron_right
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Capability Detail Panel (Span 8) */}
            <div className="lg:col-span-8 glass-panel rounded-2xl p-6 sm:p-8 border border-border-muted shadow-2xl space-y-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-border-muted pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-primary text-xl">{activeCapabilityObj.icon}</span>
                    <h3 className="text-lg font-bold text-text-primary">{activeCapabilityObj.title}</h3>
                  </div>
                  <p className="text-xs text-text-muted font-sans">{activeCapabilityObj.desc}</p>
                </div>
                <Link
                  to={activeCapabilityObj.route}
                  className="btn-secondary px-4 py-2 rounded-xl text-xs font-mono font-bold self-start sm:self-auto flex items-center gap-1.5"
                >
                  <span>Open Feature</span>
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                </Link>
              </div>

              {/* Technical Event Flow Steps */}
              <div className="space-y-2 font-mono">
                <div className="text-[10px] text-text-dim uppercase tracking-wider">[ FEATURE WORKFLOW ]</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-center">
                  {activeCapabilityObj.flow.map((step, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-surface border border-border-muted space-y-1">
                      <div className="text-[9px] text-text-dim">STEP 0{i + 1}</div>
                      <div className="font-bold text-text-primary text-[11px]">{step}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-3 gap-3 font-mono text-center pt-1">
                {activeCapabilityObj.metrics.map((m, i) => (
                  <div key={i} className="p-3 rounded-xl bg-surface-dim border border-border-muted">
                    <div className="text-[10px] text-text-dim uppercase">{m.label}</div>
                    <div className="text-base font-extrabold text-primary mt-0.5">{m.val}</div>
                  </div>
                ))}
              </div>

              {/* Problem Solved & SOC Connection Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono pt-2 border-t border-border-muted">
                <div className="p-3.5 rounded-xl bg-surface-dim border border-border-muted space-y-1">
                  <div className="text-amber-400 font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">shield</span>
                    <span>Problem Solved</span>
                  </div>
                  <p className="text-text-muted font-sans text-xs">{activeCapabilityObj.problem}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-surface-dim border border-border-muted space-y-1">
                  <div className="text-primary font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">hub</span>
                    <span>Platform Connection</span>
                  </div>
                  <p className="text-text-muted font-sans text-xs">{activeCapabilityObj.connection}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CHAPTER 04: SEE HOW EVERYTHING CONNECTS */}
        <section id="topology" className="max-w-7xl mx-auto px-6 py-16 border-b border-border-muted space-y-8 scroll-mt-24">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-border-muted pb-4">
            <div>
              <div className="text-xs font-mono text-text-muted uppercase tracking-widest">[ CHAPTER 04 // HOW STITCH WORKS ]</div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-text-primary tracking-tight mt-1">
                See How Everything Connects
              </h2>
            </div>
            <p className="text-xs text-text-muted font-sans max-w-md">
              See how logs move through Stitch, from collection and processing to detection and investigation.
            </p>
          </div>

          <div className="max-w-5xl mx-auto space-y-8">
            {/* Topology Node Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 font-mono text-xs">
              {ARCHITECTURE_NODES.map((node) => {
                const isSelected = activeArchNode === node.id;
                return (
                  <button
                    key={node.id}
                    tabIndex={0}
                    onMouseEnter={() => setActiveArchNode(node.id)}
                    onClick={() => setActiveArchNode(node.id)}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setActiveArchNode(node.id)}
                    className={`p-3 rounded-xl border font-bold text-center flex flex-col justify-between h-20 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary ${
                      isSelected
                        ? 'bg-primary text-surface-lowest border-primary shadow-xl scale-105 ring-2 ring-primary/40'
                        : 'bg-surface border-border-muted text-text-muted hover:text-text-primary hover:border-primary/50'
                    }`}
                    aria-label={`Select Topology Node: ${node.name}`}
                  >
                    <span className="text-[9px] opacity-70 uppercase">{node.type}</span>
                    <span className="text-xs font-extrabold leading-tight">{node.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Architecture Detail Box */}
            <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-border-muted space-y-4 shadow-2xl">
              <div className="flex justify-between items-center border-b border-border-muted pb-3 font-mono">
                <div>
                  <span className="text-[10px] text-primary uppercase font-bold tracking-wider">{activeArchObj.type}</span>
                  <h3 className="text-lg font-bold text-text-primary mt-0.5">{activeArchObj.name}</h3>
                </div>
                <span className="px-3 py-1 rounded bg-surface-dim border border-border-muted text-xs text-emerald-400 font-bold">
                  ACTIVE COMPONENT
                </span>
              </div>

              <p className="text-xs sm:text-sm text-text-muted leading-relaxed font-sans">{activeArchObj.desc}</p>

              <div className="space-y-2 font-mono text-xs">
                <div className="text-[10px] text-text-dim uppercase tracking-wider">[ INTERNAL COMPONENT MODULES ]</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {activeArchObj.components.map((c, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-surface-dim border border-border-muted text-center font-bold text-text-primary text-[11px]">
                      {c}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CHAPTER 05: SEE HOW MUCH TIME STITCH CAN SAVE */}
        <section id="estimator" className="max-w-7xl mx-auto px-6 py-16 space-y-8 scroll-mt-24">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="text-xs font-mono text-text-muted uppercase tracking-widest">[ CHAPTER 05 // SEE THE IMPACT ]</div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
              See How Much Time Stitch Can Save
            </h2>
            <p className="text-xs text-text-muted leading-relaxed font-sans">
              Adjust the inputs to estimate how much analyst time your team could save by reducing manual log analysis and speeding up investigations.
            </p>
          </div>

          <div className="glass-panel rounded-2xl p-8 max-w-4xl mx-auto border border-border-muted shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Sliders */}
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-xs font-mono mb-2">
                    <span className="font-bold text-text-primary">Daily Log Volume (Events / Day)</span>
                    <span className="text-primary font-bold">{logVolume.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="10000"
                    max="10000000"
                    step="10000"
                    value={logVolume}
                    onChange={(e) => setLogVolume(Number(e.target.value))}
                    className="w-full cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-text-muted mt-1">
                    <span>10K</span>
                    <span>5M</span>
                    <span>10M</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono mb-2">
                    <span className="font-bold text-text-primary">Perimeter Devices Monitored</span>
                    <span className="text-primary font-bold">{devicesMonitored}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="500"
                    value={devicesMonitored}
                    onChange={(e) => setDevicesMonitored(Number(e.target.value))}
                    className="w-full cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-text-muted mt-1">
                    <span>1</span>
                    <span>250</span>
                    <span>500</span>
                  </div>
                </div>
              </div>

              {/* Output Results */}
              <div className="bg-surface-dim rounded-xl p-6 border border-border-muted space-y-6 text-center">
                <div>
                  <div className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-1">Analyst Hours Saved / Month</div>
                  <div className="text-3xl font-extrabold font-mono text-text-primary">{hoursSaved} hrs</div>
                </div>

                <div>
                  <div className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-1">Estimated MTTR Reduction</div>
                  <div className="text-3xl font-extrabold font-mono text-emerald-400">{mttrReduction}%</div>
                </div>

                <div>
                  <div className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-1">Estimated Monthly Cost Savings</div>
                  <div className="text-3xl font-extrabold font-mono text-primary">${monthlySavings} / mo</div>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Editorial Footer */}
      <footer className="w-full py-8 border-t border-border-muted bg-surface-dim text-center text-text-dim text-xs font-mono">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="font-extrabold text-base text-text-primary font-serif">LOG AI INTELLIGENCE ENGINE</div>
          <div className="flex gap-4">
            <Link to="/login" className="hover:text-primary transition-colors">Sign In</Link>
            <Link to="/register" className="hover:text-primary transition-colors">Register</Link>
            <Link to="/threat-intel" className="hover:text-primary transition-colors">Threat Intel</Link>
            <Link to="/dashboard" className="hover:text-primary transition-colors">SOC Console</Link>
          </div>
          <div>© 2026 Log AI Engine. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
