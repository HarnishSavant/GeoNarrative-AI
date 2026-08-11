# GeoNarrative Digital Twin Platform Architecture
**MSc Dissertation Research Framework: Application Layer**

## 1. Introduction
With the foundational Data Engineering and PostGIS Flood Risk layers scientifically validated, the research transitions to the Application Layer. The goal is to build a high-performance, asynchronous backend capable of streaming complex spatial geometries (GeoJSON) and coupling them with Generative AI (Gemini) for real-time Disaster Risk reasoning.

## 2. System Architecture Diagram

```mermaid
graph TD
    subgraph GeoNarrative Digital Twin Platform
        direction TB
        
        subgraph Client Layer (Frontend UI)
            Map[Interactive WebGIS Map]
            Chat[GeoAI Natural Language Interface]
            Dashboard[Risk Analytics Dashboard]
        end

        subgraph Application Orchestration Layer (FastAPI)
            Router[Intent Router Engine]
            GIS_SVC[PostGIS Async Service]
            AI_SVC[Gemini 3.1 Pro Spatial Agent]
            Report[PDF Report Generator]
            
            Router <--> AI_SVC
            Router <--> GIS_SVC
            Router --> Report
        end

        subgraph Spatial Database Layer (PostGIS)
            FR[(flood_risk)]
            BE[(building_exposure)]
            PE[(poi_exposure)]
            RE[(road_exposure)]
        end

        %% Data Flow
        Chat -->|NLP Query| Router
        Map <-->|GeoJSON / MVT Stream| GIS_SVC
        
        GIS_SVC <-->|SQL ST_Intersects| FR
        GIS_SVC <-->|SQL Aggregations| BE
        GIS_SVC <-->|SQL Queries| PE
        GIS_SVC <-->|SQL| RE
    end
```

---

## 3. Directory Structure

```text
/backend
├── main.py                    # FastAPI Application Entrypoint
├── /api
│   ├── /endpoints
│   │   ├── geodata.py         # REST routes for serving GeoJSON to the map
│   │   ├── analytics.py       # REST routes for dashboard statistics
│   │   ├── chat.py            # WebSocket/HTTP routes for LLM conversation
│   │   └── report.py          # PDF Report Generation trigger
├── /services
│   ├── postgis_client.py      # Async database connection pool (asyncpg)
│   ├── gemini_agent.py        # Gemini API interaction and function calling
│   ├── intent_router.py       # Logic separating Map queries vs Text queries
│   └── pdf_engine.py          # ReportLab document compiler
├── /models
│   ├── schemas.py             # Pydantic validation models
└── /core
    └── config.py              # Environment variables (DB, Gemini Keys)
```

---

## 4. Database Query Strategy

The FastAPI backend will utilize native PostgreSQL JSON functions to achieve extreme performance. Instead of Python mapping raw rows to dictionaries, the database will construct the GeoJSON directly.

### A. Show Flood Risk in Pune
**Strategy:** Stream the hexagonal hazard grid.
```sql
SELECT json_build_object(
    'type', 'FeatureCollection',
    'features', json_agg(ST_AsGeoJSON(t.*)::json)
)
FROM (SELECT grid_id, risk_class, geometry FROM flood_risk) t;
```

### B. Show Hospitals in High-Risk Zones
**Strategy:** Filter the `poi_exposure` table.
```sql
SELECT json_build_object(
    'type', 'FeatureCollection',
    'features', json_agg(ST_AsGeoJSON(t.*)::json)
)
FROM (
    SELECT name, type, risk_class, geometry 
    FROM poi_exposure 
    WHERE type = 'hospital' AND risk_class IN ('High', 'Very High')
) t;
```

### C. Find Safest Locations for Emergency Shelters
**Strategy:** Suitability modeling. Query the database for large, open parcels (parks/schools) that are strictly in 'Very Low' risk zones and within 500m of major roads.
```sql
SELECT p.name, ST_AsGeoJSON(p.geometry)
FROM poi_exposure p
JOIN road_exposure r ON ST_DWithin(p.geometry::geography, r.geometry::geography, 500)
WHERE p.type IN ('school', 'park') AND p.risk_class = 'Very Low';
```

---

## 5. AI Reasoning Layer (Gemini Integration)

The GeoNarrative platform differentiates itself from static dashboards via the **Intent Router Engine**.

**Workflow:**
1. **User Input:** "What is the economic impact of flooding on the transportation network?"
2. **Intent Classification:** The Router determines this is an `ANALYTICAL_QUERY`.
3. **Spatial Execution:** The `postgis_client` runs a `SUM(exposed_length_m)` on `road_exposure` grouped by `risk_class` and `transport_pois`.
4. **LLM Synthesis:** The raw JSON numbers are fed to Gemini along with a strict system prompt. Gemini generates a professional, consulting-grade executive summary explaining the cascading effects of specific road segment failures on the city's logistics.

---

## 6. Implementation Roadmap

### Phase 1: API Foundation
- Initialize FastAPI.
- Establish `asyncpg` connection pools to PostGIS.
- Deploy the raw `/api/geodata` endpoints to verify spatial data delivery.

### Phase 2: Agentic Engineering
- Integrate the Google Gemini SDK.
- Build the `Intent Router` using system prompts and Function Calling (Tools) to allow the LLM to autonomously trigger PostGIS queries.

### Phase 3: Risk Reporting Engine
- Implement `ReportLab` to dynamically compile the LLM's socio-economic narratives, data tables, and statistical histograms into downloadable PDF dossiers.

### Phase 4: Frontend Integration (Beyond Scope of Backend Arch)
- Connect a WebGIS platform (Mapbox GL JS or Leaflet) to consume the GeoJSON.
- Build the chat interface.
