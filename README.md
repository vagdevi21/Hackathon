# DarkWatch AI — Cyber Threat Early Warning & Vulnerability Response System

> **Team SYNORA**: Vagdevi (Lead Admin), Vamsi (SOC Tier 2), Surya (Threat Hunter), Tabasum (Tier 1 Analyst), Harini (Compliance Officer).

DarkWatch AI is an AI-powered, zero-trust cyber early warning, SIEM telemetry analysis, vulnerability assessment, automated patch deployment, and NIST FIPS 180-4 tamper-evident audit logging platform.

---

## Key Capabilities & Architecture

- **Full-Stack Express & Vite Runtime**: Real Node.js Express backend (`server.ts`) running unified on port 3000 alongside Vite middleware.
- **Enterprise Zero-Trust Authentication**:
  - Registration with username, validated corporate/personal email, and strict password enforcement (minimum 8 characters, 1 uppercase, 1 lowercase, 1 digit, 1 special character).
  - Secure PBKDF2 password derivation (100,000 iterations, 64-byte key length with cryptographic salt).
  - Account lockout protection: 5 consecutive failed attempts trigger a 24-hour security lockout.
  - Default role assignment for new registrants: `TIER_1_ANALYST` (least-privilege principle).
  - Cryptographically secure dynamic 6-digit OTP generation (`crypto.randomInt(100000, 1000000)`), single-use enforcement, 10-minute expiry, max 5 attempts, and 60-second resend cooldown.
  - Multi-factor authentication support: Password credentials, dynamic OTP dispatch, biometric sensor simulations, and ocular retinal scanners.
- **NIST FIPS 180-4 Standard SHA-256 Audit Chain**:
  - Every security event (login, failed attempt, scan, patch approval, AI triage, SIEM anomaly) is hashed with a verifiable previous-block hash pointer.
  - Chain integrity verification endpoint (`GET /api/audit/verify`) and interactive "Verify Chain Integrity" dashboard button with zero-trust cryptographic validation.
- **SIEM Telemetry Ingestion API**:
  - Live ingestion endpoint (`POST /api/siem/events`) accepting incoming log events (syslog, Suricata, Zeek, AWS GuardDuty, CrowdStrike).
  - Automatic event normalization, threat score calculation (`evaluateThreatRisk`), and auto-escalation into active threat alerts.
- **Server-Side AI Threat Reasoning Proxy**:
  - Server-side proxy route (`POST /api/ai/analyze-threat`) utilizing Google Gemini 2.5 Flash (`@google/genai`) to generate remediation playbooks and MITRE ATT&CK mappings without exposing API keys to the browser.
- **Persistent Data Store**:
  - Atomic JSON database engine (`/data/darkwatch-db.json`) adhering to Firestore collection schemas (`users`, `otps`, `sessions`, `scans`, `threats`, `vulnerabilities`, `patches`, `auditLogs`, `siemEvents`).

---

## Quick Start & Commands

### Prerequisites
- Node.js 20+ (Node 22 recommended)
- npm

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```
*(Optional: Set `GEMINI_API_KEY` for live AI threat intelligence and `RESEND_API_KEY` for inbox email OTP delivery. In dev mode, OTP codes are logged to the console).*

### 3. Start Development Server
```bash
npm run dev
```
Starts Express server on `http://localhost:3000` with Vite middleware mounted.

### 4. Build for Production
```bash
npm run build
```

### 5. Start Production Server
```bash
npm start
```

### 6. Run Automated Test Suite
```bash
npm test
```
Executes all unit and integration tests across security algorithms, link risk scoring, auth lifecycle, dynamic OTPs, and NIST SHA-256 hash chains.

---

## API Reference

### Authentication & Account Management
| Endpoint | Method | Description |
|---|---|---|
| `/api/auth/register` | `POST` | Register new analyst account & dispatches dynamic OTP |
| `/api/auth/verify-registration` | `POST` | Verifies dynamic 6-digit registration OTP & activates session |
| `/api/auth/login` | `POST` | Authenticates user (with rate limiting & lockout) |
| `/api/auth/forgot-password` | `POST` | Dispatches dynamic OTP for password recovery |
| `/api/auth/reset-password` | `POST` | Validates recovery OTP and sets new password |
| `/api/auth/me` | `GET` | Returns active user profile |
| `/api/auth/logout` | `POST` | Invalidates active bearer token session |

### Security Scans & Threat Intelligence
| Endpoint | Method | Description |
|---|---|---|
| `/api/scans` | `GET` | Retrieve scan investigation history |
| `/api/scans` | `POST` | Execute & persist URL/phone reputation scan |
| `/api/threats` | `GET` | Active threat alerts feed |
| `/api/threats` | `POST` | Create or update threat alert |
| `/api/vulnerabilities` | `GET` | Vulnerability catalog & CVE items |
| `/api/patches` | `GET` | Patch deployment pipeline status |
| `/api/patches/:id/deploy` | `POST` | Approve & deploy security patch |

### SIEM Ingestion & Audit Logs
| Endpoint | Method | Description |
|---|---|---|
| `/api/siem/events` | `GET` | Retrieve SIEM telemetry buffer |
| `/api/siem/events` | `POST` | Ingest raw event, normalize & score risk |
| `/api/audit` | `GET` | Retrieve cryptographically chained audit log |
| `/api/audit/verify` | `GET` | Validate entire SHA-256 hash chain integrity |
| `/api/ai/analyze-threat` | `POST` | Server-side Gemini 2.5 Flash threat reasoning |

### Authenticity, Scam & Threat Verification Center
| Endpoint | Method | Description |
|---|---|---|
| `/api/verification/phone` | `POST` | Validates format (+91 first), E.164 normalization, suspicious patterns, caller reputation |
| `/api/verification/url` | `POST` | Syntax checks, strict SSRF loopback/cloud metadata protection, lookalike & punycode analysis |
| `/api/verification/document` | `POST` | PDF/PNG/JPG inspection, SHA-256 fingerprinting, mock/sample exam recognition, authoritative matching |
| `/api/verification/providers` | `GET` | Provider transparency status (configured vs unconfigured honest fallbacks) |

---

## License
Apache-2.0. Copyright (c) 2026 Team SYNORA.
