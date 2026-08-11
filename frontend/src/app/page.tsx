"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { Droplets, Car, Building2, Zap, Globe2, Search, MapPin, BarChart3, MessageSquareText, Shield, Loader2, AlertTriangle, Users } from "lucide-react";

import Sidebar from "@/components/Sidebar";
import TopNav from "@/components/TopNav";
import KPICard from "@/components/KPICard";
import AIChatPanel from "@/components/AIChatPanel";
import MapLayersPanel from "@/components/MapLayersPanel";
import PredictionPanel from "@/components/PredictionPanel";
import ReportsPanel from "@/components/ReportsPanel";
import SettingsPanel from "@/components/SettingsPanel";
import RightPanel from "@/components/RightPanel";
import FeatureDetailsPanel from "@/components/FeatureDetailsPanel";

// SaaS upgrades
import LandingPage from "@/components/LandingPage";
import AuthModal from "@/components/AuthModal";
import UserDashboard from "@/components/UserDashboard";
import AdminDashboard from "@/components/AdminDashboard";
import CommandDashboard from "@/components/CommandDashboard";
import { apiService } from "@/services/apiService";
import { ErrorBoundary } from "@/components/ErrorBoundary";

import { SidebarTab, UploadedFile, DashboardMode } from "@/lib/types";

import { useMapControl } from "@/hooks/useMapControl";
import { useUIStore } from "@/store/uiStore";
import { useDataStore } from "@/store/dataStore";
import { useAnalyticsStore } from "@/store/analyticsStore";

// Dynamic import for the map to avoid SSR issues
const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full rounded-xl bg-geo-dark border border-geo-border flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-950/20 to-cyan-950/20" />
      <div className="text-center space-y-6 relative z-10 flex flex-col items-center">
        <div className="relative w-16 h-16 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border-[3px] border-primary-500/10 border-t-primary-500"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute inset-2 rounded-full border-[3px] border-cyan-500/10 border-t-cyan-500"
          />
          <Globe2 size={24} className="text-primary-400 animate-pulse" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-gray-200 tracking-wider">INITIALIZING 3D DIGITAL TWIN</h3>
          <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest flex items-center justify-center gap-2">
            <Loader2 size={10} className="animate-spin text-cyan-500" />
            Loading WebGL Rendering Engine
          </p>
        </div>
      </div>
    </div>
  ),
});

const ArcGISView = dynamic(() => import("@/components/ArcGISView"), {
  ssr: false,
  loading: () => <div className="flex-1 flex items-center justify-center bg-gray-100">Loading ArcGIS Enterprise...</div>,
});

const CesiumTwinView = dynamic(() => import("@/components/CesiumTwinView"), {
  ssr: false,
  loading: () => <div className="flex-1 flex items-center justify-center bg-gray-900 text-white">Loading Digital Twin Engine...</div>,
});

const DASHBOARD_MODES = [
  { id: "terrain" as DashboardMode, label: "Terrain Twin", icon: <Globe2 size={14} />, color: "#8b5cf6", gradient: "from-violet-600 to-indigo-500" },
  { id: "hydrology" as DashboardMode, label: "Hydrology Twin", icon: <Droplets size={14} />, color: "#3b82f6", gradient: "from-blue-600 to-cyan-500" },
  { id: "infrastructure" as DashboardMode, label: "Infrastructure Twin", icon: <Building2 size={14} />, color: "#10b981", gradient: "from-emerald-500 to-teal-500" },
  { id: "population" as DashboardMode, label: "Population Twin", icon: <Users size={14} />, color: "#f59e0b", gradient: "from-amber-500 to-orange-500" },
  { id: "environment" as DashboardMode, label: "Environmental Twin", icon: <Zap size={14} />, color: "#22c55e", gradient: "from-green-500 to-emerald-400" },
];

// ── WelcomeScreen at MODULE SCOPE — not inside Home() ──
// Must be defined here to prevent React creating a new component type on every Home() render
function WelcomeScreen({ onSearch, onOpenChat }: { onSearch: () => void; onOpenChat: () => void }) {
  return (
    <div className="flex-1 flex items-center justify-center p-8 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-[#0a0f18]" />
      <div className="absolute top-[20%] left-[20%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[20%] w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="max-w-5xl w-full text-center space-y-12 relative z-10"
      >
        <div className="space-y-6">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, duration: 0.5 }}
            className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(59,130,246,0.3)] border border-white/10">
            <Globe2 size={48} className="text-white" />
          </motion.div>
          <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-teal-400 tracking-tight">GeoNarrative AI</motion.h2>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className="text-slate-400 text-base max-w-2xl mx-auto leading-relaxed">
            Enterprise 3D Digital Twin Platform. Access high-fidelity Terrain, Hydrology,
            Infrastructure, Population, and Environmental models for the Pune Metropolitan Region.
          </motion.p>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          onClick={onSearch}
          className="max-w-2xl mx-auto bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-2xl p-6 cursor-pointer hover:bg-white/[0.08] hover:border-blue-500/50 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] transition-all duration-300 group">
          <div className="flex items-center gap-4 justify-center">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-500/40 transition-all duration-300">
              <Search size={20} className="text-blue-400 group-hover:text-white" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-semibold text-slate-200 group-hover:text-white transition-colors">Load Pune Metropolitan Region</h3>
              <p className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors">Initialize all five Digital Twin engines and AI spatial analytics.</p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-5 gap-6 px-4">
          {[
            { icon: <Globe2 size={24} />, label: "Terrain", desc: "Elevation & topology", color: "from-violet-500 to-indigo-500", shadow: "hover:shadow-violet-500/20" },
            { icon: <Droplets size={24} />, label: "Hydrology", desc: "Water & drainage", color: "from-blue-500 to-cyan-500", shadow: "hover:shadow-blue-500/20" },
            { icon: <Building2 size={24} />, label: "Infrastructure", desc: "Built environment", color: "from-emerald-500 to-teal-500", shadow: "hover:shadow-emerald-500/20" },
            { icon: <Users size={24} />, label: "Population", desc: "Demographic modeling", color: "from-amber-500 to-orange-500", shadow: "hover:shadow-amber-500/20" },
            { icon: <Zap size={24} />, label: "Environment", desc: "Climate & vegetation", color: "from-green-500 to-emerald-400", shadow: "hover:shadow-green-500/20" },
          ].map((f, i) => (
            <motion.div key={f.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + i * 0.1 }} whileHover={{ y: -6, scale: 1.02 }}
              className={`group relative bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-4 transition-all duration-300 overflow-hidden hover:border-white/20 hover:bg-white/[0.05] shadow-xl hover:shadow-2xl`}>
              <div className={`absolute inset-0 bg-gradient-to-b ${f.color} opacity-0 group-hover:opacity-[0.1] transition-opacity duration-500`} />
              <div className={`relative z-10 w-14 h-14 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center text-white mx-auto shadow-lg`}>{f.icon}</div>
              <div className="relative z-10">
                <p className="text-sm font-bold text-slate-200">{f.label}</p>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
          className="flex flex-col items-center justify-center gap-4 text-xs pt-8 border-t border-white/5">
          <span className="text-slate-500 uppercase tracking-widest font-mono">Advanced Options</span>
          <div className="flex items-center gap-4">
            <button onClick={onOpenChat}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-blue-500/50 hover:text-white text-slate-300 transition-all duration-300 font-medium group">
              <MessageSquareText size={16} className="text-blue-400 group-hover:text-blue-300" /> Open AI Assistant
            </button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function Home() {
  const activeTab = useUIStore((state) => state.activeTab);
  const setActiveTab = useUIStore((state) => state.setActiveTab);
  const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed);
  const setSidebarCollapsed = useUIStore((state) => state.setSidebarCollapsed);
  const rightPanelOpen = useUIStore((state) => state.rightPanelOpen);
  const setRightPanelOpen = useUIStore((state) => state.setRightPanelOpen);
  
  const uploadedFiles = useDataStore((state) => state.uploadedFiles);
  const setUploadedFiles = useDataStore((state) => state.setUploadedFiles);

  // SaaS session state parameters
  const [user, setUser] = useState<any>(null);
  const [hasCheckedSession, setHasCheckedSession] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register" | "forgot" | "reset" | "verify">("login");

  // Automatic JWT session check on dashboard mount
  React.useEffect(() => {
    const checkSession = async () => {
      try {
        const storedUser = localStorage.getItem("geonarrative_user");
        const storedToken = localStorage.getItem("geonarrative_token");
        
        if (storedUser && storedToken) {
          try {
            setUser(JSON.parse(storedUser));
          } catch (parseErr) {
            console.warn("Failed to parse local stored user:", parseErr);
          }

          try {
            // Verify with FastAPI backend database dynamically
            const activeUser = await apiService.getProfile();
            setUser(activeUser);
            localStorage.setItem("geonarrative_user", JSON.stringify(activeUser));
          } catch (err: any) {
            console.warn("Automatically validating active JWT session failed:", err);
            if (err.message && err.message.includes("401")) {
              // The token is definitively expired or invalid. Log out to prevent dashboard fetch loops.
              localStorage.removeItem("geonarrative_token");
              localStorage.removeItem("geonarrative_user");
              setUser(null);
            }
            // Otherwise, High-resilience: do not log out user on transient 500/network backend errors
          }
        }
      } catch (err) {
        console.error("Error checking session:", err);
      } finally {
        setHasCheckedSession(true);
      }
    };
    checkSession();
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("geonarrative_token");
    localStorage.removeItem("geonarrative_user");
    setUser(null);
    setActiveTab("dashboard");
  }, []);

  const handleRefreshProfile = useCallback(async () => {
    try {
      const activeUser = await apiService.getProfile();
      setUser(activeUser);
      localStorage.setItem("geonarrative_user", JSON.stringify(activeUser));
    } catch (err) {
      console.error("Profile sync failed:", err);
    }
  }, []);

  React.useEffect(() => {
    const handleCreditsUpdate = () => {
      handleRefreshProfile();
    };
    const handleOpenChat = () => {
      setActiveTab("chat");
    };
    if (typeof window !== "undefined") {
      window.addEventListener("geonarrative_credits_updated", handleCreditsUpdate);
      window.addEventListener("open-geoai-chat", handleOpenChat as EventListener);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("geonarrative_credits_updated", handleCreditsUpdate);
        window.removeEventListener("open-geoai-chat", handleOpenChat as EventListener);
      }
    };
  }, [handleRefreshProfile, setActiveTab]);

  const {
    currentLocation,
    mapCenter,
    dashboardMode,
    mapLayers,
    layerOpacity,
    mapFullscreen,
    osmData,
    isLoadingOSM,
    hasSearched,
    boundaryData,
    setLayerOpacity,
    setMapFullscreen,
    handleModeChange,
    handleToggleLayer,
    handleRegisterCustomLayer,
    handleLocationSearch,
  } = useMapControl();

  const showLeftContent = activeTab !== "dashboard" && activeTab !== "analytics" && activeTab !== "profile" && activeTab !== "admin" && activeTab !== "twin";


  // Connect to Zustand Analytics Store
  const {
    riskSummary,
    exposureSummary,
    criticalInfrastructure,
    shelterRecommendations,
    fetchAnalytics
  } = useAnalyticsStore();

  React.useEffect(() => {
    if (hasSearched && currentLocation) {
      fetchAnalytics();
    }
  }, [hasSearched, currentLocation, dashboardMode, fetchAnalytics]);

  // Derive context-aware dynamic KPIs based on the selected Twin Mode
  const currentKPIs = React.useMemo(() => {
    if (!riskSummary.length) return [];
    
    const totalRiskHex = riskSummary.reduce((acc, curr) => acc + curr.hex_count, 0);
    const highRiskHex = riskSummary.filter(r => r.risk_class === 'Very High' || r.risk_class === 'High').reduce((acc, curr) => acc + curr.hex_count, 0);
    const bldgExp = exposureSummary.filter(e => e.asset_type === 'Buildings').reduce((acc, curr) => acc + curr.metric_value, 0);
    const roadExpKm = exposureSummary.filter(e => e.asset_type === 'Roads (m)').reduce((acc, curr) => acc + curr.metric_value, 0) / 1000;
    
    switch (dashboardMode) {
      case "terrain":
        return [
          { id: "dem-coverage", title: "DEM Coverage", value: "100%", change: 0, changeLabel: "SRTM/ALOS", icon: "map", gradient: ["#8b5cf6", "#6d28d9"] },
          { id: "mean-elev", title: "Mean Elevation", value: "560m", change: 0, changeLabel: "Above MSL", icon: "mountain", gradient: ["#8b5cf6", "#6d28d9"] },
          { id: "slope-zones", title: "Steep Slope Zones", value: "12%", change: 0, changeLabel: "> 15 degrees", icon: "triangle", gradient: ["#f59e0b", "#d97706"] },
          { id: "terrain-risk", title: "High Terrain Risk", value: highRiskHex.toLocaleString(), change: Math.round((highRiskHex / (totalRiskHex || 1)) * 100), changeLabel: "% of Area", icon: "alert-triangle", gradient: ["#ef4444", "#dc2626"] },
          { id: "watershed", title: "Watersheds", value: "4", change: 0, changeLabel: "Primary basins", icon: "droplets", gradient: ["#3b82f6", "#2563eb"] },
          { id: "stability", title: "Terrain Stability", value: "88%", change: 0, changeLabel: "Stable index", icon: "shield", gradient: ["#10b981", "#059669"] }
        ];
      case "hydrology":
        return [
          { id: "flood-cells", title: "Flood Cells", value: totalRiskHex.toLocaleString(), change: 0, changeLabel: "Active hexes", icon: "waves", gradient: ["#3b82f6", "#2563eb"] },
          { id: "waterways", title: "River Network", value: "186 km", change: 0, changeLabel: "Mapped length", icon: "droplets", gradient: ["#0ea5e9", "#0284c7"] },
          { id: "flood-depth", title: "Max Flood Depth", value: "2.4m", change: 0, changeLabel: "Estimated peak", icon: "arrow-down", gradient: ["#ef4444", "#dc2626"] },
          { id: "drainage", title: "Drainage Density", value: "Low", change: 0, changeLabel: "Capacity warning", icon: "alert-triangle", gradient: ["#f59e0b", "#d97706"] },
          { id: "flood-exp", title: "High Risk Area", value: `${Math.round(highRiskHex * 0.25)} km²`, change: Math.round((highRiskHex / (totalRiskHex || 1)) * 100), changeLabel: "% of City", icon: "map-pin", gradient: ["#ec4899", "#db2777"] },
          { id: "dams", title: "Upstream Dams", value: "4", change: 0, changeLabel: "Discharge active", icon: "shield", gradient: ["#10b981", "#059669"] }
        ];
      case "infrastructure":
        return [
          { id: "bldg-exp", title: "Buildings Exposed", value: bldgExp.toLocaleString(), change: 0, changeLabel: "In hazard zones", icon: "building", gradient: ["#f59e0b", "#d97706"] },
          { id: "hospitals", title: "Hospitals at Risk", value: criticalInfrastructure.filter(c => c.facility_type === 'Hospital').length.toString(), change: 0, changeLabel: "Priority 1", icon: "heart-pulse", gradient: ["#ef4444", "#dc2626"] },
          { id: "schools", title: "Schools Exposed", value: criticalInfrastructure.filter(c => c.facility_type === 'School').length.toString(), change: 0, changeLabel: "Evacuation risk", icon: "users", gradient: ["#3b82f6", "#2563eb"] },
          { id: "roads", title: "Road Network Exposed", value: `${roadExpKm.toFixed(1)} km`, change: 0, changeLabel: "Impacted segments", icon: "map", gradient: ["#64748b", "#475569"] },
          { id: "utilities", title: "Power Infrastructure", value: criticalInfrastructure.filter(c => c.facility_type === 'Utility').length.toString(), change: 0, changeLabel: "Substations", icon: "zap", gradient: ["#8b5cf6", "#6d28d9"] },
          { id: "infra-risk", title: "Infra Vulnerability", value: "High", change: 0, changeLabel: "Composite score", icon: "alert-triangle", gradient: ["#ec4899", "#db2777"] }
        ];
      case "population":
        return [
          { id: "pop-risk", title: "Population at Risk", value: (bldgExp * 4.2).toLocaleString(undefined, {maximumFractionDigits: 0}), change: 0, changeLabel: "Estimated residents", icon: "users", gradient: ["#f59e0b", "#d97706"] },
          { id: "vul-com", title: "Vulnerable Clusters", value: "14", change: 0, changeLabel: "High density", icon: "alert-triangle", gradient: ["#ef4444", "#dc2626"] },
          { id: "shelters", title: "Available Shelters", value: shelterRecommendations.length.toString(), change: 0, changeLabel: "Safe zones", icon: "tent", gradient: ["#10b981", "#059669"] },
          { id: "capacity", title: "Shelter Capacity", value: (shelterRecommendations.length * 500).toLocaleString(), change: 0, changeLabel: "Max persons", icon: "shield", gradient: ["#3b82f6", "#2563eb"] },
          { id: "evac", title: "Evacuation Routes", value: "8", change: 0, changeLabel: "Active corridors", icon: "arrow-right", gradient: ["#8b5cf6", "#6d28d9"] },
          { id: "density", title: "Avg Density", value: "6,500", change: 0, changeLabel: "per km²", icon: "bar-chart", gradient: ["#ec4899", "#db2777"] }
        ];
      case "environment":
        return [
          { id: "ndvi", title: "NDVI Mean", value: "0.42", change: 0, changeLabel: "Moderate cover", icon: "leaf", gradient: ["#22c55e", "#16a34a"] },
          { id: "green-cover", title: "Green Cover Loss", value: "8.5%", change: 0, changeLabel: "Past 5 years", icon: "arrow-down", gradient: ["#ef4444", "#dc2626"] },
          { id: "heat-island", title: "Heat Island Zones", value: "12", change: 0, changeLabel: "Thermal anomalies", icon: "sun", gradient: ["#f59e0b", "#d97706"] },
          { id: "water-bodies", title: "Water Bodies", value: "5", change: 0, changeLabel: "Lakes & rivers", icon: "droplets", gradient: ["#3b82f6", "#2563eb"] },
          { id: "permeability", title: "Surface Permeability", value: "Low", change: 0, changeLabel: "High runoff", icon: "alert-triangle", gradient: ["#8b5cf6", "#6d28d9"] },
          { id: "eco-health", title: "Ecological Health", value: "Fair", change: 0, changeLabel: "Index score", icon: "shield", gradient: ["#10b981", "#059669"] }
        ];
      default:
        return [];
    }
  }, [riskSummary, exposureSummary, criticalInfrastructure, shelterRecommendations, dashboardMode]);

  const [dataSourceType, setDataSourceType] = useState<"real" | "fallback" | "simulated">("real");

  const handleMapAction = useCallback((action: string) => {
    if (action === "highlight-hospitals-flood") {
      handleModeChange("hydrology");
    } else if (action === "highlight-schools-river") {
      handleModeChange("hydrology");
    } else if (action === "highlight-shelters") {
      handleModeChange("infrastructure");
    } else if (action === "highlight-substations") {
      handleModeChange("infrastructure");
    } else if (action === "highlight-roads") {
      handleModeChange("infrastructure");
    } else if (action === "highlight-zoning-compliance") {
      handleModeChange("environment");
    }
  }, [handleModeChange]);

  // File upload handler — called from AIChatPanel
  const handleFileUpload = useCallback((file: UploadedFile) => {
    setUploadedFiles((prev) => [...prev, file]);
    handleRegisterCustomLayer(file);
  }, [handleRegisterCustomLayer]);

  const renderLeftContent = () => {
    switch (activeTab) {
      case "map":
        return (
          <MapLayersPanel
            layers={mapLayers}
            onToggleLayer={handleToggleLayer}
            layerOpacity={layerOpacity}
            onOpacityChange={setLayerOpacity}
          />
        );
      case "chat":
        return (
          <AIChatPanel
            currentLocation={currentLocation}
            dashboardMode={dashboardMode}
            uploadedFiles={uploadedFiles}
            onMapAction={handleMapAction}
            onFileUpload={handleFileUpload}
          />
        );
      case "prediction":
        return <PredictionPanel currentLocation={currentLocation} dashboardMode={dashboardMode} />;
      case "reports":
        return <ReportsPanel currentLocation={currentLocation} />;
      case "settings":
        return <SettingsPanel />;
      default:
        return null;
    }
  };



  // 1. Session Loading State
  if (!hasCheckedSession) {
    return (
      <div className="h-screen w-screen bg-geo-darker flex flex-col items-center justify-center font-mono text-xs text-gray-500 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/10 to-geo-darker pointer-events-none" />
        <div className="text-center space-y-5 relative z-10">
          <motion.div 
            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500/20 to-cyan-500/20 flex items-center justify-center mx-auto border border-primary-500/30 shadow-[0_0_30px_rgba(14,165,233,0.2)]"
          >
            <Shield size={28} className="text-primary-400" />
          </motion.div>
          <div className="space-y-1.5">
            <h3 className="text-sm font-bold text-gray-200 tracking-wider">GEONARRATIVE SECURE GATEWAY</h3>
            <p className="text-[10px] uppercase tracking-widest text-gray-500 flex items-center justify-center gap-1.5">
              <Loader2 size={10} className="animate-spin text-primary-500" />
              Verifying encrypted JWT geoprocessing token
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated SaaS Visitor View
  if (!user) {
    return (
      <div className="min-h-screen bg-geo-darker text-gray-100 font-sans selection:bg-primary-500/30">
        <LandingPage onStartAuth={(mode) => {
          setAuthModalMode(mode);
          setShowAuthModal(true);
        }} />
        <AnimatePresence>
          {showAuthModal && (
            <AuthModal
              initialMode={authModalMode}
              onCancel={() => setShowAuthModal(false)}
              onSuccess={(userData) => {
                setUser(userData);
                setShowAuthModal(false);
                setActiveTab("dashboard");
              }}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  // 3. Authenticated SaaS Enterprise View
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-gray-50 text-gray-900 font-sans">
      
      {/* Top Navigation */}
      <div className="flex-none shadow-sm relative z-50 bg-white border-b border-gray-200">
        <TopNav 
          onLocationSearch={handleLocationSearch} 
          currentLocation={currentLocation} 
          user={user} 
          onTabChange={setActiveTab} 
          onLogout={handleLogout} 
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Left Sidebar — Icon rail */}
        <div className="flex-none z-40 bg-white border-r border-gray-200 transition-all duration-300">
          <Sidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            user={user}
          />
        </div>

        {/* Secondary Left Panel (contextual) */}
        <AnimatePresence>
          {showLeftContent && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: activeTab === "reports" ? 1140 : activeTab === "prediction" ? 550 : activeTab === "chat" ? 420 : 360, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="flex-none z-30 bg-white border-r border-gray-200 overflow-hidden shadow-sm"
            >
              <div className="h-full w-full flex flex-col bg-gray-50/50">
                {renderLeftContent()}
              </div>
            </motion.div>
          )}
          {activeTab === "analytics" && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 550, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="flex-none z-30 bg-white border-r border-gray-200 overflow-hidden shadow-sm"
            >
              <div className="h-full w-full flex flex-col bg-gray-50/50">
                <RightPanel
                  currentLocation={currentLocation}
                  dashboardMode={dashboardMode}
                  isOpen={true}
                  onToggle={() => {}}
                  isSimulated={dataSourceType !== "real"}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══════════════════════════════════════════════════════════════════
            CENTER: MAP + OVERLAYS
            The map is the HERO — it fills ALL remaining space.
            Overlays are thin, non-blocking, and properly z-indexed.
           ══════════════════════════════════════════════════════════════════ */}
        <div className="flex-1 flex flex-col relative min-w-0 bg-gray-100 overflow-hidden">
          

          {/* Map — fills remaining space naturally without overlapping */}
          {activeTab !== "profile" && activeTab !== "admin" && activeTab !== "dashboard" && (
            <div className="flex-1 relative z-0">
              <ErrorBoundary>
                <React.Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-blue-500" /></div>}>
                  {activeTab === "arcgis" ? (
                    <ArcGISView center={mapCenter} zoom={12} />
                  ) : activeTab === "twin" ? (
                    <CesiumTwinView center={mapCenter} />
                  ) : (
                    <MapView
                      center={mapCenter}
                      currentLocation={currentLocation}
                      layers={mapLayers}
                      dashboardMode={dashboardMode}
                      isFullscreen={mapFullscreen}
                      onToggleFullscreen={() => setMapFullscreen(!mapFullscreen)}
                      layerOpacity={layerOpacity}
                      osmData={osmData}
                      boundaryData={boundaryData}
                    />
                  )}
                </React.Suspense>
              </ErrorBoundary>
            </div>
          )}

          {/* Full-Width Dashboard */}
          {activeTab === "dashboard" && hasSearched && (
            <div className="flex-1 relative z-0 bg-[#0a0f18] overflow-hidden">
              <CommandDashboard onNavigate={setActiveTab} />
            </div>
          )}

          {/* SaaS Full-Width Panels (Profile / Admin) */}
          {activeTab === "profile" ? (
            <div className="absolute inset-0 z-10 bg-gray-50 overflow-y-auto">
              <UserDashboard user={user} onLogout={handleLogout} onRefreshProfile={handleRefreshProfile} />
            </div>
          ) : activeTab === "admin" ? (
            <div className="absolute inset-0 z-10 bg-gray-50 overflow-y-auto">
              <AdminDashboard />
            </div>
          ) : !hasSearched ? (
            <div className="absolute inset-0 z-10 bg-[#0a0f18]">
              <WelcomeScreen 
                onSearch={() => handleLocationSearch("Pune")} 
                onOpenChat={() => setActiveTab("chat")} 
              />
            </div>
          ) : null}
        </div>

        {/* Feature Details Overlay */}
        <FeatureDetailsPanel />
      </div>
    </div>
  );
}

