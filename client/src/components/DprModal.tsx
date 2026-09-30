import React, { useState, useEffect } from "react";
import { X, Download, Printer, CheckCircle2, Building2, Calendar, ShieldCheck, Sparkles, RefreshCw, FileSpreadsheet } from "lucide-react";
import { CitizenRequest, DetailedProjectReport, District } from "../types";
import { SupportedLanguage, translations } from "../translations";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  request: CitizenRequest | null;
  districts: District[];
  lang: SupportedLanguage;
}

export const DprModal: React.FC<Props> = ({
  isOpen,
  onClose,
  request,
  districts,
  lang
}) => {
  const t = translations[lang] || translations.en;
  const [dpr, setDpr] = useState<DetailedProjectReport | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (isOpen && request) {
      if (request.generatedDPR) {
        setDpr(request.generatedDPR);
      } else {
        generateDprForRequest(request);
      }
    }
  }, [isOpen, request]);

  const generateDprForRequest = async (req: CitizenRequest) => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/dpr/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: req.id })
      });
      const data = await response.json();
      if (data.success && data.dpr) {
        setDpr(data.dpr);
      }
    } catch (err) {
      console.error("Failed to generate DPR:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Action Bar */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🇮🇳</span>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                {t.dprModalTitle}
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded font-mono">
                  Gemini Generated
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Official Project Formulation & Sanction Memo for District Magistrates and Ministries
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1.5 transition"
              title="Print / Save as PDF"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-200 bg-slate-900/50">
          {isGenerating ? (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <RefreshCw className="w-10 h-10 animate-spin text-orange-500 mb-4" />
              <h4 className="text-base font-bold text-white">Synthesizing Detailed Project Report...</h4>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                Gemini 2.5 Flash is calculating engineering scope, budget outlays, and demographic multiplier indices based on national data.
              </p>
            </div>
          ) : dpr ? (
            <div className="space-y-6 print:text-black">
              {/* Official Header */}
              <div className="text-center border-b border-slate-800 pb-4">
                <span className="text-[11px] uppercase tracking-widest text-orange-400 font-bold block mb-1">
                  Government of India • Digital Public Good Infrastructure Portal
                </span>
                <h2 className="text-lg font-bold text-white uppercase tracking-tight">
                  {dpr.projectTitle}
                </h2>
                <div className="flex flex-wrap items-center justify-center gap-3 mt-2 text-[11px] text-slate-400 font-mono">
                  <span>DPR Ref: {dpr.dprNumber}</span>
                  <span>•</span>
                  <span>Ministry: {dpr.sponsoringMinistry}</span>
                  <span>•</span>
                  <span>Scheme: {dpr.sanctioningScheme}</span>
                </div>
              </div>

              {/* Key Highlights Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Estimated Capex</span>
                  <span className="text-base font-bold text-emerald-400 mt-1 block">₹{dpr.estimatedBudgetInrCr} Cr</span>
                  <span className="text-[10px] text-slate-500">100% Central / State Grant</span>
                </div>
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Target Households</span>
                  <span className="text-base font-bold text-sky-400 mt-1 block">
                    {dpr.beneficiaryDemographics.totalHouseholds.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-500">Across {dpr.beneficiaryDemographics.gramPanchayatsCovered} Panchayats</span>
                </div>
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Marginalized / Tribal %</span>
                  <span className="text-base font-bold text-amber-400 mt-1 block">
                    {dpr.beneficiaryDemographics.marginalizedBeneficiaryPct}%
                  </span>
                  <span className="text-[10px] text-slate-500">PVTG Saturation Target</span>
                </div>
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Execution Window</span>
                  <span className="text-base font-bold text-purple-400 mt-1 block">{dpr.executionDurationMonths} Months</span>
                  <span className="text-[10px] text-slate-500">Fast-Track Turnaround</span>
                </div>
              </div>

              {/* Technical Scope of Work */}
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-orange-400" />
                  Engineering & Technical Scope
                </h4>
                <ul className="space-y-1.5 pl-2">
                  {dpr.technicalScope.map((scope, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-slate-300">
                      <span className="text-orange-400 font-bold">•</span>
                      <span>{scope}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Socio-Economic ROI */}
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Socio-Economic Impact & Multiplier Analysis
                </h4>
                <p className="text-slate-300 leading-relaxed bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                  {dpr.economicRoiAndMultiplier}
                </p>
              </div>

              {/* Milestones & Risk Mitigation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-400" />
                    Phased Milestones
                  </h4>
                  <div className="space-y-2">
                    {dpr.implementationMilestones.map((m, idx) => (
                      <div key={idx} className="flex items-start justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px]">
                        <div>
                          <strong className="text-slate-200 block">{m.phase}</strong>
                          <span className="text-slate-400">{m.deliverable}</span>
                        </div>
                        <span className="font-mono text-indigo-400">{m.durationDays}d</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-rose-400" />
                    Risk Assessment & Mitigation
                  </h4>
                  <div className="space-y-2">
                    {dpr.riskAndMitigation.map((rm, idx) => (
                      <div key={idx} className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px]">
                        <span className="text-rose-400 font-semibold block">⚠️ {rm.risk}</span>
                        <span className="text-slate-300 block mt-0.5">🛡️ {rm.mitigation}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* SDG Alignment Badges */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
                <span className="text-[11px] text-slate-400 font-semibold">SDG Alignment:</span>
                {dpr.sdgGoalsAligned.map((sdg, idx) => (
                  <span key={idx} className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-[10px] font-medium border border-slate-700">
                    {sdg}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-center text-slate-500 py-10">No project report data available.</p>
          )}
        </div>
      </div>
    </div>
  );
};
