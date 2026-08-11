from .cache import gis_cache
from .raster_manager import RasterManager
from .vector_manager import VectorManager

def get_dashboard_statistics():
    raster_stats = {}
    for name in gis_cache.rasters.keys():
        raster_stats[name] = RasterManager.get_info(name)
        
    vector_stats = {}
    total_features = 0
    for name in gis_cache.vectors.keys():
        v_stat = VectorManager.get_layer_stats(name)
        vector_stats[name] = v_stat
        total_features += v_stat.get("feature_count", 0)
        
    return {
        "total_rasters_loaded": len(gis_cache.rasters),
        "total_vectors_loaded": len(gis_cache.vectors),
        "total_vector_features": total_features,
        "rasters": raster_stats,
        "vectors": vector_stats,
        "status": "Operational",
        "engine": "GeoAI GIS Analysis Engine"
    }
