import React from 'react';

export function DissectionConduitStream({ isActive, revealStep = 0, forceDisable = false }) {
  if (forceDisable) return null;

  // Reveal step mapping to flow stage
  // Step 0-3: Flowing into Col 2
  // Step 4+: Flowing into Col 3
  const isFlowingToCol2 = isActive && (revealStep === 0 || revealStep <= 3);
  const isFlowingToCol3 = isActive && (revealStep >= 3);

  return (
    <div className="relative w-full mb-[-12px] z-20 pointer-events-none hidden xl:block">
      <div className="grid grid-cols-12 gap-6 items-center px-6">
        {/* Gap 1 to 2 Conduit */}
        <div className="col-start-4 col-span-2 flex items-center justify-center relative h-6">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 200 24" preserveAspectRatio="none">
            {/* Base guide track */}
            <path
              d="M 0 12 L 200 12"
              fill="none"
              stroke="var(--color-primary, #a78bfa)"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              opacity={isActive ? 0.4 : 0.15}
            />

            {/* Glowing animated active beam */}
            {isFlowingToCol2 && (
              <>
                <path
                  d="M 0 12 L 200 12"
                  fill="none"
                  stroke="var(--color-primary, #a78bfa)"
                  strokeWidth="3"
                  className="animate-pulse"
                  opacity={0.8}
                  filter="drop-shadow(0 0 6px var(--color-primary, #a78bfa))"
                />
                {/* Flowing packet circles */}
                <circle r="4" fill="#ffffff" filter="drop-shadow(0 0 8px #ffffff)">
                  <animate
                    attributeName="cx"
                    from="0"
                    to="200"
                    dur="0.8s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="cy"
                    values="12;12"
                    dur="0.8s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle r="2.5" fill="var(--color-secondary, #7bd0ff)">
                  <animate
                    attributeName="cx"
                    from="0"
                    to="200"
                    dur="0.8s"
                    begin="0.4s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="cy"
                    values="12;12"
                    dur="0.8s"
                    repeatCount="indefinite"
                  />
                </circle>
              </>
            )}
          </svg>

          {/* Micro indicator badge */}
          {isFlowingToCol2 && (
            <span className="absolute -top-3 px-2 py-0.5 rounded-full bg-primary/20 border border-primary/40 text-primary font-mono text-[9px] font-bold tracking-widest uppercase animate-pulse">
              INGEST &rarr; PARSE
            </span>
          )}
        </div>

        {/* Gap 2 to 3 Conduit */}
        <div className="col-start-8 col-span-2 flex items-center justify-center relative h-6">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 200 24" preserveAspectRatio="none">
            {/* Base guide track */}
            <path
              d="M 0 12 L 200 12"
              fill="none"
              stroke="var(--color-tertiary, #4edea3)"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              opacity={isActive ? 0.4 : 0.15}
            />

            {/* Glowing animated active beam */}
            {isFlowingToCol3 && (
              <>
                <path
                  d="M 0 12 L 200 12"
                  fill="none"
                  stroke="var(--color-tertiary, #4edea3)"
                  strokeWidth="3"
                  className="animate-pulse"
                  opacity={0.8}
                  filter="drop-shadow(0 0 6px var(--color-tertiary, #4edea3))"
                />
                {/* Flowing packet circles */}
                <circle r="4" fill="#ffffff" filter="drop-shadow(0 0 8px #ffffff)">
                  <animate
                    attributeName="cx"
                    from="0"
                    to="200"
                    dur="0.8s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="cy"
                    values="12;12"
                    dur="0.8s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle r="2.5" fill="var(--color-tertiary, #4edea3)">
                  <animate
                    attributeName="cx"
                    from="0"
                    to="200"
                    dur="0.8s"
                    begin="0.4s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="cy"
                    values="12;12"
                    dur="0.8s"
                    repeatCount="indefinite"
                  />
                </circle>
              </>
            )}
          </svg>

          {/* Micro indicator badge */}
          {isFlowingToCol3 && (
            <span className="absolute -top-3 px-2 py-0.5 rounded-full bg-tertiary/20 border border-tertiary/40 text-tertiary font-mono text-[9px] font-bold tracking-widest uppercase animate-pulse">
              SEAL &rarr; VERDICT
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
