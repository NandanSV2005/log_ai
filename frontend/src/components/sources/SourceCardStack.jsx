import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useSpring } from 'motion/react';
import { SpotlightCard } from '../motion-primitives';

export function SourceCardStack({ cards = [] }) {
  const containerRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Monitor prefers-reduced-motion and mobile viewport
  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(motionQuery.matches);
    const handleMotionChange = (e) => setReducedMotion(e.matches);
    motionQuery.addEventListener('change', handleMotionChange);

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      motionQuery.removeEventListener('change', handleMotionChange);
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Framer Motion useScroll tied to container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end']
  });

  // Smooth spring for fluid swish feel
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 160,
    damping: 24,
    restDelta: 0.001
  });

  useEffect(() => {
    const unsubscribe = smoothProgress.on('change', (val) => {
      setProgress(Math.max(0, Math.min(1, val)));
    });
    return () => unsubscribe();
  }, [smoothProgress]);

  const numCards = cards.length;
  // Calculate active index (0 to 5)
  const activeFraction = progress * (numCards - 1);
  const activeIndex = Math.min(numCards - 1, Math.max(0, Math.round(activeFraction)));

  // Click-to-jump to specific card
  const handleJumpToCard = (cardIdx) => {
    if (!containerRef.current) return;
    const targetFraction = cardIdx / (numCards - 1);
    const containerTop = containerRef.current.offsetTop;
    const containerHeight = containerRef.current.offsetHeight - window.innerHeight;
    const targetScroll = containerTop + containerHeight * targetFraction;

    window.scrollTo({
      top: targetScroll,
      behavior: 'smooth'
    });
  };

  // Keyboard accessibility: tab focus scrolls card into view
  const handleCardFocus = (cardIdx) => {
    handleJumpToCard(cardIdx);
  };

  // ===========================================================================
  // FALLBACK 1: prefers-reduced-motion (Clean static responsive grid)
  // ===========================================================================
  if (reducedMotion) {
    return (
      <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 py-6">
        <div className="p-3 rounded-xl bg-surface/80 border border-border-muted text-center font-mono text-xs text-text-muted">
          Reduced motion enabled &mdash; displaying parallel vendor source conduits.
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {cards.map((card) => (
            <SpotlightCard
              key={card.id}
              spotlightColor="rgba(123, 208, 255, 0.15)"
              className="p-5 rounded-2xl bg-surface/90 border border-border-muted shadow-lg"
            >
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-border-muted font-mono text-[11px] text-secondary font-bold">
                <span>{card.badge}</span>
                <span className="text-tertiary">Connected</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary/15 flex items-center justify-center text-secondary shrink-0">
                  <span className="material-symbols-outlined text-[22px]">{card.icon}</span>
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-text-primary">{card.title}</h3>
                  <p className="font-sans text-xs text-text-muted mt-1">{card.desc}</p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-border-muted/60 font-mono text-[10px] text-text-dim flex justify-between">
                <span className="text-secondary font-bold">{card.footer}</span>
                <span>OCSF COMPLIANT</span>
              </div>
            </SpotlightCard>
          ))}
        </div>
      </div>
    );
  }

  // ===========================================================================
  // FALLBACK 2: Mobile Viewport (Touch-friendly interactive carousel/tabs)
  // ===========================================================================
  if (isMobile) {
    const currentMobileCard = cards[activeIndex] || cards[0];
    return (
      <div className="w-full flex flex-col gap-6 py-4">
        {/* Mobile Vendor Quick Selector Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none px-1">
          {cards.map((card, idx) => (
            <button
              key={card.id}
              onClick={() => handleJumpToCard(idx)}
              className={`px-3 py-1.5 rounded-lg font-mono text-xs whitespace-nowrap transition-all border ${
                idx === activeIndex
                  ? 'bg-secondary/20 border-secondary text-secondary font-bold shadow-md'
                  : 'bg-surface border-border-muted text-text-muted'
              }`}
            >
              {card.title.split('/')[0].trim()}
            </button>
          ))}
        </div>

        {/* Focused Card Display */}
        <SpotlightCard
          spotlightColor="rgba(123, 208, 255, 0.18)"
          className="w-full p-5 rounded-2xl bg-surface-lowest/95 border-2 border-secondary shadow-2xl backdrop-blur-xl flex flex-col gap-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-border-muted font-mono text-xs">
            <div className="flex items-center gap-2 text-secondary font-bold">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
              <span>{currentMobileCard.badge}</span>
            </div>
            <span className="text-tertiary font-bold text-[10px] uppercase">
              ACTIVE CONDUIT
            </span>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-secondary/15 border border-secondary/30 flex items-center justify-center text-secondary shrink-0">
              <span className="material-symbols-outlined text-[26px]">{currentMobileCard.icon}</span>
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="font-display font-black text-lg text-text-primary leading-tight">
                {currentMobileCard.title}
              </h3>
              <p className="font-sans text-xs text-text-muted leading-relaxed">
                {currentMobileCard.desc}
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-border-muted flex items-center justify-between font-mono text-[10px] text-text-dim">
            <span className="text-secondary font-bold">{currentMobileCard.footer}</span>
            <span className="text-tertiary">OCSF COMPLIANT</span>
          </div>
        </SpotlightCard>

        {/* Converging Schema Callout */}
        <div className="w-full p-3 bg-surface-bright/90 border border-secondary/40 rounded-xl text-center font-mono text-xs text-secondary font-bold flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-[18px]">schema</span>
          <span>ALL SOURCES CONVERGE &rarr; OCSF CANONICAL SCHEMA</span>
        </div>
      </div>
    );
  }

  // ===========================================================================
  // DESKTOP PINNED SCROLL-DRIVEN 3D CARD STACK
  // ===========================================================================
  return (
    <div
      ref={containerRef}
      id="sources-pinned-track"
      className="relative w-full h-[360vh]"
    >
      {/* Pinned Viewport Container */}
      <div className="sticky top-0 w-full h-screen overflow-hidden flex flex-col justify-between py-16 px-4 md:px-8 xl:px-14 pointer-events-none">
        
        {/* Top Floating Context Header */}
        <div className="w-full max-w-5xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-4 pointer-events-auto z-20">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-secondary uppercase tracking-widest">CHAPTER 02</span>
              <span className="text-text-dim font-mono">//</span>
              <span className="font-mono text-xs text-text-dim font-semibold tracking-wider">INGESTION_ECOSYSTEM</span>
            </div>
            <h2 className="font-display font-black text-2xl md:text-3xl text-text-primary uppercase tracking-tight">
              Multi-Vendor Log Sources
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-surface-lowest/90 border border-secondary/40 backdrop-blur-md shadow-lg font-mono text-[11px]">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
              <span className="font-bold text-secondary tracking-wider uppercase">
                PARALLEL INGESTION CONDUITS
              </span>
              <span className="text-text-dim">|</span>
              <span className="text-text-muted">6 VENDORS</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 font-mono text-xs text-text-dim bg-surface-lowest/80 px-2.5 py-1.5 rounded-full border border-border-muted">
              <span>CYCLE:</span>
              <span className="text-secondary font-bold">{Math.round(progress * 100)}%</span>
            </div>
          </div>
        </div>

        {/* Central 3D Perspective Stage */}
        <div
          className="relative w-full max-w-2xl h-[380px] mx-auto my-auto flex items-center justify-center pointer-events-auto"
          style={{
            perspective: '1200px',
            transformStyle: 'preserve-3d'
          }}
          role="region"
          aria-label="Multi-Vendor Log Sources 3D Card Stack"
        >
          {cards.map((card, idx) => {
            // Delta offset: 0 = center focus, >0 = animating out, <0 = incoming
            const delta = activeFraction - idx;
            const isCurrent = Math.abs(delta) < 0.45;

            // 3D Transforms based on delta:
            let translateY = 0;
            let translateZ = 0;
            let scale = 1;
            let opacity = 0;
            let rotateX = 0;
            let rotateY = 0;
            let zIndex = 1;
            let isVisible = Math.abs(delta) <= 1.4;

            if (delta >= 0) {
              // Animating OUT (moves back in Z, slightly upward, scales down, fades)
              const d = Math.min(delta, 1.4);
              translateZ = -140 * d;
              translateY = -55 * d;
              scale = Math.max(0.82, 1 - 0.14 * d);
              rotateX = 6 * d;
              opacity = Math.max(0, 1 - d * 1.5);
              zIndex = Math.round(10 - d * 5);
            } else {
              // Incoming from behind (starts deep in Z, slightly lower, scales up)
              const d = Math.min(Math.abs(delta), 1.4);
              translateZ = -220 * d;
              translateY = 55 * d;
              scale = Math.max(0.78, 1 - 0.18 * d);
              rotateY = -3.5 * d;
              rotateX = -2 * d;
              opacity = Math.max(0, 1 - d * 1.35);
              zIndex = Math.round(10 - d * 3);
            }

            return (
              <motion.div
                key={card.id}
                tabIndex={0}
                onFocus={() => handleCardFocus(idx)}
                aria-current={isCurrent ? 'true' : 'false'}
                className="absolute w-full max-w-xl cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded-2xl"
                style={{
                  transform: `translate3d(0px, ${translateY}px, ${translateZ}px) scale(${scale}) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
                  opacity: isVisible ? opacity : 0,
                  zIndex,
                  pointerEvents: isCurrent ? 'auto' : 'none',
                  transition: 'transform 0.1s ease-out, opacity 0.1s ease-out'
                }}
                onClick={() => handleJumpToCard(idx)}
              >
                {/* 3D Focal Card Body */}
                <SpotlightCard
                  spotlightColor="rgba(123, 208, 255, 0.22)"
                  className={`w-full p-6 md:p-8 rounded-2xl bg-surface-lowest/95 border-2 transition-all duration-300 shadow-2xl backdrop-blur-2xl ${
                    isCurrent
                      ? 'border-secondary shadow-[0_0_36px_var(--color-border-glow)]'
                      : 'border-border-muted/80 opacity-70'
                  }`}
                >
                  {/* Card Header: Source Badge & Live Signal Indicator */}
                  <div className="flex items-center justify-between pb-4 mb-4 border-b border-border-muted font-mono text-xs">
                    <div className="flex items-center gap-2.5 text-secondary font-bold tracking-wider">
                      <span className={`w-2.5 h-2.5 rounded-full ${isCurrent ? 'bg-secondary animate-ping' : 'bg-text-dim'}`} />
                      <span>{card.badge}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-tertiary/15 border border-tertiary/30 text-tertiary font-bold text-[10px]">
                        <span className="material-symbols-outlined text-[13px]">check_circle</span>
                        <span>PARALLEL CONDUIT</span>
                      </span>
                    </div>
                  </div>

                  {/* Card Core Content */}
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-secondary/15 border border-secondary/30 flex items-center justify-center text-secondary shrink-0 group-hover:scale-105 transition-transform shadow-inner">
                      <span className="material-symbols-outlined text-[32px]">{card.icon}</span>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <h3 className="font-display font-black text-xl md:text-2xl text-text-primary tracking-tight leading-tight">
                        {card.title}
                      </h3>
                      <p className="font-sans text-xs md:text-sm text-text-muted leading-relaxed font-normal">
                        {card.desc}
                      </p>
                    </div>
                  </div>

                  {/* Technical Metadata Strip */}
                  <div className="mt-6 pt-4 border-t border-border-muted/70 flex items-center justify-between font-mono text-[11px] text-text-dim">
                    <div className="flex items-center gap-2">
                      <span className="text-secondary font-bold">{card.footer}</span>
                    </div>
                    <span className="text-tertiary font-bold px-2 py-0.5 rounded bg-tertiary/10 border border-tertiary/20">
                      OCSF COMPLIANT
                    </span>
                  </div>
                </SpotlightCard>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom Floating Affordance & Vendor Scrubber */}
        <div className="w-full max-w-3xl mx-auto flex flex-col items-center gap-3 pointer-events-auto z-20">
          {/* Vendor Quick-Focus Scrubber Pills */}
          <div className="flex items-center gap-1.5 p-1.5 rounded-full bg-surface-lowest/90 border border-border-muted backdrop-blur-md shadow-xl" role="tablist" aria-label="Vendor Source Selector">
            {cards.map((card, idx) => {
              const isSelected = idx === activeIndex;
              const shortName = card.title.split('/')[0].trim();

              return (
                <button
                  key={card.id}
                  onClick={() => handleJumpToCard(idx)}
                  className={`px-3 py-1 rounded-full font-mono text-[11px] font-bold transition-all ${
                    isSelected
                      ? 'bg-secondary text-surface-dim shadow-[0_0_14px_rgba(123,208,255,0.6)] scale-105'
                      : 'text-text-dim hover:text-text-primary hover:bg-surface-hover'
                  }`}
                  role="tab"
                  aria-selected={isSelected}
                  title={`Focus on ${card.title}`}
                >
                  {shortName}
                </button>
              );
            })}
          </div>

          {/* Unified Schema Conduit Status & Scroll Cue */}
          <div className="flex items-center gap-3 font-mono text-xs text-text-dim">
            <span className="material-symbols-outlined text-[16px] text-secondary">schema</span>
            <span className="text-secondary font-bold">
              {activeIndex === numCards - 1
                ? 'Conduits unified into OCSF &rarr; Continue scrolling into Chapter 03 ↓'
                : 'Scroll down to swap focal log source conduit ↓'}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
