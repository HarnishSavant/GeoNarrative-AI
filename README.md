# 🌍 GeoNarrative AI — Conversational GeoAI Digital Twin Platform

> AI-powered geospatial intelligence platform for smart-city analytics, flood risk prediction, and conversational GIS insights.

![GeoNarrative AI](https://img.shields.io/badge/GeoNarrative-AI-6366f1?style=for-the-badge&logo=globe&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?style=for-the-badge&logo=fastapi)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)
![Mapbox](https://img.shields.io/badge/Mapbox-GL-4264fb?style=for-the-badge&logo=mapbox)

## ✨ Features

- 🗺️ **Interactive Map** — Mapbox GL with flood zones, heatmaps, and data layers
- 🤖 **AI Chat Assistant** — Conversational GIS with natural language queries
- 📊 **Analytics Dashboard** — KPI cards, charts, and risk gauges
- 🌊 **Flood Risk Prediction** — ML-based multi-factor risk analysis
- 📁 **GIS Data Upload** — GeoJSON, CSV, Shapefile, KML support
- 📋 **Report Generation** — AI-generated risk assessment reports
- 🎨 **Modern SaaS UI** — Glassmorphism, animations, dark mode

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and **npm**
- **Python** 3.10+
- **Mapbox Access Token** (free at [mapbox.com](https://account.mapbox.com/access-tokens/))

### 1. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
copy .env.example .env.local

# Add your Mapbox token to .env.local:
# NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1...your_token_here

# Start development server
npm run dev
```

Frontend runs at **http://localhost:3000**

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate     # Windows
# source venv/bin/activate  # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Start server
python main.py
# OR
uvicorn main:app --reload --port 8000
```

Backend runs at **http://localhost:8000**
API docs at **http://localhost:8000/docs**

## 🏗️ Project Structure

```
geonarrative-ai/
├── frontend/                   # Next.js Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx      # Root layout
│   │   │   ├── page.tsx        # Main dashboard page
│   │   │   └── globals.css     # Global styles
│   │   ├── components/
│   │   │   ├── Sidebar.tsx     # Navigation sidebar
│   │   │   ├── TopNav.tsx      # Top navigation bar
│   │   │   ├── MapView.tsx     # Mapbox GL map
│   │   │   ├── KPICard.tsx     # KPI metric cards
│   │   │   ├── AnalyticsCharts.tsx  # Recharts analytics
│   │   │   ├── AIChatPanel.tsx # AI chat interface
│   │   │   ├── FileUpload.tsx  # Drag-and-drop upload
│   │   │   ├── FloodRiskTable.tsx   # Risk zones table
│   │   │   ├── MapLayersPanel.tsx   # Layer toggles
│   │   │   ├── PredictionPanel.tsx  # ML prediction
│   │   │   ├── ReportsPanel.tsx     # Report generation
│   │   │   ├── RightPanel.tsx       # Intelligence panel
│   │   │   └── SettingsPanel.tsx    # Settings
│   │   └── lib/
│   │       ├── types.ts        # TypeScript types
│   │       ├── config.ts       # App configuration
│   │       └── mockData.ts     # Demo data
│   ├── tailwind.config.ts
│   └── package.json
├── backend/                    # FastAPI Backend
│   ├── app/
│   │   ├── api/
│   │   │   └── routes.py       # All API endpoints
│   │   ├── core/
│   │   │   └── config.py       # Backend config
│   │   ├── services/           # Business logic
│   │   └── models/             # Data models
│   ├── main.py                 # FastAPI entry point
│   └── requirements.txt
└── README.md
```

## 🔑 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/locations/search?q=` | Search locations |
| POST | `/api/v1/upload` | Upload GIS files |
| GET | `/api/v1/analytics` | Get analytics data |
| GET | `/api/v1/analytics/kpi` | Get KPI metrics |
| GET | `/api/v1/flood-zones` | Get flood risk zones |
| GET | `/api/v1/map/layers` | Get map layer config |
| GET | `/api/v1/map/geojson` | Get GeoJSON data |
| POST | `/api/v1/chat` | AI chat endpoint |
| POST | `/api/v1/predict` | Run ML prediction |
| POST | `/api/v1/reports/generate` | Generate report |

## 🛠️ Tech Stack

**Frontend:** Next.js 14, React 18, TypeScript, Tailwind CSS, Mapbox GL JS, Recharts, Framer Motion, Lucide Icons

**Backend:** FastAPI, Python, Pydantic, Uvicorn

**AI/ML:** Gemini API (optional), Simulated ML models

## 📝 Notes

- The platform works with demo data out of the box
- Add a **Mapbox token** for the full interactive map experience
- Add a **Gemini API key** for enhanced AI chat responses
- Without these keys, the platform uses beautiful fallback visualizations

## 📄 License

MIT License — Built for educational and demonstration purposes.
