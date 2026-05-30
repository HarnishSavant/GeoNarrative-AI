# GeoNarrative AI — Enterprise Architecture Blueprint

## SYSTEM DESIGN & TECHNICAL REFERENCE MANUAL · INDUSTRIAL EDITION

> **Status:** Architecture Refactored & Fully Decoupled
> **Target Audience:** Engineering Leads, System Architects, Technical Interviewers, and Viva Examiners
> **Scope:** Enterprise Folder Structures · Component Modularity · Decoupled Map Systems · Tracing Middleware · Request Lifecycle · Geospatial API Protocol

---

# SECTION 1 — ARCHITECTURAL PHILOSOPHY & DESIGN PATTERNS

To transition **GeoNarrative AI** from a prototype to a production-grade system capable of handling multi-tenant municipalities, horizontal traffic volumes, and active telemetry streams, we adhere to three foundational architectural principles:

```
                  ┌─────────────────────────────────────────┐
                  │          DECOUPLED FRONTEND             │
                  │   Next.js 14 App Router (Client SPA)    │
                  └────────────────────┬────────────────────┘
                                       │
                                       │ HTTP / JSON REST
                                       │ (Port 8000)
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │          DECOUPLED BACKEND              │
                  │      FastAPI Gateway & Telemetry        │
                  └─────────────────────────────────────────┘
```

1. **Separation of Concerns (SoC):** The user interface (Next.js) must know nothing about the mathematical internals of the weighted flood risk formula, and the server (FastAPI) must remain entirely stateless—unaware of active active tab indicators, sidebar positioning, or UI color palettes.
2. **Domain-Driven Design (DDD):** Both directories are modularized by functional domains (`flood`, `traffic`, `urban`, `utility`) rather than technology groupings. This allows individual teams to scale features without triggering horizontal cascade failures.
3. **Repository Pattern Abstraction:** Direct hardcoding of static coordinate matrices and layers is abstracted into a clean storage layer. This ensures that transitioning from local mock datasets to managed cloud PostGIS clusters requires editing exactly one repository file without altering business routes.

---

# SECTION 2 — ENTERPRISE PROJECT STRUCTURE

Below is the clean, modular, and refactored directory structure representing a production-grade deployment layout.

```
geonarrative-ai/
├── backend/                             # FASTAPI ENTERPRISE BACKEND
│   ├── app/
│   │   ├── api/
│   │   │   ├── v1/
│   │   │   │   ├── endpoints/          # Granular Controller Layer
│   │   │   │   │   ├── __init__.py
│   │   │   │   │   ├── analytics.py     # Analytics & KPI Controllers
│   │   │   │   │   ├── chat.py          # AI Assistant & RAG Controllers
│   │   │   │   │   ├── flood.py         # Inundation Zone Controllers
│   │   │   │   │   ├── location.py      # Geocoding & Coordinates Search
│   │   │   │   │   ├── map.py           # Map Layers & GeoJSON Providers
│   │   │   │   │   ├── predict.py       # ML Simulators (XGBoost)
│   │   │   │   │   ├── report.py        # Executive Summary Generators
│   │   │   │   │   └── upload.py        # Spatial File Ingestion
│   │   │   │   ├── __init__.py
│   │   │   │   └── api.py               # Aggregates and Prefixes v1 Routers
│   │   │   ├── __init__.py
│   │   │   └── routes.py                # Legacy Routing (preserved for compatibility)
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   └── config.py                # Pydantic Settings Management
│   │   ├── middleware/
│   │   │   ├── __init__.py
│   │   │   └── logging_middleware.py    # Custom Latency & Tracing Middleware
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   └── schemas.py               # Pydantic Request/Response Models
│   │   ├── repositories/
│   │   │   ├── __init__.py
│   │   │   └── data_store.py            # Storage Abstraction (Mock DB)
│   │   └── services/
│   │       ├── __init__.py
│   │       ├── chat_service.py          # Chat Processing & NLP
│   │       ├── prediction_service.py    # Multi-Factor ML Risk calculations
│   │       ├── report_service.py        # Dynamic PDF Report Compilation
│   │       ├── spatial_service.py       # GeoJSON operations & Ingestion
│   │       └── weather_service.py       # Weather API client & flood impact
│   ├── main.py                          # FastAPI ASGI Entrypoint
│   └── requirements.txt                 # Backend dependencies
│
├── frontend/                            # NEXT.JS 14 ENTERPRISE FRONTEND
│   ├── src/
│   │   ├── app/                         # App Router (View Templates)
│   │   │   ├── favicon.ico
│   │   │   ├── globals.css              # Global styles (glassmorphism)
│   │   │   ├── layout.tsx               # Root DOM layout & Providers
│   │   │   └── page.tsx                 # Core orchestrator component
│   │   ├── components/                  # Component Organization
│   │   │   ├── common/                  # Atomic Design (Generic UI Elements)
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── KPICard.tsx          # Reusable analytics panel
│   │   │   │   ├── Modal.tsx
│   │   │   │   └── Tooltip.tsx
│   │   │   └── features/                # Domain Modularity (Smart Features)
│   │   │       ├── chat/
│   │   │       │   └── AIChatPanel.tsx  # Natural Language Interface
│   │   │       ├── dashboard/
│   │   │       │   ├── AnalyticsCharts.tsx
│   │   │       │   ├── FloodRiskTable.tsx
│   │   │       │   ├── ReportsPanel.tsx
│   │   │       │   └── RightPanel.tsx
│   │   │       ├── map/
│   │   │       │   ├── MapLayersPanel.tsx
│   │   │       │   ├── MapTelemetryHUD.tsx # Neon digital twin overlays
│   │   │       │   └── MapView.tsx      # Unified Map Element
│   │   │       ├── prediction/
│   │   │       │   └── PredictionPanel.tsx # Parameter Simulation UI
│   │   │       └── upload/
│   │   │           └── FileUpload.tsx   # GIS drag-and-drop ingestion
│   │   ├── hooks/                       # Encapsulated State Management
│   │   │   ├── useAIChat.ts             # Conversational state & RAG timers
│   │   │   ├── useMapControl.ts         # Coordinates, layer opacities, modes
│   │   │   └── usePrediction.ts         # Multi-mode ML parameters state
│   │   ├── lib/
│   │   │   ├── config.ts                # Token and API endpoints constants
│   │   │   ├── mockData.ts              # Legacy mock definitions
│   │   │   └── types.ts                 # TypeScript contract types
│   │   └── services/
│   │       └── apiService.ts            # Unified API Client Service
│   ├── next.config.js
│   ├── package.json
│   └── tsconfig.json
```

---

# SECTION 3 — FRONTEND MODULAR ARCHITECTURE

## 3.1 Next.js 14 Domain Organization
Rather than keeping all visual elements in a flat list, we organize them using an industry-standard **Atomic/Domain Hybrid** structure:
* **`components/common/`:** Contains basic reusable presentational components that can be used across any page (e.g., `KPICard`).
* **`components/features/`:** Houses smart, complex elements separated by business domains (e.g., `map/`, `chat/`, `prediction/`). This prevents name collisions and provides a clear boundary for code changes.

## 3.2 State Management via Custom React Hooks
To avoid maintaining thousands of lines of state logic in the root page template `page.tsx`, state is fully encapsulated into custom hooks under `hooks/`:

```
               ┌────────────────────────────────────────┐
               │         frontend/src/app/page.tsx      │
               │         Main view orchestrator         │
               └────────────┬──────────────┬────────────┘
                            │              │
        ┌───────────────────┘              └───────────────────┐
        ▼                                                      ▼
┌─────────────────────────┐                            ┌─────────────────────────┐
│     useMapControl()     │                            │     useAIChat()         │
│ Coordinates, layers,    │                            │ Conversational logs,    │
│ opacities, search       │                            │ RAG index summaries     │
└─────────────────────────┘                            └─────────────────────────┘
```

* **`useMapControl`:** Manages selected cities, coordinate flying states, overlay visibilities, and custom layer registrations.
* **`useAIChat`:** Manages conversational buffers, assistant typing variables, vector ingestion delays, and copy-to-clipboard logic.
* **`usePrediction`:** Retains parameters for all 4 urban modes, handles progress bar calculation, and parses mathematical risk coefficients.

## 3.3 Unified HTTP API Client (`apiService.ts`)
We isolate all browser-based `fetch` logic into a single network module. This guarantees that API routes are standardized, handles exceptions in a single place, and supports changing base configurations seamlessly:

```typescript
// Unified service client interface contract
export const apiService = {
  async searchLocations(query: string): Promise<LocationResponse[]>;
  async uploadFile(file: File): Promise<UploadSuccessModel>;
  async getAnalytics(location: string): Promise<AnalyticsData>;
  async sendChatMessage(message: string, context?: any[]): Promise<AIChatResponse>;
  async runMLPrediction(params: PredictionParams): Promise<MLPredictionResult>;
};
```

## 3.4 Decoupling the Map Engine
In our modular design, `MapView.tsx` acts as a clean shell that coordinates three sub-elements:
1. **Mapbox Vector Layer Controller:** Handles the WebGL-powered vector map canvas, map styling changes, and popup registrations.
2. **Canvas Fallback Renderer:** Displays dynamic SVG and Canvas animations for smooth rendering even when the browser lacks a Mapbox API token.
3. **Map Telemetry HUD (`MapTelemetryHUD.tsx`):** Handles neon scanning frames, digital twin statistics, and EPSG WGS84 coordinate readouts in a modular floating overlay.

---

# SECTION 4 — BACKEND ENTERPRISE ARCHITECTURE

We refactored the backend to move away from a single routing monolith. The business logic, validation rules, data access, and API gateways are cleanly separated.

```
Incoming Request
      │
      ▼
┌──────────────┐      ┌────────────────┐      ┌──────────────┐
│  Middleware  │─────→│  API Controllers│─────→│ Pydantic     │
│  Telemetry   │      │  (Endpoints)   │      │ Validation   │
└──────────────┘      └───────┬────────┘      └──────────────┘
                              │
                              ▼
                      ┌────────────────┐
                      │    Services    │
                      │ (Business logic)│
                      └───────┬────────┘
                              │
                              ▼
                      ┌────────────────┐
                      │  Repositories  │
                      │ (Data Store)   │
                      └────────────────┘
```

## 4.1 Granular Controller Layer (FastAPI Routers)
Routes are split into functional endpoints under `api/v1/endpoints/` and collected by a unified router aggregator `api/v1/api.py`. Each file is responsible only for taking HTTP parameters, checking access permissions, and calling the business logic layer:
* `location.py`: Coordinate and city search queries.
* `upload.py`: Spatial file format validation.
* `predict.py`: Machine Learning simulator.
* `chat.py`: Ingests prompts and forwards to NLP services.

## 4.2 Business Services Layer (`app/services/`)
This is where the real computation lives. Services are written as standalone classes with static methods, keeping them highly testable:
* `spatial_service.py`: Counts GeoJSON features, parses lines, and handles coordinate mathematics.
* `prediction_service.py`: Computes normalized multi-factor environmental risk scores.
* `weather_service.py`: Handles weather queries with graceful degradation if third-party APIs fail.

## 4.3 Data Store Repositories (`app/repositories/`)
`data_store.py` acts as our database layer. It abstracts database queries behind simple functions, simulating database access while keeping things modular:
* `get_analytics_data_db()`: Fetches historical charts.
* `get_flood_zones_db()`: Fetches geographic boundaries.

If we transition from in-memory objects to a PostgreSQL + PostGIS cluster using SQLAlchemy, we only need to rewrite these functions. The API routers and service calculations remain completely untouched.

## 4.4 Custom Latency & Tracing Middleware (`app/middleware/`)
We implemented `LoggingMiddleware` to trace every incoming API request:
* Records request method, path, and client IP.
* Automatically measures response execution time in milliseconds.
* Appends a custom `X-Process-Latency-Ms` header to every response, allowing client-side telemetry trackers to monitor backend health in real-time.

---

# SECTION 5 — THE REQUEST / RESPONSE LIFECYCLE

This flowchart shows the exact path of a data action in the refactored architecture, using the **Spatial File Upload** as an example:

```
[CLIENT WORKFLOW]                                  [SERVER TELEMETRY GATEWAY]
User drops file onto Dropzone                        HTTP POST /api/v1/upload
       │                                                      │
       ▼                                                      ▼
FileUpload.tsx parses file object                  LoggingMiddleware logs request
       │                                                      │
       ▼                                                      ▼
apiService.uploadFile(file) constructs FormData     upload.py checks extension (.geojson)
       │                                                      │
       ▼                                                      ▼
Fetch sends multipart request ─────────────────────→ spatial_service.py parses raw bytes
                                                              │
                                                              ▼
                                                    spatial_service.py counts features
                                                              │
                                                              ▼
                                                    Telemetry appends X-Process-Latency-Ms
                                                              │
┌─────────────────────────────────────────────────────────────┘
│
▼
[CLIENT STATE CASCADE]
JSON success payload returned:
{ id: "171927", features: 223, name: "pune_catchment.geojson", type: "GEOJSON" }
       │
       ▼
page.tsx updates uploadedFiles state array
       │
       ├──────────────────────────────────────────────┐
       ▼                                              ▼
useMapControl: handleRegisterCustomLayer       AIChatPanel: useEffect detects upload
       │                                              │
       ▼                                              ▼
Registers pink neon layer ID                   Ingestion message generated
       │                                              │
       ▼                                              ▼
MapView detects "custom-" prefix               RAG summary renders with
Triggers satellite blueprint overlay           typing animation
       │                                              │
       ▼                                              ▼
Scanner sweep line animation starts            Suggested questions show in chat
```

---

# SECTION 6 — GEOSPATIAL DATA COMMUNICATION PROTOCOL

To ensure reliable communication between the client and server, we enforce a strict spatial communication protocol:

## 6.1 Coordinate Convention
All spatial coordinates are passed and processed in **WGS84 (EPSG:4326)** coordinate reference system order:
```json
[longitude, latitude]
```
* **Example:** `[73.8567, 18.5204]` (Pune, India).
* *Note:* This follows the GeoJSON specification (RFC 7946). Any conversion to Web Mercator (EPSG:3857) for WebGL tile rendering is handled client-side by Mapbox.

## 6.2 Standard GeoJSON Point Schema
Dynamic points generated for map rendering are formatted as standard GeoJSON feature collections to ensure compatibility with Mapbox GL layers:

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [73.8567, 18.5204]
      },
      "properties": {
        "id": 101,
        "name": "Telecom Tower Base Station",
        "riskScore": 8.4,
        "riskLevel": "high"
      }
    }
  ]
}
```

This strict decoupling of state, modular routing, and clean data contracts ensures that GeoNarrative AI is highly maintainable, performant, and ready for production deployment.
