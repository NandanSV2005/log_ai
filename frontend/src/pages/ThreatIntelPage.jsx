import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { api } from '../services/api';

export function ThreatIntelPage() {
  const { theme } = useTheme();
  const [threatEvents, setThreatEvents] = useState([]);
  const [geoThreatMarkers, setGeoThreatMarkers] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Convert lat/lng to SVG 1000x500 map viewBox coordinates (Equirectangular)
  const convertLatLngToXY = (lat, lng) => {
    const latitude = typeof lat === 'number' && !isNaN(lat) ? lat : 20;
    const longitude = typeof lng === 'number' && !isNaN(lng) ? lng : 0;
    const x = ((longitude + 180) * (1000 / 360)) % 1000;
    const y = (90 - latitude) * (500 / 180);
    return { x: Math.max(20, Math.min(980, x)), y: Math.max(20, Math.min(480, y)) };
  };

  const fetchThreatIntelData = async () => {
    try {
      const [eventsRes, incidentsRes] = await Promise.all([
        api.getRecentEvents(50),
        api.getIncidents(10),
      ]);

      const events = eventsRes?.events || [];
      const incidentList = incidentsRes?.incidents || [];
      setThreatEvents(events);
      setIncidents(incidentList);

      // Perform offline GeoIP lookup for distinct IPs
      const distinctIps = Array.from(new Set(events.map((e) => e.source_ip).filter(Boolean)));
      const markers = [];

      for (const ip of distinctIps.slice(0, 15)) {
        try {
          const geoRes = await api.getGeoIP(ip);
          if (geoRes && typeof geoRes.latitude === 'number' && typeof geoRes.longitude === 'number') {
            const { x, y } = convertLatLngToXY(geoRes.latitude, geoRes.longitude);
            const matchingEvt = events.find((e) => e.source_ip === ip);
            markers.push({
              ip,
              city: geoRes.city || 'Unknown',
              country: geoRes.country || 'Global',
              latitude: geoRes.latitude,
              longitude: geoRes.longitude,
              x,
              y,
              threat_level: matchingEvt?.threat_level || 'HIGH',
              threat_score: matchingEvt?.threat_score || 75.0,
              event_type: matchingEvt?.event_type || 'cisco_asa',
              mitre_tactic: matchingEvt?.mitre_tactic || 'T1110',
              count: events.filter((e) => e.source_ip === ip).length,
            });
          }
        } catch (err) {
          console.warn(`GeoIP lookup failed for ${ip}:`, err);
        }
      }

      setGeoThreatMarkers(markers);
      if (markers.length > 0 && !selectedMarker) {
        setSelectedMarker(markers[0]);
      }
    } catch (err) {
      console.error('Error fetching Threat Intel data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchThreatIntelData();
    const timer = setInterval(fetchThreatIntelData, 3000);
    return () => clearInterval(timer);
  }, []);

  // Compute regional & severity stats
  const highCount = geoThreatMarkers.filter((m) => m.threat_level === 'HIGH').length;
  const medCount = geoThreatMarkers.filter((m) => m.threat_level === 'MEDIUM').length;
  const lowCount = geoThreatMarkers.filter((m) => m.threat_level === 'LOW').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border-muted pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
            Threat Intelligence & <span className="text-primary">Live Threat Vectors</span>
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1 font-sans">
            Offline GeoIP resolution, spatial threat origin mapping, and source-to-target attack correlation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono text-xs px-3 py-1.5 rounded-xl bg-surface-dim border border-border-muted text-emerald-400 font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>{geoThreatMarkers.length} ACTIVE THREAT NODES</span>
          </span>
          <button
            onClick={fetchThreatIntelData}
            className="p-2 rounded-xl border border-border-muted bg-surface-dim text-text-primary hover:border-primary transition-all"
            title="Refresh Threat Intelligence"
          >
            <span className="material-symbols-outlined text-sm">refresh</span>
          </button>
        </div>
      </header>

      {/* SECTION 1: LIVE VECTOR WORLD MAP */}
      <div className="glass-panel rounded-2xl border border-border-muted overflow-hidden shadow-2xl space-y-4">
        <div className="p-4 border-b border-border-muted bg-surface-dim flex justify-between items-center font-mono text-xs">
          <div className="flex items-center gap-2 font-bold text-text-primary">
            <span className="material-symbols-outlined text-primary text-sm">public</span>
            <span>LIVE THREAT VECTORS MAP (EQUIRECTANGULAR PROJECTION)</span>
          </div>
          <span className="text-text-muted">Resolution: Subnet GeoIP</span>
        </div>

        {/* Map Canvas Box */}
        <div className="relative h-[360px] sm:h-[420px] bg-surface-dim overflow-hidden flex items-center justify-center">
          {/* Detailed Realistic World Vector SVG Map */}
          <svg className="w-full h-full z-0 absolute inset-0" viewBox="0 0 1000 500">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-primary opacity-20" />
              </pattern>
            </defs>

            {/* Subtle Grid Background */}
            <rect width="1000" height="500" fill="url(#grid)" />

            {/* World Equator & Prime Meridian Axis Lines */}
            <g className="text-primary opacity-25">
              <line x1="0" y1="250" x2="1000" y2="250" stroke="currentColor" strokeWidth="1" strokeDasharray="4,4" />
              <line x1="500" y1="0" x2="500" y2="500" stroke="currentColor" strokeWidth="1" strokeDasharray="4,4" />
            </g>

            {/* Detailed Realistic World Vector Landmasses */}
            <g
              fill={theme === 'sage' ? 'rgba(113, 131, 85, 0.22)' : 'rgba(167, 139, 250, 0.18)'}
              stroke={theme === 'sage' ? 'rgba(113, 131, 85, 0.55)' : 'rgba(167, 139, 250, 0.5)'}
              strokeWidth="1.2"
              strokeLinejoin="round"
              strokeLinecap="round"
            >
              {/* North America */}
              <path d="M 25,50 C 40,35 70,30 95,45 C 120,60 145,55 165,40 C 185,25 220,20 250,30 C 280,40 310,40 320,60 C 330,80 360,95 365,115 C 370,135 345,145 330,155 C 315,165 305,180 290,195 C 280,205 270,225 260,240 C 255,248 245,255 240,250 C 235,245 240,230 230,220 C 220,210 215,200 205,190 C 195,180 180,175 160,170 C 140,165 130,150 120,135 C 110,120 90,110 70,105 C 50,100 30,80 25,50 Z" />
              {/* Greenland */}
              <path d="M 315,20 C 340,15 375,12 415,20 C 445,25 435,55 405,70 C 375,80 340,80 320,70 C 305,60 300,30 315,20 Z" />
              {/* Caribbean */}
              <path d="M 265,215 C 275,212 285,215 282,220 C 275,222 268,220 265,215 Z" />
              <path d="M 290,220 C 298,218 305,220 302,225 C 295,227 290,224 290,220 Z" />
              {/* South America */}
              <path d="M 260,240 C 275,235 295,235 320,245 C 345,255 370,265 390,285 C 405,300 395,320 380,345 C 365,370 345,400 330,425 C 320,440 305,455 295,450 C 285,445 295,420 295,395 C 295,370 300,340 300,310 C 300,280 280,265 260,240 Z" />
              {/* Europe */}
              <path d="M 465,70 C 485,60 515,50 545,55 C 570,60 595,70 610,90 C 600,105 580,120 560,130 C 545,138 535,145 525,140 C 515,135 500,145 485,145 C 475,145 460,125 460,105 C 460,85 455,75 465,70 Z" />
              {/* British Isles */}
              <path d="M 475,90 C 485,85 495,85 495,95 C 495,105 485,110 475,105 C 470,100 468,92 475,90 Z" />
              <path d="M 462,95 C 468,92 472,96 469,104 C 464,106 460,100 462,95 Z" />
              {/* Africa */}
              <path d="M 455,145 C 480,140 520,140 565,145 C 595,150 610,165 625,190 C 640,215 635,235 615,255 C 595,275 580,315 565,350 C 555,375 540,380 530,370 C 520,360 515,335 510,310 C 505,285 470,260 450,230 C 440,215 440,185 445,165 C 448,152 450,148 455,145 Z" />
              {/* Madagascar */}
              <path d="M 620,300 C 630,295 640,305 635,325 C 630,345 620,355 615,345 C 610,335 612,305 620,300 Z" />
              {/* Asia */}
              <path d="M 590,65 C 630,55 690,45 760,40 C 830,35 900,45 940,65 C 960,75 940,105 915,130 C 890,155 870,180 840,205 C 825,218 805,235 790,250 C 775,260 760,240 745,225 C 730,210 705,210 685,195 C 665,180 635,180 615,165 C 600,155 585,125 580,100 C 578,80 582,70 590,65 Z" />
              {/* Japan */}
              <path d="M 875,130 C 885,125 895,135 890,150 C 885,165 870,165 870,150 C 870,140 870,132 875,130 Z" />
              {/* Indonesia / Philippines */}
              <path d="M 815,260 C 835,255 865,255 885,260 C 895,265 885,275 865,275 C 845,275 825,270 815,260 Z" />
              <path d="M 860,210 C 870,205 875,215 870,230 C 865,245 855,240 858,225 C 859,215 859,211 860,210 Z" />
              {/* Australia & Tasmania */}
              <path d="M 810,290 C 835,280 875,280 915,295 C 935,305 940,335 930,365 C 920,390 895,400 870,395 C 840,390 820,375 810,345 C 800,315 802,295 810,290 Z" />
              <path d="M 875,405 C 885,400 890,408 885,415 C 878,418 873,412 875,405 Z" />
              {/* New Zealand */}
              <path d="M 960,360 C 970,355 975,370 968,385 C 960,400 950,405 952,390 C 953,375 955,365 960,360 Z" />
            </g>
          </svg>

          {/* Real Dynamic GeoIP Threat Markers Overlay */}
          {geoThreatMarkers.map((marker, idx) => {
            const isHigh = marker.threat_level === 'HIGH';
            const isMed = marker.threat_level === 'MEDIUM';
            const colorClass = isHigh ? 'bg-rose-500 text-rose-400 border-rose-500' : isMed ? 'bg-amber-500 text-amber-400 border-amber-500' : 'bg-emerald-400 text-emerald-400 border-emerald-400';
            const isSelected = selectedMarker?.ip === marker.ip;

            return (
              <div
                key={marker.ip || idx}
                onClick={() => setSelectedMarker(marker)}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group"
                style={{ left: `${(marker.x / 1000) * 100}%`, top: `${(marker.y / 500) * 100}%` }}
              >
                <div className="relative flex items-center justify-center">
                  <div className={`w-4 h-4 rounded-full ${colorClass.split(' ')[0]} opacity-75 animate-ping absolute`}></div>
                  <div className={`w-3 h-3 rounded-full ${colorClass.split(' ')[0]} border-2 border-white/80 shadow-md`}></div>
                </div>

                {/* Marker Hover Badge */}
                <div className="hidden group-hover:block absolute left-1/2 -translate-x-1/2 bottom-5 whitespace-nowrap bg-surface-dim border border-border-muted px-2.5 py-1 rounded-lg shadow-xl font-mono text-[10px] z-30">
                  <div className="font-bold text-text-primary">{marker.ip}</div>
                  <div className="text-text-muted">{marker.city}, {marker.country}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: THREAT ORIGIN & SEVERITY ANALYTICS */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Severity Distribution Meters (Span 6) */}
        <div className="md:col-span-6 glass-panel p-6 rounded-2xl border border-border-muted space-y-4 shadow-lg">
          <div className="flex justify-between items-center border-b border-border-muted pb-3">
            <h3 className="text-xs font-mono font-bold text-text-primary uppercase tracking-wider">Threat Severity Distribution</h3>
            <span className="font-mono text-[10px] text-text-muted">Real-Time Threat Scores</span>
          </div>

          <div className="space-y-4 font-mono text-xs">
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-rose-400 font-bold">HIGH SEVERITY THREATS</span>
                <span className="text-text-primary font-bold">{highCount} Nodes</span>
              </div>
              <div className="h-3 w-full bg-surface-dim rounded-full overflow-hidden border border-border-muted">
                <div className="h-full bg-rose-500 rounded-full" style={{ width: `${geoThreatMarkers.length ? (highCount / geoThreatMarkers.length) * 100 : 0}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-amber-400 font-bold">MEDIUM SEVERITY THREATS</span>
                <span className="text-text-primary font-bold">{medCount} Nodes</span>
              </div>
              <div className="h-3 w-full bg-surface-dim rounded-full overflow-hidden border border-border-muted">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${geoThreatMarkers.length ? (medCount / geoThreatMarkers.length) * 100 : 0}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-emerald-400 font-bold">LOW SEVERITY THREATS</span>
                <span className="text-text-primary font-bold">{lowCount} Nodes</span>
              </div>
              <div className="h-3 w-full bg-surface-dim rounded-full overflow-hidden border border-border-muted">
                <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${geoThreatMarkers.length ? (lowCount / geoThreatMarkers.length) * 100 : 0}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Selected GeoIP Node Intelligence Panel (Span 6) */}
        <div className="md:col-span-6 glass-panel p-6 rounded-2xl border border-border-muted space-y-4 shadow-lg">
          <div className="flex justify-between items-center border-b border-border-muted pb-3">
            <h3 className="text-xs font-mono font-bold text-text-primary uppercase tracking-wider">Node Intelligence Inspector</h3>
            <span className="font-mono text-[10px] text-primary">Selected Node</span>
          </div>

          {selectedMarker ? (
            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center p-3 rounded-xl bg-surface-dim border border-border-muted">
                <span className="text-text-muted">Target IP Address:</span>
                <span className="font-bold text-text-primary text-sm">{selectedMarker.ip}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-2.5 rounded-xl bg-surface-dim border border-border-muted">
                  <div className="text-[10px] text-text-dim">Geographic Location</div>
                  <div className="font-bold text-text-primary mt-0.5">{selectedMarker.city}, {selectedMarker.country}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-surface-dim border border-border-muted">
                  <div className="text-[10px] text-text-dim">Threat Level / Score</div>
                  <div className="font-bold text-rose-400 mt-0.5">{selectedMarker.threat_level} ({selectedMarker.threat_score.toFixed(1)})</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-surface-dim border border-border-muted space-y-1">
                <div className="text-[10px] text-text-dim uppercase">Attack Vector & MITRE Tactic:</div>
                <div className="text-text-primary font-bold">{selectedMarker.event_type} &bull; {selectedMarker.mitre_tactic}</div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-text-muted font-mono text-xs">
              Click any active threat marker on the vector map above to inspect detailed GeoIP intelligence.
            </div>
          )}
        </div>

      </div>

      {/* SECTION 3: SOURCE-TO-TARGET ATTACK CORRELATION FLOW */}
      <div className="glass-panel rounded-2xl border border-border-muted p-6 shadow-xl space-y-4">
        <div className="flex justify-between items-center border-b border-border-muted pb-3 font-mono text-xs">
          <h3 className="font-bold text-text-primary uppercase tracking-wider">Source-to-Target Attack Vector Correlation</h3>
          <span className="text-text-muted">15-Min Graph Cluster Window</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          {geoThreatMarkers.slice(0, 3).map((marker, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-surface-dim border border-border-muted space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-rose-400 font-bold">SOURCE: {marker.ip}</span>
                <span className="text-[10px] text-text-muted">{marker.city}</span>
              </div>
              <div className="text-[10px] text-text-dim text-center">&darr; ATTACK VECTOR EVENT STREAM &darr;</div>
              <div className="p-2 rounded bg-surface border border-border-muted flex justify-between items-center text-[10px]">
                <span className="text-text-primary font-bold">{marker.event_type}</span>
                <span className="text-rose-400 font-bold">{marker.threat_level}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
