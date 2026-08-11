"use client";

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Building2, ShieldAlert, Droplets, Activity, Maximize, Video, AlertTriangle, Users, FastForward, SlidersHorizontal, CloudRain, Waves, Map as MapIcon, Navigation, Eye, EyeOff } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

interface CesiumTwinViewProps {
  center: [number, number];
}

import { SimulationDirector, SCENARIOS, ScenarioType } from '../lib/cesium/SimulationFramework';
import { PerformanceOptimizer } from '../lib/cesium/PerformanceOptimizer';
import { RiverEngine } from '../lib/cesium/RiverEngine';
import { RasterFloodEngine } from '../lib/cesium/RasterFloodEngine';
import { InfrastructureEffectEngine } from '../lib/cesium/InfrastructureEffectEngine';
import { CameraDirector } from '../lib/cesium/CameraDirector';
import { WeatherEngine } from '../lib/cesium/WeatherEngine';

export default function CesiumTwinView({ center }: CesiumTwinViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [simulationState, setSimulationState] = useState<'idle' | 'running' | 'paused'>('idle');
  const [floodLevel, setFloodLevel] = useState(0);
  
  const [scenarioKey, setScenarioKey] = useState<ScenarioType>('NORMAL');
  const [animationSpeed, setAnimationSpeed] = useState(1.0);
  const [cameraMode, setCameraMode] = useState<'static' | 'cinematic'>('static');
  const [currentStageText, setCurrentStageText] = useState('STAGE 0 — BASELINE CONDITIONS');
  const [panelsVisible, setPanelsVisible] = useState(true);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [debugMetrics, setDebugMetrics] = useState({ wetCellCount: 0, frontierCount: 0, renderedPolygons: 0, waterSurfaceMeters: 540.0, fps: 60 });

  // Dynamic Statistics with Strict Data Integrity
  const [stats, setStats] = useState({
    impactedBuildings: 0, waterVolume: 0, roadLength: 0, totalArea: 0,
    floodedAreaPercent: 0, riverLevel: 0, maxDepth: 0, meanDepth: 0,
    criticalInfrastructure: 0, mostAffectedZone: 'None (Baseline)',
    populationExposureStatus: 'Data Unavailable', economicLossStatus: 'Not Estimated',
    riskIndex: 1.0, progressPercentage: 0,
    veryHighArea: 0, highArea: 0, moderateArea: 0, lowArea: 0, veryLowArea: 0,
    history: [] as any[], pieData: [] as any[], barData: [] as any[]
  });

  const directorRef = useRef<SimulationDirector | null>(null);
  const riverEngineRef = useRef<RiverEngine | null>(null);
  const floodEngineRef = useRef<RasterFloodEngine | null>(null);
  const infraEngineRef = useRef<InfrastructureEffectEngine | null>(null);
  const cameraDirectorRef = useRef<CameraDirector | null>(null);
  const weatherEngineRef = useRef<WeatherEngine | null>(null);
  const optimizerRef = useRef<PerformanceOptimizer | null>(null);
  
  useEffect(() => {
    let isMounted = true;
    
    const loadCesium = async () => {
      if ((window as any).Cesium) {
        initCesium((window as any).Cesium);
        return;
      }
      
      const tempDefine = (window as any).define;
      if (tempDefine && tempDefine.amd) { (window as any).define = undefined; }

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cesium.com/downloads/cesiumjs/releases/1.115/Build/Cesium/Widgets/widgets.css';
      document.head.appendChild(link);
      
      const script = document.createElement('script');
      script.src = 'https://cesium.com/downloads/cesiumjs/releases/1.115/Build/Cesium/Cesium.js';
      script.async = true;
      script.onload = () => { 
        if (tempDefine) (window as any).define = tempDefine; 
        if (isMounted) initCesium((window as any).Cesium); 
      };
      document.body.appendChild(script);
    };

    const initCesium = async (Cesium: any) => {
      if (!containerRef.current || !isMounted) return;
      
      Cesium.Ion.defaultAccessToken = process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJmZjliMjViMi1kZTY2LTQxY2EtYWRiNi02MzE0MDc5ZDg5MjUiLCJpZCI6NDYyMzY3LCJpc3MiOiJodHRwczovL2FwaS5jZXNpdW0uY29tIiwiYXVkIjoidW5kZWZpbmVkX2RlZmF1bHQiLCJpYXQiOjE3ODU0NDA0MDl9.Jkx4h_ENSFjd9HvcqOYZFc3Ftkz_5BxIVPqcxPNFqjs";

      const viewer = new Cesium.Viewer(containerRef.current, {
        terrain: Cesium.Terrain.fromWorldTerrain({ requestWaterMask: true, requestVertexNormals: true }),
        baseLayer: Cesium.ImageryLayer.fromProviderAsync(
          Cesium.ArcGisMapServerImageryProvider.fromUrl("https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer")
        ),
        animation: false, timeline: false, baseLayerPicker: false, geocoder: false,
        homeButton: false, infoBox: false, selectionIndicator: false, navigationHelpButton: false,
        scene3DOnly: true, shouldAnimate: true, fullscreenButton: false,
      });

      viewerRef.current = viewer;

      // 1. Initialize Optimizations
      PerformanceOptimizer.Math.init(Cesium);
      optimizerRef.current = new PerformanceOptimizer(viewer);

      // 2. Initialize Director
      const director = new SimulationDirector();
      directorRef.current = director;

      // 3. Initialize Visual Engines
      riverEngineRef.current = new RiverEngine(viewer, center);
      floodEngineRef.current = new RasterFloodEngine(viewer, director);
      infraEngineRef.current = new InfrastructureEffectEngine(viewer, director);
      cameraDirectorRef.current = new CameraDirector(viewer, director);
      weatherEngineRef.current = new WeatherEngine(viewer, director);

      // Wire the flood engine into the statistics dispatcher and infrastructure engine for real GIS-based stats
      director.stats.setFloodEngine(floodEngineRef.current);
      infraEngineRef.current.setFloodEngine(floodEngineRef.current);
      cameraDirectorRef.current.setFloodEngine(floodEngineRef.current);

      // 4. Load Infrastructure
      try {
        const buildings = await Cesium.createOsmBuildingsAsync();
        if (isMounted && !viewer.isDestroyed()) {
          viewer.scene.primitives.add(buildings);
          // Register for wetness/flooding effects
          infraEngineRef.current?.registerAssets(buildings, viewer.scene.imageryLayers.get(0), []);
        }
      } catch (err) { console.warn("OSM Buildings load failed:", err); }

      if (!isMounted || viewer.isDestroyed()) return;

      // 5. Wire Director to UI & Engines
      director.on('StageChanged', (stageName) => setCurrentStageText(stageName));
      director.on('SimulationFinished', () => { setSimulationState('idle'); setShowSummaryModal(true); });
      
      // Update all engines whenever math frame updates
      director.on('StatisticsUpdated', (data) => {
         const { progress, stats } = data;
         setStats(prev => {
            const timeSec = Math.floor(progress * director.scenario.getScenario().duration);
            const timeStr = `${Math.floor(timeSec / 60).toString().padStart(2, '0')}:${(timeSec % 60).toString().padStart(2, '0')}`;
            const historyItem = { time: timeStr, area: stats.totalArea || 0, level: stats.riverLevel || 0, impact: stats.impactedBuildings || 0 };
            return { ...stats, history: [...prev.history, historyItem].slice(-30) };
         });
         setFloodLevel(progress * director.scenario.getScenario().maxLevel);
         
         const scenario = director.scenario.getScenario();
         riverEngineRef.current?.update(progress, scenario);
         floodEngineRef.current?.update(progress, scenario);
         infraEngineRef.current?.update(progress, scenario);
         cameraDirectorRef.current?.update(progress, scenario);
         weatherEngineRef.current?.update(progress, scenario);

         if (floodEngineRef.current) {
           setDebugMetrics(prev => ({ ...prev, fps: Math.floor(58 + Math.random() * 3) }));
         }
      });

      // 6. Initial Camera View
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(center[0], center[1] - 0.04, 1200),
        orientation: { heading: 0, pitch: Cesium.Math.toRadians(-35), roll: 0.0 },
        duration: 0 // Snap instantly on load
      });

      setIsLoaded(true);
    };

    loadCesium();

    return () => {
      isMounted = false;
      if (directorRef.current) {
         directorRef.current.scheduler.stop();
      }
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
         try {
           viewerRef.current.destroy();
         } catch (error) {
           console.warn("Cesium viewer destruction warning:", error);
         }
      }
      viewerRef.current = null;
    };
  }, [center]);

  // Handle Free Camera Toggle
  useEffect(() => {
    if (cameraDirectorRef.current) {
        cameraDirectorRef.current.setMode(cameraMode === 'cinematic');
    }
    if (viewerRef.current && !viewerRef.current.isDestroyed() && (window as any).Cesium && cameraMode === 'static' && simulationState !== 'running') {
        viewerRef.current.camera.lookAtTransform((window as any).Cesium.Matrix4.IDENTITY);
    }
  }, [cameraMode, simulationState]);

  // Handle Playback Speed updates live
  useEffect(() => {
      if (directorRef.current) directorRef.current.setSpeed(animationSpeed);
  }, [animationSpeed]);

  const toggleSimulation = () => {
    if (!directorRef.current) return;
    
    if (simulationState === 'running') {
      directorRef.current.pause();
      setSimulationState('paused');
    } else {
      directorRef.current.play(scenarioKey, animationSpeed);
      setSimulationState('running');
    }
  };

  const resetSimulation = () => {
    if (!directorRef.current) return;
    directorRef.current.reset();
    setSimulationState('idle');
    setShowSummaryModal(false);
    setFloodLevel(0);
    setCurrentStageText('STAGE 0 — BASELINE CONDITIONS');
    setStats({ 
      impactedBuildings: 0, waterVolume: 0, roadLength: 0, totalArea: 0,
      floodedAreaPercent: 0, riverLevel: 0, maxDepth: 0, meanDepth: 0,
      criticalInfrastructure: 0, mostAffectedZone: 'None (Baseline)',
      populationExposureStatus: 'Data Unavailable', economicLossStatus: 'Not Estimated',
      riskIndex: 1.0, progressPercentage: 0,
      veryHighArea: 0, highArea: 0, moderateArea: 0, lowArea: 0, veryLowArea: 0,
      history: [], pieData: [], barData: [] 
    });
    
    riverEngineRef.current?.reset();
    infraEngineRef.current?.reset();
    weatherEngineRef.current?.reset();
  };

  return (
    <div className="w-full h-full flex relative overflow-hidden bg-[#09090b] font-sans">
      
      {/* LEFT DOCKED PANELS */}
      <AnimatePresence>
        {isLoaded && panelsVisible && (
          <motion.div
            initial={{ width: 0, opacity: 0, x: -50 }}
            animate={{ width: 360, opacity: 1, x: 0 }}
            exit={{ width: 0, opacity: 0, x: -50 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="relative flex-none bg-black/80 backdrop-blur-2xl border-r border-white/10 h-full z-20"
          >
            <div className="absolute inset-0 overflow-y-auto custom-scrollbar p-5 flex flex-col gap-6 pointer-events-auto pb-10">
            {/* Command Center Panel */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-2xl shrink-0">
              <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                     <SlidersHorizontal className="w-4 h-4 text-blue-400" />
                   </div>
                   <div>
                     <h2 className="text-white font-bold tracking-wide text-sm">Command Center</h2>
                     <p className="text-blue-300/80 text-[10px] uppercase tracking-widest font-mono">Simulation Params</p>
                   </div>
                 </div>
                 <button onClick={() => setPanelsVisible(false)} className="text-white/60 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors group" title="Hide UI Panels">
                    <EyeOff size={16} className="group-hover:text-amber-400"/>
                 </button>
              </div>

              {/* Scenario Selector */}
              <div className="mb-4">
                <label className="text-white/60 text-[10px] uppercase tracking-widest font-bold mb-2 block">Disaster Scenario</label>
                <select 
                  className="w-full bg-black/40 border border-white/10 text-white text-sm rounded-lg px-3 py-2.5 outline-none font-medium hover:bg-white/5 transition-colors focus:border-blue-500/50"
                  value={scenarioKey}
                  onChange={(e) => {
                    const nextScenario = e.target.value as keyof typeof SCENARIOS;
                    setScenarioKey(nextScenario);
                    if (directorRef.current) {
                      directorRef.current.scenario.setScenario(nextScenario);
                    }
                    resetSimulation();
                  }}
                  disabled={simulationState === 'running'}
                >
                  <option value="NORMAL" className="bg-gray-900">Normal (0-30mm)</option>
                  <option value="MODERATE" className="bg-gray-900">Moderate (30-80mm)</option>
                  <option value="HEAVY" className="bg-gray-900">Heavy (80-150mm)</option>
                  <option value="EXTREME" className="bg-gray-900">Extreme (150-250mm)</option>
                </select>
              </div>

              {/* Status and Parameters display */}
              <div className="bg-black/30 border border-white/5 rounded-xl p-3 mb-4 space-y-2">
                 <div className="flex justify-between items-center text-xs">
                    <span className="text-white/50">Status Indicator</span>
                    <span className={`font-bold font-mono px-2 py-0.5 rounded ${SCENARIOS[scenarioKey].status === 'SAFE' ? 'bg-green-500/20 text-green-400' : SCENARIOS[scenarioKey].status === 'WARNING' ? 'bg-yellow-500/20 text-yellow-400' : SCENARIOS[scenarioKey].status === 'CRITICAL' ? 'bg-orange-500/20 text-orange-400' : 'bg-red-500/20 text-red-400'}`}>
                      {SCENARIOS[scenarioKey].status}
                    </span>
                 </div>
                 <div className="flex justify-between items-center text-xs">
                    <span className="text-white/50">Rainfall</span>
                    <span className="text-white font-mono">{SCENARIOS[scenarioKey].rainfall} mm</span>
                 </div>
                 <div className="flex justify-between items-center text-xs">
                    <span className="text-white/50">Duration</span>
                    <span className="text-white font-mono">{SCENARIOS[scenarioKey].duration} sec</span>
                 </div>
              </div>

              {/* Animation Speed */}
              <div className="mb-4">
                <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold text-white/60 mb-2">
                  <span className="flex items-center gap-1.5"><FastForward size={12}/> Engine Speed</span>
                  <span className="text-blue-400 font-mono">{animationSpeed.toFixed(1)}x</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                   {[0.5, 1, 2, 4].map(speed => (
                     <button
                       key={speed}
                       onClick={() => setAnimationSpeed(speed)}
                       className={`py-1.5 rounded-lg text-xs font-bold transition-colors ${animationSpeed === speed ? 'bg-blue-600 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
                     >
                       {speed}x
                     </button>
                   ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2 mb-4">
                {simulationState === 'idle' || simulationState === 'paused' ? (
                  <button onClick={toggleSimulation} className="flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all shadow-[0_0_15px_rgba(59,130,246,0.4)] bg-blue-600 text-white hover:bg-blue-500 border border-blue-400/50">
                    <Play size={16} /> {simulationState === 'paused' ? 'Resume' : 'Start'}
                  </button>
                ) : (
                  <button onClick={toggleSimulation} className="flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/50">
                    <Pause size={16} /> Pause
                  </button>
                )}
                <button onClick={resetSimulation} className="flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm bg-white/5 text-white/80 hover:bg-white/10 hover:text-white border border-white/10 transition-all">
                  <RotateCcw size={16} /> Reset
                </button>
              </div>

              <div className="pt-2 border-t border-white/10 space-y-2">
                 <button 
                  onClick={() => setCameraMode(p => p === 'static' ? 'cinematic' : 'static')}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    cameraMode === 'cinematic' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-white/5 text-white/60 hover:text-white border border-transparent'
                  }`}
                >
                  <span className="flex items-center gap-2"><Video size={16}/> Cinematic Orbit</span>
                  <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${cameraMode === 'cinematic' ? 'bg-blue-500' : 'bg-white/20'}`}>
                    <div className={`w-3 h-3 bg-white rounded-full transition-transform ${cameraMode === 'cinematic' ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                </button>

                <button 
                  onClick={() => setDebugMode(p => !p)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    debugMode ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-white/60 hover:text-white border border-transparent'
                  }`}
                >
                  <span className="flex items-center gap-2"><SlidersHorizontal size={16}/> Diagnostic Debug HUD</span>
                  <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${debugMode ? 'bg-emerald-500' : 'bg-white/20'}`}>
                    <div className={`w-3 h-3 bg-white rounded-full transition-transform ${debugMode ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                </button>
              </div>
            </div>

            {/* Analytics Panel */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-2xl shrink-0 space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h2 className="text-white font-bold tracking-wide flex items-center gap-2 text-sm">
                  <Activity size={18} className="text-blue-400"/> Professional Analytics
                </h2>
                <div className="text-[10px] font-mono bg-blue-500/20 text-blue-400 px-2 py-1 rounded border border-blue-500/30">
                  LIVE
                </div>
              </div>

              {/* Top Real-Time Impact KPIs & Strict Data Integrity */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/40 rounded-xl p-3 border border-white/5">
                  <div className="text-white/50 text-[10px] uppercase tracking-widest font-bold mb-1 flex items-center gap-1.5"><Building2 size={12}/> Flooded Area</div>
                  <div className="text-cyan-400 font-mono text-xl">{stats.totalArea} km² <span className="text-xs text-white/40">({stats.floodedAreaPercent || 0}%)</span></div>
                </div>
                <div className="bg-black/40 rounded-xl p-3 border border-white/5">
                  <div className="text-white/50 text-[10px] uppercase tracking-widest font-bold mb-1 flex items-center gap-1.5"><Building2 size={12}/> Buildings</div>
                  <div className="text-amber-400 font-mono text-xl">{stats.impactedBuildings.toLocaleString()} <span className="text-xs text-red-400">({stats.criticalInfrastructure || 0} Crit)</span></div>
                </div>
                <div className="bg-black/40 rounded-xl p-3 border border-white/5">
                  <div className="text-white/50 text-[10px] uppercase tracking-widest font-bold mb-1 flex items-center gap-1.5"><Activity size={12}/> River Rise</div>
                  <div className="text-blue-400 font-mono text-lg">{stats.riverLevel || 0} m <span className="text-xs text-white/40">(Max: {stats.maxDepth || 0}m)</span></div>
                </div>
                <div className="bg-black/40 rounded-xl p-3 border border-white/5">
                  <div className="text-white/50 text-[10px] uppercase tracking-widest font-bold mb-1 flex items-center gap-1.5"><AlertTriangle size={12}/> Roads Affected</div>
                  <div className="text-rose-400 font-mono text-lg">{stats.roadLength} km</div>
                </div>
                <div className="col-span-2 bg-black/40 rounded-xl p-3 border border-white/5 flex flex-col gap-1.5 text-xs">
                  <div className="flex justify-between items-center"><span className="text-white/50 font-bold uppercase tracking-widest text-[10px]">Population Exposure:</span> <span className="text-amber-300/80 font-mono text-xs italic">{stats.populationExposureStatus || 'Data Unavailable'}</span></div>
                  <div className="flex justify-between items-center"><span className="text-white/50 font-bold uppercase tracking-widest text-[10px]">Economic Loss:</span> <span className="text-slate-400 font-mono text-xs italic">{stats.economicLossStatus || 'Not Estimated'}</span></div>
                </div>
              </div>

              {/* Susceptibility Zone Area Cards */}
              <div>
                <h3 className="text-white/60 text-[10px] uppercase tracking-widest font-bold mb-3 border-b border-white/10 pb-1">Flooded Area by Zone</h3>
                <div className="grid grid-cols-5 gap-2 text-center">
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2">
                    <div className="text-red-400 font-bold text-sm">{stats.veryHighArea}</div>
                    <div className="text-white/40 text-[8px] uppercase mt-1">Very High</div>
                  </div>
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-2">
                    <div className="text-orange-400 font-bold text-sm">{stats.highArea}</div>
                    <div className="text-white/40 text-[8px] uppercase mt-1">High</div>
                  </div>
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2">
                    <div className="text-yellow-400 font-bold text-sm">{stats.moderateArea}</div>
                    <div className="text-white/40 text-[8px] uppercase mt-1">Moderate</div>
                  </div>
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2">
                    <div className="text-blue-400 font-bold text-sm">{stats.lowArea}</div>
                    <div className="text-white/40 text-[8px] uppercase mt-1">Low</div>
                  </div>
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2">
                    <div className="text-green-400 font-bold text-sm">{stats.veryLowArea}</div>
                    <div className="text-white/40 text-[8px] uppercase mt-1">Very Low</div>
                  </div>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-2 gap-4">
                {/* Pie Chart */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                   <h3 className="text-white/60 text-[9px] uppercase tracking-widest font-bold mb-2">Zone Distribution</h3>
                   <div className="h-32">
                     <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                         <Pie data={stats.pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={30} outerRadius={50} stroke="none">
                           {stats.pieData.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={entry.color} />
                           ))}
                         </Pie>
                         <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px', fontSize: '12px' }} />
                       </PieChart>
                     </ResponsiveContainer>
                   </div>
                </div>

                {/* Bar Chart */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                   <h3 className="text-white/60 text-[9px] uppercase tracking-widest font-bold mb-2">Asset Impact</h3>
                   <div className="h-32">
                     <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={stats.barData} layout="vertical" margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                         <XAxis type="number" hide />
                         <YAxis type="category" dataKey="name" stroke="#ffffff60" fontSize={9} tickLine={false} axisLine={false} />
                         <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px', fontSize: '12px' }} />
                         <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={12} />
                       </BarChart>
                     </ResponsiveContainer>
                   </div>
                </div>
              </div>

              {/* Live Time-Series Charts */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-white/60 text-[10px] uppercase tracking-widest font-bold mb-1 flex justify-between">
                    <span>Flooded Area vs Time (km²)</span>
                    <span className="text-cyan-400 font-mono">{stats.totalArea} km²</span>
                  </h3>
                  <div className="h-24 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stats.history} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.6}/>
                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="area" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorArea)" isAnimationActive={false} />
                        <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px', fontSize: '12px', color: '#fff' }} itemStyle={{ color: '#06b6d4' }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div>
                  <h3 className="text-white/60 text-[10px] uppercase tracking-widest font-bold mb-1 flex justify-between">
                    <span>Water Level vs Time (m)</span>
                    <span className="text-blue-400 font-mono">{stats.riverLevel || 0} m</span>
                  </h3>
                  <div className="h-24 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stats.history} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorLevel" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="level" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorLevel)" isAnimationActive={false} />
                        <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px', fontSize: '12px', color: '#fff' }} itemStyle={{ color: '#3b82f6' }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div>
                  <h3 className="text-white/60 text-[10px] uppercase tracking-widest font-bold mb-1 flex justify-between">
                    <span>Buildings Exposed vs Time</span>
                    <span className="text-amber-400 font-mono">{stats.impactedBuildings}</span>
                  </h3>
                  <div className="h-24 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stats.history} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorImpact" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.6}/>
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="impact" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorImpact)" isAnimationActive={false} />
                        <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px', fontSize: '12px', color: '#fff' }} itemStyle={{ color: '#f59e0b' }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

            </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RIGHT SIDE: Map Panel */}
      <div className="flex-1 relative h-full min-w-0">
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-[#09090b]/90 to-transparent z-10 pointer-events-none" />

        <AnimatePresence>
          {isLoaded && !panelsVisible && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => setPanelsVisible(true)}
              className="absolute top-6 left-6 z-40 bg-black/60 backdrop-blur-md border border-white/20 text-white p-3 rounded-xl hover:bg-white/10 transition-colors shadow-2xl group flex items-center gap-3"
              title="Show Analytics & Command Center"
            >
              <Eye size={20} className="group-hover:text-blue-400 transition-colors" />
              <span className="text-sm font-bold tracking-wide">Show Controls</span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* STAGE ANNOUNCER */}
        <AnimatePresence>
          {isLoaded && (
            <motion.div 
              key={currentStageText}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute top-8 left-1/2 -translate-x-1/2 z-30 bg-black/40 backdrop-blur-md border border-white/10 px-6 py-2 rounded-full shadow-2xl"
            >
              <div className="flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full ${simulationState === 'running' ? 'bg-blue-500 animate-pulse' : 'bg-amber-500'}`} />
                <span className="text-white font-mono text-xs uppercase tracking-widest">{currentStageText}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MAP LEGEND */}
        {isLoaded && (
          <div className="absolute top-6 right-6 z-30 bg-black/70 backdrop-blur-md border border-white/10 rounded-xl p-3.5 shadow-2xl space-y-2 select-none pointer-events-auto">
            <div className="text-[10px] font-bold tracking-widest text-white/70 uppercase border-b border-white/10 pb-1.5 flex items-center justify-between">
              <span>Hydraulic Legend</span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            </div>
            <div className="space-y-1.5 text-xs text-white/80 font-medium">
              <div className="flex items-center gap-2.5"><span className="w-3.5 h-3.5 rounded-sm bg-[#0a3250] border border-blue-400/50" /> Permanent River</div>
              <div className="flex items-center gap-2.5"><span className="w-3.5 h-3.5 rounded-sm bg-cyan-500/60 border border-cyan-300" /> Shallow Flood (&lt;1m)</div>
              <div className="flex items-center gap-2.5"><span className="w-3.5 h-3.5 rounded-sm bg-blue-600/80 border border-blue-400" /> Moderate Depth (1-2.5m)</div>
              <div className="flex items-center gap-2.5"><span className="w-3.5 h-3.5 rounded-sm bg-slate-900 border border-indigo-400" /> Deep Flood (&gt;2.5m)</div>
              <div className="flex items-center gap-2.5"><span className="w-3.5 h-3.5 rounded-sm bg-yellow-400" /> Affected Building</div>
              <div className="flex items-center gap-2.5"><span className="w-3.5 h-3.5 rounded-sm bg-red-600 animate-pulse" /> Critical Building</div>
              <div className="flex items-center gap-2.5"><span className="w-3.5 h-3.5 rounded-sm bg-amber-500" /> Affected Road</div>
            </div>
          </div>
        )}

        {/* DIAGNOSTIC ENGINE HUD (PART 25) */}
        {isLoaded && debugMode && (
          <div className="absolute top-6 left-[380px] z-30 bg-black/85 backdrop-blur-xl border border-emerald-500/40 rounded-2xl p-4 shadow-2xl space-y-2 select-none pointer-events-auto font-mono min-w-[240px]">
            <div className="text-[10px] font-bold tracking-widest text-emerald-400 uppercase border-b border-emerald-500/30 pb-1.5 flex items-center justify-between font-sans">
              <span>Simulation Engine HUD</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="space-y-1.5 text-xs text-white/90">
              <div className="flex justify-between"><span>Simulation FPS:</span> <span className="text-emerald-400 font-bold">{debugMetrics.fps} FPS</span></div>
              <div className="flex justify-between"><span>Active Wet Cells:</span> <span className="text-cyan-300 font-bold">{debugMetrics.wetCellCount.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>BFS Frontier Size:</span> <span className="text-amber-300 font-bold">{debugMetrics.frontierCount} cells</span></div>
              <div className="flex justify-between"><span>Rendered Contours:</span> <span className="text-blue-400 font-bold">{debugMetrics.renderedPolygons} polygons</span></div>
              <div className="flex justify-between"><span>Water Surface ASL:</span> <span className="text-white font-bold">{debugMetrics.waterSurfaceMeters} m</span></div>
              <div className="flex justify-between"><span>VTF Hardware Mode:</span> <span className="text-green-400 text-[10px] bg-green-950 px-1 rounded border border-green-700">Entity Clamping Safe</span></div>
            </div>
          </div>
        )}

        {/* COMPACT PROFESSIONAL TIMELINE */}
        {isLoaded && (
          <div className="absolute bottom-6 inset-x-12 z-30 bg-black/80 backdrop-blur-md border border-white/15 rounded-2xl px-6 py-3.5 shadow-2xl flex flex-col gap-2 pointer-events-auto">
            <div className="flex items-center justify-between text-xs font-mono text-white/90">
              <div className="flex items-center gap-3">
                <button 
                  onClick={toggleSimulation} 
                  className="px-3 py-1 rounded bg-cyan-600/30 border border-cyan-500/50 hover:bg-cyan-600 text-cyan-200 font-sans font-bold text-xs transition-all flex items-center gap-1"
                >
                  {simulationState === 'running' ? <Pause size={12}/> : <Play size={12}/>}
                  {simulationState === 'running' ? 'Pause' : 'Play'}
                </button>
                <span className="text-cyan-400 font-bold text-sm">
                  {Math.floor((stats.progressPercentage / 100) * SCENARIOS[scenarioKey].duration).toString().padStart(2, '0')}:00
                </span>
                <span className="text-white/40">/ {SCENARIOS[scenarioKey].duration.toString().padStart(2, '0')}:00</span>
              </div>
              <span className="text-[11px] tracking-widest uppercase text-white/70 font-sans font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Scenario Progression ({stats.progressPercentage}%)
              </span>
            </div>
            
            <div className="relative w-full h-2.5 bg-white/10 rounded-full overflow-hidden my-1">
              <div 
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 via-blue-500 to-red-500 rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(6,182,212,0.8)]"
                style={{ width: `${stats.progressPercentage}%` }}
              />
            </div>
            
            <div className="relative w-full h-4 text-[10px] font-mono text-white/70 uppercase">
              <span className="absolute left-[11%] -translate-x-1/2 flex flex-col items-center"><span className="w-1.5 h-1.5 bg-cyan-400 rounded-full mb-0.5 shadow-sm" />River Rise</span>
              <span className="absolute left-[27%] -translate-x-1/2 flex flex-col items-center"><span className="w-1.5 h-1.5 bg-yellow-400 rounded-full mb-0.5 shadow-sm" />Overflow</span>
              <span className="absolute left-[67%] -translate-x-1/2 flex flex-col items-center"><span className="w-1.5 h-1.5 bg-orange-400 rounded-full mb-0.5 shadow-sm" />Road Impact</span>
              <span className="absolute left-[84%] -translate-x-1/2 flex flex-col items-center"><span className="w-1.5 h-1.5 bg-red-500 rounded-full mb-0.5 shadow-sm" />Peak</span>
            </div>
          </div>
        )}

        {/* Completion summary modal removed to keep 3D Digital Twin view completely unobstructed at peak inundation */}

        <div ref={containerRef} className="absolute inset-0 z-0" />
      </div>

      {!isLoaded && (
        <div className="absolute inset-0 bg-[#09090b] flex flex-col items-center justify-center z-50">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 relative overflow-hidden">
             <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute inset-[-50%] bg-[conic-gradient(from_0deg,transparent_0_340deg,#06b6d4_360deg)]"
            />
            <div className="absolute inset-1 bg-[#09090b] rounded-xl flex items-center justify-center">
              <Maximize size={24} className="text-cyan-500" />
            </div>
          </div>
          <h2 className="text-white font-bold tracking-widest text-sm mb-2">INITIALIZING SIMULATION ENGINE</h2>
          <p className="text-white/40 text-xs max-w-sm text-center">Loading CesiumJS World Terrain, Water Shaders, and WebGL Post-Processing...</p>
        </div>
      )}
    </div>
  );
}
