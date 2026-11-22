import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { SocThreatCharts } from '../components/dashboard/SocThreatCharts';
import { ForensicProcessOverlay } from '../components/common/SocLoaders';

export function DashboardPage({ pollingInterval }) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [activeSubTab, setActiveSubTab] = useState('overview'); // 'overview' | 'add-log' | 'reports'
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [syncLatencyMs, setSyncLatencyMs] = useState(null);
  const [streamSearch, setStreamSearch] = useState('');
  const [streamSeverityFilter, setStreamSeverityFilter] = useState('ALL');
  const [inspectedEvent, setInspectedEvent] = useState(null);
  const [stats, setStats] = useState({
    total_events_ingested: 0,
    threat_level_counts: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 },
    vendor_parser_counts: {},
  });
  const [incidents, setIncidents] = useState([]);
  const [recentEvents, setRecentEvents] = useState([]);
  const [savedReports, setSavedReports] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [incidentDetailEvents, setIncidentDetailEvents] = useState([]);

  // Live Syslog Sources & Receiver State
  const [sources, setSources] = useState([]);
  const [receiverStatus, setReceiverStatus] = useState(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [newSourceIp, setNewSourceIp] = useState('');
  const [newSourceDisplay, setNewSourceDisplay] = useState('');
  const [sourceFormError, setSourceFormError] = useState('');
  const [isSubmittingSource, setIsSubmittingSource] = useState(false);

  // Ingest API Keys State
  const [apiKeys, setApiKeys] = useState([]);
  const [isCreateKeyOpen, setIsCreateKeyOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [isSubmittingKey, setIsSubmittingKey] = useState(false);
  const [keyError, setKeyError] = useState('');
  const [newlyCreatedKey, setNewlyCreatedKey] = useState(null);
  const [keyCopied, setKeyCopied] = useState(false);
  
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
    const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
    try {
      const [statsData, incidentsData, eventsData, reportsData, sourcesData, receiverData, apiKeysData] = await Promise.all([
        api.getStats().catch(() => null),
        api.getIncidents(10).catch(() => null),
        api.getRecentEvents(50).catch(() => null),
        api.getSavedReports().catch(() => null),
        api.getSources().catch(() => []),
        api.getReceiverStatus().catch(() => null),
        api.getApiKeys().catch(() => []),
      ]);
      const t1 = typeof performance !== 'undefined' ? performance.now() : Date.now();
      setSyncLatencyMs(Math.max(1, Math.round(t1 - t0)));

      if (!statsData && !eventsData && !incidentsData) {
        setLoadError('Unable to reach SOC telemetry endpoints. Retrying automatically.');
      } else {
        setLoadError('');
      }

      if (statsData) setStats(statsData);
      if (incidentsData?.incidents) setIncidents(incidentsData.incidents);
      if (eventsData?.events) setRecentEvents(eventsData.events);
      if (reportsData?.reports) setSavedReports(reportsData.reports);
      if (Array.isArray(sourcesData)) setSources(sourcesData);
      if (receiverData) setReceiverStatus(receiverData);
      if (Array.isArray(apiKeysData)) setApiKeys(apiKeysData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setLoadError(err.message || 'Telemetry sync failed.');
    } finally {
      setIsInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const timer = setInterval(fetchDashboardData, pollingInterval || 2000);
    return () => clearInterval(timer);
  }, [pollingInterval]);

  const handleIncidentClick = (incident) => {
    const incId = incident.incident_id || incident.id || 'inc_a81b5b';
    navigate(`/forensics/investigation/${encodeURIComponent(incId)}`, { state: { incident } });
  };

  const handleIncidentStatusChange = async (incidentId, newStatus) => {
    try {
      await api.updateIncidentStatus(incidentId, newStatus);
      fetchDashboardData();
      if (selectedIncident && selectedIncident.incident_id === incidentId) {
        setSelectedIncident((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      showToast({
        variant: 'error',
        title: 'Status Update Failed',
        message: err.message || 'Could not update incident status.',
      });
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

  const handleCreateSource = async (e) => {
    if (e) e.preventDefault();
    if (!newSourceIp.trim()) return;
    setIsSubmittingSource(true);
    setSourceFormError('');
    try {
      await api.createSource(newSourceIp.trim(), newSourceDisplay.trim() || `Device-${newSourceIp.trim()}`);
      setNewSourceIp('');
      setNewSourceDisplay('');
      setIsRegisterModalOpen(false);
      fetchDashboardData();
    } catch (err) {
      setSourceFormError(err.message || 'Failed to register source');
    } finally {
      setIsSubmittingSource(false);
    }
  };

  const handleDeleteSource = async (sourceId) => {
    try {
      await api.deleteSource(sourceId);
      fetchDashboardData();
    } catch (err) {
      setSourceFormError(`Failed to delete source: ${err.message}`);
    }
  };

  const handleCreateApiKey = async (e) => {
    if (e) e.preventDefault();
    setIsSubmittingKey(true);
    setKeyError('');
    try {
      const res = await api.createApiKey(newKeyName.trim() || 'Edge Forwarder');
      setNewlyCreatedKey(res.api_key || res.raw_key);
      setNewKeyName('');
      setKeyCopied(false);
      fetchDashboardData();
    } catch (err) {
      setKeyError(err.message || 'Failed to create API key');
    } finally {
      setIsSubmittingKey(false);
    }
  };

  const handleRevokeApiKey = async (keyId) => {
    try {
      await api.revokeApiKey(keyId);
      fetchDashboardData();
    } catch (err) {
      setKeyError(`Failed to revoke key: ${err.message}`);
    }
  };

  const handleCopyKey = () => {
    if (!newlyCreatedKey) return;
    navigator.clipboard.writeText(newlyCreatedKey);
    setKeyCopied(true);
    setTimeout(() => setKeyCopied(false), 2500);
  };

  // Compute threat level metrics
  const critThreats = stats?.threat_level_counts?.CRITICAL || 0;
  const highThreats = stats?.threat_level_counts?.HIGH || 0;
  const medThreats = stats?.threat_level_counts?.MEDIUM || 0;
  const lowThreats = stats?.threat_level_counts?.LOW || 0;
  const totalIngested = stats?.total_events_ingested || 0;
  const activeIncidentCount = incidents.length;

  const isElevated = critThreats > 0 || highThreats > 0 || activeIncidentCount > 0;

  const filteredRecentEvents = useMemo(() => {
    const q = streamSearch.trim().toLowerCase();
    return recentEvents.filter((evt) => {
      const lvl = (evt.threat_level || 'LOW').toUpperCase();
      if (streamSeverityFilter !== 'ALL' && lvl !== streamSeverityFilter) return false;
      if (!q) return true;
      return (
        (evt.source_ip || '').toLowerCase().includes(q) ||
        (evt.event_type || '').toLowerCase().includes(q) ||
        (evt.mitre_tactic || '').toLowerCase().includes(q) ||
        (evt.raw_event_hash || '').toLowerCase().includes(q) ||
        (evt.original_event || '').toLowerCase().includes(q)
      );
    });
  }, [recentEvents, streamSearch, streamSeverityFilter]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <ForensicProcessOverlay
        isOpen={isSubmitting}
        title="FORENSIC LOG INGESTION"
        steps={[
          '01. RAW WIRE CAPTURE & BUFFER',
          '02. SHA-256 MERKLE LEAF SEAL',
          '03. OCSF NORMALIZATION & XAI SCORE',
        ]}
        activeStepIndex={1}
      />
      {loadError && (
        <div className="p-3.5 rounded-xl bg-[var(--color-severity-high-bg)] border border-[var(--color-severity-high-border)] text-[var(--color-severity-high)] font-mono text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base">warning</span>
            <span>{loadError}</span>
          </div>
          <button
            type="button"
            onClick={fetchDashboardData}
            className="px-3 py-1 rounded-lg bg-surface border border-[var(--color-severity-high-border)] font-bold hover:bg-surface-hover cursor-pointer"
          >
            Retry Now
          </button>
        </div>
      )}
      
      {/* Navigation SubTabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-muted pb-4">
        <div className="soc-segmented flex-wrap" role="tablist" aria-label="SOC Command Center Views">
          <button
            type="button"
            role="tab"
            aria-selected={activeSubTab === 'overview'}
            data-active={activeSubTab === 'overview'}
            onClick={() => setActiveSubTab('overview')}
            className="soc-segmented-item text-xs px-4 py-2"
          >
            COMMAND OVERVIEW
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeSubTab === 'add-log'}
            data-active={activeSubTab === 'add-log'}
            onClick={() => setActiveSubTab('add-log')}
            className="soc-segmented-item text-xs px-4 py-2"
          >
            INGEST TELEMETRY
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeSubTab === 'reports'}
            data-active={activeSubTab === 'reports'}
            onClick={() => setActiveSubTab('reports')}
            className="soc-segmented-item text-xs px-4 py-2"
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
                  <div className={`w-2.5 h-2.5 rounded-full ${isElevated ? 'bg-[var(--color-severity-high)] animate-ping' : 'bg-[var(--color-severity-low)] animate-pulse'}`}></div>
                  <span className="font-bold text-text-primary uppercase">
                    SYSTEM STATUS: {isInitialLoading ? 'SYNCING TELEMETRY...' : isElevated ? 'ELEVATED THREAT DETECTED' : 'NORMAL OPERATION'}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
                  Security Operations <span className="text-primary">Command Center</span>
                </h1>

                <p className="text-xs sm:text-sm text-text-muted leading-relaxed font-sans">
                  Real-time perimeter security posture monitoring, multi-vendor log ingestion, and automated Isolation Forest threat scoring across all registered tenant streams.
                </p>

                <div className="flex flex-wrap gap-4 font-mono text-xs pt-2">
                  <div className="p-3 rounded-xl bg-surface-dim border border-border-muted min-w-[140px]">
                    <span className="text-text-dim block text-[10px] uppercase">Total Ingested Events</span>
                    <span className="text-lg font-bold text-text-primary">
                      {isInitialLoading ? '—' : totalIngested.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-dim border border-border-muted min-w-[140px]">
                    <span className="text-text-dim block text-[10px] uppercase">Active Threat Clusters</span>
                    <span className={`text-lg font-bold ${activeIncidentCount > 0 ? 'text-[var(--color-severity-high)]' : 'text-[var(--color-severity-low)]'}`}>
                      {isInitialLoading ? '—' : activeIncidentCount}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-dim border border-border-muted min-w-[140px]">
                    <span className="text-text-dim block text-[10px] uppercase">API Sync RTT</span>
                    <span className="text-lg font-bold text-primary">
                      {syncLatencyMs != null ? `${syncLatencyMs} ms` : '—'}
                    </span>
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
                      <span className="text-[var(--color-severity-critical)] font-bold">CRITICAL SEVERITY</span>
                      <span className="text-text-primary font-bold">{critThreats}</span>
                    </div>
                    <div className="h-2 w-full bg-surface rounded-full overflow-hidden">
                      <div className="h-full bg-[var(--color-severity-critical)] rounded-full transition-all duration-300" style={{ width: `${totalIngested ? (critThreats / totalIngested) * 100 : 0}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-[var(--color-severity-high)] font-bold">HIGH SEVERITY</span>
                      <span className="text-text-primary font-bold">{highThreats}</span>
                    </div>
                    <div className="h-2 w-full bg-surface rounded-full overflow-hidden">
                      <div className="h-full bg-[var(--color-severity-high)] rounded-full transition-all duration-300" style={{ width: `${totalIngested ? (highThreats / totalIngested) * 100 : 0}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-[var(--color-severity-medium)] font-bold">MEDIUM SEVERITY</span>
                      <span className="text-text-primary font-bold">{medThreats}</span>
                    </div>
                    <div className="h-2 w-full bg-surface rounded-full overflow-hidden">
                      <div className="h-full bg-[var(--color-severity-medium)] rounded-full transition-all duration-300" style={{ width: `${totalIngested ? (medThreats / totalIngested) * 100 : 0}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-[var(--color-severity-low)] font-bold">LOW SEVERITY</span>
                      <span className="text-text-primary font-bold">{lowThreats}</span>
                    </div>
                    <div className="h-2 w-full bg-surface rounded-full overflow-hidden">
                      <div className="h-full bg-[var(--color-severity-low)] rounded-full transition-all duration-300" style={{ width: `${totalIngested ? (lowThreats / totalIngested) * 100 : 0}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* SECTION A.2: TELEMETRY SEVERITY VELOCITY & PARSER MIX CHARTS */}
          <SocThreatCharts
            recentEvents={recentEvents}
            vendorCounts={stats?.vendor_parser_counts}
            isLoading={isInitialLoading}
          />

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

          {/* SECTION: LIVE SOURCES & SYSLOG RECEIVER */}
          <div className="glass-panel rounded-2xl border border-border-muted shadow-xl overflow-hidden space-y-4">
            <div className="p-4 sm:p-5 border-b border-border-muted bg-surface-dim flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">router</span>
                  <h3 className="text-sm font-extrabold text-text-primary uppercase tracking-wider">Live Perimeter Sources & Syslog Daemon</h3>
                </div>
                <p className="text-xs text-text-muted mt-0.5">Continuous ingestion listener &amp; registered edge device telemetry streams.</p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="px-2.5 py-1 rounded bg-surface border border-border-muted font-mono text-[10px] text-primary font-bold">
                  TCP:{receiverStatus?.listening_ports?.tcp || 5514} // UDP:{receiverStatus?.listening_ports?.udp || 5514}
                </div>
                <button
                  onClick={() => setIsRegisterModalOpen(!isRegisterModalOpen)}
                  className="btn-primary px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 touch-target"
                >
                  <span className="material-symbols-outlined text-sm">{isRegisterModalOpen ? 'close' : 'add'}</span>
                  <span>{isRegisterModalOpen ? 'Cancel' : 'Register Source'}</span>
                </button>
              </div>
            </div>

            {/* Registration Drawer / Form */}
            {isRegisterModalOpen && (
              <form onSubmit={handleCreateSource} className="mx-4 sm:mx-5 p-4 rounded-xl bg-surface-dim border border-primary/30 space-y-3 font-mono text-xs animate-in fade-in duration-200">
                <div className="flex justify-between items-center text-[11px] font-bold text-text-primary border-b border-border-muted pb-2">
                  <span>Register Allowed Perimeter IP</span>
                  <button
                    type="button"
                    onClick={() => { setNewSourceIp('127.0.0.1'); setNewSourceDisplay('Local Replay Sensor'); }}
                    className="text-[10px] text-primary hover:underline"
                  >
                    + Quick Fill Localhost (127.0.0.1)
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-text-muted uppercase mb-1">Source IP Address:</label>
                    <input
                      type="text"
                      placeholder="e.g. 192.168.1.10 or 127.0.0.1"
                      value={newSourceIp}
                      onChange={(e) => setNewSourceIp(e.target.value)}
                      className="w-full p-2 rounded-lg bg-surface border border-border-muted text-text-primary focus:outline-none focus:border-primary text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-text-muted uppercase mb-1">Display Label:</label>
                    <input
                      type="text"
                      placeholder="e.g. Branch-Firewall-ASA"
                      value={newSourceDisplay}
                      onChange={(e) => setNewSourceDisplay(e.target.value)}
                      className="w-full p-2 rounded-lg bg-surface border border-border-muted text-text-primary focus:outline-none focus:border-primary text-xs"
                    />
                  </div>
                </div>
                {sourceFormError && (
                  <div className="text-rose-400 text-[11px] font-bold">{sourceFormError}</div>
                )}
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={isSubmittingSource}
                    className="btn-primary px-4 py-1.5 rounded-lg text-xs font-bold disabled:opacity-60"
                  >
                    {isSubmittingSource ? 'Saving...' : 'Authorize Source IP'}
                  </button>
                </div>
              </form>
            )}

            {/* Receiver Real-Time Metrics Ribbon */}
            <div className="px-4 sm:px-5 grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-surface-dim border border-border-muted">
                <div className="text-[10px] text-text-muted uppercase">Total Received</div>
                <div className="text-base font-bold text-text-primary mt-0.5">{receiverStatus?.total_received || 0}</div>
              </div>
              <div className="p-3 rounded-xl bg-surface-dim border border-border-muted">
                <div className="text-[10px] text-emerald-400 uppercase">Accepted &amp; Enqueued</div>
                <div className="text-base font-bold text-emerald-400 mt-0.5">{receiverStatus?.accepted || 0}</div>
              </div>
              <div className="p-3 rounded-xl bg-surface-dim border border-border-muted">
                <div className="text-[10px] text-[var(--color-severity-medium)] uppercase">Dropped (Unregistered)</div>
                <div className="text-base font-bold text-[var(--color-severity-medium)] mt-0.5">{receiverStatus?.dropped_unregistered || 0}</div>
              </div>
              <div className="p-3 rounded-xl bg-surface-dim border border-border-muted">
                <div className="text-[10px] text-rose-400 uppercase">Dropped (Oversize/Queue)</div>
                <div className="text-base font-bold text-rose-400 mt-0.5">{(receiverStatus?.dropped_queue_full || 0) + (receiverStatus?.dropped_oversize || 0)}</div>
              </div>
            </div>

            {/* Registered Sources Table */}
            <div className="p-4 sm:p-5 pt-0 overflow-x-auto">
              {sources.length > 0 ? (
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border-muted text-text-muted text-[10px] uppercase">
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Device Label</th>
                      <th className="py-2.5 px-3">Registered IP</th>
                      <th className="py-2.5 px-3">Last Packet</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-muted">
                    {sources.map((src) => {
                      const lastMsg = receiverStatus?.last_message_time_by_source?.[src.source_ip];
                      const isLive = lastMsg && (Date.now() - new Date(lastMsg).getTime() < 60000);
                      return (
                        <tr key={src.id} className="hover:bg-surface-hover transition-colors">
                          <td className="py-2.5 px-3">
                            {isLive ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                LIVE
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface border border-border-muted text-text-muted">
                                <span className="w-1.5 h-1.5 rounded-full bg-text-dim"></span>
                                IDLE
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-text-primary">{src.display_name}</td>
                          <td className="py-2.5 px-3 text-primary">{src.source_ip}</td>
                          <td className="py-2.5 px-3 text-text-muted text-[11px]">
                            {lastMsg ? new Date(lastMsg).toLocaleTimeString() : 'No packets yet'}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => handleDeleteSource(src.id)}
                              className="text-text-muted hover:text-rose-400 p-1 transition-colors"
                              title="Delete Source"
                            >
                              <span className="material-symbols-outlined text-sm">delete</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="p-6 text-center text-text-muted font-mono text-xs border border-dashed border-border-muted rounded-xl">
                  No perimeter log sources currently registered. Click &quot;Register Source&quot; to authorize an IP address for live syslog streaming.
                </div>
              )}
            </div>
          </div>

          {/* SECTION C.2: AGENT INGEST API KEYS */}
          <div className="glass-panel rounded-2xl border border-border-muted shadow-xl overflow-hidden space-y-4">
            <div className="p-4 sm:p-5 border-b border-border-muted bg-surface-dim flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">key</span>
                  <h3 className="text-sm font-extrabold text-text-primary uppercase tracking-wider">Agent Ingest API Keys</h3>
                </div>
                <p className="text-xs text-text-muted mt-0.5">Headless authentication keys for the edge forwarder, device simulator, and programmatic log ingestion.</p>
              </div>

              <button
                onClick={() => { setIsCreateKeyOpen(!isCreateKeyOpen); setNewlyCreatedKey(null); }}
                className="btn-primary px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 touch-target"
              >
                <span className="material-symbols-outlined text-sm">{isCreateKeyOpen ? 'close' : 'add'}</span>
                <span>{isCreateKeyOpen ? 'Cancel' : 'Create API Key'}</span>
              </button>
            </div>

            {/* Newly Created Key Alert (Shown ONCE with Copy Button) */}
            {newlyCreatedKey && (
              <div className="mx-4 sm:mx-5 p-4 rounded-xl bg-[var(--color-status-info-bg)] border border-[var(--color-status-info-border)] space-y-3 font-mono text-xs animate-in fade-in duration-200">
                <div className="flex items-center gap-2 text-[var(--color-status-info)] font-bold text-xs uppercase tracking-wider">
                  <span className="material-symbols-outlined text-base">info</span>
                  <span>Copy Your Secret Key Now</span>
                </div>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  For your security, this key is only displayed <strong className="text-[var(--color-status-info)]">ONCE</strong> and will never be shown again. Store it securely in your environment variables or forwarder config.
                </p>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-surface p-2.5 rounded-lg border border-border-muted">
                  <code className="flex-1 font-mono text-xs text-primary font-bold break-all select-all">
                    {newlyCreatedKey}
                  </code>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyKey}
                      className="btn-primary px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 shrink-0"
                    >
                      <span className="material-symbols-outlined text-xs">{keyCopied ? 'check' : 'content_copy'}</span>
                      <span>{keyCopied ? 'Copied!' : 'Copy Key'}</span>
                    </button>
                    <button
                      onClick={() => setNewlyCreatedKey(null)}
                      className="px-3 py-1.5 rounded-lg bg-surface-dim border border-border-muted text-text-muted hover:text-text-primary text-xs font-bold shrink-0"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Key Creation Form */}
            {isCreateKeyOpen && !newlyCreatedKey && (
              <form onSubmit={handleCreateApiKey} className="mx-4 sm:mx-5 p-4 rounded-xl bg-surface-dim border border-primary/30 space-y-3 font-mono text-xs animate-in fade-in duration-200">
                <div className="flex justify-between items-center text-[11px] font-bold text-text-primary border-b border-border-muted pb-2">
                  <span>Generate New Agent Ingest Key</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setNewKeyName('Edge Syslog Forwarder')}
                      className="text-[10px] text-primary hover:underline"
                    >
                      + Forwarder
                    </button>
                    <span className="text-border-muted">|</span>
                    <button
                      type="button"
                      onClick={() => setNewKeyName('Device Simulator')}
                      className="text-[10px] text-primary hover:underline"
                    >
                      + Simulator
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-text-muted uppercase mb-1">Key Description / Name:</label>
                  <input
                    type="text"
                    placeholder="e.g. Branch-Forwarder-01 or Demo Simulator"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="w-full p-2 rounded-lg bg-surface border border-border-muted text-text-primary focus:outline-none focus:border-primary text-xs"
                    required
                  />
                </div>
                {keyError && (
                  <div className="text-rose-400 text-[11px] font-bold">{keyError}</div>
                )}
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={isSubmittingKey}
                    className="btn-primary px-4 py-1.5 rounded-lg text-xs font-bold disabled:opacity-60"
                  >
                    {isSubmittingKey ? 'Generating...' : 'Generate Key'}
                  </button>
                </div>
              </form>
            )}

            {/* Registered API Keys Table */}
            <div className="p-4 sm:p-5 pt-0 overflow-x-auto">
              {apiKeys.length > 0 ? (
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border-muted text-text-muted text-[10px] uppercase">
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Key Name</th>
                      <th className="py-2.5 px-3">Prefix</th>
                      <th className="py-2.5 px-3">Created</th>
                      <th className="py-2.5 px-3">Last Used</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-muted">
                    {apiKeys.map((k) => (
                      <tr key={k.id} className="hover:bg-surface-hover transition-colors">
                        <td className="py-2.5 px-3">
                          {!k.revoked ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                              ACTIVE
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface border border-border-muted text-text-muted">
                              REVOKED
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-text-primary">{k.name}</td>
                        <td className="py-2.5 px-3 text-primary">{k.display_prefix}...</td>
                        <td className="py-2.5 px-3 text-text-muted text-[11px]">
                          {k.created_at ? new Date(k.created_at).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-2.5 px-3 text-text-muted text-[11px]">
                          {k.last_used_at ? new Date(k.last_used_at).toLocaleTimeString() : 'Never used'}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {!k.revoked ? (
                            <button
                              onClick={() => handleRevokeApiKey(k.id)}
                              className="px-2.5 py-1 rounded text-[10px] font-bold text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-colors"
                              title="Revoke Key"
                            >
                              Revoke
                            </button>
                          ) : (
                            <span className="text-[10px] text-text-muted font-bold">Revoked</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-6 text-center text-text-muted font-mono text-xs border border-dashed border-border-muted rounded-xl">
                  No Ingest API keys generated yet. Click &quot;Create API Key&quot; to authorize an external forwarder or simulator.
                </div>
              )}
            </div>
          </div>

          {/* SECTION D: RECENT TELEMETRY TABLE */}
          <div className="glass-panel rounded-2xl border border-border-muted shadow-xl overflow-hidden space-y-4">
            <div className="p-4 sm:p-5 border-b border-border-muted bg-surface-dim flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
              <div>
                <h3 className="text-sm font-extrabold text-text-primary uppercase tracking-wider">Perimeter Telemetry Stream</h3>
                <p className="text-xs text-text-muted mt-0.5">Live edge network log ingestion stream. Click any row to inspect XAI attribution and SHA-256 Merkle proof inline.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                <input
                  type="text"
                  value={streamSearch}
                  onChange={(e) => setStreamSearch(e.target.value)}
                  placeholder="Filter IP, vendor, MITRE..."
                  aria-label="Filter telemetry stream"
                  className="flex-1 sm:w-52 px-3 py-1.5 rounded-xl bg-surface border border-border-muted font-mono text-xs text-text-primary focus:outline-none focus:border-primary"
                />
                <div className="soc-segmented" role="group" aria-label="Filter stream by severity">
                  {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      data-active={streamSeverityFilter === lvl}
                      onClick={() => setStreamSeverityFilter(lvl)}
                      className="soc-segmented-item text-[10px] !py-1 !px-2.5"
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/log-explorer')}
                  className="btn-secondary px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 touch-target"
                >
                  <span>Log Explorer</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            </div>

            <div className="p-3 sm:p-5">
              {isInitialLoading ? (
                <div className="space-y-2.5 animate-pulse">
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className="h-12 rounded-xl bg-surface-dim border border-border-muted" />
                  ))}
                </div>
              ) : filteredRecentEvents.length > 0 ? (
                <>
                  {/* Mobile Card Layout (No Horizontal Table Scroll) */}
                  <div className="md:hidden space-y-3 font-mono text-xs">
                    {filteredRecentEvents.slice(0, 12).map((evt, idx) => {
                      const deviceVendor = evt.event_type ? evt.event_type.split(':')[0].toUpperCase() : 'UNKNOWN';
                      const actionTag = (evt.event_type || '').includes('permit') || (evt.event_type || '').includes('pass') ? 'PERMIT' : 'DENY';
                      const isInspected = inspectedEvent && (inspectedEvent.raw_event_hash || inspectedEvent.id) === (evt.raw_event_hash || evt.id);
                      const evtLevel = (evt.threat_level || 'LOW').toUpperCase();
                      return (
                        <div
                          key={`m_${evt.raw_event_hash || 'evt'}_${idx}`}
                          className={`p-3.5 rounded-xl border transition-colors space-y-2.5 ${
                            isInspected ? 'bg-primary/10 border-primary/50' : 'bg-surface-dim border-border-muted'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="px-2 py-0.5 rounded bg-surface border border-border-muted text-[10px] text-primary font-bold truncate">
                              {deviceVendor}
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                evtLevel === 'CRITICAL' ? 'bg-[var(--color-severity-critical-bg)] text-[var(--color-severity-critical)] border-[var(--color-severity-critical-border)]' :
                                evtLevel === 'HIGH' ? 'bg-[var(--color-severity-high-bg)] text-[var(--color-severity-high)] border-[var(--color-severity-high-border)]' :
                                evtLevel === 'MEDIUM' ? 'bg-[var(--color-severity-medium-bg)] text-[var(--color-severity-medium)] border-[var(--color-severity-medium-border)]' :
                                'bg-[var(--color-severity-low-bg)] text-[var(--color-severity-low)] border-[var(--color-severity-low-border)]'
                              }`}>
                                {evtLevel}
                              </span>
                              <span className="text-[11px] font-bold text-text-primary">
                                {Number(evt.threat_score ?? 0).toFixed(1)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2 text-[11px]">
                            <span className="font-bold text-text-primary truncate">{evt.source_ip || 'Local Host'}</span>
                            <span className="text-text-dim shrink-0">{actionTag}</span>
                          </div>

                          <div className="text-[10px] text-text-muted truncate">{evt.timestamp || '—'}</div>

                          <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-border-muted/60">
                            <button
                              type="button"
                              onClick={() => setInspectedEvent(isInspected ? null : evt)}
                              className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                            >
                              {isInspected ? 'Hide XAI ▲' : 'Inspect XAI ▼'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const streamId = evt.id || evt.raw_event_hash || evt.source_ip || `stream_${idx}`;
                                navigate(`/stream/${encodeURIComponent(streamId)}`, { state: { event: evt } });
                              }}
                              className="btn-secondary px-2.5 py-1 rounded text-[10px] font-bold"
                            >
                              Stream &rarr;
                            </button>
                          </div>

                          {isInspected && (
                            <div className="pt-2 border-t border-primary/30 space-y-2 text-[11px]">
                              <p className="font-sans text-xs text-text-primary leading-relaxed bg-surface p-2.5 rounded-lg border border-border-muted break-words">
                                {evt.explanation || evt.xai_explanation || 'Evaluated against baseline normal telemetry features.'}
                              </p>
                              <pre className="p-2.5 rounded-lg bg-surface border border-border-muted text-[10px] text-text-muted overflow-x-auto whitespace-pre-wrap break-all max-h-28">
                                {evt.original_event || JSON.stringify(evt, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Desktop Table Layout */}
                  <div className="hidden md:block overflow-x-auto custom-scrollbar-touch">
                    <table className="w-full text-left font-mono text-xs border-collapse min-w-[650px]">
                  <thead>
                    <tr className="border-b border-border-muted text-text-muted text-[10px] uppercase">
                      <th className="py-2.5 px-3">Timestamp</th>
                      <th className="py-2.5 px-3">Perimeter Device</th>
                      <th className="py-2.5 px-3">Source IP</th>
                      <th className="py-2.5 px-3">Ingest Action</th>
                      <th className="py-2.5 px-3">Severity</th>
                      <th className="py-2.5 px-3">Threat Score</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-muted">
                    {filteredRecentEvents.slice(0, 12).map((evt, idx) => {
                      const deviceVendor = evt.event_type ? evt.event_type.split(':')[0].toUpperCase() : 'UNKNOWN';
                      const actionTag = (evt.event_type || '').includes('permit') || (evt.event_type || '').includes('pass') ? 'PERMIT' : 'DENY';
                      const isInspected = inspectedEvent && (inspectedEvent.raw_event_hash || inspectedEvent.id) === (evt.raw_event_hash || evt.id);
                      const evtLevel = (evt.threat_level || 'LOW').toUpperCase();
                      return (
                        <React.Fragment key={`${evt.raw_event_hash || 'evt'}_${idx}`}>
                          <tr
                            onClick={() => setInspectedEvent(isInspected ? null : evt)}
                            className={`transition-colors cursor-pointer ${
                              isInspected ? 'bg-primary/10' : 'hover:bg-surface-hover'
                            }`}
                          >
                            <td className="py-2.5 px-3 text-text-muted text-[11px] whitespace-nowrap">
                              {evt.timestamp || '—'}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-text-primary whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded bg-surface border border-border-muted text-[10px] text-primary">
                                {deviceVendor}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-bold text-text-primary whitespace-nowrap">
                              {evt.source_ip || 'Local Host'}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                actionTag === 'DENY'
                                  ? 'bg-[var(--color-severity-high-bg)] text-[var(--color-severity-high)] border-[var(--color-severity-high-border)]'
                                  : 'bg-[var(--color-severity-low-bg)] text-[var(--color-severity-low)] border-[var(--color-severity-low-border)]'
                              }`}>
                                {actionTag}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                evtLevel === 'CRITICAL' ? 'bg-[var(--color-severity-critical-bg)] text-[var(--color-severity-critical)] border-[var(--color-severity-critical-border)]' :
                                evtLevel === 'HIGH' ? 'bg-[var(--color-severity-high-bg)] text-[var(--color-severity-high)] border-[var(--color-severity-high-border)]' :
                                evtLevel === 'MEDIUM' ? 'bg-[var(--color-severity-medium-bg)] text-[var(--color-severity-medium)] border-[var(--color-severity-medium-border)]' :
                                'bg-[var(--color-severity-low-bg)] text-[var(--color-severity-low)] border-[var(--color-severity-low-border)]'
                              }`}>
                                {evtLevel}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-bold text-text-primary whitespace-nowrap">
                              {Number(evt.threat_score ?? 0).toFixed(1)}
                            </td>
                            <td className="py-2.5 px-3 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const streamId = evt.id || evt.raw_event_hash || evt.source_ip || `stream_${idx}`;
                                  navigate(`/stream/${encodeURIComponent(streamId)}`, { state: { event: evt } });
                                }}
                                className="btn-secondary px-3 py-1.5 rounded text-[10px] font-bold touch-target inline-flex items-center gap-1"
                              >
                                <span>Inspect Stream</span>
                                <span className="material-symbols-outlined text-xs">arrow_forward</span>
                              </button>
                            </td>
                          </tr>
                          {isInspected && (
                            <tr className="bg-surface-dim">
                              <td colSpan={7} className="p-4 border-t border-primary/30">
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 text-xs font-mono">
                                  <div className="lg:col-span-6 space-y-2">
                                    <div className="text-[10px] font-bold uppercase text-primary">
                                      XAI Threat Attribution &amp; Reasoning
                                    </div>
                                    <p className="font-sans text-xs text-text-primary leading-relaxed bg-surface p-3 rounded-xl border border-border-muted">
                                      {evt.explanation || evt.xai_explanation || 'Evaluated against baseline normal telemetry features (ip_freq, ip_deny, action_code, sev_code, hour).'}
                                    </p>
                                    {evt.raw_event_hash && (
                                      <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-surface border border-border-muted text-[11px]">
                                        <span className="text-text-dim shrink-0">SHA-256 MERKLE:</span>
                                        <span className="text-tertiary truncate">{evt.raw_event_hash}</span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            navigator.clipboard?.writeText(evt.raw_event_hash);
                                            showToast({ variant: 'success', title: 'Copied', message: 'Merkle leaf hash copied.' });
                                          }}
                                          className="px-2 py-0.5 rounded bg-surface-dim border border-border-muted text-primary font-bold shrink-0 cursor-pointer"
                                        >
                                          Copy
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                  <div className="lg:col-span-6 space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-bold uppercase text-secondary">Raw Forensic Payload</span>
                                      <div className="flex items-center gap-2">
                                        {evt.source_ip && (
                                          <button
                                            type="button"
                                            onClick={() => setStreamSearch(evt.source_ip)}
                                            className="text-[10px] text-primary hover:underline cursor-pointer"
                                          >
                                            Filter IP: {evt.source_ip}
                                          </button>
                                        )}
                                        {evt.raw_event_hash && (
                                          <button
                                            type="button"
                                            onClick={() => navigate(`/events/${encodeURIComponent(evt.raw_event_hash)}`, { state: { event: evt } })}
                                            className="text-[10px] px-2 py-0.5 rounded bg-primary text-surface-lowest font-bold cursor-pointer"
                                          >
                                            Full Event Detail &rarr;
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                    <pre className="p-3 rounded-xl bg-surface border border-border-muted text-[11px] text-text-muted overflow-x-auto whitespace-pre-wrap break-all max-h-32">
                                      {evt.original_event || JSON.stringify(evt, null, 2)}
                                    </pre>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="p-8 text-center text-text-muted font-mono text-xs border border-dashed border-border-muted rounded-xl">
                  {recentEvents.length > 0
                    ? 'No telemetry events match your current search or severity filter.'
                    : 'Awaiting telemetry stream events...'}
                </div>
              )}
            </div>
          </div>

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
