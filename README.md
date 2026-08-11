# GeoNarrative AI: Enterprise Digital Twin & Spatial Decision Support System (SDSS)

![GeoNarrative AI](https://img.shields.io/badge/Platform-Enterprise_GIS-06b6d4?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Production_Ready-10b981?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Stack-React_|_FastAPI_|_PostGIS-3b82f6?style=for-the-badge)

GeoNarrative AI is a high-fidelity, production-ready **Digital Twin and Spatial Decision Support System (SDSS)** explicitly engineered for Disaster Management Authorities, Smart Cities, and Municipal Corporations. 

Bridging the gap between deeply analytical 2D geoprocessing and immersive 3D simulations, the platform empowers decision-makers to visualize, predict, and mitigate urban flooding scenarios within the Pune Metropolitan Region.

---

## 🌟 Core Modules

### 1. 2D Spatial Analysis Engine (ArcGIS Enterprise)
A professional web-based GIS interface powered by the `ArcGIS Maps SDK for JavaScript`. 
- **Live Geoprocessing:** Perform on-the-fly spatial queries against multi-layered topological datasets (Rivers, Buildings, LULC, DEM).
- **Risk Explanation Matrix:** Click any parcel to automatically generate a localized risk profile (Elevation, Slope, Proximity, Density) rendered via dynamic Recharts.

### 2. 3D Digital Twin Command Center (CesiumJS)
An immersive, cinematic WebGL engine designed for stakeholder presentations and real-time situational awareness.
- **Cinematic Flood Engine:** 8-stage hydrodynamic simulation visualization with advanced water shaders, bloom, and building translucency.
- **Scenario Simulation:** Real-time adjustable sliders for Rainfall Intensity, River Base Level, and Engine Speed.
- **Live Telemetry Dashboard:** Tracks dynamic Total Flooded Area, Estimated Population at Risk, and Financial Loss dynamically during simulations.

### 3. Federated Autonomous Agent System (FastAPI)
The backend is driven by a sophisticated Python/FastAPI architecture coordinating multiple specialized AI agents.
- **Data Ingestion:** Automated PostGIS vector/raster synchronization.
- **Predictive ML:** Interface bindings ready for hydrology inference models.
- **Reporting Agent:** Automatically parses spatial analyses and LLM insights into localized PDF disaster reports via ReportLab.

---

## 🏗️ Technology Stack

| Domain | Technologies |
| :--- | :--- |
| **Frontend Core** | React 18, Next.js (App Router), TypeScript, Tailwind CSS, Framer Motion |
| **GIS & 3D Engines**| ArcGIS Maps SDK, CesiumJS, Mapbox GL JS, Deck.gl |
| **Backend API** | Python 3.10+, FastAPI, Uvicorn, Pydantic, SQLAlchemy |
| **Database** | PostgreSQL + PostGIS Extension |
| **AI & ML** | LangChain, HuggingFace Transformers, OpenAI Integration |
| **Infrastructure** | Docker, Docker Compose, Nginx (Production) |

---

## 🚀 Quick Start (Development)

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- PostgreSQL (v14+) with PostGIS (v3+)

### 1. Clone & Configure
```bash
git clone https://github.com/your-org/geonarrative-ai.git
cd geonarrative-ai
```
Configure your `.env` (Backend) and `.env.local` (Frontend) using the provided `.env.example` templates. Ensure you provide valid `NEXT_PUBLIC_ARCGIS_API_KEY` and `NEXT_PUBLIC_CESIUM_ION_TOKEN`.

### 2. Start the Backend (FastAPI)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # (Windows: venv\Scripts\activate)
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 3. Start the Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```

The application will be available at `http://localhost:3000`.

---

## 🛡️ Enterprise Grade Architecture
- **Clean Architecture:** Strict separation of concerns (Controllers -> Services -> Data Access).
- **Graceful Error Handling:** Deep React `ErrorBoundary` and `Suspense` wrappers protect the DOM from WebGL context crashes.
- **Modular Integrations:** Defined `abc.ABC` Python interfaces (`IWeatherAPI`, `IRiverSensorAPI`) for rapid deployment of IoT sensors and real-world meteorology APIs.
- **Optimized Bundle:** Heavy GIS dependencies are strictly lazy-loaded on the client-side to guarantee lightning-fast initial load times.

---

*GeoNarrative AI — Engineering the future of resilient Smart Cities.*
