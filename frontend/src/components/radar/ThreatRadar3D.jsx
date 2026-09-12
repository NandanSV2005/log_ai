import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
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
    colorHex: '#ef4444',
    colorClass: 'text-[var(--color-severity-critical)] border-[var(--color-severity-critical-border)] bg-[#160c0e]/95'
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
    colorHex: '#38bdf8',
    colorClass: 'text-secondary border-secondary/50 bg-[#0a1824]/95'
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
    colorHex: '#34d399',
    colorClass: 'text-tertiary border-tertiary/50 bg-[#091e17]/95'
  }
];

// Inner 3D Scene containing the rotating radar dish, sweeping beam, and dimensional threat nodes
function RadarScene({ blips, selectedBlip, onSelectBlip, themeColors }) {
  const sweepRef = useRef();
  const groupRef = useRef();

  // Color tokens from theme
  const radarColor = themeColors.tertiaryStr;
  const gridColor = themeColors.secondaryStr;
  const dimColor = themeColors.isSage ? '#2d4433' : '#141a29';

  // Ring radiuses for concentric circles
  const rings = [0.8, 1.6, 2.4, 3.2];

  // 360-degree sweep animation + mouse parallax
  useFrame((state, delta) => {
    if (sweepRef.current) {
      sweepRef.current.rotation.y -= delta * 1.25; // Continuous sweeping motion
    }

    if (groupRef.current) {
      // Subtle mouse parallax tilt
      const targetRotX = 0.55 + state.pointer.y * 0.12;
      const targetRotY = state.pointer.x * 0.18;
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX, delta * 3);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY, delta * 3);
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.4, 0]} rotation={[0.55, 0, 0]}>
      {/* Radar Dish Base Geometry */}
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[3.4, 48]} />
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
              <sphereGeometry args={[isSelected ? 0.18 : 0.13, 16, 16]} />
              <meshStandardMaterial
                color={blip.colorHex}
                emissive={blip.colorHex}
                emissiveIntensity={isSelected ? 1.2 : 0.6}
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

// 2D Fallback for environments lacking WebGL or prefers-reduced-motion
function FlatRadarFallback({ blips, selectedBlip, onSelectBlip }) {
  return (
    <div className="relative w-full aspect-[16/10] md:aspect-[16/9] bg-surface-dim rounded-xl overflow-hidden border border-border-muted flex items-center justify-center">
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#4edea3_1px,transparent_1px)] [background-size:20px_20px]" />
      <div className="absolute w-[85%] h-[85%] rounded-full border border-tertiary/20" />
      <div className="absolute w-[62%] h-[62%] rounded-full border border-tertiary/30" />
      <div className="absolute w-[40%] h-[40%] rounded-full border border-tertiary/40" />
      <div className="absolute w-[18%] h-[18%] rounded-full border border-tertiary/50" />
      <div className="absolute w-full h-[1px] bg-tertiary/25" />
      <div className="absolute h-full w-[1px] bg-tertiary/25" />
      <div className="absolute w-full h-[1px] bg-tertiary/15 rotate-45" />
      <div className="absolute w-full h-[1px] bg-tertiary/15 -rotate-45" />

      {blips.map((blip) => (
        <div
          key={blip.id}
          style={{ top: blip.top, left: blip.left }}
          onClick={() => onSelectBlip(blip)}
          className="absolute group cursor-pointer z-20"
        >
          <span className="relative flex h-5 w-5">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-70 ${
                blip.level === 'CRITICAL'
                  ? 'bg-[var(--color-severity-critical)]'
                  : blip.level === 'MEDIUM'
                  ? 'bg-secondary'
                  : 'bg-tertiary'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-5 w-5 border-2 border-surface-bright shadow-lg ${
                blip.level === 'CRITICAL'
                  ? 'bg-[var(--color-severity-critical)]'
                  : blip.level === 'MEDIUM'
                  ? 'bg-secondary'
                  : 'bg-tertiary'
              }`}
            />
          </span>
        </div>
      ))}
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
    <div className="flex flex-col gap-4 relative">
      {/* 3D Viewport or Fallback Container */}
      <div className="relative w-full aspect-[16/10] md:aspect-[16/9] bg-surface-dim rounded-xl overflow-hidden border border-tertiary/30 shadow-inner flex items-center justify-center">
        {/* Subtle grid background */}
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#4edea3_1px,transparent_1px)] [background-size:24px_24px]" />

        {hasWebGL && !reducedMotion && !force2D ? (
          <Canvas
            camera={{ position: [0, 3.8, 5.2], fov: 42 }}
            gl={{ antialias: true, alpha: true }}
            className="w-full h-full cursor-grab active:cursor-grabbing"
          >
            <ambientLight intensity={0.8} />
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
          />
        )}

        {/* Selected Target HUD Overlay */}
        {activeBlip && (
          <div className="absolute top-4 left-4 z-20 pointer-events-auto">
            <div className={`border p-3 rounded-xl shadow-2xl backdrop-blur-md font-mono text-xs max-w-xs transition-all ${activeBlip.colorClass}`}>
              <div className="font-bold flex items-center justify-between gap-2 pb-1.5 border-b border-current/20">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-current animate-ping" />
                  <span>TARGET // {activeBlip.sev}</span>
                </div>
                <span className="text-[10px] opacity-80 uppercase tracking-wider">{activeBlip.level}</span>
              </div>
              <div className="pt-2 text-text-primary font-bold text-[13px]">{activeBlip.host}</div>
              <div className="text-text-dim text-[11px] mt-0.5">{activeBlip.rule}</div>
              <div className="flex items-center justify-between text-[10px] text-text-dim pt-2 mt-2 border-t border-current/15">
                <span>3D COORD: [{activeBlip.pos3d.join(', ')}]</span>
                <span className="text-tertiary font-bold">LOCKED</span>
              </div>
            </div>
          </div>
        )}

        {/* Radar Metrics Overlay Footer */}
        <div className="absolute bottom-3 left-4 font-mono text-[11px] text-tertiary/90 font-bold bg-surface-dim/80 backdrop-blur-sm px-3 py-1 rounded-lg border border-tertiary/25 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
          <span>FOV: 3D TOPOLOGY DISH // 3 TARGETS IN DEPTH</span>
        </div>
        <div className="absolute top-3 right-4 font-mono text-[10px] text-text-dim bg-surface-dim/70 px-2.5 py-0.5 rounded border border-border-muted hidden sm:block">
          POLAR GRID: &plusmn;45&deg; ELEVATION
        </div>
      </div>

      {/* Target Quick-Selector Pills */}
      <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-xs">
        <span className="text-[11px] text-text-dim font-bold uppercase mr-1">TRACKED TARGETS:</span>
        {blips.map((b) => {
          const isActive = activeBlip.id === b.id;
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => onSelectBlip(b)}
              className={`px-3 py-1 rounded-lg border font-mono text-[11px] transition-all flex items-center gap-2 cursor-pointer ${
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
