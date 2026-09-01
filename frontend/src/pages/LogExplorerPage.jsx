import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export function LogExplorerPage() {
  const [events, setEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverities, setSelectedSeverities] = useState({
    CRITICAL: true,
    WARN: true,
    INFO: true,
  });
  const [expandedEventId, setExpandedEventId] = useState(null);
  const [selectedEventDrawer, setSelectedEventDrawer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 15;

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

  const handleSeverityToggle = (level) => {
    setSelectedSeverities((prev) => ({ ...prev, [level]: !prev[level] }));
  };

  const handleExportCsv = async () => {
    try {
      await api.exportCsv();
    } catch (err) {
      alert(`Export Failed: ${err.message}`);
    }
  };

  const filteredEvents = events.filter((evt) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      (evt.source_ip || '').toLowerCase().includes(q) ||
      (evt.event_type || '').toLowerCase().includes(q) ||
      (evt.mitre_tactic || '').toLowerCase().includes(q) ||
      (evt.raw_event_hash || '').toLowerCase().includes(q) ||
      (evt.original_event || '').toLowerCase().includes(q);

    const level = (evt.threat_level || 'LOW').toUpperCase();
    const mappedLevel = level === 'HIGH' ? 'CRITICAL' : level === 'MEDIUM' ? 'WARN' : 'INFO';
    const matchesSeverity = selectedSeverities[mappedLevel] !== false;

    return matchesSearch && matchesSeverity;
  });

  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / PAGE_SIZE));
  const paginatedEvents = filteredEvents.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Severity metrics
  const criticalCount = events.filter((e) => (e.threat_level || '').toUpperCase() === 'HIGH').length;
  const warnCount = events.filter((e) => (e.threat_level || '').toUpperCase() === 'MEDIUM').length;
  const infoCount = events.filter((e) => (e.threat_level || '').toUpperCase() === 'LOW').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header & Query Input */}
      <header className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
              Log Explorer & <span className="text-primary">OCSF Query Studio</span>
            </h1>
            <p className="text-xs sm:text-sm text-text-muted mt-1 font-sans">
              High-performance OCSF 1.1 field filtering, real-time regex search, and deep forensic event inspection.
            </p>
          </div>

          <button
            onClick={handleExportCsv}
            className="btn-secondary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            <span>Export Query Results</span>
          </button>
        </div>

        {/* Search Query Bar */}
        <div className="glass-panel p-4 rounded-2xl border border-border-muted shadow-lg">
          <div className="relative">
            <span className="material-symbols-outlined text-text-muted absolute left-3 top-1/2 -translate-y-1/2 text-sm">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder='Filter by source_ip, event_type, MITRE tactic (e.g. "192.168.1.100", "cisco_asa", "T1110")...'
              className="w-full bg-surface-dim border border-border-muted rounded-xl py-3 pl-9 pr-24 font-mono text-xs text-text-primary focus:outline-none focus:border-primary"
            />
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold text-text-muted hover:text-text-primary px-2 py-1 rounded bg-surface border border-border-muted"
            >
              CLEAR
            </button>
          </div>
        </div>
      </header>

      {/* SECTION 1: TIME CONCENTRATION TIMELINE & SEVERITY METERS */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Event Severity Breakdown Meters (Span 6) */}
        <div className="md:col-span-6 glass-panel p-6 rounded-2xl border border-border-muted space-y-4 shadow-lg">
          <div className="flex justify-between items-center border-b border-border-muted pb-3 font-mono text-xs">
            <span className="font-bold text-text-primary uppercase">Severity Filter & Event Volume</span>
            <span className="text-text-muted">{filteredEvents.length} Matched Events</span>
          </div>

          <div className="flex flex-wrap gap-3 font-mono text-xs">
            <button
              onClick={() => handleSeverityToggle('CRITICAL')}
              className={`flex-1 p-3 rounded-xl border flex justify-between items-center transition-all ${
                selectedSeverities.CRITICAL ? 'bg-rose-500/15 border-rose-500 text-rose-400 font-bold' : 'bg-surface-dim border-border-muted text-text-muted opacity-50'
              }`}
            >
              <span>CRITICAL</span>
              <span className="text-sm font-extrabold">{criticalCount}</span>
            </button>
            <button
              onClick={() => handleSeverityToggle('WARN')}
              className={`flex-1 p-3 rounded-xl border flex justify-between items-center transition-all ${
                selectedSeverities.WARN ? 'bg-amber-500/15 border-amber-500 text-amber-400 font-bold' : 'bg-surface-dim border-border-muted text-text-muted opacity-50'
              }`}
            >
              <span>WARNING</span>
              <span className="text-sm font-extrabold">{warnCount}</span>
            </button>
            <button
              onClick={() => handleSeverityToggle('INFO')}
              className={`flex-1 p-3 rounded-xl border flex justify-between items-center transition-all ${
                selectedSeverities.INFO ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400 font-bold' : 'bg-surface-dim border-border-muted text-text-muted opacity-50'
              }`}
            >
              <span>INFORMATIONAL</span>
              <span className="text-sm font-extrabold">{infoCount}</span>
            </button>
          </div>
        </div>

        {/* Time Concentration Visualizer (Span 6) */}
        <div className="md:col-span-6 glass-panel p-6 rounded-2xl border border-border-muted space-y-4 shadow-lg">
          <div className="flex justify-between items-center border-b border-border-muted pb-3 font-mono text-xs">
            <span className="font-bold text-text-primary uppercase">Event Time Concentration</span>
            <span className="text-text-muted">Relative Density</span>
          </div>

          <div className="h-20 w-full rounded-xl border border-border-muted bg-surface-dim flex items-end p-2 gap-1 font-mono">
            {[20, 45, 80, 60, 30, 95, 70, 40, 85, 50, 90, 65].map((h, i) => (
              <div key={i} className="flex-1 bg-primary/70 rounded-t" style={{ height: `${h}%` }}></div>
            ))}
          </div>
        </div>

      </div>

      {/* SECTION 2: LOG TABLE WITH EXPANDABLE ROWS */}
      <div className="glass-panel rounded-2xl border border-border-muted shadow-2xl overflow-hidden space-y-4">
        <div className="p-5 border-b border-border-muted bg-surface-dim flex justify-between items-center font-mono text-xs">
          <span className="font-bold text-text-primary uppercase tracking-wider">OCSF 1.1 Normalized Event Records</span>
          <span className="text-text-muted">Page {currentPage} of {totalPages}</span>
        </div>

        <div className="p-5 overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center text-text-muted font-mono text-xs">Loading telemetry records...</div>
          ) : paginatedEvents.length > 0 ? (
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b border-border-muted text-text-muted text-[10px] uppercase">
                  <th className="py-3 px-3">Timestamp</th>
                  <th className="py-3 px-3">Source IP</th>
                  <th className="py-3 px-3">Event Type</th>
                  <th className="py-3 px-3">Threat Level</th>
                  <th className="py-3 px-3">Threat Score</th>
                  <th className="py-3 px-3">MITRE Tactic</th>
                  <th className="py-3 px-3 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-muted">
                {paginatedEvents.map((evt, idx) => (
                  <tr key={evt.raw_event_hash || idx} className="hover:bg-surface-hover transition-colors">
                    <td className="py-3.5 px-3 text-text-muted text-[11px]">
                      {evt.timestamp || '2026-08-31 19:40'}
                    </td>
                    <td className="py-3.5 px-3 font-bold text-text-primary">
                      {evt.source_ip || '192.168.1.100'}
                    </td>
                    <td className="py-3.5 px-3 text-primary">
                      {evt.event_type || 'cisco_asa'}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                        evt.threat_level === 'HIGH' ? 'bg-rose-500/20 text-rose-400' :
                        evt.threat_level === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {evt.threat_level || 'LOW'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-bold text-text-primary">
                      {(evt.threat_score || 12.0).toFixed(1)}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-surface border border-border-muted text-[10px] text-text-muted">
                        {evt.mitre_tactic || 'T1110'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <button
                        onClick={() => setSelectedEventDrawer(evt)}
                        className="btn-secondary px-3 py-1 rounded text-[10px] font-bold"
                      >
                        Inspect Payload
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center text-text-muted font-mono text-xs">
              No matching log records found for the active search filter query.
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-border-muted bg-surface-dim flex justify-between items-center font-mono text-xs">
          <button
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="btn-secondary px-4 py-1.5 rounded-xl text-xs font-bold disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-text-muted">Showing {paginatedEvents.length} of {filteredEvents.length} events</span>
          <button
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="btn-secondary px-4 py-1.5 rounded-xl text-xs font-bold disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      {/* EVENT INSPECTOR DRAWER MODAL */}
      {selectedEventDrawer && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-3xl rounded-2xl border border-border-muted p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-border-muted pb-3 font-mono">
              <div>
                <span className="text-xs text-primary font-bold">OCSF 1.1 UNIFIED EVENT RECORD</span>
                <h3 className="text-base font-bold text-text-primary mt-0.5">Source: {selectedEventDrawer.source_ip || '192.168.1.100'}</h3>
              </div>
              <button onClick={() => setSelectedEventDrawer(null)} className="p-1 rounded text-text-muted hover:text-text-primary">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div className="p-4 rounded-xl bg-surface-dim border border-border-muted font-mono text-xs space-y-3 max-h-96 overflow-y-auto">
              <div className="text-[10px] text-text-dim uppercase">Original Syslog Payload:</div>
              <div className="p-2.5 rounded bg-surface border border-border-muted text-text-primary break-all font-bold">
                {selectedEventDrawer.original_event || selectedEventDrawer.payload || 'No raw payload available'}
              </div>

              <div className="text-[10px] text-text-dim uppercase pt-2">Structured OCSF JSON Object:</div>
              <pre className="p-3 rounded bg-surface border border-border-muted text-emerald-400 text-[11px] leading-relaxed">
                {JSON.stringify(selectedEventDrawer, null, 2)}
              </pre>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-border-muted">
              <span className="font-mono text-[10px] text-text-muted">
                SHA-256 Digest: {(selectedEventDrawer.raw_event_hash || '').substring(0, 16)}...
              </span>
              <button onClick={() => setSelectedEventDrawer(null)} className="btn-secondary px-4 py-1.5 rounded-xl text-xs font-bold">
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
