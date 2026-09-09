import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { StitchBrandMark } from '../components/common/StitchBrandMark';
import { api } from '../services/api';

export function LandingPage() {
  const { theme, setTheme } = useTheme();
  const [isLandingMenuOpen, setIsLandingMenuOpen] = useState(false);

  // =========================================================================
  // 1. SECTION REFS & VIEWPORT-AWARE ACTIVATION (IntersectionObserver)
  // =========================================================================
  const pipelineRef = useRef(null);
  const capabilitiesRef = useRef(null);
  const topologyRef = useRef(null);
  const estimatorRef = useRef(null);

  const pipelineCardRefs = useRef([]);
  const capabilitiesCardRefs = useRef([]);
  const topologyCardRefs = useRef([]);

  const [isPipelineActive, setIsPipelineActive] = useState(false);
  const [isCapabilitiesActive, setIsCapabilitiesActive] = useState(false);
  const [isTopologyActive, setIsTopologyActive] = useState(false);
  const [isEstimatorActive, setIsEstimatorActive] = useState(false);

  // =========================================================================
  // 2. SECTION STAGE STATES (Scroll + Hover + Selection)
  // =========================================================================
  const selectedPipelineY = useRef(null);
  const selectedCapabilitiesY = useRef(null);

  // Pipeline Section State
  const [scrollPipelineStage, setScrollPipelineStage] = useState(1);
  const [hoveredPipelineStage, setHoveredPipelineStage] = useState(null);
  const [selectedPipelineStage, setSelectedPipelineStage] = useState(null);
  const activePipelineStage = selectedPipelineStage || hoveredPipelineStage || scrollPipelineStage || 1;

  // Capabilities Section State
  const [scrollCapabilitiesStage, setScrollCapabilitiesStage] = useState(1);
  const [hoveredCapabilitiesStage, setHoveredCapabilitiesStage] = useState(null);
  const [selectedCapabilitiesStage, setSelectedCapabilitiesStage] = useState(null);
  const activeCapabilitiesStage = selectedCapabilitiesStage || hoveredCapabilitiesStage || scrollCapabilitiesStage || 1;

  // Topology Section State
  const [hoveredTopologyStage, setHoveredTopologyStage] = useState(null);
  const [selectedTopologyStage, setSelectedTopologyStage] = useState(1);
  const activeTopologyStage = hoveredTopologyStage || selectedTopologyStage || 1;

  // =========================================================================
  // 3. INTERACTION HELPER (Hover + Click/Tap Selection & Smooth Scroll)
  // =========================================================================
  const getSubtopicProps = (id, activeStage, setHovered, setSelected, getCardEl) => {
    const isActive = activeStage === id;
    const handleSelect = () => {
      if (typeof setSelected === 'function') {
        setSelected(id);
      }
      const el = typeof getCardEl === 'function' ? getCardEl() : null;
      if (el && el.scrollIntoView) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };
    return {
      role: 'tab',
      tabIndex: 0,
      'aria-selected': isActive,
      onMouseEnter: () => setHovered(id),
      onMouseLeave: () => setHovered(null),
      onFocus: () => setHovered(id),
      onBlur: () => setHovered(null),
      onClick: handleSelect,
      onTouchEnd: handleSelect,
      onKeyDown: (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleSelect();
        }
      }
    };
  };

  // =========================================================================
  // 4. FINANCIAL ROI ESTIMATOR STATE & FORMULAS
  // =========================================================================
  const [logVolume, setLogVolume] = useState(500000);
  const [devicesMonitored, setDevicesMonitored] = useState(25);

  const hoursSaved = ((logVolume * 0.001 * 0.85 * 3.5 * 30) / 60).toFixed(1);
  const mttrReduction = Math.min(85, (50 + devicesMonitored * 0.2)).toFixed(1);
  const monthlySavings = (hoursSaved * 65).toLocaleString('en-US', { maximumFractionDigits: 0 });

  // =========================================================================
  // 5. RADAR INTERACTIVE NODES & DATA
  // =========================================================================
  const RADAR_NODES = [
    { id: 1, ip: '185.220.100.22', device: 'Cisco ASA Edge', x: 70, y: 32, severity: 'HIGH', score: 88.5, proto: 'TCP/51422', rule: 'MITRE T1110 (Brute Force)', action: 'AUTO_BLOCKED' },
    { id: 2, ip: '192.168.1.105', device: 'FortiGate FW', x: 28, y: 65, severity: 'MEDIUM', score: 62.0, proto: 'UDP/53', rule: 'DNS Tunneling Anomaly', action: 'MONITORED' },
    { id: 3, ip: '10.0.0.50', device: 'Suricata IDS', x: 62, y: 76, severity: 'LOW', score: 24.1, proto: 'HTTP/80', rule: 'Standard GET /health', action: 'CLEARED' },
    { id: 4, ip: '45.33.32.156', device: 'pfSense Cluster', x: 36, y: 24, severity: 'HIGH', score: 94.2, proto: 'SSH/22', rule: 'Credential Stuffing', action: 'CONTAINED' },
  ];
  const [activeRadarNode, setActiveRadarNode] = useState(RADAR_NODES[0]);

  // Live Telemetry Stats & Events
  const [recentEvents, setRecentEvents] = useState([
    { id: 'evt-01', timestamp: '2026-09-08 11:42:01', vendor: 'Cisco ASA', action: 'DENY', src_ip: '185.220.100.22', dst_port: 80, severity: 'HIGH', threat_score: 88.5, raw: '%ASA-4-106023: Deny tcp src outside:185.220.100.22/51422 dst inside:10.0.0.10/80' },
    { id: 'evt-02', timestamp: '2026-09-08 11:41:58', vendor: 'FortiGate', action: 'PASS', src_ip: '192.168.1.105', dst_port: 443, severity: 'LOW', threat_score: 12.0, raw: 'devname="FG100E" type="traffic" action="deny" srcip="192.168.1.105" dstip="10.0.0.50"' },
    { id: 'evt-03', timestamp: '2026-09-08 11:41:52', vendor: 'Suricata', action: 'ALERT', src_ip: '45.33.32.156', dst_port: 22, severity: 'HIGH', threat_score: 94.2, raw: '{"event_type":"alert","src_ip":"45.33.32.156","alert":{"signature":"SSH Brute Force"}}' },
  ]);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        const fetchedEvents = await api.getRecentEvents(5);
        if (mounted && Array.isArray(fetchedEvents) && fetchedEvents.length > 0) {
          setRecentEvents(fetchedEvents);
        }
      } catch (err) {
        // Public fallback
      }
    }
    loadData();
    return () => { mounted = false; };
  }, []);

  // =========================================================================
  // 6. VIEWPORT-AWARE INTERSECTION OBSERVER FOR ALL MAJOR SECTIONS
  // =========================================================================
  useEffect(() => {
    const createSectionObserver = (ref, setActiveState) => {
      const el = ref.current;
      if (!el) return null;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            setActiveState(entry.isIntersecting);
          });
        },
        { threshold: 0.05, rootMargin: '120px 0px -5% 0px' }
      );
      observer.observe(el);
      return observer;
    };

    const obs1 = createSectionObserver(pipelineRef, setIsPipelineActive);
    const obs2 = createSectionObserver(capabilitiesRef, setIsCapabilitiesActive);
    const obs3 = createSectionObserver(topologyRef, setIsTopologyActive);
    const obs4 = createSectionObserver(estimatorRef, setIsEstimatorActive);

    return () => {
      if (obs1) obs1.disconnect();
      if (obs2) obs2.disconnect();
      if (obs3) obs3.disconnect();
      if (obs4) obs4.disconnect();
    };
  }, []);

  // =========================================================================
  // 7. CARD-INTERSECTION READING-ZONE SCROLL STAGE DETECTOR
  // =========================================================================
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;

      if (selectedPipelineY.current !== null && Math.abs(currentY - selectedPipelineY.current) > 50) {
        setSelectedPipelineStage(null);
        selectedPipelineY.current = null;
      }

      if (selectedCapabilitiesY.current !== null && Math.abs(currentY - selectedCapabilitiesY.current) > 50) {
        setSelectedCapabilitiesStage(null);
        selectedCapabilitiesY.current = null;
      }

      const getActiveStageFromCards = (cardRefs, numStages) => {
        if (!cardRefs.current || cardRefs.current.length === 0) return 1;
        const windowHeight = window.innerHeight;
        const targetLine = windowHeight * 0.40;

        let closestStage = 1;
        let minDistance = Infinity;

        cardRefs.current.forEach((cardEl, index) => {
          if (!cardEl) return;
          const rect = cardEl.getBoundingClientRect();
          const cardCenter = rect.top + rect.height / 2;
          const distance = Math.abs(cardCenter - targetLine);

          if (distance < minDistance) {
            minDistance = distance;
            closestStage = index + 1;
          }
        });

        return Math.min(numStages, Math.max(1, closestStage));
      };

      setScrollPipelineStage(getActiveStageFromCards(pipelineCardRefs, 6));
      setScrollCapabilitiesStage(getActiveStageFromCards(capabilitiesCardRefs, 6));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // =========================================================================
  // 8. DATA STRUCTURES FOR MAJOR SECTIONS
  // =========================================================================
  
  // 6 Pipeline Story Stages
  const PIPELINE_STAGES = [
    {
      id: 1,
      num: '01',
      name: 'Raw Log Arrival',
      desc: 'Events arrive in their original syslog format at edge interfaces with zero loss.',
      payload: '%ASA-4-106023: Deny tcp src outside:185.220.100.22/51422 dst inside:10.0.0.10/80 by access-group "outside_acl"',
      badge: 'Raw Syslog Stream'
    },
    {
      id: 2,
      num: '02',
      name: 'Format Detection',
      desc: 'LOG AI automatically identifies vendor format and action semantics.',
      payload: 'VENDOR: Cisco ASA | FORMAT: Syslog Access-Group | ACTION: DENY | PROTO: TCP',
      badge: 'Cisco ASA Detected'
    },
    {
      id: 3,
      num: '03',
      name: 'Field Tokenizing',
      desc: 'Dissects raw strings into typed key-value pairs for structured processing.',
      payload: 'src_ip: "185.220.100.22"\nsrc_port: 51422\ndst_ip: "10.0.0.10"\ndst_port: 80\naction: "DENY"',
      badge: 'Key-Value Extracted'
    },
    {
      id: 4,
      num: '04',
      name: 'OCSF Normalization',
      desc: 'Maps vendor attributes into standard OCSF 1.1 UnifiedEvent schema.',
      payload: 'UnifiedEvent(\n  class_uid=4001, // Network Activity\n  activity_id=2, // Blocked\n  severity_id=3, // Medium\n  src_endpoint="185.220.100.22",\n  dst_endpoint="10.0.0.10:80"\n)',
      badge: 'OCSF 1.1 Schema'
    },
    {
      id: 5,
      num: '05',
      name: 'Anomaly Detection',
      desc: 'ML models score payload velocity and triggers against baseline activity.',
      payload: 'THREAT SCORE: 88.5 / 100 (HIGH ANOMALY)\nAttributions:\n  + connection_velocity_spike (+3.42 z-score)\n  + repeated_denied_target (+2.88 z-score)',
      badge: 'Isolation Forest'
    },
    {
      id: 6,
      num: '06',
      name: 'Security Finding',
      desc: 'Generates correlated incident context and executable firewall playbooks.',
      payload: 'INCIDENT #inc_a81b5b (MITRE T1110 Brute Force)\nAutomated Playbook:\n  1. iptables -A INPUT -s 185.220.100.22 -j DROP\n  2. Revoke active JWT session for admin',
      badge: 'Actionable Playbook'
    },
  ];

  // 6 Capabilities Input Sources
  const CAPABILITIES_STAGES = [
    {
      id: 1,
      name: 'Cisco ASA Firewall',
      format: 'Syslog Stream',
      sample: '%ASA-4-106023: Deny tcp src outside:185.220.100.22/51422 dst inside:10.0.0.10/80',
      schema: 'OCSF Network Activity (4001) | Action: DENY | Protocol: TCP'
    },
    {
      id: 2,
      name: 'Fortinet FortiGate',
      format: 'KV Pair Log',
      sample: 'devname="FG100E" type="traffic" subtype="forward" action="deny" srcip="192.168.1.105" dstip="10.0.0.50" dstport=443',
      schema: 'OCSF Network Activity (4001) | Action: DENY | Protocol: HTTPS'
    },
    {
      id: 3,
      name: 'Suricata IDS/IPS',
      format: 'EVE JSON Stream',
      sample: '{"event_type":"alert","src_ip":"45.33.32.156","src_port":22,"alert":{"signature":"ET SCAN SSH Brute Force"}}',
      schema: 'OCSF Security Finding (2001) | Category: Intrusion Detection | Severity: HIGH'
    },
    {
      id: 4,
      name: 'pfSense Filterlog',
      format: 'CSV Stream',
      sample: '15,,,1000000103,em0,match,block,in,4,0x0,,64,0,0,DF,6,tcp,60,10.0.0.50,198.51.100.14,53,8080,0',
      schema: 'OCSF Network Activity (4001) | Action: BLOCK | Interface: em0'
    },
    {
      id: 5,
      name: 'ArcSight CEF',
      format: 'Common Event Format',
      sample: 'CEF:0|Security|Firewall|1.0|100|Connection Denied|5|src=198.51.100.14 dst=10.0.0.10 dpt=8080',
      schema: 'OCSF Network Activity (4001) | Severity: MEDIUM | Vendor: ArcSight'
    },
    {
      id: 6,
      name: 'Enterprise OCSF',
      format: 'Cross-Vendor Unified',
      sample: 'UnifiedEvent(event_type="ocsf:network", vendor="Multi-Vendor", threat_score=68.4)',
      schema: 'OCSF Unified Schema 1.1.0 | Interoperable Security Feed'
    },
  ];

  // 5 Topology Architecture Components
  const TOPOLOGY_STAGES = [
    { id: 1, name: 'Log Sources', status: 'INGESTING', desc: 'Raw logs from perimeter firewalls, IDS sensors, and syslog endpoints.' },
    { id: 2, name: 'Edge Ingest', status: 'BUFFERING', desc: 'High-speed queue capturing raw logs with zero data loss.' },
    { id: 3, name: 'Parser Engine', status: 'PARSING', desc: 'Dynamic parser tokenizing raw streams into OCSF 1.1 schema.' },
    { id: 4, name: 'Anomaly Engine', status: 'SCORING', desc: 'Isolation Forest ML models scoring connection anomalies in real-time.' },
    { id: 5, name: 'SOC Console', status: 'READY', desc: 'Single-pane investigation console with automated mitigation playbooks.' },
  ];

  const currentPipelineData = PIPELINE_STAGES.find(s => s.id === activePipelineStage) || PIPELINE_STAGES[0];
  const currentCapabilitiesData = CAPABILITIES_STAGES.find(s => s.id === activeCapabilitiesStage) || CAPABILITIES_STAGES[0];
  const currentTopologyData = TOPOLOGY_STAGES.find(s => s.id === activeTopologyStage) || TOPOLOGY_STAGES[0];
  const currentDemoEvent = recentEvents[0] || recentEvents[0];

  return (
    <div className="min-h-screen bg-[var(--color-bg-dim)] text-[var(--color-text-main)] font-sans flex flex-col selection:bg-[var(--color-primary)] selection:text-[#0f131c]">
      
      {/* ========================================================================= */}
      {/* 1. TOP HEADER NAVIGATION BAR                                              */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-50 bg-[var(--color-bg-dim)]/90 backdrop-blur-md border-b border-[var(--color-border)] px-4 lg:px-8 py-3.5 transition-colors duration-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Brand Mark */}
          <Link to="/" className="flex items-center space-x-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] rounded px-1 py-0.5">
            <StitchBrandMark size={26} />
            <span className="font-mono text-sm tracking-wider font-bold uppercase text-[var(--color-text-main)]">
              LOG <span className="text-[var(--color-primary)]">//</span> AI
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8 font-mono text-xs text-[var(--color-text-muted)] tracking-wider">
            <a href="#pipeline" className="hover:text-[var(--color-text-main)] transition-colors py-1">PIPELINE</a>
            <a href="#capabilities" className="hover:text-[var(--color-text-main)] transition-colors py-1">CAPABILITIES</a>
            <a href="#topology" className="hover:text-[var(--color-text-main)] transition-colors py-1">TOPOLOGY</a>
            <a href="#estimator" className="hover:text-[var(--color-text-main)] transition-colors py-1">ESTIMATOR</a>
          </nav>

          {/* Action Controls */}
          <div className="flex items-center space-x-3.5">
            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'sage' : 'dark')}
              className="px-2.5 py-1 text-[11px] font-mono border border-[var(--color-border)] rounded bg-[var(--color-bg-surface)] hover:border-[var(--color-primary)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-all flex items-center space-x-1.5"
              title="Toggle Theme (Cyber Void / Sage Green)"
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

            {/* Console CTA */}
            <Link
              to="/dashboard"
              className="btn-primary font-mono text-xs px-3.5 py-1.5 rounded flex items-center space-x-1"
            >
              <span>OPEN CONSOLE</span>
              <span className="text-[10px]">→</span>
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsLandingMenuOpen(!isLandingMenuOpen)}
              className="md:hidden p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] border border-[var(--color-border)] rounded bg-[var(--color-bg-surface)]"
              aria-label="Toggle menu"
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
          <div className="md:hidden mt-3 pt-3 border-t border-[var(--color-border)] flex flex-col space-y-2.5 font-mono text-xs text-[var(--color-text-muted)]">
            <a href="#pipeline" onClick={() => setIsLandingMenuOpen(false)} className="px-2 py-1 hover:text-[var(--color-primary)]">PIPELINE</a>
            <a href="#capabilities" onClick={() => setIsLandingMenuOpen(false)} className="px-2 py-1 hover:text-[var(--color-primary)]">CAPABILITIES</a>
            <a href="#topology" onClick={() => setIsLandingMenuOpen(false)} className="px-2 py-1 hover:text-[var(--color-primary)]">TOPOLOGY</a>
            <a href="#estimator" onClick={() => setIsLandingMenuOpen(false)} className="px-2 py-1 hover:text-[var(--color-primary)]">ESTIMATOR</a>
            <div className="pt-2 border-t border-[var(--color-border)] flex items-center justify-between px-2">
              <Link to="/login" onClick={() => setIsLandingMenuOpen(false)} className="hover:text-[var(--color-text-main)]">SIGN IN</Link>
              <Link to="/dashboard" onClick={() => setIsLandingMenuOpen(false)} className="text-[var(--color-primary)] font-bold">OPEN CONSOLE</Link>
            </div>
          </div>
        )}
      </header>

      {/* ========================================================================= */}
      {/* 2. HERO SECTION — EXTREMELY SIMPLE & PRODUCT-FIRST                        */}
      {/* ========================================================================= */}
      <section className="relative px-4 lg:px-8 pt-16 sm:pt-24 pb-20 border-b border-[var(--color-border)] bg-tech-grid overflow-hidden">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Hero Copy (Minimal, Spacious) */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[var(--color-text-main)] leading-[1.1]">
              Understand what your systems are doing.
            </h1>

            <p className="text-base sm:text-lg text-[var(--color-text-muted)] leading-relaxed max-w-lg">
              Collect logs, normalize them, detect suspicious activity, and investigate what happened.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                href="#pipeline"
                className="btn-primary font-mono text-xs px-6 py-3 rounded flex items-center space-x-2 shadow-sm"
              >
                <span>Explore LOG AI</span>
                <span>↓</span>
              </a>
              <Link
                to="/dashboard"
                className="font-mono text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors py-2 flex items-center space-x-1"
              >
                <span>Open Console</span>
                <span>→</span>
              </Link>
            </div>
          </div>

          {/* Hero Central Visual (Vector Radar Scanner) */}
          <div className="lg:col-span-6 relative">
            <div className="relative aspect-square max-w-[360px] sm:max-w-[400px] mx-auto border border-[var(--color-border)] rounded-full bg-[var(--color-bg-card)] flex items-center justify-center overflow-hidden shadow-2xl">
              
              {/* Concentric Rings */}
              <div className="absolute inset-6 rounded-full border border-[var(--color-border)]/60"></div>
              <div className="absolute inset-20 rounded-full border border-[var(--color-border)]/50"></div>
              <div className="absolute inset-36 rounded-full border border-[var(--color-border)]/40"></div>

              {/* Axis Crosshair */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-full h-[1px] bg-[var(--color-border)]"></div>
                <div className="h-full w-[1px] bg-[var(--color-border)] absolute"></div>
              </div>

              {/* Sweeping Beam */}
              <div className="absolute inset-0 animate-radar-sweep pointer-events-none origin-center">
                <div className="w-1/2 h-1/2 bg-gradient-to-br from-[var(--color-primary)]/30 to-transparent origin-bottom-right"></div>
              </div>

              {/* Threat Nodes */}
              {RADAR_NODES.map((node) => {
                const isSelected = activeRadarNode.id === node.id;
                const isHigh = node.severity === 'HIGH';
                return (
                  <button
                    key={node.id}
                    onClick={() => setActiveRadarNode(node)}
                    onMouseEnter={() => setActiveRadarNode(node)}
                    style={{ left: `${node.x}%`, top: `${node.y}%` }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 p-2 rounded-full transition-all ${
                      isSelected ? 'scale-125 z-20 ring-2 ring-[var(--color-primary)]' : 'hover:scale-110 z-10'
                    }`}
                    title={node.ip}
                  >
                    <span className="relative flex h-3.5 w-3.5 items-center justify-center">
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

              {/* Reticle Overlay */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none bg-[var(--color-bg-dim)]/90 border border-[var(--color-border)] px-3 py-1 rounded font-mono text-[11px] text-[var(--color-text-muted)] whitespace-nowrap shadow">
                <span className="text-[var(--color-primary)]">●</span> SYSTEM ACTIVE — <span className="text-[var(--color-text-main)] font-bold">{activeRadarNode.ip}</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. CHAPTER 01: PIPELINE SCROLL STORY (#pipeline)                          */}
      {/* ========================================================================= */}
      <section
        id="pipeline"
        ref={pipelineRef}
        className="px-4 lg:px-8 py-28 border-b border-[var(--color-border)] max-w-6xl mx-auto w-full transition-opacity duration-300 relative"
      >
        {/* Chapter Header */}
        <div className="space-y-3 mb-16 text-center max-w-2xl mx-auto">
          <div className="font-mono text-xs text-[var(--color-primary)] tracking-widest uppercase">
            01 // PROCESSING PIPELINE
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--color-text-main)]">
            From raw event to useful security data.
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
            As logs flow through LOG AI, each stage transforms unstructured text into structured, actionable security context.
          </p>
        </div>

        {/* Scroll Story Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start relative">
          
          {/* Left Column: 6 Minimal Subtopic Scroll Cards */}
          <div className="lg:col-span-5 space-y-12 py-4" role="tablist" aria-label="Pipeline Stages">
            {PIPELINE_STAGES.map((stage, idx) => {
              const isActive = activePipelineStage === stage.id;
              const props = getSubtopicProps(
                stage.id,
                activePipelineStage,
                setHoveredPipelineStage,
                (id) => {
                  setSelectedPipelineStage(id);
                  selectedPipelineY.current = window.scrollY;
                },
                () => pipelineCardRefs.current[idx]
              );
              return (
                <div
                  key={stage.id}
                  ref={(el) => (pipelineCardRefs.current[idx] = el)}
                  {...props}
                  className={`p-6 rounded-lg border transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] ${
                    isActive
                      ? 'bg-[var(--color-bg-card)] border-[var(--color-primary)] shadow-xl ring-1 ring-[var(--color-primary)] opacity-100 scale-[1.02]'
                      : 'bg-[var(--color-bg-surface)] border-[var(--color-border)] opacity-60 hover:opacity-90'
                  }`}
                >
                  <div className="font-mono text-xs text-[var(--color-primary)] font-bold mb-2">
                    {stage.num}
                  </div>
                  <h3 className="font-bold text-lg text-[var(--color-text-main)] mb-2">
                    {stage.name}
                  </h3>
                  <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                    {stage.desc}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Right Column: Anchored Central Morphing Visualization */}
          <div className="lg:col-span-7 relative min-h-full">
            <div className="lg:sticky lg:top-28 w-full">
              <div className="p-6 sm:p-8 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl font-mono text-xs space-y-6 shadow-2xl transition-all duration-300">
                
                {/* Header Stage Indicator */}
                <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4">
                  <div className="flex items-center space-x-3">
                    <span className="px-2.5 py-1 rounded bg-[var(--color-primary)] text-[#0f131c] font-bold text-xs">
                      {currentPipelineData.num}
                    </span>
                    <span className="font-bold text-[var(--color-text-main)] text-sm sm:text-base">
                      {currentPipelineData.name}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/30 font-bold">
                    {currentPipelineData.badge}
                  </span>
                </div>

                {/* Progress Indicators */}
                <div className="grid grid-cols-6 gap-1.5 py-1">
                  {PIPELINE_STAGES.map((s) => (
                    <div
                      key={s.id}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        s.id === activePipelineStage
                          ? 'bg-[var(--color-primary)]'
                          : s.id < activePipelineStage
                          ? 'bg-emerald-500'
                          : 'bg-[var(--color-surface-variant)]'
                      }`}
                    ></div>
                  ))}
                </div>

                {/* Morphing Payload Canvas */}
                <div className="p-5 bg-[var(--terminal-bg)] text-[var(--terminal-text-main)] border border-[var(--color-border)] rounded-lg min-h-[160px] flex items-center">
                  <pre className="overflow-x-auto text-xs leading-relaxed font-mono whitespace-pre-wrap w-full">
                    {currentPipelineData.payload}
                  </pre>
                </div>

              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. CHAPTER 02: CAPABILITIES INPUT STREAM STORY (#capabilities)            */}
      {/* ========================================================================= */}
      <section
        id="capabilities"
        ref={capabilitiesRef}
        className="px-4 lg:px-8 py-28 border-b border-[var(--color-border)] max-w-6xl mx-auto w-full transition-opacity duration-300 relative"
      >
        <div className="space-y-3 mb-16 text-center max-w-2xl mx-auto">
          <div className="font-mono text-xs text-[var(--color-primary)] tracking-widest uppercase">
            02 // LOG SOURCES
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--color-text-main)]">
            Works with the logs you already have.
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
            Connect firewall syslog streams, IDS alerts, and cloud event feeds directly into LOG AI.
          </p>
        </div>

        {/* Dynamic Source Selection Stream */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8 font-mono text-xs" role="tablist" aria-label="Log Appliance Formats">
          {CAPABILITIES_STAGES.map((app, idx) => {
            const isActive = activeCapabilitiesStage === app.id;
            const props = getSubtopicProps(
              app.id,
              activeCapabilitiesStage,
              setHoveredCapabilitiesStage,
              (id) => {
                setSelectedCapabilitiesStage(id);
                selectedCapabilitiesY.current = window.scrollY;
              },
              () => capabilitiesCardRefs.current[idx]
            );
            return (
              <button
                key={app.id}
                ref={(el) => (capabilitiesCardRefs.current[idx] = el)}
                {...props}
                className={`p-3.5 rounded-lg border text-center transition-all ${
                  isActive
                    ? 'bg-[var(--color-primary)] text-[#0f131c] border-[var(--color-primary)] font-bold shadow-lg scale-105'
                    : 'bg-[var(--color-bg-card)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'
                }`}
              >
                <div className="truncate text-xs">{app.name}</div>
              </button>
            );
          })}
        </div>

        {/* Central Source Visual Transformation Card */}
        <div className="p-6 sm:p-8 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl font-mono text-xs space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4">
            <div>
              <span className="text-[10px] text-[var(--color-text-dim)] uppercase tracking-wider block">SOURCE APPLIANCE</span>
              <span className="font-bold text-base sm:text-lg text-[var(--color-text-main)]">{currentCapabilitiesData.name}</span>
            </div>
            <span className="px-2.5 py-1 rounded bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/30 font-bold">
              {currentCapabilitiesData.format}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-[10px] text-[var(--color-text-dim)] uppercase mb-2">RAW INPUT STREAM</div>
              <pre className="p-4 bg-[var(--terminal-bg)] text-[var(--terminal-text-main)] border border-[var(--color-border)] rounded-lg text-xs overflow-x-auto whitespace-pre-wrap min-h-[100px]">
                {currentCapabilitiesData.sample}
              </pre>
            </div>

            <div>
              <div className="text-[10px] text-[var(--color-text-dim)] uppercase mb-2">NORMALIZED OCSF OUTPUT</div>
              <div className="p-4 bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-lg text-xs text-emerald-400 font-bold min-h-[100px] flex items-center">
                {currentCapabilitiesData.schema}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. CHAPTER 03: SYSTEM TOPOLOGY (#topology)                                */}
      {/* ========================================================================= */}
      <section
        id="topology"
        ref={topologyRef}
        className="px-4 lg:px-8 py-28 border-b border-[var(--color-border)] max-w-6xl mx-auto w-full transition-opacity duration-300"
      >
        <div className="space-y-3 mb-16 text-center max-w-2xl mx-auto">
          <div className="font-mono text-xs text-[var(--color-primary)] tracking-widest uppercase">
            03 // ARCHITECTURE
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--color-text-main)]">
            One path from raw logs to investigation.
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
            Five connected architectural stages process incoming telemetry end-to-end.
          </p>
        </div>

        {/* Connected Architecture Graph */}
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-6 sm:p-8 shadow-xl space-y-8">
          
          {/* Node Flow Row */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 font-mono text-xs">
            {TOPOLOGY_STAGES.map((stg, idx) => {
              const isActive = activeTopologyStage === stg.id;
              const props = getSubtopicProps(
                stg.id,
                activeTopologyStage,
                setHoveredTopologyStage,
                setSelectedTopologyStage,
                null
              );
              return (
                <div
                  key={stg.id}
                  ref={(el) => (topologyCardRefs.current[idx] = el)}
                  {...props}
                  className={`p-4 rounded-lg border text-center transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[var(--color-primary)] text-[#0f131c] border-[var(--color-primary)] font-bold shadow-lg scale-105'
                      : 'bg-[var(--color-bg-surface)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'
                  }`}
                >
                  <div className="text-[10px] opacity-70">0{stg.id}</div>
                  <div className="truncate text-xs font-bold mt-1">{stg.name}</div>
                  <div className="text-[9px] mt-2 opacity-80 uppercase">{stg.status}</div>
                </div>
              );
            })}
          </div>

          {/* Active Node Detail */}
          <div className="p-5 bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-lg font-mono text-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-[var(--color-primary)] font-bold block mb-1">STAGE 0{currentTopologyData.id} — {currentTopologyData.name}</span>
              <p className="text-xs text-[var(--color-text-muted)]">{currentTopologyData.desc}</p>
            </div>
            <span className="px-3 py-1 rounded text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold whitespace-nowrap">
              STATUS: {currentTopologyData.status}
            </span>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. CHAPTER 04: SOC ROI ESTIMATOR (#estimator)                             */}
      {/* ========================================================================= */}
      <section
        id="estimator"
        ref={estimatorRef}
        className="px-4 lg:px-8 py-28 border-b border-[var(--color-border)] max-w-6xl mx-auto w-full"
      >
        <div className="space-y-3 mb-16 text-center max-w-2xl mx-auto">
          <div className="font-mono text-xs text-[var(--color-primary)] tracking-widest uppercase">
            04 // ROI ESTIMATOR
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--color-text-main)]">
            SOC Efficiency &amp; Cost Savings
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
            See how log volume and device count affect analyst workload and operational costs.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-[var(--color-bg-card)] border border-[var(--color-border)] p-6 sm:p-10 rounded-xl shadow-2xl">
          
          {/* Sliders Column */}
          <div className="lg:col-span-6 space-y-8">
            
            {/* Slider 1 */}
            <div className="space-y-3">
              <div className="flex justify-between items-center font-mono text-xs">
                <span className="text-[var(--color-text-muted)] uppercase">DAILY LOG VOLUME</span>
                <span className="text-[var(--color-primary)] font-bold text-sm">{logVolume.toLocaleString()} EPS</span>
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

            {/* Slider 2 */}
            <div className="space-y-3 pt-4 border-t border-[var(--color-border)]">
              <div className="flex justify-between items-center font-mono text-xs">
                <span className="text-[var(--color-text-muted)] uppercase">MONITORED PERIMETER DEVICES</span>
                <span className="text-[var(--color-primary)] font-bold text-sm">{devicesMonitored} APPLIANCES</span>
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

          </div>

          {/* Large Primary Output Display */}
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono">
            
            <div className="p-6 bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-lg space-y-2">
              <span className="text-[10px] text-[var(--color-text-dim)] uppercase">ESTIMATED MONTHLY SAVINGS</span>
              <div className="text-3xl sm:text-4xl font-bold text-emerald-400">${monthlySavings}</div>
              <span className="text-xs text-[var(--color-text-muted)] block">Direct labor reduction</span>
            </div>

            <div className="p-6 bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-lg space-y-2">
              <span className="text-[10px] text-[var(--color-text-dim)] uppercase">HOURS RECLAIMED</span>
              <div className="text-3xl sm:text-4xl font-bold text-[var(--color-primary)]">{hoursSaved} hrs</div>
              <span className="text-xs text-[var(--color-text-muted)] block">Automated triage &amp; playbooks</span>
            </div>

            <div className="sm:col-span-2 p-6 bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-lg flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[var(--color-text-dim)] uppercase">RESPONSE SPEEDUP</span>
                <div className="text-xl font-bold text-[var(--color-text-main)] mt-1">{mttrReduction}% FASTER TRIAGE</div>
              </div>
              <div className="relative w-14 h-14 flex items-center justify-center">
                <svg className="w-14 h-14 transform -rotate-90" viewBox="0 0 36 36">
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
      {/* 7. CHAPTER 05: LOG UNDERSTANDING DEMONSTRATION                             */}
      {/* ========================================================================= */}
      <section className="px-4 lg:px-8 py-28 border-b border-[var(--color-border)] max-w-6xl mx-auto w-full">
        <div className="space-y-3 mb-16 text-center max-w-2xl mx-auto">
          <div className="font-mono text-xs text-[var(--color-primary)] tracking-widest uppercase">
            05 // DEMONSTRATION
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--color-text-main)]">
            How LOG AI understands a log.
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
            See how a raw syslog event is transformed into actionable security intelligence.
          </p>
        </div>

        {/* 4-Step Event Understanding Story Card */}
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-6 sm:p-10 shadow-2xl font-mono text-xs space-y-8">
          
          {/* Step 1: Raw Event */}
          <div className="space-y-2">
            <span className="text-[10px] text-[var(--color-text-dim)] uppercase font-bold">1. RAW LOG RECEIVED</span>
            <pre className="p-4 bg-[var(--terminal-bg)] text-[var(--terminal-text-main)] border border-[var(--color-border)] rounded-lg text-xs overflow-x-auto whitespace-pre-wrap">
              {currentDemoEvent?.raw || '%ASA-4-106023: Deny tcp src outside:185.220.100.22/51422 dst inside:10.0.0.10/80 by access-group "outside_acl"'}
            </pre>
          </div>

          {/* Step 2: Understood As */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-[var(--color-border)] pt-6">
            <div className="p-4 bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-lg">
              <span className="text-[10px] text-[var(--color-text-dim)] uppercase block mb-1">UNDERSTOOD AS</span>
              <span className="font-bold text-sm text-[var(--color-text-main)]">Blocked Network Connection</span>
            </div>
            <div className="p-4 bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-lg">
              <span className="text-[10px] text-[var(--color-text-dim)] uppercase block mb-1">SECURITY CONTEXT</span>
              <span className="font-bold text-sm text-rose-400">Threat Score 88.5 / 100</span>
            </div>
            <div className="p-4 bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-lg">
              <span className="text-[10px] text-[var(--color-text-dim)] uppercase block mb-1">RECOMMENDED ACTION</span>
              <span className="font-bold text-sm text-[var(--color-primary)]">Block IP on Edge ACL</span>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. EDITORIAL FOOTER                                                       */}
      {/* ========================================================================= */}
      <footer className="px-4 lg:px-8 py-12 bg-[var(--color-bg-surface)] font-mono text-xs text-[var(--color-text-muted)]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3">
            <StitchBrandMark size={22} />
            <span className="font-bold text-[var(--color-text-main)]">LOG // AI</span>
            <span>— Security Operations Platform</span>
          </div>
          <div className="flex items-center space-x-6">
            <Link to="/login" className="hover:text-[var(--color-text-main)]">SIGN IN</Link>
            <Link to="/register" className="hover:text-[var(--color-text-main)]">CREATE ACCOUNT</Link>
            <Link to="/dashboard" className="hover:text-[var(--color-primary)]">OPEN CONSOLE</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
