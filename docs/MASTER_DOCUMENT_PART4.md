# GeoNarrative AI — Complete Technical Masterclass

## MASTER DOCUMENT · PART 4 OF 5

> **Scope:** Cloud & Deployment · End-to-End Project Flow · Interview Preparation

---

# SECTION 9 — CLOUD & DEPLOYMENT MASTERCLASS

## 9.1 Current Deployment Architecture

```
LOCAL DEVELOPMENT
├── Frontend → npm run dev → localhost:3000 (Next.js dev server)
└── Backend  → python main.py → localhost:8000 (Uvicorn ASGI)
```

## 9.2 Production Deployment Plan

```
PRODUCTION ARCHITECTURE
┌────────────────────┐     ┌────────────────────┐
│   VERCEL            │     │   RENDER            │
│   (Frontend)        │     │   (Backend)         │
│                     │     │                     │
│   Next.js SSR       │────→│   FastAPI + Uvicorn │
│   Edge CDN          │     │   Docker Container  │
│   Auto HTTPS        │     │   Auto HTTPS        │
│   Preview Deploys   │     │   Health Checks     │
│                     │     │                     │
│   Cost: FREE tier   │     │   Cost: FREE tier   │
└────────────────────┘     └──────────┬───────────┘
                                      │
                           ┌──────────▼───────────┐
                           │   SUPABASE            │
                           │   (Database)          │
                           │                       │
                           │   PostgreSQL + PostGIS │
                           │   REST API            │
                           │   Auth                │
                           │   Cost: FREE tier     │
                           └───────────────────────┘
```

## 9.3 Vercel (Frontend Hosting)

### What is Vercel?
The company that created Next.js. Their platform is optimized for deploying Next.js apps with zero configuration.

### Deployment Steps
```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy from frontend directory
cd frontend
vercel

# 3. Set environment variables in Vercel dashboard
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1...
NEXT_PUBLIC_API_URL=https://geonarrative-api.onrender.com
NEXT_PUBLIC_GEMINI_KEY=AIza...
```

### What Vercel Provides
| Feature | Benefit |
|---------|---------|
| Edge CDN | Static assets served from nearest server globally |
| Serverless Functions | API routes run as serverless functions |
| Preview Deployments | Every Git branch gets its own URL |
| Auto HTTPS | SSL certificates managed automatically |
| Analytics | Web Vitals performance tracking |

## 9.4 Render (Backend Hosting)

### Deployment with Docker
```dockerfile
# Dockerfile for backend
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Docker Explained
**Analogy:** Docker is like a shipping container. Just as a shipping container can hold any goods and fits on any ship, a Docker container holds your application with all its dependencies and runs on any server.

```
Without Docker:
  "It works on my machine but not on the server"
  (Different Python versions, missing packages, OS differences)

With Docker:
  "It works everywhere identically"
  (Same Python, same packages, same OS — always)
```

## 9.5 Environment Variables & Secrets

```bash
# Frontend (.env.local) — NEVER commit to Git
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1...    # Map rendering
NEXT_PUBLIC_GEMINI_KEY=AIza...          # AI chat (optional)
NEXT_PUBLIC_API_URL=http://localhost:8000  # Backend URL

# Backend (.env) — NEVER commit to Git
GEMINI_API_KEY=AIza...                  # Server-side AI
MAPBOX_TOKEN=pk.eyJ1...                # Server-side geocoding
WEATHER_API_KEY=abc123...               # OpenWeatherMap
DATABASE_URL=postgresql://...           # Database connection
```

**NEXT_PUBLIC_ prefix:** In Next.js, only variables starting with `NEXT_PUBLIC_` are exposed to the browser. Variables without this prefix stay server-side only.

## 9.6 CI/CD Pipeline

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ Developer │───→│ Git Push │───→│ GitHub   │───→│ Auto     │
│ commits   │    │ to main  │    │ Actions  │    │ Deploy   │
└──────────┘    └──────────┘    │ (CI/CD)  │    │ Vercel/  │
                                │          │    │ Render   │
                                │ • Lint   │    └──────────┘
                                │ • Test   │
                                │ • Build  │
                                └──────────┘
```

---

# SECTION 10 — END-TO-END PROJECT FLOW

## 10.1 Flow: User Uploads GeoJSON File

```
STEP 1: USER ACTION
├── User clicks "Upload Data" in sidebar
├── Sidebar sets activeTab = "upload"
├── AnimatePresence slides in FileUpload panel (340px)

STEP 2: FILE SELECTION
├── User drags file onto dropzone (react-dropzone)
├── onDrop callback fires with File object
├── Client validates: .geojson/.json/.csv/.shp/.kml only
├── Shows upload progress animation

STEP 3: BACKEND PROCESSING
├── POST /api/v1/upload (multipart/form-data)
├── FastAPI validates file extension against allowlist
├── Reads file bytes into memory
├── If GeoJSON: json.loads() → count features
├── If CSV: split by newlines → count rows
├── Returns: { id, name, type, size, features, status }

STEP 4: STATE UPDATE (Frontend)
├── handleFileUpload(file) called in page.tsx
├── uploadedFiles state updated: [...prev, file]
├── New MapLayer created:
│   { id: "custom-uploaded-{id}", color: "#ec4899", visible: true }
├── mapLayers state updated: [...prev, newCustomLayer]

STEP 5: MAP VIEW UPDATE
├── MapView receives updated layers prop
├── isCustomActive = layers.some(l => l.id.startsWith("custom-"))
├── If true:
│   ├── Background shifts to dark satellite gradient
│   ├── Grid density increases (30px spacing)
│   ├── Laser scan-line animation starts
│   └── 4 HUD corner panels appear

STEP 6: DASHBOARD BANNER
├── uploadedFiles.length > 0 triggers banner render
├── Shows: filename, feature count, risk score, zoning overlap
├── "View Analyst Insights" button → setActiveTab("chat")

STEP 7: UPLOAD SUCCESS CARD
├── FileUpload shows green "Dataset Successfully Indexed!" card
├── "📊 Go to Dashboard" button → onNavigate("dashboard")
├── "💬 Chat with Analyst" button → onNavigate("chat")

STEP 8: AI CHAT INTEGRATION
├── User navigates to AI Assistant tab
├── AIChatPanel mounts with uploadedFiles prop
├── useEffect checks: uploadedFiles.length > 0 && !hasReport
├── Automatically generates RAG Vector Ingestion summary
├── Message appears with typing animation (1 second)

STEP 9: RAG Q&A
├── User asks: "What are the schema fields?"
├── generateAIResponse detects uploadedFiles.length > 0
├── Keyword "field" matches schema query
├── Returns formatted attribute table with file metadata
├── User sees professional GIS audit report in chat
```

## 10.2 Flow: Prediction Engine Run

```
User clicks "Prediction" → PredictionPanel opens
User adjusts parameters (rainfall=300, elevation=400, etc.)
User clicks "Run Prediction"
├── setIsRunning(true)
├── Processing animation plays (4 steps, 700ms each)
├── After 3 seconds:
│   ├── Score calculated: weighted sum × 10
│   ├── Level classified: critical/high/medium/low
│   ├── Result stored in state
│   └── setIsRunning(false)
├── Results render:
│   ├── Overall score (big number with color)
│   ├── Risk badge (CRITICAL/HIGH/MEDIUM/LOW)
│   ├── Factor analysis bars (animated progress bars)
│   └── AI recommendations list (5 actionable items)
```

## 10.3 Flow: Dashboard Mode Switch

```
User clicks "Traffic" mode button
├── handleModeChange("traffic")
├── setDashboardMode("traffic")
├── setMapLayers(getLayersForMode("traffic"))
│   Returns: [traffic-flow, congestion-heat, transit-routes, ...]
├── currentKPIs recomputes (useMemo dependency: dashboardMode)
│   Returns: [Congestion Index, Avg Speed, Peak Volume, ...]
├── currentAnalytics recomputes
│   Returns: traffic-specific charts and data
├── currentFloodRisks recomputes (adapts to mode)
│   Returns: mode-specific zone data
├── All child components re-render with new data
├── Map layers change, KPI cards change, right panel changes
```

---

# SECTION 11 — INTERVIEW PREPARATION

## 11.1 Technical Interview Questions & Answers

### Architecture Questions

**Q: Explain the architecture of your project.**
**A:** "GeoNarrative AI follows a decoupled client-server architecture. The frontend is a Next.js 14 single-page application using the App Router with React 18 and TypeScript. It communicates with a FastAPI backend via REST APIs. The frontend handles map rendering through Mapbox GL JS with a canvas-based fallback, state management through React hooks, and includes a client-side AI response generator for zero-latency chat. The backend exposes 9 API endpoints for analytics, predictions, file uploads, weather data, and chat. External services include OpenWeatherMap for live weather and Mapbox for geocoding."

**Q: Why did you choose Next.js over plain React?**
**A:** "Next.js provides three critical capabilities: First, the App Router gives us file-based routing with metadata management for SEO. Second, dynamic imports with `ssr: false` let us safely load Mapbox GL which requires browser APIs. Third, the built-in optimization pipeline handles image optimization, code splitting, and font optimization. For production, it also enables server-side rendering and API routes without a separate backend."

**Q: How does your state management work?**
**A:** "I use React's built-in `useState` for local state, `useCallback` for memoized event handlers to prevent unnecessary re-renders, and `useMemo` for computed values like KPI data that depend on the dashboard mode. The state tree is flat — about 10 state variables in the root `page.tsx` component with prop drilling to child components. I chose this over Redux because we have a single page with a manageable state tree. For scaling, I would migrate to Zustand for its minimal API and devtools support."

### Frontend Questions

**Q: How does the map rendering work?**
**A:** "MapView operates in dual mode. With a Mapbox token, it renders WebGL-powered vector tiles with interactive layers — heatmaps, fill polygons, circle markers, and line features. Without a token, it renders a canvas-based fallback with CSS animations, SVG paths for rivers, and Framer Motion for data point animations. When a user uploads a custom dataset, the fallback activates a HUD scanner overlay with corner telemetry panels and a scanning sweep line."

**Q: How do you handle the AI chat markdown rendering?**
**A:** "The `AIChatPanel` component includes a custom `renderContent` function that parses markdown-like syntax line by line. It detects `##` headers, `|` table rows, `- ` bullet points, `**bold**` text, and `*italic*` text, converting each to appropriately styled React elements. Table separator rows (containing only dashes) are filtered out. This approach was chosen over a full markdown library for bundle size optimization."

### Backend Questions

**Q: Explain your prediction algorithm.**
**A:** "The flood risk prediction uses a weighted multi-factor scoring model. Six input parameters — rainfall intensity, elevation profile, land use pattern, drainage capacity, population density, and water body proximity — are each normalized to a 0-1 range. Each factor is multiplied by a domain-expert-assigned weight: rainfall at 30%, elevation at 25%, land use at 20%, drainage at 15%, and population at 10%. The weighted sum is scaled to 0-10 and classified into four risk levels using threshold boundaries."

**Q: How does the weather integration work?**
**A:** "The `/weather` endpoint makes two async HTTP requests to OpenWeatherMap using `httpx.AsyncClient` — one for current conditions and one for a 5-day forecast. The responses are processed into a standardized format with a flood impact assessment that scores humidity, rainfall rate, and wind speed. If the API key is missing or the request fails, it returns mock weather data — this graceful degradation ensures the dashboard always shows something useful."

### GIS Questions

**Q: What coordinate system does your project use?**
**A:** "EPSG:4326, also known as WGS84 — the same system used by GPS. Coordinates are stored as [longitude, latitude] pairs following the GeoJSON specification. Mapbox internally reprojects to EPSG:3857 (Web Mercator) for tile rendering, but all our data exchange uses 4326. It's important to note that Mapbox uses [lng, lat] order, which is the opposite of Google Maps' [lat, lng] convention."

**Q: Explain vector vs raster data.**
**A:** "Vector data represents features as geometric primitives — points for locations like hospitals, lines for features like rivers, and polygons for areas like flood zones. Our project uses vector data exclusively through the GeoJSON format. Raster data represents continuous surfaces as grids of pixels — satellite imagery, elevation models, temperature maps. In production, I would integrate raster DEMs from USGS for precise elevation analysis."

### AI/ML Questions

**Q: How does your RAG pipeline work?**
**A:** "When a user uploads a spatial file, the metadata — filename, type, size, feature count — is stored in React state. The AI chat function checks for uploaded files before processing any query. If files exist, it performs keyword-based intent matching against the file metadata: schema queries return attribute tables, diagnostic queries return coordinate counts and CRS verification, and risk queries calculate inundation overlap ratios. For production, I would use LangChain with ChromaDB for real vector embeddings and semantic search."

## 11.2 HR & Behavioral Questions

**Q: What challenges did you face?**
**A:** "The biggest challenge was implementing dual-mode map rendering. Mapbox GL requires browser APIs unavailable during server-side rendering, so I used Next.js dynamic imports with `ssr: false`. Then I built a complete canvas-based fallback with animated data points, SVG paths, and CSS grid patterns that activates when no Mapbox token is present. This taught me the importance of graceful degradation in production systems."

**Q: How would you scale this?**
**A:** "Three dimensions of scaling: First, horizontal scaling — deploy the FastAPI backend in Docker containers behind a load balancer on AWS ECS or Kubernetes. Second, data scaling — migrate from in-memory data to PostgreSQL with PostGIS for spatial queries, with Redis caching for frequently accessed analytics. Third, AI scaling — move from pattern matching to Gemini API with LangChain for real conversational AI, using a vector database like Pinecone for RAG document search."

**Q: What would you do differently?**
**A:** "I would start with a proper database from day one using Supabase for managed PostgreSQL with PostGIS. I would implement authentication with NextAuth.js or Supabase Auth. I would add comprehensive test coverage with Pytest for the backend and Jest/React Testing Library for the frontend. And I would set up CI/CD with GitHub Actions from the beginning."

## 11.3 How to Present This Project

### 60-Second Elevator Pitch
"GeoNarrative AI is a conversational digital twin platform that combines interactive maps, AI chat, and machine learning to help city planners manage disaster risk. You can visualize flood zones on a Mapbox map, ask questions in natural language like 'Which hospitals are at risk?', upload custom spatial datasets for RAG-powered analysis, and run ML predictions with adjustable parameters. Built with Next.js, FastAPI, and TypeScript, it supports four intelligence modes — flood risk, traffic, urban development, and utility management."

### Demo Flow (5 minutes)
1. **Show the dashboard** — point out the dark theme, KPI cards, mode selector
2. **Switch modes** — click Traffic, Urban, Utility to show adaptability
3. **Open the map** — show the fallback visualization with heatmap zones
4. **Upload a file** — drag a GeoJSON, show the success card and HUD activation
5. **Chat with AI** — ask about flood risk, show the markdown table response
6. **Run prediction** — adjust parameters, click Run, show the animated results
7. **Show the backend** — open `/docs` to show Swagger API documentation

---

**→ Continue to PART 5: Research & Thesis · Debugging · Industry · Future Features**
