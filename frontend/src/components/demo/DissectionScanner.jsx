import React, { useEffect, useState } from 'react';

/**
 * DissectionScanner: A specialized 3D scan-and-reveal component for Chapter 05 Column 1.
 * 
 * When 'Analyze Log Stream' is clicked:
 * 1. A horizontal laser scan-beam sweeps down across the raw log text with glowing depth.
 * 2. As it passes, underlying structured fields (IPs, Ports, Actions, Signatures)
 *    visually 'peel apart' and lift up in layered 3D depth (translateZ + rotateX) from the raw text.
 * 3. Respects prefers-reduced-motion and site-wide is2D render mode.
 */
export function DissectionScanner({
  rawLogText,
  isAnalyzing = false,
  demoResult = null,
  revealStep = 0,
  disabled = false,
  children
}) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  // Trigger scan animation on analysis initiation
  useEffect(() => {
    if (disabled) {
      setIsScanning(false);
      setScanProgress(0);
      return;
    }

    if (isAnalyzing) {
      setIsScanning(true);
      setScanProgress(0);

      // Smooth scanline sweep synced to analysis duration (~550ms)
      const startTime = performance.now();
      const duration = 550;

      const animFrame = (time) => {
        const elapsed = time - startTime;
        const progress = Math.min(1, elapsed / duration);
        setScanProgress(progress);

        if (progress < 1) {
          requestAnimationFrame(animFrame);
        } else {
          setIsScanning(false);
        }
      };

      const handle = requestAnimationFrame(animFrame);
      return () => cancelAnimationFrame(handle);
    } else if (!demoResult) {
      setScanProgress(0);
      setIsScanning(false);
    }
  }, [isAnalyzing, disabled, demoResult]);

  // Extract structured highlights for the peeled 3D layer
  const extracted = demoResult?.extracted_fields || {};
  const hasExtracted = Boolean(demoResult && (revealStep >= 1 || disabled));

  // Determine active display mode
  const show3DPeel = !disabled && (isScanning || hasExtracted);

  return (
    <div className="relative w-full" style={{ perspective: disabled ? 'none' : '1000px' }}>
      {/* Base container holding textarea or raw content */}
      <div
        className="relative transition-transform duration-500 ease-out"
        style={{
          transformStyle: disabled ? 'flat' : 'preserve-3d',
          transform: show3DPeel ? 'translateZ(-6px) rotateX(1deg)' : 'none',
        }}
      >
        {children}

        {/* 3D Laser Scan-Line Sweep across raw log text */}
        {!disabled && isScanning && (
          <div
            className="absolute inset-x-0 pointer-events-none z-30 transition-none"
            style={{
              top: `${scanProgress * 100}%`,
              transform: 'translateY(-50%) translateZ(16px)',
            }}
          >
            {/* Primary glowing scan beam */}
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_12px_var(--color-primary),0_0_24px_rgba(167,139,250,0.8)]" />
            {/* Ambient vertical sweep trail */}
            <div className="h-8 -mt-8 w-full bg-gradient-to-t from-primary/25 via-primary/10 to-transparent blur-[2px]" />
            {/* Micro scanhead tracker */}
            <div className="flex justify-between items-center px-3 -mt-3.5 font-mono text-[9px] font-bold text-primary tracking-widest uppercase">
              <span className="bg-surface-dim/90 px-1.5 py-0.5 rounded border border-primary/50 shadow-sm animate-pulse">
                DISSECTION BEAM
              </span>
              <span className="bg-surface-dim/90 px-1.5 py-0.5 rounded border border-primary/50 shadow-sm">
                {Math.round(scanProgress * 100)}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Layered 3D Peeled Structured Dissection Layer */}
      {show3DPeel && (
        <div
          className={`mt-2.5 p-3 rounded-xl border font-mono text-xs transition-all duration-500 ${
            disabled
              ? 'bg-surface-dim/95 border-border-muted'
              : 'bg-surface-dim/90 border-primary/40 shadow-2xl backdrop-blur-md'
          }`}
          style={{
            transformStyle: disabled ? 'flat' : 'preserve-3d',
            transform: disabled
              ? 'none'
              : hasExtracted
              ? 'translateZ(18px) rotateX(-2deg) translateY(-2px)'
              : 'translateZ(10px) rotateX(-4deg) translateY(4px) scale(0.98)',
            boxShadow: disabled
              ? 'none'
              : '0 16px 32px -8px rgba(0,0,0,0.5), 0 0 20px rgba(167, 139, 250, 0.2)',
          }}
        >
          {/* Header of dissected layer */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-border-muted/60">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
              <span>FORENSIC DISSECTION LAYER // DECONSTRUCTED</span>
            </div>
            <span className="text-[9px] text-text-dim px-1.5 py-0.2 rounded bg-surface border border-border-muted">
              {isScanning ? 'SCANNING LOG TOKENS...' : 'STRUCTURE PEEL ACTIVE'}
            </span>
          </div>

          {/* Peeled Field Vectors Grid */}
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            {/* Extracted Origin IP */}
            <div className="p-2 rounded-lg bg-surface/80 border border-primary/20 flex flex-col gap-0.5">
              <span className="text-[9px] font-bold text-text-muted tracking-wider uppercase">SRC_VECTOR</span>
              <span className="text-primary font-bold truncate">
                {extracted.source_ip || (isScanning ? '185.220.101.5' : '---')}
              </span>
            </div>

            {/* Extracted Target IP */}
            <div className="p-2 rounded-lg bg-surface/80 border border-secondary/20 flex flex-col gap-0.5">
              <span className="text-[9px] font-bold text-text-muted tracking-wider uppercase">DST_VECTOR</span>
              <span className="text-secondary font-bold truncate">
                {extracted.destination_ip || (isScanning ? '10.0.4.12' : '---')}
              </span>
            </div>

            {/* Extracted Event Type */}
            <div className="p-2 rounded-lg bg-surface/80 border border-border-muted flex flex-col gap-0.5">
              <span className="text-[9px] font-bold text-text-muted tracking-wider uppercase">CLASSIFICATION</span>
              <span className="text-text-primary font-bold truncate">
                {extracted.event_type || (isScanning ? 'cisco_asa:deny' : '---')}
              </span>
            </div>

            {/* Extracted Hash / Leaf */}
            <div className="p-2 rounded-lg bg-surface/80 border border-tertiary/20 flex flex-col gap-0.5">
              <span className="text-[9px] font-bold text-text-muted tracking-wider uppercase">SHA-256 SEAL</span>
              <span className="text-tertiary font-bold truncate" title={extracted.full_sha256}>
                {extracted.sha256 || (isScanning ? '6cc4c6e212b9...' : '---')}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
