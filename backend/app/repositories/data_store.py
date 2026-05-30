import random

KNOWN_LOCATIONS = {
    "pune": {"name": "Pune, Maharashtra, India", "lat": 18.5204, "lng": 73.8567, "country": "India", "state": "Maharashtra"},
    "mumbai": {"name": "Mumbai, Maharashtra, India", "lat": 19.0760, "lng": 72.8777, "country": "India", "state": "Maharashtra"},
    "chennai": {"name": "Chennai, Tamil Nadu, India", "lat": 13.0827, "lng": 80.2707, "country": "India", "state": "Tamil Nadu"},
    "delhi": {"name": "Delhi, India", "lat": 28.6139, "lng": 77.2090, "country": "India", "state": "Delhi"},
    "bangalore": {"name": "Bangalore, Karnataka, India", "lat": 12.9716, "lng": 77.5946, "country": "India", "state": "Karnataka"},
    "kolkata": {"name": "Kolkata, West Bengal, India", "lat": 22.5726, "lng": 88.3639, "country": "India", "state": "West Bengal"},
    "hyderabad": {"name": "Hyderabad, Telangana, India", "lat": 17.3850, "lng": 78.4867, "country": "India", "state": "Telangana"},
    "new york": {"name": "New York, USA", "lat": 40.7128, "lng": -74.0060, "country": "USA", "state": "New York"},
    "tokyo": {"name": "Tokyo, Japan", "lat": 35.6895, "lng": 139.6917, "country": "Japan", "state": "Tokyo"},
    "london": {"name": "London, UK", "lat": 51.5074, "lng": -0.1276, "country": "UK", "state": "England"},
}

MAP_LAYERS = [
    {"id": "flood-zones", "name": "Flood Zones", "type": "fill", "visible": True, "color": "#3b82f6"},
    {"id": "risk-heatmap", "name": "Risk Heatmap", "type": "heatmap", "visible": True, "color": "#ef4444"},
    {"id": "rivers", "name": "Rivers & Water Bodies", "type": "line", "visible": True, "color": "#06b6d4"},
    {"id": "infrastructure", "name": "Infrastructure", "type": "circle", "visible": False, "color": "#f59e0b"},
    {"id": "elevation", "name": "Elevation Contours", "type": "line", "visible": False, "color": "#8b5cf6"},
    {"id": "population", "name": "Population Density", "type": "heatmap", "visible": False, "color": "#10b981"},
]

def search_locations_db(query: str) -> list:
    results = []
    query_lower = query.lower()
    for key, loc in KNOWN_LOCATIONS.items():
        if query_lower in key or query_lower in loc["name"].lower():
            results.append(loc)
    
    if not results:
        # Fallback dynamic coordinates
        results.append({
            "name": query,
            "lat": 18.5204 + random.uniform(-5, 5),
            "lng": 73.8567 + random.uniform(-5, 5),
            "country": "Unknown",
            "state": "Unknown",
        })
    return results

def get_map_layers_db() -> dict:
    return {"layers": MAP_LAYERS}

def get_flood_zones_db(location: str) -> list:
    return [
        {
            "zone": "Riverside District",
            "level": "critical",
            "score": 9.2,
            "area": 12.5,
            "population": 45000,
            "description": "Adjacent to Mula-Mutha river confluence. Historical flooding in 2019, 2021.",
        },
        {
            "zone": "Low-Lying Basin Area",
            "level": "high",
            "score": 7.8,
            "area": 8.3,
            "population": 32000,
            "description": "Elevation below 400m with poor drainage infrastructure.",
        },
        {
            "zone": "Industrial Corridor",
            "level": "medium",
            "score": 5.5,
            "area": 15.2,
            "population": 18000,
            "description": "Moderate risk due to impervious surface coverage.",
        },
        {
            "zone": "Hilltop Residential",
            "level": "low",
            "score": 2.1,
            "area": 22.0,
            "population": 55000,
            "description": "Elevated terrain with good natural drainage.",
        },
    ]

def get_analytics_data_db(location: str) -> dict:
    return {
        "location": location,
        "rainfall": [
            {"month": "Jan", "value": 12, "avg": 15},
            {"month": "Feb", "value": 8, "avg": 12},
            {"month": "Mar", "value": 15, "avg": 10},
            {"month": "Apr", "value": 28, "avg": 25},
            {"month": "May", "value": 65, "avg": 55},
            {"month": "Jun", "value": 182, "avg": 160},
            {"month": "Jul", "value": 245, "avg": 200},
            {"month": "Aug", "value": 198, "avg": 185},
            {"month": "Sep", "value": 165, "avg": 150},
            {"month": "Oct", "value": 85, "avg": 80},
            {"month": "Nov", "value": 32, "avg": 35},
            {"month": "Dec", "value": 10, "avg": 12},
        ],
        "risk_distribution": [
            {"name": "Low Risk", "value": 45, "color": "#10b981"},
            {"name": "Medium Risk", "value": 30, "color": "#f59e0b"},
            {"name": "High Risk", "value": 18, "color": "#ef4444"},
            {"name": "Critical", "value": 7, "color": "#dc2626"},
        ],
        "infrastructure": [
            {"type": "Hospitals", "count": 45, "at_risk": 8},
            {"type": "Schools", "count": 312, "at_risk": 42},
            {"type": "Fire Stations", "count": 18, "at_risk": 3},
            {"type": "Power Plants", "count": 6, "at_risk": 1},
            {"type": "Water Treatment", "count": 12, "at_risk": 4},
            {"type": "Bridges", "count": 28, "at_risk": 7},
        ],
        "population_density": [
            {"area": "Central", "density": 12500, "risk": "high"},
            {"area": "North", "density": 8200, "risk": "medium"},
            {"area": "South", "density": 6800, "risk": "low"},
            {"area": "East", "density": 9500, "risk": "medium"},
            {"area": "West", "density": 11200, "risk": "high"},
        ],
        "time_series_risk": [
            {"date": "2020", "flood": 45, "drought": 20, "earthquake": 5},
            {"date": "2021", "flood": 52, "drought": 18, "earthquake": 8},
            {"date": "2022", "flood": 68, "drought": 25, "earthquake": 3},
            {"date": "2023", "flood": 75, "drought": 15, "earthquake": 12},
            {"date": "2024", "flood": 82, "drought": 30, "earthquake": 6},
            {"date": "2025", "flood": 78, "drought": 28, "earthquake": 9},
        ],
    }

def get_kpis_db(location: str) -> dict:
    return {
        "flood_risk_score": 7.8,
        "population_at_risk": "1.2M",
        "infrastructure_score": "84%",
        "avg_rainfall": "142mm",
        "avg_elevation": "560m",
        "water_bodies": 23,
    }
