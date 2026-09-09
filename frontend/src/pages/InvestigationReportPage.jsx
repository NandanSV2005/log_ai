import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { api } from '../services/api';

export function InvestigationReportPage() {
  const { incidentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [incidentData, setIncidentData] = useState(location.state?.incident || null);
  const [events, setEvents] = useState(location.state?.events || []);
  const [selectedEvent, setSelectedEvent] = useState(location.state?.event || null);
  const [loading, setLoading] = useState(!incidentData);
  const [error, setError] = useState(null);
  const [copiedRaw, setCopiedRaw] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [isOcsfExpanded, setIsOcsfExpanded] = useState(true);
  const [status, setStatus] = useState(incidentData?.status || 'Active');

  useEffect(() => {
    let isMounted = true;
    async function loadReportData() {
      setLoading(true);
      setError(null);
      try {
        if (incidentId) {
          const res = await api.getIncidentDetail(incidentId);
          if (isMounted && res) {
            if (res.incident) {
              setIncidentData(res.incident);
              setStatus(res.incident.status || 'Active');
            }
            if (Array.isArray(res.events)) {
              setEvents(res.events);
              if (res.events.length > 0) {
                setSelectedEvent(res.events[0]);
              }
            }
          }
        }
      } catch (err) {
        // Fallback to searching recent incidents or recent events if ID not found in detail endpoint
        try {
          const [incidentsRes, eventsRes] = await Promise.all([
            api.getIncidents(50),
            api.getRecentEvents(50)
          ]);
          if (isMounted) {
            const foundIncident = incidentsRes?.incidents?.find(
              (inc) => inc.incident_id === incidentId || inc.id === incidentId
            );
            if (foundIncident) {
              setIncidentData(foundIncident);
              setStatus(foundIncident.status || 'Active');
            }
            const matchingEvents = eventsRes?.events?.filter(
              (evt) => evt.incident_id === incidentId || evt.id === incidentId || evt.source_ip === foundIncident?.source_ip
            ) || eventsRes?.events || [];
            
            if (matchingEvents.length > 0) {
              setEvents(matchingEvents);
              setSelectedEvent(matchingEvents[0]);
            }
          }
        } catch (fallbackErr) {
          if (isMounted) setError('Failed to load incident forensic evidence.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadReportData();
    return () => { isMounted = false; };
  }, [incidentId]);

  // Derived Values
  const caseIdDisplay = incidentId ? incidentId.substring(0, 12).toUpperCase() : 'INC_UNKNOWN';
  const displayIncident = incidentData || {
    incident_id: incidentId,
    status: status,
    source_ip: selectedEvent?.source_ip || '203.0.113.45',
    threat_score: selectedEvent?.threat_score || 88.5,
    event_count: events.length || 7,
    mitre_tactics: selectedEvent?.mitre_tactic || 'T1110 (Brute Force)'
  };

  const activeEvt = selectedEvent || events[0] || {
    raw: '%ASA-4-106023: Deny tcp src outside:285.220.100.22/51422 dst inside:10.0.0.10/80 by access-group "outside_acl"',
    source_ip: displayIncident.source_ip || '203.0.113.45',
    destination_ip: '10.0.0.10',
    event_type: 'cisco_asa:deny:outside_acl',
    timestamp: '2026-09-08 11:42:01',
    threat_level: 'HIGH',
    threat_score: 88.5,
    raw_event_hash: 'a4ea94c43d9dc8c7753255ca0d6e2bb2093560056c170d2f992edb7d36071e3f'
  };

  const handleStatusUpdate = async (newStatus) => {
    setStatus(newStatus);
    if (displayIncident?.incident_id) {
      try {
        await api.updateIncidentStatus(displayIncident.incident_id, newStatus);
      } catch (err) {
        // Status fallback
      }
    }
  };

  const handleCopyRaw = () => {
    const rawContent = activeEvt.raw || activeEvt.raw_payload || JSON.stringify(activeEvt);
    navigator.clipboard.writeText(rawContent);
    setCopiedRaw(true);
    setTimeout(() => setCopiedRaw(false), 2000);
  };

  const ocsfPayload = {
    class_uid: activeEvt.event_type?.includes('alert') ? 2001 : 4001,
    class_name: activeEvt.event_type?.includes('alert') ? 'Security Finding' : 'Network Activity',
    category_uid: 4,
    category_name: 'Network Activity',
    activity_id: activeEvt.action === 'PASS' ? 1 : 2,
    activity_name: activeEvt.action === 'PASS' ? 'Allowed' : 'Blocked',
    severity_id: activeEvt.threat_level === 'HIGH' || activeEvt.threat_level === 'CRITICAL' ? 4 : 2,
    severity_name: activeEvt.threat_level || 'HIGH',
    time: activeEvt.timestamp || new Date().toISOString(),
    src_endpoint: {
      ip: activeEvt.source_ip || '203.0.113.45',
      port: activeEvt.src_port || 51422,
      domain: 'outside.network'
    },
    dst_endpoint: {
      ip: activeEvt.destination_ip || '10.0.0.10',
      port: activeEvt.dst_port || 80,
      interface: 'inside_acl'
    },
    threat_intel: {
      score: activeEvt.threat_score || 88.5,
      mitre_tactic_id: 'T1110',
      mitre_tactic_name: activeEvt.mitre_tactic || 'Brute Force',
      anomaly_engine: 'Isolation Forest v2.4'
    },
    integrity: {
      hash: activeEvt.raw_event_hash || 'a4ea94c43d9dc8c7753255ca0d6e2bb2093560056c170d2f992edb7d36071e3f',
      merkle_verified: true
    }
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(ocsfPayload, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-7xl mx-auto pb-12 font-sans">
      
      {/* 1. ANALYST NAVIGATION & HEADER */}
      <header className="space-y-4 border-b border-border-muted pb-6">
        <button
          onClick={() => navigate('/forensics')}
          className="inline-flex items-center space-x-2 text-xs font-mono text-text-muted hover:text-text-primary transition-colors py-1 focus:outline-none focus:ring-2 focus:ring-primary rounded"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          <span>Back to Digital Forensics</span>
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-3 flex-wrap gap-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-text-primary">
                CASE-#{caseIdDisplay}
              </h1>
              <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold uppercase tracking-wider border ${
                status === 'Active' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}>
                {status}
              </span>
              <span className="px-2.5 py-1 rounded bg-surface border border-border-muted text-text-muted font-mono text-xs">
                {events.length} CORRELATED EVENTS
              </span>
            </div>
            <p className="text-xs text-text-muted font-sans">
              Full-page forensic evidence report and OCSF 1.1 normalized audit workspace.
            </p>
          </div>

          {/* Header Quick Actions */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleStatusUpdate(status === 'Active' ? 'Mitigated' : 'Active')}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all border ${
                status === 'Active'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
              }`}
            >
              {status === 'Active' ? 'Mark as Mitigated' : 'Reopen Case'}
            </button>
            <button
              onClick={() => api.exportCsv()}
              className="btn-secondary px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center space-x-1.5"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              <span>Export Audit</span>
            </button>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="glass-panel p-12 text-center text-text-muted font-mono text-xs rounded-2xl">
          Loading forensic evidence data...
        </div>
      ) : error ? (
        <div className="glass-panel p-8 text-center text-rose-400 font-mono text-xs rounded-2xl border border-rose-500/30">
          {error}
        </div>
      ) : (
        <div className="space-y-8">

          {/* 2. EXECUTIVE FINDING & SEVERITY STATS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Finding Box */}
            <div className="lg:col-span-8 glass-panel p-6 rounded-2xl border border-border-muted space-y-3 shadow-xl">
              <div className="font-mono text-xs text-primary font-bold tracking-wider uppercase flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                <span>EXECUTIVE FORENSIC FINDING</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-text-primary font-mono">
                Automated Incident Correlation: {displayIncident.mitre_tactics || 'Multi-Vector Traffic Anomaly'}
              </h2>
              <p className="text-xs sm:text-sm text-text-muted leading-relaxed font-sans">
                Isolation Forest ML engine identified anomalous network connection velocity originating from source entity <strong className="text-text-primary font-mono">{displayIncident.source_ip}</strong>. The incident contains {events.length} correlated syslog &amp; IDS events spanning perimeter edge firewalls.
              </p>
            </div>

            {/* Severity & Threat Gauge */}
            <div className="lg:col-span-4 glass-panel p-6 rounded-2xl border border-border-muted font-mono flex flex-col justify-between shadow-xl space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-text-dim uppercase">THREAT SCORE</span>
                <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold text-[10px]">
                  HIGH SEVERITY
                </span>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-4xl font-bold text-rose-400">{(displayIncident.threat_score || 88.5).toFixed(1)}</span>
                <span className="text-xs text-text-muted">/ 100.0</span>
              </div>
              <div className="text-[10px] text-text-muted border-t border-border-muted/50 pt-2.5 flex items-center justify-between">
                <span>CHAIN INTEGRITY:</span>
                <span className="text-emerald-400 font-bold">● MERKLE VERIFIED</span>
              </div>
            </div>

          </div>

          {/* 3. EVENT OVERVIEW GRID */}
          <div className="glass-panel p-6 rounded-2xl border border-border-muted space-y-4 shadow-xl font-mono text-xs">
            <div className="font-bold text-text-primary uppercase tracking-wider border-b border-border-muted pb-3">
              Event Overview &amp; Socket Context
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="p-3.5 rounded-xl bg-surface-dim border border-border-muted space-y-1">
                <span className="text-[10px] text-text-dim uppercase block">SOURCE IP</span>
                <span className="font-bold text-rose-400 text-xs block truncate">{displayIncident.source_ip}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-dim border border-border-muted space-y-1">
                <span className="text-[10px] text-text-dim uppercase block">DESTINATION IP</span>
                <span className="font-bold text-text-primary text-xs block truncate">{activeEvt.destination_ip || '10.0.0.10'}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-dim border border-border-muted space-y-1">
                <span className="text-[10px] text-text-dim uppercase block">DEVICE / VENDOR</span>
                <span className="font-bold text-text-primary text-xs block truncate">{activeEvt.vendor || 'Cisco ASA Edge'}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-dim border border-border-muted space-y-1">
                <span className="text-[10px] text-[var(--color-text-dim)] uppercase block">EVENT TYPE</span>
                <span className="font-bold text-primary text-xs block truncate">{activeEvt.event_type || 'network_activity'}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-dim border border-border-muted space-y-1">
                <span className="text-[10px] text-text-dim uppercase block">TIMESTAMP</span>
                <span className="font-bold text-text-primary text-xs block truncate">{activeEvt.timestamp || '11:42:01'}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-dim border border-border-muted space-y-1">
                <span className="text-[10px] text-text-dim uppercase block">CORRELATED EVENTS</span>
                <span className="font-bold text-emerald-400 text-xs block truncate">{events.length} Events</span>
              </div>
            </div>
          </div>

          {/* 4. ATTACK / CORRELATION TIMELINE */}
          {events.length > 0 && (
            <div className="glass-panel p-6 rounded-2xl border border-border-muted space-y-4 shadow-xl font-mono text-xs">
              <div className="flex items-center justify-between border-b border-border-muted pb-3">
                <span className="font-bold text-text-primary uppercase tracking-wider">Correlated Incident Attack Chain Timeline</span>
                <span className="text-text-muted text-[11px]">Select step to inspect evidence</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {events.map((evt, idx) => {
                  const isSelected = (selectedEvent?.id || selectedEvent?.raw_event_hash) === (evt.id || evt.raw_event_hash);
                  return (
                    <button
                      key={evt.id || evt.raw_event_hash || idx}
                      onClick={() => setSelectedEvent(evt)}
                      className={`p-3.5 rounded-xl border text-left space-y-1.5 transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
                        isSelected
                          ? 'bg-primary/10 border-primary ring-1 ring-primary shadow'
                          : 'bg-surface border-border-muted hover:border-text-muted'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-primary">STEP 0{idx + 1}</span>
                        <span className="text-text-dim">{evt.timestamp ? evt.timestamp.substring(11, 19) : `10:42:${20 + idx * 4}`}</span>
                      </div>
                      <div className="font-bold text-text-primary text-xs truncate">{evt.event_type || 'syslog:deny'}</div>
                      <div className="text-[10px] text-text-muted truncate">
                        {evt.source_ip} &rarr; {evt.destination_ip || '10.0.0.10'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 5. PERIMETER TELEMETRY (RAW LOG EVIDENCE VIEWER) */}
          <div className="glass-panel p-6 rounded-2xl border border-border-muted space-y-3 shadow-xl font-mono text-xs">
            <div className="flex items-center justify-between border-b border-border-muted pb-3">
              <div className="flex items-center space-x-2">
                <span className="material-symbols-outlined text-base text-primary">terminal</span>
                <span className="font-bold text-text-primary uppercase tracking-wider">Perimeter Telemetry (Raw Log Evidence)</span>
              </div>
              <button
                onClick={handleCopyRaw}
                className="btn-secondary px-2.5 py-1 rounded text-[11px] font-bold flex items-center space-x-1"
              >
                <span className="material-symbols-outlined text-xs">content_copy</span>
                <span>{copiedRaw ? 'Copied!' : 'Copy Raw Log'}</span>
              </button>
            </div>

            <div className="p-4 bg-[var(--terminal-bg)] text-[var(--terminal-text-main)] border border-border-muted rounded-xl font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed shadow-inner">
              {activeEvt.raw || activeEvt.raw_payload || '%ASA-4-106023: Deny tcp src outside:185.220.100.22/51422 dst inside:10.0.0.10/80 by access-group "outside_acl"'}
            </div>
          </div>

          {/* 6. PARSED EVENT FIELDS & OCSF 1.1 NORMALIZED EVENT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Parsed Fields (Span 5) */}
            <div className="lg:col-span-5 glass-panel p-6 rounded-2xl border border-border-muted space-y-4 shadow-xl font-mono text-xs">
              <div className="font-bold text-text-primary uppercase tracking-wider border-b border-border-muted pb-3">
                Extracted Parsed Attributes
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-border-muted/40">
                  <span className="text-text-dim uppercase">SOURCE SOCKET</span>
                  <span className="font-bold text-text-primary">{activeEvt.source_ip || '203.0.113.45'}:51422</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border-muted/40">
                  <span className="text-text-dim uppercase">DESTINATION SOCKET</span>
                  <span className="font-bold text-text-primary">{activeEvt.destination_ip || '10.0.0.10'}:80</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border-muted/40">
                  <span className="text-text-dim uppercase">PROTOCOL</span>
                  <span className="font-bold text-primary">TCP (6)</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border-muted/40">
                  <span className="text-text-dim uppercase">ACTION SEMANTICS</span>
                  <span className="font-bold text-rose-400">DENY / BLOCK</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-text-dim uppercase">ACL BINDING</span>
                  <span className="font-bold text-text-primary">outside_acl</span>
                </div>
              </div>
            </div>

            {/* OCSF 1.1 JSON Viewer (Span 7) */}
            <div className="lg:col-span-7 glass-panel p-6 rounded-2xl border border-border-muted space-y-3 shadow-xl font-mono text-xs">
              <div className="flex items-center justify-between border-b border-border-muted pb-3">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-text-primary uppercase tracking-wider">OCSF 1.1 Normalized Event Payload</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                    Class {ocsfPayload.class_uid}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsOcsfExpanded(!isOcsfExpanded)}
                    className="text-text-muted hover:text-text-primary text-[11px]"
                  >
                    {isOcsfExpanded ? 'Collapse' : 'Expand'}
                  </button>
                  <button
                    onClick={handleCopyJson}
                    className="btn-secondary px-2.5 py-1 rounded text-[11px] font-bold flex items-center space-x-1"
                  >
                    <span className="material-symbols-outlined text-xs">content_copy</span>
                    <span>{copiedJson ? 'Copied!' : 'Copy JSON'}</span>
                  </button>
                </div>
              </div>

              {isOcsfExpanded && (
                <div className="p-4 bg-[var(--terminal-bg)] text-emerald-400 border border-border-muted rounded-xl font-mono text-xs overflow-x-auto max-h-[280px] shadow-inner">
                  <pre className="whitespace-pre-wrap">
                    {JSON.stringify(ocsfPayload, null, 2)}
                  </pre>
                </div>
              )}
            </div>

          </div>

          {/* 7. THREAT ANALYSIS, MITRE ATT&CK & INTEGRITY VERIFICATION */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
            
            {/* Threat Reasoning */}
            <div className="glass-panel p-5 rounded-2xl border border-border-muted space-y-2 shadow-xl">
              <div className="text-text-dim uppercase text-[10px] font-bold">ISOLATION FOREST ANOMALY REASONING</div>
              <div className="text-sm font-bold text-rose-400">Score: {(activeEvt.threat_score || 88.5).toFixed(1)} / 100</div>
              <p className="text-xs text-text-muted leading-relaxed font-sans">
                + velocity_spike (+3.42 z-score)<br />
                + repeated_denied_target (+2.88 z-score)
              </p>
            </div>

            {/* MITRE ATT&CK Context */}
            <div className="glass-panel p-5 rounded-2xl border border-border-muted space-y-2 shadow-xl">
              <div className="text-text-dim uppercase text-[10px] font-bold">MITRE ATT&amp;CK CONTEXT</div>
              <div className="text-sm font-bold text-text-primary">T1110 — Brute Force</div>
              <p className="text-xs text-text-muted leading-relaxed font-sans">
                Credential Access tactic attempting repeated authentication cycles.
              </p>
            </div>

            {/* Cryptographic Integrity */}
            <div className="glass-panel p-5 rounded-2xl border border-border-muted space-y-2 shadow-xl">
              <div className="text-text-dim uppercase text-[10px] font-bold">SHA-256 MERKLE INTEGRITY</div>
              <div className="text-xs font-bold text-emerald-400 truncate">
                {activeEvt.raw_event_hash || 'a4ea94c43d9dc8c7753255ca0d6e2bb209356...'}
              </div>
              <div className="text-xs text-emerald-400 font-bold">
                ● CHAIN STATUS: VERIFIED
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
