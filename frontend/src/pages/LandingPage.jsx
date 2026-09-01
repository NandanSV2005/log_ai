import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

export function LandingPage() {
  const { theme, setTheme } = useTheme();

  // 1. 6-Stage Telemetry Processing Pipeline Hover/Click State
  const [activePipelineStage, setActivePipelineStage] = useState(1);

  // 2. Interactive Feature Capabilities Tour Hover/Click State
  const [activeFeature, setActiveFeature] = useState('ingestion');

  // 3. Interactive System Architecture Node Hover/Click State
  const [activeArchNode, setActiveArchNode] = useState('ingestion');

  // 4. Financial Impact Estimator State
  const [logVolume, setLogVolume] = useState(500000);
  const [devicesMonitored, setDevicesMonitored] = useState(25);

  // Calculations for Financial Impact Estimator
  const hoursSaved = ((logVolume * 0.001 * 0.85 * 3.5 * 30) / 60).toFixed(1);
  const mttrReduction = Math.min(85, (50 + devicesMonitored * 0.2)).toFixed(1);
  const monthlySavings = (hoursSaved * 65).toLocaleString('en-US', { maximumFractionDigits: 0 });

  // Ticker items for live SOC telemetry feel
  const TICKER_ITEMS = [
    { type: 'ALERT', color: 'text-rose-400', text: '[ALERT] Connection Flood detected on Edge Firewall (Cisco ASA)' },
    { type: 'INFO', color: 'text-text-muted', text: '[INFO] OCSF 1.1 Schema Normalization Pipeline Active' },
    { type: 'WARN', color: 'text-amber-400', text: '[WARN] Anomaly in egress traffic volume (IP: 185.220.100.22)' },
    { type: 'INFO', color: 'text-emerald-400', text: '[INFO] SHA-256 Merkle Chain Integrity: VERIFIED (Zero Tampering)' },
    { type: 'ALERT', color: 'text-rose-400', text: '[ALERT] Multiple failed SSH auth attempts - MITRE T1110' },
  ];

  // 6-Stage Telemetry Processing Pipeline Data
  const PIPELINE_STAGES = [
    {
      id: 1,
      num: '01',
      name: 'Raw Ingestion',
      title: 'Stage 1: Raw Payload Wire Capture & SHA-256 Merkle Hashing',
      filepath: 'app/storage/raw_writer.py',
      desc: 'Raw log payloads are captured byte-for-byte at the network edge and immediately hashed with SHA-256 before any parsing occurs, establishing an unbroken forensic chain of custody with zero information loss.',
      payload: '%ASA-4-106023: Deny tcp src outside:185.220.100.22/51422 dst inside:10.0.0.10/80 by access-group "outside_acl"',
      digest: 'a4ea94c43d9dc8c7753255ca0d6e2bb2093560056c170d2f992edb7d36071e3f',
      techBadge: 'Zero-Loss Capture',
    },
    {
      id: 2,
      num: '02',
      name: 'Dynamic Parsing',
      title: 'Stage 2: Vendor Format Auto-Detection & Key-Value Extraction',
      filepath: 'app/parsers/dynamic_parser.py',
      desc: 'Dynamic extractors identify Cisco ASA, Fortinet, Suricata, and pfSense payloads automatically, converting unstructured syslog text into structured key-value attributes.',
      payload: 'Detected Format: Cisco ASA | Action: DENY | Protocol: TCP | SrcIP: 185.220.100.22 | DstIP: 10.0.0.10 | DstPort: 80',
      digest: '3c8e92ba8712df649f109281a8ef1284561029e8471b6501928471209e847120',
      techBadge: 'Multi-Vendor Parsing',
    },
    {
      id: 3,
      num: '03',
      name: 'OCSF Normalization',
      title: 'Stage 3: OCSF 1.1 Schema Mapping & Field Standardization',
      filepath: 'app/normalization/schema.py',
      desc: 'Normalizes arbitrary security events into standard OCSF 1.1 UnifiedEvent objects with standardized ISO timestamps, severity tiers, IP types, and device metadata.',
      payload: 'UnifiedEvent(event_type="cisco_asa:deny", severity="Warning", threat_level="MEDIUM", threat_score=65.0, status="New")',
      digest: '7a910284712b6501928471209e847120f2b259a563db460ee9d7b9ddf5b18d89',
      techBadge: 'OCSF 1.1 Standard',
    },
    {
      id: 4,
      num: '04',
      name: 'Anomaly Detection',
      title: 'Stage 4: Isolation Forest Anomaly Scoring & Rules Engine',
      filepath: 'app/detection/anomaly_engine.py',
      desc: 'Evaluates connection velocity, payload entropy, and rule triggers against pre-trained ML baseline vectors to generate normalized threat scores (0.0 - 100.0).',
      payload: 'Threat Score: 65.0 (MEDIUM) | Triggers: ["repeated_deny", "external_source"] | Feature Attribution: action_code (+4.84 z-score)',
      digest: '9f7fe12c98001dcace31357795d410458710a892bfecdac00aee45bce0a96915',
      techBadge: 'ML Anomaly Engine',
    },
    {
      id: 5,
      num: '05',
      name: 'Graph Correlation',
      title: 'Stage 5: Multi-Vector Graph Incident Aggregation',
      filepath: 'app/detection/correlation.py',
      desc: 'Correlates related security events across 15-minute sliding windows sharing offending source IPs, clustering individual telemetry alerts into unified attack timelines.',
      payload: 'Incident Cluster #inc_a81b5b: Source IP 185.220.100.22 | Events Count: 12 | MITRE Tactics: ["T1110 - Brute Force"]',
      digest: '488480b6ca3f120649476bb2499f7fc43fbe08c16bec56b1d74517b1c38e7477',
      techBadge: '15-Min Graph Window',
    },
    {
      id: 6,
      num: '06',
      name: 'XAI Remediation',
      title: 'Stage 6: Explainable AI Feature Attribution & Playbook Guidance',
      filepath: 'app/xai/explainer.py',
      desc: 'Generates transparent feature attribution breakdowns and 3-step mitigation playbooks for active security incidents without black-box opacity.',
      payload: 'XAI Attribution: "Threat score 65.0 driven by action_code z-score (+4.84) and IP denial count. Remediation: Block 185.220.100.22 at firewall."',
      digest: '551029e8471b6501928471209e847120f2b259a563db460ee9d7b9ddf5b18d89',
      techBadge: 'Explainable AI',
    },
  ];

  const activePipelineObj = PIPELINE_STAGES.find((s) => s.id === activePipelineStage) || PIPELINE_STAGES[0];

  // Interactive Security Capabilities Data (Hover / Click Driven)
  const CAPABILITIES_DATA = [
    {
      id: 'ingestion',
      name: 'Telemetry Ingestion',
      icon: 'speed',
      badge: 'HIGH-THROUGHPUT',
      title: 'Wire-Speed Log Capture & Compression',
      desc: 'High-speed edge log ingestion capturing syslog streams from Cisco, Fortinet, Suricata, and pfSense with zero packet loss.',
      problem: 'Eliminates silent ingestion drops and uncompressed storage bottlenecks.',
      connection: 'Feeds raw byte streams directly into SHA-256 Merkle leaf hashing.',
      metrics: [
        { label: 'Throughput', val: '4.2M EPS' },
        { label: 'Latency', val: '< 2.5ms' },
        { label: 'Format', val: 'Syslog/CEF' },
      ],
      flow: ['Raw Network Stream', 'Edge Listener', 'Gzip Storage Writer', 'SHA-256 Hash Leaf'],
      route: '/dashboard',
    },
    {
      id: 'normalization',
      name: 'OCSF Normalization',
      icon: 'schema',
      badge: 'OCSF 1.1 SCHEMA',
      title: 'Unified Field Standardization & Mapping',
      desc: 'Transforms fragmented vendor log attributes into unified OCSF 1.1 schemas with consistent severity levels and ISO timestamps.',
      problem: 'Solves inconsistent field naming across multi-vendor security appliances.',
      connection: 'Provides standardized dictionary objects for Isolation Forest ML scoring.',
      metrics: [
        { label: 'Schema', val: 'OCSF 1.1' },
        { label: 'Parsers', val: '6 Appliances' },
        { label: 'Precision', val: '100% Mapping' },
      ],
      flow: ['Unstructured Text', 'Dynamic Regex', 'OCSF Field Mapping', 'UnifiedEvent Object'],
      route: '/log-explorer',
    },
    {
      id: 'detection',
      name: 'Anomaly Detection',
      icon: 'psychology',
      badge: 'ISOLATION FOREST',
      title: 'Autonomous Behavior Scoring & Heuristics',
      desc: 'Evaluates payload entropy, connection velocity, and port scan heuristics against pre-trained ML behavior baselines.',
      problem: 'Reduces false-positive alert fatigue while catching stealth zero-day attacks.',
      connection: 'Generates normalized threat scores (0-100) and severity classifications.',
      metrics: [
        { label: 'MTTD', val: '1.4s' },
        { label: 'Engine', val: 'Isolation Forest' },
        { label: 'Scoring', val: '0.0 - 100.0' },
      ],
      flow: ['Normalized Event', 'Feature Extraction', 'Z-Score Attribution', 'Threat Score Output'],
      route: '/dashboard',
    },
    {
      id: 'correlation',
      name: 'Event Correlation',
      icon: 'hub',
      badge: '15-MIN SLIDING GRAPH',
      title: 'Multi-Vector Incident Aggregation',
      desc: 'Correlates related security alerts across 15-minute sliding windows sharing offending IP entities into unified attack timelines.',
      problem: 'Consolidates hundreds of isolated alerts into a single actionable incident cluster.',
      connection: 'Triggers automated incident creation and MITRE ATT&CK tactic tagging.',
      metrics: [
        { label: 'Window', val: '15 Mins' },
        { label: 'Clustering', val: 'IP Graph' },
        { label: 'Reduction', val: '85% Fewer Alerts' },
      ],
      flow: ['Single Alert Stream', 'IP Entity Matcher', 'Sliding Time Window', 'Incident Cluster'],
      route: '/dashboard',
    },
    {
      id: 'threat-intel',
      name: 'Threat Intelligence',
      icon: 'public',
      badge: 'DYNAMIC GEOIP',
      title: 'Live Vector World Map & GeoIP Resolution',
      desc: 'Resolves IP subnets offline to precise lat/lng coordinates and plots attack markers over vector world map geometry.',
      problem: 'Provides spatial attack origin visibility without external API key dependencies.',
      connection: 'Visualizes perimeter threat concentration for SOC analysts.',
      metrics: [
        { label: 'Resolution', val: 'Subnet GeoIP' },
        { label: 'Mode', val: 'Offline Sovereign' },
        { label: 'Projection', val: 'Equirectangular' },
      ],
      flow: ['Attacker IP', 'Offline Subnet Lookup', 'Coordinate Math', 'Map Vector Marker'],
      route: '/threat-intel',
    },
    {
      id: 'forensics',
      name: 'Digital Forensics',
      icon: 'verified',
      badge: 'SHA-256 MERKLE',
      title: 'Cryptographic Chain of Custody & Audit Verification',
      desc: 'Verifies log payload immutability using SHA-256 Merkle tree leaf hashing, with built-in tamper detection simulation.',
      problem: 'Ensures court-admissible audit integrity and tamper detection.',
      connection: 'Provides cryptographic proof of raw log payload authenticity.',
      metrics: [
        { label: 'Hashing', val: 'SHA-256 Merkle' },
        { label: 'Audit Result', val: 'Tamper-Evident' },
        { label: 'Verification', val: 'WebCrypto API' },
      ],
      flow: ['Raw Payload', 'SHA-256 Hashing', 'Merkle Tree Root', 'Audit Verdict'],
      route: '/forensics',
    },
    {
      id: 'response',
      name: 'Incident Response',
      icon: 'shield',
      badge: 'XAI PLAYBOOKS',
      title: 'Explainable AI Feature Attribution & Containment',
      desc: 'Generates transparent feature attribution breakdowns and 3-step firewall mitigation commands for active security incidents.',
      problem: 'Eliminates black-box ML opacity and accelerates incident response containment.',
      connection: 'Equips analysts with immediate firewall block syntax.',
      metrics: [
        { label: 'XAI Model', val: 'Feature Z-Score' },
        { label: 'Playbook', val: '3-Step Mitigation' },
        { label: 'MTTR', val: '80% Reduction' },
      ],
      flow: ['Incident Trigger', 'Top Feature Analysis', 'Playbook Generation', 'Analyst Containment'],
      route: '/dashboard',
    },
    {
      id: 'reporting',
      name: 'Security Reporting',
      icon: 'description',
      badge: 'EXECUTIVE & AUDIT',
      title: 'Tenant-Isolated Reports & CSV Exports',
      desc: 'Generates exportable executive security reports and structured CSV datasets isolated to active user tenant boundaries.',
      problem: 'Streamlines compliance reporting for auditors and SOC management.',
      connection: 'Archives incident timelines into permanent documentation.',
      metrics: [
        { label: 'Isolation', val: 'Tenant Strict' },
        { label: 'Export', val: 'CSV & Audit PDF' },
        { label: 'Compliance', val: 'SOC 2 Ready' },
      ],
      flow: ['Tenant Scope', 'Filter Aggregation', 'Report Generation', 'CSV Export'],
      route: '/dashboard',
    },
  ];

  const activeCapabilityObj = CAPABILITIES_DATA.find((c) => c.id === activeFeature) || CAPABILITIES_DATA[0];

  // Interactive System Architecture Data (Hover / Click Driven)
  const ARCHITECTURE_NODES = [
    {
      id: 'sources',
      name: 'Log Sources',
      type: 'ENTRY NODE',
      desc: 'Enterprise network appliances sending raw syslog packets via UDP/TCP port 514 or raw API endpoints.',
      components: ['Cisco ASA Firewall', 'Fortinet FortiGate VPN', 'Suricata IDS/IPS', 'pfSense Gateway'],
    },
    {
      id: 'ingestion',
      name: 'Ingestion Layer',
      type: 'STREAM ENGINE',
      desc: 'High-throughput edge log capture writing raw compressed payload archives while hashing SHA-256 digests.',
      components: ['Raw Writer Service', 'SHA-256 Leaf Hasher', 'Gzip Storage Manager'],
    },
    {
      id: 'normalize',
      name: 'Normalization Layer',
      type: 'SCHEMA STANDARD',
      desc: 'Vendor format auto-detection engine mapping raw key-value pairs into standard OCSF 1.1 UnifiedEvent schema.',
      components: ['Dynamic Vendor Parser', 'OCSF Field Transformer', 'Schema Validator'],
    },
    {
      id: 'detection',
      name: 'Detection Engine',
      type: 'ML SCORING',
      desc: 'Isolation Forest machine learning engine computing entropy and connection velocity anomaly scores.',
      components: ['Isolation Forest Model', 'Heuristic Rule Evaluator', 'Feature Z-Score Engine'],
    },
    {
      id: 'correlate',
      name: 'Correlation Engine',
      type: 'GRAPH CLUSTERING',
      desc: 'Multi-vector incident aggregator grouping alerts across 15-minute sliding windows sharing IP entities.',
      components: ['15-Min Graph Window', 'IP Entity Matcher', 'Incident Cluster Creator'],
    },
    {
      id: 'intelligence',
      name: 'Threat Intelligence',
      type: 'SPATIAL RESOLUTION',
      desc: 'Offline GeoIP resolver mapping IP subnets to geographic coordinates and vector map markers.',
      components: ['Offline GeoIP DB', 'Equirectangular Map Projection', 'Threat Marker Overlay'],
    },
    {
      id: 'response',
      name: 'XAI Response',
      type: 'MITIGATION PLAYBOOK',
      desc: 'Explainable AI explainer delivering top feature attribution z-scores and step-by-step mitigation commands.',
      components: ['XAI Explainer Module', '3-Step Playbook Generator', 'SOC Command Center'],
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

        <nav className="hidden md:flex items-center gap-8 text-xs font-mono font-bold tracking-wider text-text-muted">
          <Link to="/threat-intel" className="hover:text-primary transition-colors">THREAT INTEL</Link>
          <Link to="/log-explorer" className="hover:text-primary transition-colors">LOG EXPLORER</Link>
          <Link to="/forensics" className="hover:text-primary transition-colors">FORENSICS</Link>
          <Link to="/dashboard" className="hover:text-primary transition-colors">COMMAND CENTER</Link>
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
        
        {/* CHAPTER 01: HERO INTELLIGENCE BRIEFING */}
        <section className="max-w-7xl mx-auto px-6 py-12 md:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center border-b border-border-muted">
          
          {/* Editorial Headline & Strategic Narrative (Span 7) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 bg-surface-dim px-3.5 py-1 rounded-full border border-border-muted font-mono text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-bold text-text-primary uppercase tracking-widest">[ BRIEFING // VOL. 2026-09 ]</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold text-text-primary tracking-tight leading-none font-sans">
              Command the <span className="text-primary underline decoration-primary/40 underline-offset-8">Sage Intelligence</span>
            </h1>

            <p className="text-base sm:text-lg text-text-muted leading-relaxed font-sans max-w-2xl">
              A sovereign telemetry intelligence engine unifying multi-vendor log streams, OCSF 1.1 field normalization, and explainable ML anomaly scoring into real-time threat visibility.
            </p>

            <div className="flex flex-wrap gap-4 pt-2 font-mono text-xs font-bold">
              <Link
                to="/dashboard"
                className="btn-primary px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg"
              >
                <span>[ ENTER SOC CONSOLE ]</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
              <Link
                to="/threat-intel"
                className="btn-secondary px-6 py-3 rounded-xl flex items-center gap-2"
              >
                <span>[ EXPLORE THREAT MAP ]</span>
                <span className="material-symbols-outlined text-sm">public</span>
              </Link>
            </div>
          </div>

          {/* Interactive Live Telemetry Evidence & Signal Propagation (Span 5) */}
          <div className="lg:col-span-5 glass-panel p-6 rounded-2xl border border-border-muted space-y-4 shadow-2xl relative overflow-hidden">
            <div className="flex justify-between items-center border-b border-border-muted pb-3 font-mono text-xs">
              <span className="font-bold text-text-primary uppercase tracking-wider">[ SIGNAL PROPAGATION MATRIX ]</span>
              <span className="text-emerald-400 font-bold">STREAM ACTIVE</span>
            </div>

            {/* Signal Flow Diagram */}
            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-surface-dim border border-border-muted flex justify-between items-center">
                <span className="text-text-muted">Edge Ingestion Stream:</span>
                <span className="text-emerald-400 font-bold">4.2M EPS</span>
              </div>
              <div className="p-3 rounded-xl bg-surface-dim border border-border-muted flex justify-between items-center">
                <span className="text-text-muted">OCSF Field Mapping:</span>
                <span className="text-primary font-bold">100% Unified</span>
              </div>
              <div className="p-3 rounded-xl bg-surface-dim border border-border-muted flex justify-between items-center">
                <span className="text-text-muted">Anomaly Threat Scoring:</span>
                <span className="text-rose-400 font-bold">1.4s Latency</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-surface-dim border border-border-muted text-center font-mono text-[10px] text-text-dim">
              [ ANNOTATION: CONTINUOUS MULTI-VENDOR TELEMETRY PIPELINE ]
            </div>
          </div>

        </section>

        {/* Supporting Metrics Bar */}
        <section className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-4 border-b border-border-muted">
          <div className="p-4 rounded-xl bg-surface-dim border border-border-muted font-mono text-center">
            <div className="text-[10px] text-text-dim uppercase tracking-wider">[ INGESTION ENGINE ]</div>
            <div className="text-xl font-bold text-text-primary mt-1">OCSF 1.1</div>
            <div className="text-[10px] text-emerald-400 mt-0.5">Unified Schema</div>
          </div>
          <div className="p-4 rounded-xl bg-surface-dim border border-border-muted font-mono text-center">
            <div className="text-[10px] text-text-dim uppercase tracking-wider">[ DETECTION LATENCY ]</div>
            <div className="text-xl font-bold text-secondary mt-1">1.4s</div>
            <div className="text-[10px] text-text-muted mt-0.5">Real-Time Scoring</div>
          </div>
          <div className="p-4 rounded-xl bg-surface-dim border border-border-muted font-mono text-center">
            <div className="text-[10px] text-text-dim uppercase tracking-wider">[ MERKLE INTEGRITY ]</div>
            <div className="text-xl font-bold text-text-primary mt-1">SHA-256</div>
            <div className="text-[10px] text-emerald-400 mt-0.5">Merkle Verified</div>
          </div>
          <div className="p-4 rounded-xl bg-surface-dim border border-border-muted font-mono text-center">
            <div className="text-[10px] text-text-dim uppercase tracking-wider">[ CORRELATION WINDOW ]</div>
            <div className="text-xl font-bold text-primary mt-1">15 MIN</div>
            <div className="text-[10px] text-text-muted mt-0.5">Multi-Vector Graph</div>
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

        {/* CHAPTER 02: 6-STAGE ZERO-LOSS TELEMETRY PIPELINE (GOLD STANDARD INTERACTION MODEL) */}
        <section className="max-w-7xl mx-auto px-6 py-16 border-b border-border-muted space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-border-muted pb-4">
            <div>
              <div className="text-xs font-mono text-text-muted uppercase tracking-widest">[ CHAPTER 02 // PIPELINE ARCHITECTURE ]</div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-text-primary tracking-tight mt-1">
                6-Stage Zero-Loss Telemetry Processing Pipeline
              </h2>
            </div>
            <p className="text-xs text-text-muted font-sans max-w-md">
              Hover over, tap, or focus any stage to inspect real-time processing mechanics and cryptographic SHA-256 Merkle digests.
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
                <div className="text-text-dim text-[10px] uppercase tracking-wider">[ PAYLOAD TRANSFORMATION SAMPLE ]</div>
                <div className="text-text-primary font-bold">{activePipelineObj.payload}</div>
                <div className="text-emerald-400 text-[11px] pt-1">
                  <span className="text-text-muted">SHA-256 Digest:</span> {activePipelineObj.digest}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CHAPTER 03: INTERACTIVE SECURITY CAPABILITIES SHOWCASE */}
        <section className="max-w-7xl mx-auto px-6 py-16 border-b border-border-muted space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-border-muted pb-4">
            <div>
              <div className="text-xs font-mono text-text-muted uppercase tracking-widest">[ CHAPTER 03 // PLATFORM CAPABILITIES ]</div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-text-primary tracking-tight mt-1">
                Interactive Security Capabilities Showcase
              </h2>
            </div>
            <p className="text-xs text-text-muted font-sans max-w-md">
              Explore platform features using hover, tap, or focus. Content updates dynamically without page jumping.
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
                <div className="text-[10px] text-text-dim uppercase tracking-wider">[ TECHNICAL EVENT FLOW ]</div>
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
                    <span>SOC Workflow Connection</span>
                  </div>
                  <p className="text-text-muted font-sans text-xs">{activeCapabilityObj.connection}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CHAPTER 04: INTERACTIVE SYSTEM ARCHITECTURE TOPOLOGY */}
        <section className="max-w-7xl mx-auto px-6 py-16 border-b border-border-muted space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-border-muted pb-4">
            <div>
              <div className="text-xs font-mono text-text-muted uppercase tracking-widest">[ CHAPTER 04 // SYSTEM TOPOLOGY ]</div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-text-primary tracking-tight mt-1">
                Interactive System Architecture
              </h2>
            </div>
            <p className="text-xs text-text-muted font-sans max-w-md">
              Hover over or focus any topology node to inspect its internal modules and operational responsibilities.
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
                  ACTIVE PIPELINE COMPONENT
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

        {/* CHAPTER 05: FINANCIAL IMPACT ESTIMATOR */}
        <section className="max-w-7xl mx-auto px-6 py-16 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="text-xs font-mono text-text-muted uppercase tracking-widest">[ CHAPTER 05 // FINANCIAL ESTIMATOR ]</div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
              Calculate SOC Efficiency & MTTR Reduction
            </h2>
            <p className="text-xs text-text-muted leading-relaxed font-sans">
              Estimate analyst time saved and incident response acceleration based on your perimeter footprint.
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
                    className="w-full h-2 bg-surface-dim rounded-lg appearance-none cursor-pointer accent-primary"
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
                    className="w-full h-2 bg-surface-dim rounded-lg appearance-none cursor-pointer accent-primary"
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
