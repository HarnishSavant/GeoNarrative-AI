# GeoNarrative AI — Complete Technical Masterclass

## MASTER DOCUMENT · PART 3 OF 5

> **Scope:** AI & Generative AI Masterclass · Machine Learning Masterclass · Database Masterclass

---

# SECTION 6 — AI & GENERATIVE AI MASTERCLASS

## 6.1 How AI Works in GeoNarrative AI

Your project has **three AI subsystems**:

### Subsystem 1: Conversational AI Chat (Frontend — mockData.ts)
- **Location:** `src/lib/mockData.ts` → `generateAIResponse()` function
- **Approach:** Rule-based intent matching with keyword detection
- **How:** Parses user query for keywords, returns pre-crafted markdown responses

```typescript
export function generateAIResponse(
  query: string,
  locationName: string,
  mode: DashboardMode,
  uploadedFiles: any[] = []
): string {
  const q = query.toLowerCase();
  
  // Intent Detection via keyword matching
  if (q.includes("flood") && q.includes("risk")) → return flood analysis
  if (q.includes("hospital")) → return infrastructure report
  if (q.includes("rainfall")) → return weather statistics
  if (q.includes("mitigation")) → return strategy recommendations
}
```

### Subsystem 2: RAG Document Q&A (Frontend — mockData.ts)
- **What is RAG?** Retrieval-Augmented Generation — combining document retrieval with AI generation
- **How it works in your project:**
  1. User uploads a GIS file (e.g., `gadm41_IND_3.shp`)
  2. File metadata is stored in `uploadedFiles` state array
  3. When user asks questions about their data, `generateAIResponse` checks for uploaded files FIRST
  4. Returns contextual answers using the file's name, size, and feature count

```typescript
// RAG query detection
if (uploadedFiles.length > 0) {
  const file = uploadedFiles[uploadedFiles.length - 1];
  
  if (q.includes("schema") || q.includes("field")) {
    return `## SPATIAL DATA INGESTION: DATABASE SCHEMA AUDIT
    Parsed Attribute Schema for "${file.name}"...`;
  }
  
  if (q.includes("many") || q.includes("feature")) {
    return `## GEOPARTITION INDEXING REPORT
    Active Geometries: ${file.features || 223} nodes...`;
  }
}
```

### Subsystem 3: Backend Chat API (Backend — routes.py)
- **Location:** `/api/v1/chat` endpoint
- **Approach:** Same keyword-based intent detection, but server-side
- **Designed for:** Production upgrade to real LLM (Gemini API)

## 6.2 LLMs (Large Language Models) — Concept

### What is an LLM?
A neural network trained on billions of words of text that can understand and generate human language. Examples: GPT-4, Gemini, Claude, Llama.

### How LLMs Would Enhance Your Project
Currently, your chat uses **pattern matching** (keyword detection). With a real LLM:
- User could ask any question, not just pre-defined patterns
- Responses would be dynamic and context-aware
- The system could reason about spatial relationships
- Multi-turn conversations would maintain context

### Gemini API Integration Path
```python
# Production upgrade for routes.py
import google.generativeai as genai

genai.configure(api_key=settings.GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-pro')

@router.post("/chat")
async def chat(request: ChatRequest):
    prompt = f"""You are a GeoAI analyst for {request.location}.
    Analyze this query using geospatial reasoning: {request.message}
    Include risk scores, affected infrastructure, and recommendations."""
    
    response = model.generate_content(prompt)
    return {"message": response.text, "metadata": {...}}
```

## 6.3 RAG (Retrieval-Augmented Generation) — Deep Dive

### The RAG Pipeline (Conceptual)

```
┌──────────────────────────────────────────────────┐
│                  RAG PIPELINE                     │
│                                                   │
│  ┌─────────┐    ┌────────────┐    ┌───────────┐  │
│  │ Document │───→│ Chunk &    │───→│ Vector    │  │
│  │ Upload   │    │ Embed      │    │ Database  │  │
│  └─────────┘    └────────────┘    └─────┬─────┘  │
│                                         │         │
│  ┌─────────┐    ┌────────────┐    ┌─────▼─────┐  │
│  │ User     │───→│ Embed      │───→│ Similarity│  │
│  │ Query    │    │ Query      │    │ Search    │  │
│  └─────────┘    └────────────┘    └─────┬─────┘  │
│                                         │         │
│                  ┌────────────┐    ┌─────▼─────┐  │
│                  │ Generated  │◄───│ LLM +     │  │
│                  │ Answer     │    │ Retrieved  │  │
│                  └────────────┘    │ Context    │  │
│                                   └───────────┘  │
└──────────────────────────────────────────────────┘
```

### Your RAG Implementation (Simulated)
Your project **simulates** RAG without a real vector database or LLM:

| Production RAG | Your Implementation |
|---------------|-------------------|
| Upload → Parse → Chunk → Embed | Upload → Store metadata in React state |
| Store vectors in Pinecone/Chroma | Store file info in `uploadedFiles[]` array |
| Embed query → cosine similarity | Keyword matching on query string |
| LLM generates answer with context | Template strings with file metadata |
| Real semantic search | Pattern matching with if/else |

### Production RAG Upgrade
```python
# Using LangChain + ChromaDB
from langchain.document_loaders import GeoJSONLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.embeddings import GoogleGenerativeAIEmbeddings
from langchain.vectorstores import Chroma
from langchain.chains import RetrievalQA

# 1. Load and chunk document
loader = GeoJSONLoader("uploaded.geojson")
documents = loader.load()
splitter = RecursiveCharacterTextSplitter(chunk_size=1000)
chunks = splitter.split_documents(documents)

# 2. Create embeddings and store
embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
vectorstore = Chroma.from_documents(chunks, embeddings)

# 3. Create retrieval chain
qa_chain = RetrievalQA.from_chain_type(
    llm=ChatGoogleGenerativeAI(model="gemini-pro"),
    retriever=vectorstore.as_retriever(),
)

# 4. Answer questions
answer = qa_chain.run("How many features have risk > 7?")
```

## 6.4 Prompt Engineering

### What is Prompt Engineering?
The art of crafting instructions for an LLM to get the best possible output.

### System Prompt for GeoNarrative AI
```
You are GeoAI, a senior geospatial intelligence analyst.
Your expertise: flood risk, urban planning, infrastructure, GIS.

RULES:
1. Always cite data sources and coordinates
2. Use markdown tables for structured data
3. Include risk scores on a 0-10 scale
4. Provide actionable recommendations
5. Reference specific geographic features by name
6. Use emoji indicators: 🔴 Critical, 🟡 Medium, 🟢 Low

CONTEXT:
- Current location: {location}
- Active mode: {dashboard_mode}
- Uploaded files: {file_names}
- Available data: rainfall, elevation, infrastructure, population
```

## 6.5 Embeddings and Vector Databases (Concepts)

### What are Embeddings?
A way to convert text into numbers (vectors) that capture meaning:
```
"flood risk in Pune" → [0.23, -0.45, 0.87, 0.12, ...]  (768 numbers)
"Pune flooding danger" → [0.21, -0.43, 0.85, 0.14, ...]  (similar vector!)
"Tokyo restaurants" → [0.95, 0.33, -0.21, 0.67, ...]  (very different vector)
```

### Similarity Search
Compare vectors using **cosine similarity**. Similar meanings = similar vectors = high similarity score. This is how RAG finds relevant document chunks for a query.

---

# SECTION 7 — MACHINE LEARNING MASTERCLASS

## 7.1 The Prediction Engine

### Where ML Lives in Your Project
**Component:** `PredictionPanel.tsx` (frontend) + `/api/v1/predict` (backend)

### What It Predicts
Based on 6 input parameters, it calculates a **risk score (0-10)** and classifies risk as low/medium/high/critical.

## 7.2 The Algorithm — Weighted Multi-Factor Scoring

```python
# Backend: routes.py — predict_risk()

# Step 1: Normalize each input to 0.0-1.0 range
rainfall_factor = min(request.rainfall / 300, 1.0)      # 300mm = max reference
elevation_factor = max(1 - request.elevation / 1000, 0)  # Lower elevation = higher risk
drainage_factor = max(1 - request.drainage_capacity / 100, 0)  # Lower capacity = higher risk

# Step 2: Map land use to risk score
land_use_scores = {"urban": 0.8, "suburban": 0.5, "rural": 0.3, "forest": 0.1}
land_use_factor = land_use_scores.get(request.land_use, 0.5)

# Step 3: Apply weights
score = (
    rainfall_factor  * 0.30 +   # Rainfall is most important (30%)
    elevation_factor * 0.25 +   # Elevation is second (25%)
    land_use_factor  * 0.20 +   # Land use is third (20%)
    drainage_factor  * 0.15 +   # Drainage is fourth (15%)
    density_factor   * 0.10     # Population density is fifth (10%)
) * 10  # Scale to 0-10

# Step 4: Classify
level = "critical" if score > 8.5 else "high" if score > 6.5 else "medium" if score > 4.0 else "low"
```

### Why These Weights?
| Factor | Weight | Rationale |
|--------|--------|-----------|
| Rainfall | 30% | Direct cause of flooding — highest impact |
| Elevation | 25% | Water flows downhill — low areas flood first |
| Land Use | 20% | Urban surfaces don't absorb water (impervious) |
| Drainage | 15% | Poor drainage = water accumulates |
| Population | 10% | Doesn't cause floods, but affects damage impact |

## 7.3 Multi-Mode Prediction

The prediction engine adapts to each dashboard mode:

| Mode | Model Name | Input Parameters | Output |
|------|-----------|-----------------|--------|
| Flood | XGBoost (simulated) | Rainfall, Elevation, Land Use, Drainage, Pop. Density, Water Bodies | Flood risk 0-10 |
| Traffic | LSTM (simulated) | Peak Volume, Capacity Ratio, Signal Timing, Construction, Transit, Weather | Congestion level |
| Urban | Growth Model (simulated) | Pop. Growth, Land Avail., Infra Capacity, Zoning, Green Space, Permits | Growth pressure |
| Utility | Failure Model (simulated) | Equipment Age, Load Stress, Maint. Backlog, Vulnerability, Redundancy | Grid reliability |

### Processing Animation
```typescript
steps: [
  "Loading spatial data...",
  "Analyzing terrain...",
  "Running XGBoost model...",
  "Computing risk zones..."
]
// Each step appears with a 700ms delay, showing a checkmark
```

## 7.4 Production ML Pipeline

To deploy real ML models, you would:

```python
# 1. Data Collection
import geopandas as gpd
flood_data = gpd.read_file("historical_floods.shp")

# 2. Feature Engineering
features = flood_data[["rainfall", "elevation", "land_use_encoded",
                        "drainage_capacity", "population_density"]]
labels = flood_data["flood_occurred"]  # 0 or 1

# 3. Model Training
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split

X_train, X_test, y_train, y_test = train_test_split(features, labels, test_size=0.2)
model = XGBClassifier(max_depth=6, learning_rate=0.1, n_estimators=200)
model.fit(X_train, y_train)

# 4. Evaluation
from sklearn.metrics import accuracy_score, f1_score
accuracy = accuracy_score(y_test, model.predict(X_test))

# 5. Save Model
import joblib
joblib.dump(model, "flood_model.pkl")

# 6. Load in FastAPI
model = joblib.load("flood_model.pkl")
prediction = model.predict([[rainfall, elevation, land_use, drainage, density]])
```

## 7.5 Evaluation Metrics

| Metric | Formula | Use Case |
|--------|---------|----------|
| **Accuracy** | (TP+TN)/(TP+TN+FP+FN) | Overall correctness |
| **Precision** | TP/(TP+FP) | "Of all predicted floods, how many were real?" |
| **Recall** | TP/(TP+FN) | "Of all real floods, how many did we catch?" |
| **F1 Score** | 2×(Precision×Recall)/(Precision+Recall) | Balance of precision/recall |
| **AUC-ROC** | Area under ROC curve | Overall classification quality |

**For disaster prediction, Recall is most important** — you'd rather have false alarms (predict flood when there isn't one) than miss a real flood.

---

# SECTION 8 — DATABASE MASTERCLASS

## 8.1 Current Database Architecture

Your project currently uses **in-memory data** (no persistent database):
- Frontend: All data lives in React state and `mockData.ts`
- Backend: Hardcoded responses in `routes.py`
- Config: `DATABASE_URL = "sqlite:///./geonarrative.db"` (configured but unused)

### Why No Database in MVP?
1. Faster development — no schema migrations needed
2. Zero setup for new developers
3. Demo works without any database server
4. Focus on frontend/AI features first

## 8.2 Production Database: PostgreSQL + PostGIS

### What is PostGIS?
An **extension** for PostgreSQL that adds spatial data types and functions. It turns a regular database into a spatial database.

**Analogy:** PostgreSQL is like Excel — stores rows and columns. PostGIS adds a special "geometry" column type that can store points, lines, and polygons, and lets you run spatial queries like "find all hospitals within 5km of a river."

### Schema Design for GeoNarrative AI

```sql
-- Enable PostGIS extension
CREATE EXTENSION postgis;

-- Locations table
CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    country VARCHAR(100),
    state VARCHAR(100),
    geometry GEOMETRY(POINT, 4326),  -- PostGIS point type
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Flood zones table
CREATE TABLE flood_zones (
    id SERIAL PRIMARY KEY,
    location_id INTEGER REFERENCES locations(id),
    zone_name VARCHAR(255),
    risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    risk_score DECIMAL(3,1),
    population INTEGER,
    geometry GEOMETRY(POLYGON, 4326),  -- PostGIS polygon type
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Uploaded files table
CREATE TABLE uploaded_files (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(500),
    file_type VARCHAR(20),
    file_size BIGINT,
    features_count INTEGER,
    geometry GEOMETRY(GEOMETRY, 4326),  -- Any geometry type
    properties JSONB,  -- Flexible attribute storage
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Risk predictions history
CREATE TABLE predictions (
    id SERIAL PRIMARY KEY,
    location_id INTEGER REFERENCES locations(id),
    model_type VARCHAR(50),
    input_params JSONB,
    risk_score DECIMAL(3,1),
    risk_level VARCHAR(20),
    factors JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat history
CREATE TABLE chat_messages (
    id SERIAL PRIMARY KEY,
    session_id UUID,
    role VARCHAR(20),
    content TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Spatial Queries

```sql
-- Find all hospitals within 5km of a flood zone
SELECT h.name, h.geometry, fz.zone_name, fz.risk_level
FROM hospitals h, flood_zones fz
WHERE ST_DWithin(
    h.geometry::geography,
    fz.geometry::geography,
    5000  -- 5000 meters = 5km
);

-- Calculate area of each flood zone in square kilometers
SELECT zone_name,
       ST_Area(geometry::geography) / 1000000 AS area_km2
FROM flood_zones;

-- Find which uploaded features fall inside critical flood zones
SELECT uf.id, uf.properties
FROM uploaded_files uf, flood_zones fz
WHERE fz.risk_level = 'critical'
AND ST_Contains(fz.geometry, uf.geometry);
```

### Spatial Indexing
```sql
-- Create spatial index for fast geographic queries
CREATE INDEX idx_flood_zones_geom ON flood_zones USING GIST (geometry);
CREATE INDEX idx_hospitals_geom ON hospitals USING GIST (geometry);
```
**GIST (Generalized Search Tree)** is a special index type for spatial data. Without it, every spatial query scans all rows. With it, the database uses a tree structure to quickly narrow down which rows could match.

## 8.3 Supabase — Cloud PostgreSQL Option

**Supabase** is an open-source Firebase alternative built on PostgreSQL:
- Managed PostgreSQL with PostGIS extension
- REST API auto-generated from your tables
- Real-time subscriptions (live updates)
- Authentication built-in
- Free tier: 500MB database, 1GB file storage

### Integration with Your Project
```typescript
// Frontend: supabase client
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Query flood zones
const { data } = await supabase
  .from('flood_zones')
  .select('*')
  .eq('risk_level', 'critical');
```

---

**→ Continue to PART 4: Cloud & Deployment · End-to-End Flow · Interview Prep**
