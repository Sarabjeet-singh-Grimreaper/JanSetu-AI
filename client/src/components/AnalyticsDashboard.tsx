import React, { useState, useEffect } from "react";
import { District, Scheme, CitizenRequest, NationalMetrics } from "../types";
import { SupportedLanguage, translations } from "../translations";
import { TrendingUp, BarChart3, PieChart, ShieldAlert, Award, ArrowUpRight, DollarSign, Download, Filter } from "lucide-react";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend, LineElement, PointElement } from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend, LineElement, PointElement);

interface Props {
  districts: District[];
  schemes: Scheme[];
  requests: CitizenRequest[];
  metrics: NationalMetrics | null;
  lang: SupportedLanguage;
  onViewDpr: (req: CitizenRequest) => void;
}

export const AnalyticsDashboard: React.FC<Props> = ({
  districts,
  schemes,
  requests,
  metrics,
  lang,
  onViewDpr
}) => {
  const t = translations[lang] || translations.en;
  const [selectedSort, setSelectedSort] = useState<"idus" | "budget" | "complaints">("idus");

  // Sorted districts
  const sortedDistricts = [...districts].sort((a, b) => {
    if (selectedSort === "idus") return b.calculatedIDUS - a.calculatedIDUS;
    if (selectedSort === "budget") return b.sanctionedBudgetCr - a.sanctionedBudgetCr;
    return b.activeComplaintsCount - a.activeComplaintsCount;
  });

  // Calculate sector breakdowns
  const sectorCounts: Record<string, number> = {};
  requests.forEach(r => {
    sectorCounts[r.category] = (sectorCounts[r.category] || 0) + 1;
  });

  // Chart data for sector distribution
  const sectorChartData = {
    labels: Object.keys(sectorCounts),
    datasets: [{
      data: Object.values(sectorCounts),
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',   // Water - blue
        'rgba(245, 158, 11, 0.8)',  // Roads - amber
        'rgba(239, 68, 68, 0.8)',   // Health - red
        'rgba(16, 185, 129, 0.8)',  // Electricity - emerald
        'rgba(139, 92, 246, 0.8)',  // School - purple
        'rgba(236, 72, 153, 0.8)',  // Drainage - pink
        'rgba(99, 102, 241, 0.8)',  // Transport - indigo
        'rgba(6, 182, 212, 0.8)'    // Digital - cyan
      ],
      borderColor: [
        'rgba(59, 130, 246, 1)',
        'rgba(245, 158, 11, 1)',
        'rgba(239, 68, 68, 1)',
        'rgba(16, 185, 129, 1)',
        'rgba(139, 92, 246, 1)',
        'rgba(236, 72, 153, 1)',
        'rgba(99, 102, 241, 1)',
        'rgba(6, 182, 212, 1)'
      ],
      borderWidth: 2
    }]
  };

  // Chart data for IDUS scores
  const idusChartData = {
    labels: districts.slice(0, 10).map(d => d.name),
    datasets: [{
      label: 'IDUS Score',
      data: districts.slice(0, 10).map(d => d.calculatedIDUS),
      backgroundColor: districts.slice(0, 10).map(d =>
        d.calculatedIDUS >= 80 ? 'rgba(239, 68, 68, 0.8)' :
        d.calculatedIDUS >= 70 ? 'rgba(245, 158, 11, 0.8)' :
        'rgba(59, 130, 246, 0.8)'
      ),
      borderColor: districts.slice(0, 10).map(d =>
        d.calculatedIDUS >= 80 ? 'rgba(239, 68, 68, 1)' :
        d.calculatedIDUS >= 70 ? 'rgba(245, 158, 11, 1)' :
        'rgba(59, 130, 246, 1)'
      ),
      borderWidth: 2
    }]
  };

  // Chart data for budget utilization
  const budgetChartData = {
    labels: districts.slice(0, 8).map(d => d.name),
    datasets: [
      {
        label: 'Sanctioned Budget (₹ Cr)',
        data: districts.slice(0, 8).map(d => d.sanctionedBudgetCr),
        backgroundColor: 'rgba(16, 185, 129, 0.6)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 2
      },
      {
        label: 'Spent Budget (₹ Cr)',
        data: districts.slice(0, 8).map(d => d.spentBudgetCr),
        backgroundColor: 'rgba(245, 158, 11, 0.6)',
        borderColor: 'rgba(245, 158, 11, 1)',
        borderWidth: 2
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#e2e8f0',
          font: { size: 11 }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(51, 65, 85, 0.3)' },
        ticks: { color: '#94a3b8' }
      },
      x: {
        grid: { color: 'rgba(51, 65, 85, 0.3)' },
        ticks: { color: '#94a3b8' }
      }
    }
  };

  // Export dataset as JSON
  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ districts, requests, metrics }, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `JanSetu_DPI_National_Dataset_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Top National DPI Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Aggregated Feedback</span>
            <span className="text-orange-400 font-mono">11 Languages</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {metrics?.totalRequests || requests.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            100% geo-triangulated via DPI
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Citizens Benefited</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">
            ~{((metrics?.totalPopulationImpact || 43000) / 1000).toFixed(1)}k
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Across 15 monitored districts
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Aspirational Hotspots</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400">
            {districts.filter(d => d.calculatedIDUS >= 80).length} Critical
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            IDUS score &gt; 80 / 100
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>DPI Resolution Index</span>
            <Award className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-indigo-400">
            {metrics?.dpiResolutionIndex || 78.4}%
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Citizen trust & social audit score
          </p>
        </div>
      </div>

      {/* Misaligned Spending & Sector Disparities */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Sector Demand Breakdown */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-orange-400" />
              Citizen Demand by Sector
            </h3>
            <span className="text-[10px] text-slate-400 uppercase font-mono">Live Ingestion</span>
          </div>

          <div className="h-64 flex items-center justify-center">
            <Pie data={sectorChartData} options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'right',
                  labels: {
                    color: '#e2e8f0',
                    font: { size: 10 },
                    boxWidth: 12
                  }
                }
              }
            }} />
          </div>

          <div className="mt-4 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-xs text-orange-300">
            <strong>Key Policy Discovery:</strong> Rural road and bridge requests account for the highest emergency mortality risk, whereas water grievances cluster strongly in tribal Aspirational blocks with fluoride contamination.
          </div>
        </div>

        {/* Right: National Schemes Saturation Alignment */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              Central Infrastructure Schemes Saturation
            </h3>
            <span className="text-[10px] text-slate-400 uppercase font-mono">NITI Aayog & Gati Shakti</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {schemes.slice(0, 6).map(scheme => (
              <div key={scheme.code} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-amber-400">{scheme.code}</span>
                    <span className="text-[10px] text-slate-400 font-mono">₹{(scheme.nationalBudgetCr / 1000).toFixed(0)}k Cr</span>
                  </div>
                  <h4 className="font-semibold text-slate-200 line-clamp-1">{scheme.name}</h4>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{scheme.targetMetric}</p>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                  <span>{scheme.ministry}</span>
                  <span className="text-emerald-400">Active</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* IDUS Score Chart */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            Infrastructure Deficit & Urgency Score (IDUS) Analysis
          </h3>
          <span className="text-[10px] text-slate-400 uppercase font-mono">Priority Ranking</span>
        </div>

        <div className="h-64">
          <Bar data={idusChartData} options={chartOptions} />
        </div>
      </div>

      {/* Budget Utilization Chart */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            Budget Utilization Analysis
          </h3>
          <span className="text-[10px] text-slate-400 uppercase font-mono">Capex Efficiency</span>
        </div>

        <div className="h-64">
          <Bar data={budgetChartData} options={chartOptions} />
        </div>
      </div>

      {/* District Priority & Capex Efficiency Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-orange-400" />
              District Infrastructure Deficit & Urgency Score (IDUS) Matrix
            </h3>
            <p className="text-xs text-slate-400">
              Cross-referencing citizen volume, urgency ratings, and capital expenditure spending gaps
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              <span className="text-slate-500 px-2 flex items-center gap-1"><Filter className="w-3 h-3" /> Sort:</span>
              <button
                onClick={() => setSelectedSort("idus")}
                className={`px-2 py-1 rounded text-xs ${selectedSort === "idus" ? "bg-orange-500 text-white" : "text-slate-400"}`}
              >
                IDUS Score
              </button>
              <button
                onClick={() => setSelectedSort("budget")}
                className={`px-2 py-1 rounded text-xs ${selectedSort === "budget" ? "bg-orange-500 text-white" : "text-slate-400"}`}
              >
                Capex Budget
              </button>
              <button
                onClick={() => setSelectedSort("complaints")}
                className={`px-2 py-1 rounded text-xs ${selectedSort === "complaints" ? "bg-orange-500 text-white" : "text-slate-400"}`}
              >
                Citizen Complaints
              </button>
            </div>

            <button
              onClick={handleExportJson}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1.5 transition border border-slate-700"
            >
              <Download className="w-3.5 h-3.5" />
              Export DPI JSON
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">District & State</th>
                <th className="py-2.5 px-3">Category Deficit</th>
                <th className="py-2.5 px-3">Piped Water (JJM)</th>
                <th className="py-2.5 px-3">Road Connectivity</th>
                <th className="py-2.5 px-3">Capex (Sanctioned / Spent)</th>
                <th className="py-2.5 px-3">Citizen Demands</th>
                <th className="py-2.5 px-3 text-right">IDUS Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {sortedDistricts.map(d => (
                <tr key={d.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-3">
                    <div className="font-semibold text-white flex items-center gap-1.5">
                      {d.name}
                      {d.isAspirational && (
                        <span className="text-[9px] bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded font-mono">
                          ★ Aspirational
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500">{d.state}</div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[11px] text-slate-300">
                      {d.topGrievanceCategory}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono">
                    <span className={d.indices.pipedWaterCoveragePct < 50 ? "text-red-400 font-bold" : "text-slate-300"}>
                      {d.indices.pipedWaterCoveragePct}%
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono">
                    <span className={d.indices.allWeatherRoadConnectivityPct < 60 ? "text-red-400 font-bold" : "text-slate-300"}>
                      {d.indices.allWeatherRoadConnectivityPct}%
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-xs">
                    <span className="text-emerald-400 font-semibold">₹{d.sanctionedBudgetCr} Cr</span>
                    <span className="text-slate-500 block text-[10px]">Spent: ₹{d.spentBudgetCr} Cr</span>
                  </td>
                  <td className="py-3 px-3 font-mono">
                    {d.activeComplaintsCount} active
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className={`inline-block px-2.5 py-1 rounded-lg font-bold font-mono text-xs ${
                      d.calculatedIDUS >= 80 ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                      d.calculatedIDUS >= 70 ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" :
                      "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                    }`}>
                      {d.calculatedIDUS}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
