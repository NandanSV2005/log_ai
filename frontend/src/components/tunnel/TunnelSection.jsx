import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useScroll, useSpring } from 'motion/react';
import { TunnelCanvas } from './TunnelCanvas';
import { TunnelHUDOverlay } from './TunnelHUDOverlay';

function checkWebGLSupport() {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') ||
        canvas.getContext('experimental-webgl') ||
        canvas.getContext('webgl2'))
    );
  } catch {
    return false;
  }
}

function TunnelLoader() {
  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-surface-dim text-text-primary gap-4 p-6">
      <div className="relative w-16 h-16 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping"></div>
        <div className="w-12 h-12 rounded-full border-2 border-t-primary border-r-secondary border-b-tertiary border-l-transparent animate-spin"></div>
        <span className="material-symbols-outlined text-primary text-xl">view_in_ar</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <span className="font-mono text-xs font-bold text-primary tracking-widest uppercase">
          INITIALIZING ULPF 3D TUNNEL
        </span>
        <span className="font-mono text-[11px] text-text-muted">
          Loading WebGL corridor &amp; shader pipeline...
        </span>
      </div>
    </div>
  );
}

export function TunnelSection({
  stats = {},
  fallback2D = null
}) {
  const containerRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [webglSupported, setWebglSupported] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // 1. WebGL Support check
    const hasWebGL = checkWebGLSupport();
    setWebglSupported(hasWebGL);

    // 2. Reduced motion check
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(motionQuery.matches);
    const handleMotionChange = (e) => setReducedMotion(e.matches);
    motionQuery.addEventListener('change', handleMotionChange);

    // 3. Mobile viewport check
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);

    setIsInitialized(true);

    return () => {
      motionQuery.removeEventListener('change', handleMotionChange);
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Framer Motion useScroll tied to container smoothed via spring interpolation
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end']
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 45,
    damping: 20,
    mass: 0.8,
    restDelta: 0.0005
  });

  useEffect(() => {
    const unsubscribe = smoothProgress.on('change', (latest) => {
      setProgress(Math.max(0, Math.min(1, latest)));
    });
    return () => unsubscribe();
  }, [smoothProgress]);

  // Jump to specific checkpoint stage
  const handleJumpToStage = (stageIdx) => {
    if (!containerRef.current) return;
    const stageTargets = [0.05, 0.22, 0.41, 0.60, 0.79, 0.96];
    const targetFraction = stageTargets[stageIdx] || 0;
    const containerTop = containerRef.current.offsetTop;
    const containerHeight = containerRef.current.offsetHeight - window.innerHeight;
    const targetScroll = containerTop + containerHeight * targetFraction;

    window.scrollTo({
      top: targetScroll,
      behavior: 'smooth'
    });
  };

  // Jump directly past tunnel into Chapter 02 (Sources)
  const handleSkipToSources = () => {
    const sourcesEl = document.getElementById('sources');
    if (sourcesEl) {
      sourcesEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Fallback 1: WebGL not supported
  if (isInitialized && !webglSupported) {
    return (
      <div className="w-full relative">
        <div className="bg-surface-lowest/90 border-b border-border-muted p-3 text-center font-mono text-xs text-text-muted">
          WebGL acceleration unavailable on this device &mdash; showing standard pipeline diagram.
        </div>
        {fallback2D}
      </div>
    );
  }

  // Fallback 2: prefers-reduced-motion
  if (isInitialized && reducedMotion) {
    return (
      <div className="w-full relative">
        <div className="bg-surface-lowest/90 border-b border-border-muted p-3 text-center font-mono text-xs text-text-muted">
          Reduced motion enabled &mdash; showing static pipeline architecture.
        </div>
        {fallback2D}
      </div>
    );
  }

  return (
    <section
      ref={containerRef}
      id="pipeline-tunnel"
      className="relative w-full h-[450vh] bg-surface-lowest"
    >
      {/* Sticky Fullscreen 3D Viewport */}
      <div className="sticky top-0 w-full h-screen overflow-hidden">
        <Suspense fallback={<TunnelLoader />}>
          <TunnelCanvas progress={progress} isMobile={isMobile} />
        </Suspense>

        {/* Smooth Settle/Fade Overlay into Chapter 02 at the tail of the tunnel */}
        <div
          className="absolute inset-0 bg-surface-lowest pointer-events-none transition-opacity duration-300 z-10"
          style={{
            opacity: Math.max(0, Math.min(1, (progress - 0.93) / 0.07))
          }}
        />

        <TunnelHUDOverlay
          progress={progress}
          stats={stats}
          onJumpToStage={handleJumpToStage}
          onSkipToSources={handleSkipToSources}
        />
      </div>
    </section>
  );
}
