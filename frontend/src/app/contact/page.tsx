"use client";

import React, { useState } from "react";
import MarketingLayout from "@/components/MarketingLayout";
import { Mail, Send, Phone, MapPin, Building } from "lucide-react";

export default function ContactPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setEmail("");
      setMessage("");
      setSubmitted(false);
    }, 3000);
  };

  return (
    <MarketingLayout title="Contact Enterprise Support">
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
            Connect with <span className="text-primary-400">GeoNarrative</span>
          </h1>
          <p className="text-gray-400 text-sm max-w-xl mx-auto">
            Request SaaS enterprise trial credits, developer API keys, or inquire about custom municipal integrations.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
          {/* Form */}
          <div className="glass-premium p-8 rounded-2xl border border-white/10 relative shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />
            <h3 className="text-xl font-bold text-white mb-6">Send Inquiry Request</h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] text-gray-400 uppercase font-mono tracking-wider">Work Email Address</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="planner@municipal.gov"
                  className="w-full px-4 py-3 rounded-xl bg-black/40 border border-geo-border text-sm text-gray-200 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] text-gray-400 uppercase font-mono tracking-wider">Inquiry Description</label>
                <textarea 
                  required
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Requesting 500 trial geoprocessing credits for urban zoning..."
                  className="w-full px-4 py-3 rounded-xl bg-black/40 border border-geo-border text-sm text-gray-200 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 resize-none transition-all"
                />
              </div>

              <button 
                type="submit"
                disabled={submitted}
                className="w-full bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white justify-center text-sm py-3.5 rounded-xl font-bold shadow-lg shadow-primary-950/30 flex items-center gap-2 transition-all"
              >
                {submitted ? (
                  <>Support Ticket Generated!</>
                ) : (
                  <>Submit Request <Send size={14} /></>
                )}
              </button>
            </form>
          </div>

          {/* Contact Info */}
          <div className="space-y-8 flex flex-col justify-center lg:pl-12">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center shrink-0">
                <Building className="text-primary-400" size={20} />
              </div>
              <div>
                <h4 className="text-white font-bold mb-1">Corporate Headquarters</h4>
                <p className="text-sm text-gray-400 leading-relaxed">
                  GeoNarrative AI Inc.<br />
                  100 Spatial Boulevard, Suite 400<br />
                  San Francisco, CA 94107
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                <Mail className="text-cyan-400" size={20} />
              </div>
              <div>
                <h4 className="text-white font-bold mb-1">Direct Email</h4>
                <p className="text-sm text-gray-400">enterprise@geonarrative.ai</p>
                <p className="text-sm text-gray-400">support@geonarrative.ai</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <Phone className="text-emerald-400" size={20} />
              </div>
              <div>
                <h4 className="text-white font-bold mb-1">Support Line</h4>
                <p className="text-sm text-gray-400">1-800-GEO-TWIN</p>
                <p className="text-xs text-gray-500 mt-1">Available 24/7 for Premium SaaS accounts</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
