"use client";
import React from "react";
import { motion } from "framer-motion";
import { DashboardMode } from "@/lib/types";
import { getCompositeScores, getOverviewKPIs, MODE_META, CompositeScores, IntelKPI } from "@/lib/intelligenceData";

function ScoreGauge({ score, label, color, size = 72 }: { score: number; label: string; color: string; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(score, 100) / 100;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={6} />
        <motion.circle
          cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={6}
          strokeLinecap="round" strokeDasharray={circ} initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - pct) }} transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <span className="text-lg font-black text-white -mt-12">{score}</span>
      <span className="text-[9px] text-gray-500 uppercase tracking-wider mt-5 font-semibold">{label}</span>
    </div>
  );
}

export default function OverviewTab({ mode, riskSummary, exposureSummary, criticalInfra, shelters }: {
  mode: DashboardMode; riskSummary: any[]; exposureSummary: any[]; criticalInfra: any[]; shelters: any[];
}) {
  const scores = getCompositeScores(mode, riskSummary, exposureSummary);
  const kpis = getOverviewKPIs(mode, riskSummary, exposureSummary, criticalInfra, shelters);
  const meta = MODE_META[mode];

  return (
    <div className="space-y-4">
      {/* Mode Header */}
      <div className="flex items-center gap-2 px-1">
        <span className="text-base">{meta.icon}</span>
        <div>
          <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wider">{meta.label}</h3>
          <p className="text-[9px] text-gray-500">Executive Intelligence Summary</p>
        </div>
      </div>

      {/* Composite Scores */}
      <div className="bg-black/30 rounded-xl border border-white/5 p-4">
        <h4 className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-3">Composite Scores</h4>
        <div className="flex items-center justify-around">
          <ScoreGauge score={scores.riskScore} label="Risk" color={scores.riskColor} />
          <ScoreGauge score={scores.resilienceScore} label="Resilience" color={scores.resilienceColor} />
          <ScoreGauge score={scores.sustainabilityScore} label="Sustain." color={scores.sustainabilityColor} />
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3">
          {[
            { l: scores.riskLabel, c: scores.riskColor },
            { l: scores.resilienceLabel, c: scores.resilienceColor },
            { l: scores.sustainabilityLabel, c: scores.sustainabilityColor },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ color: s.c, backgroundColor: `${s.c}15` }}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-2">
        {kpis.map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-black/20 rounded-xl border border-white/5 p-3 hover:border-white/10 transition-all"
          >
            <p className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold">{kpi.label}</p>
            <p className="text-base font-black text-white mt-0.5" style={{ color: kpi.color }}>{kpi.value}</p>
            <p className="text-[9px] text-gray-600 mt-0.5">{kpi.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Status Bar */}
      <div className="bg-black/20 rounded-xl border border-white/5 p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] text-gray-400 font-medium">PostGIS Analytics Engine</span>
        </div>
        <span className="text-[9px] text-gray-600 font-mono">{new Date().toLocaleTimeString()}</span>
      </div>
    </div>
  );
}
