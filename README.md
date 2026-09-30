# JanSetu AI (जनसेतु) 🇮🇳
### Digital Public Good for Multilingual Citizen Feedback & National Infrastructure Intelligence

> **"Bridging Citizen Voice with National Infrastructure Priorities through Multilingual Google Gemini AI and PM Gati Shakti Triangulation."**

---

## 📌 Executive Overview & The Problem

Governments across India struggle to consolidate citizen feedback and align it with national infrastructure priorities. Development requests live in fragmented, siloed departmental systems, leading to:
- **Misaligned Public Spending:** Millions allocated to low-urgency urban corridors while critical tribal/rural habitations remain isolated.
- **Unaddressed Infrastructure Gaps:** Washaways of rural bridges, groundwater fluoride contamination, and sub-centre power blackouts persist for years before reaching national planners.
- **No Measurement of DPI Impact:** Inability to measure how large-scale Digital Public Infrastructure (DPI) initiatives (Jal Jeevan Mission, PMGSY, PM-JANMAN) transform ground-level sentiment.

### The Challenge & JanSetu Solution
**JanSetu AI (जनसेतु)** is built as an **open-standard Digital Public Good (DPG)** that:
1. **Aggregates Multilingual Citizen Voice:** Accepts voice recordings, WhatsApp/Telegram messages, and Gram Panchayat kiosk inputs across **11 Indian Languages** (Hindi, Tamil, Telugu, Bengali, Marathi, Kannada, Gujarati, Malayalam, Punjabi, Odia, and English).
2. **Triangulates with National Master Plans:** Merges citizen feedback with **NITI Aayog Aspirational Districts & Blocks indices**, **PM Gati Shakti GIS layers**, and central mission allocations (Jal Jeevan Mission, PMGSY-IV, PM-JANMAN, PM-ABHIM, PM-Surya Ghar).
3. **Calculates Infrastructure Deficit & Urgency Score (IDUS):** Dynamically computes district-level priority scores based on demand density, vulnerability index, and physical infrastructure deficits.
4. **Empowers Policymakers with Gemini Policy Copilot:** Enables Chief Secretaries, District Magistrates, and Union Ministers to query demand hotspots and generate **1-Click Detailed Project Reports (DPRs)**.

---

## 🚀 Ultra-Fast Google Tech Stack

| Google Technology | Role in JanSetu AI |
| :--- | :--- |
| **Google AI Studio** | Prototyping environment used to iterate system instructions, temperature, and few-shot reasoning for Indian regional dialects. Accessible via in-app playground. |
| **Gemini 3.8 / 2.5 / 1.5 Flash** | Ultra-low latency multilingual reasoning engine. Powers speech transcription understanding, category & urgency extraction, and formal DPR generation. |
| **Google Cloud Run** | Serverless, autoscaling deployment running backend and frontend in a single container optimized for low latency across India (`asia-south1` Mumbai). |

---

## 🏗️ Architecture & Data Pipeline

```
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │                 CITIZEN MULTILINGUAL INGESTION LAYER                         │
  │  🎙️ Web Audio (Native Voice)  │  💬 WhatsApp Bot  │  🏛️ Gram Panchayat Kiosk  │
  │  (Hindi, Tamil, Telugu, Bengali, Marathi, Kannada, Malayalam, Odia, Punjabi)│
  └──────────────────────────────────────┬──────────────────────────────────────┘
                                         ▼
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │                      GEMINI 2.5 FLASH AI ENGINE                             │
  │  • Multilingual Dialect Recognition & Translation                           │
  │  • Grievance Intent & Urgency Extraction (Score 1 - 5)                      │
  │  • Demographics & Beneficiary Impact Estimation                             │
  │  • Central Scheme Auto-Mapping (JJM, PMGSY-IV, PM-JANMAN, PM-ABHIM)         │
  └──────────────────────────────────────┬──────────────────────────────────────┘
                                         ▼
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │              TRIANGULATION & DECISION INTELLIGENCE ENGINE                   │
  │  • NITI Aayog Aspirational District Indicators                              │
  │  • PM Gati Shakti Geo-Spatial Master Plan Corridors                         │
  │  • Infrastructure Deficit & Urgency Score (IDUS) Computation                 │
  └──────────────────────────────────────┬──────────────────────────────────────┘
                                         ▼
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │                   POLICYMAKER COMMAND CENTER                                │
  │  🗺️ Interactive GIS Hotspot Map    │  📊 Demographic & Capex Spend Analytics│
  │  🤖 Gemini Policy Copilot           │  📄 1-Click Detailed Project Reports   │
  └─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🌟 Key Features

### 1. Multilingual Voice & WhatsApp Portal
- **Web Audio Live Waveform Visualizer:** Speaks or records grievances directly in local dialects with real-time frequency analysis.
- **1-Click Grassroots Audio Samples:** Test authentic complaints from Bastar (Chhindgarh bridge collapse in Hindi), Malkangiri (fluoride water crisis in Odia), Dharmapuri (PM SHRI girls' sanitation in Tamil), and Nanded (transformer outage in Marathi).
- **Official DPI Receipt:** Generates an open-standard grievance tracking ID (e.g. `JS-2026-CH-BAS-860`) with verification checksum.

### 2. National GIS Hotspot Map (PM Gati Shakti Aligned)
- Interactive Leaflet map of India featuring **15 monitored districts** spanning all regions.
- Custom pulsing beacons color-coded by **IDUS priority**:
  - 🔴 **Critical (IDUS > 80):** Bastar, Malkangiri, Baksa, Raichur
  - 🟠 **High (IDUS 70 - 80):** Wayanad, Nanded, Baramulla, Alwar
  - 🔵 **Moderate (IDUS < 70):** Varanasi, Nalanda, Dharmapuri
- Filterable by sector (Water, Roads, Power, Health, School, Drainage) and NITI Aayog Aspirational status.

### 3. Detailed Project Report (DPR) Formulation Engine
- Automatically converts citizen complaints into formal **Government of India Detailed Project Reports**.
- Specifies:
  - Technical engineering scope (e.g. pre-stressed concrete culvert, deep solar borewell).
  - Outlay in ₹ Crores.
  - Marginalized / PVTG demographic beneficiary saturation %.
  - Socio-economic ROI (transit time reduction, agricultural market access).
  - Phased execution milestones and SDG alignment.

### 4. Gemini Policy Copilot
- Conversational strategic advisor grounded in district data and national schemes.
- Cites budget gaps, underfunded blocks, and recommends Capex reallocations between ministries.

### 5. In-App Google AI Studio Lab
- Model selector: Gemini 3.8 Flash, Gemini 2.5 Flash, Gemini 1.5 Flash.
- Interactive system instructions tester with pre-configured personas (National Planner, CAG Auditor, Gram Sevak).
- Seamless dual-mode: Works out-of-the-box with built-in intelligent offline engine, or instantly with a live Google AI Studio API key!

---

## 🛠️ Quickstart & Local Setup

### Prerequisites
- Node.js v18+ (Node v20+ recommended)
- npm v9+

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-repo/jansetu-ai.git
cd jansetu-ai

# Install server dependencies
cd server && npm install && cd ..

# Install client dependencies
cd client && npm install && cd ..
```

### 2. Configure Environment (Optional for Live Gemini Mode)
Create a `.env` file in the `server` directory (or use the in-app Google AI Studio settings modal):
```env
PORT=5000
GEMINI_API_KEY=your_google_ai_studio_api_key_here
GEMINI_MODEL=gemini-2.5-flash
```
*Note: If no API key is provided, JanSetu AI automatically runs its high-fidelity offline multilingual intelligence engine.*

### 3. Build & Run the Platform
```bash
# Build the client production bundle
npm run build:client

# Start the unified JanSetu AI server
npm start
```
Open **`http://localhost:5000`** in your browser!

---

## ☁️ Google Cloud Run Deployment

JanSetu AI includes a production-ready multi-stage Docker container specification.

### 1-Click Deployment:
```bash
# Using Google Cloud SDK
chmod +x deploy-cloudrun.sh
./deploy-cloudrun.sh <YOUR_GCP_PROJECT_ID> asia-south1
```

Or on Windows PowerShell:
```powershell
.\deploy-cloudrun.ps1 -ProjectId "YOUR_GCP_PROJECT_ID" -Region "asia-south1"
```

---

## 📡 Open API Reference (Digital Public Good)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | System status, active Gemini model & deployment telemetry |
| `GET` | `/api/metrics/national` | Aggregated DPI metrics, population impact, and resolution index |
| `GET` | `/api/districts` | Complete dataset of districts with census, Gati Shakti & IDUS scores |
| `GET` | `/api/schemes` | Central & State infrastructure missions (JJM, PMGSY, PM-JANMAN, etc.) |
| `GET` | `/api/requests` | Filterable citizen requests by district, urgency, and category |
| `POST` | `/api/citizen/submit` | Ingests multilingual voice/text, analyzes with Gemini & issues DPI ticket |
| `POST` | `/api/copilot/chat` | Grounded Policy Copilot conversational query |
| `POST` | `/api/dpr/generate` | Generates official Government Detailed Project Report (DPR) |
| `POST` | `/api/ai/verify-key` | Validates a Google AI Studio API key |

---

## 🇮🇳 Open Standards Compliance

- **Beckn Protocol:** Schema compatible with open civic grievance discovery and routing.
- **Bhashini:** Standardized multilingual text-to-speech & speech-to-text tokenization.
- **PM Gati Shakti National Master Plan:** Geo-spatial schema alignment with multi-modal transport and water supply grid nodes.

---
*Built with ❤️ for Indian Communities and National Policymakers.*
