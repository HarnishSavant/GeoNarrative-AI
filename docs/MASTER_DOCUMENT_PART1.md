# GeoNarrative AI — Complete Technical Masterclass

## MASTER DOCUMENT · PART 1 OF 5

> **Project:** GeoNarrative AI — Conversational GeoAI Digital Twin Platform
> **Author:** Technical Architecture Reference Manual
> **Scope:** Project Overview · System Architecture · Frontend Masterclass

---

# SECTION 1 — PROJECT OVERVIEW

## 1.1 What the Project Does

GeoNarrative AI is a **Conversational GeoAI Digital Twin Platform** — a web application that combines Geographic Information Systems (GIS), Artificial Intelligence (AI), and real-time data visualization into one unified dashboard. Think of it like Google Maps combined with ChatGPT combined with a city monitoring control room.

**Simple Analogy:** Imagine you are a city disaster manager sitting in a control room. You have a giant screen showing a live map of your city. You can ask questions in plain English like "Which hospitals are at flood risk?" and the system instantly highlights them on the map, gives you statistics, and recommends actions. That is what GeoNarrative AI does.

### Core Capabilities

| Capability | What It Does | Real-World Use |
|-----------|-------------|----------------|
| Interactive Map | Renders geographic data with layers, heatmaps, markers | Visualize flood zones, infrastructure, risk areas |
| AI Chat Assistant | Natural language interface to query geospatial data | "Show me flood risk in Riverside District" |
| Multi-Mode Dashboard | Switch between Flood Risk, Traffic, Urban Dev, Utility views | Different city departments use different views |
| ML Prediction Engine | Runs multi-factor risk analysis with weighted scoring | Predict flood risk based on rainfall, elevation, drainage |
| GIS Data Upload | Accept GeoJSON, CSV, Shapefile, KML files | Upload custom datasets for analysis |
| RAG Document Q&A | Ask questions about uploaded spatial documents | "How many features are in my uploaded data?" |
| Report Generation | AI-generated PDF-style risk assessment reports | Generate reports for stakeholders |
| Real-Time Weather | Live weather data integration via OpenWeatherMap API | Current conditions affect risk calculations |

## 1.2 Why It Matters — The Real-World Problem

### The Problem
Every year, floods cause **$40 billion+** in damages globally. Cities lack integrated platforms that combine spatial data, AI reasoning, and real-time monitoring. Current disaster management is fragmented:
- Map data sits in one system (ArcGIS)
- Weather data sits in another (weather APIs)
- Risk analysis is done manually in spreadsheets
- Communication happens through phone calls and emails
- There is no conversational AI to query geographic data naturally

### The Solution
GeoNarrative AI **unifies** all of these into a single platform where a city planner can:
1. See real-time flood risk on an interactive map
2. Ask AI questions in plain English
3. Upload custom spatial datasets
4. Run ML predictions with adjustable parameters
5. Generate stakeholder-ready reports
6. Switch between different city intelligence modes

## 1.3 Industry Relevance

| Industry | How GeoNarrative AI Applies |
|---------|---------------------------|
| **Disaster Management** | Flood prediction, evacuation planning, infrastructure risk |
| **Urban Planning** | Zoning compliance, growth modeling, green space analysis |
| **Smart Cities** | IoT sensor monitoring, utility grid management, traffic optimization |
| **Insurance** | Risk assessment for property, flood zone verification |
| **Real Estate** | Location intelligence, environmental risk scoring |
| **Government** | Policy planning, resource allocation, emergency response |
| **Climate Research** | Environmental monitoring, climate adaptation planning |

## 1.4 Startup Potential

GeoNarrative AI can be commercialized as a **SaaS (Software as a Service)** product:

- **Pricing Model:** Per-city licensing ($5,000-$50,000/month per city)
- **Target Customers:** Municipal corporations, insurance companies, real estate firms
- **Competitive Edge:** Conversational AI interface (no competitor offers this)
- **Market Size:** Global GIS market is $14.5 billion (2025), growing at 12.4% CAGR
- **Revenue Streams:** Subscriptions, API access, custom report generation, consulting

## 1.5 Placement & Interview Value

This project demonstrates mastery of:
- **Full-Stack Development** (Next.js + FastAPI)
- **AI/ML Integration** (LLMs, prediction models, RAG pipelines)
- **Geospatial Engineering** (GIS, coordinate systems, spatial analysis)
- **Modern Frontend** (React, TypeScript, Tailwind, Framer Motion)
- **API Design** (REST, async, middleware, CORS)
- **System Architecture** (microservices, state management, data flow)
- **Cloud & DevOps** (Docker, Vercel, CI/CD)

## 1.6 Research Potential

Publishable research topics from this project:
1. "Conversational Interfaces for Geospatial Intelligence Systems"
2. "RAG-Augmented Spatial Document Analysis for Urban Planning"
3. "Multi-Factor Weighted Risk Prediction for Flood Management"
4. "Digital Twin Architecture for Smart City Monitoring"

---

# SECTION 2 — COMPLETE SYSTEM ARCHITECTURE

## 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     USER'S BROWSER                          │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              NEXT.JS FRONTEND (React 18)            │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐            │    │
│  │  │ Sidebar  │ │ MapView  │ │ Right    │            │    │
│  │  │ (Nav)    │ │ (Mapbox) │ │ Panel    │            │    │
│  │  ├──────────┤ ├──────────┤ ├──────────┤            │    │
│  │  │ Chat     │ │ KPI Cards│ │Analytics │            │    │
│  │  │ Upload   │ │ Mode Bar │ │Insights  │            │    │
│  │  │ Predict  │ │ Upload   │ │Flood Tbl │            │    │
│  │  │ Reports  │ │ Banner   │ │          │            │    │
│  │  └──────────┘ └──────────┘ └──────────┘            │    │
│  └───────────────────┬─────────────────────────────────┘    │
│                      │ HTTP/REST                            │
└──────────────────────┼──────────────────────────────────────┘
                       │
        ┌──────────────▼──────────────┐
        │    FASTAPI BACKEND          │
        │    (Python 3.10+)           │
        │  ┌────────────────────┐     │
        │  │   API Routes       │     │
        │  │  /chat             │     │
        │  │  /predict          │     │
        │  │  /upload           │     │
        │  │  /analytics        │     │
        │  │  /flood-zones      │     │
        │  │  /map/geojson      │     │
        │  │  /weather          │     │
        │  │  /reports/generate │     │
        │  └────────┬───────────┘     │
        │           │                 │
        │  ┌────────▼───────────┐     │
        │  │ Business Logic     │     │
        │  │ - Risk Calculator  │     │
        │  │ - Weather Assessor │     │
        │  │ - GeoJSON Builder  │     │
        │  │ - Chat Responder   │     │
        │  └────────────────────┘     │
        └──────────────┬──────────────┘
                       │
        ┌──────────────▼──────────────┐
        │    EXTERNAL SERVICES        │
        │  ┌──────────────────┐       │
        │  │ OpenWeatherMap   │       │
        │  │ Mapbox Geocoding │       │
        │  │ Gemini API (opt) │       │
        │  └──────────────────┘       │
        └─────────────────────────────┘
```

## 2.2 Component Interaction Model

The system follows a **layered architecture** with clear separation of concerns:

### Layer 1: Presentation Layer (Frontend)
- **Technology:** Next.js 14, React 18, TypeScript
- **Responsibility:** Rendering UI, handling user input, managing client state
- **Key Pattern:** Component composition with prop drilling and callback lifting

### Layer 2: API Gateway Layer (Backend)
- **Technology:** FastAPI with Uvicorn ASGI server
- **Responsibility:** Request validation, routing, CORS handling, response formatting
- **Key Pattern:** Router-based API organization with Pydantic models

### Layer 3: Business Logic Layer
- **Technology:** Python functions within routes.py
- **Responsibility:** Risk calculation, weather assessment, data processing
- **Key Pattern:** Functional composition with domain-specific algorithms

### Layer 4: External Services Layer
- **Technology:** HTTP clients (httpx for async calls)
- **Responsibility:** Fetching weather data, geocoding, AI responses
- **Key Pattern:** Graceful fallback — if external API fails, return mock data

## 2.3 Request Flow — Complete Data Journey

Here is what happens when a user types "Analyze flood risk" in the AI chat:

```
Step 1: User types message in <AIChatPanel /> textarea
        ↓
Step 2: handleSend() is called → creates ChatMessage object
        ↓
Step 3: generateAIResponse(query, location, mode, uploadedFiles)
        is called from src/lib/mockData.ts
        ↓
Step 4: Function checks if uploadedFiles exist
        → If YES: RAG semantic search mockup runs
        → If NO: Standard mode-aware response generated
        ↓
Step 5: Query string is parsed for keywords:
        "flood" + "risk" → triggers flood analysis response
        ↓
Step 6: Markdown-formatted response is returned with:
        - Risk assessment tables
        - Key factors list
        - Recommendations
        ↓
Step 7: Response is stored in messages state array
        ↓
Step 8: renderContent() parses markdown into React elements:
        ## headers → <h3>
        | tables | → <div grid>
        - bullets → <p> with bullet
        **bold** → <strong>
        ↓
Step 9: Chat auto-scrolls to bottom via chatEndRef
```

## 2.4 Frontend-Backend Communication Pattern

```typescript
// Frontend makes HTTP request
const response = await fetch(`${config.api.baseUrl}/api/v1/chat`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: userQuery, location: currentLocation })
});

// Backend receives via FastAPI
@router.post("/chat")
async def chat(request: ChatRequest):
    # Process and return response
    return { "message": response_text, "metadata": {...} }
```

**Important Design Decision:** In the current implementation, the frontend uses a **local AI response generator** (`generateAIResponse` in `mockData.ts`) for the chat system rather than always hitting the backend. This is a deliberate architectural choice:
- **Why:** Eliminates network latency for demo, works offline, no API key needed
- **Tradeoff:** Responses are pattern-matched, not truly AI-generated
- **Production Path:** Replace `generateAIResponse` with a `fetch()` call to `/api/v1/chat`

## 2.5 State Management Architecture

The application uses **React's built-in state management** (no Redux/Zustand):

```
page.tsx (Root Component)
├── activeTab: SidebarTab          → Controls which panel is visible
├── dashboardMode: DashboardMode   → "flood" | "traffic" | "urban" | "utility"
├── currentLocation: string        → "Pune, Maharashtra"
├── mapCenter: [number, number]    → [73.8567, 18.5204]
├── mapLayers: MapLayer[]          → Array of toggleable layers
├── layerOpacity: number           → 0.0 to 1.0
├── uploadedFiles: UploadedFile[]  → User-uploaded spatial files
├── mapFullscreen: boolean         → Map fullscreen toggle
├── sidebarCollapsed: boolean      → Sidebar width toggle
└── rightPanelOpen: boolean        → Intelligence panel toggle
```

**Why No Redux?** The state tree is relatively flat and only 1 page exists. Redux adds complexity without benefit here. `useState` + `useCallback` + `useMemo` are sufficient. In a production multi-page app, you would add Zustand or React Context.

---

# SECTION 3 — FRONTEND MASTERCLASS

## 3.1 React Fundamentals Used in This Project

### What is React?
React is a JavaScript library for building user interfaces using **components** — reusable, self-contained pieces of UI. Think of each component like a LEGO block. You build complex interfaces by composing simple blocks together.

### Components in GeoNarrative AI
Every `.tsx` file in `src/components/` is a React component:

| Component | Lines | Purpose |
|-----------|-------|---------|
| `MapView.tsx` | 965 | Interactive map with Mapbox GL + fallback visualization |
| `AIChatPanel.tsx` | 388 | AI conversational interface with markdown rendering |
| `PredictionPanel.tsx` | 386 | ML prediction engine with 4 mode configurations |
| `TopNav.tsx` | ~300 | Search bar, notifications, user profile |
| `RightPanel.tsx` | ~300 | Intelligence panel with tabs (Insights, Analytics, Risk Zones) |
| `AnalyticsCharts.tsx` | ~300 | Recharts visualizations (bar, pie, area, radar) |
| `FileUpload.tsx` | ~270 | Drag-and-drop GIS file upload with success navigation |
| `Sidebar.tsx` | 135 | 8-tab navigation with collapse animation |
| `KPICard.tsx` | ~100 | Animated metric cards with sparkline charts |
| `MapLayersPanel.tsx` | ~100 | Layer visibility toggles with opacity slider |
| `ReportsPanel.tsx` | ~160 | Report generation interface |
| `SettingsPanel.tsx` | ~140 | Configuration settings |
| `FloodRiskTable.tsx` | ~120 | Sortable risk zone table |

### Hooks Used

```typescript
// useState — Store and update component state
const [activeTab, setActiveTab] = useState<SidebarTab>("dashboard");

// useCallback — Memoize functions to prevent unnecessary re-renders
const handleLocationSearch = useCallback(async (location: string) => {
  setCurrentLocation(location);
  // ... geocoding logic
}, []);

// useMemo — Memoize expensive computations
const currentKPIs = React.useMemo(
  () => getKPIsForMode(dashboardMode),
  [dashboardMode]  // Only recompute when mode changes
);

// useRef — Reference DOM elements without causing re-renders
const chatEndRef = useRef<HTMLDivElement>(null);
// Used to auto-scroll chat to bottom

// useEffect — Run side effects (data fetching, subscriptions)
useEffect(() => {
  scrollToBottom();
}, [messages]); // Runs when messages array changes
```

## 3.2 Next.js Architecture

### What is Next.js?
Next.js is a React **framework** (React is a library). The difference:
- **React** gives you components and state management
- **Next.js** adds routing, server-side rendering, optimization, and build tooling

### App Router (Next.js 14)
GeoNarrative AI uses the **App Router** (`src/app/` directory):

```
src/app/
├── layout.tsx    → Root layout (wraps ALL pages)
├── page.tsx      → The "/" route (main dashboard)
└── globals.css   → Global stylesheet
```

**`layout.tsx` Explained:**
```typescript
export const metadata: Metadata = {
  title: "GeoNarrative AI — Conversational GeoAI Digital Twin Platform",
  description: "AI-powered geospatial intelligence platform...",
  keywords: ["GeoAI", "Digital Twin", "Flood Prediction", ...],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">  {/* Dark mode by default */}
      <head>
        <link href="mapbox-gl.css" rel="stylesheet" />  {/* Map styles */}
      </head>
      <body className="bg-geo-dark text-gray-100 overflow-hidden">
        {children}  {/* page.tsx renders here */}
      </body>
    </html>
  );
}
```

### Dynamic Import (Code Splitting)
```typescript
const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,  // Don't render on server (Mapbox needs browser APIs)
  loading: () => <LoadingSpinner />,
});
```
**Why?** Mapbox GL JS uses `window` and `document` objects that don't exist on the server. `dynamic()` with `ssr: false` ensures the map only loads in the browser.

### Path Aliases
```json
// tsconfig.json
"paths": { "@/*": ["./src/*"] }
```
This lets you write `import MapView from "@/components/MapView"` instead of `import MapView from "../../../components/MapView"`.

## 3.3 Tailwind CSS Design System

### What is Tailwind CSS?
Instead of writing CSS in separate files, Tailwind gives you **utility classes** you apply directly in HTML/JSX:

```html
<!-- Traditional CSS -->
<div class="card">...</div>
/* In styles.css: .card { background: #111827; border-radius: 16px; padding: 20px; } */

<!-- Tailwind CSS -->
<div class="bg-geo-card rounded-2xl p-5">...</div>
```

### Custom Design Tokens (tailwind.config.ts)

The project defines a complete **design system**:

```typescript
colors: {
  primary: {
    500: "#6366f1",  // Indigo — main brand color
    600: "#4f46e5",  // Darker indigo for buttons
  },
  geo: {
    dark: "#0a0e1a",      // Main background
    darker: "#060912",    // Sidebar background
    card: "#111827",      // Card surfaces
    border: "#1f2937",    // Borders
    accent: "#06b6d4",    // Cyan accent
    success: "#10b981",   // Green for low risk
    warning: "#f59e0b",   // Amber for medium risk
    danger: "#ef4444",    // Red for high risk
  },
}
```

### Custom Animations
```typescript
animation: {
  "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
  "float": "float 6s ease-in-out infinite",
  "glow": "glow 2s ease-in-out infinite alternate",
}
```

### Glassmorphism Pattern
```css
.glass-card {
  @apply backdrop-blur-xl border rounded-2xl;
  background: rgba(17, 24, 39, 0.7);  /* Semi-transparent */
  border-color: rgba(55, 65, 81, 0.5);
}
```
**What is Glassmorphism?** A design trend where elements look like frosted glass — semi-transparent background with blur effect. Used extensively in Apple's iOS and modern web dashboards.

## 3.4 Dashboard Architecture

### Multi-Mode System
The dashboard supports 4 intelligence modes, each with its own KPIs, map layers, and analytics:

```typescript
const DASHBOARD_MODES = [
  { id: "flood", label: "Flood Risk", gradient: "from-blue-600 to-cyan-500" },
  { id: "traffic", label: "Traffic", gradient: "from-amber-500 to-orange-500" },
  { id: "urban", label: "Urban Dev", gradient: "from-violet-500 to-indigo-500" },
  { id: "utility", label: "Utility", gradient: "from-emerald-500 to-teal-500" },
];
```

When a user clicks a mode button:
```
handleModeChange("traffic")
  → setDashboardMode("traffic")
  → setMapLayers(getLayersForMode("traffic"))
  → currentKPIs recomputes via useMemo
  → currentAnalytics recomputes via useMemo
  → All child components re-render with new data
```

### Layout Structure (3-Column)
```
┌──────┬───────────────────────────────┬──────────┐
│      │  Mode Selector Bar           │          │
│      ├───────────────────────────────┤ Right    │
│ Side │  KPI Cards Row (6 cards)     │ Panel    │
│ bar  ├───────────────────────────────┤ (Intelli-│
│      │                              │  gence)  │
│ 72px │  Map View / Visualization    │          │
│  or  │  (Mapbox GL / Fallback)      │ ~320px   │
│260px │                              │          │
│      │                              │          │
└──────┴───────────────────────────────┴──────────┘
```

### Tab-Based Secondary Panel
When user clicks sidebar tabs (not Dashboard/Analytics), a secondary panel slides in:
```typescript
const showLeftContent = activeTab !== "dashboard" && activeTab !== "analytics";
// If true, AnimatePresence slides in a 340px panel between sidebar and map
```

## 3.5 Map Integration (MapView.tsx)

### Dual-Mode Rendering
MapView supports two rendering modes:

**Mode 1: Mapbox GL (when token is present)**
- Full interactive WebGL-powered map
- Vector tiles, 3D buildings, terrain
- Heatmaps, fill layers, circle markers
- Popups, navigation controls
- 5 map styles: Dark, Satellite, Light, Streets, Outdoors

**Mode 2: Fallback Canvas (when no token)**
- Animated gradient background simulating a map
- CSS-based data point dots
- SVG river/pipe lines
- Pulsing risk zone circles
- When custom data is uploaded: HUD scanner overlay activates

### HUD Scanner System (on file upload)
When user uploads a GIS file, the map transforms:
```typescript
const isCustomActive = layers.some(l => l.id.startsWith("custom-") && l.visible);

// If active:
// 1. Background shifts to darker satellite gradient
// 2. Grid density increases (30px vs 40px)
// 3. Neon laser scan-line sweeps vertically
// 4. Four corner HUD panels appear with:
//    - "RAG VECTOR AUDIT ACTIVE"
//    - "SATELLITE LOCK SECURED"
//    - "HIGH-RESOLUTION SENSORS"
//    - "ZONING COINCIDENCE AUDIT"
```

## 3.6 Frontend Folder Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # HTML skeleton, metadata, fonts
│   │   ├── page.tsx            # Main page — orchestrates everything
│   │   └── globals.css         # Tailwind directives + custom classes
│   ├── components/             # All React components
│   │   ├── MapView.tsx         # 965 lines — the most complex component
│   │   ├── AIChatPanel.tsx     # Chat with markdown renderer
│   │   ├── PredictionPanel.tsx # 4-mode ML prediction UI
│   │   ├── TopNav.tsx          # Search + notifications
│   │   ├── RightPanel.tsx      # Intelligence panel
│   │   ├── AnalyticsCharts.tsx # Recharts visualizations
│   │   ├── FileUpload.tsx      # Drag-drop with success card
│   │   ├── Sidebar.tsx         # Navigation + collapse
│   │   ├── KPICard.tsx         # Animated metric display
│   │   ├── MapLayersPanel.tsx  # Layer toggles + opacity
│   │   ├── ReportsPanel.tsx    # Report generator
│   │   ├── SettingsPanel.tsx   # Configuration
│   │   └── FloodRiskTable.tsx  # Risk data table
│   └── lib/                    # Shared utilities
│       ├── types.ts            # TypeScript interfaces (122 lines)
│       ├── config.ts           # Environment config + constants
│       └── mockData.ts         # 1148 lines — all demo data + AI logic
├── tailwind.config.ts          # Design system tokens
├── tsconfig.json               # TypeScript compiler config
├── next.config.js              # Next.js settings
├── postcss.config.js           # PostCSS (required by Tailwind)
└── package.json                # Dependencies + scripts
```

---

**→ Continue to PART 2: Backend Masterclass + GIS Masterclass**
