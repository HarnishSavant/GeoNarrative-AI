"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { Droplets, Car, Building2, Zap, Globe2, Search, MapPin, BarChart3, MessageSquareText, Shield, Loader2, AlertTriangle } from "lucide-react";

import Sidebar from "@/components/Sidebar";
import TopNav from "@/components/TopNav";
import KPICard from "@/components/KPICard";
import AIChatPanel from "@/components/AIChatPanel";
import MapLayersPanel from "@/components/MapLayersPanel";
import PredictionPanel from "@/components/PredictionPanel";
import ReportsPanel from "@/components/ReportsPanel";
import SettingsPanel from "@/components/SettingsPanel";
import RightPanel from "@/components/RightPanel";

// SaaS upgrades
import LandingPage from "@/components/LandingPage";
import AuthModal from "@/components/AuthModal";
import UserDashboard from "@/components/UserDashboard";
import AdminDashboard from "@/components/AdminDashboard";
import { apiService } from "@/services/apiService";

import { SidebarTab, UploadedFile, DashboardMode } from "@/lib/types";
import { getKPIsForMode, generateFloodRisksForLocation, generateAnalyticsForLocation } from "@/lib/mockData";
import { useMapControl } from "@/hooks/useMapControl";

// Dynamic import for the map to avoid SSR issues
const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full rounded-xl bg-geo-card border border-geo-border flex items-center justify-center">
      <div className="text-center space-y-3">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 border-2 border-primary-500/30 border-t-primary-500 rounded-full mx-auto"
        />
        <p className="text-sm text-gray-500">Loading map...</p>
      </div>
    </div>
  ),
});

const DASHBOARD_MODES = [
  { id: "flood" as DashboardMode, label: "Flood Risk", icon: <Droplets size={14} />, color: "#3b82f6", gradient: "from-blue-600 to-cyan-500" },
  { id: "traffic" as DashboardMode, label: "Traffic", icon: <Car size={14} />, color: "#f59e0b", gradient: "from-amber-500 to-orange-500" },
  { id: "urban" as DashboardMode, label: "Urban Dev", icon: <Building2 size={14} />, color: "#8b5cf6", gradient: "from-violet-500 to-indigo-500" },
  { id: "utility" as DashboardMode, label: "Utility", icon: <Zap size={14} />, color: "#10b981", gradient: "from-emerald-500 to-teal-500" },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<SidebarTab>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

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
    if (typeof window !== "undefined") {
      window.addEventListener("geonarrative_credits_updated", handleCreditsUpdate);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("geonarrative_credits_updated", handleCreditsUpdate);
      }
    };
  }, [handleRefreshProfile]);

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

  // Dynamic, real-analytics metrics synced from FastAPI backend + PostGIS database
  const [currentKPIs, setCurrentKPIs] = useState<any[]>(() => getKPIsForMode(dashboardMode));
  const [currentFloodRisks, setCurrentFloodRisks] = useState<any[]>(() => generateFloodRisksForLocation(currentLocation || "Unknown", dashboardMode));
  const [currentAnalytics, setCurrentAnalytics] = useState<any>(() => generateAnalyticsForLocation(currentLocation || "Unknown", dashboardMode));
  const [isSyncingData, setIsSyncingData] = useState(false);
  const [dataSourceType, setDataSourceType] = useState<"real" | "fallback" | "simulated">("simulated");

  // Fetch dynamic, real-analytics metrics from FastAPI backend + PostGIS database
  React.useEffect(() => {
    if (!hasSearched || !currentLocation) return;

    let active = true;
    const fetchDashboardData = async () => {
      setIsSyncingData(true);
      try {
        const { apiService } = await import("@/services/apiService");
        
        // Parallel queries to FastAPI modular backend endpoints
        const [kpiData, floodData, analyticsData] = await Promise.all([
          apiService.getKPIs(currentLocation, dashboardMode),
          apiService.getFloodZones(currentLocation, dashboardMode),
          apiService.getAnalytics(currentLocation, dashboardMode)
        ]);

        if (active) {
          const isPune = currentLocation.toLowerCase().includes("pune");
          setDataSourceType(isPune ? "real" : "simulated");

          if (kpiData) {
            // Support direct lists or wrapped structures
            if (Array.isArray(kpiData)) {
              setCurrentKPIs(kpiData);
            } else if (kpiData.kpis && Array.isArray(kpiData.kpis)) {
              setCurrentKPIs(kpiData.kpis);
            } else {
              setCurrentKPIs(getKPIsForMode(dashboardMode));
            }
          }
          if (floodData) {
            const zones = Array.isArray(floodData) ? floodData : (floodData.zones || []);
            setCurrentFloodRisks(zones);
          }
          if (analyticsData) {
            setCurrentAnalytics(analyticsData);
          }
        }
      } catch (err) {
        console.error("FastAPI Backend sync failed, using dynamic local twin fallbacks:", err);
        if (active) {
          setCurrentKPIs(getKPIsForMode(dashboardMode));
          setCurrentFloodRisks(generateFloodRisksForLocation(currentLocation || "Unknown", dashboardMode));
          setCurrentAnalytics(generateAnalyticsForLocation(currentLocation || "Unknown", dashboardMode));
          setDataSourceType("fallback");
        }
      } finally {
        if (active) setIsSyncingData(false);
      }
    };

    fetchDashboardData();
    return () => {
      active = false;
    };
  }, [currentLocation, dashboardMode, hasSearched]);

  const handleMapAction = useCallback((action: string) => {
    if (action === "highlight-hospitals-flood") {
      handleModeChange("flood");
    } else if (action === "highlight-schools-river") {
      handleModeChange("flood");
    } else if (action === "highlight-shelters") {
      handleModeChange("traffic");
    } else if (action === "highlight-substations") {
      handleModeChange("utility");
    } else if (action === "highlight-roads") {
      handleModeChange("traffic");
    } else if (action === "highlight-zoning-compliance") {
      handleModeChange("urban");
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

  const showLeftContent = activeTab !== "dashboard" && activeTab !== "analytics" && activeTab !== "profile" && activeTab !== "admin";

  // Welcome Screen Component — shown when no location has been searched
  const WelcomeScreen = () => (
    <div className="flex-1 flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="max-w-2xl w-full text-center space-y-8"
      >
        {/* Logo & Title */}
        <div className="space-y-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-cyan-500 flex items-center justify-center mx-auto shadow-glow-primary"
          >
            <Globe2 size={40} className="text-white" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold gradient-text"
          >
            GeoNarrative AI
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-gray-400 text-sm max-w-md mx-auto leading-relaxed"
          >
            Your intelligent geospatial digital twin platform. Analyze flood risks, traffic patterns,
            urban development, and utility infrastructure with real-time PostGIS spatial intelligence.
          </motion.p>
        </div>

        {/* Search CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-geo-card/40 backdrop-blur-xl border border-geo-border rounded-2xl p-6 space-y-4"
        >
          <div className="flex items-center gap-3 justify-center text-gray-300">
            <Search size={18} className="text-primary-400" />
            <span className="text-sm font-medium">Search for a city to begin analysis</span>
          </div>
          <p className="text-xs text-gray-500">
            Use the search bar above to load any city — we'll automatically ingest OpenStreetMap data,
            build the digital twin, and activate all analysis engines.
          </p>
        </motion.div>

        {/* Feature Cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          {[
            { icon: <Droplets size={20} />, label: "Flood Risk", desc: "Hydrological analysis", color: "from-blue-600 to-cyan-500" },
            { icon: <Car size={20} />, label: "Traffic", desc: "Congestion modeling", color: "from-amber-500 to-orange-500" },
            { icon: <Building2 size={20} />, label: "Urban Dev", desc: "Zoning compliance", color: "from-violet-500 to-indigo-500" },
            { icon: <Zap size={20} />, label: "Utility Grid", desc: "Infrastructure audit", color: "from-emerald-500 to-teal-500" },
          ].map((feature, i) => (
            <motion.div
              key={feature.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + i * 0.1 }}
              className="bg-geo-card/30 border border-geo-border rounded-xl p-4 space-y-2 hover:border-primary-500/30 transition-all duration-300"
            >
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center text-white mx-auto`}>
                {feature.icon}
              </div>
              <p className="text-xs font-semibold text-gray-200">{feature.label}</p>
              <p className="text-[10px] text-gray-500">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom Quick Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="flex items-center justify-center gap-4 text-xs text-gray-500"
        >
          <button
            onClick={() => setActiveTab("chat")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-geo-border hover:border-primary-500/30 hover:text-primary-300 transition-all"
          >
            <MessageSquareText size={14} />
            Open AI Assistant
          </button>
          <span className="text-gray-700">or</span>
          <span className="text-gray-400">Upload data via the AI chat</span>
        </motion.div>
      </motion.div>
    </div>
  );

  // 1. Session Loading State
  if (!hasCheckedSession) {
    return (
      <div className="h-screen w-screen bg-geo-darker flex items-center justify-center font-mono text-xs text-gray-500">
        <div className="text-center space-y-4">
          <Loader2 size={32} className="animate-spin text-primary-500 mx-auto" />
          <p>Verifying secure JWT geoprocessing token...</p>
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
    <div className="h-screen w-screen flex flex-col bg-geo-dark text-gray-100 overflow-hidden">
      {/* Top Navigation */}
      <TopNav 
        onLocationSearch={handleLocationSearch} 
        currentLocation={currentLocation} 
        user={user} 
        onTabChange={setActiveTab} 
        onLogout={handleLogout} 
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          user={user}
        />

        {/* Secondary Left Panel (contextual) — wider for chat */}
        <AnimatePresence>
          {showLeftContent && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: activeTab === "chat" ? 440 : (activeTab === "prediction" || activeTab === "reports") ? 560 : 340, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="h-full bg-geo-darker/60 backdrop-blur-xl border-r border-geo-border overflow-hidden flex flex-col"
            >
              {renderLeftContent()}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Panel */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          
          {/* SaaS Full Width Panels */}
          {activeTab === "profile" ? (
            <UserDashboard user={user} onLogout={handleLogout} onRefreshProfile={handleRefreshProfile} />
          ) : activeTab === "admin" ? (
            <AdminDashboard />
          ) : !hasSearched ? (
            /* If no search done yet, show welcome screen */
            <WelcomeScreen />
          ) : (
            <>
              {/* Dashboard Mode Selector Row */}
              <div className="px-4 pt-3 pb-0 flex-shrink-0">
                <div className="flex items-center gap-2">
                  {DASHBOARD_MODES.map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => handleModeChange(mode.id)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300 border ${
                        dashboardMode === mode.id
                          ? `bg-gradient-to-r ${mode.gradient} text-white border-transparent shadow-lg`
                          : "bg-geo-card/50 text-gray-400 border-geo-border hover:border-gray-500 hover:text-gray-200"
                      }`}
                    >
                      {mode.icon}
                      {mode.label}
                    </button>
                  ))}
                  <div className="flex-1" />
                  <span className="text-[10px] text-gray-600 font-mono uppercase tracking-widest flex items-center gap-2">
                    {dashboardMode} intelligence • {currentLocation?.split(",")[0] || ""}
                    {dataSourceType === "real" && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold tracking-normal uppercase">
                        Production (PostGIS)
                      </span>
                    )}
                    {dataSourceType === "fallback" && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-bold tracking-normal uppercase">
                        Fallback Mode
                      </span>
                    )}
                    {dataSourceType === "simulated" && (
                      <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[9px] font-bold tracking-normal uppercase">
                        Simulation Mode
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* KPI Row — Only on Dashboard and Analytics */}
              {(activeTab === "dashboard" || activeTab === "analytics") && (
                <div className="p-4 pb-0 flex-shrink-0">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {currentKPIs.map((kpi, i) => (
                      <KPICard 
                        key={`${dashboardMode}-${kpi.id}`} 
                        data={kpi} 
                        index={i} 
                        isSimulated={dataSourceType !== "real"}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Uploaded files banner */}
              {(activeTab === "dashboard" || activeTab === "analytics") && uploadedFiles.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="px-4 pt-3 pb-0 flex-shrink-0"
                >
                  <div className="bg-gradient-to-r from-primary-950/40 via-geo-card/60 to-purple-950/30 backdrop-blur-xl border border-primary-500/25 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg shadow-primary-950/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-400">
                        <Shield className="text-primary-400" size={20} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-100 flex items-center gap-1.5">
                           <span>Custom Layer Active:</span>
                           <span className="text-primary-400 font-mono font-semibold">{uploadedFiles[uploadedFiles.length - 1].name}</span>
                        </h4>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {uploadedFiles[uploadedFiles.length - 1].features || 0} features indexed • {uploadedFiles[uploadedFiles.length - 1].type} format • Active on map
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab("chat")}
                      className="px-3 py-2 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white text-[11px] font-bold rounded-xl transition-all duration-300 shadow-md shadow-primary-900/30 flex-shrink-0"
                    >
                      Analyze in Chat
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Map Area */}
              <div
                className={`flex-1 p-4 relative ${
                  mapFullscreen ? "fixed inset-0 z-50 p-0" : ""
                }`}
              >
                {/* Spatial Integrity Status Panel */}
                {hasSearched && (
                  <div className="absolute top-8 left-8 z-40 bg-gray-950/85 border border-primary-500/30 p-4 rounded-2xl shadow-[0_8px_32px_-4px_rgba(0,0,0,0.6)] backdrop-blur-xl text-xs w-64 pointer-events-auto transition-all duration-300 hover:bg-gray-950/95">
                    <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center border ${isLoadingOSM ? 'bg-amber-500/20 border-amber-500/30' : 'bg-emerald-500/20 border-emerald-500/30'}`}>
                          <div className={`w-2 h-2 rounded-full animate-pulse ${isLoadingOSM ? 'bg-amber-400' : 'bg-emerald-400'}`}></div>
                        </div>
                        <h3 className="font-bold text-gray-100 tracking-wider uppercase text-[10px]">Data Integrity</h3>
                      </div>
                      <span className="text-[9px] font-mono text-gray-500">{new Date().toLocaleTimeString()}</span>
                    </div>
                    
                    <div className="space-y-2 text-[11px]">
                      <div className="flex justify-between items-center bg-black/40 rounded-lg p-2 border border-white/5">
                        <span className="text-gray-400 font-medium">Data Source</span>
                        <span className={`font-bold px-2 py-0.5 rounded text-[9px] ${isLoadingOSM ? 'bg-amber-400/10 text-amber-400' : osmData?.buildings?.features?.length ? 'bg-emerald-400/10 text-emerald-400' : 'bg-blue-400/10 text-blue-400'}`}>
                          {isLoadingOSM ? "FETCHING..." : osmData?.buildings?.features?.length ? "VERIFIED LIVE" : "AI ESTIMATED"}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-1.5 mt-2">
                        {[
                          { label: "City", value: currentLocation.split(",")[0] || "Unknown" },
                          { label: "Cache", value: isLoadingOSM ? "Bypassed" : "Active" },
                          { label: "Layer State", value: mapLayers.filter(l => l.visible).length + " Active" },
                          { label: "Quality Score", value: isLoadingOSM ? "N/A" : osmData?.buildings?.features?.length ? "94/100" : "78/100 (Est.)" },
                        ].map((item, idx) => (
                          <div key={idx} className="flex flex-col p-1.5 rounded bg-white/5 border border-white/5">
                            <span className="text-[9px] text-gray-500 uppercase tracking-wider">{item.label}</span>
                            <span className="text-gray-200 font-medium truncate">{item.value}</span>
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 mt-2 pt-2 border-t border-primary-500/20">
                        {[
                          { key: "Buildings", count: isLoadingOSM ? "Loading" : osmData?.buildings?.features?.length || "Est." },
                          { key: "Roads", count: isLoadingOSM ? "Loading" : osmData?.roads?.features?.length || "Est." },
                          { key: "Water", count: isLoadingOSM ? "Loading" : osmData?.rivers?.features?.length || "Est." },
                          { key: "Hospitals", count: isLoadingOSM ? "Loading" : osmData?.hospitals?.features?.length || "0" },
                          { key: "Schools", count: isLoadingOSM ? "Loading" : osmData?.schools?.features?.length || "0" },
                          { key: "Utilities", count: isLoadingOSM ? "Loading" : osmData?.infrastructure?.features?.length || "Est." },
                        ].map((stat, idx) => (
                          <div key={idx} className="flex flex-col items-center justify-center p-1.5 rounded bg-black/30 border border-white/5">
                            <span className={`font-mono font-bold text-[10px] ${stat.count === "Loading" ? "text-amber-400" : stat.count === "Est." ? "text-blue-400" : stat.count === "0" ? "text-red-400" : "text-emerald-400"}`}>
                              {stat.count}
                            </span>
                            <span className="text-[8px] text-gray-500 uppercase mt-0.5">{stat.key}</span>
                          </div>
                        ))}
                      </div>
                      
                      {(!isLoadingOSM && (!osmData?.hospitals?.features?.length || !osmData?.schools?.features?.length)) && (
                        <div className="mt-2 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 flex gap-2 items-start">
                          <AlertTriangle size={12} className="text-amber-400 mt-0.5 shrink-0" />
                          <p className="text-[9px] text-amber-200/90 leading-tight">
                            Synthesizing modeled spatial parameters due to sparse primary telemetry in this sector.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
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
              </div>
            </>
          )}
        </div>

        {/* Right Intelligence Panel — only when searched and not on profile/admin tabs */}
        {activeTab !== "profile" && activeTab !== "admin" && !mapFullscreen && hasSearched && (
          <RightPanel
            analytics={currentAnalytics}
            floodRisks={currentFloodRisks}
            currentLocation={currentLocation}
            dashboardMode={dashboardMode}
            isOpen={rightPanelOpen}
            onToggle={() => setRightPanelOpen(!rightPanelOpen)}
            isSimulated={dataSourceType !== "real"}
          />
        )}
      </div>
    </div>
  );
}
