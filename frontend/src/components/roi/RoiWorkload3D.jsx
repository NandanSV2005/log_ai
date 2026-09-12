import React, { useState } from 'react';
import { SpotlightCard } from '../motion-primitives';

export function RoiWorkload3D({
  roiVolume,
  roiDevices,
  calculatedSavings,
  calculatedHours
}) {
  // Height calculation for 3D stacks (in pixels)
  // Max height ~220px, min height ~40px
  const volumeNorm = Math.min(1, Math.max(0, (roiVolume - 100) / 4900));
  const devicesNorm = Math.min(1, Math.max(0, (roiDevices - 10) / 990));
  const combinedLoad = volumeNorm * 0.65 + devicesNorm * 0.35;

  const manualHeight = Math.round(60 + combinedLoad * 160); // 60px to 220px
  const autoHeight = Math.round(manualHeight * 0.216); // 78.4% reduction

  // Tilt state for the 4 secondary cards
  const [tiltCard, setTiltCard] = useState(null);

  const handleMouseMove = (e, cardKey) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const rotateX = -(y / rect.height) * 12;
    const rotateY = (x / rect.width) * 12;
    setTiltCard({ key: cardKey, rotateX, rotateY });
  };

  const handleMouseLeave = () => setTiltCard(null);

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* 3D Isometric Workload Visualization Hero Stage */}
      <div className="relative p-6 md:p-8 bg-surface-dim/95 border border-tertiary/35 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden flex flex-col justify-between">
        {/* Background glow & subtle coordinate grid */}
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#4edea3_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="absolute -top-12 right-1/4 w-72 h-72 bg-tertiary/10 rounded-full blur-3xl pointer-events-none" />

        {/* Stage Header & Hero Savings Callout */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-muted relative z-10">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 font-mono text-xs text-tertiary font-bold">
              <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
              <span>DIMENSIONAL WORKLOAD COMPARISON // REAL-TIME 3D</span>
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

        {/* CSS 3D Isometric Pedestal & Dynamic Extruded Blocks */}
        <div className="relative w-full min-h-[280px] md:min-h-[300px] flex items-center justify-center py-6 my-2">
          {/* Isometric Perspective Scene */}
          <div
            className="relative flex items-end justify-center gap-14 sm:gap-24 md:gap-32"
            style={{
              perspective: '1000px',
              perspectiveOrigin: '50% 120px'
            }}
          >
            {/* Ground Isometric Grid Platter */}
            <div
              className="absolute -bottom-8 w-72 sm:w-96 h-40 border border-tertiary/20 rounded-3xl bg-surface/50 shadow-2xl pointer-events-none"
              style={{
                transform: 'rotateX(60deg) rotateZ(-30deg)',
                transformStyle: 'preserve-3d',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
              }}
            />

            {/* STACK 1: MANUAL ANALYST WORKLOAD */}
            <div className="flex flex-col items-center gap-3 relative z-10">
              <div
                className="relative"
                style={{
                  transform: 'rotateX(60deg) rotateZ(-30deg)',
                  transformStyle: 'preserve-3d',
                  height: '240px',
                  display: 'flex',
                  alignItems: 'flex-end'
                }}
              >
                {/* 3D Prism Container */}
                <div
                  className="relative w-16 sm:w-20 transition-all duration-150 ease-out"
                  style={{
                    height: `${manualHeight}px`,
                    transformStyle: 'preserve-3d'
                  }}
                >
                  {/* Front Face */}
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-[#881337] via-[#9f1239] to-[#f43f5e] border border-rose-500/50 shadow-lg flex flex-col justify-between p-1.5 font-mono text-[9px] text-rose-100 font-bold"
                    style={{
                      transform: 'translateZ(16px)',
                      backfaceVisibility: 'hidden'
                    }}
                  >
                    <span>MANUAL</span>
                    <span className="text-center">{calculatedHours} hrs/wk</span>
                  </div>

                  {/* Top Face */}
                  <div
                    className="absolute -top-8 left-0 w-full h-8 bg-[#fb7185] border border-rose-300/60 shadow-[0_0_12px_rgba(244,63,94,0.6)]"
                    style={{
                      transform: 'rotateX(90deg) translateZ(0px)',
                      transformOrigin: 'bottom'
                    }}
                  />

                  {/* Right Face */}
                  <div
                    className="absolute top-0 -right-8 w-8 h-full bg-[#4c0519] border border-rose-900/60"
                    style={{
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
              <div className="flex flex-col items-center text-center font-mono mt-[-20px]">
                <span className="text-rose-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
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
            <div className="flex flex-col items-center gap-3 relative z-10">
              <div
                className="relative"
                style={{
                  transform: 'rotateX(60deg) rotateZ(-30deg)',
                  transformStyle: 'preserve-3d',
                  height: '240px',
                  display: 'flex',
                  alignItems: 'flex-end'
                }}
              >
                {/* 3D Prism Container */}
                <div
                  className="relative w-16 sm:w-20 transition-all duration-150 ease-out"
                  style={{
                    height: `${autoHeight}px`,
                    transformStyle: 'preserve-3d'
                  }}
                >
                  {/* Front Face */}
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-[#064e3b] via-[#047857] to-[#10b981] border border-emerald-400/60 shadow-[0_0_20px_rgba(16,185,129,0.3)] flex flex-col justify-between p-1.5 font-mono text-[9px] text-emerald-100 font-bold"
                    style={{
                      transform: 'translateZ(16px)',
                      backfaceVisibility: 'hidden'
                    }}
                  >
                    <span>LOG AI</span>
                    <span className="text-center font-black">STREAMLINED</span>
                  </div>

                  {/* Top Face */}
                  <div
                    className="absolute -top-8 left-0 w-full h-8 bg-[#34d399] border border-emerald-200 shadow-[0_0_16px_rgba(52,211,153,0.8)]"
                    style={{
                      transform: 'rotateX(90deg) translateZ(0px)',
                      transformOrigin: 'bottom'
                    }}
                  />

                  {/* Right Face */}
                  <div
                    className="absolute top-0 -right-8 w-8 h-full bg-[#065f46] border border-emerald-900/60"
                    style={{
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
              <div className="flex flex-col items-center text-center font-mono mt-[-20px]">
                <span className="text-tertiary font-bold text-xs uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" />
                  Automated Engine
                </span>
                <span className="text-text-dim text-[10px]">Verified &amp; De-duplicated</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Secondary Stat Cards with Restrained 3D Card-Tilt on Hover */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            className="p-5 bg-surface-dim border border-tertiary/30 rounded-xl flex flex-col justify-between h-full shadow-lg"
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
            className="p-5 bg-surface-dim border border-primary/30 rounded-xl flex flex-col justify-between h-full shadow-lg"
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
            className="p-5 bg-surface-dim border border-secondary/30 rounded-xl flex flex-col justify-between h-full shadow-lg"
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
            className="p-5 bg-surface-dim border border-border-muted rounded-xl flex flex-col justify-between h-full shadow-lg"
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
    </div>
  );
}
