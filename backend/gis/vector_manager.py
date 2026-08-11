import logging
from typing import Dict, Any, Optional
from shapely.geometry import Point
from .cache import gis_cache
import pandas as pd
import numpy as np
import geopandas as gpd

logger = logging.getLogger("gis_vector_manager")

class VectorManager:
    @staticmethod
    def get_nearest_feature(layer_name: str, lat: float, lon: float, max_distance_meters: float = 5000) -> Optional[Dict[str, Any]]:
        """
        Find the nearest feature in a vector layer using the spatial index.
        Returns the attributes of the nearest feature and its distance in meters.
        """
        gdf = gis_cache.vectors.get(layer_name)
        sindex = gis_cache.spatial_indices.get(layer_name)
        
        if gdf is None or sindex is None:
            return None
            
        try:
            point = Point(lon, lat)
            
            # Reproject point to UTM for accurate distance measurement (mocked by converting degrees to approx meters for speed, or actual CRS transform)
            # A quick approximation: 1 degree ~ 111,320 meters at equator
            approx_degree_dist = max_distance_meters / 111320.0
            
            # Query spatial index for candidates within approx bounding box
            possible_matches_index = list(sindex.intersection(point.buffer(approx_degree_dist).bounds))
            if not possible_matches_index:
                return None
                
            possible_matches = gdf.iloc[possible_matches_index].copy()
            
            # Convert to a projected CRS (e.g., Web Mercator EPSG:3857) to calculate accurate distances in meters
            # To be highly accurate in India, UTM zone 43N (EPSG:32643) would be ideal, but 3857 is universally standard for web maps
            pm_projected = possible_matches.to_crs("EPSG:3857")
            point_projected = gpd.GeoSeries([point], crs="EPSG:4326").to_crs("EPSG:3857").iloc[0]
            
            distances = pm_projected.geometry.distance(point_projected)
            nearest_idx = distances.idxmin()
            min_dist = distances[nearest_idx]
            
            if min_dist > max_distance_meters:
                return None
                
            nearest_feature = possible_matches.loc[nearest_idx].to_dict()
            nearest_feature.pop("geometry", None) # Remove geometry from payload
            
            # Clean up NaN values for JSON serialization
            clean_feature = {k: (v if pd.notna(v) else None) for k, v in nearest_feature.items()}
            
            return {
                "attributes": clean_feature,
                "distance_meters": round(min_dist, 2)
            }
        except Exception as e:
            logger.error(f"Error finding nearest feature in {layer_name}: {e}")
            return None

    @staticmethod
    def get_containing_feature(layer_name: str, lat: float, lon: float) -> Optional[Dict[str, Any]]:
        """
        Find which polygon feature contains the given point (e.g. Ward Boundaries).
        """
        gdf = gis_cache.vectors.get(layer_name)
        sindex = gis_cache.spatial_indices.get(layer_name)
        
        if gdf is None or sindex is None:
            return None
            
        try:
            point = Point(lon, lat)
            possible_matches_index = list(sindex.intersection(point.bounds))
            if not possible_matches_index:
                return None
                
            possible_matches = gdf.iloc[possible_matches_index]
            precise_matches = possible_matches[possible_matches.contains(point)]
            
            if precise_matches.empty:
                return None
                
            feature = precise_matches.iloc[0].to_dict()
            feature.pop("geometry", None)
            clean_feature = {k: (v if pd.notna(v) else None) for k, v in feature.items()}
            
            return clean_feature
        except Exception as e:
            logger.error(f"Error finding containing feature in {layer_name}: {e}")
            return None

    @staticmethod
    def get_layer_stats(layer_name: str) -> Dict[str, Any]:
        """
        Return basic statistics about the vector layer.
        """
        gdf = gis_cache.vectors.get(layer_name)
        if gdf is None:
            return {"status": "Not loaded"}
            
        return {
            "feature_count": len(gdf),
            "geometry_type": str(gdf.geom_type.mode()[0]) if not gdf.empty else "Unknown",
            "crs": str(gdf.crs)
        }
