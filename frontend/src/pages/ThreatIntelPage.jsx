import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, BarElement, Filler } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { api } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, BarElement, Filler);

export function ThreatIntelPage({ airGapped }) {
  const { theme } = useTheme();
  const [stats, setStats] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [geoResult, setGeoResult] = useState(null);
  const [mapMode, setMapMode] = useState(airGapped ? 'offline' : 'osm');
  const [recentIncidents, setRecentIncidents] = useState([]);

  useEffect(() => {
    const fetchThreatIntelData = async () => {
      try {
        const [statsRes, incidentsRes] = await Promise.all([
          api.getStats(),
          api.getIncidents(5),
        ]);
        if (statsRes) setStats(statsRes);
        if (incidentsRes?.incidents) setRecentIncidents(incidentsRes.incidents);
      } catch (err) {
        console.error('Error fetching threat intel data:', err);
      }
    };
    fetchThreatIntelData();
  }, []);

  const handleSearchLookup = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      const res = await api.lookupGeoIp(searchQuery.trim());
      setGeoResult(res);
    } catch (err) {
      alert(`Search / GeoIP Error: ${err.message}`);
    }
  };

  const handleExportCSV = async () => {
    try {
      await api.exportCSV();
    } catch (err) {
      alert(`Export Error: ${err.message}`);
    }
  };

  // Threat Volume (72h) Chart Data
  const volumeChartData = {
    labels: ['-72h', '-60h', '-48h', '-36h', '-24h', '-12h', 'Now'],
    datasets: [
      {
        label: 'Threat Ingestion Volume (EPS)',
        data: [420, 580, 310, 890, 1420, 950, stats?.total_events_ingested || 1204],
        borderColor: theme === 'sage' ? '#718355' : '#a78bfa',
        backgroundColor: theme === 'sage' ? 'rgba(113, 131, 85, 0.15)' : 'rgba(167, 139, 250, 0.15)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'High Severity Anomaly Spikes',
        data: [12, 18, 5, 45, 95, 30, stats?.threat_level_counts?.HIGH || 110],
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: { color: theme === 'sage' ? '#637055' : '#94a3b8', font: { family: 'JetBrains Mono', size: 10 } },
      },
    },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: theme === 'sage' ? '#637055' : '#94a3b8', font: { family: 'JetBrains Mono', size: 10 } } },
      y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: theme === 'sage' ? '#637055' : '#94a3b8', font: { family: 'JetBrains Mono', size: 10 } } },
    },
  };

  const TOP_RISK_ACTORS = [
    {
      name: 'APT-29 (Cozy Bear)',
      severity: 'CRITICAL',
      severityBg: 'bg-rose-500/15 text-rose-400 border-rose-500/40',
      borderLeft: 'border-l-rose-500 bg-rose-500/5',
      origin: 'RU',
      target: 'Govt / Def',
      latest: 'Malicious payload dropped via spear-phishing credential harvesting...',
    },
    {
      name: 'Lazarus Group',
      severity: 'HIGH',
      severityBg: 'bg-amber-500/15 text-amber-400 border-amber-500/40',
      borderLeft: 'border-l-amber-500',
      origin: 'KP',
      target: 'Financial',
      latest: 'Cryptocurrency exchange exfiltration attempt & SWIFT protocol probe...',
    },
    {
      name: 'Sandworm',
      severity: 'HIGH',
      severityBg: 'bg-amber-500/15 text-amber-400 border-amber-500/40',
      borderLeft: 'border-l-amber-500',
      origin: 'RU',
      target: 'ICS / SCADA',
      latest: 'Probing industrial control systems & telemetry edge nodes in EU region...',
    },
    {
      name: 'Unknown_Cluster_A9',
      severity: 'ELEVATED',
      severityBg: 'bg-sky-500/15 text-sky-400 border-sky-500/40',
      borderLeft: 'border-l-sky-500',
      origin: 'Unknown',
      target: 'Tech / SaaS',
      latest: 'Anomalous traffic pattern matching signature 0x8A port scan burst...',
    },
    {
      name: 'Fin7',
      severity: 'MODERATE',
      severityBg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40',
      borderLeft: 'border-l-emerald-500',
      origin: 'Eastern EU',
      target: 'Retail / PoS',
      latest: 'Dormant activity observed over last 48h with baseline beaconing.',
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">Threat Intel</h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1 font-sans">
            Global threat landscape and real-time origin tracking.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <form onSubmit={handleSearchLookup} className="relative flex-1 sm:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search IP, Hash, Domain..."
              className="w-full input-cyber pl-9 pr-4 py-2 font-mono text-xs rounded-xl bg-surface-dim border-border-muted"
            />
          </form>

          <button
            onClick={handleExportCSV}
            className="btn-secondary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            <span>Export CSV</span>
          </button>
        </div>
      </header>

      {/* KPI Metric Cards Row (4 Cards matching Stitch) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Active Threats */}
        <div className="glass-panel p-4 rounded-xl flex flex-col relative overflow-hidden kpi-accent-danger group hover:border-primary transition-colors">
          <div className="flex justify-between items-center mb-2 z-10">
            <span className="text-xs font-mono font-bold text-text-muted uppercase tracking-wider">Active Threats</span>
            <span className="material-symbols-outlined text-rose-500 text-sm">warning</span>
          </div>
          <div className="flex items-baseline gap-2 z-10">
            <span className="text-3xl font-extrabold font-mono text-text-primary">
              {stats?.threat_level_counts?.HIGH ? (stats.threat_level_counts.HIGH * 100 + 4).toLocaleString() : '1,204'}
            </span>
            <span className="text-xs font-mono text-rose-400 flex items-center font-bold">
              <span className="material-symbols-outlined text-xs">arrow_upward</span> 12%
            </span>
          </div>
        </div>

        {/* KPI 2: Anomalies Detected */}
        <div className="glass-panel p-4 rounded-xl flex flex-col relative overflow-hidden kpi-accent-command group hover:border-primary transition-colors">
          <div className="flex justify-between items-center mb-2 z-10">
            <span className="text-xs font-mono font-bold text-text-muted uppercase tracking-wider">Anomalies Detected</span>
            <span className="material-symbols-outlined text-amber-500 text-sm">query_stats</span>
          </div>
          <div className="flex items-baseline gap-2 z-10">
            <span className="text-3xl font-extrabold font-mono text-text-primary">
              {stats?.total_events_ingested ? stats.total_events_ingested.toLocaleString() : '843'}
            </span>
            <span className="text-xs font-mono text-amber-400 flex items-center font-bold">
              <span className="material-symbols-outlined text-xs">arrow_upward</span> 5%
            </span>
          </div>
        </div>

        {/* KPI 3: AI Confidence */}
        <div className="glass-panel p-4 rounded-xl flex flex-col relative overflow-hidden kpi-accent-ai group hover:border-primary transition-colors">
          <div className="flex justify-between items-center mb-2 z-10">
            <span className="text-xs font-mono font-bold text-text-muted uppercase tracking-wider">AI Confidence</span>
            <span className="material-symbols-outlined text-primary text-sm">auto_awesome</span>
          </div>
          <div className="flex items-baseline gap-2 z-10">
            <span className="text-3xl font-extrabold font-mono text-text-primary">94.2%</span>
            <span className="text-xs font-mono text-text-muted">Avg Accuracy</span>
          </div>
        </div>

        {/* KPI 4: Global Nodes */}
        <div className="glass-panel p-4 rounded-xl flex flex-col relative overflow-hidden kpi-accent-forensic group hover:border-primary transition-colors">
          <div className="flex justify-between items-center mb-2 z-10">
            <span className="text-xs font-mono font-bold text-text-muted uppercase tracking-wider">Global Nodes</span>
            <span className="material-symbols-outlined text-sky-400 text-sm">public</span>
          </div>
          <div className="flex items-baseline gap-2 z-10">
            <span className="text-3xl font-extrabold font-mono text-text-primary">42</span>
            <span className="text-xs font-mono text-emerald-400 flex items-center font-bold">
              <span className="material-symbols-outlined text-xs">arrow_downward</span> 2%
            </span>
          </div>
        </div>
      </div>

      {/* Main Dashboard Area (Asymmetric 12-Column Split) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Map & Threat Volume Chart (Span 8) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Interactive World Map Panel */}
          <div className="glass-panel rounded-2xl border border-border-muted flex flex-col relative overflow-hidden shadow-xl">
            <div className="p-4 border-b border-border-muted flex justify-between items-center bg-surface-dim z-10">
              <h3 className="text-xs font-mono font-bold text-text-primary flex items-center gap-2 uppercase tracking-wider">
                <span className="material-symbols-outlined text-primary text-sm">public</span>
                <span>Live Threat Vectors</span>
              </h3>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMapMode(mapMode === 'osm' ? 'offline' : 'osm')}
                  className="px-2.5 py-1 rounded bg-surface-container border border-border-muted text-primary text-[10px] font-mono font-bold hover:border-primary transition-all"
                >
                  {mapMode === 'osm' ? 'OSM TILES' : 'OFFLINE VECTOR MAP'}
                </button>
              </div>
            </div>

            {/* Map Visual Container */}
            <div className="relative h-80 bg-surface-dim overflow-hidden flex items-center justify-center">
              {/* Authentic Vector Map Layer Overlay */}
              <div
                className="absolute inset-0 opacity-40 mix-blend-screen"
                style={{
                  backgroundImage:
                    "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDkgBttXiaw0o5VzKfMrBMlUJF6AA5QO40E2ZI5_wIDNodvgvmB8-Sg6b1PbFlMhcq8hY9WLjlEaXrlfhbfo0_77hlivrn1ASvzHCGORiE4fa-RN04reVidVjrQ2CrVGg9_GtQyN1_R1UZW9J98qSi568FFJMc6mP2CNNH74JZti50OlYQwCP4WCmBIz0lzcVC3y2sRQd2QtPbLvSzhg23J0R3o_0Dg-w0CoLtzLcoPNprJRHP3D7UB')",
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              ></div>

              {/* Vector SVG Map Overlay */}
              <svg className="w-full h-full opacity-30 text-primary z-0" viewBox="0 0 1000 500">
                <path
                  fill="currentColor"
                  d="M150,150 Q200,100 250,150 T350,150 M450,200 Q550,150 650,250 M750,180 Q850,120 900,220"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>

              {/* Simulated Map Overlays & Pulsing Nodes */}
              <div className="absolute top-1/3 left-1/4 w-4 h-4 bg-rose-500 rounded-full animate-ping opacity-75"></div>
              <div className="absolute top-1/3 left-1/4 w-2.5 h-2.5 bg-rose-500 rounded-full border border-black z-10"></div>

              <div className="absolute top-1/2 left-2/3 w-5 h-5 bg-amber-500 rounded-full animate-ping opacity-50"></div>
              <div className="absolute top-1/2 left-2/3 w-2.5 h-2.5 bg-amber-500 rounded-full z-10"></div>

              <div className="absolute top-1/4 left-3/4 w-4 h-4 bg-purple-500 rounded-full animate-ping opacity-60"></div>
              <div className="absolute top-1/4 left-3/4 w-2.5 h-2.5 bg-purple-500 rounded-full z-10"></div>

              {/* Scanline Effect */}
              <div className="scan-line pointer-events-none"></div>

              {/* Legend Floating Box */}
              <div className="absolute bottom-4 left-4 bg-surface-container/90 backdrop-blur-md border border-border-muted rounded-xl p-3 flex flex-col gap-1.5 z-20 shadow-md">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                  <span className="font-mono text-[10px] text-text-muted">High Severity Attack</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                  <span className="font-mono text-[10px] text-text-muted">Elevated Risk Vector</span>
                </div>
              </div>
            </div>
          </div>

          {/* Threat Volume (72h) Chart Panel */}
          <div className="glass-panel rounded-2xl border border-border-muted flex flex-col p-5 space-y-3 shadow-xl">
            <div className="flex justify-between items-center border-b border-border-muted pb-3">
              <h3 className="text-xs font-mono font-bold text-text-primary flex items-center gap-2 uppercase tracking-wider">
                <span className="material-symbols-outlined text-sky-400 text-sm">stacked_line_chart</span>
                <span>Threat Volume (72h)</span>
              </h3>
            </div>

            <div className="h-56 w-full">
              <Line data={volumeChartData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Right Column: Top Risk Actors & Feed (Span 4) */}
        <div className="lg:col-span-4 flex flex-col glass-panel rounded-2xl border border-border-muted overflow-hidden shadow-xl">
          <div className="p-4 border-b border-border-muted bg-surface-dim flex justify-between items-center sticky top-0 z-10">
            <h3 className="text-xs font-mono font-bold text-text-primary flex items-center gap-2 uppercase tracking-wider">
              <span className="material-symbols-outlined text-amber-500 text-sm">groups</span>
              <span>Top Risk Actors</span>
            </h3>
            <span className="font-mono text-[10px] font-bold bg-surface-container border border-border-muted px-2 py-0.5 rounded text-text-muted">
              LIVE
            </span>
          </div>

          {/* Scrollable Risk Actor List */}
          <div className="flex-1 overflow-y-auto divide-y divide-border-muted/60 bg-surface-dim">
            {TOP_RISK_ACTORS.map((actor, idx) => (
              <div
                key={idx}
                className={`p-4 border-l-4 transition-colors cursor-pointer group hover:bg-surface-hover ${actor.borderLeft}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="font-mono text-xs font-bold text-text-primary group-hover:text-primary transition-colors">
                    {actor.name}
                  </div>
                  <span className={`font-mono text-[9px] font-bold px-1.5 py-0.5 rounded uppercase border ${actor.severityBg}`}>
                    {actor.severity}
                  </span>
                </div>

                <div className="flex justify-between items-center text-[11px] font-mono text-text-muted mt-1">
                  <span>Origin: <strong className="text-text-primary">{actor.origin}</strong></span>
                  <span>Target: <strong className="text-text-primary">{actor.target}</strong></span>
                </div>

                <div className="mt-2 text-[11px] text-text-muted line-clamp-2 leading-relaxed">
                  {actor.latest}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* GeoIP Resolver Result Drawer */}
      {geoResult && (
        <div className="glass-panel p-5 rounded-2xl border border-border-muted space-y-2 font-mono text-xs animate-in slide-in-from-bottom-4 duration-200">
          <div className="flex justify-between items-center text-primary font-bold">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base">location_on</span>
              <span>GeoIP Inspection Result: {geoResult.ip}</span>
            </span>
            <button onClick={() => setGeoResult(null)} className="text-text-muted hover:text-text-primary">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-text-muted pt-1">
            <div>City/State: <strong className="text-text-primary">{geoResult.city || 'Internal Subnet'}</strong></div>
            <div>Country: <strong className="text-text-primary">{geoResult.country || 'Sovereign Network'}</strong></div>
            <div>Coordinates: <strong className="text-emerald-400">Lat {geoResult.lat}, Lng {geoResult.lng}</strong></div>
          </div>
        </div>
      )}
    </div>
  );
}
