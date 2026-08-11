import { create } from "zustand";
import { apiService } from "@/services/apiService";

export type ScenarioType = "normal" | "moderate" | "heavy" | "extreme";

export interface ScenarioMetrics {
  flooded_area_km2: number;
  area_percentage: number;
  affected_buildings: number;
  critical_buildings: number;
  affected_road_km: number;
  rainfall_mm_h: string;
  representative_depth_m: number;
  risk_level: string;
}

interface DashboardState {
  activeScenario: ScenarioType;
  simulationProgress: number;
  isSimulating: boolean;
  
  // Audited Real Metrics Table
  scenariosData: Record<ScenarioType, ScenarioMetrics>;
  overviewData: {
    study_area_name: string;
    study_area_km2: number;
    permanent_river_area_km2: number;
    total_buildings: number;
    total_road_network_km: number;
    dem_resolution_m: number;
  };
  susceptibilityData: Array<{ name: string; percentage: number; area_km2: number; color: string }>;
  hotspotData: {
    grid_cell_id: string;
    locality_context: string;
    projected_flood_expansion_km2: number;
    affected_buildings: number;
    road_exposure_km: number;
  };

  // Actions
  setActiveScenario: (scenario: ScenarioType) => void;
  setSimulationProgress: (progress: number) => void;
  toggleSimulation: () => void;
  fetchDashboardTelemetry: () => Promise<void>;
}

const DEFAULT_SCENARIOS: Record<ScenarioType, ScenarioMetrics> = {
  normal: {
    flooded_area_km2: 53.60,
    area_percentage: 16.2,
    affected_buildings: 11262,
    critical_buildings: 8808,
    affected_road_km: 751.2,
    rainfall_mm_h: "35 mm/h (20–50 mm)",
    representative_depth_m: 0.45,
    risk_level: "LOW"
  },
  moderate: {
    flooded_area_km2: 70.01,
    area_percentage: 21.1,
    affected_buildings: 15903,
    critical_buildings: 12154,
    affected_road_km: 981.1,
    rainfall_mm_h: "65 mm/h (50–80 mm)",
    representative_depth_m: 0.85,
    risk_level: "MODERATE"
  },
  heavy: {
    flooded_area_km2: 89.72,
    area_percentage: 27.1,
    affected_buildings: 24210,
    critical_buildings: 18618,
    affected_road_km: 1257.4,
    rainfall_mm_h: "95 mm/h (80–120 mm)",
    representative_depth_m: 1.65,
    risk_level: "HIGH"
  },
  extreme: {
    flooded_area_km2: 133.97,
    area_percentage: 40.4,
    affected_buildings: 40723,
    critical_buildings: 32084,
    affected_road_km: 1877.5,
    rainfall_mm_h: "140 mm/h (>120 mm)",
    representative_depth_m: 2.85,
    risk_level: "CRITICAL"
  }
};

export const useDashboardStore = create<DashboardState>((set, get) => ({
  activeScenario: "heavy",
  simulationProgress: 65,
  isSimulating: false,

  scenariosData: DEFAULT_SCENARIOS,
  overviewData: {
    study_area_name: "Pune Municipal Corporation (PMC)",
    study_area_km2: 331.45,
    permanent_river_area_km2: 18.56,
    total_buildings: 339732,
    total_road_network_km: 2350.5,
    dem_resolution_m: 30
  },
  susceptibilityData: [
    { name: "Very Low", percentage: 19.5, area_km2: 64.63, color: "#22c55e" },
    { name: "Low", percentage: 20.7, area_km2: 68.61, color: "#84cc16" },
    { name: "Moderate", percentage: 21.4, area_km2: 70.93, color: "#eab308" },
    { name: "High", percentage: 21.2, area_km2: 70.27, color: "#f97316" },
    { name: "Very High", percentage: 17.2, area_km2: 57.01, color: "#ef4444" }
  ],
  hotspotData: {
    grid_cell_id: "Grid N43-PMC-08",
    locality_context: "Mula-Mutha Confluence Basin",
    projected_flood_expansion_km2: 4.82,
    affected_buildings: 3420,
    road_exposure_km: 42.6
  },

  setActiveScenario: (scenario) => set({ activeScenario: scenario }),
  setSimulationProgress: (progress) => set({ simulationProgress: Math.max(0, min_clamp(progress, 100)) }),
  toggleSimulation: () => set((state) => ({ isSimulating: !state.isSimulating })),

  fetchDashboardTelemetry: async () => {
    try {
      const scenRes = await apiService.getAnalyticsScenarios();
      if (scenRes?.data?.scenarios) {
        const remote = scenRes.data.scenarios;
        set((prev) => ({
          scenariosData: {
            normal: { ...prev.scenariosData.normal, ...remote.normal, representative_depth_m: 0.45, risk_level: "LOW" },
            moderate: { ...prev.scenariosData.moderate, ...remote.moderate, representative_depth_m: 0.85, risk_level: "MODERATE" },
            heavy: { ...prev.scenariosData.heavy, ...remote.heavy, representative_depth_m: 1.65, risk_level: "HIGH" },
            extreme: { ...prev.scenariosData.extreme, ...remote.extreme, representative_depth_m: 2.85, risk_level: "CRITICAL" }
          }
        }));
      }

      const hotRes = await apiService.getPredictionHotspots();
      if (hotRes?.data?.hotspots && hotRes.data.hotspots.length > 0) {
        set({ hotspotData: hotRes.data.hotspots[0] });
      }
    } catch (err) {
      console.warn("Using verified project baseline telemetry for Command Dashboard:", err);
    }
  }
}));

function min_clamp(val: number, max: number): number {
  return val > max ? max : val;
}
