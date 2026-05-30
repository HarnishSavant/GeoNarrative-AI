"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Droplets,
  Users,
  Building2,
  CloudRain,
  Mountain,
  Waves,
} from "lucide-react";
import { KPIData } from "@/lib/types";

interface KPICardProps {
  data: KPIData;
  index: number;
}

const iconMap: Record<string, React.ReactNode> = {
  droplets: <Droplets size={22} />,
  users: <Users size={22} />,
  building: <Building2 size={22} />,
  "cloud-rain": <CloudRain size={22} />,
  mountain: <Mountain size={22} />,
  waves: <Waves size={22} />,
};

export default function KPICard({ data, index }: KPICardProps) {
  const isPositive = data.change > 0;
  const isNeutral = data.change === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="kpi-card group cursor-pointer p-4 pb-3 flex flex-col justify-between h-full"
      style={{
        "--kpi-color-start": data.gradient[0],
        "--kpi-color-end": data.gradient[1],
      } as React.CSSProperties}
    >
      {/* Background Glow */}
      <div
        className="absolute -top-10 -right-10 w-20 h-20 rounded-full opacity-5 group-hover:opacity-15 transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle, ${data.gradient[0]}, transparent)`,
        }}
      />

      <div className="relative flex flex-col justify-between flex-grow">
        {/* Header Row: Title & Compact Icon */}
        <div className="flex items-start justify-between gap-1">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide truncate flex-1">
            {data.title}
          </p>
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: `linear-gradient(135deg, ${data.gradient[0]}20, ${data.gradient[1]}20)`,
              color: data.gradient[0],
            }}
          >
            {React.cloneElement(
              (iconMap[data.icon] || <Droplets size={22} />) as React.ReactElement,
              { size: 14 }
            )}
          </div>
        </div>

        {/* Value */}
        <div className="mt-1">
          <h3 className="text-xl md:text-2xl font-black text-gray-100 leading-none">
            {data.value}
          </h3>
        </div>

        {/* Trend Indicator */}
        <div className="flex items-center gap-1 mt-2 flex-wrap">
          {isNeutral ? (
            <Minus size={10} className="text-gray-500" />
          ) : isPositive ? (
            <TrendingUp size={10} className="text-emerald-400" />
          ) : (
            <TrendingDown size={10} className="text-red-400" />
          )}
          <span
            className={`text-[10px] font-bold ${
              isNeutral
                ? "text-gray-500"
                : isPositive
                ? data.id === "flood-risk" || data.id === "rainfall"
                  ? "text-red-400"
                  : "text-emerald-400"
                : data.id === "flood-risk"
                ? "text-emerald-400"
                : "text-red-400"
            }`}
          >
            {!isNeutral && isPositive ? "+" : ""}
            {data.change}%
          </span>
          <span className="text-[9px] text-gray-500 font-medium truncate flex-1">
            {data.changeLabel}
          </span>
        </div>
      </div>

      {/* Mini sparkline */}
      <div className="mt-3 h-5 flex items-end gap-0.5 w-full flex-shrink-0">
        {Array.from({ length: 12 }).map((_, i) => {
          const height = 20 + Math.random() * 80;
          return (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${height}%` }}
              transition={{ duration: 0.5, delay: index * 0.08 + i * 0.02 }}
              className="flex-1 rounded-sm"
              style={{
                background: `linear-gradient(to top, ${data.gradient[0]}30, ${data.gradient[1]}60)`,
              }}
            />
          );
        })}
      </div>
    </motion.div>
  );
}
