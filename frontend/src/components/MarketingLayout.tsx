"use client";

import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { Globe2, ArrowLeft, ArrowRight, ChevronRight, Home } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MarketingLayout({ children, title }: { children: React.ReactNode, title: string }) {
  const pathname = usePathname();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const navLinks = [
    { name: "About", path: "/about" },
    { name: "Services", path: "/services" },
    { name: "Features", path: "/features" },
    { name: "Documentation", path: "/documentation" },
    { name: "Contact", path: "/contact" },
  ];

  return (
    <div className="min-h-screen bg-geo-darker text-gray-100 flex flex-col font-sans overflow-x-hidden relative scroll-smooth">
      {/* Background Overlay */}
      <div className="fixed inset-0 bg-dot-grid pointer-events-none opacity-40 z-0" />
      <div className="fixed top-0 inset-x-0 h-[600px] bg-gradient-to-b from-primary-900/10 via-transparent to-transparent pointer-events-none z-0" />

      {/* Sticky Top Navigation */}
      <header className="h-16 md:h-20 border-b border-geo-border/40 bg-geo-darker/80 backdrop-blur-xl sticky top-0 z-50 flex items-center justify-between px-4 md:px-12 transition-all shadow-md">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.3)] group-hover:scale-105 transition-transform">
              <Globe2 size={20} className="text-white animate-spin-slow" />
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-black tracking-tight text-white leading-none">GeoNarrative</h1>
                <span className="text-[8px] bg-primary-500/20 border border-primary-500/30 text-primary-400 px-1 py-0.5 rounded font-black font-mono">v1.2</span>
              </div>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1 ml-4 bg-geo-card/40 p-1 rounded-xl border border-geo-border/50">
            {navLinks.map((link) => {
              const isActive = pathname === link.path;
              return (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-300 ${
                    isActive 
                      ? "bg-primary-500/20 text-primary-300 shadow-sm" 
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-xs font-bold bg-geo-card hover:bg-geo-border/50 border border-geo-border text-gray-300 rounded-xl py-2 px-4 transition-all flex items-center gap-1.5 group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform text-primary-400" />
            <span className="hidden sm:inline">Return to App</span>
            <span className="sm:hidden">App</span>
          </Link>
        </div>
      </header>

      {/* Elegant Breadcrumbs */}
      <div className="w-full bg-black/20 border-b border-geo-border/30 relative z-40 px-4 md:px-12 py-3 flex items-center gap-2 text-[10px] uppercase font-mono font-bold tracking-widest text-gray-500">
        <Link href="/" className="hover:text-primary-400 transition-colors flex items-center gap-1">
          <Home size={12} /> Home
        </Link>
        <ChevronRight size={10} className="text-gray-600" />
        <span className="text-primary-400">{title}</span>
      </div>

      {/* Main Scrollable Content */}
      <main className="flex-1 relative z-10 w-full">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-geo-border/40 bg-geo-darker/90 py-12 px-6 md:px-12 relative z-10 mt-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2">
              <Globe2 size={20} className="text-primary-500" />
              <span className="font-bold text-gray-200 text-lg">GeoNarrative AI</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Enterprise spatial intelligence and predictive multi-domain modeling for modern municipalities and planners.
            </p>
          </div>
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm tracking-wide">Platform</h4>
            <div className="flex flex-col gap-2 text-xs text-gray-400">
              <Link href="/features" className="hover:text-primary-400 transition-colors">Core Features</Link>
              <Link href="/services" className="hover:text-primary-400 transition-colors">SaaS Services</Link>
              <Link href="/" className="hover:text-primary-400 transition-colors">Dashboard App</Link>
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm tracking-wide">Company</h4>
            <div className="flex flex-col gap-2 text-xs text-gray-400">
              <Link href="/about" className="hover:text-primary-400 transition-colors">About Us</Link>
              <Link href="/contact" className="hover:text-primary-400 transition-colors">Contact Enterprise</Link>
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm tracking-wide">Legal</h4>
            <div className="flex flex-col gap-2 text-xs text-gray-400">
              <Link href="/documentation" className="hover:text-primary-400 transition-colors">API Documentation</Link>
              <Link href="/privacy" className="hover:text-primary-400 transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-primary-400 transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-8 border-t border-geo-border/40 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-mono text-[10px] text-gray-600">© 2026 GeoNarrative AI Inc. All rights reserved. Secure JWT-Encrypted.</p>
          
          <button 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="text-[10px] font-mono text-primary-500 hover:text-primary-400 uppercase tracking-widest flex items-center gap-1 transition-colors"
          >
            Back to top <ArrowRight size={10} className="-rotate-90" />
          </button>
        </div>
      </footer>
    </div>
  );
}
