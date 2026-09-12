import React from 'react';

/**
 * Animated 3D Data Conduit Stream connecting Chapter 05 Dissection columns.
 * Activates during log analysis with synchronized particle flows and glowing laser beams.
 */
export function DissectionConduitStream({
  isActive = false,
  revealStep = 0,
  forceDisable = false
}) {
  if (forceDisable) return null;

  // Flow stages synced with staggered reveal sequencing:
  // Step 0-3 (or during initial loading): Col 1 -> Col 2 (Raw Ingest -> OCSF Normalization)
  // Step 3-6+: Col 2 -> Col 3 (OCSF -> AI Verdict & Cryptographic Seal)
  const isFlowingToCol2 = isActive && (revealStep === 0 || revealStep <= 3);
  const isFlowingToCol3 = isActive && (revealStep >= 3);

  return (
    <div className="relative w-full z-20 pointer-events-none mb-[-8px] hidden xl:block">
      <div className="grid grid-cols-12 gap-6 items-center px-6">
        {/* Conduit 1: Between Column 1 & Column 2 (Columns 4 to 5) */}
        <div className="col-start-4 col-span-2 flex items-center justify-center relative h-8">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 200 32" preserveAspectRatio="none">
            <defs>
              <linearGradient id="conduit-grad-1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--color-primary, #a78bfa)" stopOpacity="0.8" />
                <stop offset="100%" stopColor="var(--color-secondary, #7bd0ff)" stopOpacity="0.9" />
              </linearGradient>
              <filter id="glow-p1" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Base passive guide track */}
            <line
              x1="0"
              y1="16"
              x2="200"
              y2="16"
              stroke="var(--color-primary, #a78bfa)"
              strokeWidth="2"
              strokeDasharray="4 4"
              opacity={isActive ? 0.45 : 0.2}
            />

            {/* Active glowing laser beam */}
            {isFlowingToCol2 && (
              <>
                <line
                  x1="0"
                  y1="16"
                  x2="200"
                  y2="16"
                  stroke="url(#conduit-grad-1)"
                  strokeWidth="3.5"
                  filter="url(#glow-p1)"
                  className="animate-pulse"
                />

                {/* Flowing packet photon 1 */}
                <circle r="4.5" fill="#ffffff" filter="url(#glow-p1)">
                  <animate
                    attributeName="cx"
                    from="0"
                    to="200"
                    dur="0.65s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="cy"
                    values="16;16"
                    dur="0.65s"
                    repeatCount="indefinite"
                  />
                </circle>

                {/* Flowing packet photon 2 */}
                <circle r="3" fill="var(--color-secondary, #7bd0ff)" opacity="0.9">
                  <animate
                    attributeName="cx"
                    from="0"
                    to="200"
                    dur="0.65s"
                    begin="0.22s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="cy"
                    values="16;16"
                    dur="0.65s"
                    repeatCount="indefinite"
                  />
                </circle>

                {/* Flowing packet photon 3 */}
                <circle r="2.5" fill="var(--color-primary, #a78bfa)" opacity="0.8">
                  <animate
                    attributeName="cx"
                    from="0"
                    to="200"
                    dur="0.65s"
                    begin="0.44s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="cy"
                    values="16;16"
                    dur="0.65s"
                    repeatCount="indefinite"
                  />
                </circle>
              </>
            )}
          </svg>

          {/* Micro telemetry indicator chip */}
          <div
            className={`absolute -top-3 px-2 py-0.5 rounded-full border font-mono text-[9px] font-bold tracking-widest uppercase transition-all duration-300 ${
              isFlowingToCol2
                ? 'bg-primary/20 border-primary text-primary shadow-[0_0_12px_rgba(167,139,250,0.5)] scale-105'
                : 'bg-surface-dim/80 border-border-muted text-text-dim scale-95 opacity-60'
            }`}
          >
            {isFlowingToCol2 ? 'EXTRACTING FIELDS...' : 'FIELD EXTRACTION'}
          </div>
        </div>

        {/* Conduit 2: Between Column 2 & Column 3 (Columns 8 to 9) */}
        <div className="col-start-8 col-span-2 flex items-center justify-center relative h-8">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 200 32" preserveAspectRatio="none">
            <defs>
              <linearGradient id="conduit-grad-2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--color-secondary, #7bd0ff)" stopOpacity="0.8" />
                <stop offset="100%" stopColor="var(--color-tertiary, #4edea3)" stopOpacity="0.9" />
              </linearGradient>
              <filter id="glow-p2" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Base passive guide track */}
            <line
              x1="0"
              y1="16"
              x2="200"
              y2="16"
              stroke="var(--color-tertiary, #4edea3)"
              strokeWidth="2"
              strokeDasharray="4 4"
              opacity={isActive ? 0.45 : 0.2}
            />

            {/* Active glowing laser beam */}
            {isFlowingToCol3 && (
              <>
                <line
                  x1="0"
                  y1="16"
                  x2="200"
                  y2="16"
                  stroke="url(#conduit-grad-2)"
                  strokeWidth="3.5"
                  filter="url(#glow-p2)"
                  className="animate-pulse"
                />

                {/* Flowing packet photon 1 */}
                <circle r="4.5" fill="#ffffff" filter="url(#glow-p2)">
                  <animate
                    attributeName="cx"
                    from="0"
                    to="200"
                    dur="0.65s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="cy"
                    values="16;16"
                    dur="0.65s"
                    repeatCount="indefinite"
                  />
                </circle>

                {/* Flowing packet photon 2 */}
                <circle r="3" fill="var(--color-tertiary, #4edea3)" opacity="0.9">
                  <animate
                    attributeName="cx"
                    from="0"
                    to="200"
                    dur="0.65s"
                    begin="0.22s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="cy"
                    values="16;16"
                    dur="0.65s"
                    repeatCount="indefinite"
                  />
                </circle>

                {/* Flowing packet photon 3 */}
                <circle r="2.5" fill="var(--color-secondary, #7bd0ff)" opacity="0.8">
                  <animate
                    attributeName="cx"
                    from="0"
                    to="200"
                    dur="0.65s"
                    begin="0.44s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="cy"
                    values="16;16"
                    dur="0.65s"
                    repeatCount="indefinite"
                  />
                </circle>
              </>
            )}
          </svg>

          {/* Micro telemetry indicator chip */}
          <div
            className={`absolute -top-3 px-2 py-0.5 rounded-full border font-mono text-[9px] font-bold tracking-widest uppercase transition-all duration-300 ${
              isFlowingToCol3
                ? 'bg-tertiary/20 border-tertiary text-tertiary shadow-[0_0_12px_rgba(78,222,163,0.5)] scale-105'
                : 'bg-surface-dim/80 border-border-muted text-text-dim scale-95 opacity-60'
            }`}
          >
            {isFlowingToCol3 ? 'CLASSIFYING THREAT...' : 'THREAT CLASSIFICATION'}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Direct Inter-Card Connector Bridge placed between column cards.
 * Provides visible 3D particle connections right at the cards' mid-line.
 */
export function ConduitBridge({
  fromColor = 'primary',
  toColor = 'secondary',
  isActive = false,
  label = 'DATA STREAM',
  direction = 'horizontal'
}) {
  return (
    <div
      className={`relative flex items-center justify-center pointer-events-none transition-all duration-300 ${
        direction === 'horizontal' ? 'w-full h-8' : 'w-8 h-12 my-[-8px]'
      }`}
    >
      <div
        className={`w-full h-0.5 border-t border-dashed transition-all duration-300 ${
          isActive
            ? `border-${toColor} opacity-90 shadow-[0_0_8px_var(--color-${toColor})]`
            : 'border-border-muted opacity-30'
        }`}
      />
      {isActive && (
        <span
          className={`absolute px-2 py-0.5 rounded-full bg-${toColor}/20 border border-${toColor} text-${toColor} font-mono text-[8px] font-bold tracking-wider animate-pulse whitespace-nowrap shadow-[0_0_10px_var(--color-${toColor})]`}
        >
          {label}
        </span>
      )}
    </div>
  );
}
