import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { api } from '../services/api';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export function LandingPage() {
  const { theme, setTheme } = useTheme();

  // 1. Hero Conceptual Teaser Demo State
  const [heroStep, setHeroStep] = useState(0);
  const [heroAutoPlay, setHeroAutoPlay] = useState(true);

  useEffect(() => {
    if (!heroAutoPlay) return;
    const timer = setInterval(() => {
      setHeroStep((prev) => (prev + 1) % HERO_DEMO_STEPS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [heroAutoPlay]);

  // 2. Streamlined 4-Stage "How It Works" Pipeline State
  const [activePipelineStage, setActivePipelineStage] = useState(1);

  // 3. Deep Subsystem Inspection Drawer State (Collapsible)
  const [isInspectorExpanded, setIsInspectorExpanded] = useState(false);
  const [inspectorTab, setInspectorTab] = useState('capabilities'); // 'capabilities' | 'topology' | 'incidents' | 'estimator'

  // Nested Drawer Tab States (Capabilities, Topology, Incident Story, Estimator)
  const [activeFeature, setActiveFeature] = useState('ingestion');
  const [activeArchNode, setActiveArchNode] = useState('ingestion');
  const [selectedIncidentStep, setSelectedIncidentStep] = useState(2);

  // Financial Estimator State (Formulas 100% UNCHANGED)
  const [logVolume, setLogVolume] = useState(500000);
  const [devicesMonitored, setDevicesMonitored] = useState(25);

  const hoursSaved = ((logVolume * 0.001 * 0.85 * 3.5 * 30) / 60).toFixed(1);
  const mttrReduction = Math.min(85, (50 + devicesMonitored * 0.2)).toFixed(1);
  const monthlySavings = (hoursSaved * 65).toLocaleString('en-US', { maximumFractionDigits: 0 });

  // 4. Real Data-Driven Threat Map State
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerLayerRef = useRef(null);
  const tileLayerRef = useRef(null);

  const [mapEventsCount, setMapEventsCount] = useState(0);
  const [mappedLocationsCount, setMappedLocationsCount] = useState(0);
  const [unmappedLocationsCount, setUnmappedLocationsCount] = useState(0);
  const [isMapLoading, setIsMapLoading] = useState(true);

  // 5. Scroll Reveal Animation Hook via IntersectionObserver
  const sectionRefs = useRef([]);
  sectionRefs.current = [];

  const addToRefs = (el) => {
    if (el && !sectionRefs.current.includes(el)) {
      sectionRefs.current.push(el);
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
          }
        });
      },
      { threshold: 0.15 }
    );

    sectionRefs.current.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  // Initialize Leaflet Map (Esri World Canvas Tiles, No API key required)
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [20, 0],
      zoom: 2,
      minZoom: 2,
      maxZoom: 14,
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: false,
    });

    mapInstanceRef.current = map;

    const tileUrl =
      theme === 'sage'
        ? 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}'
        : 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';

    const tiles = L.tileLayer(tileUrl, {
      attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
      maxZoom: 16,
    }).addTo(map);

    tileLayerRef.current = tiles;

    const markerGroup = L.layerGroup().addTo(map);
    markerLayerRef.current = markerGroup;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Sync Leaflet map tile theme
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    const tileUrl =
      theme === 'sage'
        ? 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}'
        : 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';
    tileLayerRef.current.setUrl(tileUrl);
  }, [theme]);

  // Fetch real events & resolve GeoIP coordinates dynamically
  useEffect(() => {
    let isMounted = true;

    async function loadMapData() {
      if (!markerLayerRef.current) return;
      setIsMapLoading(true);

      try {
        const eventsRes = await api.getRecentEvents(100);
        const events = Array.isArray(eventsRes) ? eventsRes : eventsRes?.events || [];
        if (!isMounted) return;

        setMapEventsCount(events.length);

        const distinctIps = Array.from(
          new Set(events.map((e) => e.source_ip).filter((ip) => Boolean(ip) && ip !== 'N/A'))
        );

        const geoLookupFn = api.lookupGeoIp || api.getGeoIP;
        let mappedCount = 0;
        let unmappedCount = 0;

        if (markerLayerRef.current) {
          markerLayerRef.current.clearLayers();
        }

        for (const ip of distinctIps) {
          if (!isMounted) break;
          try {
            const geo = geoLookupFn ? await geoLookupFn(ip) : null;
            if (
              geo &&
              typeof geo.latitude === 'number' &&
              typeof geo.longitude === 'number' &&
              !isNaN(geo.latitude) &&
              !isNaN(geo.longitude)
            ) {
              mappedCount++;
              const matchingEvt = events.find((e) => e.source_ip === ip);
              const severity = matchingEvt?.severity || 'MEDIUM';
              const markerColor =
                severity === 'HIGH' || severity === 'CRITICAL'
                  ? '#ef4444'
                  : severity === 'MEDIUM'
                  ? '#f59e0b'
                  : '#10b981';

              const customIcon = L.divIcon({
                className: 'custom-map-pin',
                html: `<div style="
                  width: 12px;
                  height: 12px;
                  border-radius: 50%;
                  background-color: ${markerColor};
                  border: 2px solid rgba(255,255,255,0.8);
                  box-shadow: 0 0 10px ${markerColor};
                "></div>`,
                iconSize: [12, 12],
                iconAnchor: [6, 6],
              });

              const marker = L.marker([geo.latitude, geo.longitude], { icon: customIcon });
              const popupContent = `
                <div style="font-family: monospace; font-size: 11px; padding: 4px;">
                  <strong style="color: ${markerColor};">IP: ${ip}</strong><br/>
                  <span>Location: ${geo.city || 'Unknown'}, ${geo.country_name || geo.country || 'Global'}</span><br/>
                  <span>Events: ${events.filter((e) => e.source_ip === ip).length} records</span>
                </div>
              `;
              marker.bindPopup(popupContent);
              if (markerLayerRef.current) {
                markerLayerRef.current.addLayer(marker);
              }
            } else {
              unmappedCount += events.filter((e) => e.source_ip === ip).length;
            }
          } catch (err) {
            unmappedCount += events.filter((e) => e.source_ip === ip).length;
          }
        }

        if (isMounted) {
          setMappedLocationsCount(mappedCount);
          setUnmappedLocationsCount(unmappedCount);
        }
      } catch (err) {
        console.warn('Map data load error:', err);
      } finally {
        if (isMounted) setIsMapLoading(false);
      }
    }

    loadMapData();

    return () => {
      isMounted = false;
    };
  }, []);

  const activePipelineObj = PIPELINE_STAGES.find((s) => s.id === activePipelineStage) || PIPELINE_STAGES[0];
  const activeCapabilityObj = CAPABILITIES_DATA.find((c) => c.id === activeFeature) || CAPABILITIES_DATA[0];
  const activeArchObj = ARCHITECTURE_NODES.find((a) => a.id === activeArchNode) || ARCHITECTURE_NODES[0];

  return (
    <div className="bg-background text-text-primary antialiased min-h-screen flex flex-col relative overflow-x-hidden font-sans">
      <div className="scan-overlay"></div>

      {/* Minimal Header Navigation */}
      <header className="w-full bg-background/90 backdrop-blur-md border-b border-border-muted sticky top-0 z-50 py-3.5 px-6 max-w-7xl mx-auto flex justify-between items-center transition-colors">
        <Link to="/" className="font-extrabold text-xl text-primary tracking-tighter flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-surface-dim border border-border-muted flex items-center justify-center text-primary shadow-sm">
            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              security
            </span>
          </div>
          <span className="font-mono tracking-tight text-text-primary font-bold">STITCH</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-xs font-mono font-bold tracking-wider text-text-muted">
          <a href="#stats" className="hover:text-primary transition-colors">METRICS</a>
          <a href="#pipeline" className="hover:text-primary transition-colors">HOW IT WORKS</a>
          <a href="#threat-map" className="hover:text-primary transition-colors">THREAT MAP</a>
          <a href="#inspect" className="hover:text-primary transition-colors">INSPECT</a>
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'sage' : 'dark')}
            className="px-3.5 py-1.5 rounded-lg border border-border-muted bg-surface-dim text-xs font-mono font-bold flex items-center gap-2 hover:border-primary transition-all text-text-primary"
            aria-label="Toggle visual theme mode"
          >
            <span className="material-symbols-outlined text-sm">palette</span>
            <span>{theme === 'dark' ? 'CYBER VOID' : 'SAGE GREEN'}</span>
          </button>

          <Link to="/login" className="btn-secondary px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono">
            Sign In
          </Link>
          <Link to="/dashboard" className="btn-primary px-4 py-1.5 rounded-lg text-xs font-bold font-mono flex items-center gap-1">
            <span>Open SOC Console</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>
      </header>

      {/* Main Single-Scroll Narrative */}
      <main className="flex-grow relative z-10 pb-20 md:pb-0">
        
        {/* SECTION 1: HERO — PLAIN LANGUAGE HEADLINE & CONCEPTUAL TEASER */}
        <section
          ref={addToRefs}
          className="reveal-on-scroll max-w-7xl mx-auto px-6 pt-12 pb-16 md:pt-20 md:pb-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center border-b border-border-muted"
        >
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 bg-surface-dim px-3.5 py-1 rounded-full border border-border-muted font-mono text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-bold text-text-primary uppercase tracking-widest">[ AUTOMATED LOG INTELLIGENCE ]</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold text-text-primary tracking-tight leading-[1.08] font-sans">
              Automatically Catch <span className="text-primary underline decoration-primary/40 underline-offset-8">Security Threats</span> Hidden in Your Logs
            </h1>

            <p className="text-base sm:text-lg text-text-muted leading-relaxed font-sans max-w-xl">
              Stitch normalizes raw firewall streams into standardized OCSF events, detects behavioral anomalies, and connects isolated alerts into actionable incident timelines.
            </p>

            <div className="pt-2 font-mono text-xs font-bold">
              <Link
                to="/dashboard"
                className="btn-primary px-7 py-3.5 rounded-xl inline-flex items-center gap-2 shadow-lg text-sm"
              >
                <span>[ OPEN SOC CONSOLE ]</span>
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </Link>
            </div>
          </div>

          {/* Hero Motion Anchor: Auto-Animating Conceptual Demo Teaser */}
          <div className="lg:col-span-6 glass-panel p-6 rounded-2xl border border-border-muted space-y-4 shadow-2xl relative overflow-hidden">
            <div className="flex justify-between items-center border-b border-border-muted pb-3 font-mono text-xs">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base">auto_awesome</span>
                <span className="font-bold text-text-primary uppercase tracking-wider">[ CONCEPTUAL PRODUCT DEMO ]</span>
              </div>
              <button
                onClick={() => setHeroAutoPlay(!heroAutoPlay)}
                className="text-[10px] text-text-muted hover:text-primary px-2 py-0.5 rounded border border-border-muted"
              >
                {heroAutoPlay ? 'PAUSE TEASER' : 'PLAY TEASER'}
              </button>
            </div>

            <div className="grid grid-cols-5 gap-1 font-mono text-[10px]">
              {HERO_DEMO_STEPS.map((step, idx) => (
                <button
                  key={step.id}
                  onClick={() => {
                    setHeroStep(idx);
                    setHeroAutoPlay(false);
                  }}
                  className={`p-2 rounded border text-center transition-all ${
                    heroStep === idx
                      ? 'bg-primary text-surface-lowest border-primary font-bold shadow-md'
                      : 'bg-surface-dim border-border-muted text-text-muted hover:text-text-primary'
                  }`}
                >
                  0{idx + 1}. {step.tabName}
                </button>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-surface-dim border border-border-muted space-y-3 font-mono text-xs min-h-[170px] flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-primary uppercase font-bold tracking-widest">
                  STEP 0{heroStep + 1} // {HERO_DEMO_STEPS[heroStep].title}
                </span>
                <span className="px-2 py-0.5 rounded bg-surface border border-border-muted text-[10px] text-emerald-400 font-bold">
                  {HERO_DEMO_STEPS[heroStep].badge}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-surface border border-border-muted text-text-primary text-[11px] font-mono leading-relaxed overflow-x-auto">
                <code>{HERO_DEMO_STEPS[heroStep].content}</code>
              </div>

              <div className="text-[11px] text-text-muted font-sans flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-primary">info</span>
                <span>{HERO_DEMO_STEPS[heroStep].explanation}</span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: VISUAL STAT CALLOUTS */}
        <section
          id="stats"
          ref={addToRefs}
          className="reveal-on-scroll max-w-7xl mx-auto px-6 py-16 border-b border-border-muted space-y-8 scroll-mt-20"
        >
          <div className="text-center max-w-xl mx-auto space-y-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
              Engineered for Enterprise Speed & Scale
            </h2>
            <p className="text-xs text-text-muted font-sans">Tested metrics from Stitch log ingestion and machine learning engines.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-surface-dim border border-border-muted text-center font-mono space-y-1 shadow-md hover:border-primary/50 transition-colors">
              <div className="text-3xl sm:text-4xl font-extrabold text-primary">4.2M</div>
              <div className="text-xs font-bold text-text-primary uppercase tracking-wider">EPS THROUGHPUT</div>
              <div className="text-[10px] text-text-muted">Edge Log Collection Speed</div>
            </div>

            <div className="p-6 rounded-2xl bg-surface-dim border border-border-muted text-center font-mono space-y-1 shadow-md hover:border-primary/50 transition-colors">
              <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400">&lt; 2.5ms</div>
              <div className="text-xs font-bold text-text-primary uppercase tracking-wider">INGEST LATENCY</div>
              <div className="text-[10px] text-text-muted">Zero-Loss Stream Writer</div>
            </div>

            <div className="p-6 rounded-2xl bg-surface-dim border border-border-muted text-center font-mono space-y-1 shadow-md hover:border-primary/50 transition-colors">
              <div className="text-3xl sm:text-4xl font-extrabold text-secondary">1.4s</div>
              <div className="text-xs font-bold text-text-primary uppercase tracking-wider">ANOMALY SCORING</div>
              <div className="text-[10px] text-text-muted">Isolation Forest Engine</div>
            </div>

            <div className="p-6 rounded-2xl bg-surface-dim border border-border-muted text-center font-mono space-y-1 shadow-md hover:border-primary/50 transition-colors">
              <div className="text-3xl sm:text-4xl font-extrabold text-text-primary">6</div>
              <div className="text-xs font-bold text-text-primary uppercase tracking-wider">VENDOR APPLIANCES</div>
              <div className="text-[10px] text-emerald-400">Cisco, Forti, Suricata, pfSense</div>
            </div>
          </div>
        </section>

        {/* SECTION 3: HOW IT WORKS — STREAMLINED PIPELINE WALKTHROUGH */}
        <section
          id="pipeline"
          ref={addToRefs}
          className="reveal-on-scroll max-w-7xl mx-auto px-6 py-16 md:py-24 border-b border-border-muted space-y-10 scroll-mt-20"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-border-muted pb-4">
            <div>
              <div className="text-xs font-mono text-text-muted uppercase tracking-widest">[ PIPELINE WALKTHROUGH ]</div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-text-primary tracking-tight mt-1">
                How It Works
              </h2>
            </div>
            <p className="text-xs text-text-muted font-sans max-w-md">
              From raw syslog bytes to normalized OCSF fields and correlated incidents in 4 stages.
            </p>
          </div>

          <div className="space-y-6">
            {/* Streamlined 4-Stage Selection Bar */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
              {PIPELINE_STAGES.map((stage) => {
                const isActive = activePipelineStage === stage.id;
                return (
                  <button
                    key={stage.id}
                    tabIndex={0}
                    onMouseEnter={() => setActivePipelineStage(stage.id)}
                    onClick={() => setActivePipelineStage(stage.id)}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setActivePipelineStage(stage.id)}
                    className={`p-4 rounded-xl border text-left flex flex-col justify-between h-24 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary ${
                      isActive
                        ? 'bg-primary text-surface-lowest border-primary shadow-xl scale-[1.02] font-bold'
                        : 'bg-surface border-border-muted text-text-muted hover:text-text-primary hover:border-primary/50'
                    }`}
                    aria-label={`Select Stage 0${stage.id}: ${stage.name}`}
                  >
                    <span className="text-[10px] opacity-75">STAGE 0{stage.id}</span>
                    <span className="text-xs font-extrabold leading-tight">{stage.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Active Pipeline Transformation Stream View */}
            <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-border-muted space-y-5 shadow-2xl transition-all duration-200">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-border-muted pb-4 font-mono">
                <div>
                  <span className="text-[10px] text-primary font-bold uppercase tracking-wider">{activePipelineObj.techBadge}</span>
                  <h3 className="text-lg font-bold text-text-primary mt-0.5">{activePipelineObj.title}</h3>
                </div>
                <span className="px-3 py-1 rounded bg-surface-dim border border-border-muted text-xs text-primary font-mono self-start sm:self-auto">
                  {activePipelineObj.filepath}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-text-muted leading-relaxed font-sans">{activePipelineObj.desc}</p>

              <div className="p-4 rounded-xl bg-surface-dim border border-border-muted font-mono text-xs space-y-2">
                <div className="text-text-dim text-[10px] uppercase tracking-wider">[ STAGE OUTPUT DATA STREAM ]</div>
                <div className="text-text-primary font-bold text-xs sm:text-sm">{activePipelineObj.payload}</div>
                <div className="text-emerald-400 text-[11px] pt-1">
                  <span className="text-text-muted">SHA-256 Digest:</span> {activePipelineObj.digest}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: LIVE THREAT VECTORS MAP */}
        <section
          id="threat-map"
          ref={addToRefs}
          className="reveal-on-scroll max-w-7xl mx-auto px-6 py-16 md:py-24 border-b border-border-muted space-y-8 scroll-mt-20"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-border-muted pb-4">
            <div>
              <div className="text-xs font-mono text-text-muted uppercase tracking-widest">[ REAL TELEMETRY ]</div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-text-primary tracking-tight mt-1">
                Live Threat Vectors Map
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
              <div className="px-3 py-1.5 rounded-lg bg-surface-dim border border-border-muted text-text-muted">
                Analyzed Events: <strong className="text-text-primary">{mapEventsCount}</strong>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-surface-dim border border-border-muted text-emerald-400">
                Mapped Locations: <strong>{mappedLocationsCount}</strong>
              </div>
              {unmappedLocationsCount > 0 && (
                <div className="px-3 py-1.5 rounded-lg bg-surface-dim border border-border-muted text-amber-400">
                  Location Unavailable: <strong>{unmappedLocationsCount}</strong>
                </div>
              )}
            </div>
          </div>

          <div className="relative rounded-2xl overflow-hidden border border-border-muted shadow-2xl glass-panel">
            <div ref={mapContainerRef} className="w-full h-[420px] z-10" />
            {isMapLoading && (
              <div className="absolute inset-0 bg-background/70 backdrop-blur-sm z-20 flex items-center justify-center font-mono text-xs text-primary">
                <span className="material-symbols-outlined animate-spin mr-2">sync</span>
                <span>Resolving IP GeoIP Coordinates...</span>
              </div>
            )}
            <div className="p-3 bg-surface-dim border-t border-border-muted font-mono text-[10px] text-text-dim flex flex-wrap justify-between items-center gap-2">
              <span>[ REAL GEOIP RESOLUTION: Only valid lat/long coordinates are rendered. ]</span>
              <span>Esri World Canvas Tiles (No API key required)</span>
            </div>
          </div>
        </section>

        {/* SECTION 5: SECONDARY DEEP PLATFORM INSPECTION DRAWER (COLLAPSIBLE) */}
        <section
          id="inspect"
          ref={addToRefs}
          className="reveal-on-scroll max-w-7xl mx-auto px-6 py-16 border-b border-border-muted space-y-8 scroll-mt-20"
        >
          <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-border-muted space-y-6 shadow-xl text-center">
            <div className="max-w-xl mx-auto space-y-2">
              <div className="text-xs font-mono text-text-muted uppercase tracking-widest">[ TECHNICAL EVALUATOR DRILL-DOWN ]</div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
                Deep Platform Subsystem Inspection
              </h2>
              <p className="text-xs text-text-muted font-sans">
                Explore capabilities, system topology nodes, incident report synthesis, and the financial ROI estimator.
              </p>
            </div>

            <button
              onClick={() => setIsInspectorExpanded(!isInspectorExpanded)}
              className="btn-secondary px-6 py-3 rounded-xl font-mono text-xs font-bold inline-flex items-center gap-2"
              aria-expanded={isInspectorExpanded}
            >
              <span>{isInspectorExpanded ? '[ COLLAPSE SUBSYSTEM INSPECTOR ]' : '[ EXPAND SUBSYSTEM INSPECTOR ]'}</span>
              <span className="material-symbols-outlined text-base">
                {isInspectorExpanded ? 'expand_less' : 'expand_more'}
              </span>
            </button>

            {/* Collapsible Inspection Content */}
            {isInspectorExpanded && (
              <div className="pt-6 border-t border-border-muted text-left space-y-8 animate-fadeIn">
                {/* Subsystem Inspection Navigation Tabs */}
                <div className="flex flex-wrap gap-2 font-mono text-xs border-b border-border-muted pb-3">
                  <button
                    onClick={() => setInspectorTab('capabilities')}
                    className={`px-4 py-2 rounded-lg font-bold transition-all ${
                      inspectorTab === 'capabilities'
                        ? 'bg-primary text-surface-lowest shadow-md'
                        : 'bg-surface-dim border border-border-muted text-text-muted hover:text-text-primary'
                    }`}
                  >
                    1. CAPABILITY SHOWCASE
                  </button>
                  <button
                    onClick={() => setInspectorTab('topology')}
                    className={`px-4 py-2 rounded-lg font-bold transition-all ${
                      inspectorTab === 'topology'
                        ? 'bg-primary text-surface-lowest shadow-md'
                        : 'bg-surface-dim border border-border-muted text-text-muted hover:text-text-primary'
                    }`}
                  >
                    2. TOPOLOGY MAP
                  </button>
                  <button
                    onClick={() => setInspectorTab('incidents')}
                    className={`px-4 py-2 rounded-lg font-bold transition-all ${
                      inspectorTab === 'incidents'
                        ? 'bg-primary text-surface-lowest shadow-md'
                        : 'bg-surface-dim border border-border-muted text-text-muted hover:text-text-primary'
                    }`}
                  >
                    3. INCIDENT STORY & REPORT
                  </button>
                  <button
                    onClick={() => setInspectorTab('estimator')}
                    className={`px-4 py-2 rounded-lg font-bold transition-all ${
                      inspectorTab === 'estimator'
                        ? 'bg-primary text-surface-lowest shadow-md'
                        : 'bg-surface-dim border border-border-muted text-text-muted hover:text-text-primary'
                    }`}
                  >
                    4. ROI ESTIMATOR
                  </button>
                </div>

                {/* TAB 1: CAPABILITIES */}
                {inspectorTab === 'capabilities' && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    <div className="lg:col-span-4 flex flex-col gap-2">
                      {CAPABILITIES_DATA.map((cap) => {
                        const isSelected = activeFeature === cap.id;
                        return (
                          <button
                            key={cap.id}
                            onClick={() => setActiveFeature(cap.id)}
                            className={`p-3 rounded-xl border text-left flex items-center justify-between font-mono text-xs transition-all ${
                              isSelected
                                ? 'bg-surface-container border-primary text-primary font-bold shadow-md'
                                : 'bg-surface-dim border-border-muted text-text-muted hover:text-text-primary'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="material-symbols-outlined text-base">{cap.icon}</span>
                              <span>{cap.name}</span>
                            </div>
                            <span className="text-[9px] text-text-dim">{cap.badge}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="lg:col-span-8 p-6 rounded-xl bg-surface-dim border border-border-muted space-y-4">
                      <div className="flex justify-between items-center border-b border-border-muted pb-3 font-mono">
                        <div>
                          <span className="text-[10px] text-primary uppercase font-bold">{activeCapabilityObj.badge}</span>
                          <h3 className="text-base font-bold text-text-primary mt-0.5">{activeCapabilityObj.title}</h3>
                        </div>
                        <Link to={activeCapabilityObj.route} className="btn-secondary px-3 py-1 text-xs font-mono rounded-lg">
                          Open Route
                        </Link>
                      </div>

                      <p className="text-xs text-text-muted font-sans leading-relaxed">{activeCapabilityObj.desc}</p>

                      <div className="grid grid-cols-3 gap-2 font-mono text-center text-xs">
                        {activeCapabilityObj.metrics.map((m, i) => (
                          <div key={i} className="p-2.5 rounded-lg bg-surface border border-border-muted">
                            <div className="text-[9px] text-text-dim uppercase">{m.label}</div>
                            <div className="font-bold text-primary text-xs mt-0.5">{m.val}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: TOPOLOGY */}
                {inspectorTab === 'topology' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 font-mono text-xs">
                      {ARCHITECTURE_NODES.map((node) => {
                        const isSelected = activeArchNode === node.id;
                        return (
                          <button
                            key={node.id}
                            onClick={() => setActiveArchNode(node.id)}
                            className={`p-3 rounded-xl border font-bold text-center flex flex-col justify-between h-20 transition-all ${
                              isSelected
                                ? 'bg-primary text-surface-lowest border-primary shadow-xl font-bold'
                                : 'bg-surface border-border-muted text-text-muted hover:text-text-primary'
                            }`}
                          >
                            <span className="text-[9px] opacity-70 uppercase">{node.type}</span>
                            <span className="text-xs leading-tight">{node.name}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="p-6 rounded-xl bg-surface-dim border border-border-muted space-y-3 font-mono">
                      <div className="flex justify-between items-center border-b border-border-muted pb-2">
                        <span className="text-xs font-bold text-text-primary">{activeArchObj.name}</span>
                        <span className="text-[10px] text-emerald-400 font-bold">{activeArchObj.type}</span>
                      </div>
                      <p className="text-xs text-text-muted font-sans leading-relaxed">{activeArchObj.desc}</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                        {activeArchObj.components.map((c, i) => (
                          <div key={i} className="p-2 rounded bg-surface border border-border-muted text-center font-bold text-text-primary text-[10px]">
                            {c}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: INCIDENT STORY & REPORT SYNTHESIS */}
                {inspectorTab === 'incidents' && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                    <div className="lg:col-span-6 space-y-3">
                      {INCIDENT_STORY_STEPS.map((step, idx) => (
                        <div
                          key={step.id}
                          onClick={() => setSelectedIncidentStep(idx)}
                          className={`p-3.5 rounded-xl border cursor-pointer font-mono text-xs transition-all ${
                            selectedIncidentStep === idx
                              ? 'bg-surface-container border-primary shadow-md'
                              : 'bg-surface-dim border-border-muted hover:border-primary/40'
                          }`}
                        >
                          <div className="flex justify-between text-[10px] mb-1">
                            <span className="text-text-dim">{step.time}</span>
                            <span className={`font-bold px-1.5 py-0.5 rounded ${step.badgeColor}`}>{step.type}</span>
                          </div>
                          <div className="font-bold text-text-primary">{step.title}</div>
                        </div>
                      ))}
                    </div>

                    <div className="lg:col-span-6 p-5 rounded-xl bg-surface-dim border border-border-muted font-mono text-xs space-y-3">
                      <div className="text-xs font-bold text-primary border-b border-border-muted pb-2">
                        [ ACTIONABLE INCIDENT REPORT ]
                      </div>
                      <div>
                        <div className="text-[10px] text-text-dim font-bold uppercase">WHAT HAPPENED?</div>
                        <p className="text-text-primary font-sans text-xs mt-0.5">{INCIDENT_STORY_STEPS[selectedIncidentStep].reportWhat}</p>
                      </div>
                      <div>
                        <div className="text-[10px] text-primary font-bold uppercase">SUGGESTED NEXT STEP</div>
                        <div className="p-2.5 rounded bg-surface border border-border-muted text-emerald-400 font-mono text-[11px] font-bold mt-0.5">
                          {INCIDENT_STORY_STEPS[selectedIncidentStep].action}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: ROI ESTIMATOR */}
                {inspectorTab === 'estimator' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center font-mono">
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between text-xs mb-2">
                          <span className="font-bold text-text-primary">Daily Log Volume</span>
                          <span className="text-primary font-bold">{logVolume.toLocaleString()}</span>
                        </div>
                        <input
                          type="range"
                          min="10000"
                          max="10000000"
                          step="10000"
                          value={logVolume}
                          onChange={(e) => setLogVolume(Number(e.target.value))}
                          className="w-full cursor-pointer accent-primary"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-2">
                          <span className="font-bold text-text-primary">Devices Monitored</span>
                          <span className="text-primary font-bold">{devicesMonitored}</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="500"
                          value={devicesMonitored}
                          onChange={(e) => setDevicesMonitored(Number(e.target.value))}
                          className="w-full cursor-pointer accent-primary"
                        />
                      </div>
                    </div>

                    <div className="p-6 rounded-xl bg-surface border border-border-muted text-center space-y-4">
                      <div>
                        <div className="text-[10px] text-text-dim uppercase">Hours Saved / Month</div>
                        <div className="text-2xl font-bold text-text-primary">{hoursSaved} hrs</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-text-dim uppercase">MTTR Reduction</div>
                        <div className="text-2xl font-bold text-emerald-400">{mttrReduction}%</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-text-dim uppercase">Est. Monthly Savings</div>
                        <div className="text-2xl font-bold text-primary">${monthlySavings} / mo</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* SECTION 6: CLOSING CTA */}
        <section
          ref={addToRefs}
          className="reveal-on-scroll max-w-7xl mx-auto px-6 py-20 text-center space-y-6"
        >
          <h2 className="text-3xl sm:text-5xl font-extrabold text-text-primary tracking-tight font-sans">
            Ready to Catch Hidden Log Threats?
          </h2>
          <p className="text-xs sm:text-sm text-text-muted font-sans max-w-md mx-auto">
            Access the Stitch SOC Console to ingest raw logs, run anomaly scoring, and view correlated incident graphs.
          </p>
          <div className="pt-2 font-mono text-xs font-bold">
            <Link
              to="/dashboard"
              className="btn-primary px-8 py-4 rounded-xl inline-flex items-center gap-2 shadow-xl text-base"
            >
              <span>[ OPEN SOC CONSOLE ]</span>
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </Link>
          </div>
        </section>

      </main>

      {/* Editorial Footer */}
      <footer className="w-full py-8 border-t border-border-muted bg-surface-dim text-center text-text-dim text-xs font-mono">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="font-extrabold text-base text-text-primary font-mono tracking-tight">STITCH SECURITY PLATFORM</div>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/login" className="hover:text-primary transition-colors">Sign In</Link>
            <Link to="/register" className="hover:text-primary transition-colors">Register</Link>
            <Link to="/threat-intel" className="hover:text-primary transition-colors">Threat Intel</Link>
            <Link to="/dashboard" className="hover:text-primary transition-colors">SOC Console</Link>
          </div>
          <div>© 2026 Stitch Platform. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}

// ----------------------------------------------------------------------
// PRESERVED DATA DEFINITIONS
// ----------------------------------------------------------------------

const HERO_DEMO_STEPS = [
  {
    id: 'raw',
    tabName: 'RAW LOG',
    title: 'Raw Syslog Ingestion',
    badge: 'UNPARSED TEXT',
    content: '%ASA-4-106023: Deny tcp src outside:185.220.100.22/51422 dst inside:10.0.0.10/80',
    explanation: 'Raw firewall syslog payload captured from edge listener.',
  },
  {
    id: 'format',
    tabName: 'FORMAT',
    title: 'Vendor Format Auto-Detect',
    badge: 'CISCO ASA',
    content: 'Vendor: Cisco ASA | Format: Access-List Deny | Header: %ASA-4-106023',
    explanation: 'Dynamic parser detects appliance signature automatically.',
  },
  {
    id: 'parse',
    tabName: 'PARSED',
    title: 'Attribute Extraction',
    badge: 'FIELD PARSER',
    content: 'SrcIP: 185.220.100.22 | SrcPort: 51422 | DstIP: 10.0.0.10 | Action: DENY',
    explanation: 'Key network attributes extracted into standard data types.',
  },
  {
    id: 'normalize',
    tabName: 'NORMALIZED',
    title: 'OCSF 1.1 Schema Mapping',
    badge: 'UNIFIED EVENT',
    content: 'UnifiedEvent(type="network:firewall_deny", severity="HIGH", threat_score=88.5)',
    explanation: 'Mapped to unified OCSF 1.1 object structure.',
  },
  {
    id: 'incident',
    tabName: 'ACTIONABLE',
    title: 'Correlated Incident',
    badge: 'INCIDENT #INC-4910',
    content: '12 Denied Connections from 185.220.100.22 within 15 mins (Brute Force Pattern)',
    explanation: 'Events linked into incident graph with suggested firewall playbook.',
  },
];

const PIPELINE_STAGES = [
  {
    id: 1,
    name: 'Capture & Hash',
    title: 'Stage 1: Raw Log Capture & SHA-256 Digest',
    filepath: 'app/storage/raw_writer.py',
    desc: 'Raw syslog payloads are captured from edge devices and assigned a SHA-256 digest before parsing.',
    payload: '%ASA-4-106023: Deny tcp src outside:185.220.100.22/51422 dst inside:10.0.0.10/80',
    digest: 'a4ea94c43d9dc8c7753255ca0d6e2bb2093560056c170d2f992edb7d36071e3f',
    techBadge: 'Edge Ingestion',
  },
  {
    id: 2,
    name: 'Identify & Parse',
    title: 'Stage 2: Vendor Auto-Detection & Key Extraction',
    filepath: 'app/parsers/dynamic_parser.py',
    desc: 'Extractors identify Cisco ASA, Fortinet, Suricata, and pfSense log formats automatically.',
    payload: 'Detected Format: Cisco ASA | Action: DENY | Protocol: TCP | SrcIP: 185.220.100.22',
    digest: '3c8e92ba8712df649f109281a8ef1284561029e8471b6501928471209e847120',
    techBadge: 'Vendor Parsing',
  },
  {
    id: 3,
    name: 'Normalize OCSF',
    title: 'Stage 3: OCSF 1.1 Field Normalization',
    filepath: 'app/normalization/schema.py',
    desc: 'Maps raw vendor attributes into standard OCSF 1.1 UnifiedEvent objects with ISO timestamps.',
    payload: 'UnifiedEvent(event_type="cisco_asa:deny", severity="HIGH", threat_score=88.5)',
    digest: '7a910284712b6501928471209e847120f2b259a563db460ee9d7b9ddf5b18d89',
    techBadge: 'OCSF Schema',
  },
  {
    id: 4,
    name: 'Detect & Correlate',
    title: 'Stage 4: Anomaly Scoring & Incident Graph',
    filepath: 'app/detection/anomaly_engine.py',
    desc: 'Evaluates payload entropy and clusters alerts across 15-minute sliding windows into single incident timelines.',
    payload: 'Incident Cluster #INC-4910: SrcIP 185.220.100.22 | Events: 12 | MITRE: T1110',
    digest: '488480b6ca3f120649476bb2499f7fc43fbe08c16bec56b1d74517b1c38e7477',
    techBadge: 'Anomaly Engine',
  },
];

const CAPABILITIES_DATA = [
  {
    id: 'ingestion',
    name: 'Explore System Logs',
    icon: 'database',
    badge: 'OCSF SEARCH',
    title: 'Centralized Log Exploration & Search',
    desc: 'Filter raw syslog text or search by OCSF standard fields, severity levels, source IPs, and vendor formats.',
    metrics: [
      { label: 'Latency', val: '< 5ms' },
      { label: 'Search Mode', val: 'OCSF Key-Value' },
      { label: 'Filters', val: 'Real-Time' },
    ],
    route: '/log-explorer',
  },
  {
    id: 'normalization',
    name: 'Standardize Fields',
    icon: 'schema',
    badge: 'OCSF 1.1 SCHEMA',
    title: 'Standardize Multi-Vendor Schemas',
    desc: 'Converts Cisco ASA, Fortinet, Suricata, and pfSense attributes into unified OCSF objects.',
    metrics: [
      { label: 'Schema', val: 'OCSF 1.1' },
      { label: 'Vendors', val: 'Cisco, Forti, Suricata' },
      { label: 'Mapping', val: '100%' },
    ],
    route: '/log-explorer',
  },
  {
    id: 'detection',
    name: 'Detect Anomalies',
    icon: 'psychology',
    badge: 'ISOLATION FOREST',
    title: 'Machine Learning Anomaly Engine',
    desc: 'Evaluates payload entropy and connection velocity against pre-trained ML baselines.',
    metrics: [
      { label: 'Engine', val: 'Isolation Forest' },
      { label: 'Scale', val: '0.0 - 100.0' },
      { label: 'Latency', val: '1.4s' },
    ],
    route: '/dashboard',
  },
  {
    id: 'correlation',
    name: 'Correlate Alerts',
    icon: 'hub',
    badge: '15-MIN GRAPH',
    title: 'Multi-Vector Alert Correlation',
    desc: 'Clusters related security alerts across 15-minute sliding windows sharing source IPs.',
    metrics: [
      { label: 'Window', val: '15 Mins' },
      { label: 'Entity', val: 'Source IP' },
      { label: 'Reduction', val: 'Significant' },
    ],
    route: '/dashboard',
  },
  {
    id: 'forensics',
    name: 'Verify Audit Chains',
    icon: 'verified',
    badge: 'SHA-256 MERKLE',
    title: 'Cryptographic Log Verification',
    desc: 'Verifies log payload immutability using SHA-256 Merkle leaf hashing.',
    metrics: [
      { label: 'Algorithm', val: 'SHA-256' },
      { label: 'Verdict', val: 'Tamper-Evident' },
      { label: 'Tree', val: 'Merkle Chain' },
    ],
    route: '/forensics',
  },
  {
    id: 'response',
    name: 'Explainable Containment',
    icon: 'shield',
    badge: 'XAI PLAYBOOKS',
    title: 'Feature Attribution & Containment Guidance',
    desc: 'Delivers feature attribution z-scores explaining why an incident was flagged.',
    metrics: [
      { label: 'Attribution', val: 'Feature Z-Score' },
      { label: 'Playbook', val: 'Suggested Steps' },
      { label: 'Output', val: 'CLI Syntax' },
    ],
    route: '/dashboard',
  },
];

const ARCHITECTURE_NODES = [
  {
    id: 'sources',
    name: 'Log Sources',
    type: 'EDGE ENTRY',
    desc: 'Perimeter network devices sending raw syslog streams.',
    components: ['Cisco ASA Firewall', 'Fortinet FortiGate', 'Suricata IDS', 'pfSense Gateway'],
  },
  {
    id: 'ingestion',
    name: 'Log Collection',
    type: 'STORAGE WRITER',
    desc: 'High-throughput edge log capture writing raw compressed payload archives.',
    components: ['Raw Writer Service', 'SHA-256 Leaf Hasher', 'Compressed Storage'],
  },
  {
    id: 'normalize',
    name: 'Field Normalization',
    type: 'SCHEMA TRANSFORMER',
    desc: 'Vendor format auto-detection engine mapping raw key-value pairs into OCSF 1.1.',
    components: ['Dynamic Vendor Parser', 'OCSF Field Transformer', 'Schema Validator'],
  },
  {
    id: 'detection',
    name: 'Threat Detection',
    type: 'ML SCORING',
    desc: 'Isolation Forest engine computing anomaly scores.',
    components: ['Isolation Forest Model', 'Rule Evaluator', 'Feature Z-Score Engine'],
  },
  {
    id: 'correlate',
    name: 'Alert Grouping',
    type: 'INCIDENT GRAPH',
    desc: 'Multi-vector incident aggregator grouping alerts across 15-minute sliding windows.',
    components: ['15-Min Graph Window', 'IP Matcher', 'Incident Aggregator'],
  },
  {
    id: 'intelligence',
    name: 'GeoIP Mapping',
    type: 'GEOIP RESOLVER',
    desc: 'Offline GeoIP resolver mapping IP subnets to geographic coordinates.',
    components: ['GeoIP Database', 'Esri Tile Renderer', 'Spatial Clusterer'],
  },
  {
    id: 'response',
    name: 'Containment Guidance',
    type: 'PLAYBOOK GENERATOR',
    desc: 'Explainable AI module delivering top feature attribution z-scores.',
    components: ['XAI Explainer Module', 'Playbook Generator', 'SOC Command Center'],
  },
];

const INCIDENT_STORY_STEPS = [
  {
    id: 1,
    time: '14:22:01 UTC',
    type: 'ALERT',
    badgeColor: 'bg-amber-500/20 text-amber-400 border border-amber-500/40',
    title: 'Repeated SSH Auth Denials (T1110)',
    reportWhat: 'An external host initiated high-velocity password attempts against SSH services.',
    action: 'Suggested Step 1: Enforce temporary IP block on 185.220.100.22 at perimeter firewall.',
  },
  {
    id: 2,
    time: '14:24:15 UTC',
    type: 'ANOMALY',
    badgeColor: 'bg-rose-500/20 text-rose-400 border border-rose-500/40',
    title: 'High Isolation Forest Anomaly (Score 88.5)',
    reportWhat: 'Machine learning anomaly detector flagged abnormal connection pattern z-score (+4.84).',
    action: 'Suggested Step 2: Inspect egress firewall rules for internal host 10.0.0.10.',
  },
  {
    id: 3,
    time: '14:25:00 UTC',
    type: 'INCIDENT',
    badgeColor: 'bg-primary/20 text-primary border border-primary/40',
    title: 'Incident Cluster #INC-4910 Correlated',
    reportWhat: 'Stitch aggregated 12 isolated security events sharing IP 185.220.100.22 into a single incident timeline.',
    action: 'Suggested Step 3: Run generated CLI containment syntax: cisco-asa# access-list outside_acl deny ip host 185.220.100.22 any',
  },
];
