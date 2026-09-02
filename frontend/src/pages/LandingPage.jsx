import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { api } from '../services/api';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export function LandingPage() {
  const { theme, setTheme } = useTheme();

  // 1. Hero Conceptual Product Demo State
  const [heroStep, setHeroStep] = useState(0);
  const [heroAutoPlay, setHeroAutoPlay] = useState(true);

  // Auto-advance hero conceptual transformation demo
  useEffect(() => {
    if (!heroAutoPlay) return;
    const timer = setInterval(() => {
      setHeroStep((prev) => (prev + 1) % HERO_DEMO_STEPS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [heroAutoPlay]);

  // 2. 6-Stage Processing Pipeline State
  const [activePipelineStage, setActivePipelineStage] = useState(1);

  // 3. Capabilities Tour State
  const [activeFeature, setActiveFeature] = useState('ingestion');

  // 4. System Topology Node State
  const [activeArchNode, setActiveArchNode] = useState('ingestion');

  // 5. Financial Impact Estimator State (Formulas & bounds 100% UNCHANGED)
  const [logVolume, setLogVolume] = useState(500000);
  const [devicesMonitored, setDevicesMonitored] = useState(25);

  const hoursSaved = ((logVolume * 0.001 * 0.85 * 3.5 * 30) / 60).toFixed(1);
  const mttrReduction = Math.min(85, (50 + devicesMonitored * 0.2)).toFixed(1);
  const monthlySavings = (hoursSaved * 65).toLocaleString('en-US', { maximumFractionDigits: 0 });

  // 6. Investigation Story State
  const [selectedIncidentStep, setSelectedIncidentStep] = useState(2);

  // 7. Real Data-Driven Threat Map State
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerLayerRef = useRef(null);
  const tileLayerRef = useRef(null);

  const [mapEventsCount, setMapEventsCount] = useState(0);
  const [mappedLocationsCount, setMappedLocationsCount] = useState(0);
  const [unmappedLocationsCount, setUnmappedLocationsCount] = useState(0);
  const [isMapLoading, setIsMapLoading] = useState(true);

  // Initialize Leaflet Map with Esri World Canvas Tiles (No API key required)
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

  // Update map tile theme
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    const tileUrl =
      theme === 'sage'
        ? 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}'
        : 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';
    tileLayerRef.current.setUrl(tileUrl);
  }, [theme]);

  // Fetch real events and resolve GeoIP locations dynamically
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

      {/* Editorial Navigation Header */}
      <header className="w-full bg-background/90 backdrop-blur-md border-b border-border-muted sticky top-0 z-50 py-4 px-6 max-w-7xl mx-auto flex justify-between items-center transition-colors">
        <Link to="/" className="font-extrabold text-xl text-primary tracking-tighter flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-surface-dim border border-border-muted flex items-center justify-center text-primary shadow-sm">
            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              security
            </span>
          </div>
          <span className="font-mono tracking-tight text-text-primary font-bold">STITCH</span>
          <span className="text-[10px] font-mono border border-border-muted px-2 py-0.5 rounded text-text-muted hidden sm:inline-block">
            LOG INTELLIGENCE
          </span>
        </Link>

        {/* Chapter Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-mono font-bold tracking-wider text-text-muted">
          <a href="#pipeline" className="hover:text-primary transition-colors">PIPELINE</a>
          <a href="#capabilities" className="hover:text-primary transition-colors">CAPABILITIES</a>
          <a href="#topology" className="hover:text-primary transition-colors">TOPOLOGY</a>
          <a href="#threat-map" className="hover:text-primary transition-colors">THREAT MAP</a>
          <a href="#estimator" className="hover:text-primary transition-colors">ESTIMATOR</a>
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

          <Link to="/login" className="btn-secondary px-4 py-1.5 rounded-lg text-xs font-bold font-mono">
            Sign In
          </Link>
          <Link to="/dashboard" className="btn-primary px-4 py-1.5 rounded-lg text-xs font-bold font-mono flex items-center gap-1">
            <span>SOC Console</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>
      </header>

      {/* Mobile Sticky Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border-muted z-40 md:hidden flex justify-around py-2 px-1 shadow-lg">
        <a href="#pipeline" className="flex flex-col items-center text-text-muted hover:text-primary">
          <span className="material-symbols-outlined text-lg">schema</span>
          <span className="text-[10px] font-mono mt-0.5">Pipeline</span>
        </a>
        <a href="#capabilities" className="flex flex-col items-center text-text-muted hover:text-primary">
          <span className="material-symbols-outlined text-lg">grid_view</span>
          <span className="text-[10px] font-mono mt-0.5">Features</span>
        </a>
        <a href="#topology" className="flex flex-col items-center text-text-muted hover:text-primary">
          <span className="material-symbols-outlined text-lg">hub</span>
          <span className="text-[10px] font-mono mt-0.5">Topology</span>
        </a>
        <a href="#threat-map" className="flex flex-col items-center text-text-muted hover:text-primary">
          <span className="material-symbols-outlined text-lg">public</span>
          <span className="text-[10px] font-mono mt-0.5">Map</span>
        </a>
        <a href="#estimator" className="flex flex-col items-center text-text-muted hover:text-primary">
          <span className="material-symbols-outlined text-lg">calculate</span>
          <span className="text-[10px] font-mono mt-0.5">Impact</span>
        </a>
      </nav>

      <main className="flex-grow relative z-10 pb-20 md:pb-0">
        
        {/* HERO SECTION — WHAT IS STITCH? */}
        <section className="max-w-7xl mx-auto px-6 pt-12 pb-16 md:pt-20 md:pb-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center border-b border-border-muted">
          
          {/* Editorial Value Proposition */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 bg-surface-dim px-3.5 py-1 rounded-full border border-border-muted font-mono text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-bold text-text-primary uppercase tracking-widest">[ SYSTEM TELEMETRY & SECURITY PLATFORM ]</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold text-text-primary tracking-tight leading-[1.08] font-sans">
              Your logs.<br />
              <span className="text-primary underline decoration-primary/40 underline-offset-8">Understood.</span> Investigated.
            </h1>

            <p className="text-base sm:text-lg text-text-muted leading-relaxed font-sans max-w-xl">
              Stitch automatically collects, parses, standardizes, and analyzes your network firewall and system security logs so you can detect threats and investigate security incidents faster.
            </p>

            <div className="flex flex-wrap gap-4 pt-3 font-mono text-xs font-bold">
              <Link
                to="/dashboard"
                className="btn-primary px-6 py-3.5 rounded-xl flex items-center gap-2 shadow-lg"
              >
                <span>[ ACCESS SOC CONSOLE ]</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
              <a
                href="#pipeline"
                className="btn-secondary px-6 py-3.5 rounded-xl flex items-center gap-2"
              >
                <span>[ SEE HOW IT WORKS ]</span>
                <span className="material-symbols-outlined text-sm">arrow_downward</span>
              </a>
            </div>
          </div>

          {/* Interactive Conceptual Product Demonstration Visual */}
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
                {heroAutoPlay ? 'PAUSE ANIMATION' : 'PLAY ANIMATION'}
              </button>
            </div>

            {/* Step Selection Tabs */}
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

            {/* Active Demo Transformation Box */}
            <div className="p-4 rounded-xl bg-surface-dim border border-border-muted space-y-3 font-mono text-xs min-h-[180px] flex flex-col justify-between">
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

            <div className="p-2.5 rounded-lg bg-surface-dim border border-border-muted text-center font-mono text-[10px] text-text-dim flex justify-between items-center">
              <span>RAW LOG STREAM</span>
              <span className="material-symbols-outlined text-sm text-primary animate-pulse">arrow_forward</span>
              <span>OCSF STRUCTURED EVENT</span>
              <span className="material-symbols-outlined text-sm text-emerald-400 animate-pulse">arrow_forward</span>
              <span>ACTIONABLE INCIDENT</span>
            </div>
          </div>

        </section>

        {/* METRICS SUMMARY STRIP */}
        <section className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-4 border-b border-border-muted">
          <div className="p-4 rounded-xl bg-surface-dim border border-border-muted font-mono text-center">
            <div className="text-[10px] text-text-dim uppercase tracking-wider">[ UNIFIED SCHEMA ]</div>
            <div className="text-xl font-bold text-text-primary mt-1">OCSF 1.1</div>
            <div className="text-[10px] text-emerald-400 mt-0.5">Standardized Fields</div>
          </div>
          <div className="p-4 rounded-xl bg-surface-dim border border-border-muted font-mono text-center">
            <div className="text-[10px] text-text-dim uppercase tracking-wider">[ ANOMALY ENGINE ]</div>
            <div className="text-xl font-bold text-secondary mt-1">Isolation Forest</div>
            <div className="text-[10px] text-text-muted mt-0.5">Behavioral ML</div>
          </div>
          <div className="p-4 rounded-xl bg-surface-dim border border-border-muted font-mono text-center">
            <div className="text-[10px] text-text-dim uppercase tracking-wider">[ AUDIT INTEGRITY ]</div>
            <div className="text-xl font-bold text-text-primary mt-1">SHA-256</div>
            <div className="text-[10px] text-emerald-400 mt-0.5">Merkle Verified</div>
          </div>
          <div className="p-4 rounded-xl bg-surface-dim border border-border-muted font-mono text-center">
            <div className="text-[10px] text-text-dim uppercase tracking-wider">[ ALERT GRAPH ]</div>
            <div className="text-xl font-bold text-primary mt-1">15 MIN</div>
            <div className="text-[10px] text-text-muted mt-0.5">Incident Clustering</div>
          </div>
        </section>

        {/* CHAPTER 02 — PIPELINE */}
        <section id="pipeline" className="max-w-7xl mx-auto px-6 py-16 md:py-24 border-b border-border-muted space-y-10 scroll-mt-20">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-border-muted pb-4">
            <div>
              <div className="text-xs font-mono text-text-muted uppercase tracking-widest">[ CHAPTER 02 // PIPELINE ARCHITECTURE ]</div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-text-primary tracking-tight mt-1">
                How Your Logs Become Useful Data
              </h2>
            </div>
            <p className="text-xs text-text-muted font-sans max-w-md">
              Logs arrive from different firewall vendors in different raw formats. Stitch processes each payload through a 6-stage pipeline to parse, validate, and convert it into searchable security data.
            </p>
          </div>

          <div className="space-y-6">
            {/* Interactive Stage Selector Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 font-mono text-xs">
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
                    aria-label={`Select Stage ${stage.num}: ${stage.name}`}
                  >
                    <span className="text-[10px] opacity-75">{stage.num}</span>
                    <span className="text-xs font-extrabold leading-tight">{stage.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Active Pipeline Detail Visual */}
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
                <div className="text-text-dim text-[10px] uppercase tracking-wider">[ STAGE TRANSFORMATION OUTPUT ]</div>
                <div className="text-text-primary font-bold text-xs sm:text-sm">{activePipelineObj.payload}</div>
                <div className="text-emerald-400 text-[11px] pt-1">
                  <span className="text-text-muted">SHA-256 Digest:</span> {activePipelineObj.digest}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CHAPTER 03 — CAPABILITIES */}
        <section id="capabilities" className="max-w-7xl mx-auto px-6 py-16 md:py-24 border-b border-border-muted space-y-10 scroll-mt-20">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-border-muted pb-4">
            <div>
              <div className="text-xs font-mono text-text-muted uppercase tracking-widest">[ CHAPTER 03 // PLATFORM CAPABILITIES ]</div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-text-primary tracking-tight mt-1">
                What You Can Do With Stitch
              </h2>
            </div>
            <p className="text-xs text-text-muted font-sans max-w-md">
              Select or hover over any capability to see how Stitch provides centralized log exploration, automated anomaly scoring, and cryptographic audit verification.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Capability Selector List */}
            <div className="lg:col-span-4 flex flex-col gap-2.5">
              {CAPABILITIES_DATA.map((cap) => {
                const isSelected = activeFeature === cap.id;
                return (
                  <button
                    key={cap.id}
                    tabIndex={0}
                    onMouseEnter={() => setActiveFeature(cap.id)}
                    onClick={() => setActiveFeature(cap.id)}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setActiveFeature(cap.id)}
                    className={`p-3.5 rounded-xl border text-left transition-all duration-150 flex items-center justify-between group focus:outline-none focus:ring-2 focus:ring-primary ${
                      isSelected
                        ? 'bg-surface-container border-primary shadow-lg ring-1 ring-primary/40'
                        : 'bg-surface-dim border-border-muted hover:border-primary/40 hover:bg-surface-hover'
                    }`}
                    aria-label={`Select capability: ${cap.name}`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                          isSelected ? 'bg-primary text-surface-lowest' : 'bg-surface border border-border-muted text-text-muted group-hover:text-primary'
                        }`}
                      >
                        <span className="material-symbols-outlined text-lg">{cap.icon}</span>
                      </div>
                      <div>
                        <div className={`font-mono text-xs font-bold ${isSelected ? 'text-primary' : 'text-text-primary'}`}>
                          {cap.name}
                        </div>
                        <div className="text-[9px] text-text-dim font-mono">{cap.badge}</div>
                      </div>
                    </div>
                    <span className={`material-symbols-outlined text-sm transition-transform ${isSelected ? 'text-primary translate-x-1' : 'text-text-dim'}`}>
                      chevron_right
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Interactive Capability Detail Visual */}
            <div className="lg:col-span-8 glass-panel rounded-2xl p-6 sm:p-8 border border-border-muted shadow-2xl space-y-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-border-muted pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-primary text-xl">{activeCapabilityObj.icon}</span>
                    <h3 className="text-lg font-bold text-text-primary">{activeCapabilityObj.title}</h3>
                  </div>
                  <p className="text-xs text-text-muted font-sans">{activeCapabilityObj.desc}</p>
                </div>
                <Link
                  to={activeCapabilityObj.route}
                  className="btn-secondary px-4 py-2 rounded-xl text-xs font-mono font-bold self-start sm:self-auto flex items-center gap-1.5"
                >
                  <span>Open Feature</span>
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                </Link>
              </div>

              {/* Workflow Flow Steps */}
              <div className="space-y-2 font-mono">
                <div className="text-[10px] text-text-dim uppercase tracking-wider">[ FEATURE WORKFLOW ]</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-center">
                  {activeCapabilityObj.flow.map((step, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-surface border border-border-muted space-y-1">
                      <div className="text-[9px] text-text-dim">STEP 0{i + 1}</div>
                      <div className="font-bold text-text-primary text-[11px]">{step}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-3 gap-3 font-mono text-center pt-1">
                {activeCapabilityObj.metrics.map((m, i) => (
                  <div key={i} className="p-3 rounded-xl bg-surface-dim border border-border-muted">
                    <div className="text-[10px] text-text-dim uppercase">{m.label}</div>
                    <div className="text-base font-extrabold text-primary mt-0.5">{m.val}</div>
                  </div>
                ))}
              </div>

              {/* Operational Value & Subsystem Connection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono pt-2 border-t border-border-muted">
                <div className="p-3.5 rounded-xl bg-surface-dim border border-border-muted space-y-1">
                  <div className="text-amber-400 font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">shield</span>
                    <span>Problem Solved</span>
                  </div>
                  <p className="text-text-muted font-sans text-xs">{activeCapabilityObj.problem}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-surface-dim border border-border-muted space-y-1">
                  <div className="text-primary font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">hub</span>
                    <span>Platform Connection</span>
                  </div>
                  <p className="text-text-muted font-sans text-xs">{activeCapabilityObj.connection}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CHAPTER 04 — TOPOLOGY */}
        <section id="topology" className="max-w-7xl mx-auto px-6 py-16 md:py-24 border-b border-border-muted space-y-10 scroll-mt-20">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-border-muted pb-4">
            <div>
              <div className="text-xs font-mono text-text-muted uppercase tracking-widest">[ CHAPTER 04 // SYSTEM TOPOLOGY ]</div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-text-primary tracking-tight mt-1">
                See How Everything Connects
              </h2>
            </div>
            <p className="text-xs text-text-muted font-sans max-w-md">
              Inspect how data flows through Stitch subsystems from perimeter syslog devices to normalized alert correlation and explainable containment playbooks.
            </p>
          </div>

          <div className="max-w-5xl mx-auto space-y-8">
            {/* Topology Node Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 font-mono text-xs">
              {ARCHITECTURE_NODES.map((node) => {
                const isSelected = activeArchNode === node.id;
                return (
                  <button
                    key={node.id}
                    tabIndex={0}
                    onMouseEnter={() => setActiveArchNode(node.id)}
                    onClick={() => setActiveArchNode(node.id)}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setActiveArchNode(node.id)}
                    className={`p-3 rounded-xl border font-bold text-center flex flex-col justify-between h-20 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary ${
                      isSelected
                        ? 'bg-primary text-surface-lowest border-primary shadow-xl scale-[1.03] ring-2 ring-primary/40'
                        : 'bg-surface border-border-muted text-text-muted hover:text-text-primary hover:border-primary/50'
                    }`}
                    aria-label={`Select Topology Node: ${node.name}`}
                  >
                    <span className="text-[9px] opacity-70 uppercase">{node.type}</span>
                    <span className="text-xs font-extrabold leading-tight">{node.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Architecture Node Inspector */}
            <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-border-muted space-y-5 shadow-2xl">
              <div className="flex justify-between items-center border-b border-border-muted pb-3 font-mono">
                <div>
                  <span className="text-[10px] text-primary uppercase font-bold tracking-wider">{activeArchObj.type}</span>
                  <h3 className="text-lg font-bold text-text-primary mt-0.5">{activeArchObj.name}</h3>
                </div>
                <span className="px-3 py-1 rounded bg-surface-dim border border-border-muted text-xs text-emerald-400 font-bold">
                  ACTIVE SUBSYSTEM
                </span>
              </div>

              <p className="text-xs sm:text-sm text-text-muted leading-relaxed font-sans">{activeArchObj.desc}</p>

              <div className="space-y-2 font-mono text-xs">
                <div className="text-[10px] text-text-dim uppercase tracking-wider">[ INTERNAL COMPONENT MODULES ]</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {activeArchObj.components.map((c, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-surface-dim border border-border-muted text-center font-bold text-text-primary text-[11px]">
                      {c}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* LIVE THREAT VECTORS MAP SECTION */}
        <section id="threat-map" className="max-w-7xl mx-auto px-6 py-16 md:py-24 border-b border-border-muted space-y-8 scroll-mt-20">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-border-muted pb-4">
            <div>
              <div className="text-xs font-mono text-text-muted uppercase tracking-widest">[ REAL DATA-DRIVEN TELEMETRY ]</div>
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
              <span>[ REAL GEOIP RESOLUTION: Only valid lat/long coordinates are rendered. Unresolvable IPs are excluded. ]</span>
              <span>Esri World Canvas Tiles (No API key required)</span>
            </div>
          </div>
        </section>

        {/* INCIDENT STORYTELLING & REPORT SYNTHESIS */}
        <section className="max-w-7xl mx-auto px-6 py-16 md:py-24 border-b border-border-muted space-y-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-border-muted pb-4">
            <div>
              <div className="text-xs font-mono text-text-muted uppercase tracking-widest">[ INVESTIGATION STORYTELLING ]</div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-text-primary tracking-tight mt-1">
                How Alerts Become Incidents & Reports
              </h2>
            </div>
            <p className="text-xs text-text-muted font-sans max-w-md">
              Isolated firewall log entries can easily be missed. Stitch clusters related events across sliding time windows to construct single incident timelines and suggested remediation steps.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Timeline Events Column (Span 6) */}
            <div className="lg:col-span-6 glass-panel rounded-2xl p-6 border border-border-muted space-y-4 shadow-2xl">
              <div className="text-xs font-mono font-bold text-text-primary uppercase tracking-wider border-b border-border-muted pb-3 flex justify-between items-center">
                <span>[ CORRELATED EVENT TIMELINE ]</span>
                <span className="text-rose-400">HIGH SEVERITY INCIDENT</span>
              </div>

              <div className="space-y-3 font-mono text-xs">
                {INCIDENT_STORY_STEPS.map((step, idx) => (
                  <div
                    key={step.id}
                    onClick={() => setSelectedIncidentStep(idx)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      selectedIncidentStep === idx
                        ? 'bg-surface-container border-primary shadow-md'
                        : 'bg-surface-dim border-border-muted hover:border-primary/40'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] text-text-dim">{step.time}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${step.badgeColor}`}>
                        {step.type}
                      </span>
                    </div>
                    <div className="font-bold text-text-primary">{step.title}</div>
                    <div className="text-[11px] text-text-muted font-sans mt-0.5">{step.summary}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Generated Report Output Preview (Span 6) */}
            <div className="lg:col-span-6 glass-panel rounded-2xl p-6 border border-border-muted space-y-4 shadow-2xl flex flex-col justify-between">
              <div>
                <div className="text-xs font-mono font-bold text-primary uppercase tracking-wider border-b border-border-muted pb-3 flex justify-between items-center">
                  <span>[ ACTIONABLE INCIDENT REPORT ]</span>
                  <span className="text-emerald-400">SOC PLAYBOOK READY</span>
                </div>

                <div className="space-y-4 pt-3 font-mono text-xs">
                  <div>
                    <div className="text-[10px] text-text-dim uppercase font-bold">WHAT HAPPENED?</div>
                    <p className="text-text-primary font-sans text-xs mt-1 leading-relaxed">
                      {INCIDENT_STORY_STEPS[selectedIncidentStep].reportWhat}
                    </p>
                  </div>

                  <div>
                    <div className="text-[10px] text-text-dim uppercase font-bold">WHY DOES IT MATTER?</div>
                    <p className="text-text-muted font-sans text-xs mt-1 leading-relaxed">
                      {INCIDENT_STORY_STEPS[selectedIncidentStep].reportWhy}
                    </p>
                  </div>

                  <div>
                    <div className="text-[10px] text-text-dim uppercase font-bold">SUPPORTING EVIDENCE</div>
                    <div className="p-3 rounded-lg bg-surface-dim border border-border-muted font-mono text-[11px] text-text-primary mt-1">
                      {INCIDENT_STORY_STEPS[selectedIncidentStep].evidence}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-primary uppercase font-bold">SUGGESTED NEXT STEPS</div>
                    <div className="p-3 rounded-lg bg-surface-dim border border-border-muted font-mono text-[11px] text-emerald-400 font-bold mt-1">
                      {INCIDENT_STORY_STEPS[selectedIncidentStep].action}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-border-muted flex justify-between items-center text-[11px] font-mono text-text-dim">
                <span>INCIDENT CLUSTER #INC-4910</span>
                <Link to="/dashboard" className="text-primary font-bold hover:underline flex items-center gap-1">
                  <span>Open in SOC Console</span>
                  <span className="material-symbols-outlined text-xs">arrow_forward</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* CHAPTER 05 — FINANCIAL ESTIMATOR */}
        <section id="estimator" className="max-w-7xl mx-auto px-6 py-16 md:py-24 space-y-10 scroll-mt-20">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="text-xs font-mono text-text-muted uppercase tracking-widest">[ CHAPTER 05 // FINANCIAL IMPACT ESTIMATOR ]</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-text-primary tracking-tight">
              Estimate the Impact on Your Security Team
            </h2>
            <p className="text-xs sm:text-sm text-text-muted leading-relaxed font-sans">
              Adjust your daily log volume and device count to estimate analyst hours saved and mean time to resolution (MTTR) reduction.
            </p>
          </div>

          <div className="glass-panel rounded-2xl p-6 sm:p-10 max-w-4xl mx-auto border border-border-muted shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Sliders (Range inputs & values 100% UNCHANGED) */}
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-xs font-mono mb-2">
                    <span className="font-bold text-text-primary">Daily Log Volume (Events / Day)</span>
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
                    aria-label="Daily log volume range"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-text-muted mt-1">
                    <span>10K</span>
                    <span>5M</span>
                    <span>10M</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono mb-2">
                    <span className="font-bold text-text-primary">Perimeter Devices Monitored</span>
                    <span className="text-primary font-bold">{devicesMonitored}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="500"
                    value={devicesMonitored}
                    onChange={(e) => setDevicesMonitored(Number(e.target.value))}
                    className="w-full cursor-pointer accent-primary"
                    aria-label="Monitored devices range"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-text-muted mt-1">
                    <span>1</span>
                    <span>250</span>
                    <span>500</span>
                  </div>
                </div>
              </div>

              {/* Output Metric Calculation Cards */}
              <div className="bg-surface-dim rounded-xl p-6 border border-border-muted space-y-6 text-center">
                <div>
                  <div className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-1">Analyst Hours Saved / Month</div>
                  <div className="text-3xl font-extrabold font-mono text-text-primary">{hoursSaved} hrs</div>
                </div>

                <div>
                  <div className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-1">Estimated MTTR Reduction</div>
                  <div className="text-3xl font-extrabold font-mono text-emerald-400">{mttrReduction}%</div>
                </div>

                <div>
                  <div className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-1">Estimated Monthly Cost Savings</div>
                  <div className="text-3xl font-extrabold font-mono text-primary">${monthlySavings} / mo</div>
                </div>
              </div>
            </div>
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
// DATA DEFINITIONS (PRESERVED & ACCURATE TO REAL APPLICATION FUNCTIONALITY)
// ----------------------------------------------------------------------

const HERO_DEMO_STEPS = [
  {
    id: 'raw',
    tabName: 'RAW LOG',
    title: 'Raw Syslog Event Ingestion',
    badge: 'UNPARSED TEXT',
    content: '%ASA-4-106023: Deny tcp src outside:185.220.100.22/51422 dst inside:10.0.0.10/80 by access-group "outside_acl"',
    explanation: 'Raw firewall syslog payload received over edge ingestion listener.',
  },
  {
    id: 'format',
    tabName: 'FORMAT',
    title: 'Vendor Format Auto-Detection',
    badge: 'CISCO ASA DETECTED',
    content: 'Vendor: Cisco ASA | Format: Access-List Deny | Header: %ASA-4-106023',
    explanation: 'Dynamic parser detects appliance signature without manual regex rule setup.',
  },
  {
    id: 'parse',
    tabName: 'PARSED',
    title: 'Attribute & Key Extraction',
    badge: 'FIELD EXTRACTION',
    content: 'SrcIP: 185.220.100.22 | SrcPort: 51422 | DstIP: 10.0.0.10 | DstPort: 80 | Action: DENY',
    explanation: 'Key network attributes extracted into standard data types.',
  },
  {
    id: 'normalize',
    tabName: 'NORMALIZED',
    title: 'OCSF 1.1 Schema Mapping',
    badge: 'UNIFIED EVENT',
    content: 'UnifiedEvent(type="network:firewall_deny", severity="HIGH", threat_score=88.5)',
    explanation: 'Mapped to unified OCSF 1.1 object structure across all firewall vendors.',
  },
  {
    id: 'incident',
    tabName: 'ACTIONABLE',
    title: 'Correlated Security Incident',
    badge: 'INCIDENT CREATED',
    content: 'Incident #INC-4910: 12 Denied Connections from 185.220.100.22 within 15 mins (Brute Force Pattern)',
    explanation: 'Events linked into incident graph with suggested firewall containment playbook.',
  },
];

const PIPELINE_STAGES = [
  {
    id: 1,
    num: '01',
    name: 'Receive Logs',
    title: 'Stage 1: Raw Log Capture & Cryptographic Hashing',
    filepath: 'app/storage/raw_writer.py',
    desc: 'Raw syslog payloads are captured from edge devices and assigned a SHA-256 digest before parsing to ensure tamper-proof audit trails.',
    payload: '%ASA-4-106023: Deny tcp src outside:185.220.100.22/51422 dst inside:10.0.0.10/80 by access-group "outside_acl"',
    digest: 'a4ea94c43d9dc8c7753255ca0d6e2bb2093560056c170d2f992edb7d36071e3f',
    techBadge: 'Edge Ingestion',
  },
  {
    id: 2,
    num: '02',
    name: 'Identify Format',
    title: 'Stage 2: Vendor Format Auto-Detection & Key Parsing',
    filepath: 'app/parsers/dynamic_parser.py',
    desc: 'Extractors identify Cisco ASA, Fortinet, Suricata, and pfSense log formats automatically, isolating IPs, ports, and actions.',
    payload: 'Detected Format: Cisco ASA | Action: DENY | Protocol: TCP | SrcIP: 185.220.100.22 | DstIP: 10.0.0.10',
    digest: '3c8e92ba8712df649f109281a8ef1284561029e8471b6501928471209e847120',
    techBadge: 'Vendor Parsing',
  },
  {
    id: 3,
    num: '03',
    name: 'Organize Fields',
    title: 'Stage 3: OCSF 1.1 Field Normalization',
    filepath: 'app/normalization/schema.py',
    desc: 'Maps raw vendor attributes into standard OCSF 1.1 UnifiedEvent objects with consistent ISO timestamps and severity tiers.',
    payload: 'UnifiedEvent(event_type="cisco_asa:deny", severity="HIGH", threat_level="MEDIUM", threat_score=65.0)',
    digest: '7a910284712b6501928471209e847120f2b259a563db460ee9d7b9ddf5b18d89',
    techBadge: 'OCSF Schema',
  },
  {
    id: 4,
    num: '04',
    name: 'Detect Threats',
    title: 'Stage 4: Isolation Forest Anomaly Scoring',
    filepath: 'app/detection/anomaly_engine.py',
    desc: 'Evaluates connection velocity, payload entropy, and rule triggers against ML behavior baselines to compute normalized threat scores (0.0 to 100.0).',
    payload: 'Threat Score: 88.5 (HIGH) | Triggers: ["repeated_deny", "external_source"] | Feature Attribution: action_code (+4.84 z-score)',
    digest: '9f7fe12c98001dcace31357795d410458710a892bfecdac00aee45bce0a96915',
    techBadge: 'Anomaly Engine',
  },
  {
    id: 5,
    num: '05',
    name: 'Group Incidents',
    title: 'Stage 5: Multi-Vector Alert Correlation',
    filepath: 'app/detection/correlation.py',
    desc: 'Correlates related security events across 15-minute sliding windows sharing source IPs, clustering isolated alerts into single incident timelines.',
    payload: 'Incident Cluster #INC-4910: Source IP 185.220.100.22 | Events: 12 | MITRE Tactics: ["T1110 - Brute Force"]',
    digest: '488480b6ca3f120649476bb2499f7fc43fbe08c16bec56b1d74517b1c38e7477',
    techBadge: 'Alert Correlation',
  },
  {
    id: 6,
    num: '06',
    name: 'Recommend Actions',
    title: 'Stage 6: Explainable AI & Playbooks',
    filepath: 'app/xai/explainer.py',
    desc: 'Delivers feature attribution breakdowns and suggested firewall containment syntax for active security incidents.',
    payload: 'XAI Attribution: "Threat score driven by action_code (+4.84 z-score). Suggested Action: Block 185.220.100.22 at edge firewall."',
    digest: '551029e8471b6501928471209e847120f2b259a563db460ee9d7b9ddf5b18d89',
    techBadge: 'Explainable AI',
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
    problem: 'Eliminates searching through fragmented raw text log files across separate servers.',
    connection: 'Provides instant search and inspection in the Log Explorer UI.',
    metrics: [
      { label: 'Latency', val: '< 5ms' },
      { label: 'Search Mode', val: 'OCSF Key-Value' },
      { label: 'Filter Support', val: 'Real-Time' },
    ],
    flow: ['Perimeter Log', 'Ingestion Listener', 'OCSF Parser', 'Searchable Index'],
    route: '/log-explorer',
  },
  {
    id: 'normalization',
    name: 'Standardize Fields',
    icon: 'schema',
    badge: 'OCSF 1.1 SCHEMA',
    title: 'Standardize Multi-Vendor Schemas',
    desc: 'Converts fragmented Cisco ASA, Fortinet, Suricata, and pfSense attributes into unified OCSF objects with standard ISO timestamps.',
    problem: 'Resolves conflicting field names across different firewall and VPN log formats.',
    connection: 'Feeds clean schema attributes directly into anomaly detection algorithms.',
    metrics: [
      { label: 'Schema', val: 'OCSF 1.1' },
      { label: 'Vendors', val: 'Cisco, Forti, Suricata' },
      { label: 'Precision', val: '100% Mapping' },
    ],
    flow: ['Raw Vendor Text', 'Format Auto-Detect', 'Schema Mapping', 'Unified Event'],
    route: '/log-explorer',
  },
  {
    id: 'detection',
    name: 'Detect Anomalies',
    icon: 'psychology',
    badge: 'ISOLATION FOREST',
    title: 'Machine Learning Anomaly Engine',
    desc: 'Evaluates payload entropy, connection velocity, and port scan heuristics against pre-trained ML behavior baselines.',
    problem: 'Helps analysts spot unusual traffic spikes without relying solely on static rules.',
    connection: 'Generates normalized threat scores ranging from 0.0 to 100.0.',
    metrics: [
      { label: 'Engine', val: 'Isolation Forest' },
      { label: 'Score Scale', val: '0.0 - 100.0' },
      { label: 'Evaluation', val: 'Real-Time' },
    ],
    flow: ['Normalized Event', 'Feature Extraction', 'Z-Score Attribution', 'Threat Score'],
    route: '/dashboard',
  },
  {
    id: 'correlation',
    name: 'Correlate Alerts',
    icon: 'hub',
    badge: '15-MIN SLIDING GRAPH',
    title: 'Multi-Vector Alert Correlation',
    desc: 'Clusters related security alerts across 15-minute sliding windows sharing source IPs into single incident timelines.',
    problem: 'Consolidates dozens of repetitive alerts into a single actionable incident.',
    connection: 'Triggers incident clusters tagged with MITRE ATT&CK tactic IDs.',
    metrics: [
      { label: 'Sliding Window', val: '15 Mins' },
      { label: 'Graph Entity', val: 'Source IP' },
      { label: 'Alert Reduction', val: 'Significant' },
    ],
    flow: ['Single Alert Stream', 'IP Entity Matching', 'Sliding Window', 'Incident Cluster'],
    route: '/dashboard',
  },
  {
    id: 'forensics',
    name: 'Verify Audit Chains',
    icon: 'verified',
    badge: 'SHA-256 MERKLE',
    title: 'Cryptographic Log Verification',
    desc: 'Verifies log payload immutability using SHA-256 Merkle leaf hashing, complete with built-in tamper detection simulation.',
    problem: 'Provides tamper-proof audit trails for forensic verification.',
    connection: 'Generates verifiable cryptographic verdicts in the Forensics module.',
    metrics: [
      { label: 'Algorithm', val: 'SHA-256 Leaf' },
      { label: 'Audit Verdict', val: 'Tamper-Evident' },
      { label: 'Engine', val: 'Merkle Chain' },
    ],
    flow: ['Raw Payload', 'SHA-256 Hashing', 'Merkle Root', 'Audit Verdict'],
    route: '/forensics',
  },
  {
    id: 'response',
    name: 'Explainable Containment',
    icon: 'shield',
    badge: 'XAI PLAYBOOKS',
    title: 'Feature Attribution & Containment Guidance',
    desc: 'Delivers feature attribution z-scores explaining why an incident was flagged, along with suggested firewall mitigation commands.',
    problem: 'Eliminates opaque black-box machine learning decisions for SOC analysts.',
    connection: 'Equips analysts with immediate 3-step firewall block syntax.',
    metrics: [
      { label: 'Attribution', val: 'Feature Z-Score' },
      { label: 'Playbook', val: 'Suggested Steps' },
      { label: 'Output', val: 'Cisco / Forti Commands' },
    ],
    flow: ['Incident Trigger', 'Z-Score Analysis', 'Playbook Generator', 'Analyst Containment'],
    route: '/dashboard',
  },
];

const ARCHITECTURE_NODES = [
  {
    id: 'sources',
    name: 'Log Sources',
    type: 'EDGE ENTRY',
    desc: 'Perimeter network devices sending raw syslog streams over network ports or API endpoints.',
    components: ['Cisco ASA Firewall', 'Fortinet FortiGate VPN', 'Suricata IDS', 'pfSense Gateway'],
  },
  {
    id: 'ingestion',
    name: 'Log Collection',
    type: 'STORAGE WRITER',
    desc: 'High-throughput edge log capture writing raw compressed payload archives while calculating SHA-256 digests.',
    components: ['Raw Writer Service', 'SHA-256 Leaf Hasher', 'Compressed Storage'],
  },
  {
    id: 'normalize',
    name: 'Field Normalization',
    type: 'SCHEMA TRANSFORMER',
    desc: 'Vendor format auto-detection engine mapping raw key-value pairs into standard OCSF 1.1 UnifiedEvent objects.',
    components: ['Dynamic Vendor Parser', 'OCSF Field Transformer', 'Schema Validator'],
  },
  {
    id: 'detection',
    name: 'Threat Detection',
    type: 'ML ANOMALY SCORING',
    desc: 'Isolation Forest machine learning engine computing entropy and connection velocity anomaly scores.',
    components: ['Isolation Forest Model', 'Rule Evaluator', 'Feature Z-Score Engine'],
  },
  {
    id: 'correlate',
    name: 'Alert Grouping',
    type: 'INCIDENT GRAPH',
    desc: 'Multi-vector incident aggregator grouping alerts across 15-minute sliding windows sharing IP entities.',
    components: ['15-Min Graph Window', 'IP Matcher', 'Incident Aggregator'],
  },
  {
    id: 'intelligence',
    name: 'GeoIP Mapping',
    type: 'GEOIP RESOLVER',
    desc: 'Offline GeoIP resolver mapping IP subnets to geographic coordinates and Leaflet map markers.',
    components: ['GeoIP Database', 'Esri Tile Renderer', 'Spatial Clusterer'],
  },
  {
    id: 'response',
    name: 'Containment Guidance',
    type: 'REMEDIATION PLAYBOOK',
    desc: 'Explainable AI module delivering top feature attribution z-scores and step-by-step mitigation commands.',
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
    summary: '10 failed password attempts detected from external IP 185.220.100.22 targeting port 22.',
    reportWhat: 'An external host initiated a high-velocity credential attack against public-facing SSH services.',
    reportWhy: 'Indicates automated brute-force attempts attempting unauthorized administrative system access.',
    evidence: 'Log Event #8819: Cisco ASA %ASA-4-106023 (10 Denials in 45 seconds)',
    action: 'Suggested Step 1: Enforce temporary IP block on 185.220.100.22 at perimeter firewall.',
  },
  {
    id: 2,
    time: '14:24:15 UTC',
    type: 'ANOMALY',
    badgeColor: 'bg-rose-500/20 text-rose-400 border border-rose-500/40',
    title: 'High Isolation Forest Anomaly (Score 88.5)',
    summary: 'Connection velocity and payload entropy exceeded normal baseline z-score threshold (+4.84).',
    reportWhat: 'Machine learning anomaly detector flagged abnormal egress connection pattern following auth failures.',
    reportWhy: 'High entropy payload volume suggests potential lateral scanning or data staging.',
    evidence: 'Anomaly Engine Output: Threat Score 88.5 | Feature action_code z-score +4.84',
    action: 'Suggested Step 2: Inspect egress firewall rules for internal host 10.0.0.10.',
  },
  {
    id: 3,
    time: '14:25:00 UTC',
    type: 'INCIDENT',
    badgeColor: 'bg-primary/20 text-primary border border-primary/40',
    title: 'Incident Cluster #INC-4910 Correlated',
    summary: 'Sliding 15-minute graph correlated auth denials, firewall denies, and anomaly score into single incident.',
    reportWhat: 'Stitch aggregated 12 isolated security events sharing IP 185.220.100.22 into a single incident timeline.',
    reportWhy: 'Reduces alert fatigue by synthesizing multiple raw alerts into one actionable SOC case.',
    evidence: 'Incident Cluster #INC-4910: 12 events linked via IP entity graph',
    action: 'Suggested Step 3: Run generated containment CLI command: cisco-asa# access-list outside_acl deny ip host 185.220.100.22 any',
  },
];
