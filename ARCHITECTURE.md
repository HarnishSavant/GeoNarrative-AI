# GeoNarrative AI: System Architecture

The GeoNarrative AI platform is designed as a federated, multi-tier system encompassing a highly interactive presentation layer, a resilient microservice backend, and a robust geospatial data store.

---

## 1. High-Level Architecture Diagram

```mermaid
graph TD
    %% Presentation Layer
    subgraph Frontend [Presentation Layer (React + Next.js)]
        UI[Dashboard UI]
        ArcGIS[2D ArcGIS Maps SDK]
        Cesium[3D CesiumJS Digital Twin]
        State[Zustand State Management]
    end

    %% Gateway & API Layer
    subgraph Backend [Backend API (FastAPI)]
        Router[API Router]
        Auth[JWT Authentication]
        
        %% Services
        subgraph Services [Business Logic]
            GIS[GIS Engine]
            Predict[ML Prediction Service]
            Agent[LLM Report Agent]
            Alert[Emergency Alert Dispatcher]
        end
        
        %% Integrations
        subgraph Integrations [External Integration Contracts]
            WeatherAPI[Weather API Interfaces]
            SensorAPI[IoT Sensor Interfaces]
        end
    end

    %% Data Layer
    subgraph Database [Data Persistence Layer]
        PG[PostgreSQL]
        PostGIS[PostGIS Spatial Extension]
    end

    %% External Systems
    subgraph External [Third-Party Services]
        OpenWeather[OpenWeather / IMD]
        LLM[OpenAI / LLM API]
        ESRI[ArcGIS Feature Services]
    end

    %% Relationships
    UI <--> |REST / JSON| Router
    ArcGIS <--> |Spatial Queries| ESRI
    Cesium <--> |3D Tiles| ESRI
    
    Router --> Auth
    Auth --> Services
    
    Services --> Database
    Services --> Integrations
    
    Integrations -.-> External
    Agent -.-> LLM
```

---

## 2. Component Details

### 2.1. Presentation Layer (Frontend)
- **Framework:** Next.js (App Router) wrapping React 18.
- **State Management:** `Zustand` provides lightweight, fast state propagation decoupled from React's render tree, essential for heavy map syncing.
- **Rendering Engines:** 
  - `ArcGIS Maps SDK` handles 2D analytical geoprocessing and spatial intersections.
  - `CesiumJS` handles 3D WebGL rendering, volumetric shading, and cinematic flood simulations.
- **Error Resilience:** Heavy engines are wrapped in React `Suspense` and strict `ErrorBoundaries` to isolate WebGL context crashes.

### 2.2. Backend & API Layer (FastAPI)
- **Framework:** FastAPI provides extreme high performance and native Pydantic validation for all incoming and outgoing geospatial data.
- **Clean Architecture:** Route handlers (`endpoints/`) strictly validate data and pass it to isolated `services/`.
- **Integration Contracts:** Defined using `abc.ABC` in `services/integrations/interfaces.py`, allowing the system to connect to external Weather, ML, and Sensor APIs securely without refactoring core logic.
- **Agentic Workflows:** The `geoai_orchestrator` coordinates requests between the GIS data layer and large language models (LLMs) to synthesize automated textual disaster reports.

### 2.3. Data Layer (PostgreSQL + PostGIS)
- **Relational Data:** Handles Users, Audit Logs, Feedback, and Roles.
- **Spatial Data:** PostGIS is utilized to store `LULC`, `River Networks`, and `Building Footprints` using advanced topological geometry processing (`ST_Intersects`, `ST_Buffer`).

---

## 3. Data Flow: Flood Simulation

1. **User Input:** Analyst configures Rainfall and River Baseline sliders in the `CesiumTwinView`.
2. **Simulation Engine:** `requestAnimationFrame` loop calculates cascading spatial impact locally at 60 FPS, interpolating water levels across 5 risk zones.
3. **Analytics Sync:** Extracted building/road intersection data is processed through a multiplier and passed to `Recharts` for real-time statistical visualization.
4. **Backend Handoff (Future):** Once the simulation stabilizes, the analyst can trigger a "Generate Report" action.
5. **Report Agent (Backend):** The FastAPI backend queries the live spatial state, feeds it through an LLM to generate actionable insights, and outputs a localized PDF using ReportLab.
