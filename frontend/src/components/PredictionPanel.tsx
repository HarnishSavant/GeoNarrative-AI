"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  BrainCircuit,
  Play,
  Loader2,
  AlertTriangle,
  TrendingUp,
  Droplets,
  Mountain,
  TreePine,
  Users,
  Waves,
  CheckCircle2,
  Car,
  Clock,
  Navigation,
  Building2,
  Globe2,
  Zap,
} from "lucide-react";

import { DashboardMode } from "@/lib/types";
import { usePrediction } from "@/hooks/usePrediction";

interface PredictionPanelProps {
  currentLocation: string;
  dashboardMode?: DashboardMode;
}

interface PredictionResult {
  overallRisk: "low" | "medium" | "high" | "critical";
  score: number;
  factors: { name: string; value: number; weight: number; impact: string }[];
  recommendations: string[];
}

export default function PredictionPanel({ currentLocation, dashboardMode = "flood" }: PredictionPanelProps) {
  const {
    isRunning,
    result,
    parameters,
    handleParamChange,
    runPrediction: executePrediction,
    clearPrediction
  } = usePrediction(dashboardMode);

  const runPrediction = () => {
    executePrediction(dashboardMode);
  };


  const modeConfig: Record<
    DashboardMode,
    {
      title: string;
      subtitle: string;
      steps: string[];
      factors: { name: string; value: number; weight: number; impact: string }[];
      recs: string[];
      inputs: { id: string; label: string; type: "number" | "select"; options?: string[]; icon: React.ReactNode; suffix?: string }[];
    }
  > = {
    flood: {
      title: "Flood Risk Prediction",
      subtitle: "ML-based flood risk prediction using multi-factor analysis",
      steps: ["Loading spatial data...", "Analyzing terrain...", "Running XGBoost model...", "Computing risk zones..."],
      factors: [
        { name: "Rainfall Intensity", value: 85, weight: 0.3, impact: "High" },
        { name: "Elevation Profile", value: 42, weight: 0.25, impact: "Medium" },
        { name: "Land Use Pattern", value: 78, weight: 0.2, impact: "High" },
        { name: "Drainage Capacity", value: 35, weight: 0.15, impact: "Critical" },
        { name: "Soil Saturation", value: 62, weight: 0.1, impact: "Medium" },
      ],
      recs: ["Deploy flood barriers in sectors A2 and B4", "Activate emergency drainage pumps", "Alert 32,000 residents in high-risk zones", "Pre-position emergency response teams", "Coordinate with upstream dam management"],
      inputs: [
        { id: "rainfall", label: "Rainfall (mm)", type: "number", icon: <Droplets size={10} />, suffix: "mm" },
        { id: "elevation", label: "Elevation (m)", type: "number", icon: <Mountain size={10} />, suffix: "m" },
        { id: "landUse", label: "Land Use", type: "select", options: ["urban", "suburban", "rural", "forest"], icon: <TreePine size={10} /> },
        { id: "populationDensity", label: "Pop. Density", type: "number", icon: <Users size={10} />, suffix: "/km²" },
        { id: "waterBodies", label: "Water Bodies", type: "number", icon: <Waves size={10} /> },
        { id: "drainageCapacity", label: "Drainage %", type: "number", icon: <TrendingUp size={10} />, suffix: "%" },
      ],
    },
    traffic: {
      title: "Traffic Congestion Prediction",
      subtitle: "AI model for congestion forecasting and flow optimization",
      steps: ["Loading GPS traces...", "Analyzing traffic patterns...", "Running LSTM model...", "Computing bottlenecks..."],
      factors: [
        { name: "Peak Hour Volume", value: 92, weight: 0.3, impact: "Critical" },
        { name: "Road Capacity Ratio", value: 78, weight: 0.25, impact: "High" },
        { name: "Signal Timing", value: 55, weight: 0.2, impact: "Medium" },
        { name: "Construction Zones", value: 68, weight: 0.15, impact: "High" },
        { name: "Weather Impact", value: 42, weight: 0.1, impact: "Medium" },
      ],
      recs: ["Implement adaptive signal control at Ring Road junction", "Divert 15% traffic to alternate NH-48 bypass", "Deploy traffic marshals at 5 critical intersections", "Enable dynamic speed limits during peak hours", "Increase metro feeder bus frequency by 30%"],
      inputs: [
        { id: "peakVolume", label: "Peak Vol. (vph)", type: "number", icon: <Car size={10} />, suffix: "vph" },
        { id: "capacityRatio", label: "Capacity Ratio", type: "number", icon: <TrendingUp size={10} /> },
        { id: "signalTiming", label: "Signal Cycle (s)", type: "number", icon: <Clock size={10} />, suffix: "s" },
        { id: "construction", label: "Work Zones", type: "number", icon: <Building2 size={10} /> },
        { id: "transitFrequency", label: "Transit Headway", type: "number", icon: <Navigation size={10} />, suffix: "min" },
        { id: "weatherImpact", label: "Weather Impact", type: "number", icon: <Droplets size={10} />, suffix: "%" },
      ],
    },
    urban: {
      title: "Urban Growth Prediction",
      subtitle: "Spatial growth modeling for planning and zoning compliance",
      steps: ["Loading land records...", "Analyzing zoning data...", "Running growth model...", "Projecting expansion..."],
      factors: [
        { name: "Population Growth Rate", value: 75, weight: 0.3, impact: "High" },
        { name: "Land Availability", value: 38, weight: 0.25, impact: "Critical" },
        { name: "Infrastructure Capacity", value: 62, weight: 0.2, impact: "Medium" },
        { name: "Zoning Compliance", value: 88, weight: 0.15, impact: "Medium" },
        { name: "Green Space Ratio", value: 22, weight: 0.1, impact: "High" },
      ],
      recs: ["Prioritize vertical development in Zone C3 to preserve green cover", "Mandate 15% open space in all new commercial permits", "Fast-track affordable housing in North expansion corridor", "Implement Transfer of Development Rights (TDR) policy", "Create buffer zones around heritage conservation areas"],
      inputs: [
        { id: "popGrowth", label: "Growth Rate %", type: "number", icon: <Users size={10} />, suffix: "%" },
        { id: "landAvail", label: "Land Available %", type: "number", icon: <Globe2 size={10} />, suffix: "%" },
        { id: "infraCapacity", label: "Infra Capacity %", type: "number", icon: <Building2 size={10} />, suffix: "%" },
        { id: "zoningCompliance", label: "Zoning Compl. %", type: "number", icon: <CheckCircle2 size={10} />, suffix: "%" },
        { id: "greenSpace", label: "Green Space %", type: "number", icon: <TreePine size={10} />, suffix: "%" },
        { id: "activePermits", label: "Permits Queue", type: "number", icon: <TrendingUp size={10} /> },
      ],
    },
    utility: {
      title: "Grid Reliability Prediction",
      subtitle: "Predictive maintenance for power, water, and telecom networks",
      steps: ["Loading sensor telemetry...", "Analyzing load patterns...", "Running failure model...", "Computing risk nodes..."],
      factors: [
        { name: "Equipment Age Factor", value: 72, weight: 0.3, impact: "High" },
        { name: "Load Stress Index", value: 88, weight: 0.25, impact: "Critical" },
        { name: "Maintenance Backlog", value: 65, weight: 0.2, impact: "High" },
        { name: "Weather Vulnerability", value: 45, weight: 0.15, impact: "Medium" },
        { name: "Redundancy Coverage", value: 58, weight: 0.1, impact: "Medium" },
      ],
      recs: ["Schedule preventive maintenance for Zone D substation transformer", "Install backup generators at 3 critical water pump stations", "Replace aging underground cables in East sector (15+ years old)", "Deploy IoT vibration sensors on all high-load transformers", "Establish dual-feed redundancy for hospitals and data centers"],
      inputs: [
        { id: "equipAge", label: "Equipment Age", type: "number", icon: <Clock size={10} />, suffix: "yrs" },
        { id: "loadStress", label: "Peak Grid Load", type: "number", icon: <Zap size={10} />, suffix: "%" },
        { id: "maintBacklog", label: "Maint. Backlog", type: "number", icon: <AlertTriangle size={10} />, suffix: "days" },
        { id: "vulnerability", label: "Storm Vulner. %", type: "number", icon: <Droplets size={10} />, suffix: "%" },
        { id: "redundancy", label: "Redundancy %", type: "number", icon: <Waves size={10} />, suffix: "%" },
        { id: "substationCapacity", label: "Substation cap.", type: "number", icon: <Zap size={10} />, suffix: "MW" },
      ],
    },
  };
  const cfg = modeConfig[dashboardMode];


  const getRiskColor = (level: string) => {
    switch (level) {
      case "critical": return "#dc2626";
      case "high": return "#ef4444";
      case "medium": return "#f59e0b";
      case "low": return "#10b981";
      default: return "#6b7280";
    }
  };

  return (
    <div className="p-4 space-y-4 h-full overflow-y-auto custom-scrollbar">
      <div className="flex items-center gap-2">
        <BrainCircuit size={18} className="text-primary-400" />
        <h3 className="text-sm font-semibold text-gray-200">GeoAI Prediction Engine</h3>
      </div>
      <p className="text-xs text-gray-500">
        {cfg.subtitle}
      </p>

      {/* Parameters */}
      <div className="glass-card p-4 space-y-3">
        <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Input Parameters</h4>
        
        <div className="grid grid-cols-2 gap-3">
          {cfg.inputs.map((input) => (
            <div key={input.id} className="space-y-1">
              <label className="text-[11px] text-gray-500 flex items-center gap-1">
                {input.icon} {input.label}
              </label>
              {input.type === "select" ? (
                <select
                  value={parameters[input.id]}
                  onChange={(e) => handleParamChange(input.id, e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-geo-dark border border-geo-border text-xs text-gray-200 outline-none focus:border-primary-500"
                >
                  {input.options?.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt.charAt(0).toUpperCase() + opt.slice(1)}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="number"
                  value={parameters[input.id]}
                  onChange={(e) => handleParamChange(input.id, +e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-geo-dark border border-geo-border text-xs text-gray-200 outline-none focus:border-primary-500"
                />
              )}
            </div>
          ))}
        </div>

        <button
          onClick={runPrediction}
          disabled={isRunning}
          className="w-full btn-primary justify-center mt-2"
        >
          {isRunning ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Running ML Model...
            </>
          ) : (
            <>
              <Play size={16} />
              Run Prediction
            </>
          )}
        </button>
      </div>

      {/* Processing Animation */}
      {isRunning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card p-4 space-y-3"
        >
          <div className="flex items-center gap-2">
            <Loader2 size={14} className="text-primary-400 animate-spin" />
            <span className="text-xs text-primary-300 font-medium">Processing...</span>
          </div>
          <div className="space-y-2">
            {cfg.steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.7 }}
                className="flex items-center gap-2 text-xs text-gray-500"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.7 + 0.5 }}
                >
                  <CheckCircle2 size={12} className="text-emerald-500" />
                </motion.div>
                {step}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Results */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          {/* Overall Score */}
          <div className="glass-card p-4 text-center" style={{ borderColor: `${getRiskColor(result.overallRisk)}30` }}>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Predicted Risk Level</p>
            <div className="flex items-center justify-center gap-3">
              <div
                className="text-4xl font-bold"
                style={{ color: getRiskColor(result.overallRisk) }}
              >
                {result.score}
              </div>
              <div>
                <span
                  className="risk-badge text-xs border"
                  style={{
                    backgroundColor: `${getRiskColor(result.overallRisk)}20`,
                    color: getRiskColor(result.overallRisk),
                    borderColor: `${getRiskColor(result.overallRisk)}30`,
                  }}
                >
                  {result.overallRisk.toUpperCase()}
                </span>
                <p className="text-[10px] text-gray-500 mt-1">out of 10.0</p>
              </div>
            </div>
          </div>

          {/* Factor Analysis */}
          <div className="glass-card p-4 space-y-3">
            <h4 className="text-xs font-semibold text-gray-300">Contributing Factors</h4>
            {result.factors.map((factor, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-400">{factor.name}</span>
                  <span className={`font-semibold ${
                    factor.impact === "Critical" ? "text-red-400" :
                    factor.impact === "High" ? "text-orange-400" : "text-amber-400"
                  }`}>{factor.impact}</span>
                </div>
                <div className="h-1.5 bg-geo-dark rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${factor.value}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                    className="h-full rounded-full bg-gradient-to-r from-primary-600 to-cyan-500"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Recommendations */}
          <div className="glass-card p-4 space-y-2">
            <h4 className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
              <AlertTriangle size={12} className="text-amber-400" />
              AI Recommendations
            </h4>
            {result.recommendations.map((rec, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-2 text-xs text-gray-400"
              >
                <span className="text-primary-400 font-mono text-[10px] mt-0.5">{i + 1}.</span>
                {rec}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
