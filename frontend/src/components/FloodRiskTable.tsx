"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, MapPin, Users, ChevronRight, Search, SlidersHorizontal, Car, Building2, Zap } from "lucide-react";
import { DashboardMode, FloodRisk } from "@/lib/types";

interface FloodRiskTableProps {
  risks: FloodRisk[];
  dashboardMode?: DashboardMode;
}

const MODE_TITLES: Record<DashboardMode, { icon: React.ReactNode; title: string; placeholder: string }> = {
  flood: { icon: <AlertTriangle size={14} className="text-red-400" />, title: "Flood Risk Zones", placeholder: "Search flood zones..." },
  traffic: { icon: <Car size={14} className="text-amber-400" />, title: "Traffic Hotspots", placeholder: "Search congestion zones..." },
  urban: { icon: <Building2 size={14} className="text-violet-400" />, title: "Development Zones", placeholder: "Search zoning segments..." },
  utility: { icon: <Zap size={14} className="text-emerald-400" />, title: "Infrastructure Sectors", placeholder: "Search utility grids..." },
};

export default function FloodRiskTable({ risks, dashboardMode = "flood" }: FloodRiskTableProps) {
  const modeTitle = MODE_TITLES[dashboardMode];
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

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

  // DRILL-DOWN FILTERING LOGIC
  const filteredRisks = useMemo(() => {
    return risks.filter((r) => {
      const matchesLevel = filterLevel === "all" || r.level.toLowerCase() === filterLevel;
      const matchesSearch = r.zone.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            r.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesLevel && matchesSearch;
    });
  }, [risks, filterLevel, searchQuery]);

  // MAP INTERACTION DISPATCH
  const handleZoneClick = (risk: FloodRisk) => {
    const event = new CustomEvent("map-fly-to-zone", {
      detail: { zoneName: risk.zone, level: risk.level }
    });
    window.dispatchEvent(event);
  };

  return (
    <div className="space-y-4">
      {/* Title & Count */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
          {modeTitle.icon}
          {modeTitle.title}
        </h3>
        <span className="text-xs text-gray-500 font-mono">{filteredRisks.length} shown</span>
      </div>

      {/* Sleek Search & Drill-Down Box */}
      <div className="space-y-2">
        <div className="relative">
          <input
            type="text"
            placeholder={modeTitle.placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 bg-geo-dark/50 border border-geo-border rounded-xl pl-9 pr-4 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary-500/50 transition-all"
          />
          <Search size={12} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
        </div>

        {/* Level Filters Drill-Down */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 custom-scrollbar scrollbar-none">
          {["all", "critical", "high", "medium", "low"].map((level) => (
            <button
              key={level}
              onClick={() => setFilterLevel(level)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border capitalize transition-all shrink-0 ${
                filterLevel === level
                  ? "bg-primary-500/10 text-primary-400 border-primary-500/35"
                  : "bg-geo-card/30 text-gray-500 border-geo-border hover:border-gray-500 hover:text-gray-300"
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic List */}
      <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1 custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {filteredRisks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-8 bg-geo-card/20 border border-geo-border border-dashed rounded-xl"
            >
              <SlidersHorizontal size={20} className="text-gray-600 mx-auto mb-2" />
              <p className="text-xs text-gray-500">No matching zones found</p>
            </motion.div>
          ) : (
            filteredRisks.map((risk, i) => (
              <motion.div
                key={risk.zone}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                onClick={() => handleZoneClick(risk)}
                className="glass-card p-4 hover:border-primary-500/35 transition-all duration-300 cursor-pointer group hover:shadow-lg hover:shadow-primary-950/20"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-xs font-semibold text-gray-200 group-hover:text-primary-400 transition-colors">{risk.zone}</h4>
                      <span
                        className={`risk-badge px-2 py-0.5 text-[9px] border font-bold tracking-wider ${getRiskBadgeClass(
                          risk.level
                        )}`}
                      >
                        {risk.level}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 leading-relaxed mt-1 font-medium">{risk.description}</p>
                  </div>
                  <ChevronRight
                    size={14}
                    className="text-gray-600 group-hover:text-primary-400 transition-colors flex-shrink-0 mt-0.5 ml-1"
                  />
                </div>

                {/* Risk score bar */}
                <div className="mt-3 space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-gray-500 font-medium">Risk Score</span>
                    <span className="font-bold text-gray-200">{risk.score}/10</span>
                  </div>
                  <div className="h-1 bg-geo-dark rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: getRiskBarWidth(risk.score) }}
                      transition={{ duration: 0.8 }}
                      className={`h-full rounded-full ${getRiskBarColor(risk.level)}`}
                    />
                  </div>
                </div>

                {/* Meta info */}
                <div className="flex items-center gap-4 mt-3 text-[10px] text-gray-500 font-mono">
                  <span className="flex items-center gap-1">
                    <MapPin size={9} /> {risk.area} km²
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={9} /> {risk.population.toLocaleString()} people
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
