"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Globe2, 
  Mail, 
  Lock, 
  User as UserIcon, 
  Tag, 
  Building, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  KeyRound
} from "lucide-react";
import { apiService } from "@/services/apiService";

export type AuthMode = "login" | "register" | "forgot" | "reset" | "verify";

interface AuthModalProps {
  initialMode: AuthMode;
  onSuccess: (user: any) => void;
  onCancel: () => void;
}

export default function AuthModal({ initialMode, onSuccess, onCancel }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Common Form States
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [industry, setIndustry] = useState("Government");
  const [designation, setDesignation] = useState("");
  
  // Reset Password States
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  // Verify parameters parsing
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");
      const paramEmail = params.get("email");
      
      if (token && paramEmail) {
        setMode("verify");
        setEmail(paramEmail);
        setResetToken(token);
        
        // Auto trigger verification on verify screen mount
        const triggerVerify = async () => {
          setIsLoading(true);
          try {
            await apiService.verifyEmail(paramEmail, token);
            setSuccessMsg("Email verified successfully! You can now sign in.");
          } catch (err: any) {
            setErrorMsg(err.message || "Email verification failed");
          } finally {
            setIsLoading(false);
          }
        };
        
        // Slight delay to allow animation
        const timeout = setTimeout(triggerVerify, 1000);
        return () => clearTimeout(timeout);
      }
    }
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiService.register({
        full_name: fullName,
        username,
        email,
        password,
        confirm_password: confirmPassword,
        industry,
        designation
      });
      setSuccessMsg(res.message || "Registration successful! Bypassing email verification - you can now log in.");
      // Clear form
      setFullName("");
      setUsername("");
      setPassword("");
      setConfirmPassword("");
      setDesignation("");
      setTimeout(() => {
        setMode("login");
        setSuccessMsg("");
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to register account");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    
    setIsLoading(true);
    try {
      const res = await apiService.login({
        login: email, // holds username or email
        password: password
      });
      
      // Store in local storage
      localStorage.setItem("geonarrative_token", res.access_token);
      localStorage.setItem("geonarrative_user", JSON.stringify(res.user));
      
      setSuccessMsg("Welcome! Authenticated successfully.");
      setTimeout(() => {
        onSuccess(res.user);
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || "Authentication failed. Double check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    
    setIsLoading(true);
    try {
      const res = await apiService.forgotPassword(email);
      setSuccessMsg(res.message || "If the account exists, a password reset link has been sent.");
    } catch (err: any) {
      setErrorMsg(err.message || "Request failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    
    if (newPassword !== confirmNewPassword) {
      setErrorMsg("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiService.resetPassword({
        email,
        token: resetToken,
        new_password: newPassword,
        confirm_new_password: confirmNewPassword
      });
      setSuccessMsg(res.message || "Your password has been reset successfully! Redirecting...");
      setTimeout(() => {
        setMode("login");
        setSuccessMsg("");
        setNewPassword("");
        setConfirmNewPassword("");
      }, 2500);
    } catch (err: any) {
      setErrorMsg(err.message || "Reset failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-md glass-card p-6 md:p-8 space-y-6 relative overflow-hidden"
      >
        {/* Back Link to Landing */}
        <button 
          onClick={onCancel}
          className="absolute top-4 left-4 text-gray-500 hover:text-white transition-colors flex items-center gap-1 text-[10px] font-mono font-bold uppercase"
        >
          <ArrowLeft size={10} /> Back to Hub
        </button>

        {/* Logo and Subtitle */}
        <div className="text-center pt-4 space-y-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-cyan-500 flex items-center justify-center mx-auto shadow-glow-primary">
            <Globe2 size={22} className="text-white" />
          </div>
          <h3 className="text-lg font-black text-white">
            {mode === "login" && "Welcome back"}
            {mode === "register" && "Create Portal Account"}
            {mode === "forgot" && "Reset Password Link"}
            {mode === "reset" && "Update Password"}
            {mode === "verify" && "Verifying Account Status"}
          </h3>
          <p className="text-[11px] text-gray-500 font-mono">
            {mode === "login" && "Access your smart-city digital twin"}
            {mode === "register" && "Standard registration parameters"}
            {mode === "forgot" && "Request an email password reset link"}
            {mode === "reset" && "Overwrite active credentials safely"}
            {mode === "verify" && "Matching tokens against database"}
          </p>
        </div>

        {/* Messaging Logs */}
        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }} 
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-lg bg-red-950/20 border border-red-500/30 text-[11px] text-red-400 flex items-start gap-2"
          >
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </motion.div>
        )}

        {successMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }} 
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-[11px] text-emerald-400 flex items-start gap-2"
          >
            <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </motion.div>
        )}

        {/* MODE 1: LOGIN FORM */}
        {mode === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 uppercase font-mono tracking-wider flex items-center gap-1.5">
                <Mail size={10} /> Username or Email
              </label>
              <input 
                type="text" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="planner@pune.gov.in"
                className="w-full px-3 py-2 rounded-lg bg-geo-dark border border-geo-border text-xs text-gray-200 outline-none focus:border-primary-500"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] text-gray-400 uppercase font-mono tracking-wider flex items-center gap-1.5">
                  <Lock size={10} /> Password
                </label>
                <button 
                  type="button"
                  onClick={() => setMode("forgot")}
                  className="text-[10px] text-primary-400 hover:underline"
                >
                  Forgot?
                </button>
              </div>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3 py-2 rounded-lg bg-geo-dark border border-geo-border text-xs text-gray-200 outline-none focus:border-primary-500"
              />
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full btn-primary justify-center text-xs py-2.5 font-bold shadow-lg shadow-primary-950/30"
            >
              {isLoading ? <Loader2 size={14} className="animate-spin text-white" /> : "Verify Identity & Sign In"}
            </button>

            <p className="text-[11px] text-gray-500 text-center">
              Don't have an account?{" "}
              <button type="button" onClick={() => setMode("register")} className="text-primary-400 font-bold hover:underline">
                Create Account
              </button>
            </p>
          </form>
        )}

        {/* MODE 2: REGISTER FORM */}
        {mode === "register" && (
          <form onSubmit={handleRegister} className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 uppercase font-mono tracking-wider flex items-center gap-1.5">
                <UserIcon size={10} /> Full Name
              </label>
              <input 
                type="text" 
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Sanjay Deshmukh"
                className="w-full px-3 py-2 rounded-lg bg-geo-dark border border-geo-border text-xs text-gray-200 outline-none focus:border-primary-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 uppercase font-mono tracking-wider flex items-center gap-1.5">
                  <Tag size={10} /> Username
                </label>
                <input 
                  type="text" 
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="sanjay_pune"
                  className="w-full px-3 py-2 rounded-lg bg-geo-dark border border-geo-border text-xs text-gray-200 outline-none focus:border-primary-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 uppercase font-mono tracking-wider flex items-center gap-1.5">
                  <Mail size={10} /> Email
                </label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sanjay@pune.gov.in"
                  className="w-full px-3 py-2 rounded-lg bg-geo-dark border border-geo-border text-xs text-gray-200 outline-none focus:border-primary-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 uppercase font-mono tracking-wider flex items-center gap-1.5">
                  <Building size={10} /> Domain/Industry
                </label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-geo-dark border border-geo-border text-xs text-gray-200 outline-none focus:border-primary-500"
                >
                  {["Government", "Urban Planners", "Researchers", "Consultants", "Disaster Management Teams"].map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 uppercase font-mono tracking-wider flex items-center gap-1.5">
                  <Tag size={10} /> Designation
                </label>
                <input 
                  type="text" 
                  required
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="Chief Planner"
                  className="w-full px-3 py-2 rounded-lg bg-geo-dark border border-geo-border text-xs text-gray-200 outline-none focus:border-primary-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 uppercase font-mono tracking-wider flex items-center gap-1.5">
                  <Lock size={10} /> Password
                </label>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 rounded-lg bg-geo-dark border border-geo-border text-xs text-gray-200 outline-none focus:border-primary-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 uppercase font-mono tracking-wider flex items-center gap-1.5">
                  <Lock size={10} /> Confirm
                </label>
                <input 
                  type="password" 
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 rounded-lg bg-geo-dark border border-geo-border text-xs text-gray-200 outline-none focus:border-primary-500"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full btn-primary justify-center text-xs py-2.5 font-bold shadow-lg shadow-primary-950/30 mt-2"
            >
              {isLoading ? <Loader2 size={14} className="animate-spin text-white" /> : "Complete Registry & Signup"}
            </button>

            <p className="text-[11px] text-gray-500 text-center pt-2">
              Already verified?{" "}
              <button type="button" onClick={() => setMode("login")} className="text-primary-400 font-bold hover:underline">
                Sign In
              </button>
            </p>
          </form>
        )}

        {/* MODE 3: FORGOT PASSWORD */}
        {mode === "forgot" && (
          <form onSubmit={handleForgot} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 uppercase font-mono tracking-wider flex items-center gap-1.5">
                <Mail size={10} /> Registered Email Address
              </label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="planner@pune.gov.in"
                className="w-full px-3 py-2 rounded-lg bg-geo-dark border border-geo-border text-xs text-gray-200 outline-none focus:border-primary-500"
              />
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full btn-primary justify-center text-xs py-2.5 font-bold shadow-lg shadow-primary-950/30"
            >
              {isLoading ? <Loader2 size={14} className="animate-spin text-white" /> : "Dispatched Secure Reset Link"}
            </button>

            <button 
              type="button" 
              onClick={() => setMode("login")} 
              className="w-full text-center text-[11px] text-primary-400 font-bold hover:underline block pt-2"
            >
              Back to Login
            </button>
          </form>
        )}

        {/* MODE 4: RESET PASSWORD */}
        {mode === "reset" && (
          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 uppercase font-mono tracking-wider flex items-center gap-1.5">
                <KeyRound size={10} /> Verification Token
              </label>
              <input 
                type="text" 
                required
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                placeholder="Outbox reset hex token"
                className="w-full px-3 py-2 rounded-lg bg-geo-dark border border-geo-border text-xs text-gray-200 outline-none focus:border-primary-500 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 uppercase font-mono tracking-wider flex items-center gap-1.5">
                <Lock size={10} /> New Password
              </label>
              <input 
                type="password" 
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3 py-2 rounded-lg bg-geo-dark border border-geo-border text-xs text-gray-200 outline-none focus:border-primary-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 uppercase font-mono tracking-wider flex items-center gap-1.5">
                <Lock size={10} /> Confirm New Password
              </label>
              <input 
                type="password" 
                required
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3 py-2 rounded-lg bg-geo-dark border border-geo-border text-xs text-gray-200 outline-none focus:border-primary-500"
              />
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full btn-primary justify-center text-xs py-2.5 font-bold shadow-lg shadow-primary-950/30"
            >
              {isLoading ? <Loader2 size={14} className="animate-spin text-white" /> : "Save New Password"}
            </button>
          </form>
        )}

        {/* MODE 5: EMAIL VERIFY WAITING */}
        {mode === "verify" && (
          <div className="text-center py-6 space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                <Loader2 size={24} className="animate-spin text-primary-400 mx-auto" />
                <p className="text-xs text-gray-400">Verifying signature in the database outbox...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <button 
                  onClick={() => {
                    setMode("login");
                    setErrorMsg("");
                    setSuccessMsg("");
                  }} 
                  className="btn-primary mx-auto justify-center text-xs py-2 px-6"
                >
                  Proceed to Sign In
                </button>
              </div>
            )}
          </div>
        )}

      </motion.div>
    </div>
  );
}
