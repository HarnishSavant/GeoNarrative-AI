"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Eye,
  EyeOff,
  Droplets,
  Flame,
  Waves,
  Building2,
  Mountain,
  Users,
  Route,
  Shield,
} from "lucide-react";
import { MapLayer } from "@/lib/types";

interface MapLayersPanelProps {
  layers: MapLayer[];
  onToggleLayer: (layerId: string) => void;
  layerOpacity: number;
  onOpacityChange: (opacity: number) => void;
}

const iconMap: Record<string, React.ReactNode> = {
  droplets: <Droplets size={14} />,
  flame: <Flame size={14} />,
  waves: <Waves size={14} />,
  building: <Building2 size={14} />,
  mountain: <Mountain size={14} />,
  users: <Users size={14} />,
  route: <Route size={14} />,
  shield: <Shield size={14} />,
};

export default function MapLayersPanel({ 
  layers, 
  onToggleLayer,
  layerOpacity,
  onOpacityChange
}: MapLayersPanelProps) {
  return (
    <div className="p-4 space-y-3 h-full overflow-y-auto custom-scrollbar">
      <h3 className="text-sm font-semibold text-gray-200">Map Layers</h3>
      <p className="text-xs text-gray-500">Toggle data layers on the map</p>

      <div className="space-y-1.5">
        {layers.map((layer, i) => (
          <motion.div
            key={layer.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => onToggleLayer(layer.id)}
            className="layer-toggle group"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                style={{
                  backgroundColor: layer.visible ? `${layer.color}20` : "rgba(55,65,81,0.3)",
                  color: layer.visible ? layer.color : "#6b7280",
                }}
              >
                {iconMap[layer.icon] || <Droplets size={14} />}
              </div>
              <div>
                <p
                  className={`text-xs font-medium transition-colors ${
                    layer.visible ? "text-gray-200" : "text-gray-500"
                  }`}
                >
                  {layer.name}
                </p>
                <p className="text-[10px] text-gray-600">{layer.description}</p>
              </div>
            </div>
            <div
              className={`w-8 h-4 rounded-full transition-all duration-300 flex items-center ${
                layer.visible ? "bg-primary-600 justify-end" : "bg-gray-700 justify-start"
              }`}
            >
              <motion.div
                layout
                className="w-3 h-3 rounded-full bg-white mx-0.5 shadow"
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Opacity control */}
      <div className="glass-card p-3 mt-4 space-y-2">
        <div className="flex justify-between items-center">
          <p className="text-xs font-medium text-gray-300">Layer Opacity</p>
          <span className="text-[10px] font-mono text-primary-400 font-semibold">{Math.round(layerOpacity * 100)}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(layerOpacity * 100)}
          onChange={(e) => onOpacityChange(Number(e.target.value) / 100)}
          className="w-full h-1 bg-gray-700 rounded-full appearance-none cursor-pointer accent-primary-500"
        />
        <div className="flex justify-between text-[10px] text-gray-500">
          <span>0%</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
}
