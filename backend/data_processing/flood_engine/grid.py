import os
import numpy as np
import rasterio
from rasterio.enums import Resampling
from rasterio.warp import calculate_default_transform, reproject
from rasterio.mask import mask
import geopandas as gpd

class GridManager:
    def __init__(self, master_dem_path, pmc_boundary_path, out_dir):
        self.master_dem_path = master_dem_path
        self.pmc_boundary_path = pmc_boundary_path
        self.out_dir = out_dir
        os.makedirs(out_dir, exist_ok=True)
        self.base_profile = None

    def create_master_grid(self, target_resolution=30.0):
        # Read DEM and setup the target 30m grid
        out_path = os.path.join(self.out_dir, "dem_conditioned.tif")
        with rasterio.open(self.master_dem_path) as src:
            # We clip to PMC boundary if provided
            if self.pmc_boundary_path:
                pmc = gpd.read_file(self.pmc_boundary_path)
                if pmc.crs != src.crs:
                    pmc = pmc.to_crs(src.crs)
                
                # Mask DEM
                out_image, out_transform = mask(src, pmc.geometry, crop=True)
                out_meta = src.meta.copy()
                out_meta.update({"driver": "GTiff",
                                 "height": out_image.shape[1],
                                 "width": out_image.shape[2],
                                 "transform": out_transform})
            else:
                out_image = src.read()
                out_transform = src.transform
                out_meta = src.meta.copy()
            
            # Write temporary masked DEM
            tmp_dem = os.path.join(self.out_dir, "tmp_dem.tif")
            with rasterio.open(tmp_dem, "w", **out_meta) as dest:
                dest.write(out_image)
                
            is_geographic = src.crs.is_geographic
            # If geographic, convert 30m to degrees (roughly 1 degree = 111320 meters)
            if is_geographic:
                target_resolution = target_resolution / 111320.0
        
        # Now resample to target resolution
        with rasterio.open(tmp_dem) as src:
            transform, width, height = calculate_default_transform(
                src.crs, src.crs, src.width, src.height, *src.bounds, resolution=target_resolution)
            
            kwargs = src.meta.copy()
            kwargs.update({
                'crs': src.crs,
                'transform': transform,
                'width': width,
                'height': height
            })
            
            with rasterio.open(out_path, 'w', **kwargs) as dst:
                for i in range(1, src.count + 1):
                    reproject(
                        source=rasterio.band(src, i),
                        destination=rasterio.band(dst, i),
                        src_transform=src.transform,
                        src_crs=src.crs,
                        dst_transform=transform,
                        dst_crs=src.crs,
                        resampling=Resampling.bilinear)
            
            self.base_profile = kwargs
            
        os.remove(tmp_dem)
        return out_path, self.base_profile

    def align_raster(self, input_path, output_name, is_categorical=False):
        out_path = os.path.join(self.out_dir, output_name)
        resampling = Resampling.nearest if is_categorical else Resampling.bilinear
        
        with rasterio.open(input_path) as src:
            with rasterio.open(out_path, 'w', **self.base_profile) as dst:
                for i in range(1, src.count + 1):
                    reproject(
                        source=rasterio.band(src, i),
                        destination=rasterio.band(dst, i),
                        src_transform=src.transform,
                        src_crs=src.crs,
                        dst_transform=self.base_profile['transform'],
                        dst_crs=self.base_profile['crs'],
                        resampling=resampling)
        
        # Assertions
        with rasterio.open(out_path) as verify:
            assert verify.width == self.base_profile['width']
            assert verify.height == self.base_profile['height']
            assert verify.crs == self.base_profile['crs']
            
        return out_path
