"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { KeyRound, ShieldAlert, CheckCircle, Loader2, ArrowRight } from "lucide-react";
import { apiService } from "@/services/apiService";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [status, setStatus] = useState<"form" | "loading" | "success" | "error">("form");
  const [errorMessage, setErrorMessage] = useState("");
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    const t = searchParams.get("token");
    const e = searchParams.get("email");
    if (!t || !e) {
      setStatus("error");
      setErrorMessage("Secure validation context is missing. Please initiate a new password reset sequence.");
    } else {
      setToken(t);
      setEmail(e);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");

    // Validate passwords match
    if (password !== confirmPassword) {
      setValidationError("Passwords do not match.");
      return;
    }

    // Enforce basic length constraint
    if (password.length < 8) {
      setValidationError("Password must be at least 8 characters long.");
      return;
    }

    setStatus("loading");
    try {
      await apiService.resetPassword({
        email,
        token,
        new_password: password
      });
      setStatus("success");
    } catch (err: any) {
      setStatus("form");
      setValidationError(err.message || "Failed to reset password. The link may have expired.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.05),transparent_50%)] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-[#111827] border border-[#1f2937] p-8 rounded-2xl shadow-2xl relative z-10 space-y-6"
      >
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <div className="w-12 h-12 rounded-full bg-[#1b253b] flex items-center justify-center text-indigo-500 font-bold border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
              GN
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-100">Establish New Password</h2>
          <p className="text-sm text-gray-400">Complete the form below to secure your planner account credentials.</p>
        </div>

        {status === "form" && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {validationError && (
              <div className="p-3 bg-rose-500/5 border border-rose-500/20 text-rose-400 text-xs rounded-lg flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400">New Secure Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                  <KeyRound className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  placeholder="At least 8 characters..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full py-2.5 pl-10 pr-4 bg-[#1b253b] border border-[#1f2937] focus:border-indigo-500 text-gray-200 placeholder-gray-500 rounded-xl text-sm outline-none transition"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400">Confirm Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                  <KeyRound className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  placeholder="Re-enter password..."
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full py-2.5 pl-10 pr-4 bg-[#1b253b] border border-[#1f2937] focus:border-indigo-500 text-gray-200 placeholder-gray-500 rounded-xl text-sm outline-none transition"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 mt-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition flex items-center justify-center gap-2 group shadow-[0_4px_12px_rgba(99,102,241,0.3)]"
            >
              Update Credentials
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
        )}

        {status === "loading" && (
          <div className="text-center space-y-4 py-8">
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto" />
            <h3 className="text-lg font-semibold text-gray-200">Rewriting Encrypted Signatures...</h3>
            <p className="text-sm text-gray-400">Updating security records and database indices safely.</p>
          </div>
        )}

        {status === "success" && (
          <div className="text-center space-y-4 py-4">
            <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 rounded-full flex items-center justify-center mx-auto text-3xl">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-gray-100">Password Updated!</h3>
            <p className="text-sm text-gray-400">
              Your security credentials have been updated successfully. You can now log in using your new password.
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
          <div className="text-center space-y-4 py-4">
            <div className="w-14 h-14 bg-rose-500/10 border border-rose-500/30 text-rose-500 rounded-full flex items-center justify-center mx-auto">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-gray-100">Update Failure</h3>
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
