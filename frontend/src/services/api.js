const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

function getAuthHeaders(isJson = true) {
  const token = localStorage.getItem('token');
  const headers = {};
  if (isJson) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse(response) {
  if (response.status === 401) {
    // Auth failure - clear stale token and redirect to login if not already there
    localStorage.removeItem('token');
    if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register') && window.location.pathname !== '/') {
      window.location.href = '/login';
    }
  }
  
  if (!response.ok) {
    let errorDetail = 'API Request Failed';
    try {
      const errorData = await response.json();
      errorDetail = errorData.detail || errorData.message || JSON.stringify(errorData);
    } catch (e) {
      errorDetail = await response.text();
    }
    throw new Error(errorDetail || `HTTP ${response.status}`);
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await response.json();
  }
  return await response.text();
}

export const api = {
  // Auth APIs
  async login(username, password) {
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await handleResponse(res);
    if (data.access_token) {
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('username', username);
    }
    return data;
  },

  async register(username, password) {
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    return await handleResponse(res);
  },

  logout() {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/';
  },

  // Dashboard & Metrics APIs
  async getStats() {
    const res = await fetch(`${API_BASE_URL}/api/v1/dashboard/stats`, {
      headers: getAuthHeaders(),
    });
    return await handleResponse(res);
  },

  async getRecentEvents(limit = 100) {
    const res = await fetch(`${API_BASE_URL}/api/v1/dashboard/events/recent?limit=${limit}`, {
      headers: getAuthHeaders(),
    });
    return await handleResponse(res);
  },

  async getIncidents(limit = 50) {
    const res = await fetch(`${API_BASE_URL}/api/v1/dashboard/incidents?limit=${limit}`, {
      headers: getAuthHeaders(),
    });
    return await handleResponse(res);
  },

  async getIncidentDetail(incidentId) {
    const res = await fetch(`${API_BASE_URL}/api/v1/dashboard/incidents/${encodeURIComponent(incidentId)}`, {
      headers: getAuthHeaders(),
    });
    return await handleResponse(res);
  },

  async updateIncidentStatus(incidentId, status) {
    const res = await fetch(`${API_BASE_URL}/api/v1/dashboard/incidents/${encodeURIComponent(incidentId)}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    return await handleResponse(res);
  },

  async updateEventStatus(eventId, status) {
    const res = await fetch(`${API_BASE_URL}/api/v1/dashboard/event/${encodeURIComponent(eventId)}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    return await handleResponse(res);
  },

  async exportCsv() {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/v1/dashboard/export/csv`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    });
    if (!response.ok) throw new Error("Failed to export CSV report");
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `threat_report_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  async saveReport(title, summary, statsSnapshot = null) {
    const res = await fetch(`${API_BASE_URL}/api/v1/dashboard/reports/save`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ title, summary, stats_snapshot: statsSnapshot }),
    });
    return await handleResponse(res);
  },

  async getSavedReports() {
    const res = await fetch(`${API_BASE_URL}/api/v1/dashboard/reports`, {
      headers: getAuthHeaders(),
    });
    return await handleResponse(res);
  },

  async resetData() {
    const res = await fetch(`${API_BASE_URL}/api/v1/dashboard/admin/reset-data`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return await handleResponse(res);
  },

  async simulateTamper(rawEventHash = 'demo_hash') {
    const res = await fetch(`${API_BASE_URL}/api/v1/dashboard/audit/simulate-tamper/${encodeURIComponent(rawEventHash)}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return await handleResponse(res);
  },

  async lookupGeoIp(ip) {
    const res = await fetch(`${API_BASE_URL}/api/v1/dashboard/geoip/lookup/${encodeURIComponent(ip)}`, {
      headers: getAuthHeaders(),
    });
    return await handleResponse(res);
  },

  async getGeoIP(ip) {
    return this.lookupGeoIp(ip);
  },

  // Copilot API
  async askCopilot(question, forceOffline = false) {
    const res = await fetch(`${API_BASE_URL}/api/v1/copilot/ask`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ question, force_offline: forceOffline }),
    });
    return await handleResponse(res);
  },

  // Log Ingestion APIs
  async ingestLogs(rawText, formatOverride = null) {
    let url = `${API_BASE_URL}/api/v1/ingest`;
    if (formatOverride) {
      url += `?format=${encodeURIComponent(formatOverride)}`;
    }
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(false),
        'Content-Type': 'text/plain',
      },
      body: rawText,
    });
    return await handleResponse(res);
  },

  async ingestFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE_URL}/api/v1/ingest/file`, {
      method: 'POST',
      headers: getAuthHeaders(false),
      body: formData,
    });
    return await handleResponse(res);
  },
};
