import React, { useEffect, useState } from 'react';
import { SpotlightCard } from '../motion-primitives';
import { StripeCtaButton, StripeSectionHeader, StructuralGridSpine } from './LusionMotionEngine';
import { useTheme } from '../../contexts/ThemeContext';

const LIVE_CLASSIFIER_SAMPLES = [
  {
    id: 'sim-sqli',
    category: 'SQLi',
    raw: `192.168.1.104 - POST /api/v1/auth 401 "SELECT * FROM users WHERE '1'='1' --"`,
    ocsfJson: `{ "class": "HTTP Activity [4002]", "src_ip": "192.168.1.104", "attack": "SQL_INJECTION" }`,
    badge: '99.4% SQL_INJECTION | CRITICAL',
    level: 'CRITICAL',
    mitre: 'T1190 Exploit Public-Facing App',
  },
  {
    id: 'sim-ssh',
    category: 'Critical',
    raw: `sshd[21490]: Failed password for invalid user root from 185.220.101.5 port 52140 ssh2`,
    ocsfJson: `{ "class": "Authentication [3002]", "src_ip": "185.220.101.5", "attack": "SSH_BRUTE_FORCE" }`,
    badge: '98.7% SSH_BRUTE_FORCE | CRITICAL',
    level: 'CRITICAL',
    mitre: 'T1110.001 Password Guessing',
  },
  {
    id: 'sim-c2',
    category: 'SQLi',
    raw: `nginx[8841]: 45.33.32.156 - GET /login?id=1%20UNION%20SELECT%20password,2%20FROM%20admins`,
    ocsfJson: `{ "class": "HTTP Activity [4002]", "src_ip": "45.33.32.156", "attack": "UNION_SQL_INJECTION" }`,
    badge: '96.8% UNION_SQLI | HIGH',
    level: 'HIGH',
    mitre: 'T1190 SQLi Union Extraction',
  },
  {
    id: 'sim-ok',
    category: 'Normal',
    raw: `10.0.0.14 - GET /api/v1/healthz 200 1.4ms "kube-probe/1.30" TLSv1.3`,
    ocsfJson: `{ "class": "Network Activity [4001]", "src_ip": "10.0.0.14", "attack": "NORMAL_TRAFFIC" }`,
    badge: '98.9% NORMAL_TRAFFIC | INFO',
    level: 'LOW',
    mitre: 'Verified Internal Health Check',
  },
];

const GEO_NODES = [
  {
    id: 'node-de',
    city: 'Frankfurt, DE',
    ip: '185.220.101.5',
    coords: '50.1109° N, 8.6821° E',
    cx: 215,
    cy: 78,
    level: 'CRITICAL',
    vector: 'SMB Lateral Probe (Port 445)',
    events: 142,
  },
  {
    id: 'node-us',
    city: 'Ashburn, US',
    ip: '45.33.32.156',
    coords: '39.0438° N, 77.4874° W',
    cx: 108,
    cy: 108,
    level: 'MEDIUM',
    vector: 'TLS C2 Beacon Jitter',
    events: 64,
  },
  {
    id: 'node-sg',
    city: 'Singapore, SG',
    ip: '103.253.41.18',
    coords: '1.3521° N, 103.8198° E',
    cx: 356,
    cy: 144,
    level: 'HIGH',
    vector: 'SSH Credential Stuffing',
    events: 89,
  },
];

const EXPORT_FORMATS = {
  CSV: `timestamp,event_id,ocsf_class,src_ip,dst_ip,threat_level,confidence,sha256_seal\n2026-09-08T11:42:01Z,SOC-9941,4001,185.220.101.5,10.0.4.12,CRITICAL,0.994,c29d18b4fa8001a4e9b98a3e7\n2026-09-08T11:42:00Z,SOC-9942,4002,192.168.1.104,10.0.0.8,HIGH,0.988,8f3c49e28ba709320e1d9a41b`,
  JSON: `{\n  "schema": "OCSF_v1.1.0",\n  "export_latency_ms": 8.4,\n  "merkle_root": "0x9f84c29d18b4fa8001a4e9b98a3e7",\n  "records": [\n    { "id": "SOC-9941", "src": "185.220.101.5", "verdict": "SMB_LATERAL_PROBE", "severity": "CRITICAL" }\n  ]\n}`,
};

const STREAMED_AUDIT_ROWS = [
  {
    id: 'AUDIT-9948',
    ts: '11:42:04.912Z',
    summary: 'CSV/OCSF Batch #1,849 -> 142 events sealed & exported (8.2ms)',
    hash: 'sha256:9f84c29d...98a3e7',
  },
  {
    id: 'AUDIT-9949',
    ts: '11:42:06.104Z',
    summary: 'SIEM Webhook Dispatch -> Splunk HEC & Chronicle (6.7ms)',
    hash: 'sha256:3a71bc09...41e82c',
  },
  {
    id: 'AUDIT-9950',
    ts: '11:42:08.450Z',
    summary: 'Merkle Proof Verification -> 0 tampered leaves across 48,281 logs',
    hash: 'sha256:d4128fe1...77c109',
  },
];

/**
 * Stripe Asymmetrical 12-Column Bento Grid Architecture with Diagonal Section Dividers
 * and 4 Autonomous Live Micro-UIs inside 3D-Tilting Dual-Spotlight Cards.
 */
export function StripeBentoArchitecture({ is2D = false }) {
  const { theme } = useTheme();

  // Card 1 State: Live AI Log Stream & Classifier Simulator (1.8s cycle + Tokenizing shimmer + filter pills)
  const [activeClassifierIdx, setActiveClassifierIdx] = useState(0);
  const [classifierFilter, setClassifierFilter] = useState('All');
  const [isTokenizing, setIsTokenizing] = useState(false);

  // Card 2 State: Geo-IP Threat Radar Node Selection & Hover Tooltip
  const [selectedGeoNode, setSelectedGeoNode] = useState(GEO_NODES[0]);

  // Card 3 State: Interactive Noise Reduction & Confidence Threshold Slider
  const [noiseFilterPct, setNoiseFilterPct] = useState(94);

  // Card 4 State: SIEM Export Schema Tab, Celebratory Checkmark & Streamed Audit Preview Row
  const [exportTab, setExportTab] = useState('CSV');
  const [exportSimulated, setExportSimulated] = useState(false);
  const [auditRowIdx, setAuditRowIdx] = useState(0);

  const filteredClassifierSamples =
    classifierFilter === 'All'
      ? LIVE_CLASSIFIER_SAMPLES
      : LIVE_CLASSIFIER_SAMPLES.filter((item) => {
          if (classifierFilter === 'Critical') return item.level === 'CRITICAL';
          if (classifierFilter === 'SQLi') return item.category === 'SQLi';
          if (classifierFilter === 'Normal') return item.category === 'Normal';
          return true;
        });

  useEffect(() => {
    if (is2D) return undefined;
    let shimmerTimeout = null;
    const timer = setInterval(() => {
      setIsTokenizing(true);
      shimmerTimeout = setTimeout(() => {
        setActiveClassifierIdx((prev) => (prev + 1) % LIVE_CLASSIFIER_SAMPLES.length);
        setIsTokenizing(false);
      }, 360);
    }, 1800);
    return () => {
      clearInterval(timer);
      if (shimmerTimeout) clearTimeout(shimmerTimeout);
    };
  }, [is2D]);

  const currentSample =
    filteredClassifierSamples[activeClassifierIdx % Math.max(1, filteredClassifierSamples.length)] ||
    LIVE_CLASSIFIER_SAMPLES[0];

  const rawIngestEventsPerMin = 18400;
  const triagedIncidents = Math.max(
    6,
    Math.round(rawIngestEventsPerMin * ((100 - noiseFilterPct) / 100) * 0.04)
  );

  const handleSimulateExport = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(EXPORT_FORMATS[exportTab]).catch(() => {});
    }
    setExportSimulated(true);
    setAuditRowIdx((prev) => (prev + 1) % STREAMED_AUDIT_ROWS.length);
    setTimeout(() => setExportSimulated(false), 2400);
  };

  const getBadgeStyle = (level) => {
    if (level === 'CRITICAL') {
      return 'bg-[var(--color-severity-critical-bg)] text-[var(--color-severity-critical)] border-[var(--color-severity-critical-border)]';
    }
    if (level === 'HIGH') {
      return 'bg-[var(--color-severity-high-bg)] text-[var(--color-severity-high)] border-[var(--color-severity-high-border)]';
    }
    if (level === 'MEDIUM') {
      return 'bg-[var(--color-severity-medium-bg)] text-[var(--color-severity-medium)] border-[var(--color-severity-medium-border)]';
    }
    return 'bg-[var(--color-severity-low-bg)] text-[var(--color-severity-low)] border-[var(--color-severity-low-border)]';
  };

  const activeAuditRow = STREAMED_AUDIT_ROWS[auditRowIdx];

  return (
    <section
      id="bento-architecture"
      className="section-obsidian-contrast relative w-full py-24 md:py-28 border-b border-[rgba(245,158,11,0.14)] overflow-hidden"
    >
      {/* Stripe Angled Section Background Layer (transform: skewY(-3.5deg) while keeping interior content un-skewed) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-[-4%] top-10 bottom-10 -z-0 bg-surface-lowest/65 border-y border-[rgba(245,158,11,0.14)] shadow-[0_0_90px_var(--color-border-glow)]"
        style={{ transform: 'skewY(-3.5deg)', transformOrigin: 'center center' }}
      />

      {/* Structural 4-Column Vertical Grid Spine with crisp 1px solid rgba(245, 158, 11, 0.14) grid lines */}
      <StructuralGridSpine
        variant={theme === 'sage' ? 'light' : 'obsidian'}
        obsidian={theme !== 'sage'}
      />

      <div
        data-velocity-skew
        className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-8 flex flex-col gap-12 will-change-transform"
      >
        {/* Stripe-Style Section Header */}
        <StripeSectionHeader
          chapterNum="CHAPTER 02"
          eyebrow="MODULAR SOC TELEMETRY ARCHITECTURE"
          title="ASYMMETRICAL BENTO COMMAND & LIVE MICRO-ENGINES"
          accentWords={['BENTO', 'COMMAND', 'MICRO-ENGINES']}
          subtitle="Explore interactive telemetry micro-UIs engineered with Stripe's modular precision—streaming OCSF log classification, Geo-IP attack radar, noise reduction, and instant SIEM exports."
          disabled={is2D}
          metrics={[
            { label: 'NOISE REDUCTION', value: `${noiseFilterPct}%` },
            { label: 'EXPORT LATENCY', value: '< 12ms' },
          ]}
        />

        {/* Asymmetrical 12-Column Bento Grid (7 + 5 on Row 1, 5 + 7 on Row 2) */}
        <div className="grid grid-cols-12 gap-6 items-stretch">
          {/* =============================================================== */}
          {/* CARD 1 (Span 7): Live AI Log Stream & Classifier Simulator      */}
          {/* =============================================================== */}
          <div className="col-span-12 lg:col-span-7 flex">
            <SpotlightCard
              disableTilt={is2D}
              spotlightColor="var(--color-border-glow)"
              className="w-full p-6 sm:p-7 rounded-3xl bg-surface-lowest/95 border border-primary/35 shadow-2xl flex flex-col justify-between gap-5"
            >
              {/* Top 35% Copy & Interactive Category Filter Pills */}
              <div className="flex flex-col gap-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
                  <span className="text-primary font-bold uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                    01 // SIMULATED LOG STREAM &amp; CLASSIFIER DEMO
                  </span>

                  {/* Interactive Filter Segmented Control (All, Critical, SQLi, Normal) */}
                  <div className="soc-segmented">
                    {['All', 'Critical', 'SQLi', 'Normal'].map((pill) => (
                      <button
                        key={pill}
                        type="button"
                        data-filter-pill
                        data-active={classifierFilter === pill}
                        onClick={() => {
                          setClassifierFilter(pill);
                          setActiveClassifierIdx(0);
                        }}
                        className="soc-segmented-item text-[10px] !py-1 !px-2.5"
                      >
                        {pill}
                      </button>
                    ))}
                  </div>
                </div>
                <h3 className="font-display font-black text-xl sm:text-2xl text-text-primary tracking-tight">
                  Unstructured Syslog to Classified OCSF JSON
                </h3>
                <p className="font-sans text-xs sm:text-sm text-text-muted leading-relaxed">
                  Watch raw server log lines stream every 1.8s through a live tokenizing pass before morphing into structured OCSF v1.1 records.
                </p>
              </div>

              {/* Bottom 65% Interactive Self-Animating Micro-UI */}
              <div className="p-4 sm:p-5 rounded-2xl bg-surface-dim border border-border-muted flex flex-col justify-between gap-3.5 font-mono text-xs flex-1">
                {/* Selector Tabs for the 4 Live Samples */}
                <div className="flex flex-wrap items-center justify-between gap-1.5 pb-2.5 border-b border-border-muted">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {filteredClassifierSamples.map((sample, idx) => {
                      const isActive = sample.id === currentSample.id;
                      return (
                        <button
                          key={sample.id}
                          type="button"
                          data-filter-pill
                          onClick={() => {
                            setIsTokenizing(true);
                            setTimeout(() => {
                              setActiveClassifierIdx(idx);
                              setIsTokenizing(false);
                            }, 220);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                            isActive
                              ? 'bg-primary text-surface-dim border-primary'
                              : 'bg-surface border-border-muted text-text-muted hover:text-text-primary'
                          }`}
                        >
                          STREAM 0{idx + 1}
                        </button>
                      );
                    })}
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${
                      isTokenizing
                        ? 'bg-secondary/20 text-secondary border-secondary/40 animate-pulse'
                        : 'bg-[var(--color-status-info-bg)] text-[var(--color-status-info)] border-[var(--color-status-info-border)]'
                    }`}
                  >
                    {isTokenizing ? '⚡ TOKENIZING STREAM...' : '● CLASSIFIED IN 1.8ms'}
                  </span>
                </div>

                {/* Raw Unstructured Input Line */}
                <div className="p-3 rounded-xl bg-surface-lowest border border-border-muted space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-text-dim">
                    <span>RAW_SERVER_STREAM // INBOUND</span>
                    <span className="text-secondary font-bold">UTF-8 SYSLOG</span>
                  </div>
                  <p className="text-[11px] text-text-primary break-all leading-relaxed">
                    {currentSample.raw}
                  </p>
                </div>

                {/* Morphing Arrow & Classified Output */}
                <div
                  className={`p-3 rounded-xl bg-surface-lowest border transition-all duration-200 space-y-2 ${
                    isTokenizing
                      ? 'border-secondary/50 opacity-75 blur-[0.5px]'
                      : 'border-primary/35 opacity-100 blur-0'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[10px] text-primary font-bold">
                      {isTokenizing ? 'PARSING OCSF TOKENS...' : `OCSF_NORMALIZED // ${currentSample.mitre}`}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${getBadgeStyle(
                        currentSample.level
                      )}`}
                    >
                      {isTokenizing ? 'EVALUATING...' : currentSample.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-primary break-all">
                    {currentSample.ocsfJson}
                  </p>
                </div>
              </div>
            </SpotlightCard>
          </div>

          {/* =============================================================== */}
          {/* CARD 2 (Span 5): Geo-IP Threat Radar & Node Map                 */}
          {/* =============================================================== */}
          <div className="col-span-12 lg:col-span-5 flex">
            <SpotlightCard
              disableTilt={is2D}
              spotlightColor="color-mix(in srgb, var(--color-secondary) 22%, transparent)"
              className="w-full p-6 sm:p-7 rounded-3xl bg-surface-lowest/95 border border-secondary/35 shadow-2xl flex flex-col justify-between gap-5"
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="text-secondary font-bold uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                    02 // GEO-IP THREAT RADAR
                  </span>
                  <span className="text-[10px] text-text-dim">3 LIVE VECTORS</span>
                </div>
                <h3 className="font-display font-black text-xl sm:text-2xl text-text-primary tracking-tight">
                  Global Attack Arcs &amp; IP Telemetry
                </h3>
                <p className="font-sans text-xs sm:text-sm text-text-muted leading-relaxed">
                  Hover or select any origin node to inspect live Geo-IP coordinates and quadratic bezier attack trajectories.
                </p>
              </div>

              {/* Interactive Vector Radar Map Micro-UI (65% of card) */}
              <div className="p-4 rounded-2xl bg-surface-dim border border-border-muted flex flex-col justify-between gap-3 flex-1 font-mono text-xs">
                <div className="relative w-full h-44 rounded-xl bg-surface-lowest border border-border-muted overflow-hidden">
                  <svg
                    viewBox="0 0 440 200"
                    className="w-full h-full"
                    aria-label="Interactive Geo-IP Threat Radar Map"
                  >
                    {/* Subtle Lat/Long Grid */}
                    <g stroke="var(--color-border)" strokeWidth="0.6" strokeDasharray="3 3" opacity="0.55">
                      <line x1="0" y1="50" x2="440" y2="50" />
                      <line x1="0" y1="100" x2="440" y2="100" />
                      <line x1="0" y1="150" x2="440" y2="150" />
                      <line x1="110" y1="0" x2="110" y2="200" />
                      <line x1="220" y1="0" x2="220" y2="200" />
                      <line x1="330" y1="0" x2="330" y2="200" />
                    </g>

                    {/* Animated Quadratic Bezier Attack Arcs converging on SOC Hub (290, 118) */}
                    {GEO_NODES.map((node) => {
                      const isSel = node.id === selectedGeoNode.id;
                      const midX = (node.cx + 290) / 2;
                      const midY = Math.min(node.cy, 118) - 44;
                      return (
                        <g key={node.id}>
                          {/* Base subtle arc */}
                          <path
                            d={`M ${node.cx} ${node.cy} Q ${midX} ${midY} 290 118`}
                            fill="none"
                            stroke="var(--color-border)"
                            strokeWidth="1"
                            opacity="0.5"
                          />
                          {/* Animated glowing dash arc */}
                          <path
                            d={`M ${node.cx} ${node.cy} Q ${midX} ${midY} 290 118`}
                            fill="none"
                            stroke={isSel ? 'var(--color-primary)' : 'var(--color-secondary)'}
                            strokeWidth={isSel ? '2.4' : '1.5'}
                            strokeDasharray="6 5"
                            className="animate-flow-dash"
                            opacity={isSel ? '1' : '0.6'}
                          />
                          <circle
                            cx={node.cx}
                            cy={node.cy}
                            r={isSel ? '8' : '5.5'}
                            fill={isSel ? 'var(--color-primary)' : 'var(--color-secondary)'}
                            className="cursor-pointer transition-all"
                            onMouseEnter={() => setSelectedGeoNode(node)}
                            onClick={() => setSelectedGeoNode(node)}
                          />
                          <text
                            x={node.cx}
                            y={node.cy - 11}
                            textAnchor="middle"
                            fill="var(--color-text-main)"
                            fontSize="9"
                            fontWeight="bold"
                          >
                            {node.city}
                          </text>
                        </g>
                      );
                    })}

                    {/* Destination SOC Core Node */}
                    <circle
                      cx="290"
                      cy="118"
                      r="9"
                      fill="var(--color-tertiary)"
                      opacity="0.25"
                    />
                    <circle
                      cx="290"
                      cy="118"
                      r="4.5"
                      fill="var(--color-primary)"
                    />
                    <text
                      x="290"
                      y="136"
                      textAnchor="middle"
                      fill="var(--color-primary)"
                      fontSize="8.5"
                      fontWeight="bold"
                    >
                      LOG_AI SOC CORE
                    </text>
                  </svg>
                </div>

                {/* Node Selector Pills */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {GEO_NODES.map((node) => (
                    <button
                      key={node.id}
                      type="button"
                      data-filter-pill
                      onMouseEnter={() => setSelectedGeoNode(node)}
                      onClick={() => setSelectedGeoNode(node)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                        selectedGeoNode.id === node.id
                          ? 'bg-primary text-surface-dim border-primary'
                          : 'bg-surface border-border-muted text-text-muted hover:text-text-primary'
                      }`}
                    >
                      {node.ip}
                    </button>
                  ))}
                </div>

                {/* Selected Geo-IP Telemetry Details */}
                <div className="p-2.5 rounded-xl bg-surface-lowest border border-border-muted flex items-center justify-between gap-2 text-[11px]">
                  <div className="min-w-0">
                    <div className="font-bold text-text-primary truncate">
                      {selectedGeoNode.city} // {selectedGeoNode.coords}
                    </div>
                    <div className="text-[10px] text-secondary truncate">
                      {selectedGeoNode.vector} ({selectedGeoNode.events} events)
                    </div>
                  </div>
                  <StripeCtaButton
                    to="/threat-intel"
                    variant="secondary"
                    className="!px-3 !py-1.5 !text-[10px] shrink-0"
                  >
                    Threat Map
                  </StripeCtaButton>
                </div>
              </div>
            </SpotlightCard>
          </div>

          {/* =============================================================== */}
          {/* CARD 3 (Span 5): Zero-Latency Noise Reduction & Severity Triage */}
          {/* =============================================================== */}
          <div className="col-span-12 lg:col-span-5 flex">
            <SpotlightCard
              disableTilt={is2D}
              spotlightColor="color-mix(in srgb, var(--color-tertiary) 22%, transparent)"
              className="w-full p-6 sm:p-7 rounded-3xl bg-surface-lowest/95 border border-tertiary/35 shadow-2xl flex flex-col justify-between gap-5"
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="text-primary font-bold uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
                    03 // NOISE-TO-SIGNAL COMPRESSION
                  </span>
                  <span className="text-[10px] font-bold text-primary">
                    -{noiseFilterPct}% ALERT FATIGUE
                  </span>
                </div>
                <h3 className="font-display font-black text-xl sm:text-2xl text-text-primary tracking-tight">
                  Zero-Latency Severity Triage
                </h3>
                <p className="font-sans text-xs sm:text-sm text-text-muted leading-relaxed">
                  Drag the AI confidence threshold slider to filter chaotic log floods into correlated incident clusters.
                </p>
              </div>

              {/* Interactive Noise Filter Micro-UI (65% of card) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-surface-dim border border-border-muted flex flex-col justify-between gap-4 flex-1 font-mono text-xs">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="bento-noise-slider"
                      className="text-[11px] font-bold text-text-primary"
                    >
                      AI DEDUPLICATION THRESHOLD
                    </label>
                    <span className="text-lg font-extrabold text-primary">
                      {noiseFilterPct}% FILTERED
                    </span>
                  </div>
                  <input
                    id="bento-noise-slider"
                    type="range"
                    min="70"
                    max="99"
                    step="1"
                    value={noiseFilterPct}
                    onChange={(e) => setNoiseFilterPct(parseInt(e.target.value, 10))}
                    className="w-full cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-text-dim">
                    <span>70% (Verbose)</span>
                    <span>94% (Recommended SOC)</span>
                    <span>99% (Critical Only)</span>
                  </div>
                </div>

                {/* Before vs After Compression Comparison */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-surface-lowest border border-border-muted">
                    <span className="text-[10px] text-text-dim block">RAW LOG FLOOD</span>
                    <span className="text-base font-extrabold text-text-primary">
                      {rawIngestEventsPerMin.toLocaleString()}/min
                    </span>
                    <span className="text-[10px] text-secondary block">Unfiltered Syslog</span>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-lowest border border-primary/40 shadow-[0_0_16px_var(--color-border-glow)]">
                    <span className="text-[10px] text-primary font-bold block">
                      ACTIONABLE INCIDENTS
                    </span>
                    <span className="text-base font-extrabold text-primary">
                      {triagedIncidents} Clusters
                    </span>
                    <span className="text-[10px] text-tertiary font-bold block">
                      High-Priority Only
                    </span>
                  </div>
                </div>

                {/* Animated Sparkline Density Visualization */}
                <div className="h-16 w-full rounded-xl bg-surface-lowest border border-border-muted p-2.5 flex items-end gap-1.5">
                  {[92, 85, 96, 78, 88, 94, 82, 90, 76, 89, 95, 84].map((rawH, idx) => {
                    const filteredH = Math.max(
                      14,
                      Math.round(rawH * ((100 - noiseFilterPct) / 38))
                    );
                    return (
                      <div
                        key={idx}
                        className="flex-1 h-full flex flex-col justify-end gap-0.5"
                      >
                        <div
                          className="w-full rounded-t bg-primary transition-all duration-200"
                          style={{ height: `${Math.min(100, filteredH)}%` }}
                          title={`Triaged Cluster Density: ${filteredH}%`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </SpotlightCard>
          </div>

          {/* =============================================================== */}
          {/* CARD 4 (Span 7): Instant SIEM Integration & CSV/JSON Audit      */}
          {/* =============================================================== */}
          <div className="col-span-12 lg:col-span-7 flex">
            <SpotlightCard
              disableTilt={is2D}
              spotlightColor="var(--color-border-glow)"
              className="w-full p-6 sm:p-7 rounded-3xl bg-surface-lowest/95 border border-primary/35 shadow-2xl flex flex-col justify-between gap-5"
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="text-primary font-bold uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    04 // INSTANT SIEM INTEGRATION &amp; ONE-CLICK AUDIT EXPORT
                  </span>
                  <span className="px-2.5 py-0.5 rounded bg-[var(--color-status-info-bg)] text-[var(--color-status-info)] border border-[var(--color-status-info-border)] font-bold text-[10px]">
                    FASTAPI LATENCY: &lt; 12ms
                  </span>
                </div>
                <h3 className="font-display font-black text-xl sm:text-2xl text-text-primary tracking-tight">
                  Cryptographically Sealed CSV &amp; OCSF JSON Compliance Exports
                </h3>
                <p className="font-sans text-xs sm:text-sm text-text-muted leading-relaxed">
                  Simulate a one-click compliance export below or open the Forensic Ledger for full Merkle-verified audit trails.
                </p>
              </div>

              {/* Interactive Developer API & Export Micro-UI (65% of card) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-surface-dim border border-border-muted flex flex-col justify-between gap-3.5 flex-1 font-mono text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-border-muted">
                  <div className="flex items-center gap-1.5">
                    {['CSV', 'JSON'].map((fmt) => (
                      <button
                        key={fmt}
                        type="button"
                        data-filter-pill
                        onClick={() => setExportTab(fmt)}
                        className={`px-3 py-1 rounded-md text-[10px] font-bold border transition-all cursor-pointer ${
                          exportTab === fmt
                            ? 'bg-primary text-surface-dim border-primary'
                            : 'bg-surface border-border-muted text-text-muted hover:text-text-primary'
                        }`}
                      >
                        {fmt} EXPORT PREVIEW
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      data-magnetic
                      onClick={handleSimulateExport}
                      className={`px-3.5 py-1 rounded-md text-[10px] font-bold cursor-pointer border transition-all ${
                        exportSimulated
                          ? 'bg-primary text-surface-dim border-primary shadow-[0_0_14px_var(--color-border-glow)]'
                          : 'btn-secondary'
                      }`}
                    >
                      {exportSimulated ? '✓ AUDIT ROW STREAMED & COPIED' : 'SIMULATE AUDIT EXPORT'}
                    </button>
                  </div>
                </div>

                <pre className="p-3.5 rounded-xl bg-surface-lowest border border-border-muted text-[11px] text-primary overflow-x-auto whitespace-pre leading-relaxed">
                  {EXPORT_FORMATS[exportTab]}
                </pre>

                {/* Live Sliding Preview Row of Structured log_ai Audit Telemetry */}
                <div
                  key={activeAuditRow.id}
                  className="p-2.5 rounded-xl bg-surface-lowest border border-primary/35 flex flex-wrap items-center justify-between gap-2 text-[10px] animate-in fade-in slide-in-from-bottom-1 duration-200"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="px-2 py-0.5 rounded bg-primary/15 text-primary font-bold shrink-0">
                      ✓ {activeAuditRow.id}
                    </span>
                    <span className="text-text-primary font-bold truncate">
                      {activeAuditRow.summary}
                    </span>
                  </div>
                  <span className="text-tertiary font-bold shrink-0">
                    {activeAuditRow.hash}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-3 text-[10px] text-text-muted">
                    <span>
                      ENDPOINT: <strong className="text-primary">/api/v1/dashboard/export/csv</strong>
                    </span>
                    <span>•</span>
                    <span>
                      PROOF: <strong className="text-tertiary">SHA-256 MERKLE TREE</strong>
                    </span>
                  </div>

                  <StripeCtaButton
                    to="/forensics"
                    variant="primary"
                    className="!px-4 !py-2 !text-[10px]"
                    cursorLabel="AUDIT"
                  >
                    Open Forensic Ledger
                  </StripeCtaButton>
                </div>
              </div>
            </SpotlightCard>
          </div>
        </div>
      </div>
    </section>
  );
}
