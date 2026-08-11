"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Bell,
  User,
  MapPin,
  ChevronDown,
  X,
  Loader2,
  Globe2,
} from "lucide-react";
import { Notification } from "@/lib/types";
import { fallbackNotifications } from "@/lib/mockData";

interface TopNavProps {
  onLocationSearch: (location: string) => void;
  currentLocation: string;
  user: any;
  onTabChange: (tab: any) => void;
  onLogout: () => void;
}

export default function TopNav({ onLocationSearch, currentLocation, user, onTabChange, onLogout }: TopNavProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);


  const suggestions = [
    "Pune Metropolitan Region, Maharashtra, India",
    "Pune City, Maharashtra, India",
    "Pimpri-Chinchwad, Maharashtra, India",
    "Hinjawadi IT Park, Pune",
    "Kalyani Nagar, Pune",
    "Koregaon Park, Pune",
    "Wakad, Pune",
    "Baner, Pune",
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearching(true);
      setTimeout(() => {
        onLocationSearch(searchQuery);
        setIsSearching(false);
        setShowSuggestions(false);
      }, 800);
    }
  };

  const handleInputChange = (value: string) => {
    setSearchQuery(value);
    if (value.length > 0) {
      const filtered = suggestions.filter((s) =>
        s.toLowerCase().includes(value.toLowerCase())
      );
      setSearchSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const unreadCount = fallbackNotifications.filter((n) => !n.read).length;

  return (
    <header className="h-14 bg-[#080a14]/90 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-5 z-40 relative">
      {/* Left — Current Location */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/20 border border-white/10 shadow-inner backdrop-blur-md">
          <Globe2 size={14} className="text-primary-400" />
          <span className="text-xs font-semibold text-gray-200 tracking-wide">{currentLocation}</span>
        </div>
      </div>

      {/* Center — Search (Removed for Phase 1) */}
      <div className="relative w-full max-w-xl mx-8 flex items-center justify-center">
        {/* The study area is fixed to PMC. Search has been removed. */}
      </div>

      {/* Right — Actions */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-primary-400 hover:bg-primary-500/10 transition-all duration-200 relative"
            title="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute right-0 top-full mt-3 w-80 bg-[#0f172a]/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 z-50 shadow-2xl"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">Notifications</h3>
                  <span className="text-xs text-primary-400 cursor-pointer hover:text-primary-300">
                    Mark all read
                  </span>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                  {fallbackNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                        notif.read
                          ? "border-transparent hover:bg-white/5"
                          : "border-primary-500/20 bg-primary-500/5 hover:bg-primary-500/10"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div
                          className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                            notif.type === "warning"
                              ? "bg-amber-500"
                              : notif.type === "success"
                              ? "bg-emerald-500"
                              : "bg-blue-500"
                          }`}
                        />
                        <div>
                          <p className="text-xs font-medium text-gray-200">{notif.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{notif.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-xl hover:bg-primary-500/10 transition-all duration-200"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-cyan-500 flex items-center justify-center">
              <User size={14} className="text-white" />
            </div>
            <ChevronDown size={12} className="text-gray-500" />
          </button>

          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute right-0 top-full mt-3 w-56 bg-[#0f172a]/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-3 z-50 shadow-2xl"
              >
                <div className="px-3 py-2 border-b border-geo-border mb-2">
                  <p className="text-sm font-medium text-white">{user ? user.full_name : "GeoAnalyst"}</p>
                  <p className="text-xs text-gray-500 font-mono overflow-hidden text-ellipsis">{user ? user.email : "admin@geonarrative.ai"}</p>
                </div>
                <button 
                  onClick={() => { onTabChange("profile"); setShowProfile(false); }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-primary-500/10 hover:text-primary-300 transition-colors"
                >
                  Profile Settings
                </button>
                {user && user.role === "admin" && (
                  <button 
                    onClick={() => { onTabChange("admin"); setShowProfile(false); }}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-primary-500/10 hover:text-primary-300 transition-colors"
                  >
                    Admin Console
                  </button>
                )}
                <button 
                  onClick={() => { onLogout(); setShowProfile(false); }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors mt-1 border-t border-geo-border/40 pt-2"
                >
                  Sign Out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
