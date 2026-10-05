import React, { useState } from 'react';
import { api } from '../services/api';

export function RuleStudioPage() {
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
  threat_score_gte: 75.0
  mitre_tactic: "T1110"
action:
  flag_anomaly: true
  quarantine_host: true`);
  const [ruleTestResult, setRuleTestResult] = useState(null);
  const [isTestingRule, setIsTestingRule] = useState(false);

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

  const handleTestRule = async () => {
    setIsTestingRule(true);
    try {
      const res = await api.testRule(yamlRuleText);
      setRuleTestResult(res);
    } catch (err) {
      setRuleTestResult({
        status: 'VALIDATION_FAILED',
        syntax_valid: false,
        rule_name: 'Error',
        error: err.message || 'Failed to communicate with rule compiler.',
        detail: 'Network or server error encountered while testing detection rule.',
        matched_records_count: 0,
        compilation_time_ms: 0,
      });
    } finally {
      setIsTestingRule(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border-muted pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
            Rule Studio & <span className="text-primary">Detection Logic Sandbox</span>
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1 font-sans">
            Configure custom YARA/Sigma detection rules, test logic conditions, and verify WebCrypto SHA-256 Merkle chain integrity.
          </p>
        </div>
      </header>

      {/* SECTION 1: DETECTIVE RULE LOGIC PIPELINE DIAGRAM */}
      <div className="glass-panel p-6 rounded-2xl border border-border-muted space-y-4 shadow-xl">
        <div className="flex justify-between items-center border-b border-border-muted pb-3 font-mono text-xs">
          <span className="font-bold text-text-primary uppercase tracking-wider">Detection Engine Execution Pipeline</span>
          <span className="text-text-muted">Interactive Logic Flow</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono text-xs text-center">
          <div className="p-3.5 rounded-xl bg-surface-dim border border-border-muted space-y-1">
            <div className="text-[10px] text-text-dim uppercase">Phase 01</div>
            <div className="font-bold text-text-primary">Syslog Trigger</div>
            <div className="text-[9px] text-text-muted">Wire Capture</div>
          </div>
          <div className="p-3.5 rounded-xl bg-surface-dim border border-border-muted space-y-1">
            <div className="text-[10px] text-text-dim uppercase">Phase 02</div>
            <div className="font-bold text-text-primary">Condition Evaluation</div>
            <div className="text-[9px] text-primary">Regex & Key-Values</div>
          </div>
          <div className="p-3.5 rounded-xl bg-surface-dim border border-border-muted space-y-1">
            <div className="text-[10px] text-text-dim uppercase">Phase 03</div>
            <div className="font-bold text-text-primary">Pattern Match</div>
            <div className="text-[9px] text-emerald-400">Syntax Validated</div>
          </div>
          <div className="p-3.5 rounded-xl bg-surface-dim border border-border-muted space-y-1">
            <div className="text-[10px] text-text-dim uppercase">Phase 04</div>
            <div className="font-bold text-secondary">Threat Scoring</div>
            <div className="text-[9px] text-rose-400">Isolation Forest</div>
          </div>
          <div className="col-span-2 sm:col-span-1 p-3.5 rounded-xl bg-surface-dim border border-border-muted space-y-1">
            <div className="text-[10px] text-text-dim uppercase">Phase 05</div>
            <div className="font-bold text-emerald-400">Quarantine Action</div>
            <div className="text-[9px] text-text-muted">MITRE Tactic Tag</div>
          </div>
        </div>
      </div>

      {/* SECTION 2: YARA/SIGMA RULE SANDBOX & SHA-256 MERKLE STUDIO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: YARA/Sigma Rule Testing Sandbox (Span 7) */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-2xl border border-border-muted space-y-4 shadow-xl">
          <div className="flex justify-between items-center border-b border-border-muted pb-3 font-mono text-xs">
            <span className="font-bold text-text-primary uppercase tracking-wider">Detection Rule Authoring Sandbox</span>
            <span className="text-emerald-400 font-bold">YAML / SIGMA SYNTAX</span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <textarea
              rows="9"
              value={yamlRuleText}
              onChange={(e) => setYamlRuleText(e.target.value)}
              className="w-full p-3 rounded-xl bg-surface-dim border border-border-muted font-mono text-xs text-text-primary focus:outline-none focus:border-primary leading-relaxed custom-scrollbar-touch"
            />

            <button
              onClick={handleTestRule}
              disabled={isTestingRule}
              className="btn-primary px-6 py-3 rounded-xl text-xs font-bold w-full touch-target flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isTestingRule ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                  <span>Compiling & Evaluating Rule against Store...</span>
                </>
              ) : (
                'Test & Compile Detection Rule'
              )}
            </button>

            {ruleTestResult && (
              ruleTestResult.syntax_valid ? (
                <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/40 font-mono text-xs space-y-2.5 animate-in fade-in duration-200">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-[11px] gap-2 border-b border-emerald-500/20 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        VALIDATED & COMPILED
                      </span>
                      <span className="text-text-primary font-bold">{ruleTestResult.rule_name}</span>
                    </div>
                    <span className="text-text-muted text-[10px]">Time: {ruleTestResult.compilation_time_ms} ms</span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-text-muted">Matched Events in Store:</span>
                    <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                      ruleTestResult.matched_records_count > 0 
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {ruleTestResult.matched_records_count} {ruleTestResult.matched_records_count === 1 ? 'event' : 'events'}
                    </span>
                  </div>

                  {ruleTestResult.matched_records_count > 0 ? (
                    <div className="space-y-1 pt-1">
                      <div className="text-[10px] text-text-dim uppercase font-bold tracking-wider">Sample Matching Event:</div>
                      <div className="p-2.5 rounded-lg bg-surface-dim/80 border border-border-muted text-[11px] text-text-primary break-all leading-relaxed font-mono">
                        {ruleTestResult.sample_match_event}
                      </div>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-lg bg-surface-dim/80 border border-amber-500/30 text-[11px] text-amber-300/90 italic leading-relaxed">
                      Zero events in the current store matched this rule's conditions. Modify the threshold (e.g. use threat_score_gte or lower threat_score_gt) or adjust event_type.
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-rose-950/25 border border-rose-500/50 font-mono text-xs space-y-2 animate-in fade-in duration-200">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-[11px] gap-2 border-b border-rose-500/25 pb-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                      SYNTAX / VALIDATION ERROR
                    </span>
                    <span className="text-text-muted text-[10px]">Time: {ruleTestResult.compilation_time_ms} ms</span>
                  </div>

                  <div className="text-rose-400 font-bold text-xs pt-1 break-words">
                    {ruleTestResult.error || 'Invalid rule definition'}
                  </div>
                  {ruleTestResult.detail && (
                    <div className="text-[11px] text-text-muted break-words leading-relaxed">
                      {ruleTestResult.detail}
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        </div>

        {/* Right Column: WebCrypto SHA-256 & Audit Tamper Simulation (Span 5) */}
        <div className="lg:col-span-5 glass-panel p-4 sm:p-6 rounded-2xl border border-border-muted space-y-4 shadow-xl">
          <div className="flex justify-between items-center border-b border-border-muted pb-3 font-mono text-xs">
            <span className="font-bold text-text-primary uppercase tracking-wider">WebCrypto Merkle Audit Studio</span>
            <span className="text-primary font-bold text-[11px]">SHA-256 IMMUTABILITY</span>
          </div>

          <div className="space-y-4 font-mono text-xs">
            <div>
              <label className="block text-text-muted mb-1 text-[11px]">Client-Side WebCrypto SHA-256 Calculator:</label>
              <input
                type="text"
                placeholder="Type custom text to compute instant SHA-256..."
                value={customText}
                onChange={(e) => computeClientSha256(e.target.value)}
                className="w-full p-3 rounded-xl bg-surface-dim border border-border-muted text-text-primary text-xs focus:outline-none focus:border-primary"
              />
              {calculatedHash && (
                <div className="mt-2 p-2.5 rounded bg-surface border border-border-muted text-emerald-400 text-[10px] break-all font-bold">
                  Hash: {calculatedHash}
                </div>
              )}
            </div>

            <div className="pt-2 space-y-2 border-t border-border-muted">
              <label className="block text-text-muted text-[11px]">Audit Tamper Simulator:</label>
              <input
                type="text"
                value={merkleInputHash}
                onChange={(e) => setMerkleInputHash(e.target.value)}
                className="w-full p-3 rounded-xl bg-surface-dim border border-border-muted text-text-primary text-xs focus:outline-none focus:border-primary break-all"
              />
              <button
                onClick={handleSimulateTamper}
                disabled={isTampering}
                className="btn-secondary px-4 py-3 rounded-xl text-xs font-bold w-full touch-target"
              >
                {isTampering ? 'Simulating Audit Check...' : 'Simulate Payload Tamper'}
              </button>

              {tamperResult && (
                <div className="p-3 rounded-xl bg-surface-dim border border-rose-500/40 text-[11px] space-y-1">
                  <div className="text-rose-400 font-bold">Verdict: {tamperResult.verdict}</div>
                  <div className="text-text-muted text-[10px] break-all">Tampered Hash: {tamperResult.tampered_hash}</div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
