"use client";

import { DashboardMode } from "@/lib/types";

import React from "react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadialBarChart,
  RadialBar,
} from "recharts";
import { AnalyticsData } from "@/lib/types";
import { CHART_COLORS } from "@/lib/config";

interface AnalyticsChartsProps {
  data: AnalyticsData;
  dashboardMode?: DashboardMode;
}

const CHART_TITLES: Record<DashboardMode, { area: string; pie: string; bar: string; trend: string; gauge: string; pop: string }> = {
  flood: { area: "Rainfall Analysis", pie: "Risk Distribution", bar: "Infrastructure at Risk", trend: "Risk Trend (5 Years)", gauge: "Overall Risk Score", pop: "Population Density by Area" },
  traffic: { area: "Hourly Traffic Volume", pie: "Congestion Distribution", bar: "Infrastructure Load", trend: "Traffic Growth (5 Years)", gauge: "Congestion Index", pop: "Commuter Density by Area" },
  urban: { area: "Monthly Construction Permits", pie: "Land Use Distribution", bar: "Civic Infrastructure", trend: "Urbanization Trend (5 Years)", gauge: "Development Index", pop: "Population Density by Area" },
  utility: { area: "Daily Power Consumption", pie: "Network Status", bar: "Asset Health", trend: "Outage Trend (5 Years)", gauge: "Grid Reliability", pop: "Service Coverage by Area" },
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card px-4 py-3 shadow-xl">
        <p className="text-xs font-semibold text-gray-200 mb-1">{label}</p>
        {payload.map((entry: any, i: number) => (
          <p key={i} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: <span className="font-semibold">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AnalyticsCharts({ data, dashboardMode = "flood" }: AnalyticsChartsProps) {
  const titles = CHART_TITLES[dashboardMode];
  // Risk gauge data
  const riskGaugeData = [
    { name: "Risk Score", value: 78, fill: "#ef4444" },
  ];

  return (
    <div className="space-y-4">
      {/* Rainfall Chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="analytics-widget"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-200">📊 {titles.area}</h3>
          <span className="text-xs text-primary-400">Monthly</span>
        </div>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.rainfall}>
              <defs>
                <linearGradient id="rainfallGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="avgGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(55,65,81,0.3)" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="avg"
                stroke="#06b6d4"
                strokeWidth={1.5}
                fill="url(#avgGrad)"
                name="Average"
                strokeDasharray="4 4"
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#rainfallGrad)"
                name="Actual"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Risk Distribution Pie */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="analytics-widget"
      >
        <h3 className="text-sm font-semibold text-gray-200">🎯 {titles.pie}</h3>
        <div className="h-36 flex items-center">
          <div className="w-1/2">
            <ResponsiveContainer width="100%" height={130}>
              <PieChart>
                <Pie
                  data={data.riskDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={55}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {data.riskDistribution.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-1/2 space-y-2">
            {data.riskDistribution.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
                <span className="text-gray-400 flex-1">{item.name}</span>
                <span className="font-semibold text-gray-200">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Infrastructure Risk */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="analytics-widget"
      >
        <h3 className="text-sm font-semibold text-gray-200">🏗️ {titles.bar}</h3>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.infrastructure} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(55,65,81,0.3)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis dataKey="type" type="category" tick={{ fontSize: 9 }} width={80} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Total" fill="#374151" radius={[0, 4, 4, 0]} barSize={12} />
              <Bar dataKey="atRisk" name="At Risk" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={12} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Risk Trend */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="analytics-widget"
      >
        <h3 className="text-sm font-semibold text-gray-200">📈 {titles.trend}</h3>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.timeSeriesRisk}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(55,65,81,0.3)" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="flood"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Flood"
                dot={{ r: 3, fill: "#3b82f6" }}
              />
              <Line
                type="monotone"
                dataKey="drought"
                stroke="#f59e0b"
                strokeWidth={2}
                name="Drought"
                dot={{ r: 3, fill: "#f59e0b" }}
              />
              <Line
                type="monotone"
                dataKey="earthquake"
                stroke="#8b5cf6"
                strokeWidth={2}
                name="Earthquake"
                dot={{ r: 3, fill: "#8b5cf6" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Risk Gauge */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="analytics-widget"
      >
        <h3 className="text-sm font-semibold text-gray-200">⚡ {titles.gauge}</h3>
        <div className="flex items-center justify-center py-2">
          <div className="relative w-32 h-32">
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
              {/* Background circle */}
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="#1f2937"
                strokeWidth="10"
              />
              {/* Progress circle */}
              <motion.circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="url(#riskGaugeGradient)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${78 * 3.14} ${100 * 3.14}`}
                initial={{ strokeDasharray: `0 ${100 * 3.14}` }}
                animate={{ strokeDasharray: `${78 * 3.14} ${100 * 3.14}` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
              <defs>
                <linearGradient id="riskGaugeGradient">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="50%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-gray-100">7.8</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">/ 10</span>
            </div>
          </div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 px-4">
          <span className="text-emerald-400">Low</span>
          <span className="text-amber-400">Medium</span>
          <span className="text-red-400">High</span>
        </div>
      </motion.div>

      {/* Population Density */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="analytics-widget"
      >
        <h3 className="text-sm font-semibold text-gray-200">👥 {titles.pop}</h3>
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.populationDensity}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(55,65,81,0.3)" />
              <XAxis dataKey="area" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="density" name="Density /km²" radius={[6, 6, 0, 0]} barSize={28}>
                {data.populationDensity.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={
                      entry.risk === "high"
                        ? "#ef4444"
                        : entry.risk === "medium"
                        ? "#f59e0b"
                        : "#10b981"
                    }
                    fillOpacity={0.7}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}
