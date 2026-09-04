import React from 'react';

/**
 * StitchBrandMark
 * Minimal, geometric brand mark for Stitch (Security Operations & Intelligence Platform).
 * Formed by interlocking telemetry data threads forming a clean 'S' shape.
 * Inherits text color dynamically (currentColor) for seamless Cyber Void and Sage Green theme adaptation.
 */
export function StitchBrandMark({ className = "w-6 h-6", size = 24 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Primary Geometric S Thread */}
      <path
        d="M23 7.5H12C9.51472 7.5 7.5 9.51472 7.5 12C7.5 14.4853 9.51472 16.5 12 16.5H20C22.4853 16.5 24.5 18.5147 24.5 21C24.5 23.4853 22.4853 25.5 20 25.5H9"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Interlocking Secondary Stitch Paths */}
      <path
        d="M9 10.5H20C22.4853 10.5 24.5 12.5147 24.5 15"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.5"
      />
      <path
        d="M23 21.5H12C9.51472 21.5 7.5 19.4853 7.5 17"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.5"
      />
      {/* Telemetry Node Terminal Points */}
      <circle cx="23" cy="7.5" r="1.8" fill="currentColor" />
      <circle cx="9" cy="25.5" r="1.8" fill="currentColor" />
    </svg>
  );
}
