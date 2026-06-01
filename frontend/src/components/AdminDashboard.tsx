"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Users, 
  Search, 
  SlidersHorizontal, 
  ShieldAlert, 
  Coins, 
  UserCheck, 
  UserMinus, 
  RefreshCw, 
  Loader2, 
  Database,
  CheckCircle,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  IndianRupee,
  Activity,
  History,
  CheckSquare
} from "lucide-react";
import { apiService } from "@/services/apiService";

export default function AdminDashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [revenue, setRevenue] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [subFilter, setSubFilter] = useState("");
  
  // Selected user edit states
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editCredits, setEditCredits] = useState<number>(100);
  const [editSubscription, setEditSubscription] = useState<string>("free");
  const [isUpdating, setIsUpdating] = useState(false);

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const [usersData, statsData, revData] = await Promise.all([
        apiService.adminGetUsers(searchQuery, roleFilter, subFilter).catch(err => {
          console.warn("Resilient Admin Dashboard: Failed to load users:", err);
          return [];
        }),
        apiService.adminGetAnalytics().catch(err => {
          console.warn("Resilient Admin Dashboard: Failed to load analytics:", err);
          return null;
        }),
        apiService.adminGetRevenueAnalytics().catch(err => {
          console.warn("Resilient Admin Dashboard: Failed to load revenue telemetry:", err);
          return null;
        })
      ]);
      setUsers(usersData);
      setAnalytics(statsData);
      setRevenue(revData);
    } catch (err) {
      console.error("Failed to load admin data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [searchQuery, roleFilter, subFilter]);

  const handleToggleStatus = async (userId: number, currentStatus: boolean) => {
    try {
      await apiService.adminToggleStatus(userId, !currentStatus);
      setUsers(users.map(u => u.id === userId ? { ...u, is_active: !currentStatus } : u));
    } catch (err) {
      alert("Failed to toggle status: " + err);
    }
  };

  const handleSaveSubChange = async (userId: number) => {
    setIsUpdating(true);
    try {
      await apiService.adminUpdateSubscription(userId, editSubscription, editCredits);
      setUsers(users.map(u => u.id === userId ? { ...u, subscription: editSubscription, credits: editCredits } : u));
      setEditingUserId(null);
      // Reload stats
      const [statsData, revData] = await Promise.all([
        apiService.adminGetAnalytics(),
        apiService.adminGetRevenueAnalytics()
      ]);
      setAnalytics(statsData);
      setRevenue(revData);
    } catch (err) {
      alert("Failed to update subscription parameters: " + err);
    } finally {
      setIsUpdating(false);
    }
  };

  const startEditing = (user: any) => {
    setEditingUserId(user.id);
    setEditCredits(user.credits);
    setEditSubscription(user.subscription);
  };

  return (
    <div className="p-6 space-y-6 h-full overflow-y-auto custom-scrollbar">
      
      {/* 1. Admin Header */}
      <div className="flex items-center justify-between border-b border-geo-border/60 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-glow-primary">
            <Users size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white leading-none">Administrative Command Center</h3>
            <span className="text-[10px] text-gray-500 font-mono">GeoNarrative AI Platform Governance</span>
          </div>
        </div>

        <button 
          onClick={loadAdminData}
          disabled={isLoading}
          className="flex items-center gap-1 text-[10px] font-mono font-bold uppercase py-1.5 px-3 rounded-lg border border-geo-border hover:border-primary-500 transition-all text-gray-400 hover:text-white"
        >
          {isLoading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />} Reload Telemetry
        </button>
      </div>

      {/* 2. Global Platform Analytics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Gross Revenue */}
        <div className="glass-card p-4 flex items-center justify-between bg-gradient-to-br from-geo-card to-emerald-950/10 border-emerald-500/10">
          <div className="space-y-1">
            <span className="text-[9px] text-gray-500 uppercase font-mono block">Gross SaaS Revenue</span>
            <span className="text-2xl font-black font-mono text-emerald-400 leading-none">
              ₹{revenue ? revenue.total_revenue : "0.0"}
            </span>
          </div>
          <IndianRupee className="text-emerald-400" size={24} />
        </div>

        {/* Active Paying Customers */}
        <div className="glass-card p-4 flex items-center justify-between bg-gradient-to-br from-geo-card to-violet-950/10 border-violet-500/10">
          <div className="space-y-1">
            <span className="text-[9px] text-gray-500 uppercase font-mono block">Active Paid Subscriptions</span>
            <span className="text-2xl font-black font-mono text-violet-400 leading-none">
              {revenue ? revenue.active_subscriptions : "0"}
            </span>
          </div>
          <CheckCircle className="text-violet-400" size={24} />
        </div>

        {/* Total Users registered */}
        <div className="glass-card p-4 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9px] text-gray-500 uppercase font-mono block">Total Registrations</span>
            <span className="text-2xl font-black font-mono text-white leading-none">
              {analytics ? analytics.total_users : "0"}
            </span>
          </div>
          <Users className="text-gray-400" size={24} />
        </div>

        {/* Total remaining credits pool */}
        <div className="glass-card p-4 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9px] text-gray-500 uppercase font-mono block">Active Credits Pool</span>
            <span className="text-2xl font-black font-mono text-cyan-400 leading-none">
              {analytics ? analytics.active_credits : "0"}
            </span>
          </div>
          <Coins className="text-cyan-400" size={24} />
        </div>

      </div>

      {/* 3. Usage trends and plan stats ratios */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* User Activity trends */}
        <div className="glass-card p-4 space-y-3">
          <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-geo-border/60 pb-2">
            <Activity size={12} className="text-cyan-400" /> Platform Geoprocess Usage Trends
          </h4>

          <div className="grid grid-cols-2 gap-3 text-center">
            {revenue?.usage_trends?.length === 0 ? (
              <div className="col-span-2 text-[10px] text-gray-500 py-6 font-mono">No query activity recorded.</div>
            ) : (
              revenue?.usage_trends?.map((item: any, idx: number) => (
                <div key={idx} className="p-3 bg-black/20 rounded-xl border border-geo-border/60">
                  <span className="text-[9px] text-gray-500 uppercase font-mono block truncate">{item.domain.replace("_", " ")}</span>
                  <span className="text-lg font-bold text-white font-mono">{item.requests} calls</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Plan subscriber stats */}
        <div className="glass-card p-4 space-y-3">
          <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-geo-border/60 pb-2">
            <TrendingUp size={12} className="text-violet-400" /> Subscription Plan Distributions
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono text-[10px]">
            <div className="p-2 bg-black/20 rounded-lg border border-geo-border/60">
              <span className="text-gray-500 block text-[8px] uppercase">Free</span>
              <span className="text-gray-300 font-bold text-base">{revenue?.plan_distribution?.free || 0}</span>
            </div>
            <div className="p-2 bg-black/20 rounded-lg border border-geo-border/60">
              <span className="text-cyan-400 block text-[8px] uppercase">Monthly</span>
              <span className="text-cyan-300 font-bold text-base">{revenue?.plan_distribution?.premium_monthly || 0}</span>
            </div>
            <div className="p-2 bg-black/20 rounded-lg border border-geo-border/60">
              <span className="text-purple-400 block text-[8px] uppercase">6 Months</span>
              <span className="text-purple-300 font-bold text-base">{revenue?.plan_distribution?.premium_6months || 0}</span>
            </div>
            <div className="p-2 bg-black/20 rounded-lg border border-geo-border/60">
              <span className="text-indigo-400 block text-[8px] uppercase">Annual</span>
              <span className="text-indigo-300 font-bold text-base">{revenue?.plan_distribution?.premium_annual || 0}</span>
            </div>
          </div>
        </div>

      </div>

      {/* 4. Global Invoices Ledger & Users table layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        
        {/* Global Invoice ledger */}
        <div className="glass-card p-4 space-y-3 xl:col-span-1">
          <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-geo-border/60 pb-2">
            <History size={12} className="text-emerald-400" /> Platform Billing Ledger
          </h4>

          <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
            {revenue?.recent_payments?.length === 0 ? (
              <div className="text-[10px] text-gray-500 text-center py-10 font-mono">No subscription invoices logged.</div>
            ) : (
              revenue?.recent_payments?.map((invoice: any) => (
                <div key={invoice.id} className="p-2 bg-black/20 rounded-lg border border-geo-border/60 flex items-center justify-between text-[10px] font-mono">
                  <div className="space-y-0.5">
                    <div className="text-gray-300 font-bold">₹{invoice.amount}</div>
                    <div className="text-[9px] text-gray-500">{invoice.transaction_id} • {invoice.payment_method}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-emerald-400 font-bold text-[8px] bg-emerald-950/20 border border-emerald-500/20 px-1.5 py-0.5 rounded uppercase">
                      Paid
                    </span>
                    <div className="text-[8px] text-gray-500 pt-0.5">{new Date(invoice.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Users Management */}
        <div className="xl:col-span-2 space-y-3">
          
          {/* Filtering and Searching Header */}
          <div className="flex flex-col sm:flex-row items-center gap-3 bg-geo-card/40 p-4 rounded-xl border border-geo-border/60">
            <div className="relative w-full sm:w-64 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search full name, email..."
                className="w-full pl-9 pr-4 py-1.5 rounded-lg bg-geo-dark border border-geo-border text-xs text-gray-200 outline-none focus:border-primary-500 placeholder-gray-600"
              />
            </div>

            <div className="flex gap-2 w-full sm:w-auto items-center justify-end sm:ml-auto">
              <select 
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-2 py-1.5 rounded-lg bg-geo-dark border border-geo-border text-[11px] text-gray-300 outline-none focus:border-primary-500"
              >
                <option value="">All Roles</option>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>

              <select 
                value={subFilter}
                onChange={(e) => setSubFilter(e.target.value)}
                className="px-2 py-1.5 rounded-lg bg-geo-dark border border-geo-border text-[11px] text-gray-300 outline-none focus:border-primary-500"
              >
                <option value="">All Tiers</option>
                <option value="free">Free</option>
                <option value="premium_monthly">Monthly</option>
                <option value="premium_6months">6 Months</option>
                <option value="premium_annual">Annual</option>
              </select>
            </div>
          </div>

          {/* User grid table */}
          <div className="glass-card overflow-hidden border-geo-border">
            <div className="overflow-x-auto max-h-[300px] overflow-y-auto custom-scrollbar">
              
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="bg-geo-dark border-b border-geo-border/60 text-gray-500 uppercase font-mono text-[8px] tracking-wider sticky top-0 z-10">
                    <th className="p-3 font-bold">User</th>
                    <th className="p-3 font-bold">Plan & Credits</th>
                    <th className="p-3 font-bold">Activation</th>
                    <th className="p-3 font-bold text-right">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={4} className="p-10 text-center text-gray-500 font-mono">
                        <Loader2 size={16} className="animate-spin text-primary-400 mx-auto mb-2" />
                        Fetching active registries...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-10 text-center text-gray-600 font-mono">
                        No matching user records returned.
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id} className="border-b border-geo-border/40 hover:bg-geo-card/25 transition-colors">
                        
                        <td className="p-3">
                          <div className="font-bold text-white leading-tight">{user.full_name}</div>
                          <div className="text-[9px] text-gray-500 font-mono">@{user.username}</div>
                        </td>

                        <td className="p-3">
                          {editingUserId === user.id ? (
                            <div className="flex flex-col gap-1.5 p-1 bg-black/40 rounded max-w-[140px]">
                              <select 
                                value={editSubscription}
                                onChange={(e) => setEditSubscription(e.target.value)}
                                className="w-full px-1 py-0.5 bg-geo-dark border border-geo-border text-[10px] rounded text-white outline-none"
                              >
                                <option value="free">Free</option>
                                <option value="premium_monthly">Monthly</option>
                                <option value="premium_6months">6 Months</option>
                                <option value="premium_annual">Annual</option>
                              </select>
                              <input 
                                type="number" 
                                value={editCredits}
                                onChange={(e) => setEditCredits(parseInt(e.target.value) || 0)}
                                className="w-full px-1 py-0.5 bg-geo-dark border border-geo-border text-[10px] rounded text-white"
                              />
                            </div>
                          ) : (
                            <div className="space-y-0.5">
                              <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wide font-mono block">
                                {user.subscription?.replace("_", " ")}
                              </span>
                              <div className="text-[9px] font-mono text-cyan-400">
                                {user.credits} Cr
                              </div>
                            </div>
                          )}
                        </td>

                        <td className="p-3 space-y-1">
                          <span className={`text-[9px] font-bold block ${user.is_verified ? "text-emerald-500" : "text-amber-500"}`}>
                            {user.is_verified ? "✓ Verified" : "⏳ Pending"}
                          </span>
                          <button 
                            onClick={() => handleToggleStatus(user.id, user.is_active)}
                            className="flex items-center gap-1 text-gray-500 hover:text-white"
                          >
                            {user.is_active ? (
                              <ToggleRight size={15} className="text-emerald-500" />
                            ) : (
                              <ToggleLeft size={15} className="text-gray-600" />
                            )}
                            <span className="text-[8px] font-mono uppercase">{user.is_active ? "Active" : "Banned"}</span>
                          </button>
                        </td>

                        <td className="p-3 text-right">
                          {editingUserId === user.id ? (
                            <div className="flex gap-1 justify-end">
                              <button 
                                onClick={() => setEditingUserId(null)}
                                className="py-0.5 px-1.5 bg-geo-card border border-geo-border text-gray-400 hover:text-white rounded font-mono text-[9px]"
                              >
                                Cancel
                              </button>
                              <button 
                                onClick={() => handleSaveSubChange(user.id)}
                                disabled={isUpdating}
                                className="py-0.5 px-1.5 bg-primary-600 text-white rounded font-bold text-[9px]"
                              >
                                Save
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => startEditing(user)}
                              className="py-0.5 px-1.5 border border-geo-border hover:border-primary-500 text-gray-400 hover:text-white rounded font-mono text-[9px]"
                            >
                              Modify
                            </button>
                          )}
                        </td>

                      </tr>
                    ))
                  )}
                </tbody>
              </table>

            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
