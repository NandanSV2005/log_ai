import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

export function LandingPage() {
  const { theme, setTheme } = useTheme();

  // Financial Impact Estimator State
  const [logVolume, setLogVolume] = useState(500000);
  const [devicesMonitored, setDevicesMonitored] = useState(25);

  // 6-Stage Pipeline Stepper State (Hover Activated)
  const [activeStage, setActiveStage] = useState(1);

  // Calculations for Financial Impact Estimator
  const hoursSaved = ((logVolume * 0.001 * 0.85 * 3.5 * 30) / 60).toFixed(1);
  const mttrReduction = Math.min(85, (50 + devicesMonitored * 0.2)).toFixed(1);
  const monthlySavings = (hoursSaved * 65).toLocaleString('en-US', { maximumFractionDigits: 0 });

  const TICKER_ITEMS = [
    { type: 'ALERT', color: 'text-rose-400', text: '[ALERT] SYN Flood detected on Edge Node 04' },
    { type: 'INFO', color: 'text-text-muted', text: '[INFO] Routine model retraining completed' },
    { type: 'WARN', color: 'text-amber-400', text: '[WARN] Anomaly in egress traffic volume (IP: 192.168.1.105)' },
    { type: 'INFO', color: 'text-emerald-400', text: '[INFO] Ingestion rate stabilized at 4.2M EPS' },
    { type: 'ALERT', color: 'text-rose-400', text: '[ALERT] Multiple failed auth attempts - Region: EU-West' },
  ];

  const STAGES_DATA = [
    {
      id: 1,
      num: '01',
      name: 'Ingestion',
      title: 'Stage 1: Raw Wire-Capture & SHA-256 Leaf Hashing',
      filepath: 'app/storage/raw_writer.py',
      desc: 'Raw log payloads are captured byte-for-byte at the network edge and immediately hashed with SHA-256 before any parsing occurs, establishing an unbroken forensic chain of custody with zero information loss.',
      payload: '%ASA-4-106023: Deny tcp src outside:192.168.1.100/54321 dst inside:10.0.0.50/80 by access-group "outside_acl"',
      digest: 'f2b259a563db460ee9d7b9ddf5b18d8927d2418067626ab5602e15a409a537bf',
    },
    {
      id: 2,
      num: '02',
      name: 'Parsing',
      title: 'Stage 2: Vendor Format Auto-Detection & Key-Value Extraction',
      filepath: 'app/parsers/dynamic_parser.py',
      desc: 'Dynamic regex & key-value extractors identify Cisco ASA, Fortinet, Suricata, and pfSense payloads automatically, mapping unstructured syslog into structured dictionary fields.',
      payload: 'Parsed Vendor: Cisco ASA | Action: Deny | Protocol: TCP | SrcIP: 192.168.1.100 | DstIP: 10.0.0.50',
      digest: '3c8e92ba8712df649f109281a8ef1284561029e8471b6501928471209e847120',
    },
    {
      id: 3,
      num: '03',
      name: 'Normalization',
      title: 'Stage 3: OCSF 1.1 Schema Mapping & Field Standardization',
      filepath: 'app/normalization/schema.py',
      desc: 'Normalizes arbitrary security events into standard OCSF 1.1 UnifiedEvent objects with uniform timestamps, IP types, threat levels, and device metadata.',
      payload: 'UnifiedEvent(event_type="cisco_asa", threat_level="HIGH", threat_score=88.5, status="New")',
      digest: '7a910284712b6501928471209e847120f2b259a563db460ee9d7b9ddf5b18d89',
    },
    {
      id: 4,
      num: '04',
      name: 'Detection',
      title: 'Stage 4: Isolation Forest Anomaly Scoring & Rule Engine',
      filepath: 'app/detection/anomaly_engine.py',
      desc: 'Evaluates payload entropy, connection velocity, and port scan heuristics to compute an anomaly threat score (0.0 to 100.0) in real time.',
      payload: 'Anomaly Engine Output: Threat Score = 88.5 | Level = HIGH | Anomaly Flags = ["High Connection Velocity", "Port Scan"]',
      digest: '9f7fe12c98001dcace31357795d410458710a892bfecdac00aee45bce0a96915',
    },
    {
      id: 5,
      num: '05',
      name: 'Correlation',
      title: 'Stage 5: Multi-Vector Graph Incident Aggregation',
      filepath: 'app/detection/correlation.py',
      desc: 'Correlates related events across 15-minute time windows sharing offending source IPs, clustering individual alerts into unified attack timelines.',
      payload: 'Incident Cluster #inc_88912: Source IP 192.168.1.100 | Events Count: 14 | MITRE Tactics: ["T1110", "T1046"]',
      digest: '488480b6ca3f120649476bb2499f7fc43fbe08c16bec56b1d74517b1c38e7477',
    },
    {
      id: 6,
      num: '06',
      name: 'XAI Insights',
      title: 'Stage 6: Explainable AI Feature Attribution & Copilot Guidance',
      filepath: 'app/xai/explainer.py',
      desc: 'Generates plain-language XAI explanations and 3-step mitigation playbooks for active security incidents with zero black-box opacity.',
      payload: 'XAI Explanation: "Connection velocity spiked 420% above baseline with repeated denied TCP SYN packets to port 80."',
      digest: '551029e8471b6501928471209e847120f2b259a563db460ee9d7b9ddf5b18d89',
    },
  ];

  const activeStageObj = STAGES_DATA.find((s) => s.id === activeStage) || STAGES_DATA[0];

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
        {/* ISSUE 1 FIX: Hero Section with Authentic Stitch Background Overlay */}
        <section className="relative min-h-[780px] flex flex-col justify-center items-center overflow-hidden px-4 text-center">
          {/* Authentic Stitch Cyber/Sage Void Background Image Layer */}
          <div
            className={`absolute inset-0 z-0 ${
              theme === 'sage' ? 'opacity-15 mix-blend-multiply' : 'opacity-40 mix-blend-screen'
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
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="font-mono text-xs text-text-primary tracking-wide">
                SYSTEM LIVE: INGESTING 4.2M EVENTS/SEC
              </span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold text-text-primary mb-6 tracking-tight leading-tight">
              Command the <span className="text-primary">{theme === 'sage' ? 'Sage Intelligence' : 'Cyber Void'}</span>
            </h1>

            <p className="text-base sm:text-lg text-text-muted mb-8 max-w-2xl mx-auto leading-relaxed font-sans">
              Log AI merges hyper-scale telemetry with autonomous threat detection. Transform chaotic raw logs into actionable, high-assurance intelligence in milliseconds.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/dashboard"
                className="btn-primary px-8 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg"
              >
                <span>Initialize Core</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
              <Link
                to="/threat-intel"
                className="btn-secondary px-8 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
              >
                <span>View Threat Map</span>
                <span className="material-symbols-outlined text-sm">public</span>
              </Link>
            </div>
          </div>

          {/* ISSUE 3 FIX: Smooth Continuous Marquee Event Ticker */}
          <div className="w-full bg-surface border-y border-border-muted overflow-hidden h-10 flex items-center mt-12 relative z-10">
            <div className="animate-marquee-smooth font-mono text-xs text-text-muted gap-8">
              {[...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS].map((item, idx) => (
                <span key={idx} className={`whitespace-nowrap ${item.color} font-medium`}>
                  {item.text}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Features Bento Grid Section */}
        <section className="max-w-7xl mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Feature 1: Autonomous AI Detection */}
            <div className="md:col-span-8 glass-panel rounded-2xl p-6 border border-border-muted relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="material-symbols-outlined text-primary text-2xl">psychology</span>
                  <h3 className="text-lg font-bold text-text-primary">Autonomous AI Detection</h3>
                </div>
                <p className="text-xs text-text-muted leading-relaxed mb-4">
                  Deploy self-learning models that baseline normal network behavior and flag zero-day anomalies instantly, reducing MTTR by 80%.
                </p>
              </div>
              <div className="bg-surface-dim rounded-lg p-3 border border-border-muted font-mono text-xs text-amber-500 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">warning</span>
                <span>Analyzing behavioral deviation... Confidence: 94.2%</span>
              </div>
            </div>

            {/* KPI Tile 1: MTTD */}
            <div className="md:col-span-4 glass-panel rounded-2xl p-6 border border-border-muted flex flex-col items-center justify-center text-center">
              <span className="text-xs font-mono text-text-muted uppercase tracking-widest mb-1">MTTD</span>
              <span className="text-4xl font-extrabold font-mono text-secondary">1.4s</span>
            </div>

            {/* KPI Tile 2: Active Threats */}
            <div className="md:col-span-4 glass-panel rounded-2xl p-6 border border-border-muted flex flex-col items-center justify-center text-center">
              <span className="text-xs font-mono text-text-muted uppercase tracking-widest mb-1">Active Threats</span>
              <span className="text-4xl font-extrabold font-mono text-rose-500">03</span>
            </div>

            {/* Real-Time Telemetry Stream Graph Card */}
            <div className="md:col-span-8 glass-panel rounded-2xl p-6 border border-border-muted relative overflow-hidden group space-y-3">
              <div
                className="absolute left-0 top-0 bottom-0 w-1 opacity-50 group-hover:opacity-100 transition-opacity"
                style={{ backgroundColor: 'var(--color-tertiary)' }}
              ></div>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-2xl" style={{ color: 'var(--color-tertiary)' }}>
                  speed
                </span>
                <h3 className="text-lg font-bold text-text-primary">Real-Time Telemetry</h3>
              </div>
              <div className="h-32 w-full rounded-xl border border-border-muted bg-surface-dim flex items-end p-2 gap-1 overflow-hidden">
                <div className="w-1/12 h-1/4 rounded-t opacity-70" style={{ backgroundColor: 'var(--color-tertiary)' }}></div>
                <div className="w-1/12 h-2/4 rounded-t opacity-70" style={{ backgroundColor: 'var(--color-tertiary)' }}></div>
                <div className="w-1/12 h-1/3 rounded-t opacity-70" style={{ backgroundColor: 'var(--color-tertiary)' }}></div>
                <div className="w-1/12 h-3/4 rounded-t opacity-70" style={{ backgroundColor: 'var(--color-tertiary)' }}></div>
                <div className="w-1/12 h-1/2 rounded-t opacity-70" style={{ backgroundColor: 'var(--color-tertiary)' }}></div>
                <div className="w-1/12 h-5/6 rounded-t opacity-90 animate-pulse" style={{ backgroundColor: 'var(--color-tertiary)' }}></div>
                <div className="w-1/12 h-1/4 rounded-t opacity-70" style={{ backgroundColor: 'var(--color-tertiary)' }}></div>
                <div className="w-1/12 h-2/3 rounded-t opacity-70" style={{ backgroundColor: 'var(--color-tertiary)' }}></div>
                <div className="w-1/12 h-3/5 rounded-t opacity-70" style={{ backgroundColor: 'var(--color-tertiary)' }}></div>
                <div className="w-1/12 h-4/5 rounded-t opacity-70" style={{ backgroundColor: 'var(--color-tertiary)' }}></div>
                <div className="w-1/12 h-1/2 rounded-t opacity-70" style={{ backgroundColor: 'var(--color-tertiary)' }}></div>
                <div className="w-1/12 h-full rounded-t opacity-90" style={{ backgroundColor: 'var(--color-tertiary)' }}></div>
              </div>
            </div>
          </div>
        </section>

        {/* Supported Perimeter Security Appliances */}
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

          {/* Feature Tags Pills */}
          <div className="glass-panel rounded-2xl p-4 flex flex-wrap justify-center gap-3">
            <div className="flex items-center gap-2 bg-surface-dim border border-border-muted px-3.5 py-1.5 rounded-full text-xs">
              <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
              <span className="font-medium text-text-primary">OCSF-Aligned Schema</span>
            </div>
            <div className="flex items-center gap-2 bg-surface-dim border border-border-muted px-3.5 py-1.5 rounded-full text-xs">
              <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
              <span className="font-medium text-text-primary">Air-Gapped Deployment Ready</span>
            </div>
            <div className="flex items-center gap-2 bg-surface-dim border border-border-muted px-3.5 py-1.5 rounded-full text-xs">
              <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
              <span className="font-medium text-text-primary">Container-Native (Docker)</span>
            </div>
            <div className="flex items-center gap-2 bg-surface-dim border border-border-muted px-3.5 py-1.5 rounded-full text-xs">
              <span className="material-symbols-outlined text-secondary text-sm">check_circle</span>
              <span className="font-medium text-text-primary">Forensic Chain-of-Custody (SHA-256 Merkle)</span>
            </div>
            <div className="flex items-center gap-2 bg-surface-dim border border-border-muted px-3.5 py-1.5 rounded-full text-xs">
              <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
              <span className="font-medium text-text-primary">Tamper-Evident Audit Log</span>
            </div>
          </div>
        </section>

        {/* Calculate SOC Efficiency (Financial Impact Estimator) */}
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
              {/* Interactive Sliders */}
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

              {/* Calculated Results */}
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

        {/* ISSUE 4 FIX: High-Contrast Log Text Color in Telemetry Terminal */}
        <section className="max-w-7xl mx-auto px-4 py-16 border-t border-border-muted space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="text-xs font-mono text-text-muted uppercase tracking-widest">SOC Console Preview</div>
            <h2 className="text-2xl font-bold text-text-primary">Telemetry Output & Console Intelligence</h2>
            <p className="text-xs text-text-muted leading-relaxed">
              Real-time stats fetched directly from API endpoints when authenticated, with standby states when unauthenticated.
            </p>
          </div>

          <div className="glass-panel rounded-2xl p-6 max-w-5xl mx-auto border border-border-muted space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
              <div className="p-4 rounded-xl bg-surface-dim border border-border-muted">
                <div className="text-[10px] font-mono text-text-muted uppercase mb-1">Total Events</div>
                <div className="text-2xl font-extrabold font-mono text-text-primary">0</div>
                <div className="text-[10px] text-text-muted mt-1">Standby Buffer</div>
              </div>

              <div className="p-4 rounded-xl bg-surface-dim border border-border-muted">
                <div className="text-[10px] font-mono text-text-muted uppercase mb-1">Anomaly Index</div>
                <div className="text-2xl font-extrabold font-mono text-text-primary">0.0</div>
                <div className="text-[10px] text-text-muted mt-1">Pipeline Avg</div>
              </div>

              <div className="p-4 rounded-xl bg-surface-dim border border-border-muted">
                <div className="text-[10px] font-mono text-text-muted uppercase mb-1">Active Incidents</div>
                <div className="text-2xl font-extrabold font-mono text-text-primary">0</div>
                <div className="text-[10px] text-text-muted mt-1">Cluster Groups</div>
              </div>

              <div className="p-4 rounded-xl bg-surface-dim border border-border-muted">
                <div className="text-[10px] font-mono text-text-muted uppercase mb-1">Pipeline Latency</div>
                <div className="text-2xl font-extrabold font-mono text-text-primary">11.4 ms</div>
                <div className="text-[10px] text-text-muted mt-1">Ingest to Score</div>
              </div>
            </div>

            {/* High-Contrast Terminal Log Output Box */}
            <div
              className="rounded-xl border border-border-muted overflow-hidden font-mono text-xs diag-stripes shadow-inner"
              style={{ backgroundColor: 'var(--terminal-bg)' }}
            >
              <div
                className="px-4 py-2 border-b border-border-muted flex justify-between items-center text-[11px]"
                style={{ backgroundColor: 'var(--terminal-header-bg)', color: 'var(--terminal-text-muted)' }}
              >
                <span>Sample Telemetry Stream (OCSF Unified Protocol)</span>
                <span className="font-bold px-2 py-0.5 rounded bg-surface-container border border-border-muted text-[10px]">
                  FOR DEMO ONLY
                </span>
              </div>

              <div className="p-4 space-y-3 overflow-x-auto">
                <div className="flex items-center gap-3 whitespace-nowrap border-b border-white/5 pb-2">
                  <span style={{ color: 'var(--terminal-text-muted)' }}>2026-08-30 14:14:02</span>
                  <span style={{ color: 'var(--terminal-text-main)' }} className="font-bold">192.168.1.100</span>
                  <span className="border border-border-muted px-2 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: 'var(--color-bg-card)', color: 'var(--terminal-text-main)' }}>
                    Cisco ASA
                  </span>
                  <span className="text-rose-400 font-bold">HIGH (88.5)</span>
                  <span style={{ color: 'var(--terminal-text-main)' }}>
                    %ASA-4-106023: Deny tcp src outside:192.168.1.100/54321 dst inside:10.0.0.50/80
                  </span>
                </div>

                <div className="flex items-center gap-3 whitespace-nowrap border-b border-white/5 pb-2">
                  <span style={{ color: 'var(--terminal-text-muted)' }}>2026-08-30 14:14:15</span>
                  <span style={{ color: 'var(--terminal-text-main)' }} className="font-bold">192.168.1.105</span>
                  <span className="border border-border-muted px-2 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: 'var(--color-bg-card)', color: 'var(--terminal-text-main)' }}>
                    Fortinet
                  </span>
                  <span className="text-emerald-400 font-bold">LOW (12.0)</span>
                  <span style={{ color: 'var(--terminal-text-main)' }}>
                    Fortinet SSL VPN authentication successful user="admin_jdoe"
                  </span>
                </div>

                <div className="flex items-center gap-3 whitespace-nowrap">
                  <span style={{ color: 'var(--terminal-text-muted)' }}>2026-08-30 14:14:31</span>
                  <span style={{ color: 'var(--terminal-text-main)' }} className="font-bold">192.168.1.200</span>
                  <span className="border border-border-muted px-2 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: 'var(--color-bg-card)', color: 'var(--terminal-text-main)' }}>
                    Suricata
                  </span>
                  <span className="text-rose-400 font-bold">HIGH (94.2)</span>
                  <span style={{ color: 'var(--terminal-text-main)' }}>
                    Suricata ET MALWARE Compromised Host Activity Signature Match
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ISSUE 5 FIX: 6-Stage Telemetry Processing Pipeline Hover Activation */}
        <section className="max-w-7xl mx-auto px-4 py-16 border-t border-border-muted space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl font-bold text-text-primary">6-Stage Zero-Loss Telemetry Processing Pipeline</h2>
            <p className="text-xs text-text-muted leading-relaxed">
              Hover over any stage below to inspect real-time processing details and payload transformation steps.
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-6">
            {/* Stepper Tabs with Hover Interaction */}
            <div className="flex flex-wrap gap-2 justify-center font-mono text-xs">
              {STAGES_DATA.map((stage) => (
                <button
                  key={stage.id}
                  onMouseEnter={() => setActiveStage(stage.id)}
                  onClick={() => setActiveStage(stage.id)}
                  className={`px-4 py-2.5 rounded-lg border font-bold transition-all duration-150 ${
                    activeStage === stage.id
                      ? 'bg-primary text-surface-lowest border-primary shadow-lg scale-105'
                      : 'bg-surface border-border-muted text-text-muted hover:text-text-primary hover:border-primary/50'
                  }`}
                >
                  <span className="opacity-60 mr-1">{stage.num}</span> {stage.name}
                </button>
              ))}
            </div>

            {/* Active Stage Content Card */}
            <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-border-muted space-y-4 transition-all duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-muted pb-4">
                <h3 className="text-lg font-bold text-text-primary">{activeStageObj.title}</h3>
                <span className="px-3 py-1 rounded bg-surface-dim border border-border-muted font-mono text-xs text-primary">
                  {activeStageObj.filepath}
                </span>
              </div>

              <p className="text-xs text-text-muted leading-relaxed font-sans">{activeStageObj.desc}</p>

              <div className="p-4 rounded-xl bg-surface-dim border border-border-muted font-mono text-xs space-y-2">
                <div className="text-text-muted text-[10px] uppercase">Payload Sample:</div>
                <div className="text-text-primary font-bold">{activeStageObj.payload}</div>
                <div className="text-emerald-400 text-[11px] pt-1">
                  <span className="text-text-muted">SHA-256 Digest:</span> {activeStageObj.digest}
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
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-primary transition-colors">API Status</a>
            <a href="#" className="hover:text-primary transition-colors">Contact Support</a>
          </div>
          <div>© 2026 Log AI Security Engine. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
