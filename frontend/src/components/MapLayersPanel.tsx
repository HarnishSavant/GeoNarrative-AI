"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Droplets, Flame, Waves, Building2, Mountain, Users, Route, Shield, ChevronDown, TreePine, Map, CloudRain, Sun, Moon, Satellite,
} from "lucide-react";
import { MapLayer } from "@/lib/types";

interface MapLayersPanelProps {
  layers: MapLayer[];
  onToggleLayer: (layerId: string) => void;
  layerOpacity: number;
  onOpacityChange: (opacity: number) => void;
}

const iconMap: Record<string, React.ReactNode> = {
  droplets: <Droplets size={13} />,
  "cloud-rain": <CloudRain size={13} />,
  flame: <Flame size={13} />,
  waves: <Waves size={13} />,
  building: <Building2 size={13} />,
  mountain: <Mountain size={13} />,
  users: <Users size={13} />,
  route: <Route size={13} />,
  shield: <Shield size={13} />,
  tree: <TreePine size={13} />,
  map: <Map size={13} />,
};

// Group layers by category — using actual layer IDs from getLayersForMode
const LAYER_GROUPS: Record<string, { title: string; color: string; ids: string[] }> = {
  base: { title: "Base Layers", color: "#6366f1", ids: ["city-boundary", "study-area", "boundary", "dem"] },
  hydro: { title: "Hydrology & Risk", color: "#3b82f6", ids: ["rainfall", "rivers", "waterways", "flood-risk", "flood_risk"] },
  infra: { title: "Infrastructure", color: "#10b981", ids: ["buildings", "roads", "road-network", "lulc", "land-use"] },
  social: { title: "Social & Environment", color: "#f59e0b", ids: ["population", "population-density", "ndvi"] },
};

function getGroupForLayer(layerId: string): string {
  for (const [key, group] of Object.entries(LAYER_GROUPS)) {
    if (group.ids.some(id => layerId.toLowerCase().includes(id))) return key;
  }
  return "base";
}

export default function MapLayersPanel({ layers, onToggleLayer, layerOpacity, onOpacityChange }: MapLayersPanelProps) {
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({ base: true, hydro: true, infra: true, social: true });
  const [activeBasemap, setActiveBasemap] = React.useState("light");

  const basemaps = [
    { id: "light", label: "Light", icon: <Sun size={12} /> },
    { id: "dark", label: "Dark", icon: <Moon size={12} /> },
    { id: "satellite", label: "Satellite", icon: <Satellite size={12} /> },
    { id: "outdoors", label: "Terrain", icon: <Mountain size={12} /> },
  ];

  const changeBasemap = (id: string) => {
    setActiveBasemap(id);
    window.dispatchEvent(new CustomEvent('change-map-style', { detail: id }));
  };

  const grouped = useMemo(() => {
    const groups: Record<string, MapLayer[]> = {};
    layers.forEach(layer => {
      const g = getGroupForLayer(layer.id);
      if (!groups[g]) groups[g] = [];
      groups[g].push(layer);
    });
    return groups;
  }, [layers]);

  const activeCount = layers.filter(l => l.visible).length;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wider">Map Layers</h3>
            <p className="text-[9px] text-gray-600 mt-0.5">{activeCount} of {layers.length} active</p>
          </div>
        </div>
      </div>

      {/* Basemap Selector */}
      <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Base Map Style</h3>
        <div className="grid grid-cols-2 gap-2">
          {basemaps.map((b) => (
            <button key={b.id} onClick={() => changeBasemap(b.id)}
              className={`flex items-center justify-center gap-2 px-2 py-1.5 rounded text-[11px] font-medium transition-all ${
                activeBasemap === b.id ? 'bg-primary-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              {b.icon} {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grouped Layers */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-3 space-y-1">
        {Object.entries(LAYER_GROUPS).map(([key, groupDef]) => {
          const groupLayers = grouped[key];
          if (!groupLayers || groupLayers.length === 0) return null;
          const isExpanded = expanded[key] !== false;
          const activeInGroup = groupLayers.filter(l => l.visible).length;

          return (
            <div key={key} className="rounded-lg overflow-hidden">
              {/* Group Header */}
              <button onClick={() => setExpanded(p => ({ ...p, [key]: !isExpanded }))}
                className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/3 transition-colors rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: groupDef.color }} />
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{groupDef.title}</span>
                  <span className="text-[9px] text-gray-600 font-mono">{activeInGroup}/{groupLayers.length}</span>
                </div>
                <ChevronDown size={10} className={`text-gray-600 transition-transform duration-200 ${isExpanded ? '' : '-rotate-90'}`} />
              </button>

              {/* Layer Items */}
              {isExpanded && (
                <div className="space-y-0.5 pl-1 pr-1 pb-1">
                  {groupLayers.map((layer, i) => (
                    <motion.div
                      key={layer.id}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => onToggleLayer(layer.id)}
                      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-all duration-200 group ${
                        layer.visible ? 'bg-white/4 hover:bg-white/6' : 'hover:bg-white/3'
                      }`}
                    >
                      {/* Icon */}
                      <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 transition-colors"
                        style={{
                          backgroundColor: layer.visible ? `${layer.color}18` : "rgba(55,65,81,0.2)",
                          color: layer.visible ? layer.color : "#4b5563",
                        }}>
                        {iconMap[layer.icon] || <Droplets size={13} />}
                      </div>

                      {/* Label */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-[11px] font-medium transition-colors truncate ${layer.visible ? "text-gray-200" : "text-gray-500"}`}>
                          {layer.name}
                        </p>
                        <p className="text-[9px] text-gray-600 truncate">{layer.description}</p>
                      </div>

                      {/* Toggle */}
                      <div className={`w-7 h-3.5 rounded-full transition-all duration-300 flex items-center flex-shrink-0 ${
                        layer.visible ? "bg-primary-600 justify-end" : "bg-gray-700/60 justify-start"
                      }`}>
                        <motion.div layout className="w-2.5 h-2.5 rounded-full bg-white mx-0.5 shadow-sm" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Opacity Control */}
      <div className="px-4 py-3 border-t border-white/5 flex-shrink-0 bg-black/20">
        <div className="flex justify-between items-center mb-2">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Layer Opacity</p>
          <span className="text-[10px] font-mono text-primary-400 font-bold">{Math.round(layerOpacity * 100)}%</span>
        </div>
        <input type="range" min={0} max={100} value={Math.round(layerOpacity * 100)}
          onChange={(e) => onOpacityChange(Number(e.target.value) / 100)}
          className="w-full h-1 bg-gray-700/50 rounded-full appearance-none cursor-pointer accent-primary-500" />
      </div>
    </div>
  );
}
