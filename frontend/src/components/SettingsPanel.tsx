"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
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
} from "lucide-react";

export default function SettingsPanel() {
  const [mapboxToken, setMapboxToken] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const settingSections = [
    {
      title: "API Configuration",
      icon: <Key size={16} className="text-primary-400" />,
      items: [
        {
          id: "mapbox",
          label: "Mapbox Access Token",
          description: "Required for interactive map visualization",
          type: "password" as const,
          value: mapboxToken,
          onChange: setMapboxToken,
          placeholder: "pk.eyJ1...",
          link: "https://account.mapbox.com/access-tokens/",
        },
        {
          id: "gemini",
          label: "Gemini API Key",
          description: "Required for AI chat assistant",
          type: "password" as const,
          value: geminiKey,
          onChange: setGeminiKey,
          placeholder: "AIzaSy...",
          link: "https://makersuite.google.com/app/apikey",
        },
      ],
    },
  ];

  return (
    <div className="p-4 space-y-4 h-full overflow-y-auto custom-scrollbar">
      <div className="flex items-center gap-2">
        <Settings size={16} className="text-primary-400" />
        <h3 className="text-sm font-semibold text-gray-200">Settings</h3>
      </div>

      {settingSections.map((section, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-2">
            {section.icon}
            <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">{section.title}</h4>
          </div>
          {section.items.map((item) => (
            <div key={item.id} className="glass-card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-200">{item.label}</label>
                {item.link && (
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-primary-400 hover:text-primary-300 flex items-center gap-1"
                  >
                    Get Key <ExternalLink size={8} />
                  </a>
                )}
              </div>
              <p className="text-[11px] text-gray-500">{item.description}</p>
              <input
                type={item.type}
                value={item.value}
                onChange={(e) => item.onChange(e.target.value)}
                placeholder={item.placeholder}
                className="w-full px-3 py-2 rounded-lg bg-geo-dark border border-geo-border text-xs text-gray-200 outline-none focus:border-primary-500 font-mono"
              />
            </div>
          ))}
        </motion.div>
      ))}

      {/* Quick Settings */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="flex items-center gap-2 mb-3">
          <Palette size={16} className="text-primary-400" />
          <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Preferences</h4>
        </div>
        <div className="glass-card p-4 space-y-3">
          {[
            { label: "Dark Mode", description: "Use dark theme", enabled: true },
            { label: "Notifications", description: "Enable alert notifications", enabled: true },
            { label: "Auto-refresh Data", description: "Update every 5 minutes", enabled: false },
            { label: "Animation Effects", description: "Enable UI animations", enabled: true },
          ].map((pref, i) => (
            <div key={i} className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-200">{pref.label}</p>
                <p className="text-[10px] text-gray-500">{pref.description}</p>
              </div>
              <div
                className={`w-9 h-5 rounded-full transition-all duration-300 flex items-center cursor-pointer ${
                  pref.enabled ? "bg-primary-600 justify-end" : "bg-gray-700 justify-start"
                }`}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-white mx-0.5 shadow" />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* About */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <div className="glass-card p-4 text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-cyan-500 flex items-center justify-center mx-auto">
            <Globe2 size={20} className="text-white" />
          </div>
          <h4 className="text-sm font-bold gradient-text">GeoNarrative AI</h4>
          <p className="text-[10px] text-gray-500">v1.0.0 • Conversational GeoAI Platform</p>
          <p className="text-[10px] text-gray-600">
            Built with Next.js, FastAPI, Mapbox GL, and Gemini AI
          </p>
        </div>
      </motion.div>
    </div>
  );
}
