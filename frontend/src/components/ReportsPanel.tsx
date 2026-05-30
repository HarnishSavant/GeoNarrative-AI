"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Download,
  Eye,
  Calendar,
  MapPin,
  Clock,
  Plus,
  Loader2,
  CheckCircle2,
  FileDown,
  AlertTriangle,
} from "lucide-react";

interface ReportsPanelProps {
  currentLocation: string;
}

interface Report {
  id: string;
  title: string;
  location: string;
  date: string;
  type: string;
  status: "complete" | "generating" | "draft";
  riskLevel: "low" | "medium" | "high" | "critical";
  pages: number;
}

export default function ReportsPanel({ currentLocation }: ReportsPanelProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [reports, setReports] = useState<Report[]>([
    {
      id: "1",
      title: "Flood Risk Assessment Report",
      location: "Pune, Maharashtra",
      date: "2025-05-22",
      type: "Risk Assessment",
      status: "complete",
      riskLevel: "high",
      pages: 24,
    },
    {
      id: "2",
      title: "Infrastructure Vulnerability Analysis",
      location: "Pune, Maharashtra",
      date: "2025-05-20",
      type: "Infrastructure",
      status: "complete",
      riskLevel: "medium",
      pages: 18,
    },
    {
      id: "3",
      title: "Monsoon Preparedness Plan",
      location: "Pune, Maharashtra",
      date: "2025-05-15",
      type: "Disaster Planning",
      status: "complete",
      riskLevel: "high",
      pages: 32,
    },
  ]);

  const generateReport = () => {
    setIsGenerating(true);
    const newReport: Report = {
      id: Date.now().toString(),
      title: `GeoAI Risk Report — ${currentLocation}`,
      location: currentLocation,
      date: new Date().toISOString().split("T")[0],
      type: "Comprehensive Analysis",
      status: "generating",
      riskLevel: "high",
      pages: 0,
    };
    setReports((prev) => [newReport, ...prev]);

    setTimeout(() => {
      setReports((prev) =>
        prev.map((r) =>
          r.id === newReport.id
            ? { ...r, status: "complete" as const, pages: Math.floor(15 + Math.random() * 20) }
            : r
        )
      );
      setIsGenerating(false);
    }, 4000);
  };

  const getRiskBadge = (level: string) => {
    const colors: Record<string, string> = {
      low: "bg-emerald-500/20 text-emerald-400",
      medium: "bg-amber-500/20 text-amber-400",
      high: "bg-red-500/20 text-red-400",
      critical: "bg-red-600/20 text-red-300",
    };
    return colors[level] || colors.medium;
  };

  return (
    <div className="p-4 space-y-4 h-full overflow-y-auto custom-scrollbar">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
          <FileText size={16} className="text-primary-400" />
          Reports
        </h3>
        <span className="text-xs text-gray-500">{reports.length} reports</span>
      </div>

      {/* Generate Button */}
      <button
        onClick={generateReport}
        disabled={isGenerating}
        className="w-full btn-primary justify-center"
      >
        {isGenerating ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Generating Report...
          </>
        ) : (
          <>
            <Plus size={16} />
            Generate New Report
          </>
        )}
      </button>

      {/* Reports List */}
      <div className="space-y-3">
        {reports.map((report, i) => (
          <motion.div
            key={report.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-card p-4 space-y-3 hover:border-primary-500/20 transition-all duration-200"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="text-xs font-semibold text-gray-200">{report.title}</h4>
                <p className="text-[11px] text-gray-500 mt-1">{report.type}</p>
              </div>
              {report.status === "generating" ? (
                <Loader2 size={14} className="text-primary-400 animate-spin" />
              ) : (
                <CheckCircle2 size={14} className="text-emerald-500" />
              )}
            </div>

            <div className="flex items-center gap-3 text-[10px] text-gray-500">
              <span className="flex items-center gap-1">
                <MapPin size={9} /> {report.location}
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={9} /> {report.date}
              </span>
              {report.pages > 0 && (
                <span className="flex items-center gap-1">
                  <FileText size={9} /> {report.pages} pages
                </span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getRiskBadge(report.riskLevel)}`}>
                {report.riskLevel.toUpperCase()} RISK
              </span>
              <div className="flex items-center gap-1.5">
                <button className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-primary-400 hover:bg-primary-500/10 transition-colors">
                  <Eye size={12} />
                </button>
                <button className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors">
                  <FileDown size={12} />
                </button>
              </div>
            </div>

            {report.status === "generating" && (
              <div className="space-y-1">
                <div className="h-1 bg-geo-dark rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary-600 to-cyan-500 rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 4 }}
                  />
                </div>
                <p className="text-[10px] text-primary-400">Analyzing data and generating report...</p>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
