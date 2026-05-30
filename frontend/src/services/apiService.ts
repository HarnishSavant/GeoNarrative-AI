import { config } from "@/lib/config";
import { GeoJSON, MapLayer, UploadedFile, DashboardMode, ChatMessage } from "@/lib/types";

const BASE_URL = config.api.baseUrl || "http://localhost:8000";

export interface PredictionParams {
  rainfall: number;
  elevation: number;
  land_use: string;
  water_bodies: number;
  population_density: number;
  drainage_capacity: number;
  location?: string;
}

export const apiService = {
  /**
   * Geocode a location or query location search on the backend
   */
  async searchLocations(query: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/v1/locations/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error("Failed to search locations");
    return res.json();
  },

  /**
   * Upload spatial GIS data (GeoJSON, Shapefile, CSV) to the backend
   */
  async uploadFile(file: File): Promise<any> {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${BASE_URL}/api/v1/upload`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("Failed to upload spatial file");
    return res.json();
  },

  /**
   * Get location analytics trends and charts
   */
  async getAnalytics(location: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/v1/analytics?location=${encodeURIComponent(location)}`);
    if (!res.ok) throw new Error("Failed to fetch analytics");
    return res.json();
  },

  /**
   * Get real-time metric KPIs for a location and active mode
   */
  async getKPIs(location: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/v1/analytics/kpi?location=${encodeURIComponent(location)}`);
    if (!res.ok) throw new Error("Failed to fetch KPIs");
    return res.json();
  },

  /**
   * Get low-lying risk flood zones
   */
  async getFloodZones(location: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/v1/flood/zones?location=${encodeURIComponent(location)}`);
    if (!res.ok) throw new Error("Failed to fetch flood zones");
    return res.json();
  },

  /**
   * Fetch standard map layer configurations
   */
  async getMapLayers(): Promise<{ layers: MapLayer[] }> {
    const res = await fetch(`${BASE_URL}/api/v1/map/layers`);
    if (!res.ok) throw new Error("Failed to fetch map layers");
    return res.json();
  },

  /**
   * Generate GeoJSON points dynamically around coordinates
   */
  async getGeoJSON(
    centerLng: number,
    centerLat: number,
    layer: string = "risk-points",
    count: number = 100
  ): Promise<GeoJSON> {
    const res = await fetch(
      `${BASE_URL}/api/v1/map/geojson?center_lng=${centerLng}&center_lat=${centerLat}&layer=${layer}&count=${count}`
    );
    if (!res.ok) throw new Error("Failed to fetch map layers GeoJSON");
    return res.json();
  },

  /**
   * Send natural language chat prompt to backend AI assistant
   */
  async sendChatMessage(message: string, location?: string, context?: any[]): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/v1/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, location, context }),
    });
    if (!res.ok) throw new Error("Failed to send message to AI");
    return res.json();
  },

  /**
   * Run ML risk calculation model
   */
  async runMLPrediction(params: PredictionParams): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/v1/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error("Failed to run prediction");
    return res.json();
  },

  /**
   * Generate an executive risk assessment report
   */
  async generateReport(location: string, reportType: string = "comprehensive"): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/v1/reports/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ location, report_type: reportType }),
    });
    if (!res.ok) throw new Error("Failed to generate report");
    return res.json();
  },

  /**
   * Fetch current and forecast weather data with flood risk metrics
   */
  async getLiveWeather(lat: number, lon: number, location: string): Promise<any> {
    const res = await fetch(
      `${BASE_URL}/api/v1/weather?lat=${lat}&lon=${lon}&location=${encodeURIComponent(location)}`
    );
    if (!res.ok) throw new Error("Failed to fetch live weather telemetry");
    return res.json();
  },
};
