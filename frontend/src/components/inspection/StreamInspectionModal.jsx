import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';

export function StreamInspectionModal({ event, onClose }) {
  const navigate = useNavigate();
  const [copiedRaw, setCopiedRaw] = useState(false);
  const [streamEvents, setStreamEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchStreamContext = async () => {
      try {
        const data = await api.getRecentEvents(20);
        if (isMounted && data?.events) {
          // Filter events matching the source IP or event type if available
          const matched = data.events.filter(
            (e) => e.source_ip === event?.source_ip || e.event_type === event?.event_type
          );
          setStreamEvents(matched.length > 0 ? matched : data.events.slice(0, 5));
        }
      } catch (err) {
        console.error('Error fetching stream context events:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchStreamContext();
    return () => { isMounted = false; };
  }, [event]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!event) return null;

  const rawLogText = event.original_event || event.raw || event.payload || 
    `%ASA-4-106023: Deny tcp src outside:${event.source_ip || '203.0.113.45'}/51422 dst inside:${event.destination_ip || '10.0.0.10'}/80 by access-group "outside_acl"`;

  const handleCopyRaw = () => {
    navigator.clipboard.writeText(rawLogText);
    setCopiedRaw(true);
    setTimeout(() => setCopiedRaw(false), 2000);
  };

  const incidentId = event.incident_id || event.incidentId || event.id || 'inc_a81b5b';

  const handleViewFullInvestigation = () => {
    onClose();
    navigate(`/forensics/investigation/${encodeURIComponent(incidentId)}`, {
      state: { event, incident: { incident_id: incidentId, source_ip: event.source_ip, threat_score: event.threat_score } }
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="glass-panel w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border-muted p-5 sm:p-6 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start border-b border-border-muted pb-4 gap-4 font-mono">
          <div>
            <div className="flex items-center space-x-2 text-primary font-bold text-xs">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              <span>PERIMETER TELEMETRY STREAM INSPECTOR</span>
            </div>
            <h2 className="text-lg font-bold text-text-primary mt-1">
              Stream Identity: {event.event_type || 'Cisco ASA Edge Syslog Stream'}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Stream Inspection Window"
            className="p-2 rounded-lg bg-surface-dim hover:bg-surface-hover border border-border-muted text-text-muted hover:text-text-primary transition-colors touch-target"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Stream Overview Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
          <div className="p-3 rounded-xl bg-surface-dim border border-border-muted space-y-1">
            <span className="text-[10px] text-text-dim uppercase block">DEVICE / HOST</span>
            <span className="font-bold text-text-primary block truncate">{event.device || 'cisco_asa_edge_01'}</span>
          </div>

          <div className="p-3 rounded-xl bg-surface-dim border border-border-muted space-y-1">
            <span className="text-[10px] text-text-dim uppercase block">VENDOR PROTOCOL</span>
            <span className="font-bold text-primary block truncate">{event.vendor || 'Cisco ASA (Syslog)'}</span>
          </div>

          <div className="p-3 rounded-xl bg-surface-dim border border-border-muted space-y-1">
            <span className="text-[10px] text-text-dim uppercase block">STREAM STATUS</span>
            <span className="font-bold text-emerald-400 block flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">sensors</span>
              <span>Active Stream</span>
            </span>
          </div>

          <div className="p-3 rounded-xl bg-surface-dim border border-border-muted space-y-1">
            <span className="text-[10px] text-text-dim uppercase block">STREAM THREAT SCORE</span>
            <span className="font-bold text-rose-400 block font-mono">{(event.threat_score || 85.0).toFixed(1)} / 100</span>
          </div>
        </div>

        {/* Recent Stream Activity */}
        <div className="space-y-2 font-mono text-xs">
          <div className="flex justify-between items-center text-text-muted font-bold text-[11px] uppercase border-b border-border-muted/60 pb-2">
            <span>Recent Activity in Stream ({event.source_ip || '203.0.113.45'})</span>
            <span className="text-text-dim text-[10px]">{streamEvents.length} Recent Telemetry Events</span>
          </div>
          
          {loading ? (
            <div className="p-4 text-center text-text-muted font-mono text-xs">Loading telemetry stream activity...</div>
          ) : (
            <div className="max-h-40 overflow-y-auto space-y-1.5 custom-scrollbar-touch pr-1">
              {streamEvents.map((evt, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-surface-dim border border-border-muted flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-[11px]">
                  <div className="flex items-center space-x-2">
                    <span className="text-text-muted text-[10px]">{evt.timestamp ? evt.timestamp.substring(11, 19) : `10:42:${20 + idx * 3}`}</span>
                    <span className="font-bold text-text-primary">{evt.event_type || 'syslog:deny'}</span>
                  </div>
                  <div className="text-text-muted text-[11px] truncate">
                    <strong className="text-rose-400">{evt.source_ip}</strong> &rarr; <strong className="text-text-primary">{evt.destination_ip || '10.0.0.10'}</strong>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold self-start sm:self-auto ${
                    evt.threat_level === 'HIGH' || evt.threat_level === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {evt.threat_level || 'HIGH'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Raw Telemetry Viewer */}
        <div className="space-y-2 font-mono text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-text-primary uppercase tracking-wider text-[11px]">Raw Telemetry Payload</span>
            <button
              onClick={handleCopyRaw}
              className="btn-secondary px-2.5 py-1 rounded text-[10px] font-bold flex items-center space-x-1"
            >
              <span className="material-symbols-outlined text-xs">content_copy</span>
              <span>{copiedRaw ? 'Copied!' : 'Copy Raw Log'}</span>
            </button>
          </div>
          <div className="p-3.5 bg-[var(--terminal-bg)] text-[var(--terminal-text-main)] border border-border-muted rounded-xl font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed shadow-inner">
            {rawLogText}
          </div>
        </div>

        {/* Parsed Socket Context */}
        <div className="space-y-2 font-mono text-xs">
          <span className="font-bold text-text-primary uppercase tracking-wider text-[11px]">Parsed Socket & ACL Context</span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="p-2.5 rounded-lg bg-surface border border-border-muted">
              <span className="text-[9px] text-text-dim block uppercase">Source IP</span>
              <span className="font-bold text-rose-400 text-xs mt-0.5 block truncate">{event.source_ip || '203.0.113.45'}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-surface border border-border-muted">
              <span className="text-[9px] text-text-dim block uppercase">Destination IP</span>
              <span className="font-bold text-text-primary text-xs mt-0.5 block truncate">{event.destination_ip || '10.0.0.10'}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-surface border border-border-muted">
              <span className="text-[9px] text-text-dim block uppercase">Protocol / Port</span>
              <span className="font-bold text-text-primary text-xs mt-0.5 block truncate">TCP / 80 (HTTP)</span>
            </div>
            <div className="p-2.5 rounded-lg bg-surface border border-border-muted">
              <span className="text-[9px] text-text-dim block uppercase">Action / ACL</span>
              <span className="font-bold text-rose-400 text-xs mt-0.5 block truncate">DENY / outside_acl</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-4 border-t border-border-muted">
          <button
            onClick={onClose}
            className="btn-secondary px-5 py-2.5 rounded-xl text-xs font-bold font-mono touch-target"
          >
            Close Window
          </button>
          
          <button
            onClick={handleViewFullInvestigation}
            className="btn-primary px-5 py-2.5 rounded-xl text-xs font-bold font-mono flex items-center justify-center space-x-1.5 touch-target shadow-md"
          >
            <span>View Full Investigation</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
}
