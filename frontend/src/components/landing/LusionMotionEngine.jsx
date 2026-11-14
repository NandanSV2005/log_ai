import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

/**
 * Shared live motion state readable by WebGL shaders (scroll-velocity warp)
 * and interactive stage pills (lenis.scrollTo).
 */
export const lusionMotionState = {
  velocity: 0,
  lenis: null,
};

/**
 * Global Lenis + GSAP ScrollTrigger Synchronizer & Velocity Skew Controller.
 * - Initializes Lenis (lerp: 0.075, duration: 1.2, smoothWheel: true)
 * - Syncs with ScrollTrigger.update and gsap.ticker (lagSmoothing(0))
 * - Calls ScrollTrigger.refresh() after layout and font load
 * - Applies velocity-proportional skewY (-3.5deg to 3.5deg) and scaleY (up to 1.04)
 *   to [data-velocity-skew] blocks via gsap.quickTo (duration: 0.25, ease: "power3.out")
 */
export function useLusionScrollEngine(disabled = false) {
  const lenisRef = useRef(null);

  useEffect(() => {
    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (disabled || reducedMotion) {
      lusionMotionState.velocity = 0;
      lusionMotionState.lenis = null;
      ScrollTrigger.refresh();
      return undefined;
    }

    const lenis = new Lenis({
      lerp: 0.075,
      duration: 1.2,
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.5,
    });
    lenisRef.current = lenis;
    lusionMotionState.lenis = lenis;

    // Cache gsap.quickTo setters per [data-velocity-skew] element
    const quickToMap = new WeakMap();
    const getQuickSetters = (el) => {
      let setters = quickToMap.get(el);
      if (!setters) {
        gsap.set(el, { transformOrigin: 'center center' });
        setters = {
          skewY: gsap.quickTo(el, 'skewY', { duration: 0.25, ease: 'power3.out' }),
          scaleY: gsap.quickTo(el, 'scaleY', { duration: 0.25, ease: 'power3.out' }),
        };
        quickToMap.set(el, setters);
      }
      return setters;
    };

    const getSkewTargets = () =>
      Array.from(document.querySelectorAll('[data-velocity-skew]'));

    let resetTimer = null;

    const applySkewAndStretch = (skewDeg, stretchY) => {
      const targets = getSkewTargets();
      for (let i = 0; i < targets.length; i++) {
        const setters = getQuickSetters(targets[i]);
        setters.skewY(skewDeg);
        setters.scaleY(stretchY);
      }
    };

    const onLenisScroll = (e) => {
      ScrollTrigger.update();
      const velocity = e?.velocity || 0;
      lusionMotionState.velocity = velocity;

      const clampedSkew = Math.max(-3.5, Math.min(3.5, velocity * 0.11));
      const stretchY = 1 + Math.min(Math.abs(velocity) * 0.0015, 0.04);
      applySkewAndStretch(clampedSkew, stretchY);

      if (resetTimer) clearTimeout(resetTimer);
      resetTimer = setTimeout(() => {
        lusionMotionState.velocity = 0;
        applySkewAndStretch(0, 1);
      }, 95);
    };

    lenis.on('scroll', onLenisScroll);

    const tickerCallback = (time) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(tickerCallback);
    gsap.ticker.lagSmoothing(0);

    // Refresh ScrollTrigger after initial layout and after web fonts finish loading
    const refreshTimeout = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 180);

    if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        ScrollTrigger.refresh();
      });
    }

    return () => {
      if (resetTimer) clearTimeout(resetTimer);
      clearTimeout(refreshTimeout);
      gsap.ticker.remove(tickerCallback);
      lenis.destroy();
      lenisRef.current = null;
      lusionMotionState.lenis = null;
      lusionMotionState.velocity = 0;
      const targets = getSkewTargets();
      targets.forEach((el) => {
        gsap.set(el, { clearProps: 'transform' });
      });
    };
  }, [disabled]);

  return lenisRef;
}

/**
 * Dual-Layer Magnetic Cursor (Smooth trailing outer ring lerp: 0.15 + instant inner dot).
 * Magnetically snaps to primary CTAs, stage pills, and filter buttons, shifting the target
 * by (clientX - centerX) * 0.28 and snapping back with elastic.out(1, 0.4) on mouseleave.
 */
export function MagneticCursor({ disabled = false }) {
  const outerRef = useRef(null);
  const innerRef = useRef(null);
  const [isHoveringInteractive, setIsHoveringInteractive] = useState(false);
  const [hoverLabel, setHoverLabel] = useState('');
  const [hasFinePointer, setHasFinePointer] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const fine = window.matchMedia('(pointer: fine)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!fine || reduced || disabled) {
      setHasFinePointer(false);
      return undefined;
    }
    setHasFinePointer(true);

    const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const ring = { x: pos.x, y: pos.y };
    let activeMagneticEl = null;
    let rafId = null;

    const releaseMagneticTarget = (el) => {
      if (!el) return;
      gsap.to(el, {
        x: 0,
        y: 0,
        duration: 0.65,
        ease: 'elastic.out(1, 0.4)',
        overwrite: 'auto',
      });
    };

    const handleMouseMove = (e) => {
      pos.x = e.clientX;
      pos.y = e.clientY;

      if (innerRef.current) {
        innerRef.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%)`;
      }

      const target = e.target?.closest?.(
        '[data-magnetic], [role="tab"], [data-filter-pill], button, a, input[type="range"]'
      );

      if (target) {
        setIsHoveringInteractive(true);
        setHoverLabel(target.getAttribute('data-cursor-label') || '');

        const isMagneticTarget =
          target.hasAttribute('data-magnetic') ||
          target.getAttribute('role') === 'tab' ||
          target.hasAttribute('data-filter-pill');

        if (isMagneticTarget) {
          if (activeMagneticEl && activeMagneticEl !== target) {
            releaseMagneticTarget(activeMagneticEl);
          }
          activeMagneticEl = target;
          const rect = target.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          const dx = (e.clientX - cx) * 0.28;
          const dy = (e.clientY - cy) * 0.28;
          gsap.to(target, {
            x: dx,
            y: dy,
            duration: 0.2,
            ease: 'power2.out',
            overwrite: 'auto',
          });
        } else if (activeMagneticEl) {
          releaseMagneticTarget(activeMagneticEl);
          activeMagneticEl = null;
        }
      } else {
        if (activeMagneticEl) {
          releaseMagneticTarget(activeMagneticEl);
          activeMagneticEl = null;
        }
        setIsHoveringInteractive(false);
        setHoverLabel('');
      }
    };

    const handleMouseOut = (e) => {
      if (!e.relatedTarget && activeMagneticEl) {
        releaseMagneticTarget(activeMagneticEl);
        activeMagneticEl = null;
      }
    };

    const animateRing = () => {
      ring.x += (pos.x - ring.x) * 0.15;
      ring.y += (pos.y - ring.y) * 0.15;
      if (outerRef.current) {
        outerRef.current.style.transform = `translate3d(${ring.x.toFixed(1)}px, ${ring.y.toFixed(1)}px, 0) translate(-50%, -50%) scale(${
          isHoveringInteractive ? 1.55 : 1
        })`;
      }
      rafId = requestAnimationFrame(animateRing);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseout', handleMouseOut, { passive: true });
    rafId = requestAnimationFrame(animateRing);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseout', handleMouseOut);
      if (rafId) cancelAnimationFrame(rafId);
      if (activeMagneticEl) releaseMagneticTarget(activeMagneticEl);
    };
  }, [disabled, isHoveringInteractive]);

  if (!hasFinePointer || disabled) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden hidden lg:block" aria-hidden="true">
      <div
        ref={outerRef}
        className={`fixed top-0 left-0 w-9 h-9 rounded-full border transition-colors duration-200 flex items-center justify-center will-change-transform ${
          isHoveringInteractive
            ? 'border-primary bg-primary/10 shadow-[0_0_20px_var(--color-border-glow)]'
            : 'border-primary/45 bg-transparent'
        }`}
      >
        {hoverLabel && (
          <span className="font-mono text-[7px] font-bold uppercase tracking-widest text-primary whitespace-nowrap">
            {hoverLabel}
          </span>
        )}
      </div>
      <div
        ref={innerRef}
        className={`fixed top-0 left-0 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--color-border-glow)] will-change-transform transition-opacity duration-150 ${
          hoverLabel ? 'opacity-0' : 'opacity-100'
        }`}
      />
    </div>
  );
}

/**
 * Masked Choreographed Typography Reveals (Lusion Signature)
 * Splits text into words wrapped in <span class="overflow-hidden inline-block">
 * and animates inner spans from yPercent: 115, rotateZ: 3deg, opacity: 0 -> 0
 * with power4.out (duration: 1.0, stagger: 0.05) at top 85% viewport entry.
 */
export function MaskedRevealText({
  text,
  as: Tag = 'h2',
  className = '',
  accentWords = [],
  accentClassName = 'bg-gradient-to-r from-primary via-secondary to-tertiary bg-clip-text text-transparent',
  delay = 0,
  disabled = false,
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;

    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const words = el.querySelectorAll('[data-reveal-word]');
    if (!words.length) return undefined;

    if (disabled || reducedMotion) {
      gsap.set(words, { yPercent: 0, rotateZ: 0, opacity: 1 });
      return undefined;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        words,
        {
          yPercent: 115,
          rotateZ: 3,
          opacity: 0,
        },
        {
          yPercent: 0,
          rotateZ: 0,
          opacity: 1,
          duration: 1.0,
          stagger: 0.05,
          delay,
          ease: 'power4.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }, el);

    return () => ctx.revert();
  }, [text, delay, disabled]);

  const tokens = String(text || '').split(' ');
  const normalizedAccents = accentWords.map((w) => w.toLowerCase());

  return (
    <Tag ref={containerRef} className={className} aria-label={text}>
      {tokens.map((word, idx) => {
        const clean = word.replace(/[^a-zA-Z0-9/<>-]/g, '').toLowerCase();
        const isAccent =
          normalizedAccents.includes(clean) ||
          normalizedAccents.includes(word.toLowerCase());
        return (
          <span
            key={`${word}-${idx}`}
            className="overflow-hidden inline-block align-bottom mr-[0.26em] pb-[0.06em]"
          >
            <span
              data-reveal-word
              className={`inline-block will-change-transform origin-bottom-left ${
                isAccent ? accentClassName : ''
              }`}
            >
              {word}
            </span>
          </span>
        );
      })}
    </Tag>
  );
}

/**
 * Stripe Structural 4-Column Vertical Grid Spine
 * Renders a subtle 1px structural outer border with 4 vertical column guides inside max-w-7xl.
 * When variant="obsidian" (used in Chapter 02 & Chapter 04), renders crisp 1px solid rgba(245, 158, 11, 0.14) grid lines.
 */
export function StructuralGridSpine({ variant = 'dark', obsidian = false }) {
  const isObsidian = obsidian || variant === 'obsidian';
  const lineClass =
    variant === 'light'
      ? 'border-[rgba(15,23,42,0.08)]'
      : isObsidian
        ? 'border-[rgba(245,158,11,0.14)]'
        : 'border-[rgba(255,255,255,0.06)]';
  const dividerStyle = isObsidian && variant !== 'light'
    ? { borderColor: 'rgba(245, 158, 11, 0.14)' }
    : undefined;

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden z-0 flex justify-center px-4 md:px-8"
      aria-hidden="true"
    >
      <div
        style={dividerStyle}
        className={`w-full max-w-7xl h-full grid grid-cols-2 md:grid-cols-4 border-x ${lineClass}`}
      >
        <div
          style={dividerStyle}
          className={`h-full border-r ${isObsidian ? 'border-solid' : 'border-dashed'} ${lineClass}`}
        />
        <div
          style={dividerStyle}
          className={`h-full border-r ${isObsidian ? 'border-solid' : 'border-dashed'} hidden md:block ${lineClass}`}
        />
        <div
          style={dividerStyle}
          className={`h-full border-r ${isObsidian ? 'border-solid' : 'border-dashed'} hidden md:block ${lineClass}`}
        />
        <div className="h-full" />
      </div>
    </div>
  );
}

/**
 * Stripe-Style Diagonal Section Divider (transform: skewY(-3.5deg) background separator layer)
 * Used between Chapter 01 -> Chapter 02 and Chapter 03 -> Chapter 04 for crisp architectural separation.
 */
export function StripeDiagonalDivider({ label = '', variant = 'dark' }) {
  const isLight = variant === 'light';
  return (
    <div
      aria-hidden="true"
      className="relative w-full h-16 md:h-20 overflow-hidden pointer-events-none select-none section-obsidian-contrast"
    >
      <StructuralGridSpine variant={isLight ? 'light' : 'obsidian'} obsidian={!isLight} />
      <div
        className="absolute inset-x-[-6%] top-2 bottom-2 border-y shadow-[0_0_50px_var(--color-border-glow)]"
        style={{
          transform: 'skewY(-3.5deg)',
          transformOrigin: 'center center',
          background: isLight
            ? 'linear-gradient(90deg, rgba(55,109,140,0.08), rgba(113,95,159,0.12), rgba(55,109,140,0.08))'
            : 'linear-gradient(90deg, rgba(13,16,23,0.96), rgba(30,22,16,0.92), rgba(13,16,23,0.96))',
          borderColor: isLight ? 'rgba(55, 109, 140, 0.22)' : 'rgba(245, 158, 11, 0.18)',
        }}
      />
      {label && (
        <div className="relative z-10 h-full max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between font-mono text-[10px] tracking-widest uppercase text-text-dim">
          <span>{label}</span>
          <span className="text-primary font-bold">STRIPE // STRUCTURAL SPINE</span>
        </div>
      )}
    </div>
  );
}

/**
 * Stripe-Style Section Header (Eyebrow Pill Badge + Masked Display Headline + Concise Subheadline & Live Metrics)
 */
export function StripeSectionHeader({
  eyebrow,
  chapter,
  chapterNum,
  title,
  accentWords = [],
  subtitle,
  metrics = [],
  disabled = false,
}) {
  const resolvedChapter = chapterNum || chapter;

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-end justify-between gap-6 relative z-10">
      <div className="flex flex-col gap-3.5 max-w-3xl">
        <div className="inline-flex items-center gap-2.5 self-start px-3.5 py-1.5 rounded-full bg-surface-bright/90 border border-primary/30 shadow-[0_0_20px_var(--color-border-glow)]">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          {resolvedChapter && (
            <>
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-primary">
                {resolvedChapter}
              </span>
              <span className="font-mono text-xs text-text-dim">//</span>
            </>
          )}
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-text-primary">
            {eyebrow}
          </span>
        </div>

        <MaskedRevealText
          as="h2"
          text={title}
          accentWords={accentWords}
          disabled={disabled}
          className="font-display font-black text-3xl sm:text-4xl lg:text-5xl text-text-primary tracking-tight leading-[1.06] uppercase"
        />

        {subtitle && (
          <p className="font-sans text-sm sm:text-base text-text-muted max-w-[60ch] leading-relaxed font-normal">
            {subtitle}
          </p>
        )}
      </div>

      {metrics.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 self-start lg:self-end">
          {metrics.map((m) => (
            <div
              key={m.label}
              className="px-4 py-2.5 rounded-xl bg-surface-lowest/90 border border-border-muted backdrop-blur-md flex flex-col gap-0.5 min-w-[130px]"
            >
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-text-dim">
                {m.label}
              </span>
              <span className="font-mono text-lg font-extrabold text-primary">
                {m.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Stripe-Style Interactive CTA Button with Morphing Arrow (> -> ->),
 * Top-Edge Specular Highlight (border-t border-white/25), and Magnetic Cursor Pull.
 */
export function StripeCtaButton({
  to,
  href,
  onClick,
  children,
  variant = 'primary',
  className = '',
  cursorLabel = 'OPEN',
}) {
  const baseClasses =
    variant === 'primary'
      ? 'btn-primary border-t border-t-white/25 shadow-[0_6px_24px_var(--color-border-glow)]'
      : 'btn-secondary border-t border-t-white/15 backdrop-blur-md';

  const content = (
    <>
      <span>{children}</span>
      <span
        className="inline-flex items-center ml-1.5 overflow-hidden"
        aria-hidden="true"
      >
        <svg
          className="w-4 h-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5"
          viewBox="0 0 16 16"
          fill="none"
        >
          <path
            d="M2.5 8H12.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="origin-right scale-x-0 opacity-0 transition-all duration-200 ease-out group-hover:scale-x-100 group-hover:opacity-100"
          />
          <path
            d="M8.5 3.5L13 8L8.5 12.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="-translate-x-1.5 transition-transform duration-200 ease-out group-hover:translate-x-0"
          />
        </svg>
      </span>
    </>
  );

  const combinedClass = `group inline-flex items-center justify-center px-6 py-3 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${baseClasses} ${className}`;

  if (to) {
    return (
      <Link
        to={to}
        data-magnetic
        data-cursor-label={cursorLabel}
        className={combinedClass}
      >
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <a
        href={href}
        onClick={onClick}
        data-magnetic
        data-cursor-label={cursorLabel}
        className={combinedClass}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      data-magnetic
      data-cursor-label={cursorLabel}
      className={combinedClass}
    >
      {content}
    </button>
  );
}
