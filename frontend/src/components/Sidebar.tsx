"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Map,
  MessageSquareText,
  BarChart3,
  FileText,
  BrainCircuit,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  Globe2,
} from "lucide-react";
import { SidebarTab } from "@/lib/types";

interface SidebarProps {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const tabs: { id: SidebarTab; label: string; icon: React.ReactNode; badge?: number }[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
  { id: "map", label: "Map Layers", icon: <Map size={20} /> },
  { id: "chat", label: "AI Assistant", icon: <MessageSquareText size={20} />, badge: 1 },
  { id: "analytics", label: "Analytics", icon: <BarChart3 size={20} /> },
  { id: "prediction", label: "Prediction", icon: <BrainCircuit size={20} /> },
  { id: "reports", label: "Reports", icon: <FileText size={20} /> },
  { id: "settings", label: "Settings", icon: <Settings size={20} /> },
];

export default function Sidebar({ activeTab, onTabChange, collapsed, onToggleCollapse }: SidebarProps) {
  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="h-full bg-geo-darker/80 backdrop-blur-xl border-r border-geo-border flex flex-col relative z-30"
    >
      {/* Logo */}
      <div className="p-4 flex items-center gap-3 border-b border-geo-border h-16">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-glow-primary">
          <Globe2 size={20} className="text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <h1 className="text-sm font-bold gradient-text whitespace-nowrap">GeoNarrative</h1>
              <p className="text-[10px] text-gray-500 whitespace-nowrap">AI Digital Twin</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar">
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`sidebar-item w-full relative ${activeTab === tab.id ? "active" : "text-gray-400"}`}
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.98 }}
            title={collapsed ? tab.label : undefined}
          >
            <span className="flex-shrink-0 relative">
              {tab.icon}
              {tab.badge && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary-500 rounded-full text-[8px] font-bold flex items-center justify-center">
                  {tab.badge}
                </span>
              )}
            </span>
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="whitespace-nowrap overflow-hidden"
                >
                  {tab.label}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        ))}
      </nav>

      {/* Status */}
      <div className="p-3 border-t border-geo-border">
        <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs text-gray-500"
              >
                <span className="flex items-center gap-1">
                  <Zap size={10} className="text-emerald-500" /> AI Engine Active
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={onToggleCollapse}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-geo-card border border-geo-border flex items-center justify-center text-gray-400 hover:text-primary-400 hover:border-primary-500 transition-all duration-200 z-50"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </motion.aside>
  );
}
