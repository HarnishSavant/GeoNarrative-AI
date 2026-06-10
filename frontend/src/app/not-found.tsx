"use client";

import React from "react";
import MarketingLayout from "@/components/MarketingLayout";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <MarketingLayout title="404 - Not Found">
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <div className="w-24 h-24 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-8 shadow-glow-primary">
          <AlertTriangle size={48} className="text-red-400" />
        </div>
        
        <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight mb-4">
          404 <span className="text-primary-400">Error</span>
        </h1>
        
        <p className="text-base text-gray-400 max-w-md mx-auto mb-10 leading-relaxed">
          The requested spatial route or intelligence document could not be located. It may have been archived or the URL may be incorrect.
        </p>

        <Link 
          href="/" 
          className="btn-primary px-8 py-3.5 text-sm font-bold flex items-center gap-2 transition-all hover:-translate-y-1"
        >
          <ArrowLeft size={16} /> Return to Mission Control
        </Link>
      </div>
    </MarketingLayout>
  );
}
