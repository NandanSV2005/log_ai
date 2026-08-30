import React from 'react';

export function Footer() {
  return (
    <footer className="w-full py-6 border-t border-border-muted bg-surface-dim text-center text-text-dim text-xs font-mono">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>© 2026 LOG AI Security Engine. Sovereign Air-Gapped SOC & Forensics Infrastructure.</div>
        <div className="flex items-center gap-4 text-text-muted">
          <span>OCSF 1.1 Standard</span>
          <span>•</span>
          <span>WebCrypto SHA-256 Audit</span>
          <span>•</span>
          <span className="text-emerald-500">System Healthy</span>
        </div>
      </div>
    </footer>
  );
}
