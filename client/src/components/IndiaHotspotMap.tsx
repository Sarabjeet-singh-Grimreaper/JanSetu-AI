import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { District, CitizenRequest } from "../types";
import { SupportedLanguage, translations } from "../translations";
import { MapPin, AlertCircle, Droplets, Compass, TrendingUp, Layers, CheckCircle2 } from "lucide-react";

interface Props {
  districts: District[];
  requests: CitizenRequest[];
  lang: SupportedLanguage;
  onSelectDistrict: (district: District) => void;
  onViewDpr: (req: CitizenRequest) => void;
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
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const [selectedSector, setSelectedSector] = useState<string>("All");
  const [aspirationalOnly, setAspirationalOnly] = useState(false);
  const [activeDistrict, setActiveDistrict] = useState<District | null>(districts[0] || null);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Centered on India
    const map = L.map(mapContainerRef.current, {
      center: [22.8, 80.0],
      zoom: 5,
      minZoom: 4,
      maxZoom: 10,
      zoomControl: true
    });

    // Dark sleek CartoDB basemap
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> | JanSetu National GIS',
      subdomains: "abcd",
      maxZoom: 19
    }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers when filters or districts change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    let filtered = districts;
    if (selectedSector !== "All") {
      filtered = filtered.filter(d => d.topGrievanceCategory.toLowerCase().includes(selectedSector.toLowerCase()));
    }
    if (aspirationalOnly) {
      filtered = filtered.filter(d => d.isAspirational);
    }

    filtered.forEach(district => {
      const isCritical = district.calculatedIDUS >= 80;
      const isHigh = district.calculatedIDUS >= 70 && district.calculatedIDUS < 80;

      const color = isCritical ? "#ef4444" : isHigh ? "#f97316" : "#38bdf8";

      // Custom pulsing HTML marker
      const customIcon = L.divIcon({
        className: "custom-leaflet-marker",
        html: `
          <div style="
            position: relative;
            width: ${isCritical ? '28px' : '22px'};
            height: ${isCritical ? '28px' : '22px'};
            border-radius: 50%;
            background: ${color};
            border: 2px solid white;
            box-shadow: 0 0 14px ${color};
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            font-weight: bold;
            color: white;
            cursor: pointer;
          ">
            ${Math.round(district.calculatedIDUS)}
          </div>
        `,
        iconSize: [isCritical ? 28 : 22, isCritical ? 28 : 22],
        iconAnchor: [isCritical ? 14 : 11, isCritical ? 14 : 11]
      });

      const marker = L.marker([district.lat, district.lng], { icon: customIcon });

      const popupContent = `
        <div style="font-family: inherit; font-size: 12px; line-height: 1.4; color: #f1f5f9; min-width: 200px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <strong style="font-size: 14px; color: #fff;">${district.name}</strong>
            <span style="font-size: 10px; background: ${color}22; color: ${color}; padding: 2px 6px; border-radius: 4px; font-weight: 600;">
              IDUS: ${district.calculatedIDUS}
            </span>
          </div>
          <p style="margin: 0 0 4px; color: #94a3b8; font-size: 11px;">
            ${district.state} • ${district.isAspirational ? "★ Aspirational District" : "Standard District"}
          </p>
          <div style="border-top: 1px solid #334155; padding-top: 6px; margin-top: 6px;">
            <div><strong>Top Deficit:</strong> ${district.topGrievanceCategory}</div>
            <div><strong>Active Requests:</strong> ${district.activeComplaintsCount}</div>
            <div><strong>Piped Water (JJM):</strong> ${district.indices.pipedWaterCoveragePct}%</div>
            <div><strong>Road Connectivity:</strong> ${district.indices.allWeatherRoadConnectivityPct}%</div>
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
  }, [districts, selectedSector, aspirationalOnly]);

  const sectors = ["All", "Water", "Road", "Health", "Power", "Drainage", "School"];

  // Filter requests for the currently active district
  const activeDistrictRequests = activeDistrict
    ? requests.filter(r => r.districtId === activeDistrict.id || r.district.toLowerCase() === activeDistrict.name.toLowerCase())
    : [];

  return (
    <div className="space-y-4">
      {/* Top Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5 mr-1">
            <Compass className="w-3.5 h-3.5 text-orange-400" />
            Sector Hotspots:
          </span>
          {sectors.map(sec => (
            <button
              key={sec}
              onClick={() => setSelectedSector(sec)}
              className={`text-xs px-3 py-1 rounded-lg font-medium transition ${
                selectedSector === sec
                  ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                  : "bg-slate-800/80 text-slate-400 hover:text-slate-200"
              }`}
            >
              {sec === "All" ? t.allSectors : sec}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={aspirationalOnly}
              onChange={(e) => setAspirationalOnly(e.target.checked)}
              className="rounded border-slate-700 text-orange-500 focus:ring-orange-500 bg-slate-950"
            />
            <span>{t.aspirationalDistrictsOnly}</span>
          </label>

          <div className="hidden sm:flex items-center gap-3 text-[11px] border-l border-slate-800 pl-3">
            <span className="flex items-center gap-1.5 text-red-400">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
              Critical (IDUS &gt; 80)
            </span>
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              High (70-80)
            </span>
            <span className="flex items-center gap-1.5 text-sky-400">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
              Moderate (&lt; 70)
            </span>
          </div>
        </div>
      </div>

      {/* Main Map + District Inspection Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Leaflet Map Frame */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative h-[560px]">
          <div ref={mapContainerRef} className="w-full h-full z-0" />

          {/* Floating Map Overlay Badge */}
          <div className="absolute top-3 right-3 z-10 bg-slate-950/80 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-xl text-[11px] text-slate-300 shadow-lg pointer-events-none flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-orange-400" />
            <span>PM Gati Shakti Geo-Spatial Master Plan Triangulation</span>
          </div>
        </div>

        {/* Right Inspection Drawer for Selected District */}
        <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl backdrop-blur-md flex flex-col justify-between h-[560px] overflow-y-auto">
          {activeDistrict ? (
            <div className="space-y-4">
              {/* Header */}
              <div className="border-b border-slate-800 pb-3">
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
                <p className="text-xs text-slate-400 mt-1">
                  {activeDistrict.state} • {activeDistrict.region} Region
                  {activeDistrict.isAspirational && " • NITI Aayog Rank #" + activeDistrict.nitiAayogRank}
                </p>
              </div>

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

              {/* Physical Infrastructure Indicators */}
              <div className="space-y-2 text-xs">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Ground Infrastructure Deficit Indices:
                </span>

                <div>
                  <div className="flex justify-between text-[11px] mb-1 text-slate-300">
                    <span>Piped Tap Water (Jal Jeevan):</span>
                    <span className="font-bold text-sky-400">{activeDistrict.indices.pipedWaterCoveragePct}%</span>
                  </div>
                  <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-sky-500 h-full rounded-full" style={{ width: `${activeDistrict.indices.pipedWaterCoveragePct}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1 text-slate-300">
                    <span>All-Weather Roads (PMGSY):</span>
                    <span className="font-bold text-amber-400">{activeDistrict.indices.allWeatherRoadConnectivityPct}%</span>
                  </div>
                  <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: `${activeDistrict.indices.allWeatherRoadConnectivityPct}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1 text-slate-300">
                    <span>Power Grid Reliability:</span>
                    <span className="font-bold text-emerald-400">{activeDistrict.indices.powerReliabilityHrs} hrs/day</span>
                  </div>
                  <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(activeDistrict.indices.powerReliabilityHrs / 24) * 100}%` }}></div>
                  </div>
                </div>
              </div>

              {/* Active Grassroots Requests in this District */}
              <div className="pt-2 border-t border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Active Grievances ({activeDistrictRequests.length}):
                </span>

                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {activeDistrictRequests.length > 0 ? (
                    activeDistrictRequests.map(r => (
                      <div key={r.id} className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-orange-400 text-[11px]">{r.category}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{r.id}</span>
                        </div>
                        <p className="text-slate-300 text-[11px] line-clamp-2">{r.translatedEnglish || r.originalText}</p>
                        <button
                          onClick={() => onViewDpr(r)}
                          className="mt-1.5 text-[10px] text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
                        >
                          View / Generate DPR &rarr;
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 italic">No direct complaints currently mapped.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">Select any marker on the map to inspect district metrics.</p>
          )}

          {/* Attribution footer */}
          <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-500 flex items-center justify-between">
            <span>Aligned with PM Gati Shakti & JJM</span>
            <span className="text-orange-400 font-mono">DPI Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
};
