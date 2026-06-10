"use client";

import React from "react";
import MarketingLayout from "@/components/MarketingLayout";
import { Layers, Database, ShieldAlert, BrainCircuit, Globe2 } from "lucide-react";

export default function FeaturesPage() {
  const features = [
    {
      title: "3D Mapbox GL Rendering",
      desc: "Render multi-polygon risk boundaries, extruded structural footprints, and high-pitch terrain contours in real time. Full Mapbox enterprise integration.",
      icon: <Globe2 size={24} className="text-blue-400" />
    },
    {
      title: "True PostGIS Spatial Queries",
      desc: "Computes spatial buffering, risk zone containment, and KNN nearest-neighbor searches directly via Postgres GIS extensions at lightning speed.",
      icon: <Database size={24} className="text-primary-400" />
    },
    {
      title: "XGBoost Ensemble Predictor",
      desc: "Fits Random Forest and XGBoost model parameters to forecast elevation drainage capacity and infrastructure hazards based on real-time data inputs.",
      icon: <BrainCircuit size={24} className="text-emerald-400" />
    },
    {
      title: "Real-time Telemetry Layers",
      desc: "Pull down live OSM ways, nodes, and relations to populate municipal infrastructure grids without maintaining stale shapefiles.",
      icon: <Layers size={24} className="text-violet-400" />
    },
    {
      title: "Automated Executive Reporting",
      desc: "Instantly compile PDF executive summaries with generated vulnerability matrices, security indices, and action plans.",
      icon: <ShieldAlert size={24} className="text-amber-400" />
    }
  ];

  return (
    <MarketingLayout title="Core Features">
      <div className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
            Consolidated <span className="text-primary-400">GIS Geoprocessing</span>
          </h1>
          <p className="text-gray-400 text-base max-w-2xl mx-auto">
            Seamlessly aggregate layers, coordinate boundaries, and predictive analytics in a unified console.
          </p>
        </div>

        <div className="space-y-6">
          {features.map((feat, idx) => (
            <div key={idx} className="glass-premium p-8 rounded-2xl border border-white/10 flex flex-col md:flex-row items-start md:items-center gap-6 hover:border-primary-500/30 transition-colors">
              <div className="w-16 h-16 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-center shrink-0 shadow-inner">
                {feat.icon}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">{feat.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{feat.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MarketingLayout>
  );
}
