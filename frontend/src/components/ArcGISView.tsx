"use client";

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, X, AlertTriangle, Info, MapPin, Activity, ShieldAlert, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { config } from "@/lib/config";

interface ArcGISViewProps {
  center: [number, number];
  zoom: number;
}

interface AnalysisResult {
  elevation: string;
  slope: string;
  distanceToRiver: number;
  buildingDensity: string;
  lulc: string;
  riskScore: number;
  overallRisk: "Low" | "Medium" | "High" | "Critical";
  explanation: string;
  ward: string;
  nearestRoad: string;
  factors: { name: string; value: number; color: string }[];
}

export default function ArcGISView({ center, zoom }: ArcGISViewProps) {
  const mapDiv = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    let view: any;
    let isMounted = true;

    const initMap = async () => {
      try {
        const loadEsriModules = (): Promise<any[]> => {
          return new Promise((resolve, reject) => {
            const load = () => {
              (window as any).require([
                "esri/Map", "esri/views/MapView", "esri/widgets/LayerList", "esri/widgets/Legend",
                "esri/widgets/BasemapGallery", "esri/widgets/Search", "esri/widgets/Home", "esri/widgets/Locate",
                "esri/widgets/DistanceMeasurement2D", "esri/widgets/AreaMeasurement2D", "esri/widgets/Fullscreen",
                "esri/widgets/CoordinateConversion", "esri/widgets/ScaleBar", "esri/widgets/Expand",
                "esri/layers/FeatureLayer", "esri/layers/ImageryTileLayer", "esri/layers/GeoJSONLayer", "esri/Graphic", "esri/geometry/geometryEngine", "esri/config"
              ], (...modules: any[]) => resolve(modules));
            };

            if ((window as any).require) {
              load();
            } else {
              const existingScript = document.getElementById("arcgis-script");
              if (existingScript) {
                existingScript.addEventListener("load", load);
              } else {
                const script = document.createElement("script");
                script.id = "arcgis-script";
                script.src = "https://js.arcgis.com/4.29/";
                script.onload = load;
                script.onerror = reject;
                document.head.appendChild(script);
              }
            }
          });
        };

        const [
          Map, MapView, LayerList, Legend, BasemapGallery, Search, Home, Locate,
          DistanceMeasurement2D, AreaMeasurement2D, Fullscreen, CoordinateConversion,
          ScaleBar, Expand, FeatureLayer, ImageryTileLayer, GeoJSONLayer, Graphic, geometryEngine, esriConfig
        ] = await loadEsriModules();

        if (!isMounted) return;

        const apiKey = process.env.NEXT_PUBLIC_ARCGIS_API_KEY || "AAPTafZe9f1Ck0zrtMWMSlAOG2A..1UwPztoHTgZqeCgqZqtluwJBIxSDzvHfFsTpFN90B3bintOqb4GGNeSfbH-B-9Fh8mtuUHp4kaO_1caFUrwDlI_vklkN6gOpz2PYhlqds97iTA8JFTqfGbrQNfk8GEBXeHNWE3Q76oTBzdMYDVde0KgsPCY4MniFr_4FdfXDZsvkbgyzzss0X2vafiyDqtV0hTAKdAUoJYMiee93U2zpTzIwkT5ra7skNyhPOD5_ucD-zGDnwu-hp6rUGCo.AT1_0cMEdHxJ";
        esriConfig.apiKey = apiKey;

        const map = new Map({ basemap: "arcgis-dark-gray" });

        // LAYERS
        const baseUrl = config?.api?.baseUrl || "http://localhost:8000";
        
        // Switched from unsupported static raw TIFs to real Vector GeoJSON layers for perfect rendering
        const createVectorLayer = (title: string, filename: string, color: string, outlineColor: string, visible: boolean = true) => {
          return new GeoJSONLayer({
            url: `${baseUrl}/api/geojson/${filename}`,
            title: title,
            visible: visible,
            renderer: {
              type: "simple",
              symbol: {
                type: "simple-fill",
                color: color,
                outline: { color: outlineColor, width: 1 }
              }
            } as any
          });
        };

        const createLineLayer = (title: string, filename: string, color: string, visible: boolean = true) => {
          return new GeoJSONLayer({
            url: `${baseUrl}/api/geojson/${filename}`,
            title: title,
            visible: visible,
            renderer: {
              type: "simple",
              symbol: {
                type: "simple-line",
                color: color,
                width: 2
              }
            } as any
          });
        };

        const bldgLayer = createVectorLayer("Pune Buildings", "pune_buildings.json", "rgba(100, 116, 139, 0.4)", "rgba(148, 163, 184, 0.6)", true);
        const riverLayer = createLineLayer("River Network", "pune_rivers.json", "#3b82f6", true);
        const roadLayer = createLineLayer("Road Infrastructure", "pune_roads.json", "#64748b", true);
        const hospitalLayer = new GeoJSONLayer({
            url: `${baseUrl}/api/geojson/pune_hospitals.json`,
            title: "Hospitals",
            renderer: { type: "simple", symbol: { type: "simple-marker", color: "#ef4444", size: "8px", outline: { color: "#ffffff", width: 1 } } } as any
        });
        const schoolLayer = new GeoJSONLayer({
            url: `${baseUrl}/api/geojson/pune_schools.json`,
            title: "Schools",
            renderer: { type: "simple", symbol: { type: "simple-marker", color: "#f59e0b", size: "8px", outline: { color: "#ffffff", width: 1 } } } as any
        });

        map.addMany([bldgLayer, riverLayer, roadLayer, hospitalLayer, schoolLayer]);

        view = new MapView({
          container: mapDiv.current as HTMLDivElement,
          map: map,
          center: center,
          zoom: zoom,
          popup: { autoOpenEnabled: false }, // DSS Panel takes over
          ui: { components: ["attribution", "zoom"] }
        });

        view.when(() => {
          setIsLoaded(true);
          
          // Core Widgets
          view.ui.add(new Search({ view }), "top-right");
          view.ui.add(new Home({ view }), "top-left");
          (window as any).require(["esri/widgets/Zoom"], (Zoom: any) => {
            view.ui.add(new Zoom({ view }), "top-left");
          });
          view.ui.add(new Locate({ view }), "top-left");
          view.ui.add(new Fullscreen({ view }), "top-left");

          const measureDist = new DistanceMeasurement2D({ view });
          const measureDistExpand = new Expand({ view, content: measureDist, expandIconClass: "esri-icon-measure-line", group: "top-left" });
          view.ui.add(measureDistExpand, "top-left");

          const measureArea = new AreaMeasurement2D({ view });
          const measureAreaExpand = new Expand({ view, content: measureArea, expandIconClass: "esri-icon-measure-area", group: "top-left" });
          view.ui.add(measureAreaExpand, "top-left");

          const layerListExpand = new Expand({ view, content: new LayerList({ view }), expandIconClass: "esri-icon-layers", group: "top-left" });
          view.ui.add(layerListExpand, "top-left");

          const legendExpand = new Expand({ view, content: new Legend({ view }), expandIconClass: "esri-icon-legend", group: "top-left" });
          view.ui.add(legendExpand, "top-left");

          const galleryExpand = new Expand({ view, content: new BasemapGallery({ view }), expandIconClass: "esri-icon-basemap", group: "top-left" });
          view.ui.add(galleryExpand, "top-left");

          view.ui.add(new ScaleBar({ view, unit: "metric" }), "bottom-left");
          view.ui.add(new CoordinateConversion({ view }), "bottom-right");

          // ==============================================================================
          // REAL-TIME SPATIAL ANALYSIS (DSS ENGINE)
          // ==============================================================================
          view.on("click", async (event: any) => {
            setAnalysisLoading(true);
            setAnalysisResult(null);

            try {
              const point = event.mapPoint;
              
              // Highlight cell
              view.graphics.removeAll();
              const graphic = new Graphic({
                geometry: point,
                symbol: {
                  type: "simple-marker",
                  color: [59, 130, 246, 0.5], // Blue highlight
                  outline: { color: "#3b82f6", width: 2 },
                  size: "16px"
                }
              });
              view.graphics.add(graphic);
              
              // Call the backend GIS Analysis Engine
              const baseUrl = config?.api?.baseUrl || "http://localhost:8000";
              const response = await fetch(`${baseUrl}/api/location-analysis?lat=${point.latitude}&lon=${point.longitude}`);
              
              if (!response.ok) {
                throw new Error("Failed to fetch GIS analysis data");
              }
              
              const data = await response.json();
              
              const elevationVal = data["Elevation"] ?? 0;
              const slopeVal = data["Slope"] ?? 0;
              const distToRiver = data["Distance to River"] ?? 0;
              const lulcType = data["Land Cover"] || "Unknown";
              const floodSusceptibility = data["Flood Susceptibility"] ?? 0;
              const buildingDensity = data["Building Density"] ?? 0;
              const wardName = data["Ward"] || "Unknown";
              const nearestRoad = data["Nearest Road"] ? `${data["Nearest Road"]}m` : "Unknown";
              
              // Parse backend risk level string
              let score = Math.round(floodSusceptibility * 100);
              let riskCat: "Low" | "Medium" | "High" | "Critical" = "Low";
              
              if (score > 80 || (distToRiver > 0 && distToRiver < 300 && elevationVal < 550)) {
                riskCat = "Critical";
                score = Math.max(score, 85);
              } else if (score > 60 || (distToRiver > 0 && distToRiver < 500)) {
                riskCat = "High";
                score = Math.max(score, 65);
              } else if (score > 30 || (distToRiver > 0 && distToRiver < 1000)) {
                riskCat = "Medium";
                score = Math.max(score, 40);
              }

              const explanation = `${data["Risk Explanation"]} ${data["Recommended Action"]}`;

              const resultData: AnalysisResult = {
                elevation: `${elevationVal.toFixed(1)}m`,
                slope: `${slopeVal.toFixed(1)}°`,
                distanceToRiver: Math.round(distToRiver),
                buildingDensity: buildingDensity > 0.5 ? "High" : buildingDensity > 0.2 ? "Medium" : "Low",
                lulc: lulcType,
                riskScore: score,
                overallRisk: riskCat,
                explanation: explanation,
                ward: wardName,
                nearestRoad: nearestRoad,
                factors: [
                  { name: "Elevation", value: Math.max(0, Math.min(100, 100 - (elevationVal - 530)*5)), color: "#8b5cf6" },
                  { name: "Proximity", value: distToRiver === 0 ? 0 : Math.max(0, Math.min(100, 100 - (distToRiver/20))), color: "#3b82f6" },
                  { name: "Density", value: buildingDensity > 0.5 ? 90 : buildingDensity > 0.2 ? 60 : 20, color: "#f59e0b" },
                  { name: "Flood Zone", value: Math.round(floodSusceptibility * 100), color: "#ef4444" }
                ]
              };

              setAnalysisResult(resultData);
              setAnalysisLoading(false);

            } catch (err) {
              console.error("Spatial Analysis Failed", err);
              setAnalysisLoading(false);
            }
          });
        });

      } catch (err) {
        console.error("ArcGIS Maps SDK Initialization Failed:", err);
      }
    };

    initMap();

    return () => {
      isMounted = false;
      if (view) view.destroy();
    };
  }, []);

  return (
    <div className="w-full h-full relative border-t border-gray-200 overflow-hidden bg-gray-50">
      <style>{`
        @import url('https://js.arcgis.com/4.29/esri/themes/light/main.css');
        .esri-widget { font-family: 'Inter', sans-serif !important; border-radius: 8px !important; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1) !important; }
        .esri-expand__content { border-radius: 8px !important; overflow: hidden; }
        .esri-view .esri-view-surface:focus::after { outline: none !important; }
      `}</style>

      <div ref={mapDiv} className="w-full h-full" />
      
      {/* DSS Analysis Overlay */}
      <AnimatePresence>
        {(analysisLoading || analysisResult) && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute top-4 right-16 w-96 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-2xl z-40 overflow-hidden flex flex-col max-h-[calc(100%-2rem)]"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
                  <Activity size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Spatial DSS Analysis</h3>
                  <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Real-time Geoprocessing</p>
                </div>
              </div>
              <button 
                onClick={() => { setAnalysisResult(null); setAnalysisLoading(false); }}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 overflow-y-auto custom-scrollbar">
              {analysisLoading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                  <p className="text-sm font-medium text-slate-600 animate-pulse">Running Geoprocessing Models...</p>
                </div>
              ) : analysisResult ? (
                <div className="space-y-6">
                  {/* Score Card */}
                  <div className={`rounded-xl p-4 border ${
                    analysisResult.overallRisk === 'Critical' ? 'bg-red-50 border-red-200' :
                    analysisResult.overallRisk === 'High' ? 'bg-orange-50 border-orange-200' :
                    analysisResult.overallRisk === 'Medium' ? 'bg-yellow-50 border-yellow-200' :
                    'bg-green-50 border-green-200'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: analysisResult.overallRisk === 'Critical' ? '#b91c1c' : '#0f172a' }}>
                          Overall Risk Level
                        </p>
                        <h2 className={`text-3xl font-black ${
                          analysisResult.overallRisk === 'Critical' ? 'text-red-600' :
                          analysisResult.overallRisk === 'High' ? 'text-orange-600' :
                          analysisResult.overallRisk === 'Medium' ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {analysisResult.overallRisk}
                        </h2>
                      </div>
                      <div className="text-right">
                        <span className="text-4xl font-black text-slate-800">{analysisResult.riskScore}</span>
                        <span className="text-sm font-bold text-slate-400">/100</span>
                      </div>
                    </div>
                    <p className="text-sm mt-3 font-medium text-slate-700 leading-relaxed border-t border-black/5 pt-3">
                      {analysisResult.explanation}
                    </p>
                  </div>

                  {/* Chart */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <BarChart3 size={14} className="text-blue-600"/> Risk Contributors
                    </h4>
                    <div className="h-40 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analysisResult.factors} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} layout="vertical">
                          <XAxis type="number" hide domain={[0, 100]} />
                          <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} />
                          <Tooltip 
                            cursor={{ fill: '#f8fafc' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 600 }}
                            formatter={(val: number) => [`${val}% Impact`, "Contribution"]}
                          />
                          <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={12}>
                            {analysisResult.factors.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Detailed Metrics */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <MapPin size={14} className="text-blue-600"/> Environmental Topology
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg col-span-2">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ward Boundary</span>
                        <span className="block text-sm font-semibold text-slate-800 mt-0.5">{analysisResult.ward}</span>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nearest Road</span>
                        <span className="block text-sm font-semibold text-slate-800 mt-0.5">{analysisResult.nearestRoad}</span>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dist. to River</span>
                        <span className="block text-sm font-semibold text-slate-800 mt-0.5">{analysisResult.distanceToRiver} m</span>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Elevation</span>
                        <span className="block text-sm font-semibold text-slate-800 mt-0.5">{analysisResult.elevation}</span>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">LULC</span>
                        <span className="block text-sm font-semibold text-slate-800 mt-0.5">{analysisResult.lulc}</span>
                      </div>
                    </div>
                  </div>

                </div>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isLoaded && (
        <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center z-30 backdrop-blur-md">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-14 h-14 border-4 border-blue-100 border-t-blue-600 rounded-full mx-auto mb-4"
          />
          <h3 className="text-slate-800 font-bold text-sm tracking-wide">ARCGIS ENTERPRISE</h3>
          <p className="text-slate-500 text-xs mt-1">Loading spatial data catalog...</p>
        </div>
      )}
    </div>
  );
}
