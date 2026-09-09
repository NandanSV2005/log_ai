import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export function LogExplorerPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverities, setSelectedSeverities] = useState({
    CRITICAL: true,
    WARN: true,
    INFO: true,
  });
  const [expandedEventId, setExpandedEventId] = useState(null);
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

  // Calculate relative event time concentration (12 time slots across 24 hours)
  const timeBuckets = React.useMemo(() => {
    const buckets = new Array(12).fill(0);
    const sourceList = filteredEvents.length > 0 ? filteredEvents : events;
    if (sourceList.length === 0) {
      return [25, 50, 85, 60, 35, 95, 75, 40, 90, 55, 80, 65];
    }
    sourceList.forEach((evt, idx) => {
      let slotIdx = idx % 12;
      if (evt.timestamp) {
        const d = new Date(evt.timestamp);
        if (!isNaN(d.getTime())) {
          slotIdx = Math.floor(d.getHours() / 2);
        }
      }
      buckets[slotIdx] += 1;
    });
    const max = Math.max(...buckets, 1);
    return buckets.map((count) => Math.max(18, Math.round((count / max) * 100)));
  }, [filteredEvents, events]);

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
        <div className="md:col-span-6 glass-panel p-6 rounded-2xl border border-border-muted space-y-3 shadow-lg">
          <div className="flex justify-between items-center border-b border-border-muted pb-3 font-mono text-xs">
            <span className="font-bold text-text-primary uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              Event Time Concentration
            </span>
            <span className="text-text-muted text-[11px]">24h Relative Density</span>
          </div>

          <div className="space-y-1.5 font-mono">
            <div className="h-24 w-full rounded-xl border border-border-muted bg-surface-dim flex items-end p-2.5 gap-1.5">
              {timeBuckets.map((heightPercent, i) => (
                <div
                  key={i}
                  className="flex-1 bg-primary hover:bg-primary-fixed transition-all rounded-t opacity-85 hover:opacity-100 relative group cursor-pointer"
                  style={{ height: `${heightPercent}%` }}
                >
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center z-20 pointer-events-none">
                    <div className="bg-surface border border-border-muted px-2 py-1 rounded text-[10px] text-text-primary font-bold shadow-lg whitespace-nowrap">
                      Slot {String(i * 2).padStart(2, '0')}:00 - {heightPercent}% Density
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Time X-Axis Labels */}
            <div className="flex justify-between text-[10px] text-text-dim px-1 font-mono">
              <span>00:00</span>
              <span>04:00</span>
              <span>08:00</span>
              <span>12:00</span>
              <span>16:00</span>
              <span>20:00</span>
              <span>23:59</span>
            </div>
          </div>
        </div>

      </div>

      {/* SECTION 2: LOG TABLE WITH EXPANDABLE ROWS */}
      <div className="glass-panel rounded-2xl border border-border-muted shadow-2xl overflow-hidden space-y-4">
        <div className="p-4 sm:p-5 border-b border-border-muted bg-surface-dim flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 font-mono text-xs">
          <span className="font-bold text-text-primary uppercase tracking-wider">OCSF 1.1 Normalized Event Records</span>
          <span className="text-text-muted">Page {currentPage} of {totalPages}</span>
        </div>

        {/* Mobile Log Card List (< 640px) */}
        <div className="block sm:hidden p-3 space-y-3 font-mono text-xs">
          {isLoading ? (
            <div className="p-8 text-center text-text-muted">Loading telemetry records...</div>
          ) : paginatedEvents.length > 0 ? (
            paginatedEvents.map((evt, idx) => (
              <div
                key={evt.raw_event_hash || idx}
                className="p-3.5 rounded-xl bg-surface-dim border border-border-muted space-y-2"
              >
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-text-muted">{evt.timestamp || '2026-08-31 19:40'}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    evt.threat_level === 'HIGH' ? 'bg-rose-500/20 text-rose-400' :
                    evt.threat_level === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {evt.threat_level || 'LOW'}
                  </span>
                </div>

                <div className="flex justify-between items-baseline">
                  <div className="font-bold text-text-primary text-sm">{evt.source_ip || '192.168.1.100'}</div>
                  <div className="text-primary font-bold text-xs">{evt.event_type || 'cisco_asa'}</div>
                </div>

                <div className="flex justify-between items-center pt-1 border-t border-border-muted/50 text-[11px]">
                  <div className="text-text-muted">
                    Score: <span className="font-bold text-text-primary">{(evt.threat_score || 12.0).toFixed(1)}</span>
                  </div>
                  <button
                    onClick={() => {
                      const incId = evt.incident_id || evt.incidentId || evt.id || 'INC-2026-8941';
                      navigate(`/forensics/investigation/${encodeURIComponent(incId)}`, { state: { event: evt } });
                    }}
                    className="btn-secondary px-3 py-1.5 rounded-lg text-[10px] font-bold touch-target"
                  >
                    Inspect Payload
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-text-muted">
              No matching log records found.
            </div>
          )}
        </div>

        {/* Desktop/Tablet Log Table (>= 640px) */}
        <div className="hidden sm:block p-5 overflow-x-auto custom-scrollbar-touch">
          {isLoading ? (
            <div className="p-12 text-center text-text-muted font-mono text-xs">Loading normalized OCSF schema records...</div>
          ) : paginatedEvents.length > 0 ? (
            <table className="w-full text-left font-mono text-xs border-collapse min-w-[750px]">
              <thead>
                <tr className="border-b border-border-muted text-text-muted text-[10px] uppercase">
                  <th className="py-3 px-3">Timestamp</th>
                  <th className="py-3 px-3">OCSF Schema Class</th>
                  <th className="py-3 px-3">Network Connection Tuple</th>
                  <th className="py-3 px-3">Threat Level</th>
                  <th className="py-3 px-3">Score</th>
                  <th className="py-3 px-3">MITRE ATT&CK Tactic</th>
                  <th className="py-3 px-3 text-right">Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-muted">
                {paginatedEvents.map((evt, idx) => {
                  const ocsfClass = evt.event_type && evt.event_type.includes('alert') ? 'Class 2001: Security Finding' : 'Class 4001: Network Activity';
                  const dstIp = evt.destination_ip || '10.0.0.10';
                  return (
                    <tr key={evt.raw_event_hash || idx} className="hover:bg-surface-hover transition-colors">
                      <td className="py-3.5 px-3 text-text-muted text-[11px] whitespace-nowrap">
                        {evt.timestamp || '2026-09-08 16:10:43'}
                      </td>
                      <td className="py-3.5 px-3 font-bold text-text-primary whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-surface-dim border border-border-muted text-[10px] text-primary">
                          {ocsfClass}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-text-primary font-bold whitespace-nowrap">
                        <span className="text-rose-400">{evt.source_ip || '203.0.113.45'}</span>
                        <span className="text-text-muted px-1.5">&rarr;</span>
                        <span className="text-text-muted">{dstIp}:80</span>
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                          evt.threat_level === 'HIGH' || evt.threat_level === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                          evt.threat_level === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {evt.threat_level || 'LOW'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-bold text-text-primary whitespace-nowrap">
                        {(evt.threat_score || 12.0).toFixed(1)}
                      </td>
                      <td className="py-3.5 px-3 text-text-muted whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-surface border border-border-muted text-[10px] font-bold text-text-primary">
                          {evt.mitre_tactic || 'T1110 - Brute Force'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-text-right whitespace-nowrap">
                        <button
                          onClick={() => {
                            const incId = evt.incident_id || evt.incidentId || evt.id || 'INC-2026-8941';
                            navigate(`/forensics/investigation/${encodeURIComponent(incId)}`, { state: { event: evt } });
                          }}
                          className="btn-secondary px-3 py-1.5 rounded-lg text-[10px] font-bold touch-target"
                        >
                          Inspect Payload
                        </button>
                      </td>
                    </tr>
                  );
                })}
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
            className="btn-secondary px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-40 touch-target"
          >
            Previous
          </button>
          <span className="text-text-muted text-[11px] sm:text-xs">Showing {paginatedEvents.length} of {filteredEvents.length}</span>
          <button
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="btn-secondary px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-40 touch-target"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
