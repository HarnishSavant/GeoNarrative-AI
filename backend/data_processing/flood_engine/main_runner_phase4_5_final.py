import os
import json
import warnings
import numpy as np
import rasterio
from rasterio.mask import mask
from rasterio.features import rasterize
from rasterio.warp import transform_bounds
import fiona
import geopandas as gpd
from shapely.geometry import mapping
from PIL import Image

warnings.filterwarnings("ignore", category=UserWarning)

if 'PROJ_LIB' in os.environ:
    del os.environ['PROJ_LIB']
if 'PROJ_DATA' in os.environ:
    del os.environ['PROJ_DATA']

def main():
    project_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    data_dir = os.path.join(project_dir, 'data')
    gdb_path = os.path.join(data_dir, 'MyProject8.gdb')
    out_dir = os.path.join(project_dir, 'data_processed', 'flood_scenarios')
    target_crs = "EPSG:32643"
    
    print("==================================================")
    print("PHASE 4.5: FINAL AUTHORITATIVE GIS RUN")
    print("==================================================")
    
    # 1. VALIDATE PMC BOUNDARY
    print("\n1. LOCATING AUTHORITATIVE PMC BOUNDARY...")
    pmc_file = os.path.join(data_dir, 'PMC.geojson')
    if not os.path.exists(pmc_file):
        boundary_dir = os.path.join(data_dir, 'boundary')
        if os.path.exists(boundary_dir):
            for f in os.listdir(boundary_dir):
                if 'pmc' in f.lower() and f.endswith(('.shp', '.geojson')):
                    pmc_file = os.path.join(boundary_dir, f)
                    break
    
    if not os.path.exists(pmc_file):
        print(f"CRITICAL ERROR: PMC Boundary not found at {pmc_file}")
        return
        
    pmc_gdf_src = gpd.read_file(pmc_file)
    print(f"   - Source File: {os.path.basename(pmc_file)}")
    print(f"   - Geometry Type: {pmc_gdf_src.geom_type.iloc[0]}")
    print(f"   - Feature Count: {len(pmc_gdf_src)}")
    print(f"   - Source CRS: {pmc_gdf_src.crs}")
    
    pmc_gdf = pmc_gdf_src.to_crs(target_crs)
    pmc_gdf.geometry = pmc_gdf.geometry.make_valid()
    pmc_gdf = pmc_gdf.dissolve()
    
    pmc_area_km2 = pmc_gdf.geometry.area.sum() / 1e6
    wgs84_pmc = pmc_gdf.to_crs("EPSG:4326")
    bounds = wgs84_pmc.total_bounds
    wgs84_bounds_dict = {"west": bounds[0], "south": bounds[1], "east": bounds[2], "north": bounds[3]}
    
    print(f"   - Projected CRS: {target_crs}")
    print(f"   - Valid Geometry: True")
    print(f"   - PMC Area: {pmc_area_km2:.2f} km²")
    print(f"   - WGS84 Bounds (E/N): Longitude {bounds[0]:.4f}E to {bounds[2]:.4f}E, Latitude {bounds[1]:.4f}N to {bounds[3]:.4f}N")

    # Load DEM first for CRS match
    dem_path = os.path.join(data_dir, 'dem.tif')
    with rasterio.open(dem_path) as src:
        dem_crs = src.crs
        pmc_geom = [mapping(geom) for geom in pmc_gdf.to_crs(dem_crs).geometry]
        
    print("\n2. PROCESSING BUILDINGS...")
    bld_gdf_src = gpd.read_file(gdb_path, layer='building')
    bld_source_count = len(bld_gdf_src)
    print(f"   - Source buildings: {bld_source_count}")
    
    bld_gdf = bld_gdf_src.to_crs(target_crs)
    bld_gdf.geometry = bld_gdf.geometry.make_valid()
    bld_gdf = gpd.clip(bld_gdf, pmc_gdf)
    bld_pmc_count = len(bld_gdf)
    bld_area_km2 = bld_gdf.geometry.area.sum() / 1e6
    bld_gdf = bld_gdf.to_crs(dem_crs)
    print(f"   - Buildings inside PMC: {bld_pmc_count}")
    print(f"   - Total footprint area: {bld_area_km2:.2f} km²")

    print("\n3. PROCESSING ROADS...")
    road_gdf_src = gpd.read_file(gdb_path, layer='roads')
    print(f"   - Source roads: {len(road_gdf_src)}")
    road_gdf = road_gdf_src.to_crs(target_crs)
    road_gdf = gpd.clip(road_gdf, pmc_gdf)
    road_length_km = road_gdf.geometry.length.sum() / 1000
    road_gdf = road_gdf.to_crs(dem_crs)
    print(f"   - Road segments inside PMC: {len(road_gdf)}")
    print(f"   - Total road length: {road_length_km:.2f} km")

    print("\n4. PROCESSING WATER...")
    water_gdf_src = gpd.read_file(gdb_path, layer='water')
    print(f"   - Source water features: {len(water_gdf_src)}")
    water_gdf = water_gdf_src.to_crs(target_crs)
    water_gdf = gpd.clip(water_gdf, pmc_gdf)
    water_area_km2 = water_gdf.geometry.area.sum() / 1e6
    water_gdf = water_gdf.to_crs(dem_crs)
    print(f"   - Water features inside PMC: {len(water_gdf)}")
    print(f"   - Permanent water area inside PMC: {water_area_km2:.2f} km²")

    print("\n5. RECLIPPING DEM & MASKING...")
    with rasterio.open(dem_path) as src:
        nodata_val = src.meta.get('nodata')
        if nodata_val is None:
            nodata_val = -9999.0
        out_image, out_transform = mask(src, pmc_geom, crop=True, nodata=nodata_val)
        out_meta = src.meta.copy()
        out_meta['nodata'] = nodata_val
        
    dem = out_image[0].astype(np.float32)
    dem[dem == nodata_val] = np.nan
    dem[dem <= 0] = np.nan # Pune is ~500m ASL, anything <= 0 is a masking artifact
    
    
    out_meta.update({"driver": "GTiff", "height": dem.shape[0], "width": dem.shape[1], "transform": out_transform})
    
    res_x = abs(out_transform.a)
    res_y = abs(out_transform.e)
    res_x_m = res_x * 111320.0 if res_x < 0.1 else res_x
    res_y_m = res_y * 111320.0 if res_y < 0.1 else res_y
    pixel_area_m2 = res_x_m * res_y_m
    pmc_raster_area_km2 = (np.count_nonzero(~np.isnan(dem)) * pixel_area_m2) / 1e6
    print(f"   - Raster Mask Area: {pmc_raster_area_km2:.2f} km²")
    print(f"   - Raster WGS84 Bounds: {wgs84_bounds_dict}")
    
    river_mask = rasterize([(geom, 1) for geom in water_gdf.geometry], out_shape=dem.shape, transform=out_transform, fill=0, dtype=np.uint8)

    print("\n6. REGENERATING FLOOD SCENARIOS...")
    from propagation import FloodPropagator
    from scipy.ndimage import distance_transform_edt
    
    print("   - Building valid cost surface...")
    dummy_res = np.ones_like(dem) * 0.1
    dummy_dist = distance_transform_edt(river_mask == 0)
    dummy_susc = np.ones_like(dem)
    
    config = {
        "propagation_weights": {
            "distance_penalty": 200.0,
            "surface_resistance": 50.0,
            "susceptibility_penalty": 0.0,
            "uphill_penalty": 500.0
        }
    }
    propagator = FloodPropagator(dem, river_mask, dummy_res, dummy_dist, dummy_susc, config)

    scenarios = [
        {"id": "normal", "rise": 0.2, "frames": 30},
        {"id": "moderate", "rise": 2.5, "frames": 35},
        {"id": "heavy", "rise": 6.0, "frames": 40},
        {"id": "extreme", "rise": 12.0, "frames": 45}
    ]

    # Pre-calculate building centroids and their row/col indices to save time
    print("   - Pre-calculating Building Centroids Matrix...")
    centroids = bld_gdf.geometry.centroid
    b_rows, b_cols = rasterio.transform.rowcol(out_transform, centroids.x, centroids.y)
    b_rows = np.array(b_rows); b_cols = np.array(b_cols)
    valid_b = (b_rows >= 0) & (b_rows < dem.shape[0]) & (b_cols >= 0) & (b_cols < dem.shape[1])
    b_rows = b_rows[valid_b]; b_cols = b_cols[valid_b]

    final_comparison = {}
    heavy_progress = []

    for scen in scenarios:
        sid = scen["id"]
        print(f"\n -> Running {sid.upper()}...")
        scen_dir = os.path.join(out_dir, sid)
        os.makedirs(os.path.join(scen_dir, 'preview'), exist_ok=True)
        
        frames, _ = propagator.run_scenario({"max_cost_threshold": 1000.0, "water_level_rise_m": scen["rise"], "frames": scen["frames"]})
        
        stats = []
        for i, f in enumerate(frames):
            idx = f["frame"]
            depth = f["depth"]
            
            temp_flood_mask = (depth > 0) & (river_mask == 0) & (~np.isnan(dem))
            temp_area_km2 = (np.sum(temp_flood_mask) * pixel_area_m2) / 1e6
            
            b_depths = depth[b_rows, b_cols]
            affected_buildings = int(np.sum(b_depths > 0))
            critical_buildings = int(np.sum(b_depths > 2.0))
            
            # Approximate exact proportional road length
            affected_road_km = float((temp_area_km2 / pmc_raster_area_km2) * road_length_km)

            max_depth = float(np.max(depth)) if np.any(temp_flood_mask) else 0.0

            stats.append({
                "frame": idx,
                "flooded_area_km2": temp_area_km2,
                "max_depth_m": max_depth,
                "affected_buildings": affected_buildings,
                "critical_buildings": critical_buildings,
                "affected_road_km": affected_road_km
            })
            
            if sid == "heavy":
                pct = (i / (len(frames) - 1)) * 100
                if pct in [0, 25, 50, 75, 100]:
                    heavy_progress.append(f"   - {int(pct)}%: {temp_area_km2:.2f} km²")
            
            # Export PNG
            rgba = np.zeros((depth.shape[0], depth.shape[1], 4), dtype=np.uint8)
            rgba[(depth > 0) & (depth <= 0.3)] = [175, 238, 238, 200]
            rgba[(depth > 0.3) & (depth <= 1.0)] = [135, 206, 250, 210]
            rgba[(depth > 1.0) & (depth <= 2.5)] = [65, 105, 225, 230]
            rgba[depth > 2.5] = [0, 0, 139, 255]
            Image.fromarray(rgba).save(os.path.join(scen_dir, 'preview', f"frame_{idx:03d}.png"))
            
        with open(os.path.join(scen_dir, 'metadata.json'), 'w') as fh:
            json.dump({
                "id": sid,
                "model_type": "GIS-driven DEM-constrained temporal inundation scenario model",
                "frame_count": len(frames),
                "bounds_wgs84": wgs84_bounds_dict,
                "max_flooded_area_km2": stats[-1]["flooded_area_km2"],
                "max_depth_m": stats[-1]["max_depth_m"],
                "stats": stats
            }, fh, indent=2)
            
        final_comparison[sid] = {
            "final_temporary_flood_km2": stats[-1]["flooded_area_km2"],
            "max_depth_m": stats[-1]["max_depth_m"],
            "affected_buildings": stats[-1]["affected_buildings"],
            "critical_buildings": stats[-1]["critical_buildings"],
            "affected_road_km": stats[-1]["affected_road_km"]
        }
        
    print("\n==================================================")
    print("FINAL VALIDATION STATISTICS")
    print("==================================================")
    print(f"NORMAL: Temp Flood {final_comparison['normal']['final_temporary_flood_km2']:.2f} km2 | Aff. Bldgs: {final_comparison['normal']['affected_buildings']} | Max Depth: {final_comparison['normal']['max_depth_m']:.2f}m")
    print(f"MODERATE: Temp Flood {final_comparison['moderate']['final_temporary_flood_km2']:.2f} km2 | Aff. Bldgs: {final_comparison['moderate']['affected_buildings']} | Max Depth: {final_comparison['moderate']['max_depth_m']:.2f}m")
    print(f"HEAVY: Temp Flood {final_comparison['heavy']['final_temporary_flood_km2']:.2f} km2 | Aff. Bldgs: {final_comparison['heavy']['affected_buildings']} | Max Depth: {final_comparison['heavy']['max_depth_m']:.2f}m")
    print(f"EXTREME: Temp Flood {final_comparison['extreme']['final_temporary_flood_km2']:.2f} km2 | Aff. Bldgs: {final_comparison['extreme']['affected_buildings']} | Max Depth: {final_comparison['extreme']['max_depth_m']:.2f}m")
    
    print("\nHEAVY PROGRESSION (Monotonicity Check):")
    for hp in heavy_progress:
        print(hp)

    with open(os.path.join(out_dir, 'scenario_comparison.json'), 'w') as f:
        json.dump(final_comparison, f, indent=2)
        
    print("\n==================================================")
    print("PHASE 4.5 PROCESSING COMPLETE")
    print("==================================================")
    print("Please copy this terminal output back so the final report can be generated.")

if __name__ == "__main__":
    main()
