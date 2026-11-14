import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useThreeThemeColors } from '../tunnel/useThreeThemeColors';
import { checkWebGLSupport } from '../../utils/webgl';
import { MaskedRevealText, StripeCtaButton, StructuralGridSpine } from './LusionMotionEngine';

gsap.registerPlugin(ScrollTrigger);

/**
 * Interactive WebGL / GLSL Shader Particle Data-Stream & AI Neural Core.
 * Reacts to normalized cursor coordinates (uMouse) and scroll progress (uProgress).
 */
function NeuralParticleStream({ colors, mouseRef, progressRef }) {
  const pointsRef = useRef(null);
  const coreRef = useRef(null);
  const outerRingRef = useRef(null);

  const particleCount = 1400;

  const { positions, phases, speeds, colorWeights } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const ph = new Float32Array(particleCount);
    const sp = new Float32Array(particleCount);
    const cw = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 16;
      const radius = 0.8 + ((i * 73) % 100) * 0.055;
      const z = -14 + ((i * 37) % 100) * 0.24;
      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = Math.sin(angle) * radius * 0.65;
      pos[i * 3 + 2] = z;
      ph[i] = ((i * 19) % 100) * 0.0628;
      sp[i] = 0.4 + ((i * 41) % 100) * 0.012;
      cw[i] = (i % 3) / 2;
    }

    return { positions: pos, phases: ph, speeds: sp, colorWeights: cw };
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uProgress: { value: 0 },
      uColorPrimary: { value: colors.primary.clone() },
      uColorSecondary: { value: colors.secondary.clone() },
      uColorTertiary: { value: colors.tertiary.clone() },
    }),
    []
  );

  useEffect(() => {
    uniforms.uColorPrimary.value.copy(colors.primary);
    uniforms.uColorSecondary.value.copy(colors.secondary);
    uniforms.uColorTertiary.value.copy(colors.tertiary);
  }, [colors, uniforms]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    uniforms.uTime.value = t;
    uniforms.uMouse.value.lerp(
      new THREE.Vector2(mouseRef.current.x, mouseRef.current.y),
      0.08
    );
    uniforms.uProgress.value = progressRef.current;

    if (coreRef.current) {
      coreRef.current.rotation.y = t * 0.28 + uniforms.uMouse.value.x * 0.45;
      coreRef.current.rotation.x = t * 0.16 - uniforms.uMouse.value.y * 0.35;
      const s = 1 + Math.sin(t * 2.2) * 0.04 + progressRef.current * 0.35;
      coreRef.current.scale.setScalar(s);
    }

    if (outerRingRef.current) {
      outerRingRef.current.rotation.z = -t * 0.18;
      outerRingRef.current.rotation.x = Math.sin(t * 0.4) * 0.25 + uniforms.uMouse.value.y * 0.2;
    }
  });

  const vertexShader = `
    uniform float uTime;
    uniform vec2 uMouse;
    uniform float uProgress;
    attribute float aPhase;
    attribute float aSpeed;
    attribute float aColorWeight;
    varying float vColorWeight;
    varying float vAlpha;

    void main() {
      vColorWeight = aColorWeight;
      vec3 pos = position;

      // Stream forward along Z toward the AI neural core and wrap around
      float zFlow = mod(pos.z + uTime * (1.8 + aSpeed * 2.2) + 14.0, 24.0) - 14.0;
      pos.z = zFlow;

      // Swirl vortex tightening near z = 0 (AI Neural Core)
      float distToCore = abs(pos.z);
      float pinch = smoothstep(0.0, 9.0, distToCore);
      float swirlAngle = uTime * aSpeed * 0.55 + aPhase + (1.0 - pinch) * 2.2;
      float r = length(pos.xy) * (0.28 + 0.72 * pinch);

      pos.x = cos(swirlAngle) * r + uMouse.x * (1.4 - pinch * 0.8);
      pos.y = sin(swirlAngle) * r * 0.72 + uMouse.y * (1.1 - pinch * 0.6);

      // Expand outward slightly as portal opens
      pos.xy *= (1.0 + uProgress * 0.65);

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      gl_PointSize = clamp((16.0 / -mvPosition.z) * (1.0 + (1.0 - pinch) * 0.8), 1.5, 6.5);
      vAlpha = smoothstep(-14.0, -9.0, pos.z) * (1.0 - smoothstep(6.0, 10.0, pos.z));
    }
  `;

  const fragmentShader = `
    uniform vec3 uColorPrimary;
    uniform vec3 uColorSecondary;
    uniform vec3 uColorTertiary;
    varying float vColorWeight;
    varying float vAlpha;

    void main() {
      float d = length(gl_PointCoord - vec2(0.5));
      if (d > 0.5) discard;
      float glow = smoothstep(0.5, 0.05, d);
      vec3 col = mix(uColorPrimary, uColorSecondary, clamp(vColorWeight * 1.5, 0.0, 1.0));
      col = mix(col, uColorTertiary, clamp((vColorWeight - 0.5) * 2.0, 0.0, 1.0));
      gl_FragColor = vec4(col, glow * vAlpha * 0.88);
    }
  `;

  return (
    <group>
      {/* Flowing Server Log Particle Stream */}
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
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Central AI Neural Core Wireframe Icosahedron */}
      <mesh ref={coreRef} position={[0, 0, -1.5]}>
        <icosahedronGeometry args={[1.15, 2]} />
        <meshBasicMaterial
          color={colors.primary}
          wireframe
          transparent
          opacity={0.28}
        />
      </mesh>

      {/* Outer Orbital Telemetry Ring */}
      <mesh ref={outerRingRef} position={[0, 0, -1.8]}>
        <torusGeometry args={[2.1, 0.012, 16, 100]} />
        <meshBasicMaterial
          color={colors.secondary}
          transparent
          opacity={0.42}
        />
      </mesh>
    </group>
  );
}

const PORTAL_STREAM_EVENTS = [
  {
    id: 'SOC-9941',
    ts: '14:22:09.104',
    src: '185.220.101.5:54312',
    dst: '10.0.4.12:445',
    vendor: 'Cisco ASA',
    ocsfClass: 'Network Activity [4001]',
    verdict: 'SMB_LATERAL_PROBE',
    confidence: '99.4%',
    level: 'CRITICAL',
    hash: 'sha256:9f84c2...e17b',
  },
  {
    id: 'SOC-9942',
    ts: '14:22:09.382',
    src: '192.168.1.104:49112',
    dst: 'api.internal:443',
    vendor: 'Nginx WAF',
    ocsfClass: 'HTTP Activity [4002]',
    verdict: 'SQL_INJECTION_PAYLOAD',
    confidence: '99.1%',
    level: 'HIGH',
    hash: 'sha256:3a11d0...84c9',
  },
  {
    id: 'SOC-9943',
    ts: '14:22:09.710',
    src: '45.33.32.156:443',
    dst: '10.0.0.5:51234',
    vendor: 'Suricata EVE',
    ocsfClass: 'Security Finding [2001]',
    verdict: 'C2_BEACON_JITTER',
    confidence: '94.8%',
    level: 'MEDIUM',
    hash: 'sha256:7d92e8...b012',
  },
  {
    id: 'SOC-9944',
    ts: '14:22:10.015',
    src: '10.0.0.1:514',
    dst: 'siem.local:6514',
    vendor: 'pfSense Filter',
    ocsfClass: 'Authentication [3002]',
    verdict: 'AUTHORIZED_TLS_SYNC',
    confidence: '99.8%',
    level: 'LOW',
    hash: 'sha256:5c40a1...99f4',
  },
];

/**
 * Lusion Pinned Hero-to-SOC Portal Transition Component.
 * Pins the 100vh Hero Stage and scrubs:
 * 1) Headline scales down (scale: 0.86, opacity: 0, filter: blur(6px))
 * 2) Central Live log_ai SOC Terminal Preview expands from clip-path: inset(18% 14% 18% 14% round 24px)
 *    to clip-path: inset(0% 0% 0% 0% round 0px)
 */
export function LusionHeroPortal({ is2D = false, totalIngested = 48281 }) {
  const sectionRef = useRef(null);
  const headlineWrapRef = useRef(null);
  const portalFrameRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const progressRef = useRef(0);

  const [hasWebGL, setHasWebGL] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [selectedRowId, setSelectedRowId] = useState('SOC-9941');
  const [portalProgressPct, setPortalProgressPct] = useState(0);

  const colors = useThreeThemeColors();

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
    const portalEl = portalFrameRef.current;
    if (!sectionEl || !headlineEl || !portalEl) return undefined;

    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    if (is2D || reducedMotion || isMobile) {
      gsap.set(headlineEl, { scale: 1, opacity: 1, filter: 'blur(0px)' });
      gsap.set(portalEl, {
        clipPath: 'inset(0% 0% 0% 0% round 20px)',
        opacity: 1,
        y: 0,
      });
      progressRef.current = 1;
      setPortalProgressPct(100);
      return undefined;
    }

    const ctx = gsap.context(() => {
      gsap.set(portalEl, {
        clipPath: 'inset(18% 14% 18% 14% round 24px)',
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionEl,
          start: 'top top',
          end: '+=155%',
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          onUpdate: (self) => {
            progressRef.current = self.progress;
            setPortalProgressPct(Math.round(self.progress * 100));
          },
        },
      });

      tl.to(
        headlineEl,
        {
          scale: 0.86,
          opacity: 0,
          filter: 'blur(6px)',
          y: -36,
          ease: 'power2.inOut',
          duration: 0.52,
        },
        0
      );

      tl.fromTo(
        portalEl,
        {
          clipPath: 'inset(18% 14% 18% 14% round 24px)',
          scale: 0.94,
        },
        {
          clipPath: 'inset(0% 0% 0% 0% round 0px)',
          scale: 1,
          ease: 'power2.inOut',
          duration: 0.88,
        },
        0.08
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
      className="relative w-full min-h-screen bg-gradient-to-b from-[var(--color-chapter1-from)] via-[var(--color-chapter1-via)] to-[var(--color-chapter1-to)] overflow-hidden flex flex-col justify-between pt-20 pb-10 border-b border-border-muted"
    >
      {/* Structural 4-Column Grid Spine */}
      <StructuralGridSpine variant={colors.isSage ? 'light' : 'dark'} />

      {/* Interactive WebGL / Three.js Neural Particle Data-Stream Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {hasWebGL && !is2D ? (
          <Canvas
            camera={{ position: [0, 0, 6.2], fov: 50 }}
            dpr={[1, 1.75]}
            gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          >
            <NeuralParticleStream
              colors={colors}
              mouseRef={mouseRef}
              progressRef={progressRef}
            />
          </Canvas>
        ) : (
          <div className="w-full h-full bg-[radial-gradient(circle_at_50%_35%,var(--color-border-glow),transparent_65%)] opacity-60" />
        )}
      </div>

      {/* Main Hero Container */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-8 flex-1 flex flex-col justify-between gap-6">
        {/* Top Hero Headline Stage (Scales down & blurs out as Portal expands on scroll) */}
        <div
          ref={headlineWrapRef}
          className="w-full pt-4 md:pt-8 flex flex-col items-center text-center gap-5 will-change-transform"
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
            className="font-display font-black text-3xl sm:text-5xl lg:text-6xl xl:text-[64px] text-text-primary tracking-tight leading-[1.04] max-w-5xl uppercase"
          />

          <p className="font-sans text-sm sm:text-base md:text-lg text-text-muted max-w-2xl leading-relaxed">
            Ingest high-velocity Syslog, ASA, FortiGate, Suricata, and Auth streams. Normalize into canonical{' '}
            <span className="font-mono font-bold text-primary">OCSF v1.1</span>, seal with{' '}
            <span className="font-mono font-bold text-secondary">SHA-256 Merkle proofs</span>, and surface explainable MITRE ATT&amp;CK verdicts.
          </p>

          {/* Primary & Secondary Stripe-Style Morphing CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-1">
            <StripeCtaButton to="/dashboard" variant="primary" cursorLabel="LAUNCH">
              Launch Live SOC Dashboard
            </StripeCtaButton>
            <StripeCtaButton href="#demo" variant="secondary" cursorLabel="DISSECT">
              Analyze Server Logs
            </StripeCtaButton>
          </div>
        </div>

        {/* Expanding Glassmorphic Live log_ai SOC Terminal Portal */}
        <div
          ref={portalFrameRef}
          className="w-full flex-1 min-h-[370px] md:min-h-[430px] bg-surface-lowest/95 border border-primary/35 shadow-[0_24px_80px_rgba(0,0,0,0.55),0_0_40px_var(--color-border-glow)] backdrop-blur-2xl flex flex-col justify-between overflow-hidden will-change-[clip-path,transform]"
        >
          {/* Portal Top Window Chrome */}
          <div className="px-4 sm:px-6 py-3 bg-surface-dim/95 border-b border-border-muted flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
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
          <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 divide-y lg:divide-y-0 lg:divide-x divide-border-muted">
            {/* Left 7 Columns: Live Streaming Telemetry Rows */}
            <div className="lg:col-span-7 p-4 sm:p-5 flex flex-col justify-between gap-3 overflow-x-auto">
              <div className="flex items-center justify-between font-mono text-[11px] text-text-dim pb-1 border-b border-border-muted/60">
                <span>INBOUND SERVER LOG CONDUIT (UDP/5144 &amp; HTTP/8000)</span>
                <span className="text-primary font-bold">
                  {totalIngested.toLocaleString()} EVENTS INDEXED
                </span>
              </div>

              <div className="flex flex-col gap-2 my-auto">
                {filteredEvents.map((evt) => {
                  const isSelected = evt.id === selectedEvent.id;
                  return (
                    <button
                      key={evt.id}
                      type="button"
                      onClick={() => setSelectedRowId(evt.id)}
                      className={`w-full text-left p-2.5 sm:p-3 rounded-xl border font-mono text-xs transition-all flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 cursor-pointer ${
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
            <div className="lg:col-span-5 p-4 sm:p-5 bg-surface-dim/60 flex flex-col justify-between gap-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-border-muted pb-2">
                <span className="text-[11px] font-bold text-text-primary uppercase tracking-wider">
                  INSPECTED PACKET // {selectedEvent.id}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getLevelBadgeClass(
                    selectedEvent.level
                  )}`}
                >
                  CONFIDENCE: {selectedEvent.confidence}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-surface-lowest border border-border-muted space-y-2 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-text-dim">OCSF_CLASS:</span>
                  <span className="text-primary font-bold">{selectedEvent.ocsfClass}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-dim">CLASSIFICATION:</span>
                  <span className="text-secondary font-bold">{selectedEvent.verdict}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-dim">ENDPOINT_TUPLE:</span>
                  <span className="text-text-primary font-bold">{selectedEvent.src}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-dim">MERKLE_SEAL:</span>
                  <span className="text-tertiary font-bold">{selectedEvent.hash}</span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
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
