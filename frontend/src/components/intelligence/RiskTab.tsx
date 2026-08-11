"use client";
import React from "react";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { DashboardMode } from "@/lib/types";
import { getRiskChartData } from "@/lib/intelligenceData";
import { useInteractionStore } from "@/store/interactionStore";

const Tip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0f172a]/95 border border-white/10 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-[10px] font-semibold text-gray-200 mb-1">{label}</p>
      {payload.map((e: any, i: number) => (
        <p key={i} className="text-[10px]" style={{ color: e.color || e.fill }}>{e.name}: <span className="font-bold">{e.value.toLocaleString()}</span></p>
      ))}
    </div>
  );
};

export default function RiskTab({ mode, riskSummary }: { mode: DashboardMode; riskSummary: any[] }) {
  const filters = useInteractionStore(s => s.filters);
  const setFilter = useInteractionStore(s => s.setFilter);
  const chart = getRiskChartData(mode, riskSummary);
  const total = chart.data.reduce((a, c) => a + c.value, 0);

  const handleClick = (name: string) => {
    if (filters.riskClass?.includes(name)) setFilter('riskClass', []);
    else setFilter('riskClass', [name]);
  };

  // Mode-specific secondary data
  const secondaryData: Record<DashboardMode, { title: string; items: { label: string; value: string; color: string }[] }> = {
    terrain: { title: 'Slope Analysis', items: [
      { label: 'Flat (0-5°)', value: '50%', color: '#10b981' },
      { label: 'Gentle (5-15°)', value: '30%', color: '#f59e0b' },
      { label: 'Steep (15-30°)', value: '15%', color: '#f97316' },
      { label: 'Extreme (>30°)', value: '5%', color: '#ef4444' },
    ]},
    hydrology: { title: 'Drainage Capacity', items: [
      { label: 'Adequate', value: '42%', color: '#10b981' },
      { label: 'Marginal', value: '31%', color: '#f59e0b' },
      { label: 'Insufficient', value: '18%', color: '#f97316' },
      { label: 'Critical', value: '9%', color: '#ef4444' },
    ]},
    infrastructure: { title: 'Structural Condition', items: [
      { label: 'Good', value: '55%', color: '#10b981' },
      { label: 'Fair', value: '28%', color: '#f59e0b' },
      { label: 'Poor', value: '12%', color: '#f97316' },
      { label: 'Unsafe', value: '5%', color: '#ef4444' },
    ]},
    population: { title: 'Vulnerability Index', items: [
      { label: 'Low', value: '35%', color: '#10b981' },
      { label: 'Medium', value: '33%', color: '#f59e0b' },
      { label: 'High', value: '22%', color: '#f97316' },
      { label: 'Critical', value: '10%', color: '#ef4444' },
    ]},
    environment: { title: 'NDVI Classification', items: [
      { label: 'Dense (>0.6)', value: '15%', color: '#10b981' },
      { label: 'Moderate (0.3-0.6)', value: '35%', color: '#22c55e' },
      { label: 'Sparse (0.1-0.3)', value: '30%', color: '#f59e0b' },
      { label: 'Barren (<0.1)', value: '20%', color: '#ef4444' },
    ]},
  };
  const secondary = secondaryData[mode];

  return (
    <div className="space-y-4">
      <div className="bg-black/30 rounded-xl border border-white/5 p-4">
        <h4 className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-3">{chart.title}</h4>
        {chart.type === 'pie' && chart.data.length > 0 ? (
          <div className="flex items-center">
            <div className="w-1/2 h-36">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chart.data} cx="50%" cy="50%" innerRadius={30} outerRadius={55} paddingAngle={2} dataKey="value" strokeWidth={0}>
                    {chart.data.map((e, i) => (
                      <Cell key={i} fill={e.color} opacity={(!filters.riskClass?.length || filters.riskClass.includes(e.name)) ? 1 : 0.25}
                        onClick={() => handleClick(e.name)} className="cursor-pointer" />
                    ))}
                  </Pie>
                  <Tooltip content={<Tip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 space-y-2">
              {chart.data.map((item, i) => (
                <div key={i} className={`flex items-center gap-2 text-[10px] cursor-pointer p-1 rounded transition-colors ${filters.riskClass?.includes(item.name) ? 'bg-white/10' : 'hover:bg-white/5'}`}
                  onClick={() => handleClick(item.name)}>
                  <div className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-gray-400 flex-1 truncate">{item.name}</span>
                  <span className="font-bold text-gray-200">{total > 0 ? Math.round((item.value / total) * 100) : 0}%</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart.data} margin={{ left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8' }} angle={-30} textAnchor="end" />
                <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} />
                <Tooltip content={<Tip />} />
                <Bar dataKey="value" name="Count" radius={[3, 3, 0, 0]}>
                  {chart.data.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Secondary Analysis */}
      <div className="bg-black/30 rounded-xl border border-white/5 p-4">
        <h4 className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-3">{secondary.title}</h4>
        <div className="space-y-2.5">
          {secondary.items.map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-gray-400">{item.label}</span>
                <span className="text-[10px] font-bold text-gray-200">{item.value}</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div className="h-full rounded-full" style={{ backgroundColor: item.color }}
                  initial={{ width: 0 }} animate={{ width: item.value }} transition={{ duration: 0.8, delay: i * 0.1 }} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
