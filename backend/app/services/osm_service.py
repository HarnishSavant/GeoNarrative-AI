import httpx
import json
import os
import asyncio
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.db_repository import DBRepository
from shapely.geometry import Point, LineString, Polygon
from shapely.wkt import dumps

# Setup a local cache directory for heavy Overpass GIS files to prevent API rate-limiting
CACHE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "core", "cache")
os.makedirs(CACHE_DIR, exist_ok=True)
CURRENT_CITY_FILE = os.path.join(CACHE_DIR, "current_loaded_city.txt")

class OSMService:
    """
    OpenStreetMap and Overpass API integration service.
    Downloads real-time geospatial layers (roads, rivers, schools, hospitals)
    for any searched city and compiles them to standard GeoJSON payloads.
    """
    _MEMORY_CACHE: Dict[str, Any] = {}

    @staticmethod
    def get_loaded_city() -> str:
        if os.path.exists(CURRENT_CITY_FILE):
            with open(CURRENT_CITY_FILE, "r") as f:
                return f.read().strip().lower()
        return "pune"

    @staticmethod
    def set_loaded_city(city: str):
        with open(CURRENT_CITY_FILE, "w") as f:
            f.write(city.lower())

    @staticmethod
    async def load_city_to_db(session: AsyncSession, city: str) -> bool:
        """
        Wipes old city data and loads the requested city dynamically.
        """
        import logging
        from sqlalchemy import text
        logger = logging.getLogger("geonarrative.osm_service")
        
        geo = await OSMService.geocode_city(city)
        if not geo:
            logger.error(f"Failed to geocode {city}")
            return False
            
        logger.info(f"Clearing old spatial data for new city: {city}")
        await session.execute(text("TRUNCATE TABLE infrastructure RESTART IDENTITY CASCADE;"))
        await session.execute(text("TRUNCATE TABLE flood_zones RESTART IDENTITY CASCADE;"))
        await session.commit()
        
        bbox = geo["bbox"]
        for category in ["roads", "rivers", "hospitals", "schools", "buildings", "infrastructure"]:
            logger.info(f"Ingesting {category} for {city}...")
            geojson = await OSMService.fetch_osm_features(city, category, bbox)
            if geojson and geojson.get("features"):
                await OSMService.persist_osm_to_db(session, geojson, city)
        
        await session.commit()
        OSMService.set_loaded_city(city)
        return True

    @staticmethod
    async def geocode_city(city: str) -> Optional[Dict[str, Any]]:
        """
        Geocode a city name using the OpenStreetMap Nominatim API.
        Returns the center coordinates and bounding box coordinates.
        """
        cache_key = f"geocode_{city.lower()}"
        if cache_key in OSMService._MEMORY_CACHE:
            return OSMService._MEMORY_CACHE[cache_key]
            
        headers = {"User-Agent": "GeoNarrativeAI/1.0 (contact: admin@geonarrative.ai)"}
        url = f"https://nominatim.openstreetmap.org/search?q={httpx.URL(city)}&format=json&limit=1&polygon_geojson=1"
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                response = await client.get(url, headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    if data:
                        result = data[0]
                        # Nominatim returns bounding box as [lat_min, lat_max, lon_min, lon_max]
                        bbox = [float(x) for x in result["boundingbox"]]
                        result_dict = {
                            "display_name": result["display_name"],
                            "lat": float(result["lat"]),
                            "lon": float(result["lon"]),
                            "bbox": {
                                "lat_min": bbox[0],
                                "lat_max": bbox[1],
                                "lon_min": bbox[2],
                                "lon_max": bbox[3]
                            },
                            "geojson": result.get("geojson"),
                            "type": result.get("type", "administrative"),
                            "importance": result.get("importance", 0.5)
                        }
                        OSMService._MEMORY_CACHE[cache_key] = result_dict
                        return result_dict
            except Exception as e:
                print(f"Nominatim Geocoding Exception: {str(e)}")
        return None

    @staticmethod
    def _get_cache_path(city: str, category: str) -> str:
        safe_city = "".join([c if c.isalnum() else "_" for c in city.lower()])
        return os.path.join(CACHE_DIR, f"{safe_city}_{category}.json")

    @staticmethod
    async def fetch_osm_features(city_name: str, category: str, bbox: Dict[str, float]) -> Dict[str, Any]:
        """
        Query Overpass API for specific geographic tags within the city bounding box.
        Converts the returned OSM node/way JSON elements into standardized GeoJSON.
        """
        cache_key = f"{city_name.lower()}_{category}"
        if cache_key in OSMService._MEMORY_CACHE:
            return OSMService._MEMORY_CACHE[cache_key]

        # 1. Check Local Cache first
        cache_path = OSMService._get_cache_path(city_name, category)
        if os.path.exists(cache_path):
            try:
                with open(cache_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    OSMService._MEMORY_CACHE[cache_key] = data
                    return data
            except Exception:
                pass # Fallback to live fetch on cache read error

        # 2. Build the Overpass QL Query
        # Categories: roads, rivers, hospitals, schools, buildings, infrastructure
        # Restrict bounding box to max 0.15 degrees to prevent crashing the Overpass public server
        lat_min = max(bbox["lat_min"], bbox["lat_min"])
        lat_max = min(bbox["lat_max"], bbox["lat_min"] + 0.15)
        lon_min = max(bbox["lon_min"], bbox["lon_min"])
        lon_max = min(bbox["lon_max"], bbox["lon_min"] + 0.15)

        overpass_bbox = f"{lat_min},{lon_min},{lat_max},{lon_max}"
        
        category_queries = {
            "roads": f'way["highway"]({overpass_bbox});',
            "rivers": f'way["waterway"="river"]({overpass_bbox});',
            "hospitals": f'node["amenity"="hospital"]({overpass_bbox}); way["amenity"="hospital"]({overpass_bbox});',
            "schools": f'node["amenity"="school"]({overpass_bbox}); way["amenity"="school"]({overpass_bbox});',
            "buildings": f'way["building"]({overpass_bbox});',
            "infrastructure": f'node["power"="substation"]({overpass_bbox}); node["emergency"="fire_hydrant"]({overpass_bbox});'
        }

        query_body = category_queries.get(category, f'node["amenity"]({overpass_bbox});')
        overpass_ql = f"[out:json][timeout:25];({query_body});out body geom;"

        # 3. Request from Overpass API
        url = "https://overpass-api.de/api/interpreter"
        headers = {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "GeoNarrativeAI/1.0 (contact: admin@geonarrative.ai)",
            "Accept": "application/json"
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            for attempt in range(3):
                try:
                    response = await client.post(url, data={"data": overpass_ql}, headers=headers)
                    if response.status_code == 200:
                        raw_data = response.json()
                        geojson = OSMService._convert_osm_to_geojson(raw_data, category)
                        
                        # Save to local cache
                        with open(cache_path, "w", encoding="utf-8") as f:
                            json.dump(geojson, f, ensure_ascii=False, indent=2)
                        
                        OSMService._MEMORY_CACHE[cache_key] = geojson
                        return geojson
                    elif response.status_code == 429:
                        print(f"Overpass 429 Rate Limit hit for {category}. Retrying in 4s...")
                        await asyncio.sleep(4)
                        continue
                except Exception as e:
                    print(f"Overpass API Ingestion Exception: {str(e)}")
                    await asyncio.sleep(2)
                
        # Return fallback empty GeoJSON on failure
        return {"type": "FeatureCollection", "features": [], "category": category, "city": city_name}

    @staticmethod
    def _convert_osm_to_geojson(osm_data: Dict[str, Any], category: str) -> Dict[str, Any]:
        """
        Converts Overpass raw elements into GeoJSON RFC 7946 Features.
        Supports both points (OSM nodes) and paths/polygons (OSM ways with geometry lists).
        """
        features = []
        elements = osm_data.get("elements", [])

        for el in elements:
            el_type = el.get("type")
            tags = el.get("tags", {})
            properties = {
                "id": el.get("id"),
                "name": tags.get("name", f"Unnamed {category.rstrip('s')}"),
                "category": category,
                "osm_type": el_type
            }
            # Append other helpful OSM tags as attributes
            for k, v in tags.items():
                if k not in ["name"]:
                    properties[f"osm_{k}"] = v

            geom = None

            if el_type == "node" and "lat" in el and "lon" in el:
                geom = {
                    "type": "Point",
                    "coordinates": [el["lon"], el["lat"]]
                }
            elif el_type == "way" and "geometry" in el:
                coords = [[pt["lon"], pt["lat"]] for pt in el["geometry"]]
                # If way closes and is labeled a building or amenity, treat it as a Polygon
                if coords[0] == coords[-1] and (category in ["buildings", "schools", "hospitals"]):
                    geom = {
                        "type": "Polygon",
                        "coordinates": [coords]
                    }
                else:
                    geom = {
                        "type": "LineString",
                        "coordinates": coords
                    }

            if geom:
                features.append({
                    "type": "Feature",
                    "geometry": geom,
                    "properties": properties
                })

        return {
            "type": "FeatureCollection",
            "features": features[:150], # Cap at 150 items to keep rendering snappy
            "category": category,
            "count": len(features)
        }

    @staticmethod
    async def persist_osm_to_db(session: AsyncSession, geojson: Dict[str, Any], city: str) -> int:
        """
        Takes fetched OSM GeoJSON features and automatically populates the
        active PostGIS tables. Hospitals/Schools become Infrastructure nodes;
        rivers/roads can go to UploadedDatasets catalog.
        """
        count = 0
        features = geojson.get("features", [])
        category = geojson.get("category", "")

        for feat in features:
            geom_type = feat["geometry"]["type"]
            coords = feat["geometry"]["coordinates"]
            props = feat["properties"]
            name = props["name"]

            try:
                if geom_type == "Point" and category in ["hospitals", "schools", "infrastructure"]:
                    # Insert Point Infrastructure
                    lng, lat = coords
                    node_type = category.rstrip('s')
                    await DBRepository.create_infrastructure_node(
                        session, name=name, node_type=node_type, status="active", lng=lng, lat=lat
                    )
                    count += 1
                elif category in ["rivers", "roads", "buildings"]:
                    # Create generic PostGIS MultiPolygon or GeometryCollection WKT
                    # Convert GeoJSON to WKT for storage using Shapely
                    wkt_geom = None
                    if geom_type == "LineString":
                        line = LineString(coords)
                        # Buffer line slightly (approx 11 meters) to represent corridor area
                        poly = line.buffer(0.0001)
                        if poly.geom_type == "Polygon":
                            wkt_geom = MultiPolygon([poly]).wkt
                        elif poly.geom_type == "MultiPolygon":
                            wkt_geom = poly.wkt
                    elif geom_type == "Polygon":
                        poly = Polygon(coords[0])
                        wkt_geom = MultiPolygon([poly]).wkt
                    
                    if wkt_geom:
                        # Save in catalog with category prefix for dynamic queries
                        full_name = f"[{category}] {name}"
                        risk_level = "critical" if category == "rivers" else "low"
                        await DBRepository.create_flood_zone(
                            session, name=full_name, risk_level=risk_level, depth=0.0, multipolygon_wkt=wkt_geom
                        )
                        count += 1
            except Exception as e:
                print(f"Skipping database persistence for element: {str(e)}")

        return count
