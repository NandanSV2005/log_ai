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
      setUploadStatus(`Ingestion Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveReportSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const title = reportTitle || formData.get('reportTitle') || 'Custom SOC Security Report';
    const summary = reportSummary || formData.get('reportSummary') || 'Telemetry posture analysis report.';

    try {
      const res = await api.saveReport(title, summary, stats);
      setReportMessage('Security report saved successfully!');
      setReportTitle('');
      setReportSummary('');
      fetchDashboardData();
    } catch (err) {
      setReportMessage(`Save Error: ${err.message}`);
    }
  };

  const topIncident = incidents.length > 0 ? incidents[0] : null;

  // DYNAMIC THREAT-DRIVEN SYSTEM HEALTH CALCULATION (ISSUE 6)
  const highThreatsCount = stats.threat_level_counts?.HIGH || 0;
  const medThreatsCount = stats.threat_level_counts?.MEDIUM || 0;
  const maxThreatScore = incidents.length > 0 ? Math.max(...incidents.map((i) => i.max_threat_score || 0)) : 0;

  let healthPercent = 100;
  let healthStatusText = '● All Systems Healthy';
  let healthColorClass = 'text-emerald-400';
  let healthBarClass = 'bg-emerald-500';

  if (highThreatsCount >= 5 || maxThreatScore >= 80) {
    healthPercent = 64;
    healthStatusText = '▲ Critical Threat Cluster Active';
    healthColorClass = 'text-rose-500';
    healthBarClass = 'bg-rose-500';
  } else if (highThreatsCount > 0 || medThreatsCount > 3 || maxThreatScore >= 50) {
    healthPercent = 82;
    healthStatusText = '▲ Elevated Anomaly Alert';
    healthColorClass = 'text-amber-400';
    healthBarClass = 'bg-amber-500';
  }

  return (
    <div className="space-y-6">
      {/* Stitch Page Header & Dashboard Subnavigation Tabs */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border-muted pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">Dashboard</h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1 font-sans">SOC Operations & Telemetry Overview</p>
        </div>

        {/* Dashboard Subnavigation Tab Controls */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-dim border border-border-muted font-mono text-xs">
          <button
            onClick={() => setActiveSubTab('overview')}
            className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'overview'
                ? 'bg-primary text-surface-lowest shadow-md'
                : 'text-text-muted hover:text-text-primary hover:bg-surface-hover'
            }`}
          >
            <span className="material-symbols-outlined text-base">dashboard</span>
            <span>Overview</span>
          </button>

          <button
            id="add-data-log-tab-btn"
            onClick={() => setActiveSubTab('add-log')}
            className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'add-log'
                ? 'bg-primary text-surface-lowest shadow-md'
                : 'text-text-muted hover:text-text-primary hover:bg-surface-hover'
            }`}
          >
            <span className="material-symbols-outlined text-base">cloud_upload</span>
            <span>Add Data Log</span>
          </button>

          <button
            id="saved-reports-tab-btn"
            onClick={() => setActiveSubTab('reports')}
            className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'reports'
                ? 'bg-primary text-surface-lowest shadow-md'
                : 'text-text-muted hover:text-text-primary hover:bg-surface-hover'
            }`}
          >
            <span className="material-symbols-outlined text-base">description</span>
            <span>Saved Reports ({savedReports.length})</span>
          </button>
        </div>
      </header>

      {/* SUBPAGE 1: OVERVIEW (Default Dashboard View) */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-200">
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
                {stats.threat_level_counts?.HIGH ?? 0}
              </div>
              <div className="mt-2 flex items-center text-[11px] font-mono text-text-muted">
                <span className="text-rose-500 mr-1 flex items-center font-bold">
                  <span className="material-symbols-outlined text-xs">warning</span> High Severity
                </span>
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
                {stats.total_events_ingested > 0 ? stats.total_events_ingested.toLocaleString() : '0'}
              </div>
              <div className="mt-2 flex items-center text-[11px] font-mono text-text-muted">
                <span className="text-emerald-400 mr-1 flex items-center font-bold">
                  <span className="material-symbols-outlined text-xs">check_circle</span> Ingested Events
                </span>
              </div>
            </div>

            {/* KPI 3: Threat-Driven System Health (ISSUE 6) */}
            <div className="glass-panel rounded-xl p-5 relative overflow-hidden pl-5 group transition-all duration-300">
              <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${healthBarClass}`}></div>
              <h3 className="text-xs font-mono font-bold text-text-muted mb-1 flex items-center gap-1.5 uppercase tracking-wider">
                <span className={`material-symbols-outlined text-sm ${healthColorClass}`}>health_and_safety</span>
                System Health
              </h3>
              <div className={`text-3xl font-extrabold font-mono ${healthColorClass}`}>
                {healthPercent}%
              </div>
              <div className="mt-2 flex items-center text-[11px] font-mono text-text-muted">
                <span className={`mr-1 font-bold ${healthColorClass}`}>{healthStatusText}</span>
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
                  {topIncident ? 'Critical Alert' : 'Nominal Baseline'}
                </span>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
                <div className="bg-rose-500/10 border-l-4 border-rose-500 p-5 rounded-r-xl space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-rose-500 text-2xl mt-0.5">flip_camera_ios</span>
                    <div className="space-y-2 flex-1">
                      <h4 className="text-sm font-bold text-rose-400">
                        Anomaly Detection: {topIncident ? `Cluster #${topIncident.incident_id.substring(0, 8)}` : 'Telemetry Baseline Nominal'}
                      </h4>
                      <p className="text-xs text-text-primary leading-relaxed">
                        {topIncident ? (
                          <>
                            AI Copilot identified a rapid sequence of security anomaly attempts targeting{' '}
                            <code className="font-mono bg-surface px-2 py-0.5 rounded text-primary border border-border-muted">
                              {topIncident.source_ip}
                            </code>.
                          </>
                        ) : (
                          'No critical threat clusters currently active. System telemetry operations are nominal.'
                        )}
                      </p>

                      <div className="grid grid-cols-2 gap-2 pt-2 font-mono text-xs text-text-muted">
                        <div>Target: <span className="text-text-primary font-bold">{topIncident ? topIncident.source_ip : 'None'}</span></div>
                        <div>Confidence: <span className="text-rose-400 font-bold">{topIncident ? `${topIncident.max_threat_score.toFixed(1)}%` : 'N/A'}</span></div>
                        <div>Vector: <span className="text-text-primary font-bold">{topIncident?.mitre_tactics?.[0] || 'Nominal'}</span></div>
                        <div>Status: <span className="text-text-primary font-bold">{topIncident ? 'Active Alert' : 'Healthy'}</span></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 justify-end pt-2 border-t border-border-muted/50">
                  <button
                    onClick={() => setActiveSubTab('add-log')}
                    className="btn-primary px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-sm">cloud_upload</span>
                    <span>Ingest New Data Log</span>
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
                            [{evt.event_type ? evt.event_type.toUpperCase() : 'TELEMETRY'}]
                          </span>
                          <span className="text-text-primary">
                            src={evt.source_ip || 'N/A'} target={evt.target_host || 'Host'} msg="{evt.mitre_tactic || evt.original_event || 'Normalized Event'}"
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </div>

          {/* Correlated Security Incidents Section */}
          <div className="space-y-4 pt-4">
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
        </div>
      )}

      {/* SUBPAGE 2: ADD DATA LOG (Dedicated Log Ingestion Studio Subpage) */}
      {activeSubTab === 'add-log' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="glass-panel p-6 rounded-2xl border border-border-muted space-y-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-border-muted pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary border border-primary/30 flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">cloud_upload</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-text-primary">Add Data Log & Ingestion Workbench</h2>
                  <p className="text-xs text-text-muted">
                    Upload log file archives or ingest raw log streams into the sovereign zero-loss telemetry pipeline
                  </p>
                </div>
              </div>
            </div>

            {/* Ingestion Status / Notification Box */}
            {uploadStatus && (
              <div className="p-4 rounded-xl bg-surface-dim border border-border-muted text-xs font-mono text-primary flex items-center gap-3 animate-in fade-in">
                <span className="material-symbols-outlined text-xl text-primary">info</span>
                <span>{uploadStatus}</span>
              </div>
            )}

            {/* Real Backend Ingestion Confirmation Result Box */}
            {ingestionResult && (
              <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 font-mono text-xs space-y-3 animate-in zoom-in-95">
                <div className="flex justify-between items-center text-emerald-400 font-bold text-sm">
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">check_circle</span>
                    <span>Log Payload Successfully Ingested & Persisted!</span>
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/40 uppercase">
                    {ingestionResult.status || 'SUCCESS'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-surface-lowest border border-border-muted text-[11px]">
                  <div>
                    <span className="text-text-muted">Ingestion Tracking ID:</span>{' '}
                    <strong className="text-primary font-bold">{(ingestionResult.ingestion_id || 'id').substring(0, 16)}...</strong>
                  </div>
                  <div>
                    <span className="text-text-muted">Events Processed:</span>{' '}
                    <strong className="text-emerald-400 font-bold">{ingestionResult.events_processed || 1}</strong>
                  </div>
                  <div>
                    <span className="text-text-muted">Payload SHA-256 Hash:</span>{' '}
                    <strong className="text-text-primary">{(ingestionResult.payload_hash || 'hash').substring(0, 16)}...</strong>
                  </div>
                  <div>
                    <span className="text-text-muted">Merkle Root Hash:</span>{' '}
                    <strong className="text-text-primary">{(ingestionResult.merkle_root || 'root').substring(0, 16)}...</strong>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => {
                      setIngestionResult(null);
                      setUploadStatus('');
                    }}
                    className="btn-secondary px-4 py-1.5 rounded-lg text-xs font-bold"
                  >
                    Clear & Ingest Another
                  </button>

                  <button
                    onClick={() => navigate('/log-explorer')}
                    className="btn-primary px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5"
                  >
                    <span>View in Log Explorer</span>
                    <span className="material-symbols-outlined text-xs">arrow_forward</span>
                  </button>
                </div>
              </div>
            )}

            {/* Ingestion Section 1: File Log Upload */}
            <div className="space-y-3 p-5 rounded-2xl bg-surface-dim border border-border-muted">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-mono font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-sm">upload_file</span>
                  <span>Option A: Upload Log File Archive (.log, .txt, .csv, .json)</span>
                </h3>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".log,.csv,.txt,.json"
                  className="input-cyber flex-1 p-2 text-xs font-mono rounded-xl bg-surface border-border-muted file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-primary/20 file:text-primary hover:file:bg-primary/30"
                />

                <button
                  onClick={handleFileUpload}
                  disabled={!selectedFile || isSubmitting}
                  className="btn-primary px-6 py-2.5 rounded-xl text-xs font-bold disabled:opacity-40 flex items-center gap-2 shadow-md w-full sm:w-auto justify-center"
                >
                  <span className="material-symbols-outlined text-base">cloud_upload</span>
                  <span>{isSubmitting ? 'Ingesting...' : 'Ingest Log File'}</span>
                </button>
              </div>
              {selectedFile && (
                <div className="text-[11px] font-mono text-text-muted">
                  Selected File: <strong className="text-text-primary">{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(1)} KB)
                </div>
              )}
            </div>

            {/* Ingestion Section 2: Raw Payload Paste Studio */}
            <div className="space-y-3 p-5 rounded-2xl bg-surface-dim border border-border-muted">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <h3 className="text-xs font-mono font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-sm">terminal</span>
                  <span>Option B: Paste Raw Log Payload Text</span>
                </h3>

                <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                  <span className="text-text-muted text-[10px]">Quick Presets:</span>
                  <button
                    onClick={() => setCustomPayloadText(PRESET_PAYLOADS.cisco)}
                    className="px-2 py-0.5 rounded bg-surface border border-border-muted hover:border-primary text-[10px] text-text-muted hover:text-text-primary"
                  >
                    + Cisco ASA Deny
                  </button>
                  <button
                    onClick={() => setCustomPayloadText(PRESET_PAYLOADS.fortinet)}
                    className="px-2 py-0.5 rounded bg-surface border border-border-muted hover:border-primary text-[10px] text-text-muted hover:text-text-primary"
                  >
                    + Fortinet UTM Virus
                  </button>
                  <button
                    onClick={() => setCustomPayloadText(PRESET_PAYLOADS.suricata)}
                    className="px-2 py-0.5 rounded bg-surface border border-border-muted hover:border-primary text-[10px] text-text-muted hover:text-text-primary"
                  >
                    + Suricata SSH Scan
                  </button>
                  <button
                    onClick={() => setCustomPayloadText(PRESET_PAYLOADS.win_event)}
                    className="px-2 py-0.5 rounded bg-surface border border-border-muted hover:border-primary text-[10px] text-text-muted hover:text-text-primary"
                  >
                    + Win Event 4625
                  </button>
                </div>
              </div>

              <textarea
                rows={6}
                value={customPayloadText}
                onChange={(e) => setCustomPayloadText(e.target.value)}
                placeholder="Paste raw log lines here (%ASA-4-106023, Syslog, Suricata, Windows Event 4625, CEF, JSON)..."
                className="w-full input-cyber p-4 text-xs font-mono rounded-xl bg-surface border-border-muted leading-relaxed resize-none"
              />

              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
                <div className="flex items-center gap-2 text-xs font-mono w-full sm:w-auto">
                  <span className="text-text-muted">Format Override:</span>
                  <select
                    value={formatOverride}
                    onChange={(e) => setFormatOverride(e.target.value)}
                    className="input-cyber rounded-lg px-3 py-1.5 text-xs font-mono bg-surface border-border-muted"
                  >
                    <option value="">Auto-Detect Log Format</option>
                    <option value="cisco_asa">Cisco ASA Firewall</option>
                    <option value="fortinet">Fortinet UTM</option>
                    <option value="suricata">Suricata NIDS</option>
                    <option value="windows_event">Windows EventLog (XML)</option>
                    <option value="syslog">Syslog / Raw Text</option>
                    <option value="json">JSON / OCSF 1.1</option>
                  </select>
                </div>

                <div className="flex gap-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => setCustomPayloadText('')}
                    className="btn-secondary px-4 py-2 rounded-xl text-xs font-bold"
                  >
                    Clear Input
                  </button>

                  <button
                    onClick={handlePayloadSubmit}
                    disabled={!customPayloadText.trim() || isSubmitting}
                    className="btn-primary px-6 py-2.5 rounded-xl text-xs font-bold disabled:opacity-40 flex items-center gap-2 shadow-md"
                  >
                    <span className="material-symbols-outlined text-base">play_arrow</span>
                    <span>{isSubmitting ? 'Ingesting...' : 'Submit Payload'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBPAGE 3: SAVED REPORTS (USER-ISOLATED FEATURE - ISSUE 2) */}
      {activeSubTab === 'reports' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Create & Save Security Report Form */}
          <div className="glass-panel p-6 rounded-2xl border border-border-muted space-y-4 shadow-xl">
            <div className="flex items-center gap-3 border-b border-border-muted pb-3">
              <div className="w-9 h-9 rounded-lg bg-primary/15 text-primary border border-primary/30 flex items-center justify-center">
                <span className="material-symbols-outlined text-xl">bookmark_add</span>
              </div>
              <div>
                <h2 className="text-base font-bold text-text-primary">Save Current Telemetry Security Report</h2>
                <p className="text-xs text-text-muted">Persist custom security audit report snapshot bound to your user account</p>
              </div>
            </div>

            {reportMessage && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-emerald-400 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                <span>{reportMessage}</span>
              </div>
            )}

            <form onSubmit={handleSaveReportSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-text-muted mb-1 font-bold">Report Title:</label>
                <input
                  type="text"
                  name="reportTitle"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  placeholder="e.g. Q3 SOC Perimeter Security & Incident Audit"
                  className="input-cyber w-full rounded-xl py-2 px-3 text-xs font-mono bg-surface-dim border-border-muted"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-text-muted mb-1 font-bold">Summary / Observations:</label>
                <textarea
                  rows={3}
                  name="reportSummary"
                  value={reportSummary}
                  onChange={(e) => setReportSummary(e.target.value)}
                  placeholder="Executive summary of key threat scores, anomaly bursts, and containment actions..."
                  className="input-cyber w-full p-3 text-xs font-mono bg-surface-dim border-border-muted resize-none rounded-xl"
                />
              </div>

              <div className="flex justify-end">
                <button
                  id="save-report-submit-btn"
                  type="submit"
                  className="btn-primary px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">save</span>
                  <span>Save Report to Account</span>
                </button>
              </div>
            </form>
          </div>

          {/* User's Saved Reports List */}
          <div className="glass-panel p-6 rounded-2xl border border-border-muted space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-border-muted pb-3">
              <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">folder_special</span>
                <span>Your Saved Security Reports ({savedReports.length})</span>
              </h2>
              <span className="font-mono text-[10px] text-text-muted bg-surface px-2 py-0.5 rounded border border-border-muted">
                ISOLATED TO CURRENT USER
              </span>
            </div>

            {savedReports.length > 0 ? (
              <div className="space-y-3">
                {savedReports.map((rpt, idx) => (
                  <div
                    key={rpt.report_id || idx}
                    className="p-4 rounded-xl bg-surface-dim border border-border-muted space-y-2 font-mono text-xs hover:border-primary transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-sm text-text-primary">{rpt.title}</h3>
                      <span className="text-[10px] text-text-muted">
                        {(rpt.created_at || '').substring(0, 10)} UTC
                      </span>
                    </div>
                    <p className="text-[11px] text-text-muted leading-relaxed font-sans">{rpt.summary}</p>
                    {rpt.stats_snapshot && (
                      <div className="flex gap-3 pt-2 text-[10px] text-text-muted border-t border-border-muted/50">
                        <span>Total Events: <strong className="text-text-primary">{rpt.stats_snapshot.total_events_ingested || 0}</strong></span>
                        <span>High Threats: <strong className="text-rose-400">{rpt.stats_snapshot.threat_level_counts?.HIGH || 0}</strong></span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-text-muted font-mono text-xs">
                <span className="material-symbols-outlined text-3xl mb-2 text-text-muted">description</span>
                <p>No saved reports found for your account.</p>
                <p className="text-[10px] text-text-dim mt-1">Use the form above to save a custom security report.</p>
              </div>
            )}
          </div>
        </div>
      )}

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
