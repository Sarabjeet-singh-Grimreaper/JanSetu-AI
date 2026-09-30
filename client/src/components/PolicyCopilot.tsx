import React, { useState } from "react";
import { Sparkles, Send, Bot, User, RefreshCw, FileText, Download, Building, ArrowUpRight } from "lucide-react";
import { SupportedLanguage, translations } from "../translations";
import { District, Scheme, CitizenRequest } from "../types";

interface Props {
  districts: District[];
  schemes: Scheme[];
  lang: SupportedLanguage;
  onOpenDprModal: (request?: CitizenRequest) => void;
}

export const PolicyCopilot: React.FC<Props> = ({
  districts,
  schemes,
  lang,
  onOpenDprModal
}) => {
  const t = translations[lang] || translations.en;

  const [inputQuery, setInputQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: "assistant" | "user"; content: string; source?: string }>>([
    {
      role: "assistant",
      content: `**Namaste! I am the JanSetu National Policy Copilot**, powered by Google Gemini.\n\nI continuously synthesize citizen feedback across **11 languages** with NITI Aayog Aspirational District indices and PM Gati Shakti spatial corridors.\n\nHow can I assist your ministry or planning board today?\n- 💧 *Evaluate Jal Jeevan tap water saturation & groundwater depletion*\n- 🛣️ *Spot rural connectivity gaps and draft PM-JANMAN culvert DPRs*\n- ⚡ *Formulate Capex reallocation proposals for underfunded districts*`,
      source: "gemini-live"
    }
  ]);

  const starterPrompts = [
    "💧 Analyze water crisis in Malkangiri vs Jal Jeevan Mission spend",
    "🛣️ Recommend high-priority road connectivity in Bastar under PM-JANMAN",
    "💰 Draft strategic Capex reallocation memo for underfunded Aspirational Districts",
    "🏥 Evaluate healthcare PHC bed deficit in Nalanda and Vizianagaram"
  ];

  const handleSend = async (queryToSend?: string) => {
    const q = queryToSend || inputQuery;
    if (!q.trim() || isLoading) return;

    const userMsg = { role: "user" as const, content: q };
    setMessages(prev => [...prev, userMsg]);
    setInputQuery("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: q,
          conversationHistory: messages
        })
      });

      const data = await response.json();
      if (data.success) {
        setMessages(prev => [
          ...prev,
          { role: "assistant", content: data.reply, source: data.source }
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          { role: "assistant", content: "Apologies, I encountered an issue retrieving the policy response. Please check API settings." }
        ]);
      }
    } catch (err) {
      console.error("Copilot request error:", err);
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "Error connecting to Policy Copilot engine." }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-2xl p-5 shadow-2xl relative overflow-hidden backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                JanSetu Policy Copilot & AI Strategic Advisor
                <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded-full">
                  Gemini Flash Grounded
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Decision intelligence for Chief Secretaries, District Magistrates, and National Infrastructure Taskforces
              </p>
            </div>
          </div>

          <button
            onClick={() => onOpenDprModal()}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-orange-500/25 transition"
          >
            <FileText className="w-4 h-4" />
            Launch DPR Generator
          </button>
        </div>
      </div>

      {/* Starter Suggestion Chips */}
      <div className="flex flex-wrap gap-2">
        {starterPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            className="text-xs px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition flex items-center gap-1.5"
          >
            <span>{prompt}</span>
            <ArrowUpRight className="w-3 h-3 opacity-60" />
          </button>
        ))}
      </div>

      {/* Chat Messages Container */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-2xl backdrop-blur-md h-[480px] overflow-y-auto space-y-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex items-start gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs ${
                msg.role === "user"
                  ? "bg-orange-500 text-white"
                  : "bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20"
              }`}
            >
              {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                msg.role === "user"
                  ? "bg-orange-600/90 text-white rounded-tr-none"
                  : "bg-slate-950/90 border border-slate-800 text-slate-200 rounded-tl-none whitespace-pre-wrap"
              }`}
            >
              <div>{msg.content}</div>

              {msg.role === "assistant" && (
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-500">
                  <span className="font-mono">Engine: {msg.source || "gemini-flash"}</span>
                  <span className="text-indigo-400">Grounded in National Infrastructure Indices</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-950 border border-slate-800 text-slate-400 p-3 rounded-2xl text-xs flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              Gemini AI is analyzing cross-district datasets & synthesizing policy brief...
            </div>
          </div>
        )}
      </div>

      {/* Input Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2.5 flex items-center gap-2 shadow-2xl">
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder={t.askCopilotPrompt}
          className="flex-1 bg-transparent px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
        />
        <button
          onClick={() => handleSend()}
          disabled={isLoading || !inputQuery.trim()}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-2 disabled:opacity-40 transition shadow-lg shadow-indigo-600/20"
        >
          {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          <span>Inquire</span>
        </button>
      </div>
    </div>
  );
};
