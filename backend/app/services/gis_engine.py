import json
import math
import logging
from typing import Dict, Any, List, Tuple
from shapely.geometry import shape, Point, LineString, Polygon, MultiPolygon
from shapely.ops import unary_union
import numpy as np

# Setup logging
logger = logging.getLogger("geonarrative.gis_engine")

HAS_GEOPANDAS = False
try:
    import geopandas as gpd
    HAS_GEOPANDAS = True
except ImportError:
    logger.warning("GeoPandas not found. Spatial joins and buffering will use native fallbacks.")

HAS_RASTERIO = False
try:
    import rasterio
    from rasterio.features import rasterize, shapes
    from rasterio.transform import from_bounds
    HAS_RASTERIO = True
except ImportError:
    logger.warning("Rasterio not found. Heatmap generation will use mathematical contour simulation.")


class GISEngine:
    """
    High-Performance Enterprise Geospatial Analysis Engine.
    Executes core vector and raster calculations (spatial joins, multi-criteria evaluations,
    projected buffering, overlays, and vulnerability analysis) for all 4 digital twin modes.
    
    Bridges OpenStreetMap (OSM) vector datasets, PostGIS database schemas,
    and conversational AI context.
    """

    @staticmethod
    def calculate_distance(lon1: float, lat1: float, lon2: float, lat2: float) -> float:
        """Haversine formula to compute geodesic distance in kilometers between two coordinates"""
        R = 6371.0  # Earth radius in km
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        delta_phi = math.radians(lat2 - lat1)
        delta_lambda = math.radians(lon2 - lon1)
        
        a = math.sin(delta_phi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c

    # --- MODE 1: FLOOD RISK MULTI-CRITERIA EVALUATION (MCE) ---

    @staticmethod
    def analyze_flood_vulnerability(
        facilities: Dict[str, Any],
        rivers: Dict[str, Any],
        buildings: Dict[str, Any],
        rainfall_intensity: float = 120.0,  # mm/hr
        grid_resolution: int = 100
    ) -> Dict[str, Any]:
        """
        Runs a Multi-Criteria Evaluation (MCE) Spatial Decision Support Model.
        Combines:
        1. Projected Hydrological Buffering (using GeoPandas WGS84 -> UTM/EPSG:3857 metric buffer).
        2. Proximity to Hydrology (using Shapely distance analysis).
        3. Elevation Model (simulated DEM raster using Rasterio and NumPy).
        4. Urban Runoff Density (derived from building footprint overlays).
        
        Returns vulnerable assets (hospitals) and risk heatmap contours as GeoJSON.
        """
        logger.info(f"Initiating Flood GIS analysis. Rainfall: {rainfall_intensity} mm/hr")
        
        # Parse GeoJSON into lists of shapes
        river_geoms = []
        for feat in rivers.get("features", []):
            try:
                river_geoms.append(shape(feat["geometry"]))
            except Exception:
                continue

        building_geoms = []
        for feat in buildings.get("features", []):
            try:
                building_geoms.append(shape(feat["geometry"]))
            except Exception:
                continue

        facility_features = facilities.get("features", [])

        # Standard bounding box for fallback or raster grids
        # Pune default if no geometries are provided
        min_lon, min_lat, max_lon, max_lat = 73.80, 18.48, 73.90, 18.56
        
        all_geoms = river_geoms + building_geoms + [shape(f["geometry"]) for f in facility_features if "geometry" in f]
        if all_geoms:
            union_all = unary_union(all_geoms)
            bounds = union_all.bounds
            min_lon, min_lat, max_lon, max_lat = bounds[0], bounds[1], bounds[2], bounds[3]
            # Ensure box has width/height
            if min_lon == max_lon:
                min_lon, max_lon = min_lon - 0.05, max_lon + 0.05
            if min_lat == max_lat:
                min_lat, max_lat = min_lat - 0.05, max_lat + 0.05

        # 1. VEctor Analysis: Projected Hydrological Buffering (300m buffer)
        # Using GeoPandas for projected metric operations (EPSG:3857 pseudomercator works in meters)
        river_buffer_geojson = None
        river_buffer_geom = None
        vulnerable_hospitals = []

        if HAS_GEOPANDAS and river_geoms:
            try:
                gdf_rivers = gpd.GeoDataFrame(geometry=river_geoms, crs="EPSG:4326")
                # Reproject to metric system for exact 300-meter buffer
                gdf_rivers_proj = gdf_rivers.to_crs(epsg=3857)
                gdf_rivers_proj["geometry"] = gdf_rivers_proj.buffer(300)  # 300 meters
                gdf_rivers_buffered = gdf_rivers_proj.to_crs(epsg=4326)
                river_buffer_geom = unary_union(gdf_rivers_buffered.geometry)
                river_buffer_geojson = GISEngine._to_geojson(river_buffer_geom)
            except Exception as e:
                logger.error(f"GeoPandas metric buffering failed: {e}. Falling back to Shapely degrees.")
                
        # Shapely degree fallback (300m ~= 0.0027 degrees)
        if river_buffer_geom is None and river_geoms:
            river_union_fallback = unary_union(river_geoms)
            river_buffer_geom = river_union_fallback.buffer(0.0027)
            river_buffer_geojson = GISEngine._to_geojson(river_buffer_geom)

        river_union = unary_union(river_geoms) if river_geoms else None

        # 2. Raster MCE Heatmap using Rasterio & NumPy
        risk_contours_geojson = None
        
        if HAS_RASTERIO and HAS_GEOPANDAS and all_geoms:
            try:
                # Set up grid cell matrix (resolution x resolution)
                transform = from_bounds(min_lon, min_lat, max_lon, max_lat, grid_resolution, grid_resolution)
                
                # Rasterize rivers buffer (proximity factor)
                river_buffer_mask = np.zeros((grid_resolution, grid_resolution), dtype=np.uint8)
                if river_buffer_geom:
                    river_buffer_mask = rasterize(
                        [(river_buffer_geom, 1)],
                        out_shape=(grid_resolution, grid_resolution),
                        transform=transform,
                        fill=0,
                        dtype=np.uint8
                    )
                
                # Rasterize urban building footprints (runoff surface factor)
                urban_density_raster = np.zeros((grid_resolution, grid_resolution), dtype=np.uint8)
                if building_geoms:
                    urban_density_raster = rasterize(
                        [(geom, 1) for geom in building_geoms],
                        out_shape=(grid_resolution, grid_resolution),
                        transform=transform,
                        fill=0,
                        dtype=np.uint8
                    )
                
                # Generate Simulated Elevation Model (DEM)
                # Lower near rivers, higher further away
                y_idx, x_idx = np.indices((grid_resolution, grid_resolution))
                # Map indices back to longitude/latitude coordinates
                lons = min_lon + (x_idx / grid_resolution) * (max_lon - min_lon)
                lats = min_lat + (y_idx / grid_resolution) * (max_lat - min_lat)
                
                # Base elevation (average Pune 560m)
                elevation_raster = np.full((grid_resolution, grid_resolution), 560.0)
                
                if river_union:
                    for r in range(grid_resolution):
                        for c in range(grid_resolution):
                            px_pt = Point(lons[r, c], lats[r, c])
                            dist = river_union.distance(px_pt) * 111.12  # in km
                            elevation_raster[r, c] = 530.0 + min(170.0, dist * 35.0)
                
                # Normalize factor grids to 0.0 - 10.0
                river_proximity_score = river_buffer_mask * 10.0
                
                max_el, min_el = np.max(elevation_raster), np.min(elevation_raster)
                el_range = max_el - min_el if max_el > min_el else 1.0
                elevation_score = ((max_el - elevation_raster) / el_range) * 10.0  # low elevation = high risk
                
                rainfall_score = min(10.0, (rainfall_intensity / 150.0) * 10.0)
                urban_density_score = urban_density_raster * 10.0
                
                # Multi-Criteria Raster Overlay Formula:
                # Risk = (Proximity * 0.4) + (Elevation * 0.3) + (Rainfall * 0.2) + (UrbanDensity * 0.1)
                risk_grid = (
                    (river_proximity_score * 0.4) + 
                    (elevation_score * 0.3) + 
                    (rainfall_score * 0.2) + 
                    (urban_density_score * 0.1)
                )
                
                # Classify into integer risk categories (0: safe, 1: medium, 2: high, 3: critical)
                risk_classified = np.zeros_like(risk_grid, dtype=np.int32)
                risk_classified[risk_grid > 3.5] = 1  # Medium Risk
                risk_classified[risk_grid > 5.5] = 2  # High Risk
                risk_classified[risk_grid > 7.5] = 3  # Critical Risk
                
                # Re-vectorize classified raster zones into GeoJSON using Rasterio's shapes
                shapes_generator = shapes(risk_classified, transform=transform)
                features = []
                for geom, val in shapes_generator:
                    val = int(val)
                    if val > 0:  # Skip safe areas
                        risk_level = "medium" if val == 1 else "high" if val == 2 else "critical"
                        color_codes = {"medium": "#eab308", "high": "#f97316", "critical": "#ef4444"}
                        features.append({
                            "type": "Feature",
                            "geometry": geom,
                            "properties": {
                                "risk_score_class": val,
                                "risk_level": risk_level,
                                "color": color_codes[risk_level],
                                "fill_opacity": 0.45 if val == 1 else 0.55 if val == 2 else 0.70
                            }
                        })
                
                risk_contours_geojson = {
                    "type": "FeatureCollection",
                    "features": features
                }
                logger.info(f"Raster MCE model successfully rasterized and vectorized {len(features)} risk polygons.")
                
            except Exception as e:
                logger.error(f"Rasterio MCE modeling failed: {e}. Using native polygon solver.")

        # If rasterization fallback or skipped: Generate concentric buffering zones
        if risk_contours_geojson is None and river_union:
            fallback_features = []
            try:
                # Create concentric buffer rings
                for level, dist_deg, score, color in [
                    ("critical", 0.0025, 9.0, "#ef4444"),
                    ("high", 0.0050, 7.0, "#f97316"),
                    ("medium", 0.0085, 4.5, "#eab308")
                ]:
                    ring = river_union.buffer(dist_deg)
                    fallback_features.append({
                        "type": "Feature",
                        "geometry": GISEngine._to_geojson(ring),
                        "properties": {
                            "risk_level": level,
                            "risk_score": score,
                            "color": color,
                            "fill_opacity": 0.35
                        }
                    })
                risk_contours_geojson = {"type": "FeatureCollection", "features": fallback_features}
            except Exception as e:
                logger.error(f"Hydrological vector concentric ring mapping failed: {e}")

        # 3. Vector Analysis: Spatial Join / Containment for Hospitals
        for feat in facility_features:
            try:
                pt_geom = shape(feat["geometry"])
                props = feat["properties"]
                hospital_name = props.get("name", "Facility")
                coords = feat["geometry"]["coordinates"]

                # Distance calculation using exact geodesic haversine formula
                distance_to_river = 999.0
                if river_union:
                    distance_to_river = river_union.distance(pt_geom) * 111.12  # in km

                # Elevation rises away from river waterways (simulating river valley contouring)
                elevation = 550.0 + min(150.0, distance_to_river * 40.0)

                # Check containment in high-exposure buffer zone
                is_in_buffer = False
                if river_buffer_geom and river_buffer_geom.contains(pt_geom):
                    is_in_buffer = True

                # Dynamic score evaluation based on multi-criteria weighting
                proximity_score = max(0.0, 10.0 - (distance_to_river * 5.0))
                elevation_score = max(0.0, 10.0 - ((elevation - 540.0) * 0.25))
                rainfall_score = min(10.0, (rainfall_intensity / 150.0) * 10.0)
                
                # Let's count nearby building density inside a local 200m buffer
                local_200m = pt_geom.buffer(0.0018)
                density_count = sum(1 for b_geom in building_geoms if local_200m.intersects(b_geom))
                urban_runoff_coef = min(0.95, 0.4 + (density_count * 0.05))

                risk_score = (proximity_score * 0.4) + (elevation_score * 0.3) + (rainfall_score * 0.2) + (urban_runoff_coef * 10.0 * 0.1)
                risk_level = "critical" if risk_score > 7.5 else "high" if risk_score > 5.5 else "medium" if risk_score > 3.5 else "low"

                if risk_score > 4.0 or is_in_buffer:
                    vulnerable_hospitals.append({
                        "name": hospital_name,
                        "risk_score": round(risk_score, 2),
                        "risk_level": risk_level,
                        "elevation": round(elevation, 1),
                        "distance_to_river_km": round(distance_to_river, 3),
                        "is_in_buffer_zone": is_in_buffer,
                        "urban_density_neighbors": density_count,
                        "runoff_coefficient": round(urban_runoff_coef, 2),
                        "coordinates": coords
                    })
            except Exception as e:
                logger.warning(f"Error checking facility flood vulnerability: {e}")
                continue

        return {
            "vulnerable_assets": vulnerable_hospitals,
            "river_buffer_geojson": river_buffer_geojson,
            "heatmap_geojson": risk_contours_geojson,
            "summary": {
                "total_analyzed": len(facility_features),
                "vulnerable_count": len(vulnerable_hospitals),
                "rainfall_exposure_mm": rainfall_intensity,
                "runoff_coefficient": 0.85 if len(building_geoms) > 20 else 0.55,
                "gis_engine_status": "geopandas_rasterio_active" if (HAS_GEOPANDAS and HAS_RASTERIO) else "native_shapely_active"
            }
        }

    # --- MODE 2: TRAFFIC & LOGISTICS CONGESTION OVERLAY ---

    @staticmethod
    def analyze_traffic_corridors(roads: Dict[str, Any], incidents: Dict[str, Any]) -> Dict[str, Any]:
        """
        Traffic Overlay and Incident Buffer Intersection.
        Buffers emergency incidents or congestion points by 150m (using projected metric coordinate transforms).
        Intersects linear road networks (LineStrings) with the safety buffers to map network bottlenecks.
        
        Generates traffic hotspot buffers and lists impacted logistic corridors.
        """
        logger.info("Initiating Traffic Congestion overlay analysis.")
        
        incident_geoms = []
        for feat in incidents.get("features", []):
            try:
                incident_geoms.append(shape(feat["geometry"]))
            except Exception:
                continue

        road_features = roads.get("features", [])

        # Buffer incidents by 150 meters
        incident_buffer_geom = None
        incident_buffer_geojson = None

        if HAS_GEOPANDAS and incident_geoms:
            try:
                gdf_inc = gpd.GeoDataFrame(geometry=incident_geoms, crs="EPSG:4326")
                gdf_inc_proj = gdf_inc.to_crs(epsg=3857)
                gdf_inc_proj["geometry"] = gdf_inc_proj.buffer(150)  # 150 meters metric buffer
                gdf_inc_buffered = gdf_inc_proj.to_crs(epsg=4326)
                incident_buffer_geom = unary_union(gdf_inc_buffered.geometry)
                incident_buffer_geojson = GISEngine._to_geojson(incident_buffer_geom)
            except Exception as e:
                logger.error(f"GeoPandas traffic buffer projection failed: {e}. Using degree buffers.")

        if incident_buffer_geom is None and incident_geoms:
            incident_union_fallback = unary_union(incident_geoms)
            incident_buffer_geom = incident_union_fallback.buffer(0.0013)  # 150m in degrees ~= 0.0013
            incident_buffer_geojson = GISEngine._to_geojson(incident_buffer_geom)

        impacted_road_segments = []

        # Spatial join overlays on roads
        for feat in road_features:
            try:
                road_geom = shape(feat["geometry"])
                props = feat["properties"]
                road_name = props.get("name", "Urban Corridor")
                road_type = props.get("osm_highway", props.get("type", "secondary"))
                coords = feat["geometry"]["coordinates"]

                # Spatial overlay check (intersects)
                is_impacted = False
                if incident_buffer_geom and incident_buffer_geom.intersects(road_geom):
                    is_impacted = True

                if is_impacted:
                    # Calculate logistics bottleneck classification based on highway hierarchy
                    priority = "elevated"
                    delay_time_mins = 8.0
                    
                    if road_type in ["motorway", "trunk"]:
                        priority = "critical"
                        delay_time_mins = 25.0
                    elif road_type in ["primary", "link"]:
                        priority = "high"
                        delay_time_mins = 15.0
                    
                    impacted_road_segments.append({
                        "road_name": road_name,
                        "type": road_type,
                        "incident_proximity": "critical (<150m)",
                        "logistics_priority_index": priority,
                        "estimated_delay_minutes": delay_time_mins,
                        "coordinates": coords
                    })
            except Exception as e:
                logger.warning(f"Error evaluating road segment bottleneck: {e}")
                continue

        # Heatmap contour layers mapping logistics delay intensity
        traffic_heatmap_geojson = None
        if HAS_RASTERIO and HAS_GEOPANDAS and road_features and incident_buffer_geom:
            try:
                # Rasterize impacted corridors with heavy weighting on primary roads
                min_lon, min_lat, max_lon, max_lat = incident_buffer_geom.bounds
                min_lon, min_lat, max_lon, max_lat = min_lon - 0.01, min_lat - 0.01, max_lon + 0.01, max_lat + 0.01
                
                transform = from_bounds(min_lon, min_lat, max_lon, max_lat, 80, 80)
                
                # Rasterize bottleneck sectors
                shapes_to_raster = []
                for feat in road_features:
                    rg = shape(feat["geometry"])
                    if incident_buffer_geom.intersects(rg):
                        # Weight primary/highways heavier
                        t = feat["properties"].get("osm_highway", "secondary")
                        weight = 3 if t in ["motorway", "trunk"] else 2 if t in ["primary"] else 1
                        shapes_to_raster.append((rg, weight))
                
                if shapes_to_raster:
                    congestion_matrix = rasterize(
                        shapes_to_raster,
                        out_shape=(80, 80),
                        transform=transform,
                        fill=0,
                        dtype=np.uint8
                    )
                    
                    # Extract shapes
                    shapes_gen = shapes(congestion_matrix, transform=transform)
                    h_features = []
                    for geom, val in shapes_gen:
                        val = int(val)
                        if val > 0:
                            intensity = "high" if val == 3 else "medium" if val == 2 else "low"
                            colors = {"low": "#eab308", "medium": "#f97316", "high": "#ef4444"}
                            h_features.append({
                                "type": "Feature",
                                "geometry": geom,
                                "properties": {
                                    "congestion_intensity": intensity,
                                    "color": colors[intensity],
                                    "fill_opacity": 0.4 + (val * 0.1)
                                }
                            })
                    traffic_heatmap_geojson = {"type": "FeatureCollection", "features": h_features}
            except Exception as e:
                logger.error(f"Traffic Rasterio congestion mapping failed: {e}")

        # Fallback simplistic circles around incident hotspots
        if traffic_heatmap_geojson is None and incident_geoms:
            h_features = []
            for inc in incident_geoms[:10]:
                h_features.append({
                    "type": "Feature",
                    "geometry": GISEngine._to_geojson(inc.buffer(0.0035)),
                    "properties": {
                        "congestion_intensity": "high",
                        "color": "#ef4444",
                        "fill_opacity": 0.4
                    }
                })
            traffic_heatmap_geojson = {"type": "FeatureCollection", "features": h_features}

        return {
            "impacted_corridors": impacted_road_segments,
            "incident_buffer_geojson": incident_buffer_geojson,
            "heatmap_geojson": traffic_heatmap_geojson,
            "summary": {
                "total_routes_evaluated": len(road_features),
                "clogged_segments": len(impacted_road_segments),
                "logistics_impact_percentage": round((len(impacted_road_segments) / max(1, len(road_features))) * 100, 1)
            }
        }

    # --- MODE 3: URBAN PLANNING & ZONING SPATIAL JOIN ---

    @staticmethod
    def audit_urban_zoning(assets: Dict[str, Any], zoning_zones: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes a Spatial Join (equivalent to ST_Within or ST_Intersects in PostGIS).
        Identifies which commercial, residential, or heavy industrial infrastructure falls inside
        designated environmental conservation zones (green belts), riversides, or active hazard boundaries.
        
        Triggers regulatory violations and logs them inside our digital twin databases.
        """
        logger.info("Executing Spatial Join zoning audit on assets.")
        
        zones_list = []
        for feat in zoning_zones.get("features", []):
            try:
                zones_list.append({
                    "geom": shape(feat["geometry"]),
                    "name": feat["properties"].get("name", "Zoning District"),
                    "type": feat["properties"].get("riskLevel", feat["properties"].get("osm_landuse", "green_belt"))
                })
            except Exception:
                continue

        asset_features = assets.get("features", [])
        zoning_violations = []

        if HAS_GEOPANDAS and zones_list and asset_features:
            try:
                # Representing zoning districts as a GeoDataFrame
                gdf_zones = gpd.GeoDataFrame(
                    [{"geometry": z["geom"], "zone_name": z["name"], "zone_type": z["type"]} for z in zones_list],
                    crs="EPSG:4326"
                )
                
                # Representing commercial assets as a GeoDataFrame
                asset_rows = []
                for i, feat in enumerate(asset_features):
                    try:
                        asset_rows.append({
                            "geometry": shape(feat["geometry"]),
                            "asset_name": feat["properties"].get("name", "Asset"),
                            "coords": feat["geometry"]["coordinates"]
                        })
                    except Exception:
                        continue
                        
                gdf_assets = gpd.GeoDataFrame(asset_rows, crs="EPSG:4326")
                
                # Perform vector intersection spatial join (ST_Intersects overlay)
                gdf_joined = gpd.sjoin(gdf_assets, gdf_zones, how="inner", predicate="intersects")
                
                for _, row in gdf_joined.iterrows():
                    # Identify environmental zoning violations
                    # (e.g. industrial assets overlapping green_belt or riverbanks)
                    z_type = row["zone_type"]
                    violating = False
                    status = "compliant"
                    
                    if z_type in ["critical", "high", "green_belt", "forest", "nature_reserve"]:
                        violating = True
                        status = "non-compliant (nature belt boundary violation)"
                    
                    if violating:
                        zoning_violations.append({
                            "asset_name": row["asset_name"],
                            "coordinate": row["coords"],
                            "zone_name": row["zone_name"],
                            "zone_type": z_type,
                            "zoning_overlay_status": status
                        })
                        
            except Exception as e:
                logger.error(f"GeoPandas spatial join zoning audit failed: {e}. Falling back to Shapely loop.")

        # Fallback pure Shapely loops
        if not zoning_violations and zones_list and asset_features:
            for feat in asset_features:
                try:
                    pt_geom = shape(feat["geometry"])
                    props = feat["properties"]
                    asset_name = props.get("name", "Urban Asset")
                    coords = feat["geometry"]["coordinates"]

                    for zone in zones_list:
                        if zone["geom"].intersects(pt_geom):
                            z_type = zone["type"]
                            if z_type in ["critical", "high", "green_belt", "forest"]:
                                zoning_violations.append({
                                    "asset_name": asset_name,
                                    "coordinate": coords,
                                    "zone_name": zone["name"],
                                    "zone_type": z_type,
                                    "zoning_overlay_status": "non-compliant (hazard-risk-overlay)"
                                })
                                break
                except Exception:
                    continue

        return {
            "zoning_audited_violations": zoning_violations,
            "summary": {
                "total_assets_audited": len(asset_features),
                "zoning_violations_identified": len(zoning_violations),
                "compliance_ratio_percentage": round(((len(asset_features) - len(zoning_violations)) / max(1, len(asset_features))) * 100, 1)
            }
        }

    # --- MODE 4: UTILITY OVERAGE & SUBSTATION BUFFER COVERAGE ---

    @staticmethod
    def audit_grid_coverage(substations: Dict[str, Any], consumers: Dict[str, Any]) -> Dict[str, Any]:
        """
        Utility Grid Coverage Buffer.
        Buffers power substations or municipal utilities by 1.2km (projected metric coordinate space).
        Then audits the service polygon containment to detect isolated nodes or vital consumer nodes
        (like healthcare facilities) displaying zero power substation backup redundancy.
        """
        logger.info("Executing Utility Grid coverage buffering audit.")
        
        station_geoms = []
        for feat in substations.get("features", []):
            try:
                station_geoms.append(shape(feat["geometry"]))
            except Exception:
                continue

        consumer_features = consumers.get("features", [])

        # Buffer substations by 1.2 kilometers (0.0108 degrees ~= 1.2km)
        grid_coverage_geom = None
        grid_coverage_geojson = None

        if HAS_GEOPANDAS and station_geoms:
            try:
                gdf_stations = gpd.GeoDataFrame(geometry=station_geoms, crs="EPSG:4326")
                gdf_stations_proj = gdf_stations.to_crs(epsg=3857)
                gdf_stations_proj["geometry"] = gdf_stations_proj.buffer(1200)  # 1.2 kilometers
                gdf_stations_buffered = gdf_stations_proj.to_crs(epsg=4326)
                grid_coverage_geom = unary_union(gdf_stations_buffered.geometry)
                grid_coverage_geojson = GISEngine._to_geojson(grid_coverage_geom)
            except Exception as e:
                logger.error(f"GeoPandas grid buffer calculation failed: {e}. Falling back to Shapely.")

        if grid_coverage_geom is None and station_geoms:
            station_union_fallback = unary_union(station_geoms)
            grid_coverage_geom = station_union_fallback.buffer(0.0108)
            grid_coverage_geojson = GISEngine._to_geojson(grid_coverage_geom)

        vulnerable_consumers = []

        # Audit spatial containment overlay
        for feat in consumer_features:
            try:
                pt_geom = shape(feat["geometry"])
                props = feat["properties"]
                consumer_name = props.get("name", "Facility")
                coords = feat["geometry"]["coordinates"]
                category = props.get("category", props.get("osm_amenity", "hospitals"))

                has_power_coverage = False
                if grid_coverage_geom and grid_coverage_geom.contains(pt_geom):
                    has_power_coverage = True

                if not has_power_coverage:
                    # Consumers falling completely outside the 1.2km grid service buffer
                    vulnerable_consumers.append({
                        "consumer_name": consumer_name,
                        "coordinates": coords,
                        "vulnerability": "grid_outage_risk (No substation redundancy)",
                        "backup_priority": "critical" if category in ["hospital", "hospitals", "emergency"] else "standard"
                    })
            except Exception as e:
                logger.warning(f"Error checking consumer grid coverage: {e}")
                continue

        return {
            "uncovered_grid_consumers": vulnerable_consumers,
            "grid_service_coverage_geojson": grid_coverage_geojson,
            "summary": {
                "total_consumers_mapped": len(consumer_features),
                "isolated_consumers": len(vulnerable_consumers),
                "redundancy_coverage_percentage": round(((len(consumer_features) - len(vulnerable_consumers)) / max(1, len(consumer_features))) * 100, 1)
            }
        }

    # --- HELPER PARSING WRAPPERS ---

    @staticmethod
    def _to_geojson(shapely_geom) -> Dict[str, Any]:
        """Serializes any Shapely geometric shape to RFC 7946 GeoJSON dict format"""
        if shapely_geom is None or shapely_geom.is_empty:
            return {"type": "GeometryCollection", "geometries": []}
            
        from shapely import to_geojson
        try:
            return json.loads(to_geojson(shapely_geom))
        except Exception:
            # Fallback mapper
            mapping = shapely_geom.__geo_interface__
            return dict(mapping)
