"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User as UserIcon, 
  Mail, 
  Briefcase, 
  Building2, 
  Zap, 
  Award, 
  LogOut, 
  Coins, 
  ArrowUpRight, 
  LineChart,
  RefreshCw,
  Loader2,
  Calendar,
  CreditCard,
  History,
  Lock,
  Download,
  FileCheck2,
  ListFilter,
  CheckCircle,
  FileText
} from "lucide-react";
import { apiService } from "@/services/apiService";

interface UserDashboardProps {
  user: any;
  onLogout: () => void;
  onRefreshProfile: () => void;
}

type DashboardSubTab = "subscription" | "profile" | "logs" | "exports";

export default function UserDashboard({ user, onLogout, onRefreshProfile }: UserDashboardProps) {
  const [activeSubTab, setActiveSubTab] = useState<DashboardSubTab>("subscription");
  const [billing, setBilling] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [usageLogs, setUsageLogs] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeMsg, setUpgradeMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Custom high-fidelity interactive Razorpay Checkout simulator states
  const [showMockCheckout, setShowMockCheckout] = useState(false);
  const [checkoutTier, setCheckoutTier] = useState("");
  const [checkoutAmount, setCheckoutAmount] = useState(0);
  const [checkoutEmail, setCheckoutEmail] = useState("");
  const [checkoutOrderId, setCheckoutOrderId] = useState("");
  const [isSimulatingSuccess, setIsSimulatingSuccess] = useState(false);
  const [isSimulatingFailure, setIsSimulatingFailure] = useState(false);
  const [isSimulatedDone, setIsSimulatedDone] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'netbanking' | 'card'>('netbanking');
  const [mockSelectedBank, setMockSelectedBank] = useState("State Bank of India");

  // Profile Edit fields
  const [fullName, setFullName] = useState(user.full_name || "");
  const [industry, setIndustry] = useState(user.industry || "");
  const [designation, setDesignation] = useState(user.designation || "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");

  // Password fields
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState("");

  const loadBillingAndEnterpriseData = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const [status, paymentList, logsList, activities] = await Promise.all([
        apiService.getBillingStatus().catch(err => {
          console.warn("Resilient User Dashboard: Failed to load billing status:", err);
          return null;
        }),
        apiService.getPaymentHistory().catch(err => {
          console.warn("Resilient User Dashboard: Failed to load payment history:", err);
          return [];
        }),
        apiService.getUsageLogs().catch(err => {
          console.warn("Resilient User Dashboard: Failed to load usage logs:", err);
          return [];
        }),
        apiService.listActivityLogs().catch(err => {
          console.warn("Resilient User Dashboard: Failed to load activity logs:", err);
          return [];
        })
      ]);
      setBilling(status);
      setPayments(paymentList);
      setUsageLogs(logsList);
      setActivityLogs(activities);
    } catch (err: any) {
      console.error("Failed to load account metrics:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Inject Razorpay checkout script on mount
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    loadBillingAndEnterpriseData();
    // Sync field states
    setFullName(user.full_name || "");
    setIndustry(user.industry || "");
    setDesignation(user.designation || "");
  }, [user]);

  const handleUpgrade = async (tier: string) => {
    setIsUpgrading(true);
    setUpgradeMsg("");
    setErrorMsg("");
    try {
      if (tier === "free") {
        const verifyRes = await apiService.verifyRazorpayPayment({
          razorpay_order_id: "order_free_" + Math.random().toString(36).substring(7),
          razorpay_payment_id: "pay_free_" + Math.random().toString(36).substring(7),
          razorpay_signature: "MOCK_SIGNATURE",
          plan_type: "free"
        });
        setUpgradeMsg(verifyRes.message || "Downgraded to Free Sandbox.");
        onRefreshProfile();
        return;
      }

      const orderData = await apiService.createRazorpayOrder(tier);

      // Check if we are using the default mock/sandbox key
      const isSandboxKey = orderData.key === "rzp_test_geonar2026abcd";

      if (isSandboxKey) {
        // Trigger the premium simulated custom Razorpay checkout overlay!
        setCheckoutTier(tier);
        setCheckoutAmount(orderData.amount / 100); // converting paise to rupees
        setCheckoutEmail(orderData.user_email || user.email);
        setCheckoutOrderId(orderData.order_id);
        setIsSimulatingSuccess(false);
        setIsSimulatingFailure(false);
        setIsSimulatedDone(false);
        setShowMockCheckout(true);
        setIsUpgrading(false);
        return;
      }

      // Fallback for real Razorpay Keys
      if (!(window as any).Razorpay) {
        setErrorMsg("Razorpay payment gateway script not loaded. Please disable ad-blockers or try again.");
        setIsUpgrading(false);
        return;
      }

      const options: any = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "GeoNarrative AI",
        description: `${tier.replace('_', ' ').toUpperCase()} SaaS Premium Plan`,
        order_id: orderData.order_id,
        handler: async function (response: any) {
          setIsUpgrading(true);
          try {
            const verifyRes = await apiService.verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan_type: tier
            });
            setUpgradeMsg(verifyRes.message || "Invoice cleared and plan upgraded successfully!");
            onRefreshProfile();
            setTimeout(() => {
              loadBillingAndEnterpriseData();
            }, 300);
          } catch (err: any) {
            setErrorMsg(err.message || "Payment signature verification failed.");
          } finally {
            setIsUpgrading(false);
          }
        },
        prefill: {
          name: orderData.user_name,
          email: orderData.user_email,
        },
        theme: {
          color: "#3b82f6"
        },
        modal: {
          ondismiss: function () {
            setIsUpgrading(false);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      setErrorMsg(err.message || "Upgrade payment process cancelled or failed.");
      setIsUpgrading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileSuccess("");
    setErrorMsg("");
    try {
      const res = await apiService.updateProfileDetails({
        full_name: fullName,
        industry: industry,
        designation: designation
      });
      setProfileSuccess(res.message || "Profile details updated successfully!");
      onRefreshProfile();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update profile.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setErrorMsg("New passwords do not match.");
      return;
    }
    setIsChangingPassword(true);
    setPasswordSuccess("");
    setErrorMsg("");
    try {
      const res = await apiService.changePassword({
        old_password: oldPassword,
        new_password: newPassword
      });
      setPasswordSuccess(res.message || "Password changed successfully.");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to change password. Ensure old password is correct.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDownloadExport = async (type: 'csv' | 'pdf') => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const token = localStorage.getItem("geonarrative_token");
      const response = await fetch(`${apiService.getBaseUrl()}/api/v1/enterprise/export/${type}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error(`Export download failed`);
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `geonarrative_${type === 'csv' ? 'analytics_records' : 'executive_brief'}_${Date.now()}.${type}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      
      // Auto-refresh activity logs to display the export step
      const activities = await apiService.listActivityLogs().catch(() => []);
      setActivityLogs(activities);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to compile export document.");
    } finally {
      setIsLoading(false);
    }
  };

  const getSubBadgeClass = (sub: string) => {
    switch (sub?.toLowerCase()) {
      case "premium_annual": return "bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-violet-500/30";
      case "premium_6months": return "bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-500/30";
      case "premium_monthly": return "bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-cyan-500/30";
      default: return "bg-gray-600/20 text-gray-400 border-gray-500/20";
    }
  };

  const formatPlanName = (plan: string) => {
    if (!plan) return "Free User";
    return plan.replace("_", " ").toUpperCase();
  };

  return (
    <div className="p-6 space-y-6 h-full overflow-y-auto custom-scrollbar bg-geo-darker/20">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-geo-border/60 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-600 to-cyan-500 flex items-center justify-center text-white shadow-glow-primary uppercase font-black text-lg">
            {fullName?.charAt(0) || user.username?.charAt(0) || "U"}
          </div>
          <div>
            <h3 className="text-base font-bold text-white leading-none">{fullName || user.username}</h3>
            <span className="text-[10px] text-gray-500 font-mono">@{user.username} • Account Management Center</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sub Tab Navigation */}
          {(["subscription", "profile", "logs", "exports"] as DashboardSubTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border capitalize transition-all duration-300 ${
                activeSubTab === tab
                  ? "bg-primary-600/10 border-primary-500/30 text-primary-400"
                  : "bg-geo-card/30 border-geo-border text-gray-400 hover:text-gray-200"
              }`}
            >
              {tab}
            </button>
          ))}
          
          <button 
            onClick={loadBillingAndEnterpriseData}
            disabled={isLoading}
            className="p-2 rounded-lg border border-geo-border hover:border-primary-500 transition-colors text-gray-400 hover:text-white ml-2"
          >
            {isLoading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
          </button>
          
          <button 
            onClick={onLogout}
            className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors py-1.5 px-3 rounded-lg border border-red-500/20 bg-red-950/10"
          >
            <LogOut size={13} /> Sign Out
          </button>
        </div>
      </div>

      {/* MESSAGES & NOTIFICATION BANNER */}
      {upgradeMsg && (
        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-[11px] text-emerald-400 flex items-center gap-2"
        >
          <Award size={14} className="shrink-0" />
          <span>{upgradeMsg}</span>
        </motion.div>
      )}

      {errorMsg && (
        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-lg bg-red-950/20 border border-red-500/30 text-[11px] text-red-400 flex items-center gap-2"
        >
          <Award size={14} className="shrink-0 text-red-500" />
          <span>{errorMsg}</span>
        </motion.div>
      )}

      {/* RENDER ACTIVE SUBTAB CONTENT */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSubTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {/* TAB 1: SUBSCRIPTIONS & BILLING */}
          {activeSubTab === "subscription" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Meta details */}
                <div className="glass-card p-5 space-y-4">
                  <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                    <UserIcon size={12} className="text-gray-400" /> Active Account Meta
                  </h4>
                  
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between border-b border-geo-border/40 pb-2">
                      <span className="text-gray-500 flex items-center gap-1"><Mail size={12} /> Email</span>
                      <span className="text-gray-200 font-medium">{user.email}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-geo-border/40 pb-2">
                      <span className="text-gray-500 flex items-center gap-1"><Briefcase size={12} /> Designation</span>
                      <span className="text-gray-200 font-medium">{designation || "Civil Analyst"}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-geo-border/40 pb-2">
                      <span className="text-gray-500 flex items-center gap-1"><Building2 size={12} /> Domain</span>
                      <span className="text-gray-200 font-medium">{industry || "Government"}</span>
                    </div>
                  </div>
                </div>

                {/* SaaS remaining credits buffer */}
                <div className="glass-card p-5 bg-gradient-to-br from-geo-card to-primary-950/5 border-primary-500/10 flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono block">Subscription Tier</span>
                      <span className={`risk-badge text-[10px] font-black tracking-widest uppercase border ${getSubBadgeClass(user.subscription)}`}>
                        {formatPlanName(user.subscription)}
                      </span>
                    </div>
                    <Coins className="text-primary-400" size={20} />
                  </div>

                  <div className="pt-4 flex flex-col gap-2">
                    <div className="flex justify-between text-[10px] text-gray-500 uppercase font-mono tracking-wider">
                      <span>Credits Remaining</span>
                      <span>Limit: {billing ? billing.credit_limit : user.credits}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black font-mono text-white tracking-tight">{user.credits}</span>
                      <span className="text-[10px] text-gray-500 font-mono">geoprocessing tasks remaining</span>
                    </div>
                    
                    {billing && billing.expires_at && (
                      <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-2 font-mono">
                        <Calendar size={11} /> Expires: {new Date(billing.expires_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Invoicing and telemetry logs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Usage logs */}
                <div className="glass-card p-4 space-y-3">
                  <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-geo-border/60 pb-2">
                    <LineChart size={12} className="text-cyan-400" /> Usage Monitoring (Last 5 calls)
                  </h4>
                  <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
                    {usageLogs.length === 0 ? (
                      <div className="text-[10px] text-gray-500 text-center py-6 font-mono">No geoprocessing logs found.</div>
                    ) : (
                      usageLogs.slice(0, 5).map((log) => (
                        <div key={log.id} className="p-2 bg-black/20 rounded-lg border border-geo-border/60 flex items-center justify-between text-[10px] font-mono">
                          <div className="space-y-0.5 max-w-[70%]">
                            <div className="text-gray-300 truncate" title={log.request_path}>{log.request_method} {log.request_path}</div>
                            <div className="text-[9px] text-gray-500">{new Date(log.created_at).toLocaleString()}</div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="px-1.5 py-0.5 rounded bg-cyan-900/30 text-cyan-400 font-bold border border-cyan-500/20">
                              -{log.credits_consumed} Credit
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Payments */}
                <div className="glass-card p-4 space-y-3">
                  <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-geo-border/60 pb-2">
                    <History size={12} className="text-violet-400" /> Invoice Payment History
                  </h4>
                  <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
                    {payments.length === 0 ? (
                      <div className="text-[10px] text-gray-500 text-center py-6 font-mono">No payment history found.</div>
                    ) : (
                      payments.map((p) => (
                        <div key={p.id} className="p-2 bg-black/20 rounded-lg border border-geo-border/60 flex items-center justify-between text-[10px] font-mono">
                          <div className="space-y-0.5">
                            <div className="text-gray-300 font-bold">₹{p.amount}</div>
                            <div className="text-[9px] text-gray-500">{p.transaction_id || "MOCK-TXN"} • {p.payment_method}</div>
                          </div>
                          <div className="text-right">
                            <span className="text-emerald-400 font-bold text-[9px] uppercase">✓ Paid</span>
                            <div className="text-[8px] text-gray-500">{new Date(p.created_at).toLocaleDateString()}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Pricing table */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <Zap size={11} className="text-amber-500" /> Commercial SaaS pricing
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { name: "Free Sandbox", price: "₹0", credits: "100 Credits", desc: "20 daily requests limit. Basic analytics overlays, no comprehensive PDF generation.", tier: "free" },
                    { name: "Premium Monthly", price: "₹299/mo", credits: "1000 Credits", desc: "Unlimited daily requests. Advanced spatial calculations, PDF briefs downloads.", tier: "premium_monthly" },
                    { name: "Premium 6 Months", price: "₹1499", credits: "7000 Credits", desc: "Full GIS digitizing. Mapbox vector indexing. Built for regional planners.", tier: "premium_6months" },
                    { name: "Premium Annual", price: "₹2499", credits: "15000 Credits", desc: "Best value overall. Priority technical assistance, maximal credit buffer pool.", tier: "premium_annual" }
                  ].map((tier, i) => (
                    <div key={i} className="glass-card p-4 flex flex-col justify-between hover:border-primary-500/25 transition-all bg-geo-card/30">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h5 className="text-[11px] font-black text-white truncate max-w-[70%]">{tier.name}</h5>
                          <span className="text-[10px] text-emerald-400 font-mono font-bold shrink-0">{tier.price}</span>
                        </div>
                        <div className="text-[10px] text-primary-400 font-mono font-bold uppercase tracking-wider bg-primary-950/20 border border-primary-500/20 p-1.5 rounded text-center">
                          {tier.credits}
                        </div>
                        <p className="text-[10px] text-gray-500 leading-relaxed pt-1.5 min-h-[60px]">{tier.desc}</p>
                      </div>
                      <button 
                        onClick={() => handleUpgrade(tier.tier)}
                        disabled={isUpgrading || user.subscription?.toLowerCase() === tier.tier}
                        className="btn-primary w-full justify-center text-[10px] py-1.5 font-bold mt-4 flex items-center gap-1"
                      >
                        {user.subscription?.toLowerCase() === tier.tier ? "Active Plan" : <>Select Tier <ArrowUpRight size={11} /></>}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* TAB 2: PROFILE & SECURITY */}
          {activeSubTab === "profile" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Profile Details Edit */}
              <form onSubmit={handleUpdateProfile} className="glass-card p-5 space-y-4">
                <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-geo-border/60 pb-2">
                  <UserIcon size={13} className="text-primary-400" /> Edit Profile details
                </h4>

                {profileSuccess && (
                  <div className="p-2.5 rounded bg-emerald-950/20 border border-emerald-500/30 text-[10px] text-emerald-400">
                    {profileSuccess}
                  </div>
                )}

                <div className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 uppercase font-mono">Full Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      placeholder="planner full name"
                      className="w-full px-3 py-2 rounded-lg bg-geo-dark border border-geo-border text-xs text-gray-200 outline-none focus:border-primary-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 uppercase font-mono">Industry / Sector</label>
                    <select
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-geo-dark border border-geo-border text-xs text-gray-200 outline-none focus:border-primary-500"
                    >
                      <option value="Government">Government / Municipal</option>
                      <option value="Consultancy">Geospatial Consultancy</option>
                      <option value="Research">Academic Research</option>
                      <option value="Enterprise">Commercial Enterprise</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 uppercase font-mono">Designation / Role</label>
                    <input
                      type="text"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      required
                      placeholder="e.g. Lead Urban Planner"
                      className="w-full px-3 py-2 rounded-lg bg-geo-dark border border-geo-border text-xs text-gray-200 outline-none focus:border-primary-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="btn-primary w-full justify-center text-xs py-2 font-bold flex items-center gap-1.5"
                >
                  {isSavingProfile ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                  Save Details
                </button>
              </form>

              {/* Password credentials change form */}
              <form onSubmit={handleChangePassword} className="glass-card p-5 space-y-4">
                <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-geo-border/60 pb-2">
                  <Lock size={13} className="text-violet-400" /> Change Account Password
                </h4>

                {passwordSuccess && (
                  <div className="p-2.5 rounded bg-emerald-950/20 border border-emerald-500/30 text-[10px] text-emerald-400">
                    {passwordSuccess}
                  </div>
                )}

                <div className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 uppercase font-mono">Current Password</label>
                    <input
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full px-3 py-2 rounded-lg bg-geo-dark border border-geo-border text-xs text-gray-200 outline-none focus:border-primary-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 uppercase font-mono">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full px-3 py-2 rounded-lg bg-geo-dark border border-geo-border text-xs text-gray-200 outline-none focus:border-primary-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 uppercase font-mono">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full px-3 py-2 rounded-lg bg-geo-dark border border-geo-border text-xs text-gray-200 outline-none focus:border-primary-500 font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="btn-primary w-full justify-center text-xs py-2 font-bold flex items-center gap-1.5"
                >
                  {isChangingPassword ? <Loader2 size={13} className="animate-spin" /> : <Lock size={13} />}
                  Update Password
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: USER ACTIVITY AUDIT LOGS */}
          {activeSubTab === "logs" && (
            <div className="glass-card p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-geo-border/60 pb-3">
                <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                  <ListFilter size={13} className="text-cyan-400" /> Security & Activity Audit logs
                </h4>
                <span className="text-[9px] text-gray-500 font-mono">Tracks predictions, logins, and downloads</span>
              </div>

              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
                {activityLogs.length === 0 ? (
                  <div className="text-xs text-gray-500 text-center py-12 font-mono">
                    No activity logs gathered. Perform geoprocess analyses to trigger logs.
                  </div>
                ) : (
                  activityLogs.map((log) => (
                    <div key={log.id} className="p-3 bg-black/20 rounded-xl border border-geo-border/60 hover:border-primary-500/20 transition-all flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-geo-card/60 flex items-center justify-center text-xs border border-geo-border text-primary-400 shrink-0 font-mono">
                        {log.action_type.substring(0,2).toUpperCase()}
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-200 font-bold uppercase tracking-wider font-mono text-[10px] bg-geo-card/80 px-1.5 py-0.5 rounded border border-geo-border">
                            {log.action_type.replace(/_/g, " ")}
                          </span>
                          <span className="text-[9px] text-gray-500 font-mono">{new Date(log.created_at).toLocaleString()}</span>
                        </div>
                        <p className="text-gray-400 leading-normal">{log.details}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: EXPORT CENTER */}
          {activeSubTab === "exports" && (
            <div className="glass-card p-6 space-y-6">
              <div className="text-center space-y-2 max-w-md mx-auto">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-500 flex items-center justify-center mx-auto text-white shadow-glow-primary">
                  <Download size={24} />
                </div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Enterprise Export Control</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Download high-fidelity municipal digital twin datasets, forecasting assessments, and compiled security indices in commercial GIS standards.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 max-w-3xl mx-auto">
                {/* CSV Download */}
                <div className="bg-geo-card/40 border border-geo-border rounded-2xl p-5 space-y-4 hover:border-primary-500/20 transition-all flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                      <FileText size={20} />
                    </div>
                    <h5 className="text-xs font-bold text-gray-200 uppercase tracking-wider">Spreadsheet Records (CSV)</h5>
                    <p className="text-[10px] text-gray-500 leading-relaxed">
                      Download complete calculations matrix tables in CSV formats. Compatible with ArcGIS, QGIS, Excel, and custom forecasting pipelines.
                    </p>
                  </div>
                  
                  <button
                    onClick={() => handleDownloadExport("csv")}
                    disabled={isLoading}
                    className="btn-primary w-full justify-center text-xs py-2 font-bold flex items-center gap-1.5 mt-2"
                  >
                    {isLoading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                    Export Data (CSV)
                  </button>
                </div>

                {/* PDF Download */}
                <div className="bg-geo-card/40 border border-geo-border rounded-2xl p-5 space-y-4 hover:border-violet-500/20 transition-all flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                      <FileCheck2 size={20} />
                    </div>
                    <h5 className="text-xs font-bold text-gray-200 uppercase tracking-wider">Executive Summary (PDF)</h5>
                    <p className="text-[10px] text-gray-500 leading-relaxed">
                      Compile spatial risk assessments into formal PDF summaries containing safety scores, vulnerability matrices, and municipal details.
                    </p>
                  </div>
                  
                  <button
                    onClick={() => handleDownloadExport("pdf")}
                    disabled={isLoading}
                    className="btn-primary w-full justify-center text-xs py-2 font-bold flex items-center gap-1.5 mt-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500"
                  >
                    {isLoading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                    Compile Report (PDF)
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* HIGH-FIDELITY INTERACTIVE RAZORPAY BILLING SIMULATOR MODAL */}
      <AnimatePresence>
        {showMockCheckout && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="bg-[#0b0f19] border border-geo-border rounded-2xl w-full max-w-[420px] overflow-hidden shadow-2xl relative flex flex-col font-sans text-gray-200 select-none"
            >
              {/* TOP BRAND HEADER (Razorpay Deep Royal Blue Theme) */}
              <div className="bg-gradient-to-r from-blue-950 via-[#0d2a4a] to-blue-950 px-5 py-4 border-b border-blue-900/40 relative flex items-center justify-between text-white">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center shadow-glow-primary">
                      <span className="text-[10px] font-black">GN</span>
                    </div>
                    <span className="text-[11px] font-bold tracking-wider text-blue-400 font-mono uppercase">GeoNarrative AI</span>
                  </div>
                  <h4 className="text-xs font-black tracking-wide text-gray-200 uppercase">{checkoutTier.replace('_', ' ')} Plan</h4>
                </div>
                
                <div className="text-right space-y-1">
                  <span className="text-[9px] bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded-full">
                    Demo Test Mode
                  </span>
                  <div className="text-xl font-mono font-black text-white">₹{checkoutAmount.toLocaleString()}</div>
                </div>
              </div>

              {/* MAIN CONTENT AREA */}
              <div className="p-5 space-y-4 relative min-h-[300px]">
                {/* 1. Processing / Loading Spinner Overlay */}
                {isSimulatingSuccess && (
                  <div className="absolute inset-0 bg-[#0b0f19]/95 z-20 flex flex-col items-center justify-center p-6 text-center space-y-4">
                    <Loader2 className="animate-spin text-blue-500" size={44} />
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-white">Connecting Secure Banking...</h4>
                      <p className="text-[10px] text-gray-500 leading-relaxed font-mono">Simulating standard secure bank authorization API. Do not close or refresh this page.</p>
                    </div>
                  </div>
                )}

                {/* 2. Success Done Overlay */}
                {isSimulatedDone && (
                  <div className="absolute inset-0 bg-[#0b0f19]/95 z-20 flex flex-col items-center justify-center p-6 text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 animate-bounce">
                      <CheckCircle size={36} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-white">Simulated Payment Clear!</h4>
                      <p className="text-[10px] text-emerald-400 font-mono">Credits updated and SaaS subscription activated successfully.</p>
                    </div>
                  </div>
                )}

                {/* 3. Main Form fields */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-[10px] font-mono">
                    <div className="bg-black/30 border border-geo-border p-2 rounded-lg">
                      <span className="text-gray-500 block uppercase">Client Email</span>
                      <span className="text-gray-200 truncate block">{checkoutEmail}</span>
                    </div>
                    <div className="bg-black/30 border border-geo-border p-2 rounded-lg">
                      <span className="text-gray-500 block uppercase">Payment Gateway</span>
                      <span className="text-blue-400 block font-bold">1Razorpay Sim</span>
                    </div>
                  </div>

                  {/* Tab selection */}
                  <div className="flex border-b border-geo-border/60">
                    <button 
                      onClick={() => setSelectedMethod('netbanking')}
                      className={`flex-1 pb-2 text-[11px] font-bold text-center border-b-2 transition-all ${
                        selectedMethod === 'netbanking' 
                          ? 'border-blue-500 text-blue-400' 
                          : 'border-transparent text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      🏦 Netbanking
                    </button>
                    <button 
                      onClick={() => setSelectedMethod('card')}
                      className={`flex-1 pb-2 text-[11px] font-bold text-center border-b-2 transition-all ${
                        selectedMethod === 'card' 
                          ? 'border-blue-500 text-blue-400' 
                          : 'border-transparent text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      💳 Credit/Debit Card
                    </button>
                  </div>

                  {/* Netbanking content */}
                  {selectedMethod === 'netbanking' && (
                    <div className="space-y-3 pt-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Popular Banks</span>
                      
                      <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold">
                        {[
                          { name: "State Bank of India", logo: "🏦 SBI" },
                          { name: "HDFC Bank", logo: "🏦 HDFC" },
                          { name: "ICICI Bank", logo: "🏦 ICICI" },
                          { name: "Axis Bank", logo: "🏦 Axis" }
                        ].map((bank) => (
                          <button
                            key={bank.name}
                            onClick={() => setMockSelectedBank(bank.name)}
                            className={`p-2.5 rounded-lg border text-center transition-all ${
                              mockSelectedBank === bank.name 
                                ? 'bg-blue-600/10 border-blue-500 text-blue-400 shadow-glow-primary/10' 
                                : 'bg-black/20 border-geo-border text-gray-400 hover:text-gray-200'
                            }`}
                          >
                            <span className="block font-mono text-xs">{bank.logo}</span>
                            <span className="text-[8px] truncate block text-gray-500">{bank.name}</span>
                          </button>
                        ))}
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] text-gray-500 uppercase tracking-wider block">Or select other bank</label>
                        <select 
                          value={mockSelectedBank}
                          onChange={(e) => setMockSelectedBank(e.target.value)}
                          className="w-full bg-black/40 border border-geo-border rounded-lg text-xs py-2 px-3 focus:outline-none focus:border-blue-500 text-gray-300 font-mono text-white"
                        >
                          <option value="State Bank of India">State Bank of India</option>
                          <option value="HDFC Bank">HDFC Bank</option>
                          <option value="ICICI Bank">ICICI Bank</option>
                          <option value="Axis Bank">Axis Bank</option>
                          <option value="Punjab National Bank">Punjab National Bank</option>
                          <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Card Content */}
                  {selectedMethod === 'card' && (
                    <div className="space-y-3 pt-2">
                      <div className="bg-gradient-to-br from-gray-900 to-slate-950 border border-geo-border/60 rounded-xl p-4 space-y-3 shadow-inner relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] font-mono text-gray-500 font-bold uppercase tracking-wider">Test Card details</span>
                          <span className="text-xs font-bold text-gray-400 font-mono">VISA</span>
                        </div>

                        <div className="space-y-2">
                          <div className="space-y-0.5">
                            <span className="text-[8px] text-gray-600 uppercase font-mono block">Card Number</span>
                            <input 
                              type="text" 
                              disabled 
                              value="4111 • 2222 • 3333 • 4444" 
                              className="w-full bg-transparent border-0 p-0 text-xs font-mono text-gray-300 font-black tracking-widest focus:outline-none focus:ring-0"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-0.5">
                              <span className="text-[8px] text-gray-600 uppercase font-mono block">Expires</span>
                              <span className="text-xs font-mono text-gray-300 font-black">12 / 2030</span>
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-[8px] text-gray-600 uppercase font-mono block">CVV</span>
                              <span className="text-xs font-mono text-gray-300 font-black">***</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="text-[9px] text-gray-500 font-mono leading-relaxed text-center">
                        This test card details is prefilled automatically for local demo validation.
                      </p>
                    </div>
                  )}
                </div>

                {/* Simulated Payment Action Buttons */}
                <div className="pt-2 space-y-2">
                  <button
                    onClick={async () => {
                      setIsSimulatingSuccess(true);
                      try {
                        // 1.5 seconds mock banking delay for hyper-realism
                        await new Promise((resolve) => setTimeout(resolve, 1500));
                        
                        const verifyRes = await apiService.verifyRazorpayPayment({
                          razorpay_order_id: checkoutOrderId || "order_simple_checkout",
                          razorpay_payment_id: "pay_mock_" + Math.random().toString(36).substring(7),
                          razorpay_signature: "MOCK_SIGNATURE",
                          plan_type: checkoutTier
                        });

                        setIsSimulatingSuccess(false);
                        setIsSimulatedDone(true);

                        // Wait 1.2 seconds for the success check animation
                        await new Promise((resolve) => setTimeout(resolve, 1200));
                        
                        setUpgradeMsg(verifyRes.message || `Upgraded to ${checkoutTier.replace('_', ' ').toUpperCase()} successfully!`);
                        setShowMockCheckout(false);
                        setIsSimulatedDone(false);
                        onRefreshProfile();
                        
                        setTimeout(() => {
                          loadBillingAndEnterpriseData();
                        }, 300);
                      } catch (err: any) {
                        setIsSimulatingSuccess(false);
                        setErrorMsg(err.message || "Simulated payment process verification failed.");
                        setShowMockCheckout(false);
                      }
                    }}
                    className="w-full bg-[#3b82f6] hover:bg-blue-600 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-glow-primary transition-all duration-300 active:scale-[0.98]"
                  >
                    💳 Simulate Success via {selectedMethod === 'netbanking' ? mockSelectedBank : 'Visa Test Card'}
                  </button>

                  <button
                    onClick={() => {
                      setShowMockCheckout(false);
                      setIsSimulatingSuccess(false);
                      setIsSimulatingFailure(false);
                      setIsSimulatedDone(false);
                      setErrorMsg("Demo payment simulation cancelled by planner.");
                    }}
                    className="w-full text-center py-2 text-[10px] text-gray-500 hover:text-gray-300 font-mono transition-colors"
                  >
                    Cancel transaction
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
