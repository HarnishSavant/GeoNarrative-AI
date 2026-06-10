"use client";

import React from "react";
import MarketingLayout from "@/components/MarketingLayout";
import { motion } from "framer-motion";
import { Droplets, Car, Building2, Zap, ArrowRight, CheckCircle2 } from "lucide-react";

export default function ServicesPage() {
  const services = [
    {
      title: "Flood Intelligence",
      description: "PostGIS overlay containment audits mapping low-elevation catchments and critical healthcare exposure indices.",
      icon: <Droplets className="text-blue-400" size={32} />,
      features: ["Hydrological stress mapping", "Elevation sink detection", "Vulnerable infrastructure alerts", "Real-time mitigation directives"],
      color: "from-blue-600/20 to-blue-900/10",
      border: "border-blue-500/30"
    },
    {
      title: "Traffic Optimization",
      description: "Commuter gridlock modeling, street line-in-polygon overlays, and adaptive signal timetable calculations.",
      icon: <Car className="text-orange-400" size={32} />,
      features: ["Mobility friction vectors", "Evacuation routing", "Accident hotspot clustering", "Logistics capacity analysis"],
      color: "from-orange-600/20 to-orange-900/10",
      border: "border-orange-500/30"
    },
    {
      title: "Urban Zoning",
      description: "Hillside property setback compliance audits, green canopy ratios, and real-time development deviations.",
      icon: <Building2 className="text-violet-400" size={32} />,
      features: ["Regulatory compliance audits", "Canopy vs concrete ratio", "Structural vulnerability", "Density threshold alerts"],
      color: "from-violet-600/20 to-violet-900/10",
      border: "border-violet-500/30"
    },
    {
      title: "Utility Analytics",
      description: "Transformer thermal load stress analysis, pipeline wall structural thinning, and dual-redundancy loop designs.",
      icon: <Zap className="text-yellow-400" size={32} />,
      features: ["Power grid stress testing", "Pipeline flow simulation", "Redundancy failover modeling", "Capacity prediction"],
      color: "from-yellow-600/20 to-yellow-900/10",
      border: "border-yellow-500/30"
    }
  ];

  return (
    <MarketingLayout title="Our Services">
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-20">
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-6">
            Multi-Domain <span className="text-primary-400">Geospatial Engine</span>
          </h1>
          <p className="text-base text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Integrate, resolve, and audit spatial metrics across four critical municipal domains. Our specialized services provide actionable intelligence for every sector of urban planning.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {services.map((svc, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`glass-premium p-8 rounded-2xl border ${svc.border} bg-gradient-to-br ${svc.color} hover:-translate-y-1 transition-transform duration-300`}
            >
              <div className="w-16 h-16 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center mb-6 shadow-lg">
                {svc.icon}
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">{svc.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed mb-8 h-16">
                {svc.description}
              </p>
              
              <ul className="space-y-3 mb-8">
                {svc.features.map((feat, j) => (
                  <li key={j} className="flex items-start gap-2 text-xs text-gray-300">
                    <CheckCircle2 size={14} className="text-primary-400 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>

              <button className="text-xs font-bold text-primary-400 hover:text-primary-300 flex items-center gap-1 group">
                Deploy Module <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </MarketingLayout>
  );
}
