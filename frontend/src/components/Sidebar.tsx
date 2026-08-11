"use client";

import React from "react";
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
  User,
  Shield,
  Building2,
} from "lucide-react";
import { SidebarTab } from "@/lib/types";

interface SidebarProps {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  user: any;
}

interface NavItem {
  id: SidebarTab;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export default function Sidebar({ activeTab, onTabChange, collapsed, onToggleCollapse, user }: SidebarProps) {
  const groups: NavGroup[] = [
    {
      title: "Operations",
      items: [
        { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
        { id: "map", label: "Map Layers", icon: <Map size={18} /> },

        { id: "twin", label: "3D Digital Twin", icon: <Building2 size={18} /> },
      ],
    },
    {
      title: "Intelligence",
      items: [
        { id: "chat", label: "AI Assistant", icon: <MessageSquareText size={18} />, badge: 1 },
        { id: "analytics", label: "Analytics", icon: <BarChart3 size={18} /> },
        { id: "prediction", label: "Prediction", icon: <BrainCircuit size={18} /> },
        { id: "reports", label: "Reports", icon: <FileText size={18} /> },
      ],
    },
    {
      title: "System",
      items: [
        { id: "settings", label: "Settings", icon: <Settings size={18} /> },
        { id: "profile", label: "SaaS Profile", icon: <User size={18} /> },
        ...(user && user.role === "admin" ? [{ id: "admin" as SidebarTab, label: "Admin Console", icon: <Shield size={18} /> }] : []),
      ],
    },
  ];

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 64 : 220 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="h-full flex flex-col relative z-30 bg-white border-r border-gray-200"
    >
      {/* Logo */}
      <div className="px-4 flex items-center gap-2.5 border-b border-gray-200 h-14 flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
          <Globe2 size={17} className="text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.2 }} className="overflow-hidden">
              <h1 className="text-sm font-bold gradient-text whitespace-nowrap leading-tight">GeoNarrative</h1>
              <p className="text-[9px] text-gray-600 whitespace-nowrap font-medium tracking-wider uppercase">Digital Twin Platform</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 py-2 overflow-y-auto custom-scrollbar">
        {groups.map((group, gi) => (
          <div key={group.title} className={gi > 0 ? "mt-1" : ""}>
            {/* Section Header */}
            <AnimatePresence>
              {!collapsed && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="px-4 pt-4 pb-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  {group.title}
                </motion.p>
              )}
            </AnimatePresence>
            {collapsed && gi > 0 && <div className="mx-3 my-2 border-t border-gray-200" />}

            <div className="px-2 space-y-0.5">
              {group.items.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <motion.button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`w-full flex items-center gap-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 relative overflow-hidden ${
                      collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2"
                    } ${
                      isActive
                        ? "text-blue-700 bg-blue-50/80 font-semibold shadow-sm"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                    whileTap={{ scale: 0.97 }}
                    title={collapsed ? tab.label : undefined}
                  >
                    {/* Active indicator bar */}
                    {isActive && (
                      <motion.div layoutId="sidebarActive"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-blue-600"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }} />
                    )}
                    <span className="flex-shrink-0 relative">
                      {tab.icon}
                      {tab.badge && (
                        <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 bg-primary-500 rounded-full text-[7px] font-bold flex items-center justify-center text-white">
                          {tab.badge}
                        </span>
                      )}
                    </span>
                    <AnimatePresence>
                      {!collapsed && (
                        <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.15 }} className="whitespace-nowrap overflow-hidden">
                          {tab.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Status Footer */}
      <div className="px-3 py-3 border-t border-gray-200 flex-shrink-0 bg-gray-50/50">
        <div className={`flex items-center gap-2.5 ${collapsed ? "justify-center" : ""}`}>
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-[10px] text-gray-600 flex items-center gap-1.5 font-medium">
                <Zap size={10} className="text-emerald-500" /> AI Engine Active
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Collapse Toggle */}
      <button onClick={onToggleCollapse}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all duration-200 z-50 shadow-sm">
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </motion.aside>
  );
}
