# GeoNarrative AI — Complete Technical Masterclass

## MASTER DOCUMENT · PART 2 OF 5

> **Scope:** Backend Masterclass · GIS & GeoIntelligence Masterclass

---

# SECTION 4 — BACKEND MASTERCLASS

## 4.1 FastAPI Fundamentals

### What is FastAPI?
FastAPI is a modern, high-performance Python web framework for building APIs. 

**Simple Analogy:** Think of FastAPI as a restaurant. The **routes** are the menu items, **Pydantic models** are the recipe cards that validate every order, and **Uvicorn** is the kitchen that cooks everything asynchronously (multiple orders at once).

### Why FastAPI Over Flask or Django?

| Feature | FastAPI | Flask | Django |
|---------|---------|-------|--------|
| Async Support | ✅ Native | ❌ Needs extension | ❌ Limited |
| Auto API Docs | ✅ Swagger + ReDoc | ❌ Manual | ❌ Manual |
| Type Validation | ✅ Pydantic built-in | ❌ Manual | ❌ Manual |
| Performance | ⚡ Fastest Python framework | 🐢 Slower | 🐢 Slower |
| Learning Curve | 📈 Moderate | 📉 Easy | 📈 Steep |
| Best For | APIs, Microservices | Simple apps | Full websites |

**Interview Answer:** "I chose FastAPI because it provides automatic request validation through Pydantic, native async support for non-blocking I/O operations like weather API calls, and auto-generated Swagger documentation at `/docs` which accelerates development and testing."

## 4.2 Backend Architecture — Your Project

### Entry Point: main.py
```python
app = FastAPI(
    title="GeoNarrative AI API",
    description="Conversational GeoAI Digital Twin Platform — Backend API",
    version="1.0.0",
    docs_url="/docs",     # Swagger UI at localhost:8000/docs
    redoc_url="/redoc",   # ReDoc at localhost:8000/redoc
)

# CORS — allows frontend (port 3000) to call backend (port 8000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://*.vercel.app"],
    allow_methods=["*"],   # GET, POST, PUT, DELETE, etc.
    allow_headers=["*"],   # Accept all headers
)

# Mount all routes under /api/v1 prefix
app.include_router(routes.router, prefix="/api/v1")
```

### What is CORS?
**Cross-Origin Resource Sharing.** When your frontend at `localhost:3000` tries to call your backend at `localhost:8000`, the browser blocks it by default (security feature). CORS middleware tells the browser "It's OK, I trust requests from these origins."

**Without CORS:** Browser shows `Access-Control-Allow-Origin` error.
**With CORS:** Requests flow normally between frontend and backend.

### Configuration: config.py
```python
class Settings(BaseSettings):
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    MAPBOX_TOKEN: str = os.getenv("MAPBOX_TOKEN", "")
    WEATHER_API_KEY: str = os.getenv("WEATHER_API_KEY", "")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./geonarrative.db")

    class Config:
        env_file = ".env"  # Auto-load from .env file
```

**Pydantic Settings** automatically:
1. Reads from `.env` file
2. Falls back to `os.getenv()` environment variables
3. Uses default values if neither exists
4. Validates types at startup

## 4.3 API Routes — Complete Endpoint Reference

### Route 1: Location Search
```python
@router.get("/locations/search")
async def search_location(q: str = Query(..., description="Search query")):
```
- **Method:** GET
- **URL:** `/api/v1/locations/search?q=pune`
- **Logic:** Searches a dictionary of 10 known cities (Pune, Mumbai, Chennai, Delhi, etc.)
- **Fallback:** If city not found, generates random coordinates near Pune
- **Response:** `{ "results": [{ "name": "Pune, Maharashtra, India", "lat": 18.52, "lng": 73.85 }] }`

### Route 2: File Upload
```python
@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
```
- **Method:** POST (multipart/form-data)
- **Accepts:** .geojson, .json, .csv, .shp, .kml files
- **Logic:**
  1. Validates file extension against allowlist
  2. Reads file bytes into memory
  3. If GeoJSON/JSON: Parses and counts features
  4. If CSV: Counts rows (minus header)
  5. If Shapefile: Generates random feature count (10-200)
- **Response:** `{ "id": "timestamp", "name": "file.shp", "features": 171, "status": "processed" }`

### Route 3: Analytics Data
```python
@router.get("/analytics")
async def get_analytics(location: str = Query(default="Pune")):
```
- **Returns:** Rainfall data (12 months), risk distribution (4 categories), infrastructure counts, population density, time series risk data
- **Data Structure:** Nested JSON matching the `AnalyticsData` TypeScript interface

### Route 4: Flood Zones
```python
@router.get("/flood-zones")
async def get_flood_zones(location: str = Query(default="Pune")):
```
- **Returns:** 4 risk zones with scores, areas, populations, descriptions
  - Riverside District (Critical, 9.2/10)
  - Low-Lying Basin (High, 7.8/10)
  - Industrial Corridor (Medium, 5.5/10)
  - Hilltop Residential (Low, 2.1/10)

### Route 5: GeoJSON Generator
```python
@router.get("/map/geojson")
async def get_geojson(
    center_lng: float = 73.8567,
    center_lat: float = 18.5204,
    layer: str = "risk-points",
    count: int = 100,  # 1-500 points
):
```
- **Logic:** Generates `count` random GeoJSON Point features within ~10km of center
- **Each feature has:** coordinates, riskScore (0-10), riskLevel, name, elevation, rainfall
- **Output:** Valid GeoJSON FeatureCollection
- **Use Case:** Populates map with data points for visualization

### Route 6: AI Chat
```python
@router.post("/chat")
async def chat(request: ChatRequest):
```
- **Input:** `{ "message": "Analyze flood risk", "location": "Pune" }`
- **Logic:** Keyword-based intent detection:
  - "flood" + "risk" → Flood risk analysis with zone table
  - "hospital"/"infrastructure" → Infrastructure vulnerability report
  - "rainfall"/"weather" → Rainfall statistics
  - "mitigation"/"recommend" → Strategic recommendations
  - Default → General overview with capabilities menu
- **Output:** Markdown-formatted response + metadata

### Route 7: ML Prediction
```python
@router.post("/predict")
async def predict_risk(request: PredictionRequest):
```
- **Input Parameters:** rainfall, elevation, land_use, water_bodies, population_density, drainage_capacity
- **Algorithm:** Weighted multi-factor scoring:
  ```
  score = (rainfall_factor × 0.30) + (elevation_factor × 0.25) +
          (land_use_factor × 0.20) + (drainage_factor × 0.15) +
          (density_factor × 0.10)
  ```
- **Output:** Risk level (low/medium/high/critical), score (0-10), factor breakdown, recommendations

### Route 8: Weather (Live API)
```python
@router.get("/weather")
async def get_weather(lat: float, lon: float, location: str):
```
- **External API:** OpenWeatherMap (current weather + 5-day forecast)
- **Async HTTP:** Uses `httpx.AsyncClient` for non-blocking requests
- **Flood Impact Assessment:** `_assess_flood_impact()` evaluates:
  - Humidity > 80% → +3 risk points
  - Rainfall > 20mm/h → +4 risk points (flash flood)
  - Wind > 15m/s → +2 risk points (storm)
- **Fallback:** Returns mock weather data if API key missing or request fails

### Route 9: Report Generation
```python
@router.post("/reports/generate")
async def generate_report(request: ReportRequest):
```
- **Output:** Structured report with sections: Executive Summary, Risk Zone Analysis, Infrastructure Impact, Mitigation Recommendations

## 4.4 Async Programming

### What Does `async` Mean?
```python
# Synchronous (blocking) — waits for each operation
def get_weather():
    data1 = requests.get(current_url)    # Waits 500ms
    data2 = requests.get(forecast_url)   # Waits 500ms
    return data1, data2                   # Total: 1000ms

# Asynchronous (non-blocking) — runs concurrently
async def get_weather():
    async with httpx.AsyncClient() as client:
        data1 = await client.get(current_url)   # Starts request
        data2 = await client.get(forecast_url)  # Starts immediately
        return data1, data2                      # Total: ~500ms
```

**Analogy:** Synchronous is like a single cashier serving one customer at a time. Asynchronous is like a cashier who takes an order, sends it to the kitchen, and immediately takes the next order while the first one cooks.

## 4.5 Pydantic Models — Request/Response Validation

```python
class PredictionRequest(BaseModel):
    rainfall: float = 245.0          # Default value
    elevation: float = 540.0
    land_use: str = "urban"
    water_bodies: int = 23
    population_density: float = 9500.0
    drainage_capacity: float = 60.0
    location: Optional[str] = None   # Optional field
```

**What Pydantic does:**
1. If someone sends `rainfall: "abc"` → Returns `422 Unprocessable Entity` with clear error
2. If someone omits `rainfall` → Uses default `245.0`
3. Auto-generates JSON Schema for Swagger docs
4. Provides type hints for IDE autocomplete

## 4.6 Backend Folder Structure

```
backend/
├── main.py              # Entry point — creates FastAPI app, adds CORS, mounts routes
├── requirements.txt     # Python dependencies (7 packages)
├── .env                 # Secret keys (not committed to Git)
├── .env.example         # Template for .env
└── app/
    ├── __init__.py      # Makes 'app' a Python package
    ├── api/
    │   ├── __init__.py
    │   └── routes.py    # ALL API endpoints (717 lines)
    ├── core/
    │   ├── __init__.py
    │   └── config.py    # Settings with Pydantic BaseSettings
    ├── models/
    │   └── __init__.py  # Data models (currently empty — models in routes.py)
    └── services/
        └── __init__.py  # Business logic (currently empty — logic in routes.py)
```

## 4.7 Dependencies (requirements.txt)

| Package | Version | Purpose |
|---------|---------|---------|
| `fastapi` | 0.110.0 | Web framework |
| `uvicorn[standard]` | 0.29.0 | ASGI server (runs the app) |
| `pydantic` | 2.7.0 | Data validation |
| `pydantic-settings` | 2.2.0 | Environment config management |
| `python-multipart` | 0.0.9 | File upload support |
| `python-dotenv` | 1.0.0 | Load .env files |
| `httpx` | 0.27.0 | Async HTTP client (for weather API) |

---

# SECTION 5 — GIS & GEOINTELLIGENCE MASTERCLASS

## 5.1 GIS Fundamentals

### What is GIS?
**Geographic Information System** — a system for capturing, storing, analyzing, and visualizing geographic (location-based) data. Everything that has a location on Earth can be part of a GIS.

**Simple Analogy:** GIS is like a stack of transparent maps layered on top of each other. One layer shows roads, another shows buildings, another shows rivers, another shows flood zones. You can turn layers on/off and analyze how they interact.

### Why GIS Matters for This Project
GeoNarrative AI is fundamentally a **GIS application**. Every feature revolves around spatial data:
- Map rendering → displaying geographic layers
- Flood risk → spatial analysis of elevation + water + population
- File upload → ingesting spatial datasets (GeoJSON, Shapefiles)
- AI chat → answering questions about geographic phenomena

## 5.2 Coordinate Systems

### What is a Coordinate System?
A way to specify any location on Earth using numbers. The most common is **WGS84 (EPSG:4326)**:

```
Pune, India → Latitude: 18.5204, Longitude: 73.8567
New York, USA → Latitude: 40.7128, Longitude: -74.0060
```

- **Latitude:** North-South position (-90° to +90°). Equator = 0°.
- **Longitude:** East-West position (-180° to +180°). Prime Meridian (Greenwich) = 0°.

### In Your Project
```typescript
// frontend/src/lib/config.ts
defaultCenter: [73.8567, 18.5204] as [number, number] // [lng, lat] — Mapbox format!
```

**Critical Note:** Mapbox uses `[longitude, latitude]` order (GeoJSON standard), while Google Maps uses `[latitude, longitude]`. Mixing these up is one of the most common GIS bugs!

### EPSG Codes
- **EPSG:4326** — WGS84 geographic coordinates (what GPS uses, what your project uses)
- **EPSG:3857** — Web Mercator (what Google/Mapbox tiles use for display)
- **EPSG:32643** — UTM Zone 43N (for precise measurements in meters near Pune)

## 5.3 Raster vs Vector Data

### Vector Data (What Your Project Uses)
- **Points:** Hospital locations, sensor positions, risk markers
- **Lines:** Rivers, roads, pipes, transit routes
- **Polygons:** Flood zones, city boundaries, land use areas
- **Format:** GeoJSON, Shapefiles, KML

```json
// GeoJSON Point Example (from your /api/v1/map/geojson endpoint)
{
  "type": "Feature",
  "geometry": {
    "type": "Point",
    "coordinates": [73.856234, 18.520891]
  },
  "properties": {
    "riskScore": 7.8,
    "riskLevel": "high",
    "name": "Sensor 42",
    "elevation": 540
  }
}
```

### Raster Data (Not Used Directly, But Important to Know)
- **What:** Grid of pixels, each with a value (like a photograph)
- **Examples:** Satellite imagery, Digital Elevation Models (DEM), temperature maps
- **Formats:** GeoTIFF, NetCDF, HDF5
- **Interview Note:** "In production, I would integrate raster DEMs for precise elevation analysis rather than using scalar elevation values."

## 5.4 GeoJSON Deep Dive

GeoJSON is the **primary spatial data format** in web GIS. Your project uses it extensively.

### Structure
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",               // or LineString, Polygon
        "coordinates": [73.85, 18.52]  // [lng, lat]
      },
      "properties": {
        "name": "Riverside District",
        "riskScore": 9.2,
        "population": 45000
      }
    }
  ]
}
```

### Geometry Types
| Type | Example | Use in Your Project |
|------|---------|-------------------|
| Point | `[73.85, 18.52]` | Risk markers, sensors, infrastructure locations |
| LineString | `[[73.1,18.1],[73.2,18.3],[73.4,18.5]]` | Rivers, roads, utility pipes |
| Polygon | `[[[73.1,18.1],[73.2,18.3],[73.4,18.5],[73.1,18.1]]]` | Flood zones, city boundaries |
| MultiPoint | Multiple points | Cluster of sensors |
| MultiPolygon | Multiple polygons | Non-contiguous flood areas |

### How Your Backend Generates GeoJSON
```python
# routes.py — /map/geojson endpoint
for i in range(count):
    angle = random.random() * 2 * math.pi
    distance = random.random() * 0.09  # ~10km radius
    lng = center_lng + distance * math.cos(angle)
    lat = center_lat + distance * math.sin(angle)
    # Creates circular distribution of points around city center
```
This uses **polar coordinates** to distribute points randomly within a 10km radius of the city center. The formula converts from (angle, distance) to (x, y) offsets.

## 5.5 Shapefiles

### What is a Shapefile?
The most common GIS format, created by Esri. A single "shapefile" is actually **4+ files**:

| File | Purpose |
|------|---------|
| `.shp` | The geometry (points, lines, polygons) |
| `.shx` | Spatial index for fast lookup |
| `.dbf` | Attribute data (like a spreadsheet) |
| `.prj` | Coordinate system definition |

### In Your Project
```python
# Backend: routes.py — upload endpoint
elif ext == ".shp":
    features_count = random.randint(10, 200)
    # In production: use geopandas or fiona to parse the shapefile
```

**Production Enhancement:** Use `geopandas` to read shapefiles:
```python
import geopandas as gpd
gdf = gpd.read_file("uploaded.shp")
features_count = len(gdf)
crs = gdf.crs  # e.g., EPSG:4326
```

## 5.6 Spatial Operations (Concepts)

### Buffering
Creating a zone around a feature. Example: "Show me everything within 500 meters of a river."
```
River (line) → Buffer(500m) → Polygon around river
```

### Spatial Join
Combining two datasets based on their location. Example: "How many hospitals are inside flood zones?"
```
Hospitals (points) + Flood Zones (polygons) → Join where point is inside polygon
```

### Intersection
Finding where two areas overlap. Example: "Where do flood zones overlap with residential areas?"

### In Your Project (Frontend)
```typescript
// package.json includes @turf/turf for client-side spatial operations
"@turf/turf": "^7.0.0"
```
**Turf.js** is a geospatial analysis library for JavaScript. It can perform buffering, spatial joins, distance calculations, and more — all in the browser.

## 5.7 Map Rendering Pipeline

### How Mapbox GL Renders Maps

```
1. Browser requests vector tiles from Mapbox servers
   URL: mapbox://styles/mapbox/dark-v11
   ↓
2. Tiles arrive as Protocol Buffers (compact binary)
   Each tile = 256x256 pixel area of the world
   ↓
3. WebGL renders tiles on HTML Canvas
   GPU-accelerated for smooth panning/zooming
   ↓
4. Custom layers are added on top:
   - GeoJSON sources (your risk points)
   - Heatmap layers (risk density)
   - Circle layers (infrastructure)
   - Fill layers (flood zones)
   - Line layers (rivers, roads)
   ↓
5. User interactions handled via event listeners:
   map.on("click", "risk-points", (e) => { showPopup() })
```

### Map Styles in Your Project
```typescript
// 5 available styles
const MAP_STYLES = {
  dark: "mapbox://styles/mapbox/dark-v11",        // Default — best for data viz
  satellite: "mapbox://styles/mapbox/satellite-streets-v12",
  light: "mapbox://styles/mapbox/light-v11",
  streets: "mapbox://styles/mapbox/streets-v12",
  outdoors: "mapbox://styles/mapbox/outdoors-v12",
};
```

## 5.8 Map Layers in Your Project

Each dashboard mode has its own set of layers:

### Flood Mode Layers
| Layer ID | Type | Color | Purpose |
|----------|------|-------|---------|
| flood-zones | fill | Blue | Shaded flood risk polygons |
| risk-heatmap | heatmap | Red | Heat density of risk points |
| rivers | line | Cyan | River paths |
| sensors | circle | Green | IoT flood sensors |
| infrastructure | circle | Amber | Hospitals, schools |
| elevation | line | Purple | Contour lines |

### Traffic Mode Layers
| Layer ID | Type | Color | Purpose |
|----------|------|-------|---------|
| traffic-flow | line | Amber | Road congestion |
| congestion-heat | heatmap | Red | Bottleneck density |
| transit-routes | line | Cyan | Bus/metro routes |
| intersections | circle | Green | Signal locations |
| construction | circle | Orange | Work zones |
| parking | circle | Purple | Parking areas |

## 5.9 Digital Twins

### What is a Digital Twin?
A **digital replica** of a physical entity (city, building, infrastructure) that is continuously updated with real data.

**Simple Analogy:** Imagine a mirror image of your entire city inside a computer. Every building, road, pipe, and sensor exists as a digital copy. When it rains in the real city, the digital twin's rainfall data updates. When a pipe breaks, the twin shows the break.

### How Your Project Is a Digital Twin
GeoNarrative AI creates a **geospatial digital twin** of cities:
1. **Geographic Layer:** Map with real coordinates (Mapbox tiles)
2. **Infrastructure Layer:** Hospitals, schools, power plants (data overlay)
3. **Environmental Layer:** Rainfall, elevation, rivers (analytics)
4. **Risk Layer:** Flood zones, risk scores (AI-computed)
5. **Temporal Layer:** Historical data + predictions (time series)
6. **Conversational Layer:** AI chat interface to query the twin

---

**→ Continue to PART 3: AI & ML Masterclass + Database Masterclass**
