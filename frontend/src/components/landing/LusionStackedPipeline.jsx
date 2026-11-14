import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SpotlightCard } from '../motion-primitives';
import { StripeCtaButton, StripeSectionHeader, StructuralGridSpine } from './LusionMotionEngine';
import { useTheme } from '../../contexts/ThemeContext';

gsap.registerPlugin(ScrollTrigger);

export const PIPELINE_STAGES_3D = [
  {
    id: 'stage-01',
    num: '01',
    badge: 'STAGE 01 // HIGH-THROUGHPUT LOG INGESTION',
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
    badge: 'STAGE 02 // AI/ML TOKENIZATION & SEMANTIC PARSING',
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
    badge: 'STAGE 03 // REAL-TIME THREAT & ANOMALY CLASSIFICATION',
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
    badge: 'STAGE 04 // AUTOMATED TRIAGE, GEO-IP MAPPING & CSV AUDIT EXPORT',
    title: 'Automated Triage, Geo-IP Mapping & CSV Audit Export',
    subtitle: 'Sub-Second Incident Correlation, Leaflet Vector Maps & Compliance Exports',
    desc: 'Correlates multi-hop attack chains, resolves attacker Geo-IP coordinates onto live vector maps, and generates cryptographically verified CSV/JSON audit reports with one click.',
    metricLabel: 'NOISE REDUCTION',
    metricValue: '94.0% FILTERED',
    sources: ['Live Geo-IP Map', 'Forensic Timeline', 'One-Click CSV Export', 'AI SOC Copilot'],
    codeSample: `EXPORT_READY: threat_report_2026-11-14.csv (SHA-256 Verified)\nGEO_ORIGIN: 185.220.101.5 -> Frankfurt, DE [50.1109, 8.6821]\nINCIDENT_STATUS: CORRELATED_CHAIN #INC-4092 [READY FOR AUDIT]`,
    route: '/threat-intel',
    ctaLabel: 'Launch Threat Intel Map',
  },
];

export function LusionStackedPipeline({ is2D = false }) {
  const { theme } = useTheme();
  const sectionRef = useRef(null);
  const cardsContainerRef = useRef(null);
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
      return undefined;
    }

    const cards = Array.from(containerEl.querySelectorAll('[data-pipeline-card]'));
    if (cards.length < 2) return undefined;

    const ctx = gsap.context(() => {
      // Initial positions: Card 0 in focus, Cards 1..3 waiting below
      cards.forEach((card, i) => {
        if (i === 0) {
          gsap.set(card, {
            yPercent: 0,
            scale: 1,
            z: 0,
            opacity: 1,
            filter: 'blur(0px)',
          });
        } else {
          gsap.set(card, {
            yPercent: 112,
            scale: 1,
            z: 0,
            opacity: 0,
            filter: 'blur(0px)',
          });
        }
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionEl,
          start: 'top top',
          end: '+=280%',
          pin: true,
          scrub: 1.2,
          anticipatePin: 1,
          onUpdate: (self) => {
            const idx = Math.min(
              cards.length - 1,
              Math.floor(self.progress * cards.length + 0.15)
            );
            setActiveStageIdx(idx);
          },
        },
      });

      for (let i = 1; i < cards.length; i++) {
        const stepStart = (i - 1) * 1.0;

        // Previous card scales down (0.92), recedes in Z-space, dims (0.45), and blurs (4px)
        tl.to(
          cards[i - 1],
          {
            scale: 0.92,
            yPercent: -6 * i,
            z: -90,
            opacity: 0.45,
            filter: 'blur(4px)',
            duration: 0.85,
            ease: 'power2.inOut',
          },
          stepStart
        );

        // Even older cards recede further
        if (i >= 2) {
          tl.to(
            cards[i - 2],
            {
              scale: 0.86,
              yPercent: -12,
              z: -160,
              opacity: 0.2,
              filter: 'blur(6px)',
              duration: 0.85,
              ease: 'power2.inOut',
            },
            stepStart
          );
        }

        // Current card slides up into sharp 3D focus
        tl.to(
          cards[i],
          {
            yPercent: 0,
            scale: 1,
            z: 0,
            opacity: 1,
            filter: 'blur(0px)',
            duration: 0.85,
            ease: 'power3.out',
          },
          stepStart
        );
      }
    }, sectionEl);

    return () => ctx.revert();
  }, [is2D, isMobileView]);

  const useStackedPin = !is2D && !isMobileView;

  return (
    <section
      ref={sectionRef}
      id="sources"
      className="relative w-full min-h-screen py-16 md:py-20 bg-gradient-to-b from-[var(--color-chapter2-from)] via-[var(--color-chapter2-via)] to-[var(--color-chapter2-to)] border-b border-border-muted overflow-hidden flex flex-col justify-between"
    >
      {/* Structural 4-Column Grid Spine */}
      <StructuralGridSpine variant={theme === 'sage' ? 'light' : 'dark'} />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-8 flex flex-col gap-8 flex-1 justify-between">
        {/* Stripe-Style Section Header */}
        <StripeSectionHeader
          chapterNum="CHAPTER 02"
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

        {/* Stage Indicator Pills */}
        <div
          className="flex flex-wrap items-center justify-between gap-3 pt-1"
          role="tablist"
          aria-label="AI Classification Pipeline Stages"
        >
          <div className="flex flex-wrap items-center gap-2">
            {PIPELINE_STAGES_3D.map((st, idx) => {
              const isCurrent = idx === activeStageIdx;
              return (
                <button
                  key={st.id}
                  type="button"
                  role="tab"
                  aria-selected={isCurrent}
                  onClick={() => setActiveStageIdx(idx)}
                  className={`px-3.5 py-1.5 rounded-full font-mono text-xs font-bold transition-all border cursor-pointer ${
                    isCurrent
                      ? 'bg-primary text-surface-dim border-primary shadow-[0_0_16px_var(--color-border-glow)]'
                      : 'bg-surface-lowest/80 border-border-muted text-text-muted hover:text-text-primary hover:border-primary/40'
                  }`}
                >
                  STAGE {st.num} // {st.title.split(' ')[0].toUpperCase()}
                </button>
              );
            })}
          </div>

          <span className="font-mono text-xs text-text-dim hidden sm:inline">
            ACTIVE STAGE: <strong className="text-primary">0{activeStageIdx + 1} / 04</strong>
          </span>
        </div>

        {/* 3D Stacked Scroll Cards Stage (Pinned on desktop 3D, stacked grid on mobile/2D) */}
        {useStackedPin ? (
          <div
            ref={cardsContainerRef}
            className="relative w-full flex-1 min-h-[430px] max-w-5xl mx-auto my-auto flex items-center justify-center"
            style={{ perspective: '1400px', transformStyle: 'preserve-3d' }}
          >
            {PIPELINE_STAGES_3D.map((stage, idx) => (
              <div
                key={stage.id}
                data-pipeline-card
                style={{ zIndex: idx + 10 }}
                className="absolute inset-x-0 w-full will-change-[transform,opacity,filter]"
              >
                <SpotlightCard
                  spotlightColor="var(--color-border-glow)"
                  className="w-full p-6 sm:p-8 lg:p-10 rounded-3xl bg-surface-lowest/95 border-2 border-primary/40 shadow-[0_28px_70px_rgba(0,0,0,0.55),0_0_32px_var(--color-border-glow)] backdrop-blur-2xl"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
                    {/* Left 7 Columns: Stage Narrative & Source Chips */}
                    <div className="lg:col-span-7 flex flex-col gap-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border-muted font-mono text-xs">
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

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {stage.sources.map((chip) => (
                          <span
                            key={chip}
                            className="px-2.5 py-1 rounded-lg bg-surface border border-border-muted font-mono text-[11px] font-bold text-text-primary"
                          >
                            {chip}
                          </span>
                        ))}
                      </div>

                      <div className="pt-2">
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
