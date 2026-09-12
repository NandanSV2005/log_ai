import React, { useState } from 'react';
import { SpotlightCard } from '../motion-primitives';

export function RoiStatCards({ calculatedSavings, calculatedHours, isFlat2D = false }) {
  const [tiltCard, setTiltCard] = useState(null);

  const handleMouseMove = (e, cardKey) => {
    if (isFlat2D) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const rotateX = -(y / rect.height) * 12;
    const rotateY = (x / rect.width) * 12;
    setTiltCard({ key: cardKey, rotateX, rotateY });
  };

  const handleMouseLeave = () => setTiltCard(null);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      {/* Card 1: Monthly Savings */}
      <div
        onMouseMove={(e) => handleMouseMove(e, 'savings')}
        onMouseLeave={handleMouseLeave}
        className="transition-transform duration-200 ease-out"
        style={{
          perspective: '800px',
          transform:
            tiltCard?.key === 'savings'
              ? `rotateX(${tiltCard.rotateX}deg) rotateY(${tiltCard.rotateY}deg) translateZ(6px)`
              : 'none'
        }}
      >
        <SpotlightCard
          spotlightColor="rgba(78, 222, 163, 0.15)"
          className="p-5 bg-surface-bright/90 border border-tertiary/30 rounded-xl flex flex-col justify-between h-full shadow-lg backdrop-blur-md"
        >
          <span className="font-mono text-[10px] font-bold text-text-dim uppercase tracking-wider">
            Monthly SIEM Savings
          </span>
          <div className="py-1">
            <span className="font-mono text-2xl lg:text-3xl text-tertiary font-black">
              ${calculatedSavings.toLocaleString()}
            </span>
            <span className="text-tertiary font-sans font-bold text-sm">/mo</span>
          </div>
          <span className="font-sans text-xs text-text-muted font-normal">
            Less data to index and store
          </span>
        </SpotlightCard>
      </div>

      {/* Card 2: Analyst Time Preserved */}
      <div
        onMouseMove={(e) => handleMouseMove(e, 'hours')}
        onMouseLeave={handleMouseLeave}
        className="transition-transform duration-200 ease-out"
        style={{
          perspective: '800px',
          transform:
            tiltCard?.key === 'hours'
              ? `rotateX(${tiltCard.rotateX}deg) rotateY(${tiltCard.rotateY}deg) translateZ(6px)`
              : 'none'
        }}
      >
        <SpotlightCard
          spotlightColor="rgba(167, 139, 250, 0.15)"
          className="p-5 bg-surface-bright/90 border border-primary/30 rounded-xl flex flex-col justify-between h-full shadow-lg backdrop-blur-md"
        >
          <span className="font-mono text-[10px] font-bold text-text-dim uppercase tracking-wider">
            Analyst Time Preserved
          </span>
          <div className="py-1">
            <span className="font-mono text-2xl lg:text-3xl text-primary font-black">
              {calculatedHours.toLocaleString()}
            </span>
            <span className="text-primary font-sans font-bold text-sm">hrs/wk</span>
          </div>
          <span className="font-sans text-xs text-text-muted font-normal">
            Time freed from checking false alarms
          </span>
        </SpotlightCard>
      </div>

      {/* Card 3: Noise Filtered */}
      <div
        onMouseMove={(e) => handleMouseMove(e, 'noise')}
        onMouseLeave={handleMouseLeave}
        className="transition-transform duration-200 ease-out"
        style={{
          perspective: '800px',
          transform:
            tiltCard?.key === 'noise'
              ? `rotateX(${tiltCard.rotateX}deg) rotateY(${tiltCard.rotateY}deg) translateZ(6px)`
              : 'none'
        }}
      >
        <SpotlightCard
          spotlightColor="rgba(123, 208, 255, 0.15)"
          className="p-5 bg-surface-bright/90 border border-secondary/30 rounded-xl flex flex-col justify-between h-full shadow-lg backdrop-blur-md"
        >
          <span className="font-mono text-[10px] font-bold text-text-dim uppercase tracking-wider">
            Noise Filtered
          </span>
          <div className="py-1">
            <span className="font-mono text-2xl lg:text-3xl text-secondary font-black">78.4%</span>
          </div>
          <span className="font-sans text-xs text-text-muted font-normal">
            Unimportant noise dropped early
          </span>
        </SpotlightCard>
      </div>

      {/* Card 4: Payback Timeline */}
      <div
        onMouseMove={(e) => handleMouseMove(e, 'payback')}
        onMouseLeave={handleMouseLeave}
        className="transition-transform duration-200 ease-out"
        style={{
          perspective: '800px',
          transform:
            tiltCard?.key === 'payback'
              ? `rotateX(${tiltCard.rotateX}deg) rotateY(${tiltCard.rotateY}deg) translateZ(6px)`
              : 'none'
        }}
      >
        <SpotlightCard
          spotlightColor="rgba(255, 255, 255, 0.08)"
          className="p-5 bg-surface-bright/90 border border-border-muted rounded-xl flex flex-col justify-between h-full shadow-lg backdrop-blur-md"
        >
          <span className="font-mono text-[10px] font-bold text-text-dim uppercase tracking-wider">
            Payback Timeline
          </span>
          <div className="py-1">
            <span className="font-mono text-2xl lg:text-3xl text-text-primary font-black">&lt; 14</span>
            <span className="text-text-primary font-sans font-bold text-sm">days</span>
          </div>
          <span className="font-sans text-xs text-text-muted font-normal">
            Simple drop-in setup
          </span>
        </SpotlightCard>
      </div>
    </div>
  );
}

export function RoiWorkload3D({
  roiVolume,
  roiDevices,
  calculatedSavings,
  calculatedHours,
  force2D = false,
  showStatCards = true
}) {
  const [reducedMotion, setReducedMotion] = useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const isFlat2D = force2D || reducedMotion;

  // Dynamic scale mapping: normalize volume (100 - 5000 GB) and devices (10 - 1000 nodes)
  const vNorm = Math.min(1, Math.max(0, (roiVolume - 100) / 4900));
  const dNorm = Math.min(1, Math.max(0, (roiDevices - 10) / 990));
  // Weighted combined load with responsive power curve (0.75) for perceptible feedback across entire range
  const rawLoad = vNorm * 0.65 + dNorm * 0.35;
  const loadFactor = Math.pow(rawLoad, 0.75);

  // Manual block height: from 90px (min) up to 250px (max)
  const manualHeight = Math.round(90 + loadFactor * 160);
  // Automated block height: exactly 21.6% of manual workload (-78.4% reduction from LOG AI ingestion)
  const autoHeight = Math.max(20, Math.round(manualHeight * 0.216));

  return (
    <div className="flex flex-col gap-6 w-full h-full">
      {/* 3D Isometric Workload Visualization Hero Stage */}
      <div className="relative p-6 md:p-8 bg-surface-bright/90 border border-tertiary/35 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden flex flex-col justify-between h-full">
        {/* Background glow & subtle coordinate grid */}
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#4edea3_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="absolute -top-12 right-1/4 w-72 h-72 bg-tertiary/10 rounded-full blur-3xl pointer-events-none" />

        {/* Stage Header & Hero Savings Callout */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-muted relative z-10">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 font-mono text-xs text-tertiary font-bold">
              <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
              <span>
                {isFlat2D
                  ? 'VOLUMETRIC WORKLOAD COMPARISON // FLAT 2D EFFICIENCY'
                  : 'DIMENSIONAL WORKLOAD COMPARISON // REAL-TIME 3D'}
              </span>
            </div>
            <span className="font-sans text-xs text-text-muted mt-0.5">
              Live volumetric feedback comparing manual SIEM triaging vs automated ingestion
            </span>
          </div>

          {/* Visual Hero Savings Badge */}
          <div className="flex items-center gap-3 bg-tertiary/10 border border-tertiary/40 px-4 py-2 rounded-xl shadow-[0_0_20px_rgba(78,222,163,0.2)]">
            <div className="flex flex-col items-end">
              <span className="font-mono text-[10px] text-text-dim uppercase font-bold tracking-wider">
                NET RECLAIMED VALUE
              </span>
              <div className="font-mono text-2xl lg:text-3xl text-tertiary font-black leading-tight">
                ${calculatedSavings.toLocaleString()}
                <span className="text-sm font-sans font-bold text-tertiary/80">/mo</span>
              </div>
            </div>
            <span className="material-symbols-outlined text-tertiary text-[28px] animate-bounce">
              savings
            </span>
          </div>
        </div>

        {/* Comparison Stage: 2D Clean Meter if isFlat2D, else CSS 3D Isometric Pedestal */}
        {isFlat2D ? (
          <div className="relative w-full min-h-[260px] flex flex-col justify-center py-6 px-2 md:px-6 my-auto">
            <div className="max-w-xl mx-auto w-full flex flex-col gap-6">
              {/* Manual Fatigue Bar */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between font-mono text-xs">
                  <span
                    className="font-bold uppercase tracking-wider flex items-center gap-1.5"
                    style={{ color: 'var(--color-severity-high)' }}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: 'var(--color-severity-high)' }}
                    />
                    Manual Fatigue (Unfiltered Ingestion)
                  </span>
                  <span className="font-bold" style={{ color: 'var(--color-severity-high)' }}>
                    {calculatedHours} hrs/wk
                  </span>
                </div>
                <div className="w-full h-4 bg-surface rounded-full overflow-hidden border border-border-muted p-0.5">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, Math.max(20, Math.round(loadFactor * 100)))}%`,
                      background: 'linear-gradient(to right, color-mix(in srgb, var(--color-severity-high) 40%, black), var(--color-severity-high))'
                    }}
                  />
                </div>
              </div>

              {/* Automated Engine Bar */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="text-tertiary font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
                    Automated ULPF Engine (De-duplicated &amp; Verified)
                  </span>
                  <span className="text-tertiary font-bold">
                    {Math.round(calculatedHours * 0.216)} hrs/wk (-78.4%)
                  </span>
                </div>
                <div className="w-full h-4 bg-surface rounded-full overflow-hidden border border-tertiary/30 p-0.5">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, Math.max(6, Math.round(loadFactor * 21.6)))}%`,
                      background: 'linear-gradient(to right, color-mix(in srgb, var(--color-tertiary) 40%, black), var(--color-tertiary))'
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-center pt-2">
                <span className="px-3.5 py-1 rounded-full bg-tertiary/15 border border-tertiary/40 text-tertiary font-mono text-xs font-black shadow-[0_0_14px_rgba(78,222,163,0.3)]">
                  78.4% DATA NOISE SHED PRE-INDEX
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative w-full min-h-[270px] flex items-center justify-center py-2 my-auto">
            {/* Isometric Perspective Scene */}
            <div
              className="relative flex items-end justify-center gap-8 sm:gap-12 md:gap-16 pt-6 pb-2"
              style={{
                perspective: '1000px',
                perspectiveOrigin: '50% 50%'
              }}
            >
              {/* Ground Isometric Grid Platter */}
              <div
                className="absolute -bottom-4 w-64 sm:w-80 md:w-[380px] h-36 rounded-3xl pointer-events-none"
                style={{
                  background: 'color-mix(in srgb, var(--color-surface-dim) 85%, transparent)',
                  borderColor: 'color-mix(in srgb, var(--color-tertiary) 30%, transparent)',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  transform: 'rotateX(60deg) rotateZ(-30deg)',
                  transformStyle: 'preserve-3d',
                  boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6)'
                }}
              />

              {/* STACK 1: MANUAL ANALYST WORKLOAD */}
              <div className="flex flex-col items-center gap-2 relative z-10">
                <div
                  className="relative"
                  style={{
                    transform: 'rotateX(60deg) rotateZ(-30deg)',
                    transformStyle: 'preserve-3d',
                    height: '170px',
                    display: 'flex',
                    alignItems: 'flex-end'
                  }}
                >
                  {/* 3D Prism Container */}
                  <div
                    className="relative w-16 sm:w-20 transition-all duration-200 ease-out"
                    style={{
                      height: `${manualHeight}px`,
                      transformStyle: 'preserve-3d'
                    }}
                  >
                    {/* Front Face */}
                    <div
                      className="absolute inset-0 border shadow-lg flex flex-col justify-between p-2 font-mono text-[9px] font-bold"
                      style={{
                        background: 'linear-gradient(to top, color-mix(in srgb, var(--color-severity-high) 25%, transparent), var(--color-severity-high))',
                        borderColor: 'var(--color-severity-high-border)',
                        color: '#ffffff',
                        transform: 'translateZ(16px)',
                        backfaceVisibility: 'hidden',
                        boxShadow: '0 0 16px color-mix(in srgb, var(--color-severity-high) 30%, transparent)'
                      }}
                    >
                      <span className="tracking-wider">MANUAL</span>
                      <span className="text-center font-mono font-bold text-[10px] text-white">
                        {calculatedHours} hrs/wk
                      </span>
                    </div>

                    {/* Top Face */}
                    <div
                      className="absolute -top-8 left-0 w-full h-8 border"
                      style={{
                        background: 'var(--color-severity-high)',
                        borderColor: 'color-mix(in srgb, var(--color-severity-high) 70%, white)',
                        boxShadow: '0 0 14px color-mix(in srgb, var(--color-severity-high) 50%, transparent)',
                        transform: 'rotateX(90deg) translateZ(0px)',
                        transformOrigin: 'bottom'
                      }}
                    />

                    {/* Right Face */}
                    <div
                      className="absolute top-0 -right-8 w-8 h-full border"
                      style={{
                        background: 'color-mix(in srgb, var(--color-severity-high) 35%, black)',
                        borderColor: 'color-mix(in srgb, var(--color-severity-high) 25%, black)',
                        transform: 'rotateY(90deg) translateZ(0px)',
                        transformOrigin: 'left'
                      }}
                    />

                    {/* Ground Shadow */}
                    <div
                      className="absolute -bottom-4 -left-4 w-24 h-16 bg-black/60 blur-md rounded-full pointer-events-none"
                      style={{ transform: 'translateZ(-10px)' }}
                    />
                  </div>
                </div>

                {/* Stack Label */}
                <div className="flex flex-col items-center text-center font-mono mt-[-10px] max-w-[130px]">
                  <span
                    className="font-bold text-xs uppercase tracking-wider flex items-center gap-1.5"
                    style={{ color: 'var(--color-severity-high)' }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: 'var(--color-severity-high)' }}
                    />
                    Manual Fatigue
                  </span>
                  <span className="text-text-dim text-[10px]">Unfiltered Noise &amp; Queries</span>
                </div>
              </div>

              {/* Dimensional Delta Arrow Banner */}
              <div className="flex flex-col items-center justify-center gap-1 z-20 pb-12">
                <span className="px-3 py-1 rounded-full bg-tertiary/15 border border-tertiary/40 text-tertiary font-mono text-xs font-black shadow-[0_0_14px_rgba(78,222,163,0.3)] animate-pulse">
                  -78.4%
                </span>
                <span className="material-symbols-outlined text-tertiary text-[24px]">
                  trending_down
                </span>
                <span className="font-mono text-[9px] text-text-dim uppercase font-bold tracking-tight">
                  Noise Dropped
                </span>
              </div>

              {/* STACK 2: AUTOMATED WORKLOAD */}
              <div className="flex flex-col items-center gap-2 relative z-10">
                <div
                  className="relative"
                  style={{
                    transform: 'rotateX(60deg) rotateZ(-30deg)',
                    transformStyle: 'preserve-3d',
                    height: '170px',
                    display: 'flex',
                    alignItems: 'flex-end'
                  }}
                >
                  {/* 3D Prism Container */}
                  <div
                    className="relative w-16 sm:w-20 transition-all duration-200 ease-out"
                    style={{
                      height: `${autoHeight}px`,
                      transformStyle: 'preserve-3d'
                    }}
                  >
                    {/* Front Face */}
                    <div
                      className="absolute inset-0 border shadow-lg flex flex-col justify-between p-2 font-mono text-[9px] font-bold"
                      style={{
                        background: 'linear-gradient(to top, color-mix(in srgb, var(--color-tertiary) 25%, transparent), var(--color-tertiary))',
                        borderColor: 'var(--color-tertiary)',
                        color: '#ffffff',
                        transform: 'translateZ(16px)',
                        backfaceVisibility: 'hidden',
                        boxShadow: '0 0 20px color-mix(in srgb, var(--color-tertiary) 35%, transparent)'
                      }}
                    >
                      <span className="tracking-wider">LOG AI</span>
                      <span className="text-center font-mono font-bold text-[10px] text-white">
                        {Math.round(calculatedHours * 0.216)} hrs/wk
                      </span>
                    </div>

                    {/* Top Face */}
                    <div
                      className="absolute -top-8 left-0 w-full h-8 border"
                      style={{
                        background: 'var(--color-tertiary)',
                        borderColor: 'color-mix(in srgb, var(--color-tertiary) 70%, white)',
                        boxShadow: '0 0 16px color-mix(in srgb, var(--color-tertiary) 60%, transparent)',
                        transform: 'rotateX(90deg) translateZ(0px)',
                        transformOrigin: 'bottom'
                      }}
                    />

                    {/* Right Face */}
                    <div
                      className="absolute top-0 -right-8 w-8 h-full border"
                      style={{
                        background: 'color-mix(in srgb, var(--color-tertiary) 35%, black)',
                        borderColor: 'color-mix(in srgb, var(--color-tertiary) 25%, black)',
                        transform: 'rotateY(90deg) translateZ(0px)',
                        transformOrigin: 'left'
                      }}
                    />

                    {/* Ground Shadow */}
                    <div
                      className="absolute -bottom-4 -left-4 w-24 h-16 bg-black/60 blur-md rounded-full pointer-events-none"
                      style={{ transform: 'translateZ(-10px)' }}
                    />
                  </div>
                </div>

                {/* Stack Label */}
                <div className="flex flex-col items-center text-center font-mono mt-[-10px] max-w-[130px]">
                  <span
                    className="font-bold text-xs uppercase tracking-wider flex items-center gap-1.5"
                    style={{ color: 'var(--color-tertiary)' }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full animate-pulse"
                      style={{ backgroundColor: 'var(--color-tertiary)' }}
                    />
                    Automated Engine
                  </span>
                  <span className="text-text-dim text-[10px]">Verified &amp; De-duplicated</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showStatCards && (
        <RoiStatCards
          calculatedSavings={calculatedSavings}
          calculatedHours={calculatedHours}
          isFlat2D={isFlat2D}
        />
      )}
    </div>
  );
}
