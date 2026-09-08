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

  const [isPipelineActive, setIsPipelineActive] = useState(false);
  const [isCapabilitiesActive, setIsCapabilitiesActive] = useState(false);
  const [isTopologyActive, setIsTopologyActive] = useState(false);
  const [isEstimatorActive, setIsEstimatorActive] = useState(false);

  // =========================================================================
  // 2. SECTION STAGE STATES (Scroll, Hover, Select)
  // Precedence: selectedStage || hoveredStage || scrollStage || 1
  // =========================================================================
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
  const [scrollTopologyStage, setScrollTopologyStage] = useState(1);
  const [hoveredTopologyStage, setHoveredTopologyStage] = useState(null);
  const [selectedTopologyStage, setSelectedTopologyStage] = useState(null);
  const activeTopologyStage = selectedTopologyStage || hoveredTopologyStage || scrollTopologyStage || 1;

  // =========================================================================
  // 3. INTERACTION HELPER (Hover + Click + Touch + Keyboard)
  // =========================================================================
  const getSubtopicProps = (id, activeStage, setHovered, setSelected) => {
    const isActive = activeStage === id;
    return {
      role: 'tab',
      tabIndex: 0,
      'aria-selected': isActive,
      onMouseEnter: () => setHovered(id),
      onMouseLeave: () => setHovered(null),
      onFocus: () => setHovered(id),
      onBlur: () => setHovered(null),
      onClick: () => setSelected(id),
      onTouchEnd: () => setSelected(id),
      onKeyDown: (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setSelected(id);
        }
      }
    };
  };

  // =========================================================================
  // 4. FINANCIAL ROI ESTIMATOR STATE & FORMULAS (Unchanged)
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

  // Attempt live API fetch on mount
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
        // Public fallback
      }

      try {
        const fetchedEvents = await api.getRecentEvents(10);
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
        // Trigger activation as soon as section approaches the upper-middle active reading zone
        { threshold: 0.05, rootMargin: '100px 0px -5% 0px' }
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
  // 7. LOCAL SECTION-SCOPED SCROLL PROGRESS (ACTIVE SECTIONS ONLY)
  // =========================================================================
  useEffect(() => {
    const handleScroll = () => {
      const calculateStage = (ref, numStages) => {
        if (!ref.current) return 1;
        const rect = ref.current.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        
        // Active reading entry trigger: section top reaches ~88% of window height
        const startOffset = windowHeight * 0.88;
        const totalHeight = rect.height;
        const scrolled = startOffset - rect.top;
        
        // Progress ratio from 0.0 (entering reading area) to 1.0 (scrolled through section)
        const progress = Math.max(0, Math.min(1, scrolled / (totalHeight + windowHeight * 0.1)));
        return Math.min(numStages, Math.max(1, Math.floor(progress * numStages) + 1));
      };

      if (isPipelineActive) {
        setScrollPipelineStage(calculateStage(pipelineRef, 6));
      }
      if (isCapabilitiesActive) {
        setScrollCapabilitiesStage(calculateStage(capabilitiesRef, 6));
      }
      if (isTopologyActive) {
        setScrollTopologyStage(calculateStage(topologyRef, 5));
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isPipelineActive, isCapabilitiesActive, isTopologyActive]);

  // =========================================================================
  // 8. DATA STRUCTURES FOR MAJOR SECTIONS
  // =========================================================================
  
  // Pipeline Stages Data
  const PIPELINE_STAGES = [
    {
      id: 1,
      num: '01',
      name: 'Ingestion',
      title: 'Stage 1: Raw Log Capture & Cryptographic Digesting',
      filepath: 'app/storage/raw_writer.py',
      desc: 'Raw syslog packets arriving at edge interfaces are captured with zero data loss and immediately assigned a SHA-256 hash to ensure tamper-proof integrity.',
      techBadge: 'Zero-Loss Capture',
      payload: '%ASA-4-106023: Deny tcp src outside:185.220.100.22/51422 dst inside:10.0.0.10/80 by access-group "outside_acl"',
      digest: 'a4ea94c43d9dc8c7753255ca0d6e2bb2093560056c170d2f992edb7d36071e3f',
      transformType: 'raw'
    },
    {
      id: 2,
      num: '02',
      name: 'Format Detection',
      title: 'Stage 2: Format Identification & Header Extraction',
      filepath: 'app/parsers/dynamic_parser.py',
      desc: 'Extractors match incoming strings against Cisco ASA, FortiGate, Suricata, and pfSense patterns automatically, identifying vendor format and action types.',
      techBadge: 'Format Detection',
      payload: 'FORMAT MATCHED: Cisco ASA Syslog | ACTION: DENY | PROTO: TCP | SRC: 185.220.100.22 | DST: 10.0.0.10:80',
      digest: '3c8e92ba8712df649f109281a8ef1284561029e8471b6501928471209e847120',
      transformType: 'format'
    },
    {
      id: 3,
      num: '03',
      name: 'Parsing',
      title: 'Stage 3: Regex Key Extraction & Value Tokenizing',
      filepath: 'app/normalization/parser_engine.py',
      desc: 'Dissects unstructured syslog strings into typed key-value pairs (source IP, destination port, protocol, severity, timestamp) for rapid indexing.',
      techBadge: 'Key Extraction',
      payload: 'FIELDS EXTRACTED: {\n  "src_ip": "185.220.100.22",\n  "src_port": 51422,\n  "dst_ip": "10.0.0.10",\n  "dst_port": 80,\n  "action": "DENY",\n  "acl_name": "outside_acl"\n}',
      digest: '7a910284712b6501928471209e847120f2b259a563db460ee9d7b9ddf5b18d89',
      transformType: 'parse'
    },
    {
      id: 4,
      num: '04',
      name: 'Normalization',
      title: 'Stage 4: OCSF 1.1 Unified Schema Transformation',
      filepath: 'app/normalization/schema.py',
      desc: 'Maps extracted vendor attributes into standard OCSF 1.1 UnifiedEvent objects with consistent ISO timestamps, severity tiers, and IP network classifications.',
      techBadge: 'OCSF Schema',
      payload: 'UnifiedEvent(\n  class_uid=4001, // Network Activity\n  category_uid=4,\n  activity_id=2, // Blocked\n  severity_id=3, // Medium\n  src_endpoint=Endpoint(ip="185.220.100.22"),\n  dst_endpoint=Endpoint(ip="10.0.0.10", port=80)\n)',
      digest: '9f7fe12c98001dcace31357795d410458710a892bfecdac00aee45bce0a96915',
      transformType: 'normalize'
    },
    {
      id: 5,
      num: '05',
      name: 'Validation',
      title: 'Stage 5: Isolation Forest Anomaly Scoring',
      filepath: 'app/detection/anomaly_engine.py',
      desc: 'Evaluates connection velocity, payload entropy, and rule triggers against pre-trained ML baselines to compute normalized threat scores (0.0 to 100.0).',
      techBadge: 'Anomaly Engine',
      payload: 'ANOMALY DETECTED: Threat Score 88.5/100 (HIGH)\nFeature Attribution:\n  + velocity_spike (+3.42 z-score)\n  + repeated_deny (+2.88 z-score)\n  + high_risk_asn (+1.95 z-score)',
      digest: '488480b6ca3f120649476bb2499f7fc43fbe08c16bec56b1d74517b1c38e7477',
      transformType: 'score'
    },
    {
      id: 6,
      num: '06',
      name: 'Analysis',
      title: 'Stage 6: Multi-Vector Alert Correlation & Playbooks',
      filepath: 'app/xai/explainer.py',
      desc: 'Correlates related events across 15-minute windows and generates 3-step firewall mitigation playbooks with transparent feature attributions.',
      techBadge: 'Explainable AI',
      payload: 'INCIDENT CREATED #inc_a81b5b (MITRE T1110 Brute Force)\nRecommended Playbook:\n  1. iptables -A INPUT -s 185.220.100.22 -j DROP\n  2. Revoke active JWT tokens for user "admin"\n  3. Push policy update to Cisco ASA Edge',
      digest: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      transformType: 'playbook'
    },
  ];

  // Capabilities Subtopics Data
  const CAPABILITIES_STAGES = [
    {
      id: 1,
      num: '01',
      name: 'Cisco ASA Firewall',
      vendor: 'Cisco Systems',
      format: 'CEF / Syslog Stream',
      speed: '1.2M EPS',
      parser: 'cisco_asa:deny',
      desc: 'Ingests Cisco ASA %ASA-4 access-group drop logs, extracting source/destination sockets and interface bindings.',
      sampleInput: '%ASA-4-106023: Deny tcp src outside:185.220.100.22/51422 dst inside:10.0.0.10/80 by access-group "outside_acl"',
      schemaOutput: 'OCSF Class: 4001 Network Activity | Action: DENY | Protocol: TCP (6)'
    },
    {
      id: 2,
      num: '02',
      name: 'Fortinet FortiGate',
      vendor: 'Fortinet Inc.',
      format: 'KV Pair Log',
      speed: '980K EPS',
      parser: 'fortigate:traffic',
      desc: 'Parses key-value pairs from FortiOS firewall traffic and threat log streams with automatic field type casting.',
      sampleInput: 'date=2026-09-08 time=11:41:58 devname="FG100E" type="traffic" subtype="forward" action="deny" srcip="192.168.1.105" dstip="10.0.0.50" dstport=443',
      schemaOutput: 'OCSF Class: 4001 Network Activity | Action: DENY | Protocol: HTTPS (443)'
    },
    {
      id: 3,
      num: '03',
      name: 'Suricata IDS/IPS',
      vendor: 'Open Information Security Foundation',
      format: 'EVE JSON Stream',
      speed: '850K EPS',
      parser: 'suricata:eve',
      desc: 'Consumes raw Suricata EVE JSON event logs, extracting signature IDs, alert categories, and payload hex dumps.',
      sampleInput: '{"event_type":"alert","src_ip":"45.33.32.156","src_port":22,"alert":{"signature":"ET SCAN Potential SSH Brute Force","severity":1}}',
      schemaOutput: 'OCSF Class: 2001 Security Finding | Category: Intrusion Detection | Severity: HIGH'
    },
    {
      id: 4,
      num: '04',
      name: 'pfSense Filterlog',
      vendor: 'Netgate / FreeBSD',
      format: 'CSV Packet Stream',
      speed: '620K EPS',
      parser: 'pfsense:filterlog',
      desc: 'Decodes comma-separated pfSense filterlog streams into normalized network connection tuples and rule numbers.',
      sampleInput: '15,,,1000000103,em0,match,block,in,4,0x0,,64,0,0,DF,6,tcp,60,10.0.0.50,198.51.100.14,53,8080,0',
      schemaOutput: 'OCSF Class: 4001 Network Activity | Action: BLOCK | Interface: em0'
    },
    {
      id: 5,
      num: '05',
      name: 'CEF Standard',
      vendor: 'Micro Focus ArcSight',
      format: 'Common Event Format',
      speed: '450K EPS',
      parser: 'cef:generic',
      desc: 'Extracts ArcSight Common Event Format (CEF) header pipe-delimited tokens and extension key-value attributes.',
      sampleInput: 'CEF:0|Security|Firewall|1.0|100|Connection Denied|5|src=198.51.100.14 dst=10.0.0.10 spt=51422 dpt=8080',
      schemaOutput: 'OCSF Class: 4001 Network Activity | Severity: MEDIUM | Device Vendor: Security'
    },
    {
      id: 6,
      num: '06',
      name: 'Enterprise OCSF Unified',
      vendor: 'Open Cybersecurity Schema Framework',
      format: 'Cross-Vendor Unified Schema',
      speed: '4.2M EPS',
      parser: 'ocsf:unified',
      desc: 'Universal schema mapping layer ensuring seamless interoperability across heterogeneous enterprise security stacks.',
      sampleInput: 'UnifiedEvent(event_type="ocsf:network", vendor="Multi-Vendor", threat_score=68.4, status="Parsed")',
      schemaOutput: 'OCSF Class: 4001 Unified Network Activity | Schema Version: 1.1.0'
    },
  ];

  // Topology Architecture Stages Data
  const TOPOLOGY_STAGES = [
    {
      id: 1,
      num: '01',
      name: 'Ingestion Edge',
      title: 'High-Throughput Edge Ingestion & Buffer',
      module: 'app/storage/raw_writer.py',
      desc: 'Syslog packets enter high-speed buffer queues. Raw logs are assigned SHA-256 digests immediately upon arrival.',
      metrics: { eps: '4,200,000 EPS', latency: '< 0.3ms', loss: '0.00%' },
      status: 'OPTIMAL'
    },
    {
      id: 2,
      num: '02',
      name: 'Dynamic Parser Pool',
      title: 'Regex Format Identification & OCSF Normalizer',
      module: 'app/parsers/dynamic_parser.py',
      desc: 'Parallel worker threads analyze log syntax, extract key fields, and output standardized OCSF 1.1 JSON objects.',
      metrics: { eps: '4,180,000 EPS', latency: '< 0.4ms', loss: '0.00%' },
      status: 'PARSING'
    },
    {
      id: 3,
      num: '03',
      name: 'ML Anomaly Engine',
      title: 'Isolation Forest Anomaly Scoring',
      module: 'app/detection/anomaly_engine.py',
      desc: 'Pre-trained Isolation Forest models calculate z-score feature attributions and assign continuous threat scores (0-100).',
      metrics: { eps: '4,150,000 EPS', latency: '< 0.2ms', loss: '0.00%' },
      status: 'EVALUATING'
    },
    {
      id: 4,
      num: '04',
      name: 'Alert Aggregator',
      title: '15-Minute Sliding Window Correlation',
      module: 'app/detection/correlation.py',
      desc: 'Correlates related security events by source IP, destination target, and MITRE ATT&CK tactic into single incident clusters.',
      metrics: { eps: '4,150,000 EPS', latency: '< 0.1ms', loss: '0.00%' },
      status: 'CLUSTERING'
    },
    {
      id: 5,
      num: '05',
      name: 'SOC Analyst Console',
      title: 'Explainable AI & Automated Firewall Playbooks',
      module: 'app/xai/explainer.py',
      desc: 'Renders transparent feature attribution breakdowns and generates 1-click executable firewall mitigation commands.',
      metrics: { eps: '100% Synced', latency: '< 0.1ms', loss: '0.00%' },
      status: 'ACTION READY'
    },
  ];

  const currentPipelineData = PIPELINE_STAGES.find(s => s.id === activePipelineStage) || PIPELINE_STAGES[0];
  const currentCapabilitiesData = CAPABILITIES_STAGES.find(s => s.id === activeCapabilitiesStage) || CAPABILITIES_STAGES[0];
  const currentTopologyData = TOPOLOGY_STAGES.find(s => s.id === activeTopologyStage) || TOPOLOGY_STAGES[0];

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
      {/* 2. HERO SECTION & INTERACTIVE VECTOR RADAR                                */}
      {/* ========================================================================= */}
      <section className="relative px-4 lg:px-8 pt-8 pb-16 border-b border-[var(--color-border)] bg-tech-grid">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Hero Copy & CTAs */}
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
                      onMouseEnter={() => setActiveRadarNode(node)}
                      onFocus={() => setActiveRadarNode(node)}
                      style={{ left: `${node.x}%`, top: `${node.y}%` }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 p-1.5 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] ${
                        isSelected ? 'scale-125 z-20 ring-2 ring-[var(--color-primary)]' : 'hover:scale-110 z-10'
                      }`}
                      title={`Inspect ${node.ip}`}
                    >
                      <span className="relative flex h-4 w-4 items-center justify-center">
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
      {/* 4. CHAPTER 01: 6-STAGE LOG PROCESSING PIPELINE (#pipeline)                */}
      {/* ========================================================================= */}
      <section
        id="pipeline"
        ref={pipelineRef}
        className="px-4 lg:px-8 py-16 border-b border-[var(--color-border)] max-w-7xl mx-auto w-full transition-opacity duration-300 relative"
      >
        <div className="space-y-2 mb-10">
          <div className="font-mono text-xs text-[var(--color-primary)] tracking-widest uppercase flex items-center space-x-2">
            <span>CHAPTER 01 // HOW LOGS MOVE THROUGH THE SYSTEM</span>
            {isPipelineActive && (
              <span className="px-2 py-0.5 rounded text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                ACTIVE VIEWPORT STORY
              </span>
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-main)]">
            6-Stage Log Processing Pipeline
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] max-w-2xl">
            From raw log arrival at the edge to actionable security analysis in 6 clear steps. Scroll through this section or hover/tap any stage below to inspect its live transformation.
          </p>
        </div>

        {/* Desktop Side-by-Side (Equal-Height Grid) & Mobile Vertical Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch relative">
          
          {/* Left Column: 6 Subtopics (Controls for Main Visualization) */}
          <div className="lg:col-span-6 space-y-3.5" role="tablist" aria-label="Pipeline Stages">
            {PIPELINE_STAGES.map((stage) => {
              const isActive = activePipelineStage === stage.id;
              const props = getSubtopicProps(
                stage.id,
                activePipelineStage,
                setHoveredPipelineStage,
                setSelectedPipelineStage
              );
              return (
                <div
                  key={stage.id}
                  {...props}
                  className={`p-4 sm:p-5 rounded-lg border transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] ${
                    isActive
                      ? 'bg-[var(--color-bg-card)] border-[var(--color-primary)] shadow-md ring-1 ring-[var(--color-primary)]'
                      : 'bg-[var(--color-bg-surface)] border-[var(--color-border)] hover:border-[var(--color-text-muted)] opacity-85 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2 font-mono">
                    <span className={`text-xs font-bold ${isActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-dim)]'}`}>
                      {stage.num}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded border ${
                      isActive
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                        : 'border-[var(--color-border)] bg-[var(--color-bg-dim)] text-[var(--color-text-muted)]'
                    }`}>
                      {stage.techBadge}
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-[var(--color-text-main)] mb-1">{stage.name}</h3>
                  <p className="text-xs text-[var(--color-text-muted)] leading-relaxed mb-2">{stage.desc}</p>
                  <div className="font-mono text-[10px] text-[var(--color-text-dim)] truncate border-t border-[var(--color-border)]/50 pt-2">
                    MODULE: <span className="text-[var(--color-text-main)]">{stage.filepath}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Anchored Container Stretching Full Height of Left Column */}
          <div className="lg:col-span-6 relative min-h-full">
            {/* Sticky MAIN VISUALIZATION Box Pins at top-24 Across Entire Scroll of Section */}
            <div className="lg:sticky lg:top-24 w-full">
              <div className="p-6 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg font-mono text-xs space-y-4 shadow-xl">
                
                {/* Header Badge & Stage Title */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border)] pb-3">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded bg-[var(--color-primary)] text-[#0f131c] font-bold text-xs">
                      STAGE {currentPipelineData.num}
                    </span>
                    <span className="font-bold text-[var(--color-text-main)] text-sm">{currentPipelineData.name}</span>
                  </div>
                  <span className="text-[10px] text-[var(--color-text-dim)]">
                    {currentPipelineData.filepath}
                  </span>
                </div>

                {/* Horizontal 6-Stage Progress Flow Visualizer */}
                <div className="space-y-1.5">
                  <div className="text-[10px] text-[var(--color-text-dim)] uppercase">PIPELINE STAGE PROGRESS:</div>
                  <div className="grid grid-cols-6 gap-1 p-1 bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded">
                    {PIPELINE_STAGES.map((s) => (
                      <div
                        key={s.id}
                        className={`h-2 rounded transition-all ${
                          s.id === activePipelineStage
                            ? 'bg-[var(--color-primary)] shadow-sm'
                            : s.id < activePipelineStage
                            ? 'bg-emerald-500/60'
                            : 'bg-[var(--color-surface-variant)]'
                        }`}
                      ></div>
                    ))}
                  </div>
                </div>

                {/* Central Morphing Visualization Canvas */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] text-[var(--color-text-dim)] uppercase">
                    <span>STAGE DATA TRANSFORMATION ENGINE</span>
                    <span className="text-emerald-400 font-bold">● ACTIVE</span>
                  </div>
                  
                  {/* Dynamic Content Container */}
                  <div className="p-4 bg-[var(--terminal-bg)] text-[var(--terminal-text-main)] border border-[var(--color-border)] rounded space-y-3 transition-all duration-300">
                    <div className="flex items-center justify-between text-[11px] text-[var(--terminal-text-muted)] border-b border-[var(--color-border)] pb-2">
                      <span>{currentPipelineData.title}</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-[var(--color-primary)]/20 text-[var(--color-primary)] border border-[var(--color-primary)]/30">
                        {currentPipelineData.techBadge}
                      </span>
                    </div>

                    <pre className="overflow-x-auto text-[11px] leading-relaxed font-mono whitespace-pre-wrap">
                      {currentPipelineData.payload}
                    </pre>
                  </div>
                </div>

                {/* Explanation & Data Integrity Footer */}
                <div className="p-3 bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded text-xs text-[var(--color-text-muted)] leading-relaxed">
                  <span className="font-bold text-[var(--color-text-main)] block mb-1">Technical Explanation:</span>
                  {currentPipelineData.desc}
                </div>

                <div className="flex flex-wrap items-center justify-between text-[10px] text-[var(--color-text-dim)] pt-1 border-t border-[var(--color-border)]">
                  <span className="truncate max-w-xs">SHA-256: <strong className="text-[var(--color-text-main)]">{currentPipelineData.digest}</strong></span>
                  <span className="text-emerald-400 font-bold">● VERIFIED ZERO-TAMPERING</span>
                </div>

              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. CHAPTER 02: LOG FORMAT SUPPORT & CAPABILITIES (#capabilities)          */}
      {/* ========================================================================= */}
      <section
        id="capabilities"
        ref={capabilitiesRef}
        className="px-4 lg:px-8 py-16 border-b border-[var(--color-border)] max-w-7xl mx-auto w-full transition-opacity duration-300 relative"
      >
        <div className="space-y-2 mb-10">
          <div className="font-mono text-xs text-[var(--color-primary)] tracking-widest uppercase flex items-center space-x-2">
            <span>CHAPTER 02 // LOG FORMAT CAPABILITIES</span>
            {isCapabilitiesActive && (
              <span className="px-2 py-0.5 rounded text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                ACTIVE VIEWPORT STORY
              </span>
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-main)]">
            Perimeter Appliance Format Support
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] max-w-2xl">
            Built-in high-speed extractors for enterprise firewalls, IDS/IPS sensors, and cross-vendor syslog feeds. Hover or select any appliance format to inspect details.
          </p>
        </div>

        {/* Desktop Side-by-Side (Equal-Height Grid) & Mobile Vertical Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch relative">
          
          {/* Subtopics List (Left 6 Columns) */}
          <div className="lg:col-span-6 space-y-3.5" role="tablist" aria-label="Log Format Capabilities">
            {CAPABILITIES_STAGES.map((app) => {
              const isActive = activeCapabilitiesStage === app.id;
              const props = getSubtopicProps(
                app.id,
                activeCapabilitiesStage,
                setHoveredCapabilitiesStage,
                setSelectedCapabilitiesStage
              );
              return (
                <div
                  key={app.id}
                  {...props}
                  className={`p-4 rounded-lg border transition-all cursor-pointer font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] ${
                    isActive
                      ? 'bg-[var(--color-bg-card)] border-[var(--color-primary)] shadow-md ring-1 ring-[var(--color-primary)]'
                      : 'bg-[var(--color-bg-surface)] border-[var(--color-border)] hover:border-[var(--color-text-muted)]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-sm text-[var(--color-text-main)]">{app.name}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {app.speed}
                    </span>
                  </div>
                  <div className="text-[11px] text-[var(--color-text-muted)] mb-2">
                    {app.vendor} — <span className="text-[var(--color-primary)]">{app.format}</span>
                  </div>
                  <div className="text-[10px] text-[var(--color-text-dim)] truncate border-t border-[var(--color-border)] pt-2">
                    PARSER TAG: <span className="text-[var(--color-text-main)]">{app.parser}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Anchored Container Stretching Full Height of Left Column */}
          <div className="lg:col-span-6 relative min-h-full">
            {/* Sticky Format Inspector Box Pins at top-24 Across Entire Scroll of Section */}
            <div className="lg:sticky lg:top-24 w-full">
              <div className="p-6 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg font-mono text-xs space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
                  <div>
                    <span className="text-[10px] text-[var(--color-text-dim)] uppercase block">INSPECTING FORMAT</span>
                    <span className="font-bold text-base text-[var(--color-text-main)]">{currentCapabilitiesData.name}</span>
                  </div>
                  <span className="px-2.5 py-1 rounded text-xs bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/30 font-bold">
                    {currentCapabilitiesData.speed}
                  </span>
                </div>

                <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                  {currentCapabilitiesData.desc}
                </p>

                <div>
                  <div className="text-[10px] text-[var(--color-text-dim)] uppercase mb-1">SAMPLE RAW INGEST STREAM:</div>
                  <pre className="p-3 bg-[var(--terminal-bg)] text-[var(--terminal-text-main)] border border-[var(--color-border)] rounded text-[11px] overflow-x-auto whitespace-pre-wrap">
                    {currentCapabilitiesData.sampleInput}
                  </pre>
                </div>

                <div>
                  <div className="text-[10px] text-[var(--color-text-dim)] uppercase mb-1">NORMALIZED OCSF OUTPUT:</div>
                  <div className="p-3 bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded text-[11px] text-emerald-400 font-bold">
                    {currentCapabilitiesData.schemaOutput}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--color-border)] text-center text-[10px] text-[var(--color-text-dim)]">
                  <div className="p-2 bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded">
                    <span>EXTRACTION ACCURACY</span>
                    <div className="text-xs font-bold text-[var(--color-text-main)] mt-0.5">99.4%</div>
                  </div>
                  <div className="p-2 bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded">
                    <span>PARSER COMPATIBILITY</span>
                    <div className="text-xs font-bold text-[var(--color-primary)] mt-0.5">OCSF 1.1 READY</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. CHAPTER 03: ARCHITECTURE TOPOLOGY (#topology)                          */}
      {/* ========================================================================= */}
      <section
        id="topology"
        ref={topologyRef}
        className="px-4 lg:px-8 py-16 border-b border-[var(--color-border)] max-w-7xl mx-auto w-full transition-opacity duration-300"
      >
        <div className="space-y-2 mb-10">
          <div className="font-mono text-xs text-[var(--color-primary)] tracking-widest uppercase flex items-center space-x-2">
            <span>CHAPTER 03 // SYSTEM TOPOLOGY &amp; ARCHITECTURE</span>
            {isTopologyActive && (
              <span className="px-2 py-0.5 rounded text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                ACTIVE VIEWPORT STORY
              </span>
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-main)]">
            End-to-End System Topology
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] max-w-2xl">
            Inspect the 5 interconnected architectural components handling ingestion, parsing, anomaly scoring, and SOC alert correlation.
          </p>
        </div>

        {/* Dynamic Topology Canvas Visualizer */}
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg p-6 mb-8 shadow-xl">
          <div className="text-[10px] font-mono text-[var(--color-text-dim)] uppercase mb-4 text-center">
            SYSTEM ARCHITECTURE GRAPH — ACTIVE STAGE NODE HIGHLIGHTED
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 font-mono text-xs">
            {TOPOLOGY_STAGES.map((stg) => {
              const isActive = activeTopologyStage === stg.id;
              const props = getSubtopicProps(
                stg.id,
                activeTopologyStage,
                setHoveredTopologyStage,
                setSelectedTopologyStage
              );
              return (
                <div
                  key={stg.id}
                  {...props}
                  className={`p-4 rounded border text-center transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] ${
                    isActive
                      ? 'bg-[var(--color-primary)] text-[#0f131c] border-[var(--color-primary)] font-bold shadow-lg scale-105 z-10'
                      : 'bg-[var(--color-bg-surface)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'
                  }`}
                >
                  <div className="text-[10px] opacity-75">{stg.num}</div>
                  <div className="truncate text-xs mt-1">{stg.name}</div>
                  <div className="text-[9px] mt-2 opacity-80 uppercase">{stg.status}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Component Technical Detail Box */}
        <div className="p-6 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg font-mono text-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border)] pb-3">
            <div className="flex items-center space-x-2">
              <span className="text-[var(--color-primary)] font-bold">NODE {currentTopologyData.num}</span>
              <span className="font-bold text-[var(--color-text-main)] text-sm">{currentTopologyData.title}</span>
            </div>
            <span className="text-[11px] text-[var(--color-text-muted)]">
              MODULE: <span className="text-[var(--color-primary)]">{currentTopologyData.module}</span>
            </span>
          </div>

          <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
            {currentTopologyData.desc}
          </p>

          <div className="grid grid-cols-3 gap-3 pt-2 text-center">
            <div className="p-3 bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded">
              <span className="text-[9px] text-[var(--color-text-dim)] uppercase">THROUGHPUT</span>
              <div className="text-sm font-bold text-[var(--color-primary)] mt-0.5">{currentTopologyData.metrics.eps}</div>
            </div>
            <div className="p-3 bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded">
              <span className="text-[9px] text-[var(--color-text-dim)] uppercase">PROCESSING LATENCY</span>
              <div className="text-sm font-bold text-emerald-400 mt-0.5">{currentTopologyData.metrics.latency}</div>
            </div>
            <div className="p-3 bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded">
              <span className="text-[9px] text-[var(--color-text-dim)] uppercase">DATA LOSS RATE</span>
              <div className="text-sm font-bold text-[var(--color-text-main)] mt-0.5">{currentTopologyData.metrics.loss}</div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. CHAPTER 04: SOC EFFICIENCY & SAVINGS ESTIMATOR (#estimator)            */}
      {/* ========================================================================= */}
      <section
        id="estimator"
        ref={estimatorRef}
        className="px-4 lg:px-8 py-16 border-b border-[var(--color-border)] max-w-7xl mx-auto w-full"
      >
        <div className="space-y-2 mb-10">
          <div className="font-mono text-xs text-[var(--color-primary)] tracking-widest uppercase flex items-center space-x-2">
            <span>CHAPTER 04 // SOC EFFICIENCY &amp; SAVINGS</span>
            {isEstimatorActive && (
              <span className="px-2 py-0.5 rounded text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                ACTIVE VIEWPORT STORY
              </span>
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-main)]">
            SOC Efficiency &amp; Cost Savings Estimator
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] max-w-2xl">
            Adjust daily log volume and device count to estimate analyst time saved and operational efficiency gains.
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
      {/* 8. CHAPTER 05: LIVE TELEMETRY LOG ANALYSIS                                */}
      {/* ========================================================================= */}
      <section className="px-4 lg:px-8 py-16 border-b border-[var(--color-border)] max-w-7xl mx-auto w-full">
        <div className="space-y-2 mb-10">
          <div className="font-mono text-xs text-[var(--color-primary)] tracking-widest uppercase">
            CHAPTER 05 // LIVE LOGS &amp; ANALYSIS
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-main)]">
            Live Telemetry Log Stream
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
