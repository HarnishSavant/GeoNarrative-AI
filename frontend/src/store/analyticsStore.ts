import { create } from 'zustand';

// Synthetic fallback data removed for research integrity

interface AnalyticsState {
  riskSummary: any[];
  exposureSummary: any[];
  criticalInfrastructure: any[];
  shelterRecommendations: any[];
  isLoading: boolean;
  isError: boolean;
  errorMessage: string | null;
  lastFetched: number | null;
  usingFallback: boolean;
  fetchAnalytics: () => Promise<void>;
  clearAnalytics: () => void;
}

export const useAnalyticsStore = create<AnalyticsState>((set, get) => ({
  riskSummary: [],
  exposureSummary: [],
  criticalInfrastructure: [],
  shelterRecommendations: [],
  isLoading: false,
  isError: false,
  errorMessage: null,
  lastFetched: null,
  usingFallback: false,

  fetchAnalytics: async () => {
    const now = Date.now();
    const { lastFetched, isLoading } = get();
    if (isLoading) return;
    if (lastFetched && (now - lastFetched) < 5 * 60 * 1000) return;

    set({ isLoading: true, isError: false, errorMessage: null });
    
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const token = typeof window !== "undefined" ? localStorage.getItem("geonarrative_token") : null;
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const [riskRes, expRes, critRes, shelterRes] = await Promise.all([
        fetch(`${baseUrl}/api/v1/analytics/risk-summary`, { headers, signal: controller.signal }),
        fetch(`${baseUrl}/api/v1/analytics/exposure-summary`, { headers, signal: controller.signal }),
        fetch(`${baseUrl}/api/v1/analytics/critical-infrastructure`, { headers, signal: controller.signal }),
        fetch(`${baseUrl}/api/v1/analytics/shelter-recommendations`, { headers, signal: controller.signal }),
      ]);
      clearTimeout(timeout);

      if (riskRes.ok && expRes.ok && critRes.ok && shelterRes.ok) {
        const [risk, exp, crit, shelter] = await Promise.all([
          riskRes.json(), expRes.json(), critRes.json(), shelterRes.json(),
        ]);
        set({
          riskSummary: risk.data || [],
          exposureSummary: exp.data || [],
          criticalInfrastructure: crit.data || [],
          shelterRecommendations: shelter.data || [],
          lastFetched: Date.now(),
          usingFallback: false,
          isLoading: false
        });
      } else {
        set({ isError: true, errorMessage: "Failed to load complete analytics suite", isLoading: false, lastFetched: Date.now() });
      }
    } catch (error) {
      console.warn("Analytics backend unavailable:", error);
      set({ isError: true, errorMessage: "Backend API unavailable.", isLoading: false, lastFetched: Date.now() });
    }
  },

  clearAnalytics: () => set({
    riskSummary: [],
    exposureSummary: [],
    criticalInfrastructure: [],
    shelterRecommendations: [],
    lastFetched: null,
    isError: false,
    errorMessage: null,
    usingFallback: false,
  }),
}));
