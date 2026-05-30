"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  X,
  ChevronLeft,
  Sparkles,
  BarChart3,
  AlertTriangle,
  TrendingUp,
  MapPin,
  Lightbulb,
  Clock,
  Globe2,
  Car,
  Building2,
  Zap,
} from "lucide-react";
import AnalyticsCharts from "./AnalyticsCharts";
import FloodRiskTable from "./FloodRiskTable";
import { AnalyticsData, DashboardMode, FloodRisk } from "@/lib/types";

interface RightPanelProps {
  analytics: AnalyticsData;
  floodRisks: FloodRisk[];
  currentLocation: string;
  dashboardMode: DashboardMode;
  isOpen: boolean;
  onToggle: () => void;
}

type RightTab = "insights" | "analytics" | "risks";

const MODE_INSIGHTS: Record<DashboardMode, { icon: React.ReactNode; title: string; description: string; severity: string; time: string }[]> = {
  flood: [
    { icon: <AlertTriangle size={14} className="text-red-400" />, title: "High Flood Risk Detected", description: "Riverside District shows 92% probability of flooding during monsoon season based on historical patterns.", severity: "critical", time: "2 hours ago" },
    { icon: <TrendingUp size={14} className="text-amber-400" />, title: "Rainfall Anomaly", description: "Current rainfall is 18.3% above the 10-year average. This increases flood risk in low-lying areas.", severity: "warning", time: "5 hours ago" },
    { icon: <MapPin size={14} className="text-blue-400" />, title: "Infrastructure Alert", description: "8 hospitals and 42 schools are located within high-risk flood zones.", severity: "info", time: "1 day ago" },
    { icon: <Lightbulb size={14} className="text-emerald-400" />, title: "Mitigation Opportunity", description: "Installing 12 additional drainage pumps could reduce flood duration by 40%.", severity: "success", time: "1 day ago" },
  ],
  traffic: [
    { icon: <AlertTriangle size={14} className="text-red-400" />, title: "Peak Congestion Alert", description: "NH-48 corridor experiencing 95% congestion during 8AM-10AM peak window.", severity: "critical", time: "30 min ago" },
    { icon: <Car size={14} className="text-amber-400" />, title: "Accident Hotspot Identified", description: "Ring Road junction has recorded 23% more incidents this quarter vs last.", severity: "warning", time: "2 hours ago" },
    { icon: <TrendingUp size={14} className="text-blue-400" />, title: "Transit Ridership Up", description: "Metro ridership increased 12% after new Green Line extension opened.", severity: "info", time: "1 day ago" },
    { icon: <Lightbulb size={14} className="text-emerald-400" />, title: "Signal Optimization", description: "AI-optimized signal timing at 35 intersections could cut commute times by 18%.", severity: "success", time: "1 day ago" },
  ],
  urban: [
    { icon: <Building2 size={14} className="text-red-400" />, title: "Zoning Violation Cluster", description: "14 unauthorized commercial structures detected in residential Zone R2.", severity: "critical", time: "1 hour ago" },
    { icon: <TrendingUp size={14} className="text-amber-400" />, title: "Construction Surge", description: "Active construction permits up 14.2% this quarter, straining infrastructure.", severity: "warning", time: "3 hours ago" },
    { icon: <MapPin size={14} className="text-blue-400" />, title: "Green Space Declining", description: "Urban green cover has decreased by 1.2% year-over-year due to new developments.", severity: "info", time: "1 day ago" },
    { icon: <Lightbulb size={14} className="text-emerald-400" />, title: "Smart Zoning Proposal", description: "Mixed-use rezoning of industrial corridor could add 2,500 housing units.", severity: "success", time: "2 days ago" },
  ],
  utility: [
    { icon: <Zap size={14} className="text-red-400" />, title: "Substation Overload Warning", description: "Zone D substation operating at 94% capacity during peak hours.", severity: "critical", time: "45 min ago" },
    { icon: <AlertTriangle size={14} className="text-amber-400" />, title: "Pipeline Integrity Drop", description: "Water main integrity in East sector dropped to 88%, scheduled for inspection.", severity: "warning", time: "2 hours ago" },
    { icon: <TrendingUp size={14} className="text-blue-400" />, title: "5G Expansion Complete", description: "Telecom coverage expanded to 96% with 12 new cell towers commissioned.", severity: "info", time: "1 day ago" },
    { icon: <Lightbulb size={14} className="text-emerald-400" />, title: "Smart Grid Upgrade", description: "IoT-enabled smart meters could reduce power losses by 8% across the network.", severity: "success", time: "2 days ago" },
  ],
};

const MODE_STATS: Record<DashboardMode, { label: string; value: string }[]> = {
  flood: [{ label: "Total Area", value: "150 km²" }, { label: "Population", value: "3.2M" }, { label: "Water Bodies", value: "23" }, { label: "Hospitals", value: "45" }, { label: "Schools", value: "312" }, { label: "Bridges", value: "28" }],
  traffic: [{ label: "Road Network", value: "1,850 km" }, { label: "Intersections", value: "245" }, { label: "Flyovers", value: "18" }, { label: "Metro Stns", value: "24" }, { label: "Bus Routes", value: "185" }, { label: "Avg Speed", value: "28 km/h" }],
  urban: [{ label: "Total Area", value: "150 km²" }, { label: "Population", value: "3.2M" }, { label: "Zones", value: "42" }, { label: "Active Permits", value: "247" }, { label: "Parks", value: "78" }, { label: "Heritage Sites", value: "15" }],
  utility: [{ label: "Grid Length", value: "2,400 km" }, { label: "Water Mains", value: "850 km" }, { label: "Substations", value: "42" }, { label: "Cell Towers", value: "156" }, { label: "Pump Stns", value: "28" }, { label: "Transformers", value: "380" }],
};

const RISK_TAB_LABELS: Record<DashboardMode, string> = {
  flood: "Risk Zones",
  traffic: "Hotspots",
  urban: "Violations",
  utility: "Outages",
};

export default function RightPanel({
  analytics,
  floodRisks,
  currentLocation,
  dashboardMode,
  isOpen,
  onToggle,
}: RightPanelProps) {
  const [activeTab, setActiveTab] = useState<RightTab>("insights");
  const insights = MODE_INSIGHTS[dashboardMode];
  const stats = MODE_STATS[dashboardMode];

  const tabs: { id: RightTab; label: string; icon: React.ReactNode }[] = [
    { id: "insights", label: "AI Insights", icon: <Sparkles size={14} /> },
    { id: "analytics", label: "Analytics", icon: <BarChart3 size={14} /> },
    { id: "risks", label: RISK_TAB_LABELS[dashboardMode], icon: <AlertTriangle size={14} /> },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "border-red-500/20 bg-red-500/5";
      case "warning": return "border-amber-500/20 bg-amber-500/5";
      case "success": return "border-emerald-500/20 bg-emerald-500/5";
      default: return "border-blue-500/20 bg-blue-500/5";
    }
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={onToggle}
          className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-16 bg-geo-card border border-geo-border border-r-0 rounded-l-lg flex items-center justify-center text-gray-400 hover:text-primary-400 z-20 transition-colors"
        >
          <ChevronLeft size={14} />
        </button>
      )}

      <motion.div
        initial={false}
        animate={{ width: isOpen ? 380 : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="h-full bg-geo-darker/80 backdrop-blur-xl border-l border-geo-border overflow-hidden flex flex-col"
      >
        <div className="p-4 border-b border-geo-border flex items-center justify-between flex-shrink-0">
          <h2 className="text-sm font-semibold text-gray-200">Intelligence Panel</h2>
          <button onClick={onToggle} className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors">
            <X size={14} />
          </button>
        </div>

        <div className="flex border-b border-geo-border flex-shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-all duration-200 border-b-2 ${
                activeTab === tab.id
                  ? "text-primary-400 border-primary-500 bg-primary-500/5"
                  : "text-gray-500 border-transparent hover:text-gray-300"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {activeTab === "insights" && (
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">AI-Generated Insights</h3>
                <span className="text-[10px] text-primary-400">{insights.length} insights</span>
              </div>
              {insights.map((insight, i) => (
                <motion.div
                  key={`${dashboardMode}-${i}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={`glass-card p-4 border cursor-pointer hover:border-primary-500/20 transition-all duration-200 ${getSeverityColor(insight.severity)}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex-shrink-0">{insight.icon}</div>
                    <div className="flex-1">
                      <h4 className="text-xs font-semibold text-gray-200 mb-1">{insight.title}</h4>
                      <p className="text-[11px] text-gray-400 leading-relaxed">{insight.description}</p>
                      <div className="flex items-center gap-1.5 mt-2 text-[10px] text-gray-600">
                        <Clock size={9} />
                        {insight.time}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              <div className="glass-card p-4 space-y-3 mt-4">
                <h4 className="text-xs font-semibold text-gray-300">Quick Stats — {currentLocation}</h4>
                <div className="grid grid-cols-2 gap-3">
                  {stats.map((stat, i) => (
                    <div key={i} className="text-center p-2 rounded-lg bg-geo-dark/50">
                      <p className="text-sm font-bold text-gray-200">{stat.value}</p>
                      <p className="text-[10px] text-gray-500">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="p-4">
              <AnalyticsCharts data={analytics} dashboardMode={dashboardMode} />
            </div>
          )}

          {activeTab === "risks" && (
            <div className="p-4">
              <FloodRiskTable risks={floodRisks} dashboardMode={dashboardMode} />
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}
