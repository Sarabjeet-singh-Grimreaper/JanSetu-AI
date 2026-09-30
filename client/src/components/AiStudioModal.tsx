import React, { useState } from "react";
import { Sparkles, Key, CheckCircle2, AlertCircle, RefreshCw, Cpu, Sliders, ExternalLink, ShieldCheck } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentModel: string;
  onModelChange: (model: string) => void;
}

export const AiStudioModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentModel,
  onModelChange
}) => {
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [selectedModel, setSelectedModel] = useState(currentModel || "gemini-2.5-flash");
  const [temperature, setTemperature] = useState(0.2);
  const [systemInstructionPreset, setSystemInstructionPreset] = useState("default");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{ valid?: boolean; message?: string } | null>(null);

  const presets = {
    default: "You are JanSetu AI, the National Multilingual Grievance & Infrastructure Intelligence Engine for the Government of India. Analyze citizen complaints across 11 Indian languages, extract severity, and triangulate with Jal Jeevan Mission, PMGSY, and PM Gati Shakti.",
    auditor: "You are a Chief Comptroller & Auditor General (CAG) AI Specialist. Audit citizen complaints against district Capex allocations to detect fiscal leakages, ghost tenders, and delayed rural infrastructure works.",
    empathetic: "You are an empathetic Village Gram Sevak AI assistant. Listen to grassroots voices, validate local hardships in native Indian dialects, and formulate immediate fast-track administrative relief."
  };

  const [customSystemPrompt, setCustomSystemPrompt] = useState(presets.default);

  const handlePresetChange = (preset: "default" | "auditor" | "empathetic") => {
    setSystemInstructionPreset(preset);
    setCustomSystemPrompt(presets[preset]);
  };

  const handleVerifyKey = async () => {
    if (!apiKeyInput.trim()) return;
    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const response = await fetch("/api/ai/verify-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKeyInput })
      });
      const data = await response.json();
      setVerificationResult(data);
    } catch (err: any) {
      setVerificationResult({ valid: false, message: err.message || "Network error testing API key" });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSaveConfig = async () => {
    try {
      await fetch("/api/ai/update-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: selectedModel,
          apiKey: apiKeyInput.trim() || undefined
        })
      });
      onModelChange(selectedModel);
      onClose();
    } catch (err) {
      console.error("Failed to update AI config:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-500 via-amber-500 to-indigo-600 flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Google AI Studio Prototyping Lab
                <span className="text-[10px] bg-orange-500/20 text-orange-400 border border-orange-500/40 px-2 py-0.5 rounded font-mono">
                  Gemini Flash 2.5 / 1.5
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Craft, test, and iterate system instructions for citizen infrastructure intelligence
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xs bg-slate-800 px-2.5 py-1.5 rounded-lg"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-xs text-slate-200">
          {/* Model Selection */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-orange-400" />
              Active Google Gemini Model
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", tag: "Latest Multilingual" },
                { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", tag: "High Throughput" },
                { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", tag: "Complex Reasoning" }
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => setSelectedModel(m.id)}
                  className={`p-2.5 rounded-xl border text-left transition ${
                    selectedModel === m.id
                      ? "bg-orange-500/10 border-orange-500 text-white shadow-md shadow-orange-500/10"
                      : "bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <div className="font-bold text-xs text-slate-200">{m.name}</div>
                  <div className="text-[10px] text-orange-400 mt-0.5">{m.tag}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Google AI Studio API Key Configuration */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                Google AI Studio API Key (Optional / Live Mode)
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-orange-400 hover:underline flex items-center gap-1"
              >
                Get Key from Google AI Studio <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex gap-2">
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="AIzaSy... (Paste key to switch to live Gemini API)"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
              />
              <button
                onClick={handleVerifyKey}
                disabled={isVerifying || !apiKeyInput.trim()}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition disabled:opacity-40"
              >
                {isVerifying ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                Verify Key
              </button>
            </div>

            {verificationResult && (
              <div className={`mt-2 p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                verificationResult.valid ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
              }`}>
                {verificationResult.valid ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                <span>{verificationResult.message}</span>
              </div>
            )}
            <p className="text-[10px] text-slate-500 mt-1">
              Note: JanSetu includes a built-in intelligent multilingual DPI engine that provides 100% functionality even when offline or without an active key.
            </p>
          </div>

          {/* System Instructions Playground */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                Google AI Studio System Instructions Playground
              </label>
              <div className="flex items-center gap-1">
                {(["default", "auditor", "empathetic"] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => handlePresetChange(p)}
                    className={`text-[10px] px-2 py-0.5 rounded capitalize ${
                      systemInstructionPreset === p ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              value={customSystemPrompt}
              onChange={(e) => setCustomSystemPrompt(e.target.value)}
              rows={4}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-[11px] text-slate-300 font-mono focus:outline-none focus:border-indigo-500 leading-relaxed"
            />
          </div>

          {/* Temperature Slider */}
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Temperature (Creativity vs Determinism):</span>
              <span className="font-mono text-orange-400">{temperature}</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full accent-orange-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-6 py-3 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">Google Cloud Run Deployment Spec Ready</span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveConfig}
              className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-semibold text-xs transition shadow-md"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
