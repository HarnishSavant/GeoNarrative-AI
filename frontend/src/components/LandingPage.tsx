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
  Users
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
    <div className="min-h-screen bg-geo-darker text-gray-100 flex flex-col font-sans selection:bg-primary-500/30 overflow-x-hidden">
      
      {/* 1. SAAS HEADER */}
      <header className="h-20 border-b border-geo-border/50 bg-geo-darker/60 backdrop-blur-xl sticky top-0 z-50 flex items-center justify-between px-6 md:px-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-cyan-500 flex items-center justify-center shadow-glow-primary">
            <Globe2 size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-white leading-none">GeoNarrative</h1>
            <span className="text-[10px] text-gray-500 font-mono">AI ENTERPRISE TWIN</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => onStartAuth("login")}
            className="text-xs font-bold text-gray-400 hover:text-white transition-colors py-2 px-4"
          >
            Sign In
          </button>
          <button 
            onClick={() => onStartAuth("register")}
            className="text-xs font-bold bg-primary-600 hover:bg-primary-500 text-white rounded-lg py-2 px-4 shadow-lg shadow-primary-950/40 hover:shadow-primary-500/20 transition-all flex items-center gap-1.5"
          >
            Get Started <ArrowRight size={12} />
          </button>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative min-h-[85vh] flex items-center justify-center px-6 md:px-12 py-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-950/15 via-geo-darker to-geo-darker overflow-hidden">
        {/* Animated Background Laser Sweeps */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[150px] bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-4xl text-center space-y-8 z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-950/40 border border-primary-500/20 text-[10px] font-bold text-primary-400 uppercase tracking-widest font-mono"
          >
            <Sparkles size={11} /> Enterprise GeoAI SaaS Platform
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-4xl md:text-6xl font-black tracking-tight text-white leading-[1.1] max-w-3xl mx-auto"
          >
            Spatial Intelligence & <br/>
            <span className="bg-gradient-to-r from-primary-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              3D Digital Twins
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-sm md:text-base text-gray-400 max-w-xl mx-auto leading-relaxed"
          >
            GeoNarrative AI enables real-time GIS analytics, predictive Random Forest and XGBoost spatial risk modelling, and conversational AI-driven urban disaster management.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <button 
              onClick={() => onStartAuth("register")}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-primary-600 to-cyan-500 hover:from-primary-500 hover:to-cyan-400 text-white font-bold text-xs shadow-lg shadow-primary-950/40 transition-all flex items-center justify-center gap-2"
            >
              Configure Portal Account <ArrowRight size={14} />
            </button>
            <a 
              href="#features" 
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-geo-card border border-geo-border text-gray-300 hover:text-white font-bold text-xs hover:bg-geo-border/30 transition-all text-center"
            >
              Explore GIS Features
            </a>
          </motion.div>
        </div>
      </section>

      {/* 3. FOUR CORE MODULES SECTION */}
      <section className="py-24 border-t border-geo-border/50 bg-geo-darker px-6 md:px-12 max-w-7xl mx-auto w-full">
        <div className="text-center space-y-4 mb-16">
          <span className="text-[10px] font-mono font-bold text-primary-400 uppercase tracking-widest">Digital Twin Modules</span>
          <h3 className="text-2xl md:text-3xl font-black text-white">Advanced Municipal Telemetry</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">Seamless geoprocessing across 4 key smart-city diagnostic domains</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { 
              title: "Flood Intelligence", 
              desc: "PostGIS overlay containment audits mapping low-elevation catchments and critical healthcare exposure indices.", 
              icon: <Droplets size={22} className="text-blue-400" />,
              badge: "Critical Alerting"
            },
            { 
              title: "Traffic Optimization", 
              desc: "Commuter gridlock modeling, street line-in-polygon overlays, and adaptive signal timetable calculations.", 
              icon: <Car size={22} className="text-amber-400" />,
              badge: "GPS Vectoring"
            },
            { 
              title: "Urban Zoning", 
              desc: "Hillside property setback compliance audits, green canopy ratios, and real-time development deviations.", 
              icon: <Building2 size={22} className="text-violet-400" />,
              badge: "Regulatory Compliance"
            },
            { 
              title: "Utility Analytics", 
              desc: "Transformer thermal load stress analysis, pipeline wall structural thinning, and dual-redundancy loop designs.", 
              icon: <Zap size={22} className="text-emerald-400" />,
              badge: "Grid Reliability"
            }
          ].map((mod, i) => (
            <div key={i} className="glass-card p-6 flex flex-col justify-between hover:border-primary-500/25 transition-all group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-geo-dark flex items-center justify-center group-hover:scale-110 transition-transform">
                  {mod.icon}
                </div>
                <h4 className="text-sm font-bold text-white">{mod.title}</h4>
                <p className="text-xs text-gray-400 leading-relaxed">{mod.desc}</p>
              </div>
              <span className="text-[9px] font-mono text-gray-500 mt-6 block uppercase font-bold tracking-wider">{mod.badge}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 4. PLATFORM FEATURES */}
      <section id="features" className="py-24 border-t border-geo-border/50 bg-black/15 px-6 md:px-12 w-full">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          <div className="space-y-6">
            <span className="text-[10px] font-mono font-bold text-primary-400 uppercase tracking-widest">AI & GIS Architecture</span>
            <h3 className="text-2xl md:text-3xl font-black text-white leading-tight">Next-Generation Geospatial Pipeline</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              We compile diverse environmental vector layers into a unified GPU-powered client terminal, backed by strict mathematical audit standards:
            </p>

            <div className="space-y-4">
              {[
                { 
                  title: "3D Mapbox GL Rendering Engine", 
                  desc: "Visualize multi-polygon risk boundaries, extruded structural footprints, and high-pitch terrain contours.", 
                  icon: <Map size={16} className="text-cyan-400" />
                },
                { 
                  title: "True PostGIS Spatial Querying", 
                  desc: "Zero static mocks. Computes real-time spatial buffering, containment audits, and KNN calculations in milliseconds.", 
                  icon: <Database size={16} className="text-primary-400" />
                },
                { 
                  title: "Stacking Ensemble Predictor", 
                  desc: "Engineers advanced runoff coefficient interaction vectors, training Random Forest and XGBoost model arrays.", 
                  icon: <BrainCircuit size={16} className="text-emerald-400" />
                }
              ].map((feat, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-lg bg-geo-card border border-geo-border flex items-center justify-center shrink-0 mt-0.5">
                    {feat.icon}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{feat.title}</h4>
                    <p className="text-[11px] text-gray-500 leading-relaxed mt-0.5">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Feature Graphic */}
          <div className="glass-card p-6 border-primary-500/10 bg-gradient-to-br from-geo-card to-primary-950/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary-500/10 rounded-full blur-2xl" />
            <h4 className="text-xs font-mono text-primary-400 font-bold uppercase mb-4 flex items-center gap-1.5">
              <ShieldAlert size={12} /> Pune Municipal Twin Case Study
            </h4>
            <p className="text-[11px] text-gray-400 leading-relaxed mb-4">
              Pre-seeded with real-world spatial coordinate clusters surrounding Pune, India (Mula-Mutha river basin), including Sahyadri Hospital Deccan, Garware College, and Deccan substations.
            </p>
            <div className="p-4 rounded-lg bg-black/35 border border-geo-border/60 space-y-2">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-gray-400">Target Georeference</span>
                <span className="text-white font-bold">18.5204° N, 73.8567° E</span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-gray-400">Seeded Health Assets</span>
                <span className="text-emerald-400 font-bold">6 Critical Hospitals</span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-gray-400">Seeded Substations</span>
                <span className="text-cyan-400 font-bold">2 High-Voltage Nodes</span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-gray-400">Zoning Areas</span>
                <span className="text-violet-400 font-bold">2 Hydrological Floodways</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 5. CONTACT FORM SECTION */}
      <section className="py-24 border-t border-geo-border/50 bg-geo-darker px-6 md:px-12 w-full">
        <div className="max-w-xl mx-auto glass-card p-8 border-geo-border bg-geo-card/40">
          <div className="text-center space-y-3 mb-6">
            <Mail className="text-primary-400 mx-auto" size={24} />
            <h3 className="text-lg font-bold text-white">Contact Platform Support</h3>
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
                className="w-full px-4 py-2.5 rounded-lg bg-geo-dark border border-geo-border text-xs text-gray-200 outline-none focus:border-primary-500"
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
                className="w-full px-4 py-2.5 rounded-lg bg-geo-dark border border-geo-border text-xs text-gray-200 outline-none focus:border-primary-500 resize-none"
              />
            </div>

            <button 
              type="submit"
              disabled={contactSubmitted}
              className="w-full btn-primary justify-center text-xs py-2.5 font-bold shadow-lg shadow-primary-950/30"
            >
              {contactSubmitted ? (
                <>Support Ticket Generated!</>
              ) : (
                <>Send Request <Send size={12} /></>
              )}
            </button>
          </form>
        </div>
      </section>

      {/* 6. Footer */}
      <footer className="mt-auto border-t border-geo-border/50 bg-geo-darker py-8 px-6 md:px-12 flex flex-col md:flex-row items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-2 mb-4 md:mb-0">
          <Globe2 size={16} className="text-primary-500" />
          <span className="font-bold text-gray-400">GeoNarrative AI Inc.</span>
        </div>
        <div className="flex gap-6 mb-4 md:mb-0">
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-white transition-colors">SaaS Pricing</a>
        </div>
        <p className="font-mono text-[10px]">© 2026 GeoNarrative AI. Secure JWT-Encrypted.</p>
      </footer>

    </div>
  );
}
