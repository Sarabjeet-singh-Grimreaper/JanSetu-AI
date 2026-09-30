# JanSetu AI API Documentation
## Digital Public Good for Citizen Infrastructure Intelligence

**Version:** 2.5.0  
**Base URL:** `https://your-deployment-url.com`  
**Content Type:** `application/json`  
**Authentication:** Public access (Digital Public Good)

---

## 🚀 Quick Start

```bash
# Health check
curl https://your-deployment-url.com/api/health

# Get national metrics
curl https://your-deployment-url.com/api/metrics/national

# Submit citizen grievance
curl -X POST https://your-deployment-url.com/api/citizen/submit \
  -H "Content-Type: application/json" \
  -d '{
    "text": "हमारे गांव में पानी की समस्या है",
    "districtName": "Bastar",
    "stateName": "Chhattisgarh"
  }'
```

---

## 📡 API Endpoints

### 1. Health Check & System Status
**GET** `/api/health`

Check system status, active AI model, and deployment telemetry.

**Response:**
```json
{
  "status": "online",
  "platform": "JanSetu AI - Digital Public Good",
  "version": "2.5.0",
  "gemini": {
    "hasKey": true,
    "activeModel": "gemini-2.5-flash",
    "mode": "live-google-ai-studio"
  },
  "cloudDeployment": "Google Cloud Run Ready",
  "timestamp": "2026-09-27T12:00:00.000Z"
}
```

---

### 2. National Overview Metrics
**GET** `/api/metrics/national`

Get aggregated DPI metrics, population impact, and resolution index.

**Response:**
```json
{
  "totalRequests": 3842,
  "totalPopulationImpact": 142000,
  "highUrgencyCount": 892,
  "aspirationalDistrictsCount": 8,
  "languagesTracked": 11,
  "nationalBudgetUtilizationPct": 67,
  "categoryCounts": {
    "Drinking Water": 1240,
    "Rural Roads & Bridges": 980,
    "Healthcare Facility": 450,
    "Electricity & Solar": 380,
    "School & Anganwadi": 320,
    "Drainage & Flood Control": 280,
    "Public Transport": 120,
    "Digital & Broadband": 72
  },
  "dpiResolutionIndex": 78.4
}
```

---

### 3. Districts Data with Geo Coordinates & IDUS Scores
**GET** `/api/districts`

Get complete dataset of districts with census, Gati Shakti & IDUS scores.

**Response:**
```json
{
  "districts": [
    {
      "id": "CG-BAS-001",
      "name": "Bastar",
      "state": "Chhattisgarh",
      "lat": 19.0760,
      "lng": 81.8686,
      "population": 1410000,
      "ruralPct": 78.5,
      "tribalPct": 68.2,
      "isAspirational": true,
      "topGrievanceCategory": "Rural Roads & Bridges",
      "sanctionedBudgetCr": 45.2,
      "spentBudgetCr": 28.4,
      "activeComplaintsCount": 612,
      "calculatedIDUS": 89.5,
      "indices": {
        "pipedWaterCoveragePct": 34.5,
        "allWeatherRoadConnectivityPct": 42.8
      }
    }
  ]
}
```

---

### 4. Infrastructure Schemes (Central & State)
**GET** `/api/schemes`

Get central and state infrastructure missions data.

**Response:**
```json
{
  "schemes": [
    {
      "code": "JJM",
      "name": "Jal Jeevan Mission",
      "ministry": "Ministry of Jal Shakti",
      "focus": "Rural tap water supply",
      "nationalBudgetCr": 320000,
      "targetMetric": "100% rural household tap connection by 2024"
    },
    {
      "code": "PMGSY-IV",
      "name": "Pradhan Mantri Gram Sadak Yojana Phase IV",
      "ministry": "Ministry of Rural Development",
      "focus": "All-weather rural road connectivity",
      "nationalBudgetCr": 150000,
      "targetMetric": "Eligible habitations connected with all-weather roads"
    }
  ]
}
```

---

### 5. Citizen Requests Querying
**GET** `/api/requests`

Filterable citizen requests by district, urgency, category, and status.

**Query Parameters:**
- `category` (optional): Filter by grievance category
- `district` (optional): Filter by district name
- `urgency` (optional): Filter by urgency level (1-5)
- `status` (optional): Filter by status
- `channel` (optional): Filter by submission channel

**Example:**
```bash
curl "https://your-deployment-url.com/api/requests?category=Drinking%20Water&urgency=5"
```

**Response:**
```json
{
  "total": 142,
  "requests": [
    {
      "id": "JS-2026-CH-BAS-860",
      "timestamp": "2026-09-27T10:30:00.000Z",
      "channel": "voice",
      "language": "hi",
      "languageName": "Hindi (हिंदी)",
      "originalText": "हमारे गांव में पानी की समस्या है",
      "translatedEnglish": "Water problem in our village",
      "category": "Drinking Water",
      "urgencyLevel": 5,
      "sentimentScore": -0.85,
      "populationAffected": 4500,
      "state": "Chhattisgarh",
      "district": "Bastar",
      "districtId": "CG-BAS-001",
      "block": "Darbha",
      "panchayat": "Chhindgarh GP",
      "lat": 19.0760,
      "lng": 81.8686,
      "status": "AI_Triangulated",
      "matchedSchemeCode": "JJM",
      "photoUrl": "https://example.com/photo.jpg",
      "aiMetadata": {
        "urgencyReasoning": "Critical community dependency on drinking water",
        "recommendedAction": "Escalate to District Magistrate",
        "keyEntities": {
          "hazardType": "Water scarcity",
          "affectedGroup": "Rural community",
          "infrastructureType": "Water supply"
        }
      }
    }
  ]
}
```

---

### 6. Citizen Ingestion: Voice/Text/WhatsApp Submission
**POST** `/api/citizen/submit`

Ingest multilingual voice/text, analyze with Gemini & issue DPI ticket.

**Request Body:**
```json
{
  "text": "हमारे गांव में पानी की समस्या है",
  "channel": "voice",
  "districtName": "Bastar",
  "stateName": "Chhattisgarh",
  "block": "Darbha",
  "panchayat": "Chhindgarh GP",
  "lat": 19.0760,
  "lng": 81.8686,
  "photoUrl": "https://example.com/photo.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "dpiTicketId": "JS-2026-CH-BAS-860",
  "request": {
    "id": "JS-2026-CH-BAS-860",
    "timestamp": "2026-09-27T10:30:00.000Z",
    "channel": "voice",
    "language": "hi",
    "languageName": "Hindi (हिंदी)",
    "originalText": "हमारे गांव में पानी की समस्या है",
    "translatedEnglish": "Water problem in our village",
    "category": "Drinking Water",
    "urgencyLevel": 5,
    "sentimentScore": -0.85,
    "populationAffected": 4500,
    "status": "AI_Triangulated",
    "matchedSchemeCode": "JJM"
  }
}
```

---

### 7. Detailed Project Report (DPR) Generation
**POST** `/api/dpr/generate`

Generate official Government of India Detailed Project Report.

**Request Body:**
```json
{
  "requestId": "JS-2026-CH-BAS-860"
}
```

**Response:**
```json
{
  "success": true,
  "dpr": {
    "source": "gemini-live",
    "dprNumber": "DPR/GOI/JJM/2026/4521",
    "projectTitle": "Comprehensive Drinking Water Saturation Scheme for Chhindgarh GP",
    "sponsoringMinistry": "Ministry of Jal Shakti",
    "sanctioningScheme": "JJM",
    "estimatedBudgetInrCr": 3.2,
    "executionDurationMonths": 6,
    "beneficiaryDemographics": {
      "totalHouseholds": 937,
      "marginalizedBeneficiaryPct": 88.2,
      "gramPanchayatsCovered": 3
    },
    "technicalScope": [
      "Detailed soil & geophysical survey",
      "Deep solar borewell installation",
      "IoT telemetry sensors for monitoring"
    ],
    "economicRoiAndMultiplier": "Reduces emergency transit delays by 68%, prevents seasonal school absenteeism",
    "riskAndMitigation": [
      {
        "risk": "Monsoon construction delays",
        "mitigation": "Pre-fabrication of modular components"
      }
    ],
    "implementationMilestones": [
      {
        "phase": "Administrative & Financial Sanction",
        "durationDays": 14,
        "deliverable": "Cabinet approval & fund allocation"
      }
    ],
    "sdgGoalsAligned": [
      "SDG 6 (Clean Water)",
      "SDG 9 (Industry, Innovation & Infrastructure)",
      "SDG 11 (Sustainable Communities)"
    ]
  }
}
```

---

### 8. Policy Copilot Interactive Assistant
**POST** `/api/copilot/chat`

Grounded Policy Copilot conversational query for policymakers.

**Request Body:**
```json
{
  "message": "What are the top water infrastructure hotspots?",
  "conversationHistory": [
    {
      "role": "user",
      "content": "Show me water infrastructure issues"
    },
    {
      "role": "assistant",
      "content": "Based on analysis..."
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "reply": "**National Drinking Water Demand Hotspot Analysis (Jal Jeevan Mission)**\n\nBased on 1,840+ verified citizen voice submissions:\n\n1. **Top Hotspot: Malkangiri District (Odisha)**\n   - Piped water coverage: 34.5%\n   - Recommendation: Sanction ₹42.8 Cr multi-village solar water treatment scheme",
  "source": "gemini-live"
}
```

---

### 9. Google AI Studio Key Verification
**POST** `/api/ai/verify-key`

Validate a Google AI Studio API key for live AI mode.

**Request Body:**
```json
{
  "apiKey": "AIzaSy..."
}
```

**Response:**
```json
{
  "valid": true,
  "message": "Google AI Studio API key verified successfully!",
  "response": "OK"
}
```

---

### 10. Update AI Configuration
**POST** `/api/ai/update-config`

Update AI model configuration and API key.

**Request Body:**
```json
{
  "model": "gemini-2.5-flash",
  "apiKey": "AIzaSy..."
}
```

**Response:**
```json
{
  "success": true,
  "currentModel": "gemini-2.5-flash",
  "hasKey": true,
  "activeMode": "live-google-ai-studio"
}
```

---

### 11. Performance Monitoring
**GET** `/api/performance`

Get system performance metrics for monitoring and health checks.

**Response:**
```json
{
  "uptime": 3600.5,
  "performance": {
    "averageResponseTime": 245,
    "maxResponseTime": 1200,
    "totalRequests": 15234,
    "totalErrors": 23,
    "errorRate": "0.15"
  },
  "endpoints": {
    "/api/health": 4521,
    "/api/districts": 3892,
    "/api/citizen/submit": 2847
  },
  "errors": {
    "/api/citizen/submit": 12,
    "/api/dpr/generate": 8
  },
  "memory": {
    "used": 256,
    "total": 512
  },
  "timestamp": "2026-09-27T12:00:00.000Z"
}
```

---

## 🔒 Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "status": 400,
  "timestamp": "2026-09-27T12:00:00.000Z"
}
```

**Common HTTP Status Codes:**
- `200 OK`: Successful request
- `400 Bad Request`: Invalid request parameters
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

---

## 🌐 Open Standards Compliance

JanSetu AI follows Indian Digital Public Infrastructure standards:

- **Beckn Protocol**: Open civic grievance discovery and routing
- **Bhashini**: Standardized multilingual text-to-speech & speech-to-text
- **PM Gati Shakti**: Geo-spatial schema alignment with multi-modal transport

---

## 📊 Rate Limiting

Current implementation supports:
- **Concurrent Requests**: 80 per instance (Cloud Run default)
- **Auto-scaling**: 0-100 instances based on traffic
- **Timeout**: 300 seconds per request

For production deployments, implement API gateway rate limiting based on your requirements.

---

## 🔑 Authentication

JanSetu AI is designed as a Digital Public Good with public access. For restricted deployments:
- Implement API key authentication via headers
- Use Google Cloud IAM for service-to-service authentication
- Integrate with state government SSO systems

---

## 📝 SDK Examples

### JavaScript/Node.js
```javascript
const API_BASE = 'https://your-deployment-url.com';

// Submit grievance
async function submitGrievance(text, district) {
  const response = await fetch(`${API_BASE}/api/citizen/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      districtName: district,
      channel: 'web'
    })
  });
  return response.json();
}

// Get national metrics
async function getMetrics() {
  const response = await fetch(`${API_BASE}/api/metrics/national`);
  return response.json();
}
```

### Python
```python
import requests

API_BASE = 'https://your-deployment-url.com'

def submit_grievance(text, district):
    response = requests.post(
        f'{API_BASE}/api/citizen/submit',
        json={
            'text': text,
            'districtName': district,
            'channel': 'web'
        }
    )
    return response.json()

def get_metrics():
    response = requests.get(f'{API_BASE}/api/metrics/national')
    return response.json()
```

### cURL
```bash
# Submit grievance
curl -X POST https://your-deployment-url.com/api/citizen/submit \
  -H "Content-Type: application/json" \
  -d '{"text":"Water problem","districtName":"Bastar","channel":"web"}'

# Get DPR
curl -X POST https://your-deployment-url.com/api/dpr/generate \
  -H "Content-Type: application/json" \
  -d '{"requestId":"JS-2026-CH-BAS-860"}'
```

---

## 🚀 Deployment Integration

### Environment Variables
```env
PORT=8080
GEMINI_API_KEY=your_google_ai_studio_api_key
GEMINI_MODEL=gemini-2.5-flash
NODE_ENV=production
```

### Cloud Run Deployment
```bash
# Build and deploy
./deploy-cloudrun.sh your-project-id asia-south1

# Set API key secret
gcloud secrets create GEMINI_API_KEY --replication-policy automatic
echo "your-api-key" | gcloud secrets versions add GEMINI_API_KEY --data-file=-
```

---

## 📞 Support & Contributing

- **Documentation**: https://github.com/your-repo/jansetu-ai
- **Issues**: https://github.com/your-repo/jansetu-ai/issues
- **Digital Public Good**: Licensed under Apache-2.0 for government and non-commercial use

---

**Built with ❤️ for Indian Communities and National Policymakers**  
**Powered by Google Gemini AI & Cloud Run**