# LOG AI: Intelligent Security Operations Center (SOC) Engine

> **Zero-Loss Forensic Ingestion & Explainable AI Threat Intelligence System**
> 
> LOG AI is a high-performance, enterprise-hardened SOC dashboard and log ingestion engine designed for real-time threat detection, cryptographic Merkle tree auditability, and automated incident response.

---

## 🚀 Key Features

- 🛡️ **Enterprise Security Hardening**:
  - **Environment-Driven Authentication**: Password and JWT security managed via strict environment variables (`DASHBOARD_PASS`, `JWT_SECRET_KEY`).
  - **Rate Limiting**: Built-in `slowapi` rate limiter (`5 requests/sec`) on log ingestion (`/api/v1/ingest`) with client-side 429 toast alerts.
  - **Strict HTTP Security Headers**: Automatic `X-Content-Type-Options`, `Strict-Transport-Security`, `X-Frame-Options`, and `CSP` headers.

- 🤖 **Genuine ML Feature Attribution & Explainable AI (XAI)**:
  - **Pure-NumPy ML Ensemble**: Combines IsolationForest (unsupervised anomaly detection) and RandomForestClassifier (supervised threat matching).
  - **Z-Score Feature Attribution**: Evaluates event feature vectors against learned baseline normal means ($\boldsymbol{\mu}$) and standard deviations ($\boldsymbol{\sigma}$) across 5 telemetry dimensions (`ip_freq`, `ip_deny`, `action_code`, `sev_code`, `hour`).
  - **Dynamic XAI Explanations**: Highlights exact top-contributing features (e.g., *"Threat score (78.5) elevated primarily due to source IP request frequency (7.1x baseline) and off-hours access (03:14 local)"*).

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

## 🔬 ML Architecture, Training Dataset & Model Persistence

- **Ensemble Engine**: Built deliberately as a lightweight, pure-Python & NumPy ensemble (IsolationForest + RandomForest) to eliminate C-DLL native binary dependencies (`scikit-learn`, `C++ CRT`) for constrained/air-gapped SOC container deployments.
- **Training Dataset**: Trained on a 600-sample programmatically generated synthetic dataset:
  - **400 Normal Baseline Samples**: Low IP request frequency ($\mu=2.1$), zero/rare denials, business-hour access (08:00–18:00), and informational severity.
  - **200 Threat Vectors**: Brute-force sprays (high request/deny counts up to 35 reqs), off-hours probes (01:00–05:00 access), and critical vulnerability exploits.
- **Model Persistence**: Baseline feature statistics ($\boldsymbol{\mu}$, $\boldsymbol{\sigma}$) and model configurations persist to `data/models/ml_baseline.json`, ensuring fast cold starts without re-training.

---

## 🔑 Environment Variables & Security Configuration

Create a `.env` file in the root directory (or configure environment variables in your deployment dashboard):

```env
# Production Secret Configuration (REQUIRED in production / strict mode)
JWT_SECRET_KEY=your_secure_random_jwt_signing_secret_here
DASHBOARD_PASS=your_secure_admin_password_here
DASHBOARD_USER=admin

# AI SOC Copilot Integration
GEMINI_API_KEY=your_google_gemini_api_key_here
GEMINI_MODEL=gemini-3.6-flash

# Security Control Flags
ENVIRONMENT=production   # 'production' or 'development'
STRICT_SECRETS=true      # Set 'true' to force startup failure if secrets are missing
```

> **Note on Local Development**: If `DASHBOARD_PASS` or `JWT_SECRET_KEY` are not set in a local development environment (`ENVIRONMENT=development`), LOG AI automatically generates cryptographically secure, session-unique random keys via `secrets.token_urlsafe()` and logs them at startup. In production or strict mode (`STRICT_SECRETS=true`), missing secret variables will cause an immediate startup failure (`RuntimeError`).

---

## 🐳 Getting Started (Docker)

To build and launch LOG AI inside a lightweight production Docker container:

```bash
# 1. Build the Docker image
docker build -t log-ai:latest .

# 2. Run the container with environment secrets
docker run -p 8000:8000 \
  -e JWT_SECRET_KEY="your_secure_jwt_secret" \
  -e DASHBOARD_PASS="your_secure_admin_password" \
  -e GEMINI_API_KEY="your_gemini_api_key" \
  log-ai:latest
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

# 4. Copy and edit environment template
cp .env.example .env  # Configure your secret keys

# 5. Start the server via Uvicorn
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 🧪 Running the Test Suite

Run the full automated pytest suite:

```bash
pytest -v
```

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.
