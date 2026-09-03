import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';

export function CopilotWidget({ airGapped }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'copilot',
      text: 'Hello! I am your AI SOC Copilot. Ask me about correlated incidents, threat scores, anomalous IP behavior, or mitigation playbooks.',
      model: airGapped ? 'rule-assisted-soc-engine' : 'gemini-3.6-flash',
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (queryText = null) => {
    const text = queryText || inputQuery;
    if (!text || !text.trim() || isLoading) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: text.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInputQuery('');
    setIsLoading(true);

    try {
      const res = await api.askCopilot(text.trim(), airGapped);
      const copilotMsg = {
        id: Date.now() + 1,
        sender: 'copilot',
        text: res.answer || 'No response returned from AI engine.',
        model: res.model || (airGapped ? 'rule-assisted-soc-engine' : 'gemini-3.6-flash'),
      };
      setMessages((prev) => [...prev, copilotMsg]);
    } catch (err) {
      const errorMsg = {
        id: Date.now() + 1,
        sender: 'copilot',
        text: `Error querying AI Copilot: ${err.message}`,
        model: 'error',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="btn-copilot flex items-center gap-2.5 px-4 py-3 rounded-xl font-mono text-xs tracking-wide cursor-pointer select-none"
          aria-label="Open AI SOC Copilot assistant"
        >
          <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
            psychology
          </span>
          <span className="font-bold uppercase tracking-wider">AI SOC Copilot</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        </button>
      )}

      {/* Drawer Panel */}
      {isOpen && (
        <div className="w-96 max-w-[90vw] h-[520px] rounded-2xl glass-panel border border-border-muted flex flex-col shadow-2xl overflow-hidden backdrop-blur-xl animate-in slide-in-from-bottom-5">
          {/* Drawer Header */}
          <div className="p-4 border-b border-border-muted bg-surface-dim/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary border border-primary/30 flex items-center justify-center">
                <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                  psychology
                </span>
              </div>
              <div>
                <div className="font-bold text-sm text-text-primary flex items-center gap-2">
                  SOC Copilot
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-primary/20 text-primary border border-primary/30">
                    {airGapped ? 'AIR-GAPPED' : 'GEMINI 3.6'}
                  </span>
                </div>
                <div className="text-[10px] text-text-muted">Real-time threat assistant</div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-text-muted hover:text-text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>

          {/* Messages History */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 font-sans text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                {msg.sender === 'copilot' && (
                  <div className="mb-1 flex items-center gap-1.5">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase ${
                      msg.model?.includes('gemini')
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {msg.model?.includes('gemini') ? 'LIVE GEMINI 3.6' : 'LOCAL ENGINE (AIR-GAPPED SOC)'}
                    </span>
                  </div>
                )}
                <div
                  className={`max-w-[85%] p-3 rounded-xl leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-primary text-surface-lowest rounded-tr-none font-medium'
                      : 'bg-surface-container border border-border-muted text-text-primary rounded-tl-none whitespace-pre-wrap'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-text-muted text-xs italic">
                <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                <span>Analyzing SOC telemetry...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Pills */}
          <div className="px-3 py-2 border-t border-border-muted bg-surface-dim/40 flex gap-1.5 overflow-x-auto text-[10px]">
            <button
              onClick={() => handleSend('Summarize high severity anomalies')}
              className="px-2 py-1 rounded bg-surface border border-border-muted text-text-muted hover:text-text-primary whitespace-nowrap"
            >
              ⚡ Summarize High Severity
            </button>
            <button
              onClick={() => handleSend('What MITRE ATT&CK tactics are active?')}
              className="px-2 py-1 rounded bg-surface border border-border-muted text-text-muted hover:text-text-primary whitespace-nowrap"
            >
              🛡️ Active MITRE Tactics
            </button>
            <button
              onClick={() => handleSend('How many total events ingested?')}
              className="px-2 py-1 rounded bg-surface border border-border-muted text-text-muted hover:text-text-primary whitespace-nowrap"
            >
              📊 Telemetry Counts
            </button>
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 border-t border-border-muted bg-surface flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask Copilot about logs, threats, IPs..."
              className="flex-1 input-cyber px-3 py-2 text-xs rounded-lg bg-surface-dim border-border-muted"
            />
            <button
              type="submit"
              disabled={isLoading || !inputQuery.trim()}
              className="p-2 rounded-lg bg-primary text-surface-lowest disabled:opacity-40 font-bold flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-sm">send</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
