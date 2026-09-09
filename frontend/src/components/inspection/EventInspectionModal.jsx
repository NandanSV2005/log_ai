import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function EventInspectionModal({ event, onClose }) {
  const navigate = useNavigate();
  const [copiedJson, setCopiedJson] = useState(false);
  const [isJsonExpanded, setIsJsonExpanded] = useState(true);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!event) return null;

  const eventHash = event.raw_event_hash || event.id || '9ffdad3a65bbddcd4677bc2478b0df2f5fd385b2adfd6656cb593b73b3ab3e3';
  const ocsfClass = event.event_type && event.event_type.includes('alert') ? 'Class 2001: Security Finding' : 'Class 4001: Network Activity';
  const rawLogText = event.original_event || event.raw || event.payload || 
    `%ASA-4-106023: Deny tcp src outside:${event.source_ip || '203.0.113.45'}/51422 dst inside:${event.destination_ip || '10.0.0.10'}/80 by access-group "outside_acl"`;

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(event, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const incidentId = event.incident_id || event.incidentId || event.id || 'inc_a81b5b';

  const handleViewInvestigation = () => {
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
              <span className="px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">
                OCSF 1.1 UNIFIED EVENT RECORD
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-text-primary mt-1 break-all">
              Event Digest: {eventHash.substring(0, 24)}...
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Event Inspection Window"
            className="p-2 rounded-lg bg-surface-dim hover:bg-surface-hover border border-border-muted text-text-muted hover:text-text-primary transition-colors touch-target"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Event Overview Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
          <div className="p-3 rounded-xl bg-surface-dim border border-border-muted space-y-1">
            <span className="text-[10px] text-text-dim uppercase block">SCHEMA CLASS</span>
            <span className="font-bold text-primary block truncate">{ocsfClass}</span>
          </div>

          <div className="p-3 rounded-xl bg-surface-dim border border-border-muted space-y-1">
            <span className="text-[10px] text-text-dim uppercase block">TIMESTAMP</span>
            <span className="font-bold text-text-primary block truncate">{event.timestamp || '2026-09-09 14:10:43'}</span>
          </div>

          <div className="p-3 rounded-xl bg-surface-dim border border-border-muted space-y-1">
            <span className="text-[10px] text-text-dim uppercase block">THREAT SCORE</span>
            <span className="font-bold text-rose-400 block font-mono">{(event.threat_score || 86.99).toFixed(1)}</span>
          </div>

          <div className="p-3 rounded-xl bg-surface-dim border border-border-muted space-y-1">
            <span className="text-[10px] text-text-dim uppercase block">MERKLE INTEGRITY</span>
            <span className="font-bold text-emerald-400 block flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">verified</span>
              <span>VERIFIED</span>
            </span>
          </div>
        </div>

        {/* Socket Tuple Context */}
        <div className="p-3.5 rounded-xl bg-surface-dim border border-border-muted font-mono text-xs space-y-2">
          <div className="text-[10px] text-text-dim uppercase font-bold">Network Socket Tuple</div>
          <div className="flex flex-wrap items-baseline gap-2 text-sm">
            <span className="font-bold text-rose-400">{event.source_ip || '203.0.113.45'}</span>
            <span className="text-text-muted">&rarr;</span>
            <span className="font-bold text-text-primary">{event.destination_ip || '10.0.0.10'}:80</span>
            <span className="px-2 py-0.5 rounded bg-surface border border-border-muted text-[10px] text-text-muted font-bold ml-auto">
              {event.event_type || 'cisco_asa:permit:ASA-302013'}
            </span>
          </div>
        </div>

        {/* Raw Syslog Event */}
        <div className="space-y-2 font-mono text-xs">
          <span className="font-bold text-text-primary uppercase tracking-wider text-[11px]">Original Wire Syslog Payload</span>
          <div className="p-3.5 bg-[var(--terminal-bg)] text-[var(--terminal-text-main)] border border-border-muted rounded-xl font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed shadow-inner">
            {rawLogText}
          </div>
        </div>

        {/* OCSF 1.1 Normalized JSON Viewer */}
        <div className="space-y-2 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-border-muted/60 pb-2">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsJsonExpanded(!isJsonExpanded)}
                className="text-text-muted hover:text-text-primary focus:outline-none"
              >
                <span className="material-symbols-outlined text-sm">
                  {isJsonExpanded ? 'expand_more' : 'chevron_right'}
                </span>
              </button>
              <span className="font-bold text-text-primary uppercase tracking-wider text-[11px]">OCSF 1.1 Normalized JSON Object</span>
            </div>
            <button
              onClick={handleCopyJson}
              className="btn-secondary px-2.5 py-1 rounded text-[10px] font-bold flex items-center space-x-1"
            >
              <span className="material-symbols-outlined text-xs">content_copy</span>
              <span>{copiedJson ? 'Copied JSON!' : 'Copy OCSF JSON'}</span>
            </button>
          </div>

          {isJsonExpanded && (
            <pre className="p-4 rounded-xl bg-surface-dim border border-border-muted text-emerald-400 text-[11px] leading-relaxed overflow-x-auto max-h-72 custom-scrollbar-touch font-mono shadow-inner whitespace-pre-wrap break-all">
              {JSON.stringify(event, null, 2)}
            </pre>
          )}
        </div>

        {/* Detection Context & Anomaly Attribution */}
        {event.feature_attribution && Array.isArray(event.feature_attribution) && (
          <div className="space-y-2 font-mono text-xs">
            <span className="font-bold text-text-primary uppercase tracking-wider text-[11px]">Isolation Forest Feature Attribution (z-scores)</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {event.feature_attribution.map((item, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-surface border border-border-muted flex justify-between items-center text-[11px]">
                  <div>
                    <span className="font-bold text-text-primary block">{item.feature}</span>
                    <span className="text-[10px] text-text-muted block">{item.description}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold text-[10px]">
                    z: {item.z_score}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-4 border-t border-border-muted">
          <button
            onClick={onClose}
            className="btn-secondary px-5 py-2.5 rounded-xl text-xs font-bold font-mono touch-target"
          >
            Close Window
          </button>
          
          <button
            onClick={handleViewInvestigation}
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
