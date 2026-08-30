import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, BarElement, Filler } from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { api } from '../services/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, BarElement, Filler);

export function ThreatIntelPage({ airGapped }) {
  const [stats, setStats] = useState(null);
  const [lookupIp, setLookupIp] = useState('192.168.1.100');
  const [geoResult, setGeoResult] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.getStats();
        if (res) setStats(res);
      } catch (err) {
        console.error('Error fetching threat intel stats:', err);
      }
    };
    fetchStats();
  }, []);

  const handleGeoLookup = async () => {
    if (!lookupIp.trim()) return;
    try {
      const res = await api.lookupGeoIp(lookupIp.trim());
      setGeoResult(res);
    } catch (err) {
      alert(`GeoIP Lookup Failed: ${err.message}`);
    }
  };

  // Chart 1: Velocity Line Chart
  const velocityData = {
    labels: ['14:00', '14:05', '14:10', '14:15', '14:20', '14:25'],
    datasets: [
      {
        label: 'Total Ingested Events',
        data: [120, 240, 480, 890, 1420, stats?.total_events_ingested || 1850],
        borderColor: '#a78bfa',
        backgroundColor: 'rgba(167, 139, 250, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'High Threat Alerts',
        data: [5, 12, 28, 45, 80, stats?.threat_level_counts?.HIGH || 110],
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // Chart 2: Severity Donut Chart
  const severityData = {
    labels: ['HIGH', 'MEDIUM', 'LOW'],
    datasets: [
      {
        data: [
          stats?.threat_level_counts?.HIGH || 5,
          stats?.threat_level_counts?.MEDIUM || 15,
          stats?.threat_level_counts?.LOW || 80,
        ],
        backgroundColor: ['#ef4444', '#f59e0b', '#10b981'],
        borderWidth: 0,
      },
    ],
  };

  // Chart 3: Vendor Breakdown Bar Chart
  const vendorLabels = Object.keys(stats?.vendor_parser_counts || { cisco_asa: 45, fortinet: 30, suricata: 25 });
  const vendorValues = Object.values(stats?.vendor_parser_counts || { cisco_asa: 45, fortinet: 30, suricata: 25 });

  const vendorData = {
    labels: vendorLabels,
    datasets: [
      {
        label: 'Events Ingested',
        data: vendorValues,
        backgroundColor: '#7bd0ff',
        borderRadius: 6,
      },
    ],
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-border-muted flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary border border-primary/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">public</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Global Threat Intelligence & Vector Analytics</h1>
            <p className="text-xs text-text-muted">Real-time geographic threat mapping and vendor parsing metrics</p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-dim border border-border-muted text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>{airGapped ? '100% OFFLINE VECTOR MAP' : 'LIVE OSM TILES'}</span>
        </div>
      </div>

      {/* Global Threat Vector Map Panel */}
      <div className="glass-panel p-6 rounded-2xl border border-border-muted space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-text-primary">Global Attack Origins</h2>
          <span className="text-xs text-text-muted font-mono">Offline SVG Vector Fallback Mode</span>
        </div>

        {/* Offline Vector Map Rendering */}
        <div className="w-full h-72 rounded-xl bg-surface-dim border border-border-muted flex items-center justify-center relative overflow-hidden">
          <svg className="w-full h-full opacity-40 text-primary" viewBox="0 0 1000 500">
            <path
              fill="currentColor"
              d="M150,150 Q200,100 250,150 T350,150 M450,200 Q550,150 650,250 M750,180 Q850,120 900,220"
              stroke="currentColor"
              strokeWidth="2"
            />
            {/* Pulsing Attack Nodes */}
            <circle cx="250" cy="150" r="6" className="fill-rose-500 animate-ping" />
            <circle cx="250" cy="150" r="4" className="fill-rose-500" />

            <circle cx="650" cy="250" r="6" className="fill-amber-500 animate-ping" />
            <circle cx="650" cy="250" r="4" className="fill-amber-500" />

            <circle cx="750" cy="180" r="6" className="fill-rose-500 animate-ping" />
            <circle cx="750" cy="180" r="4" className="fill-rose-500" />
          </svg>
          <div className="absolute bottom-4 left-4 p-3 rounded-lg bg-surface/90 backdrop-blur-sm border border-border-muted text-xs font-mono space-y-1">
            <div className="font-bold text-text-primary">Active Threat Vectors:</div>
            <div className="text-rose-400">● 192.168.1.100 &rarr; Password Spray Spray (Score 90.0)</div>
            <div className="text-amber-400">● 192.168.1.105 &rarr; UTM Virus Signature</div>
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Velocity Chart */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-border-muted space-y-3">
          <h3 className="text-sm font-bold text-text-primary font-mono">Ingestion Throughput Velocity</h3>
          <div className="h-64">
            <Line data={velocityData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>

        {/* Severity Donut */}
        <div className="glass-panel p-5 rounded-2xl border border-border-muted space-y-3">
          <h3 className="text-sm font-bold text-text-primary font-mono">Severity Rating Distribution</h3>
          <div className="h-64 flex items-center justify-center">
            <Doughnut data={severityData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
      </div>

      {/* Vendor Breakdown Bar & GeoIP Tool */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vendor Breakdown */}
        <div className="glass-panel p-5 rounded-2xl border border-border-muted space-y-3">
          <h3 className="text-sm font-bold text-text-primary font-mono">Multi-Vendor Log Parsing Breakdown</h3>
          <div className="h-60">
            <Bar data={vendorData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>

        {/* Offline GeoIP Tool */}
        <div className="glass-panel p-5 rounded-2xl border border-border-muted space-y-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">location_on</span>
            <h3 className="text-sm font-bold text-text-primary font-mono">Sovereign Offline GeoIP Resolver</h3>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={lookupIp}
              onChange={(e) => setLookupIp(e.target.value)}
              placeholder="Enter IP address (e.g. 192.168.1.100)..."
              className="flex-1 input-cyber px-3 py-2 text-xs font-mono rounded-lg bg-surface-dim border-border-muted"
            />
            <button
              onClick={handleGeoLookup}
              className="btn-primary px-4 py-2 rounded-lg text-xs font-bold"
            >
              Lookup
            </button>
          </div>

          {geoResult && (
            <div className="p-3 rounded-xl bg-surface-dim border border-border-muted font-mono text-xs space-y-1">
              <div className="text-text-primary font-bold">IP: {geoResult.ip}</div>
              <div className="text-text-muted">Location: {geoResult.city || 'Internal SOC Subnet'}, {geoResult.country || 'Sovereign Network'}</div>
              <div className="text-primary text-[11px]">Coordinates: Lat {geoResult.lat}, Lng {geoResult.lng}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
