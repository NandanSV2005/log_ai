import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { checkWebGLSupport } from '../../utils/webgl';
import { useThreeThemeColors } from '../tunnel/useThreeThemeColors';

// 3D Blips Definition mapping 2D percentage positions to 3D radar space (x, y, z)
export const DEFAULT_RADAR_BLIPS = [
  {
    id: 1,
    top: '26%',
    left: '70%',
    pos3d: [1.8, 0.45, -1.2],
    host: '10.0.4.12 [SMB]',
    rule: 'T1021.002 Lateral Probe',
    sev: 'SEV 9.4',
    score: 9.4,
    level: 'CRITICAL',
    colorHex: '#ef4444'
  },
  {
    id: 2,
    top: '68%',
    left: '28%',
    pos3d: [-1.6, 0.65, 1.4],
    host: '192.168.1.104',
    rule: 'C2 Egress Jitter',
    sev: 'SEV 6.2',
    score: 6.2,
    level: 'MEDIUM',
    colorHex: '#38bdf8'
  },
  {
    id: 3,
    top: '48%',
    left: '44%',
    pos3d: [-0.4, 0.3, -0.2],
    host: 'pfSense [10.0.0.1]',
    rule: 'GATEWAY SECURE',
    sev: 'NORMAL',
    score: 0.2,
    level: 'LOW',
    colorHex: '#34d399'
  }
];

// Inner 3D Scene containing the rotating radar dish, sweeping beam, and dimensional threat nodes
function RadarScene({ blips, selectedBlip, onSelectBlip, themeColors }) {
  const sweepRef = useRef();
  const groupRef = useRef();
  const { viewport } = useThree();

  // Color tokens from theme
  const radarColor = themeColors.tertiaryStr;
  const dimColor = themeColors.isSage ? '#2d4433' : '#141a29';

  // Ring radiuses for concentric circles
  const rings = [0.8, 1.6, 2.4, 3.2];

  // Fluid responsive scaling:
  // Calculate scale so the 6.8-diameter radar dish fills ~92% of the available container space
  // On wider viewports, height limits size; on taller/narrower mobile viewports, width limits size.
  const minViewportDim = Math.min(viewport.width, viewport.height * 1.35);
  const dynamicScale = Math.max(0.85, Math.min(1.45, (minViewportDim * 0.94) / 5.2));

  // 360-degree sweep animation + subtle mouse parallax
  useFrame((state, delta) => {
    if (sweepRef.current) {
      sweepRef.current.rotation.y -= delta * 1.25; // Continuous sweeping motion
    }

    if (groupRef.current) {
      // Subtle mouse parallax tilt
      const targetRotX = 0.52 + state.pointer.y * 0.08;
      const targetRotY = state.pointer.x * 0.12;
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX, delta * 3);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY, delta * 3);
    }
  });

  return (
    <group
      ref={groupRef}
      position={[0, -0.1, 0]}
      rotation={[0.52, 0, 0]}
      scale={[dynamicScale, dynamicScale, dynamicScale]}
    >
      {/* Radar Dish Base Geometry */}
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[3.4, 64]} />
        <meshBasicMaterial color={dimColor} opacity={0.65} transparent depthWrite={false} />
      </mesh>

      {/* Concentric Range Rings */}
      {rings.map((r, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[r - 0.015, r + 0.015, 64]} />
          <meshBasicMaterial
            color={radarColor}
            opacity={0.18 + i * 0.07}
            transparent
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {/* Crosshair Coordinate Axes */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6.8, 0.02]} />
        <meshBasicMaterial color={radarColor} opacity={0.25} transparent />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
        <planeGeometry args={[6.8, 0.02]} />
        <meshBasicMaterial color={radarColor} opacity={0.25} transparent />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, Math.PI / 4]}>
        <planeGeometry args={[6.8, 0.015]} />
        <meshBasicMaterial color={radarColor} opacity={0.15} transparent />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, -Math.PI / 4]}>
        <planeGeometry args={[6.8, 0.015]} />
        <meshBasicMaterial color={radarColor} opacity={0.15} transparent />
      </mesh>

      {/* Sweeping Detection Beam with 3D Wedge */}
      <group ref={sweepRef} position={[0, 0.02, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.05, 3.4, 32, 1, 0, Math.PI / 3]} />
          <meshBasicMaterial
            color={radarColor}
            opacity={0.35}
            transparent
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* Leading edge laser beam */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[1.7, 0, 0]}>
          <planeGeometry args={[3.4, 0.03]} />
          <meshBasicMaterial color="#ffffff" opacity={0.8} transparent blending={THREE.AdditiveBlending} />
        </mesh>
      </group>

      {/* 3D Blips at Varying Depths */}
      {blips.map((blip) => {
        const isSelected = selectedBlip?.id === blip.id;
        const [bx, by, bz] = blip.pos3d;

        return (
          <group key={blip.id} position={[bx, 0, bz]}>
            {/* Ground projection ring */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.08, 0.12, 16]} />
              <meshBasicMaterial color={blip.colorHex} opacity={0.5} transparent />
            </mesh>

            {/* Vertical stem connecting ground ring to elevated node */}
            <mesh position={[0, by / 2, 0]}>
              <cylinderGeometry args={[0.012, 0.012, by, 8]} />
              <meshBasicMaterial color={blip.colorHex} opacity={0.65} transparent />
            </mesh>

            {/* Elevated 3D Threat Sphere */}
            <mesh
              position={[0, by, 0]}
              onClick={(e) => {
                e.stopPropagation();
                onSelectBlip(blip);
              }}
              onPointerOver={() => (document.body.style.cursor = 'pointer')}
              onPointerOut={() => (document.body.style.cursor = 'default')}
            >
              <sphereGeometry args={[isSelected ? 0.2 : 0.14, 16, 16]} />
              <meshStandardMaterial
                color={blip.colorHex}
                emissive={blip.colorHex}
                emissiveIntensity={isSelected ? 1.3 : 0.6}
                roughness={0.2}
                metalness={0.8}
              />
            </mesh>

            {/* Pulsing indicator ring */}
            <mesh position={[0, by, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.2, 0.24, 24]} />
              <meshBasicMaterial
                color={blip.colorHex}
                opacity={isSelected ? 0.85 : 0.4}
                transparent
                blending={THREE.AdditiveBlending}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// 2D Fallback: Responsive, true circular SVG radar with rotating sweep beam
function FlatRadarFallback({ blips, selectedBlip, onSelectBlip, themeColors }) {
  const dishBaseColor = themeColors?.isSage ? '#2d4433' : '#141a29';
  const radarColor = themeColors?.tertiaryStr || 'var(--color-tertiary)';

  return (
    <div className="relative w-full h-full flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden">
      {/* Background coordinate dot grid */}
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#4edea3_1px,transparent_1px)] [background-size:20px_20px]" />

      {/* Scalable Circular Radar Vector Stage (Always a true circle, filling ~94% of min container dimension) */}
      <div className="relative w-full h-full max-w-[94%] max-h-[94%] aspect-square flex items-center justify-center">
        <svg
          viewBox="0 0 600 600"
          className="w-full h-full max-w-full max-h-full drop-shadow-[0_0_24px_rgba(78,222,163,0.15)]"
        >
          <defs>
            <linearGradient id="sweepGrad2D" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={radarColor} stopOpacity="0.45" />
              <stop offset="100%" stopColor={radarColor} stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Radar Dish Base Circle */}
          <circle cx="300" cy="300" r="280" fill={dishBaseColor} fillOpacity="0.75" stroke={radarColor} strokeWidth="2" strokeOpacity="0.5" />

          {/* Concentric Range Rings */}
          <circle cx="300" cy="300" r="70" fill="none" stroke="var(--color-tertiary)" strokeWidth="1" strokeOpacity="0.2" />
          <circle cx="300" cy="300" r="140" fill="none" stroke="var(--color-tertiary)" strokeWidth="1" strokeOpacity="0.25" />
          <circle cx="300" cy="300" r="210" fill="none" stroke="var(--color-tertiary)" strokeWidth="1" strokeOpacity="0.3" />
          <circle cx="300" cy="300" r="280" fill="none" stroke="var(--color-tertiary)" strokeWidth="1.5" strokeOpacity="0.4" />

          {/* Coordinate Crosshairs */}
          <line x1="20" y1="300" x2="580" y2="300" stroke="var(--color-tertiary)" strokeWidth="1" strokeOpacity="0.25" />
          <line x1="300" y1="20" x2="300" y2="580" stroke="var(--color-tertiary)" strokeWidth="1" strokeOpacity="0.25" />
          <line x1="102" y1="102" x2="498" y2="498" stroke="var(--color-tertiary)" strokeWidth="1" strokeOpacity="0.15" strokeDasharray="4 4" />
          <line x1="102" y1="498" x2="498" y2="102" stroke="var(--color-tertiary)" strokeWidth="1" strokeOpacity="0.15" strokeDasharray="4 4" />

          {/* Range Labels */}
          <text x="306" y="228" fill="var(--color-tertiary)" fontSize="10" fontFamily="monospace" opacity="0.6">50km</text>
          <text x="306" y="158" fill="var(--color-tertiary)" fontSize="10" fontFamily="monospace" opacity="0.6">100km</text>
          <text x="306" y="88" fill="var(--color-tertiary)" fontSize="10" fontFamily="monospace" opacity="0.6">150km</text>
          <text x="306" y="32" fill="var(--color-tertiary)" fontSize="10" fontFamily="monospace" opacity="0.75" fontWeight="bold">200km MAX</text>

          {/* Sweeping Beam Wedge for 2D Fallback */}
          <g className="origin-center animate-[spin_5s_linear_infinite]" style={{ transformOrigin: '300px 300px' }}>
            <path
              d="M 300 300 L 580 300 A 280 280 0 0 0 440 57.6 Z"
              fill="url(#sweepGrad2D)"
              opacity="0.35"
            />
            <line x1="300" y1="300" x2="580" y2="300" stroke="var(--color-tertiary)" strokeWidth="2" strokeOpacity="0.8" />
          </g>
        </svg>

        {/* 2D Interactive Target Blips positioned precisely within circular area */}
        {blips.map((blip) => {
          const isSelected = selectedBlip?.id === blip.id;
          return (
            <div
              key={blip.id}
              style={{ top: blip.top, left: blip.left }}
              onClick={() => onSelectBlip(blip)}
              className="absolute group cursor-pointer z-20 -translate-x-1/2 -translate-y-1/2"
              title={`${blip.host} (${blip.sev})`}
            >
              <span className="relative flex h-6 w-6 items-center justify-center">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${
                    blip.level === 'CRITICAL'
                      ? 'bg-[var(--color-severity-critical)]'
                      : blip.level === 'MEDIUM'
                      ? 'bg-secondary'
                      : 'bg-tertiary'
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-4 w-4 border-2 border-surface-bright shadow-lg transition-transform group-hover:scale-125 ${
                    isSelected ? 'ring-2 ring-white scale-110' : ''
                  } ${
                    blip.level === 'CRITICAL'
                      ? 'bg-[var(--color-severity-critical)]'
                      : blip.level === 'MEDIUM'
                      ? 'bg-secondary'
                      : 'bg-tertiary'
                  }`}
                />
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ThreatRadar3D({
  blips = DEFAULT_RADAR_BLIPS,
  selectedBlip,
  onSelectBlip,
  force2D = false
}) {
  const [hasWebGL, setHasWebGL] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const themeColors = useThreeThemeColors();

  useEffect(() => {
    setHasWebGL(checkWebGLSupport());

    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mql.matches);

    const handler = (e) => setReducedMotion(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  const activeBlip = selectedBlip || blips[0];

  return (
    <div className="flex flex-col flex-1 justify-between gap-3 sm:gap-4 relative w-full h-full">
      {/* Responsive Viewport Container: Expands fluidly to fill container card height with zero dead space */}
      <div className="relative w-full flex-1 min-h-[460px] sm:min-h-[500px] md:min-h-[540px] xl:min-h-[580px] bg-surface-dim rounded-xl overflow-hidden border border-tertiary/30 shadow-inner flex items-center justify-center">
        {/* Subtle coordinate dot grid */}
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#4edea3_1px,transparent_1px)] [background-size:24px_24px]" />

        {hasWebGL && !reducedMotion && !force2D ? (
          <Canvas
            camera={{ position: [0, 2.9, 4.0], fov: 42 }}
            gl={{ antialias: true, alpha: true }}
            className="w-full h-full cursor-grab active:cursor-grabbing"
          >
            <ambientLight intensity={0.85} />
            <pointLight position={[5, 6, 5]} intensity={1.5} color={themeColors.tertiaryStr} />
            <pointLight position={[-5, 4, -4]} intensity={0.9} color={themeColors.secondaryStr} />
            <RadarScene
              blips={blips}
              selectedBlip={activeBlip}
              onSelectBlip={onSelectBlip}
              themeColors={themeColors}
            />
          </Canvas>
        ) : (
          <FlatRadarFallback
            blips={blips}
            selectedBlip={activeBlip}
            onSelectBlip={onSelectBlip}
            themeColors={themeColors}
          />
        )}

        {/* Selected Target HUD Overlay with Solid High-Contrast Shield (Guaranteed sweep occlusion) */}
        {activeBlip && (
          <div className="absolute top-4 left-4 z-30 pointer-events-auto max-w-[280px] sm:max-w-xs">
            <div
              className="bg-surface-dim/95 border border-border-muted rounded-xl p-3 sm:p-3.5 shadow-2xl backdrop-blur-xl font-mono text-xs flex flex-col gap-2 transition-all duration-200"
              style={{
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px var(--color-border-muted)'
              }}
            >
              {/* Header: Severity Tag + Level Pill */}
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-border-muted">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full animate-ping"
                    style={{ backgroundColor: activeBlip.colorHex }}
                  />
                  <span
                    className="font-bold text-[11px] tracking-wider uppercase"
                    style={{ color: activeBlip.colorHex }}
                  >
                    TARGET // {activeBlip.sev}
                  </span>
                </div>
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                  style={{
                    color: activeBlip.colorHex,
                    backgroundColor: `color-mix(in srgb, ${activeBlip.colorHex} 15%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${activeBlip.colorHex} 30%, transparent)`
                  }}
                >
                  {activeBlip.level}
                </span>
              </div>

              {/* Hostname & Rule: High Contrast Typography */}
              <div className="flex flex-col gap-0.5">
                <div className="font-display font-bold text-sm text-text-primary tracking-wide">
                  {activeBlip.host}
                </div>
                <div className="text-text-muted text-[11px] font-sans">
                  {activeBlip.rule}
                </div>
              </div>

              {/* Footer: 3D Coordinate + Clearly Separated LOCKED Badge */}
              <div className="pt-2 border-t border-border-muted/80 flex items-center justify-between gap-3 text-[10px]">
                <div className="flex items-center gap-1 text-text-dim truncate">
                  <span className="text-text-muted font-semibold">3D COORD:</span>
                  <span className="font-mono text-text-primary font-bold">
                    [{activeBlip.pos3d.join(', ')}]
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-tertiary/15 border border-tertiary/40 text-tertiary font-bold text-[9px] tracking-wider shrink-0 shadow-sm ml-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" />
                  LOCKED
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Radar Metrics Overlay Footer */}
        <div className="absolute bottom-3 left-4 font-mono text-[11px] text-tertiary/90 font-bold bg-surface-dim/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-tertiary/25 flex items-center gap-2 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
          <span>FOV: 3D TOPOLOGY DISH // 3 TARGETS IN DEPTH</span>
        </div>
        <div className="absolute top-3 right-4 font-mono text-[10px] text-text-dim bg-surface-dim/85 backdrop-blur-md px-2.5 py-1 rounded-lg border border-border-muted hidden sm:block shadow-sm">
          POLAR GRID: &plusmn;45&deg; ELEVATION
        </div>
      </div>

      {/* Target Quick-Selector Pills (Cleanly separated from radar dish with top border) */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border-muted/30 font-mono text-xs">
        <span className="text-[11px] text-text-dim font-bold uppercase mr-1">TRACKED TARGETS:</span>
        {blips.map((b) => {
          const isActive = activeBlip.id === b.id;
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => onSelectBlip(b)}
              className={`px-3 py-1.5 rounded-lg border font-mono text-[11px] transition-all flex items-center gap-2 cursor-pointer ${
                isActive
                  ? 'border-tertiary bg-tertiary/20 text-tertiary font-bold shadow-[0_0_12px_rgba(78,222,163,0.3)]'
                  : 'border-border-muted bg-surface-dim text-text-muted hover:text-text-primary hover:border-tertiary/40'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: b.colorHex }}
              />
              <span>{b.host}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
