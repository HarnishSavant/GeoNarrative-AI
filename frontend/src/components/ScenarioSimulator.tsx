"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CloudRain, Waves, Activity, Sparkles, ChevronDown, ChevronUp } from "lucide-react";

interface ScenarioSimulatorProps {
  onScenarioChange: (multiplier: number, details: any) => void;
  onAIExplain: (details: any) => void;
}

export default function ScenarioSimulator({ onScenarioChange, onAIExplain }: ScenarioSimulatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [rainfall, setRainfall] = useState<number>(0);
  const [riverOverflow, setRiverOverflow] = useState<boolean>(false);
  const [drainageFailure, setDrainageFailure] = useState<boolean>(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Debounced scenario change to avoid hammering Mapbox setPaintProperty
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      let m = 1.0;
      m += rainfall / 100;
      if (riverOverflow) m += 0.3;
      if (drainageFailure) m += 0.3;
      onScenarioChange(m, { rainfall, riverOverflow, drainageFailure });
    }, 150);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [rainfall, riverOverflow, drainageFailure, onScenarioChange]);

  const handleExplain = useCallback(() => {
    onAIExplain({ rainfall, riverOverflow, drainageFailure });
  }, [rainfall, riverOverflow, drainageFailure, onAIExplain]);

  return (
    <div className="absolute left-3 bottom-24 z-20 w-56 bg-[#080a14]/92 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-primary-500/15 to-cyan-500/15 border-b border-white/8 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Activity size={13} className="text-primary-400" />
          <span className="text-[10px] font-bold text-gray-200 uppercase tracking-wider">Scenario</span>
        </div>
        {isOpen ? <ChevronUp size={12} className="text-gray-400" /> : <ChevronDown size={12} className="text-gray-400" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-3 space-y-3">
              {/* Rainfall */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                  <CloudRain size={10} className="text-cyan-400" /> Rainfall
                </label>
                <div className="flex gap-1">
                  {[0, 10, 20, 40].map((val) => (
                    <button
                      key={val}
                      onClick={() => setRainfall(val)}
                      className={`flex-1 py-1 text-[9px] rounded border font-medium transition-all ${
                        rainfall === val
                          ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                          : "bg-black/20 text-gray-500 border-white/5 hover:border-white/15 hover:text-gray-300"
                      }`}
                    >
                      {val === 0 ? "Base" : `+${val}%`}
                    </button>
                  ))}
                </div>
              </div>

              {/* River Overflow */}
              <div className="flex items-center justify-between bg-black/20 px-2 py-1.5 rounded border border-white/5">
                <label className="text-[9px] font-bold text-gray-400 flex items-center gap-1">
                  <Waves size={10} className="text-blue-400" /> River Overflow
                </label>
                <button 
                  onClick={() => setRiverOverflow(!riverOverflow)}
                  className={`w-7 h-3.5 rounded-full transition-all relative ${riverOverflow ? "bg-primary-500" : "bg-gray-700"}`}
                >
                  <motion.div 
                    className="w-2.5 h-2.5 bg-white rounded-full absolute top-0.5 shadow-sm"
                    animate={{ left: riverOverflow ? 16 : 2 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>

              {/* Drainage Failure */}
              <div className="flex items-center justify-between bg-black/20 px-2 py-1.5 rounded border border-white/5">
                <label className="text-[9px] font-bold text-gray-400 flex items-center gap-1">
                  <Activity size={10} className="text-amber-400" /> Drainage Fail
                </label>
                <button 
                  onClick={() => setDrainageFailure(!drainageFailure)}
                  className={`w-7 h-3.5 rounded-full transition-all relative ${drainageFailure ? "bg-amber-500" : "bg-gray-700"}`}
                >
                  <motion.div 
                    className="w-2.5 h-2.5 bg-white rounded-full absolute top-0.5 shadow-sm"
                    animate={{ left: drainageFailure ? 16 : 2 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>

              <button 
                onClick={handleExplain}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-gradient-to-r from-primary-600 to-cyan-600 hover:from-primary-500 hover:to-cyan-500 text-white rounded-lg text-[9px] font-bold shadow-lg shadow-primary-900/40 transition-all"
              >
                <Sparkles size={10} />
                AI Explanation
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
