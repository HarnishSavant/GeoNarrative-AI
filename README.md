GeoNarrative AI: Enterprise Digital Twin & Spatial Decision Support System (SDSS)

GeoNarrative AI is a GIS-first Spatial Decision Support System (SDSS) for urban flood analysis, infrastructure exposure assessment, 3D visualization, and geospatial decision-making.

The platform combines enterprise GIS, spatial databases, 3D Digital Twin visualization, flood-modelling workflows, and GeoAI to provide an interactive environment for exploring urban flood scenarios.

Current development focus: integrating LiDAR-derived high-resolution terrain, rainfall data, and hydrological/hydrodynamic modelling to improve flood simulation and validation.

Core Modules

1. 2D GIS & Spatial Analysis

ArcGIS Maps SDK for JavaScript

ArcGIS Enterprise integration

Interactive rivers, buildings, roads, LULC, and terrain layers

Spatial queries and feature-level analysis

Flood susceptibility and infrastructure exposure analysis

Localized risk explanation using elevation, slope, proximity, and density indicators

2. 3D Digital Twin

CesiumJS-based interactive 3D environment

Terrain and building visualization

Flood scenario visualization

Scenario controls

Infrastructure exposure visualization

Spatial context for disaster-management decision support

3. Flood Modelling & Data Integration

The modelling workflow is being extended beyond the initial terrain-based scenario approach.

Current development includes:

LiDAR integration for higher-resolution DEM/DTM generation

Rainfall data integration for event-based and scenario-driven analysis

Hydrological modelling for rainfall-runoff estimation

Hydrodynamic modelling workflow for flood propagation

Historical flood-event data for calibration and validation

Integration of model outputs with the 2D GIS and 3D Digital Twin

The objective is to move from a primarily relative susceptibility and scenario framework toward a more physically informed flood-modelling workflow.

4. Infrastructure Exposure

Spatial intersections are used to estimate potential exposure of:

Buildings

Roads

Critical infrastructure

Population and other assets where suitable datasets are available

5. GeoAI

GeoNarrative AI includes a conversational geospatial interaction layer for querying and interpreting project spatial information using natural language.

Example:

"Which areas have the highest building exposure under the extreme flood scenario?"

The GeoAI layer is designed to work with project data and analytical outputs rather than act as an independent source of flood predictions.

6. Automated Reporting

Selected spatial analyses and system outputs can be converted into structured technical reports.

Technology Stack

Domain

Technologies

Frontend

React, Next.js, TypeScript, Tailwind CSS

2D GIS

ArcGIS Maps SDK for JavaScript

3D GIS

CesiumJS

Spatial Visualization

Mapbox GL JS, deck.gl

Backend

Python, FastAPI, Uvicorn, Pydantic

Database

PostgreSQL, PostGIS

Geospatial Processing

ArcGIS Pro, Python

AI / ML

LangChain, LLM APIs, Hugging Face Transformers

Reporting

ReportLab

Infrastructure

Docker, Docker Compose, Nginx

System Architecture

Data Sources
(LiDAR, DEM, Rainfall, Rivers, LULC, Buildings, Roads, Flood Events)
                         |
                         v
             Geospatial Processing
          (ArcGIS Pro + Python)
                         |
                         v
                  PostgreSQL/PostGIS
                         |
              +----------+----------+
              |                     |
              v                     v
       2D GIS / ArcGIS       Flood Modelling
       Spatial Analysis      Hydrological +
       Exposure Analysis     Hydrodynamic
              |                     |
              +----------+----------+
                         |
                         v
                 3D Digital Twin
                    CesiumJS
                         |
              +----------+----------+
              |                     |
              v                     v
            GeoAI            Decision Support
      Natural-language       Maps / Exposure /
      spatial interaction    Reports / KPIs

Development Roadmap

Core Prototype

GIS-based flood susceptibility analysis

Spatial conditioning-factor processing

Building and road exposure analysis

Scenario-based inundation visualization

PostGIS spatial data management

CesiumJS 3D visualization

GeoAI-assisted spatial interaction

Automated reporting workflow

Current Development

LiDAR-derived high-resolution terrain

Rainfall data integration

Improved terrain-aware flood simulation

Hydrological modelling

Historical flood-event validation

Planned Improvements

Calibrated hydrodynamic modelling

Higher-resolution terrain and drainage representation

Real-time rainfall and river-level feeds

Improved population and critical-infrastructure exposure

ArcGIS Enterprise deployment

Operational disaster-management dashboards

Running the Project

Prerequisites

Node.js 18+

Python 3.10+

PostgreSQL 14+

PostGIS 3+

ArcGIS API key / ArcGIS Enterprise access where required

Cesium ion token where required

Backend

cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Linux / macOS
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

Frontend

cd frontend
npm install
npm run dev

Development application:http://localhost:3000

Project Positioning

GeoNarrative AI is a research and development platform exploring how GIS, 3D Digital Twins, flood modelling, spatial databases, and GeoAI can be combined for urban disaster decision support.

It should not be presented as an operational flood forecasting service unless the modelling components have been independently calibrated, validated, and approved for operational use.

Author

Harnish SavantM.Sc. Data Science & Spatial Analytics — Geo-IntelligenceSymbiosis Institute of Geoinformatics, Pune

