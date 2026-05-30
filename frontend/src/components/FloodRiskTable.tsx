"use client";

import React from "react";
import { motion } from "framer-motion";
import { AlertTriangle, MapPin, Users, ChevronRight, Car, Building2, Zap } from "lucide-react";
import { DashboardMode, FloodRisk } from "@/lib/types";

interface FloodRiskTableProps {
  risks: FloodRisk[];
  dashboardMode?: DashboardMode;
}

const MODE_TITLES: Record<DashboardMode, { icon: React.ReactNode; title: string }> = {
  flood: { icon: <AlertTriangle size={14} className="text-amber-400" />, title: "Flood Risk Zones" },
  traffic: { icon: <Car size={14} className="text-amber-400" />, title: "Traffic Hotspots" },
  urban: { icon: <Building2 size={14} className="text-violet-400" />, title: "Development Zones" },
  utility: { icon: <Zap size={14} className="text-emerald-400" />, title: "Infrastructure Sectors" },
};

export default function FloodRiskTable({ risks, dashboardMode = "flood" }: FloodRiskTableProps) {
  const modeTitle = MODE_TITLES[dashboardMode];
  const getRiskBadgeClass = (level: string) => {
    switch (level) {
      case "critical":
        return "bg-red-600/20 text-red-400 border-red-500/30";
      case "high":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "medium":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "low":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getRiskBarWidth = (score: number) => `${(score / 10) * 100}%`;
  const getRiskBarColor = (level: string) => {
    switch (level) {
      case "critical":
        return "bg-gradient-to-r from-red-600 to-red-400";
      case "high":
        return "bg-gradient-to-r from-orange-600 to-orange-400";
      case "medium":
        return "bg-gradient-to-r from-amber-600 to-amber-400";
      case "low":
        return "bg-gradient-to-r from-emerald-600 to-emerald-400";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
          {modeTitle.icon}
          {modeTitle.title}
        </h3>
        <span className="text-xs text-gray-500">{risks.length} zones</span>
      </div>

      <div className="space-y-2">
        {risks.map((risk, i) => (
          <motion.div
            key={risk.zone}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-4 hover:border-primary-500/20 transition-all duration-200 cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-medium text-gray-200">{risk.zone}</h4>
                  <span
                    className={`risk-badge px-2 py-0.5 text-[10px] border ${getRiskBadgeClass(
                      risk.level
                    )}`}
                  >
                    {risk.level}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed">{risk.description}</p>
              </div>
              <ChevronRight
                size={16}
                className="text-gray-600 group-hover:text-primary-400 transition-colors flex-shrink-0 mt-1"
              />
            </div>

            {/* Risk score bar */}
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-gray-500">Risk Score</span>
                <span className="font-semibold text-gray-200">{risk.score}/10</span>
              </div>
              <div className="h-1.5 bg-geo-dark rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: getRiskBarWidth(risk.score) }}
                  transition={{ duration: 1, delay: i * 0.1 + 0.3 }}
                  className={`h-full rounded-full ${getRiskBarColor(risk.level)}`}
                />
              </div>
            </div>

            {/* Meta info */}
            <div className="flex items-center gap-4 mt-3 text-[11px] text-gray-500">
              <span className="flex items-center gap-1">
                <MapPin size={10} /> {risk.area} km²
              </span>
              <span className="flex items-center gap-1">
                <Users size={10} /> {risk.population.toLocaleString()} people
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
