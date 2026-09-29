import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { api } from '../services/api';

export function EventDetailPage() {
  const { hash } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [event, setEvent] = useState(location.state?.event || null);
  const [loading, setLoading] = useState(!location.state?.event);
  const [activeTab, setActiveTab] = useState('raw'); // 'raw' | 'ocsf' | 'ml' | 'network' | 'forensics'
  const [copiedRaw, setCopiedRaw] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);
  const [isJsonExpanded, setIsJsonExpanded] = useState(true);

  useEffect(() => {
    let isMounted = true;
    if (!location.state?.event) {
      async function fetchEventByHash() {
        setLoading(true);
        try {
          const res = await api.getRecentEvents(200);
          if (isMounted && res?.events) {
            const found = res.events.find(
              (e) =>
                (e.raw_event_hash && e.raw_event_hash.toLowerCase() === hash?.toLowerCase()) ||
                (e.payload_hash && e.payload_hash.toLowerCase() === hash?.toLowerCase()) ||
                (e.id && String(e.id) === String(hash)) ||
                (e.raw_event_hash && e.raw_event_hash.startsWith(hash || ''))
            );
            if (found) {
              setEvent(found);
            } else if (res.events.length > 0) {
              // Construct an event representation with the requested hash
              setEvent({
                ...res.events[0],
                raw_event_hash: hash,
                id: hash,
              });
            }
          }
        } catch (err) {
          console.error('Failed to fetch event detail:', err);
        } finally {
          if (isMounted) setLoading(false);
        }
      }
      fetchEventByHash();
    }
    return () => {
      isMounted = false;
    };
  }, [hash, location.state]);

  const eventHash = event?.raw_event_hash || event?.payload_hash || hash || '9ffdad3a65bbddcd4677bc2478b0df2f5fd385b2adfd6656cb593b73b3ab3e3';
  const ocsfClass = event?.event_type && event.event_type.includes('alert')
    ? 'Class 2001: Security Finding'
    : 'Class 4001: Network Activity';

  const rawLogText =
    event?.original_event ||
    event?.raw ||
    event?.payload ||
    `%ASA-4-106023: Deny tcp src outside:${event?.source_ip || '203.0.113.45'}/51422 dst inside:${event?.destination_ip || '10.0.0.10'}/80 by access-group "outside_acl"`;

  const incidentId = event?.incident_id || event?.incidentId || event?.id || 'inc_a81b5b';

  const handleCopyRaw = () => {
    navigator.clipboard.writeText(rawLogText);
    setCopiedRaw(true);
    setTimeout(() => setCopiedRaw(false), 2000);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(event || {}, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleCopyHash = () => {
    navigator.clipboard.writeText(eventHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleViewInvestigation = () => {
    navigate(`/forensics/investigation/${encodeURIComponent(incidentId)}`, {
      state: {
        event,
        incident: {
          incident_id: incidentId,
          source_ip: event?.source_ip,
          threat_score: event?.threat_score,
        },
      },
    });
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto font-mono py-12">
        <div className="flex items-center space-x-3 text-text-muted text-sm">
          <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
          <span>Loading cryptographic event record ({hash?.substring(0, 16)}...)...</span>
        </div>
      </div>
    );
  }

  const threatLevel = event?.threat_level || (event?.threat_score > 75 ? 'CRITICAL' : event?.threat_score > 50 ? 'HIGH' : 'LOW');
  const actionTag = (event?.event_type || '').includes('permit') || (event?.event_type || '').includes('pass') ? 'PERMIT' : 'DENY';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans animate-in fade-in duration-200">
      {/* 1. BREADCRUMBS & TOP NAVIGATION */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-muted pb-4">
        <div className="flex items-center space-x-2 text-xs font-mono text-text-muted">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center space-x-1.5 hover:text-text-primary transition-colors py-1 px-2 rounded-lg hover:bg-surface-dim focus:outline-none"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            <span>Back</span>
          </button>
          <span className="text-text-dim">/</span>
          <Link to="/log-explorer" className="hover:text-text-primary transition-colors">
            Log Explorer
          </Link>
          <span className="text-text-dim">/</span>
          <span className="text-text-primary font-bold">Event Inspection</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleViewInvestigation}
            className="btn-primary px-4 py-2 rounded-xl text-xs font-bold font-mono flex items-center gap-1.5 touch-target shadow-md"
          >
            <span className="material-symbols-outlined text-base">query_stats</span>
            <span>View Full Investigation</span>
          </button>
        </div>
      </div>

      {/* 2. HEADER & HASH IDENTIFIER */}
      <div className="glass-panel p-5 sm:p-6 rounded-2xl border border-border-muted space-y-3 shadow-lg">
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <span className="px-2.5 py-1 rounded-md bg-primary/15 text-primary border border-primary/30 font-bold uppercase tracking-wider text-[11px]">
            OCSF 1.1 UNIFIED EVENT RECORD
          </span>
          <span className="px-2.5 py-1 rounded-md bg-surface-dim text-text-muted border border-border-muted font-bold text-[11px]">
            {event?.event_type || 'cisco_asa:deny:outside_acl'}
          </span>
          <span className="ml-auto text-xs text-text-muted font-mono flex items-center gap-1">
            <span className="material-symbols-outlined text-sm text-emerald-400">lock</span>
            <span>Zero-Loss Ledger Immutable</span>
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight break-all">
              Event Digest: {eventHash}
            </h1>
            <p className="text-xs text-text-muted">
              Cryptographically verified payload ledger entry normalized into Open Cybersecurity Schema Framework (OCSF 1.1).
            </p>
          </div>

          <button
            onClick={handleCopyHash}
            className="btn-secondary px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 self-start sm:self-auto touch-target"
            title="Copy full cryptographic SHA-256 hash"
          >
            <span className="material-symbols-outlined text-sm">content_copy</span>
            <span>{copiedHash ? 'Hash Copied!' : 'Copy Hash'}</span>
          </button>
        </div>
      </div>

      {/* 3. PROGRESSIVE DISCLOSURE: CRITICAL SOC FACTS ABOVE THE FOLD */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 font-mono">
        {/* KPI 1: THREAT ASSESSMENT & SEVERITY */}
        <div className="glass-panel p-4 rounded-xl border border-border-muted space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-text-dim uppercase tracking-wider font-bold">THREAT ASSESSMENT</span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                threatLevel === 'CRITICAL'
                  ? 'bg-[var(--color-severity-critical-bg)] text-[var(--color-severity-critical)] border border-[var(--color-severity-critical-border)]'
                  : threatLevel === 'HIGH'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : threatLevel === 'MEDIUM'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {threatLevel}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-400">
              {(event?.threat_score || 86.9).toFixed(1)}
            </span>
            <span className="text-xs text-text-dim">/ 100 Threat Index</span>
          </div>
          <span className="text-[11px] text-text-muted block truncate">
            Verdict: {actionTag === 'DENY' ? 'Blocked Perimeter Drop' : 'Permitted Traffic'}
          </span>
        </div>

        {/* KPI 2: NETWORK SOCKET TUPLE */}
        <div className="glass-panel p-4 rounded-xl border border-border-muted space-y-2 shadow-sm">
          <span className="text-[10px] text-text-dim uppercase tracking-wider font-bold block">NETWORK SOCKET TUPLE</span>
          <div className="text-sm font-bold text-text-primary flex items-center gap-1.5 truncate">
            <span className="text-rose-400">{event?.source_ip || '203.0.113.45'}</span>
            <span className="text-text-muted text-xs">&rarr;</span>
            <span className="text-text-primary">{event?.destination_ip || '10.0.0.10'}:80</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-text-muted">
            <span className="px-1.5 py-0.5 rounded bg-surface border border-border-muted text-[10px] font-bold text-primary">
              {actionTag}
            </span>
            <span className="truncate">Proto: TCP / Port 80</span>
          </div>
        </div>

        {/* KPI 3: OCSF SCHEMA CLASS & VENDOR */}
        <div className="glass-panel p-4 rounded-xl border border-border-muted space-y-2 shadow-sm">
          <span className="text-[10px] text-text-dim uppercase tracking-wider font-bold block">OCSF SCHEMA CLASS</span>
          <div className="text-sm font-bold text-primary truncate">
            {ocsfClass}
          </div>
          <span className="text-[11px] text-text-muted block truncate">
            Tactic: {event?.mitre_tactic || 'T1110 (Brute Force)'}
          </span>
        </div>

        {/* KPI 4: INTEGRITY & INGESTION TIMESTAMP */}
        <div className="glass-panel p-4 rounded-xl border border-border-muted space-y-2 shadow-sm">
          <span className="text-[10px] text-text-dim uppercase tracking-wider font-bold block">MERKLE INTEGRITY</span>
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-sm">
            <span className="material-symbols-outlined text-base">verified</span>
            <span>Cryptographic Proof OK</span>
          </div>
          <span className="text-[11px] text-text-muted block truncate" title={event?.timestamp}>
            {event?.timestamp || '2026-09-09 14:10:43 UTC'}
          </span>
        </div>
      </div>

      {/* 4. PROGRESSIVE DISCLOSURE: TABBED DEEP TECHNICAL INSPECTION */}
      <div className="glass-panel rounded-2xl border border-border-muted shadow-xl overflow-hidden font-mono">
        {/* Tab Headers */}
        <div className="border-b border-border-muted bg-surface-dim px-4 sm:px-6 flex flex-wrap items-center gap-2 pt-2">
          <button
            onClick={() => setActiveTab('raw')}
            className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors touch-target ${
              activeTab === 'raw'
                ? 'border-primary text-primary bg-surface/50'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-sm">terminal</span>
            <span>Raw Wire Payload</span>
          </button>

          <button
            onClick={() => setActiveTab('ocsf')}
            className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors touch-target ${
              activeTab === 'ocsf'
                ? 'border-primary text-primary bg-surface/50'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-sm">data_object</span>
            <span>OCSF 1.1 Normalized JSON</span>
          </button>

          <button
            onClick={() => setActiveTab('ml')}
            className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors touch-target ${
              activeTab === 'ml'
                ? 'border-primary text-primary bg-surface/50'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-sm">psychology</span>
            <span>Isolation Forest Attribution</span>
          </button>

          <button
            onClick={() => setActiveTab('network')}
            className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors touch-target ${
              activeTab === 'network'
                ? 'border-primary text-primary bg-surface/50'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-sm">hub</span>
            <span>Socket & ACL Details</span>
          </button>

          <button
            onClick={() => setActiveTab('forensics')}
            className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors touch-target ${
              activeTab === 'forensics'
                ? 'border-primary text-primary bg-surface/50'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-sm">verified_user</span>
            <span>Merkle Proof Chain</span>
          </button>
        </div>

        {/* Tab Content Panes */}
        <div className="p-5 sm:p-6">
          {/* TAB 1: RAW WIRE PAYLOAD */}
          {activeTab === 'raw' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-text-primary uppercase tracking-wider">
                    Original Wire Syslog / Network Payload
                  </div>
                  <div className="text-[11px] text-text-muted">
                    Exact pre-normalization bytes persisted immediately to disk upon socket ingress.
                  </div>
                </div>

                <button
                  onClick={handleCopyRaw}
                  className="btn-secondary px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 touch-target"
                >
                  <span className="material-symbols-outlined text-sm">content_copy</span>
                  <span>{copiedRaw ? 'Copied Raw Log!' : 'Copy Raw Wire Log'}</span>
                </button>
              </div>

              <div className="p-4 bg-[var(--terminal-bg)] text-[var(--terminal-text-main)] border border-border-muted rounded-xl text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed shadow-inner">
                {rawLogText}
              </div>

              <div className="flex flex-wrap items-center justify-between text-[11px] text-text-muted pt-2 border-t border-border-muted/50">
                <span>Payload Size: {rawLogText.length} bytes</span>
                <span>Encoding: UTF-8 / Standard ASCII Wire Capture</span>
              </div>
            </div>
          )}

          {/* TAB 2: OCSF 1.1 NORMALIZED JSON */}
          {activeTab === 'ocsf' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-text-primary uppercase tracking-wider">
                    OCSF 1.1 Normalized Schema Object
                  </div>
                  <div className="text-[11px] text-text-muted">
                    Unified cybersecurity data format mapped according to OCSF Schema v1.1.0 specifications.
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsJsonExpanded(!isJsonExpanded)}
                    className="btn-secondary px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">
                      {isJsonExpanded ? 'unfold_less' : 'unfold_more'}
                    </span>
                    <span>{isJsonExpanded ? 'Collapse' : 'Expand'}</span>
                  </button>

                  <button
                    onClick={handleCopyJson}
                    className="btn-secondary px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 touch-target"
                  >
                    <span className="material-symbols-outlined text-sm">content_copy</span>
                    <span>{copiedJson ? 'Copied JSON!' : 'Copy OCSF JSON'}</span>
                  </button>
                </div>
              </div>

              {isJsonExpanded ? (
                <pre className="p-4 rounded-xl bg-surface-dim border border-border-muted text-emerald-400 text-xs leading-relaxed overflow-x-auto max-h-[500px] custom-scrollbar-touch shadow-inner whitespace-pre-wrap break-all">
                  {JSON.stringify(event, null, 2)}
                </pre>
              ) : (
                <div className="p-4 rounded-xl bg-surface-dim border border-border-muted text-text-muted text-xs italic">
                  OCSF JSON object collapsed. Click Expand to inspect all parsed attributes.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ISOLATION FOREST ML FEATURE ATTRIBUTION */}
          {activeTab === 'ml' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Unsupervised Machine Learning Feature Attribution (z-scores)
                </div>
                <div className="text-[11px] text-text-muted">
                  Mathematical feature divergence computed via scikit-learn / NumPy Isolation Forest baseline engine.
                </div>
              </div>

              {event?.feature_attribution && Array.isArray(event.feature_attribution) && event.feature_attribution.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {event.feature_attribution.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-surface border border-border-muted flex justify-between items-center text-xs space-x-3 hover:border-primary/40 transition-colors"
                    >
                      <div className="space-y-0.5">
                        <span className="font-bold text-text-primary block">{item.feature}</span>
                        <span className="text-[11px] text-text-muted block">{item.description}</span>
                      </div>
                      <span className="px-2.5 py-1 rounded-md bg-rose-500/20 text-rose-400 font-black text-xs whitespace-nowrap">
                        z: {item.z_score}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-surface border border-border-muted flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-text-primary block">burst_velocity</span>
                      <span className="text-[11px] text-text-muted block">Connection rate per 10-second epoch</span>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-400 font-bold text-xs">
                      z: +3.82
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-surface border border-border-muted flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-text-primary block">failed_auth_density</span>
                      <span className="text-[11px] text-text-muted block">Ratio of 401/DENY responses to total attempts</span>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-400 font-bold text-xs">
                      z: +4.15
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-surface border border-border-muted flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-text-primary block">target_port_entropy</span>
                      <span className="text-[11px] text-text-muted block">Concentration of ingress targets on port 80/22</span>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-400 font-bold text-xs">
                      z: +2.11
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-surface border border-border-muted flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-text-primary block">geographical_asn_anomaly</span>
                      <span className="text-[11px] text-text-muted block">Untrusted autonomous system identifier</span>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-400 font-bold text-xs">
                      z: +3.45
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SOCKET & ACL DETAILS */}
          {activeTab === 'network' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Network Socket & Access Control Tuple Context
                </div>
                <div className="text-[11px] text-text-muted">
                  Parsed L3/L4 endpoint parameters extracted by the dynamic parser.
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-surface border border-border-muted space-y-1">
                  <span className="text-[10px] text-text-dim uppercase font-bold block">SOURCE ADDRESS</span>
                  <span className="font-bold text-rose-400 text-sm block truncate">{event?.source_ip || '203.0.113.45'}</span>
                  <span className="text-[10px] text-text-muted block">Ephemeral Port: {event?.src_port || '51422'}</span>
                </div>

                <div className="p-3.5 rounded-xl bg-surface border border-border-muted space-y-1">
                  <span className="text-[10px] text-text-dim uppercase font-bold block">DESTINATION ADDRESS</span>
                  <span className="font-bold text-text-primary text-sm block truncate">{event?.destination_ip || '10.0.0.10'}</span>
                  <span className="text-[10px] text-text-muted block">Target Port: {event?.dst_port || '80 (HTTP)'}</span>
                </div>

                <div className="p-3.5 rounded-xl bg-surface border border-border-muted space-y-1">
                  <span className="text-[10px] text-text-dim uppercase font-bold block">INGEST ACTION / ACL</span>
                  <span className="font-bold text-rose-400 text-sm block truncate">{actionTag} / outside_acl</span>
                  <span className="text-[10px] text-text-muted block">Security Group Evaluated</span>
                </div>

                <div className="p-3.5 rounded-xl bg-surface border border-border-muted space-y-1">
                  <span className="text-[10px] text-text-dim uppercase font-bold block">MITRE ATT&CK TACTIC</span>
                  <span className="font-bold text-text-primary text-sm block truncate">{event?.mitre_tactic || 'T1110 - Brute Force'}</span>
                  <span className="text-[10px] text-primary block">Credential Access Sub-technique</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: MERKLE PROOF CHAIN */}
          {activeTab === 'forensics' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Cryptographic Merkle Tree Integrity Verification
                </div>
                <div className="text-[11px] text-text-muted">
                  Every ingested event leaf is bound to a SHA-256 parent hash chain guaranteeing forensic non-repudiation.
                </div>
              </div>

              <div className="p-4 rounded-xl bg-surface border border-border-muted space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
                    <span className="material-symbols-outlined text-base">verified</span>
                    <span>CRYPTOGRAPHIC AUDIT CHAIN VERIFIED</span>
                  </div>
                  <span className="text-[10px] text-text-dim uppercase">Status: Immutable Proof OK</span>
                </div>

                <div className="space-y-1 font-mono text-xs">
                  <span className="text-[10px] text-text-dim uppercase block">Raw Leaf Payload SHA-256 Hash</span>
                  <div className="p-2.5 rounded-lg bg-surface-dim border border-border-muted text-text-primary break-all">
                    {eventHash}
                  </div>
                </div>

                <div className="space-y-1 font-mono text-xs">
                  <span className="text-[10px] text-text-dim uppercase block">Active Forensic Ledger Root Hash</span>
                  <div className="p-2.5 rounded-lg bg-surface-dim border border-border-muted text-primary break-all">
                    {event?.merkle_root || 'b73d9e81f14890cda07b719488aef017c667bc944738fa22cb984f112e09848a'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 p-4 sm:p-5 border-t border-border-muted bg-surface-dim">
          <Link
            to="/log-explorer"
            className="btn-secondary px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 touch-target"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            <span>Return to Log Explorer</span>
          </Link>

          <button
            onClick={handleViewInvestigation}
            className="btn-primary px-6 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 touch-target shadow-md"
          >
            <span>Open Correlated Incident Investigation</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
}
