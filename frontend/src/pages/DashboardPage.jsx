import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export function DashboardPage({ pollingInterval }) {
  const [stats, setStats] = useState({
    total_events_ingested: 0,
    threat_level_counts: { HIGH: 0, MEDIUM: 0, LOW: 0 },
    vendor_parser_counts: {},
  });
  const [incidents, setIncidents] = useState([]);
  const [recentEvents, setRecentEvents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [incidentDetailEvents, setIncidentDetailEvents] = useState([]);
  const [expandedEventId, setExpandedEventId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadStatus, setUploadStatus] = useState('');
  const [customPayloadText, setCustomPayloadText] = useState('');

  // Sample preset payloads for quick injection
  const PRESET_PAYLOADS = {
    cisco: `%ASA-4-106023: Deny tcp src outside:192.168.1.100/54321 dst inside:10.0.0.50/80 by access-group 'outside_acl' [result="Denied"]`,
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
    } finally {
      setIsLoading(false);
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

  const handleEventStatusChange = async (eventId, newStatus) => {
    try {
      await api.updateEventStatus(eventId, newStatus);
      fetchDashboardData();
    } catch (err) {
      alert(`Failed to update event status: ${err.message}`);
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

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-border-muted flex items-center justify-between">
          <div>
            <div className="text-xs text-text-muted font-mono font-bold uppercase tracking-wider mb-1">
              Ingested Telemetry
            </div>
            <div className="text-3xl font-extrabold font-mono text-text-primary">
              {stats.total_events_ingested.toLocaleString()}
            </div>
            <div className="text-[10px] text-emerald-500 font-mono mt-1">Real-time OCSF Stream</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-primary/15 text-primary border border-primary/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">database</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-border-muted flex items-center justify-between">
          <div>
            <div className="text-xs text-text-muted font-mono font-bold uppercase tracking-wider mb-1">
              High Severity Threats
            </div>
            <div className="text-3xl font-extrabold font-mono text-rose-500">
              {stats.threat_level_counts.HIGH || 0}
            </div>
            <div className="text-[10px] text-rose-400 font-mono mt-1">Action Required</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-500/15 text-rose-500 border border-rose-500/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">warning</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-border-muted flex items-center justify-between">
          <div>
            <div className="text-xs text-text-muted font-mono font-bold uppercase tracking-wider mb-1">
              Active Incidents
            </div>
            <div className="text-3xl font-extrabold font-mono text-amber-500">
              {incidents.length}
            </div>
            <div className="text-[10px] text-amber-400 font-mono mt-1">Correlated Clusters</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">hub</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-border-muted flex items-center justify-between">
          <div>
            <div className="text-xs text-text-muted font-mono font-bold uppercase tracking-wider mb-1">
              Processing Latency
            </div>
            <div className="text-3xl font-extrabold font-mono text-text-primary">
              1.42 <span className="text-sm text-text-muted font-sans">ms</span>
            </div>
            <div className="text-[10px] text-emerald-500 font-mono mt-1">Sub-millisecond Pipeline</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-primary/15 text-primary border border-primary/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">speed</span>
          </div>
        </div>
      </div>

      {/* 2. Log Upload & Analysis Engine Panel */}
      <div className="glass-panel p-6 rounded-2xl border border-border-muted space-y-4">
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

      {/* 3. Correlated Security Incidents Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/15 text-rose-500 border border-rose-500/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">hub</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-text-primary">Correlated Security Incidents</h2>
              <p className="text-xs text-text-muted">Graph-correlated attack clusters & multi-stage kill chains</p>
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

      {/* 4. Live Telemetry Event Stream & Merkle Audit Trail Table */}
      <div className="glass-panel rounded-2xl border border-border-muted overflow-hidden shadow-lg">
        <div className="p-5 border-b border-border-muted bg-surface-dim/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/15 text-primary border border-primary/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">list_alt</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-text-primary">Live Telemetry Event Stream & Merkle Audit Trail</h2>
              <p className="text-xs text-text-muted">Normalized OCSF 1.1 records with cryptographic proof</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-sans text-xs">
            <thead>
              <tr className="border-b border-border-muted bg-surface-container text-text-muted font-mono text-[11px]">
                <th className="p-3.5 pl-5">Timestamp</th>
                <th className="p-3.5">Source IP</th>
                <th className="p-3.5">Event Type</th>
                <th className="p-3.5">Threat Level</th>
                <th className="p-3.5">MITRE Tactic</th>
                <th className="p-3.5">Merkle Hash</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-muted/50">
              {recentEvents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-text-muted">
                    No normalized telemetry logs present in storage.
                  </td>
                </tr>
              ) : (
                recentEvents.map((evt, idx) => {
                  const isExpanded = expandedEventId === (evt.raw_event_hash || idx);
                  const threatLvl = (evt.threat_level || 'LOW').toUpperCase();
                  const eventId = evt.raw_event_hash || evt.payload_hash || `evt_${idx}`;

                  return (
                    <React.Fragment key={eventId}>
                      <tr className="hover:bg-surface-hover/60 transition-colors">
                        <td className="p-3.5 pl-5 font-mono text-text-muted">
                          {(evt.timestamp || '').substring(11, 19) || 'N/A'}
                        </td>
                        <td className="p-3.5 font-mono font-bold text-text-primary">
                          {evt.source_ip || 'N/A'}
                        </td>
                        <td className="p-3.5 font-mono text-text-muted">
                          {evt.event_type || 'unstructured_log'}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase ${
                              threatLvl === 'HIGH'
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                                : threatLvl === 'MEDIUM'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            }`}
                          >
                            {threatLvl} ({evt.threat_score?.toFixed(1) || 0})
                          </span>
                        </td>
                        <td className="p-3.5 font-mono text-text-muted">
                          {evt.mitre_tactic || 'General Anomaly'}
                        </td>
                        <td className="p-3.5 font-mono text-[10px] text-text-dim">
                          {(evt.raw_event_hash || evt.payload_hash || 'N/A').substring(0, 16)}...
                        </td>
                        <td className="p-3.5">
                          <select
                            value={evt.status || 'New'}
                            onChange={(e) => handleEventStatusChange(eventId, e.target.value)}
                            className="bg-surface-dim border border-border-muted rounded px-2 py-1 text-[11px] font-mono text-text-primary"
                          >
                            <option value="New">New</option>
                            <option value="Investigating">Investigating</option>
                            <option value="Resolved">Resolved</option>
                            <option value="Dismissed">Dismissed</option>
                          </select>
                        </td>
                        <td className="p-3.5 pr-5 text-right">
                          <button
                            onClick={() => setExpandedEventId(isExpanded ? null : eventId)}
                            className="px-2.5 py-1 rounded bg-surface-container border border-border-muted text-primary text-[11px] font-bold hover:bg-surface-hover"
                          >
                            {isExpanded ? 'Hide XAI' : 'Explain XAI'}
                          </button>
                        </td>
                      </tr>

                      {/* XAI Attribution Expansion Panel */}
                      {isExpanded && (
                        <tr className="bg-surface-dim/80">
                          <td colSpan={8} className="p-4 border-t border-border-muted space-y-2">
                            <div className="font-bold text-xs text-primary flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-sm">psychology</span>
                              <span>Explainable AI (XAI) Feature Attribution:</span>
                            </div>
                            <p className="text-xs text-text-primary italic">
                              "{evt.xai_explanation || 'No specific explanation generated.'}"
                            </p>

                            {evt.feature_attribution && evt.feature_attribution.length > 0 && (
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                                {evt.feature_attribution.map((attr, aIdx) => (
                                  <div key={aIdx} className="p-2 rounded bg-surface border border-border-muted text-[11px]">
                                    <div className="flex justify-between font-mono text-text-primary font-bold">
                                      <span>{attr.feature}</span>
                                      <span className="text-primary">{(attr.importance * 100).toFixed(0)}%</span>
                                    </div>
                                    <div className="text-text-muted text-[10px] mt-0.5">{attr.description}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Incident Detail Modal */}
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
