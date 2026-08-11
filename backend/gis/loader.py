import os
import rasterio
import logging
from pathlib import Path
from .cache import gis_cache

logger = logging.getLogger("gis_loader")

DATA_DIR = Path(__file__).parent.parent.parent / "Data"

RASTER_CONFIG = {
    "dem": "dem.tif",
    "slope": "sloop.tif",
    "flood": "flood.tif",
    "dist_to_river": "dist_to_river.tif",
    "builddens": "builddens.tif",
    "lulcc": "lulcc.tif",
    "hill": "hill.tif"
}

def load_gis_data():
    logger.info("Initializing GIS Data Manager...")
    
    # 1. Load Raster Datasets
    for name, filename in RASTER_CONFIG.items():
        file_path = DATA_DIR / filename
        if not file_path.exists():
            logger.error(f"Raster file not found: {file_path}")
            continue
            
        try:
            dataset = rasterio.open(file_path)
            
            crs = str(dataset.crs)
            width = dataset.width
            height = dataset.height
            bounds = dataset.bounds
            nodata = dataset.nodata
            
            logger.info(f"[{name}] Validating CRS: {crs}")
            logger.info(f"[{name}] Validating size: {width}x{height}")
            logger.info(f"[{name}] Validating extent: {bounds}")
            logger.info(f"[{name}] Validating nodata: {nodata}")
            
            gis_cache.rasters[name] = {
                "dataset": dataset,
                "path": str(file_path)
            }
            logger.info(f"Successfully loaded and cached {name} raster.")
        except Exception as e:
            logger.error(f"Failed to load raster {name}: {e}")

    # 2. Load Vector Datasets from Geodatabase
    gdb_path = DATA_DIR / "MyProject8.gdb"
    if gdb_path.exists():
        try:
            import fiona
            import geopandas as gpd
            
            layers = fiona.listlayers(str(gdb_path))
            for layer_name in layers:
                logger.info(f"[{layer_name}] Discovering vector layer...")
                try:
                    with fiona.open(str(gdb_path), layer=layer_name) as src:
                        if len(src) == 0:
                            logger.warning(f"[{layer_name}] Validation failed: Empty layer. Skipping.")
                            continue
                            
                        features = list(src)
                        gdf = gpd.GeoDataFrame.from_features(features)
                        
                        if "geometry" not in gdf.columns:
                            logger.warning(f"[{layer_name}] Validation failed: No geometry column found (tabular data). Skipping.")
                            continue
                            
                        if src.crs:
                            gdf.set_crs(src.crs, allow_override=True, inplace=True)
                    
                    if gdf.empty:
                        logger.warning(f"[{layer_name}] Validation failed: Empty layer after parsing. Skipping.")
                        continue
                        
                    # Validate and fix geometries
                    initial_count = len(gdf)
                    gdf = gdf[gdf.geometry.notnull() & gdf.geometry.is_valid]
                    if len(gdf) < initial_count:
                        logger.warning(f"[{layer_name}] Repaired/removed {initial_count - len(gdf)} invalid geometries.")
                        
                    # Reproject to EPSG:4326 for standard spatial operations
                    if gdf.crs and gdf.crs.to_string() != "EPSG:4326":
                        gdf = gdf.to_crs("EPSG:4326")
                        
                    gis_cache.vectors[layer_name] = gdf
                    gis_cache.spatial_indices[layer_name] = gdf.sindex
                    logger.info(f"Successfully loaded and cached {layer_name} vector layer ({len(gdf)} features).")
                except Exception as inner_e:
                    logger.error(f"Failed to load vector layer {layer_name}: {inner_e}")
        except Exception as e:
            logger.error(f"Failed to open Geodatabase at {gdb_path}: {e}")
    else:
        logger.warning(f"Master Vector Database not found: {gdb_path}")

def unload_gis_data():
    for name, raster in gis_cache.rasters.items():
        try:
            raster["dataset"].close()
        except Exception:
            pass
    gis_cache.rasters.clear()
    
    # Cleanup Vectors
    gis_cache.vectors.clear()
    gis_cache.spatial_indices.clear()
    
    logger.info("Cleared GIS cache and closed rasters/vectors.")
