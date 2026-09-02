import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { api } from '../services/api';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export function ThreatIntelPage() {
  const { theme } = useTheme();
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerLayerRef = useRef(null);
  const tileLayerRef = useRef(null);

  const [threatEvents, setThreatEvents] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [unmappedCount, setUnmappedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize Leaflet Map Instance
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [20, 0],
      zoom: 2,
      minZoom: 2,
      maxZoom: 16,
      zoomControl: false,
      attributionControl: true,
    });

    mapInstanceRef.current = map;

    // Tile Layer based on theme (Esri World Canvas: 100% No API Key, No Tokens, No Watermarks)
    const tileUrl =
      theme === 'sage'
        ? 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}'
        : 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';

    const tiles = L.tileLayer(tileUrl, {
      attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
      maxZoom: 16,
    }).addTo(map);

    tileLayerRef.current = tiles;

    // Layer group for threat markers
    const markerGroup = L.layerGroup().addTo(map);
    markerLayerRef.current = markerGroup;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Tile Layer on Theme Change
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;

    const tileUrl =
      theme === 'sage'
        ? 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}'
        : 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';

    tileLayerRef.current.setUrl(tileUrl);
  }, [theme]);

  // Fetch Real Log Events & Resolve GeoIP Locations Dynamically
  const fetchThreatIntelData = async () => {
    try {
      const [eventsRes, incidentsRes] = await Promise.all([
        api.getRecentEvents(100),
        api.getIncidents(20),
      ]);

      const events = eventsRes?.events || [];
      setThreatEvents(events);

      // Extract distinct source IPs from normalized logs
      const distinctIps = Array.from(
        new Set(events.map((e) => e.source_ip).filter((ip) => Boolean(ip) && ip !== 'N/A'))
      );

      const resolvedMap = new Map();
      let unmapped = 0;

      for (const ip of distinctIps) {
        try {
          const geoRes = await api.getGeoIP(ip);
          if (
            geoRes &&
            typeof geoRes.latitude === 'number' &&
            typeof geoRes.longitude === 'number' &&
            !isNaN(geoRes.latitude) &&
            !isNaN(geoRes.longitude)
          ) {
            resolvedMap.set(ip, geoRes);
          } else {
            unmapped += events.filter((e) => e.source_ip === ip).length;
          }
        } catch (err) {
          unmapped += events.filter((e) => e.source_ip === ip).length;
        }
      }

      setUnmappedCount(unmapped);

      // Cluster events by spatial proximity (rounded lat/lng)
      const clusterMap = new Map();

      for (const evt of events) {
        const ip = evt.source_ip;
        if (!ip || !resolvedMap.has(ip)) continue;

        const geo = resolvedMap.get(ip);
        // Key by 0.1 degree grid (~10km) for spatial clustering
        const clusterKey = `${geo.latitude.toFixed(2)},${geo.longitude.toFixed(2)}`;

        if (!clusterMap.has(clusterKey)) {
          clusterMap.set(clusterKey, {
            key: clusterKey,
            latitude: geo.latitude,
            longitude: geo.longitude,
            city: geo.city || 'Unknown Location',
            country: geo.country || 'Global',
            ips: new Set([ip]),
            events: [evt],
            maxThreatScore: evt.threat_score || 0.0,
            maxThreatLevel: (evt.threat_level || 'LOW').toUpperCase(),
          });
        } else {
          const existing = clusterMap.get(clusterKey);
          existing.ips.add(ip);
          existing.events.push(evt);
          if ((evt.threat_score || 0.0) > existing.maxThreatScore) {
            existing.maxThreatScore = evt.threat_score;
          }
          const levelRank = { CRITICAL: 5, HIGH: 4, MEDIUM: 3, LOW: 2, INFO: 1 };
          const curLevel = (evt.threat_level || 'LOW').toUpperCase();
          if ((levelRank[curLevel] || 0) > (levelRank[existing.maxThreatLevel] || 0)) {
            existing.maxThreatLevel = curLevel;
          }
        }
      }

      const clusterList = Array.from(clusterMap.values()).map((c) => ({
        ...c,
        count: c.events.length,
        ipsList: Array.from(c.ips),
      }));

      setClusters(clusterList);

      // Select first cluster if none selected or current selection missing
      if (clusterList.length > 0) {
        setSelectedCluster((prev) => {
          if (!prev) return clusterList[0];
          const found = clusterList.find((c) => c.key === prev.key);
          return found || clusterList[0];
        });
      }
    } catch (err) {
      console.error('Error fetching Threat Intel data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Poll real log stream every 3 seconds
  useEffect(() => {
    fetchThreatIntelData();
    const timer = setInterval(fetchThreatIntelData, 3000);
    return () => clearInterval(timer);
  }, []);

  // Update Leaflet Marker Layer when clusters change
  useEffect(() => {
    if (!mapInstanceRef.current || !markerLayerRef.current) return;

    const layerGroup = markerLayerRef.current;
    layerGroup.clearLayers();

    clusters.forEach((cluster) => {
      const level = cluster.maxThreatLevel;
      let pulseBg = 'bg-emerald-400';
      let markerBg = 'bg-emerald-500';

      if (level === 'CRITICAL') {
        pulseBg = 'bg-rose-500';
        markerBg = 'bg-rose-600';
      } else if (level === 'HIGH') {
        pulseBg = 'bg-orange-500';
        markerBg = 'bg-orange-500';
      } else if (level === 'MEDIUM') {
        pulseBg = 'bg-amber-400';
        markerBg = 'bg-amber-500';
      } else if (level === 'INFO') {
        pulseBg = 'bg-cyan-400';
        markerBg = 'bg-cyan-500';
      }

      const isSelected = selectedCluster?.key === cluster.key;

      const customIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div class="relative flex items-center justify-center cursor-pointer group">
            <div class="w-7 h-7 rounded-full ${pulseBg} opacity-40 animate-ping absolute"></div>
            <div class="w-6 h-6 rounded-full ${markerBg} text-white font-mono text-[10px] font-extrabold flex items-center justify-center ring-2 ring-slate-900 shadow-xl border border-white/80 transition-transform transform hover:scale-125">
              ${cluster.count > 1 ? cluster.count : ''}
            </div>
            ${
              isSelected
                ? `<div class="w-9 h-9 rounded-full border-2 border-primary animate-pulse absolute -inset-1.5 pointer-events-none"></div>`
                : ''
            }
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([cluster.latitude, cluster.longitude], { icon: customIcon });

      // Click handler to select cluster and center map
      marker.on('click', () => {
        setSelectedCluster(cluster);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.panTo([cluster.latitude, cluster.longitude], { animate: true });
        }
      });

      // Tooltip hover preview
      const tooltipText = `<b>${cluster.city}, ${cluster.country}</b><br/>IPs: ${cluster.ipsList.join(', ')}<br/>Events: ${cluster.count} (${cluster.maxThreatLevel})`;
      marker.bindTooltip(tooltipText, {
        direction: 'top',
        offset: [0, -10],
        className: 'font-mono text-xs shadow-xl rounded-lg border border-border-muted bg-surface-dim text-text-primary px-2 py-1',
      });

      layerGroup.addLayer(marker);
    });
  }, [clusters, selectedCluster]);

  // Aggregate Metrics
  const criticalCount = clusters.filter((c) => c.maxThreatLevel === 'CRITICAL').length;
  const highCount = clusters.filter((c) => c.maxThreatLevel === 'HIGH').length;
  const medCount = clusters.filter((c) => c.maxThreatLevel === 'MEDIUM').length;
  const lowCount = clusters.filter((c) => c.maxThreatLevel === 'LOW' || c.maxThreatLevel === 'INFO').length;

  const handleZoomReset = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([20, 0], 2);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border-muted pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
            Threat Intelligence & <span className="text-primary">Live Threat Vectors</span>
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1 font-sans">
            Real geographic OpenStreetMap & CartoDB vector map driven continuously by live system log GeoIP resolution.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono text-xs px-3 py-1.5 rounded-xl bg-surface-dim border border-border-muted text-emerald-400 font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>{clusters.length} GEOGRAPHIC NODES</span>
          </span>
          <button
            onClick={fetchThreatIntelData}
            className="p-2 rounded-xl border border-border-muted bg-surface-dim text-text-primary hover:border-primary transition-all flex items-center justify-center"
            title="Refresh Threat Intelligence"
          >
            <span className="material-symbols-outlined text-sm">refresh</span>
          </button>
        </div>
      </header>

      {/* SECTION 1: REAL GEOGRAPHIC LEAFLET THREAT MAP */}
      <div className="glass-panel rounded-2xl border border-border-muted overflow-hidden shadow-2xl space-y-0">
        <div className="p-4 border-b border-border-muted bg-surface-dim flex flex-wrap justify-between items-center font-mono text-xs gap-2">
          <div className="flex items-center gap-2 font-bold text-text-primary">
            <span className="material-symbols-outlined text-primary text-sm">public</span>
            <span>REAL GEOGRAPHIC THREAT MAP (ESRI WORLD CANVAS)</span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <span className="text-text-muted">
              Mapped Nodes: <strong className="text-primary">{clusters.length}</strong>
            </span>
            {unmappedCount > 0 && (
              <span className="text-text-dim border-l border-border-muted pl-3">
                Location Unavailable (Internal/Private IPs): <strong className="text-amber-400">{unmappedCount}</strong>
              </span>
            )}
            <button
              onClick={handleZoomReset}
              className="px-2.5 py-1 rounded bg-surface border border-border-muted text-text-muted hover:text-text-primary transition-all font-mono text-[10px] flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-xs">center_focus_strong</span>
              <span>RESET ZOOM</span>
            </button>
          </div>
        </div>

        {/* Real Leaflet World Map Container */}
        <div className="relative w-full h-[400px] sm:h-[480px] bg-surface-dim z-0">
          <div ref={mapContainerRef} className="w-full h-full z-10" />

          {/* Severity Map Legend Overlay */}
          <div className="absolute bottom-4 left-4 z-20 glass-panel p-3 rounded-xl border border-border-muted font-mono text-[10px] space-y-1.5 shadow-xl">
            <div className="font-bold text-text-primary uppercase tracking-wider text-[9px] mb-1">SEVERITY LEGEND</div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span className="text-text-primary">CRITICAL</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
              <span className="text-text-primary">HIGH</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              <span className="text-text-primary">MEDIUM</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span className="text-text-primary">LOW</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
              <span className="text-text-primary">INFO</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: DYNAMIC NODE DETAILS & EVENT ANALYTICS */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Severity Distribution Meters (Span 5) */}
        <div className="md:col-span-5 glass-panel p-6 rounded-2xl border border-border-muted space-y-4 shadow-lg">
          <div className="flex justify-between items-center border-b border-border-muted pb-3">
            <h3 className="text-xs font-mono font-bold text-text-primary uppercase tracking-wider">Geographic Threat Summary</h3>
            <span className="font-mono text-[10px] text-text-muted">Real GeoIP Clusters</span>
          </div>

          <div className="space-y-4 font-mono text-xs">
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-rose-400 font-bold">CRITICAL SEVERITY</span>
                <span className="text-text-primary font-bold">{criticalCount} Nodes</span>
              </div>
              <div className="h-2.5 w-full bg-surface-dim rounded-full overflow-hidden border border-border-muted">
                <div
                  className="h-full bg-rose-500 rounded-full transition-all duration-300"
                  style={{ width: `${clusters.length ? (criticalCount / clusters.length) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-orange-400 font-bold">HIGH SEVERITY</span>
                <span className="text-text-primary font-bold">{highCount} Nodes</span>
              </div>
              <div className="h-2.5 w-full bg-surface-dim rounded-full overflow-hidden border border-border-muted">
                <div
                  className="h-full bg-orange-500 rounded-full transition-all duration-300"
                  style={{ width: `${clusters.length ? (highCount / clusters.length) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-amber-400 font-bold">MEDIUM SEVERITY</span>
                <span className="text-text-primary font-bold">{medCount} Nodes</span>
              </div>
              <div className="h-2.5 w-full bg-surface-dim rounded-full overflow-hidden border border-border-muted">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-300"
                  style={{ width: `${clusters.length ? (medCount / clusters.length) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-emerald-400 font-bold">LOW / INFO SEVERITY</span>
                <span className="text-text-primary font-bold">{lowCount} Nodes</span>
              </div>
              <div className="h-2.5 w-full bg-surface-dim rounded-full overflow-hidden border border-border-muted">
                <div
                  className="h-full bg-emerald-400 rounded-full transition-all duration-300"
                  style={{ width: `${clusters.length ? (lowCount / clusters.length) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-surface-dim border border-border-muted text-center font-mono text-[10px] text-text-dim">
            [ OFF-LINE GEOIP SUBNET DATABASE ACTIVE ]
          </div>
        </div>

        {/* Selected Geographic Node Detail Inspector (Span 7) */}
        <div className="md:col-span-7 glass-panel p-6 rounded-2xl border border-border-muted space-y-4 shadow-lg">
          <div className="flex justify-between items-center border-b border-border-muted pb-3 font-mono">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-sm">location_on</span>
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                {selectedCluster ? `${selectedCluster.city}, ${selectedCluster.country}` : 'Select a Geographic Node'}
              </h3>
            </div>
            {selectedCluster && (
              <span className="px-2.5 py-0.5 rounded bg-surface-dim border border-border-muted text-[10px] text-primary font-mono font-bold">
                {selectedCluster.count} Log Event{selectedCluster.count > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {selectedCluster ? (
            <div className="space-y-4 font-mono text-xs">
              {/* Coordinates & IP Header */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px]">
                <div className="p-2.5 rounded-xl bg-surface-dim border border-border-muted">
                  <div className="text-text-dim text-[9px] uppercase">LATITUDE / LONGITUDE</div>
                  <div className="font-bold text-text-primary mt-0.5">
                    {selectedCluster.latitude.toFixed(4)}, {selectedCluster.longitude.toFixed(4)}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-surface-dim border border-border-muted">
                  <div className="text-text-dim text-[9px] uppercase">SOURCE IPS</div>
                  <div className="font-bold text-primary truncate mt-0.5">
                    {selectedCluster.ipsList.join(', ')}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-surface-dim border border-border-muted">
                  <div className="text-text-dim text-[9px] uppercase">MAX SEVERITY</div>
                  <div className="font-bold text-rose-400 mt-0.5">
                    {selectedCluster.maxThreatLevel} ({selectedCluster.maxThreatScore.toFixed(1)})
                  </div>
                </div>
              </div>

              {/* Event Stream for this Location */}
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                <div className="text-[10px] text-text-dim uppercase tracking-wider">[ CORRELATED LOG EVENTS AT THIS NODE ]</div>
                {selectedCluster.events.map((evt, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-surface-dim border border-border-muted space-y-1.5 text-xs">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-bold text-primary">{evt.event_type || 'cisco_asa'}</span>
                      <span className="text-text-dim">{evt.timestamp}</span>
                    </div>
                    <p className="text-text-muted font-sans text-xs">{evt.xai_explanation || evt.original_event}</p>
                    {evt.mitre_tactic && (
                      <span className="inline-block px-2 py-0.5 rounded bg-surface border border-border-muted text-[9px] text-amber-400 font-bold">
                        {evt.mitre_tactic}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-text-muted font-mono text-xs">
              Click any geographic marker on the map to inspect real source IP coordinates and security events.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
