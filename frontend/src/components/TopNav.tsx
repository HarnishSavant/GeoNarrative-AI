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
import { mockNotifications } from "@/lib/mockData";

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
    "Pune, Maharashtra, India",
    "Mumbai, Maharashtra, India",
    "Chennai, Tamil Nadu, India",
    "Delhi, India",
    "Bangalore, Karnataka, India",
    "Kolkata, West Bengal, India",
    "Hyderabad, Telangana, India",
    "New York, USA",
    "Tokyo, Japan",
    "London, UK",
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

  const unreadCount = mockNotifications.filter((n) => !n.read).length;

  return (
    <header className="h-16 bg-geo-darker/80 backdrop-blur-xl border-b border-geo-border flex items-center justify-between px-6 z-40 relative">
      {/* Left — Current Location */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary-500/10 border border-primary-500/20">
          <MapPin size={14} className="text-primary-400" />
          <span className="text-sm font-medium text-primary-300">{currentLocation}</span>
        </div>
      </div>

      {/* Center — Search */}
      <div ref={searchRef} className="relative w-full max-w-xl mx-8">
        <form onSubmit={handleSearch}>
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleInputChange(e.target.value)}
              onFocus={() => searchQuery.length > 0 && setShowSuggestions(true)}
              placeholder="Search any city or location..."
              className="w-full pl-11 pr-12 py-2.5 rounded-xl bg-geo-card/80 border border-geo-border text-sm text-gray-200 placeholder-gray-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-200 outline-none"
              id="location-search"
            />
            {isSearching && (
              <Loader2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-primary-400 animate-spin" />
            )}
            {searchQuery && !isSearching && (
              <button
                type="button"
                onClick={() => { setSearchQuery(""); setShowSuggestions(false); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </form>

        {/* Suggestions Dropdown */}
        <AnimatePresence>
          {showSuggestions && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full mt-2 w-full glass-card p-2 z-50 shadow-xl"
            >
              {searchSuggestions.map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setSearchQuery(suggestion);
                    onLocationSearch(suggestion);
                    setShowSuggestions(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-primary-500/10 text-sm text-gray-300 hover:text-primary-300 transition-colors text-left"
                >
                  <MapPin size={14} className="text-gray-500 flex-shrink-0" />
                  <span>{suggestion}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
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
                className="absolute right-0 top-full mt-2 w-80 glass-card p-4 z-50 shadow-xl"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">Notifications</h3>
                  <span className="text-xs text-primary-400 cursor-pointer hover:text-primary-300">
                    Mark all read
                  </span>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                  {mockNotifications.map((notif) => (
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
                className="absolute right-0 top-full mt-2 w-56 glass-card p-3 z-50 shadow-xl"
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
