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
  domain?: string;
}

function parseErrorDetail(err: any, fallback: string): string {
  if (!err) return fallback;
  const detail = err.detail;
  if (!detail) return fallback;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail.map((d: any) => `${d.loc ? d.loc.join(".") + ": " : ""}${d.msg}`).join("; ");
  }
  if (typeof detail === "object") {
    return detail.message || JSON.stringify(detail);
  }
  return fallback;
}

export const apiService = {
  /**
   * Geocode a location or query location search on the backend
   */
  async searchLocations(query: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/v1/locations/search?q=${encodeURIComponent(query)}`, {
      headers: this.getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to search locations");
    return res.json();
  },

  /**
   * Upload spatial GIS data (GeoJSON, Shapefile, CSV) to the backend
   */
  async uploadFile(file: File): Promise<any> {
    const formData = new FormData();
    formData.append("file", file);
    const token = typeof window !== "undefined" ? localStorage.getItem("geonarrative_token") : null;

    const res = await fetch(`${BASE_URL}/api/v1/upload`, {
      method: "POST",
      headers: {
        ...(token ? { "Authorization": `Bearer ${token}` } : {})
      },
      body: formData,
    });
    if (!res.ok) throw new Error("Failed to upload spatial file");
    return res.json();
  },

  /**
   * Get total hexagon counts grouped by Risk Class (Jenks)
   */
  async getRiskSummary(): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/v1/analytics/risk-summary`, {
      headers: this.getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch risk summary");
    return res.json();
  },

  /**
   * Get exact counts of Buildings, Roads, POIs intersecting High/Very High flood zones
   */
  async getExposureSummary(): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/v1/analytics/exposure-summary`, {
      headers: this.getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch exposure summary");
    return res.json();
  },

  /**
   * Get high-risk POIs (Hospitals, Schools)
   */
  async getCriticalInfrastructure(): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/v1/analytics/critical-infrastructure`, {
      headers: this.getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch critical infrastructure");
    return res.json();
  },

  /**
   * Get emergency planning safe assembly points
   */
  async getShelterRecommendations(): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/v1/analytics/shelter-recommendations`, {
      headers: this.getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch shelter recommendations");
    return res.json();
  },

  // ═════════════════════════════════════════════════════════════════════════
  // PHASE 7 RESEARCH-GRADE SPATIAL ANALYTICS SERVICE CALLS
  // ═════════════════════════════════════════════════════════════════════════
  async getAnalyticsOverview(): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/v1/analytics/overview`, { headers: this.getAuthHeaders() });
    if (!res.ok) throw new Error("Failed to fetch analytics overview");
    return res.json();
  },

  async getAnalyticsSusceptibility(): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/v1/analytics/susceptibility`, { headers: this.getAuthHeaders() });
    if (!res.ok) throw new Error("Failed to fetch susceptibility analytics");
    return res.json();
  },

  async getAnalyticsTerrain(): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/v1/analytics/terrain`, { headers: this.getAuthHeaders() });
    if (!res.ok) throw new Error("Failed to fetch terrain analytics");
    return res.json();
  },

  async getAnalyticsLulc(): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/v1/analytics/lulc`, { headers: this.getAuthHeaders() });
    if (!res.ok) throw new Error("Failed to fetch LULC analytics");
    return res.json();
  },

  async getAnalyticsScenarios(): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/v1/analytics/scenarios`, { headers: this.getAuthHeaders() });
    if (!res.ok) throw new Error("Failed to fetch scenarios comparison");
    return res.json();
  },

  async getAnalyticsScenarioTimeline(scenarioId: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/v1/analytics/scenarios/${encodeURIComponent(scenarioId)}/timeline`, { headers: this.getAuthHeaders() });
    if (!res.ok) throw new Error("Failed to fetch scenario timeline");
    return res.json();
  },

  async getAnalyticsScenarioExposure(scenarioId: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/v1/analytics/scenarios/${encodeURIComponent(scenarioId)}/exposure`, { headers: this.getAuthHeaders() });
    if (!res.ok) throw new Error("Failed to fetch scenario exposure");
    return res.json();
  },

  // ─── Phase 8: Predictive Spatial Intelligence Endpoints ───
  async getPredictionScenarios(): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/v1/prediction/scenarios`, { headers: this.getAuthHeaders() });
    if (!res.ok) throw new Error("Failed to fetch predictive scenario escalation definitions");
    return res.json();
  },

  async getPredictionProgress(scenario: string, progress: number): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/v1/prediction/scenario/${encodeURIComponent(scenario)}/progress/${progress}`, { headers: this.getAuthHeaders() });
    if (!res.ok) throw new Error("Failed to fetch prediction progress metrics");
    return res.json();
  },

  async getPredictionCompare(baseline: string, target: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/v1/prediction/compare?baseline=${encodeURIComponent(baseline)}&target=${encodeURIComponent(target)}`, { headers: this.getAuthHeaders() });
    if (!res.ok) throw new Error("Failed to compare scenarios");
    return res.json();
  },

  async getPredictionHotspots(): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/v1/prediction/hotspots`, { headers: this.getAuthHeaders() });
    if (!res.ok) throw new Error("Failed to fetch emerging impact hotspots");
    return res.json();
  },

  async getPredictionLocation(lat: number, lon: number): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/v1/prediction/location?lat=${lat}&lon=${lon}`, { headers: this.getAuthHeaders() });
    if (!res.ok) throw new Error("Failed to query location prediction profile");
    return res.json();
  },

  async getPredictionStory(): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/v1/prediction/story`, { headers: this.getAuthHeaders() });
    if (!res.ok) throw new Error("Failed to load prediction story mode");
    return res.json();
  },

  /**
   * Get low-lying risk flood zones
   *
   */
  async getFloodZones(location: string, mode?: string): Promise<any> {
    const modeParam = mode ? `&mode=${encodeURIComponent(mode)}` : "";
    const res = await fetch(`${BASE_URL}/api/v1/flood/zones?location=${encodeURIComponent(location)}${modeParam}`, {
      headers: this.getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch flood zones");
    return res.json();
  },

  /**
   * Fetch standard map layer configurations
   */
  async getMapLayers(): Promise<{ layers: MapLayer[] }> {
    const res = await fetch(`${BASE_URL}/api/v1/map/layers`, {
      headers: this.getAuthHeaders(),
    });
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
      `${BASE_URL}/api/v1/map/geojson?center_lng=${centerLng}&center_lat=${centerLat}&layer=${layer}&count=${count}`,
      {
        headers: this.getAuthHeaders(),
      }
    );
    if (!res.ok) throw new Error("Failed to fetch map layers GeoJSON");
    return res.json();
  },

  /**
   * Send natural language chat prompt to backend AI assistant
   */
  async sendChatMessage(message: string, location?: string, context?: any[], uploadedFiles?: any[], mapContext?: any, simulationContext?: any): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout for full function calling loop

    try {
      const res = await fetch(`${BASE_URL}/api/v1/chat`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ 
          message, 
          location, 
          context, 
          uploaded_files: uploadedFiles,
          map_context: mapContext,
          simulation_context: simulationContext
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error("Failed to send message to AI");
      const data = await res.json();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("geonarrative_credits_updated"));
      }
      return data;
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  },

  /**
   * Run ML risk calculation model
   */
  async runMLPrediction(params: PredictionParams): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30-second timeout to prevent UI hang

    try {
      const res = await fetch(`${BASE_URL}/api/v1/predict`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(params),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!res.ok) {
        let detail = "Failed to run prediction";
        try { const err = await res.json(); detail = parseErrorDetail(err, detail); } catch {}
        throw new Error(detail);
      }
      const data = await res.json();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("geonarrative_credits_updated"));
      }
      return data;
    } catch (err: any) {
      clearTimeout(timeoutId);
      throw new Error(err.message || "Cannot connect to prediction engine.");
    }
  },

  /**
   * Generate an executive risk assessment or Phase 9 analytical report
   */
  async generateReport(
    location: string,
    reportType: string = "comprehensive",
    options?: {
      scenario?: string;
      progress?: number;
      include_prediction?: boolean;
      include_maps?: boolean;
      include_charts?: boolean;
      include_snapshot?: boolean;
      snapshot_base64?: string;
    }
  ): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/v1/reports/generate`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ location, report_type: reportType, ...options }),
    });
    if (!res.ok) throw new Error("Failed to generate report");
    const data = await res.json();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("geonarrative_credits_updated"));
    }
    return data;
  },

  /**
   * Fetch current and forecast weather data with flood risk metrics
   */
  async getLiveWeather(lat: number, lon: number, location: string): Promise<any> {
    const res = await fetch(
      `${BASE_URL}/api/v1/weather?lat=${lat}&lon=${lon}&location=${encodeURIComponent(location)}`,
      {
        headers: this.getAuthHeaders(),
      }
    );
    if (!res.ok) throw new Error("Failed to fetch live weather telemetry");
    return res.json();
  },

  /**
   * Secure local storage bearer headers helper
   */
  getAuthHeaders(): HeadersInit {
    const token = typeof window !== "undefined" ? localStorage.getItem("geonarrative_token") : null;
    return {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    };
  },

  /**
   * Sign up a new user account with resilient 3-second timeout and auto-success
   */
  async register(payload: any): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // Increased timeout to 30s

    try {
      const res = await fetch(`${BASE_URL}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!res.ok) {
        let detail = "Registration failed";
        try { const err = await res.json(); detail = parseErrorDetail(err, detail); } catch {}
        throw new Error(detail);
      }
      return res.json();
    } catch (err: any) {
      clearTimeout(timeoutId);
      throw new Error(err.message || "Cannot connect to backend server. Please ensure the backend is running.");
    }
  },

  /**
   * Log in user using credentials with a resilient 3-second abort timeout and secure admin mock fallback
   */
  async login(payload: any): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // Increased timeout to 30s

    try {
      const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!res.ok) {
        let detail = "Login failed";
        try { const err = await res.json(); detail = parseErrorDetail(err, detail); } catch {}
        throw new Error(detail);
      }
      return res.json();
    } catch (err: any) {
      clearTimeout(timeoutId);
      throw new Error(err.message || "Cannot connect to backend server. Please ensure the backend is running.");
    }
  },

  /**
   * Verify verification token and activate account
   */
  async verifyEmail(email: string, token: string): Promise<any> {
    let res: Response;
    try {
      res = await fetch(
        `${BASE_URL}/api/v1/auth/verify?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`
      );
    } catch (networkErr) {
      throw new Error("Cannot connect to backend server. Please ensure the backend is running on " + BASE_URL);
    }
    if (!res.ok) {
      let detail = "Email verification failed";
      try { const err = await res.json(); detail = parseErrorDetail(err, detail); } catch {}
      throw new Error(detail);
    }
    return res.json();
  },

  /**
   * Request password reset token
   */
  async forgotPassword(email: string): Promise<any> {
    let res: Response;
    try {
      res = await fetch(`${BASE_URL}/api/v1/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch (networkErr) {
      throw new Error("Cannot connect to backend server. Please ensure the backend is running on " + BASE_URL);
    }
    if (!res.ok) {
      let detail = "Request failed";
      try { const err = await res.json(); detail = parseErrorDetail(err, detail); } catch {}
      throw new Error(detail);
    }
    return res.json();
  },

  /**
   * Reset password with valid token
   */
  async resetPassword(payload: any): Promise<any> {
    let res: Response;
    try {
      res = await fetch(`${BASE_URL}/api/v1/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (networkErr) {
      throw new Error("Cannot connect to backend server. Please ensure the backend is running on " + BASE_URL);
    }
    if (!res.ok) {
      let detail = "Password reset failed";
      try { const err = await res.json(); detail = parseErrorDetail(err, detail); } catch {}
      throw new Error(detail);
    }
    return res.json();
  },

  /**
   * Fetch authenticated user profile data
   */
  async getProfile(): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30-second timeout

    try {
      const res = await fetch(`${BASE_URL}/api/v1/auth/me`, {
        method: "GET",
        headers: this.getAuthHeaders(),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("401 Unauthorized");
        }
        throw new Error("Failed to fetch user session profile");
      }
      return res.json();
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  },

  /**
   * Admin API: get all platform users
   */
  async adminGetUsers(search?: string, roleFilter?: string, subFilter?: string): Promise<any> {
    let url = `${BASE_URL}/api/v1/auth/admin/users?`;
    if (search) url += `search=${encodeURIComponent(search)}&`;
    if (roleFilter) url += `role_filter=${encodeURIComponent(roleFilter)}&`;
    if (subFilter) url += `sub_filter=${encodeURIComponent(subFilter)}&`;
    
    try {
      const res = await fetch(url, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to fetch admin users");
      }
      return res.json();
    } catch (err: any) {
      throw new Error(err.message || "Failed to fetch original admin users. Ensure backend is running.");
    }
  },

  /**
   * Admin API: toggle user active state
   */
  async adminToggleStatus(userId: number, isActive: boolean): Promise<any> {
    try {
      const res = await fetch(`${BASE_URL}/api/v1/auth/admin/users/${userId}/status`, {
        method: "PUT",
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ is_active: isActive }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to change user status");
      }
      return res.json();
    } catch (err: any) {
      throw new Error(err.message || "Failed to toggle user status on original backend.");
    }
  },

  /**
   * Admin API: modify subscription classes & credit limits
   */
  async adminUpdateSubscription(userId: number, subscription: string, credits: number): Promise<any> {
    try {
      const res = await fetch(`${BASE_URL}/api/v1/auth/admin/users/${userId}/subscription`, {
        method: "PUT",
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ subscription, credits }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to adjust user subscription");
      }
      return res.json();
    } catch (err: any) {
      throw new Error(err.message || "Failed to update user subscription on original backend.");
    }
  },

  /**
   * Admin API: read overall SaaS metrics
   */
  async adminGetAnalytics(): Promise<any> {
    try {
      const res = await fetch(`${BASE_URL}/api/v1/auth/admin/analytics`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to load platform stats");
      }
      return res.json();
    } catch (err: any) {
      throw new Error(err.message || "Failed to fetch original platform analytics from backend.");
    }
  },

  /**
   * SaaS API: fetch billing and credit status
   */
  async getBillingStatus(): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/v1/billing/status`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch billing status");
    return res.json();
  },

  /**
   * SaaS API: create Razorpay transaction order
   */
  async createRazorpayOrder(planType: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/v1/billing/create-order`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ plan_type: planType }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to create Razorpay order");
    }
    return res.json();
  },

  /**
   * SaaS API: verify Razorpay payment signatures
   */
  async verifyRazorpayPayment(payload: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    plan_type: string;
  }): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/v1/billing/verify-payment`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Payment verification failed");
    }
    return res.json();
  },

  /**
   * SaaS API: fetch invoice payment logs
   */
  async getPaymentHistory(): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/v1/billing/payments`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch payment history");
    return res.json();
  },

  /**
   * SaaS API: fetch usage telemetry
   */
  async getUsageLogs(): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/v1/billing/usage`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch usage logs");
    return res.json();
  },

  async adminGetRevenueAnalytics(): Promise<any> {
    try {
      const res = await fetch(`${BASE_URL}/api/v1/billing/admin/revenue`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to fetch revenue analytics");
      }
      return res.json();
    } catch (err: any) {
      throw new Error(err.message || "Failed to fetch original revenue analytics from backend.");
    }
  },

  /**
   * Enterprise: Contact us submissions
   */
  async submitContactInquiry(payload: { name: string; email: string; subject: string; message: string }): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/v1/enterprise/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to submit inquiry");
    }
    return res.json();
  },

  /**
   * Enterprise: Help Tickets
   */
  async createSupportTicket(payload: { subject: string; description: string; category: string }): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/v1/enterprise/tickets`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to submit ticket");
    }
    return res.json();
  },

  async listSupportTickets(): Promise<any[]> {
    const res = await fetch(`${BASE_URL}/api/v1/enterprise/tickets`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to load tickets");
    return res.json();
  },

  /**
   * Enterprise: Activity Logs
   */
  async listActivityLogs(): Promise<any[]> {
    const res = await fetch(`${BASE_URL}/api/v1/enterprise/activity-logs`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to load activity logs");
    return res.json();
  },

  /**
   * Enterprise: Profile Management
   */
  async updateProfileDetails(payload: { full_name?: string; industry?: string; designation?: string }): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/v1/enterprise/profile`, {
      method: "PUT",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to update profile details");
    }
    return res.json();
  },

  async changePassword(payload: { old_password: any; new_password: any }): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/v1/enterprise/change-password`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to modify password credentials");
    }
    return res.json();
  },

  /**
   * Fetch unified multi-domain urban risk framework metrics
   */
  async getUrbanRiskFramework(location: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/v1/gis/urban-risk-framework?location=${encodeURIComponent(location)}`, {
      headers: this.getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch urban risk framework");
    return res.json();
  },
  
  getBaseUrl(): string {
    return BASE_URL;
  },
};
