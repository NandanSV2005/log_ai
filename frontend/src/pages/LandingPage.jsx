import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

export function LandingPage() {
  const { theme, setTheme } = useTheme();

  // 1. 6-Stage Telemetry Processing Pipeline State
  const [activeStage, setActiveStage] = useState(1);

  // 2. Interactive Feature Capabilities Navigator State
  const [activeFeature, setActiveFeature] = useState('threat-intel');

  // 3. Log-to-Response Security Workflow Stepper State
  const [activeWorkflowStep, setActiveWorkflowStep] = useState(1);

  // 4. Financial Impact Estimator State
  const [logVolume, setLogVolume] = useState(500000);
  const [devicesMonitored, setDevicesMonitored] = useState(25);

  // Financial Impact Calculations
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

  // 6-Stage Telemetry Pipeline Data
  const STAGES_DATA = [
    {
      id: 1,
      num: '01',
      name: 'Raw Ingestion',
      title: 'Stage 1: Raw Payload Ingestion & SHA-256 Hashing',
      filepath: 'app/storage/raw_writer.py',
      desc: 'Raw log payloads are captured byte-for-byte at the edge and immediately hashed with SHA-256 before any parsing occurs, establishing an unbroken forensic chain of custody with zero information loss.',
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
      desc: 'Dynamic extractors identify Cisco ASA, Fortinet, Suricata, and pfSense payloads automatically, converting raw syslog text into key-value attributes.',
      payload: 'Detected Format: Cisco ASA | Action: DENY | Protocol: TCP | SrcIP: 185.220.100.22 | DstIP: 10.0.0.10 | DstPort: 80',
      digest: '3c8e92ba8712df649f109281a8ef1284561029e8471b6501928471209e847120',
      techBadge: 'Multi-Vendor Parsing',
    },
    {
      id: 3,
      num: '03',
      name: 'OCSF Normalization',
      title: 'Stage 3: OCSF 1.1 Schema Normalization',
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
      title: 'Stage 4: Anomaly Detection Engine & Rules Evaluation',
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
      name: 'XAI & Remediation',
      title: 'Stage 6: Explainable AI Feature Attribution & Remediation Playbooks',
      filepath: 'app/xai/explainer.py',
      desc: 'Generates transparent feature attribution breakdowns and 3-step mitigation playbooks for active security incidents without black-box opacity.',
      payload: 'XAI Attribution: "Threat score 65.0 driven by action_code z-score (+4.84) and IP denial count. Remediation: Block 185.220.100.22 at firewall."',
      digest: '551029e8471b6501928471209e847120f2b259a563db460ee9d7b9ddf5b18d89',
      techBadge: 'Explainable AI',
    },
  ];

  const activeStageObj = STAGES_DATA.find((s) => s.id === activeStage) || STAGES_DATA[0];

  // Feature Navigator Data
  const FEATURES_DATA = [
    {
      id: 'telemetry',
      name: 'Real-Time Telemetry',
      icon: 'speed',
      badge: 'HIGH-THROUGHPUT',
      title: 'Live Telemetry Ingestion & System Health',
      summary: 'Ingest raw security streams from network firewalls, VPNs, and IDS/IPS appliances with real-time status monitoring.',
      problem: 'Solves silent ingestion failures and fragmented vendor log streams.',
      connection: 'Powers the foundational event pipeline feeding anomaly engines and dashboard views.',
      route: '/dashboard',
    },
    {
      id: 'threat-intel',
      name: 'Threat Intelligence',
      icon: 'public',
      badge: 'DYNAMIC GEOIP',
      title: 'Live Threat Vectors & Offline GeoIP Mapping',
      summary: 'Map active attack vectors onto an interactive vector world map with real-time GeoIP coordinates and threat severity indicators.',
      problem: 'Solves blind spots in geographic origin tracking for incoming security threats.',
      connection: 'Translates raw IP addresses into spatial attack intelligence for immediate perimeter defense.',
      route: '/threat-intel',
    },
    {
      id: 'log-explorer',
      name: 'Log Explorer',
      icon: 'database',
      badge: 'OCSF QUERY',
      title: 'Unified Log Search & Field Filtering',
      summary: 'Search normalized security records across OCSF 1.1 schema fields with instant key-value filtering and high-density telemetry tables.',
      problem: 'Solves tedious manual parsing across inconsistent vendor log formats.',
      connection: 'Allows analysts to filter and inspect specific telemetry events instantly.',
      route: '/log-explorer',
    },
    {
      id: 'forensics',
      name: 'Digital Forensics',
      icon: 'verified',
      badge: 'SHA-256 MERKLE',
      title: 'Cryptographic Chain of Custody & Audit Verification',
      summary: 'Verify payload integrity using SHA-256 Merkle tree leaf hashing, with built-in audit tamper simulation and verification badges.',
      problem: 'Solves compliance challenges and unverified log tampering concerns.',
      connection: 'Ensures court-admissible forensic auditability for every processed event.',
      route: '/forensics',
    },
    {
      id: 'rule-studio',
      name: 'Rule Studio',
      icon: 'tune',
      badge: 'CUSTOM YARA / SIGMA',
      title: 'Detection Rules & Heuristic Engine',
      summary: 'Configure detection rules, adjust sensitivity thresholds, and customize anomaly flags aligned with MITRE ATT&CK framework tactics.',
      problem: 'Solves rigid out-of-the-box alerting that causes alert fatigue.',
      connection: 'Controls detection thresholds and custom rule triggers across incoming log streams.',
      route: '/settings',
    },
    {
      id: 'reports',
      name: 'Saved Reports',
      icon: 'description',
      badge: 'EXECUTIVE & AUDIT',
      title: 'Saved Security Reports & CSV Exports',
      summary: 'Generate tenant-isolated executive security reports and export filtered incident timelines to CSV for team auditing.',
      problem: 'Solves manual report preparation for SOC management and compliance auditors.',
      connection: 'Consolidates threat findings into exportable documentation.',
      route: '/dashboard',
    },
  ];

  const activeFeatureObj = FEATURES_DATA.find((f) => f.id === activeFeature) || FEATURES_DATA[0];

  // Workflow Stepper Data
  const WORKFLOW_STEPS = [
    {
      step: 1,
      name: 'INGEST',
      title: '1. Wire Capture',
      desc: 'Raw syslog payload is ingested at edge and assigned a SHA-256 Merkle leaf hash.',
      detail: 'Log storage manager writes compressed raw gzip archive for audit custody.',
    },
    {
      step: 2,
      name: 'NORMALIZE',
      title: '2. OCSF Mapping',
      desc: 'Vendor parser maps vendor fields to OCSF 1.1 schema standards.',
      detail: 'Converts unstructured syslog to structured JSON event record.',
    },
    {
      step: 3,
      name: 'DETECT',
      title: '3. Anomaly Scoring',
      desc: 'Isolation Forest ML engine evaluates entropy & connection velocity.',
      detail: 'Computes threat score (0-100) and assigns severity level.',
    },
    {
      step: 4,
      name: 'CORRELATE',
      title: '4. Graph Clustering',
      desc: 'Incident aggregator links multi-vendor events within 15-minute window.',
      detail: 'Groups related alerts into a single actionable incident cluster.',
    },
    {
      step: 5,
      name: 'INVESTIGATE',
      title: '5. XAI Attribution',
      desc: 'Explainable AI breaks down top contributing feature z-scores.',
      detail: 'Identifies root cause factors behind alert elevation.',
    },
    {
      step: 6,
      name: 'RESPOND',
      title: '6. Playbook Mitigation',
      desc: 'Generates step-by-step remediation commands for SOC analysts.',
      detail: 'Provides firewall block rules and account containment steps.',
    },
  ];

  return (
    <div className="bg-background text-text-primary antialiased min-h-screen flex flex-col relative overflow-x-hidden font-sans">
      <div className="scan-overlay"></div>

      {/* Top Navbar */}
      <header className="w-full h-16 bg-background border-b border-border-muted hidden md:flex justify-between items-center px-6 max-w-7xl mx-auto relative z-20">
        <Link to="/" className="font-extrabold text-xl text-primary tracking-tighter flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            security
          </span>
          <span>LOG AI</span>
        </Link>

        <nav className="flex items-center gap-6 text-sm font-medium text-text-muted">
          <Link to="/threat-intel" className="hover:text-primary transition-colors">Threat Intel</Link>
          <Link to="/log-explorer" className="hover:text-primary transition-colors">Log Explorer</Link>
          <Link to="/forensics" className="hover:text-primary transition-colors">Forensics</Link>
          <Link to="/dashboard" className="hover:text-primary transition-colors">Command Center</Link>
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'sage' : 'dark')}
            className="px-3 py-1.5 rounded-lg border border-border-muted bg-surface-container text-xs font-mono font-bold flex items-center gap-2 hover:border-primary transition-all text-text-primary"
          >
            <span className="material-symbols-outlined text-sm">palette</span>
            <span>{theme === 'dark' ? 'CYBER VOID' : 'SAGE GREEN'}</span>
          </button>

          <Link to="/login" className="btn-secondary px-4 py-1.5 rounded-lg text-xs font-bold">
            Sign In
          </Link>
          <Link to="/dashboard" className="btn-primary px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1">
            <span>SOC Console</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>
      </header>

      {/* Mobile Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-surface-container border-t border-border-muted z-40 md:hidden flex justify-around py-2 px-1 shadow-md">
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
        
        {/* HERO SECTION — Product Value & Capabilities Focus */}
        <section className="relative min-h-[640px] flex flex-col justify-center items-center overflow-hidden px-4 text-center py-12">
          {/* Authentic Stitch Background Image Layer */}
          <div
            className={`absolute inset-0 z-0 ${
              theme === 'sage' ? 'opacity-15 mix-blend-multiply' : 'opacity-35 mix-blend-screen'
            }`}
            style={{
              backgroundImage:
                "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB8S2Qg245nw_HTuz2z_1HAFvI_uOZzTAqhRg2nI7CPKTXrXtVhQmkBe9GVjIdobqaom0DfUDMAPpCeuU8Pt_TW22GeTUAx1kQs4HbBn5r0of637-XKI8wod359PGV_7oAodswanWeQQJGQ3xwINTDW5q8c3YLijIiIeXa0-3d70sAQHhXDgipdmupMSzDXqPcDvJzA17tlQFTzwK_8a-MygDqo9XleANw7qqDJlfV-uohTzjG1rKlP')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          ></div>

          <div className="z-10 max-w-4xl mx-auto glass-panel p-8 sm:p-12 rounded-2xl border border-border-muted shadow-2xl relative">
            <div className="inline-flex items-center gap-2 mb-6 bg-surface-dim px-4 py-1.5 rounded-full border border-border-muted">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <span className="font-mono text-xs text-text-primary tracking-wide uppercase font-bold">
                OCSF 1.1 Unified Security Telemetry & Anomaly Engine
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-text-primary mb-6 tracking-tight leading-tight">
              Command Your <span className="text-primary">Security Telemetry</span> & Autonomous Threat Intelligence
            </h1>

            <p className="text-sm sm:text-base text-text-muted mb-8 max-w-2xl mx-auto leading-relaxed font-sans">
              Log AI ingests raw security logs from Cisco, Fortinet, Suricata, and pfSense appliances, normalizes events into standard OCSF schema, and detects threats using explainable ML anomaly scoring.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/dashboard"
                className="btn-primary px-8 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg"
              >
                <span>Enter SOC Console</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
              <Link
                to="/threat-intel"
                className="btn-secondary px-8 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
              >
                <span>Explore Threat Map</span>
                <span className="material-symbols-outlined text-sm">public</span>
              </Link>
            </div>
          </div>

          {/* Supporting Metrics Bar */}
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 relative z-10 w-full px-4">
            <div className="glass-panel p-4 rounded-xl border border-border-muted text-center">
              <div className="text-[10px] font-mono text-text-muted uppercase">Ingestion Engine</div>
              <div className="text-xl font-mono font-bold text-text-primary">OCSF 1.1</div>
              <div className="text-[10px] text-emerald-400 mt-0.5">Unified Schema</div>
            </div>
            <div className="glass-panel p-4 rounded-xl border border-border-muted text-center">
              <div className="text-[10px] font-mono text-text-muted uppercase">Avg Detection Latency</div>
              <div className="text-xl font-mono font-bold text-secondary">1.4s</div>
              <div className="text-[10px] text-text-muted mt-0.5">Real-Time Scoring</div>
            </div>
            <div className="glass-panel p-4 rounded-xl border border-border-muted text-center">
              <div className="text-[10px] font-mono text-text-muted uppercase">Forensic Chain</div>
              <div className="text-xl font-mono font-bold text-text-primary">SHA-256</div>
              <div className="text-[10px] text-emerald-400 mt-0.5">Merkle Verified</div>
            </div>
            <div className="glass-panel p-4 rounded-xl border border-border-muted text-center">
              <div className="text-[10px] font-mono text-text-muted uppercase">Correlation Window</div>
              <div className="text-xl font-mono font-bold text-primary">15 Min</div>
              <div className="text-[10px] text-text-muted mt-0.5">Multi-Vector Graph</div>
            </div>
          </div>

          {/* Marquee Ticker */}
          <div className="w-full bg-surface border-y border-border-muted overflow-hidden h-10 flex items-center mt-8 relative z-10">
            <div className="animate-marquee-smooth font-mono text-xs text-text-muted gap-8">
              {[...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS].map((item, idx) => (
                <span key={idx} className={`whitespace-nowrap ${item.color} font-medium`}>
                  {item.text}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 1: INTERACTIVE "WHAT STITCH DOES" FEATURE NAVIGATOR */}
        <section className="max-w-7xl mx-auto px-4 py-16 border-t border-border-muted space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="text-xs font-mono text-text-muted uppercase tracking-widest">Interactive Capability Tour</div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-text-primary">What Stitch SOC Engine Does</h2>
            <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
              Select a capability below to explore how Log AI handles security telemetry across each stage of the SOC workflow.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Feature Sidebar Selector (Span 4) */}
            <div className="lg:col-span-4 flex flex-col gap-2">
              {FEATURES_DATA.map((feat) => {
                const isSelected = activeFeature === feat.id;
                return (
                  <button
                    key={feat.id}
                    onClick={() => setActiveFeature(feat.id)}
                    className={`p-4 rounded-xl border text-left transition-all duration-200 flex items-center justify-between group ${
                      isSelected
                        ? 'bg-surface-container border-primary shadow-lg ring-1 ring-primary/40'
                        : 'bg-surface-dim border-border-muted hover:border-primary/40 hover:bg-surface-hover'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                          isSelected ? 'bg-primary text-surface-lowest' : 'bg-surface border border-border-muted text-text-muted group-hover:text-primary'
                        }`}
                      >
                        <span className="material-symbols-outlined text-xl">{feat.icon}</span>
                      </div>
                      <div>
                        <div className={`font-mono text-xs font-bold ${isSelected ? 'text-primary' : 'text-text-primary'}`}>
                          {feat.name}
                        </div>
                        <div className="text-[10px] text-text-dim font-mono">{feat.badge}</div>
                      </div>
                    </div>
                    <span className={`material-symbols-outlined text-sm transition-transform ${isSelected ? 'text-primary translate-x-1' : 'text-text-dim'}`}>
                      chevron_right
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Feature Interactive Visualization Panel (Span 8) */}
            <div className="lg:col-span-8 glass-panel rounded-2xl p-6 sm:p-8 border border-border-muted shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-border-muted pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-primary text-xl">{activeFeatureObj.icon}</span>
                    <h3 className="text-lg font-bold text-text-primary">{activeFeatureObj.title}</h3>
                  </div>
                  <p className="text-xs text-text-muted">{activeFeatureObj.summary}</p>
                </div>
                <Link
                  to={activeFeatureObj.route}
                  className="btn-secondary px-4 py-2 rounded-xl text-xs font-bold self-start sm:self-auto flex items-center gap-1.5"
                >
                  <span>Open Feature</span>
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                </Link>
              </div>

              {/* Feature Illustrative Interactive Preview Box */}
              <div className="bg-surface-dim rounded-xl p-5 border border-border-muted relative overflow-hidden min-h-[220px] flex flex-col justify-between">
                
                {/* 1. Real-Time Telemetry Preview */}
                {activeFeature === 'telemetry' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-xs font-mono border-b border-border-muted pb-2">
                      <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        Ingestion Stream Active
                      </span>
                      <span className="text-text-muted">Protocol: OCSF 1.1</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 font-mono text-center">
                      <div className="p-3 rounded-lg bg-surface border border-border-muted">
                        <div className="text-[10px] text-text-dim uppercase">Cisco ASA</div>
                        <div className="text-sm font-bold text-text-primary mt-1">1,420 EPS</div>
                      </div>
                      <div className="p-3 rounded-lg bg-surface border border-border-muted">
                        <div className="text-[10px] text-text-dim uppercase">Fortinet VPN</div>
                        <div className="text-sm font-bold text-text-primary mt-1">890 EPS</div>
                      </div>
                      <div className="p-3 rounded-lg bg-surface border border-border-muted">
                        <div className="text-[10px] text-text-dim uppercase">Suricata IDS</div>
                        <div className="text-sm font-bold text-text-primary mt-1">2,100 EPS</div>
                      </div>
                    </div>
                    <div className="h-16 w-full rounded-lg border border-border-muted bg-surface flex items-end p-2 gap-1">
                      {[40, 65, 30, 85, 50, 90, 45, 70, 60, 80, 55, 95].map((h, i) => (
                        <div key={i} className="flex-1 bg-primary/70 rounded-t" style={{ height: `${h}%` }}></div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Threat Intelligence World Map Preview */}
                {activeFeature === 'threat-intel' && (
                  <div className="relative h-48 rounded-lg border border-border-muted bg-surface-lowest overflow-hidden flex items-center justify-center">
                    <svg className="w-full h-full opacity-30 text-primary absolute inset-0" viewBox="0 0 1000 500">
                      <rect width="1000" height="500" fill="none" />
                      <g stroke="currentColor" strokeWidth="1" fill="none" strokeDasharray="3 3">
                        <line x1="0" y1="250" x2="1000" y2="250" />
                        <line x1="500" y1="0" x2="500" y2="500" />
                      </g>
                      <g fill="rgba(167, 139, 250, 0.25)" stroke="currentColor" strokeWidth="1">
                        <path d="M 120 70 L 220 50 L 320 60 L 370 120 L 240 245 Z" />
                        <path d="M 270 245 L 350 255 L 390 310 L 300 440 Z" />
                        <path d="M 470 70 L 580 65 L 610 110 L 490 155 Z" />
                        <path d="M 470 160 L 600 160 L 570 360 Z" />
                        <path d="M 580 65 L 890 55 L 940 140 L 780 270 Z" />
                        <path d="M 800 310 L 910 300 L 930 380 Z" />
                      </g>
                    </svg>
                    <div className="absolute left-[88%] top-[30%] -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-surface-dim/90 px-2 py-1 rounded border border-rose-500/50 shadow-lg font-mono text-[9px]">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                      <span className="text-rose-400 font-bold">153.120.50.10 (Tokyo)</span>
                    </div>
                    <div className="absolute left-[50%] top-[21%] -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-surface-dim/90 px-2 py-1 rounded border border-amber-500/50 shadow-lg font-mono text-[9px]">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <span className="text-amber-400 font-bold">185.220.100.22 (London)</span>
                    </div>
                  </div>
                )}

                {/* 3. Log Explorer Preview */}
                {activeFeature === 'log-explorer' && (
                  <div className="space-y-3 font-mono text-xs">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value="event_type:'cisco_asa' AND severity:'HIGH'"
                        className="w-full bg-surface border border-border-muted px-3 py-1.5 rounded text-[11px] text-primary"
                      />
                      <button className="btn-primary px-3 py-1.5 rounded text-[10px] font-bold">Query</button>
                    </div>
                    <div className="space-y-1.5">
                      <div className="p-2 rounded bg-surface border border-border-muted flex justify-between items-center text-[10px]">
                        <span className="text-rose-400 font-bold">[DENY] 192.168.1.100 &rarr; 10.0.0.50</span>
                        <span className="text-text-dim">Cisco ASA | Score 88.5</span>
                      </div>
                      <div className="p-2 rounded bg-surface border border-border-muted flex justify-between items-center text-[10px]">
                        <span className="text-emerald-400 font-bold">[AUTH OK] 10.0.0.12 &rarr; VPN-GW</span>
                        <span className="text-text-dim">Fortinet | Score 12.0</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. Digital Forensics Preview */}
                {activeFeature === 'forensics' && (
                  <div className="space-y-3 font-mono text-xs">
                    <div className="p-3 rounded-lg bg-surface border border-emerald-500/40 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-emerald-400">verified</span>
                        <span className="text-emerald-400 font-bold">Merkle Tree Audit Verification: PASSED</span>
                      </div>
                      <span className="text-[10px] text-text-dim">Zero Tampering Detected</span>
                    </div>
                    <div className="p-3 rounded-lg bg-surface border border-border-muted text-[10px] space-y-1">
                      <div className="text-text-dim">SHA-256 Root Hash:</div>
                      <div className="text-primary font-bold break-all">a4ea94c43d9dc8c7753255ca0d6e2bb2093560056c170d2f992edb7d36071e3f</div>
                    </div>
                  </div>
                )}

                {/* 5. Rule Studio Preview */}
                {activeFeature === 'rule-studio' && (
                  <div className="space-y-3 font-mono text-xs">
                    <div className="p-3 rounded-lg bg-surface border border-border-muted space-y-2">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-text-primary font-bold">Rule: SYN_Flood_Heuristic_Threshold</span>
                        <span className="px-2 py-0.5 rounded bg-primary/20 text-primary text-[9px] font-bold">ACTIVE</span>
                      </div>
                      <div className="text-[10px] text-text-muted">Trigger: connection_velocity &gt; 300/sec AND action == "DENY"</div>
                      <div className="flex gap-2 text-[9px]">
                        <span className="bg-surface-dim border border-border-muted px-2 py-0.5 rounded text-text-dim">MITRE T1110</span>
                        <span className="bg-surface-dim border border-border-muted px-2 py-0.5 rounded text-rose-400">Severity: HIGH</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. Saved Reports Preview */}
                {activeFeature === 'reports' && (
                  <div className="space-y-3 font-mono text-xs">
                    <div className="p-3 rounded-lg bg-surface border border-border-muted flex justify-between items-center">
                      <div>
                        <div className="text-text-primary font-bold">Executive Threat Summary #2026-08</div>
                        <div className="text-[10px] text-text-muted">Generated by analyst1 | 14 Active Incident Clusters</div>
                      </div>
                      <button className="btn-secondary px-3 py-1 rounded text-[10px] font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">download</span>
                        <span>CSV</span>
                      </button>
                    </div>
                  </div>
                )}

              </div>

              {/* Problem Solved & SOC Connection Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono pt-2 border-t border-border-muted">
                <div className="p-3 rounded-xl bg-surface-dim border border-border-muted space-y-1">
                  <div className="text-amber-400 font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">shield</span>
                    <span>Problem Solved</span>
                  </div>
                  <p className="text-text-muted font-sans text-xs">{activeFeatureObj.problem}</p>
                </div>
                <div className="p-3 rounded-xl bg-surface-dim border border-border-muted space-y-1">
                  <div className="text-primary font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">hub</span>
                    <span>SOC Workflow Connection</span>
                  </div>
                  <p className="text-text-muted font-sans text-xs">{activeFeatureObj.connection}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: INTERACTIVE "FROM LOG TO RESPONSE" WORKFLOW */}
        <section className="max-w-7xl mx-auto px-4 py-16 border-t border-border-muted space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="text-xs font-mono text-text-muted uppercase tracking-widest">End-to-End Event Lifecycle</div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-text-primary">From Raw Log to Mitigation Response</h2>
            <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
              Follow how an incoming security event flows through the automated Stitch engine from raw packet capture to actionable analyst playbook.
            </p>
          </div>

          {/* Interactive Stepper Control Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 max-w-5xl mx-auto">
            {WORKFLOW_STEPS.map((s) => {
              const isCurrent = activeWorkflowStep === s.step;
              return (
                <button
                  key={s.step}
                  onClick={() => setActiveWorkflowStep(s.step)}
                  className={`p-3 rounded-xl border text-center font-mono text-xs font-bold transition-all duration-200 ${
                    isCurrent
                      ? 'bg-primary text-surface-lowest border-primary shadow-lg scale-105'
                      : 'bg-surface-dim border-border-muted text-text-muted hover:text-text-primary hover:border-primary/40'
                  }`}
                >
                  <div className="text-[10px] opacity-70">STEP 0{s.step}</div>
                  <div className="mt-0.5">{s.name}</div>
                </button>
              );
            })}
          </div>

          {/* Active Workflow Step Display Card */}
          {(() => {
            const currentStepObj = WORKFLOW_STEPS.find((w) => w.step === activeWorkflowStep) || WORKFLOW_STEPS[0];
            return (
              <div className="max-w-4xl mx-auto glass-panel p-6 sm:p-8 rounded-2xl border border-border-muted space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-border-muted pb-4">
                  <h3 className="text-lg font-bold text-text-primary">{currentStepObj.title}</h3>
                  <span className="font-mono text-xs text-primary px-3 py-1 rounded bg-surface-dim border border-border-muted">
                    Workflow Phase 0{currentStepObj.step} of 06
                  </span>
                </div>
                <p className="text-xs text-text-muted leading-relaxed font-sans">{currentStepObj.desc}</p>
                <div className="p-4 rounded-xl bg-surface-dim border border-border-muted font-mono text-xs space-y-2">
                  <div className="text-text-dim text-[10px] uppercase">Engine Execution Detail:</div>
                  <div className="text-emerald-400 font-bold">{currentStepObj.detail}</div>
                </div>
              </div>
            );
          })()}
        </section>

        {/* SECTION 3: 6-STAGE TELEMETRY PROCESSING PIPELINE */}
        <section className="max-w-7xl mx-auto px-4 py-16 border-t border-border-muted space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-text-primary">6-Stage Zero-Loss Telemetry Processing Pipeline</h2>
            <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
              Hover over or click any stage below to inspect real-time processing details, SHA-256 Merkle hashes, and payload transformations.
            </p>
          </div>

          <div className="max-w-5xl mx-auto space-y-6">
            {/* Interactive Stage Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 font-mono text-xs">
              {STAGES_DATA.map((stage) => (
                <button
                  key={stage.id}
                  onMouseEnter={() => setActiveStage(stage.id)}
                  onClick={() => setActiveStage(stage.id)}
                  className={`p-3 rounded-xl border font-bold transition-all duration-150 text-left flex flex-col justify-between h-20 ${
                    activeStage === stage.id
                      ? 'bg-primary text-surface-lowest border-primary shadow-lg scale-105'
                      : 'bg-surface border-border-muted text-text-muted hover:text-text-primary hover:border-primary/50'
                  }`}
                >
                  <span className="text-[10px] opacity-70">{stage.num}</span>
                  <span className="text-xs font-extrabold">{stage.name}</span>
                </button>
              ))}
            </div>

            {/* Active Stage Content Display Card */}
            <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-border-muted space-y-4 transition-all duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-muted pb-4">
                <h3 className="text-lg font-bold text-text-primary">{activeStageObj.title}</h3>
                <div className="flex gap-2 items-center">
                  <span className="px-2.5 py-1 rounded bg-surface-dim border border-border-muted font-mono text-[10px] text-emerald-400 font-bold">
                    {activeStageObj.techBadge}
                  </span>
                  <span className="px-3 py-1 rounded bg-surface-dim border border-border-muted font-mono text-xs text-primary">
                    {activeStageObj.filepath}
                  </span>
                </div>
              </div>

              <p className="text-xs text-text-muted leading-relaxed font-sans">{activeStageObj.desc}</p>

              <div className="p-4 rounded-xl bg-surface-dim border border-border-muted font-mono text-xs space-y-2">
                <div className="text-text-dim text-[10px] uppercase">Payload Sample:</div>
                <div className="text-text-primary font-bold">{activeStageObj.payload}</div>
                <div className="text-emerald-400 text-[11px] pt-1">
                  <span className="text-text-muted">SHA-256 Digest:</span> {activeStageObj.digest}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: SUPPORTED PERIMETER SECURITY APPLIANCES */}
        <section className="max-w-7xl mx-auto px-4 py-16 border-t border-border-muted space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl font-bold text-text-primary">Supported Perimeter Security Appliances</h2>
            <p className="text-xs text-text-muted leading-relaxed">
              Tailored parsers and threat detection workflows for core enterprise perimeter network appliances.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="glass-panel p-5 rounded-2xl border border-border-muted hover:border-primary transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="material-symbols-outlined text-primary text-xl">shield</span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-surface-dim border border-border-muted text-text-muted">FIREWALL</span>
              </div>
              <h4 className="text-sm font-bold text-text-primary mb-1">Cisco ASA Firewall</h4>
              <p className="text-xs text-text-muted leading-relaxed">
                Connection flood detection and ACL deny policy violations across outside access groups to spot stealthy port scans.
              </p>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-border-muted hover:border-primary transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="material-symbols-outlined text-primary text-xl">lock</span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-surface-dim border border-border-muted text-text-muted">VPN GATEWAY</span>
              </div>
              <h4 className="text-sm font-bold text-text-primary mb-1">Fortinet FortiGate</h4>
              <p className="text-xs text-text-muted leading-relaxed">
                SSL VPN authentication brute-force monitoring and perimeter policy bypass detection with geographic anomaly tracking.
              </p>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-border-muted hover:border-primary transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="material-symbols-outlined text-primary text-xl">monitoring</span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-surface-dim border border-border-muted text-text-muted">IDS / IPS</span>
              </div>
              <h4 className="text-sm font-bold text-text-primary mb-1">Suricata IDS / IPS</h4>
              <p className="text-xs text-text-muted leading-relaxed">
                ET Malware signature alert parsing and automated correlation of IDS payload signatures with firewall drop events.
              </p>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-border-muted hover:border-primary transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="material-symbols-outlined text-primary text-xl">route</span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-surface-dim border border-border-muted text-text-muted">PERIMETER</span>
              </div>
              <h4 className="text-sm font-bold text-text-primary mb-1">pfSense Gateway</h4>
              <p className="text-xs text-text-muted leading-relaxed">
                Edge packet filter deny log tracking and state table exhaustion detection before internal infrastructure impact.
              </p>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-border-muted hover:border-primary transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="material-symbols-outlined text-primary text-xl">storage</span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-surface-dim border border-border-muted text-text-muted">REGISTRY</span>
              </div>
              <h4 className="text-sm font-bold text-text-primary mb-1">Generic Syslog / CEF</h4>
              <p className="text-xs text-text-muted leading-relaxed">
                Dynamic fallback parser extracting structured key-value pairs (CEF, Key=Value, JSON) for any custom perimeter log stream.
              </p>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-border-muted hover:border-primary transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="material-symbols-outlined text-primary text-xl">hub</span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-surface-dim border border-border-muted text-text-muted">ENSEMBLE</span>
              </div>
              <h4 className="text-sm font-bold text-text-primary mb-1">Multi-Vendor Correlation</h4>
              <p className="text-xs text-text-muted leading-relaxed">
                Cross-appliance IP incident grouping linking Cisco, Fortinet, and Suricata events into unified 15-minute attack timelines.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 5: FINANCIAL IMPACT & SOC EFFICIENCY ESTIMATOR */}
        <section className="max-w-7xl mx-auto px-4 py-16 border-t border-border-muted space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="text-xs font-mono text-text-muted uppercase tracking-widest">Financial Impact Estimator</div>
            <h2 className="text-2xl font-bold text-text-primary">Calculate SOC Efficiency & MTTR Reduction</h2>
            <p className="text-xs text-text-muted leading-relaxed">
              Estimate analyst time saved and incident response acceleration based on your perimeter footprint.
            </p>
          </div>

          <div className="glass-panel rounded-2xl p-8 max-w-4xl mx-auto border border-border-muted">
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

      {/* Footer */}
      <footer className="w-full py-8 border-t border-border-muted bg-surface-dim text-center text-text-dim text-xs font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="font-extrabold text-base text-text-primary">LOG AI</div>
          <div className="flex gap-4">
            <Link to="/login" className="hover:text-primary transition-colors">Sign In</Link>
            <Link to="/register" className="hover:text-primary transition-colors">Register</Link>
            <Link to="/threat-intel" className="hover:text-primary transition-colors">Threat Intel</Link>
            <Link to="/dashboard" className="hover:text-primary transition-colors">SOC Console</Link>
          </div>
          <div>© 2026 Log AI Security Engine. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
