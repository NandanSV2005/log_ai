import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export function LogExplorerPage() {
  const [events, setEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEventJson, setSelectedEventJson] = useState(null);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const data = await api.getRecentEvents(200);
      if (data?.events) {
        setEvents(data.events);
      }
    } catch (err) {
      console.error('Error fetching log explorer events:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const filteredEvents = events.filter((evt) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      (evt.source_ip || '').toLowerCase().includes(q) ||
      (evt.event_type || '').toLowerCase().includes(q) ||
      (evt.mitre_tactic || '').toLowerCase().includes(q) ||
      (evt.raw_event_hash || '').toLowerCase().includes(q) ||
      (evt.original_event || '').toLowerCase().includes(q);

    const matchesLevel =
      filterLevel === 'ALL' ||
      (evt.threat_level || 'LOW').toUpperCase() === filterLevel;

    return matchesSearch && matchesLevel;
  });

  const handleExportCsv = async () => {
    try {
      await api.exportCsv();
    } catch (err) {
      alert(`Export Failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Controls */}
      <div className="glass-panel p-6 rounded-2xl border border-border-muted space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary border border-primary/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">database</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-text-primary">Log Explorer & Query Studio</h1>
              <p className="text-xs text-text-muted">Structured search & analysis over normalized OCSF 1.1 telemetry</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchEvents}
              className="btn-secondary px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
              <span>Refresh</span>
            </button>
            <button
              onClick={handleExportCsv}
              className="btn-primary px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              <span>Export CSV Threat Report</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="sm:col-span-2 relative">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-text-muted text-lg">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by IP, event type, MITRE tactic, payload hash..."
              className="input-cyber w-full rounded-xl py-2.5 pl-10 pr-4 text-xs font-mono bg-surface-dim border-border-muted"
            />
          </div>

          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="input-cyber rounded-xl py-2.5 px-3 text-xs font-mono bg-surface-dim border-border-muted"
          >
            <option value="ALL">All Threat Levels</option>
            <option value="HIGH">HIGH Severity Only</option>
            <option value="MEDIUM">MEDIUM Severity Only</option>
            <option value="LOW">LOW / Benign Only</option>
          </select>
        </div>
      </div>

      {/* Events Results Table */}
      <div className="glass-panel rounded-2xl border border-border-muted overflow-hidden shadow-lg">
        <div className="p-4 border-b border-border-muted bg-surface-dim flex items-center justify-between text-xs font-mono text-text-muted">
          <span>Showing {filteredEvents.length} of {events.length} Normalized Records</span>
          <span>OCSF 1.1 Normalized Stream</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              <tr className="border-b border-border-muted bg-surface-container text-text-muted font-mono text-[11px]">
                <th className="p-3.5 pl-5">Timestamp</th>
                <th className="p-3.5">Source IP</th>
                <th className="p-3.5">Parser / Event Type</th>
                <th className="p-3.5">Level & Score</th>
                <th className="p-3.5">MITRE Tactic</th>
                <th className="p-3.5">Merkle Hash</th>
                <th className="p-3.5 pr-5 text-right">Inspect JSON</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-muted/50 font-mono">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-text-muted">
                    Loading normalized telemetry buffer...
                  </td>
                </tr>
              ) : filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-text-muted">
                    No matching log events found.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((evt, idx) => {
                  const threatLvl = (evt.threat_level || 'LOW').toUpperCase();
                  return (
                    <tr key={idx} className="hover:bg-surface-hover/60 transition-colors">
                      <td className="p-3.5 pl-5 text-text-muted">{evt.timestamp || 'N/A'}</td>
                      <td className="p-3.5 font-bold text-text-primary">{evt.source_ip || 'N/A'}</td>
                      <td className="p-3.5 text-text-muted">{evt.event_type || 'unstructured_log'}</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
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
                      <td className="p-3.5 text-text-muted">{evt.mitre_tactic || 'General Anomaly'}</td>
                      <td className="p-3.5 text-[10px] text-text-dim">
                        {(evt.raw_event_hash || evt.payload_hash || 'N/A').substring(0, 16)}...
                      </td>
                      <td className="p-3.5 pr-5 text-right font-sans">
                        <button
                          onClick={() => setSelectedEventJson(evt)}
                          className="px-2.5 py-1 rounded bg-surface-container border border-border-muted text-primary text-[11px] font-bold hover:bg-surface-hover"
                        >
                          View OCSF JSON
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* JSON Viewer Modal */}
      {selectedEventJson && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-2xl rounded-2xl border border-border-muted overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95">
            <div className="p-4 border-b border-border-muted bg-surface-dim flex items-center justify-between">
              <div className="font-bold text-sm text-text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base">code</span>
                <span>UnifiedEvent OCSF 1.1 Schema</span>
              </div>
              <button
                onClick={() => setSelectedEventJson(null)}
                className="p-1 text-text-muted hover:text-text-primary"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 bg-surface-lowest">
              <pre className="text-xs font-mono text-emerald-400 whitespace-pre-wrap leading-relaxed">
                {JSON.stringify(selectedEventJson, null, 2)}
              </pre>
            </div>
            <div className="p-4 border-t border-border-muted bg-surface-dim text-right">
              <button
                onClick={() => setSelectedEventJson(null)}
                className="btn-secondary px-4 py-1.5 rounded-lg text-xs font-bold"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
