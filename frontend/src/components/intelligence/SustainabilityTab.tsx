"use client";
import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { DashboardMode } from "@/lib/types";
import { getSustainabilityMetrics } from "@/lib/intelligenceData";

export default function SustainabilityTab({ mode }: { mode: DashboardMode }) {
  const metrics = getSustainabilityMetrics(mode);
  const avgScore = Math.round(metrics.reduce((a, m) => a + m.score, 0) / metrics.length);
  const avgTarget = Math.round(metrics.reduce((a, m) => a + m.target, 0) / metrics.length);
  const gap = avgTarget - avgScore;

  return (
    <div className="space-y-4">
      {/* Overall Score */}
      <div className="bg-black/30 rounded-xl border border-white/5 p-4 text-center">
        <p className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold mb-2">Sustainability Composite</p>
        <div className="relative inline-flex items-center justify-center">
          <svg width={90} height={90} className="-rotate-90">
            <circle cx={45} cy={45} r={38} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={7} />
            <motion.circle cx={45} cy={45} r={38} fill="none"
              stroke={avgScore >= 65 ? '#10b981' : avgScore >= 45 ? '#f59e0b' : '#ef4444'}
              strokeWidth={7} strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 38}
              initial={{ strokeDashoffset: 2 * Math.PI * 38 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 38 * (1 - avgScore / 100) }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
          </svg>
          <span className="absolute text-xl font-black text-white">{avgScore}</span>
        </div>
        <p className="text-[10px] text-gray-400 mt-1">Gap to target: <span className="text-amber-400 font-bold">{gap} points</span></p>
      </div>

      {/* Individual Metrics */}
      <div className="space-y-2">
        {metrics.map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="bg-black/20 rounded-xl border border-white/5 p-3 hover:border-white/10 transition-all">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-gray-300 truncate">{m.indicator}</p>
                <span className="text-[8px] text-primary-400 font-bold uppercase tracking-wider bg-primary-500/10 px-1.5 py-0.5 rounded mt-0.5 inline-block">{m.sdg}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-2">
                {m.trend === 'up' ? <TrendingUp size={10} className="text-emerald-400" /> :
                 m.trend === 'down' ? <TrendingDown size={10} className="text-red-400" /> :
                 <Minus size={10} className="text-gray-500" />}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div className="h-full rounded-full relative" 
                  style={{ backgroundColor: m.score >= 65 ? '#10b981' : m.score >= 45 ? '#f59e0b' : '#ef4444' }}
                  initial={{ width: 0 }} animate={{ width: `${m.score}%` }} transition={{ duration: 0.8, delay: i * 0.08 }}>
                </motion.div>
              </div>
              <span className="text-[10px] font-bold text-gray-200 w-8 text-right">{m.score}</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[8px] text-gray-600">Target: {m.target}</span>
              <span className={`text-[8px] font-bold ${m.score >= m.target ? 'text-emerald-400' : 'text-amber-400'}`}>
                {m.score >= m.target ? '✓ On Track' : `${m.target - m.score}pt gap`}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
