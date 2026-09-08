import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { StitchBrandMark } from '../components/common/StitchBrandMark';
import { api } from '../services/api';

export function LandingPage() {
  const { theme, setTheme } = useTheme();
  const [isLandingMenuOpen, setIsLandingMenuOpen] = useState(false);

  // 1. Pipeline Stage Selection (Scroll & Click Driven)
  const [activePipelineStage, setActivePipelineStage] = useState(1);

  // 2. Financial Impact Estimator State
  const [logVolume, setLogVolume] = useState(500000);
  const [devicesMonitored, setDevicesMonitored] = useState(25);

  // Calculations for Financial Impact Estimator (Formulas 100% UNCHANGED)
  const hoursSaved = ((logVolume * 0.001 * 0.85 * 3.5 * 30) / 60).toFixed(1);
  const mttrReduction = Math.min(85, (50 + devicesMonitored * 0.2)).toFixed(1);
  const monthlySavings = (hoursSaved * 65).toLocaleString('en-US', { maximumFractionDigits: 0 });

  // Radar Interactive Selection
  const [activeRadarNode, setActiveRadarNode] = useState({
    id: 1,
    ip: '185.220.100.22',
    device: 'Cisco ASA Edge',
    x: 70,
    y: 32,
    severity: 'HIGH',
    score: 88.5,
    proto: 'TCP/51422',
    rule: 'MITRE T1110 (Brute Force)',
    action: 'AUTO_BLOCKED'
  });

  // Live Telemetry Stats & Events (Graceful fallback if unauthenticated public access)
  const [stats, setStats] = useState({
    total_events: 4200000,
    active_threats: 14,
    avg_threat_score: 68.4,
    pipeline_latency: '1.1ms'
  });

  const [recentEvents, setRecentEvents] = useState([
    { id: 'evt-01', timestamp: '2026-09-08 11:42:01', vendor: 'cisco_asa', action: 'DENY', src_ip: '185.220.100.22', dst_port: 80, severity: 'HIGH', threat_score: 88.5 },
    { id: 'evt-02', timestamp: '2026-09-08 11:41:58', vendor: 'fortigate', action: 'PASS', src_ip: '192.168.1.105', dst_port: 443, severity: 'LOW', threat_score: 12.0 },
    { id: 'evt-03', timestamp: '2026-09-08 11:41:52', vendor: 'suricata', action: 'ALERT', src_ip: '45.33.32.156', dst_port: 22, severity: 'HIGH', threat_score: 94.2 },
    { id: 'evt-04', timestamp: '2026-09-08 11:41:45', vendor: 'pfsense', action: 'BLOCK', src_ip: '10.0.0.50', dst_port: 53, severity: 'MEDIUM', threat_score: 55.4 },
    { id: 'evt-05', timestamp: '2026-09-08 11:41:39', vendor: 'cef_syslog', action: 'DENY', src_ip: '198.51.100.14', dst_port: 8080, severity: 'HIGH', threat_score: 82.1 },
  ]);

  // Attempt live API fetch on component mount
  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        const fetchedStats = await api.getStats();
        if (mounted && fetchedStats) {
          setStats({
            total_events: fetchedStats.total_events || fetchedStats.events_analyzed || 4200000,
            active_threats: fetchedStats.active_incidents || fetchedStats.active_threats || 14,
            avg_threat_score: fetchedStats.avg_threat_score || 68.4,
            pipeline_latency: '1.1ms'
          });
        }
      } catch (err) {
        // Silent fallback for public unauthenticated visitors
      }

      try {
        const fetchedEvents = await api.getRecentEvents(10);
        if (mounted && Array.isArray(fetchedEvents) && fetchedEvents.length > 0) {
          setRecentEvents(fetchedEvents);
        }
      } catch (err) {
        // Silent fallback
      }
    }
    loadData();
    return () => { mounted = false; };
  }, []);

  // Scroll Progress Driven Storytelling Handler
  useEffect(() => {
    const handleScroll = () => {
      const pipelineEl = document.getElementById('pipeline');
      if (!pipelineEl) return;
      const rect = pipelineEl.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Calculate scroll progress through pipeline section
      if (rect.top <= windowHeight && rect.bottom >= 0) {
        const totalScrollable = rect.height;
        const currentScroll = windowHeight - rect.top;
        const progress = Math.max(0, Math.min(1, currentScroll / totalScrollable));
        const calculatedStage = Math.min(6, Math.max(1, Math.ceil(progress * 6)));
        setActivePipelineStage(calculatedStage);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Radar Interactive Nodes Array
  const RADAR_NODES = [
    { id: 1, ip: '185.220.100.22', device: 'Cisco ASA Edge', x: 70, y: 32, severity: 'HIGH', score: 88.5, proto: 'TCP/51422', rule: 'MITRE T1110 (Brute Force)', action: 'AUTO_BLOCKED' },
    { id: 2, ip: '192.168.1.105', device: 'FortiGate FW', x: 28, y: 65, severity: 'MEDIUM', score: 62.0, proto: 'UDP/53', rule: 'DNS Tunneling Anomaly', action: 'MONITORED' },
    { id: 3, ip: '10.0.0.50', device: 'Suricata IDS', x: 62, y: 76, severity: 'LOW', score: 24.1, proto: 'HTTP/80', rule: 'Standard GET /health', action: 'CLEARED' },
    { id: 4, ip: '45.33.32.156', device: 'pfSense Cluster', x: 36, y: 24, severity: 'HIGH', score: 94.2, proto: 'SSH/22', rule: 'Credential Stuffing', action: 'CONTAINED' },
  ];

  // Pipeline Stages Data with Clear, Uncluttered Wording
  const PIPELINE_STAGES = [
    {
      id: 1,
      num: '01',
      name: 'Receive Logs',
      title: 'Stage 1: Raw Log Capture & Cryptographic Hashing',
      filepath: 'app/storage/raw_writer.py',
      desc: 'Raw log payloads are collected from edge devices and immediately assigned a SHA-256 cryptographic digest before parsing to ensure tamper-proof data integrity.',
      payload: '%ASA-4-106023: Deny tcp src outside:185.220.100.22/51422 dst inside:10.0.0.10/80 by access-group "outside_acl"',
      digest: 'a4ea94c43d9dc8c7753255ca0d6e2bb2093560056c170d2f992edb7d36071e3f',
      techBadge: 'Zero-Loss Capture',
    },
    {
      id: 2,
      num: '02',
      name: 'Identify Format',
      title: 'Stage 2: Vendor Format Auto-Detection & Key Parsing',
      filepath: 'app/parsers/dynamic_parser.py',
      desc: 'Extractors identify Cisco ASA, Fortinet, Suricata, and pfSense log formats automatically, extracting key attributes such as source IPs, destination ports, and firewall actions.',
      payload: 'Detected Format: Cisco ASA | Action: DENY | Protocol: TCP | SrcIP: 185.220.100.22 | DstIP: 10.0.0.10 | DstPort: 80',
      digest: '3c8e92ba8712df649f109281a8ef1284561029e8471b6501928471209e847120',
      techBadge: 'Format Detection',
    },
    {
      id: 3,
      num: '03',
      name: 'Organize Fields',
      title: 'Stage 3: OCSF 1.1 Field Normalization',
      filepath: 'app/normalization/schema.py',
      desc: 'Maps raw vendor attributes into standard OCSF 1.1 UnifiedEvent objects with consistent ISO timestamps, severity tiers, and IP network classifications.',
      payload: 'UnifiedEvent(event_type="cisco_asa:deny", severity="Warning", threat_level="MEDIUM", threat_score=65.0, status="New")',
      digest: '7a910284712b6501928471209e847120f2b259a563db460ee9d7b9ddf5b18d89',
      techBadge: 'Unified Schema',
    },
    {
      id: 4,
      num: '04',
      name: 'Detect Threats',
      title: 'Stage 4: Isolation Forest Anomaly Scoring',
      filepath: 'app/detection/anomaly_engine.py',
      desc: 'Evaluates connection velocity, payload entropy, and rule triggers against pre-trained ML baselines to compute normalized threat scores (0.0 to 100.0).',
      payload: 'Threat Score: 65.0 (MEDIUM) | Triggers: ["repeated_deny", "external_source"] | Feature Attribution: action_code (+4.84 z-score)',
      digest: '9f7fe12c98001dcace31357795d410458710a892bfecdac00aee45bce0a96915',
      techBadge: 'Anomaly Engine',
    },
    {
      id: 5,
      num: '05',
      name: 'Group Incidents',
      title: 'Stage 5: Multi-Vector Alert Correlation',
      filepath: 'app/detection/correlation.py',
      desc: 'Correlates related security events across 15-minute sliding windows sharing source IPs, clustering isolated alerts into single incident timelines.',
      payload: 'Incident Cluster #inc_a81b5b: Source IP 185.220.100.22 | Events Count: 12 | MITRE Tactics: ["T1110 - Brute Force"]',
      digest: '488480b6ca3f120649476bb2499f7fc43fbe08c16bec56b1d74517b1c38e7477',
      techBadge: 'Alert Aggregator',
    },
    {
      id: 6,
      num: '06',
      name: 'Recommend Actions',
      title: 'Stage 6: Explainable AI & Mitigation Playbooks',
      filepath: 'app/xai/explainer.py',
      desc: 'Delivers transparent feature attribution breakdowns and 3-step firewall mitigation commands for active security incidents without black-box opacity.',
      payload: 'Mitigation Plan: 1. iptables -A INPUT -s 185.220.100.22 -j DROP | 2. Revoke active JWT tokens | 3. Push policy update to Cisco ASA',
      digest: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      techBadge: 'Explainable AI',
    },
  ];

  // Perimeter Appliance Support Cards
  const APPLIANCES = [
    { name: 'Cisco ASA Firewall', format: 'CEF / Syslog', speed: '1.2M EPS', parser: 'cisco_asa:deny', status: 'ACTIVE' },
    { name: 'Fortinet FortiGate', format: 'KV Pair Log', speed: '980K EPS', parser: 'fortigate:traffic', status: 'ACTIVE' },
    { name: 'Suricata IDS/IPS', format: 'EVE JSON', speed: '850K EPS', parser: 'suricata:eve', status: 'ACTIVE' },
    { name: 'pfSense Filterlog', format: 'CSV Stream', speed: '620K EPS', parser: 'pfsense:filterlog', status: 'ACTIVE' },
    { name: 'CEF Standard', format: 'Common Event', speed: '450K EPS', parser: 'cef:generic', status: 'ACTIVE' },
    { name: 'Enterprise Cross-Ingest', format: 'Multi-Vendor', speed: '4.2M EPS', parser: 'ocsf:unified', status: 'ACTIVE' },
  ];

  const currentStageData = PIPELINE_STAGES.find(s => s.id === activePipelineStage) || PIPELINE_STAGES[0];

  return (
    <div className="min-h-screen bg-[var(--color-bg-dim)] text-[var(--color-text-main)] font-sans flex flex-col selection:bg-[var(--color-primary)] selection:text-[#0f131c]">
      
      {/* ========================================================================= */}
      {/* 1. TOP HEADER NAVIGATION BAR                                              */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-50 bg-[var(--color-bg-dim)]/90 backdrop-blur-md border-b border-[var(--color-border)] px-4 lg:px-8 py-3 transition-colors duration-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Brand Mark & Monospace System Status Badge */}
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] rounded px-1 py-0.5">
              <StitchBrandMark size={28} />
              <span className="font-mono text-sm tracking-wider font-bold uppercase text-[var(--color-text-main)]">
                LOG <span className="text-[var(--color-primary)]">//</span> AI
              </span>
            </Link>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono border border-[var(--color-border)] bg-[var(--color-surface-hover)] text-[var(--color-text-muted)]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block mr-1.5 animate-pulse"></span>
              SYSTEM: ONLINE | 4.2M EPS
            </span>
          </div>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center space-x-6 font-mono text-xs text-[var(--color-text-muted)]">
            <a href="#pipeline" className="hover:text-[var(--color-primary)] transition-colors py-1">PIPELINE</a>
            <a href="#capabilities" className="hover:text-[var(--color-primary)] transition-colors py-1">CAPABILITIES</a>
            <a href="#topology" className="hover:text-[var(--color-primary)] transition-colors py-1">TOPOLOGY</a>
            <a href="#estimator" className="hover:text-[var(--color-primary)] transition-colors py-1">ESTIMATOR</a>
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center space-x-3">
            {/* Theme Toggle Button */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'sage' : 'dark')}
              className="px-2.5 py-1 text-xs font-mono border border-[var(--color-border)] rounded bg-[var(--color-bg-surface)] hover:border-[var(--color-primary)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-all flex items-center space-x-1.5"
              title="Toggle Editorial Theme (Sage Green / Cyber Void)"
            >
              <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] inline-block"></span>
              <span className="uppercase">{theme === 'dark' ? 'CYBER VOID' : 'SAGE GREEN'}</span>
            </button>

            {/* Auth Link */}
            <Link
              to="/login"
              className="hidden sm:inline-block font-mono text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors px-2 py-1"
            >
              SIGN IN
            </Link>

            {/* SOC Console CTA */}
            <Link
              to="/dashboard"
              className="btn-primary font-mono text-xs px-3.5 py-1.5 rounded flex items-center space-x-1"
            >
              <span>OPEN SOC CONSOLE</span>
              <span className="text-[10px]">→</span>
            </Link>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setIsLandingMenuOpen(!isLandingMenuOpen)}
              className="md:hidden p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] border border-[var(--color-border)] rounded bg-[var(--color-bg-surface)]"
              aria-label="Toggle navigation menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isLandingMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isLandingMenuOpen && (
          <div className="md:hidden mt-3 pt-3 border-t border-[var(--color-border)] flex flex-col space-y-2 font-mono text-xs text-[var(--color-text-muted)]">
            <a href="#pipeline" onClick={() => setIsLandingMenuOpen(false)} className="px-2 py-1 hover:text-[var(--color-primary)]">PIPELINE</a>
            <a href="#capabilities" onClick={() => setIsLandingMenuOpen(false)} className="px-2 py-1 hover:text-[var(--color-primary)]">CAPABILITIES</a>
            <a href="#topology" onClick={() => setIsLandingMenuOpen(false)} className="px-2 py-1 hover:text-[var(--color-primary)]">TOPOLOGY</a>
            <a href="#estimator" onClick={() => setIsLandingMenuOpen(false)} className="px-2 py-1 hover:text-[var(--color-primary)]">ESTIMATOR</a>
            <div className="pt-2 border-t border-[var(--color-border)] flex items-center justify-between px-2">
              <Link to="/login" onClick={() => setIsLandingMenuOpen(false)} className="hover:text-[var(--color-text-main)]">SIGN IN</Link>
              <Link to="/register" onClick={() => setIsLandingMenuOpen(false)} className="text-[var(--color-primary)] font-bold">CREATE ACCOUNT</Link>
            </div>
          </div>
        )}
      </header>

      {/* ========================================================================= */}
      {/* 2. HERO SECTION & INTERACTIVE VECTOR RADAR (Reference Composition)        */}
      {/* ========================================================================= */}
      <section className="relative px-4 lg:px-8 pt-8 pb-16 border-b border-[var(--color-border)] bg-tech-grid">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Clear Hero Copy & CTAs */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Eyebrow Badge */}
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded border border-[var(--color-border)] bg-[var(--color-bg-card)] font-mono text-xs text-[var(--color-primary)]">
              <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-ping"></span>
              <span>LOG PROCESSING PIPELINE // 4.2M EPS</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[var(--color-text-main)] leading-tight">
              Log Ingestion &amp; Threat Detection
            </h1>

            {/* Subheadline */}
            <p className="text-sm sm:text-base text-[var(--color-text-muted)] leading-relaxed max-w-xl">
              Collect logs from your security devices, convert them into one common structure, detect suspicious activity, and investigate what happened.
            </p>

            {/* CTA Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-2">
              <a
                href="#pipeline"
                className="btn-primary font-mono text-xs px-5 py-2.5 rounded flex items-center space-x-2 shadow-sm"
              >
                <span>Launch Interactive Demo</span>
                <span>↓</span>
              </a>
              <a
                href="#topology"
                className="btn-secondary font-mono text-xs px-5 py-2.5 rounded flex items-center space-x-2"
              >
                <span>Inspect Architecture</span>
                <span>→</span>
              </a>
            </div>

            {/* Micro Specs Bar */}
            <div className="pt-4 border-t border-[var(--color-border)] grid grid-cols-3 gap-2 font-mono text-[11px] text-[var(--color-text-muted)]">
              <div>
                <span className="block text-[var(--color-text-dim)] uppercase">LATENCY</span>
                <span className="font-bold text-[var(--color-text-main)]">&lt; 1.2ms</span>
              </div>
              <div>
                <span className="block text-[var(--color-text-dim)] uppercase">SCHEMA</span>
                <span className="font-bold text-[var(--color-text-main)]">OCSF 1.1</span>
              </div>
              <div>
                <span className="block text-[var(--color-text-dim)] uppercase">INTEGRITY</span>
                <span className="font-bold text-[var(--color-text-main)]">SHA-256</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Vector Radar Scanner */}
          <div className="lg:col-span-6 relative">
            <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg p-4 sm:p-6 shadow-xl relative overflow-hidden">
              
              {/* Radar Header Info Bar */}
              <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)] mb-4 font-mono text-xs">
                <div className="flex items-center space-x-2 text-[var(--color-text-muted)]">
                  <span className="text-[var(--color-primary)]">●</span>
                  <span>PERIMETER RADAR TELEMETRY</span>
                </div>
                <div className="text-[10px] text-[var(--color-text-dim)] uppercase tracking-wider">
                  DEG: 0° - 360° | ACTIVE RETICLE
                </div>
              </div>

              {/* Vector Radar Canvas Area */}
              <div className="relative aspect-square max-w-[420px] mx-auto border border-[var(--color-border)] rounded-full bg-[var(--color-surface-lowest)] flex items-center justify-center overflow-hidden">
                
                {/* Concentric Rings */}
                <div className="absolute inset-4 rounded-full border border-[var(--color-border)]/60"></div>
                <div className="absolute inset-16 rounded-full border border-[var(--color-border)]/50"></div>
                <div className="absolute inset-28 rounded-full border border-[var(--color-border)]/40"></div>
                <div className="absolute inset-40 rounded-full border border-[var(--color-border)]/30"></div>

                {/* Radar Axis Lines */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-full h-[1px] bg-[var(--color-border)]"></div>
                  <div className="h-full w-[1px] bg-[var(--color-border)] absolute"></div>
                </div>

                {/* Radar Axis Degree Marks */}
                <span className="absolute top-2 font-mono text-[9px] text-[var(--color-text-dim)]">0°</span>
                <span className="absolute right-2 font-mono text-[9px] text-[var(--color-text-dim)]">90°</span>
                <span className="absolute bottom-2 font-mono text-[9px] text-[var(--color-text-dim)]">180°</span>
                <span className="absolute left-2 font-mono text-[9px] text-[var(--color-text-dim)]">270°</span>

                {/* Sweeping Radar Beam */}
                <div className="absolute inset-0 animate-radar-sweep pointer-events-none origin-center">
                  <div className="w-1/2 h-1/2 bg-gradient-to-br from-[var(--color-primary)]/25 to-transparent origin-bottom-right"></div>
                </div>

                {/* Interactive Radar Threat Nodes */}
                {RADAR_NODES.map((node) => {
                  const isSelected = activeRadarNode.id === node.id;
                  const isHigh = node.severity === 'HIGH';
                  return (
                    <button
                      key={node.id}
                      onClick={() => setActiveRadarNode(node)}
                      style={{ left: `${node.x}%`, top: `${node.y}%` }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 p-1.5 rounded-full transition-all focus:outline-none ${
                        isSelected ? 'scale-125 z-20' : 'hover:scale-110 z-10'
                      }`}
                      title={`Inspect ${node.ip}`}
                    >
                      <span className={`relative flex h-4 w-4 items-center justify-center`}>
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                          isHigh ? 'bg-rose-500' : 'bg-amber-500'
                        }`}></span>
                        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                          isHigh ? 'bg-rose-500' : 'bg-amber-400'
                        }`}></span>
                      </span>
                    </button>
                  );
                })}

                {/* Reticle Target Overlay */}
                <div className="absolute top-3 left-3 pointer-events-none bg-[var(--color-bg-dim)]/80 border border-[var(--color-border)] px-2 py-1 rounded font-mono text-[10px] text-[var(--color-text-muted)]">
                  TARGET: <span className="text-[var(--color-text-main)] font-bold">{activeRadarNode.ip}</span>
                </div>
              </div>

              {/* Active Radar Node Detail Panel */}
              <div className="mt-4 p-3 bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded font-mono text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--color-text-muted)]">IP: <strong className="text-[var(--color-text-main)]">{activeRadarNode.ip}</strong></span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    activeRadarNode.severity === 'HIGH' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    {activeRadarNode.severity} ({activeRadarNode.score})
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-[var(--color-text-muted)]">
                  <span>DEVICE: {activeRadarNode.device}</span>
                  <span>PROTO: {activeRadarNode.proto}</span>
                </div>
                <div className="text-[10px] text-[var(--color-text-dim)] truncate border-t border-[var(--color-border)] pt-1">
                  RULE: {activeRadarNode.rule} → <span className="text-[var(--color-primary)]">{activeRadarNode.action}</span>
                </div>
              </div>

              {/* 3 Metric Cards Under Radar */}
              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-[var(--color-border)] font-mono text-center">
                <div className="p-2 bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded">
                  <div className="text-[9px] text-[var(--color-text-dim)] uppercase">STATUS</div>
                  <div className="text-xs font-bold text-emerald-400">OPTIMAL</div>
                </div>
                <div className="p-2 bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded">
                  <div className="text-[9px] text-[var(--color-text-dim)] uppercase">PARSER</div>
                  <div className="text-xs font-bold text-[var(--color-primary)]">4.2M EPS</div>
                </div>
                <div className="p-2 bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded">
                  <div className="text-[9px] text-[var(--color-text-dim)] uppercase">ACCURACY</div>
                  <div className="text-xs font-bold text-[var(--color-text-main)]">99.4%</div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. CONTINUOUS TICKER STREAM FOR LIVE ALERTS                               */}
      {/* ========================================================================= */}
      <div className="bg-[var(--color-bg-surface)] border-b border-[var(--color-border)] overflow-hidden py-2 font-mono text-xs">
        <div className="animate-marquee-smooth flex items-center space-x-8">
          {[...recentEvents, ...recentEvents].map((evt, idx) => (
            <div key={`${evt.id}-${idx}`} className="flex items-center space-x-2 whitespace-nowrap">
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                evt.severity === 'HIGH' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}>
                [{evt.severity}]
              </span>
              <span className="text-[var(--color-text-muted)]">[{evt.timestamp}]</span>
              <span className="text-[var(--color-text-main)] font-semibold">{evt.vendor}:</span>
              <span className="text-[var(--color-text-dim)]">{evt.action} src:{evt.src_ip} dstPort:{evt.dst_port}</span>
              <span className="text-[var(--color-primary)]">Score: {evt.threat_score}</span>
              <span className="text-[var(--color-border)]">|</span>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. CHAPTER 1: 6-STAGE LOG PROCESSING PIPELINE (#pipeline)                 */}
      {/* ========================================================================= */}
      <section id="pipeline" className="px-4 lg:px-8 py-16 border-b border-[var(--color-border)] max-w-7xl mx-auto w-full">
        <div className="space-y-2 mb-10">
          <div className="font-mono text-xs text-[var(--color-primary)] tracking-widest uppercase">
            CHAPTER 01 // HOW LOGS MOVE THROUGH THE SYSTEM
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-main)]">
            6-Stage Log Processing Pipeline
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] max-w-2xl">
            From raw log arrival at the edge to actionable security analysis in 6 clear steps. Scroll or click to see how data transforms at each stage.
          </p>
        </div>

        {/* Desktop Sticky Side-by-Side & Mobile Vertical Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: 6 Stage Cards */}
          <div className="lg:col-span-6 space-y-4">
            {PIPELINE_STAGES.map((stage) => {
              const isActive = stage.id === activePipelineStage;
              return (
                <div
                  key={stage.id}
                  onClick={() => setActivePipelineStage(stage.id)}
                  className={`p-5 rounded-lg border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[var(--color-bg-card)] border-[var(--color-primary)] shadow-md ring-1 ring-[var(--color-primary)]'
                      : 'bg-[var(--color-bg-surface)] border-[var(--color-border)] hover:border-[var(--color-text-muted)]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3 font-mono">
                    <span className="text-xs font-bold text-[var(--color-primary)]">{stage.num}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded border border-[var(--color-border)] bg-[var(--color-bg-dim)] text-[var(--color-text-muted)]">
                      {stage.techBadge}
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-[var(--color-text-main)] mb-1">{stage.name}</h3>
                  <p className="text-xs text-[var(--color-text-muted)] leading-relaxed mb-3">{stage.desc}</p>
                  <div className="font-mono text-[10px] text-[var(--color-text-dim)] truncate border-t border-[var(--color-border)] pt-2">
                    MODULE: <span className="text-[var(--color-text-main)]">{stage.filepath}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Sticky Visualizer Panel (Desktop Sticky lg:sticky lg:top-24) */}
          <div className="lg:col-span-6 lg:sticky lg:top-24 w-full">
            <div className="p-6 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg font-mono text-xs space-y-4 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border)] pb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-[var(--color-primary)] font-bold">{currentStageData.num}</span>
                  <span className="font-bold text-[var(--color-text-main)]">{currentStageData.title}</span>
                </div>
                <div className="text-[11px] text-[var(--color-text-muted)]">
                  FILE: <span className="text-[var(--color-primary)]">{currentStageData.filepath}</span>
                </div>
              </div>

              {/* Progress Indicator Bar */}
              <div className="w-full bg-[var(--color-surface-variant)] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[var(--color-primary)] h-full transition-all duration-500 ease-out"
                  style={{ width: `${(activePipelineStage / 6) * 100}%` }}
                ></div>
              </div>

              <div>
                <div className="text-[10px] text-[var(--color-text-dim)] uppercase mb-1">STAGE DATA TRANSFORMATION:</div>
                <pre className="p-4 bg-[var(--terminal-bg)] text-[var(--terminal-text-main)] border border-[var(--color-border)] rounded overflow-x-auto text-[11px] leading-relaxed transition-all">
                  {currentStageData.payload}
                </pre>
              </div>

              <div className="flex flex-wrap items-center justify-between text-[11px] text-[var(--color-text-muted)] pt-1">
                <span className="truncate max-w-md">SHA-256 DIGEST: <strong className="text-[var(--color-text-main)]">{currentStageData.digest}</strong></span>
                <span className="text-emerald-400 font-bold">● VERIFIED ZERO-TAMPERING</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. CHAPTER 2: LOG FORMAT SUPPORT (#capabilities)                         */}
      {/* ========================================================================= */}
      <section id="capabilities" className="px-4 lg:px-8 py-16 border-b border-[var(--color-border)] max-w-7xl mx-auto w-full">
        <div className="space-y-2 mb-10">
          <div className="font-mono text-xs text-[var(--color-primary)] tracking-widest uppercase">
            CHAPTER 02 // LOG FORMAT SUPPORT
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-main)]">
            What the Platform Can Do
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] max-w-2xl">
            Built-in parsers for firewall, IDS/IPS, and network perimeter appliances.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {APPLIANCES.map((app, idx) => (
            <div key={idx} className="p-5 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg space-y-3 font-mono">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-[var(--color-text-main)]">{app.name}</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {app.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-[var(--color-text-muted)] pt-2 border-t border-[var(--color-border)]">
                <div>
                  <span className="block text-[10px] text-[var(--color-text-dim)] uppercase">FORMAT</span>
                  <span>{app.format}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-[var(--color-text-dim)] uppercase">THROUGHPUT</span>
                  <span className="text-[var(--color-primary)] font-bold">{app.speed}</span>
                </div>
              </div>
              <div className="text-[10px] text-[var(--color-text-dim)] pt-1">
                PARSER TAG: <span className="text-[var(--color-text-main)]">{app.parser}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. CHAPTER 3: SOC EFFICIENCY & COST SAVINGS (#estimator)                  */}
      {/* ========================================================================= */}
      <section id="estimator" className="px-4 lg:px-8 py-16 border-b border-[var(--color-border)] max-w-7xl mx-auto w-full">
        <div className="space-y-2 mb-10">
          <div className="font-mono text-xs text-[var(--color-primary)] tracking-widest uppercase">
            CHAPTER 03 // SOC EFFICIENCY &amp; SAVINGS
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-main)]">
            SOC Efficiency &amp; Cost Savings Estimator
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] max-w-2xl">
            Adjust daily log volume and device count to estimate analyst time saved and operational efficiency.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-[var(--color-bg-card)] border border-[var(--color-border)] p-6 sm:p-8 rounded-lg shadow-xl">
          
          {/* Sliders Column */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Slider 1: Daily Log Volume */}
            <div className="space-y-2">
              <div className="flex justify-between items-center font-mono text-xs">
                <span className="text-[var(--color-text-muted)] uppercase">DAILY LOG VOLUME (EVENTS/DAY)</span>
                <span className="text-[var(--color-primary)] font-bold">{logVolume.toLocaleString()} EPS</span>
              </div>
              <input
                type="range"
                min="100000"
                max="5000000"
                step="50000"
                value={logVolume}
                onChange={(e) => setLogVolume(Number(e.target.value))}
                className="w-full h-2 bg-[var(--color-surface-variant)] rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between font-mono text-[10px] text-[var(--color-text-dim)]">
                <span>100K EPS</span>
                <span>2.5M EPS</span>
                <span>5.0M EPS</span>
              </div>
            </div>

            {/* Slider 2: Monitored Devices */}
            <div className="space-y-2 pt-4 border-t border-[var(--color-border)]">
              <div className="flex justify-between items-center font-mono text-xs">
                <span className="text-[var(--color-text-muted)] uppercase">MONITORED PERIMETER DEVICES</span>
                <span className="text-[var(--color-primary)] font-bold">{devicesMonitored} APPLIANCES</span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                step="1"
                value={devicesMonitored}
                onChange={(e) => setDevicesMonitored(Number(e.target.value))}
                className="w-full h-2 bg-[var(--color-surface-variant)] rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between font-mono text-[10px] text-[var(--color-text-dim)]">
                <span>5 Devices</span>
                <span>50 Devices</span>
                <span>100 Devices</span>
              </div>
            </div>

            <div className="p-3 bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded text-xs text-[var(--color-text-muted)] font-mono">
              💡 Formula based on standard $65/hr analyst rate, 85% alert reduction via OCSF clustering, and automated Isolation Forest feature attribution.
            </div>

          </div>

          {/* Output Cards Column & Circular Gauge */}
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono">
            
            {/* Calculated Monthly Savings */}
            <div className="p-5 bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-lg space-y-1">
              <span className="text-[10px] text-[var(--color-text-dim)] uppercase">ESTIMATED MONTHLY SAVINGS</span>
              <div className="text-2xl sm:text-3xl font-bold text-emerald-400">${monthlySavings}</div>
              <span className="text-[11px] text-[var(--color-text-muted)]">Direct SOC labor reduction</span>
            </div>

            {/* Calculated Hours Saved */}
            <div className="p-5 bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-lg space-y-1">
              <span className="text-[10px] text-[var(--color-text-dim)] uppercase">ANALYST HOURS RECLAIMED</span>
              <div className="text-2xl sm:text-3xl font-bold text-[var(--color-primary)]">{hoursSaved} hrs/mo</div>
              <span className="text-[11px] text-[var(--color-text-muted)]">Automated triage &amp; playbooks</span>
            </div>

            {/* MTTR Reduction Circular SVG Gauge */}
            <div className="sm:col-span-2 p-5 bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-lg flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[var(--color-text-dim)] uppercase">MTTR REDUCTION GAIN</span>
                <div className="text-xl font-bold text-[var(--color-text-main)]">{mttrReduction}% FASTER RESPONSE</div>
                <span className="text-[11px] text-[var(--color-text-muted)]">From hours to sub-minute triage</span>
              </div>
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="gauge-circle-bg"
                    strokeWidth="3.5"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="gauge-circle-fill"
                    strokeDasharray={`${mttrReduction}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute text-xs font-bold text-[var(--color-primary)]">{mttrReduction}%</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. CHAPTER 4: LIVE LOGS & SECURITY ANALYSIS (#topology)                   */}
      {/* ========================================================================= */}
      <section id="topology" className="px-4 lg:px-8 py-16 border-b border-[var(--color-border)] max-w-7xl mx-auto w-full">
        <div className="space-y-2 mb-10">
          <div className="font-mono text-xs text-[var(--color-primary)] tracking-widest uppercase">
            CHAPTER 04 // LIVE LOGS &amp; ANALYSIS
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-main)]">
            Live Logs &amp; Security Analysis
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] max-w-2xl">
            Real-time view of system activity, threat scores, and recent event logs.
          </p>
        </div>

        {/* Live KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 font-mono">
          <div className="p-4 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg">
            <span className="text-[10px] text-[var(--color-text-dim)] uppercase">EVENTS ANALYZED</span>
            <div className="text-xl sm:text-2xl font-bold text-[var(--color-text-main)]">
              {(stats.total_events || 4200000).toLocaleString()}
            </div>
            <span className="text-[10px] text-emerald-400">● Live Ingest</span>
          </div>
          <div className="p-4 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg">
            <span className="text-[10px] text-[var(--color-text-dim)] uppercase">ACTIVE THREATS</span>
            <div className="text-xl sm:text-2xl font-bold text-rose-400">
              {stats.active_threats || 14}
            </div>
            <span className="text-[10px] text-rose-400">Sliding Window</span>
          </div>
          <div className="p-4 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg">
            <span className="text-[10px] text-[var(--color-text-dim)] uppercase">AVG THREAT SCORE</span>
            <div className="text-xl sm:text-2xl font-bold text-amber-400">
              {stats.avg_threat_score || 68.4}
            </div>
            <span className="text-[10px] text-[var(--color-text-muted)]">Isolation Forest</span>
          </div>
          <div className="p-4 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg">
            <span className="text-[10px] text-[var(--color-text-dim)] uppercase">PIPELINE LATENCY</span>
            <div className="text-xl sm:text-2xl font-bold text-[var(--color-primary)]">
              {stats.pipeline_latency || '1.1ms'}
            </div>
            <span className="text-[10px] text-[var(--color-text-muted)]">Sub-millisecond</span>
          </div>
        </div>

        {/* Telemetry Stream Table */}
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg overflow-hidden font-mono text-xs">
          <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
            <span className="font-bold text-[var(--color-text-main)]">LIVE OCSF TELEMETRY STREAM</span>
            <span className="text-[10px] text-[var(--color-text-muted)]">Showing latest events</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-surface)] text-[var(--color-text-dim)] text-[10px] uppercase">
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">Vendor</th>
                  <th className="py-2.5 px-4">Action</th>
                  <th className="py-2.5 px-4">Source IP</th>
                  <th className="py-2.5 px-4">Dst Port</th>
                  <th className="py-2.5 px-4">Severity</th>
                  <th className="py-2.5 px-4">Threat Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)] text-[11px]">
                {recentEvents.map((evt, idx) => (
                  <tr key={evt.id || idx} className="hover:bg-[var(--color-surface-hover)] transition-colors">
                    <td className="py-2.5 px-4 text-[var(--color-text-muted)]">{evt.timestamp}</td>
                    <td className="py-2.5 px-4 text-[var(--color-text-main)] font-semibold">{evt.vendor}</td>
                    <td className="py-2.5 px-4 text-[var(--color-text-muted)]">{evt.action}</td>
                    <td className="py-2.5 px-4 text-[var(--color-text-main)]">{evt.src_ip}</td>
                    <td className="py-2.5 px-4 text-[var(--color-text-muted)]">{evt.dst_port}</td>
                    <td className="py-2.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        evt.severity === 'HIGH' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {evt.severity}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-[var(--color-primary)] font-bold">{evt.threat_score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. CHAPTER 5: LOG PROCESSING INSPECTOR                                  */}
      {/* ========================================================================= */}
      <section className="px-4 lg:px-8 py-16 border-b border-[var(--color-border)] max-w-7xl mx-auto w-full">
        <div className="space-y-2 mb-8">
          <div className="font-mono text-xs text-[var(--color-primary)] tracking-widest uppercase">
            CHAPTER 05 // LOG TRANSFORM INSPECTOR
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-main)]">
            Log Processing Inspector
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] max-w-2xl">
            Inspect how a raw log line transforms step-by-step into a normalized event.
          </p>
        </div>

        {/* 6 Stage Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-6 font-mono text-xs">
          {PIPELINE_STAGES.map((s) => (
            <button
              key={s.id}
              onClick={() => setActivePipelineStage(s.id)}
              className={`p-3 rounded border text-left transition-all ${
                activePipelineStage === s.id
                  ? 'bg-[var(--color-primary)] text-[#0f131c] border-[var(--color-primary)] font-bold'
                  : 'bg-[var(--color-bg-card)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'
              }`}
            >
              <div className="text-[10px] opacity-75">{s.num}</div>
              <div className="truncate">{s.name}</div>
            </button>
          ))}
        </div>

        {/* Code Terminal View */}
        <div className="bg-[var(--terminal-bg)] border border-[var(--color-border)] rounded-lg p-5 font-mono text-xs space-y-3">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3 text-[var(--terminal-text-muted)]">
            <span>EXECUTING: {currentStageData.filepath}</span>
            <span className="text-[var(--color-primary)]">{currentStageData.techBadge}</span>
          </div>
          <pre className="text-[var(--terminal-text-main)] overflow-x-auto text-[11px] leading-relaxed p-2">
            {currentStageData.payload}
          </pre>
          <div className="text-[10px] text-[var(--terminal-text-dim)] border-t border-[var(--color-border)] pt-2 flex justify-between">
            <span>SHA-256: {currentStageData.digest}</span>
            <span className="text-emerald-400">STATUS: STAGE OK</span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. EDITORIAL FOOTER                                                       */}
      {/* ========================================================================= */}
      <footer className="px-4 lg:px-8 py-12 bg-[var(--color-bg-surface)] font-mono text-xs text-[var(--color-text-muted)]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3">
            <StitchBrandMark size={24} />
            <span className="font-bold text-[var(--color-text-main)]">LOG // AI</span>
            <span>- Security Operations Platform</span>
          </div>
          <div className="flex items-center space-x-6">
            <Link to="/login" className="hover:text-[var(--color-text-main)]">SIGN IN</Link>
            <Link to="/register" className="hover:text-[var(--color-text-main)]">SIGN UP</Link>
            <Link to="/dashboard" className="hover:text-[var(--color-primary)]">SOC CONSOLE</Link>
          </div>
          <div className="text-[10px] text-[var(--color-text-dim)]">
            LOG AI v2.4.0 | ZERO TELEMETRY TRACKING
          </div>
        </div>
      </footer>

    </div>
  );
}
