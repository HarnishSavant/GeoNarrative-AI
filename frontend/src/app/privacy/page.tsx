"use client";

import React from "react";
import MarketingLayout from "@/components/MarketingLayout";

export default function PrivacyPage() {
  return (
    <MarketingLayout title="Privacy Policy">
      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="glass-premium p-8 md:p-12 rounded-3xl border border-white/10">
          <div className="prose prose-invert max-w-none text-gray-300 text-sm leading-relaxed space-y-6">
            <h1 className="text-3xl font-black mb-6 text-white tracking-tight">Privacy Policy</h1>
            <p>Last updated: June 10, 2026</p>
            
            <p>
              At GeoNarrative AI, accessible from geonarrative.ai, one of our main priorities is the privacy of our visitors and enterprise users. This Privacy Policy document contains types of information that is collected and recorded by GeoNarrative AI and how we use it.
            </p>

            <h3 className="text-xl font-bold text-white mt-8 mb-4 border-b border-white/10 pb-2">Information We Collect</h3>
            <p>
              We collect information to provide better services to all our users. We securely store account credentials (using hashed passwords), spatial data uploads, and geoprocessing telemetry logs.
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4 text-gray-400">
              <li><strong>Account Data:</strong> Name, Email address, Industry, and Designation.</li>
              <li><strong>Billing Data:</strong> Processed securely via Razorpay. We do not store full credit card numbers on our servers.</li>
              <li><strong>Spatial Uploads:</strong> GeoJSON, Shapefiles, and CSVs uploaded for processing are temporarily cached securely on our PostGIS infrastructure.</li>
            </ul>

            <h3 className="text-xl font-bold text-white mt-8 mb-4 border-b border-white/10 pb-2">How We Use Your Information</h3>
            <p>We use the information we collect in various ways, including to:</p>
            <ul className="list-disc pl-6 space-y-2 mt-4 text-gray-400">
              <li>Provide, operate, and maintain our spatial analytics platform</li>
              <li>Improve, personalize, and expand our predictive models</li>
              <li>Understand and analyze how you use our Mapbox interfaces</li>
              <li>Develop new analytics modules, API endpoints, and features</li>
              <li>Communicate with you regarding enterprise trial allocations</li>
            </ul>

            <h3 className="text-xl font-bold text-white mt-8 mb-4 border-b border-white/10 pb-2">Security Data Logs</h3>
            <p>
              GeoNarrative AI follows a standard procedure of using audit logs. These logs track user activity within the dashboard, API hits, and AI inferences. The information collected includes internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamp, referring/exit pages, and the number of clicks.
            </p>

          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
