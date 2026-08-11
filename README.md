🌊 GeoNarrative AI

An Integrated GIS, 3D Digital Twin & GeoAI Framework for Urban Flood Decision Support in Pune

<p align="center">

GIS-FIRST • 3D DIGITAL TWIN • FLOOD MODELLING • GEOAI

<br>

An evolving geospatial platform for exploring urban flood susceptibility, scenario inundation, infrastructure exposure, and spatial decision support.

</p>

🌍 Project Vision

GeoNarrative AI brings together the analytical power of GIS with immersive 3D visualization and AI-assisted spatial exploration.

The project began as a GIS-based flood susceptibility and exposure prototype for the Pune Municipal Corporation and is now being extended toward a more physically informed flood-modelling platform using LiDAR-derived terrain, rainfall data, hydrological modelling, and hydrodynamic modelling.

The central idea is:

GIS provides the spatial intelligence. 3D provides the context. GeoAI makes the intelligence easier to explore.

✨ What GeoNarrative AI Does

Capability

What it provides

🗺️ GIS Analysis

Flood susceptibility and spatial conditioning analysis

🏔️ High-Resolution Terrain

LiDAR-based terrain development

🌧️ Rainfall Integration

Event and scenario rainfall inputs

🌊 Flood Modelling

Hydrological / hydrodynamic modelling workflow

🏢 Exposure Analysis

Building and road exposure assessment

🌐 2D Web GIS

Interactive spatial exploration

🌎 3D Digital Twin

Terrain, buildings and flood scenarios

🤖 GeoAI

Natural-language interaction with spatial information

📊 Decision Support

Scenario comparison, analytics and reporting

📄 Automated Reporting

Generation of structured technical reports

🧭 System Workflow

                    🌍 GEOSPATIAL DATA
                           │
          ┌────────────────┼────────────────┐
          │                │                │
        LiDAR           Rainfall       GIS Layers
          │                │        Rivers • LULC
          │                │        Buildings • Roads
          └────────────────┼────────────────┘
                           ▼
                 🛠️ GEOSPATIAL PROCESSING
                  ArcGIS Pro • Python
                           │
                           ▼
                 🗄️ SPATIAL DATA PLATFORM
                     PostgreSQL + PostGIS
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
       🗺️ 2D GIS ANALYSIS          🌧️ FLOOD MODELLING
       Susceptibility               Hydrological
       Spatial Queries              Hydrodynamic
       Exposure                     Scenario Analysis
             │                           │
             └─────────────┬─────────────┘
                           ▼
                   🌎 3D DIGITAL TWIN
                        CesiumJS
                           │
                 ┌─────────┴─────────┐
                 ▼                   ▼
              🤖 GeoAI          📊 Decision Support
          Spatial Questions     Exposure • Maps
          Natural Language      Analytics • Reports

🗺️ 1. GIS & Spatial Analysis

The analytical foundation of GeoNarrative AI is built around geospatial data and GIS workflows.

Core analysis

Flood susceptibility mapping

Raster reclassification and overlay

Terrain analysis

Drainage proximity analysis

Land-use / land-cover analysis

Building-density analysis

Infrastructure exposure

Spatial intersection and querying

Esri ecosystem

ArcGIS Pro is used for core geospatial processing and spatial analysis, while ArcGIS Enterprise / ArcGIS Maps SDK for JavaScript provide the foundation for enterprise-oriented web GIS integration.

🏔️ 2. LiDAR & High-Resolution Terrain

A major current development direction is the integration of LiDAR-derived terrain data.

The goal is to improve the representation of:

Urban elevation

Micro-topography

Drainage pathways

Low-lying areas

Building surroundings

Local surface variations

The LiDAR workflow is intended to provide a higher-resolution terrain foundation for the next generation of the flood model.

Current status: LiDAR integration is under active development.

🌧️ 3. Rainfall & Flood Modelling

The project is being extended beyond the original terrain-based scenario approach by introducing rainfall as an important flood-driving input.

Development direction

Rainfall
   ↓
Rainfall–Runoff Response
   ↓
Hydrological Model
   ↓
Flow / Discharge
   ↓
Hydrodynamic Model
   ↓
Flood Extent / Depth
   ↓
Infrastructure Exposure

The objective is to gradually move from a primarily relative susceptibility and scenario framework toward a more physically informed flood-modelling workflow.

Planned model improvements

Event-based rainfall inputs

Rainfall–runoff modelling

River / drainage inputs

Flood depth estimation

Spatial flood propagation

Historical event calibration

Quantitative validation

Important: Hydrological and hydrodynamic modelling components are currently under development and should not be presented as fully calibrated operational forecasting models until validation is completed.

🌊 4. Flood Susceptibility & Scenario Analysis

The initial susceptibility framework uses spatial conditioning factors such as:

Elevation

Slope

Distance to waterways

Land-use / land-cover imperviousness

Building density

These factors are standardized and combined through a GIS-based multicriteria workflow to generate a relative flood susceptibility surface.

The platform also supports severity-based scenario visualization for comparing potential spatial exposure.

🏢 5. Infrastructure Exposure

Flood scenarios are connected with real-world urban assets using spatial operations.

Exposure targets

🏢 Buildings

🛣️ Roads

🏥 Critical infrastructure

👥 Population

🏙️ Other assets where appropriate data are available

Example workflow:

Flood Scenario
      ↓
Spatial Intersection
      ↓
Buildings / Roads / Assets
      ↓
Exposure Statistics
      ↓
Decision Support

This moves the analysis from:

“Where could flooding occur?”

to:

“What could be affected?”

🌎 6. 3D Digital Twin Command Center

The 3D environment is powered by CesiumJS.

It brings together:

High-resolution terrain

Buildings

Roads

Water features

Flood scenarios

Exposure information

Interactive spatial controls

The goal is not simply to create a visually attractive 3D map.

The 3D environment provides spatial context for understanding how terrain, infrastructure and flood conditions interact.

GIS provides the analysis; the Digital Twin provides the context.

🤖 7. GeoAI Spatial Assistant

GeoNarrative AI adds a conversational interface over the project's spatial information.

Instead of manually searching through multiple layers, users can ask questions such as:

“Which areas have the highest building exposure under the extreme scenario?”

or

“Show the critical infrastructure near the affected flood area.”

The GeoAI layer is intended to work with the project's spatial database, analytical outputs and available tools.

Design principle

GeoAI assists spatial exploration; it does not replace the underlying GIS analysis.

📊 8. Spatial Decision Support

The different components are brought together into a single decision-support workflow.

GIS Data
   ↓
Spatial Analysis
   ↓
Flood Modelling
   ↓
Exposure Assessment
   ↓
2D GIS + 3D Digital Twin
   ↓
GeoAI Interaction
   ↓
Decision Support

The platform is designed for potential use by:

Municipal corporations

Disaster-management authorities

Urban planners

GIS analysts

Infrastructure managers

Smart-city teams

Researchers

🧰 Technology Stack

GIS & 3D

ArcGIS Pro · ArcGIS Enterprise · ArcGIS Maps SDK for JavaScript · CesiumJS · Mapbox GL JS · deck.gl

Geospatial Data

LiDAR · DEM/DTM · Raster Data · Vector Data · Remote Sensing · OSM

Backend

Python · FastAPI · Uvicorn · Pydantic · SQLAlchemy

Spatial Database

PostgreSQL · PostGIS

AI / ML

LangChain · LLM APIs · Hugging Face Transformers

Frontend

React · Next.js · TypeScript · Tailwind CSS

Engineering

Docker · Docker Compose · Nginx

Reporting

ReportLab

🏗️ Architecture

┌─────────────────────────────────────────────────────────┐
│                    DATA SOURCES                         │
│ LiDAR │ Rainfall │ DEM │ Rivers │ LULC │ Buildings │ Roads │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              GEOSPATIAL PROCESSING                      │
│              ArcGIS Pro • Python                        │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                 POSTGRESQL + POSTGIS                    │
│       Spatial Data • Queries • Exposure • Outputs       │
└─────────────────────────┬───────────────────────────────┘
                          │
              ┌───────────┴───────────┐
              ▼                       ▼
┌────────────────────────┐  ┌─────────────────────────────┐
│       2D GIS            │  │       FLOOD MODELLING      │
│ ArcGIS / Web GIS        │  │ Hydrological               │
│ Spatial Analysis        │  │ Hydrodynamic               │
│ Exposure Analysis       │  │ Scenario Simulation         │
└────────────┬───────────┘  └─────────────┬───────────────┘
             │                            │
             └────────────┬───────────────┘
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  3D DIGITAL TWIN                       │
│                       CesiumJS                          │
└─────────────────────────┬───────────────────────────────┘
                          │
             ┌────────────┴────────────┐
             ▼                         ▼
┌───────────────────────┐   ┌─────────────────────────────┐
│        GeoAI          │   │    DECISION SUPPORT         │
│ Spatial Questions     │   │ Maps • Exposure • Reports   │
│ Natural Language      │   │ Analytics • KPIs            │
└───────────────────────┘   └─────────────────────────────┘

🚀 Development Roadmap

✅ Core Prototype

GIS-based flood susceptibility workflow

Spatial conditioning-factor processing

Building and road exposure analysis

Scenario-based inundation visualization

PostgreSQL/PostGIS spatial database

CesiumJS 3D visualization

GeoAI-assisted spatial interaction

Automated reporting

🔄 Currently Developing

LiDAR-derived high-resolution terrain

Rainfall data integration

Improved terrain-aware flood simulation

Hydrological modelling

Historical flood-event validation

🔮 Next Stage

Calibrated hydrodynamic modelling

Higher-resolution drainage representation

Real-time rainfall and river-level feeds

Flood depth and velocity analysis

Improved population and critical-infrastructure exposure

ArcGIS Enterprise deployment

Operational disaster-management dashboards

💻 Quick Start

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

Open:

http://localhost:3000

📌 Project Status

Research + Active Development

GeoNarrative AI is evolving from a research prototype into a more advanced geospatial flood-modelling and decision-support platform.

The current development priority is:

LiDAR → Rainfall → Hydrological Modelling → Hydrodynamic Modelling → 3D Digital Twin → GeoAI Decision Support

👨‍💻 Author

Harnish Savant

M.Sc. Data Science & Spatial Analytics — Geo-IntelligenceSymbiosis Institute of Geoinformatics, Pune

Research Focus:GIS • Spatial Analytics • Urban Flood Modelling • Digital Twins • GeoAI • Spatial Decision Support

🌐 GeoNarrative AI

Engineering the future of resilient and spatially intelligent cities.
