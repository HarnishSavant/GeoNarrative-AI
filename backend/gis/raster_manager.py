import rasterio
import logging
from .cache import gis_cache
from typing import Dict, Any, Optional

logger = logging.getLogger("gis_raster_manager")

class RasterManager:
    @staticmethod
    def get_pixel_value(raster_name: str, lat: float, lon: float) -> Optional[Any]:
        raster = gis_cache.rasters.get(raster_name)
        if not raster:
            return None
        
        try:
            dataset = raster["dataset"]
            
            from rasterio.warp import transform
            # Convert EPSG:4326 to the dataset's CRS
            xs, ys = transform('EPSG:4326', dataset.crs, [lon], [lat])
            x, y = xs[0], ys[0]
            
            row, col = dataset.index(x, y)
            
            # Check bounds to avoid out of bounds exceptions
            if row < 0 or row >= dataset.height or col < 0 or col >= dataset.width:
                return None
                
            # Use rasterio window to efficiently sample exactly 1 pixel without reading the whole file
            window = rasterio.windows.Window(col, row, 1, 1)
            data = dataset.read(1, window=window)
            val = data[0, 0]
            
            if dataset.nodata is not None and val == dataset.nodata:
                return None
                
            return val
        except Exception as e:
            logger.error(f"Error sampling {raster_name} at {lat},{lon}: {e}")
            return None

    @staticmethod
    def sample_batch(raster_name: str, lats: list, lons: list) -> list:
        """Vectorized high-speed batch pixel sampling for GIS grids."""
        raster = gis_cache.rasters.get(raster_name)
        if not raster or not lats or not lons:
            return [None] * len(lats)
            
        try:
            dataset = raster["dataset"]
            from rasterio.warp import transform
            # Vectorized transformation of all coordinates at once
            xs, ys = transform('EPSG:4326', dataset.crs, lons, lats)
            coords = list(zip(xs, ys))
            
            # C-speed rasterio sampling
            samples = list(dataset.sample(coords))
            results = []
            nodata = dataset.nodata
            for val_array in samples:
                val = val_array[0]
                if nodata is not None and val == nodata:
                    results.append(None)
                else:
                    results.append(val)
            return results
        except Exception as e:
            logger.error(f"Error in batch sampling {raster_name}: {e}")
            return [None] * len(lats)

    @staticmethod
    def get_info(raster_name: str) -> Dict[str, Any]:
        raster = gis_cache.rasters.get(raster_name)
        if not raster:
            return {}
        ds = raster["dataset"]
        return {
            "name": raster_name,
            "crs": str(ds.crs),
            "width": ds.width,
            "height": ds.height,
            "bounds": [ds.bounds.left, ds.bounds.bottom, ds.bounds.right, ds.bounds.top],
            "nodata": ds.nodata
        }

