import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export function ForensicsPage() {
  const [activeCases, setActiveCases] = useState([]);

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const res = await api.getIncidents(5);
        if (res?.incidents) {
          setActiveCases(res.incidents);
        }
      } catch (err) {
        console.error('Error fetching active cases:', err);
      }
    };
    fetchCases();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">Forensic Analysis</h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">Active case management and deep entity resolution.</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">
              search
            </span>
            <input
              type="text"
              placeholder="Search IOCs, IPs, Hashes..."
              className="w-full input-cyber pl-9 pr-4 py-2 font-mono text-xs rounded-xl bg-surface-dim border-border-muted"
            />
          </div>

          <button
            onClick={() => api.exportCSV()}
            className="btn-secondary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            <span>Export Report</span>
          </button>
        </div>
      </header>

      {/* 12-Column Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Open Investigations Panel (Span 4) */}
        <div className="lg:col-span-4 glass-panel rounded-2xl border border-border-muted overflow-hidden flex flex-col shadow-xl">
          <div className="p-4 border-b border-border-muted flex justify-between items-center bg-surface-dim">
            <h3 className="text-xs font-mono font-bold text-text-primary uppercase tracking-wider">Open Investigations</h3>
            <span className="font-mono text-[10px] font-bold bg-surface-container border border-border-muted px-2 py-0.5 rounded text-text-muted">
              {activeCases.length || 3} ACTIVE
            </span>
          </div>

          <div className="p-4 flex-1 overflow-y-auto space-y-3 bg-surface-dim">
            {activeCases.length > 0 ? (
              activeCases.map((incident, idx) => (
                <div
                  key={idx}
                  className="p-3 border-l-4 border-rose-500 bg-surface-hover rounded-r-xl border border-border-muted hover:border-primary transition-colors cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-mono text-xs font-bold text-rose-400">CASE-{incident.id || '8992-A'}</span>
                    <span className="font-mono text-[10px] text-text-muted">2h ago</span>
                  </div>
                  <h4 className="font-bold text-xs text-text-primary mb-1">{incident.title || 'Ransomware Lateral Movement'}</h4>
                  <p className="text-[11px] text-text-muted line-clamp-1">{incident.description || 'Detected anomaly in SMB traffic.'}</p>
                  <div className="mt-2 flex gap-1.5">
                    <span className="px-2 py-0.5 bg-surface text-rose-400 font-mono text-[9px] font-bold border border-rose-500/30 rounded uppercase">
                      {incident.severity || 'CRITICAL'}
                    </span>
                    <span className="px-2 py-0.5 bg-surface text-text-muted font-mono text-[9px] border border-border-muted rounded uppercase">
                      {incident.target_ip ? `IP ${incident.target_ip}` : 'MALWARE'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <>
                <div className="p-3 border-l-4 border-rose-500 bg-surface-hover rounded-r-xl border border-border-muted cursor-pointer">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-mono text-xs font-bold text-rose-400">CASE-8992-A</span>
                    <span className="font-mono text-[10px] text-text-muted">2h ago</span>
                  </div>
                  <h4 className="font-bold text-xs text-text-primary mb-1">Ransomware Lateral Movement</h4>
                  <p className="text-[11px] text-text-muted line-clamp-1">Detected anomaly in SMB traffic from HR subnet.</p>
                  <div className="mt-2 flex gap-1.5">
                    <span className="px-2 py-0.5 bg-surface text-rose-400 font-mono text-[9px] font-bold border border-rose-500/30 rounded uppercase">
                      CRITICAL
                    </span>
                    <span className="px-2 py-0.5 bg-surface text-text-muted font-mono text-[9px] border border-border-muted rounded uppercase">
                      MALWARE
                    </span>
                  </div>
                </div>

                <div className="p-3 border-l-4 border-amber-500 bg-surface-dim rounded-r-xl border border-border-muted cursor-pointer">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-mono text-xs font-bold text-amber-400">CASE-8984-C</span>
                    <span className="font-mono text-[10px] text-text-muted">14h ago</span>
                  </div>
                  <h4 className="font-bold text-xs text-text-primary mb-1">Suspicious Login Spike</h4>
                  <p className="text-[11px] text-text-muted line-clamp-1">Multiple failed auth attempts from unknown ASN.</p>
                  <div className="mt-2 flex gap-1.5">
                    <span className="px-2 py-0.5 bg-surface text-amber-400 font-mono text-[9px] font-bold border border-amber-500/30 rounded uppercase">
                      HIGH
                    </span>
                    <span className="px-2 py-0.5 bg-surface text-text-muted font-mono text-[9px] border border-border-muted rounded uppercase">
                      AUTH
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Column: AI Entity Graph & Event Timeline (Span 8) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* AI Entity Relationship Graph Widget */}
          <div className="glass-panel border border-border-muted rounded-2xl p-4 flex flex-col h-80 relative overflow-hidden shadow-xl">
            <div className="flex justify-between items-center mb-3 z-10 relative">
              <h3 className="text-xs font-mono font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-sm">hub</span>
                <span>AI Entity Relationship</span>
              </h3>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-mono text-[10px] text-emerald-400 font-bold">AI ACTIVE</span>
              </div>
            </div>

            {/* Interactive Vector Node Canvas */}
            <div className="flex-1 w-full rounded-xl border border-border-muted relative bg-surface-dim overflow-hidden flex items-center justify-center">
              <div className="relative w-full h-full">
                {/* Node 1: Threat Actor */}
                <div className="absolute top-1/4 left-1/4 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10">
                  <div className="w-10 h-10 rounded-full border-2 border-rose-500 bg-surface-dim flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.4)]">
                    <span className="material-symbols-outlined text-rose-500 text-lg">skull</span>
                  </div>
                  <span className="mt-1 font-mono text-[10px] text-text-muted bg-surface px-2 py-0.5 rounded border border-border-muted">
                    APT-29
                  </span>
                </div>

                {/* Node 2: Compromised Asset */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10">
                  <div className="w-14 h-14 rounded-full border-2 border-primary bg-surface-hover flex items-center justify-center shadow-[0_0_20px_rgba(167,139,250,0.5)]">
                    <span className="material-symbols-outlined text-primary text-2xl">computer</span>
                  </div>
                  <span className="mt-1 font-mono text-[10px] text-text-primary bg-surface px-2 py-0.5 rounded border border-border-muted font-bold">
                    HR-SERVER-01
                  </span>
                </div>

                {/* Node 3: Payload */}
                <div className="absolute bottom-1/4 right-1/4 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10">
                  <div className="w-10 h-10 rounded-full border-2 border-amber-500 bg-surface-dim flex items-center justify-center shadow-[0_0_10px_rgba(245,158,11,0.3)]">
                    <span className="material-symbols-outlined text-amber-500 text-lg">description</span>
                  </div>
                  <span className="mt-1 font-mono text-[10px] text-text-muted bg-surface px-2 py-0.5 rounded border border-border-muted">
                    payload.exe
                  </span>
                </div>

                {/* Connecting Lines SVG */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                  <line stroke="#ef4444" strokeDasharray="4,4" strokeWidth="1.5" x1="25%" x2="50%" y1="25%" y2="50%"></line>
                  <line stroke="#a78bfa" strokeWidth="1.5" x1="50%" x2="75%" y1="50%" y2="75%"></line>
                </svg>
              </div>
            </div>
          </div>

          {/* Event Timeline Widget */}
          <div className="glass-panel border border-border-muted rounded-2xl flex flex-col overflow-hidden shadow-xl">
            <div className="bg-surface-dim border-b border-border-muted p-4 flex justify-between items-center">
              <h3 className="text-xs font-mono font-bold text-text-primary uppercase tracking-wider">Event Timeline</h3>
              <span className="px-2 py-0.5 bg-surface border border-border-muted rounded font-mono text-[10px] text-text-muted">
                FILTER: ALL
              </span>
            </div>

            <div className="p-4 space-y-4 font-mono text-xs bg-surface-dim">
              <div className="relative border-l border-border-muted ml-3 pl-5 space-y-4">
                {/* Timeline Item 1 */}
                <div className="relative">
                  <div className="absolute -left-[25px] w-3 h-3 bg-rose-500 rounded-full border-2 border-surface-dim shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
                  <div className="text-[10px] text-text-muted mb-1">2026-08-30 14:32:01 UTC</div>
                  <div className="bg-surface-container border border-border-muted rounded-xl p-3 hover:border-rose-500 transition-colors">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-rose-400 text-xs">Lateral Movement Detected</h4>
                      <span className="material-symbols-outlined text-rose-500 text-base">warning</span>
                    </div>
                    <p className="text-[11px] text-text-muted mt-1 leading-relaxed">
                      Source: 192.168.1.105 (HR-SERVER-01) &rarr; Dest: 10.0.0.5 (DC-01) [SMB 445]
                    </p>
                  </div>
                </div>

                {/* Timeline Item 2 */}
                <div className="relative">
                  <div className="absolute -left-[25px] w-3 h-3 bg-amber-500 rounded-full border-2 border-surface-dim"></div>
                  <div className="text-[10px] text-text-muted mb-1">2026-08-30 14:15:22 UTC</div>
                  <div className="bg-surface-container border border-border-muted rounded-xl p-3">
                    <h4 className="font-bold text-amber-400 text-xs">Suspicious Process Execution</h4>
                    <p className="text-[11px] text-text-muted mt-1">
                      Process: powershell.exe -enc JABzAD0ATgBlAHcALQBPAGIAag...
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
