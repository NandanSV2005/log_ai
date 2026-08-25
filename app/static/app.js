/**
 * LOG AI — SOC Dashboard Real-Time Polling, Chart.js & Forensic Traceability Engine
 */

const API_STATS_URL = '/api/v1/dashboard/stats';
const API_RECENT_EVENTS_URL = '/api/v1/dashboard/events/recent?limit=100';
const POLLING_INTERVAL_MS = 2000;
const MAX_CHART_POINTS = 15;

let threatVelocityChart = null;
const expandedRowKeys = new Set();

document.addEventListener('DOMContentLoaded', () => {
  startClock();
  initChart();
  setupAttackSimulator();
  fetchDashboardData();
  setInterval(fetchDashboardData, POLLING_INTERVAL_MS);
});

/**
 * Sets up the Attack Simulator button logic.
 */
function setupAttackSimulator() {
  const btn = document.getElementById('simulate-attack-btn');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    btn.disabled = true;
    const originalHtml = btn.innerHTML;
    btn.innerHTML = `
      <svg class="spinner-sm" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.2" fill="none">
        <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"></path>
      </svg>
      <span>Simulating...</span>
    `;

    try {
      const attackerIp = '198.51.100.99';
      const attackLines = [];
      const nowIso = new Date().toISOString();

      for (let i = 0; i < 10; i++) {
        attackLines.push(`<134>1 ${nowIso} auth-server sshd ${5000 + i} - - Failed password for root from ${attackerIp} port ${54320 + i} ssh2`);
      }

      const payload = attackLines.join('\n');

      const res = await fetch('/api/v1/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: payload,
      });

      if (res.ok) {
        // Allow brief moment for background worker loop, then immediately force UI refresh
        await new Promise(r => setTimeout(r, 150));
        await fetchDashboardData();
      } else if (res.status === 429) {
        showToast('Rate Limit Exceeded (5 req/sec). Please slow down.', 'warning');
      } else {
        showToast(`Ingestion failed with status ${res.status}`, 'error');
      }
    } catch (err) {
      console.error('Error simulating attack burst:', err);
      showToast('Network error during attack simulation', 'error');
    } finally {
      setTimeout(() => {
        btn.innerHTML = originalHtml;
        btn.disabled = false;
      }, 1000);
    }
  });
}

/**
 * Toast Notification Manager.
 */
function showToast(message, type = 'warning') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast-banner toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${type === 'warning' ? '⚠️' : '❌'}</span>
    <span class="toast-msg">${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-fade-out');
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}

/**
 * Initializes Chart.js real-time line chart.
 */
function initChart() {
  const ctx = document.getElementById('threatVelocityChart');
  if (!ctx) return;

  threatVelocityChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'High Threats',
          data: [],
          borderColor: '#ff2a5f',
          backgroundColor: 'rgba(255, 42, 95, 0.15)',
          borderWidth: 2,
          pointBackgroundColor: '#ff2a5f',
          pointRadius: 3,
          fill: true,
          tension: 0.35,
        },
        {
          label: 'Total Events',
          data: [],
          borderColor: '#00f0ff',
          backgroundColor: 'rgba(0, 240, 255, 0.08)',
          borderWidth: 2,
          pointBackgroundColor: '#00f0ff',
          pointRadius: 3,
          fill: true,
          tension: 0.35,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 400,
        easing: 'easeOutQuad'
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          align: 'end',
          labels: {
            color: '#94a3b8',
            font: { family: 'Inter', size: 11, weight: '600' },
            boxWidth: 12,
            usePointStyle: true,
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(11, 19, 41, 0.95)',
          titleColor: '#f8fafc',
          bodyColor: '#cbd5e1',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.04)' },
          ticks: { color: '#64748b', font: { family: 'JetBrains Mono', size: 10 } }
        },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(255, 255, 255, 0.04)' },
          ticks: { color: '#64748b', font: { family: 'JetBrains Mono', size: 10 } }
        }
      }
    }
  });
}

/**
 * Updates real-time UTC clock in header.
 */
function startClock() {
  const clockEl = document.getElementById('system-clock');
  function update() {
    const now = new Date();
    clockEl.textContent = now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
  }
  update();
  setInterval(update, 1000);
}

/**
 * Main polling fetch handler.
 */
async function fetchDashboardData() {
  const statusEl = document.getElementById('connection-status');
  try {
    await Promise.all([
      updateStats(),
      updateEventsTable()
    ]);
    statusEl.textContent = 'LIVE POLLING (2s)';
    statusEl.parentElement.className = 'status-pill cyan-glow';
  } catch (error) {
    console.error('Failed to fetch dashboard updates:', error);
    statusEl.textContent = 'RETRYING...';
    statusEl.parentElement.className = 'status-pill red-glow';
  }
}

/**
 * Fetches and updates aggregate stats metrics cards & Chart.js graph.
 */
async function updateStats() {
  const res = await fetch(API_STATS_URL);
  if (!res.ok) throw new Error(`Stats HTTP error ${res.status}`);
  const data = await res.json();

  const totalEvents = data.total_events_ingested || 0;
  const threatCounts = data.threat_level_counts || {};
  const highCount = threatCounts.HIGH || 0;
  const medCount = threatCounts.MEDIUM || 0;
  const lowCount = threatCounts.LOW || 0;

  document.getElementById('stat-total').textContent = totalEvents.toLocaleString();
  document.getElementById('stat-high').textContent = highCount.toLocaleString();
  document.getElementById('stat-medium').textContent = medCount.toLocaleString();
  document.getElementById('stat-low').textContent = lowCount.toLocaleString();

  // Push new data point into Chart.js
  if (threatVelocityChart) {
    const nowStr = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    threatVelocityChart.data.labels.push(nowStr);
    threatVelocityChart.data.datasets[0].data.push(highCount);
    threatVelocityChart.data.datasets[1].data.push(totalEvents);

    if (threatVelocityChart.data.labels.length > MAX_CHART_POINTS) {
      threatVelocityChart.data.labels.shift();
      threatVelocityChart.data.datasets[0].data.shift();
      threatVelocityChart.data.datasets[1].data.shift();
    }

    threatVelocityChart.update();
  }

  // Vendor Parser Breakdown List
  const vendorContainer = document.getElementById('vendor-breakdown-list');
  const vendorCounts = data.vendor_parser_counts || {};
  const vendorKeys = Object.keys(vendorCounts);

  if (vendorKeys.length === 0) {
    vendorContainer.innerHTML = '<span class="v-pill-loading">No vendor metrics recorded yet.</span>';
  } else {
    vendorContainer.innerHTML = vendorKeys
      .map(v => `
        <div class="v-item">
          <span class="v-name">${escapeHtml(v.toUpperCase())}</span>
          <span class="v-count">${vendorCounts[v]}</span>
        </div>
      `)
      .join('');
  }
}

/**
 * Fetches and renders recent 100 normalized events stream.
 */
async function updateEventsTable() {
  const res = await fetch(API_RECENT_EVENTS_URL);
  if (!res.ok) throw new Error(`Events HTTP error ${res.status}`);
  const data = await res.json();

  const events = data.events || [];
  const tbody = document.getElementById('event-stream-body');
  const countBadge = document.getElementById('table-count-badge');

  countBadge.textContent = `Showing ${events.length} latest events \u2022 Click any row for raw evidence`;

  if (events.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="loading-cell">
          <span>No ingested events found in normalized storage.</span>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = events.map((event, idx) => renderEventRow(event, idx)).join('');
}

/**
 * Global handler to toggle detail row expansion.
 */
window.toggleRowExpansion = function(index, eventKey) {
  const detailRow = document.getElementById(`detail-row-${index}`);
  if (!detailRow) return;

  if (detailRow.classList.contains('is-open')) {
    detailRow.classList.remove('is-open');
    expandedRowKeys.delete(eventKey);
  } else {
    detailRow.classList.add('is-open');
    expandedRowKeys.add(eventKey);
  }
};

/**
 * Renders a primary UnifiedEvent row and its expandable side-by-side forensic detail row.
 */
function renderEventRow(event, index) {
  const threatLevel = (event.threat_level || 'LOW').toUpperCase();
  const threatScore = (event.threat_score !== undefined) ? event.threat_score.toFixed(1) : '0.0';

  let rowClass = '';
  let badgeClass = 'badge-low';
  let panelClass = 'panel-low';

  if (threatLevel === 'HIGH') {
    rowClass = 'row-high';
    badgeClass = 'badge-high';
    panelClass = 'panel-high';
  } else if (threatLevel === 'MEDIUM') {
    rowClass = 'row-medium';
    badgeClass = 'badge-medium';
    panelClass = 'panel-medium';
  }

  // Format Timestamp
  let formattedTs = event.timestamp || '';
  if (formattedTs.length > 19) {
    formattedTs = formattedTs.replace('T', ' ').substring(0, 19);
  }

  // Merkle Hash
  const fullHash = event.raw_event_hash || event.payload_hash || 'N/A';
  let shortHash = fullHash;
  if (fullHash.length > 16) {
    shortHash = `${fullHash.substring(0, 8)}...${fullHash.substring(fullHash.length - 6)}`;
  }

  const vendorName = (event.event_type || 'unstructured_log').replace('_', ' ').toUpperCase();
  const sourceIp = event.source_ip || 'N/A';
  const explanation = event.xai_explanation || 'No XAI explanation generated.';
  const rawPayload = event.original_event || '';
  const formattedJson = JSON.stringify(event, null, 2);

  // Unique event key for expansion state retention
  const eventKey = `${fullHash}_${index}`;
  const isOpen = expandedRowKeys.has(eventKey) ? 'is-open' : '';

  return `
    <tr class="row-expandable ${rowClass}" onclick="toggleRowExpansion(${index}, '${escapeJs(eventKey)}')">
      <td class="ts-cell">${escapeHtml(formattedTs)}</td>
      <td><span class="ip-badge">${escapeHtml(sourceIp)}</span></td>
      <td><span class="vendor-badge">${escapeHtml(vendorName)}</span></td>
      <td>
        <span class="badge-threat ${badgeClass}">
          ${threatLevel} (${threatScore})
        </span>
      </td>
      <td class="xai-explanation">${escapeHtml(explanation)}</td>
      <td>
        <span class="merkle-hash" title="Click to copy Merkle Hash: ${escapeHtml(fullHash)}" onclick="event.stopPropagation(); copyToClipboard('${escapeHtml(fullHash)}')">
          ${escapeHtml(shortHash)}
        </span>
      </td>
    </tr>
    <tr class="detail-row ${isOpen}" id="detail-row-${index}">
      <td colspan="6">
        <div class="forensic-panel-container ${panelClass}">
          <div class="forensic-grid">
            <!-- Left Column: Raw Evidence (Zero Information Loss) -->
            <div class="forensic-col col-raw-evidence">
              <div class="forensic-header">
                <span>RAW EVIDENCE (ZERO INFORMATION LOSS)</span>
                <span class="col-tag tag-raw">UNTOUCHED PAYLOAD</span>
              </div>
              <pre class="code-block"><code>${escapeHtml(rawPayload)}</code></pre>
              <div class="merkle-audit-badge">
                <span>SHA-256 Merkle Leaf Hash:</span>
                <span class="merkle-hash-text">${escapeHtml(fullHash)}</span>
              </div>
            </div>

            <!-- Right Column: AI Analysis & Normalized OCSF Event -->
            <div class="forensic-col col-normalized-ocsf">
              <div class="forensic-header">
                <span>AI ANALYSIS & NORMALIZED OCSF EVENT</span>
                <span class="col-tag tag-ocsf">ANALYTICS READY</span>
              </div>
              <div class="xai-banner-box">
                <span class="xai-banner-title">EXPLAINABLE AI INSIGHT</span>
                <div class="xai-banner-text">${escapeHtml(explanation)}</div>
              </div>
              <pre class="code-block json-code"><code>${escapeHtml(formattedJson)}</code></pre>
            </div>
          </div>
        </div>
      </td>
    </tr>
  `;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeJs(str) {
  if (!str) return '';
  return String(str).replace(/'/g, "\\'");
}

function copyToClipboard(text) {
  if (!text || text === 'N/A') return;
  navigator.clipboard.writeText(text).then(() => {
    alert(`Copied Merkle Audit Hash to clipboard:\n${text}`);
  }).catch(() => {});
}
