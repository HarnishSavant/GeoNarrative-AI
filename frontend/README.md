# GeoNarrative Digital Twin: WebGIS Frontend

This is Phase 2 of the GeoNarrative Digital Twin platform. It is a research-grade React/Mapbox application that connects directly to the high-performance FastAPI PostGIS backend to render massive spatial datasets on the fly.

## Technology Stack
- **React 18 & Vite**
- **TypeScript**
- **Mapbox GL JS** (Vector/GeoJSON WebGL Rendering)
- **Tailwind CSS** (UI/UX)
- **Zustand** (State Management)
- **Axios** (API Client)

---

## 1. Environment Variable Setup

If you wish to use your own Mapbox Token, create a `.env` file in the root of the `frontend` directory:

```env
VITE_MAPBOX_TOKEN=your_mapbox_token_here
```
*(If no token is provided, a public demonstration token is used by default).*

## 2. Installation Instructions

Open a new command prompt and navigate to the frontend directory:

```cmd
cd d:\sem3\geonarrative-ai\frontend
npm install
```
*(This will install Mapbox, Tailwind, Zustand, and all React dependencies).*

## 3. Run Instructions

Make sure your **FastAPI Backend** is running in a separate terminal:
```cmd
cd d:\sem3\geonarrative-ai\backend
python main.py
```

Then, start the **React Frontend**:
```cmd
cd d:\sem3\geonarrative-ai\frontend
npm run dev
```

Visit the Digital Twin dashboard in your browser at the URL provided by Vite (usually `http://localhost:5173`).

---

## Architecture Features Implemented
1. **Lazy Loading**: Limits are applied to buildings and roads during initial load to prevent browser freezing while maintaining scientific demonstration capability.
2. **Dynamic Risk Styling**: Mapbox data-driven styling perfectly maps the Jenks Natural Breaks classification to colors dynamically based on the `risk_class` GeoJSON property.
3. **Marker Clustering**: Implemented native Mapbox clustering for 15,000+ POIs to ensure fluid zoom operations.
4. **State Management**: The UI is decoupled from the map using Zustand, allowing the Sidebar switches to effortlessly toggle WebGL layers.
