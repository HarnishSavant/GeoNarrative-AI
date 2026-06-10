"use client";

import React from "react";
import MarketingLayout from "@/components/MarketingLayout";

export default function DocumentationPage() {
  return (
    <MarketingLayout title="API Documentation">
      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="glass-premium p-8 md:p-12 rounded-3xl border border-white/10">
          <div className="prose prose-invert prose-primary max-w-none">
            <h1 className="text-3xl font-black mb-6 text-white tracking-tight">Enterprise API Documentation</h1>
            <p className="text-gray-400 text-sm leading-relaxed mb-8">
              Welcome to the GeoNarrative AI developer hub. Our RESTful API allows you to integrate spatial analytics, proximity queries, and XGBoost predictive models directly into your custom municipal applications.
            </p>
            
            <h3 className="text-xl font-bold text-white mt-8 mb-4 border-b border-white/10 pb-2">Authentication</h3>
            <p className="text-sm text-gray-400 mb-4">
              All API endpoints are authenticated using standard JSON Web Tokens (JWT). You must include your token in the Authorization header of every request.
            </p>
            <pre className="bg-black/50 p-4 rounded-lg border border-white/10 text-xs font-mono text-gray-300 overflow-x-auto mb-8">
              {`Authorization: Bearer <YOUR_ENTERPRISE_TOKEN>`}
            </pre>

            <h3 className="text-xl font-bold text-white mt-8 mb-4 border-b border-white/10 pb-2">Base URL</h3>
            <pre className="bg-black/50 p-4 rounded-lg border border-white/10 text-xs font-mono text-gray-300 overflow-x-auto mb-8">
              {`https://api.geonarrative.ai/v1`}
            </pre>

            <h3 className="text-xl font-bold text-white mt-8 mb-4 border-b border-white/10 pb-2">Available Endpoints</h3>
            
            <div className="space-y-6">
              <div className="bg-geo-card/40 p-4 rounded-xl border border-geo-border">
                <div className="flex items-center gap-3 mb-2">
                  <span className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded text-[10px] font-bold font-mono">GET</span>
                  <span className="font-mono text-sm text-gray-200">/analytics/kpi</span>
                </div>
                <p className="text-xs text-gray-500">Retrieves real-time metric KPIs for a given location and domain mode (e.g. flood_risk, traffic).</p>
              </div>

              <div className="bg-geo-card/40 p-4 rounded-xl border border-geo-border">
                <div className="flex items-center gap-3 mb-2">
                  <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-[10px] font-bold font-mono">POST</span>
                  <span className="font-mono text-sm text-gray-200">/predict</span>
                </div>
                <p className="text-xs text-gray-500">Executes the XGBoost ensemble model. Requires a payload with parameters like rainfall, elevation, land_use, etc.</p>
              </div>

              <div className="bg-geo-card/40 p-4 rounded-xl border border-geo-border">
                <div className="flex items-center gap-3 mb-2">
                  <span className="bg-violet-500/20 text-violet-400 px-2 py-1 rounded text-[10px] font-bold font-mono">GET</span>
                  <span className="font-mono text-sm text-gray-200">/flood/zones</span>
                </div>
                <p className="text-xs text-gray-500">Runs PostGIS intersection logic to return GeoJSON polygons of hazard zones for the active city basin.</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
