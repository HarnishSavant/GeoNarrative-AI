import pytest
from httpx import AsyncClient
from unittest.mock import AsyncMock, patch
from app.api.v1.endpoints.auth import get_current_user
from app.models.db_models import User
from main import app


@pytest.fixture
def mock_premium_user():
    return User(
        id=1,
        email="premium_analyst@geonarrative.ai",
        username="premium_analyst",
        full_name="GIS Premium Analyst",
        is_verified=True,
        is_active=True,
        role="user",
        credits=100,
        subscription="premium_monthly"
    )


@pytest.fixture
def mock_free_user():
    return User(
        id=2,
        email="free_analyst@geonarrative.ai",
        username="free_analyst",
        full_name="GIS Free Analyst",
        is_verified=True,
        is_active=True,
        role="user",
        credits=50,
        subscription="free"
    )


@pytest.mark.asyncio
async def test_report_generation_succeeds_premium_user(client: AsyncClient, mock_premium_user):
    """
    Test that report generation succeeds for a valid city with premium subscription.
    """
    app.dependency_overrides[get_current_user] = lambda: mock_premium_user
    
    payload = {
        "location": "Mumbai, Maharashtra",
        "report_type": "comprehensive"
    }

    mock_llm_reply = """
    {
      "executive_summary": "Overall city risk profile is moderate. MCDA indices align with standard municipal metrics.",
      "city_overview": "Mumbai is located in the Konkan region near the Arabian Sea.",
      "flood_risk_analysis": "Flood risk scored at 8.2/10 due to low-lying coastal elevation segments.",
      "traffic_risk_analysis": "Traffic bottlenecks at Western Express Highway are prominent.",
      "urban_development_analysis": "Zoning compliance deviations are moderate.",
      "utility_infrastructure_analysis": "Peak power grid load averages 91% capacity.",
      "exposed_infrastructure": "KEM Hospital, Sion Substation, and WEH are at risk.",
      "charts_metrics_summary": "Linear weights show that Flood Risk (30%) remains the primary driver.",
      "agent_trace_methodology": "Geocoder Nominatim -> BBox Overpass -> PostGIS ST_Contains.",
      "recommendations": "1. Deploy mobile barriers. 2. Implement signal timings. 3. Inspect transformer nodes.",
      "limitations_data_sources": "Rely on dynamic rule calculations. Sources include OSM and OpenWeatherMap."
    }
    """

    with patch("app.services.geoai_orchestrator.GeoAIOrchestrator.call_gemini", new_callable=AsyncMock) as mock_gemini, \
         patch("sqlalchemy.ext.asyncio.AsyncSession.add", return_value=None), \
         patch("sqlalchemy.ext.asyncio.AsyncSession.commit", new_callable=AsyncMock):
        
        mock_gemini.return_value = mock_llm_reply
        
        response = await client.post("/api/v1/reports/generate", json=payload)
        
        # Clean overrides
        app.dependency_overrides.clear()
        
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "title" in data
        assert "location" in data
        assert data["location"] == "Mumbai, Maharashtra"
        assert "pdf_base64" in data
        assert len(data["pdf_base64"]) > 100
        
        # Verify 11 sections exist
        sections = data["sections"]
        assert len(sections) == 11
        titles = [s["title"] for s in sections]
        assert "Executive Summary" in titles
        assert "Technical Limitations & Data Sources" in titles

        # Verify telemetry sources
        assert "telemetry_source" in data
        src = data["telemetry_source"]
        assert "geocoding" in src
        assert "weather" in src
        assert "mcda" in src
        assert "assets" in src



@pytest.mark.asyncio
async def test_report_generation_graceful_fallback(client: AsyncClient, mock_premium_user):
    """
    Test that the Report Agent handles missing external services (geocoding, weather, LLM failure)
    gracefully and still returns a valid fallback report.
    """
    app.dependency_overrides[get_current_user] = lambda: mock_premium_user
    
    payload = {
        "location": "Chennai, Tamil Nadu",
        "report_type": "comprehensive"
    }

    # Simulate all APIs throwing exceptions or failures
    with patch("app.services.osm_service.OSMService.geocode_city", side_effect=Exception("Nominatim offline")), \
         patch("app.services.weather_service.WeatherService.get_live_weather", side_effect=Exception("Weather API offline")), \
         patch("app.services.geoai_orchestrator.GeoAIOrchestrator.call_gemini", side_effect=Exception("Gemini context timeout")), \
         patch("sqlalchemy.ext.asyncio.AsyncSession.add", return_value=None), \
         patch("sqlalchemy.ext.asyncio.AsyncSession.commit", new_callable=AsyncMock):
         
        response = await client.post("/api/v1/reports/generate", json=payload)
        
        app.dependency_overrides.clear()
        
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["location"] == "Chennai, Tamil Nadu"
        assert "pdf_base64" in data
        assert len(data["pdf_base64"]) > 100
        
        # Assert fallbacks produced 11 sections
        assert len(data["sections"]) == 11


@pytest.mark.asyncio
async def test_report_generation_database_logging(client: AsyncClient, mock_premium_user):
    """
    Test that the Report Agent successfully triggers DB adds and commits for metadata logging.
    """
    app.dependency_overrides[get_current_user] = lambda: mock_premium_user
    
    payload = {
        "location": "Bengaluru, Karnataka",
        "report_type": "comprehensive"
    }

    mock_llm_reply = """
    {
      "executive_summary": "Overall city risk profile is moderate.",
      "city_overview": "Bengaluru is located on the Deccan Plateau.",
      "flood_risk_analysis": "Flood risk scored at 5.5/10.",
      "traffic_risk_analysis": "Traffic bottlenecks at Outer Ring Road.",
      "urban_development_analysis": "Compliance deviations are low.",
      "utility_infrastructure_analysis": "Peak load averages 78% capacity.",
      "exposed_infrastructure": "Manipal Hospital exposed.",
      "charts_metrics_summary": "Linear weights.",
      "agent_trace_methodology": "OSM Nominatim.",
      "recommendations": "1. Action items.",
      "limitations_data_sources": "OSM data sources."
    }
    """

    db_added_objects = []
    def spy_add(obj):
        db_added_objects.append(obj)

    with patch("app.services.geoai_orchestrator.GeoAIOrchestrator.call_gemini", new_callable=AsyncMock) as mock_gemini, \
         patch("sqlalchemy.ext.asyncio.AsyncSession.add", side_effect=spy_add) as mock_add, \
         patch("sqlalchemy.ext.asyncio.AsyncSession.commit", new_callable=AsyncMock) as mock_commit:
        
        mock_gemini.return_value = mock_llm_reply
        
        response = await client.post("/api/v1/reports/generate", json=payload)
        
        app.dependency_overrides.clear()
        
        assert response.status_code == 200
        assert mock_commit.call_count >= 1
        
        # Verify Report model and ActivityLog model were stored
        object_types = [type(obj).__name__ for obj in db_added_objects]
        assert "Report" in object_types
        assert "ActivityLog" in object_types


@pytest.mark.asyncio
async def test_report_generation_free_user_restricted(client: AsyncClient, mock_free_user):
    """
    Test that free users are blocked from generating comprehensive PDF reports
    by the SaaSLimitMiddleware, returning a 403 status code.
    """
    app.dependency_overrides[get_current_user] = lambda: mock_free_user
    
    # We patch the middleware database search so it returns our mock free user
    # Note: Middleware relies on decode_jwt_token and DB query. Since client is initialized
    # with conftest or overrides, let's verify if the SaaSLimitMiddleware handles the request.
    # To test the middleware block directly under app context, we send a requests to client.
    # The client can pass headers.
    
    payload = {
        "location": "Pune, Maharashtra",
        "report_type": "comprehensive"
    }

    # Simulate JWT decoding to return user ID 2 (our mock free user)
    # Mocking decode_jwt_token to yield user ID 2
    # Mocking database to return mock_free_user for query select(User)
    
    from app.models.db_models import Subscription
    mock_active_sub = Subscription(user_id=2, plan_type="free", status="active")
    
    # We create a mock scalar result that returns mock_free_user
    mock_user_result = AsyncMock()
    mock_user_result.scalars.return_value.first.return_value = mock_free_user
    
    mock_sub_result = AsyncMock()
    mock_sub_result.scalars.return_value.first.return_value = mock_active_sub

    async def mock_execute(statement):
        # Check if statement queries User or Subscription
        stmt_str = str(statement)
        if "users" in stmt_str:
            return mock_user_result
        if "subscriptions" in stmt_str:
            return mock_sub_result
        return AsyncMock()

    with patch("app.middleware.saas_limit_middleware.decode_jwt_token", return_value={"sub": "2"}), \
         patch("sqlalchemy.ext.asyncio.AsyncSession.execute", new_callable=AsyncMock, side_effect=mock_execute):
         
        # Make request with Authorization header to trigger middleware check
        headers = {"Authorization": "Bearer test_token_free"}
        response = await client.post("/api/v1/reports/generate", json=payload, headers=headers)
        
        app.dependency_overrides.clear()
        
        assert response.status_code == 403
        data = response.json()
        assert "Premium feature" in data["detail"]
