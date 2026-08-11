import os
import json
import numpy as np
import rasterio

try:
    import xarray as xr
    import rioxarray
except ImportError:
    xr = None

try:
    from PIL import Image
except ImportError:
    Image = None

class DataExporter:
    def __init__(self, out_dir, profile):
        self.out_dir = out_dir
        self.profile = profile
        os.makedirs(out_dir, exist_ok=True)
        
    def export_scenario(self, scenario_id, frames, dem, arrival_time):
        scen_dir = os.path.join(self.out_dir, scenario_id)
        os.makedirs(os.path.join(scen_dir, 'preview'), exist_ok=True)
        
        # 1. Export NetCDF
        try:
            self._export_netcdf(scenario_id, frames, dem, scen_dir)
        except Exception as e:
            print(f"Skipping NetCDF export due to error: {e}")
            
        # 2. Export Previews and calculate stats
        stats = []
        for f in frames:
            idx = f["frame"]
            depth = f["depth"]
            wet = f["wet_mask"]
            
            # Calculate area based on CRS unit (degrees vs meters)
            res = abs(self.profile["transform"][0])
            if res < 0.1:  # Likely geographic (degrees)
                res_meters = res * 111320.0
                area_km2 = np.sum(wet) * (res_meters ** 2) / 1e6
            else:          # Projected (meters)
                area_km2 = np.sum(wet) * (res ** 2) / 1e6
            max_depth = float(np.max(depth)) if np.any(wet) else 0.0
            
            stats.append({
                "frame": idx,
                "flooded_area_km2": area_km2,
                "max_depth_m": max_depth
            })
            
            self._export_preview(depth, os.path.join(scen_dir, 'preview', f"frame_{idx:03d}.png"))
            
        # 3. Save Metadata
        with open(os.path.join(scen_dir, 'metadata.json'), 'w') as f:
            json.dump({
                "id": scenario_id,
                "model_type": "GIS-driven DEM-constrained temporal inundation",
                "frame_count": len(frames),
                "max_flooded_area_km2": stats[-1]["flooded_area_km2"],
                "max_depth_m": stats[-1]["max_depth_m"],
                "stats": stats
            }, f, indent=2)
            
    def _export_netcdf(self, scenario_id, frames, dem, scen_dir):
        if xr is None:
            raise ImportError("The 'xarray' and 'rioxarray' packages are required to generate NetCDF files. Please run: pip install xarray rioxarray")
            
        # Create Xarray dataset
        times = [f["frame"] for f in frames]
        depth_data = np.stack([f["depth"] for f in frames])
        
        ds = xr.Dataset(
            {
                "water_depth": (["time", "y", "x"], depth_data),
                "elevation": (["y", "x"], dem)
            },
            coords={
                "time": times,
            }
        )
        ds.rio.write_crs(self.profile["crs"], inplace=True)
        ds.rio.write_transform(self.profile["transform"], inplace=True)
        ds.to_netcdf(os.path.join(scen_dir, f"{scenario_id}_flood.nc"))

    def _export_preview(self, depth, out_path):
        if Image is None:
            raise ImportError("The 'Pillow' package is required to generate preview images. Please run: pip install pillow")
            
        # Create transparent PNG with color ramp
        rgba = np.zeros((depth.shape[0], depth.shape[1], 4), dtype=np.uint8)
        
        # Color Ramp
        # 0 - 0.3 m: Pale Cyan
        m1 = (depth > 0) & (depth <= 0.3)
        rgba[m1] = [175, 238, 238, 200]
        
        # 0.3 - 1.0 m: Light Blue
        m2 = (depth > 0.3) & (depth <= 1.0)
        rgba[m2] = [135, 206, 250, 210]
        
        # 1.0 - 2.5 m: Medium Blue
        m3 = (depth > 1.0) & (depth <= 2.5)
        rgba[m3] = [65, 105, 225, 230]
        
        # > 2.5 m: Deep Blue
        m4 = (depth > 2.5)
        rgba[m4] = [0, 0, 139, 255]
        
        img = Image.fromarray(rgba)
        img.save(out_path)
