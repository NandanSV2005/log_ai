import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useThreeThemeColors } from '../tunnel/useThreeThemeColors';
import { checkWebGLSupport } from '../../utils/webgl';
import {
  lusionMotionState,
  MaskedRevealText,
  StripeCtaButton,
  StructuralGridSpine,
} from './LusionMotionEngine';

gsap.registerPlugin(ScrollTrigger);

/**
 * Interactive 3D WebGL Data-Stream Tunnel (3,000 glowing telemetry nodes + connecting filaments).
 * - Mouse Repulsion & Parallax (uMouse + camera tilt with lerp: 0.08)
 * - Scroll-Velocity Warp (baseSpeed + Math.abs(velocity) * 0.4)
 * - 0% to 45% Scroll Progress Camera Z-Zoom (camera.position.z zooms in)
 */
function DataStreamTunnel3D({ colors, mouseRef, progressRef }) {
  const pointsRef = useRef(null);
  const filamentsRef = useRef(null);
  const warpOffsetRef = useRef(0);
  const smoothMouseRef = useRef({ x: 0, y: 0 });

  const particleCount = 3000;

  const { positions, phases, speeds, colorWeights, filamentPositions } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const ph = new Float32Array(particleCount);
    const sp = new Float32Array(particleCount);
    const cw = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const ringIdx = i % 60;
      const angle = (i / particleCount) * Math.PI * 28 + ringIdx * 0.21;
      const radius = 0.75 + ((i * 79) % 100) * 0.062;
      const z = -22 + ((i * 43) % 100) * 0.28;

      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = Math.sin(angle) * radius * 0.68;
      pos[i * 3 + 2] = z;

      ph[i] = ((i * 23) % 100) * 0.0628;
      sp[i] = 0.55 + ((i * 41) % 100) * 0.015;
      cw[i] = (i % 4) / 3; // 0 = Primary Gold/Blue, 0.33 = Secondary Amber/Lavender, 0.66 = Critical Rose, 1.0 = Tertiary Slate
    }

    // Build subtle connecting filaments along the data-stream tunnel
    const filamentSegments = 220;
    const filPos = new Float32Array(filamentSegments * 6);
    for (let j = 0; j < filamentSegments; j++) {
      const idxA = (j * 13) % particleCount;
      const idxB = (idxA + 1) % particleCount;
      filPos[j * 6] = pos[idxA * 3];
      filPos[j * 6 + 1] = pos[idxA * 3 + 1];
      filPos[j * 6 + 2] = pos[idxA * 3 + 2];
      filPos[j * 6 + 3] = pos[idxB * 3];
      filPos[j * 6 + 4] = pos[idxB * 3 + 1];
      filPos[j * 6 + 5] = pos[idxB * 3 + 2];
    }

    return {
      positions: pos,
      phases: ph,
      speeds: sp,
      colorWeights: cw,
      filamentPositions: filPos,
    };
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uWarpOffset: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uProgress: { value: 0 },
      uColorPrimary: { value: colors.primary.clone() },
      uColorSecondary: { value: colors.secondary.clone() },
      uColorCritical: { value: colors.critical.clone() },
      uColorTertiary: { value: colors.tertiary.clone() },
    }),
    []
  );

  useEffect(() => {
    uniforms.uColorPrimary.value.copy(colors.primary);
    uniforms.uColorSecondary.value.copy(colors.secondary);
    uniforms.uColorCritical.value.copy(colors.critical);
    uniforms.uColorTertiary.value.copy(colors.tertiary);
  }, [colors, uniforms]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.getElapsedTime();
    uniforms.uTime.value = t;

    // Smooth mouse spring decay (lerp: 0.08)
    smoothMouseRef.current.x += (mouseRef.current.x - smoothMouseRef.current.x) * 0.08;
    smoothMouseRef.current.y += (mouseRef.current.y - smoothMouseRef.current.y) * 0.08;
    uniforms.uMouse.value.set(smoothMouseRef.current.x, smoothMouseRef.current.y);

    // Scroll-Velocity Warp: baseSpeed + Math.abs(velocity) * 0.4
    const liveVelocity = Math.abs(lusionMotionState.velocity || 0);
    const warpSpeed = 1.15 + Math.min(liveVelocity * 0.4, 18.0);
    warpOffsetRef.current += dt * warpSpeed;
    uniforms.uWarpOffset.value = warpOffsetRef.current;

    const progress = progressRef.current || 0;
    uniforms.uProgress.value += (progress - uniforms.uProgress.value) * 0.1;

    // Camera Parallax + 0% to 45% Scroll Progress Z-Zoom
    const zoomFactor = Math.min(1, progress / 0.45);
    const targetCamZ = 6.4 - zoomFactor * 2.3;
    state.camera.position.x += (smoothMouseRef.current.x * 0.55 - state.camera.position.x) * 0.08;
    state.camera.position.y += (smoothMouseRef.current.y * 0.38 - state.camera.position.y) * 0.08;
    state.camera.position.z += (targetCamZ - state.camera.position.z) * 0.08;
    state.camera.lookAt(
      smoothMouseRef.current.x * 0.25,
      smoothMouseRef.current.y * 0.18,
      -4
    );

    if (filamentsRef.current) {
      filamentsRef.current.rotation.z = t * 0.04;
      filamentsRef.current.position.z = ((warpOffsetRef.current * 0.8) % 8) - 2;
    }
  });

  const vertexShader = `
    attribute float aPhase;
    attribute float aSpeed;
    attribute float aColorWeight;
    uniform float uTime;
    uniform float uWarpOffset;
    uniform vec2 uMouse;
    uniform float uProgress;
    varying float vColorWeight;
    varying float vAlpha;

    void main() {
      vColorWeight = aColorWeight;
      vec3 pos = position;

      // Continuous Z-axis stream + Scroll-Velocity Warp
      float zSpan = 28.0;
      float zFlow = mod(pos.z + 22.0 + uWarpOffset * aSpeed, zSpan) - 22.0;
      pos.z = zFlow;

      // Subtle helical swirl towards the AI neural core
      float swirl = uTime * 0.28 + aPhase + uProgress * 1.4;
      pos.x += cos(swirl) * 0.16;
      pos.y += sin(swirl) * 0.16;

      // Radial Mouse Repulsion in normalized screen space
      vec2 mouseWorld = uMouse * vec2(3.6, 2.2);
      vec2 toParticle = pos.xy - mouseWorld;
      float dist = length(toParticle);
      float repelRadius = 2.1;
      if (dist < repelRadius && dist > 0.001) {
        float force = pow(1.0 - dist / repelRadius, 2.0) * 0.95;
        pos.xy += normalize(toParticle) * force;
      }

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPosition;

      float depthScale = clamp(15.0 / -mvPosition.z, 1.2, 6.2);
      gl_PointSize = depthScale * (1.0 + 0.25 * sin(uTime * 2.4 + aPhase));

      float distFade = smoothstep(-22.0, -6.0, pos.z) * (1.0 - smoothstep(2.0, 6.0, pos.z));
      vAlpha = clamp(distFade * 0.88, 0.12, 0.92);
    }
  `;

  const fragmentShader = `
    uniform vec3 uColorPrimary;
    uniform vec3 uColorSecondary;
    uniform vec3 uColorCritical;
    uniform vec3 uColorTertiary;
    varying float vColorWeight;
    varying float vAlpha;

    void main() {
      vec2 cxy = 2.0 * gl_PointCoord - 1.0;
      float r = dot(cxy, cxy);
      if (r > 1.0) discard;

      float softEdge = pow(1.0 - r, 1.7);
      vec3 col = uColorPrimary;
      if (vColorWeight < 0.34) {
        col = mix(uColorPrimary, uColorSecondary, vColorWeight * 3.0);
      } else if (vColorWeight < 0.67) {
        col = mix(uColorSecondary, uColorCritical, (vColorWeight - 0.34) * 3.0);
      } else {
        col = mix(uColorCritical, uColorTertiary, (vColorWeight - 0.67) * 3.0);
      }

      gl_FragColor = vec4(col, vAlpha * softEdge);
    }
  `;

  return (
    <group>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particleCount}
            array={positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-aPhase"
            count={particleCount}
            array={phases}
            itemSize={1}
          />
          <bufferAttribute
            attach="attributes-aSpeed"
            count={particleCount}
            array={speeds}
            itemSize={1}
          />
          <bufferAttribute
            attach="attributes-aColorWeight"
            count={particleCount}
            array={colorWeights}
            itemSize={1}
          />
        </bufferGeometry>
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={colors.isSage ? THREE.NormalBlending : THREE.AdditiveBlending}
        />
      </points>

      {/* Subtle Connecting Filaments */}
      <lineSegments ref={filamentsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={filamentPositions.length / 3}
            array={filamentPositions}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color={colors.primary}
          transparent
          opacity={colors.isSage ? 0.14 : 0.18}
        />
      </lineSegments>
    </group>
  );
}

const PORTAL_STREAM_EVENTS = [
  {
    id: 'SOC-9941',
    ts: '11:42:01.084',
    vendor: 'CISCO ASA',
    src: '185.220.101.5:54312',
    dst: '10.0.4.12:445',
    ocsfClass: 'Network Activity [4001]',
    verdict: 'SMB_LATERAL_PROBE',
    confidence: '99.4%',
    level: 'CRITICAL',
    hash: 'sha256:c29d18b4...98a3e7',
  },
  {
    id: 'SOC-9942',
    ts: '11:42:00.619',
    vendor: 'FORTIGATE',
    src: '192.168.1.104:49112',
    dst: 'api.internal:443',
    ocsfClass: 'HTTP Activity [4002]',
    verdict: 'SQL_INJECTION_PAYLOAD',
    confidence: '98.8%',
    level: 'HIGH',
    hash: 'sha256:8f3c49e2...0e1d9a',
  },
  {
    id: 'SOC-9943',
    ts: '11:41:59.210',
    vendor: 'SURICATA EVE',
    src: '45.33.32.156:443',
    dst: '10.0.0.5:51234',
    ocsfClass: 'Security Finding [2001]',
    verdict: 'C2_BEACON_JITTER',
    confidence: '94.1%',
    level: 'MEDIUM',
    hash: 'sha256:7b1109ce...34fa12',
  },
  {
    id: 'SOC-9944',
    ts: '11:41:58.004',
    vendor: 'LINUX AUDITD',
    src: '10.0.0.14:22',
    dst: 'auth.cluster:22',
    ocsfClass: 'Authentication [3002]',
    verdict: 'NORMAL_SSH_HEARTBEAT',
    confidence: '99.1%',
    level: 'LOW',
    hash: 'sha256:4ea94dfb...8c7ec7',
  },
];

/**
 * Lusion Pinned Hero-to-SOC Portal Transition (#hero-pin-wrapper)
 * - 0% to 45% Scroll Progress:
 *   Hero headline, badge, and CTAs scale down (scale: 0.82), translate upward (y: -60),
 *   blur (filter: blur(10px)), and fade out (opacity: 0), while WebGL camera zooms in.
 * - 30% to 100% Scroll Progress:
 *   The Portal Backdrop expands its clip-path from inset(18% 12% 18% 12% round 20px)
 *   to inset(0% 0% 0% 0% round 0px) (100vw x 100vh full-screen HUD) while the Live SOC
 *   Terminal Preview Card rises to the center of the viewport and scales from 0.9 to 1.0
 *   with zero clipped text.
 */
export function LusionHeroPortal({ is2D = false, totalIngested = 48281 }) {
  const colors = useThreeThemeColors();
  const sectionRef = useRef(null);
  const headlineWrapRef = useRef(null);
  const portalBackdropRef = useRef(null);
  const portalFrameRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const progressRef = useRef(0);

  const [hasWebGL, setHasWebGL] = useState(false);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [selectedRowId, setSelectedRowId] = useState('SOC-9941');
  const [portalProgressPct, setPortalProgressPct] = useState(0);

  useEffect(() => {
    setHasWebGL(checkWebGLSupport());
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = -(e.clientY / window.innerHeight) * 2 + 1;
      mouseRef.current = { x: nx, y: ny };
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const sectionEl = sectionRef.current;
    const headlineEl = headlineWrapRef.current;
    const backdropEl = portalBackdropRef.current;
    const portalEl = portalFrameRef.current;
    if (!sectionEl || !headlineEl || !portalEl || !backdropEl) return undefined;

    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    if (is2D || reducedMotion || isMobile) {
      gsap.set(headlineEl, { scale: 1, opacity: 1, filter: 'blur(0px)', y: 0 });
      gsap.set(backdropEl, {
        clipPath: 'inset(0% 0% 0% 0% round 0px)',
        opacity: 0,
      });
      gsap.set(portalEl, {
        scale: 1,
        opacity: 1,
        y: 0,
      });
      progressRef.current = 1;
      setPortalProgressPct(100);
      return undefined;
    }

    const ctx = gsap.context(() => {
      gsap.set(backdropEl, {
        clipPath: 'inset(18% 12% 18% 12% round 20px)',
        opacity: 0,
      });
      gsap.set(portalEl, {
        scale: 0.9,
        y: 0,
        transformOrigin: 'center center',
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          id: 'hero-portal-pin',
          trigger: sectionEl,
          start: 'top top',
          end: '+=180%',
          pin: true,
          pinSpacing: true,
          scrub: 1,
          anticipatePin: 1,
          refreshPriority: 2,
          onUpdate: (self) => {
            progressRef.current = self.progress;
            const pct = Math.round(self.progress * 100);
            setPortalProgressPct((prev) => (prev === pct ? prev : pct));
          },
        },
      });

      // 0% to 45% Scroll Progress: Headline scales down (0.82), translates up (y: -60), blurs (10px), fades out
      tl.to(
        headlineEl,
        {
          scale: 0.82,
          y: -60,
          filter: 'blur(10px)',
          opacity: 0,
          ease: 'power2.inOut',
          duration: 0.45,
        },
        0
      );

      // 30% to 100% Scroll Progress: Portal clip-path expands from inset(18% 12% 18% 12% round 20px) to inset(0% 0% 0% 0% round 0px)
      tl.fromTo(
        backdropEl,
        {
          clipPath: 'inset(18% 12% 18% 12% round 20px)',
          opacity: 0.25,
        },
        {
          clipPath: 'inset(0% 0% 0% 0% round 0px)',
          opacity: 0.96,
          ease: 'power2.inOut',
          duration: 0.7,
        },
        0.3
      );

      // 30% to 100% Scroll Progress: Live SOC Terminal Preview Card rises to center of viewport and scales from 0.9 to 1.0
      tl.fromTo(
        portalEl,
        {
          scale: 0.9,
          y: 0,
        },
        {
          scale: 1.0,
          y: () => {
            const h = headlineEl.offsetHeight || 220;
            return -Math.min(h * 0.62, 185);
          },
          ease: 'power2.inOut',
          duration: 0.7,
        },
        0.3
      );
    }, sectionEl);

    return () => ctx.revert();
  }, [is2D]);

  const filteredEvents =
    activeFilter === 'ALL'
      ? PORTAL_STREAM_EVENTS
      : PORTAL_STREAM_EVENTS.filter((e) => e.level === activeFilter);

  const selectedEvent =
    PORTAL_STREAM_EVENTS.find((e) => e.id === selectedRowId) || PORTAL_STREAM_EVENTS[0];

  const getLevelBadgeClass = (level) => {
    if (level === 'CRITICAL') {
      return 'bg-[var(--color-severity-critical-bg)] text-[var(--color-severity-critical)] border-[var(--color-severity-critical-border)]';
    }
    if (level === 'HIGH') {
      return 'bg-[var(--color-severity-high-bg)] text-[var(--color-severity-high)] border-[var(--color-severity-high-border)]';
    }
    if (level === 'MEDIUM') {
      return 'bg-[var(--color-severity-medium-bg)] text-[var(--color-severity-medium)] border-[var(--color-severity-medium-border)]';
    }
    return 'bg-[var(--color-severity-low-bg)] text-[var(--color-severity-low)] border-[var(--color-severity-low-border)]';
  };

  return (
    <section
      ref={sectionRef}
      id="pipeline"
      className="relative w-full min-h-screen bg-gradient-to-b from-[var(--color-chapter1-from)] via-[var(--color-chapter1-via)] to-[var(--color-chapter1-to)] overflow-hidden flex flex-col justify-between pt-20 pb-12 border-b border-border-muted"
    >
      {/* Structural 4-Column Grid Spine */}
      <StructuralGridSpine variant={colors.isSage ? 'light' : 'dark'} />

      {/* Interactive 3D WebGL Data-Stream Tunnel Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {hasWebGL && !is2D ? (
          <Canvas
            camera={{ position: [0, 0, 6.4], fov: 52 }}
            dpr={[1, 1.75]}
            gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          >
            <DataStreamTunnel3D
              colors={colors}
              mouseRef={mouseRef}
              progressRef={progressRef}
            />
          </Canvas>
        ) : (
          <div className="w-full h-full bg-[radial-gradient(circle_at_50%_35%,var(--color-border-glow),transparent_65%)] opacity-60" />
        )}
      </div>

      {/* Full-Viewport Expanding Portal Backdrop (clip-path: inset(18% 12% 18% 12% round 20px) -> inset(0% 0% 0% 0% round 0px)) */}
      <div
        ref={portalBackdropRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[5] bg-surface-lowest/90 border border-primary/30 shadow-[inset_0_0_80px_var(--color-border-glow)] backdrop-blur-xl will-change-[clip-path,opacity]"
      />

      {/* Main Hero Container */}
      <div
        id="hero-pin-wrapper"
        className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-8 flex-1 flex flex-col justify-between gap-4"
      >
        {/* Top Hero Headline Stage (Scales down to 0.82, y: -60, blur: 10px & fades out from 0% to 45% scroll) */}
        <div
          ref={headlineWrapRef}
          className="w-full pt-1 md:pt-2 flex flex-col items-center text-center gap-3 will-change-transform"
        >
          {/* Eyebrow Pill Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-surface-lowest/90 border border-primary/35 shadow-[0_0_24px_var(--color-border-glow)] backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-primary">
              CHAPTER 01 // REAL-TIME LOG INTELLIGENCE ENGINE
            </span>
          </div>

          {/* Oversized Masked Display Headline */}
          <MaskedRevealText
            as="h1"
            text="RAW SERVER LOGS TO EXPLAINED AI VERDICTS IN <10MS"
            accentWords={['EXPLAINED', 'AI', 'VERDICTS', '<10MS']}
            disabled={is2D}
            className="font-display font-black text-3xl sm:text-4xl lg:text-5xl xl:text-[54px] text-text-primary tracking-tight leading-[1.05] max-w-5xl uppercase"
          />

          <p className="font-sans text-xs sm:text-sm md:text-base text-text-muted max-w-2xl leading-relaxed">
            Ingest high-velocity Syslog, ASA, FortiGate, Suricata, and Auth streams. Normalize into canonical{' '}
            <span className="font-mono font-bold text-primary">OCSF v1.1</span>, seal with{' '}
            <span className="font-mono font-bold text-secondary">SHA-256 Merkle proofs</span>, and surface explainable MITRE ATT&amp;CK verdicts.
          </p>

          {/* Primary & Secondary Stripe-Style Morphing CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-0.5">
            <StripeCtaButton to="/dashboard" variant="primary" cursorLabel="LAUNCH">
              Launch Live SOC Dashboard
            </StripeCtaButton>
            <StripeCtaButton href="#demo" variant="secondary" cursorLabel="DISSECT">
              Analyze Server Logs
            </StripeCtaButton>
          </div>
        </div>

        {/* Live log_ai SOC Terminal Portal Card (Rises to center & scales 0.9 -> 1.0 as portal expands) */}
        <div
          ref={portalFrameRef}
          className="w-full rounded-3xl bg-surface-lowest/95 border-2 border-primary/40 shadow-[0_24px_80px_rgba(0,0,0,0.55),0_0_40px_var(--color-border-glow)] backdrop-blur-2xl flex flex-col justify-between overflow-hidden will-change-transform"
        >
          {/* Portal Top Window Chrome */}
          <div className="px-4 sm:px-6 py-2.5 bg-surface-dim/95 border-b border-border-muted flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-severity-high)]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-severity-medium)]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-severity-low)]" />
              </div>
              <span className="text-text-dim">|</span>
              <span className="font-bold text-primary tracking-wider uppercase">
                LOG_AI // LIVE SOC TELEMETRY PORTAL
              </span>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[var(--color-status-info-bg)] text-[var(--color-status-info)] border border-[var(--color-status-info-border)] text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-status-info)] animate-pulse" />
                PORTAL SYNC: {portalProgressPct}%
              </span>
            </div>

            {/* Interactive Severity Filter Pills inside the Portal */}
            <div className="flex flex-wrap items-center gap-1.5">
              {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  data-filter-pill
                  onClick={() => setActiveFilter(lvl)}
                  className={`px-2.5 py-1 rounded-md font-mono text-[10px] font-bold transition-all cursor-pointer border ${
                    activeFilter === lvl
                      ? 'bg-primary text-surface-dim border-primary shadow-[0_0_12px_var(--color-border-glow)]'
                      : 'bg-surface border-border-muted text-text-muted hover:text-text-primary hover:border-primary/40'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Portal Center Split: Live Ingest Stream Table + Real-Time AI Neural Verdict Inspector */}
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-border-muted">
            {/* Left 7 Columns: Live Streaming Telemetry Rows */}
            <div className="lg:col-span-7 p-4 sm:p-5 flex flex-col justify-between gap-2.5 min-w-0">
              <div className="flex items-center justify-between gap-2 font-mono text-[11px] text-text-dim pb-1.5 border-b border-border-muted/60">
                <span className="truncate">INBOUND SERVER LOG CONDUIT (UDP/5144 &amp; HTTP/8000)</span>
                <span className="text-primary font-bold shrink-0">
                  {totalIngested.toLocaleString()} EVENTS INDEXED
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {filteredEvents.map((evt) => {
                  const isSelected = evt.id === selectedEvent.id;
                  return (
                    <button
                      key={evt.id}
                      type="button"
                      onClick={() => setSelectedRowId(evt.id)}
                      className={`w-full text-left p-2.5 rounded-xl border font-mono text-xs transition-all flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 cursor-pointer ${
                        isSelected
                          ? 'bg-surface-bright border-primary shadow-[0_0_18px_var(--color-border-glow)]'
                          : 'bg-surface-dim/80 border-border-muted hover:border-primary/40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-[10px] text-text-dim shrink-0">{evt.ts}</span>
                        <span className="px-2 py-0.5 rounded bg-surface border border-border-muted text-[10px] text-primary font-bold shrink-0">
                          {evt.vendor}
                        </span>
                        <span className="text-text-primary font-bold truncate">
                          {evt.src} &rarr; {evt.dst}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-auto">
                        <span className="text-[10px] text-secondary font-bold hidden xl:inline">
                          {evt.verdict}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getLevelBadgeClass(
                            evt.level
                          )}`}
                        >
                          {evt.level}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* 6-Stage Pipeline Progress Strip */}
              <div className="pt-2 border-t border-border-muted/60 grid grid-cols-3 sm:grid-cols-6 gap-1.5 font-mono text-[10px]">
                {[
                  '01 RAW INGEST',
                  '02 TOKENIZE',
                  '03 OCSF NORM',
                  '04 SHA-256 SEAL',
                  '05 ML ANOMALY',
                  '06 XAI VERDICT',
                ].map((stage, idx) => (
                  <div
                    key={stage}
                    className={`px-2 py-1 rounded border text-center truncate font-bold ${
                      idx % 2 === 0
                        ? 'bg-primary/10 border-primary/30 text-primary'
                        : 'bg-secondary/10 border-secondary/30 text-secondary'
                    }`}
                  >
                    {stage}
                  </div>
                ))}
              </div>
            </div>

            {/* Right 5 Columns: Selected Event OCSF + XAI Inspector */}
            <div className="lg:col-span-5 p-4 sm:p-5 bg-surface-dim/60 flex flex-col justify-between gap-3 font-mono text-xs min-w-0">
              <div className="flex items-center justify-between gap-2 border-b border-border-muted pb-2">
                <span className="text-[11px] font-bold text-text-primary uppercase tracking-wider truncate">
                  INSPECTED PACKET // {selectedEvent.id}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 ${getLevelBadgeClass(
                    selectedEvent.level
                  )}`}
                >
                  CONFIDENCE: {selectedEvent.confidence}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-lowest border border-border-muted space-y-2.5 text-[11px]">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-text-dim shrink-0">OCSF_CLASS:</span>
                  <span className="text-primary font-bold text-right truncate">{selectedEvent.ocsfClass}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-text-dim shrink-0">CLASSIFICATION:</span>
                  <span className="text-secondary font-bold text-right truncate">{selectedEvent.verdict}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-text-dim shrink-0">ENDPOINT_TUPLE:</span>
                  <span className="text-text-primary font-bold text-right truncate">{selectedEvent.src}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-text-dim shrink-0">MERKLE_SEAL:</span>
                  <span className="text-tertiary font-bold text-right truncate">{selectedEvent.hash}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <span className="text-[10px] text-text-dim">
                  SCROLL TO EXPAND PORTAL &amp; PIPELINE &darr;
                </span>
                <StripeCtaButton
                  to="/log-explorer"
                  variant="secondary"
                  className="!px-3.5 !py-1.5 !text-[10px]"
                  cursorLabel="EXPLORE"
                >
                  Open in Log Explorer
                </StripeCtaButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
