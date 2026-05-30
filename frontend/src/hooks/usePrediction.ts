import { useState, useCallback } from "react";
import { DashboardMode } from "@/lib/types";

export interface PredictionResult {
  overallRisk: "low" | "medium" | "high" | "critical";
  score: number;
  factors: { name: string; value: number; weight: number; impact: string }[];
  recommendations: string[];
}

export function usePrediction(initialMode: DashboardMode = "flood") {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  
  const [parameters, setParameters] = useState<Record<string, any>>({
    rainfall: 245,
    elevation: 540,
    landUse: "urban",
    waterBodies: 23,
    populationDensity: 9500,
    drainageCapacity: 60,
    // Traffic
    peakVolume: 8500,
    capacityRatio: 0.85,
    signalTiming: 120,
    construction: 8,
    transitFrequency: 15,
    weatherImpact: 45,
    // Urban
    popGrowth: 3.4,
    landAvail: 38,
    infraCapacity: 72,
    zoningCompliance: 88,
    greenSpace: 18,
    activePermits: 247,
    // Utility
    equipAge: 14,
    loadStress: 88,
    maintBacklog: 18,
    vulnerability: 55,
    redundancy: 62,
    substationCapacity: 940,
  });

  const handleParamChange = useCallback((id: string, value: any) => {
    setParameters((prev) => ({ ...prev, [id]: value }));
  }, []);

  const runPrediction = useCallback(async (mode: DashboardMode) => {
    setIsRunning(true);
    setResult(null);

    // Simulate multi-step async analysis
    await new Promise((resolve) => setTimeout(resolve, 2800));

    let score = 5.0;
    let riskLevel: "low" | "medium" | "high" | "critical" = "medium";
    let factorsList: { name: string; value: number; weight: number; impact: string }[] = [];
    let recsList: string[] = [];

    if (mode === "flood") {
      const rain = Number(parameters.rainfall);
      const elev = Number(parameters.elevation);
      const drainage = Number(parameters.drainageCapacity);
      const density = Number(parameters.populationDensity);

      // Normalization scoring
      const rainFactor = Math.min(rain / 300, 1.0) * 0.30;
      const elevFactor = Math.max(1 - elev / 1000, 0) * 0.25;
      const landUseScores: Record<string, number> = { urban: 0.8, suburban: 0.5, rural: 0.3, forest: 0.1 };
      const landFactor = (landUseScores[parameters.landUse] || 0.5) * 0.20;
      const drainageFactor = Math.max(1 - drainage / 100, 0) * 0.15;
      const densityFactor = Math.min(density / 15000, 1.0) * 0.10;

      score = (rainFactor + elevFactor + landFactor + drainageFactor + densityFactor) * 10;
      score = parseFloat(Math.min(Math.max(score + (Math.random() - 0.5), 0), 10).toFixed(1));

      riskLevel = score > 8.5 ? "critical" : score > 6.5 ? "high" : score > 4.0 ? "medium" : "low";

      factorsList = [
        { name: "Rainfall Intensity", value: Math.round((rainFactor / 0.30) * 100), weight: 0.30, impact: rainFactor > 0.2 ? "High" : "Medium" },
        { name: "Elevation Profile", value: Math.round((elevFactor / 0.25) * 100), weight: 0.25, impact: elevFactor > 0.15 ? "High" : "Medium" },
        { name: "Land Use Pattern", value: Math.round((landFactor / 0.20) * 100), weight: 0.20, impact: landFactor > 0.12 ? "High" : "Medium" },
        { name: "Drainage Capacity", value: Math.round((drainageFactor / 0.15) * 100), weight: 0.15, impact: drainageFactor > 0.10 ? "Critical" : "Medium" },
        { name: "Population Density", value: Math.round((densityFactor / 0.10) * 100), weight: 0.10, impact: "Medium" }
      ];

      recsList = [
        "Deploy flood barriers in high-risk zones",
        "Activate emergency drainage pumps",
        "Alert residents in high-risk zones",
        "Pre-position emergency response teams",
        "Coordinate with upstream water management"
      ];
    } else if (mode === "traffic") {
      const volume = Number(parameters.peakVolume);
      const ratio = Number(parameters.capacityRatio);
      const signal = Number(parameters.signalTiming);

      score = ((volume / 12000) * 0.4 + ratio * 0.4 + (Math.max(0, 150 - signal) / 150) * 0.2) * 10;
      score = parseFloat(Math.min(Math.max(score + (Math.random() - 0.5), 0), 10).toFixed(1));
      riskLevel = score > 8.0 ? "critical" : score > 6.0 ? "high" : score > 3.5 ? "medium" : "low";

      factorsList = [
        { name: "Peak Volume Flow", value: Math.round((volume / 12000) * 100), weight: 0.4, impact: volume > 9000 ? "High" : "Medium" },
        { name: "Capacity Utilization", value: Math.round(ratio * 100), weight: 0.4, impact: ratio > 0.8 ? "Critical" : "Medium" },
        { name: "Signal Synchronization", value: Math.round((Math.max(0, 150 - signal) / 150) * 100), weight: 0.2, impact: "Medium" }
      ];

      recsList = [
        "Dynamically adjust traffic light phases in Sector B",
        "Activate variable message signs (VMS) for detours",
        "Dispatch emergency traffic control units",
        "Enable auxiliary lanes during peak hours"
      ];
    } else if (mode === "urban") {
      const growth = Number(parameters.popGrowth);
      const land = Number(parameters.landAvail);
      const infra = Number(parameters.infraCapacity);

      score = ((growth / 5) * 0.4 + (Math.max(0, 100 - land) / 100) * 0.3 + (Math.max(0, 100 - infra) / 100) * 0.3) * 10;
      score = parseFloat(Math.min(Math.max(score + (Math.random() - 0.5), 0), 10).toFixed(1));
      riskLevel = score > 8.0 ? "critical" : score > 6.0 ? "high" : score > 4.0 ? "medium" : "low";

      factorsList = [
        { name: "Population Growth Rate", value: Math.round((growth / 5) * 100), weight: 0.4, impact: growth > 3.0 ? "High" : "Medium" },
        { name: "Zoning / Land Scarcity", value: Math.round((Math.max(0, 100 - land) / 100) * 100), weight: 0.3, impact: land < 30 ? "High" : "Medium" },
        { name: "Infrastructure Load Stress", value: Math.round((Math.max(0, 100 - infra) / 100) * 100), weight: 0.3, impact: infra < 70 ? "Critical" : "Medium" }
      ];

      recsList = [
        "Instate zoning restrictions in green belt sectors",
        "Incorporate strict runoff limits for permit approval",
        "Fund municipal utility expansions in Sector C",
        "Increase mandatory urban canopy ratio to 25%"
      ];
    } else if (mode === "utility") {
      const age = Number(parameters.equipAge);
      const stress = Number(parameters.loadStress);
      const maintain = Number(parameters.maintBacklog);

      score = ((age / 30) * 0.3 + (stress / 100) * 0.4 + (maintain / 30) * 0.3) * 10;
      score = parseFloat(Math.min(Math.max(score + (Math.random() - 0.5), 0), 10).toFixed(1));
      riskLevel = score > 8.5 ? "critical" : score > 6.5 ? "high" : score > 4.5 ? "medium" : "low";

      factorsList = [
        { name: "Equipment Wear Age", value: Math.round((age / 30) * 100), weight: 0.3, impact: age > 15 ? "High" : "Medium" },
        { name: "Power Load stress", value: Math.round((stress / 100) * 100), weight: 0.4, impact: stress > 80 ? "Critical" : "Medium" },
        { name: "Maintenance Backlog", value: Math.round((maintain / 30) * 100), weight: 0.3, impact: maintain > 15 ? "High" : "Medium" }
      ];

      recsList = [
        "Initiate power grid load shedding in sectors B3 and B4",
        "Deploy emergency maintenance engineers to Substation 4",
        "Reprioritize transformer replacements",
        "Implement dual-redundancy loops for critical grids"
      ];
    }

    setResult({
      overallRisk: riskLevel,
      score: score,
      factors: factorsList,
      recommendations: recsList
    });
    setIsRunning(false);
  }, [parameters]);

  const clearPrediction = useCallback(() => {
    setResult(null);
  }, []);

  return {
    isRunning,
    result,
    parameters,
    handleParamChange,
    runPrediction,
    clearPrediction
  };
}
