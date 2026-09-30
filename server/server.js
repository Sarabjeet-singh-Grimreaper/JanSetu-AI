import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { districtsData } from "./data/districtsData.js";
import { schemesData } from "./data/schemesData.js";
import { initialCitizenRequests } from "./data/citizenRequests.js";
import { geminiService } from "./services/geminiService.js";

dotenv.config();

// Performance monitoring
const requestCounts = new Map();
const errorCounts = new Map();
const responseTimes = [];

// Middleware for performance tracking
const performanceMiddleware = (req, res, next) => {
  const startTime = Date.now();
  const path = req.path;

  // Increment request count
  requestCounts.set(path, (requestCounts.get(path) || 0) + 1);

  // Track response time
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    responseTimes.push(duration);
    if (responseTimes.length > 1000) responseTimes.shift(); // Keep last 1000 requests
  });

  next();
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));
app.use(performanceMiddleware);

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Track error counts
  const errorPath = req.path || 'unknown';
  errorCounts.set(errorPath, (errorCounts.get(errorPath) || 0) + 1);

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV !== 'production';
  res.status(err.status || 500).json({
    error: isDevelopment ? err.message : 'Internal server error',
    status: err.status || 500,
    timestamp: new Date().toISOString()
  });
};

// 404 handler
const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
    timestamp: new Date().toISOString()
  });
};

// In-memory data store for live session
let requestsStore = [...initialCitizenRequests];
let districtsStore = [...districtsData];

// Recalculate district IDUS & metrics dynamically
function recalculateDistrictMetrics() {
  districtsStore = districtsStore.map(district => {
    const districtReqs = requestsStore.filter(r => r.districtId === district.id || r.district.toLowerCase() === district.name.toLowerCase());
    const count = districtReqs.length;
    const avgUrgency = count > 0 ? districtReqs.reduce((acc, r) => acc + (r.urgencyLevel || 3), 0) / count : 3;

    // Infrastructure Deficit & Urgency Score (IDUS) Formula:
    // IDUS = (Demand Volume weight * 25) + (Avg Urgency weight * 25) + (Poverty & Tribal weight * 25) + (Piped water & Road deficit * 25)
    const demandScore = Math.min(100, count * 15);
    const urgencyScore = (avgUrgency / 5) * 100;
    const vulnScore = ((district.ruralPct * 0.4) + (district.tribalPct * 0.6));
    const deficitScore = 100 - ((district.indices.pipedWaterCoveragePct + district.indices.allWeatherRoadConnectivityPct) / 2);

    const calculatedIDUS = Math.min(99.4, Math.round(((demandScore * 0.25) + (urgencyScore * 0.3) + (vulnScore * 0.2) + (deficitScore * 0.25)) * 10) / 10);

    return {
      ...district,
      activeComplaintsCount: count,
      calculatedIDUS
    };
  });
}

recalculateDistrictMetrics();

// 1. Health check & Google Tech status
app.get("/api/health", (req, res) => {
  res.json({
    status: "online",
    platform: "JanSetu AI - Digital Public Good",
    version: "2.5.0",
    gemini: {
      hasKey: !!process.env.GEMINI_API_KEY,
      activeModel: geminiService.modelName,
      mode: geminiService.genAI ? "live-google-ai-studio" : "intelligent-offline-engine"
    },
    cloudDeployment: "Google Cloud Run Ready",
    timestamp: new Date().toISOString()
  });
});

// 2. National Overview Metrics
app.get("/api/metrics/national", (req, res) => {
  const totalRequests = requestsStore.length;
  const totalPopulationImpact = requestsStore.reduce((acc, r) => acc + (r.populationAffected || 0), 0);
  const highUrgencyCount = requestsStore.filter(r => r.urgencyLevel >= 4).length;
  const aspirationalDistrictsCount = districtsStore.filter(d => d.isAspirational).length;
  const languagesTracked = new Set(requestsStore.map(r => r.language)).size;

  const totalSanctionedBudgetCr = districtsStore.reduce((acc, d) => acc + (d.sanctionedBudgetCr || 0), 0);
  const totalSpentBudgetCr = districtsStore.reduce((acc, d) => acc + (d.spentBudgetCr || 0), 0);

  // Category distribution
  const categoryCounts = {};
  requestsStore.forEach(r => {
    categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1;
  });

  res.json({
    totalRequests,
    totalPopulationImpact,
    highUrgencyCount,
    aspirationalDistrictsCount,
    languagesTracked,
    nationalBudgetUtilizationPct: Math.round((totalSpentBudgetCr / totalSanctionedBudgetCr) * 100),
    categoryCounts,
    dpiResolutionIndex: 78.4 // Citizen Trust & Verified Grievance Resolution Index
  });
});

// 3. Districts Data with Geo Coordinates & IDUS Hotspot Scores
app.get("/api/districts", (req, res) => {
  res.json({
    districts: districtsStore
  });
});

// 4. Infrastructure Schemes (Central & State)
app.get("/api/schemes", (req, res) => {
  res.json({
    schemes: schemesData
  });
});

// 5. Citizen Requests Querying (filterable)
app.get("/api/requests", (req, res) => {
  const { category, district, urgency, status, channel } = req.query;
  let filtered = [...requestsStore];

  if (category && category !== "All") {
    filtered = filtered.filter(r => r.category.toLowerCase() === category.toLowerCase());
  }
  if (district && district !== "All") {
    filtered = filtered.filter(r => r.district.toLowerCase() === district.toLowerCase() || r.districtId === district);
  }
  if (urgency && urgency !== "All") {
    filtered = filtered.filter(r => r.urgencyLevel === parseInt(urgency));
  }
  if (status && status !== "All") {
    filtered = filtered.filter(r => r.status.toLowerCase() === status.toLowerCase());
  }
  if (channel && channel !== "All") {
    filtered = filtered.filter(r => r.channel.toLowerCase() === channel.toLowerCase());
  }

  res.json({
    total: filtered.length,
    requests: filtered
  });
});

// 6. Citizen Ingestion: Voice / Text / WhatsApp submission
app.post("/api/citizen/submit", async (req, res, next) => {
  try {
    const {
      text,
      channel = "voice",
      districtName = "Bastar",
      stateName = "Chhattisgarh",
      block = "Darbha",
      panchayat = "Gram Panchayat",
      lat,
      lng,
      photoUrl
    } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: "Grievance text or voice input is required" });
    }

    // Call Gemini AI or Heuristic Fallback Engine
    const aiAnalysis = await geminiService.analyzeCitizenRequest(text, {
      district: districtName,
      state: stateName
    });

    // Match district
    let targetDistrict = districtsStore.find(d => d.name.toLowerCase() === districtName.toLowerCase());
    if (!targetDistrict) {
      targetDistrict = districtsStore[0];
    }

    const stateCode = targetDistrict.state.substring(0, 2).toUpperCase();
    const distCode = targetDistrict.name.substring(0, 3).toUpperCase();
    const newId = `JS-2026-${stateCode}-${distCode}-${Math.floor(100 + Math.random() * 900)}`;

    const newRequest = {
      id: newId,
      timestamp: new Date().toISOString(),
      channel,
      language: aiAnalysis.languageCode || "hi",
      languageName: aiAnalysis.detectedLanguage || "Hindi",
      originalText: text,
      translatedEnglish: aiAnalysis.translatedEnglish,
      category: aiAnalysis.category,
      urgencyLevel: aiAnalysis.urgencyLevel,
      sentimentScore: aiAnalysis.sentimentScore,
      populationAffected: aiAnalysis.estimatedPopulationImpact,
      state: targetDistrict.state,
      district: targetDistrict.name,
      districtId: targetDistrict.id,
      block,
      panchayat,
      lat: lat || targetDistrict.lat + (Math.random() - 0.5) * 0.08,
      lng: lng || targetDistrict.lng + (Math.random() - 0.5) * 0.08,
      status: "AI_Triangulated",
      matchedSchemeCode: aiAnalysis.matchedScheme?.code || "PMGSY-IV",
      photoUrl: photoUrl || "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=500&auto=format&fit=crop&q=60",
      aiMetadata: {
        urgencyReasoning: aiAnalysis.urgencyReasoning,
        recommendedAction: aiAnalysis.recommendedAction,
        keyEntities: aiAnalysis.keyEntities,
        source: aiAnalysis.source
      }
    };

    // Prepend to requests store
    requestsStore.unshift(newRequest);
    recalculateDistrictMetrics();

    res.status(201).json({
      success: true,
      dpiTicketId: newId,
      request: newRequest
    });
  } catch (err) {
    console.error("Error in citizen submission:", err);
    err.status = 500;
    err.message = "Failed to process citizen grievance";
    next(err);
  }
});

// 7. Detailed Project Report (DPR) Generation
app.post("/api/dpr/generate", async (req, res, next) => {
  try {
    const { requestId } = req.body;
    const request = requestsStore.find(r => r.id === requestId);
    if (!request) {
      return res.status(404).json({ error: "Citizen request not found" });
    }

    const district = districtsStore.find(d => d.id === request.districtId);
    const dpr = await geminiService.generateDPR(request, district);

    // Update request status to DPR_Generated
    request.status = "DPR_Generated";
    request.generatedDPR = dpr;

    res.json({
      success: true,
      dpr
    });
  } catch (err) {
    console.error("DPR generation failed:", err);
    err.status = 500;
    err.message = "Failed to generate Detailed Project Report";
    next(err);
  }
});

// 8. Policy Copilot Interactive Assistant
app.post("/api/copilot/chat", async (req, res, next) => {
  try {
    const { message, conversationHistory = [] } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message prompt is required" });
    }

    const response = await geminiService.copilotChat(message, conversationHistory);
    res.json({
      success: true,
      reply: response.reply,
      source: response.source
    });
  } catch (err) {
    console.error("Copilot chat failed:", err);
    err.status = 500;
    err.message = "Copilot response failed";
    next(err);
  }
});

// 9. Google AI Studio Key Verification & Settings Update
app.post("/api/ai/verify-key", async (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey) {
    return res.status(400).json({ error: "API key is required" });
  }

  const result = await geminiService.verifyKey(apiKey);
  if (result.valid) {
    geminiService.setApiKey(apiKey);
  }
  res.json(result);
});

// 10. Update Model Configuration (e.g. Gemini 3.8 / 2.5 / 1.5 Flash)
app.post("/api/ai/update-config", (req, res) => {
  const { model, apiKey } = req.body;
  if (model) {
    geminiService.setModel(model);
  }
  if (apiKey) {
    geminiService.setApiKey(apiKey);
  }
  res.json({
    success: true,
    currentModel: geminiService.modelName,
    hasKey: !!geminiService.apiKey,
    activeMode: geminiService.genAI ? "live-google-ai-studio" : "intelligent-offline-engine"
  });
});

// =====================================================================
// GIS & Public APIs Integration (Open-Meteo & OpenStreetMap Nominatim)
// Source: https://github.com/public-api-lists/public-api-lists
// =====================================================================

// In-memory weather cache (10 min TTL)
const weatherCache = new Map();
// In-memory geocode cache (1 hr TTL)
const geocodeCache = new Map();

// 11. Real-time Weather & Climate Infrastructure Stress Telemetry
// Uses Open-Meteo free public API (no API key required)
app.get("/api/gis/weather", async (req, res) => {
  const { lat, lng, district = "Bastar" } = req.query;
  const latitude = parseFloat(lat) || 19.0748;
  const longitude = parseFloat(lng) || 82.0305;
  const cacheKey = `${latitude.toFixed(2)},${longitude.toFixed(2)}`;

  const cached = weatherCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 10 * 60 * 1000) {
    return res.json(cached.data);
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&daily=precipitation_sum,temperature_2m_max,temperature_2m_min&timezone=auto`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const resp = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!resp.ok) throw new Error(`Weather API returned ${resp.status}`);
    const data = await resp.json();

    const current = data.current || {};
    const temp = current.temperature_2m ?? 28;
    const humidity = current.relative_humidity_2m ?? 65;
    const precip = current.precipitation ?? 0;
    const wind = current.wind_speed_10m ?? 8;
    const weatherCode = current.weather_code ?? 0;

    // Infrastructure climate stress risk calculation
    let climateRiskLevel = "Low";
    let infrastructureImpact = "Normal operating conditions. Minimal weather-induced strain on civil assets.";
    if (precip > 15 || weatherCode >= 60) {
      climateRiskLevel = "Critical";
      infrastructureImpact = "Heavy precipitation detected: Severe risk of culvert erosion, washed-out rural causeways, and stormwater drainage overflow.";
    } else if (precip > 2 || temp > 40 || wind > 25) {
      climateRiskLevel = "Moderate";
      infrastructureImpact = temp > 40 
        ? "Extreme ambient heat: High thermal stress on distribution transformers and solar inverter efficiency."
        : "Moderate precipitation: Check unpaved PMGSY gravel road sections for waterlogging.";
    }

    const payload = {
      source: "Open-Meteo Public API (WMO Weather Models)",
      district,
      latitude,
      longitude,
      current: {
        temperature: Math.round(temp * 10) / 10,
        humidity: Math.round(humidity),
        precipitation: precip,
        windSpeed: Math.round(wind * 10) / 10,
        weatherCode
      },
      forecast: {
        maxTemp: Math.round((data.daily?.temperature_2m_max?.[0] ?? temp + 3) * 10) / 10,
        minTemp: Math.round((data.daily?.temperature_2m_min?.[0] ?? temp - 5) * 10) / 10,
        totalRainExpectedMm: data.daily?.precipitation_sum?.[0] ?? precip
      },
      climateRiskLevel,
      infrastructureImpact,
      timestamp: new Date().toISOString()
    };

    weatherCache.set(cacheKey, { timestamp: Date.now(), data: payload });
    res.json(payload);
  } catch (err) {
    // Intelligent fallback for offline / disconnected environments
    const fallbackPayload = {
      source: "JanSetu AI Telemetry Synthesizer (Offline Resilient)",
      district,
      latitude,
      longitude,
      current: {
        temperature: 28.5,
        humidity: 62,
        precipitation: 1.2,
        windSpeed: 10.4,
        weatherCode: 1
      },
      forecast: {
        maxTemp: 32.0,
        minTemp: 23.5,
        totalRainExpectedMm: 2.0
      },
      climateRiskLevel: "Moderate",
      infrastructureImpact: "Seasonal monsoon humidity: Monitored for surface water runoff and low-lying culvert saturation.",
      timestamp: new Date().toISOString()
    };
    res.json(fallbackPayload);
  }
});

// 12. Nominatim OpenStreetMap Geocoding Search
// Uses OpenStreetMap Nominatim free public API
app.get("/api/gis/geocode", async (req, res) => {
  const query = (req.query.q || "").trim();
  if (!query) return res.status(400).json({ error: "Missing query parameter 'q'" });

  if (geocodeCache.has(query)) {
    return res.json(geocodeCache.get(query));
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ", India")}&format=json&limit=5&countrycodes=in`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const resp = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "JanSetu-AI-Public-Good/1.0 (contact: info@jansetu.gov.in)"
      }
    });
    clearTimeout(timeout);

    if (!resp.ok) throw new Error("Nominatim returned " + resp.status);
    const results = await resp.json();

    const formatted = results.map(item => ({
      name: item.name || item.display_name.split(",")[0],
      displayName: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      type: item.type,
      class: item.class
    }));

    geocodeCache.set(query, { results: formatted });
    res.json({ results: formatted });
  } catch (err) {
    res.json({ results: [] });
  }
});

// 13. PM Gati Shakti National Infrastructure Corridors Layer
app.get("/api/gis/layers", (req, res) => {
  res.json({
    corridors: [
      {
        id: "CORR-EAST-COAST",
        name: "East Coast Dedicated Freight & Multi-Modal Corridor",
        scheme: "PM Gati Shakti Master Plan",
        type: "High-Speed Logistics & Feeder",
        status: "Active Execution",
        lengthKm: 1115,
        color: "#f59e0b",
        routePoints: [
          [25.3176, 82.9739], // Varanasi
          [23.3441, 85.3096], // Ranchi
          [18.8286, 81.8797], // Malkangiri
          [18.1067, 83.3956]  // Vizianagaram
        ]
      },
      {
        id: "CORR-TRIBAL-CONNECT",
        name: "Central Tribal Hinterland Paved Grid (PMGSY-IV & PM-JANMAN)",
        scheme: "PMGSY & PM-JANMAN",
        type: "All-Weather Rural Habitats",
        status: "Priority Red Alert",
        lengthKm: 640,
        color: "#ef4444",
        routePoints: [
          [19.0748, 82.0305], // Bastar
          [18.8286, 81.8797], // Malkangiri
          [19.1383, 77.3210]  // Nanded
        ]
      },
      {
        id: "CORR-WATER-GRID",
        name: "Deccan Plateau Fluoride-Safe Potable Pipeline Network",
        scheme: "Jal Jeevan Mission (JJM)",
        type: "Surface Water Bulk Transmission",
        status: "Critical Deficit",
        lengthKm: 580,
        color: "#06b6d4",
        routePoints: [
          [16.2120, 77.3439], // Raichur
          [19.1383, 77.3210], // Nanded
          [12.1211, 78.1582]  // Dharmapuri
        ]
      },
      {
        id: "CORR-NORTH-GREEN",
        name: "Aravalli & Western Renewable Solar Distribution Corridor",
        scheme: "PM-Surya Ghar & KUSUM",
        type: "Decentralized Green Energy",
        status: "Under Expansion",
        lengthKm: 890,
        color: "#10b981",
        routePoints: [
          [27.5530, 76.6346], // Alwar
          [22.8378, 74.2562], // Dahod
          [30.9237, 74.6114]  // Firozpur
        ]
      }
    ]
  });
});

// 14. Performance Monitoring Endpoint (for health checks and monitoring)
app.get("/api/performance", (req, res) => {
  const avgResponseTime = responseTimes.length > 0
    ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
    : 0;

  const maxResponseTime = responseTimes.length > 0
    ? Math.max(...responseTimes)
    : 0;

  const totalRequests = Array.from(requestCounts.values()).reduce((a, b) => a + b, 0);
  const totalErrors = Array.from(errorCounts.values()).reduce((a, b) => a + b, 0);

  res.json({
    uptime: process.uptime(),
    performance: {
      averageResponseTime: Math.round(avgResponseTime),
      maxResponseTime: maxResponseTime,
      totalRequests,
      totalErrors,
      errorRate: totalRequests > 0 ? ((totalErrors / totalRequests) * 100).toFixed(2) : 0
    },
    endpoints: Object.fromEntries(requestCounts),
    errors: Object.fromEntries(errorCounts),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
    },
    timestamp: new Date().toISOString()
  });
});

// Serve frontend static build if dist exists
const clientDistPath = path.join(__dirname, "../client/dist");
app.use(express.static(clientDistPath));

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(clientDistPath, "index.html"), (err) => {
    if (err) next();
  });
});

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`JanSetu AI Server (जनसेतु) running on http://localhost:${PORT}`);
  console.log(`Platform: Digital Public Good for Citizen Infrastructure Intelligence`);
  console.log(`Gemini Engine: ${geminiService.modelName} [${geminiService.genAI ? "Live Google AI Studio" : "Offline Intelligent Fallback"}]`);
  console.log(`Performance Monitoring: /api/performance`);
  console.log(`=======================================================`);
});
