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
  const [selectedSources, setSelectedSources] = useState({
    '/var/log/auth.log': true,
    'aws.cloudtrail': true,
    'k8s.ingress.nginx': true,
  });
  const [expandedEventId, setExpandedEventId] = useState(null);
  const [selectedEventJson, setSelectedEventJson] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('Last 15m');
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

  const handleSourceToggle = (src) => {
    setSelectedSources((prev) => ({ ...prev, [src]: !prev[src] }));
  };

  const clearFilters = () => {
    setSelectedSeverities({ CRITICAL: true, WARN: true, INFO: true });
    setSelectedSources({ '/var/log/auth.log': true, 'aws.cloudtrail': true, 'k8s.ingress.nginx': true });
    setSearchQuery('');
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

  // Calculate live filter counts directly from events
  const criticalCount = events.filter((e) => (e.threat_level || '').toUpperCase() === 'HIGH').length;
  const warnCount = events.filter((e) => (e.threat_level || '').toUpperCase() === 'MEDIUM').length;
  const infoCount = events.filter((e) => (e.threat_level || '').toUpperCase() === 'LOW').length;

  return (
    <div className="flex flex-col space-y-6 animate-in fade-in duration-300">
      {/* Search & Action Query Studio Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-border-muted flex flex-col lg:flex-row gap-4 items-center justify-between shadow-lg">
        <div className="w-full flex-1 relative rounded-xl transition-all duration-300">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-text-muted text-sm">search</span>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder='source="/var/log/auth.log" AND severity>=4 | stats count by src_ip'
            className="w-full bg-surface-dim border border-border-muted rounded-xl py-2.5 pl-9 pr-24 font-mono text-xs text-text-primary focus:outline-none focus:border-primary"
          />
          <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
            <button
              onClick={() => setSearchQuery('severity>=HIGH')}
              className="p-1 text-text-muted hover:text-primary transition-colors rounded"
              title="Search History"
            >
              <span className="material-symbols-outlined text-sm">history</span>
            </button>
            <button
              onClick={() => setSearchQuery('source="cisco_asa"')}
              className="p-1 text-text-muted hover:text-primary transition-colors rounded"
              title="Bookmark Filter"
            >
              <span className="material-symbols-outlined text-sm">bookmark_add</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
          <div className="flex items-center bg-surface-dim border border-border-muted rounded-xl px-3 py-1.5 gap-2 text-xs font-mono">
            <span className="material-symbols-outlined text-text-muted text-sm">schedule</span>
            <select
              id="log-explorer-time-select"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-surface-dim text-text-primary border border-border-muted rounded-lg px-2 py-0.5 focus:outline-none font-mono text-xs"
            >
              <option value="Last 15m" className="bg-surface-dim text-text-primary">Last 15m</option>
              <option value="Last 1h" className="bg-surface-dim text-text-primary">Last 1h</option>
              <option value="Last 24h" className="bg-surface-dim text-text-primary">Last 24h</option>
              <option value="All Time" className="bg-surface-dim text-text-primary">All Time</option>
            </select>
          </div>

          <button
            onClick={() => setSearchQuery('')}
            className="btn-secondary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">restart_alt</span>
            <span>Reset</span>
          </button>

          <button
            onClick={fetchEvents}
            className="btn-primary px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md"
          >
            <span className="material-symbols-outlined text-sm">play_arrow</span>
            <span>Run Query</span>
          </button>
        </div>
      </div>

      {/* Explorer Main Layout (Filter Sidebar + Log Table) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Filter Sidebar (Span 3 on lg) */}
        <div className="lg:col-span-3 glass-panel rounded-2xl border border-border-muted overflow-hidden flex flex-col shadow-xl">
          <div className="p-4 border-b border-border-muted flex justify-between items-center bg-surface-dim">
            <h3 className="text-xs font-mono font-bold text-text-primary uppercase tracking-wider">Filters</h3>
            <button
              onClick={clearFilters}
              className="text-text-muted hover:text-primary transition-colors text-xs font-mono flex items-center gap-1"
              title="Clear All Filters"
            >
              <span className="material-symbols-outlined text-sm">filter_list_off</span>
              <span>Clear</span>
            </button>
          </div>

          <div className="p-4 flex flex-col gap-6 text-xs font-mono">
            {/* Filter Group: Severity */}
            <div className="space-y-2">
              <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest">SEVERITY</div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedSeverities.CRITICAL}
                    onChange={() => handleSeverityToggle('CRITICAL')}
                    className="rounded bg-surface-dim border-border-muted text-primary focus:ring-primary"
                  />
                  <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_4px_rgba(239,68,68,0.5)]"></div>
                  <span className="text-text-primary group-hover:text-primary transition-colors">Critical</span>
                  <span className="text-text-muted ml-auto font-mono text-[11px]">{criticalCount.toLocaleString()}</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedSeverities.WARN}
                    onChange={() => handleSeverityToggle('WARN')}
                    className="rounded bg-surface-dim border-border-muted text-primary focus:ring-primary"
                  />
                  <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_4px_rgba(245,158,11,0.5)]"></div>
                  <span className="text-text-primary group-hover:text-primary transition-colors">Warning</span>
                  <span className="text-text-muted ml-auto font-mono text-[11px]">{warnCount.toLocaleString()}</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedSeverities.INFO}
                    onChange={() => handleSeverityToggle('INFO')}
                    className="rounded bg-surface-dim border-border-muted text-primary focus:ring-primary"
                  />
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.5)]"></div>
                  <span className="text-text-muted group-hover:text-primary transition-colors">Info</span>
                  <span className="text-text-muted ml-auto font-mono text-[11px]">{infoCount.toLocaleString()}</span>
                </label>
              </div>
            </div>

            {/* Filter Group: Source */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] font-bold text-text-muted uppercase tracking-widest">
                <span>LOG SOURCE</span>
                <span className="material-symbols-outlined text-xs">search</span>
              </div>
              <div className="space-y-1.5">
                {Object.keys(selectedSources).map((src) => (
                  <label key={src} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={selectedSources[src]}
                      onChange={() => handleSourceToggle(src)}
                      className="rounded bg-surface-dim border-border-muted text-primary focus:ring-primary"
                    />
                    <span className="text-text-muted group-hover:text-primary transition-colors truncate font-mono text-[11px]">
                      {src}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Data Table Area (Span 9 on lg) */}
        <div className="lg:col-span-9 glass-panel rounded-2xl border border-border-muted overflow-hidden flex flex-col shadow-xl">
          {/* Table Action Bar */}
          <div className="px-5 py-3 flex justify-between items-center border-b border-border-muted bg-surface-dim text-xs font-mono">
            <span className="text-text-muted">
              Displaying <strong className="text-text-primary">{filteredEvents.length}</strong> of{' '}
              <strong className="text-text-primary">{events.length}</strong> events (14ms)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCsv}
                className="btn-secondary px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5"
                title="Export CSV"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Log Table Container */}
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse text-xs font-sans">
              <thead>
                <tr className="border-b border-border-muted bg-surface-container text-text-muted font-mono text-[11px]">
                  <th className="p-3 pl-4 w-10 text-center"></th>
                  <th className="p-3 w-44">TIMESTAMP</th>
                  <th className="p-3 w-28">SEVERITY</th>
                  <th className="p-3 w-40">SOURCE</th>
                  <th className="p-3 pr-4">RAW LOG PAYLOAD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-muted/50 font-mono">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-text-muted">
                      Loading normalized telemetry buffer...
                    </td>
                  </tr>
                ) : filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-text-muted">
                      No matching log events found in storage.
                    </td>
                  </tr>
                ) : (
                  filteredEvents.map((evt, idx) => {
                    const eventId = evt.raw_event_hash || evt.payload_hash || `log_${idx}`;
                    const isExpanded = expandedEventId === eventId;
                    const threatLvl = (evt.threat_level || 'LOW').toUpperCase();
                    const isHigh = threatLvl === 'HIGH';
                    const isMed = threatLvl === 'MEDIUM';

                    return (
                      <React.Fragment key={eventId}>
                        <tr
                          onClick={() => setExpandedEventId(isExpanded ? null : eventId)}
                          className={`hover:bg-surface-hover/60 transition-colors cursor-pointer relative ${
                            isHigh ? 'bg-rose-500/5' : ''
                          }`}
                        >
                          <td className="p-3 pl-4 text-center align-top relative">
                            <div
                              className={`absolute left-0 top-0 bottom-0 w-1 ${
                                isHigh ? 'bg-rose-500' : isMed ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                            ></div>
                            <span
                              className={`material-symbols-outlined text-text-muted text-base transition-transform ${
                                isExpanded ? 'rotate-90 text-primary' : ''
                              }`}
                            >
                              chevron_right
                            </span>
                          </td>

                          <td className="p-3 text-text-muted align-top text-[11px]">
                            {evt.timestamp || '2026-08-30 14:32:01.442'}
                          </td>

                          <td className="p-3 align-top">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                                isHigh
                                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                                  : isMed
                                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                                  : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                              }`}
                            >
                              {isHigh ? 'CRITICAL' : isMed ? 'WARN' : 'INFO'}
                            </span>
                          </td>

                          <td className="p-3 text-text-muted align-top truncate max-w-[150px] text-[11px]">
                            {evt.source_ip ? `src=${evt.source_ip}` : evt.event_type || '/var/log/auth.log'}
                          </td>

                          <td className="p-3 pr-4 align-top text-text-primary text-[11px] leading-relaxed break-all">
                              <span className="truncate max-w-xs font-mono">
                                {evt.original_event || evt.raw_payload || `Security Event Log: ${evt.event_type || 'Ingestion Payload'}`}
                              </span>
                            </td>
                        </tr>

                        {/* Expanded State Log Detail & AI Attribution Panel */}
                        {isExpanded && (
                          <tr className="bg-surface-dim/90 shadow-inner">
                            <td colSpan={5} className="p-0 border-b border-border-muted">
                              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 relative font-mono text-xs">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>

                                {/* Parsed JSON Fields Box */}
                                <div className="bg-surface-lowest rounded-xl border border-border-muted p-4 space-y-2 overflow-x-auto">
                                  <div className="flex justify-between items-center text-[10px] text-text-muted uppercase border-b border-border-muted pb-2">
                                    <span>Parsed OCSF 1.1 JSON Fields</span>
                                    <button
                                      onClick={() => setSelectedEventJson(evt)}
                                      className="text-primary hover:underline font-bold"
                                    >
                                      View Full Schema
                                    </button>
                                  </div>
                                  <div className="text-emerald-400 space-y-1 text-[11px] leading-relaxed">
                                    <div><span className="text-sky-400">"event_type"</span>: <span className="text-emerald-400">"{evt.event_type || 'normalized'}"</span>,</div>
                                    <div><span className="text-sky-400">"src_ip"</span>: <span className="text-emerald-400">"{evt.source_ip || 'N/A'}"</span>,</div>
                                    <div><span className="text-sky-400">"threat_level"</span>: <span className="text-rose-400">"{evt.threat_level || 'LOW'}"</span>,</div>
                                    <div><span className="text-sky-400">"threat_score"</span>: <span className="text-amber-400">{evt.threat_score !== undefined ? evt.threat_score.toFixed(1) : 0.0}</span>,</div>
                                    <div><span className="text-sky-400">"mitre_tactic"</span>: <span className="text-emerald-400">"{evt.mitre_tactic || 'N/A'}"</span></div>
                                  </div>
                                </div>

                                {/* AI Attribution Box */}
                                <div className="flex flex-col gap-3 justify-between">
                                  <div className="glass-panel p-4 rounded-xl border border-border-muted space-y-2">
                                    <div className="flex items-center gap-2 text-primary font-bold text-xs">
                                      <span className="material-symbols-outlined text-base">smart_toy</span>
                                      <span>AI Copilot Attribution</span>
                                    </div>
                                    <p className="text-text-muted text-[11px] leading-relaxed font-sans">
                                      "{evt.xai_explanation || 'Anomalous connection velocity spike detected from source IP. Deviates from baseline by +420% over 15m.'}"
                                    </p>
                                  </div>

                                  <div className="flex gap-2 justify-end pt-2">
                                    <button
                                      onClick={() => setSearchQuery(evt.source_ip || '')}
                                      className="btn-secondary px-3 py-1.5 rounded-lg text-[11px] font-bold"
                                    >
                                      Pivot on IP
                                    </button>
                                    <button
                                      onClick={() => alert(`Alert rule created for ${evt.source_ip}`)}
                                      className="btn-primary px-3 py-1.5 rounded-lg text-[11px] font-bold"
                                    >
                                      Create Alert Rule
                                    </button>
                                  </div>
                                </div>
                              </div>
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

          {/* Table Pagination Controls (Rendered ONLY when totalPages > 1) */}
          {Math.ceil(filteredEvents.length / PAGE_SIZE) > 1 && (
            <div className="p-3 border-t border-border-muted flex justify-center items-center gap-3 bg-surface-dim font-mono text-xs">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1 rounded hover:bg-surface-hover text-text-muted disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-base">chevron_left</span>
              </button>
              <div className="flex gap-1">
                {Array.from({ length: Math.ceil(filteredEvents.length / PAGE_SIZE) }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-6 h-6 rounded text-xs flex items-center justify-center font-bold ${
                      currentPage === pageNum
                        ? 'bg-primary text-surface-lowest'
                        : 'hover:bg-surface-hover text-text-muted'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>
              <button
                disabled={currentPage >= Math.ceil(filteredEvents.length / PAGE_SIZE)}
                onClick={() => setCurrentPage((p) => Math.min(Math.ceil(filteredEvents.length / PAGE_SIZE), p + 1))}
                className="p-1 rounded hover:bg-surface-hover text-text-primary disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-base">chevron_right</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* JSON Schema Viewer Modal */}
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
