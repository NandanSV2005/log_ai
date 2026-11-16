import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { useTheme } from '../../contexts/ThemeContext';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

function readCssVar(name, fallback) {
  if (typeof window === 'undefined') return fallback;
  const val = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return val || fallback;
}

export function SocThreatCharts({ recentEvents = [], vendorCounts = {}, isLoading = false }) {
  const { theme } = useTheme();

  const palette = useMemo(() => {
    const isSage = theme === 'sage';
    return {
      critical: readCssVar('--color-severity-critical', isSage ? '#BE185D' : '#FF4D94'),
      high: readCssVar('--color-severity-high', isSage ? '#B91C1C' : '#F66565'),
      medium: readCssVar('--color-severity-medium', isSage ? '#B45309' : '#FACC15'),
      low: readCssVar('--color-severity-low', isSage ? '#047857' : '#10B981'),
      primary: readCssVar('--color-primary', isSage ? '#376D8C' : '#E3C98F'),
      secondary: readCssVar('--color-secondary', isSage ? '#715F9F' : '#B85C28'),
      textMuted: readCssVar('--color-text-muted', isSage ? '#6A6780' : '#BFB09F'),
      border: readCssVar('--color-border', isSage ? '#E4DCEF' : '#4D3A2F'),
    };
  }, [theme]);

  // Group recent events into 8 chronological slices stacked by severity
  const timelineData = useMemo(() => {
    const sliceCount = 8;
    const labels = [];
    const crit = new Array(sliceCount).fill(0);
    const high = new Array(sliceCount).fill(0);
    const med = new Array(sliceCount).fill(0);
    const low = new Array(sliceCount).fill(0);

    const ordered = [...recentEvents].reverse(); // oldest -> newest
    const chunkSize = Math.max(1, Math.ceil(ordered.length / sliceCount));

    for (let i = 0; i < sliceCount; i++) {
      const slice = ordered.slice(i * chunkSize, (i + 1) * chunkSize);
      labels.push(slice.length > 0 ? `B${i + 1}` : `B${i + 1}`);
      for (const evt of slice) {
        const lvl = (evt.threat_level || 'LOW').toUpperCase();
        if (lvl === 'CRITICAL') crit[i] += 1;
        else if (lvl === 'HIGH') high[i] += 1;
        else if (lvl === 'MEDIUM') med[i] += 1;
        else low[i] += 1;
      }
    }

    return {
      labels,
      datasets: [
        { label: 'CRITICAL', data: crit, backgroundColor: palette.critical, borderRadius: 3 },
        { label: 'HIGH', data: high, backgroundColor: palette.high, borderRadius: 3 },
        { label: 'MEDIUM', data: med, backgroundColor: palette.medium, borderRadius: 3 },
        { label: 'LOW', data: low, backgroundColor: palette.low, borderRadius: 3 },
      ],
    };
  }, [recentEvents, palette]);

  // Vendor / Parser distribution from real stats or fallback to recentEvents
  const vendorData = useMemo(() => {
    const entries = Object.entries(vendorCounts || {}).filter(([, v]) => v > 0);
    const counts =
      entries.length > 0
        ? entries
        : Object.entries(
            recentEvents.reduce((acc, evt) => {
              const key = (evt.event_type || 'unknown').split(':')[0].toUpperCase();
              acc[key] = (acc[key] || 0) + 1;
              return acc;
            }, {})
          );

    const sorted = counts.sort((a, b) => b[1] - a[1]).slice(0, 5);
    const colors = [palette.primary, palette.secondary, palette.high, palette.medium, palette.low];

    return {
      labels: sorted.length > 0 ? sorted.map(([k]) => k) : ['NO STREAM'],
      datasets: [
        {
          data: sorted.length > 0 ? sorted.map(([, v]) => v) : [1],
          backgroundColor: sorted.length > 0 ? colors.slice(0, sorted.length) : [palette.border],
          borderWidth: 0,
        },
      ],
    };
  }, [vendorCounts, recentEvents, palette]);

  const barOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 220 },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: palette.textMuted,
            boxWidth: 10,
            font: { family: 'monospace', size: 10 },
          },
        },
      },
      scales: {
        x: {
          stacked: true,
          grid: { display: false },
          ticks: { color: palette.textMuted, font: { family: 'monospace', size: 10 } },
        },
        y: {
          stacked: true,
          beginAtZero: true,
          grid: { color: palette.border },
          ticks: {
            precision: 0,
            color: palette.textMuted,
            font: { family: 'monospace', size: 10 },
          },
        },
      },
    }),
    [palette]
  );

  const doughnutOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      cutout: '66%',
      animation: { duration: 220 },
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: palette.textMuted,
            boxWidth: 10,
            font: { family: 'monospace', size: 10 },
          },
        },
      },
    }),
    [palette]
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 glass-panel p-5 rounded-2xl border border-border-muted h-64 animate-pulse bg-surface-dim" />
        <div className="lg:col-span-5 glass-panel p-5 rounded-2xl border border-border-muted h-64 animate-pulse bg-surface-dim" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-7 glass-panel p-5 rounded-2xl border border-border-muted shadow-lg flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-border-muted pb-2.5 font-mono text-xs">
          <span className="font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-base">bar_chart</span>
            Telemetry Severity Velocity
          </span>
          <span className="text-[11px] text-text-muted">Last {recentEvents.length} Events</span>
        </div>
        <div className="h-48 w-full">
          {recentEvents.length > 0 ? (
            <Bar data={timelineData} options={barOptions} />
          ) : (
            <div className="h-full flex items-center justify-center font-mono text-xs text-text-muted border border-dashed border-border-muted rounded-xl">
              Awaiting telemetry events for severity velocity chart.
            </div>
          )}
        </div>
      </div>

      <div className="lg:col-span-5 glass-panel p-5 rounded-2xl border border-border-muted shadow-lg flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-border-muted pb-2.5 font-mono text-xs">
          <span className="font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-base">donut_large</span>
            Parser &amp; Vendor Mix
          </span>
          <span className="text-[11px] text-text-muted">OCSF Sources</span>
        </div>
        <div className="h-48 w-full">
          <Doughnut data={vendorData} options={doughnutOptions} />
        </div>
      </div>
    </div>
  );
}
