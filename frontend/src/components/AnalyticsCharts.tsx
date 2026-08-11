"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { useAnalyticsStore } from "@/store/analyticsStore";
import { useInteractionStore } from "@/store/interactionStore";

interface AnalyticsChartsProps {
  activeTab: string;
  dashboardMode: string;
  currentLocation: string;
}

const RISK_COLORS: Record<string, string> = {
  "Very Low": "#10b981", // emerald-500
  "Low": "#3b82f6",      // blue-500
  "Moderate": "#f59e0b", // amber-500
  "High": "#f97316",     // orange-500
  "Very High": "#ef4444", // red-500
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card px-4 py-3 shadow-xl bg-[#0f172a]/95 border border-white/10">
        <p className="text-xs font-semibold text-gray-200 mb-1">{label}</p>
        {payload.map((entry: any, i: number) => (
          <p key={i} className="text-xs" style={{ color: entry.color || entry.fill }}>
            {entry.name}: <span className="font-semibold">{entry.value.toLocaleString()}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AnalyticsCharts({ activeTab, dashboardMode, currentLocation }: AnalyticsChartsProps) {
  const { riskSummary, exposureSummary, criticalInfrastructure, shelterRecommendations } = useAnalyticsStore();
  const filters = useInteractionStore(state => state.filters);
  const setFilter = useInteractionStore(state => state.setFilter);
  const selectFeature = useInteractionStore(state => state.selectFeature);

  const handleRiskClassClick = (name: string) => {
    if (filters.riskClass?.includes(name)) {
      setFilter('riskClass', []);
    } else {
      setFilter('riskClass', [name]);
    }
  };

  const renderRiskDashboard = () => {
    // Format risk summary for PieChart and BarChart
    const totalHexagons = riskSummary.reduce((acc, curr) => acc + curr.hex_count, 0);
    
    const chartData = riskSummary.map(item => ({
      name: item.risk_class,
      value: item.hex_count,
      exposure: item.total_exposure,
      color: RISK_COLORS[item.risk_class] || "#cbd5e1"
    }));

    return (
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="analytics-widget">
          <h3 className="text-sm font-semibold text-gray-200 mb-3">Risk Distribution (Jenks)</h3>
          <div className="h-44 flex items-center">
            <div className="w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={65}
                    paddingAngle={2}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color} 
                        opacity={(!filters.riskClass || filters.riskClass.length === 0 || filters.riskClass.includes(entry.name)) ? 1 : 0.3}
                        onClick={() => handleRiskClassClick(entry.name)}
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 space-y-3">
              {chartData.map((item, i) => (
                <div 
                  key={i} 
                  className={`flex items-center gap-2 text-xs cursor-pointer p-1 rounded transition-colors ${filters.riskClass?.includes(item.name) ? 'bg-white/10' : 'hover:bg-white/5'}`}
                  onClick={() => handleRiskClassClick(item.name)}
                >
                  <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-gray-400 flex-1 truncate">{item.name}</span>
                  <span className="font-semibold text-gray-200">
                    {totalHexagons > 0 ? Math.round((item.value / totalHexagons) * 100) : 0}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="analytics-widget">
          <h3 className="text-sm font-semibold text-gray-200 mb-3">Flood Histogram (Class Distribution)</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} angle={-45} textAnchor="end" />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(val) => `${val/1000}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Hexagons" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                      opacity={(!filters.riskClass || filters.riskClass.length === 0 || filters.riskClass.includes(entry.name)) ? 1 : 0.3}
                      onClick={() => handleRiskClassClick(entry.name)}
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* LULC Statistics & Area Distribution (Pie) */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="analytics-widget">
          <h3 className="text-sm font-semibold text-gray-200 mb-3">LULC Statistics (Land Use/Land Cover)</h3>
          <div className="h-44 flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={[
                  { name: "Built Area", value: 45, fill: "#ef4444" },
                  { name: "Vegetation", value: 30, fill: "#22c55e" },
                  { name: "Water", value: 15, fill: "#3b82f6" },
                  { name: "Bare Ground", value: 10, fill: "#a8a29e" }
                ]} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={2} dataKey="value" strokeWidth={0}>
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "10px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Ward Ranking */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="analytics-widget">
          <h3 className="text-sm font-semibold text-gray-200 mb-3">Ward Ranking (Highest Risk Area)</h3>
          <div className="space-y-2">
            {[
              { ward: "Shivajinagar", risk: "Critical", score: 92 },
              { ward: "Khadki", risk: "High", score: 84 },
              { ward: "Aundh", risk: "Moderate", score: 65 },
              { ward: "Kothrud", risk: "Low", score: 42 }
            ].map((w, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded bg-[#1e293b] border border-white/5">
                <span className="text-xs font-semibold text-slate-300">{i+1}. {w.ward}</span>
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${w.risk === 'Critical' ? 'bg-red-500/10 text-red-400' : w.risk === 'High' ? 'bg-orange-500/10 text-orange-400' : 'bg-amber-500/10 text-amber-400'}`}>
                    {w.risk}
                  </span>
                  <span className="text-xs font-mono text-slate-400">{w.score}/100</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  };

  const renderExposureDashboard = () => {
    // Group exposure by asset type
    const buildingExposure = exposureSummary.filter(e => e.asset_type === 'Buildings');
    const poiExposure = exposureSummary.filter(e => e.asset_type === 'POIs');
    const roadExposure = exposureSummary.filter(e => e.asset_type === 'Roads (m)');

    // Format for stacked bar chart
    const riskClasses = ['Very High', 'High', 'Moderate', 'Low', 'Very Low'];
    const stackedData = riskClasses.map(rc => {
      const bldg = buildingExposure.find(e => e.risk_class === rc)?.metric_value || 0;
      const poi = poiExposure.find(e => e.risk_class === rc)?.metric_value || 0;
      return { name: rc, Buildings: bldg, POIs: poi };
    });

    return (
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="analytics-widget">
          <h3 className="text-sm font-semibold text-gray-200 mb-3">Asset Exposure by Risk</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stackedData} layout="vertical" margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(val) => `${val/1000}k`} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#94a3b8' }} width={60} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Buildings" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                <Bar dataKey="POIs" stackId="a" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="analytics-widget">
          <h3 className="text-sm font-semibold text-gray-200 mb-3">Road Impact Network</h3>
          <div className="space-y-3">
            {roadExposure.sort((a, b) => b.metric_value - a.metric_value).map((item, i) => (
              <div key={i} className="flex items-center justify-between p-1.5 rounded hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]" style={{ backgroundColor: RISK_COLORS[item.risk_class] || "#cbd5e1", boxShadow: `0 0 8px ${RISK_COLORS[item.risk_class]}80` }} />
                  <span className="text-xs text-slate-300 font-medium">{item.risk_class} Risk Roads</span>
                </div>
                <span className="text-xs font-bold text-white">{(item.metric_value / 1000).toFixed(1)} km</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Affected Buildings Trend (Simulated Time Series) */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="analytics-widget">
          <h3 className="text-sm font-semibold text-gray-200 mb-3">Affected Buildings (Time Series Trend)</h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[
                { time: "00:00", buildings: 120 },
                { time: "04:00", buildings: 340 },
                { time: "08:00", buildings: 890 },
                { time: "12:00", buildings: 1450 },
                { time: "16:00", buildings: 2100 },
                { time: "20:00", buildings: 3420 }
              ]} margin={{ left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBldg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="buildings" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#colorBldg)" name="Exposed Buildings" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    );
  };

  const renderCriticalInfraDashboard = () => {
    // Group by type
    const counts = criticalInfrastructure.reduce((acc, curr) => {
      acc[curr.type] = (acc[curr.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(counts).map(([type, count], i) => (
            <motion.div 
              key={type} 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }} 
              transition={{ delay: i * 0.05 }}
              className="glass-card p-3 border border-red-500/20 bg-red-500/5 text-center flex flex-col items-center justify-center"
            >
              <span className="text-2xl font-bold text-red-400 mb-1">{count}</span>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider">{type}s at Risk</span>
            </motion.div>
          ))}
        </div>

        <div className="analytics-widget">
          <h3 className="text-sm font-semibold text-gray-200 mb-3">High Priority Interventions</h3>
          <div className="space-y-2">
            {criticalInfrastructure.slice(0, 10).map((infra, i) => (
              <div 
                key={i} 
                className="flex flex-col p-2 rounded-lg bg-black/20 border border-white/5 cursor-pointer hover:bg-white/10 hover:border-primary-500/50 transition-all"
                onClick={() => selectFeature({ id: infra.id, source: 'pois' }, infra)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-200">{infra.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${infra.risk_class === 'Very High' ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'}`}>
                    {infra.risk_class}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-gray-500 uppercase">
                  <span>{infra.type}</span>
                  <span>FSI: {infra.fsi_score.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderEmergencyDashboard = () => {
    return (
      <div className="space-y-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="analytics-widget">
          <h3 className="text-sm font-semibold text-gray-200 mb-3">Safe Assembly Zones</h3>
          <p className="text-xs text-gray-400 leading-relaxed mb-4">
            The following facilities are located strictly in Very Low and Low risk zones and are recommended as emergency staging areas.
          </p>
          
          <div className="space-y-2">
            {shelterRecommendations.map((shelter, i) => (
              <div 
                key={i} 
                className="flex flex-col p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20 cursor-pointer hover:bg-emerald-500/20 transition-all"
                onClick={() => selectFeature({ id: shelter.id, source: 'pois' }, shelter)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-gray-200">{shelter.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                    Safe Zone
                  </span>
                </div>
                <span className="text-[10px] text-gray-500 uppercase tracking-wider">{shelter.type}</span>
              </div>
            ))}
            
            {shelterRecommendations.length === 0 && (
              <div className="p-4 text-center text-xs text-gray-500 border border-dashed border-gray-700 rounded-lg">
                No immediate shelter recommendations found in current view.
              </div>
            )}
          </div>
        </motion.div>
      </div>
    );
  };

  // --- Context-Aware Generators ---
  
  const seed = (currentLocation || "Pune").length;
  
  const renderGenericBarChart = (title: string, dataKey: string, labels: string[], values: number[], color: string) => {
    const data = labels.map((l, i) => ({ name: l, value: values[i] + (seed * i * 10) }));
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="analytics-widget space-y-4">
        <h3 className="text-sm font-semibold text-gray-200">{title}</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} angle={-45} textAnchor="end" />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name={dataKey} fill={color} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    );
  };

  const renderGenericPieChart = (title: string, labels: string[], values: number[], colors: string[]) => {
    const data = labels.map((l, i) => ({ name: l, value: values[i] + (seed * i * 5), color: colors[i] }));
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="analytics-widget space-y-4">
        <h3 className="text-sm font-semibold text-gray-200">{title}</h3>
        <div className="h-44 flex items-center">
          <div className="w-1/2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} cx="50%" cy="50%" innerRadius={35} outerRadius={65} paddingAngle={2} dataKey="value" strokeWidth={0}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-1/2 space-y-2">
            {data.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-[10px]">
                <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-gray-400 flex-1 truncate">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  };

  // Switch routing based on actual tab ID
  switch (activeTab) {
    // Shared real data tabs
    case "risk": 
    case "flood":
      return renderRiskDashboard();
    case "exposure": 
    case "buildings":
      return renderExposureDashboard();
    case "critical_infra": 
    case "critical":
      return renderCriticalInfraDashboard();
    case "emergency": return renderEmergencyDashboard();
    
    // Terrain Context
    case "elevation":
      return renderGenericBarChart("Elevation Distribution", "Hectares", ["0-100m", "100-300m", "300-500m", "500-800m", ">800m"], [120, 450, 890, 600, 200], "#8b5cf6");
    case "slope":
      return renderGenericPieChart("Slope Categories", ["Flat (0-5%)", "Gentle (5-15%)", "Steep (15-30%)", "Extreme (>30%)"], [50, 30, 15, 5], ["#10b981", "#f59e0b", "#f97316", "#ef4444"]);
    case "stability":
      return renderGenericBarChart("Terrain Stability Index", "Hexagons", ["Stable", "Moderate", "Vulnerable", "Critical"], [4000, 2500, 800, 150], "#10b981");

    // Hydrology Context (Drainage)
    case "drainage":
      return renderGenericBarChart("Drainage Density by Ward", "km/km²", ["Ward A", "Ward B", "Ward C", "Ward D"], [2.4, 3.1, 1.2, 4.5], "#0ea5e9");

    // Infrastructure Context (Roads)
    case "roads":
      return renderGenericBarChart("Road Hierarchy Exposure", "km", ["Highways", "Arterial", "Collector", "Local"], [45, 120, 340, 890], "#64748b");

    // Population Context
    case "demographics":
      return renderGenericPieChart("Age Distribution", ["0-14", "15-64", "65+"], [25, 65, 10], ["#3b82f6", "#10b981", "#f59e0b"]);
    case "vulnerability":
      return renderGenericBarChart("Social Vulnerability Index (SoVI)", "Population", ["Low", "Medium", "High", "Critical"], [45000, 80000, 35000, 12000], "#ef4444");

    // Environmental Context
    case "ndvi":
      return renderGenericBarChart("Vegetation Density (NDVI)", "Area (Ha)", ["Dense Forest", "Moderate", "Sparse", "Barren"], [1200, 3400, 2100, 800], "#22c55e");
    case "heat":
      return renderGenericPieChart("Urban Heat Island (UHI) Zones", ["Cool", "Moderate", "Hot", "Severe"], [15, 40, 35, 10], ["#3b82f6", "#f59e0b", "#f97316", "#ef4444"]);
    case "ecology":
      return renderGenericBarChart("Ecological Sensitivity", "Score", ["Zone 1", "Zone 2", "Zone 3", "Zone 4"], [85, 62, 45, 20], "#10b981");

    default: return renderRiskDashboard();
  }
}
