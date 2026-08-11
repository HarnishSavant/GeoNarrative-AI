# GeoNarrative Digital Twin: Backend API

This is the FastAPI backend foundation for the GeoNarrative Digital Twin, providing high-performance asynchronous connection pools to PostGIS.

## Phase 1 Testing Instructions

### 1. Install Dependencies
Open a command prompt in the `backend` directory and run:
```cmd
cd d:\sem3\geonarrative-ai\backend
pip install -r requirements.txt
```

### 2. Start the Server
Run the FastAPI application via Uvicorn:
```cmd
python main.py
```
*You should see the server start up and establish the PostGIS connection pool successfully on `http://0.0.0.0:8000`.*

### 3. Verify Health & Database Connection
Open your browser and navigate to:
* **Health Check**: [http://localhost:8000/api/health](http://localhost:8000/api/health)
* **Database Connection Test**: [http://localhost:8000/api/db-test](http://localhost:8000/api/db-test)
*(This will return your exact PostgreSQL and PostGIS version running inside the Docker container).*

### 4. Test the GeoJSON Spatial Endpoints
To verify that PostGIS is correctly compiling and streaming complex polygon/multipolygon geometries directly to JSON without Python serialization overhead, check the following routes:

* **Flood Risk Hexagons**: [http://localhost:8000/api/geodata/flood-risk?limit=100](http://localhost:8000/api/geodata/flood-risk?limit=100)
* **Building Footprints**: [http://localhost:8000/api/geodata/buildings?limit=50](http://localhost:8000/api/geodata/buildings?limit=50)
* **Critical POIs**: [http://localhost:8000/api/geodata/pois?limit=50](http://localhost:8000/api/geodata/pois?limit=50)

### 5. Interactive Swagger UI
FastAPI automatically generates an interactive API playground. You can test all the endpoints natively here:
[http://localhost:8000/docs](http://localhost:8000/docs)
