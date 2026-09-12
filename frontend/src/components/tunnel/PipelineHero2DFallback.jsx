import React from 'react';
import { InView, TextEffect, AnimatedGroup, SpotlightCard, BorderGlow } from '../motion-primitives';

export function PipelineHero2DFallback({
  stats = {},
  recentEvents = [],
  pipelineLatency = '<10ms',
  merkleProofType = 'SHA-256',
  pipelineCards = [],
  activePipeCard,
  setActivePipeCard,
  scrollToSection,
  InteractiveCardComponent
}) {
  return (
    <>
      {/* 2D HERO SECTION FALLBACK */}
      <section className="relative w-full overflow-hidden px-4 md:px-8 xl:px-14 py-20 lg:py-24 bg-surface-dim border-b border-border-muted">
        <div className="absolute -top-40 left-1/4 w-[700px] h-[500px] bg-primary/10 rounded-full blur-[140px] pointer-events-none"></div>
        <div className="absolute top-1/3 -right-20 w-[550px] h-[450px] bg-secondary/10 rounded-full blur-[130px] pointer-events-none"></div>

        <div className="max-w-[1600px] mx-auto w-full grid grid-cols-1 xl:grid-cols-12 gap-10 lg:gap-12 relative z-10 items-center">
          {/* Left Narrative Column */}
          <div className="xl:col-span-6 flex flex-col gap-6">
            <InView
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
            >
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-surface-bright/80 border border-primary/30 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                  <span className="font-mono text-[11px] font-bold text-primary uppercase tracking-wider">
                    00 // UNIVERSAL LOG PRE-PROCESSING FRAMEWORK (ULPF)
                  </span>
                </div>
                <span className="font-mono text-xs text-text-dim font-semibold">v2.4</span>
              </div>
            </InView>

            <TextEffect
              per="word"
              as="h1"
              className="font-display font-black text-4xl sm:text-5xl lg:text-6xl text-text-primary uppercase tracking-tight leading-[1.08]"
              delay={0.1}
            >
              Understand what your systems are doing.
            </TextEffect>

            <InView
              variants={{
                hidden: { opacity: 0, y: 15 },
                visible: { opacity: 1, y: 0 }
              }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <p className="font-sans text-base lg:text-lg text-text-muted max-w-xl font-normal leading-relaxed">
                Collect raw security logs from any firewall or server. Automatically convert them into a single clear format, verify their accuracy with cryptographic hash checks, and explain potential threats before alert volume overwhelms your team.
              </p>
            </InView>

            <InView
              variants={{
                hidden: { opacity: 0, y: 15 },
                visible: { opacity: 1, y: 0 }
              }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={() => scrollToSection('pipeline')}
                  className="px-6 py-3 rounded-xl bg-primary text-surface-dim font-sans font-bold text-sm shadow-[0_0_24px_var(--color-border-glow)] hover:bg-primary-fixed transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[19px]">account_tree</span>
                  <span>Explore ULPF Pipeline</span>
                </button>
                <button
                  onClick={() => scrollToSection('demo')}
                  className="px-6 py-3 rounded-xl bg-surface-bright hover:bg-surface-hover text-text-primary font-sans font-bold text-sm border border-border-muted transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[19px]">play_circle</span>
                  <span>Live Interactive Demo</span>
                </button>
              </div>
            </InView>

            <AnimatedGroup
              className="grid grid-cols-3 gap-3 pt-4 max-w-xl"
              variants={{
                container: {
                  hidden: { opacity: 0 },
                  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
                },
                item: {
                  hidden: { opacity: 0, y: 15 },
                  visible: { opacity: 1, y: 0 }
                }
              }}
            >
              <SpotlightCard spotlightColor="rgba(167, 139, 250, 0.12)" className="p-3.5 bg-surface-lowest/80 border border-border-muted rounded-xl flex flex-col">
                <span className="font-mono text-[10px] font-bold text-text-dim uppercase tracking-wider">Events Processed</span>
                <span className="font-mono text-2xl lg:text-3xl text-primary font-extrabold tracking-tight mt-1">
                  {(stats.total_events_ingested || 48281).toLocaleString()}
                </span>
                <span className="font-mono text-[10px] text-tertiary mt-0.5">Total Logs Received</span>
              </SpotlightCard>

              <SpotlightCard spotlightColor="rgba(123, 208, 255, 0.12)" className="p-3.5 bg-surface-lowest/80 border border-border-muted rounded-xl flex flex-col">
                <span className="font-mono text-[10px] font-bold text-text-dim uppercase tracking-wider">Processing Latency</span>
                <span className="font-mono text-2xl lg:text-3xl text-secondary font-extrabold tracking-tight mt-1">
                  {pipelineLatency}
                </span>
                <span className="font-mono text-[10px] text-text-dim mt-0.5">Average Processing Speed</span>
              </SpotlightCard>

              <SpotlightCard spotlightColor="rgba(78, 222, 163, 0.12)" className="p-3.5 bg-surface-lowest/80 border border-border-muted rounded-xl flex flex-col">
                <span className="font-mono text-[10px] font-bold text-text-dim uppercase tracking-wider">Log Verification</span>
                <span className="font-mono text-2xl lg:text-3xl text-tertiary font-extrabold tracking-tight mt-1">
                  {merkleProofType}
                </span>
                <span className="font-mono text-[10px] text-tertiary mt-0.5">Tamper-Proof Verification</span>
              </SpotlightCard>
            </AnimatedGroup>
          </div>

          {/* Right HUD Stream Instrument */}
          <InView
            className="xl:col-span-6 relative mt-4 xl:mt-0"
            variants={{
              hidden: { opacity: 0, scale: 0.96, y: 20 },
              visible: { opacity: 1, scale: 1, y: 0 }
            }}
            transition={{ duration: 0.6 }}
          >
            <BorderGlow glowColor="var(--color-primary)" borderRadius="1rem">
              <div className="relative w-full rounded-2xl bg-surface-lowest border border-border-muted p-4 md:p-6 overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-border-muted">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-severity-critical)]"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-tertiary"></span>
                    <span className="ml-2 font-mono text-xs text-text-primary font-bold tracking-wider">ULPF // INGESTION_STREAM</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-primary px-2 py-0.5 rounded bg-primary/10 border border-primary/20">SHA-256 LEDGER</span>
                    <span className="font-mono text-[10px] text-tertiary font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-ping"></span> LIVE
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-[11px]">
                  <div className="bg-surface-dim p-3.5 rounded-xl border border-border-muted flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-text-dim text-[10px] font-bold">
                      <span>[RAW_LOG_BUFFER]</span>
                      <span className="text-secondary font-mono">STREAMING</span>
                    </div>
                    <div className="flex flex-col gap-1 text-text-muted font-mono text-[10px] opacity-85 pt-1">
                      <p className="text-[var(--color-severity-critical)] truncate">0x7F4A %ASA-4-106023: Deny udp src outside:185.220.101.5</p>
                      <p className="truncate">0x7F4B CEF:0|Fortinet|FortiGate|v7.2|traffic:denied|src=10.0.4.12</p>
                      <p className="text-secondary truncate">0x7F4C pf: rule 42/(match) pass in on igb0: 192.168.1.104</p>
                      <p className="truncate">0x7F4D Suricata[3819]: [1:2018959:4] ET Suspicious Inbound TLS</p>
                      <p className="text-tertiary truncate">0x7F4E {"{EventID:4624,TargetUserName:SYSTEM}"}</p>
                    </div>
                  </div>

                  <div className="bg-surface-dim p-3.5 rounded-xl border border-border-muted flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-text-dim text-[10px] font-bold">
                      <span>[CANONICAL_OCSF_OUTPUT]</span>
                      <span className="text-tertiary font-mono">VERIFIED</span>
                    </div>
                    <div className="flex flex-col gap-1 text-tertiary font-mono text-[10px] pt-1">
                      <p className="truncate text-primary">hash: "{recentEvents[0]?.raw_event_hash || 'c29d18b4fa8001a4e9b98a3e7'}"</p>
                      <p className="truncate text-text-primary">ocsf.class: "NETWORK_ACTIVITY"</p>
                      <p className="truncate text-[var(--color-severity-critical)]">action: "BLOCKED" | score: 9.4</p>
                      <p className="truncate text-secondary">xai_verdict: "PORT_SCAN_DETECTION"</p>
                      <p className="truncate text-text-dim">merkle_proof: "0x89eaf042b...verified"</p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 p-2.5 bg-surface-dim border border-border-muted rounded-xl flex items-center justify-between text-[10px] font-mono text-text-dim">
                  <span className="text-primary font-bold">01 INGEST</span>
                  <span>&rarr;</span>
                  <span className="text-secondary font-bold">02 PARSE</span>
                  <span>&rarr;</span>
                  <span className="text-tertiary font-bold">03 OCSF</span>
                  <span>&rarr;</span>
                  <span className="text-primary font-bold">04 HASH</span>
                  <span>&rarr;</span>
                  <span className="text-tertiary font-bold">05 VERDICT</span>
                </div>
              </div>
            </BorderGlow>
          </InView>
        </div>
      </section>

      {/* 2D CHAPTER 01 FALLBACK */}
      <section
        id="pipeline"
        className="w-full px-4 md:px-8 xl:px-14 py-20 relative bg-gradient-to-b from-[var(--color-chapter1-from)] via-[var(--color-chapter1-via)] to-[var(--color-chapter1-to)] border-b border-primary/20"
      >
        <div className="absolute top-10 left-1/3 w-[800px] h-[550px] bg-primary/10 rounded-full blur-[160px] pointer-events-none"></div>

        <div className="max-w-[1600px] mx-auto flex flex-col gap-12 relative z-10">
          <InView className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-primary uppercase tracking-widest">CHAPTER 01</span>
                <span className="text-text-dim font-mono">//</span>
                <span className="font-mono text-xs text-text-dim font-semibold tracking-wider">EXECUTION_SEQUENCE</span>
              </div>
              <h2 className="font-display font-black text-3xl md:text-4xl text-text-primary uppercase tracking-tight">
                Pipeline Architecture
              </h2>
            </div>
            <p className="font-sans text-sm md:text-base text-text-muted max-w-md leading-relaxed font-normal">
              Six straightforward steps that convert raw server activity into structured, verified security records.
            </p>
          </InView>

          <InView className="w-full bg-surface-lowest/90 border border-primary/30 rounded-2xl p-6 lg:p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-border-muted font-mono text-xs">
              <div className="flex items-center gap-2 text-primary font-bold">
                <span className="material-symbols-outlined text-[18px]">account_tree</span>
                <span>LIVE PIPELINE STAGES</span>
              </div>
              <span className="text-tertiary font-bold hidden sm:inline">PROCESSING SPEED: {pipelineLatency}</span>
            </div>

            <div className="relative w-full">
              <svg className="w-full h-24 hidden md:block" fill="none" preserveAspectRatio="none" viewBox="0 0 1200 80">
                <path d="M 60 40 L 1140 40" stroke="currentColor" className="text-primary/20" strokeWidth="4"></path>
                <path className="animate-dash-flow" d="M 60 40 L 1140 40" stroke="url(#pipeGradFallback)" strokeDasharray="10 14" strokeWidth="2.5"></path>
                <defs>
                  <linearGradient id="pipeGradFallback" x1="0" x2="1200" y1="0" y2="0" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="var(--color-primary)"></stop>
                    <stop offset="50%" stopColor="var(--color-secondary)"></stop>
                    <stop offset="100%" stopColor="var(--color-tertiary)"></stop>
                  </linearGradient>
                </defs>
              </svg>

              <div className="grid grid-cols-2 md:grid-cols-6 gap-3 lg:gap-4 -mt-10 relative z-10">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-xl bg-surface-dim border-2 border-primary flex items-center justify-center text-primary shadow-[0_0_16px_rgba(167,139,250,0.4)] mb-2">
                    <span className="font-mono font-black text-xs">01</span>
                  </div>
                  <span className="font-mono text-[11px] font-bold text-primary uppercase">RAW INGEST</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-xl bg-surface-dim border-2 border-secondary flex items-center justify-center text-secondary shadow-[0_0_16px_rgba(123,208,255,0.3)] mb-2">
                    <span className="font-mono font-black text-xs">02</span>
                  </div>
                  <span className="font-mono text-[11px] font-bold text-secondary uppercase">TOKENIZE</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-xl bg-surface-dim border-2 border-tertiary flex items-center justify-center text-tertiary shadow-[0_0_16px_rgba(78,222,163,0.3)] mb-2">
                    <span className="font-mono font-black text-xs">03</span>
                  </div>
                  <span className="font-mono text-[11px] font-bold text-tertiary uppercase">OCSF NORM</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-xl bg-surface-dim border-2 border-primary flex items-center justify-center text-primary shadow-[0_0_16px_rgba(167,139,250,0.4)] mb-2">
                    <span className="font-mono font-black text-xs">04</span>
                  </div>
                  <span className="font-mono text-[11px] font-bold text-primary uppercase">SHA-256 SEAL</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-xl bg-surface-dim border-2 border-secondary flex items-center justify-center text-secondary shadow-[0_0_16px_rgba(123,208,255,0.3)] mb-2">
                    <span className="font-mono font-black text-xs">05</span>
                  </div>
                  <span className="font-mono text-[11px] font-bold text-secondary uppercase">ANOMALY ML</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-xl bg-surface-dim border-2 border-tertiary flex items-center justify-center text-tertiary shadow-[0_0_16px_rgba(78,222,163,0.4)] mb-2">
                    <span className="font-mono font-black text-xs">06</span>
                  </div>
                  <span className="font-mono text-[11px] font-bold text-tertiary uppercase">XAI VERDICT</span>
                </div>
              </div>
            </div>
          </InView>

          {InteractiveCardComponent && (
            <AnimatedGroup className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
              {pipelineCards.map((card) => (
                <InteractiveCardComponent
                  key={card.id}
                  card={card}
                  activeCardId={activePipeCard}
                  setActiveCardId={setActivePipeCard}
                />
              ))}
            </AnimatedGroup>
          )}
        </div>
      </section>
    </>
  );
}
