"use client";

import React from "react";
import MarketingLayout from "@/components/MarketingLayout";

export default function TermsPage() {
  return (
    <MarketingLayout title="Terms of Service">
      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="glass-premium p-8 md:p-12 rounded-3xl border border-white/10">
          <div className="prose prose-invert max-w-none text-gray-300 text-sm leading-relaxed space-y-6">
            <h1 className="text-3xl font-black mb-6 text-white tracking-tight">Terms of Service</h1>
            <p>Last updated: June 10, 2026</p>
            
            <p>
              Please read these terms and conditions carefully before using Our Service.
            </p>

            <h3 className="text-xl font-bold text-white mt-8 mb-4 border-b border-white/10 pb-2">Acknowledgment</h3>
            <p>
              These are the Terms and Conditions governing the use of the GeoNarrative AI Enterprise Platform and the agreement that operates between You and the Company. These Terms and Conditions set out the rights and obligations of all users regarding the use of the Service.
            </p>

            <h3 className="text-xl font-bold text-white mt-8 mb-4 border-b border-white/10 pb-2">Subscriptions and Billing</h3>
            <p>
              Our platform offers commercial SaaS tiers. You will be billed in advance on a recurring and periodic basis (such as daily, weekly, monthly or annually), depending on the type of Subscription plan you select. At the end of each period, your Subscription will automatically renew under the exact same conditions unless you cancel it or the Company cancels it.
            </p>

            <h3 className="text-xl font-bold text-white mt-8 mb-4 border-b border-white/10 pb-2">Geospatial Data Usage</h3>
            <p>
              By uploading data (e.g., GeoJSON, shapefiles) to GeoNarrative AI, you retain all rights to your data. However, you grant us a temporary license to process, parse, and analyze this data exclusively for the purpose of returning spatial intelligence metrics back to your dashboard. We do not sell or license your custom datasets to third parties.
            </p>

            <h3 className="text-xl font-bold text-white mt-8 mb-4 border-b border-white/10 pb-2">Service Level Agreement (SLA)</h3>
            <p>
              For Premium Annual subscribers, we guarantee a 99.9% uptime for the Mapbox GL rendering engine and PostGIS query pipelines. Should downtime exceed this, you are eligible for prorated credit refunds.
            </p>

          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
