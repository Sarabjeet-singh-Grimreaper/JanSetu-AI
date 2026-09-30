import React, { useState, useEffect } from "react";
import { translations, SupportedLanguage } from "./translations";
import { District, Scheme, CitizenRequest, NationalMetrics } from "./types";
import { CitizenVoicePortal } from "./components/CitizenVoicePortal";
import { IndiaHotspotMap } from "./components/IndiaHotspotMap";
import { AnalyticsDashboard } from "./components/AnalyticsDashboard";
import { PolicyCopilot } from "./components/PolicyCopilot";
import { DprModal } from "./components/DprModal";
import { AiStudioModal } from "./components/AiStudioModal";
import { DemoMode, DemoScenario } from "./components/DemoMode";
import {
  Mic,
  MapPin,
  BarChart3,
  Sparkles,
  Globe2,
  Cpu,
  ShieldCheck,
  Layers,
  ArrowRight,
  FileText,
  BookOpen
} from "lucide-react";

export const App: React.FC = () => {
  // Localization State
  const [lang, setLang] = useState<SupportedLanguage>("en");
  const t = translations[lang] || translations.en;

  // Active View Tab
  const [activeTab, setActiveTab] = useState<"citizen" | "gis" | "analytics" | "copilot">("citizen");

  // Core Data States
  const [districts, setDistricts] = useState<District[]>([]);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [requests, setRequests] = useState<CitizenRequest[]>([]);
  const [metrics, setMetrics] = useState<NationalMetrics | null>(null);

  // Modals
  const [isDprOpen, setIsDprOpen] = useState(false);
  const [selectedDprRequest, setSelectedDprRequest] = useState<CitizenRequest | null>(null);
  const [isAiStudioOpen, setIsAiStudioOpen] = useState(false);
  const [isDemoModeOpen, setIsDemoModeOpen] = useState(false);
  const [currentModel, setCurrentModel] = useState("gemini-2.5-flash");

  // Initial Data Fetch
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [distRes, schemeRes, reqRes, metricsRes, healthRes] = await Promise.all([
          fetch("/api/districts").then(r => r.json()),
          fetch("/api/schemes").then(r => r.json()),
          fetch("/api/requests").then(r => r.json()),
          fetch("/api/metrics/national").then(r => r.json()),
          fetch("/api/health").then(r => r.json())
        ]);

        if (distRes.districts) setDistricts(distRes.districts);
        if (schemeRes.schemes) setSchemes(schemeRes.schemes);
        if (reqRes.requests) setRequests(reqRes.requests);
        if (metricsRes) setMetrics(metricsRes);
        if (healthRes.gemini?.activeModel) setCurrentModel(healthRes.gemini.activeModel);
      } catch (err) {
        console.error("Initial data load error:", err);
      }
    };

    fetchData();
  }, []);

  const handleRequestSubmitted = (newReq: CitizenRequest) => {
    setRequests(prev => [newReq, ...prev]);
    // Refresh districts & metrics
    fetch("/api/districts").then(r => r.json()).then(d => d.districts && setDistricts(d.districts));
    fetch("/api/metrics/national").then(r => r.json()).then(m => setMetrics(m));
  };

  const handleOpenDpr = (req?: CitizenRequest) => {
    setSelectedDprRequest(req || requests[0] || null);
    setIsDprOpen(true);
  };

  const handleRunDemoScenario = (scenario: DemoScenario) => {
    // Navigate to the appropriate tab based on scenario category
    const tabMap: Record<string, "citizen" | "gis" | "analytics" | "copilot"> = {
      voice: "citizen",
      whatsapp: "citizen",
      gis: "gis",
      analytics: "analytics",
      copilot: "copilot"
    };
    setActiveTab(tabMap[scenario.category] || "citizen");

    // If scenario has sample data, populate it
    if (scenario.sampleData) {
      // This would trigger the appropriate component to use the sample data
      console.log("Running scenario with sample data:", scenario.sampleData);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      {/* Top National DPI Banner */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          {/* Logo & National Brand */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 via-white to-green-600 p-[2px] shadow-lg shadow-orange-500/10">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center font-bold text-sm text-orange-400">
                🇮🇳
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white">
                  JanSetu <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-500">AI</span>
                </h1>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/30">
                  जनसेतु
                </span>
                <span className="hidden sm:inline-block text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Digital Public Good
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Multilingual Citizen Feedback & National Infrastructure Intelligence
              </p>
            </div>
          </div>

          {/* Right Header Controls: Language Selector & Google AI Studio Lab */}
          <div className="flex items-center gap-3">
            {/* Demo Mode Button */}
            <button
              onClick={() => setIsDemoModeOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs text-slate-200 transition shadow-sm group"
            >
              <BookOpen className="w-3.5 h-3.5 text-orange-400 group-hover:rotate-12 transition-transform" />
              <div className="text-left hidden md:block">
                <div className="text-[9px] text-slate-400 uppercase tracking-wider font-mono">Hackathon</div>
                <div className="text-[11px] font-bold text-white">Demo Mode</div>
              </div>
            </button>

            {/* Google AI Studio Lab Badge */}
            <button
              onClick={() => setIsAiStudioOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs text-slate-200 transition shadow-sm group"
            >
              <Cpu className="w-3.5 h-3.5 text-orange-400 group-hover:rotate-12 transition-transform" />
              <div className="text-left hidden md:block">
                <div className="text-[9px] text-slate-400 uppercase tracking-wider font-mono">Google Tech</div>
                <div className="text-[11px] font-bold text-white flex items-center gap-1">
                  <span>{currentModel}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                </div>
              </div>
            </button>

            {/* Language Switcher */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs">
              <Globe2 className="w-3.5 h-3.5 text-indigo-400" />
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as SupportedLanguage)}
                className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
              >
                {Object.entries(translations).map(([code, tInfo]) => (
                  <option key={code} value={code} className="bg-slate-900 text-slate-200">
                    {tInfo.nativeName} ({tInfo.name})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <nav className="flex items-center space-x-1 sm:space-x-3 overflow-x-auto py-2 text-xs font-semibold no-scrollbar">
            <button
              onClick={() => setActiveTab("citizen")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition whitespace-nowrap ${
                activeTab === "citizen"
                  ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>{t.navCitizenPortal}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
                11 Langs
              </span>
            </button>

            <button
              onClick={() => setActiveTab("gis")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition whitespace-nowrap ${
                activeTab === "gis"
                  ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>{t.navGisMap}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
                Gati Shakti
              </span>
            </button>

            <button
              onClick={() => setActiveTab("analytics")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition whitespace-nowrap ${
                activeTab === "analytics"
                  ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>{t.navAnalytics}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
                NITI Aayog
              </span>
            </button>

            <button
              onClick={() => setActiveTab("copilot")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition whitespace-nowrap ${
                activeTab === "copilot"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{t.navPolicyCopilot}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-500/40 text-indigo-200">
                Gemini AI
              </span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {activeTab === "citizen" && (
          <CitizenVoicePortal
            districts={districts}
            schemes={schemes}
            lang={lang}
            onRequestSubmitted={handleRequestSubmitted}
            onViewDpr={(req) => handleOpenDpr(req)}
          />
        )}

        {activeTab === "gis" && (
          <IndiaHotspotMap
            districts={districts}
            requests={requests}
            lang={lang}
            onSelectDistrict={(d) => console.log("Selected district:", d.name)}
            onViewDpr={(req) => handleOpenDpr(req)}
          />
        )}

        {activeTab === "analytics" && (
          <AnalyticsDashboard
            districts={districts}
            schemes={schemes}
            requests={requests}
            metrics={metrics}
            lang={lang}
            onViewDpr={(req) => handleOpenDpr(req)}
          />
        )}

        {activeTab === "copilot" && (
          <PolicyCopilot
            districts={districts}
            schemes={schemes}
            lang={lang}
            onOpenDprModal={handleOpenDpr}
          />
        )}
      </main>

      {/* Detailed Project Report (DPR) Modal */}
      <DprModal
        isOpen={isDprOpen}
        onClose={() => setIsDprOpen(false)}
        request={selectedDprRequest}
        districts={districts}
        lang={lang}
      />

      {/* Google AI Studio Lab Modal */}
      <AiStudioModal
        isOpen={isAiStudioOpen}
        onClose={() => setIsAiStudioOpen(false)}
        currentModel={currentModel}
        onModelChange={(newModel) => setCurrentModel(newModel)}
      />

      {/* Demo Mode Modal */}
      <DemoMode
        isOpen={isDemoModeOpen}
        onClose={() => setIsDemoModeOpen(false)}
        onRunScenario={handleRunDemoScenario}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-orange-400 font-bold">JanSetu AI</span>
            <span>•</span>
            <span>Digital Public Good for India</span>
            <span>•</span>
            <span>Interoperable with PM Gati Shakti, Bhashini & Beckn DPI</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Google Cloud Run Ready
            </span>
            <button
              onClick={() => setIsAiStudioOpen(true)}
              className="hover:text-slate-300 transition underline underline-offset-2"
            >
              Google AI Studio Playground
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
