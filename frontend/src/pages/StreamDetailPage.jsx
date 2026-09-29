import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { api } from '../services/api';

export function StreamDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [event, setEvent] = useState(location.state?.event || null);
  const [streamEvents, setStreamEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('activity'); // 'activity' | 'raw' | 'socket' | 'ocsf'
  const [copiedRaw, setCopiedRaw] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchStreamData() {
      setLoading(true);
      try {
        const data = await api.getRecentEvents(50);
        if (isMounted && data?.events) {
          // If no event passed in state, try to find an event matching id
          let currentEvt = location.state?.event;
          if (!currentEvt) {
            currentEvt = data.events.find(
              (e) =>
                String(e.id) === String(id) ||
                (e.raw_event_hash && e.raw_event_hash.startsWith(id || '')) ||
                e.source_ip === id
            ) || data.events[0];
            setEvent(currentEvt);
          }

          // Filter stream activity matching source IP or event type
          const matched = data.events.filter(
            (e) => e.source_ip === currentEvt?.source_ip || e.event_type === currentEvt?.event_type
          );
          setStreamEvents(matched.length > 0 ? matched : data.events.slice(0, 10));
        }
      } catch (err) {
        console.error('Error loading stream context:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchStreamData();
    return () => {
      isMounted = false;
    };
  }, [id, location.state]);

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

  const handleViewFullInvestigation = () => {
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

  const threatLevel = event?.threat_level || (event?.threat_score > 75 ? 'CRITICAL' : event?.threat_score > 50 ? 'HIGH' : 'LOW');
  const actionTag = (event?.event_type || '').includes('permit') || (event?.event_type || '').includes('pass') ? 'PERMIT' : 'DENY';
  const deviceHost = event?.device || 'cisco_asa_edge_01';
  const vendorProtocol = event?.vendor || 'Cisco ASA (Syslog)';

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
          <Link to="/dashboard" className="hover:text-text-primary transition-colors">
            SOC Dashboard
          </Link>
          <span className="text-text-dim">/</span>
          <span className="text-text-primary font-bold">Perimeter Stream</span>
        </div>

        <div className="flex items-center gap-2 font-mono">
          <Link
            to="/log-explorer"
            className="btn-secondary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 touch-target"
          >
            <span className="material-symbols-outlined text-sm">manage_search</span>
            <span>Open in Log Explorer</span>
          </Link>
          <button
            onClick={handleViewFullInvestigation}
            className="btn-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 touch-target shadow-md"
          >
            <span className="material-symbols-outlined text-base">query_stats</span>
            <span>View Investigation</span>
          </button>
        </div>
      </div>

      {/* 2. HEADER & STREAM BANNER */}
      <div className="glass-panel p-5 sm:p-6 rounded-2xl border border-border-muted space-y-3 shadow-lg font-mono">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-md bg-primary/15 text-primary border border-primary/30 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            <span>PERIMETER TELEMETRY STREAM INSPECTOR</span>
          </span>
          <span className="px-2.5 py-1 rounded-md bg-surface-dim text-text-muted border border-border-muted font-bold text-[11px]">
            Channel: {id || 'edge_stream_01'}
          </span>
          <span className="ml-auto text-xs text-emerald-400 font-mono flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">sensors</span>
            <span>Live Channel Active</span>
          </span>
        </div>

        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">
            Stream Identity: {event?.event_type || 'Cisco ASA Edge Perimeter Log Stream'}
          </h1>
          <p className="text-xs text-text-muted">
            Continuous perimeter security telemetry streaming across ingress firewall and edge detection conduits.
          </p>
        </div>
      </div>

      {/* 3. PROGRESSIVE DISCLOSURE: CRITICAL FACTS ABOVE THE FOLD */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 font-mono">
        {/* KPI 1: DEVICE / HOST */}
        <div className="glass-panel p-4 rounded-xl border border-border-muted space-y-2 shadow-sm">
          <span className="text-[10px] text-text-dim uppercase tracking-wider font-bold block">DEVICE / HOST</span>
          <div className="text-sm font-bold text-text-primary truncate">
            {deviceHost}
          </div>
          <span className="text-[11px] text-text-muted block truncate">
            Interface: outside_acl / edge_conduit
          </span>
        </div>

        {/* KPI 2: VENDOR PROTOCOL */}
        <div className="glass-panel p-4 rounded-xl border border-border-muted space-y-2 shadow-sm">
          <span className="text-[10px] text-text-dim uppercase tracking-wider font-bold block">VENDOR PROTOCOL</span>
          <div className="text-sm font-bold text-primary truncate">
            {vendorProtocol}
          </div>
          <span className="text-[11px] text-text-muted block truncate">
            Parser: Dynamic OCSF Normalizer
          </span>
        </div>

        {/* KPI 3: STREAM STATUS & ACTION */}
        <div className="glass-panel p-4 rounded-xl border border-border-muted space-y-2 shadow-sm">
          <span className="text-[10px] text-text-dim uppercase tracking-wider font-bold block">STREAM INGEST ACTION</span>
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                actionTag === 'DENY'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {actionTag}
            </span>
            <span className="text-xs text-text-muted">Ingress Drop</span>
          </div>
          <span className="text-[11px] text-emerald-400 font-bold block flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">sensors</span>
            <span>Real-time Ingest Active</span>
          </span>
        </div>

        {/* KPI 4: STREAM THREAT SCORE */}
        <div className="glass-panel p-4 rounded-xl border border-border-muted space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-text-dim uppercase tracking-wider font-bold">STREAM THREAT SCORE</span>
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
              {(event?.threat_score || 85.0).toFixed(1)}
            </span>
            <span className="text-xs text-text-dim">/ 100 Index</span>
          </div>
          <span className="text-[11px] text-text-muted block truncate">
            Origin: {event?.source_ip || '203.0.113.45'}
          </span>
        </div>
      </div>

      {/* 4. PROGRESSIVE DISCLOSURE: TABBED TECHNICAL DETAIL */}
      <div className="glass-panel rounded-2xl border border-border-muted shadow-xl overflow-hidden font-mono">
        {/* Tab Headers */}
        <div className="border-b border-border-muted bg-surface-dim px-4 sm:px-6 flex flex-wrap items-center gap-2 pt-2">
          <button
            onClick={() => setActiveTab('activity')}
            className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors touch-target ${
              activeTab === 'activity'
                ? 'border-primary text-primary bg-surface/50'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-sm">timeline</span>
            <span>Stream Activity Feed ({streamEvents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('raw')}
            className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors touch-target ${
              activeTab === 'raw'
                ? 'border-primary text-primary bg-surface/50'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-sm">terminal</span>
            <span>Raw Telemetry Payload</span>
          </button>

          <button
            onClick={() => setActiveTab('socket')}
            className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors touch-target ${
              activeTab === 'socket'
                ? 'border-primary text-primary bg-surface/50'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-sm">router</span>
            <span>Socket & ACL Context</span>
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
            <span>Normalized JSON</span>
          </button>
        </div>

        {/* Tab Content Panes */}
        <div className="p-5 sm:p-6">
          {/* TAB 1: STREAM ACTIVITY TIMELINE */}
          {activeTab === 'activity' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-muted/60 pb-3">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-text-primary uppercase tracking-wider">
                    Recent Activity in Stream ({event?.source_ip || '203.0.113.45'})
                  </div>
                  <div className="text-[11px] text-text-muted">
                    Telemetry events sequentially correlated across this channel.
                  </div>
                </div>
                <span className="text-[11px] text-text-muted font-bold">
                  {streamEvents.length} Recent Telemetry Events
                </span>
              </div>

              {loading ? (
                <div className="p-8 text-center text-text-muted text-xs">
                  Loading telemetry stream events...
                </div>
              ) : streamEvents.length > 0 ? (
                <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar-touch pr-1">
                  {streamEvents.map((evt, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-surface-dim border border-border-muted flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-xs hover:border-primary/40 transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-text-muted text-[11px]">
                          {evt.timestamp ? evt.timestamp.substring(11, 19) : `10:42:${20 + idx * 3}`}
                        </span>
                        <span className="font-bold text-text-primary">{evt.event_type || 'syslog:deny'}</span>
                      </div>

                      <div className="text-text-muted text-xs truncate">
                        <strong className="text-rose-400">{evt.source_ip}</strong> &rarr;{' '}
                        <strong className="text-text-primary">{evt.destination_ip || '10.0.0.10'}</strong>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            evt.threat_level === 'CRITICAL'
                              ? 'bg-[var(--color-severity-critical-bg)] text-[var(--color-severity-critical)] border border-[var(--color-severity-critical-border)]'
                              : evt.threat_level === 'HIGH'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : evt.threat_level === 'MEDIUM'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {evt.threat_level || 'HIGH'}
                        </span>
                        <Link
                          to={`/events/${encodeURIComponent(evt.raw_event_hash || evt.id || evt.payload_hash || `stream_evt_${idx}`)}`}
                          state={{ event: evt }}
                          className="btn-secondary px-2.5 py-1 rounded text-[10px] font-bold"
                        >
                          Inspect Event
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-text-muted text-xs">
                  No recent events found for this stream identifier.
                </div>
              )}
            </div>
          )}

          {/* TAB 2: RAW WIRE TELEMETRY */}
          {activeTab === 'raw' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-text-primary uppercase tracking-wider">
                    Raw Telemetry Payload Captured on Channel
                  </div>
                  <div className="text-[11px] text-text-muted">
                    Exact wire bytes captured directly from the syslog conduit.
                  </div>
                </div>

                <button
                  onClick={handleCopyRaw}
                  className="btn-secondary px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 touch-target"
                >
                  <span className="material-symbols-outlined text-sm">content_copy</span>
                  <span>{copiedRaw ? 'Copied Raw Log!' : 'Copy Raw Log'}</span>
                </button>
              </div>

              <div className="p-4 bg-[var(--terminal-bg)] text-[var(--terminal-text-main)] border border-border-muted rounded-xl text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed shadow-inner">
                {rawLogText}
              </div>

              <div className="flex flex-wrap items-center justify-between text-[11px] text-text-muted pt-2 border-t border-border-muted/50">
                <span>Wire Length: {rawLogText.length} bytes</span>
                <span>Ingest Mode: Non-blocking async queue worker</span>
              </div>
            </div>
          )}

          {/* TAB 3: SOCKET & ACL CONTEXT */}
          {activeTab === 'socket' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Parsed Network Socket & Access Control Tuple
                </div>
                <div className="text-[11px] text-text-muted">
                  Perimeter firewall rule matching and transport layer bindings.
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-surface border border-border-muted space-y-1">
                  <span className="text-[10px] text-text-dim uppercase font-bold block">SOURCE IP ADDRESS</span>
                  <span className="font-bold text-rose-400 text-sm block truncate">{event?.source_ip || '203.0.113.45'}</span>
                  <span className="text-[10px] text-text-muted block">External Ingress Node</span>
                </div>

                <div className="p-3.5 rounded-xl bg-surface border border-border-muted space-y-1">
                  <span className="text-[10px] text-text-dim uppercase font-bold block">DESTINATION IP ADDRESS</span>
                  <span className="font-bold text-text-primary text-sm block truncate">{event?.destination_ip || '10.0.0.10'}</span>
                  <span className="text-[10px] text-text-muted block">Protected DMZ Node</span>
                </div>

                <div className="p-3.5 rounded-xl bg-surface border border-border-muted space-y-1">
                  <span className="text-[10px] text-text-dim uppercase font-bold block">PROTOCOL & PORT</span>
                  <span className="font-bold text-text-primary text-sm block truncate">TCP / 80 (HTTP)</span>
                  <span className="text-[10px] text-text-muted block">Transport Layer Stream</span>
                </div>

                <div className="p-3.5 rounded-xl bg-surface border border-border-muted space-y-1">
                  <span className="text-[10px] text-text-dim uppercase font-bold block">ACTION / ACL DIRECTIVE</span>
                  <span className="font-bold text-rose-400 text-sm block truncate">DENY / outside_acl</span>
                  <span className="text-[10px] text-primary block">Access Rule Evaluated</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: NORMALIZED JSON */}
          {activeTab === 'ocsf' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-text-primary uppercase tracking-wider">
                    Normalized Telemetry Record (JSON)
                  </div>
                  <div className="text-[11px] text-text-muted">
                    Internal normalized telemetry schema for SOC correlation engines.
                  </div>
                </div>

                <button
                  onClick={handleCopyJson}
                  className="btn-secondary px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 touch-target"
                >
                  <span className="material-symbols-outlined text-sm">content_copy</span>
                  <span>{copiedJson ? 'Copied JSON!' : 'Copy JSON'}</span>
                </button>
              </div>

              <pre className="p-4 rounded-xl bg-surface-dim border border-border-muted text-emerald-400 text-xs leading-relaxed overflow-x-auto max-h-[500px] custom-scrollbar-touch shadow-inner whitespace-pre-wrap break-all">
                {JSON.stringify(event || {}, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer Actions Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 p-4 sm:p-5 border-t border-border-muted bg-surface-dim">
          <Link
            to="/dashboard"
            className="btn-secondary px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 touch-target"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            <span>Return to SOC Dashboard</span>
          </Link>

          <button
            onClick={handleViewFullInvestigation}
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
