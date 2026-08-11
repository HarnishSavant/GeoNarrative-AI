"use client";

/**
 * ScreenshotMode — Publication-Quality Map Export
 * Captures the map canvas as a high-resolution PNG for thesis figures.
 * Hides all UI chrome, overlays a professional cartographic layout,
 * and exports via the Mapbox GL canvas API.
 */

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  X,
  Download,
  Loader2,
  Image as ImageIcon,
  ChevronDown,
} from "lucide-react";
import { DashboardMode } from "@/lib/types";

interface ScreenshotModeProps {
  isActive: boolean;
  onToggle: () => void;
  dashboardMode: DashboardMode;
  currentLocation: string;
  mapRef: React.MutableRefObject<any>;
}

const FIGURE_PRESETS: { id: string; label: string; mode: DashboardMode; title: string }[] = [
  { id: "6.1", label: "Fig 6.1 — Flood Susceptibility", mode: "hydrology", title: "Flood Susceptibility Map — Pune Metropolitan Region" },
  { id: "6.2", label: "Fig 6.2 — Composite Flood Risk", mode: "hydrology", title: "Composite Flood Risk Map with 3D Extrusion" },
  { id: "6.3", label: "Fig 6.3 — Infrastructure Exposure", mode: "infrastructure", title: "Infrastructure Exposure Dashboard" },
  { id: "6.4", label: "Fig 6.4 — Terrain Digital Twin", mode: "terrain", title: "Terrain Digital Twin — 3D Elevation Model" },
  { id: "6.5", label: "Fig 6.5 — Hydrology 3D Columns", mode: "hydrology", title: "Hydrology Digital Twin — Flood Risk Hexagons" },
  { id: "6.6", label: "Fig 6.6 — Infrastructure Twin", mode: "infrastructure", title: "Infrastructure Digital Twin — Critical Assets" },
  { id: "6.7", label: "Fig 6.7 — Population Twin", mode: "population", title: "Population Digital Twin — Density Extrusion" },
  { id: "6.8", label: "Fig 6.8 — Environment Twin", mode: "environment", title: "Environment Digital Twin — NDVI Coverage" },
  { id: "6.9", label: "Fig 6.9 — GeoAI Chat", mode: "hydrology", title: "GeoAI Conversational Interface" },
  { id: "6.10", label: "Fig 6.10 — Prediction Panel", mode: "hydrology", title: "Flood Risk Prediction Dashboard" },
];

const MODE_LABELS: Record<DashboardMode, string> = {
  terrain: "Terrain Digital Twin",
  hydrology: "Hydrology Digital Twin",
  infrastructure: "Infrastructure Digital Twin",
  population: "Population Digital Twin",
  environment: "Environment Digital Twin",
};

export default function ScreenshotMode({
  isActive,
  onToggle,
  dashboardMode,
  currentLocation,
  mapRef,
}: ScreenshotModeProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [selectedFigure, setSelectedFigure] = useState(FIGURE_PRESETS[0]);
  const [showPresets, setShowPresets] = useState(false);
  const [lastCapture, setLastCapture] = useState<string | null>(null);

  const captureScreenshot = useCallback(async () => {
    if (!mapRef.current) return;
    setIsCapturing(true);

    try {
      // Wait one frame for map to render cleanly
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

      const canvas = mapRef.current.getCanvas() as HTMLCanvasElement;
      const dataURL = canvas.toDataURL("image/png", 1.0);

      // Create a new canvas with cartographic overlays
      const exportCanvas = document.createElement("canvas");
      // 4K resolution: 3840 × 2160
      const targetW = 3840;
      const targetH = 2160;
      exportCanvas.width = targetW;
      exportCanvas.height = targetH;
      const ctx = exportCanvas.getContext("2d")!;

      // Draw the map
      const img = new Image();
      img.src = dataURL;
      await new Promise((r) => { img.onload = r; });

      // Fill background
      ctx.fillStyle = "#070c1a";
      ctx.fillRect(0, 0, targetW, targetH);

      // Draw map scaled to fill canvas
      ctx.drawImage(img, 0, 0, targetW, targetH);

      // ── Title bar overlay ──
      const titleH = 80;
      const grad = ctx.createLinearGradient(0, 0, 0, titleH);
      grad.addColorStop(0, "rgba(7,12,26,0.95)");
      grad.addColorStop(1, "rgba(7,12,26,0.0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, targetW, titleH * 2);

      // Title text
      ctx.fillStyle = "#f3f4f6";
      ctx.font = "bold 42px Inter, system-ui, sans-serif";
      ctx.fillText(selectedFigure.title, 60, 52);

      // Subtitle
      ctx.fillStyle = "#9ca3af";
      ctx.font = "28px JetBrains Mono, monospace";
      ctx.fillText(
        `${MODE_LABELS[dashboardMode]} • ${currentLocation?.split(",")[0] || "Pune Metropolitan Region"}  |  GeoNarrative AI v1.0`,
        60,
        88
      );

      // ── Bottom watermark bar ──
      const bottomGrad = ctx.createLinearGradient(0, targetH - 120, 0, targetH);
      bottomGrad.addColorStop(0, "rgba(7,12,26,0.0)");
      bottomGrad.addColorStop(1, "rgba(7,12,26,0.92)");
      ctx.fillStyle = bottomGrad;
      ctx.fillRect(0, targetH - 120, targetW, 120);

      // Watermark text
      ctx.fillStyle = "#6366f1";
      ctx.font = "bold 24px Inter, system-ui, sans-serif";
      ctx.fillText("GeoNarrative AI", 60, targetH - 32);

      ctx.fillStyle = "#6b7280";
      ctx.font = "20px Inter, system-ui, sans-serif";
      ctx.fillText(
        "Agentic GeoAI Digital Twin for Flood Risk Assessment | MSc Research | Pune Metropolitan Region",
        60,
        targetH - 62
      );

      // Figure number
      ctx.fillStyle = "rgba(99,102,241,0.8)";
      ctx.font = "bold 28px Inter, system-ui, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(`Figure ${selectedFigure.id}`, targetW - 60, targetH - 32);
      ctx.textAlign = "left";

      // ── North Arrow (top-right) ──
      const nX = targetW - 100;
      const nY = 140;
      const nR = 35;
      // Outer ring
      ctx.beginPath();
      ctx.arc(nX, nY, nR + 8, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(8,10,20,0.85)";
      ctx.fill();
      ctx.strokeStyle = "rgba(99,102,241,0.4)";
      ctx.lineWidth = 2;
      ctx.stroke();
      // North arrow
      ctx.beginPath();
      ctx.moveTo(nX, nY - nR);
      ctx.lineTo(nX - 10, nY + 5);
      ctx.lineTo(nX, nY - 5);
      ctx.closePath();
      ctx.fillStyle = "#6366f1";
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(nX, nY - nR);
      ctx.lineTo(nX + 10, nY + 5);
      ctx.lineTo(nX, nY - 5);
      ctx.closePath();
      ctx.fillStyle = "#e5e7eb";
      ctx.fill();
      // N label
      ctx.fillStyle = "#f3f4f6";
      ctx.font = "bold 22px Inter";
      ctx.textAlign = "center";
      ctx.fillText("N", nX, nY + nR + 18);
      ctx.textAlign = "left";

      // Download
      const filename = `GeoNarrative_Fig${selectedFigure.id.replace(".", "_")}_${dashboardMode}_4K.png`;
      const link = document.createElement("a");
      link.href = exportCanvas.toDataURL("image/png", 1.0);
      link.download = filename;
      link.click();

      // Show preview
      setLastCapture(exportCanvas.toDataURL("image/png", 0.3));
    } catch (err) {
      console.error("Screenshot capture failed:", err);
    } finally {
      setIsCapturing(false);
    }
  }, [mapRef, dashboardMode, currentLocation, selectedFigure]);

  return (
    <>
      {/* Screenshot Mode Trigger Button */}
      <button
        onClick={onToggle}
        title="Screenshot Mode — Publication Export"
        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all border ${
          isActive
            ? "bg-primary-500/20 border-primary-500/50 text-primary-400"
            : "bg-[#080a14]/90 backdrop-blur-xl border-white/8 text-gray-400 hover:text-primary-400 hover:border-primary-500/30"
        }`}
      >
        <Camera size={14} />
      </button>

      {/* Screenshot Panel */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ duration: 0.2 }}
            className="absolute right-10 top-0 bg-[#080a14]/97 backdrop-blur-2xl border border-white/10 rounded-xl p-3 min-w-[260px] z-[10000] shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Camera size={13} className="text-primary-400" />
                <span className="text-[11px] font-bold text-gray-200 uppercase tracking-wider">
                  Screenshot Export
                </span>
              </div>
              <button
                onClick={onToggle}
                className="w-5 h-5 rounded flex items-center justify-center text-gray-500 hover:text-gray-300"
              >
                <X size={11} />
              </button>
            </div>

            {/* Figure Preset Selector */}
            <div className="mb-3 relative">
              <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Figure Preset
              </p>
              <button
                onClick={() => setShowPresets(!showPresets)}
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg bg-white/5 border border-white/8 text-[10px] text-gray-300 hover:bg-white/8 transition-colors"
              >
                <span className="truncate">{selectedFigure.label}</span>
                <ChevronDown size={10} className={`ml-1.5 flex-shrink-0 transition-transform ${showPresets ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {showPresets && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute top-full mt-1 w-full bg-[#0f172a]/98 border border-white/10 rounded-lg p-1 z-50 max-h-48 overflow-y-auto custom-scrollbar shadow-xl"
                  >
                    {FIGURE_PRESETS.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => { setSelectedFigure(p); setShowPresets(false); }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-md text-[10px] transition-colors ${
                          selectedFigure.id === p.id
                            ? "bg-primary-500/15 text-primary-300"
                            : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Figure Title */}
            <div className="mb-3">
              <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                Figure Title
              </p>
              <p className="text-[10px] text-gray-400 bg-white/3 rounded-lg px-2.5 py-2 leading-relaxed border border-white/5">
                {selectedFigure.title}
              </p>
            </div>

            {/* Export Info */}
            <div className="mb-3 grid grid-cols-2 gap-1.5">
              {[
                { label: "Resolution", value: "4K (3840×2160)" },
                { label: "Format", value: "PNG (lossless)" },
                { label: "Mode", value: MODE_LABELS[dashboardMode].split(" ")[0] },
                { label: "Overlays", value: "Title · N-Arrow · Logo" },
              ].map((item) => (
                <div key={item.label} className="bg-white/3 rounded-lg px-2 py-1.5">
                  <p className="text-[8px] text-gray-600 uppercase tracking-wider">{item.label}</p>
                  <p className="text-[9px] text-gray-300 font-medium mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>

            {/* Capture Button */}
            <button
              onClick={captureScreenshot}
              disabled={isCapturing}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-[11px] font-bold transition-all"
            >
              {isCapturing ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  Rendering 4K Export...
                </>
              ) : (
                <>
                  <Download size={12} />
                  Export Figure {selectedFigure.id}
                </>
              )}
            </button>

            {/* Last Capture Preview */}
            {lastCapture && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-2.5"
              >
                <p className="text-[9px] text-gray-500 mb-1">Last Export Preview:</p>
                <div className="rounded-lg overflow-hidden border border-white/10">
                  <img
                    src={lastCapture}
                    alt="Last screenshot"
                    className="w-full object-cover"
                  />
                </div>
                <p className="text-[8px] text-emerald-400 mt-1 flex items-center gap-1">
                  <ImageIcon size={8} />
                  Saved to Downloads
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
