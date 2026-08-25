# LOG AI: Intelligent Security Operations Center (SOC) Engine

> **Zero-Loss Forensic Ingestion & Explainable AI Threat Intelligence System**
> 
> LOG AI is a high-performance, enterprise-hardened SOC dashboard and log ingestion engine designed for real-time threat detection, cryptographic Merkle tree auditability, and automated incident response.

---

## 🚀 Key Features

- 🛡️ **Enterprise Security Hardening**:
  - **HTTP Basic Authentication**: Protected SOC dashboard UI (`admin` / `SuperSecretPassword!`) using timing-attack resistant `secrets.compare_digest`.
  - **Rate Limiting**: Built-in `slowapi` rate limiter (`5 requests/sec`) on log ingestion (`/api/v1/ingest`) with client-side 429 toast alerts.
  - **Strict HTTP Security Headers**: Automatic `X-Content-Type-Options`, `Strict-Transport-Security`, `X-Frame-Options`, and `CSP` headers.

- 🤖 **AI Anomaly Detection & Explainable AI (XAI)**:
  - Multi-stage threat scoring pipeline combining heuristics and feature anomaly metrics.
  - Generates human-readable Explainable AI (XAI) threat insights for every ingested security event.

- 🔗 **Cryptographic Merkle Auditability (Zero-Loss Forensics)**:
  - Immediate raw payload persistence before parsing for zero-loss forensics.
  - Incremental SHA-256 Merkle Tree generating immutable root hashes for event traceability.

- 🗺️ **Real-Time Geolocation Threat Mapping**:
  - Interactive Leaflet.js map tracking origin locations of `HIGH` threat events dynamically.

- 🔍 **Natural Language Search Bar**:
  - Full-text client-side NLP filtering across raw log lines, IPs, threat scores, XAI explanations, and OCSF JSON records.

- 📊 **Automated Incident Report (CSV Export)**:
  - One-click export endpoint (`/api/v1/dashboard/export/csv`) compiling all `HIGH` and `MEDIUM` threat alerts into a downloadable forensic CSV report.

- 🌗 **Light / Dark Theme Switcher**:
  - High-contrast responsive dark and light modes with state retention via `localStorage`.

---

## 🛠️ Technology Stack

- **Core Engine & API**: Python 3.11+, FastAPI, Uvicorn
- **Rate Limiting & Security**: SlowAPI, Python `secrets`, Custom Security Middleware
- **Frontend & UI**: HTML5, Vanilla CSS, Vanilla JavaScript, Chart.js, Leaflet.js
- **Containerization & Testing**: Docker, PyTest, PyTest-AsyncIO, HTTPX

---

## 🐳 Getting Started (Docker)

To build and launch LOG AI inside a lightweight production Docker container:

```bash
# 1. Build the Docker image
docker build -t log-ai:latest .

# 2. Run the container on port 8000
docker run -p 8000:8000 log-ai:latest
```

Open your browser at [http://localhost:8000](http://localhost:8000).

---

## 💻 Local Development Setup

To run LOG AI locally in a Python virtual environment:

```bash
# 1. Clone the repository
git clone https://github.com/NandanSV2005/log_ai.git
cd log_ai

# 2. Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .\.venv\Scripts\activate

# 3. Install requirements
pip install -r requirements.txt

# 4. Start the server via Uvicorn
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 🔑 Security & Authentication Credentials

The SOC Dashboard interface (`/`) is protected by **HTTP Basic Authentication**.

| Credential | Value |
| :--- | :--- |
| **Username** | `admin` |
| **Password** | `SuperSecretPassword!` |

---

## 🧪 Running the Test Suite

Run the full automated pytest suite (100% pass rate across 36 tests):

```bash
pytest -v
```

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.
