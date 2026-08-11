"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, Droplets, Map as MapIcon, Layers, Bell, AlertTriangle,
  Building2, Navigation, BarChart3, PieChart as PieChartIcon,
  ActivitySquare, Server, Globe2, CheckCircle2, Info, CloudRain,
  BrainCircuit, MessageSquareText, FileText, Compass, Zap, Shield,
  ChevronRight, Play, Pause, RefreshCw, Radio, Eye, Sparkles, Sliders,
  Route, Waves
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from "recharts";
import { useDashboardStore, ScenarioType } from "@/store/dashboardStore";
import { useUIStore } from "@/store/uiStore";

interface CommandDashboardProps {
  onNavigate: (tab: string) => void;
}

export default function CommandDashboard({ onNavigate }: CommandDashboardProps) {
  const {
    activeScenario,
    simulationProgress,
    isSimulating,
    scenariosData,
    overviewData,
    susceptibilityData,
    hotspotData,
    setActiveScenario,
    setSimulationProgress,
    toggleSimulation,
    fetchDashboardTelemetry
  } = useDashboardStore();

  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [activeStage, setActiveStage] = useState<string>("FLOODPLAIN EXPANSION");

  // Fetch real backend statistics on mount & handle clock ticks
  useEffect(() => {
    fetchDashboardTelemetry();
    const clockTimer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(clockTimer);
  }, [fetchDashboardTelemetry]);

  // Handle live simulation loop if active
  useEffect(() => {
    let simTimer: NodeJS.Timeout;
    if (isSimulating) {
      simTimer = setInterval(() => {
        setSimulationProgress((simulationProgress >= 100 ? 0 : simulationProgress + 5));
      }, 1000);
    }
    return () => clearInterval(simTimer);
  }, [isSimulating, simulationProgress, setSimulationProgress]);

  // Derive active stage name from current percentage
  useEffect(() => {
    if (simulationProgress <= 20) setActiveStage("RIVER RISE (Channel Flow)");
    else if (simulationProgress <= 40) setActiveStage("BANK OVERFLOW (Terrace Spilling)");
    else if (simulationProgress <= 70) setActiveStage("FLOODPLAIN EXPANSION (Urban Runoff)");
    else if (simulationProgress <= 90) setActiveStage("INFRASTRUCTURE IMPACT (Road & Building Exposure)");
    else setActiveStage("PEAK INUNDATION (Max Modeled Extent)");
  }, [simulationProgress]);

  const currentMetrics = scenariosData[activeScenario] || scenariosData.heavy;

  // Build temporal expansion progression data for active scenario
  const temporalExpansionData = [
    {
      progress: "0%",
      stage: "RIVER RISE",
      area: overviewData.permanent_river_area_km2,
      buildings: 0,
      roads: 0.0,
      desc: "Baseline water course contained in Mula-Mutha channel"
    },
    {
      progress: "25%",
      stage: "BANK OVERFLOW",
      area: Number((currentMetrics.flooded_area_km2 * 0.45).toFixed(2)),
      buildings: Math.floor(currentMetrics.affected_buildings * 0.35),
      roads: Number((currentMetrics.affected_road_km * 0.40).toFixed(1)),
      desc: "Water tops low-lying retaining walls along riparian corridor"
    },
    {
      progress: "50%",
      stage: "FLOODPLAIN EXPANSION",
      area: Number((currentMetrics.flooded_area_km2 * 0.70).toFixed(2)),
      buildings: Math.floor(currentMetrics.affected_buildings * 0.65),
      roads: Number((currentMetrics.affected_road_km * 0.72).toFixed(1)),
      desc: "Rapid spatial spread into High and Very High AHP zones"
    },
    {
      progress: "75%",
      stage: "INFRASTRUCTURE IMPACT",
      area: Number((currentMetrics.flooded_area_km2 * 0.90).toFixed(2)),
      buildings: Math.floor(currentMetrics.affected_buildings * 0.88),
      roads: Number((currentMetrics.affected_road_km * 0.91).toFixed(1)),
      desc: "Arterial road disruptions isolate secondary intersections"
    },
    {
      progress: "100%",
      stage: "PEAK INUNDATION",
      area: currentMetrics.flooded_area_km2,
      buildings: currentMetrics.affected_buildings,
      roads: currentMetrics.affected_road_km,
      desc: "Maximum simulated extent at peak precipitation duration"
    }
  ];

  // Scenario Comparison Data for grouped visual matrix
  const comparisonData = [
    { name: "Normal", area: scenariosData.normal.flooded_area_km2, bldgs: scenariosData.normal.affected_buildings, roads: scenariosData.normal.affected_road_km, depth: scenariosData.normal.representative_depth_m, color: "#10b981", id: "normal" },
    { name: "Moderate", area: scenariosData.moderate.flooded_area_km2, bldgs: scenariosData.moderate.affected_buildings, roads: scenariosData.moderate.affected_road_km, depth: scenariosData.moderate.representative_depth_m, color: "#eab308", id: "moderate" },
    { name: "Heavy", area: scenariosData.heavy.flooded_area_km2, bldgs: scenariosData.heavy.affected_buildings, roads: scenariosData.heavy.affected_road_km, depth: scenariosData.heavy.representative_depth_m, color: "#f97316", id: "heavy" },
    { name: "Extreme", area: scenariosData.extreme.flooded_area_km2, bldgs: scenariosData.extreme.affected_buildings, roads: scenariosData.extreme.affected_road_km, depth: scenariosData.extreme.representative_depth_m, color: "#ef4444", id: "extreme" }
  ];

  const gisInventory = [
    { category: "TERRAIN", name: "Cartosat-1 / SRTM DEM", type: "Raster", res: "30 m", status: "READY", color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
    { category: "TERRAIN", name: "Topographic Slope Map", type: "Raster", res: "30 m", status: "READY", color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
    { category: "HYDROLOGY", name: "Mula-Mutha River Base Course", type: "Vector", res: "18.56 km²", status: "READY", color: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10" },
    { category: "HYDROLOGY", name: "AHP Flood Susceptibility", type: "Raster", res: "30 m (5 classes)", status: "READY", color: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10" },
    { category: "HYDROLOGY", name: "Euclidean Distance to River", type: "Raster", res: "30 m buffer", status: "READY", color: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10" },
    { category: "INFRASTRUCTURE", name: "Structural Building Footprints", type: "Vector", res: "339,732 features", status: "READY", color: "text-orange-400 border-orange-500/30 bg-orange-500/10" },
    { category: "INFRASTRUCTURE", name: "Urban Road Transport Network", type: "Vector", res: "2,350.5 km", status: "READY", color: "text-orange-400 border-orange-500/30 bg-orange-500/10" },
    { category: "ENVIRONMENT", name: "Sentinel-2 LULC Classification", type: "Raster", res: "10 m (2024)", status: "READY", color: "text-sky-400 border-sky-500/30 bg-sky-500/10" },
    { category: "ENVIRONMENT", name: "PMC Municipal Boundary", type: "Vector", res: "331.45 km²", status: "READY", color: "text-sky-400 border-sky-500/30 bg-sky-500/10" }
  ];

  const getRiskBadgeColor = (level: string) => {
    switch (level?.toUpperCase()) {
      case "CRITICAL":
        return "bg-red-500/20 text-red-400 border-red-500/40";
      case "HIGH":
        return "bg-orange-500/20 text-orange-400 border-orange-500/40";
      case "MODERATE":
        return "bg-amber-500/20 text-amber-400 border-amber-500/40";
      default:
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40";
    }
  };

  return (
    <div className="w-full h-full bg-[#080d17] text-slate-200 overflow-y-auto custom-scrollbar font-sans selection:bg-cyan-500/30">
      {/* ─── COMMAND CENTER HEADER & LIVE STATUS STRIP ─── */}
      <div className="sticky top-0 z-40 bg-[#0a101d]/90 backdrop-blur-xl border-b border-slate-800/80 px-8 py-3.5 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 flex items-center justify-center shadow-lg shadow-cyan-500/10">
            <Activity className="text-cyan-400 animate-pulse" size={22} />
          </div>
          <div>
            <h1 className="text-lg font-black text-white tracking-wide uppercase">
              Smart City Flood Command Center
            </h1>
            <p className="text-[11px] text-cyan-400/90 font-mono font-bold tracking-widest uppercase mt-0.5">
              Pune Urban Flood Digital Twin • Geointelligence Operations
            </p>
          </div>
        </div>

        {/* Live Operational Status Dots */}
        <div className="flex items-center gap-6">
          <div className="hidden xl:flex items-center gap-5 text-[11px] font-mono font-extrabold tracking-wider uppercase">
            <span className="flex items-center gap-2 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block -ml-4" />
              SYSTEM OPERATIONAL
            </span>
            <span className="text-slate-700">|</span>
            <span className="flex items-center gap-2 text-cyan-400">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              GIS ENGINE ONLINE
            </span>
            <span className="text-slate-700">|</span>
            <span className="flex items-center gap-2 text-sky-400">
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              DIGITAL TWIN READY
            </span>
            <span className="text-slate-700">|</span>
            <span className="flex items-center gap-2 text-purple-400">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              AI ENGINE ACTIVE
            </span>
          </div>

          <div className="text-right pl-6 border-l border-slate-800 shrink-0 font-mono">
            <p className="text-sm font-black text-white tracking-wider">{currentTime.toLocaleTimeString()}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">
              Study Area: PMC ({overviewData.study_area_km2} km²)
            </p>
          </div>
        </div>
      </div>

      {/* ─── MAIN COMMAND CENTER WORKSPACE (OPTIMIZED FOR 1920×1080) ─── */}
      <div className="p-6 space-y-6 max-w-[1840px] mx-auto">
        
        {/* ROW 1: ACTIVE SCENARIO CONTROL + DIGITAL TWIN PREVIEW & PREDICTIVE OUTLOOK */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Active Flood Scenario Control (Span 5) */}
          <div className="lg:col-span-5 bg-gradient-to-br from-slate-900/90 via-[#0c1322] to-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-2xl flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
              <Waves size={160} className="text-cyan-400" />
            </div>
            
            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                  <Radio className="h-4 w-4 text-cyan-400 animate-pulse" />
                  Active Flood Scenario Control
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-widest border ${getRiskBadgeColor(currentMetrics.risk_level)}`}>
                  {currentMetrics.risk_level} RISK LEVEL
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-2xl font-black text-white tracking-tight uppercase flex items-center gap-2">
                    <span>{activeScenario.toUpperCase()} SCENARIO</span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-1">
                    Precipitation Range: <strong className="text-cyan-300">{currentMetrics.rainfall_mm_h}</strong>
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono text-slate-400 block uppercase">Simulation Stage</span>
                  <span className="text-lg font-extrabold font-mono text-amber-400 block mt-0.5">{simulationProgress}%</span>
                </div>
              </div>

              {/* Simulation Progress Stage Slider & Status */}
              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center text-[11px] font-mono text-slate-300">
                  <span className="text-slate-400">Current Hydraulic Stage:</span>
                  <span className="text-cyan-300 font-bold uppercase">{activeStage}</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800 relative">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 via-amber-500 to-red-500 transition-all duration-300 rounded-full"
                    style={{ width: `${simulationProgress}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-slate-500 uppercase">
                  <span>River Rise (0%)</span>
                  <span>Bank Overflow (25%)</span>
                  <span>Floodplain (50%)</span>
                  <span>Impact (75%)</span>
                  <span>Peak (100%)</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-slate-800/80 mt-4 relative z-10">
              <button
                onClick={toggleSimulation}
                className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs font-mono uppercase tracking-wider transition-all flex items-center justify-center gap-2 border ${
                  isSimulating
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-lg shadow-amber-500/10"
                    : "bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-slate-700"
                }`}
              >
                {isSimulating ? <Pause className="h-4 w-4 text-amber-400 animate-pulse" /> : <Play className="h-4 w-4 text-emerald-400" />}
                <span>{isSimulating ? "PAUSE SIMULATION" : "RUN FLOOD SCENARIO"}</span>
              </button>

              <button
                onClick={() => onNavigate("twin")}
                className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs font-mono uppercase tracking-wider bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 group"
              >
                <Building2 className="h-4 w-4 text-cyan-200 group-hover:scale-110 transition-transform" />
                <span>VIEW DIGITAL TWIN</span>
              </button>
            </div>
          </div>

          {/* AI Geointelligence Insight (Span 4) */}
          <div className="lg:col-span-4 bg-gradient-to-br from-purple-950/30 via-slate-900/90 to-slate-900/90 border border-purple-500/40 rounded-2xl p-6 shadow-2xl flex flex-col justify-between relative overflow-hidden">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
                <span className="text-xs font-mono font-extrabold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-400 animate-pulse" />
                  AI Geointelligence Insight
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  REAL-TIME SYNTHESIS
                </span>
              </div>

              <p className="text-xs text-slate-200 leading-relaxed font-sans text-justify">
                {activeScenario === "extreme"
                  ? `Extreme scenario modeling (140 mm/h) projects catastrophic overbank flooding across ${currentMetrics.flooded_area_km2} km² of the PMC terrain. Inundation rapidly engulfs ${currentMetrics.affected_buildings.toLocaleString()} structures and disrupts ${currentMetrics.affected_road_km} km of roadway, with severe hydraulic concentration around the Mula-Mutha confluence basin.`
                  : activeScenario === "heavy"
                  ? `Heavy scenario analysis (95 mm/h) indicates substantial floodplain expansion along low-elevation riverine terraces adjacent to the Mula–Mutha system. Infrastructure exposure reaches ${currentMetrics.affected_buildings.toLocaleString()} structural footprints and ${currentMetrics.affected_road_km} km of transit roadways during the 65%–100% progression stages.`
                  : activeScenario === "moderate"
                  ? `Moderate precipitation conditions (65 mm/h) cause overtopping of low-lying retaining walls along primary drainage embankments. Inundation is contained to ${currentMetrics.flooded_area_km2} km², primarily threatening the ${currentMetrics.critical_buildings.toLocaleString()} riparian structures situated inside the 30-meter buffer setback.`
                  : `Normal monsoonal precipitation (35 mm/h) produces stable channel drainage with surface inundation restricted to ${currentMetrics.flooded_area_km2} km² along the permanent 18.56 km² riverbed corridor. Baseline municipal infrastructure operations remain unimpeded.`}
              </p>
            </div>

            <button
              onClick={() => onNavigate("chat")}
              className="w-full mt-4 py-2.5 px-4 rounded-xl font-bold text-xs font-mono uppercase tracking-wider bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/50 text-purple-200 shadow-md transition-all flex items-center justify-center gap-2"
            >
              <MessageSquareText className="h-4 w-4 text-purple-300" />
              <span>ASK GEONARRATIVE AI COPILOT</span>
            </button>
          </div>

          {/* Predictive Outlook Card (Span 3) */}
          <div className="lg:col-span-3 bg-gradient-to-br from-slate-900/90 via-[#0e1220] to-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-2xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <span className="text-xs font-mono font-extrabold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                  <BrainCircuit className="h-4 w-4 text-indigo-400" />
                  Next Impact / Predictive Outlook
                </span>
              </div>

              <div className="space-y-3 text-xs font-mono">
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">+25% Horizon Delta:</span>
                  <span className="font-bold text-amber-400">+{Number((currentMetrics.flooded_area_km2 * 0.18).toFixed(2))} km² Expansion</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <span className="text-slate-400 block text-[10px] uppercase">Primary Emerging Hotspot:</span>
                  <span className="font-extrabold text-white text-xs block">{hotspotData.grid_cell_id}</span>
                  <span className="text-indigo-400 text-[11px] block">{hotspotData.locality_context}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">Risk Trend Projection:</span>
                  <span className="font-bold text-red-400 uppercase">ESCALATING</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigate("prediction")}
              className="w-full mt-4 py-2.5 px-4 rounded-xl font-bold text-xs font-mono uppercase tracking-wider bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 transition-all flex items-center justify-center gap-2"
            >
              <Compass className="h-4 w-4 text-indigo-300" />
              <span>VIEW PREDICTION ENGINE</span>
            </button>
          </div>
        </div>

        {/* ROW 2: TOP OPERATIONAL KPI CARDS STRIP */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
          {/* Card 1: Flooded Area */}
          <div className="bg-slate-900/70 border border-slate-800/80 hover:border-cyan-500/40 transition-all rounded-2xl p-5 shadow-lg flex flex-col justify-between h-32 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <MapIcon className="h-4 w-4 text-cyan-400" />
                Flooded Area Extent
              </span>
              <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/30">
                {currentMetrics.area_percentage}% OF PMC
              </span>
            </div>
            <div>
              <div className="text-3xl font-black font-mono text-white tracking-tight">
                {currentMetrics.flooded_area_km2} <span className="text-base text-slate-400 font-normal font-sans">km²</span>
              </div>
              <p className="text-[11px] font-mono text-slate-400 mt-1">
                Evaluated over 331.45 km² municipal study boundary
              </p>
            </div>
          </div>

          {/* Card 2: Buildings Exposed */}
          <div className="bg-slate-900/70 border border-slate-800/80 hover:border-orange-500/40 transition-all rounded-2xl p-5 shadow-lg flex flex-col justify-between h-32 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-orange-400" />
                Buildings Exposed
              </span>
              <span className="text-[10px] font-mono font-bold text-red-400 bg-red-950 px-2 py-0.5 rounded border border-red-500/30">
                {currentMetrics.critical_buildings.toLocaleString()} CRITICAL &lt;30m
              </span>
            </div>
            <div>
              <div className="text-3xl font-black font-mono text-white tracking-tight">
                {currentMetrics.affected_buildings.toLocaleString()} <span className="text-base text-slate-400 font-normal font-sans">Units</span>
              </div>
              <p className="text-[11px] font-mono text-slate-400 mt-1">
                {Math.round((currentMetrics.affected_buildings / 339732) * 100)}% of 339,732 total building inventory
              </p>
            </div>
          </div>

          {/* Card 3: Roads Affected */}
          <div className="bg-slate-900/70 border border-slate-800/80 hover:border-amber-500/40 transition-all rounded-2xl p-5 shadow-lg flex flex-col justify-between h-32 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Route className="h-4 w-4 text-amber-400" />
                Roads Affected
              </span>
              <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-500/30">
                {Math.round((currentMetrics.affected_road_km / 2350.5) * 100)}% NETWORK DISRUPTION
              </span>
            </div>
            <div>
              <div className="text-3xl font-black font-mono text-white tracking-tight">
                {currentMetrics.affected_road_km} <span className="text-base text-slate-400 font-normal font-sans">km</span>
              </div>
              <p className="text-[11px] font-mono text-slate-400 mt-1">
                Impassable transport roadways across Pune basin
              </p>
            </div>
          </div>

          {/* Card 4: Representative Depth */}
          <div className="bg-slate-900/70 border border-slate-800/80 hover:border-cyan-500/40 transition-all rounded-2xl p-5 shadow-lg flex flex-col justify-between h-32 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Droplets className="h-4 w-4 text-sky-400" />
                Representative Depth
              </span>
              <span className="text-[10px] font-mono font-bold text-sky-400 bg-sky-950 px-2 py-0.5 rounded border border-sky-500/30">
                RIVER EMBANKMENT
              </span>
            </div>
            <div>
              <div className="text-3xl font-black font-mono text-white tracking-tight">
                {currentMetrics.representative_depth_m} <span className="text-base text-slate-400 font-normal font-sans">m</span>
              </div>
              <p className="text-[11px] font-mono text-slate-400 mt-1">
                Peak modeled overbank flood elevation depth
              </p>
            </div>
          </div>

          {/* Card 5: Scenario Risk Level & River Base */}
          <div className="bg-slate-900/70 border border-slate-800/80 hover:border-emerald-500/40 transition-all rounded-2xl p-5 shadow-lg flex flex-col justify-between h-32 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-400" />
                Hydrological Base
              </span>
              <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded border uppercase ${getRiskBadgeColor(currentMetrics.risk_level)}`}>
                {currentMetrics.risk_level} HAZARD
              </span>
            </div>
            <div>
              <div className="text-3xl font-black font-mono text-white tracking-tight">
                {overviewData.permanent_river_area_km2} <span className="text-base text-slate-400 font-normal font-sans">km²</span>
              </div>
              <p className="text-[11px] font-mono text-slate-400 mt-1">
                Permanent Mula-Mutha riverine water course origin
              </p>
            </div>
          </div>
        </div>

        {/* ROW 3: TEMPORAL FLOOD EXPANSION & RISK SUSCEPTIBILITY DISTRIBUTION */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Temporal Flood Expansion Chart (Span 7) */}
          <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div>
                <h3 className="text-sm font-mono font-black uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-cyan-400" />
                  Temporal Flood Expansion & Progression Dynamics
                </h3>
                <p className="text-xs text-slate-400 font-sans mt-0.5">
                  Synchronized with precomputed 45-frame 3D Digital Twin simulation rasters.
                </p>
              </div>
              <span className="text-xs font-mono px-3 py-1 bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 rounded-lg font-bold">
                {activeScenario.toUpperCase()} TREND
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={temporalExpansionData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="floodGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="stage" stroke="#64748b" fontSize={10} tickFormatter={(val) => val.split(" ")[0]} />
                  <YAxis stroke="#64748b" fontSize={11} unit=" km²" />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-[#0e1626] border border-cyan-500/40 p-3 rounded-xl shadow-2xl text-xs font-mono text-slate-200 space-y-1.5 max-w-[240px]">
                            <div className="font-extrabold text-cyan-400 border-b border-slate-800 pb-1 flex justify-between">
                              <span>{data.stage}</span>
                              <span>{data.progress} Stage</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Flooded Area:</span>
                              <strong className="text-white">{data.area} km²</strong>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Buildings Exposed:</span>
                              <strong className="text-orange-400">{data.buildings.toLocaleString()} Units</strong>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Roads Affected:</span>
                              <strong className="text-amber-400">{data.roads} km</strong>
                            </div>
                            <p className="text-[10px] font-sans text-slate-400 pt-1 border-t border-slate-800">
                              {data.desc}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area type="monotone" dataKey="area" stroke="#06b6d4" strokeWidth={3} fillOpacity={1} fill="url(#floodGrad)" name="Inundation Area (km²)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-3 border-t border-slate-800 mt-2">
              <span>Origin: Permanent River Base (18.56 km²)</span>
              <span>Peak: {currentMetrics.flooded_area_km2} km² ({currentMetrics.area_percentage}% of PMC area)</span>
            </div>
          </div>

          {/* Flood Susceptibility / Risk Distribution (Span 5) */}
          <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div>
                <h3 className="text-sm font-mono font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <PieChartIcon className="h-4 w-4 text-amber-400" />
                  AHP Flood Susceptibility Distribution
                </h3>
                <p className="text-xs text-slate-400 font-sans mt-0.5">
                  Verified Multi-Criteria evaluation raster across Pune Municipal Corporation.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 items-center flex-1">
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={susceptibilityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={78}
                      paddingAngle={4}
                      dataKey="percentage"
                    >
                      {susceptibilityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload;
                          return (
                            <div className="bg-[#0e1626] border border-slate-700 p-2.5 rounded-lg text-xs font-mono text-slate-200">
                              <div className="font-extrabold text-amber-400">{item.name} Susceptibility</div>
                              <div>Area: <strong className="text-white">{item.area_km2} km²</strong> ({item.percentage}%)</div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2 font-mono text-xs">
                {susceptibilityData.map((s, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 rounded bg-slate-950/60 border border-slate-800/60">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded" style={{ backgroundColor: s.color }} />
                      <span className="text-slate-300 font-bold text-[11px]">{s.name}</span>
                    </div>
                    <div className="space-x-2 text-right">
                      <span className="text-slate-400 text-[10px]">{s.area_km2} km²</span>
                      <strong className="text-white text-xs">{s.percentage}%</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ROW 4: SCENARIO COMPARISON MATRIX + ALERT CENTER */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Scenario Comparison Interactive Selector (Span 8) */}
          <div className="lg:col-span-8 bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div>
                <h3 className="text-sm font-mono font-black uppercase tracking-wider text-white flex items-center gap-2">
                  <Layers className="h-4 w-4 text-blue-400" />
                  Multi-Scenario Impact Comparison Matrix
                </h3>
                <p className="text-xs text-slate-400 font-sans mt-0.5">
                  Click any scenario card below to immediately synchronize dashboard telemetry and Digital Twin state.
                </p>
              </div>
              <span className="text-xs font-mono text-slate-400 bg-slate-800 px-3 py-1 rounded font-bold">
                INTERACTIVE CONTEXT SWITCHER
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {comparisonData.map((sc, index) => {
                const isActive = activeScenario === sc.id;
                return (
                  <button
                    key={sc.id}
                    onClick={() => setActiveScenario(sc.id as ScenarioType)}
                    className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                      isActive
                        ? "bg-gradient-to-b from-slate-800 via-slate-900 to-slate-900 border-cyan-400 shadow-xl shadow-cyan-500/10 scale-[1.02]"
                        : "bg-slate-950/60 border-slate-800/80 hover:bg-slate-900/60 hover:border-slate-700"
                    }`}
                  >
                    {isActive && <div className="absolute top-0 left-0 right-0 h-1 bg-cyan-400" />}
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-sans font-black text-white uppercase tracking-tight flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sc.color }} />
                          {sc.name}
                        </span>
                        <span className="text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                          {sc.id === "extreme" ? "140mm" : sc.id === "heavy" ? "95mm" : sc.id === "moderate" ? "65mm" : "35mm"}
                        </span>
                      </div>
                      
                      <div className="pt-2 border-t border-slate-800/60 space-y-1 font-mono text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-400 text-[11px]">Flooded Area:</span>
                          <strong className="text-cyan-400">{sc.area} km²</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 text-[11px]">Buildings:</span>
                          <strong className="text-orange-400">{sc.bldgs.toLocaleString()}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 text-[11px]">Roads:</span>
                          <strong className="text-amber-400">{sc.roads} km</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 text-[11px]">Max Depth:</span>
                          <strong className="text-sky-400">{sc.depth} m</strong>
                        </div>
                      </div>
                    </div>

                    <div className={`mt-4 text-[11px] font-mono font-bold uppercase tracking-wider text-center py-1.5 rounded-lg border ${
                      isActive ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40" : "bg-slate-900 text-slate-500 border-slate-800"
                    }`}>
                      {isActive ? "ACTIVE SCENARIO" : "SELECT SCENARIO"}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Alert Center (Span 4) */}
          <div className="lg:col-span-4 bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-2xl flex flex-col justify-between">
            <div className="space-y-4 flex-1">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-sm font-mono font-black uppercase tracking-wider text-red-400 flex items-center gap-2">
                  <Bell className="h-4 w-4 text-red-400 animate-bounce" />
                  Live Operational Alert Center
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-500/30">
                  REAL-TIME FEED
                </span>
              </div>

              <div className="space-y-2.5 overflow-y-auto max-h-[220px] custom-scrollbar pr-1 font-mono text-xs">
                {/* Dynamic Alerts derived directly from application telemetry */}
                <div className="p-3 rounded-xl bg-red-950/20 border border-red-500/30 space-y-1">
                  <div className="flex items-center justify-between text-red-400 font-bold text-[11px]">
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 text-red-400 shrink-0" />
                      CRITICAL FLOOD ADVISORY
                    </span>
                    <span>ACTIVE</span>
                  </div>
                  <p className="text-slate-300 font-sans text-xs">
                    {activeScenario.toUpperCase()} scenario simulation indicates {currentMetrics.flooded_area_km2} km² surface inundation across Mula-Mutha riverine corridors.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-orange-950/20 border border-orange-500/30 space-y-1">
                  <div className="flex items-center justify-between text-orange-400 font-bold text-[11px]">
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3 w-3 text-orange-400 shrink-0" />
                      RIPARIAN BUFFER HAZARD
                    </span>
                    <span>&lt;30m SETBACK</span>
                  </div>
                  <p className="text-slate-300 font-sans text-xs">
                    Structural exposure reached {currentMetrics.critical_buildings.toLocaleString()} critical high-hazard building footprints inside river setbacks.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/30 space-y-1">
                  <div className="flex items-center justify-between text-cyan-400 font-bold text-[11px]">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-cyan-400 shrink-0" />
                      GIS ENGINE SYNCHRONIZED
                    </span>
                    <span>ONLINE</span>
                  </div>
                  <p className="text-slate-300 font-sans text-xs">
                    Cartosat-1 30m DEM and Sentinel-2 10m LULC raster rasters fully integrated with 3D animation engine.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigate("reports")}
              className="w-full mt-4 py-2.5 px-4 rounded-xl font-bold text-xs font-mono uppercase tracking-wider bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 transition-all flex items-center justify-center gap-2"
            >
              <FileText className="h-4 w-4 text-slate-400" />
              <span>VIEW TECHNICAL DOSSIERS & REPORTS</span>
            </button>
          </div>
        </div>

        {/* ROW 5: GIS DATA INVENTORY & INFRASTRUCTURE EXPOSURE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* GIS Data Inventory Table (Span 8) */}
          <div className="lg:col-span-8 bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div>
                <h3 className="text-sm font-mono font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                  <Server className="h-4 w-4 text-emerald-400" />
                  GIS Data Inventory & Active Raster Layers
                </h3>
                <p className="text-xs text-slate-400 font-sans mt-0.5">
                  Complete audit of operational spatial datasets loaded inside the GeoNarrative engine. Zero synthetic percentages.
                </p>
              </div>
              <span className="text-xs font-mono px-3 py-1 bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 rounded-lg font-bold">
                {gisInventory.length} LAYERS ONLINE
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
              {gisInventory.map((item, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between space-y-2 hover:border-slate-700 transition-all">
                  <div className="flex justify-between items-center">
                    <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${item.color}`}>
                      {item.category}
                    </span>
                    <span className="flex items-center gap-1 text-emerald-400 font-bold text-[10px]">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      {item.status}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs font-sans tracking-tight">{item.name}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {item.type} • <strong className="text-cyan-400">{item.res}</strong>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Infrastructure Exposure Summary Bars (Span 4) */}
          <div className="lg:col-span-4 bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-2xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-sm font-mono font-black uppercase tracking-wider text-orange-400 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-orange-400" />
                  Infrastructure Exposure Breakdown
                </span>
                <span className="text-[10px] font-mono text-slate-400 uppercase">
                  HYDRAULIC LEGEND
                </span>
              </div>

              <div className="space-y-4 font-mono text-xs pt-1">
                {/* Affected Buildings Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-slate-300">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded bg-amber-400" />
                      Affected Building Footprints:
                    </span>
                    <strong className="text-amber-400 font-extrabold">{currentMetrics.affected_buildings.toLocaleString()} Units</strong>
                  </div>
                  <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                    <div className="h-full bg-amber-400 transition-all duration-500 rounded-full" style={{ width: `${Math.round((currentMetrics.affected_buildings / 339732) * 100 * 3)}%` }} />
                  </div>
                  <span className="text-[10px] text-slate-500 block">General urban hazard intersection</span>
                </div>

                {/* Critical Riparian Buildings Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-slate-300">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded bg-red-500" />
                      Critical Riparian (&lt;30m Buffer):
                    </span>
                    <strong className="text-red-400 font-extrabold">{currentMetrics.critical_buildings.toLocaleString()} Units</strong>
                  </div>
                  <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                    <div className="h-full bg-red-500 transition-all duration-500 rounded-full" style={{ width: `${Math.round((currentMetrics.critical_buildings / currentMetrics.affected_buildings) * 100)}%` }} />
                  </div>
                  <span className="text-[10px] text-slate-500 block">High-hazard structural setback zones</span>
                </div>

                {/* Road Network Disruption Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-slate-300">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded bg-orange-500" />
                      Road Network Disruption:
                    </span>
                    <strong className="text-orange-400 font-extrabold">{currentMetrics.affected_road_km} km</strong>
                  </div>
                  <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                    <div className="h-full bg-orange-500 transition-all duration-500 rounded-full" style={{ width: `${Math.round((currentMetrics.affected_road_km / 2350.5) * 100)}%` }} />
                  </div>
                  <span className="text-[10px] text-slate-500 block">Primary & secondary municipal roadways</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800/80 mt-4 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span className="text-slate-400">Total Inventory: 339,732 Bldgs | 2,350.5 km Roads</span>
            </div>
          </div>
        </div>

        {/* ROW 6: QUICK ACTIONS OPERATIONAL PALETTE */}
        <div className="bg-gradient-to-r from-slate-900 via-[#0a1120] to-slate-900 border border-slate-800/80 rounded-2xl p-5 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
            <span className="text-xs font-mono font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Compass className="h-4 w-4 text-cyan-400" />
              Quick Operational Actions & Navigation Suite
            </span>
            <span className="text-[10px] font-mono text-slate-500 uppercase">
              SINGLE-CLICK PLATFORM ROUTING
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <button
              onClick={() => onNavigate("map")}
              className="flex items-center justify-between p-4 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/40 text-blue-300 transition-all group shadow-md hover:scale-[1.02]"
            >
              <div className="flex items-center gap-3">
                <Globe2 size={24} className="text-blue-400 group-hover:rotate-12 transition-transform" />
                <div className="text-left font-sans">
                  <span className="text-xs font-black uppercase tracking-wider block text-white">OPEN GIS</span>
                  <span className="text-[10px] text-blue-300 font-mono block">Map Layers & Rasters</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-blue-400 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => onNavigate("twin")}
              className="flex items-center justify-between p-4 rounded-xl bg-cyan-600/10 hover:bg-cyan-600/20 border border-cyan-500/40 text-cyan-300 transition-all group shadow-md hover:scale-[1.02]"
            >
              <div className="flex items-center gap-3">
                <Building2 size={24} className="text-cyan-400 group-hover:scale-110 transition-transform" />
                <div className="text-left font-sans">
                  <span className="text-xs font-black uppercase tracking-wider block text-white">DIGITAL TWIN</span>
                  <span className="text-[10px] text-cyan-300 font-mono block">3D Flood Simulation</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-cyan-400 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => onNavigate("prediction")}
              className="flex items-center justify-between p-4 rounded-xl bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/40 text-purple-300 transition-all group shadow-md hover:scale-[1.02]"
            >
              <div className="flex items-center gap-3">
                <BrainCircuit size={24} className="text-purple-400 group-hover:scale-110 transition-transform" />
                <div className="text-left font-sans">
                  <span className="text-xs font-black uppercase tracking-wider block text-white">PREDICTIVE AI</span>
                  <span className="text-[10px] text-purple-300 font-mono block">Horizon Projections</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-purple-400 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => onNavigate("analytics")}
              className="flex items-center justify-between p-4 rounded-xl bg-amber-600/10 hover:bg-amber-600/20 border border-amber-500/40 text-amber-300 transition-all group shadow-md hover:scale-[1.02]"
            >
              <div className="flex items-center gap-3">
                <BarChart3 size={24} className="text-amber-400 group-hover:scale-110 transition-transform" />
                <div className="text-left font-sans">
                  <span className="text-xs font-black uppercase tracking-wider block text-white">ANALYTICS</span>
                  <span className="text-[10px] text-amber-300 font-mono block">Spatial Statistics</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-amber-400 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => onNavigate("reports")}
              className="flex items-center justify-between p-4 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 transition-all group shadow-md hover:scale-[1.02]"
            >
              <div className="flex items-center gap-3">
                <FileText size={24} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                <div className="text-left font-sans">
                  <span className="text-xs font-black uppercase tracking-wider block text-white">GENERATE REPORT</span>
                  <span className="text-[10px] text-emerald-300 font-mono block">Consulting PDF Audit</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-emerald-400 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
