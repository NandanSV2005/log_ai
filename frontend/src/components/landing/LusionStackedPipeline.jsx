import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SpotlightCard } from '../motion-primitives';
import {
  lusionMotionState,
  StripeCtaButton,
  StripeSectionHeader,
  StructuralGridSpine,
} from './LusionMotionEngine';
import { useTheme } from '../../contexts/ThemeContext';

gsap.registerPlugin(ScrollTrigger);

export const PIPELINE_STAGES_3D = [
  {
    id: 'stage-01',
    num: '01',
    pillLabel: 'STAGE 01 // INGESTION',
    badge: '01 / HIGH-THROUGHPUT LOG INGESTION',
    title: 'High-Throughput Log Ingestion',
    subtitle: 'Syslog, Nginx, Apache, Auth & Cloud Server Streams',
    desc: 'Collects unstructured UDP/5144 syslog packets, Cisco ASA, FortiGate, Suricata EVE-JSON, pfSense, and headless forwarder batches into a zero-drop async ring buffer.',
    metricLabel: 'INGEST THROUGHPUT',
    metricValue: '142.8 GB/hr',
    sources: ['Cisco ASA', 'FortiGate UTM', 'Nginx / Apache', 'Suricata EVE', 'Linux Auth / SSH', 'pfSense PF'],
    codeSample: `<134>Sep 08 11:42:01 fw-edge-01 %ASA-4-106023: Deny udp src outside:185.220.101.5/54312 dst inside:10.0.4.12/445\n192.168.1.104 - - [08/Sep/2026:11:42:02 +0000] "POST /api/v1/auth HTTP/1.1" 401 312`,
    route: '/dashboard',
    ctaLabel: 'Configure Log Sources',
  },
  {
    id: 'stage-02',
    num: '02',
    pillLabel: 'STAGE 02 // TOKENIZATION',
    badge: '02 / AI/ML TOKENIZATION & SEMANTIC PARSING',
    title: 'AI/ML Tokenization & Semantic Parsing',
    subtitle: 'Regex-Free Unstructured Log Structuring into OCSF v1.1',
    desc: 'Extracts network socket tuples, process trees, HTTP methods, and auth principals without brittle vendor regexes, normalizing every record into canonical Open Cybersecurity Schema (OCSF v1.1).',
    metricLabel: 'PARSE LATENCY',
    metricValue: '< 1.8ms',
    sources: ['OCSF Class 4001', 'OCSF Class 3002', 'SHA-256 Leaf Seal', 'Merkle Proof Tree'],
    codeSample: `{\n  "class_uid": 4001,\n  "class_name": "Network Activity",\n  "src_endpoint": { "ip": "185.220.101.5", "port": 54312 },\n  "dst_endpoint": { "ip": "10.0.4.12", "port": 445 },\n  "sha256_seal": "c29d18b4fa8001a4e9b98a3e7f12"\n}`,
    route: '/log-explorer',
    ctaLabel: 'Inspect OCSF Records',
  },
  {
    id: 'stage-03',
    num: '03',
    pillLabel: 'STAGE 03 // CLASSIFICATION',
    badge: '03 / REAL-TIME THREAT CLASSIFICATION',
    title: 'Real-Time Threat & Anomaly Classification',
    subtitle: 'Brute-Force, SQLi, DDoS, Privilege Escalation & Anomaly Scoring',
    desc: 'Evaluates every normalized event through a dual-stage Isolation Forest anomaly detector and explainable MITRE ATT&CK classifier—distinguishing benign traffic from critical intrusions.',
    metricLabel: 'DETECTION ACCURACY',
    metricValue: '99.4% CONFIDENCE',
    sources: ['T1110 Brute Force', 'T1190 SQL Injection', 'T1021 Lateral SMB', 'T1078 Valid Accounts'],
    codeSample: `VERDICT: CRITICAL [SCORE: 94.2 / 100]\nCLASSIFICATION: SQL_INJECTION & SMB_LATERAL_PROBE\nMITRE_TACTIC: Initial Access (TA0001) -> Lateral Movement (TA0008)\nXAI_REASONING: High-entropy payload targeting restricted port 445`,
    route: '/rule-studio',
    ctaLabel: 'Open Rule Studio',
  },
  {
    id: 'stage-04',
    num: '04',
    pillLabel: 'STAGE 04 // AUTOMATED TRIAGE',
    badge: '04 / AUTOMATED TRIAGE & CSV EXPORT',
    title: 'Automated Triage, Geo-IP Mapping & CSV Audit Export',
    subtitle: 'Sub-Second Incident Correlation, Leaflet Vector Maps & Compliance Exports',
    desc: 'Correlates multi-hop attack chains, resolves attacker Geo-IP coordinates onto live vector maps, and generates cryptographically verified CSV/JSON audit reports with one click.',
    metricLabel: 'NOISE REDUCTION',
    metricValue: '94.2% FILTERED',
    sources: ['Geo-IP Threat Radar', 'One-Click CSV Export', 'JSON SIEM Webhook', 'Forensic Audit Trail'],
    codeSample: `EXPORT_STATUS: READY [SHA-256 MERKLE VERIFIED]\nGEO_ORIGIN: 185.220.101.5 (Frankfurt, DE -> 50.1109N, 8.6821E)\nINCIDENT_CLUSTER: #INC-2049 [142 Correlated Events -> 1 Actionable Alert]`,
    route: '/forensics',
    ctaLabel: 'Export Forensic Ledger',
  },
];

/**
 * Lusion Pinned 3D Stacked Scroll Cards (The 4-Stage AI Classification Pipeline)
 * - Pins the entire section (start: "top top", end: "+=320%", pin: true, scrub: 1)
 * - 0% – 33% Scroll (Stage 01 -> Stage 02): Card 02 slides up from yPercent: 115, rotateX: -8deg, opacity: 0
 *   while Card 01 recedes into 3D Z-space (scale: 0.92, y: -28, z: -80, opacity: 0.4, filter: blur(3px))
 * - 33% – 66% Scroll (Stage 02 -> Stage 03): Card 03 slides up into focus over Card 02 while Card 02
 *   scales to 0.92, y: -28, opacity: 0.4 and Card 01 scales further back to 0.85, y: -52, opacity: 0.18
 * - 66% – 100% Scroll (Stage 03 -> Stage 04): Card 04 slides up into focus over Card 03 while previous cards recede
 * - Synced Progress UI + Clicking any stage pill smoothly scrolls (lenis.scrollTo) to that exact scrub offset
 */
export function LusionStackedPipeline({ is2D = false }) {
  const { theme } = useTheme();
  const sectionRef = useRef(null);
  const cardsContainerRef = useRef(null);
  const progressBarFillRef = useRef(null);
  const scrollTriggerRef = useRef(null);

  const [activeStageIdx, setActiveStageIdx] = useState(0);
  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    const checkViewport = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    checkViewport();
    window.addEventListener('resize', checkViewport, { passive: true });
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  useEffect(() => {
    const sectionEl = sectionRef.current;
    const containerEl = cardsContainerRef.current;
    if (!sectionEl || !containerEl) return undefined;

    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (is2D || reducedMotion || isMobileView) {
      scrollTriggerRef.current = null;
      return undefined;
    }

    const cards = Array.from(containerEl.querySelectorAll('[data-pipeline-card]'));
    if (cards.length < 4) return undefined;

    const ctx = gsap.context(() => {
      // Initial 3D positions: Card 0 in focus, Cards 1..3 waiting below with rotateX: -8deg
      cards.forEach((card, i) => {
        gsap.set(card, { transformOrigin: 'center top' });
        if (i === 0) {
          gsap.set(card, {
            yPercent: 0,
            y: 0,
            z: 0,
            rotateX: 0,
            scale: 1,
            opacity: 1,
          });
        } else {
          gsap.set(card, {
            yPercent: 115,
            y: 0,
            z: 0,
            rotateX: -8,
            scale: 1,
            opacity: 0,
          });
        }
      });

      if (progressBarFillRef.current) {
        gsap.set(progressBarFillRef.current, { scaleX: 0.25 });
      }

      const tl = gsap.timeline({
        scrollTrigger: {
          id: 'stacked-pipeline-pin',
          trigger: sectionEl,
          start: 'top top',
          end: '+=320%',
          pin: true,
          pinSpacing: true,
          scrub: 1,
          anticipatePin: 1,
          refreshPriority: 1,
          onUpdate: (self) => {
            const p = self.progress;
            const nextIdx = p < 0.22 ? 0 : p < 0.55 ? 1 : p < 0.85 ? 2 : 3;
            setActiveStageIdx((prev) => (prev === nextIdx ? prev : nextIdx));
            if (progressBarFillRef.current) {
              const fillRatio = 0.25 + p * 0.75;
              progressBarFillRef.current.style.transform = `scaleX(${fillRatio.toFixed(4)})`;
            }
          },
        },
      });

      scrollTriggerRef.current = tl.scrollTrigger;

      // =====================================================================
      // STEP 1 (0% – 33% Scroll): Stage 01 -> Stage 02
      // =====================================================================
      tl.to(
        cards[0],
        {
          scale: 0.92,
          y: -36,
          z: -80,
          opacity: 0.22,
          duration: 0.72,
          ease: 'power3.out',
        },
        0
      ).to(
        cards[1],
        {
          yPercent: 0,
          rotateX: 0,
          scale: 1,
          y: 0,
          z: 0,
          opacity: 1,
          duration: 1,
          ease: 'power3.out',
        },
        0
      );

      // =====================================================================
      // STEP 2 (33% – 66% Scroll): Stage 02 -> Stage 03
      // =====================================================================
      tl.to(
        cards[0],
        {
          scale: 0.85,
          y: -64,
          z: -150,
          opacity: 0.06,
          duration: 0.72,
          ease: 'power3.out',
        },
        1
      )
        .to(
          cards[1],
          {
            scale: 0.92,
            y: -36,
            z: -80,
            opacity: 0.22,
            duration: 0.72,
            ease: 'power3.out',
          },
          1
        )
        .to(
          cards[2],
          {
            yPercent: 0,
            rotateX: 0,
            scale: 1,
            y: 0,
            z: 0,
            opacity: 1,
            duration: 1,
            ease: 'power3.out',
          },
          1
        );

      // =====================================================================
      // STEP 3 (66% – 100% Scroll): Stage 03 -> Stage 04
      // =====================================================================
      tl.to(
        cards[0],
        {
          scale: 0.78,
          y: -88,
          z: -210,
          opacity: 0.02,
          duration: 0.72,
          ease: 'power3.out',
        },
        2
      )
        .to(
          cards[1],
          {
            scale: 0.85,
            y: -64,
            z: -150,
            opacity: 0.06,
            duration: 0.72,
            ease: 'power3.out',
          },
          2
        )
        .to(
          cards[2],
          {
            scale: 0.92,
            y: -36,
            z: -80,
            opacity: 0.22,
            duration: 0.72,
            ease: 'power3.out',
          },
          2
        )
        .to(
          cards[3],
          {
            yPercent: 0,
            rotateX: 0,
            scale: 1,
            y: 0,
            z: 0,
            opacity: 1,
            duration: 1,
            ease: 'power3.out',
          },
          2
        );
    }, sectionEl);

    return () => {
      scrollTriggerRef.current = null;
      ctx.revert();
    };
  }, [is2D, isMobileView]);

  const useStackedPin = !is2D && !isMobileView;

  const handleSelectStage = (targetIdx) => {
    setActiveStageIdx(targetIdx);
    const st = scrollTriggerRef.current;

    if (st && useStackedPin) {
      const targetProgress = targetIdx / Math.max(1, PIPELINE_STAGES_3D.length - 1);
      const targetScrollY = st.start + (st.end - st.start) * targetProgress;
      if (lusionMotionState.lenis) {
        lusionMotionState.lenis.scrollTo(targetScrollY, { duration: 1.0 });
      } else {
        window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
      }
      return;
    }

    const containerEl = cardsContainerRef.current;
    if (!containerEl) return;
    const cards = Array.from(containerEl.querySelectorAll('[data-pipeline-card]'));
    cards.forEach((card, i) => {
      if (i < targetIdx) {
        const depth = targetIdx - i;
        gsap.to(card, {
          yPercent: 0,
          y: -36 * depth,
          scale: depth === 1 ? 0.92 : 0.85,
          z: -80 * depth,
          rotateX: 0,
          opacity: depth === 1 ? 0.22 : 0.06,
          duration: 0.55,
          ease: 'power3.out',
        });
      } else if (i === targetIdx) {
        gsap.to(card, {
          yPercent: 0,
          y: 0,
          scale: 1,
          z: 0,
          rotateX: 0,
          opacity: 1,
          duration: 0.55,
          ease: 'power3.out',
        });
      } else {
        gsap.to(card, {
          yPercent: 115,
          y: 0,
          scale: 1,
          z: 0,
          rotateX: -8,
          opacity: 0,
          duration: 0.55,
          ease: 'power3.out',
        });
      }
    });
  };

  return (
    <section
      ref={sectionRef}
      id="sources"
      className="relative w-full min-h-screen pt-20 pb-14 bg-gradient-to-b from-[var(--color-chapter2-from)] via-[var(--color-chapter2-via)] to-[var(--color-chapter2-to)] border-b border-border-muted overflow-hidden flex flex-col justify-between"
    >
      {/* Structural 4-Column Grid Spine */}
      <StructuralGridSpine variant={theme === 'sage' ? 'light' : 'dark'} />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-8 flex flex-col gap-4 flex-1 justify-between">
        {/* Stripe-Style Section Header */}
        <StripeSectionHeader
          chapterNum="CHAPTER 01"
          eyebrow="4-STAGE AI CLASSIFICATION PIPELINE"
          title="PINNED 3D TELEMETRY STRUCTURING & ANOMALY ENGINE"
          accentWords={['3D', 'TELEMETRY', 'ANOMALY', 'ENGINE']}
          subtitle="Every unstructured server log traverses four deterministic stages—from high-velocity socket ingestion to explainable MITRE ATT&CK classification and one-click compliance export."
          disabled={is2D}
          metrics={[
            { label: 'STAGE DWELL', value: '< 10ms' },
            { label: 'SCHEMA STANDARD', value: 'OCSF v1.1' },
          ]}
        />

        {/* Synced Progress UI: Stage Indicator Pills + Active Counter + Scrub Progress Bar */}
        <div className="flex flex-col gap-2.5">
          <div
            className="flex flex-wrap items-center justify-between gap-3"
            role="tablist"
            aria-label="AI Classification Pipeline Stages"
          >
            <div className="soc-segmented flex-wrap">
              {PIPELINE_STAGES_3D.map((st, idx) => {
                const isCurrent = idx === activeStageIdx;
                return (
                  <button
                    key={st.id}
                    type="button"
                    role="tab"
                    data-magnetic
                    aria-selected={isCurrent}
                    data-active={isCurrent}
                    onClick={() => handleSelectStage(idx)}
                    className="soc-segmented-item text-[11px]"
                  >
                    {st.pillLabel}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3 font-mono text-xs">
              <span className="text-text-dim hidden sm:inline">
                SCROLL TO SCRUB 3D STACK &darr;
              </span>
              <span className="soc-tag text-text-muted text-[11px]">
                ACTIVE STAGE: <strong className="text-primary">0{activeStageIdx + 1} / 04</strong>
              </span>
            </div>
          </div>

          {/* Sleek Scrub Progress Bar */}
          <div className="w-full h-1.5 rounded-full bg-surface-lowest border border-border-muted overflow-hidden">
            <div
              ref={progressBarFillRef}
              className="h-full w-full origin-left bg-gradient-to-r from-primary via-secondary to-tertiary transition-transform duration-150"
              style={{
                transform: `scaleX(${((activeStageIdx + 1) / PIPELINE_STAGES_3D.length).toFixed(2)})`,
              }}
            />
          </div>
        </div>

        {/* 3D Stacked Scroll Cards Stage (perspective: 1200px, pinned on desktop 3D) */}
        {useStackedPin ? (
          <div
            ref={cardsContainerRef}
            className="relative w-full flex-1 min-h-[380px] max-w-5xl mx-auto my-auto flex items-center justify-center pt-6"
            style={{ perspective: '1200px', transformStyle: 'preserve-3d' }}
          >
            {PIPELINE_STAGES_3D.map((stage, idx) => (
              <div
                key={stage.id}
                data-pipeline-card
                style={{ zIndex: idx + 10, transformStyle: 'preserve-3d' }}
                className="absolute inset-x-0 w-full will-change-[transform,opacity]"
              >
                <SpotlightCard
                  spotlightColor="var(--color-border-glow)"
                  className="pipeline-stage-card w-full p-6 sm:p-8 rounded-3xl bg-surface-lowest border-2 border-primary/40 shadow-[0_28px_70px_rgba(0,0,0,0.65),0_0_32px_var(--color-border-glow)]"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
                    {/* Left 7 Columns: Stage Narrative & Source Chips */}
                    <div className="lg:col-span-7 flex flex-col gap-3.5">
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-border-muted font-mono text-xs">
                        <div className="flex items-center gap-2 text-primary font-bold">
                          <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                          <span>{stage.badge}</span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded bg-secondary/15 border border-secondary/35 text-secondary font-bold text-[11px]">
                          {stage.metricLabel}: {stage.metricValue}
                        </span>
                      </div>

                      <div>
                        <h3 className="font-display font-black text-2xl sm:text-3xl text-text-primary tracking-tight leading-tight">
                          {stage.title}
                        </h3>
                        <p className="font-mono text-xs text-secondary font-bold mt-1 uppercase tracking-wider">
                          {stage.subtitle}
                        </p>
                      </div>

                      <p className="font-sans text-sm text-text-muted leading-relaxed">
                        {stage.desc}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 pt-0.5">
                        {stage.sources.map((chip) => (
                          <span
                            key={chip}
                            className="px-2.5 py-1 rounded-lg bg-surface border border-border-muted font-mono text-[11px] font-bold text-text-primary"
                          >
                            {chip}
                          </span>
                        ))}
                      </div>

                      <div className="pt-1">
                        <StripeCtaButton
                          to={stage.route}
                          variant="secondary"
                          className="!px-4 !py-2 !text-[11px]"
                        >
                          {stage.ctaLabel}
                        </StripeCtaButton>
                      </div>
                    </div>

                    {/* Right 5 Columns: Live Stage Telemetry Terminal Output */}
                    <div className="lg:col-span-5 h-full flex flex-col justify-between p-4 sm:p-5 rounded-2xl bg-surface-dim border border-border-muted font-mono text-xs gap-3">
                      <div className="flex items-center justify-between pb-2 border-b border-border-muted/70 text-[10px] text-text-dim">
                        <span>STAGE_{stage.num}_BUFFER.LOG</span>
                        <span className="text-tertiary font-bold">● VERIFIED STREAM</span>
                      </div>
                      <pre className="text-[11px] text-primary leading-relaxed overflow-x-auto whitespace-pre-wrap break-all font-mono">
                        {stage.codeSample}
                      </pre>
                      <div className="pt-2 border-t border-border-muted/70 flex items-center justify-between text-[10px] text-text-dim">
                        <span>ZERO-DROP ASYNC ENGINE</span>
                        <span className="text-secondary font-bold">STEP 0{idx + 1} OF 04</span>
                      </div>
                    </div>
                  </div>
                </SpotlightCard>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PIPELINE_STAGES_3D.map((stage) => (
              <SpotlightCard
                key={stage.id}
                spotlightColor="var(--color-border-glow)"
                className="p-6 rounded-2xl bg-surface-lowest/95 border border-primary/35 shadow-xl flex flex-col justify-between gap-4"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between font-mono text-[11px] text-primary font-bold pb-2 border-b border-border-muted">
                    <span>{stage.badge}</span>
                    <span className="text-secondary">{stage.metricValue}</span>
                  </div>
                  <h3 className="font-display font-black text-xl text-text-primary">
                    {stage.title}
                  </h3>
                  <p className="font-sans text-xs text-text-muted leading-relaxed">
                    {stage.desc}
                  </p>
                  <pre className="p-3 rounded-xl bg-surface-dim border border-border-muted font-mono text-[10px] text-primary overflow-x-auto whitespace-pre-wrap">
                    {stage.codeSample}
                  </pre>
                </div>
                <div className="pt-2">
                  <StripeCtaButton
                    to={stage.route}
                    variant="secondary"
                    className="!px-4 !py-2 !text-[10px]"
                  >
                    {stage.ctaLabel}
                  </StripeCtaButton>
                </div>
              </SpotlightCard>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
