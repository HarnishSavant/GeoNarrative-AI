"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ShieldCheck, ShieldAlert, Loader2, ArrowRight } from "lucide-react";
import { apiService } from "@/services/apiService";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const triggerVerification = async () => {
      const email = searchParams.get("email");
      const token = searchParams.get("token");

      if (!email || !token) {
        setStatus("error");
        setErrorMessage("Missing secure verification context. Please use the original link from your outbox activation email.");
        return;
      }

      try {
        await apiService.verifyEmail(email, token);
        setStatus("success");
      } catch (err: any) {
        setStatus("error");
        setErrorMessage(err.message || "The activation token is invalid, expired, or has already been used.");
      }
    };

    triggerVerification();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.05),transparent_50%)] pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-[#111827] border border-[#1f2937] p-8 rounded-2xl shadow-2xl relative z-10 text-center space-y-6"
      >
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-[#1b253b] flex items-center justify-center text-indigo-500 font-bold text-xl border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
            GN
          </div>
        </div>

        {status === "loading" && (
          <div className="space-y-4 py-4">
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto" />
            <h2 className="text-xl font-semibold text-gray-200">Verifying Security Signature...</h2>
            <p className="text-sm text-gray-400">Communicating with the PostGIS database cluster to activate your planner credentials.</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4 py-4">
            <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 rounded-full flex items-center justify-center mx-auto text-3xl">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-gray-100">Account Activated!</h2>
            <p className="text-sm text-gray-400">
              Your email verification has been confirmed. Your credit ledger is initialized with 100 free geoprocess tokens.
            </p>
            <button
              onClick={() => router.push("/?login=true")}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition flex items-center justify-center gap-2 group shadow-[0_4px_12px_rgba(99,102,241,0.3)]"
            >
              Proceed to Sign In
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4 py-4">
            <div className="w-14 h-14 bg-rose-500/10 border border-rose-500/30 text-rose-500 rounded-full flex items-center justify-center mx-auto">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-gray-100">Verification Failure</h2>
            <p className="text-sm text-rose-400 bg-rose-500/5 p-3 rounded-lg border border-rose-500/10">
              {errorMessage}
            </p>
            <button
              onClick={() => router.push("/")}
              className="w-full py-3 px-4 bg-[#1f2937] hover:bg-[#374151] text-gray-300 rounded-xl font-medium transition"
            >
              Return to Landing Page
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
