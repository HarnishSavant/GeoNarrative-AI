"use client";
import React from "react";
import { motion } from "framer-motion";
import { DashboardMode } from "@/lib/types";
import { getExposureData } from "@/lib/intelligenceData";
import { useInteractionStore } from "@/store/interactionStore";

const SEV_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  critical: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
  high: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
  moderate: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  low: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
};

export default function ExposureTab({ mode, exposureSummary, criticalInfra, shelters }: {
  mode: DashboardMode; exposureSummary: any[]; criticalInfra: any[]; shelters: any[];
}) {
  const selectFeature = useInteractionStore(s => s.selectFeature);
  const items = getExposureData(mode, exposureSummary, criticalInfra);

  return (
    <div className="space-y-4">
      {/* Exposure Cards */}
      <div className="space-y-2">
        {items.map((item, i) => {
          const sev = SEV_STYLES[item.severity] || SEV_STYLES.moderate;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className={`${sev.bg} border ${sev.border} rounded-xl p-3 hover:scale-[1.01] transition-transform`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">{item.category}</span>
                <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${sev.bg} ${sev.text} border ${sev.border}`}>{item.severity}</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className={`text-xl font-black ${sev.text}`}>{item.value.toLocaleString()}</span>
                <span className="text-[10px] text-gray-500">{item.unit}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Critical Infrastructure List */}
      {(mode === 'hydrology' || mode === 'infrastructure') && criticalInfra.length > 0 && (
        <div className="bg-black/30 rounded-xl border border-white/5 p-4">
          <h4 className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-3">High Priority Facilities</h4>
          <div className="space-y-1.5 max-h-[180px] overflow-y-auto custom-scrollbar pr-1">
            {criticalInfra.slice(0, 8).map((infra, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-black/20 border border-white/5 cursor-pointer hover:bg-white/5 hover:border-primary-500/30 transition-all"
                onClick={() => selectFeature({ id: infra.id, source: 'pois' }, infra)}>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-medium text-gray-200 truncate block">{infra.name}</span>
                  <span className="text-[9px] text-gray-500 uppercase">{infra.type || infra.facility_type}</span>
                </div>
                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ml-2 ${infra.risk_class === 'Very High' ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'}`}>
                  {infra.risk_class}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Safe Zones */}
      {(mode === 'population' || mode === 'hydrology') && shelters.length > 0 && (
        <div className="bg-black/30 rounded-xl border border-emerald-500/10 p-4">
          <h4 className="text-[10px] text-emerald-400 uppercase tracking-wider font-semibold mb-3">Safe Assembly Zones</h4>
          <div className="space-y-1.5 max-h-[140px] overflow-y-auto custom-scrollbar pr-1">
            {shelters.slice(0, 6).map((s, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10 cursor-pointer hover:bg-emerald-500/10 transition-all"
                onClick={() => selectFeature({ id: s.id, source: 'pois' }, s)}>
                <span className="text-[10px] text-gray-300 truncate">{s.name}</span>
                <span className="text-[8px] text-emerald-400 font-bold uppercase shrink-0 ml-2">Safe</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
