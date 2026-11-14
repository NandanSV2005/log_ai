import React, { useEffect, useState } from 'react';
import { SpotlightCard } from '../motion-primitives';
import { StripeCtaButton, StripeSectionHeader, StructuralGridSpine } from './LusionMotionEngine';
import { useTheme } from '../../contexts/ThemeContext';

const LIVE_CLASSIFIER_SAMPLES = [
  {
    id: 'sim-sqli',
    raw: `192.168.1.104 - POST /api/v1/auth 401 "SELECT * FROM users WHERE '1'='1' --"`,
    ocsfJson: `{ "class": "HTTP Activity [4002]", "src_ip": "192.168.1.104", "attack": "SQL_INJECTION" }`,
    badge: '99.4% SQL_INJECTION | CRITICAL',
    level: 'CRITICAL',
    mitre: 'T1190 Exploit Public-Facing App',
  },
  {
    id: 'sim-ssh',
    raw: `sshd[21490]: Failed password for invalid user root from 185.220.101.5 port 52140 ssh2`,
    ocsfJson: `{ "class": "Authentication [3002]", "src_ip": "185.220.101.5", "attack": "SSH_BRUTE_FORCE" }`,
    badge: '98.7% SSH_BRUTE_FORCE | HIGH',
    level: 'HIGH',
    mitre: 'T1110.001 Password Guessing',
  },
  {
    id: 'sim-c2',
    raw: `Suricata[3819]: [1:2018959:4] ET C2 Beaconing Jitter 45.33.32.156:443 -> 10.0.0.5:51234`,
    ocsfJson: `{ "class": "Security Finding [2001]", "src_ip": "45.33.32.156", "attack": "C2_EGRESS_JITTER" }`,
    badge: '94.2% C2_EGRESS_JITTER | MEDIUM',
    level: 'MEDIUM',
    mitre: 'T1071 Application Layer Protocol',
  },
  {
    id: 'sim-ok',
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
    cy: 82,
    level: 'CRITICAL',
    vector: 'SMB Lateral Probe (Port 445)',
    events: 142,
  },
  {
    id: 'node-us',
    city: 'Ashburn, US',
    ip: '45.33.32.156',
    coords: '39.0438° N, 77.4874° W',
    cx: 112,
    cy: 108,
    level: 'MEDIUM',
    vector: 'TLS C2 Beacon Anomaly',
    events: 64,
  },
  {
    id: 'node-sg',
    city: 'Singapore, SG',
    ip: '103.27.124.88',
    coords: '1.3521° N, 103.8198° E',
    cx: 318,
    cy: 152,
    level: 'HIGH',
    vector: 'SSH Credential Stuffing',
    events: 89,
  },
];

const EXPORT_FORMATS = {
  CSV: `timestamp,ocsf_class,source_ip,destination_ip,threat_level,threat_score,sha256_seal
2026-11-14T14:22:09Z,Network Activity,185.220.101.5,10.0.4.12,CRITICAL,94.2,c29d18b4fa8001a4e9b9
2026-11-14T14:22:10Z,HTTP Activity,192.168.1.104,10.0.0.8,HIGH,86.5,3a11d084c912b4fa8001
2026-11-14T14:22:11Z,Security Finding,45.33.32.156,10.0.0.5,MEDIUM,62.0,7d92e8b012c29d18b4fa`,
  JSON: `{
  "endpoint": "GET /api/v1/dashboard/export/csv",
  "latency_ms": 8.4,
  "merkle_root_verified": true,
  "records_exported": 3,
  "sample": {
    "source_ip": "185.220.101.5",
    "threat_level": "CRITICAL",
    "confidence": 0.994,
    "mitre_tactic": "T1021.002"
  }
}`,
};

export function StripeBentoArchitecture({ is2D = false }) {
  const { theme } = useTheme();
  const [activeLogIndex, setActiveLogIndex] = useState(0);
  const [isAutoCycling, setIsAutoCycling] = useState(true);
  const [selectedGeoNode, setSelectedGeoNode] = useState(GEO_NODES[0]);
  const [noiseFilterPct, setNoiseFilterPct] = useState(94);
  const [exportTab, setExportTab] = useState('CSV');
  const [exportCopied, setExportCopied] = useState(false);

  // Self-animating ticker for Card 1 (Live AI Log Stream & Classifier Simulator)
  useEffect(() => {
    if (!isAutoCycling || is2D) return undefined;
    const timer = setInterval(() => {
      setActiveLogIndex((prev) => (prev + 1) % LIVE_CLASSIFIER_SAMPLES.length);
    }, 2800);
    return () => clearInterval(timer);
  }, [isAutoCycling, is2D]);

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
    return 'bg-[var(--color-status-info-bg)] text-[var(--color-status-info)] border-[var(--color-status-info-border)]';
  };

  const rawFloodCount = 12400;
  const triagedIncidentCount = Math.max(
    18,
    Math.round(rawFloodCount * ((100 - noiseFilterPct) / 100) * 0.12)
  );

  const handleCopyPreview = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(EXPORT_FORMATS[exportTab]).catch(() => {});
    }
    setExportCopied(true);
    setTimeout(() => setExportCopied(false), 1800);
  };

  return (
    <section
      id="bento-architecture"
      className="relative w-full py-24 md:py-32 overflow-hidden border-b border-border-muted"
    >
      {/* Stripe Signature Angled Section Background Layer (skewY(-4deg) while keeping content un-skewed) */}
      <div
        className="pointer-events-none absolute inset-0 -my-12 bg-gradient-to-b from-[var(--color-chapter3-from)] via-[var(--color-chapter3-via)] to-[var(--color-chapter3-to)] border-y border-primary/25 origin-center"
        style={{ transform: 'skewY(-4deg)' }}
        aria-hidden="true"
      />

      {/* Structural 4-Column Vertical Grid Spine */}
      <StructuralGridSpine variant={theme === 'sage' ? 'light' : 'dark'} />

      <div
        data-velocity-skew
        className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-8 flex flex-col gap-12 will-change-transform"
      >
        {/* Stripe-Style Section Header */}
        <StripeSectionHeader
          chapterNum="CHAPTER 03"
          eyebrow="MODULAR SOC TELEMETRY ARCHITECTURE"
          title="ASYMMETRICAL BENTO COMMAND MATRIX & LIVE MICRO-UIS"
          accentWords={['BENTO', 'COMMAND', 'MATRIX', 'MICRO-UIS']}
          subtitle="Interact directly with our four core SOC engines below: real-time log-to-JSON semantic classification, Geo-IP attack vector mapping, 94% noise suppression, and sub-12ms SIEM audit exports."
          disabled={is2D}
          metrics={[
            { label: 'API ENDPOINT LATENCY', value: '< 12ms' },
            { label: 'NOISE SUPPRESSION', value: `${noiseFilterPct}.0%` },
          ]}
        />

        {/* Asymmetrical 12-Column Bento Grid (Span 7 + Span 5, then Span 5 + Span 7) */}
        <div className="grid grid-cols-12 gap-6 lg:gap-7 items-stretch">
          {/* =============================================================== */}
          {/* CARD 1 (Span 7): Live AI Log Stream & Classifier Simulator      */}
          {/* =============================================================== */}
          <div className="col-span-12 lg:col-span-7 flex">
            <SpotlightCard
              spotlightColor="var(--color-border-glow)"
              className="w-full p-6 sm:p-7 rounded-3xl bg-surface-lowest/95 border border-primary/35 shadow-2xl flex flex-col justify-between gap-6"
            >
              {/* Card Header (35% narrative) */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="text-primary font-bold uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    01 // LIVE AI LOG STREAM &amp; CLASSIFIER SIMULATOR
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAutoCycling(!isAutoCycling)}
                    className="px-2.5 py-1 rounded-md bg-surface border border-border-muted text-[10px] font-mono font-bold text-text-muted hover:text-primary hover:border-primary/40 cursor-pointer"
                  >
                    {isAutoCycling ? 'PAUSE STREAM' : 'RESUME STREAM'}
                  </button>
                </div>
                <h3 className="font-display font-black text-xl sm:text-2xl text-text-primary tracking-tight">
                  Unstructured Server Logs &rarr; Structured OCSF JSON Badges
                </h3>
                <p className="font-sans text-xs sm:text-sm text-text-muted leading-relaxed">
                  Click any inbound log frame to inspect how raw Nginx, SSH, and Suricata strings dynamically morph into confidence-scored MITRE ATT&amp;CK verdicts.
                </p>
              </div>

              {/* Interactive Micro-UI (65% of card) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-surface-dim border border-border-muted flex flex-col justify-between gap-3.5 font-mono text-xs flex-1">
                <div className="flex items-center justify-between text-[10px] text-text-dim pb-2 border-b border-border-muted/70">
                  <span>LIVE_INGEST_STREAM // /api/v1/ingest</span>
                  <span className="text-primary font-bold">OCSF v1.1 PARSER ACTIVE</span>
                </div>

                {/* Streaming Log Lines Selector */}
                <div className="flex flex-col gap-2">
                  {LIVE_CLASSIFIER_SAMPLES.map((item, idx) => {
                    const isCurrent = idx === activeLogIndex;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setActiveLogIndex(idx);
                          setIsAutoCycling(false);
                        }}
                        className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 ${
                          isCurrent
                            ? 'bg-surface-lowest border-primary shadow-[0_0_20px_var(--color-border-glow)]'
                            : 'bg-surface/60 border-border-muted/70 opacity-75 hover:opacity-100 hover:border-primary/40'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <code className="text-[11px] text-text-primary truncate font-mono">
                            {item.raw}
                          </code>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 ${getBadgeStyle(
                              item.level
                            )}`}
                          >
                            {item.badge}
                          </span>
                        </div>

                        {isCurrent && (
                          <div className="pt-2 border-t border-border-muted/60 flex flex-wrap items-center justify-between gap-2 text-[10px] text-secondary">
                            <code className="text-primary truncate">{item.ocsfJson}</code>
                            <span className="text-tertiary font-bold">{item.mitre}</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </SpotlightCard>
          </div>

          {/* =============================================================== */}
          {/* CARD 2 (Span 5): Geo-IP Threat Radar & Node Map                 */}
          {/* =============================================================== */}
          <div className="col-span-12 lg:col-span-5 flex">
            <SpotlightCard
              spotlightColor="color-mix(in srgb, var(--color-secondary) 22%, transparent)"
              className="w-full p-6 sm:p-7 rounded-3xl bg-surface-lowest/95 border border-secondary/35 shadow-2xl flex flex-col justify-between gap-6"
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="text-secondary font-bold uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-secondary animate-ping" />
                    02 // GEO-IP THREAT RADAR &amp; NODE MAP
                  </span>
                  <span className="px-2 py-0.5 rounded bg-surface border border-border-muted text-[10px] font-mono text-primary font-bold">
                    3 ACTIVE ARCS
                  </span>
                </div>
                <h3 className="font-display font-black text-xl sm:text-2xl text-text-primary tracking-tight">
                  Sub-Millisecond Geo-IP Vector Telemetry
                </h3>
                <p className="font-sans text-xs sm:text-sm text-text-muted leading-relaxed">
                  Select an origin node on the vector radar to inspect live attacker ASN coordinates and bezier ingress trajectories.
                </p>
              </div>

              {/* Interactive Vector Globe / Bezier Attack Arcs Micro-UI (65% of card) */}
              <div className="p-4 rounded-2xl bg-surface-dim border border-border-muted flex flex-col justify-between gap-3 flex-1 font-mono text-xs">
                <div className="relative w-full h-48 rounded-xl bg-surface-lowest border border-border-muted/70 overflow-hidden flex items-center justify-center">
                  <svg
                    viewBox="0 0 420 210"
                    className="w-full h-full"
                    aria-label="Interactive Geo-IP Threat Vector Map"
                  >
                    {/* Subtle Latitude / Longitude Grid Lines */}
                    {[42, 84, 126, 168].map((y) => (
                      <line
                        key={`lat-${y}`}
                        x1="0"
                        y1={y}
                        x2="420"
                        y2={y}
                        stroke="var(--color-border)"
                        strokeDasharray="3 5"
                        strokeWidth="1"
                        opacity="0.45"
                      />
                    ))}
                    {[70, 140, 210, 280, 350].map((x) => (
                      <line
                        key={`lon-${x}`}
                        x1={x}
                        y1="0"
                        x2={x}
                        y2="210"
                        stroke="var(--color-border)"
                        strokeDasharray="3 5"
                        strokeWidth="1"
                        opacity="0.45"
                      />
                    ))}

                    {/* SOC Core Destination Hub (Center-Right) */}
                    <circle
                      cx="265"
                      cy="125"
                      r="14"
                      fill="none"
                      stroke="var(--color-primary)"
                      strokeWidth="1.5"
                      opacity="0.45"
                    />
                    <circle cx="265" cy="125" r="5" fill="var(--color-primary)" />
                    <text
                      x="265"
                      y="148"
                      textAnchor="middle"
                      fill="var(--color-primary)"
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      SOC CORE [10.0.4.12]
                    </text>

                    {/* Animated Bezier Attack Arcs from Threat Origins to SOC Core */}
                    {GEO_NODES.map((node) => {
                      const isSelected = selectedGeoNode.id === node.id;
                      const strokeCol =
                        node.level === 'CRITICAL'
                          ? 'var(--color-severity-critical)'
                          : node.level === 'HIGH'
                          ? 'var(--color-severity-high)'
                          : 'var(--color-severity-medium)';
                      const midX = (node.cx + 265) / 2;
                      const midY = Math.min(node.cy, 125) - 42;
                      const pathD = `M ${node.cx} ${node.cy} Q ${midX} ${midY} 265 125`;

                      return (
                        <g
                          key={node.id}
                          onClick={() => setSelectedGeoNode(node)}
                          className="cursor-pointer"
                        >
                          <path
                            d={pathD}
                            fill="none"
                            stroke={strokeCol}
                            strokeWidth={isSelected ? '2.5' : '1.5'}
                            strokeDasharray="6 4"
                            className="animate-dash-flow"
                            opacity={isSelected ? '1' : '0.55'}
                          />
                          <circle
                            cx={node.cx}
                            cy={node.cy}
                            r={isSelected ? '11' : '7'}
                            fill={strokeCol}
                            opacity="0.22"
                          />
                          <circle
                            cx={node.cx}
                            cy={node.cy}
                            r={isSelected ? '5.5' : '4'}
                            fill={strokeCol}
                          />
                          <text
                            x={node.cx}
                            y={node.cy - 10}
                            textAnchor="middle"
                            fill="var(--color-text-main)"
                            fontSize="9"
                            fontFamily="monospace"
                            fontWeight="bold"
                          >
                            {node.city}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* Selected Origin Node Telemetry Tooltip Strip */}
                <div className="p-3 rounded-xl bg-surface-lowest border border-border-muted flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary">
                      {selectedGeoNode.city} ({selectedGeoNode.ip})
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getBadgeStyle(
                        selectedGeoNode.level
                      )}`}
                    >
                      {selectedGeoNode.level} // {selectedGeoNode.events} EVTS
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-text-muted">
                    <span>{selectedGeoNode.vector}</span>
                    <span className="text-text-dim">{selectedGeoNode.coords}</span>
                  </div>
                </div>

                {/* Node Quick-Selector Pills */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-1.5">
                    {GEO_NODES.map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => setSelectedGeoNode(n)}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold border transition-all cursor-pointer ${
                          selectedGeoNode.id === n.id
                            ? 'bg-primary text-surface-dim border-primary'
                            : 'bg-surface border-border-muted text-text-muted hover:text-text-primary'
                        }`}
                      >
                        {n.city.split(',')[0]}
                      </button>
                    ))}
                  </div>
                  <StripeCtaButton
                    to="/threat-intel"
                    variant="secondary"
                    className="!px-3 !py-1 !text-[10px]"
                  >
                    Full Map
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
              spotlightColor="color-mix(in srgb, var(--color-tertiary) 20%, transparent)"
              className="w-full p-6 sm:p-7 rounded-3xl bg-surface-lowest/95 border border-tertiary/35 shadow-2xl flex flex-col justify-between gap-6"
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="text-tertiary font-bold uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
                    03 // ZERO-LATENCY NOISE REDUCTION &amp; TRIAGE
                  </span>
                  <span className="px-2 py-0.5 rounded bg-primary/15 border border-primary/30 text-primary font-bold text-[10px]">
                    -{noiseFilterPct}% FLOOD
                  </span>
                </div>
                <h3 className="font-display font-black text-xl sm:text-2xl text-text-primary tracking-tight">
                  Suppress Chaotic Log Floods into Actionable Clusters
                </h3>
                <p className="font-sans text-xs sm:text-sm text-text-muted leading-relaxed">
                  Drag the Isolation Forest suppression threshold slider to filter repetitive keepalives down into high-severity incident clusters.
                </p>
              </div>

              {/* Interactive Noise Suppression Slider & Sparkline Micro-UI (65% of card) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-surface-dim border border-border-muted flex flex-col justify-between gap-4 flex-1 font-mono text-xs">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="bento-noise-slider"
                      className="text-[11px] font-bold text-text-muted uppercase"
                    >
                      ISOLATION FOREST SUPPRESSION THRESHOLD
                    </label>
                    <span className="text-base font-extrabold text-primary">
                      {noiseFilterPct}% Filtered
                    </span>
                  </div>
                  <input
                    id="bento-noise-slider"
                    type="range"
                    min="60"
                    max="98"
                    step="1"
                    value={noiseFilterPct}
                    onChange={(e) => setNoiseFilterPct(Number(e.target.value))}
                    className="w-full h-2 bg-surface-lowest border border-primary/35 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>

                {/* Before vs After Sparkline Bars */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-surface-lowest border border-border-muted flex flex-col gap-1">
                    <span className="text-[10px] text-text-dim uppercase">RAW LOG FLOOD</span>
                    <span className="text-lg font-extrabold text-text-primary">
                      {rawFloodCount.toLocaleString()} / min
                    </span>
                    <span className="text-[10px] text-text-muted">Unfiltered Syslog/Auth</span>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-lowest border border-primary/40 flex flex-col gap-1">
                    <span className="text-[10px] text-primary uppercase font-bold">
                      TRIAGED INCIDENTS
                    </span>
                    <span className="text-lg font-extrabold text-primary">
                      {triagedIncidentCount} Clusters
                    </span>
                    <span className="text-[10px] text-tertiary font-bold">
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
                          style={{ height: `${ Math.min(100, filteredH)}%` }}
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
              spotlightColor="var(--color-border-glow)"
              className="w-full p-6 sm:p-7 rounded-3xl bg-surface-lowest/95 border border-primary/35 shadow-2xl flex flex-col justify-between gap-6"
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
                  Preview live FastAPI export schemas below or trigger a one-click compliance export directly from the SOC Command Center.
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
                      onClick={handleCopyPreview}
                      className="btn-secondary px-3 py-1 rounded-md text-[10px] font-bold cursor-pointer"
                    >
                      {exportCopied ? 'COPIED SCHEMA ✓' : 'COPY PAYLOAD'}
                    </button>
                  </div>
                </div>

                <pre className="p-3.5 rounded-xl bg-surface-lowest border border-border-muted text-[11px] text-primary overflow-x-auto whitespace-pre leading-relaxed">
                  {EXPORT_FORMATS[exportTab]}
                </pre>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-3 text-[10px] text-text-muted">
                    <span>ENDPOINT: <strong className="text-primary">/api/v1/dashboard/export/csv</strong></span>
                    <span>•</span>
                    <span>PROOF: <strong className="text-tertiary">SHA-256 MERKLE TREE</strong></span>
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
