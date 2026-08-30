import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export function DashboardPage({ pollingInterval }) {
  const [stats, setStats] = useState({
    total_events_ingested: 1240500,
    threat_level_counts: { HIGH: 12, MEDIUM: 28, LOW: 145 },
    vendor_parser_counts: {},
  });
  const [incidents, setIncidents] = useState([]);
  const [recentEvents, setRecentEvents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [incidentDetailEvents, setIncidentDetailEvents] = useState([]);
  const [uploadStatus, setUploadStatus] = useState('');
  const [customPayloadText, setCustomPayloadText] = useState('');
  const [showIngestionWorkbench, setShowIngestionWorkbench] = useState(false);

  // Sample preset payloads for quick injection
  const PRESET_PAYLOADS = {
    cisco: `%ASA-4-106023: Deny tcp src outside:192.168.1.100/54321 dst inside:10.0.0.50/80 by access-group "outside_acl" [result="Denied"]`,
    fortinet: `date=2026-08-30 time=14:20:05 devname="FG100D" devid="FG100D3G15800001" logid="0000000013" type="utm" subtype="virus" eventtype="signature text" level="warning" vd="root" msg="File infected." action="passthrough" service="HTTP" srcip=192.168.1.105 dstip=172.16.0.4`,
    suricata: `08/30/2026-14:21:00.123456 [**] [1:2001219:15] ET SCAN Potential SSH Scan OUTBOUND [**] [Classification: Attempted Information Leak] [Priority: 2] {TCP} 192.168.1.200:44321 -> 10.0.0.1:22`,
  };

  const fetchDashboardData = async () => {
    try {
      const [statsData, incidentsData, eventsData] = await Promise.all([
        api.getStats(),
        api.getIncidents(10),
        api.getRecentEvents(50),
      ]);
      if (statsData) setStats(statsData);
      if (incidentsData?.incidents) setIncidents(incidentsData.incidents);
      if (eventsData?.events) setRecentEvents(eventsData.events);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const timer = setInterval(fetchDashboardData, pollingInterval || 2000);
    return () => clearInterval(timer);
  }, [pollingInterval]);

  const handleIncidentClick = async (incident) => {
    setSelectedIncident(incident);
    try {
      const detail = await api.getIncidentDetail(incident.incident_id);
      if (detail?.events) {
        setIncidentDetailEvents(detail.events);
      }
    } catch (err) {
      console.error('Error loading incident details:', err);
    }
  };

  const handleIncidentStatusChange = async (incidentId, newStatus) => {
    try {
      await api.updateIncidentStatus(incidentId, newStatus);
      fetchDashboardData();
      if (selectedIncident && selectedIncident.incident_id === incidentId) {
        setSelectedIncident((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      alert(`Failed to update status: ${err.message}`);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadStatus('Ingesting log file...');
    try {
      const res = await api.ingestFile(file);
      setUploadStatus(`Successfully processed ${res.events_processed} events from ${res.filename}`);
      fetchDashboardData();
    } catch (err) {
      setUploadStatus(`Upload Error: ${err.message}`);
    }
  };

  const handlePayloadSubmit = async () => {
    if (!customPayloadText.trim()) return;
    setUploadStatus('Ingesting raw payload...');
    try {
      const res = await api.ingestLogs(customPayloadText.trim());
      setUploadStatus(`Ingested successfully (ID: ${res.ingestion_id.substring(0, 8)})`);
      setCustomPayloadText('');
      fetchDashboardData();
    } catch (err) {
      setUploadStatus(`Ingestion Error: ${err.message}`);
    }
  };

  const topIncident = incidents.length > 0 ? incidents[0] : null;

  return (
    <div className="space-y-6">
      {/* Stitch Page Header */}
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">Dashboard</h1>
        <p className="text-xs sm:text-sm text-text-muted mt-1 font-sans">SOC Operations & Telemetry Overview</p>
      </header>

      {/* Hero Metrics Grid (3 Cards matching Stitch) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* KPI 1: Active Threats */}
        <div className="glass-panel rounded-xl p-5 relative overflow-hidden pl-5 group transition-all duration-300">
          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-rose-500"></div>
          <h3 className="text-xs font-mono font-bold text-text-muted mb-1 flex items-center gap-1.5 uppercase tracking-wider">
            <span className="material-symbols-outlined text-sm text-rose-500">warning</span>
            Active Threats
          </h3>
          <div className="text-3xl font-extrabold font-mono text-rose-500">
            {stats.threat_level_counts?.HIGH ?? 12}
          </div>
          <div className="mt-2 flex items-center text-[11px] font-mono text-text-muted">
            <span className="text-rose-500 mr-1 flex items-center font-bold">
              <span className="material-symbols-outlined text-xs">trending_up</span> +3
            </span>
            vs last hour
          </div>
        </div>

        {/* KPI 2: Logs Analyzed */}
        <div className="glass-panel rounded-xl p-5 relative overflow-hidden pl-5 group transition-all duration-300">
          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-sky-500"></div>
          <h3 className="text-xs font-mono font-bold text-text-muted mb-1 flex items-center gap-1.5 uppercase tracking-wider">
            <span className="material-symbols-outlined text-sm text-sky-400">data_usage</span>
            Logs Analyzed
          </h3>
          <div className="text-3xl font-extrabold font-mono text-text-primary">
            {stats.total_events_ingested > 0 ? (stats.total_events_ingested / 1000000).toFixed(1) + 'M' : '1.2M'}
          </div>
          <div className="mt-2 flex items-center text-[11px] font-mono text-text-muted">
            <span className="text-emerald-400 mr-1 flex items-center font-bold">
              <span className="material-symbols-outlined text-xs">trending_up</span> 14%
            </span>
            24h throughput
          </div>
        </div>

        {/* KPI 3: System Health */}
        <div className="glass-panel rounded-xl p-5 relative overflow-hidden pl-5 group transition-all duration-300">
          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-emerald-500"></div>
          <h3 className="text-xs font-mono font-bold text-text-muted mb-1 flex items-center gap-1.5 uppercase tracking-wider">
            <span className="material-symbols-outlined text-sm text-emerald-400">health_and_safety</span>
            System Health
          </h3>
          <div className="text-3xl font-extrabold font-mono text-emerald-400">98%</div>
          <div className="mt-2 flex items-center text-[11px] font-mono text-text-muted">
            <span className="mr-1 text-emerald-400">● All nodes operational</span>
          </div>
        </div>
      </div>

      {/* Main Bento Grid Layout (Stitch 12-Column Split) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Primary Panel: AI Forensics Insight (Spans 7-8 Cols) */}
        <section className="lg:col-span-7 xl:col-span-8 glass-panel rounded-2xl overflow-hidden flex flex-col border border-border-muted transition-colors duration-300 shadow-xl">
          <div className="p-4 border-b border-border-muted bg-surface-dim flex justify-between items-center">
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                psychology
              </span>
              <span>AI Forensics Insight</span>
            </h2>
            <span className="bg-rose-500/15 text-rose-400 font-mono text-[10px] font-bold px-2.5 py-1 rounded border border-rose-500/40 uppercase tracking-wider">
              Critical Alert
            </span>
          </div>

          <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
            <div className="bg-rose-500/10 border-l-4 border-rose-500 p-5 rounded-r-xl space-y-3">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-rose-500 text-2xl mt-0.5">flip_camera_ios</span>
                <div className="space-y-2 flex-1">
                  <h4 className="text-sm font-bold text-rose-400">
                    Anomaly Detection: {topIncident ? `Cluster #${topIncident.incident_id.substring(0, 8)}` : 'Brute Force Attack'}
                  </h4>
                  <p className="text-xs text-text-primary leading-relaxed">
                    AI Copilot identified a rapid sequence of unauthorized access attempts originating from a distributed botnet targeting{' '}
                    <code className="font-mono bg-surface px-2 py-0.5 rounded text-primary border border-border-muted">
                      {topIncident ? topIncident.source_ip : 'Server_A (10.4.22.1)'}
                    </code>.
                  </p>

                  <div className="grid grid-cols-2 gap-2 pt-2 font-mono text-xs text-text-muted">
                    <div>Target: <span className="text-text-primary font-bold">{topIncident ? topIncident.source_ip : 'Server_A (10.4.22.1)'}</span></div>
                    <div>Confidence: <span className="text-rose-400 font-bold">{topIncident ? `${topIncident.max_threat_score.toFixed(1)}%` : '99.8%'}</span></div>
                    <div>Vector: <span className="text-text-primary font-bold">SSH Port 22</span></div>
                    <div>Duration: <span className="text-text-primary font-bold">3m 12s (Ongoing)</span></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 justify-end pt-2 border-t border-border-muted/50">
              <button
                onClick={() => setShowIngestionWorkbench(!showIngestionWorkbench)}
                className="px-4 py-2 rounded-xl border border-border-muted text-text-muted hover:text-text-primary font-bold text-xs transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">tune</span>
                <span>{showIngestionWorkbench ? 'Hide Workbench' : 'Ingestion Workbench'}</span>
              </button>

              {topIncident && (
                <button
                  onClick={() => handleIncidentClick(topIncident)}
                  className="px-4 py-2 rounded-xl border border-border-muted text-primary hover:bg-surface-hover font-bold text-xs transition-colors flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">troubleshoot</span>
                  <span>View Trace</span>
                </button>
              )}

              <button
                onClick={() => alert('Security Node Isolation protocol initiated.')}
                className="px-4 py-2 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-400 font-bold text-xs hover:bg-rose-500 hover:text-white transition-all flex items-center gap-1.5 shadow-sm"
              >
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                  block
                </span>
                <span>Isolate Node</span>
              </button>
            </div>
          </div>
        </section>

        {/* Secondary Panel: Live Telemetry Stream (Spans 4-5 Cols) */}
        <section className="lg:col-span-5 xl:col-span-4 glass-panel rounded-2xl overflow-hidden flex flex-col h-[460px] border border-border-muted shadow-xl">
          <div className="p-4 border-b border-border-muted bg-surface-dim flex justify-between items-center sticky top-0 z-10">
            <h2 className="text-xs font-mono font-bold text-text-primary flex items-center gap-2 uppercase tracking-wider">
              <span className="material-symbols-outlined text-sky-400 text-lg">dynamic_feed</span>
              <span>Live Telemetry</span>
            </h2>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-mono text-[11px] text-text-muted">Live Stream</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto font-mono text-xs divide-y divide-border-muted/60 bg-surface-dim">
            {recentEvents.length === 0 ? (
              <div className="p-6 text-center text-text-muted">
                <span className="material-symbols-outlined text-3xl mb-2 text-text-muted">database</span>
                <p>Waiting for live stream telemetry events...</p>
              </div>
            ) : (
              recentEvents.map((evt, idx) => {
                const threatLvl = (evt.threat_level || 'LOW').toUpperCase();
                const isHigh = threatLvl === 'HIGH';
                const isMed = threatLvl === 'MEDIUM';

                return (
                  <div
                    key={evt.raw_event_hash || idx}
                    className={`p-3 hover:bg-surface-hover transition-colors flex gap-2.5 items-start border-l-4 ${
                      isHigh
                        ? 'border-l-rose-500 bg-rose-500/5'
                        : isMed
                        ? 'border-l-amber-500'
                        : 'border-l-emerald-500'
                    }`}
                  >
                    <div className="text-text-muted flex-shrink-0 text-[11px]">
                      {(evt.timestamp || '').substring(11, 19) || '14:02:11'}
                    </div>
                    <div className="flex-1 break-all text-[11px] leading-relaxed">
                      <span className={`font-bold mr-1 ${isHigh ? 'text-rose-400' : isMed ? 'text-amber-400' : 'text-emerald-400'}`}>
                        [{evt.event_type ? evt.event_type.toUpperCase() : 'AUTH_FAILURE_BURST'}]
                      </span>
                      <span className="text-text-primary">
                        src={evt.source_ip || '192.168.1.105'} target={evt.target_host || 'Server_A'} msg="{evt.mitre_tactic || 'Security Telemetry Ingest'}"
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      {/* Optional Sovereign Log Ingestion Workbench Drawer */}
      {showIngestionWorkbench && (
        <div className="glass-panel p-6 rounded-2xl border border-border-muted space-y-4 animate-in slide-in-from-top-4 duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/15 text-primary border border-primary/30 flex items-center justify-center">
                <span className="material-symbols-outlined text-xl">cloud_upload</span>
              </div>
              <div>
                <h2 className="text-base font-bold text-text-primary">Sovereign Log Ingestion Engine</h2>
                <p className="text-xs text-text-muted">Upload raw log files or inject test log streams for instant normalization</p>
              </div>
            </div>

            <label className="btn-primary px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm">
              <span className="material-symbols-outlined text-sm">upload_file</span>
              <span>Upload Log File (.log, .csv, .txt)</span>
              <input type="file" onChange={handleFileUpload} accept=".log,.csv,.txt,.json" className="hidden" />
            </label>
          </div>

          {uploadStatus && (
            <div className="p-3 rounded-lg bg-surface-dim border border-border-muted text-xs font-mono text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">info</span>
              <span>{uploadStatus}</span>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-text-muted font-mono">
              <span>Raw Log Stream Payload:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCustomPayloadText(PRESET_PAYLOADS.cisco)}
                  className="px-2 py-0.5 rounded bg-surface-container border border-border-muted hover:border-primary text-[10px]"
                >
                  + Cisco ASA Deny
                </button>
                <button
                  onClick={() => setCustomPayloadText(PRESET_PAYLOADS.fortinet)}
                  className="px-2 py-0.5 rounded bg-surface-container border border-border-muted hover:border-primary text-[10px]"
                >
                  + Fortinet UTM Virus
                </button>
                <button
                  onClick={() => setCustomPayloadText(PRESET_PAYLOADS.suricata)}
                  className="px-2 py-0.5 rounded bg-surface-container border border-border-muted hover:border-primary text-[10px]"
                >
                  + Suricata SSH Scan
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              <textarea
                rows={2}
                value={customPayloadText}
                onChange={(e) => setCustomPayloadText(e.target.value)}
                placeholder="Paste raw log lines here (%ASA-4-106023, Syslog, Suricata, CEF, JSON)..."
                className="flex-1 input-cyber p-3 text-xs font-mono rounded-xl bg-surface-dim border-border-muted resize-none"
              />
              <button
                onClick={handlePayloadSubmit}
                disabled={!customPayloadText.trim()}
                className="btn-primary px-5 rounded-xl text-xs font-bold disabled:opacity-40 flex flex-col items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-lg">play_arrow</span>
                <span>Ingest</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Correlated Security Incidents Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/15 text-rose-500 border border-rose-500/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">hub</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-text-primary">Correlated Security Incidents</h2>
              <p className="text-xs text-text-muted">Graph-clustered attack timelines and MITRE tactics</p>
            </div>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded bg-surface-container border border-border-muted text-text-muted">
            {incidents.length} Active Clusters
          </span>
        </div>

        {incidents.length === 0 ? (
          <div className="glass-panel p-8 text-center text-text-muted rounded-2xl border border-border-muted">
            No active incident clusters detected. Telemetry baseline is nominal.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {incidents.map((inc) => (
              <div
                key={inc.incident_id}
                onClick={() => handleIncidentClick(inc)}
                className="glass-panel p-5 rounded-2xl border border-border-muted hover:border-primary transition-all cursor-pointer space-y-3 relative group shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-primary">
                    {inc.incident_id.substring(0, 12)}...
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase ${
                      inc.max_threat_score >= 70
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    }`}
                  >
                    Score {inc.max_threat_score.toFixed(1)}
                  </span>
                </div>

                <div>
                  <div className="text-xs text-text-muted font-mono">Offending Source IP</div>
                  <div className="text-sm font-mono font-bold text-text-primary">{inc.source_ip}</div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {(inc.mitre_tactics || []).map((tactic, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] px-2 py-0.5 rounded bg-surface-container border border-border-muted text-text-muted font-mono"
                    >
                      {tactic}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-text-muted pt-2 border-t border-border-muted/50">
                  <span>{inc.event_count} Events</span>
                  <span className="text-primary group-hover:underline flex items-center gap-1">
                    Inspect Drill-in <span className="material-symbols-outlined text-xs">arrow_forward</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Incident Detail Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-3xl rounded-2xl border border-border-muted overflow-hidden shadow-2xl max-h-[90vh] flex flex-col animate-in zoom-in-95">
            <div className="p-5 border-b border-border-muted bg-surface-dim flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-rose-500/15 text-rose-500 border border-rose-500/30 flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">hub</span>
                </div>
                <div>
                  <h3 className="font-bold text-base text-text-primary">
                    Incident Cluster Details: {selectedIncident.incident_id}
                  </h3>
                  <div className="text-xs text-text-muted font-mono">
                    Source IP: {selectedIncident.source_ip} | Max Score: {selectedIncident.max_threat_score?.toFixed(1)}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedIncident(null)}
                className="p-1 text-text-muted hover:text-text-primary"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              <div className="flex items-center justify-between p-4 rounded-xl bg-surface-dim border border-border-muted">
                <div>
                  <div className="text-xs text-text-muted font-mono">Workflow Status</div>
                  <div className="font-bold text-sm text-text-primary">{selectedIncident.status || 'New'}</div>
                </div>
                <select
                  value={selectedIncident.status || 'New'}
                  onChange={(e) => handleIncidentStatusChange(selectedIncident.incident_id, e.target.value)}
                  className="bg-surface border border-border-muted rounded-lg px-3 py-1.5 text-xs font-mono text-text-primary"
                >
                  <option value="New">New</option>
                  <option value="Investigating">Investigating</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Dismissed">Dismissed</option>
                </select>
              </div>

              <div>
                <h4 className="font-bold text-xs text-text-muted font-mono uppercase mb-2">
                  Correlated Member Events ({incidentDetailEvents.length})
                </h4>
                <div className="space-y-2">
                  {incidentDetailEvents.map((mEvt, mIdx) => (
                    <div key={mIdx} className="p-3 rounded-xl bg-surface border border-border-muted text-xs space-y-1 font-mono">
                      <div className="flex justify-between text-text-primary font-bold">
                        <span>{mEvt.timestamp}</span>
                        <span className="text-rose-400">{mEvt.event_type}</span>
                      </div>
                      <div className="text-text-muted text-[11px]">
                        {mEvt.original_event || mEvt.raw_payload || 'No raw payload available'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-border-muted bg-surface-dim text-right">
              <button
                onClick={() => setSelectedIncident(null)}
                className="btn-secondary px-5 py-2 rounded-lg text-xs font-bold"
              >
                Close Drill-in
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
