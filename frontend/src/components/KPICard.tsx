"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp, TrendingDown, Minus,
  Droplets, Users, Building2, CloudRain, Mountain, Waves,
  Map, ArrowDown, ArrowRight, BarChart3, HeartPulse, AlertTriangle,
  Shield, Leaf, Sun, Tent, Zap, MapPin, Activity,
} from "lucide-react";
import { KPIData } from "@/lib/types";

interface KPICardProps {
  data: KPIData;
  index: number;
  isSimulated?: boolean;
}

const iconMap: Record<string, React.ReactNode> = {
  droplets: <Droplets size={13} />,
  users: <Users size={13} />,
  building: <Building2 size={13} />,
  "cloud-rain": <CloudRain size={13} />,
  mountain: <Mountain size={13} />,
  waves: <Waves size={13} />,
  map: <Map size={13} />,
  "map-pin": <MapPin size={13} />,
  "arrow-down": <ArrowDown size={13} />,
  "arrow-right": <ArrowRight size={13} />,
  "bar-chart": <BarChart3 size={13} />,
  "heart-pulse": <HeartPulse size={13} />,
  "alert-triangle": <AlertTriangle size={13} />,
  shield: <Shield size={13} />,
  leaf: <Leaf size={13} />,
  sun: <Sun size={13} />,
  tent: <Tent size={13} />,
  zap: <Zap size={13} />,
  triangle: <Mountain size={13} />,
  activity: <Activity size={13} />,
};

// Deterministic sparkline — seeded from KPI id hash to avoid rerenders
function generateSparkline(id: string, count: number): number[] {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  const bars: number[] = [];
  for (let i = 0; i < count; i++) {
    hash = ((hash * 1103515245 + 12345) & 0x7fffffff);
    bars.push(20 + (hash % 80));
  }
  return bars;
}

const KPICard = React.memo(function KPICard({ data, index, isSimulated = false }: KPICardProps) {
  const isPositive = data.change > 0;
  const isNeutral = data.change === 0;

  // Memoize sparkline so it doesn't change on rerender
  const sparkline = useMemo(() => generateSparkline(data.id, 12), [data.id]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      className="relative overflow-hidden rounded-lg border border-white/8 backdrop-blur-xl cursor-pointer group transition-all duration-300 hover:border-white/15"
      style={{
        background: 'linear-gradient(135deg, rgba(15,23,42,0.88), rgba(8,10,20,0.92))',
      }}
    >
      {/* Top accent line */}
      <div className="absolute top-0 left-0 w-full h-[2px]"
        style={{ background: `linear-gradient(90deg, ${data.gradient[0]}, ${data.gradient[1]})` }} />

      <div className="px-2.5 py-2 relative flex items-center gap-2">
        {/* Icon */}
        <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${data.gradient[0]}15, ${data.gradient[1]}15)`, color: data.gradient[0] }}>
          {iconMap[data.icon] ?? <Droplets size={13} />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-[8px] font-bold text-gray-500 uppercase tracking-[0.08em] truncate leading-none">
            {data.title}
            {isSimulated && (
              <span className="text-[7px] text-blue-400/70 tracking-wider uppercase ml-1">SIM</span>
            )}
          </p>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-sm font-black text-gray-100 leading-none tracking-tight">{data.value}</span>
            <div className="flex items-center gap-0.5">
              {isNeutral ? (
                <Minus size={8} className="text-gray-600" />
              ) : isPositive ? (
                <TrendingUp size={8} className="text-emerald-400" />
              ) : (
                <TrendingDown size={8} className="text-red-400" />
              )}
              <span className={`text-[8px] font-bold ${
                isNeutral ? "text-gray-600"
                  : isPositive
                    ? (data.id === "flood-risk" || data.id === "rainfall" ? "text-red-400" : "text-emerald-400")
                    : (data.id === "flood-risk" ? "text-emerald-400" : "text-red-400")
              }`}>
                {!isNeutral && isPositive ? "+" : ""}{data.change}%
              </span>
            </div>
          </div>
          <span className="text-[7px] text-gray-600 font-medium truncate block mt-0.5">{data.changeLabel}</span>
        </div>

        {/* Sparkline — compact vertical */}
        <div className="flex items-end gap-[1.5px] h-6 flex-shrink-0">
          {sparkline.map((height, i) => (
            <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${height}%` }}
              transition={{ duration: 0.3, delay: index * 0.04 + i * 0.01 }}
              className="w-[3px] rounded-sm"
              style={{ background: `linear-gradient(to top, ${data.gradient[0]}25, ${data.gradient[1]}60)` }} />
          ))}
        </div>
      </div>
    </motion.div>
  );
});

export default KPICard;
