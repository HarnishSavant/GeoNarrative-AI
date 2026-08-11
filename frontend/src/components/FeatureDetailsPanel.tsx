"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Activity, ShieldAlert, Crosshair, ArrowRight } from "lucide-react";
import { useInteractionStore } from "@/store/interactionStore";

export default function FeatureDetailsPanel() {
  const activeFeature = useInteractionStore(state => state.activeFeature);
  const clearSelection = useInteractionStore(state => state.clearSelection);

  if (!activeFeature) return null;

  const isRiskZone = activeFeature.risk_class !== undefined && activeFeature.hex_count !== undefined;
  const isFacility = activeFeature.type !== undefined && activeFeature.fsi_score !== undefined;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="absolute bottom-16 left-4 w-80 bg-[#0f172a]/95 backdrop-blur-xl border border-primary-500/30 rounded-xl shadow-2xl z-40 overflow-hidden pointer-events-auto"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-gradient-to-r from-primary-900/40 to-transparent">
          <div className="flex items-center gap-2 text-primary-400">
            <Crosshair size={16} className="animate-pulse" />
            <h3 className="font-bold text-xs tracking-widest uppercase">Target Intersect</h3>
          </div>
          <button 
            onClick={clearSelection}
            className="text-gray-400 hover:text-white transition-colors p-1"
          >
            <X size={14} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-100">
                {activeFeature.name || activeFeature.id || "Spatial Feature"}
              </h2>
              <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">
                {activeFeature.type || activeFeature.sourceLayer || "Polygon Geometry"}
              </p>
            </div>
            {activeFeature.risk_class && (
              <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                activeFeature.risk_class === 'Very High' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                activeFeature.risk_class === 'High' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                activeFeature.risk_class === 'Moderate' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}>
                {activeFeature.risk_class} Risk
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 bg-black/40 rounded-xl border border-white/5">
              <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                <MapPin size={12} />
                <span className="text-[10px] uppercase">Coordinates</span>
              </div>
              <p className="text-xs font-mono text-gray-200">
                {activeFeature.longitude ? parseFloat(activeFeature.longitude).toFixed(4) : "N/A"}, 
                {activeFeature.latitude ? parseFloat(activeFeature.latitude).toFixed(4) : "N/A"}
              </p>
            </div>
            
            <div className="p-3 bg-black/40 rounded-xl border border-white/5">
              <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                <Activity size={12} />
                <span className="text-[10px] uppercase">Vulnerability</span>
              </div>
              <p className="text-xs font-mono text-gray-200">
                {activeFeature.fsi_score ? `FSI: ${parseFloat(activeFeature.fsi_score).toFixed(2)}` : "Baseline"}
              </p>
            </div>
          </div>

          {isRiskZone && (
            <div className="p-3 bg-primary-500/10 rounded-xl border border-primary-500/20 space-y-2">
              <div className="flex items-center gap-1.5 text-primary-400">
                <ShieldAlert size={14} />
                <span className="text-xs font-bold uppercase tracking-wider">Exposure Metrics</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                  <span className="block text-lg font-bold text-gray-200">{activeFeature.hex_count || 1}</span>
                  <span className="text-[9px] text-gray-500 uppercase">Hexagons</span>
                </div>
                <div className="text-center">
                  <span className="block text-lg font-bold text-gray-200">{activeFeature.buildings_exposed || "N/A"}</span>
                  <span className="text-[9px] text-gray-500 uppercase">Buildings</span>
                </div>
                <div className="text-center">
                  <span className="block text-lg font-bold text-gray-200">{activeFeature.critical_assets || "N/A"}</span>
                  <span className="text-[9px] text-gray-500 uppercase">Critical</span>
                </div>
              </div>
            </div>
          )}

          {isFacility && (
             <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
               <h4 className="text-[10px] uppercase font-bold text-blue-400 mb-2">Spatial Relationships</h4>
               <ul className="space-y-1.5 text-xs text-gray-300">
                 <li className="flex items-center gap-2">
                   <ArrowRight size={10} className="text-blue-500" />
                   Intersecting Flood Zone: <strong>{activeFeature.risk_class}</strong>
                 </li>
                 <li className="flex items-center gap-2">
                   <ArrowRight size={10} className="text-blue-500" />
                   Distance to Waterway: <strong>{activeFeature.distance_to_water ? `${activeFeature.distance_to_water}m` : "Calculating..."}</strong>
                 </li>
               </ul>
             </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
