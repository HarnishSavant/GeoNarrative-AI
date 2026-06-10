import pytest
from httpx import AsyncClient
from unittest.mock import AsyncMock, patch, MagicMock
from app.api.v1.endpoints.auth import get_current_user
from app.models.db_models import User
from main import app

@pytest.fixture
def mock_user():
    return User(
        id=1,
        email="test_user@geonarrative.ai",
        username="test_user",
        full_name="GIS Researcher",
        is_verified=True,
        is_active=True,
        role="user",
        credits=100,
        subscription="free"
    )



@pytest.fixture(autouse=True)
def override_auth(mock_user):
    app.dependency_overrides[get_current_user] = lambda: mock_user
    yield
    app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_get_flood_zones_pune(client: AsyncClient):
    """
    Test Pune low-lying zones query path which triggers real PostGIS database calls.
    We patch SpatialQueryService to prevent SQLite dialect errors.
    """
    mock_high_risk = [
        {
            "id": 1,
            "name": "Ruby Hall Clinic",
            "type": "hospital",
            "status": "active",
            "intersecting_zone": "Riverside District",
            "risk_level": "critical",
            "inundation_depth_m": 3.5
        }
    ]
    mock_prone_roads = []

    with patch("app.services.spatial_query_service.SpatialQueryService.query_high_risk_infrastructure", new_callable=AsyncMock) as mock_infra, \
         patch("app.services.spatial_query_service.SpatialQueryService.query_flood_prone_roads", new_callable=AsyncMock) as mock_roads:
        
        mock_infra.return_value = mock_high_risk
        mock_roads.return_value = mock_prone_roads
        
        response = await client.get("/api/v1/flood/zones?location=Pune&mode=flood")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Should include hilltop terraces standard fallback
        assert any(zone["zone"] == "Pune Hilltop Terraces" for zone in data)


@pytest.mark.asyncio
async def test_get_flood_zones_non_pune(client: AsyncClient):
    """
    Test dynamic non-Pune simulation fallback path.
    """
    response = await client.get("/api/v1/flood/zones?location=Mumbai&mode=flood")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    # Should return dynamic fallback items
    assert len(data) > 0
    assert any("Mumbai" in zone["zone"] for zone in data)


@pytest.mark.asyncio
async def test_get_analytics_pune(client: AsyncClient):
    """
    Test analytics query pathway for Pune (requires PostGIS queries).
    """
    mock_high_risk = []
    
    with patch("app.services.spatial_query_service.SpatialQueryService.query_high_risk_infrastructure", new_callable=AsyncMock) as mock_infra:
        mock_infra.return_value = mock_high_risk
        
        response = await client.get("/api/v1/analytics?location=Pune&mode=flood")
        assert response.status_code == 200
        data = response.json()
        assert "riskDistribution" in data
        assert "infrastructure" in data


@pytest.mark.asyncio
async def test_get_analytics_non_pune(client: AsyncClient):
    """
    Test dynamic OSM + Overpass analytics fallback path for non-Pune cities.
    """
    mock_geocode = {
        "display_name": "Mumbai, India",
        "lat": 19.076,
        "lon": 72.8777,
        "bbox": {"lat_min": 19.0, "lat_max": 19.15, "lon_min": 72.8, "lon_max": 72.95}
    }
    
    with patch("app.services.osm_service.OSMService.geocode_city", new_callable=AsyncMock) as mock_geo, \
         patch("app.services.osm_service.OSMService.fetch_osm_features", new_callable=AsyncMock) as mock_fetch:
        
        mock_geo.return_value = mock_geocode
        mock_fetch.return_value = {"features": []}
        
        response = await client.get("/api/v1/analytics?location=Mumbai&mode=flood")
        assert response.status_code == 200
        data = response.json()
        assert "riskDistribution" in data


@pytest.mark.asyncio
async def test_weather_endpoint_fallback(client: AsyncClient):
    """
    Test weather retrieval endpoint when API key is missing or invalid.
    """
    with patch("app.core.config.settings.WEATHER_API_KEY", None):
        response = await client.get("/api/v1/weather?lat=18.52&lon=73.85&location=Pune")
        assert response.status_code == 200
        data = response.json()
        assert "error" in data or "data_source_type" in data
        assert "current" in data or "data" in data


@pytest.mark.asyncio
async def test_ml_prediction_ensemble(client: AsyncClient):
    """
    Test Predict route to ensure the Gini regression & XGBoost ensemble triggers.
    """
    payload = {
        "rainfall": 200.0,
        "elevation": 500.0,
        "land_use": "urban",
        "water_bodies": 5,
        "population_density": 8000.0,
        "drainage_capacity": 70.0,
        "location": "Pune",
        "domain": "flood"
    }
    
    # We patch prediction DB storage step to prevent SQLite constraints crash
    with patch("sqlalchemy.ext.asyncio.AsyncSession.add", return_value=None), \
         patch("sqlalchemy.ext.asyncio.AsyncSession.commit", new_callable=AsyncMock):
        
        response = await client.post("/api/v1/predict", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "overall_risk" in data
        assert "score" in data
        assert "model_metrics" in data
        assert "feature_importance" in data


@pytest.mark.asyncio
async def test_gis_hospitals_in_flood(client: AsyncClient):
    """
    Test hospitals-in-flood endpoint.
    """
    mock_val = [{"hospital_id": 1, "hospital_name": "Deccan Hospital", "status": "active"}]
    with patch("app.services.spatial_query_service.SpatialQueryService.query_hospitals_in_flood_zones", new_callable=AsyncMock) as mock_q:
        mock_q.return_value = mock_val
        response = await client.get("/api/v1/gis/hospitals-in-flood")
        assert response.status_code == 200
        assert response.json() == mock_val


@pytest.mark.asyncio
async def test_gis_schools_near_rivers(client: AsyncClient):
    """
    Test schools-near-rivers endpoint.
    """
    mock_val = [{"id": 2, "name": "Pune Public School", "type": "school", "distance_meters": 120.0}]
    with patch("app.services.spatial_query_service.SpatialQueryService.query_schools_near_rivers", new_callable=AsyncMock) as mock_q:
        mock_q.return_value = mock_val
        response = await client.get("/api/v1/gis/schools-near-rivers?distance_m=500")
        assert response.status_code == 200
        assert response.json() == mock_val


@pytest.mark.asyncio
async def test_gis_nearest_shelters(client: AsyncClient):
    """
    Test nearest-shelters KNN endpoint.
    """
    mock_val = [{"id": 3, "name": "Kothrud Transit Shelter", "type": "shelter", "distance_km": 1.2}]
    with patch("app.services.spatial_query_service.SpatialQueryService.query_nearest_shelters", new_callable=AsyncMock) as mock_q:
        mock_q.return_value = mock_val
        response = await client.get("/api/v1/gis/nearest-shelters?lng=73.81&lat=18.51&limit=3")
        assert response.status_code == 200
        assert response.json() == mock_val


@pytest.mark.asyncio
async def test_gis_flood_prone_roads(client: AsyncClient):
    """
    Test flood-prone-roads endpoint.
    """
    mock_val = [{"road_name": "Karve Road", "is_flood_prone": True, "max_inundation_depth_m": 1.5}]
    with patch("app.services.spatial_query_service.SpatialQueryService.query_flood_prone_roads", new_callable=AsyncMock) as mock_q:
        mock_q.return_value = mock_val
        response = await client.get("/api/v1/gis/flood-prone-roads")
        assert response.status_code == 200
        assert response.json() == mock_val


@pytest.mark.asyncio
async def test_gis_exposure_summary(client: AsyncClient):
    """
    Test exposure-summary aggregated endpoint.
    """
    mock_val = {
        "total_exposed_assets": 10,
        "domains": {
            "flood": {"exposed_assets_count": 4, "by_risk_level": {"critical": 2, "high": 2}},
            "traffic": {"impacted_corridors_count": 2, "roads": ["Karve Road"]},
            "urban": {"zoning_violations_count": 3, "violations": []},
            "utility": {"vulnerable_substations_count": 1}
        }
    }
    with patch("app.services.spatial_query_service.SpatialQueryService.query_infrastructure_exposure_summary", new_callable=AsyncMock) as mock_q:
        mock_q.return_value = mock_val
        response = await client.get("/api/v1/gis/exposure-summary")
        assert response.status_code == 200
        assert response.json() == mock_val


@pytest.mark.asyncio
async def test_gis_urban_risk_framework(client: AsyncClient):
    """
    Test urban-risk-framework MCDA calculation endpoint.
    """
    response = await client.get("/api/v1/gis/urban-risk-framework?location=Pune")
    assert response.status_code == 200
    data = response.json()
    assert "location" in data
    assert "algorithm_info" in data
    assert "domains" in data
    assert "flood" in data["domains"]
    assert "traffic" in data["domains"]
    assert "urban" in data["domains"]
    assert "utility" in data["domains"]
    assert data["domains"]["flood"]["score"] > 0
    assert data["algorithm_info"]["is_explainable"] is True


