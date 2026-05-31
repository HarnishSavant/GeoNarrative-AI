"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  Key,
  Globe2,
  Palette,
  Bell,
  Database,
  Shield,
  ExternalLink,
  Check,
  Copy,
  MessageSquare,
  HelpCircle,
  Mail,
  Send,
  Loader2,
  CheckCircle2,
  FileQuestion,
  ChevronDown,
  Info,
  Layers,
  HeartHandshake
} from "lucide-react";
import { apiService } from "@/services/apiService";

type SettingsSubSection = "api" | "faq" | "tickets" | "contact" | "about";

export default function SettingsPanel() {
  const [activeSec, setActiveSec] = useState<SettingsSubSection>("api");
  const [mapboxToken, setMapboxToken] = useState("");
  const [geminiKey, setGeminiKey] = useState("");

  // Contact form states
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactSubject, setContactSubject] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);
  const [contactSuccess, setContactSuccess] = useState("");
  const [contactError, setContactError] = useState("");

  // Ticket states
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketDescription, setTicketDescription] = useState("");
  const [ticketCategory, setTicketCategory] = useState("General");
  const [ticketsList, setTicketsList] = useState<any[]>([]);
  const [isFilingTicket, setIsFilingTicket] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState("");
  const [ticketError, setTicketError] = useState("");

  // FAQ states
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const loadSupportTickets = async () => {
    try {
      const tickets = await apiService.listSupportTickets();
      setTicketsList(tickets);
    } catch (err) {
      console.warn("Failed to load support tickets:", err);
    }
  };

  useEffect(() => {
    if (activeSec === "tickets") {
      loadSupportTickets();
    }
  }, [activeSec]);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingContact(true);
    setContactSuccess("");
    setContactError("");
    try {
      await apiService.submitContactInquiry({
        name: contactName,
        email: contactEmail,
        subject: contactSubject,
        message: contactMessage
      });
      setContactSuccess("Your message was dispatched successfully! Admin has been notified.");
      setContactName("");
      setContactEmail("");
      setContactSubject("");
      setContactMessage("");
    } catch (err: any) {
      setContactError(err.message || "Failed to transmit inquiry.");
    } finally {
      setIsSubmittingContact(false);
    }
  };

  const handleFileTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsFilingTicket(true);
    setTicketSuccess("");
    setTicketError("");
    try {
      await apiService.createSupportTicket({
        subject: ticketSubject,
        description: ticketDescription,
        category: ticketCategory
      });
      setTicketSuccess("Support ticket registered successfully!");
      setTicketSubject("");
      setTicketDescription("");
      // Refresh tickets list
      await loadSupportTickets();
    } catch (err: any) {
      setTicketError(err.message || "Failed to register support ticket.");
    } finally {
      setIsFilingTicket(false);
    }
  };

  const faqs = [
    {
      q: "What are the focal coordinates of the digital twin?",
      a: "The twin focuses centrally on Pune, India (18.5204° N, 73.8567° E). This serves as the primary regional coordinate grid for our elevation raster mapping and hospital/substation proximity calculators."
    },
    {
      q: "How are regional safety indices calculated?",
      a: "Our AI prediction engine incorporates 5 crucial layers: rainfall volumes, elevation indices, population density registers, river proximities, and land use deviation calculations. These are analyzed via random forests and gradient boosted (XGBoost) trees to derive safety scores."
    },
    {
      q: "How is my geoprocessing credit consumed?",
      a: "All users on the Free Sandbox receive 100 geoprocessing credits. Each successful spatial analysis run or conversational prediction query consumes exactly 1 credit. Free users are restricted to 20 daily AI prompt interactions."
    },
    {
      q: "How do I upload custom GIS datasets?",
      a: "Navigate to the 'AI Assistant' chat window, select the attachment icon, and upload custom GeoJSON boundary files. The portal instantly indexes coordinates, matches safety zones, and displays active shapes as overlays."
    }
  ];

  return (
    <div className="p-4 space-y-5 h-full overflow-y-auto custom-scrollbar bg-geo-darker/10">
      
      {/* Sub Header Tab controls */}
      <div className="flex items-center justify-between border-b border-geo-border/60 pb-3">
        <div className="flex items-center gap-1.5">
          <Settings size={15} className="text-primary-400" />
          <h3 className="text-xs font-semibold text-gray-200 uppercase tracking-wider">Help & Settings</h3>
        </div>
      </div>

      {/* Tab Select buttons */}
      <div className="grid grid-cols-5 gap-1 bg-geo-dark/50 p-1 rounded-xl border border-geo-border/50">
        {[
          { id: "api" as const, label: "API", icon: <Key size={12} /> },
          { id: "faq" as const, label: "FAQs", icon: <FileQuestion size={12} /> },
          { id: "tickets" as const, label: "Tickets", icon: <MessageSquare size={12} /> },
          { id: "contact" as const, label: "Contact", icon: <Mail size={12} /> },
          { id: "about" as const, label: "About", icon: <Info size={12} /> }
        ].map((btn) => (
          <button
            key={btn.id}
            onClick={() => setActiveSec(btn.id)}
            className={`flex flex-col items-center justify-center py-2 rounded-lg text-[9px] font-bold transition-all duration-300 ${
              activeSec === btn.id
                ? "bg-primary-600/15 border border-primary-500/35 text-primary-400 shadow-glow-primary/5"
                : "text-gray-500 hover:text-gray-300 hover:bg-geo-card/20 border border-transparent"
            }`}
          >
            {btn.icon}
            <span className="mt-1">{btn.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeSec}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.15 }}
          className="space-y-4"
        >
          {/* 1. API CONFIGURATION PANEL */}
          {activeSec === "api" && (
            <div className="space-y-4">
              <div className="flex items-center gap-1.5">
                <Key size={14} className="text-primary-400" />
                <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Access Tokens Setup</h4>
              </div>

              <div className="glass-card p-4 space-y-3.5">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] text-gray-300 uppercase font-mono font-bold">Mapbox Token</label>
                    <a href="https://account.mapbox.com/access-tokens/" target="_blank" rel="noreferrer" className="text-[9px] text-primary-400 hover:underline flex items-center gap-1">
                      Get Mapbox <ExternalLink size={8} />
                    </a>
                  </div>
                  <input
                    type="password"
                    value={mapboxToken}
                    onChange={(e) => setMapboxToken(e.target.value)}
                    placeholder="pk.eyJ1..."
                    className="w-full px-3 py-2 rounded-lg bg-geo-dark border border-geo-border text-xs text-gray-200 outline-none focus:border-primary-500 font-mono"
                  />
                  <p className="text-[9px] text-gray-500">Activates vector base maps and dynamic layers rendering.</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] text-gray-300 uppercase font-mono font-bold">Gemini Key</label>
                    <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-[9px] text-primary-400 hover:underline flex items-center gap-1">
                      Get Key <ExternalLink size={8} />
                    </a>
                  </div>
                  <input
                    type="password"
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full px-3 py-2 rounded-lg bg-geo-dark border border-geo-border text-xs text-gray-200 outline-none focus:border-primary-500 font-mono"
                  />
                  <p className="text-[9px] text-gray-500">Drives convolutional municipal spatial chat prompts.</p>
                </div>
              </div>
            </div>
          )}

          {/* 2. FAQS SYSTEM ACCORDION */}
          {activeSec === "faq" && (
            <div className="space-y-4">
              <div className="flex items-center gap-1.5">
                <FileQuestion size={14} className="text-cyan-400" />
                <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Help Desk FAQs Accordion</h4>
              </div>

              <div className="space-y-2.5">
                {faqs.map((faq, idx) => (
                  <div key={idx} className="glass-card overflow-hidden">
                    <button
                      onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                      className="w-full p-3 flex items-center justify-between text-left text-xs font-semibold text-gray-200 bg-geo-card/10 hover:bg-geo-card/30 transition-colors"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown size={14} className={`text-gray-400 transition-transform ${openFaqIndex === idx ? "rotate-180" : ""}`} />
                    </button>
                    {openFaqIndex === idx && (
                      <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} className="p-3 bg-black/20 text-[10px] text-gray-400 border-t border-geo-border/40 leading-relaxed font-mono">
                        {faq.a}
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. HELP CENTER TICKETS SYSTEM */}
          {activeSec === "tickets" && (
            <div className="space-y-5">
              <form onSubmit={handleFileTicket} className="glass-card p-4 space-y-3.5">
                <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1 border-b border-geo-border/60 pb-2">
                  <Send size={11} className="text-primary-400" /> File Support Ticket
                </h4>

                {ticketSuccess && (
                  <div className="p-2.5 rounded bg-emerald-950/20 border border-emerald-500/30 text-[10px] text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 size={12} /> <span>{ticketSuccess}</span>
                  </div>
                )}

                {ticketError && (
                  <div className="p-2.5 rounded bg-red-950/20 border border-red-500/30 text-[10px] text-red-400">
                    {ticketError}
                  </div>
                )}

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] text-gray-400 uppercase font-mono">Subject Summary</label>
                      <input
                        type="text"
                        value={ticketSubject}
                        onChange={(e) => setTicketSubject(e.target.value)}
                        required
                        placeholder="e.g. Credit Billing Error"
                        className="w-full px-2 py-1.5 rounded-lg bg-geo-dark border border-geo-border text-xs text-gray-200 outline-none focus:border-primary-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-gray-400 uppercase font-mono">Category</label>
                      <select
                        value={ticketCategory}
                        onChange={(e) => setTicketCategory(e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg bg-geo-dark border border-geo-border text-xs text-gray-200 outline-none focus:border-primary-500"
                      >
                        <option value="General">General Inquiries</option>
                        <option value="Billing">SaaS Credits Billing</option>
                        <option value="Technical">GIS & ML Processing</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-gray-400 uppercase font-mono">Ticket Details</label>
                    <textarea
                      value={ticketDescription}
                      onChange={(e) => setTicketDescription(e.target.value)}
                      required
                      rows={2}
                      placeholder="Explain your technical issue details..."
                      className="w-full px-2.5 py-1.5 rounded-lg bg-geo-dark border border-geo-border text-xs text-gray-200 outline-none focus:border-primary-500 custom-scrollbar"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isFilingTicket}
                  className="btn-primary w-full justify-center text-[10px] py-1.5 font-bold flex items-center gap-1"
                >
                  {isFilingTicket ? <Loader2 size={12} className="animate-spin" /> : <Send size={11} />}
                  File Ticket
                </button>
              </form>

              {/* Tickets list */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-geo-border/60 pb-2">
                  <MessageSquare size={13} className="text-violet-400" /> Active Tickets History
                </h4>

                <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                  {ticketsList.length === 0 ? (
                    <div className="text-[10px] text-gray-500 text-center py-4 font-mono">No support tickets filed yet.</div>
                  ) : (
                    ticketsList.map((tk) => (
                      <div key={tk.id} className="p-2.5 bg-black/20 rounded-lg border border-geo-border/60 flex items-start justify-between text-[10px] font-mono">
                        <div className="space-y-0.5 max-w-[70%]">
                          <div className="text-gray-300 font-semibold truncate">{tk.subject}</div>
                          <div className="text-[8px] text-gray-500">Filed: {new Date(tk.created_at).toLocaleDateString()} • {tk.category}</div>
                        </div>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider font-bold border ${
                          tk.status === "open"
                            ? "bg-amber-950/20 text-amber-400 border-amber-500/25"
                            : "bg-emerald-950/20 text-emerald-400 border-emerald-500/25"
                        }`}>
                          {tk.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 4. CONTACT SUPPORT FORM */}
          {activeSec === "contact" && (
            <form onSubmit={handleContactSubmit} className="glass-card p-4 space-y-3.5">
              <div className="text-center space-y-1">
                <Mail size={16} className="text-primary-400 mx-auto" />
                <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wider">Contact Municipal Support</h4>
                <p className="text-[9px] text-gray-500 leading-normal">Submit support inquiries here. Admin receives immediate alerts.</p>
              </div>

              {contactSuccess && (
                <div className="p-2.5 rounded bg-emerald-950/20 border border-emerald-500/30 text-[10px] text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 size={12} className="shrink-0" />
                  <span>{contactSuccess}</span>
                </div>
              )}

              {contactError && (
                <div className="p-2.5 rounded bg-red-950/20 border border-red-500/30 text-[10px] text-red-400">
                  {contactError}
                </div>
              )}

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] text-gray-400 uppercase font-mono">Your Name</label>
                    <input
                      type="text"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      required
                      placeholder="e.g. John Doe"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-geo-dark border border-geo-border text-xs text-gray-200 outline-none focus:border-primary-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-gray-400 uppercase font-mono">Email Address</label>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      required
                      placeholder="john@city.gov"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-geo-dark border border-geo-border text-xs text-gray-200 outline-none focus:border-primary-500 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-gray-400 uppercase font-mono">Subject</label>
                  <input
                    type="text"
                    value={contactSubject}
                    onChange={(e) => setContactSubject(e.target.value)}
                    required
                    placeholder="e.g. Mapping layer question"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-geo-dark border border-geo-border text-xs text-gray-200 outline-none focus:border-primary-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-gray-400 uppercase font-mono">Message Box</label>
                  <textarea
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    required
                    rows={3}
                    placeholder="Describe your geospatial or license query in details..."
                    className="w-full px-2.5 py-1.5 rounded-lg bg-geo-dark border border-geo-border text-xs text-gray-200 outline-none focus:border-primary-500 custom-scrollbar"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingContact}
                className="btn-primary w-full justify-center text-[10px] py-2 font-bold flex items-center gap-1.5"
              >
                {isSubmittingContact ? <Loader2 size={12} className="animate-spin" /> : <Send size={11} />}
                Transmit Inquiry
              </button>
            </form>
          )}

          {/* 5. ABOUT GEONARRATIVE AI PORTAL */}
          {activeSec === "about" && (
            <div className="space-y-4">
              <div className="glass-card p-4 text-center space-y-2.5 bg-gradient-to-br from-primary-950/20 via-geo-card to-cyan-950/10 border-primary-500/10">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-500 to-cyan-500 flex items-center justify-center mx-auto text-white shadow-glow-primary">
                  <Globe2 size={20} />
                </div>
                <h4 className="text-xs font-black gradient-text uppercase tracking-widest leading-none">GeoNarrative AI Inc.</h4>
                <p className="text-[8px] text-gray-500 font-mono">Enterprise Spatial Governance Suite v1.4.0</p>
                <p className="text-[10px] text-gray-400 leading-normal text-left font-mono">
                  GeoNarrative AI is a premier, conversational GeoAI digital twin portal engineered for municipal governance, utility audits, and territorial risk analysis.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="glass-card p-3 space-y-1 bg-geo-card/30">
                  <Layers size={14} className="text-cyan-400" />
                  <h5 className="text-[10px] font-bold text-gray-200 uppercase font-mono">Our Vision</h5>
                  <p className="text-[9px] text-gray-500 leading-relaxed font-mono">Empowering municipal administrations with prompt-based conversational GIS twins.</p>
                </div>

                <div className="glass-card p-3 space-y-1 bg-geo-card/30">
                  <HeartHandshake size={14} className="text-primary-400" />
                  <h5 className="text-[10px] font-bold text-gray-200 uppercase font-mono">Our Mission</h5>
                  <p className="text-[9px] text-gray-500 leading-relaxed font-mono">Removing complex GIS scripting barriers using simple explainable ML predictions.</p>
                </div>
              </div>

              <div className="glass-card p-4 space-y-2 text-left font-mono text-[9px] text-gray-500 leading-normal">
                <h5 className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">Active Tech Architecture:</h5>
                <p>• <strong>Core Frontend:</strong> Next.js (App Router), Tailwind CSS, Framer Motion, Mapbox GL</p>
                <p>• <strong>FastAPI Backend:</strong> SQLAlchemy (Async), GeoAlchemy2 spatial indexing, Uvicorn REPL</p>
                <p>• <strong>Predictive AI:</strong> Random Forest Classifier, XGBoost, Pune coordinates grid weights</p>
                <p>• <strong>GeoDatabase:</strong> PostgreSQL with PostGIS extensions & secure HMAC verification</p>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

    </div>
  );
}
