import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { District, CitizenRequest } from "../types";
import { SupportedLanguage, translations } from "../translations";
import {
  MapPin,
  AlertCircle,
  Droplets,
  Compass,
  TrendingUp,
  Layers,
  CheckCircle2,
  CloudRain,
  Sun,
  Wind,
  Thermometer,
  Search,
  Navigation,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Zap,
  Radio,
  FileText
} from "lucide-react";

interface Props {
  districts: District[];
  requests: CitizenRequest[];
  lang: SupportedLanguage;
  onSelectDistrict: (district: District) => void;
  onViewDpr: (req: CitizenRequest) => void;
}

interface WeatherData {
  source: string;
  district: string;
  current: {
    temperature: number;
    humidity: number;
    precipitation: number;
    windSpeed: number;
    weatherCode: number;
  };
  forecast?: {
    maxTemp: number;
    minTemp: number;
    totalRainExpectedMm: number;
  };
  climateRiskLevel: "Low" | "Moderate" | "Critical";
  infrastructureImpact: string;
  timestamp: string;
}

interface CorridorLayer {
  id: string;
  name: string;
  scheme: string;
  type: string;
  status: string;
  color: string;
  routePoints: [number, number][];
}

export const IndiaHotspotMap: React.FC<Props> = ({
  districts,
  requests,
  lang,
  onSelectDistrict,
  onViewDpr
}) => {
  const t = translations[lang] || translations.en;
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const corridorsLayerRef = useRef<L.LayerGroup | null>(null);
  const buffersLayerRef = useRef<L.LayerGroup | null>(null);

  // Filter States
  const [selectedSector, setSelectedSector] = useState<string>("All");
  const [aspirationalOnly, setAspirationalOnly] = useState(false);
  const [activeDistrict, setActiveDistrict] = useState<District | null>(districts[0] || null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<string>("All");

  // Map Layer Controls
  const [mapStyle, setMapStyle] = useState<"dark" | "satellite" | "streets">("dark");
  const [showCorridors, setShowCorridors] = useState(true);
  const [showBuffers, setShowBuffers] = useState(true);

  // Drawer Tabs
  const [drawerTab, setDrawerTab] = useState<"indicators" | "weather" | "complaints">("indicators");

  // Live Weather Telemetry (Open-Meteo Public API)
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);

  // Corridors data
  const [corridors, setCorridors] = useState<CorridorLayer[]>([]);

  // 1. Fetch Corridors data on mount
  useEffect(() => {
    fetch("/api/gis/layers")
      .then(res => res.json())
      .then(data => {
        if (data.corridors) setCorridors(data.corridors);
      })
      .catch(err => console.warn("Failed to load GIS layers:", err));
  }, []);

  // 2. Fetch Live Weather for Active District (Open-Meteo Public API)
  useEffect(() => {
    if (!activeDistrict) return;

    let isMounted = true;
    setIsLoadingWeather(true);

    fetch(`/api/gis/weather?lat=${activeDistrict.lat}&lng=${activeDistrict.lng}&district=${encodeURIComponent(activeDistrict.name)}`)
      .then(res => res.json())
      .then(data => {
        if (isMounted) {
          setWeatherData(data);
          setIsLoadingWeather(false);
        }
      })
      .catch(err => {
        if (isMounted) {
          console.warn("Weather fetch failed, utilizing synthetic state:", err);
          setIsLoadingWeather(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [activeDistrict]);

  // 3. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Centered on Central India
    const map = L.map(mapContainerRef.current, {
      center: [21.8, 80.5],
      zoom: 5,
      minZoom: 4,
      maxZoom: 14,
      zoomControl: false
    });

    // Custom Zoom Control top-right
    L.control.zoom({ position: "topright" }).addTo(map);

    // Initial Base Tile Layer (Carto Dark)
    const baseLayer = L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> | JanSetu GIS',
      subdomains: "abcd",
      maxZoom: 19
    }).addTo(map);
    baseTileLayerRef.current = baseLayer;

    // Layer Groups
    buffersLayerRef.current = L.layerGroup().addTo(map);
    corridorsLayerRef.current = L.layerGroup().addTo(map);
    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 4. Update Map Basemap Layer on mapStyle Change
  useEffect(() => {
    if (!mapInstanceRef.current || !baseTileLayerRef.current) return;

    mapInstanceRef.current.removeLayer(baseTileLayerRef.current);

    let newUrl = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
    let attribution = '&copy; CARTO';

    if (mapStyle === "satellite") {
      newUrl = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
      attribution = '&copy; Esri World Imagery';
    } else if (mapStyle === "streets") {
      newUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
      attribution = '&copy; OpenStreetMap contributors';
    }

    const newLayer = L.tileLayer(newUrl, {
      attribution,
      maxZoom: 19
    }).addTo(mapInstanceRef.current);

    baseTileLayerRef.current = newLayer;
  }, [mapStyle]);

  // 5. Render Corridors on Map
  useEffect(() => {
    if (!corridorsLayerRef.current || !mapInstanceRef.current) return;
    corridorsLayerRef.current.clearLayers();

    if (!showCorridors || corridors.length === 0) return;

    corridors.forEach(corr => {
      const polyline = L.polyline(corr.routePoints, {
        color: corr.color || "#f59e0b",
        weight: 3.5,
        opacity: 0.85,
        dashArray: "6, 8"
      });

      polyline.bindPopup(`
        <div style="font-family: inherit; font-size: 12px; color: #1e293b;">
          <strong style="color: #0f172a; font-size: 13px;">${corr.name}</strong>
          <p style="margin: 4px 0 0; color: #64748b; font-size: 11px;">${corr.scheme} • ${corr.type}</p>
          <div style="margin-top: 4px; font-weight: 600; color: #0284c7;">Status: ${corr.status}</div>
        </div>
      `);

      corridorsLayerRef.current?.addLayer(polyline);
    });
  }, [corridors, showCorridors]);

  // 6. Update Markers & Buffers when filters change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current || !buffersLayerRef.current) return;

    markersLayerRef.current.clearLayers();
    buffersLayerRef.current.clearLayers();

    let filtered = districts;

    if (selectedSector !== "All") {
      filtered = filtered.filter(d => d.topGrievanceCategory.toLowerCase().includes(selectedSector.toLowerCase()));
    }
    if (aspirationalOnly) {
      filtered = filtered.filter(d => d.isAspirational);
    }
    if (selectedRegion !== "All") {
      filtered = filtered.filter(d => d.region.toLowerCase() === selectedRegion.toLowerCase());
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(d => d.name.toLowerCase().includes(q) || d.state.toLowerCase().includes(q));
    }

    filtered.forEach(district => {
      const isCritical = district.calculatedIDUS >= 80;
      const isHigh = district.calculatedIDUS >= 70 && district.calculatedIDUS < 80;
      const isSelected = activeDistrict?.id === district.id;

      const color = isCritical ? "#ef4444" : isHigh ? "#f97316" : "#38bdf8";

      // Render Impact Buffers (pulsing circle for critical districts)
      if (showBuffers && isCritical) {
        const circle = L.circle([district.lat, district.lng], {
          radius: 38000, // 38 km buffer
          color: color,
          fillColor: color,
          fillOpacity: 0.12,
          weight: 1.5,
          dashArray: "4, 6"
        });
        buffersLayerRef.current?.addLayer(circle);
      }

      // Custom pulsing HTML marker with IDUS badge
      const markerSize = isSelected ? 34 : isCritical ? 28 : 24;
      const customIcon = L.divIcon({
        className: "custom-leaflet-marker",
        html: `
          <div style="
            position: relative;
            width: ${markerSize}px;
            height: ${markerSize}px;
            border-radius: 50%;
            background: ${color};
            border: ${isSelected ? '3px solid #ffffff' : '2px solid white'};
            box-shadow: 0 0 ${isSelected ? '20px' : '12px'} ${color};
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: ${isSelected ? '11px' : '10px'};
            font-weight: 800;
            color: white;
            cursor: pointer;
            transition: transform 0.2s ease;
          ">
            ${Math.round(district.calculatedIDUS)}
          </div>
        `,
        iconSize: [markerSize, markerSize],
        iconAnchor: [markerSize / 2, markerSize / 2]
      });

      const marker = L.marker([district.lat, district.lng], { icon: customIcon });

      const popupContent = `
        <div style="font-family: inherit; font-size: 12px; line-height: 1.4; color: #f1f5f9; min-width: 220px; padding: 2px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <strong style="font-size: 14px; color: #fff;">${district.name}</strong>
            <span style="font-size: 10px; background: ${color}25; color: ${color}; padding: 2px 6px; border-radius: 4px; font-weight: 700; border: 1px solid ${color}40;">
              IDUS: ${district.calculatedIDUS}
            </span>
          </div>
          <p style="margin: 0 0 6px; color: #94a3b8; font-size: 11px;">
            ${district.state} • ${district.isAspirational ? "★ NITI Aspirational" : "General Category"}
          </p>
          <div style="border-top: 1px solid #334155; padding-top: 6px; display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 11px;">
            <div><span style="color: #94a3b8;">Deficit:</span> <strong>${district.topGrievanceCategory}</strong></div>
            <div><span style="color: #94a3b8;">Complaints:</span> <strong>${district.activeComplaintsCount}</strong></div>
            <div><span style="color: #94a3b8;">JJM Water:</span> <strong style="color: #38bdf8;">${district.indices.pipedWaterCoveragePct}%</strong></div>
            <div><span style="color: #94a3b8;">PMGSY Road:</span> <strong style="color: #f59e0b;">${district.indices.allWeatherRoadConnectivityPct}%</strong></div>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on("click", () => {
        setActiveDistrict(district);
        onSelectDistrict(district);
      });

      markersLayerRef.current?.addLayer(marker);
    });
  }, [districts, selectedSector, aspirationalOnly, selectedRegion, searchQuery, activeDistrict, showBuffers]);

  // Fly to district smoothly
  const handleFlyToDistrict = (district: District) => {
    setActiveDistrict(district);
    onSelectDistrict(district);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([district.lat, district.lng], 8, {
        duration: 1.2
      });
    }
  };

  const sectors = ["All", "Water", "Road", "Health", "Power", "Drainage", "School"];
  const regions = ["All", "Central", "Southern", "Eastern", "Northern", "Western", "North-Eastern"];

  // Filter requests for the currently active district
  const activeDistrictRequests = activeDistrict
    ? requests.filter(r => r.districtId === activeDistrict.id || r.district.toLowerCase() === activeDistrict.name.toLowerCase())
    : [];

  // Top Critical Hotspots for quick pill access
  const topCritical = districts
    .filter(d => d.calculatedIDUS >= 80)
    .sort((a, b) => b.calculatedIDUS - a.calculatedIDUS)
    .slice(0, 4);

  return (
    <div className="space-y-4">
      {/* National GIS Telemetry Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 p-4 rounded-2xl border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                National GIS Infrastructure Hotspot Center
              </h2>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                PM Gati Shakti Live
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Multi-modal corridors triangulated with citizen demand density & Open-Meteo climate stress telemetry
            </p>
          </div>
        </div>

        {/* Quick Hotspot Jumper */}
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          <span className="text-xs text-slate-400 font-semibold flex items-center gap-1 mr-1 whitespace-nowrap">
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            Red Alert Hotspots:
          </span>
          {topCritical.map(d => (
            <button
              key={d.id}
              onClick={() => handleFlyToDistrict(d)}
              className={`text-xs px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1.5 whitespace-nowrap border ${
                activeDistrict?.id === d.id
                  ? "bg-red-500 text-white border-red-400 shadow-md shadow-red-500/30"
                  : "bg-slate-950 text-slate-300 border-slate-800 hover:border-red-500/50 hover:text-white"
              }`}
            >
              <span>{d.name}</span>
              <span className="text-[10px] px-1 py-0.2 rounded bg-white/20 font-mono">
                {Math.round(d.calculatedIDUS)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Top Filter & Search Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-2xl border border-slate-800 backdrop-blur-md">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[220px] max-w-xs">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search district, state..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500 transition"
          />
        </div>

        {/* Sector Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-slate-400 font-semibold flex items-center gap-1 mr-1 hidden sm:flex">
            <Compass className="w-3.5 h-3.5 text-orange-400" />
            Sector:
          </span>
          {sectors.map(sec => (
            <button
              key={sec}
              onClick={() => setSelectedSector(sec)}
              className={`text-xs px-2.5 py-1 rounded-lg font-medium transition ${
                selectedSector === sec
                  ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                  : "bg-slate-800/80 text-slate-400 hover:text-slate-200"
              }`}
            >
              {sec === "All" ? t.allSectors : sec}
            </button>
          ))}
        </div>

        {/* Region Dropdown & Aspirational Checkbox */}
        <div className="flex items-center gap-3">
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-orange-500 cursor-pointer"
          >
            {regions.map(r => (
              <option key={r} value={r}>{r === "All" ? "All Regions" : `${r} Region`}</option>
            ))}
          </select>

          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer whitespace-nowrap">
            <input
              type="checkbox"
              checked={aspirationalOnly}
              onChange={(e) => setAspirationalOnly(e.target.checked)}
              className="rounded border-slate-700 text-orange-500 focus:ring-orange-500 bg-slate-950"
            />
            <span>{t.aspirationalDistrictsOnly}</span>
          </label>
        </div>
      </div>

      {/* Main Map + District Inspection Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Leaflet Map Frame */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative h-[600px] flex flex-col">
          {/* Top Map Floating Toolbar */}
          <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-2">
            {/* Basemap Switcher */}
            <div className="bg-slate-950/85 backdrop-blur-md border border-slate-800 p-1 rounded-xl shadow-lg flex items-center gap-1">
              <button
                onClick={() => setMapStyle("dark")}
                className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition ${
                  mapStyle === "dark" ? "bg-orange-500 text-white font-bold" : "text-slate-400 hover:text-white"
                }`}
              >
                Night Carto
              </button>
              <button
                onClick={() => setMapStyle("satellite")}
                className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition ${
                  mapStyle === "satellite" ? "bg-orange-500 text-white font-bold" : "text-slate-400 hover:text-white"
                }`}
              >
                Satellite (Esri)
              </button>
              <button
                onClick={() => setMapStyle("streets")}
                className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition ${
                  mapStyle === "streets" ? "bg-orange-500 text-white font-bold" : "text-slate-400 hover:text-white"
                }`}
              >
                Topographic
              </button>
            </div>

            {/* Corridors & Buffers Toggles */}
            <button
              onClick={() => setShowCorridors(prev => !prev)}
              className={`text-[11px] px-2.5 py-1.5 rounded-xl border backdrop-blur-md shadow-lg font-medium transition flex items-center gap-1.5 ${
                showCorridors
                  ? "bg-slate-950/90 text-amber-400 border-amber-500/40"
                  : "bg-slate-950/60 text-slate-500 border-slate-800"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Gati Shakti Corridors</span>
            </button>

            <button
              onClick={() => setShowBuffers(prev => !prev)}
              className={`text-[11px] px-2.5 py-1.5 rounded-xl border backdrop-blur-md shadow-lg font-medium transition flex items-center gap-1.5 ${
                showBuffers
                  ? "bg-slate-950/90 text-red-400 border-red-500/40"
                  : "bg-slate-950/60 text-slate-500 border-slate-800"
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Risk Buffers (38km)</span>
            </button>
          </div>

          {/* Map Canvas */}
          <div ref={mapContainerRef} className="w-full flex-1 z-0" />

          {/* Bottom Map Legend Bar */}
          <div className="bg-slate-950/90 backdrop-blur-md border-t border-slate-800 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-3 z-10">
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1.5 text-red-400 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                Critical (IDUS &gt; 80)
              </span>
              <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                High (70-80)
              </span>
              <span className="flex items-center gap-1.5 text-sky-400 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
                Moderate (&lt; 70)
              </span>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span className="font-mono text-emerald-400">Open-Meteo & Nominatim Connected</span>
              <span>•</span>
              <span>Click any marker to inspect</span>
            </div>
          </div>
        </div>

        {/* Right Inspection Drawer for Selected District */}
        <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-2xl backdrop-blur-md flex flex-col justify-between h-[600px] overflow-hidden">
          {activeDistrict ? (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Drawer Header */}
              <div className="border-b border-slate-800 pb-3 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-orange-400" />
                    {activeDistrict.name}
                  </h3>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                    activeDistrict.calculatedIDUS >= 80 ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                    activeDistrict.calculatedIDUS >= 70 ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" :
                    "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                  }`}>
                    IDUS {activeDistrict.calculatedIDUS}/100
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-slate-400">
                    {activeDistrict.state} • {activeDistrict.region}
                    {activeDistrict.isAspirational && " • Aspirational #" + activeDistrict.nitiAayogRank}
                  </p>
                  <button
                    onClick={() => handleFlyToDistrict(activeDistrict)}
                    className="text-[11px] text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1"
                  >
                    <Navigation className="w-3 h-3" />
                    Center Map
                  </button>
                </div>

                {/* Sub-Tabs: Indicators vs Weather vs Complaints */}
                <div className="flex items-center gap-1 mt-3 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                  <button
                    onClick={() => setDrawerTab("indicators")}
                    className={`flex-1 py-1 rounded-lg font-semibold transition ${
                      drawerTab === "indicators"
                        ? "bg-orange-500 text-white shadow-sm"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Indicators
                  </button>
                  <button
                    onClick={() => setDrawerTab("weather")}
                    className={`flex-1 py-1 rounded-lg font-semibold transition flex items-center justify-center gap-1 ${
                      drawerTab === "weather"
                        ? "bg-orange-500 text-white shadow-sm"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <CloudRain className="w-3 h-3" />
                    Climate (API)
                  </button>
                  <button
                    onClick={() => setDrawerTab("complaints")}
                    className={`flex-1 py-1 rounded-lg font-semibold transition ${
                      drawerTab === "complaints"
                        ? "bg-orange-500 text-white shadow-sm"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Complaints ({activeDistrictRequests.length})
                  </button>
                </div>
              </div>

              {/* Drawer Content Area (Scrollable) */}
              <div className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">
                {/* TAB 1: Infrastructure Indicators */}
                {drawerTab === "indicators" && (
                  <>
                    {/* Demographic & Capex Snapshot */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Population</span>
                        <span className="font-bold text-slate-100">{activeDistrict.population.toLocaleString()}</span>
                        <span className="text-[10px] text-slate-500 block">({activeDistrict.ruralPct}% Rural, {activeDistrict.tribalPct}% Tribal)</span>
                      </div>
                      <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Sanctioned Capex</span>
                        <span className="font-bold text-emerald-400">₹{activeDistrict.sanctionedBudgetCr} Cr</span>
                        <span className="text-[10px] text-slate-500 block">Spent: ₹{activeDistrict.spentBudgetCr} Cr</span>
                      </div>
                    </div>

                    {/* Physical Infrastructure Deficit Progress Bars */}
                    <div className="space-y-2.5 text-xs">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Infrastructure Saturation Index:
                      </span>

                      <div>
                        <div className="flex justify-between text-[11px] mb-1 text-slate-300">
                          <span>Piped Tap Water (Jal Jeevan Mission):</span>
                          <span className="font-bold text-sky-400">{activeDistrict.indices.pipedWaterCoveragePct}%</span>
                        </div>
                        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className="bg-sky-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${activeDistrict.indices.pipedWaterCoveragePct}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] mb-1 text-slate-300">
                          <span>All-Weather Roads (PMGSY):</span>
                          <span className="font-bold text-amber-400">{activeDistrict.indices.allWeatherRoadConnectivityPct}%</span>
                        </div>
                        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className="bg-amber-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${activeDistrict.indices.allWeatherRoadConnectivityPct}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] mb-1 text-slate-300">
                          <span>Power Grid Daily Reliability:</span>
                          <span className="font-bold text-emerald-400">{activeDistrict.indices.powerReliabilityHrs} hrs/day</span>
                        </div>
                        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${(activeDistrict.indices.powerReliabilityHrs / 24) * 100}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] mb-1 text-slate-300">
                          <span>BharatNet Rural Broadband:</span>
                          <span className="font-bold text-indigo-400">{activeDistrict.indices.broadbandConnectivityPct}%</span>
                        </div>
                        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${activeDistrict.indices.broadbandConnectivityPct}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* NITI Aayog Vulnerability Note */}
                    <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-orange-400 mb-1">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>IDUS Triangulation Assessment:</span>
                      </div>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        Top Ground Deficit: <strong className="text-white">{activeDistrict.topGrievanceCategory}</strong>.
                        High concentration of rural ({activeDistrict.ruralPct}%) and tribal ({activeDistrict.tribalPct}%) population elevates priority ranking under PM-JANMAN and Aspirational Blocks Program.
                      </p>
                    </div>
                  </>
                )}

                {/* TAB 2: Live Weather & Climate Stress Telemetry (Open-Meteo Public API) */}
                {drawerTab === "weather" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                        Live Environmental Sensor Grid:
                      </span>
                      {isLoadingWeather && (
                        <RefreshCw className="w-3 h-3 text-orange-400 animate-spin" />
                      )}
                    </div>

                    {weatherData ? (
                      <>
                        {/* 4 Sensor Cards */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2.5">
                            <Thermometer className="w-5 h-5 text-amber-400" />
                            <div>
                              <span className="text-[10px] text-slate-400 block">Temperature</span>
                              <span className="font-bold text-white text-sm">
                                {weatherData.current.temperature}°C
                              </span>
                            </div>
                          </div>

                          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2.5">
                            <Droplets className="w-5 h-5 text-sky-400" />
                            <div>
                              <span className="text-[10px] text-slate-400 block">Humidity</span>
                              <span className="font-bold text-white text-sm">
                                {weatherData.current.humidity}%
                              </span>
                            </div>
                          </div>

                          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2.5">
                            <CloudRain className="w-5 h-5 text-blue-400" />
                            <div>
                              <span className="text-[10px] text-slate-400 block">Precipitation</span>
                              <span className="font-bold text-white text-sm">
                                {weatherData.current.precipitation} mm
                              </span>
                            </div>
                          </div>

                          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2.5">
                            <Wind className="w-5 h-5 text-teal-400" />
                            <div>
                              <span className="text-[10px] text-slate-400 block">Wind Speed</span>
                              <span className="font-bold text-white text-sm">
                                {weatherData.current.windSpeed} km/h
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Climate Risk Badge & Advisory */}
                        <div className={`p-3 rounded-xl border text-xs ${
                          weatherData.climateRiskLevel === "Critical"
                            ? "bg-red-500/10 border-red-500/30 text-red-300"
                            : weatherData.climateRiskLevel === "Moderate"
                            ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                            : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                        }`}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-bold flex items-center gap-1.5 text-xs">
                              <ShieldAlert className="w-4 h-4" />
                              Climate Stress Level: {weatherData.climateRiskLevel}
                            </span>
                            <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-black/30">
                              Real-Time
                            </span>
                          </div>
                          <p className="text-[11px] leading-relaxed text-slate-300">
                            {weatherData.infrastructureImpact}
                          </p>
                        </div>

                        {/* Forecast Snapshot */}
                        {weatherData.forecast && (
                          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-xs">
                            <span className="text-[10px] text-slate-400 font-semibold uppercase block mb-1.5">
                              Next 24h Forecast Range:
                            </span>
                            <div className="flex items-center justify-between text-[11px] text-slate-200">
                              <span>Max: <strong className="text-amber-400">{weatherData.forecast.maxTemp}°C</strong></span>
                              <span>Min: <strong className="text-sky-400">{weatherData.forecast.minTemp}°C</strong></span>
                              <span>Rain Expected: <strong className="text-blue-400">{weatherData.forecast.totalRainExpectedMm} mm</strong></span>
                            </div>
                          </div>
                        )}

                        <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1">
                          <span>Data: {weatherData.source}</span>
                          <span className="font-mono">Lat: {activeDistrict.lat}, Lng: {activeDistrict.lng}</span>
                        </div>
                      </>
                    ) : (
                      <div className="p-4 text-center text-xs text-slate-500">
                        Loading live environmental telemetry...
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: Citizen Complaints & 1-Click DPR */}
                {drawerTab === "complaints" && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Active Grassroots Grievances:
                    </span>

                    {activeDistrictRequests.length > 0 ? (
                      activeDistrictRequests.map(r => (
                        <div key={r.id} className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 text-xs hover:border-slate-700 transition">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-semibold text-orange-400 text-xs flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                              {r.category}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">{r.id}</span>
                          </div>
                          <p className="text-slate-200 text-xs line-clamp-2 leading-relaxed">
                            {r.translatedEnglish || r.originalText}
                          </p>

                          <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                            <span className="text-[10px] text-slate-400">
                              Urgency: <strong className={r.urgencyLevel >= 4 ? "text-red-400" : "text-amber-400"}>{r.urgencyLevel}/5</strong>
                            </span>
                            <button
                              onClick={() => onViewDpr(r)}
                              className="text-[11px] text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20"
                            >
                              <FileText className="w-3 h-3" />
                              Generate DPR &rarr;
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center text-xs text-slate-500 italic bg-slate-950/50 rounded-xl border border-dashed border-slate-800">
                        No active complaints currently filed for {activeDistrict.name}.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Quick Action Footer */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between flex-shrink-0">
                <button
                  onClick={() => onViewDpr(activeDistrictRequests[0] || undefined as any)}
                  className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold shadow-lg shadow-orange-500/20 flex items-center justify-center gap-1.5 transition"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Draft Cabinet DPR for {activeDistrict.name}</span>
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">Select any marker on the map to inspect district metrics.</p>
          )}
        </div>
      </div>
    </div>
  );
};
