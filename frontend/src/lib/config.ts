// GeoNarrative AI — Configuration

export const config = {
  mapbox: {
    accessToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "",
    defaultCenter: [73.8567, 18.5204] as [number, number], // Pune, India
    defaultZoom: 11,
    style: "mapbox://styles/mapbox/dark-v11",
  },
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
    geminiKey: process.env.NEXT_PUBLIC_GEMINI_KEY || "",
    weatherKey: process.env.NEXT_PUBLIC_WEATHER_KEY || "",
  },
  app: {
    name: "GeoNarrative AI",
    tagline: "Conversational GeoAI Digital Twin Platform",
    version: "1.0.0",
  },
};

export const MAP_STYLES = {
  dark: "mapbox://styles/mapbox/dark-v11",
  satellite: "mapbox://styles/mapbox/satellite-streets-v12",
  light: "mapbox://styles/mapbox/light-v11",
  streets: "mapbox://styles/mapbox/streets-v12",
  outdoors: "mapbox://styles/mapbox/outdoors-v12",
};

export const RISK_COLORS = {
  low: "#10b981",
  medium: "#f59e0b",
  high: "#ef4444",
  critical: "#dc2626",
};

export const CHART_COLORS = [
  "#6366f1",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
];
