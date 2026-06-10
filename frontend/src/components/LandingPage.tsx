"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  Globe2, 
  ArrowRight, 
  Droplets, 
  Car, 
  Building2, 
  Zap, 
  ShieldAlert, 
  BrainCircuit, 
  Sparkles,
  Map,
  Database,
  Mail,
  Send,
  Lock,
  Layers,
  ChevronRight,
  TrendingUp
} from "lucide-react";

interface LandingPageProps {
  onStartAuth: (mode: "login" | "register") => void;
}

export default function LandingPage({ onStartAuth }: LandingPageProps) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [contactSubmitted, setContactSubmitted] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitted(true);
    setTimeout(() => {
      setEmail("");
      setMessage("");
      setContactSubmitted(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-geo-darker text-gray-100 flex flex-col font-sans selection:bg-primary-500/30 overflow-x-hidden relative">
      
      {/* Dynamic Grid Background Overlay */}
      <div className="absolute inset-0 bg-dot-grid pointer-events-none opacity-40 z-0" />
      <div className="absolute top-0 inset-x-0 h-[600px] bg-gradient-to-b from-primary-900/10 via-transparent to-transparent pointer-events-none z-0" />

      {/* 1. SAAS HEADER */}
      <header className="h-20 border-b border-geo-border/40 bg-geo-darker/70 backdrop-blur-xl sticky top-0 z-50 flex items-center justify-between px-6 md:px-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.3)]">
            <Globe2 size={20} className="text-white animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-black tracking-tight text-white leading-none">GeoNarrative</h1>
              <span className="text-[8px] bg-primary-500/20 border border-primary-500/30 text-primary-400 px-1 py-0.5 rounded font-black font-mono">v1.2</span>
            </div>
            <span className="text-[9px] text-gray-500 font-mono tracking-widest uppercase">AI Enterprise Twin</span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-gray-400">
          <a href="/services" className="hover:text-white transition-colors">Analytical Domains</a>
          <a href="/features" className="hover:text-white transition-colors">Spatial Pipeline</a>
          <a href="/contact" className="hover:text-white transition-colors">Enterprise Inquiry</a>
        </nav>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => onStartAuth("login")}
            className="text-xs font-bold text-gray-400 hover:text-white transition-colors py-2 px-4"
          >
            Sign In
          </button>
          <button 
            onClick={() => onStartAuth("register")}
            className="text-xs font-bold bg-primary-600 hover:bg-primary-500 text-white rounded-xl py-2 px-4 shadow-lg shadow-primary-950/40 hover:shadow-primary-500/20 transition-all flex items-center gap-1.5 group"
          >
            Configure Portal Account 
            <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-6 md:px-12 py-24 overflow-hidden z-10">
        
        {/* Aceternity style Spotlight Radial Gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-primary-500/10 blur-[130px] rounded-full pointer-events-none animate-spotlight z-0" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[200px] bg-cyan-500/10 blur-[110px] rounded-full pointer-events-none z-0" />
        <div className="absolute top-1/2 right-1/4 w-[350px] h-[180px] bg-indigo-500/10 blur-[100px] pointer-events-none z-0" />

        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Text Block */}
          <div className="lg:col-span-7 space-y-8 text-left">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-950/40 border border-primary-500/30 text-[10px] font-bold text-primary-400 uppercase tracking-widest font-mono"
            >
              <Sparkles size={11} className="text-primary-400 animate-pulse" /> 
              Next-Gen Spatial intelligence platform
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-4xl md:text-6xl font-black tracking-tight text-white leading-[1.05]"
            >
              Command Your City’s <br/>
              <span className="bg-gradient-to-r from-primary-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
                Digital Hazard Twin
              </span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-xs md:text-sm text-gray-400 leading-relaxed max-w-xl"
            >
              GeoNarrative AI bridges enterprise Mapbox GIS rendering with live PostGIS proximity algorithms and ensemble XGBoost/Random Forest predictive modelling, providing instant multi-domain mitigation directives.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center gap-4"
            >
              <button 
                onClick={() => onStartAuth("register")}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-500 hover:from-primary-500 hover:to-indigo-400 text-white font-bold text-xs shadow-lg shadow-primary-950/50 hover:shadow-primary-500/25 transition-all flex items-center justify-center gap-2"
              >
                Access Control Terminal <ArrowRight size={13} />
              </button>
              <a 
                href="#modules" 
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-geo-card/30 border border-geo-border text-gray-300 hover:text-white font-bold text-xs hover:bg-geo-border/50 transition-all text-center backdrop-blur-sm"
              >
                Inspect Analytical Modules
              </a>
            </motion.div>

            {/* Platform statistics */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="pt-6 grid grid-cols-3 gap-4 border-t border-geo-border/30 max-w-md"
            >
              <div>
                <div className="text-xl font-black text-white font-mono">10ms</div>
                <div className="text-[10px] text-gray-500">MCDA Processing</div>
              </div>
              <div>
                <div className="text-xl font-black text-white font-mono">99.8%</div>
                <div className="text-[10px] text-gray-500">Spatial Matching</div>
              </div>
              <div>
                <div className="text-xl font-black text-white font-mono">XGBoost</div>
                <div className="text-[10px] text-gray-500">Ensemble Core</div>
              </div>
            </motion.div>
          </div>

          {/* Right Interface Mock-up Display */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-5 relative"
          >
            {/* Glossy terminal border shadow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-primary-500/20 to-cyan-500/10 rounded-2xl blur-xl opacity-50" />
            
            <div className="relative glass-premium rounded-2xl border border-white/10 p-5 shadow-2xl space-y-4">
              
              {/* Terminal header */}
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                </div>
                <div className="text-[10px] font-mono text-gray-500">pune_basin_risk_model.py</div>
                <div className="w-4 h-4 rounded bg-white/5" />
              </div>

              {/* Mock visualization */}
              <div className="h-44 rounded-xl bg-black/45 border border-geo-border/60 relative overflow-hidden flex flex-col justify-between p-3 font-mono">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-[9px] text-primary-400 font-bold block">MODEL PREDICTION RUNNING</span>
                    <span className="text-[10px] text-white font-bold">18.5204° N, 73.8567° E</span>
                  </div>
                  <span className="text-[8px] bg-red-500/20 border border-red-500/30 text-red-400 px-1.5 py-0.5 rounded font-bold">HIGH RISK ZONE</span>
                </div>

                {/* Animated waves representing prediction charts */}
                <div className="h-16 flex items-end gap-1.5 overflow-hidden">
                  {[45, 60, 80, 55, 30, 90, 75, 50, 65, 85, 40, 70, 95, 60, 50].map((h, i) => (
                    <motion.div
                      key={i}
                      className="flex-1 bg-gradient-to-t from-primary-500 to-cyan-400 rounded-t"
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      transition={{ duration: 1, repeat: Infinity, repeatType: "reverse", delay: i * 0.05 }}
                    />
                  ))}
                </div>

                <div className="flex justify-between text-[8px] text-gray-500 border-t border-white/5 pt-1.5">
                  <span>Mula-Mutha Basin</span>
                  <span>Ensemble Residual: 0.041</span>
                </div>
              </div>

              {/* Details and metrics */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-400 flex items-center gap-1"><Droplets size={12} className="text-blue-400" /> Hydrological Stress</span>
                  <span className="text-white font-bold font-mono">84.2%</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-400 flex items-center gap-1"><Car size={12} className="text-orange-400" /> Mobility Friction</span>
                  <span className="text-white font-bold font-mono">1.48 Delay Ratio</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-400 flex items-center gap-1"><Zap size={12} className="text-yellow-400" /> Substation Capacity</span>
                  <span className="text-white font-bold font-mono">92 MW peak load</span>
                </div>
              </div>

              {/* Dynamic status line */}
              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[9px] text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Live GIS database connected
                </span>
                <span className="font-mono text-primary-400 font-semibold uppercase">Secure JWT Tunnel</span>
              </div>

            </div>
          </motion.div>
        </div>
      </section>

      {/* 3. FOUR CORE MODULES SECTION */}
      <section id="modules" className="py-28 border-t border-geo-border/30 bg-geo-darker/60 px-6 md:px-12 w-full relative z-10">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <span className="text-[10px] font-mono font-bold text-primary-400 uppercase tracking-widest bg-primary-950/20 border border-primary-500/20 px-3 py-1 rounded-full">
              Digital Twin Frameworks
            </span>
            <h3 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              Multi-Domain Geospatial Engine
            </h3>
            <p className="text-xs text-gray-400 max-w-lg mx-auto leading-relaxed">
              Integrate, resolve, and audit spatial metrics across four critical municipal domains.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { 
                title: "Flood Intelligence", 
                desc: "PostGIS overlay containment audits mapping low-elevation catchments and critical healthcare exposure indices.", 
                icon: <Droplets size={20} className="text-blue-400" />,
                badge: "Spatial Intersect",
                border: "group-hover:border-blue-500/30"
              },
              { 
                title: "Traffic Optimization", 
                desc: "Commuter gridlock modeling, street line-in-polygon overlays, and adaptive signal timetable calculations.", 
                icon: <Car size={20} className="text-orange-400" />,
                badge: "Friction Vectors",
                border: "group-hover:border-orange-500/30"
              },
              { 
                title: "Urban Zoning", 
                desc: "Hillside property setback compliance audits, green canopy ratios, and real-time development deviations.", 
                icon: <Building2 size={20} className="text-violet-400" />,
                badge: "Zoning Audit",
                border: "group-hover:border-violet-500/30"
              },
              { 
                title: "Utility Analytics", 
                desc: "Transformer thermal load stress analysis, pipeline wall structural thinning, and dual-redundancy loop designs.", 
                icon: <Zap size={20} className="text-yellow-400" />,
                badge: "Redundancy Index",
                border: "group-hover:border-yellow-500/30"
              }
            ].map((mod, i) => (
              <div 
                key={i} 
                className="glass-premium p-6 flex flex-col justify-between hover:border-primary-500/25 transition-all duration-300 group hover:-translate-y-1 relative overflow-hidden"
              >
                {/* Micro border glow */}
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary-500/40 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                
                <div className="space-y-4">
                  <div className="w-11 h-11 rounded-xl bg-geo-darker border border-geo-border/60 flex items-center justify-center group-hover:scale-105 transition-transform">
                    {mod.icon}
                  </div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">{mod.title}</h4>
                  <p className="text-[11px] text-gray-400 leading-relaxed">{mod.desc}</p>
                </div>
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
                  <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest font-bold">{mod.badge}</span>
                  <ChevronRight size={12} className="text-gray-600 group-hover:text-primary-400 transition-colors group-hover:translate-x-0.5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. PLATFORM FEATURES / PIPELINE */}
      <section id="pipeline" className="py-28 border-t border-geo-border/30 bg-black/10 w-full relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center px-6 md:px-12">
          
          <div className="space-y-8">
            <div className="space-y-3">
              <span className="text-[10px] font-mono font-bold text-primary-400 uppercase tracking-widest bg-primary-950/20 border border-primary-500/20 px-3 py-1 rounded-full">
                Engineering pipeline
              </span>
              <h3 className="text-3xl font-black text-white leading-tight">
                Consolidated GIS Geoprocessing
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Seamlessly aggregate OSM layers, coordinate boundaries, and predictive analytics in a unified console.
              </p>
            </div>

            <div className="space-y-4">
              {[
                { 
                  title: "3D Mapbox GL Rendering Engine", 
                  desc: "Render multi-polygon risk boundaries, extruded structural footprints, and high-pitch terrain contours in real time.", 
                  icon: <Map size={16} className="text-cyan-400" />
                },
                { 
                  title: "True PostGIS Spatial Queries", 
                  desc: "Computes spatial buffering, risk zone containment, and KNN nearest-neighbor searches directly via Postgres GIS extensions.", 
                  icon: <Database size={16} className="text-primary-400" />
                },
                { 
                  title: "Stacking Ensemble Predictor", 
                  desc: "Fits Random Forest and XGBoost model parameters to forecast elevation drainage capacity and infrastructure hazards.", 
                  icon: <BrainCircuit size={16} className="text-emerald-400" />
                }
              ].map((feat, i) => (
                <div key={i} className="flex gap-4 items-start p-3 rounded-xl border border-transparent hover:border-geo-border/40 hover:bg-white/5 transition-all">
                  <div className="w-9 h-9 rounded-lg bg-geo-card border border-geo-border flex items-center justify-center shrink-0 mt-0.5 shadow-md">
                    {feat.icon}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">{feat.title}</h4>
                    <p className="text-[11px] text-gray-500 leading-relaxed mt-1">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Feature Graphic */}
          <div className="glass-premium p-6 border-white/10 bg-gradient-to-br from-geo-card/40 to-primary-950/5 relative overflow-hidden rounded-2xl shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h4 className="text-xs font-mono text-primary-400 font-bold uppercase flex items-center gap-1.5">
                <ShieldAlert size={12} /> Pune Municipal Twin case study
              </h4>
            </div>

            <p className="text-[11px] text-gray-400 leading-relaxed mb-6">
              Pre-seeded with real-world spatial coordinate clusters surrounding Pune, India (Mula-Mutha river basin), including Sahyadri Hospital Deccan, Garware College, and Deccan substations.
            </p>

            <div className="p-4 rounded-xl bg-black/40 border border-geo-border/60 space-y-3">
              <div className="flex items-center justify-between text-[11px] font-mono border-b border-white/5 pb-2">
                <span className="text-gray-500">Target Georeference</span>
                <span className="text-white font-bold">18.5204° N, 73.8567° E</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono border-b border-white/5 pb-2">
                <span className="text-gray-500">Seeded Health Assets</span>
                <span className="text-emerald-400 font-bold">6 Critical Hospitals</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono border-b border-white/5 pb-2">
                <span className="text-gray-500">Seeded Substations</span>
                <span className="text-cyan-400 font-bold">2 High-Voltage Nodes</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-gray-500">Zoning Areas</span>
                <span className="text-violet-400 font-bold">2 Hydrological Floodways</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 5. CONTACT FORM SECTION */}
      <section id="contact" className="py-28 border-t border-geo-border/30 bg-geo-darker/60 px-6 md:px-12 w-full relative z-10">
        <div className="max-w-xl mx-auto glass-premium p-8 rounded-2xl border-white/10 shadow-2xl relative">
          
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="text-center space-y-3 mb-8">
            <Mail className="text-primary-400 mx-auto" size={24} />
            <h3 className="text-lg font-bold text-white uppercase tracking-wider">Contact Platform Support</h3>
            <p className="text-xs text-gray-500">Request SaaS enterprise trial credits or developer API keys</p>
          </div>

          <form onSubmit={handleContactSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 uppercase font-mono tracking-wider">Email Address</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@municipal.gov"
                className="w-full px-4 py-2.5 rounded-lg bg-geo-darker border border-geo-border text-xs text-gray-200 outline-none focus:border-primary-500 transition-colors"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 uppercase font-mono tracking-wider">Message Description</label>
              <textarea 
                required
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Requesting 500 trial geoprocessing credits for urban zoning..."
                className="w-full px-4 py-2.5 rounded-lg bg-geo-darker border border-geo-border text-xs text-gray-200 outline-none focus:border-primary-500 resize-none transition-colors"
              />
            </div>

            <button 
              type="submit"
              disabled={contactSubmitted}
              className="w-full btn-primary justify-center text-xs py-2.5 font-bold shadow-lg shadow-primary-950/30 flex items-center gap-2"
            >
              {contactSubmitted ? (
                <>Support Ticket Generated!</>
              ) : (
                <>Send Inquiry Request <Send size={12} /></>
              )}
            </button>
          </form>
        </div>
      </section>

      {/* 6. Footer */}
      <footer className="mt-auto border-t border-geo-border/30 bg-geo-darker py-8 px-6 md:px-12 flex flex-col md:flex-row items-center justify-between text-xs text-gray-500 relative z-10">
        <div className="flex items-center gap-2 mb-4 md:mb-0">
          <Globe2 size={16} className="text-primary-500" />
          <span className="font-bold text-gray-400">GeoNarrative AI Inc.</span>
        </div>
        <div className="flex gap-6 mb-4 md:mb-0">
          <a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="/terms" className="hover:text-white transition-colors">Terms of Service</a>
          <a href="/about" className="hover:text-white transition-colors">About Us</a>
        </div>
        <p className="font-mono text-[10px]">© 2026 GeoNarrative AI. Secure JWT-Encrypted.</p>
      </footer>

    </div>
  );
}
