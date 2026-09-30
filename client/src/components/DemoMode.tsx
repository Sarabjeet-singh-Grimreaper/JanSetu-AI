import React, { useState } from "react";
import { Play, SkipForward, RotateCcw, BookOpen, Sparkles, Target, Zap, Globe2, BarChart3, CheckCircle2, ArrowRight } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onRunScenario: (scenario: DemoScenario) => void;
}

export interface DemoScenario {
  id: string;
  title: string;
  description: string;
  category: "voice" | "whatsapp" | "analytics" | "copilot" | "gis";
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedTime: string;
  steps: string[];
  sampleData?: any;
}

const demoScenarios: DemoScenario[] = [
  {
    id: "voice-hindi",
    title: "Voice Grievance in Hindi",
    description: "Submit a voice complaint about road infrastructure in Bastar district using Hindi language",
    category: "voice",
    difficulty: "beginner",
    estimatedTime: "2 min",
    steps: [
      "Navigate to Voice Portal tab",
      "Click the microphone button to start recording",
      "Speak or use the Hindi sample: 'दरभा ब्लॉक के छिंदगढ़ में मुख्य पुलिया बारिश में बह गई है'",
      "Stop recording and observe AI translation",
      "Review the generated DPI ticket and IDUS score"
    ],
    sampleData: {
      text: "दरभा ब्लॉक के छिंदगढ़ में मुख्य पुलिया बारिश में बह गई है। 300 स्कूली बच्चों और एंबुलेंस को 18 किमी का फेर लगाना पड़ रहा है।",
      district: "Bastar",
      category: "Rural Roads & Bridges"
    }
  },
  {
    id: "whatsapp-multilingual",
    title: "WhatsApp Bot Multi-Language",
    description: "Test the WhatsApp civic bot with complaints in different Indian languages",
    category: "whatsapp",
    difficulty: "intermediate",
    estimatedTime: "3 min",
    steps: [
      "Switch to WhatsApp Civic Bot tab",
      "Try the Odia water crisis sample",
      "Submit and observe automatic language detection",
      "Test with Tamil school infrastructure complaint",
      "Compare the DPI ticket formats across languages"
    ],
    sampleData: {
      samples: [
        { lang: "Odia", text: "ମାଥିଲି ବ୍ଲକର କୁର୍ତ୍ତି ଗ୍ରାମରେ ସମସ୍ତ ନଳକୂପ ଅଚଳ।" },
        { lang: "Tamil", text: "பாலக்கோடு அரசு மேல்நிலைப் பள்ளியில் மாணவிகளுக்கான கழிப்பறை வசதி இல்லை." }
      ]
    }
  },
  {
    id: "analytics-hotspots",
    title: "Infrastructure Hotspot Analysis",
    description: "Analyze national infrastructure deficit patterns using interactive charts",
    category: "analytics",
    difficulty: "intermediate",
    estimatedTime: "4 min",
    steps: [
      "Navigate to Analytics Dashboard",
      "Review the national DPI metrics cards",
      "Examine the sector distribution pie chart",
      "Study the IDUS score bar chart for priority districts",
      "Check budget utilization analysis",
      "Filter districts by IDUS score and identify critical areas"
    ]
  },
  {
    id: "gis-priority",
    title: "GIS Hotspot Map Exploration",
    description: "Explore geographic distribution of infrastructure needs across India",
    category: "gis",
    difficulty: "beginner",
    estimatedTime: "3 min",
    steps: [
      "Go to GIS Hotspot Map tab",
      "Observe the pulsing beacons indicating priority",
      "Click on red (critical) hotspots like Bastar",
      "Filter by sector (Water, Roads, Power)",
      "View the correlation with NITI Aayog Aspirational districts"
    ]
  },
  {
    id: "copilot-budget",
    title: "Policy Copilot Budget Analysis",
    description: "Use the AI Policy Copilot to analyze budget allocation and recommend reforms",
    category: "copilot",
    difficulty: "advanced",
    estimatedTime: "5 min",
    steps: [
      "Open the Policy Copilot tab",
      "Ask: 'What are the top water infrastructure hotspots?'",
      "Review the AI's data-driven response",
      "Ask: 'How can we reallocate budget to address critical gaps?'",
      "Generate a DPR for a high-priority district",
      "Examine the detailed project report components"
    ]
  },
  {
    id: "dpr-generation",
    title: "DPR Generation Workflow",
    description: "Complete end-to-end workflow from citizen complaint to Detailed Project Report",
    category: "voice",
    difficulty: "advanced",
    estimatedTime: "6 min",
    steps: [
      "Submit a citizen grievance via Voice Portal",
      "Review the AI-generated DPI ticket",
      "Click 'Generate DPR' button",
      "Examine the formal Government of India DPR structure",
      "Review budget estimates, technical scope, and implementation milestones",
      "Check SDG alignment and beneficiary demographics"
    ]
  }
];

export const DemoMode: React.FC<Props> = ({ isOpen, onClose, onRunScenario }) => {
  const [selectedScenario, setSelectedScenario] = useState<DemoScenario | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const handleRunScenario = (scenario: DemoScenario) => {
    setSelectedScenario(scenario);
    setCurrentStep(0);
    onRunScenario(scenario);
  };

  const categoryIcons = {
    voice: <Sparkles className="w-4 h-4" />,
    whatsapp: <Globe2 className="w-4 h-4" />,
    analytics: <BarChart3 className="w-4 h-4" />,
    copilot: <Target className="w-4 h-4" />,
    gis: <Zap className="w-4 h-4" />
  };

  const difficultyColors = {
    beginner: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    intermediate: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    advanced: "bg-rose-500/10 text-rose-400 border-rose-500/20"
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-amber-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Hackathon Demo Mode</h2>
              <p className="text-xs text-orange-100">Interactive scenarios for judges and stakeholders</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white text-xs bg-white/10 px-3 py-1.5 rounded-lg transition"
          >
            ✕ Close
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!selectedScenario ? (
            <div>
              <div className="mb-6">
                <h3 className="text-sm font-bold text-white mb-2">Available Demo Scenarios</h3>
                <p className="text-xs text-slate-400">Choose a scenario to demonstrate specific capabilities of the JanSetu AI platform</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {demoScenarios.map(scenario => (
                  <div
                    key={scenario.id}
                    className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 hover:border-orange-500/40 transition cursor-pointer group"
                    onClick={() => handleRunScenario(scenario)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-slate-800 text-orange-400">
                          {categoryIcons[scenario.category]}
                        </span>
                        <h4 className="text-sm font-semibold text-white group-hover:text-orange-400 transition">
                          {scenario.title}
                        </h4>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${difficultyColors[scenario.difficulty]}`}>
                        {scenario.difficulty}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mb-3 line-clamp-2">{scenario.description}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        {scenario.category}
                      </span>
                      <span className="flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        {scenario.estimatedTime}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setSelectedScenario(null)}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition"
                >
                  <RotateCcw className="w-3 h-3" />
                  Back to scenarios
                </button>
                <span className="text-xs text-slate-500">
                  Step {currentStep + 1} of {selectedScenario.steps.length}
                </span>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <span className="p-2 rounded-xl bg-orange-500/10 text-orange-400">
                    {categoryIcons[selectedScenario.category]}
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-white">{selectedScenario.title}</h3>
                    <p className="text-xs text-slate-400">{selectedScenario.description}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {selectedScenario.steps.map((step, index) => (
                    <div
                      key={index}
                      className={`flex items-start gap-3 p-3 rounded-lg transition ${
                        index === currentStep
                          ? "bg-orange-500/10 border border-orange-500/20"
                          : index < currentStep
                          ? "bg-emerald-500/5 border border-emerald-500/10"
                          : "bg-slate-900/50 border border-slate-800/50"
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === currentStep
                          ? "bg-orange-500 text-white"
                          : index < currentStep
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-700 text-slate-400"
                      }`}>
                        {index < currentStep ? <CheckCircle2 className="w-3 h-3" /> : index + 1}
                      </div>
                      <p className={`text-xs ${
                        index === currentStep ? "text-white" : index < currentStep ? "text-emerald-400" : "text-slate-400"
                      }`}>
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                  disabled={currentStep === 0}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs disabled:opacity-40 transition flex items-center gap-2"
                >
                  Previous
                </button>
                <button
                  onClick={() => {
                    if (currentStep < selectedScenario.steps.length - 1) {
                      setCurrentStep(currentStep + 1);
                    } else {
                      setSelectedScenario(null);
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white text-xs transition flex items-center gap-2"
                >
                  {currentStep < selectedScenario.steps.length - 1 ? (
                    <>
                      Next Step <ArrowRight className="w-3 h-3" />
                    </>
                  ) : (
                    <>
                      Complete <CheckCircle2 className="w-3 h-3" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};