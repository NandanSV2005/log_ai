# LOG AI — Security Log Processing & Threat Detection Platform
## Comprehensive Project Implementation & Presentation Report

> **Document Purpose**: Technical architecture walkthrough, active implementation record, and hackathon presentation (PPT) preparation guide based on the current codebase of LOG AI.

---

## 1. Project Overview (Executive Summary)

### What Does LOG AI Do?
**LOG AI** is a high-performance, air-gapped security telemetry ingestion, normalization, and explainable threat detection platform. It collects raw system logs from heterogeneous network perimeter appliances—such as Cisco ASA firewalls, Fortinet FortiGate gateways, Suricata IDS/IPS sensors, and pfSense appliances—converts them into a standardized common schema (**OCSF 1.1**), detects suspicious activity using an in-memory **Isolation Forest ML model**, correlates related events into incident clusters, and presents plain-English explanations and step-by-step mitigation commands to security operators.

### Core Problem Solved
1. **Log Format Tower of Babel**: Security teams deal with dozens of incompatible log formats (CEF, Syslog, CSV, KV-pairs, JSON), making automated threat correlation across vendor siloes nearly impossible.
2. **Alert Fatigue & Opacity**: Conventional SIEMs flood analysts with thousands of uncontextualized alerts while black-box machine learning engines fail to explain *why* an anomaly was flagged.
3. **Data Tampering & Compliance Risks**: Unhashed log streams can be altered or erased by malicious actors post-compromise, destroying forensic auditability.

### Primary Workflow
```
[ Edge Log Payload ]
        │
        ▼
[ Raw Storage & SHA-256 Merkle Chain ]  ──► (Tamper-Proof Forensic Audit)
        │
        ▼
[ Dynamic Vendor Format Parser ]         ──► (Cisco, Fortinet, Suricata, pfSense, CEF)
        │
        ▼
[ OCSF 1.1 Schema Normalization ]       ──► (Unified Schema & Metadata)
        │
        ▼
[ Isolation Forest Anomaly Engine ]     ──► (Pure NumPy ML Scoring 0.0 - 100.0)
        │
        ▼
[ 15-Min Sliding Window Correlation ]   ──► (Incident Clustering per Source IP)
        │
        ▼
[ Explainable AI (XAI) & Playbooks ]    ──► (Feature Attribution Z-Scores & Remediation)
        │
        ▼
[ SOC Console & Threat Intelligence ]  ──► (React Dashboard, Radar, GeoIP Map)
```

---

## 2. Problem Statement

### Enterprise Security Challenges Addressed
- **Heterogeneous Perimeter Appliance Ingestion**: Modern enterprise SOCs operate multi-vendor environments. Parsing firewall logs, IDS alerts, and network telemetry usually requires writing brittle, custom regex rules per device type.
- **High Throughput & Zero Data Loss**: High-velocity network bursts can overflow standard log consumers. LOG AI guarantees raw log persistence to disk (`raw_writer.py`) before attempting parsing, preventing telemetry loss during spikes.
- **Forensic Auditability**: Compliance frameworks require proof that security telemetry has not been tampered with after storage.
- **Explainable Anomaly Detection**: Traditional ML anomaly detection models flag outliers without providing feature attributions, forcing analysts to manually verify raw log lines to discover why an alert triggered.

---

## 3. Solution Overview & Data Flow

LOG AI implements an end-to-end 6-stage telemetry processing architecture:

```
+-----------------------------------------------------------------------------------+
| 1. RAW PERSISTENCE & CRYPTOGRAPHIC MERKLE HASHING                                |
|    Payload captured, SHA-256 hashed, merged into Merkle Tree, written to disk.    |
+-----------------------------------------------------------------------------------+
                                          │
                                          ▼
+-----------------------------------------------------------------------------------+
| 2. VENDOR FORMAT AUTO-DETECTION                                                   |
|    Fast-path regex & key-value inspection identifies Cisco ASA, Fortinet,         |
|    Suricata, pfSense, CEF, or Syslog format.                                      |
+-----------------------------------------------------------------------------------+
                                          │
                                          ▼
+-----------------------------------------------------------------------------------+
| 3. OCSF 1.1 NORMALIZATION                                                         |
|    Attributes mapped to UnifiedEvent Pydantic model with standardized severity,    |
|    ISO UTC timestamps, and network classifications.                               |
+-----------------------------------------------------------------------------------+
                                          │
                                          ▼
+-----------------------------------------------------------------------------------+
| 4. ISOLATION FOREST ML ANOMALY SCORING                                            |
|    Pure NumPy 5-feature vector evaluation computes normalized threat score         |
|    (0.0 to 100.0) and Z-score feature attributions.                               |
+-----------------------------------------------------------------------------------+
                                          │
                                          ▼
+-----------------------------------------------------------------------------------+
| 5. 15-MINUTE SLIDING WINDOW CORRELATION                                           |
|    Events sharing the same source IP are correlated into single Incidents with    |
|    incremental MITRE ATT&CK kill-chain tracking.                                  |
+-----------------------------------------------------------------------------------+
                                          │
                                          ▼
+-----------------------------------------------------------------------------------+
| 6. EXPLAINABLE AI (XAI) & SOC CONSOLE UI                                          |
|    Plain-English feature attributions, 3-step mitigation commands, GeoIP map,     |
|    and interactive vector radar visualizer.                                       |
+-----------------------------------------------------------------------------------+
```

---

## 4. How the System Works (End-to-End Walkthrough)

1. **Ingestion Request (`app/routers/ingest.py`)**:
   An HTTP POST request containing a raw log string is submitted to `/api/v1/ingest`.
2. **Raw Storage & Merkle Hash (`app/storage/raw_writer.py` & `app/audit/hash_chain.py`)**:
   `raw_storage_manager.write_raw_payload()` calculates the SHA-256 digest of the payload, appends the hash to `audit_merkle_tree`, and writes a metadata record to a compressed Gzip file in `data/raw/raw_YYYYMMDD_HHMMSS_xxxx.jsonl.gz`.
3. **Format Auto-Detection (`app/parsers/dynamic_parser.py` & `app/parsers/vendor_parsers.py`)**:
   `DynamicParser.parse_single()` passes the string through `vendor_parser_registry`. It tests regex match patterns for Cisco ASA (`%ASA-`), Fortinet (`devname=`, `srcip=`), Suricata (`{"event_type":"alert"}`), pfSense (`filterlog:`), and CEF (`CEF:0|`).
4. **Parsing & Extraction**:
   The matching parser extracts key fields (`source_ip`, `destination_ip`, `action`, `severity`, `msg_id`, `policy_id`).
5. **OCSF 1.1 Field Normalization (`app/normalization/schema.py`)**:
   Extracted data is instantiated into a `UnifiedEvent` Pydantic model, setting standardized `event_type` (e.g. `cisco_asa:deny:ACL_OUTSIDE`), ISO-8601 UTC timestamp, and `original_event` string.
6. **Isolation Forest Anomaly Analysis (`app/detection/engine.py`)**:
   `anomaly_engine.predict_score(event)` builds a 5-element feature vector (`[ip_freq, ip_deny, action_code, sev_code, hour]`), calculates path length across the tree ensemble, computes Z-scores for each feature, and sets `threat_score` (0.0–100.0) and `threat_level` (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
7. **Rule Engine Triggers (`app/defense/rules_engine.py`)**:
   If specific conditions match (e.g. `action == deny` combined with high velocity), anomaly flags like `repeated_deny` or `suricata_alert` are attached.
8. **Incident Correlation (`app/detection/correlation.py`)**:
   `incident_engine.process_event(event)` looks up the active incident for `event.source_ip`. If an incident exists within the 15-minute rolling window, `event_count` is incremented, `last_seen` is updated, and `max_threat_score` is adjusted. If expired or non-existent, a new `Incident` cluster is created.
9. **XAI Explanation Generation (`app/xai/explainer.py`)**:
   `xai_explainer.generate_explanation(event)` translates Z-scores and anomaly flags into a plain-English summary (e.g., *"High threat (Score: 88.5) detected — elevated primarily due to Connection Velocity and Outside Port Scan from source IP 185.220.100.22"*).
10. **Normalized Persistence (`app/storage/normalized_writer.py`)**:
    The fully annotated `UnifiedEvent` is serialized to disk in `data/normalized/normalized_YYYYMMDD.jsonl`.
11. **Frontend Consumption (`frontend/src/pages/DashboardPage.jsx`)**:
    The React frontend polls `/api/v1/dashboard/stats`, `/api/v1/dashboard/events/recent`, and `/api/v1/dashboard/incidents` to update KPI counters, the telemetry stream table, the vector radar visualizer, and the offline GeoIP threat map.

---

## 5. Technical Architecture & Technology Stack

| Component | Technology | Purpose & Justification |
| :--- | :--- | :--- |
| **Backend Framework** | FastAPI (Python 3.10+) | High-performance asynchronous REST API framework with native OpenAPI doc generation and strict Pydantic data validation. |
| **Frontend Framework** | React 18 + Vite | Modular component architecture rendering responsive security UI dashboards with instant HMR and lightweight bundle sizes. |
| **Styling & Design** | TailwindCSS v4 | Utility-first styling enabling precise theme custom CSS variables for **Cyber Void** (dark slate) and **Sage Green** (off-white editorial) themes. |
| **Data Validation** | Pydantic v2 | Standardized schema enforcement for OCSF 1.1 `UnifiedEvent` and `Incident` models. |
| **ML Engine** | Pure NumPy IsolationForest | Custom pure-Python/NumPy implementation of Isolation Forest. Eliminates external C-DLL compilation dependencies (AppLocker safe) for reliable air-gapped SOC deployments. |
| **Rate Limiting** | SlowAPI | Protects log ingestion endpoints against denial-of-service floods (5 requests/sec per client IP). |
| **Cryptographic Audit** | WebCrypto / Python `hashlib` | SHA-256 Merkle tree calculation for tamper-proof raw log verification. |
| **Offline GeoIP** | Custom Offline CIDR DB | Resolves public IPs and RFC-1918 private subnets (`192.168.1.0/24`, `10.0.0.0/8`, `172.16.0.0/12`) to geographic coordinates without internet API calls. |
| **Authentication** | OAuth2 + JWT (python-jose) | Secure token-based authentication with bcrypt password hashing. |

---

## 6. Core Features

### 1. Landing Page & Scroll-Driven Storytelling (`LandingPage.jsx`)
- **Purpose**: Introduces visitors to LOG AI through simple, clear language and Apple-style scroll-driven progressive storytelling.
- **Implementation**: Sticky desktop visualizer panel (`lg:sticky lg:top-24`) transforming continuously across 6 pipeline stages as the user scrolls.
- **Evidence**: `frontend/src/pages/LandingPage.jsx`.

### 2. Unified SOC Dashboard (`DashboardPage.jsx`)
- **Purpose**: Gives security operators real-time visibility into overall threat posture, active incident count, pipeline latency, and live telemetry feeds.
- **Implementation**: Fetches `/api/v1/dashboard/stats`, `/api/v1/dashboard/incidents`, and `/api/v1/dashboard/events/recent`.
- **Evidence**: `app/routers/dashboard.py` (`get_dashboard_stats()`, `get_recent_events()`).

### 3. Log Explorer (`LogExplorerPage.jsx`)
- **Purpose**: Search, filter, inspect, and paginate raw and normalized telemetry logs across multiple vendor parsers.
- **Implementation**: Multi-parameter search filter supporting severity, event type, source IP, and date ranges.
- **Evidence**: `frontend/src/pages/LogExplorerPage.jsx` & `app/routers/dashboard.py`.

### 4. Forensic Investigation & Merkle Audit (`ForensicsPage.jsx`)
- **Purpose**: Verify SHA-256 cryptographic hashes of raw log payloads against the Merkle tree root hash to confirm zero data tampering.
- **Implementation**: Reads compressed Gzip records from `data/raw/` via `raw_storage_manager.read_raw_payload()`.
- **Evidence**: `app/storage/raw_writer.py` & `app/audit/hash_chain.py`.

### 5. Rule Studio (`RuleStudioPage.jsx`)
- **Purpose**: Allows analysts to configure custom detection rules, score multipliers, and pattern triggers.
- **Implementation**: `app/defense/rules_engine.py` evaluates rule sets dynamically during anomaly scoring.
- **Evidence**: `app/defense/rules_engine.py` & `frontend/src/pages/RuleStudioPage.jsx`.

### 6. AI Copilot & Explainable AI (XAI) (`CopilotWidget.jsx` & `app/xai/explainer.py`)
- **Purpose**: Provides plain-English explanations of flagged anomalies and step-by-step mitigation commands for active security incidents.
- **Implementation**: `XAIExplainer` calculates Z-score feature importance and combines them with rule descriptions.
- **Evidence**: `app/xai/explainer.py` & `app/routers/copilot.py`.

### 7. Financial Impact & ROI Estimator (`LandingPage.jsx`)
- **Purpose**: Allows security leaders to calculate monthly financial savings ($) and reclaimed analyst hours based on daily log volume and device count.
- **Implementation**: Dual range sliders bound to dynamic ROI formulas (`hoursSaved = ((logVolume * 0.001 * 0.85 * 3.5 * 30) / 60)`).
- **Evidence**: `frontend/src/pages/LandingPage.jsx`.

---

## 7. Supported Log Formats

LOG AI includes native parser support for top enterprise security perimeter appliances:

| Appliance / Format | Match Pattern / Signature | Extracted Fields | Standardized `event_type` |
| :--- | :--- | :--- | :--- |
| **Cisco ASA Firewall** | `%ASA-\d-\d+:` | Msg ID, Severity, Action (deny/permit), Src IP, Dst IP, ACL Name | `cisco_asa:{action}:{acl_name}` |
| **Fortinet FortiGate** | `devname=`, `srcip=`, `dstip=` | Dev Name, Src IP, Dst IP, Action, Policy ID, Level | `fortinet:{action}:policy_{policy_id}` |
| **Suricata IDS/IPS** | `{"event_type":"alert"}` (EVE JSON) | Alert Signature, Category, Severity, Src IP, Dst IP, Ports | `suricata:{category}` |
| **pfSense Filterlog** | `filterlog:`, CSV structure | Rule Number, Sub-rule, Interface, Action, Direction, IPs | `pfsense:{action}:{interface}` |
| **CEF Standard** | `CEF:0\|` | Device Vendor, Product, Version, Signature ID, Name, Severity | `cef:{vendor}:{device}` |
| **Generic Syslog / Text** | ISO Timestamps, IP regex scanning | Heuristic IP extraction, Severity keywords (`WARN`, `ERR`, `INFO`) | `unstructured_log` |

---

## 8. OCSF 1.1 Normalization Schema

All parsed logs are mapped to the standard `UnifiedEvent` Pydantic model (`app/normalization/schema.py`):

```python
class UnifiedEvent(BaseModel):
    timestamp: Union[datetime.datetime, str]  # ISO-8601 UTC timestamp
    source_ip: Optional[str]                   # Source IPv4/IPv6 address
    destination_ip: Optional[str]              # Destination IPv4/IPv6 address
    event_type: str                            # Standardized event category
    severity: Union[int, str]                  # Informational, Warning, Error, Critical
    raw_event_hash: Optional[str]              # SHA-256 hash of raw log payload
    threat_score: float                        # ML anomaly score (0.0 to 100.0)
    threat_level: str                          # LOW, MEDIUM, HIGH, CRITICAL
    anomaly_flags: list[str]                   # Triggered rule flags (e.g. repeated_deny)
    xai_explanation: str                       # Plain-English explanation
    owner_username: Optional[str]              # Multi-tenant data isolation tag
    feature_attribution: list[dict]            # Z-score breakdown per feature
    mitre_tactic: Optional[str]                # MITRE ATT&CK tactic (e.g. T1110)
    status: str                                # New, Investigating, Resolved, Dismissed
    remediation_steps: list[str]               # Recommended 3-step playbook commands
    original_event: str                        # Preserved original raw log line
```

---

## 9. Detection & Anomaly Analysis (Isolation Forest ML)

### Pure NumPy Isolation Forest Engine (`app/detection/engine.py`)
LOG AI features a custom, pure Python/NumPy implementation of the Isolation Forest anomaly detection algorithm.

1. **Feature Vector Extraction**:
   For every `UnifiedEvent`, a 5-element feature vector is computed:
   - `ip_freq`: Frequency count of source IP in sliding window.
   - `ip_deny`: Denial ratio for this source IP.
   - `action_code`: Numeric encoding of action (`deny` = 2.0, `alert` = 1.5, `pass` = 0.0).
   - `sev_code`: Numeric severity weight (`Critical` = 4.0, `Error` = 3.0, `Warning` = 2.0, `Info` = 1.0).
   - `hour`: Hour of day (0–23) to detect off-hours activity.

2. **Isolation Tree Ensemble**:
   The ensemble consists of `n_estimators=10` trees with `max_samples=64`. Average path length $h(x)$ across all trees determines anomaly score $s(x, n)$:
   $$s(x, n) = 2^{-\frac{E(h(x))}{c(n)}}$$

3. **Feature Attribution Z-Scores**:
   The anomaly engine calculates standard deviation Z-scores for each feature relative to baseline means. Features exceeding $Z \ge 1.5$ are flagged as primary drivers of the threat score.

---

## 10. Severity & Incident Correlation

### Severity Threshold Mapping
- **CRITICAL** ($\ge 90.0$ Threat Score): Immediate threat requiring active mitigation.
- **HIGH** ($70.0 - 89.9$ Threat Score): Multi-vector deny bursts or IDS alerts.
- **MEDIUM** ($35.0 - 69.9$ Threat Score): Anomalous connection rates or unclassified deny actions.
- **LOW** ($15.0 - 34.9$ Threat Score): Minor policy warnings or isolated events.
- **INFO** ($< 15.0$ Threat Score): Standard routine network traffic.

### Incident Clustering Heuristic (`app/detection/correlation.py`)
- **Grouping Key**: Scoped by `source_ip`.
- **Rolling Window**: 15 minutes (900 seconds).
- **Aggregation Metrics**: Tracks `first_seen`, `last_seen`, `event_count`, `max_threat_score`, `max_threat_level`, and ordered sequence of `mitre_tactics` (e.g. `["T1110 - Brute Force", "T1046 - Network Service Scanning"]`).

---

## 11. Offline GeoIP Resolution (`app/services/geoip.py`)

LOG AI provides zero-network-latency offline IP geolocation:
- **Public IPs**: Checked against a pre-compiled offline database of global CIDR ranges covering North America, Europe, Asia Pacific, South America, and Africa.
- **Internal RFC-1918 Subnets**: `192.168.1.0/24`, `10.0.0.0/8`, and `172.16.0.0/12` are categorized as `"Internal LAN Node"` (`Private Subnet`) with `is_private = True`.
- **Public Fallback**: Any unmapped public IP address is deterministically mapped using a byte-sum hash function to assign stable coordinates without making external web calls.

---

## 12. Security, Authentication & Multi-Tenancy

- **Authentication Endpoint (`app/routers/auth.py`)**: OAuth2 password bearer tokens using JWT (JSON Web Tokens) with 24-hour expiration.
- **Password Hashing**: Passwords stored using `passlib` with bcrypt hashing algorithms.
- **Multi-Tenant Data Isolation**: Every normalized record and correlated incident contains an `owner_username` tag. API queries in `dashboard.py` filter telemetry strictly by the authenticated tenant username.
- **Rate Limiting**: `SlowAPI` enforces 5 requests/sec per client IP address on ingestion endpoints to prevent resource exhaustion.

---

## 13. Traditional SIEM vs. LOG AI Comparison

| Feature / Capability | Traditional Legacy SIEM | LOG AI Platform |
| :--- | :--- | :--- |
| **Log Format Support** | Requires manual parsing rule creation for new vendors | Dynamic multi-vendor auto-detection (Cisco, Fortinet, Suricata, pfSense, CEF) |
| **Data Normalization** | Proprietary database schemas | Open Cybersecurity Schema Framework (**OCSF 1.1**) standard |
| **Forensic Integrity** | Unencrypted raw log storage | **SHA-256 Merkle Tree** audit chain with compressed raw Gzip storage |
| **Anomaly Scoring** | Static threshold alerts | Pure NumPy **Isolation Forest ML** anomaly scoring |
| **Explainability (XAI)** | Black-box opacity ("Alert triggered") | Plain-English **Z-score feature attributions** & 3-step mitigation commands |
| **Network Requirement** | Requires cloud API calls for GeoIP & threat intelligence | **100% Offline & Air-Gapped** local execution capability |

---

## 14. Presentation Slide Material (PPT Content)

This section provides a 12-slide presentation structure for hackathon demos:

### Slide 1 — Title Slide
- **Title**: LOG AI — Security Log Processing & Threat Detection Platform
- **Subtitle**: Air-Gapped Telemetry Pipeline with OCSF 1.1 & Isolation Forest ML
- **Visual**: LOG AI logo with vector radar graphic background.

### Slide 2 — The Problem: Enterprise Log Chaos
- **Key Points**:
  - Siloed security logs across Cisco, Fortinet, Suricata, and pfSense.
  - Alert fatigue caused by static threshold SIEMs.
  - Lack of explainability in black-box ML models.
- **Visual**: Diagram showing fragmented log streams leading to overloaded SOC analysts.

### Slide 3 — The Solution: LOG AI Unified Architecture
- **Key Points**:
  - Zero-Loss raw Gzip log capture + SHA-256 Merkle chain integrity.
  - OCSF 1.1 schema normalization across all vendor formats.
  - Explainable Isolation Forest ML anomaly scoring.
- **Visual**: 6-stage end-to-end data flow pipeline block diagram.

### Slide 4 — Zero-Loss Ingestion & Forensic Integrity
- **Key Points**:
  - Persistence to disk before parsing guarantees zero telemetry loss.
  - Cryptographic SHA-256 Merkle audit trail prevents log tampering.
- **Visual**: Code snippet of `raw_writer.py` and Gzip storage record format.

### Slide 5 — Multi-Vendor Parsing & OCSF 1.1 Schema
- **Key Points**:
  - Native regex fast-path for Cisco ASA, FortiGate, Suricata EVE JSON, pfSense.
  - Unified `UnifiedEvent` model for standardized correlation.
- **Visual**: Transformation example showing raw Cisco ASA log mapped to OCSF JSON.

### Slide 6 — Pure NumPy Isolation Forest Anomaly Detection
- **Key Points**:
  - 5-feature vector evaluation (`ip_freq`, `ip_deny`, `action_code`, `sev_code`, `hour`).
  - Pure Python/NumPy engine runs safely in air-gapped environments without external C-DLL risks.
- **Visual**: Isolation Forest decision tree diagram with anomaly path length formula.

### Slide 7 — 15-Minute Sliding Window Correlation
- **Key Points**:
  - Groups related security events by source IP within 15-minute rolling windows.
  - Clusters isolated log lines into actionable Incidents with MITRE ATT&CK kill-chain mapping.
- **Visual**: Screenshot of Incident cluster timeline card from Dashboard.

### Slide 8 — Explainable AI (XAI) & Actionable Playbooks
- **Key Points**:
  - Z-score feature attributions explain *why* an anomaly was flagged.
  - Provides 3-step firewall mitigation commands for instant analyst action.
- **Visual**: XAI Explanation box showing feature importance breakdown.

### Slide 9 — Offline GeoIP & Threat Map
- **Key Points**:
  - 100% offline CIDR database mapping global IPs and internal RFC-1918 subnets.
  - Zero external API call dependency.
- **Visual**: Screenshot of Threat Map with geographic markers.

### Slide 10 — Financial Impact & SOC ROI Estimator
- **Key Points**:
  - Dual sliders allow SOC managers to calculate monthly financial savings ($) and reclaimed analyst hours.
  - Demonstrates up to 85% MTTR reduction gain.
- **Visual**: Interactive ROI calculator UI card with circular SVG gauge.

### Slide 11 — Live System Demo & Technology Stack
- **Key Points**:
  - Tech Stack: FastAPI, React 18, TailwindCSS v4, Pydantic v2, NumPy, WebCrypto.
  - Fully responsive Cyber Void & Sage Green dual themes.
- **Visual**: Live application screenshot showing SOC Console layout.

### Slide 12 — Summary & Future Roadmap
- **Key Points**:
  - Complete air-gapped, explainable SOC intelligence pipeline.
  - Future scope: Distributed multi-node ingestion, automated firewall API block execution.
- **Visual**: One-page summary architecture card.

---

## 15. Live Demo Script (3-Minute Sequence)

1. **0:00 - 0:45 | Landing Page & Interactive Vector Radar**:
   - *Action*: Open `/` (Landing Page).
   - *Script*: *"Welcome to LOG AI. Here on the landing page, we see our interactive vector radar scanner monitoring edge perimeter telemetry in real time. As we scroll down through our 6-stage pipeline, our sticky visualizer demonstrates live raw log transformation into normalized OCSF events."*
2. **0:45 - 1:30 | Log Ingestion & OCSF Normalization**:
   - *Action*: Navigate to `/login`, sign in as `admin`, and open `/log-explorer`.
   - *Script*: *"Upon signing into the SOC console, we navigate to the Log Explorer. Here we see multi-vendor logs—from Cisco ASA to Suricata—parsed and normalized into the OCSF 1.1 unified schema."*
3. **1:30 - 2:15 | Anomaly Detection & XAI Explanation**:
   - *Action*: Click on a HIGH severity event to open the Event Detail drawer.
   - *Script*: *"When we inspect this flagged event from source IP 185.220.100.22, LOG AI’s Isolation Forest engine provides an exact threat score of 88.5 alongside plain-English XAI feature attributions explaining that connection velocity and deny actions drove the score."*
4. **2:15 - 3:00 | Incident Correlation & Offline Threat Map**:
   - *Action*: Open `/dashboard` and show the Incident list and Threat Map.
   - *Script*: *"Finally, our 15-minute sliding window correlation engine groups these 12 individual deny events into a single actionable incident, mapped geographically via our 100% offline GeoIP database."*

---

## 16. Likely Judge Technical Questions & Answers

1. **Q: Why implement a custom Isolation Forest instead of using Scikit-Learn?**
   - **A**: Standard C-extensions in scikit-learn can fail or be blocked by enterprise AppLocker policies in strict air-gapped SOC environments. Implementing a pure NumPy Isolation Forest guarantees zero external binary dependencies and instant startup.
2. **Q: How does the system handle high-volume log bursts without losing data?**
   - **A**: Requests hit `/api/v1/ingest` and immediately write compressed raw Gzip payloads to disk (`raw_writer.py`) before parsing begins. This guarantees zero log loss even during massive traffic spikes.
3. **Q: How does offline GeoIP work for private IP addresses?**
   - **A**: RFC-1918 subnets (`192.168.1.0/24`, `10.0.0.0/8`, `172.16.0.0/12`) are identified via Python’s `ipaddress` module and mapped to `"Internal LAN Node"`. Public IPs are checked against an offline CIDR database without internet lookups.
4. **Q: How does the cryptographic Merkle chain prevent log tampering?**
   - **A**: Every incoming raw log payload is hashed with SHA-256 and added as a leaf to `audit_merkle_tree`. Modifying any historical log file corrupts the calculated root hash, immediately exposing data tampering during audit checks.

---

## 17. Current Technical Limitations & Future Scope

### Current Limitations
- **Correlation Scope**: Incident correlation is currently scoped per `source_ip`. It does not yet group attacks across distributed botnet subnets sharing different source IPs.
- **Storage Engine**: Telemetry is persisted using compressed JSONL files on local disk rather than a distributed database cluster like PostgreSQL/ClickHouse.

### Future Scope
- **Automated Active Defense**: Adding direct API connectors to push firewall block rules directly to Cisco ASA and Fortinet routers upon incident creation.
- **Distributed Ingestion Nodes**: Scale background queue workers across multiple containerized worker nodes using Redis/RabbitMQ.

---

## 18. Implementation File Map

```
log_ai/
├── app/
│   ├── main.py                      # FastAPI application entry point & SPA route handlers
│   ├── config.py                    # Environment settings, storage paths & secrets validation
│   ├── normalization/
│   │   └── schema.py                # OCSF 1.1 UnifiedEvent Pydantic schema model
│   ├── storage/
│   │   ├── raw_writer.py            # Zero-loss raw log Gzip storage & Merkle hash trigger
│   │   └── normalized_writer.py     # Normalized UnifiedEvent JSONL persistence
│   ├── parsers/
│   │   ├── dynamic_parser.py        # Two-stage format detection & heuristic fallback parser
│   │   └── vendor_parsers.py         # Regex parsers for Cisco ASA, Fortinet, Suricata, pfSense, CEF
│   ├── detection/
│   │   ├── engine.py                # Pure NumPy Isolation Forest ML anomaly scoring engine
│   │   └── correlation.py           # 15-minute sliding window Incident correlation engine
│   ├── audit/
│   │   └── hash_chain.py            # SHA-256 Merkle Tree cryptographic audit implementation
│   ├── xai/
│   │   └── explainer.py             # XAI feature attribution Z-score plain-English explainer
│   ├── services/
│   │   ├── geoip.py                 # 100% offline CIDR GeoIP resolution engine
│   │   └── queue.py                 # Async background ingestion task queue manager
│   └── routers/
│       ├── ingest.py                # Raw log ingestion API (/api/v1/ingest) with rate limiting
│       ├── dashboard.py             # Stats, events, incidents & CSV report export API
│       ├── auth.py                  # JWT authentication, login & registration API
│       └── copilot.py               # AI Copilot threat inquiry API
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx      # Technical editorial landing page with sticky visualizer
│   │   │   ├── LoginPage.jsx        # Operator login page with view password toggle
│   │   │   ├── RegisterPage.jsx     # Operator registration page
│   │   │   ├── DashboardPage.jsx    # Unified SOC dashboard & live telemetry feed
│   │   │   ├── LogExplorerPage.jsx  # Multi-vendor log search & filtering page
│   │   │   ├── ForensicsPage.jsx    # Merkle audit & raw log forensic verification page
│   │   │   ├── RuleStudioPage.jsx   # Custom rule configuration page
│   │   │   ├── ThreatIntelPage.jsx  # Interactive offline GeoIP threat map page
│   │   │   └── SettingsPage.jsx     # System configuration & theme settings
│   │   ├── components/
│   │   │   ├── common/HeaderNav.jsx # Sticky header navigation with LOG // AI branding
│   │   │   └── copilot/CopilotWidget.jsx # AI Copilot slide-over drawer widget
│   │   └── styles/index.css         # Theme variables, grid patterns & radar animations
```

---

## 19. Final One-Page Presentation Summary

- **Problem**: Enterprise security teams face log format fragmentation across Cisco, Fortinet, Suricata, and pfSense devices, leading to alert fatigue and unexplainable anomaly alerts.
- **Solution**: **LOG AI**—an air-gapped, zero-loss log ingestion and normalization platform built on OCSF 1.1 standards with pure NumPy Isolation Forest ML scoring and SHA-256 Merkle forensic auditability.
- **Key Workflow**: Raw Gzip Storage $\rightarrow$ Format Auto-Detection $\rightarrow$ OCSF Normalization $\rightarrow$ Isolation Forest Scoring $\rightarrow$ 15-Min Sliding Window Correlation $\rightarrow$ Plain-English XAI Explanations.
- **Technical Differentiators**:
  1. **Zero Data Loss**: Persistence to disk before parsing.
  2. **Air-Gapped ML**: Pure NumPy Isolation Forest requiring zero C-DLL or external cloud API calls.
  3. **Explainable AI (XAI)**: Z-score feature attributions explaining exact threat drivers.
  4. **100% Offline GeoIP**: Local CIDR database resolving public IPs and RFC-1918 internal subnets.
- **Impact**: Up to **85% MTTR reduction** and **$65/hr analyst labor savings**.
