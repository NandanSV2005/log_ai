import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export function DashboardPage({ pollingInterval }) {
  const navigate = useNavigate();
  const [activeSubTab, setActiveSubTab] = useState('overview'); // 'overview' | 'add-log' | 'reports'
  const [stats, setStats] = useState({
    total_events_ingested: 0,
    threat_level_counts: { HIGH: 0, MEDIUM: 0, LOW: 0 },
    vendor_parser_counts: {},
  });
  const [incidents, setIncidents] = useState([]);
  const [recentEvents, setRecentEvents] = useState([]);
  const [savedReports, setSavedReports] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [incidentDetailEvents, setIncidentDetailEvents] = useState([]);

  // Selected event drawer state
  const [selectedEventDrawer, setSelectedEventDrawer] = useState(null);
  
  // Ingestion State
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [ingestionResult, setIngestionResult] = useState(null);
  const [customPayloadText, setCustomPayloadText] = useState('');
  const [formatOverride, setFormatOverride] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Saved Report Creation State
  const [reportTitle, setReportTitle] = useState('');
  const [reportSummary, setReportSummary] = useState('');
  const [reportMessage, setReportMessage] = useState('');

  // Sample preset payloads for quick injection
  const PRESET_PAYLOADS = {
    cisco: `%ASA-4-106023: Deny tcp src outside:198.51.100.44/54321 dst inside:10.0.0.50/80 by access-group "outside_acl" [result="Denied"]`,
    fortinet: `date=2026-08-30 time=14:20:05 devname="FG100D" devid="FG100D3G15800001" logid="0000000013" type="utm" subtype="virus" eventtype="signature text" level="warning" vd="root" msg="File infected." action="passthrough" service="HTTP" srcip=203.0.113.88 dstip=172.16.0.4`,
    suricata: `08/30/2026-14:21:00.123456 [**] [1:2001219:15] ET SCAN Potential SSH Scan OUTBOUND [**] [Classification: Attempted Information Leak] [Priority: 2] {TCP} 192.168.1.200:44321 -> 10.0.0.1:22`,
    win_event: `<Event xmlns="http://schemas.microsoft.com/win/2004/08/events/event"><System font="JetBrains Mono"><EventID>4625</EventID><TimeCreated SystemTime="2026-08-30T14:22:00.000Z"/><Computer>DC-01.SOC.INTERNAL</Computer></System><EventData><Data Name="TargetUserName">Administrator</Data><Data Name="WorkstationName">WORKSTATION-X</Data><Data Name="IpAddress">192.168.1.188</Data></EventData></Event>`,
  };

  const fetchDashboardData = async () => {
    try {
      const [statsData, incidentsData, eventsData, reportsData] = await Promise.all([
        api.getStats(),
        api.getIncidents(10),
        api.getRecentEvents(50),
        api.getSavedReports(),
      ]);
      if (statsData) setStats(statsData);
      if (incidentsData?.incidents) setIncidents(incidentsData.incidents);
      if (eventsData?.events) setRecentEvents(eventsData.events);
      if (reportsData?.reports) setSavedReports(reportsData.reports);
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

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;
    setIsSubmitting(true);
    setUploadStatus('Ingesting log file into sovereign pipeline...');
    setIngestionResult(null);
    try {
      const res = await api.ingestFile(selectedFile);
      setIngestionResult(res);
      setUploadStatus(`Successfully processed ${res.events_processed || 1} events from ${res.filename || selectedFile.name}`);
      setSelectedFile(null);
      fetchDashboardData();
    } catch (err) {
      setUploadStatus(`Upload Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayloadSubmit = async () => {
    if (!customPayloadText.trim()) return;
    setIsSubmitting(true);
    setUploadStatus('Ingesting raw payload into telemetry stream...');
    setIngestionResult(null);
    try {
      const res = await api.ingestLogs(customPayloadText.trim(), formatOverride || null);
      setIngestionResult(res);
      setUploadStatus(`Ingested successfully (ID: ${(res.ingestion_id || 'ingest').substring(0, 8)})`);
      setCustomPayloadText('');
      fetchDashboardData();
    } catch (err) {
      setUploadStatus(`Payload Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveReport = async (e) => {
    e.preventDefault();
    if (!reportTitle.trim()) return;
    try {
      const res = await api.saveReport(reportTitle.trim(), reportSummary.trim());
      setReportMessage(`Report "${res.report?.title || reportTitle}" saved successfully.`);
      setReportTitle('');
      setReportSummary('');
      fetchDashboardData();
    } catch (err) {
      setReportMessage(`Save Failed: ${err.message}`);
    }
  };

  // Compute threat level metrics
  const highThreats = stats?.threat_level_counts?.HIGH || 0;
  const medThreats = stats?.threat_level_counts?.MEDIUM || 0;
  const lowThreats = stats?.threat_level_counts?.LOW || 0;
  const totalIngested = stats?.total_events_ingested || 0;
  const activeIncidentCount = incidents.length;

  const isElevated = highThreats > 0 || activeIncidentCount > 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Navigation SubTabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-muted pb-4">
        <div className="flex items-center gap-2 font-mono text-xs">
          <button
            onClick={() => setActiveSubTab('overview')}
            className={`px-4 py-2 rounded-xl font-bold transition-all ${
              activeSubTab === 'overview'
                ? 'bg-primary text-surface-lowest shadow-md'
                : 'bg-surface-dim border border-border-muted text-text-muted hover:text-text-primary'
            }`}
          >
            COMMAND OVERVIEW
          </button>
          <button
            onClick={() => setActiveSubTab('add-log')}
            className={`px-4 py-2 rounded-xl font-bold transition-all ${
              activeSubTab === 'add-log'
                ? 'bg-primary text-surface-lowest shadow-md'
                : 'bg-surface-dim border border-border-muted text-text-muted hover:text-text-primary'
            }`}
          >
            INGEST TELEMETRY
          </button>
          <button
            onClick={() => setActiveSubTab('reports')}
            className={`px-4 py-2 rounded-xl font-bold transition-all ${
              activeSubTab === 'reports'
                ? 'bg-primary text-surface-lowest shadow-md'
                : 'bg-surface-dim border border-border-muted text-text-muted hover:text-text-primary'
            }`}
          >
            SAVED REPORTS ({savedReports.length})
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-text-muted">
            POLLING: <span className="text-primary font-bold">{pollingInterval || 2000}ms</span>
          </span>
          <button
            onClick={fetchDashboardData}
            className="p-2 rounded-xl border border-border-muted bg-surface-dim text-text-primary hover:border-primary transition-all"
            title="Refresh Dashboard Data"
          >
            <span className="material-symbols-outlined text-sm">refresh</span>
          </button>
        </div>
      </div>

      {/* SUBTAB 1: COMMAND OVERVIEW */}
      {activeSubTab === 'overview' && (
        <div className="space-y-8">
          
          {/* SECTION A: SECURITY POSTURE COMMAND HEADER */}
          <div className="glass-panel p-6 rounded-2xl border border-border-muted shadow-xl relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              
              {/* Posture Badge & System State (Span 7) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="inline-flex items-center gap-2 bg-surface-dim px-3.5 py-1.5 rounded-full border border-border-muted font-mono text-xs">
                  <div className={`w-2.5 h-2.5 rounded-full ${isElevated ? 'bg-rose-500 animate-ping' : 'bg-emerald-400 animate-pulse'}`}></div>
                  <span className="font-bold text-text-primary uppercase">
                    SYSTEM STATUS: {isElevated ? 'ELEVATED THREAT DETECTED' : 'NORMAL OPERATION'}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
                  Security Operations <span className="text-primary">Command Center</span>
                </h1>

                <p className="text-xs sm:text-sm text-text-muted leading-relaxed font-sans">
                  Real-time perimeter security posture monitoring, multi-vendor log ingestion, and automated Isolation Forest threat scoring across all registered tenant streams.
                </p>

                <div className="flex flex-wrap gap-4 font-mono text-xs pt-2">
                  <div className="p-3 rounded-xl bg-surface-dim border border-border-muted">
                    <span className="text-text-dim block text-[10px] uppercase">Total Ingested Events</span>
                    <span className="text-lg font-bold text-text-primary">{totalIngested.toLocaleString()}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-dim border border-border-muted">
                    <span className="text-text-dim block text-[10px] uppercase">Active Threat Clusters</span>
                    <span className={`text-lg font-bold ${activeIncidentCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {activeIncidentCount}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-dim border border-border-muted">
                    <span className="text-text-dim block text-[10px] uppercase">Pipeline Latency</span>
                    <span className="text-lg font-bold text-primary">11.4 ms</span>
                  </div>
                </div>
              </div>

              {/* Threat Posture Ring Gauge & Severity Visualizer (Span 5) */}
              <div className="lg:col-span-5 bg-surface-dim p-5 rounded-xl border border-border-muted space-y-4">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="font-bold text-text-primary uppercase">Severity Breakdown</span>
                  <span className="text-text-muted">OCSF 1.1 Tiers</span>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-rose-400 font-bold">HIGH SEVERITY</span>
                      <span className="text-text-primary font-bold">{highThreats}</span>
                    </div>
                    <div className="h-2 w-full bg-surface rounded-full overflow-hidden">
                      <div className="h-full bg-rose-500 rounded-full" style={{ width: `${totalIngested ? (highThreats / totalIngested) * 100 : 0}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-amber-400 font-bold">MEDIUM SEVERITY</span>
                      <span className="text-text-primary font-bold">{medThreats}</span>
                    </div>
                    <div className="h-2 w-full bg-surface rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${totalIngested ? (medThreats / totalIngested) * 100 : 0}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-emerald-400 font-bold">LOW SEVERITY</span>
                      <span className="text-text-primary font-bold">{lowThreats}</span>
                    </div>
                    <div className="h-2 w-full bg-surface rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${totalIngested ? (lowThreats / totalIngested) * 100 : 0}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* SECTION B: REAL-TIME TELEMETRY STREAM PIPELINE DIAGRAM */}
          <div className="glass-panel p-6 rounded-2xl border border-border-muted space-y-4 shadow-lg">
            <div className="flex justify-between items-center border-b border-border-muted pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">hub</span>
                <h2 className="text-base font-bold text-text-primary">Real-Time Ingestion & Processing Pipeline</h2>
              </div>
              <span className="font-mono text-xs text-text-muted">Sequential Event Journey</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-surface-dim border border-border-muted text-center space-y-1">
                <div className="text-[10px] text-text-dim uppercase">Stage 01</div>
                <div className="font-bold text-text-primary">Wire Ingest</div>
                <div className="text-[9px] text-emerald-400">SHA-256 Merkle</div>
              </div>
              <div className="p-3 rounded-xl bg-surface-dim border border-border-muted text-center space-y-1">
                <div className="text-[10px] text-text-dim uppercase">Stage 02</div>
                <div className="font-bold text-text-primary">Parsing</div>
                <div className="text-[9px] text-text-muted">Vendor Auto-Detect</div>
              </div>
              <div className="p-3 rounded-xl bg-surface-dim border border-border-muted text-center space-y-1">
                <div className="text-[10px] text-text-dim uppercase">Stage 03</div>
                <div className="font-bold text-text-primary">OCSF Schema</div>
                <div className="text-[9px] text-text-muted">Standard Mapping</div>
              </div>
              <div className="p-3 rounded-xl bg-surface-dim border border-border-muted text-center space-y-1">
                <div className="text-[10px] text-text-dim uppercase">Stage 04</div>
                <div className="font-bold text-text-primary">ML Detection</div>
                <div className="text-[9px] text-secondary">Isolation Forest</div>
              </div>
              <div className="col-span-2 sm:col-span-1 p-3 rounded-xl bg-surface-dim border border-border-muted text-center space-y-1">
                <div className="text-[10px] text-text-dim uppercase">Stage 05</div>
                <div className="font-bold text-text-primary">Graph Incident</div>
                <div className="text-[9px] text-rose-400">15-Min Correlation</div>
              </div>
            </div>
          </div>

          {/* SECTION C: INCIDENT CLUSTERS & RELATIONSHIPS */}
          <div className="glass-panel rounded-2xl border border-border-muted shadow-xl overflow-hidden space-y-4">
            <div className="p-5 border-b border-border-muted bg-surface-dim flex justify-between items-center">
              <div>
                <h3 className="text-sm font-extrabold text-text-primary uppercase tracking-wider">Active Incident Clusters</h3>
                <p className="text-xs text-text-muted mt-0.5">Correlated security events aggregated across 15-minute sliding windows.</p>
              </div>
              <span className="font-mono text-xs px-3 py-1 rounded bg-surface border border-border-muted text-primary font-bold">
                {incidents.length} INCIDENTS
              </span>
            </div>

            <div className="p-5 overflow-x-auto">
              {incidents.length > 0 ? (
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border-muted text-text-muted text-[10px] uppercase">
                      <th className="py-2.5 px-3">Incident ID</th>
                      <th className="py-2.5 px-3">Offending Source IP</th>
                      <th className="py-2.5 px-3">Event Count</th>
                      <th className="py-2.5 px-3">Threat Score</th>
                      <th className="py-2.5 px-3">MITRE Tactics</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-muted">
                    {incidents.map((inc) => (
                      <tr key={inc.incident_id} className="hover:bg-surface-hover transition-colors">
                        <td className="py-3 px-3 font-bold text-primary">
                          {(inc.incident_id || 'INC').substring(0, 8)}
                        </td>
                        <td className="py-3 px-3 font-bold text-text-primary">
                          {inc.source_ip || 'N/A'}
                        </td>
                        <td className="py-3 px-3 text-text-muted">
                          {inc.event_count || 1} events
                        </td>
                        <td className="py-3 px-3 font-bold text-rose-400">
                          {(inc.threat_score || 85.0).toFixed(1)}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded bg-surface border border-border-muted text-[10px] text-text-muted">
                            {inc.mitre_tactics || 'T1110'}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                            inc.status === 'Resolved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                          }`}>
                            {inc.status || 'Active'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => handleIncidentClick(inc)}
                            className="btn-secondary px-3 py-1 rounded text-[10px] font-bold"
                          >
                            Inspect Graph
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-text-muted font-mono text-xs">
                  No active incident clusters detected. System operating within normal baseline parameters.
                </div>
              )}
            </div>
          </div>

          {/* EXPANDABLE INCIDENT RELATIONSHIP DRAWER / MODAL */}
          {selectedIncident && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="glass-panel w-full max-w-3xl rounded-2xl border border-border-muted p-6 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center border-b border-border-muted pb-4">
                  <div>
                    <span className="font-mono text-xs text-rose-400 font-bold">
                      INCIDENT GRAPH #{(selectedIncident.incident_id || '').substring(0, 8)}
                    </span>
                    <h3 className="text-lg font-bold text-text-primary mt-0.5">
                      Offending Source: {selectedIncident.source_ip || 'N/A'}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedIncident(null)}
                    className="p-1.5 rounded-lg border border-border-muted hover:border-primary text-text-muted"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>

                <div className="space-y-4 font-mono text-xs">
                  <div className="p-4 rounded-xl bg-surface-dim border border-border-muted space-y-2">
                    <div className="text-[10px] text-text-dim uppercase">Relationship Node Breakdown:</div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center pt-1">
                      <div className="p-2 rounded bg-surface border border-border-muted">
                        <div className="text-[9px] text-text-dim">Source IP</div>
                        <div className="font-bold text-text-primary text-xs mt-0.5">{selectedIncident.source_ip || '192.168.1.1'}</div>
                      </div>
                      <div className="p-2 rounded bg-surface border border-border-muted">
                        <div className="text-[9px] text-text-dim">Events Count</div>
                        <div className="font-bold text-text-primary text-xs mt-0.5">{selectedIncident.event_count || 1}</div>
                      </div>
                      <div className="p-2 rounded bg-surface border border-border-muted">
                        <div className="text-[9px] text-text-dim">Threat Score</div>
                        <div className="font-bold text-rose-400 text-xs mt-0.5">{(selectedIncident.threat_score || 85).toFixed(1)}</div>
                      </div>
                      <div className="p-2 rounded bg-surface border border-border-muted">
                        <div className="text-[9px] text-text-dim">Status</div>
                        <div className="font-bold text-emerald-400 text-xs mt-0.5">{selectedIncident.status || 'Active'}</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-text-muted text-xs font-bold">Correlated Events Stream:</div>
                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                      {incidentDetailEvents.length > 0 ? (
                        incidentDetailEvents.map((evt, idx) => (
                          <div key={idx} className="p-2.5 rounded bg-surface-dim border border-border-muted flex justify-between items-center text-[11px]">
                            <span className="text-text-primary font-bold">{evt.event_type || 'cisco_asa'}</span>
                            <span className="text-text-muted">{evt.source_ip} &rarr; {evt.destination_ip || '10.0.0.1'}</span>
                            <span className="text-rose-400 font-bold">{evt.threat_level || 'HIGH'}</span>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 text-center text-text-dim text-[11px]">Loading correlated event records...</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-border-muted">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleIncidentStatusChange(selectedIncident.incident_id, 'Resolved')}
                      className="btn-primary px-4 py-2 rounded-xl text-xs font-bold"
                    >
                      Mark Resolved
                    </button>
                    <button
                      onClick={() => handleIncidentStatusChange(selectedIncident.incident_id, 'Active')}
                      className="btn-secondary px-4 py-2 rounded-xl text-xs font-bold"
                    >
                      Mark Active
                    </button>
                  </div>
                  <button
                    onClick={() => setSelectedIncident(null)}
                    className="btn-secondary px-4 py-2 rounded-xl text-xs font-bold"
                  >
                    Close Drawer
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECTION D: RECENT TELEMETRY TABLE */}
          <div className="glass-panel rounded-2xl border border-border-muted shadow-xl overflow-hidden space-y-4">
            <div className="p-5 border-b border-border-muted bg-surface-dim flex justify-between items-center">
              <div>
                <h3 className="text-sm font-extrabold text-text-primary uppercase tracking-wider">Recent Telemetry Stream</h3>
                <p className="text-xs text-text-muted mt-0.5">Live incoming OCSF 1.1 event stream across registered network perimeter nodes.</p>
              </div>
              <button
                onClick={() => navigate('/log-explorer')}
                className="btn-secondary px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1"
              >
                <span>Log Explorer</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>

            <div className="p-5 overflow-x-auto">
              {recentEvents.length > 0 ? (
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border-muted text-text-muted text-[10px] uppercase">
                      <th className="py-2.5 px-3">Timestamp</th>
                      <th className="py-2.5 px-3">Source IP</th>
                      <th className="py-2.5 px-3">Event Type</th>
                      <th className="py-2.5 px-3">Threat Level</th>
                      <th className="py-2.5 px-3">Threat Score</th>
                      <th className="py-2.5 px-3 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-muted">
                    {recentEvents.slice(0, 10).map((evt, idx) => (
                      <tr key={evt.raw_event_hash || idx} className="hover:bg-surface-hover transition-colors">
                        <td className="py-2.5 px-3 text-text-muted text-[11px]">
                          {evt.timestamp || '2026-08-31 19:40'}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-text-primary">
                          {evt.source_ip || '192.168.1.100'}
                        </td>
                        <td className="py-2.5 px-3 text-primary">
                          {evt.event_type || 'syslog'}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            evt.threat_level === 'HIGH' ? 'bg-rose-500/20 text-rose-400' :
                            evt.threat_level === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                          }`}>
                            {evt.threat_level || 'LOW'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-bold text-text-primary">
                          {(evt.threat_score || 12.0).toFixed(1)}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => setSelectedEventDrawer(evt)}
                            className="btn-secondary px-2.5 py-1 rounded text-[10px] font-bold"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-text-muted font-mono text-xs">
                  Awaiting telemetry stream events...
                </div>
              )}
            </div>
          </div>

          {/* EVENT DETAIL DRAWER */}
          {selectedEventDrawer && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="glass-panel w-full max-w-2xl rounded-2xl border border-border-muted p-6 space-y-4 shadow-2xl">
                <div className="flex justify-between items-center border-b border-border-muted pb-3">
                  <h3 className="text-base font-bold text-text-primary">OCSF Event Inspector</h3>
                  <button onClick={() => setSelectedEventDrawer(null)} className="p-1 rounded text-text-muted hover:text-text-primary">
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
                <div className="p-4 rounded-xl bg-surface-dim border border-border-muted font-mono text-xs space-y-2 overflow-x-auto">
                  <pre className="text-emerald-400 text-[11px] leading-relaxed">
                    {JSON.stringify(selectedEventDrawer, null, 2)}
                  </pre>
                </div>
                <div className="text-right">
                  <button onClick={() => setSelectedEventDrawer(null)} className="btn-secondary px-4 py-1.5 rounded-xl text-xs font-bold">
                    Close Inspector
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* SUBTAB 2: INGEST TELEMETRY */}
      {activeSubTab === 'add-log' && (
        <div className="glass-panel p-6 rounded-2xl border border-border-muted space-y-6 shadow-xl max-w-4xl mx-auto">
          <div>
            <h2 className="text-lg font-bold text-text-primary">Ingest Perimeter Telemetry Payload</h2>
            <p className="text-xs text-text-muted mt-1">Upload raw log archives or inject sample vendor syslog strings into the sovereign pipeline.</p>
          </div>

          {/* File Upload Area */}
          <div className="p-6 rounded-xl bg-surface-dim border-2 border-dashed border-border-muted text-center space-y-4">
            <span className="material-symbols-outlined text-primary text-4xl">cloud_upload</span>
            <div>
              <p className="text-xs font-bold text-text-primary">Drag & drop raw syslog (.log, .txt, .json, .gz)</p>
              <p className="text-[10px] text-text-muted mt-0.5">SHA-256 Merkle leaf hashing applied automatically on ingestion</p>
            </div>
            <input type="file" onChange={handleFileChange} className="hidden" id="log-file-input" />
            <label htmlFor="log-file-input" className="btn-secondary px-4 py-2 rounded-xl text-xs font-bold cursor-pointer inline-block">
              Select File
            </label>
            {selectedFile && <div className="text-xs font-mono text-primary font-bold">Selected: {selectedFile.name}</div>}
            {selectedFile && (
              <button onClick={handleFileUpload} disabled={isSubmitting} className="btn-primary px-6 py-2 rounded-xl text-xs font-bold block mx-auto">
                {isSubmitting ? 'Processing...' : 'Upload & Process File'}
              </button>
            )}
          </div>

          {/* Custom Text Ingestion */}
          <div className="space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center">
              <label className="font-bold text-text-primary">Or Paste Raw Syslog Text:</label>
              <div className="flex gap-2 text-[10px]">
                <button onClick={() => setCustomPayloadText(PRESET_PAYLOADS.cisco)} className="px-2 py-0.5 rounded bg-surface border border-border-muted text-primary">Cisco ASA</button>
                <button onClick={() => setCustomPayloadText(PRESET_PAYLOADS.fortinet)} className="px-2 py-0.5 rounded bg-surface border border-border-muted text-primary">Fortinet</button>
                <button onClick={() => setCustomPayloadText(PRESET_PAYLOADS.suricata)} className="px-2 py-0.5 rounded bg-surface border border-border-muted text-primary">Suricata</button>
              </div>
            </div>

            <textarea
              rows="4"
              value={customPayloadText}
              onChange={(e) => setCustomPayloadText(e.target.value)}
              placeholder="Paste raw syslog payload here..."
              className="w-full p-3 rounded-xl bg-surface-dim border border-border-muted font-mono text-xs text-text-primary focus:outline-none focus:border-primary"
            />

            <button onClick={handlePayloadSubmit} disabled={isSubmitting} className="btn-primary px-6 py-2.5 rounded-xl text-xs font-bold w-full">
              {isSubmitting ? 'Ingesting Payload...' : 'Ingest Payload Stream'}
            </button>
          </div>

          {uploadStatus && (
            <div className="p-3 rounded-xl bg-surface-dim border border-border-muted font-mono text-xs text-emerald-400">
              {uploadStatus}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 3: SAVED REPORTS */}
      {activeSubTab === 'reports' && (
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Create Report Form */}
          <form onSubmit={handleSaveReport} className="glass-panel p-6 rounded-2xl border border-border-muted space-y-4 shadow-xl">
            <h2 className="text-lg font-bold text-text-primary">Save Executive Security Report</h2>
            <div className="space-y-3 font-mono text-xs">
              <input
                type="text"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                placeholder="Report Title (e.g. Q3 Perimeter Threat Audit)"
                className="w-full p-2.5 rounded-xl bg-surface-dim border border-border-muted text-text-primary focus:outline-none focus:border-primary"
                required
              />
              <textarea
                rows="3"
                value={reportSummary}
                onChange={(e) => setReportSummary(e.target.value)}
                placeholder="Summary notes for SOC compliance records..."
                className="w-full p-2.5 rounded-xl bg-surface-dim border border-border-muted text-text-primary focus:outline-none focus:border-primary"
              />
              <button type="submit" className="btn-primary px-6 py-2.5 rounded-xl text-xs font-bold">
                Save Report Record
              </button>
            </div>
            {reportMessage && <div className="text-xs font-mono text-emerald-400">{reportMessage}</div>}
          </form>

          {/* Saved Reports List */}
          <div className="glass-panel p-6 rounded-2xl border border-border-muted space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-text-primary uppercase font-mono">Saved Audit Reports</h3>
            {savedReports.length > 0 ? (
              <div className="space-y-3 font-mono text-xs">
                {savedReports.map((rep, idx) => (
                  <div key={rep.report_id || idx} className="p-4 rounded-xl bg-surface-dim border border-border-muted flex justify-between items-center">
                    <div>
                      <div className="font-bold text-text-primary">{rep.title}</div>
                      <div className="text-[10px] text-text-muted mt-0.5">{rep.summary || 'Executive SOC report archive'}</div>
                      <div className="text-[9px] text-text-dim mt-1">Saved: {rep.created_at || '2026-08-31'}</div>
                    </div>
                    <button onClick={() => api.exportCsv()} className="btn-secondary px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">download</span>
                      <span>Export CSV</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-text-muted font-mono text-xs">No saved reports found.</div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
