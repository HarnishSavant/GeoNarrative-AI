"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Sliders,
  Scale,
  Activity,
  MapPin,
  Sparkles,
  Map,
  BookOpen,
  ArrowRight
} from "lucide-react";

import { DashboardMode } from "@/lib/types";
import { usePrediction } from "@/hooks/usePrediction";

interface PredictionPanelProps {
  currentLocation: string;
  dashboardMode?: DashboardMode;
}

type TabState = "factors" | "metrics" | "features";

export default function PredictionPanel({ currentLocation, dashboardMode = "flood" }: PredictionPanelProps) {
  const [activeDomain, setActiveDomain] = useState<DashboardMode>(dashboardMode);

  // Sync with parent updates
  React.useEffect(() => {
    setActiveDomain(dashboardMode);
  }, [dashboardMode]);

  const {
    isRunning,
    result,
    parameters,
    handleParamChange,
    runPrediction: executePrediction,
    clearPrediction
  } = usePrediction(activeDomain);

  // Tab state for individual ML prediction tabs
  const [activeTab, setActiveTab] = useState<TabState>("factors");
  
  // Navigation mode: "ensemble" vs "framework" (unified multi-domain risk)
  const [viewMode, setViewMode] = useState<"ensemble" | "framework">("framework");

  // Multi-Domain Framework states
  const [frameworkData, setFrameworkData] = useState<any>(null);
  const [isLoadingFramework, setIsLoadingFramework] = useState(false);
  const [frameworkError, setFrameworkError] = useState<string | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<string | null>("flood");

  const runPrediction = () => {
    executePrediction(activeDomain);
  };

  const fetchFramework = async () => {
    setIsLoadingFramework(true);
    setFrameworkError(null);
    try {
      const { apiService } = await import("@/services/apiService");
      const data = await apiService.getUrbanRiskFramework(currentLocation || "Pune, Maharashtra");
      setFrameworkData(data);
      if (data && data.domains) {
        // Keep selected if exists, otherwise first key
        const keys = Object.keys(data.domains);
        if (!selectedDomain || !keys.includes(selectedDomain)) {
          setSelectedDomain(keys[0]);
        }
      }
    } catch (err: any) {
      console.error("Failed to fetch urban risk framework:", err);
      setFrameworkError(err.message || "Could not load urban risk framework.");
    } finally {
      setIsLoadingFramework(false);
    }
  };

  React.useEffect(() => {
    if (viewMode === "framework") {
      fetchFramework();
    }
  }, [viewMode, currentLocation]);

  const handleVisualizeLayer = (domainKey: string, geojson: any) => {
    if (!geojson) return;
    const event = new CustomEvent("map-render-risk-geojson", {
      detail: {
        domain: domainKey,
        geojson: geojson
      }
    });
    window.dispatchEvent(event);
  };

  const modeConfig: Record<
    DashboardMode,
    {
      title: string;
      subtitle: string;
      steps: string[];
      inputs: { id: string; label: string; type: "number" | "select"; options?: string[]; icon: React.ReactNode; suffix?: string }[];
    }
  > = {
    flood: {
      title: "Flood Risk Prediction",
      subtitle: "ML-based flood risk prediction using topographic & hydrological factors",
      steps: [
        "Calibrating elevation datasets...",
        "Querying Mula-Mutha river corridors...",
        "Standardizing feature arrays...",
        "Training Random Forest Tree Ensemble...",
        "Fitting sequential XGBoost gradients...",
        "Validating PostGIS geometry records..."
      ],
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
      subtitle: "Ensemble congestion modeling based on commuter density and peak volumes",
      steps: [
        "Aggregating junction transit nodes...",
        "Calculating roadway bottleneck vectors...",
        "Standardizing features...",
        "Fitting gradient boosted tree models...",
        "Saving georeferenced points to PostGIS..."
      ],
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
      subtitle: "Zoning deviation and environmental compliance hazard scoring",
      steps: [
        "Analyzing municipal zoning polygons...",
        "Evaluating slope profiles...",
        "Running Random Forest classification...",
        "Writing regulatory compliance flags..."
      ],
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
      subtitle: "Predictive asset stress indices and pipeline structural thickness alerts",
      steps: [
        "Calibrating substation thermal loads...",
        "Inspecting pipe thickness telemetry...",
        "Running tree residual equations...",
        "Registering network failure warnings..."
      ],
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
  const cfg = modeConfig[activeDomain];

  const getRiskColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case "critical": return "#dc2626";
      case "high": return "#ef4444";
      case "medium": return "#f59e0b";
      case "low": return "#10b981";
      default: return "#6b7280";
    }
  };

  const getRiskBadgeClass = (level: string) => {
    switch (level?.toLowerCase()) {
      case "critical": return "bg-red-950/20 text-red-400 border-red-500/30";
      case "high": return "bg-red-500/10 text-red-400 border-red-500/20";
      case "medium": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      default: return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    }
  };

  const getDomainIcon = (key: string) => {
    switch (key) {
      case "flood": return <Droplets className="text-blue-400" size={16} />;
      case "traffic": return <Car className="text-rose-400" size={16} />;
      case "urban": return <Building2 className="text-emerald-400" size={16} />;
      case "utility": return <Zap className="text-amber-400" size={16} />;
      default: return <BrainCircuit className="text-gray-400" size={16} />;
    }
  };

  return (
    <div className="p-4 space-y-4 h-full overflow-y-auto custom-scrollbar">
      
      {/* Selector: Ensembles vs Unified Framework */}
      <div className="flex bg-geo-darker/60 rounded-xl p-1 border border-geo-border/50">
        <button
          onClick={() => setViewMode("framework")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all ${
            viewMode === "framework"
              ? "bg-gradient-to-r from-primary-500/20 to-cyan-500/20 text-primary-400 border border-primary-500/30 shadow-inner"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          <Sparkles size={13} />
          Multi-Domain Framework
        </button>
        <button
          onClick={() => setViewMode("ensemble")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all ${
            viewMode === "ensemble"
              ? "bg-gradient-to-r from-primary-500/20 to-cyan-500/20 text-primary-400 border border-primary-500/30 shadow-inner"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          <BrainCircuit size={13} />
          Ensemble Predictions
        </button>
      </div>

      {viewMode === "framework" ? (
        /* ========================================================================= */
        /* MULTI-DOMAIN RISK FRAMEWORK PANEL                                         */
        /* ========================================================================= */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-cyan-400 animate-pulse" />
              <h3 className="text-sm font-bold text-gray-200">Urban Risk Framework</h3>
            </div>
            <span className="text-[10px] bg-cyan-950/30 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded-full font-mono font-bold">
              MCDA
            </span>
          </div>
          
          <p className="text-xs text-gray-500 leading-relaxed">
            Multi-Criteria Decision Analysis models comparing georeferenced hazard zones across key infrastructure sectors.
          </p>

          {isLoadingFramework ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <Loader2 size={24} className="text-primary-500 animate-spin" />
              <span className="text-xs text-gray-400 font-mono">Aggregating spatial domain telemetry...</span>
            </div>
          ) : frameworkError ? (
            <div className="glass-card p-4 border-red-500/20 bg-red-950/10 text-center space-y-2">
              <AlertTriangle size={24} className="text-red-400 mx-auto" />
              <p className="text-xs text-gray-300">{frameworkError}</p>
              <button
                onClick={fetchFramework}
                className="btn-primary text-[10px] px-3 py-1 mx-auto"
              >
                Retry Request
              </button>
            </div>
          ) : frameworkData ? (
            <div className="space-y-4">
              
              {/* Domain Grid Overview */}
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(frameworkData.domains).map(([key, domain]: [string, any]) => {
                  const isSelected = selectedDomain === key;
                  return (
                    <motion.button
                      key={key}
                      onClick={() => setSelectedDomain(key)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`glass-card p-3 text-left border flex flex-col justify-between h-24 transition-all ${
                        isSelected
                          ? "border-primary-500 bg-primary-950/10 shadow-glow-primary"
                          : "border-geo-border hover:border-gray-500"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        {getDomainIcon(key)}
                        <span
                          className={`text-[8px] px-1.5 py-0.2 border rounded-full font-extrabold uppercase tracking-wide ${getRiskBadgeClass(
                            domain.level
                          )}`}
                        >
                          {domain.level}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-[10px] font-bold text-gray-300 truncate w-full mt-2">
                          {domain.name.split(" ")[0]} Risk
                        </h4>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="text-lg font-black font-mono text-gray-100">{domain.score}</span>
                          <span className="text-[9px] text-gray-500">/ 10</span>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Selected Domain Drilldown Detail */}
              {selectedDomain && frameworkData.domains[selectedDomain] && (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedDomain}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    {/* Domain Header Card */}
                    <div className="glass-card p-4 space-y-3 relative overflow-hidden bg-gradient-to-b from-geo-card/60 to-geo-dark">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                          {getDomainIcon(selectedDomain)}
                          {frameworkData.domains[selectedDomain].name}
                        </h4>
                        <button
                          onClick={() =>
                            handleVisualizeLayer(
                              selectedDomain,
                              frameworkData.domains[selectedDomain].geojson
                            )
                          }
                          className="flex items-center gap-1 text-[10px] text-primary-400 hover:text-primary-300 font-bold border border-primary-500/20 px-2.5 py-1 rounded-lg bg-primary-950/20 transition-all"
                        >
                          <Map size={11} />
                          Visualize Layer
                        </button>
                      </div>

                      {/* Formula & Explainability Callout */}
                      <div className="p-3 rounded-lg bg-black/35 border border-geo-border/50 text-[10px] font-mono text-gray-400 space-y-2">
                        <div className="flex items-center gap-1 text-cyan-400 font-bold text-[9px] uppercase tracking-wider">
                          <BookOpen size={10} />
                          Explainable Scoring Model (MCDA)
                        </div>
                        <p className="leading-relaxed">
                          {frameworkData.domains[selectedDomain].formula}
                        </p>
                        <div className="text-[9px] text-gray-500 border-t border-geo-border/40 pt-1.5 leading-relaxed font-sans">
                          {frameworkData.algorithm_info.methodology}
                        </div>
                      </div>

                      {/* Input Features Listing */}
                      <div className="space-y-2">
                        <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Input Vector Features</h5>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(frameworkData.domains[selectedDomain].input_features).map(([fKey, fVal]: [string, any]) => (
                            <div key={fKey} className="bg-black/15 border border-geo-border/40 p-2 rounded-lg text-left">
                              <span className="text-[9px] text-gray-500 block truncate capitalize">
                                {fKey.replace(/_/g, " ")}
                              </span>
                              <span className="text-xs font-bold font-mono text-gray-200">{fVal}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Factor Contribution Graph */}
                      <div className="space-y-2.5">
                        <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">MCDA Contribution weights</h5>
                        <div className="space-y-2">
                          {frameworkData.domains[selectedDomain].chart_data.map((factor: any, idx: number) => (
                            <div key={idx} className="space-y-1">
                              <div className="flex items-center justify-between text-[9px] font-mono text-gray-400">
                                <span>{factor.name}</span>
                                <span>{factor.weight}% weight</span>
                              </div>
                              <div className="h-1 bg-geo-dark rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-primary-500 to-cyan-500 rounded-full"
                                  style={{ width: `${factor.value}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Thresholds Level Scale */}
                      <div className="space-y-2 border-t border-geo-border/40 pt-3">
                        <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Risk thresholds index</h5>
                        <div className="grid grid-cols-4 gap-1 text-[8px] font-bold font-mono text-center">
                          {Object.entries(frameworkData.domains[selectedDomain].thresholds).map(([lvl, range]: [string, any]) => {
                            const isCurrent = frameworkData.domains[selectedDomain].level.toLowerCase() === lvl;
                            return (
                              <div
                                key={lvl}
                                className={`p-1 border rounded-md ${
                                  isCurrent
                                    ? "bg-primary-950/20 text-primary-400 border-primary-500"
                                    : "bg-black/10 text-gray-500 border-geo-border/30"
                                }`}
                              >
                                <span className="block uppercase tracking-wide mb-0.5">{lvl}</span>
                                <span className="opacity-80">{range}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Adaptation Strategies Recommendations */}
                    <div className="glass-card p-4 space-y-3">
                      <h4 className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                        <AlertTriangle size={12} className="text-amber-400" />
                        Adaptation Strategies & Contingencies
                      </h4>
                      <div className="space-y-2.5">
                        {frameworkData.domains[selectedDomain].recommendations.map((rec: string, i: number) => (
                          <div key={i} className="flex gap-2 text-xs text-gray-400 leading-relaxed font-medium">
                            <ArrowRight size={10} className="text-primary-400 shrink-0 mt-1" />
                            <span>{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-gray-500">
              No data available. Search for a location to begin.
            </div>
          )}
        </div>
      ) : (
        /* ========================================================================= */
        /* INDIVIDUAL ENSEMBLE PREDICTIONS PANEL                                     */
        /* ========================================================================= */
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <BrainCircuit size={18} className="text-primary-400 animate-pulse" />
            <h3 className="text-sm font-semibold text-gray-200">GeoAI Ensemble Engine</h3>
          </div>

          {/* Domain Selection Tabs for Ensemble Predictions */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-black/25 rounded-xl border border-geo-border/40">
            {[
              { id: "flood", label: "Flood Risk", icon: <Droplets size={12} /> },
              { id: "traffic", label: "Traffic", icon: <Car size={12} /> },
              { id: "urban", label: "Urban Dev", icon: <Building2 size={12} /> },
              { id: "utility", label: "Utility Grid", icon: <Zap size={12} /> }
            ].map((d) => (
              <button
                key={d.id}
                onClick={() => {
                  setActiveDomain(d.id as DashboardMode);
                  clearPrediction();
                }}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg border transition-all text-[10px] font-bold ${
                  activeDomain === d.id
                    ? "bg-gradient-to-br from-primary-500/15 to-cyan-500/15 text-primary-400 border-primary-500/30 shadow-inner"
                    : "text-gray-400 border-transparent hover:text-gray-200"
                }`}
              >
                {d.icon}
                <span className="mt-1">{d.label}</span>
              </button>
            ))}
          </div>

          <p className="text-xs text-gray-500">
            {cfg.subtitle}
          </p>

          {/* Input Parameters Panel */}
          <div className="glass-card p-4 space-y-3">
            <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-1">
              <Sliders size={11} className="text-gray-400" />
              Preprocessed Inputs
            </h4>
            
            <div className="grid grid-cols-2 gap-3">
              {cfg.inputs.map((input) => (
                <div key={input.id} className="space-y-1">
                  <label className="text-[10px] text-gray-500 flex items-center gap-1 font-medium">
                    {input.icon} {input.label}
                  </label>
                  {input.type === "select" ? (
                    <select
                      value={parameters[input.id]}
                      onChange={(e) => handleParamChange(input.id, e.target.value)}
                      className="w-full px-2.5 py-1 rounded-lg bg-geo-dark border border-geo-border text-xs text-gray-200 outline-none focus:border-primary-500"
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
                      className="w-full px-2.5 py-1 rounded-lg bg-geo-dark border border-geo-border text-xs text-gray-200 outline-none focus:border-primary-500 font-mono"
                    />
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={runPrediction}
              disabled={isRunning}
              className="w-full btn-primary justify-center mt-2 font-semibold text-xs py-2 shadow-lg shadow-primary-950/30"
            >
              {isRunning ? (
                <>
                  <Loader2 size={14} className="animate-spin text-white" />
                  Computing Mathematical Split Nodes...
                </>
              ) : (
                <>
                  <Play size={14} />
                  Train & Predict Ensembles
                </>
              )}
            </button>
          </div>

          {/* Dynamic Processing Pipeline Steps */}
          {isRunning && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-4 space-y-3"
            >
              <div className="flex items-center gap-2">
                <Loader2 size={14} className="text-primary-400 animate-spin" />
                <span className="text-xs text-primary-300 font-medium font-mono">GeoAI Gradient Engine Processing...</span>
              </div>
              <div className="space-y-2">
                {cfg.steps.map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.4 }}
                    className="flex items-center gap-2 text-[10px] text-gray-500 font-mono"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.4 + 0.2 }}
                    >
                      <CheckCircle2 size={11} className="text-emerald-500 shrink-0" />
                    </motion.div>
                    {step}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Model Predictions Output & Explainability */}
          {result && !isRunning && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              {/* Overall Blended Prediction Score */}
              <div className="glass-card p-4 text-center border-primary-500/20 bg-gradient-to-b from-geo-card/60 via-geo-card to-primary-950/10">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 font-mono">Ensemble Blended Risk Index</p>
                <div className="flex items-center justify-center gap-3">
                  <div
                    className="text-4xl font-black font-mono tracking-tight"
                    style={{ color: getRiskColor(result.overallRisk) }}
                  >
                    {result.score}
                  </div>
                  <div className="text-left">
                    <span
                      className={`risk-badge text-[10px] px-2.5 py-0.5 border font-black tracking-widest ${getRiskBadgeClass(result.overallRisk)}`}
                    >
                      {result.overallRisk.toUpperCase()}
                    </span>
                    <p className="text-[9px] text-gray-500 mt-1 font-mono">georeferenced risk bounds</p>
                  </div>
                </div>
                {/* PostGIS Saved Notice */}
                <p className="text-[8px] text-emerald-400/80 font-mono mt-3 flex items-center justify-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                  PREDICTION STORED IN SPATIAL INDEX TABLE (PostGIS WGS84 SRID 4326)
                </p>
              </div>

              {/* Tab Selection Row */}
              <div className="flex border-b border-geo-border bg-black/15 rounded-lg p-0.5">
                {[
                  { id: "factors", label: "Factors Breakdown", icon: <Sliders size={11} /> },
                  { id: "features", label: "Tree Weights", icon: <Activity size={11} /> },
                  { id: "metrics", label: "Model Metrics", icon: <Scale size={11} /> }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabState)}
                    className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-[9px] font-bold rounded-md transition-all ${
                      activeTab === tab.id
                        ? "bg-primary-500/10 text-primary-400 border border-primary-500/25 shadow-md"
                        : "text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* TAB 1: FACTORS BREAKDOWN */}
              {activeTab === "factors" && (
                <div className="space-y-3">
                  <div className="glass-card p-4 space-y-3">
                    <h4 className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                      <Sliders size={12} className="text-primary-400" />
                      Contributing Vulnerability Factors
                    </h4>
                    {result.factors.map((factor, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="text-gray-400">{factor.name}</span>
                          <span className={`font-bold ${
                            factor.impact === "Critical" ? "text-red-400" :
                            factor.impact === "High" ? "text-orange-400" : "text-amber-400"
                          }`}>{factor.impact}</span>
                        </div>
                        <div className="h-1 bg-geo-dark rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${factor.value}%` }}
                            transition={{ duration: 0.8, delay: i * 0.08 }}
                            className="h-full rounded-full bg-gradient-to-r from-primary-600 to-cyan-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Recommendations */}
                  <div className="glass-card p-4 space-y-2.5">
                    <h4 className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                      <AlertTriangle size={12} className="text-amber-400" />
                      ML Engineered Adaptation Strategies
                    </h4>
                    {result.recommendations.map((rec, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="flex items-start gap-2 text-xs text-gray-400 leading-relaxed font-medium"
                      >
                        <span className="text-primary-400 font-mono text-[10px] shrink-0 mt-0.5">{i + 1}.</span>
                        {rec}
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2: MULTI-TREE FEATURE IMPORTANCE WEIGHTS */}
              {activeTab === "features" && result.featureImportance && (
                <div className="glass-card p-4 space-y-3">
                  <h4 className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                    <Activity size={12} className="text-primary-400" />
                    Feature Importance (Ensemble Split Weights)
                  </h4>
                  <p className="text-[9px] text-gray-500 font-mono leading-relaxed mb-3">
                    Compares the split weights of our Random Forest tree clusters with sequential XGBoost residuals:
                  </p>

                  <div className="space-y-3.5">
                    {result.featureImportance.map((feat: any, i: number) => (
                      <div key={i} className="space-y-1.5">
                        <span className="text-[10px] text-gray-300 font-semibold block">{feat.feature}</span>
                        
                        {/* Random Forest Weight */}
                        <div className="space-y-0.5">
                          <div className="flex items-center justify-between text-[8px] font-mono text-gray-500">
                            <span>Random Forest Regressor</span>
                            <span>{Math.round(feat.random_forest * 100)}%</span>
                          </div>
                          <div className="h-1 bg-geo-dark rounded-full overflow-hidden">
                            <div className="h-full bg-violet-500 rounded-full" style={{ width: `${feat.random_forest * 100}%` }} />
                          </div>
                        </div>

                        {/* XGBoost Weight */}
                        <div className="space-y-0.5">
                          <div className="flex items-center justify-between text-[8px] font-mono text-gray-500">
                            <span>Gradient Booster (XGBoost)</span>
                            <span>{Math.round(feat.xgboost * 100)}%</span>
                          </div>
                          <div className="h-1 bg-geo-dark rounded-full overflow-hidden">
                            <div className="h-full bg-primary-500 rounded-full" style={{ width: `${feat.xgboost * 100}%` }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: MODEL EVALUATION METRICS COMPARISON */}
              {activeTab === "metrics" && result.modelMetrics && (
                <div className="glass-card p-4 space-y-3 font-mono text-[9px]">
                  <h4 className="text-xs font-semibold text-gray-300 font-sans flex items-center gap-1.5">
                    <Scale size={12} className="text-primary-400" />
                    Dynamic ML Model Validation & Evaluation
                  </h4>
                  <p className="text-gray-500 leading-relaxed font-mono">
                    Calculates metrics dynamically on our 100-sample spatial historical digital twin database:
                  </p>

                  <div className="overflow-x-auto mt-3 border border-geo-border rounded-xl">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-black/25 text-gray-400 border-b border-geo-border">
                          <th className="p-2 font-bold uppercase text-[8px]">Metric Key</th>
                          <th className="p-2 font-bold uppercase text-[8px]">Random Forest</th>
                          <th className="p-2 font-bold uppercase text-[8px]">XGBoost</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-geo-border">
                        <tr>
                          <td className="p-2 text-gray-300 font-bold">R² Coefficient</td>
                          <td className="p-2 text-violet-400 font-semibold">{result.modelMetrics.regression.random_forest.r2_score}</td>
                          <td className="p-2 text-primary-400 font-semibold">{result.modelMetrics.regression.xgboost.r2_score}</td>
                        </tr>
                        <tr>
                          <td className="p-2 text-gray-300 font-bold">RMSE Residual</td>
                          <td className="p-2 text-gray-400">{result.modelMetrics.regression.random_forest.rmse}</td>
                          <td className="p-2 text-gray-400">{result.modelMetrics.regression.xgboost.rmse}</td>
                        </tr>
                        <tr className="bg-black/10">
                          <td className="p-2 text-gray-300 font-bold">Classification Acc.</td>
                          <td className="p-2 text-violet-400 font-semibold">{Math.round(result.modelMetrics.classification.random_forest.accuracy * 100)}%</td>
                          <td className="p-2 text-primary-400 font-semibold">{Math.round(result.modelMetrics.classification.xgboost.accuracy * 100)}%</td>
                        </tr>
                        <tr className="bg-black/10">
                          <td className="p-2 text-gray-300 font-bold">F1-Score Precision</td>
                          <td className="p-2 text-violet-400 font-semibold">{result.modelMetrics.classification.random_forest.f1_score}</td>
                          <td className="p-2 text-primary-400 font-semibold">{result.modelMetrics.classification.xgboost.f1_score}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      )}

    </div>
  );
}
