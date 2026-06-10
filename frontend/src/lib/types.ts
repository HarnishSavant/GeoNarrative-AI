// GeoNarrative AI — Type Definitions

export interface Location {
  lat: number;
  lng: number;
  name: string;
  country?: string;
  state?: string;
}

export interface GeoFeature {
  type: "Feature";
  geometry: {
    type: string;
    coordinates: number[] | number[][] | number[][][];
  };
  properties: Record<string, unknown>;
}

export interface GeoJSON {
  type: "FeatureCollection";
  features: GeoFeature[];
}

export interface FloodRisk {
  zone: string;
  level: "low" | "medium" | "high" | "critical";
  score: number;
  area: number;
  population: number;
  description: string;
}

export interface KPIData {
  id: string;
  title: string;
  value: string | number;
  change: number;
  changeLabel: string;
  icon: string;
  color: string;
  gradient: [string, string];
}

export interface AnalyticsData {
  rainfall: { month: string; value: number; avg: number }[];
  elevation: { zone: string; min: number; max: number; avg: number }[];
  riskDistribution: { name: string; value: number; color: string }[];
  populationDensity: { area: string; density: number; risk: string }[];
  infrastructure: { type: string; count: number; atRisk: number }[];
  timeSeriesRisk: { date: string; [key: string]: string | number }[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  metadata?: {
    mapAction?: string;
    dataPoints?: number;
    sources?: string[];
    agent_trace?: {
      user_query: string;
      detected_intent: string;
      selected_tool: string;
      spatial_operation: string;
      parameters: Record<string, any>;
      records_found: number;
      map_action: string;
      report_action: string;
      processing_time: number;
    };
  };
}

export interface MapLayer {
  id: string;
  name: string;
  type: "fill" | "line" | "circle" | "heatmap" | "symbol";
  visible: boolean;
  color: string;
  icon: string;
  description: string;
}

export interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: Date;
  features?: number;
  geojson?: GeoJSON;
}

export interface Report {
  id: string;
  title: string;
  location: string;
  generatedAt: Date;
  sections: ReportSection[];
  riskLevel: "low" | "medium" | "high" | "critical";
}

export interface ReportSection {
  title: string;
  content: string;
  type: "text" | "chart" | "map" | "table";
  data?: unknown;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  timestamp: Date;
  read: boolean;
}

export type DashboardMode = "flood" | "traffic" | "urban" | "utility";

export type SidebarTab =
  | "dashboard"
  | "map"
  | "upload"
  | "chat"
  | "analytics"
  | "reports"
  | "prediction"
  | "settings"
  | "profile"
  | "admin";
