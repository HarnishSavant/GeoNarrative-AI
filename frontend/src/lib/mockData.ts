// GeoNarrative AI — Mock Data for Demo

import { AnalyticsData, ChatMessage, DashboardMode, FloodRisk, KPIData, MapLayer, Notification } from "./types";

export const hydrologyKPIs: KPIData[] = [
  { id: "flood-risk", title: "Flood Risk Score", value: "7.8", change: 12.5, changeLabel: "vs historical baseline", icon: "droplets", color: "#ef4444", gradient: ["#ef4444", "#f97316"] },
  { id: "population", title: "Pop. in Floodway", value: "1.2M", change: -3.2, changeLabel: "since 2011 census", icon: "users", color: "#f59e0b", gradient: ["#f59e0b", "#eab308"] },
  { id: "infra", title: "SWD Capacity", value: "84%", change: 5.1, changeLabel: "design threshold", icon: "building", color: "#10b981", gradient: ["#10b981", "#06b6d4"] },
  { id: "rainfall", title: "Annual Precipitation", value: "722mm", change: 18.3, changeLabel: "above normal", icon: "cloud-rain", color: "#3b82f6", gradient: ["#3b82f6", "#6366f1"] },
  { id: "elevation", title: "Avg Catchment Elev.", value: "560m", change: 0, changeLabel: "MSL (Pune)", icon: "mountain", color: "#8b5cf6", gradient: ["#8b5cf6", "#a855f7"] },
  { id: "water-bodies", title: "Monitored Basins", value: "23", change: 2, changeLabel: "active sensors", icon: "waves", color: "#06b6d4", gradient: ["#06b6d4", "#22d3ee"] },
];

export const fallbackAnalytics: AnalyticsData = {
  rainfall: [
    { month: "Jan", value: 12, avg: 15 },
    { month: "Feb", value: 8, avg: 12 },
    { month: "Mar", value: 15, avg: 10 },
    { month: "Apr", value: 28, avg: 25 },
    { month: "May", value: 65, avg: 55 },
    { month: "Jun", value: 182, avg: 160 },
    { month: "Jul", value: 245, avg: 200 },
    { month: "Aug", value: 198, avg: 185 },
    { month: "Sep", value: 165, avg: 150 },
    { month: "Oct", value: 85, avg: 80 },
    { month: "Nov", value: 32, avg: 35 },
    { month: "Dec", value: 10, avg: 12 },
  ],
  elevation: [
    { zone: "Zone A", min: 450, max: 620, avg: 540 },
    { zone: "Zone B", min: 380, max: 510, avg: 445 },
    { zone: "Zone C", min: 520, max: 680, avg: 600 },
    { zone: "Zone D", min: 310, max: 450, avg: 380 },
    { zone: "Zone E", min: 580, max: 750, avg: 665 },
  ],
  riskDistribution: [
    { name: "Low Risk", value: 45, color: "#10b981" },
    { name: "Medium Risk", value: 30, color: "#f59e0b" },
    { name: "High Risk", value: 18, color: "#ef4444" },
    { name: "Critical", value: 7, color: "#dc2626" },
  ],
  populationDensity: [
    { area: "Central", density: 12500, risk: "high" },
    { area: "North", density: 8200, risk: "medium" },
    { area: "South", density: 6800, risk: "low" },
    { area: "East", density: 9500, risk: "medium" },
    { area: "West", density: 11200, risk: "high" },
  ],
  infrastructure: [
    { type: "Hospitals", count: 45, atRisk: 8 },
    { type: "Schools", count: 312, atRisk: 42 },
    { type: "Fire Stations", count: 18, atRisk: 3 },
    { type: "Power Plants", count: 6, atRisk: 1 },
    { type: "Water Treatment", count: 12, atRisk: 4 },
    { type: "Bridges", count: 28, atRisk: 7 },
  ],
  timeSeriesRisk: [
    { date: "2020", flood: 45, drought: 20, earthquake: 5 },
    { date: "2021", flood: 52, drought: 18, earthquake: 8 },
    { date: "2022", flood: 68, drought: 25, earthquake: 3 },
    { date: "2023", flood: 75, drought: 15, earthquake: 12 },
    { date: "2024", flood: 82, drought: 30, earthquake: 6 },
    { date: "2025", flood: 78, drought: 28, earthquake: 9 },
  ],
};

export const fallbackFloodRisks: FloodRisk[] = [
  {
    zone: "Riverside District",
    level: "critical",
    score: 9.2,
    area: 12.5,
    population: 45000,
    description: "Adjacent to Mula-Mutha river confluence. Historical flooding in 2019, 2021.",
  },
  {
    zone: "Low-Lying Basin Area",
    level: "high",
    score: 7.8,
    area: 8.3,
    population: 32000,
    description: "Elevation below 400m with poor drainage infrastructure.",
  },
  {
    zone: "Industrial Corridor",
    level: "medium",
    score: 5.5,
    area: 15.2,
    population: 18000,
    description: "Moderate risk due to impervious surface coverage.",
  },
  {
    zone: "Hilltop Residential",
    level: "low",
    score: 2.1,
    area: 22.0,
    population: 55000,
    description: "Elevated terrain with good natural drainage.",
  },
];

const normalizeRiskScores = (risks: FloodRisk[]): FloodRisk[] =>
  risks.map((risk) => ({ ...risk, score: Math.round(risk.score * 10) / 10 }));

export function generateFloodRisksForLocation(location: string, mode: DashboardMode = "flood"): FloodRisk[] {
  const cityName = location.split(',')[0].trim();
  if (mode === "traffic") {
    return normalizeRiskScores([
      {
        zone: `${cityName} NH-48 Corridor`,
        level: "critical",
        score: 9.4 + (Math.random() * 0.4 - 0.2),
        area: 5.2,
        population: 28000 + Math.floor(Math.random() * 5000),
        description: "Severe bottleneck at peak commuter hours with critical merge conflicts.",
      },
      {
        zone: `${cityName} Ring Road Junction`,
        level: "high",
        score: 8.1 + (Math.random() * 0.4 - 0.2),
        area: 2.1,
        population: 14000 + Math.floor(Math.random() * 3000),
        description: "High accident frequency zone due to weave patterns and signal timing issues.",
      },
      {
        zone: `${cityName} Old City Narrow Streets`,
        level: "medium",
        score: 6.2 + (Math.random() * 0.4 - 0.2),
        area: 4.8,
        population: 42000 + Math.floor(Math.random() * 8000),
        description: "High traffic density compounded by narrow municipal rights-of-way.",
      },
      {
        zone: `${cityName} North Highway Bypass`,
        level: "low",
        score: 2.3 + (Math.random() * 0.4 - 0.2),
        area: 12.0,
        population: 8000 + Math.floor(Math.random() * 2000),
        description: "Smooth flow, low congestion, optimized signal intervals.",
      },
    ]);
  }
  if (mode === "urban") {
    return normalizeRiskScores([
      {
        zone: `${cityName} Industrial Corridor`,
        level: "critical",
        score: 8.8 + (Math.random() * 0.4 - 0.2),
        area: 18.5,
        population: 12000 + Math.floor(Math.random() * 4000),
        description: "High concentration of air emissions and land conversion activities.",
      },
      {
        zone: `${cityName} Residential expansion East`,
        level: "high",
        score: 7.9 + (Math.random() * 0.4 - 0.2),
        area: 14.2,
        population: 58000 + Math.floor(Math.random() * 10000),
        description: "Rapid commercial conversion outpacing current infrastructure capacity.",
      },
      {
        zone: `${cityName} Central Heritage Area`,
        level: "medium",
        score: 5.4 + (Math.random() * 0.4 - 0.2),
        area: 3.1,
        population: 24000 + Math.floor(Math.random() * 5000),
        description: "Strict building height zoning guidelines require careful preservation mapping.",
      },
      {
        zone: `${cityName} South Green Belt`,
        level: "low",
        score: 1.8 + (Math.random() * 0.4 - 0.2),
        area: 25.0,
        population: 5000 + Math.floor(Math.random() * 1000),
        description: "Strict agricultural reserve with zero unauthorized construction.",
      },
    ]);
  }
  if (mode === "utility") {
    return normalizeRiskScores([
      {
        zone: `${cityName} Substation Zone D`,
        level: "critical",
        score: 9.6 + (Math.random() * 0.4 - 0.2),
        area: 6.8,
        population: 64000 + Math.floor(Math.random() * 10000),
        description: "Critical thermal stress on transformer units during peak demand hours.",
      },
      {
        zone: `${cityName} East Pipeline Mains`,
        level: "high",
        score: 8.3 + (Math.random() * 0.4 - 0.2),
        area: 15.4,
        population: 48000 + Math.floor(Math.random() * 8000),
        description: "Localized pipe wall thinness alerts from telemetry, pipeline pressure drop.",
      },
      {
        zone: `${cityName} Telecom Hub North`,
        level: "medium",
        score: 5.8 + (Math.random() * 0.4 - 0.2),
        area: 9.2,
        population: 75000 + Math.floor(Math.random() * 12000),
        description: "Occasional cellular capacity drop under heavy localized subscriber load.",
      },
      {
        zone: `${cityName} Western Reservoir Sector`,
        level: "low",
        score: 1.5 + (Math.random() * 0.4 - 0.2),
        area: 22.0,
        population: 15000 + Math.floor(Math.random() * 3000),
        description: "Excellent infrastructure reliability with dual feed redundancies.",
      },
    ]);
  }

  // default: flood
  return normalizeRiskScores([
    {
      zone: `${cityName} Central Riverside`,
      level: "critical",
      score: 9.2 + (Math.random() * 0.6 - 0.3),
      area: 12.5,
      population: 45000 + Math.floor(Math.random() * 10000),
      description: `Adjacent to major water bodies in ${cityName}. High vulnerability during peak monsoon.`,
    },
    {
      zone: `${cityName} Low-Lying Basin`,
      level: "high",
      score: 7.8 + (Math.random() * 0.6 - 0.3),
      area: 8.3,
      population: 32000 + Math.floor(Math.random() * 8000),
      description: "Low elevation profile with constrained drainage infrastructure.",
    },
    {
      zone: `${cityName} Urban Corridor`,
      level: "medium",
      score: 5.5 + (Math.random() * 0.6 - 0.3),
      area: 15.2,
      population: 18000 + Math.floor(Math.random() * 5000),
      description: "Moderate risk due to high impervious surface coverage.",
    },
    {
      zone: `${cityName} Elevated Residential`,
      level: "low",
      score: 2.1 + (Math.random() * 0.6 - 0.3),
      area: 22.0,
      population: 55000 + Math.floor(Math.random() * 12000),
      description: "Elevated terrain with good natural drainage slopes.",
    },
  ]);
}

export function generateAnalyticsForLocation(location: string, mode: DashboardMode = "flood"): AnalyticsData {
  const cityName = location.split(',')[0].trim();
  if (mode === "traffic") {
    return {
      rainfall: [ // repurposed as "Hourly Traffic Volume"
        { month: "6AM", value: 3200, avg: 2800 }, { month: "8AM", value: 9500, avg: 7200 },
        { month: "10AM", value: 6800, avg: 6000 }, { month: "12PM", value: 5400, avg: 5000 },
        { month: "2PM", value: 5800, avg: 5200 }, { month: "4PM", value: 7200, avg: 6500 },
        { month: "6PM", value: 9800, avg: 7800 }, { month: "8PM", value: 6200, avg: 5500 },
        { month: "10PM", value: 3500, avg: 3000 }, { month: "12AM", value: 1200, avg: 1000 },
      ],
      elevation: [ // repurposed as "Road Segments"
        { zone: "NH-48", min: 20, max: 85, avg: 62 }, { zone: "Ring Rd", min: 30, max: 92, avg: 71 },
        { zone: "MG Road", min: 15, max: 78, avg: 55 }, { zone: "Old City", min: 40, max: 95, avg: 78 },
      ],
      riskDistribution: [
        { name: "Free Flow", value: 35, color: "#10b981" }, { name: "Moderate", value: 30, color: "#f59e0b" },
        { name: "Congested", value: 25, color: "#ef4444" }, { name: "Gridlock", value: 10, color: "#dc2626" },
      ],
      populationDensity: [
        { area: `${cityName} Central`, density: 9500, risk: "high" }, { area: `${cityName} North`, density: 5200, risk: "medium" },
        { area: `${cityName} South`, density: 4800, risk: "low" }, { area: `${cityName} East`, density: 7200, risk: "medium" },
        { area: `${cityName} West`, density: 8100, risk: "high" },
      ],
      infrastructure: [
        { type: "Intersections", count: 245, atRisk: 38 }, { type: "Flyovers", count: 18, atRisk: 3 },
        { type: "Bus Stops", count: 520, atRisk: 65 }, { type: "Metro Stns", count: 24, atRisk: 4 },
        { type: "Parking", count: 180, atRisk: 22 },
      ],
      timeSeriesRisk: [
        { date: "2020", congestion: 52, accidents: 38, roadworks: 15 }, { date: "2021", congestion: 58, accidents: 42, roadworks: 18 },
        { date: "2022", congestion: 65, accidents: 48, roadworks: 22 }, { date: "2023", congestion: 72, accidents: 55, roadworks: 28 },
        { date: "2024", congestion: 78, accidents: 62, roadworks: 32 }, { date: "2025", congestion: 82, accidents: 68, roadworks: 35 },
      ],
    };
  }
  if (mode === "urban") {
    return {
      rainfall: [ // repurposed as "Monthly Construction Permits"
        { month: "Jan", value: 18, avg: 15 }, { month: "Feb", value: 22, avg: 18 },
        { month: "Mar", value: 35, avg: 25 }, { month: "Apr", value: 42, avg: 30 },
        { month: "May", value: 38, avg: 28 }, { month: "Jun", value: 25, avg: 22 },
        { month: "Jul", value: 15, avg: 20 }, { month: "Aug", value: 12, avg: 18 },
        { month: "Sep", value: 28, avg: 22 }, { month: "Oct", value: 32, avg: 25 },
        { month: "Nov", value: 30, avg: 24 }, { month: "Dec", value: 20, avg: 18 },
      ],
      elevation: [
        { zone: "Residential", min: 45, max: 65, avg: 55 }, { zone: "Commercial", min: 20, max: 35, avg: 28 },
        { zone: "Industrial", min: 10, max: 18, avg: 14 }, { zone: "Mixed Use", min: 5, max: 12, avg: 8 },
      ],
      riskDistribution: [
        { name: "Residential", value: 45, color: "#6366f1" }, { name: "Commercial", value: 25, color: "#f59e0b" },
        { name: "Industrial", value: 15, color: "#ef4444" }, { name: "Green/Open", value: 15, color: "#10b981" },
      ],
      populationDensity: [
        { area: `${cityName} Central`, density: 14200, risk: "high" }, { area: `${cityName} North`, density: 9800, risk: "medium" },
        { area: `${cityName} South`, density: 7200, risk: "low" }, { area: `${cityName} East`, density: 10500, risk: "medium" },
        { area: `${cityName} West`, density: 12800, risk: "high" },
      ],
      infrastructure: [
        { type: "Schools", count: 312, atRisk: 15 }, { type: "Hospitals", count: 45, atRisk: 3 },
        { type: "Parks", count: 78, atRisk: 0 }, { type: "Markets", count: 125, atRisk: 8 },
        { type: "Govt. Bldgs", count: 56, atRisk: 2 },
      ],
      timeSeriesRisk: [
        { date: "2020", permits: 82, violations: 12, growth: 6 }, { date: "2021", permits: 85, violations: 14, growth: 8 },
        { date: "2022", permits: 88, violations: 15, growth: 10 }, { date: "2023", permits: 91, violations: 16, growth: 12 },
        { date: "2024", permits: 93, violations: 17, growth: 14 }, { date: "2025", permits: 95, violations: 18, growth: 16 },
      ],
    };
  }
  if (mode === "utility") {
    return {
      rainfall: [ // repurposed as "Daily Power Consumption (MW)"
        { month: "Mon", value: 780, avg: 720 }, { month: "Tue", value: 820, avg: 740 },
        { month: "Wed", value: 842, avg: 760 }, { month: "Thu", value: 810, avg: 750 },
        { month: "Fri", value: 795, avg: 730 }, { month: "Sat", value: 650, avg: 620 },
        { month: "Sun", value: 580, avg: 550 },
      ],
      elevation: [
        { zone: "Zone A", min: 95, max: 99, avg: 97 }, { zone: "Zone B", min: 88, max: 96, avg: 92 },
        { zone: "Zone C", min: 92, max: 98, avg: 95 }, { zone: "Zone D", min: 85, max: 94, avg: 90 },
      ],
      riskDistribution: [
        { name: "Operational", value: 72, color: "#10b981" }, { name: "Maintenance", value: 15, color: "#f59e0b" },
        { name: "At Risk", value: 10, color: "#ef4444" }, { name: "Offline", value: 3, color: "#dc2626" },
      ],
      populationDensity: [
        { area: `${cityName} Central`, density: 98, risk: "low" }, { area: `${cityName} North`, density: 92, risk: "medium" },
        { area: `${cityName} South`, density: 95, risk: "low" }, { area: `${cityName} East`, density: 88, risk: "high" },
        { area: `${cityName} West`, density: 91, risk: "medium" },
      ],
      infrastructure: [
        { type: "Substations", count: 42, atRisk: 5 }, { type: "Pump Stns", count: 28, atRisk: 4 },
        { type: "Cell Towers", count: 156, atRisk: 12 }, { type: "Pipelines (km)", count: 850, atRisk: 45 },
        { type: "Transformers", count: 380, atRisk: 28 },
      ],
      timeSeriesRisk: [
        { date: "2020", outages: 15, load: 8, maintenance: 3 }, { date: "2021", outages: 18, load: 12, maintenance: 5 },
        { date: "2022", outages: 12, load: 10, maintenance: 4 }, { date: "2023", outages: 22, load: 14, maintenance: 6 },
        { date: "2024", outages: 16, load: 11, maintenance: 3 }, { date: "2025", outages: 12, load: 8, maintenance: 2 },
      ],
    };
  }
  // Default: flood
  const data = JSON.parse(JSON.stringify(fallbackAnalytics)) as AnalyticsData;
  data.populationDensity = [
    { area: `${cityName} Central`, density: 12500, risk: "high" },
    { area: `${cityName} North`, density: 8200, risk: "medium" },
    { area: `${cityName} South`, density: 6800, risk: "low" },
    { area: `${cityName} East`, density: 9500, risk: "medium" },
    { area: `${cityName} West`, density: 11200, risk: "high" },
  ];
  return data;
}export const fallbackMapLayers: MapLayer[] = [
  { 
    id: "dem", 
    name: "DEM (Elevation)", 
    type: "heatmap", 
    visible: true, 
    color: "#8b5cf6", 
    icon: "mountain", 
    description: "Digital Elevation Model.",
    dataSource: "Copernicus GLO-30 DEM",
    resolution: "30m Spatial Resolution",
    updateDate: "2025-10-15",
    layerMetadata: "Bare-earth elevation model. EPSG:4326.",
    coverageArea: "Pune Metropolitan Region"
  },
  { 
    id: "hill", 
    name: "Hillshade", 
    type: "heatmap", 
    visible: true, 
    color: "#6b7280", 
    icon: "sun", 
    description: "Topographic hillshade relief.",
    dataSource: "Derived from DEM",
    resolution: "30m Spatial Resolution",
    updateDate: "2025-10-15",
    layerMetadata: "Hillshade visualization of terrain.",
    coverageArea: "Pune Metropolitan Region"
  },
  { 
    id: "flood", 
    name: "Flood Risk", 
    type: "heatmap", 
    visible: false, 
    color: "#3b82f6", 
    icon: "droplets", 
    description: "Hydrological flood inundation risk.",
    dataSource: "Hydrological Modeling",
    resolution: "10m Pixel Size",
    updateDate: "2026-01-22",
    layerMetadata: "Raster-based flood risk exposure.",
    coverageArea: "Pune Metropolitan Region"
  },
  { 
    id: "dist_to_river", 
    name: "Distance to River", 
    type: "heatmap", 
    visible: false, 
    color: "#06b6d4", 
    icon: "waves", 
    description: "Proximity to major water bodies.",
    dataSource: "Spatial Analysis",
    resolution: "10m Pixel Size",
    updateDate: "2026-01-22",
    layerMetadata: "Euclidean distance to Mula-Mutha river.",
    coverageArea: "Pune Metropolitan Region"
  },
  { 
    id: "lulc", 
    name: "Land Use / Land Cover", 
    type: "heatmap", 
    visible: false, 
    color: "#10b981", 
    icon: "route", 
    description: "Urban expansion and zoning footprint.",
    dataSource: "Sentinel-2 & Bhuvan LULC",
    resolution: "10m Pixel Size",
    updateDate: "2025-12-01",
    layerMetadata: "Classified raster into Built-up, Vegetation, Water, Barren.",
    coverageArea: "Pune Metropolitan Region"
  },
  { 
    id: "builddens", 
    name: "Building Density", 
    type: "heatmap", 
    visible: false, 
    color: "#f59e0b", 
    icon: "building", 
    description: "Urban structural density.",
    dataSource: "Derived from OSM",
    resolution: "10m Pixel Size",
    updateDate: "2026-05-01",
    layerMetadata: "Rasterized density of building footprints.",
    coverageArea: "Pune Metropolitan Region"
  },
  { 
    id: "rivers", 
    name: "Rivers & Water Bodies", 
    type: "fill", 
    visible: true, 
    color: "#3b82f6", 
    icon: "droplets", 
    description: "Hydrology and drainage analysis.",
    dataSource: "PMC & OpenStreetMap",
    resolution: "1:1000 Scale Vector",
    updateDate: "2026-01-22",
    layerMetadata: "Mula-Mutha river cross-sections and HFL boundaries.",
    coverageArea: "Pune Metropolitan Region"
  },
  { 
    id: "roads", 
    name: "Road Network", 
    type: "line", 
    visible: false, 
    color: "#9ca3af", 
    icon: "route", 
    description: "Mobility analysis and access routing.",
    dataSource: "OpenStreetMap",
    resolution: "Vector Polyline",
    updateDate: "2026-05-15",
    layerMetadata: "High-resolution topological routing network.",
    coverageArea: "Pune Metropolitan Region"
  }
];

// ===== TERRAIN MODE =====
export const terrainKPIs: KPIData[] = [
  { id: "dem-res", title: "DEM Resolution", value: "2.5m", change: 0, changeLabel: "spatial accuracy", icon: "mountain", color: "#8b5cf6", gradient: ["#8b5cf6", "#a855f7"] },
  { id: "max-elev", title: "Max Elevation", value: "1403m", change: 0, changeLabel: "Sinhagad Fort", icon: "mountain", color: "#ef4444", gradient: ["#ef4444", "#f97316"] },
  { id: "min-elev", title: "Min Elevation", value: "520m", change: 0, changeLabel: "Mula-Mutha Confluence", icon: "waves", color: "#3b82f6", gradient: ["#3b82f6", "#6366f1"] },
  { id: "slope", title: "Avg Slope", value: "12°", change: 0.5, changeLabel: "topographic gradient", icon: "route", color: "#f59e0b", gradient: ["#f59e0b", "#ef4444"] },
  { id: "aspect", title: "Primary Aspect", value: "East", change: 0, changeLabel: "drainage direction", icon: "waves", color: "#10b981", gradient: ["#10b981", "#06b6d4"] },
  { id: "landslide", title: "Landslide Risk", value: "Low", change: -1.2, changeLabel: "susceptibility index", icon: "flame", color: "#06b6d4", gradient: ["#06b6d4", "#22d3ee"] },
];

// ===== INFRASTRUCTURE MODE =====
export const infrastructureKPIs: KPIData[] = [
  { id: "built-area", title: "Built-up Area", value: "482km²", change: 2.1, changeLabel: "mapped footprint", icon: "building", color: "#8b5cf6", gradient: ["#8b5cf6", "#6366f1"] },
  { id: "road-len", title: "Road Network", value: "3,204km", change: 3.5, changeLabel: "mapped ways", icon: "route", color: "#10b981", gradient: ["#10b981", "#06b6d4"] },
  { id: "transit", title: "Transit Nodes", value: "247", change: 14.2, changeLabel: "active stations", icon: "building", color: "#f59e0b", gradient: ["#f59e0b", "#eab308"] },
  { id: "impervious", title: "Impervious Cover", value: "42%", change: 1.2, changeLabel: "surface runoff factor", icon: "droplets", color: "#22c55e", gradient: ["#22c55e", "#10b981"] },
  { id: "critical-infra", title: "Critical Assets", value: "1,204", change: 0.8, changeLabel: "hospitals, fire stn", icon: "shield", color: "#3b82f6", gradient: ["#3b82f6", "#6366f1"] },
  { id: "power", title: "Power Substations", value: "156", change: 0, changeLabel: "grid nodes", icon: "waves", color: "#ef4444", gradient: ["#ef4444", "#f97316"] },
];

// ===== POPULATION MODE =====
export const populationKPIs: KPIData[] = [
  { id: "total-pop", title: "Total Population", value: "7.4M", change: 2.3, changeLabel: "projected 2025", icon: "users", color: "#10b981", gradient: ["#10b981", "#06b6d4"] },
  { id: "density", title: "Avg Density", value: "9,400", change: 1.4, changeLabel: "persons/km²", icon: "users", color: "#3b82f6", gradient: ["#3b82f6", "#6366f1"] },
  { id: "day-night", title: "Commuter Flux", value: "+1.2M", change: 0.3, changeLabel: "daytime influx", icon: "route", color: "#f59e0b", gradient: ["#f59e0b", "#ef4444"] },
  { id: "vuln-pop", title: "Vulnerable Pop.", value: "850k", change: -2.1, changeLabel: "high-risk zones", icon: "shield", color: "#06b6d4", gradient: ["#06b6d4", "#22d3ee"] },
  { id: "slums", title: "Informal Sett.", value: "32%", change: -0.5, changeLabel: "of total pop.", icon: "building", color: "#ef4444", gradient: ["#ef4444", "#f97316"] },
  { id: "growth", title: "Annual Growth", value: "3.4%", change: 0.1, changeLabel: "CAGR", icon: "waves", color: "#8b5cf6", gradient: ["#8b5cf6", "#a855f7"] },
];

// ===== ENVIRONMENT MODE =====
export const environmentKPIs: KPIData[] = [
  { id: "ndvi", title: "Mean NDVI", value: "0.42", change: -0.05, changeLabel: "vegetation index", icon: "waves", color: "#22c55e", gradient: ["#22c55e", "#10b981"] },
  { id: "lst", title: "Mean LST", value: "34.2°C", change: 1.4, changeLabel: "land surface temp", icon: "flame", color: "#ef4444", gradient: ["#ef4444", "#f97316"] },
  { id: "pm25", title: "PM2.5 Avg", value: "68µg", change: 12.3, changeLabel: "air quality", icon: "cloud-rain", color: "#8b5cf6", gradient: ["#8b5cf6", "#6366f1"] },
  { id: "uhi", title: "UHI Effect", value: "+4.5°C", change: 0.8, changeLabel: "urban heat island delta", icon: "flame", color: "#f59e0b", gradient: ["#f59e0b", "#eab308"] },
  { id: "tree-canopy", title: "Tree Canopy", value: "18%", change: -1.2, changeLabel: "spatial coverage", icon: "mountain", color: "#10b981", gradient: ["#10b981", "#06b6d4"] },
  { id: "aqi", title: "Real-time AQI", value: "142", change: 15, changeLabel: "moderate", icon: "waves", color: "#3b82f6", gradient: ["#3b82f6", "#6366f1"] },
];

// Master getter functions
export function getKPIsForMode(mode: DashboardMode): KPIData[] {
  switch (mode) {
    case "terrain": return terrainKPIs;
    case "infrastructure": return infrastructureKPIs;
    case "population": return populationKPIs;
    case "environment": return environmentKPIs;
    default: return hydrologyKPIs;
  }
}
export function getLayersForMode(mode: DashboardMode): MapLayer[] {
  // Map Dashboard modes to corresponding active datasets
  // Each mode activates layers most relevant for analysis
  const modeToLayers: Record<string, string[]> = {
    "terrain": ["dem", "hill", "lulc", "builddens", "dist_to_river", "flood"],
    "hydrology": ["dem", "hill", "lulc", "builddens", "dist_to_river", "flood"],
    "infrastructure": ["dem", "hill", "lulc", "builddens", "dist_to_river", "flood"],
    "population": ["dem", "hill", "lulc", "builddens", "dist_to_river", "flood"],
    "environment": ["dem", "hill", "lulc", "builddens", "dist_to_river", "flood"]
  };
  
  const activeLayerIds = modeToLayers[mode] || ["dem", "hill"];

  return fallbackMapLayers.map(layer => ({
    ...layer,
    visible: activeLayerIds.includes(layer.id)
  }));
}

export const fallbackChatHistory: ChatMessage[] = [
  {
    id: "1",
    role: "assistant",
    content: "Welcome to the GeoNarrative AI Geospatial Assistant. I am your specialized GeoAI agent, designed to perform multi-criteria decision analysis, hydrological assessments, and predictive environmental modeling.\n\nTo begin your assessment, please request a deep analytical task:\n- Delineating localized inundation risks: \"Analyze flood risk for this area\"\n- Assessing structural lifeline exposure: \"Assess infrastructure risk\"\n- Climatological monitoring: \"What are the rainfall trends?\"\n- Targeted adaptation engineering: \"Recommend flood mitigation strategies\"",
    timestamp: new Date(),
  },
];

export const fallbackNotifications: Notification[] = [
  {
    id: "1",
    title: "Flood Alert",
    message: "Heavy rainfall predicted in Riverside District. Risk level elevated to Critical.",
    type: "warning",
    timestamp: new Date(Date.now() - 3600000),
    read: false,
  },
  {
    id: "2",
    title: "Analysis Complete",
    message: "Flood risk assessment for Pune has been completed successfully.",
    type: "success",
    timestamp: new Date(Date.now() - 7200000),
    read: false,
  },
  {
    id: "3",
    title: "New Data Available",
    message: "Updated rainfall data for Q2 2025 has been ingested.",
    type: "info",
    timestamp: new Date(Date.now() - 86400000),
    read: true,
  },
];



// AI response generator (client-side fallback)
// AI response generator (client-side fallback)
// AI response generator (client-side fallback)
export function generateAIResponse(
  query: string, 
  locationName: string = "Pune", 
  mode: DashboardMode = "flood",
  uploadedFiles: any[] = []
): string {
  const q = query.toLowerCase().trim();
  const cityName = locationName.split(',')[0].trim();

  // If the user has uploaded files, process query using Vector RAG semantic search mockup
  if (uploadedFiles.length > 0) {
    const file = uploadedFiles[uploadedFiles.length - 1];
    
    // 1. RAG query: Schema / Columns / Fields
    if (q.includes("field") || q.includes("column") || q.includes("schema") || q.includes("key") || q.includes("attribute")) {
      return `## 🔍 SPATIAL DATA INGESTION: DATABASE SCHEMA AUDIT
      
The Vector RAG pipeline has successfully completed a structural schema audit on your active spatial asset **"${file.name}"**. 

### 📑 Parsed Attribute Schema Matrix
| Attribute Field | Spatial Data Type | Sample Reference Value | Analytical GIS Description |
|:---|:---|:---|:---|
| \`id\` | \`Integer (Primary Key)\` | \`20491\` | Unique feature identifier mapped in vector index. |
| \`geometry\` | \`GeoJSON: Point\` | \`[73.856, 18.520]\` | Geometric coordinate coordinates (WGS84 EPSG:4326). |
| \`risk_factor\` | \`Float (Normalized)\` | \`0.78\` | Digital Elevation Model (DEM) derived inundation risk split. |
| \`district_name\` | \`String (Varchar)\` | \`Pune Cantonment\` | Associated municipal administrative planning sector. |

### 🛠️ Structural Diagnostics & Data Quality:
- **Geometry Type Consistency:** 100% compliant (Point coordinates detected).
- **Coordinate System Validation:** Verified EPSG:4326 WGS84 spatial reference projection.
- **Null Value Ratios:** 0.00% (High-integrity metadata set).

Would you like me to map the geographical density distribution of any specific attribute field?`;
    }
    
    // 2. RAG query: Features count / Size / Diagnostics
    if (q.includes("count") || q.includes("size") || q.includes("many") || q.includes("diagnostic") || q.includes("feature")) {
      return `## 📊 GEOPARTITION INDEXING REPORT: DIAGNOSTICS
      
Spatial RAG metadata indexing is complete for your custom vector asset **"${file.name}"**. Here is the high-fidelity diagnostic assessment:

### ⚙️ Vector Indexer Telemetry
- **Active Geometries:** **${file.features || 223} independent coordinate nodes** successfully registered.
- **Physical Dataset Size:** **${(file.size / 1024 / 1024).toFixed(2)} MB** in standard binary stream.
- **Coordinate Reference System:** EPSG:4326 WGS 84 Projection (100% coordinate validity verified).
- **Ingestion Execution Time:** 0.42 seconds using local CPU spatial indexers.
- **Spatial Dispersion Range:** ${cityName} Metropolitan Catchment Bounds (150 km² digital grid coverage).

### 🔍 Topology Diagnostics:
- **Boundary Box Limits:** Lon \`73.72° - 73.98°\`, Lat \`18.41° - 18.63°\`
- **Outlier Points Detection:** Zero anomalies detected. All points are located within regional municipal boundaries.

Would you like me to filter or extract a specific geographical coordinates quadrant?`;
    }
    
    // 3. RAG query: Environmental Risk / Hazards / Inundation
    if (q.includes("risk") || q.includes("hazard") || q.includes("inundate") || q.includes("flood") || q.includes("mitigate")) {
      return `## 🔴 SPATIAL RISK COINCIDENCE & ELEVATION INTERSECTION
      
Intersecting your custom spatial dataset **"${file.name}"** (**${file.features || 223} features**) with our high-resolution Digital Elevation Inundation Models has yielded critical flood risk results.

### 🌊 Inundation Risk Matrix
| Topographic Catchment Zone | Feature Count | Overlap Ratio (%) | Projected Risk Classification |
|:---|:---|:---|:---|
| Lower Confluence Depressions | 41 features | 18.39% | 🔴 Critical Risk |
| Moderate Slope Terraces | 78 features | 34.98% | 🟡 Medium Risk |
| Elevated Pediment Plains | 104 features | 46.63% | 🟢 Low / Normal Risk |

### 🛠️ Strategic Infrastructure Directives:
- **Critical Structural Bypasses:** The 41 features intersecting low-elevation basins display significant structural exposure. Mandate physical check-valve retrofits or emergency stormwater channel clearing.
- **Active Telemetry Overlay:** We suggest deploying real-time IoT water-level sensor nodes at the 12 features situated in proximity to old pipeline mains.
- **Land-Use Buffers:** Recommend establishing a strict 200-meter vegetation catchment zone surrounding the low-lying confluence clusters.`;
    }
    
    // 4. Default dynamic RAG summary when asking generally about the data
    if (q.includes("data") || q.includes("document") || q.includes("uploaded") || q.includes("file") || q.includes("tell me") || q.includes("analyze") || q.includes("summarize") || q.includes("rag")) {
      return `## 🧠 RETRIEVAL-AUGMENTED GENERATION (RAG): VECTOR INGESTION
      
The specialized RAG semantic processor has ingested the active custom GIS document **"${file.name}"** (${file.type} format, ${(file.size / 1024 / 1024).toFixed(2)} MB) and cross-referenced it with the **${cityName}** digital twin database.

### 📝 Synthesized Spatial Analytics Report:
- **Vector Embeddings Ingestion:** 100% indexed (223 semantic spatial chunks generated).
- **Core Density Clusters:** High coordinate density identified in the northeast municipal sector, along with a secondary linear cluster corresponding to primary transit routes.
- **Dynamic Risk Vulnerability:** **18.3% of coordinate points** display direct topographic overlap with designated high-risk environmental zones.
- **Calculated Grid Integrity Score:** **7.8 / 10** (Elevated Hazard Exposure).

### 💬 Recommended Spatial Queries:
Ask me any precise structural or geographical question about this custom dataset. Some examples to try:
- *"What are the schema fields of my uploaded data?"*
- *"How many features are in my custom document?"*
- *"Delineate flood risks for my uploaded layer"*`;
    }
  }

  // Mode-aware Welcome/Intro responses
  if (q.includes("hello") || q.includes("hi") || q === "hey" || q.includes("who are you")) {
    switch (mode) {
      case "traffic":
        return `### GeoAI Traffic Command Agent Active: ${cityName}
Geospatial link established. I am your Senior Traffic Congestion and Transit GIS Analyst for the ${cityName} road network.

How can I assist with your transit bottleneck assessments, travel time forecasts, or congestion mitigation strategies today?`;
      case "urban":
        return `### GeoAI Urban Planning Agent Active: ${cityName}
Geospatial link established. I am your Senior Urban Planner and Zoning Compliance Specialist for the ${cityName} digital twin.

How can I assist with your land-use zoning compliance, development permits, or civic infrastructure accessibility audits today?`;
      case "utility":
        return `### GeoAI Utility Grid Agent Active: ${cityName}
Geospatial link established. I am your Senior Infrastructure Reliability and Utility Operations Lead for the ${cityName} service grid.

How can I assist with your substation load analysis, water pipeline integrity telemetry, or power outage risk projections today?`;
      default:
        return `### GeoAI Hydrology Agent Active: ${cityName}
Geospatial link established. I am your specialized digital twin agent for the ${cityName} catchment.

How can I assist with your spatial queries, climatological models, or critical infrastructure vulnerability assessments today?`;
    }
  }

  // TRAFFIC CONGESTION MANAGEMENT MODE RESPONSES
  if (mode === "traffic") {
    if (q.includes("congestion") || q.includes("traffic") || q.includes("delay") || q.includes("analyze") || q.includes("risk")) {
      return `## Executive Traffic Congestion & Network Bottleneck Analysis: ${cityName}
      
Geospatial commuter telemetry models indicate severe level-of-service (LOS F) degradation within the ${cityName} arterial network during peak traffic periods. Integrating GPS fleet ping density with local signal timing parameters reveals major network bottlenecks.

### Critical Transit Corridors & Bottleneck Matrix
| Transit Corridor / Segment | Peak Congestion Index | Travel Time Penalty | Projected Delay Peak | Estimated Commuters Affected |
|:---|:---|:---|:---|:---|
| NH-48 Corridor (Alluvial Link) | Critical (9.4 / 10) | +38 mins | 08:30 - 09:30 | 52,937 daily commuters |
| Ring Road Junction | High (8.1 / 10) | +22 mins | 18:00 - 19:30 | 34,234 daily commuters |
| Old City Core (Market Street) | Moderate (6.2 / 10) | +15 mins | 12:30 - 14:00 | 19,647 daily commuters |
| North Highway Bypass | Low (2.3 / 10) | +4 mins | 17:30 - 18:30 | 48,122 daily commuters |

### Key Contributing Network Stress Factors
- Weave and Merge Conflicts: The major merge points on the NH-48 flyover ramp construct an active bottleneck due to sub-optimal merge lane lengths.
- Signal Desynchronization: Traffic signals at the Ring Road junction operate on fixed 120-second cycles, failing to adapt to peak asymmetric commuter flow rates.
- Curb-Space Friction: Old City core lanes suffer an effective capacity reduction of 35% due to unauthorized double-parking and active commercial loading zones.

### Recommended Mobility Interventions
- Implement Adaptive Traffic Control Systems (ATCS) using real-time loop detectors to dynamically optimize green splits.
- Delineate exclusive high-occupancy transit (HOT) lanes along the NH-48 corridor to encourage public bus systems.
- Retrofit 5 high-accident junctions with physical pedestrian bulb-outs to decrease collision frequency and improve flow continuity.`;
    }

    if (q.includes("accident") || q.includes("crash") || q.includes("hotspot") || q.includes("safety")) {
      return `## Road Safety & Accident Hotspot Audit: ${cityName} Network
      
A spatial collision clustering analysis for ${cityName} reveals significant safety exposure near major interchanges. Intersecting historical accident logs with speed telemetry and geometric intersection files highlights critical target corridors.

### Spatial Safety Exposure Metrics
| Incident Hotspot | Annual Collisions | Primary Collision Mode | Projected Risk Category | Contributing Factor |
|:---|:---|:---|:---|:---|
| Ring Road Interchange | 42 | Rear-end / Sideswipe | High | High speed differential at merge |
| NH-48 Ramp Terminal | 28 | Angle / Turning | High | Poor site distance, lack of signal protection |
| Old City Market Intersection | 19 | Pedestrian Conflicts | Medium | Absence of midblock refuge islands |
| University Bypass | 8 | Run-off-road | Low | Inadequate horizontal curve superelevation |

### Strategic Safety Countermeasures
- Install active radar-guided warning signs on NH-48 approach ramps to alert drivers of downstream speed drop.
- Implement high-visibility retroreflective striping and thermal crosswalk markings at all Old City intersections.
- Adjust signal phases to provide a 4-second leading pedestrian interval (LPI) at all active downtown crossings.`;
    }

    // Default traffic response
    return `### Traffic Intelligence Status: ${cityName} Network
Active traffic flow simulation models have processed your query for ${cityName}.

**Mobility Summary:**
- Active Network Coverage: 1,850 km of arterial and highway corridors.
- Overall Grid Health: Congestion index is currently at 6.4/10.
- Recommendation: Ask a specific mobility query (e.g. "Will there be traffic delays tomorrow?" or "Analyze traffic congestion") or toggle "Road Network" in map layers.`;
  }

  // URBAN DEVELOPMENT PLANNING MODE RESPONSES
  if (mode === "urban") {
    if (q.includes("zoning") || q.includes("permit") || q.includes("land") || q.includes("development") || q.includes("analyze") || q.includes("risk")) {
      return `## Land-Use Zoning & Urban Development Assessment: ${cityName}
      
Geospatial expansion models for ${cityName} indicate high rates of agricultural land conversion in peripheral corridors, alongside residential redevelopment pressure in the historic core. 

### Land-Use Zoning and Developer Activity Matrix
| Planning District / Sector | Dominant Zoning Use | Active Construction Permits | Impervious Surface Cover (%) | Open Space Compliance |
|:---|:---|:---|:---|:---|
| East Expansion Corridor | Residential (R-4) | 124 permits | 68% | Non-Compliant (12% actual vs 15% required) |
| Downtown Commercial | Commercial (C-3) | 48 permits | 94% | Compliant (5% public parks integrated) |
| South Industrial Belt | Light Industrial (I-1) | 12 permits | 75% | Non-Compliant (lack of vegetative buffer) |
| West Conservation Slope | Protected Reserve | 2 permits | 8% | Compliant (strict agricultural protection) |

### Key Urban Challenges Detected
- Stormwater Runoff Amplification: Continuous urban growth has pushed the average impervious surface coefficient to 72% in East expansion zones, causing local stormwater bypass.
- Civic Accessibility Deficit: 32% of newly permitted residential units in the East sector are situated beyond standard 15-minute walking buffers to public transit and healthcare centers.
- Heat Island Inception: Lack of structural green canopy in commercial sectors has elevated local ambient micro-temperatures by 4.2°C compared to surrounding regional baselines.

### Proposed Planning Solutions
- Update zoning ordinances to mandate structural green roofs on all commercial developments over 3 stories.
- Implement Transfer of Development Rights (TDR) to preserve historical structures in the downtown district.
- Establish a municipal transit-oriented development (TOD) boundary extending 500 meters from all active rail lines.`;
    }

    // Default urban response
    return `### Urban Intelligence Status: ${cityName} Digital Twin
Zoning compliance and development models are active for the ${cityName} planning jurisdiction.

**Zoning & Growth Summary:**
- Active Planning Area: 150 km² municipality under master plan mapping.
- Core Growth Vector: East and North-East development corridors.
- Recommendation: Ask a specific planning query (e.g. "What are the zoning conflicts?" or "Analyze urban development") or toggle "Land Use Zones" in the map layers.`;
  }

  // UTILITY INFRASTRUCTURE MONITORING RESPONSES
  if (mode === "utility") {
    if (q.includes("outage") || q.includes("grid") || q.includes("utility") || q.includes("pipeline") || q.includes("infrastructure") || q.includes("risk") || q.includes("analyze")) {
      return `## Critical Infrastructure Utility Network Assessment: ${cityName}
      
Geospatial asset management logs indicate localized vulnerabilities across the ${cityName} water distribution, power transmission, and telecom grids. Intersecting load telemetry with equipment age indexes highlights assets approaching failure thresholds.

### Critical Utility Asset Exposure Matrix
| Utility Sector / Asset | Load Stress Index | Physical Asset Integrity | Failure Risk Level | Estimated Households Affected |
|:---|:---|:---|:---|:---|
| Zone D Substation | 94% Capacity Peak | 68% (Equipment Age: 18 years) | Critical | 64,000 households |
| East Pipeline Mains | 88% Pressure Max | 62% (Pipeline Corrosion) | High | 48,000 households |
| Telecom Tower Hub North | 85% bandwidth | 92% (Modernized 2024) | Medium | 75,000 households |
| Western Reservoir Feed | 45% Flow Max | 98% (Excellent Redundancy) | Low | 15,000 households |

### Strategic Utility Network Deficiencies
- Substation Thermal Overload: High-density residential expansion in Zone D has elevated peak electric demand, placing transformer cores at structural thermal trip risk.
- Water Pipeline Corrosion: Legacy cast-iron pipe segments in the East sector (installed pre-1995) suffer from high oxidation rates, leading to micro-fissure pressure drops.
- Cellular Capacity Bottlenecks: Peak evening subscriber bandwidth demands at the North telecom hub cause localized data latency spikes due to optical backhaul constraints.

### Recommended System Improvements
- Execute immediate load-balancing routing to shift 15% demand from Zone D substation to surrounding nodes.
- Deploy smart acoustic leakage detectors along the East pipeline corridor to locate micro-fissures before catastrophic rupture.
- Fast-track fiber-optic network upgrade to the North telecom hub to scale dynamic cellular backhaul.`;
    }

    // Default utility response
    return `### Utility Infrastructure Status: ${cityName} Network
All utility telemetry models (Power, Water, Telecom) are active for the ${cityName} service grid.

**Infrastructure Summary:**
- Total Pipeline Grid: 850 km water mains.
- Transmission Network: 42 key power substations and 2,400 km grid lines.
- Recommendation: Ask a utility query (e.g. "What are the pipeline risks?" or "Assess utility infrastructure") or toggle "Power Grid" in map layers.`;
  }

  // FLOOD RISK ANALYSIS (DEFAULT / ORIGINAL MODE RESPONSES)
  // 1. Precise Conversational Queries (Yes/No + Small Reason)
  if (q.includes("rain") && (q.includes("tomorrow") || q.includes("next day") || q.includes("forecast"))) {
    return `### Precipitation Forecast: ${cityName}
Yes. 

**Hydro-Meteorological Reason:** Satellite telemetry indicates a 78% probability of precipitation tomorrow. An active convective storm system moving over the local catchment basin is projected to deliver 18-24mm of localized rainfall, primarily stressing the urban corridor during peak morning hours.`;
  }

  if (q.includes("flood") && (q.includes("tomorrow") || q.includes("next day") || q.includes("will it"))) {
    return `### Hydrological Risk Assessment: ${cityName}
No.

**Topographic Reason:** Hydrological models indicate that systemic inundation is not projected for tomorrow. Upstream reservoir discharge rates remain within safe baseline parameters (under 12,000 cusecs) and the current subsoil moisture saturation is at 62%, leaving adequate buffer capacity for projected runoff.`;
  }

  // 2. Comprehensive GIS / Environmental Queries
  if (q.includes("flood") && (q.includes("risk") || q.includes("analysis") || q.includes("analyze"))) {
    return `## Executive Hydrological Assessment: ${cityName} Catchment
    
Geospatial vulnerability models indicate critical drainage stress within the ${cityName} municipal boundaries. Combining Digital Elevation Models (DEM) with localized rainfall runoff coefficient variables (CN: Hydrologic Soil Group D), our spatial simulation has projected significant surface water accumulation profiles across key municipal zones.

### Spatial Vulnerability & Demographic Exposure Matrix
| Topographic Zone | Risk Classification | Vulnerability Index | Estimated Exposed Population |
|:---|:---|:---|:---|
| Lower Confluence Basin | Critical | 9.4 / 10 | 52,937 citizens |
| Low-Lying Catchment Basin | High Risk | 7.9 / 10 | 34,234 citizens |
| Urban Transit Corridor | Moderate Risk | 5.3 / 10 | 19,647 citizens |
| Elevated Pediment Plain | Low Risk | 2.1 / 10 | 48,122 citizens |

### Key Environmental Risk Factors
- Confluence Hydrodynamics: The intersection of primary waterways within the ${cityName} basin creates a natural hydraulic bottleneck during extreme weather events.
- Soil Compaction and Runoff: Highly dense urban development has increased the impervious surface ratio to 78%, dramatically accelerating peak hydrograph discharge times.
- Stormwater Channel Obsolescence: Legacy stormwater networks are sized for a historical 10-year flood event frequency, failing to accommodate modern 50-year frequency events.

### Recommended Engineering Adaptations
- Deploy immediate acoustic telemetry-based water level sensors at upstream river gauge stations.
- Retrofit low-lying drainage mains with high-capacity check valves to mitigate hydraulic backflow into residential basements.
- Delineate mandatory low-impact development (LID) buffer zones within 200 meters of the primary riverbanks.`;
  }

  if (q.includes("hospital") || q.includes("infrastructure") || q.includes("shelter")) {
    return `## Structural Vulnerability Assessment: ${cityName} Critical Infrastructure
    
A spatial intersection of critical utility nodes with our simulated 100-year flood inundation boundaries reveals severe vulnerabilities across municipal lifeline networks. Intercepting high-resolution geographic data layers with demographic density files highlights immediate retrofitting requirements.

### Lifeline Inundation Exposure
| Infrastructure System | Monitored Units | At-Risk Assets | Projected Systemic Outage (%) |
|:---|:---|:---|:---|
| Healthcare Facilities | 45 | 8 | 17.8% Inundation Potential |
| Educational Centers | 312 | 42 | 13.5% Disruption Profile |
| Emergency Services | 18 | 3 | 16.7% Access Loss |
| Power Substations | 6 | 1 | 16.7% Terminal Trip Risk |
| Hydro-Treatment Facilities | 12 | 4 | 33.3% System Contamination |
| Bridge & Highway Spans | 28 | 7 | 25.0% Structural Scour Risk |

### Analytical Findings
- Healthcare Access Loss: The 8 highly vulnerable hospitals serve an estimated catchment area of 120,000 residents, indicating a critical emergency surge capacity risk.
- Hydro-Treatment Contamination: 33.3% of municipal water treatment plants are situated in the alluvial plain, raising the probability of waterborne pathogen dispersal during inundation events.

### Strategic Structural Countermeasures
- Install rapid-assembly modular aluminum flood barriers at critical substation access portals.
- Relocate municipal critical command facilities to zones with an elevation of at least 35 meters above the local hydrological baseline.
- Deploy emergency satellite telemetry backhauls at all vulnerable hospitals to maintain essential data networks.`;
  }

  if (q.includes("rainfall") || q.includes("rain") || q.includes("weather")) {
    return `## Climatological Analysis & Precipitation Trends: ${cityName}
    
Analysis of regional hydro-meteorological records indicates a pronounced intensification of extreme precipitation events over the last two decades. The current monsoon cycle presents a severe deviation from the historical 30-year climate normal, indicating altered atmospheric moisture transport dynamics.

### Climatological Statistics
- Current Monsoon Cycle Deviation: +18.3% over the historical mean
- Monthly Precipitation Maximum: July — 245mm (normal: 200mm)
- Projected Annual Inflow Volume: 1,045mm
- Meteorological Anomaly: +142mm absolute anomaly detected

### Monthly Trend Breakdown
- January: 12mm
- February: 8mm
- March: 15mm
- April: 28mm
- May: 65mm
- June: 182mm
- July: 245mm
- August: 198mm
- September: 165mm
- October: 85mm
- November: 32mm
- December: 10mm

### Environmental Geo-Impacts
- Saturated Soil Profiles: Soil moisture content models suggest 92% saturation threshold completion by early July, leading to instantaneous surface runoff.
- Discharge Hydrographs: Peak urban storm runoff times have contracted by 35%, increasing flash flooding risks in low-lying transit channels.`;
  }

  if (q.includes("mitigation") || q.includes("strategy") || q.includes("recommend") || q.includes("suggest")) {
    return `## Strategic Disaster Mitigation Blueprint: ${cityName} Municipal Region
    
To build high-level climate resilience, we propose an integrated geo-structural and non-structural adaptation pathway. This phased framework leverages real-time spatial digital twins to minimize socioeconomic disruption and structural losses.

### Short-Term Response Actions (0-3 Months)
- IoT Telematic Array Deployment: Installing high-frequency ultrasonic river monitoring arrays along critical confluence points in ${cityName} to establish a 45-minute early warning threshold.
- Hydraulic De-silting Operations: Commencing emergency removal of alluvial silt deposits from critical urban river segments, expanding cross-sectional channel flow capacity by 25%.
- Emergency Safe-Zone Delineation: Activating 12 high-capacity emergency shelter structures outside the simulated inundation zones, equipped with autonomous solar grids.

### Mid-Term Structural Improvements (3-12 Months)
- Stormwater Network Expansion: Retrofitting central trunk mains to scale drainage flow rate capacities to accommodate peak flows of up to 150 cubic meters per second.
- Riparian Buffer Engineering: Re-vegetating 3.2 kilometers of critical riverbanks using deep-rooted native geofabrics to prevent bank collapse and erosion.
- Low-Impact Urban Design: Mandating permeable concrete paving layers in all newly constructed commercial plazas to facilitate direct subsoil infiltration.

### Long-Term Spatial Integration (1-5 Years)
- Real-Time Digital Twin Development: Integrating hydraulic sensors with real-time GIS layers to feed machine-learning models for predictive flash flood alerting.
- Catchment Basin Hydrological Management: Coordinating reservoir release cycles at upstream dams using meteorological satellite forecasting models to prevent peak flow synchronization.`;
  }

  // ============================================================
  // DYNAMIC CHATGPT-LIKE INTENT-DRIVEN NLP GENERATION FALLBACK
  // ============================================================
  const isShortRequested = q.includes("yes/no") || q.includes("yes or no") || q.includes("short") || q.includes("brief") || q.startsWith("will it") || q.startsWith("is there") || q.startsWith("does ") || q.startsWith("can ");
  const isLongRequested = q.includes("long") || q.includes("detailed") || q.includes("report") || q.includes("analysis") || q.includes("analyze") || q.includes("table") || q.includes("explain") || q.includes("strategy");

  // Determine key topics in user's query
  const topics: string[] = [];
  if (q.includes("rain") || q.includes("weather") || q.includes("storm") || q.includes("monsoon") || q.includes("cloud")) topics.push("Meteorology");
  if (q.includes("flood") || q.includes("water") || q.includes("river") || q.includes("basin") || q.includes("sea")) topics.push("Hydrology");
  if (q.includes("traffic") || q.includes("road") || q.includes("car") || q.includes("highway") || q.includes("transit") || q.includes("jam")) topics.push("Transit Operations");
  if (q.includes("zone") || q.includes("zoning") || q.includes("building") || q.includes("house") || q.includes("permit") || q.includes("urban") || q.includes("city")) topics.push("Urban Planning");
  if (q.includes("power") || q.includes("grid") || q.includes("utility") || q.includes("pipe") || q.includes("electricity") || q.includes("network") || q.includes("outage") || q.includes("telecom")) topics.push("Infrastructure Systems");
  
  if (topics.length === 0) {
    topics.push(mode === "flood" ? "Hydrology" : mode === "traffic" ? "Transit Operations" : mode === "urban" ? "Urban Planning" : "Infrastructure Systems");
  }

  // 1. DYNAMIC YES/NO OR SHORT ANSWER RESPONSE
  if (isShortRequested && !isLongRequested) {
    const isAffirmative = Math.sin(query.length + 42) > 0.0; // deterministic pseudo-random yes/no
    const prefix = isAffirmative ? "Yes." : "No.";
    
    let reason = "";
    if (mode === "flood") {
      reason = isAffirmative 
        ? "Hydro-Meteorological analysis indicates precipitation levels exceeding the 78% regional threshold, pushing river flow gauges toward a +1.4m rise."
        : "Hydrological runoff models confirm that regional soil infiltration capacity is at an optimal 68% with upstream reservoir release channels fully cleared.";
    } else if (mode === "traffic") {
      reason = isAffirmative
        ? "Transit telematic overlays indicate a high vehicle density peak approaching major arterial intersections, elevating congestion indices to 8.4/10."
        : "Dynamic network speed telemetry shows vehicles maintaining average speeds of 38 km/h with no active structural blockages along primary bypass routes.";
    } else if (mode === "urban") {
      reason = isAffirmative
        ? "Zoning compliance audits indicate a surge in developer permit queries along eastern districts, violating the recommended 15% open space buffer."
        : "Land-use overlays verify that the selected sector remains strictly aligned with municipal conservation and transit-oriented guidelines.";
    } else {
      reason = isAffirmative
        ? "Substation grid telemetry shows peak thermal load climbing to 91% capacity during evening residential cycles, indicating load shed risk."
        : "Utility monitoring logs confirm 100% telemetry connection uptime with pipeline pressure indicators operating within standard safety boundaries.";
    }

    return `### GeoAI Dynamic Diagnostic: ${cityName} (${topics[0]})
**${prefix}**

**Scientific Justification:** ${reason}`;
  }

  // 2. DYNAMIC COMPREHENSIVE RESEARCH-GRADE ANSWER (Default / Long)
  const score = Math.round((6.8 + Math.sin(query.length) * 2.5) * 10) / 10;
  const level = score > 8.5 ? "🔴 Critical" : score > 6.5 ? "🔴 High" : score > 4.0 ? "🟡 Medium" : "🟢 Low";
  const userTopic = topics.join(" and ");

  return `## GeoAI Multi-Dimensional Analysis Report: ${cityName}
  
Our spatial digital twin processing engine has completed a diagnostic evaluation of your query regarding **"${query}"** inside the **${cityName}** study catchment.

### Analytical Metadata Summary
- **Primary Domain:** ${userTopic}
- **Assessed Operational Score:** ${score}/10.0
- **Operational Risk Classification:** ${level}
- **Spatial Coverage Area:** 150 km² Municipal Basin
- **Processing Time:** ${(0.4 + Math.random() * 0.8).toFixed(2)} seconds

### Diagnostic Matrix & Parameter Distribution
| Spatial Parameter | Monitored Units | Measured Capacity / Load | Safety Threshold Compliance | Systemic Risk Vector |
|:---|:---|:---|:---|:---|
| Primary Domain Asset | 245 Monitored Grid Nodes | ${Math.round(score * 10)}% Active Strain | 85% Maximum Design limit | Elevated stress during peak cycles |
| Infiltration / Network Flow | Class D Impervious Soil | 72% Surface Runoff Coeff. | Non-Compliant (High Friction) | Runoff bypass under heavy precipitation |
| Infrastructure Accessibility | 45 Hospitals & 312 Schools | 12 Facilities Exposed | Compliant (Buffered Zone) | Localized auxiliary transit delays |
| Emergency Command Reserve | 18 Command Center Nodes | 98% Backup Redundancy | Fully Compliant | Secure operations assured |

### Key Environmental & Infrastructure Challenges
1. **Asymmetric Resource Demands:** Localized expansion patterns show high developer and infrastructure pressure points, exceeding standard demographic capacity estimates.
2. **Telemetry Friction:** High spatial density at historical intersections generates structural delays, reducing resource routing efficiency by 24%.
3. **Climatological Anomaly Sensitivity:** The regional study sector displays high vulnerability to micro-climate variations and sudden precipitation events due to structural soil compaction.

### Phased Strategic Recommendations
*   **Immediate Action (0-3 Months):** Deploy IoT real-time telematic sensors in high-density corridors to establish a 45-minute preventative warning threshold.
*   **Short-Term Adaptation (3-12 Months):** Execute localized load-balancing and demand-routing bypasses to relieve strain on overloaded physical grid substations and transit intersections.
*   **Long-Term Integration (1-5 Years):** Fully synchronize hydraulic and transit models within the digital twin framework to run continuous predictive ML diagnostic models.`;
}
