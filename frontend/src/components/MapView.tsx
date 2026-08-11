"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Maximize2,
  Minimize2,
  Layers,
  ZoomIn,
  ZoomOut,
  Crosshair,
  Satellite,
  Navigation,
  MousePointer2,
  Hand,
  Ruler,
  MousePointerClick,
  Printer,
  Download,
  Square,
  Undo2,
  Redo2,
  Image as ImageIcon
} from "lucide-react";
import ScreenshotMode from "./ScreenshotMode";
import { config, MAP_STYLES } from "@/lib/config";
import { MapLayerManager } from "@/lib/MapLayerManager";
import { MapLayer, DashboardMode } from "@/lib/types";
import { useInteractionStore } from "@/store/interactionStore";
import { useDataStore } from "@/store/dataStore";
import * as turf from "@turf/turf";
import ScenarioSimulator from "./ScenarioSimulator";

interface MapViewProps {
  center: [number, number];
  currentLocation: string;
  layers: MapLayer[];
  dashboardMode?: DashboardMode;
  onLocationChange?: (lng: number, lat: number) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  layerOpacity?: number;
  osmData?: Record<string, any>;
  boundaryData?: any;
}

// Dynamic Layer-Specific Legends matching thesis images
const LAYER_LEGENDS: Record<string, { title: string; items: { color: string; label: string }[] }> = {
  dem: {
    title: "Digital Elevation Model (DEM)",
    items: [
      { color: "#8b4513", label: "High Elevation (Mountains)" },
      { color: "#ffa500", label: "Mid Elevation (Hills)" },
      { color: "#00ff00", label: "Low Elevation (Plains)" },
      { color: "#e0ffff", label: "Lowest Elevation (Valleys)" },
    ],
  },
  flood: {
    title: "Flood Susceptibility",
    items: [
      { color: "#ff0000", label: "Very High Risk" },
      { color: "#483d8b", label: "High Risk" },
      { color: "#90ee90", label: "Moderate Risk" },
      { color: "#ffd700", label: "Low Risk" },
      { color: "#a9a9a9", label: "Very Low Risk" },
    ],
  },
  dist_to_river: {
    title: "Distance to River",
    items: [
      { color: "#add8e6", label: "Very Near" },
      { color: "#00008b", label: "Near" },
      { color: "#008080", label: "Moderate" },
      { color: "#87ceeb", label: "Far" },
      { color: "#00ffff", label: "Very Far" },
    ],
  },
  builddens: {
    title: "Building Density",
    items: [
      { color: "#cc0000", label: "Very High Density" },
      { color: "#ff6600", label: "High Density" },
      { color: "#ff9900", label: "Moderate Density" },
      { color: "#ffcc00", label: "Low Density" },
      { color: "#ffff00", label: "Very Low Density" },
    ],
  },
  lulc: {
    title: "Land Use / Land Cover",
    items: [
      { color: "#ff0000", label: "Built Area" },
      { color: "#0000ff", label: "Water" },
      { color: "#006400", label: "Trees" },
      { color: "#90ee90", label: "Grass" },
      { color: "#40e0d0", label: "Flooded Vegetation" },
      { color: "#ffff00", label: "Crops" },
      { color: "#556b2f", label: "Shrub & Scrub" },
      { color: "#8b4513", label: "Bare Ground" },
      { color: "#d3d3d3", label: "Snow" },
    ],
  },
  hill: {
    title: "Hillshade Relief",
    items: [
      { color: "#ffffff", label: "Sunlit Slopes" },
      { color: "#888888", label: "Flat Terrain" },
      { color: "#000000", label: "Shadows" },
    ],
  }
};

export default function MapView({
  center,
  currentLocation,
  layers,
  dashboardMode = "hydrology",
  isFullscreen,
  onToggleFullscreen,
  layerOpacity = 0.7,
  osmData = {},
  boundaryData = null,
}: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layerManagerRef = useRef<MapLayerManager | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [currentStyle, setCurrentStyle] = useState("light");
  const [showStylePicker, setShowStylePicker] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [screenshotMode, setScreenshotMode] = useState(false);
  const [cursorCoords, setCursorCoords] = useState<{ lng: number; lat: number } | null>(null);
  const [activeTool, setActiveTool] = useState("pan");
  const [zoomLevel, setZoomLevel] = useState(config.mapbox.defaultZoom);
  const [scaleFactor, setScaleFactor] = useState(0);
  
  // Scenario Simulator Handlers
  const handleScenarioChange = (m: number) => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    
    if (map.getLayer('floodRisk-fill')) {
      map.setPaintProperty('floodRisk-fill', 'fill-opacity', 0.65 * (m / 5 + 0.5));
    }
  };

  const handleAIExplain = (details: any) => {
    const prompt = `Simulate scenario: Rainfall +${details.rainfall}%, River Overflow: ${details.riverOverflow ? 'Yes' : 'No'}, Drainage Failure: ${details.drainageFailure ? 'Yes' : 'No'}. What are the expected impacts on buildings, population, and hospitals?`;
    window.dispatchEvent(new CustomEvent('ai-chat-send', { detail: prompt }));
  };

  // Viewport Loading States
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const viewportCacheRef = useRef<Map<string, Record<string, any>>>(new Map());
  const [isViewportLoading, setIsViewportLoading] = useState(false);
  
  // Track boundary to re-apply on style changes
  const boundaryDataRef = useRef<any>(null);
  
  // Track current mode to avoid unnecessary re-inits
  const currentModeRef = useRef<DashboardMode>(dashboardMode);

  // Track map initialization state to prevent double init
  const isInitializingRef = useRef(false);

  const activeFeature = useInteractionStore(state => state.activeFeature);
  const setOsmData = useDataStore(state => state.setOsmData);

  const styles = [
    { id: "dark",      label: "Dark Base",         icon: "🌙" },
    { id: "satellite", label: "Satellite Imagery",  icon: "🛰️" },
    { id: "light",     label: "Light Base",         icon: "☀️" },
    { id: "outdoors",  label: "Outdoors / Terrain", icon: "🏔️" },
  ];

  if (!config.mapbox.accessToken) {
    return (
      <div className="w-full h-full rounded-xl overflow-hidden relative bg-geo-darker border border-geo-border flex items-center justify-center">
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 text-center max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-cyan-500 flex items-center justify-center mx-auto mb-4">
              <Satellite size={28} className="text-white" />
            </div>
            <h3 className="text-lg font-bold mb-2">Interactive Map View</h3>
            <p className="text-sm text-gray-400 mb-4">Add your Mapbox access token to enable the full interactive map experience.</p>
            <div className="text-xs text-gray-500 bg-geo-dark/50 rounded-lg p-3 font-mono">Set NEXT_PUBLIC_MAPBOX_TOKEN in .env.local</div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // MAP INITIALIZATION — Optimized for fast load
  // ══════════════════════════════════════════════════════════════════════
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container || mapRef.current || isInitializingRef.current) return;

    let unmounted = false;
    isInitializingRef.current = true;
    
    const initMap = async () => {
      try {
        const mapboxgl = (await import("mapbox-gl")).default;
        mapboxgl.accessToken = config.mapbox.accessToken;

        if (unmounted || !document.body.contains(container)) return;

        // Ensure container is clean before Mapbox takes over
        container.innerHTML = "";

        const map = new mapboxgl.Map({
          container,
          style: MAP_STYLES.light,
          center,
          zoom: config.mapbox.defaultZoom,
          pitch: 0,
          bearing: 0,
          antialias: true,
          optimizeForTerrain: false,
          maxTileCacheSize: 50,
          localFontFamily: "'Inter'",
        });

        if (unmounted) {
          map.remove();
          return;
        }

        map.addControl(new mapboxgl.NavigationControl({ showCompass: true, visualizePitch: false }), "bottom-right");
        map.addControl(new mapboxgl.ScaleControl({ maxWidth: 150, unit: 'metric' }), "bottom-right");

        map.on("load", () => {
          if (unmounted) return;
          setMapLoaded(true);
          layerManagerRef.current = new MapLayerManager(map);
          layerManagerRef.current.initializeCoreLayers(layerOpacity, dashboardMode);
          currentModeRef.current = dashboardMode;
          setTimeout(() => handleViewportChange(), 800);
        });

        map.on("moveend", () => { handleViewportChange(); });

        map.on("mousemove", (e: any) => {
          setCursorCoords({ lng: e.lngLat.lng, lat: e.lngLat.lat });
        });
        map.on("zoom", () => {
          setZoomLevel(map.getZoom());
        });
        map.on("mouseleave", () => setCursorCoords(null));

        mapRef.current = map;
        
        (window as any).runMapboxAudit = () => {
          if (layerManagerRef.current) layerManagerRef.current.runRuntimeAudit();
        };
      } catch (error) {
        console.error("Map initialization error:", error);
        if (!unmounted) setMapError(true);
      } finally {
        isInitializingRef.current = false;
      }
    };

    initMap();

    return () => {
      unmounted = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      isInitializingRef.current = false;
    };
  }, []);
  // ══════════════════════════════════════════════════════════════════════
  // VIEWPORT DATA LOADING — instant fallback, optional backend upgrade
  // ══════════════════════════════════════════════════════════════════════
  const handleViewportChange = () => {
    if (!mapRef.current) return;

    if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);

    const debounceMs = 400;

    fetchTimeoutRef.current = setTimeout(async () => {
      try {
        const bounds = mapRef.current?.getBounds();
        if (!bounds) return;
        const zoom = mapRef.current!.getZoom();
        if (zoom < 8) return;

        const cacheKey = `${bounds.getWest().toFixed(2)},${bounds.getSouth().toFixed(2)},${bounds.getEast().toFixed(2)},${bounds.getNorth().toFixed(2)}`;
        
        if (viewportCacheRef.current.has(cacheKey)) {
          if (layerManagerRef.current) layerManagerRef.current.syncData(viewportCacheRef.current.get(cacheKey)!);
          return;
        }

        setIsViewportLoading(true);
        try {
          if (abortControllerRef.current) abortControllerRef.current.abort();
          abortControllerRef.current = new AbortController();
          const signal = abortControllerRef.current.signal;

          const baseUrl = config.api.baseUrl;
          const bbox = `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`;
          const timeout = setTimeout(() => abortControllerRef.current?.abort(), 30000);

          const endpoints = [
            { key: "floodRisk", path: `/api/v1/geodata/flood-risk?bbox=${bbox}` },
            { key: "riskGrid",  path: `/api/v1/geodata/risk-grid?bbox=${bbox}` },
            { key: "buildings", path: `/api/v1/geodata/buildings?bbox=${bbox}` },
            { key: "roads",     path: `/api/v1/geodata/roads?bbox=${bbox}` },
            { key: "pois",      path: `/api/v1/geodata/pois?bbox=${bbox}` },
            { key: "waterways", path: `/api/v1/geodata/waterways?bbox=${bbox}` },
            { key: "railways",  path: `/api/v1/geodata/railways?bbox=${bbox}` },
          ];

          const fetchedData: Record<string, any> = {};
          let anySuccess = false;
          
          await Promise.all(
            endpoints.map(async ({ key, path }) => {
              try {
                const res = await fetch(`${baseUrl}${path}`, { signal });
                if (res.ok) {
                  const data = await res.json();
                  fetchedData[key] = data;
                  if (data?.features?.length > 0) anySuccess = true;
                } else {
                  fetchedData[key] = { type: "FeatureCollection", features: [] };
                }
              } catch {
                fetchedData[key] = { type: "FeatureCollection", features: [] };
              }
            })
          );
          clearTimeout(timeout);
          
          if (!signal.aborted) {
            viewportCacheRef.current.set(cacheKey, fetchedData);
            setOsmData(fetchedData);
            if (layerManagerRef.current) layerManagerRef.current.syncData(fetchedData);
          }
        } catch (e) {
          console.error("Backend fetch failed", e);
        } finally {
          setIsViewportLoading(false);
        }
      } catch (e) {
        console.error("Viewport change error", e);
      }
    }, debounceMs);
  };

  // ══════════════════════════════════════════════════════════════════════
  // FLYTO ON LOCATION CHANGE
  // ══════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (mapRef.current && mapLoaded) {
      mapRef.current.flyTo({ center, zoom: 12, pitch: 0, duration: 2000 });
    }
  }, [center, mapLoaded]);

  // ══════════════════════════════════════════════════════════════════════
  // MODE CHANGE → Re-initialize layers with new colors
  // ══════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (mapLoaded && layerManagerRef.current) {
      layerManagerRef.current.initializeCoreLayers(layerOpacity, dashboardMode);
      currentModeRef.current = dashboardMode;
      // Re-apply boundary if it exists
      if (boundaryDataRef.current) {
        // Small delay to ensure layers are settled
        setTimeout(() => applyBoundary(boundaryDataRef.current), 50);
      }
      // Re-sync viewport data to repopulate sources after layer rebuild
      handleViewportChange();
    }
  }, [dashboardMode, mapLoaded]);

  // ══════════════════════════════════════════════════════════════════════
  // LAYER VISIBILITY TOGGLE — responds to sidebar toggle switches
  // ══════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !layerManagerRef.current) return;

    layers.forEach((layer) => {
      layerManagerRef.current!.setUILayerVisibility(layer.id, layer.visible);
    });
  }, [layers, mapLoaded]);

  // ══════════════════════════════════════════════════════════════════════
  // OPACITY CHANGE
  // ══════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (mapLoaded && layerManagerRef.current) {
      layerManagerRef.current.setGlobalOpacity(layerOpacity);
    }
  }, [layerOpacity, mapLoaded]);

  // ══════════════════════════════════════════════════════════════════════
  // FLY TO ACTIVE FEATURE
  // ══════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (mapLoaded && mapRef.current && activeFeature) {
      const lng = activeFeature.longitude || activeFeature.lng || activeFeature.lon;
      const lat = activeFeature.latitude || activeFeature.lat;
      if (lng !== undefined && lat !== undefined) {
        mapRef.current.flyTo({ center: [parseFloat(lng), parseFloat(lat)], zoom: 16, pitch: 0, duration: 1500 });
      }
    }
  }, [activeFeature, mapLoaded]);

  // ══════════════════════════════════════════════════════════════════════
  // BOUNDARY RENDERING (extracted to reusable function)
  // ══════════════════════════════════════════════════════════════════════
  const applyBoundary = (bData: any) => {
    if (!layerManagerRef.current || !mapRef.current) return;
    try {
      const geojsonFeature = {
        type: 'FeatureCollection',
        features: [{ type: 'Feature', geometry: bData.geojson, properties: bData }]
      };
      
      // Create mask
      const geomType = bData.geojson?.type;
      let validFeature = null;
      if (geomType === 'Polygon' || geomType === 'MultiPolygon') {
        validFeature = geojsonFeature.features[0];
      } else if (geomType === 'GeometryCollection') {
        const poly = bData.geojson.geometries?.find((g: any) => g.type === 'Polygon' || g.type === 'MultiPolygon');
        if (poly) validFeature = turf.feature(poly);
      }

      if (validFeature) {
        try {
          const area = turf.area(validFeature as any);
          if (area > 10000) {
            const maskFeature = turf.mask(validFeature as any);
            if (maskFeature) {
              layerManagerRef.current.updateSource('city-mask', { type: 'FeatureCollection', features: [maskFeature] });
            }
          } else {
            layerManagerRef.current.updateSource('city-mask', { type: 'FeatureCollection', features: [] });
          }
        } catch {
          layerManagerRef.current.updateSource('city-mask', { type: 'FeatureCollection', features: [] });
        }
      } else {
        layerManagerRef.current.updateSource('city-mask', { type: 'FeatureCollection', features: [] });
      }

      layerManagerRef.current.updateSource('city-boundary', geojsonFeature);
    } catch (e) {
      console.error("Failed to apply boundary:", e);
    }
  };

  useEffect(() => {
    if (!boundaryData || !mapLoaded || !mapRef.current || !layerManagerRef.current) return;
    
    // Store boundary for re-application on mode changes
    boundaryDataRef.current = boundaryData;
    applyBoundary(boundaryData);

    // Fit to boundary
    const bbox = boundaryData.boundingbox;
    if (bbox) {
      try {
        mapRef.current.fitBounds(
          [[parseFloat(bbox[2]), parseFloat(bbox[0])], [parseFloat(bbox[3]), parseFloat(bbox[1])]],
          { padding: 30, duration: 2500 }
        );
      } catch {
        mapRef.current.flyTo({ center, zoom: 13, duration: 2000 });
      }
    }
  }, [boundaryData, mapLoaded]);

  // ══════════════════════════════════════════════════════════════════════
  // MAP CONTROLS
  // ══════════════════════════════════════════════════════════════════════
  const handleZoom = (dir: "in" | "out") => {
    if (!mapRef.current) return;
    mapRef.current[dir === "in" ? "zoomIn" : "zoomOut"]();
  };

  const handleResetView = () => {
    if (!mapRef.current) return;
    if (boundaryDataRef.current?.boundingbox) {
      const bbox = boundaryDataRef.current.boundingbox;
      try {
        mapRef.current.fitBounds(
          [[parseFloat(bbox[2]), parseFloat(bbox[0])], [parseFloat(bbox[3]), parseFloat(bbox[1])]],
          { padding: 30, duration: 1500 }
        );
      } catch {
        mapRef.current.flyTo({ center, zoom: config.mapbox.defaultZoom });
      }
    } else {
      mapRef.current.flyTo({ center, zoom: config.mapbox.defaultZoom });
    }
  };

  const handleStyleChange = (styleId: string) => {
    if (!mapRef.current) return;
    setCurrentStyle(styleId);
    mapRef.current.setStyle(MAP_STYLES[styleId as keyof typeof MAP_STYLES] || MAP_STYLES.light);
    setShowStylePicker(false);
    
    mapRef.current.once("style.load", () => {
      if (layerManagerRef.current) {
        layerManagerRef.current.initializeCoreLayers(layerOpacity, dashboardMode);
        handleViewportChange();
        if (boundaryDataRef.current) {
          setTimeout(() => applyBoundary(boundaryDataRef.current), 200);
        }
      }
    });
  };

  useEffect(() => {
    const handleEvent = (e: any) => handleStyleChange(e.detail);
    window.addEventListener('change-map-style', handleEvent);
    return () => window.removeEventListener('change-map-style', handleEvent);
  }, [mapLoaded, dashboardMode]);

  // Determine active legend based on highest priority active layer
  const activeLayers = layers.filter(l => l.visible);
  // Priority: 1. LULC, 2. Flood, 3. Building Density, 4. Dist to River, 5. DEM, 6. Hillshade
  const legendPriority = ['lulc', 'flood', 'builddens', 'dist_to_river', 'dem', 'hill'];
  let activeLegendKey = 'dem';
  for (const key of legendPriority) {
    if (activeLayers.some(l => l.id === key)) {
      activeLegendKey = key;
      break;
    }
  }
  const legend = LAYER_LEGENDS[activeLegendKey] || LAYER_LEGENDS.dem;

  return (
    <div className="w-full h-full overflow-hidden relative">
      <div ref={mapContainerRef} className="w-full h-full" />

      <ScenarioSimulator 
        onScenarioChange={handleScenarioChange}
        onAIExplain={handleAIExplain}
      />

      {/* GIS Professional Toolbar — Top Left */}
      <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-xl border border-gray-200 rounded-lg shadow-lg flex flex-col z-20">
        <div className="flex p-1 border-b border-gray-100 bg-gray-50/80 rounded-t-lg">
          <button onClick={() => setActiveTool("pan")} className={`p-1.5 rounded-md mx-0.5 transition-colors ${activeTool === "pan" ? "bg-primary-500 text-white shadow-sm" : "text-gray-600 hover:bg-gray-200"}`} title="Pan (Explore)"><Hand size={15} /></button>
          <button onClick={() => setActiveTool("pointer")} className={`p-1.5 rounded-md mx-0.5 transition-colors ${activeTool === "pointer" ? "bg-primary-500 text-white shadow-sm" : "text-gray-600 hover:bg-gray-200"}`} title="Select / Pointer"><MousePointer2 size={15} /></button>
          <button onClick={() => setActiveTool("identify")} className={`p-1.5 rounded-md mx-0.5 transition-colors ${activeTool === "identify" ? "bg-primary-500 text-white shadow-sm" : "text-gray-600 hover:bg-gray-200"}`} title="Identify Features"><MousePointerClick size={15} /></button>
          <div className="w-px h-6 bg-gray-200 mx-1 my-auto" />
          <button onClick={() => setActiveTool("measure-dist")} className={`p-1.5 rounded-md mx-0.5 transition-colors ${activeTool === "measure-dist" ? "bg-primary-500 text-white shadow-sm" : "text-gray-600 hover:bg-gray-200"}`} title="Measure Distance"><Ruler size={15} /></button>
          <button onClick={() => setActiveTool("draw")} className={`p-1.5 rounded-md mx-0.5 transition-colors ${activeTool === "draw" ? "bg-primary-500 text-white shadow-sm" : "text-gray-600 hover:bg-gray-200"}`} title="Draw Polygon"><Square size={15} /></button>
          <div className="w-px h-6 bg-gray-200 mx-1 my-auto" />
          <button onClick={() => {}} className="p-1.5 rounded-md mx-0.5 text-gray-600 hover:bg-gray-200 transition-colors" title="Export Map (PDF)"><Printer size={15} /></button>
          <button onClick={() => {}} className="p-1.5 rounded-md mx-0.5 text-gray-600 hover:bg-gray-200 transition-colors" title="Export Map (PNG)"><Download size={15} /></button>
          <button onClick={() => setScreenshotMode(v => !v)} className={`p-1.5 rounded-md mx-0.5 transition-colors ${screenshotMode ? "bg-primary-500 text-white shadow-sm" : "text-gray-600 hover:bg-gray-200"}`} title="Screenshot Mode"><ImageIcon size={15} /></button>
        </div>
      </div>

      {/* Map Navigation Controls — Right toolbar */}
      <div className="absolute top-4 right-4 flex flex-col gap-1.5 z-20">
        <button onClick={handleResetView} className="w-8 h-8 bg-white/95 border border-gray-200 rounded-lg flex items-center justify-center text-gray-600 hover:text-primary-600 hover:bg-gray-50 transition-all shadow-sm" title="Full Extent"><Crosshair size={14} /></button>
        <button onClick={() => handleZoom("in")} className="w-8 h-8 bg-white/95 border border-gray-200 rounded-lg flex items-center justify-center text-gray-600 hover:text-primary-600 hover:bg-gray-50 transition-all shadow-sm" title="Zoom In"><ZoomIn size={14} /></button>
        <button onClick={() => handleZoom("out")} className="w-8 h-8 bg-white/95 border border-gray-200 rounded-lg flex items-center justify-center text-gray-600 hover:text-primary-600 hover:bg-gray-50 transition-all shadow-sm" title="Zoom Out"><ZoomOut size={14} /></button>
        <div className="w-full h-px bg-gray-200 my-0.5" />
        <button onClick={onToggleFullscreen} className="w-8 h-8 bg-white/95 border border-gray-200 rounded-lg flex items-center justify-center text-gray-600 hover:text-primary-600 hover:bg-gray-50 transition-all shadow-sm" title="Fullscreen">
          {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>
        <div className="relative">
          <ScreenshotMode isActive={screenshotMode} onToggle={() => setScreenshotMode(v => !v)} dashboardMode={dashboardMode} currentLocation={currentLocation} mapRef={mapRef} />
        </div>
      </div>
      
      {/* Legend — sleek ArcGIS style */}
      {activeLayers.length > 0 && (
        <div className="absolute bottom-6 right-4 bg-white border border-gray-200 rounded shadow-md p-4 z-20 min-w-[160px]">
          {/* North Arrow */}
          <div className="flex justify-center mb-4">
            <div className="relative w-8 h-8">
              <svg viewBox="0 0 36 36" className="w-full h-full">
                <circle cx="18" cy="18" r="17" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1"/>
                <polygon points="18,3 14,20 18,17" fill="#3b82f6"/>
                <polygon points="18,33 22,16 18,19" fill="#94a3b8"/>
                <text x="18" y="9" textAnchor="middle" fontSize="6" fontWeight="bold" fill="#1e293b" fontFamily="Inter">N</text>
              </svg>
            </div>
          </div>
          <p className="text-[11px] font-bold text-gray-900 uppercase tracking-wide mb-3">{legend.title}</p>
          <div className="space-y-2">
            {legend.items.map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-[11px] text-gray-700 font-medium">
                <div className="w-3 h-3 rounded-sm flex-shrink-0 shadow-sm border border-black/10" style={{ backgroundColor: item.color }} />
                {item.label}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Advanced Coordinate Panel — Bottom Center/Left */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[15] pointer-events-none flex flex-col gap-1 items-center">
        {isViewportLoading && (
          <div className="bg-white/95 backdrop-blur-md border border-gray-200 shadow-lg rounded-full px-4 py-1.5 flex items-center gap-2 mb-2 shadow-[0_0_15px_rgba(0,0,0,0.1)]">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-3.5 h-3.5 border-2 border-primary-200 border-t-primary-600 rounded-full" />
            <span className="text-[11px] font-bold text-primary-600 tracking-wide uppercase">Processing GIS Request...</span>
          </div>
        )}
        <div className="bg-white/95 backdrop-blur-md border border-gray-200 shadow-sm rounded-md px-4 py-2 flex items-center gap-4 pointer-events-auto">
          <div className="flex items-center gap-2 border-r border-gray-200 pr-4">
            <Navigation size={12} className="text-gray-500" />
            <span className="text-[11px] font-mono text-gray-700 font-medium tracking-wide">
              {cursorCoords ? `${cursorCoords.lat.toFixed(5)}°N, ${cursorCoords.lng.toFixed(5)}°E` : `${center[1].toFixed(5)}°N, ${center[0].toFixed(5)}°E`}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-gray-500 font-mono">
            <span title="Zoom Level">Z: {zoomLevel.toFixed(1)}</span>
            <span title="Coordinate Reference System">EPSG:3857 (Web Mercator)</span>
          </div>
        </div>
      </div>

      {/* Loading overlay */}
      {!mapLoaded && !mapError && (
        <div className="absolute inset-0 bg-geo-dark/80 flex items-center justify-center z-30">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-10 h-10 border-2 border-primary-500/30 border-t-primary-500 rounded-full"
          />
        </div>
      )}
    </div>
  );
}
