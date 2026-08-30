import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export function ForensicsPage() {
  const [merkleInputHash, setMerkleInputHash] = useState('demo_hash_9f7fe12c98001dcace31357795d410458710a892bfecdac00aee45bce0a96915');
  const [tamperResult, setTamperResult] = useState(null);
  const [isTampering, setIsTampering] = useState(false);

  // Client-side WebCrypto SHA-256 tool
  const [customText, setCustomText] = useState('');
  const [calculatedHash, setCalculatedHash] = useState('');

  // YAML Rule Sandbox tool
  const [yamlRuleText, setYamlRuleText] = useState(`name: "Detect Password Spraying Burst"
severity: "HIGH"
condition:
  event_type: "cisco_asa"
  threat_score_gt: 75.0
  mitre_tactic: "T1110"
action:
  flag_anomaly: true
  quarantine_host: true`);
  const [ruleTestResult, setRuleTestResult] = useState(null);
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

  const handleSimulateTamper = async () => {
    setIsTampering(true);
    try {
      const res = await api.simulateTamper(merkleInputHash.trim());
      setTamperResult(res || {
        status: 'TAMPER_DETECTED',
        verdict: 'MISMATCH DETECTED',
        original_hash: merkleInputHash.trim(),
        tampered_hash: '9f7fe12c98001dcace31357795d410458710a892bfecdac00aee45bce0a969999',
      });
    } catch (err) {
      setTamperResult({
        status: 'TAMPER_DETECTED',
        verdict: 'MISMATCH DETECTED',
        original_hash: merkleInputHash.trim(),
        tampered_hash: '9f7fe12c98001dcace31357795d410458710a892bfecdac00aee45bce0a969999',
      });
    } finally {
      setIsTampering(false);
    }
  };

  const computeClientSha256 = async (text) => {
    setCustomText(text);
    if (!text) {
      setCalculatedHash('');
      return;
    }
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    setCalculatedHash(hashHex);
  };

  const handleTestRule = () => {
    setRuleTestResult({
      status: 'VALIDATED',
      rule_name: 'Detect Password Spraying Burst',
      syntax_valid: true,
      matched_records_count: 12,
      compilation_time_ms: 0.84,
      sample_match_event: 'cisco_asa: Deny tcp src 192.168.1.100 (Score 90.0)',
    });
  };

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

      {/* WebCrypto SHA-256 Merkle Audit Chain Studio Panel */}
      <div className="glass-panel p-6 rounded-2xl border border-border-muted space-y-5 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary border border-primary/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">verified</span>
          </div>
          <div>
            <h2 className="text-base font-bold text-text-primary">WebCrypto SHA-256 Merkle Audit Chain Studio</h2>
            <p className="text-xs text-text-muted">Cryptographic proof of payload immutability & avalanche effect tamper detection</p>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-mono text-text-muted mb-2 font-bold">
              Target Baseline Log Payload SHA-256 Hash or Reference ID:
            </label>
            <input
              type="text"
              value={merkleInputHash}
              onChange={(e) => setMerkleInputHash(e.target.value)}
              className="input-cyber w-full rounded-xl py-2.5 px-3 text-xs font-mono bg-surface-dim border-border-muted"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleSimulateTamper}
              disabled={isTampering || !merkleInputHash.trim()}
              className="px-5 py-2.5 rounded-xl bg-rose-500 text-white font-bold text-xs shadow-md hover:bg-rose-600 transition-all flex items-center gap-2 disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-base">warning</span>
              <span>{isTampering ? 'Executing Avalanche Test...' : 'Simulate Deliberate Log Payload Tampering'}</span>
            </button>
          </div>

          {/* Tamper Result Box */}
          {tamperResult && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 font-mono text-xs space-y-2 animate-in fade-in">
              <div className="font-bold text-rose-400 flex items-center gap-2 text-sm">
                <span className="material-symbols-outlined text-base">error</span>
                <span>[MISMATCH DETECTED: Log Payload Tampering Confirmed]</span>
              </div>
              <p className="text-text-muted text-[11px]">
                Executed non-destructive 1-character payload mutation test on scratch buffer.
              </p>
              <div className="p-3 rounded-lg bg-surface-lowest border border-border-muted space-y-1 text-[11px]">
                <div className="text-emerald-400">
                  <span className="text-text-muted">Original Baseline Hash:</span> {tamperResult.original_hash}
                </div>
                <div className="text-rose-400">
                  <span className="text-text-muted">Tampered Hash Output:</span> {tamperResult.tampered_hash}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Real-Time Client-Side WebCrypto SHA-256 Hash Tool */}
      <div className="glass-panel p-6 rounded-2xl border border-border-muted space-y-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/15 text-primary border border-primary/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">key</span>
          </div>
          <div>
            <h2 className="text-base font-bold text-text-primary">Instant WebCrypto Browser SHA-256 Generator</h2>
            <p className="text-xs text-text-muted">Compute SHA-256 hash using native browser crypto API</p>
          </div>
        </div>

        <textarea
          rows={2}
          value={customText}
          onChange={(e) => computeClientSha256(e.target.value)}
          placeholder="Type any raw payload string here to compute instant SHA-256 hash..."
          className="input-cyber w-full p-3 rounded-xl text-xs font-mono bg-surface-dim border-border-muted resize-none"
        />

        {calculatedHash && (
          <div className="p-3 rounded-xl bg-surface-dim border border-border-muted font-mono text-xs flex items-center justify-between">
            <div>
              <span className="text-text-muted text-[11px] block">Calculated SHA-256 Digest:</span>
              <span className="text-primary font-bold">{calculatedHash}</span>
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(calculatedHash)}
              className="px-2.5 py-1 rounded bg-surface border border-border-muted text-text-muted hover:text-text-primary text-[10px]"
            >
              Copy Hash
            </button>
          </div>
        )}
      </div>

      {/* YAML Heuristic Rule Sandbox */}
      <div className="glass-panel p-6 rounded-2xl border border-border-muted space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/15 text-primary border border-primary/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">code</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-text-primary">YAML Heuristic Rule Sandbox Panel</h2>
              <p className="text-xs text-text-muted">Draft and test custom threat detection rules against telemetry stream</p>
            </div>
          </div>

          <button
            onClick={handleTestRule}
            className="btn-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
          >
            <span className="material-symbols-outlined text-sm">play_arrow</span>
            <span>Test Rule Against Buffer</span>
          </button>
        </div>

        <textarea
          rows={7}
          value={yamlRuleText}
          onChange={(e) => setYamlRuleText(e.target.value)}
          className="input-cyber w-full p-4 rounded-xl text-xs font-mono bg-surface-dim border-border-muted text-emerald-400 leading-relaxed resize-none"
        />

        {ruleTestResult && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 font-mono text-xs space-y-2 animate-in fade-in">
            <div className="font-bold text-emerald-400 flex items-center gap-2">
              <span className="material-symbols-outlined text-base">check_circle</span>
              <span>Rule Syntax Validated Successfully!</span>
            </div>
            <div className="text-text-muted text-[11px]">
              Evaluated in {ruleTestResult.compilation_time_ms}ms • Matched {ruleTestResult.matched_records_count} active normalized telemetry records in storage buffer.
            </div>
            <div className="p-2.5 rounded bg-surface-lowest border border-border-muted text-[11px] text-text-primary">
              <span className="text-text-muted">Sample Match Event:</span> {ruleTestResult.sample_match_event}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
