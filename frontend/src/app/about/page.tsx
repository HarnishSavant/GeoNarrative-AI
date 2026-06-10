"use client";

import React from "react";
import MarketingLayout from "@/components/MarketingLayout";
import { motion } from "framer-motion";
import { Globe2, Users, Database, Shield, Zap } from "lucide-react";

export default function AboutPage() {
  return (
    <MarketingLayout title="About Us">
      <div className="max-w-4xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 text-center mb-20"
        >
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
            Pioneering the <span className="text-primary-400">Digital Hazard Twin</span>
          </h1>
          <p className="text-base text-gray-400 leading-relaxed max-w-2xl mx-auto">
            GeoNarrative AI was founded on a simple principle: municipal planners, civil engineers, and emergency responders deserve commercial-grade spatial intelligence that doesn't require a PhD to operate.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-20">
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-white border-l-4 border-primary-500 pl-4">Our Mission</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              We bridge the gap between heavy enterprise GIS rendering and agile Generative AI reasoning. By combining Mapbox vector GL mapping with live PostGIS intersection algorithms, we provide instant multi-domain mitigation directives.
            </p>
            <p className="text-sm text-gray-400 leading-relaxed">
              Our stacking ensemble predictor fits Random Forest and XGBoost model parameters to forecast drainage capacity and infrastructure hazards before they occur.
            </p>
          </div>
          <div className="glass-premium p-8 rounded-2xl border border-white/10 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary-500/20 blur-3xl rounded-full pointer-events-none" />
            <div className="grid grid-cols-2 gap-6 relative z-10">
              <div className="space-y-2">
                <Database className="text-cyan-400" size={24} />
                <h4 className="font-bold text-white text-lg">10ms</h4>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-mono">Query Latency</p>
              </div>
              <div className="space-y-2">
                <Shield className="text-violet-400" size={24} />
                <h4 className="font-bold text-white text-lg">99.8%</h4>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-mono">Spatial Match</p>
              </div>
              <div className="space-y-2">
                <Users className="text-emerald-400" size={24} />
                <h4 className="font-bold text-white text-lg">Enterprise</h4>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-mono">SaaS Grade</p>
              </div>
              <div className="space-y-2">
                <Zap className="text-amber-400" size={24} />
                <h4 className="font-bold text-white text-lg">XGBoost</h4>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-mono">Ensemble AI</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8 bg-geo-card/30 border border-geo-border p-8 rounded-2xl">
          <h3 className="text-xl font-bold text-white text-center">Built for Scale</h3>
          <p className="text-sm text-gray-400 text-center max-w-2xl mx-auto leading-relaxed">
            Whether you are analyzing a small neighborhood corridor for traffic friction, or calculating the hydrological stress on a city-wide power grid, GeoNarrative scales seamlessly across the cloud to deliver answers instantly.
          </p>
        </div>
      </div>
    </MarketingLayout>
  );
}
