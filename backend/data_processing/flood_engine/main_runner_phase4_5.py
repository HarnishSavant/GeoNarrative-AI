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

# Suppress noisy warnings
warnings.filterwarnings("ignore", category=UserWarning)

# Fix for PROJ conflict with PostGIS on Windows
if 'PROJ_LIB' in os.environ:
    del os.environ['PROJ_LIB']
if 'PROJ_DATA' in os.environ:
    del os.environ['PROJ_DATA']

def main():
    project_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    data_dir = os.path.join(project_dir, 'data')
    gdb_path = os.path.join(data_dir, 'MyProject8.gdb')
    out_dir = os.path.join(project_dir, 'data_processed', 'flood_scenarios')
    
    print("==================================================")
    print("PHASE 4.5: FINAL STUDY-AREA & ASSET REPAIR")
    print("==================================================")
    
    if not os.path.exists(gdb_path):
        print(f"CRITICAL ERROR: {gdb_path} not found.")
        return

    # 1. INVESTIGATE ALL LAYERS FOR THE REAL PMC BOUNDARY
    print("\n1. INVESTIGATING ALL GDB LAYERS...")
    layers = fiona.listlayers(gdb_path)
    
    target_crs = "EPSG:32643"
    layer_stats = []
    
    for l in layers:
        try:
            gdf = gpd.read_file(gdb_path, layer=l, rows=10) # Just check geometry type quickly
            geom_type = gdf.geom_type.iloc[0] if len(gdf) > 0 else "Unknown"
            if geom_type in ["Polygon", "MultiPolygon"]:
                full_gdf = gpd.read_file(gdb_path, layer=l)
                full_gdf = full_gdf.to_crs(target_crs)
                area = full_gdf.geometry.area.sum() / 1e6
                layer_stats.append({
                    "name": l,
                    "type": geom_type,
                    "count": len(full_gdf),
                    "area": area,
                    "gdf": full_gdf
                })
        except Exception:
            pass

    print(f"{'Layer Name':<30} | {'Type':<15} | {'Count':<8} | {'Area (km2)':<10}")
    print("-" * 70)
    for stat in layer_stats:
        print(f"{stat['name']:<30} | {stat['type']:<15} | {stat['count']:<8} | {stat['area']:<10.2f}")

    # Select PMC: Looking for polygon between 200 - 500 km2 (Pune PMC is ~331 km2)
    # Or specifically containing 'pune' or 'pmc'
    pmc_candidate = None
    for stat in layer_stats:
        name_lower = stat['name'].lower()
        if 'building' in name_lower or 'water' in name_lower or 'road' in name_lower or 'natural' in name_lower or 'landue' in name_lower:
            continue
        if 200 <= stat['area'] <= 500:
            pmc_candidate = stat
            break
            
    if not pmc_candidate:
        print("\nCRITICAL ERROR: Authoritative PMC boundary unavailable.")
        print("Could not find a polygon layer matching PMC size (~331 km2).")
        return
        
    print(f"\n-> SELECTED PMC BOUNDARY: {pmc_candidate['name']} ({pmc_candidate['area']:.2f} km2)")
    pmc_gdf = pmc_candidate['gdf']
    # Repair/dissolve if necessary
    pmc_gdf.geometry = pmc_gdf.geometry.make_valid()
    pmc_geom = [mapping(geom) for geom in pmc_gdf.geometry]

    # 2. DEM CLIPPING
    dem_path = os.path.join(data_dir, 'dem.tif')
    with rasterio.open(dem_path) as src:
        dem_crs = src.crs
        print("\n2. CLIPPING DEM STRICTLY TO PMC BOUNDARY...")
        out_image, out_transform = mask(src, pmc_geom, crop=True)
        out_meta = src.meta.copy()
        
    dem = out_image[0].astype(np.float32)
    dem[dem == out_meta['nodata']] = np.nan
    
    out_meta.update({
        "driver": "GTiff",
        "height": dem.shape[0],
        "width": dem.shape[1],
        "transform": out_transform
    })
    
    res_x = abs(out_transform.a)
    res_y = abs(out_transform.e)
    res_x_m = res_x * 111320.0 if res_x < 0.1 else res_x
    res_y_m = res_y * 111320.0 if res_y < 0.1 else res_y
    pixel_area_m2 = res_x_m * res_y_m
    pmc_valid_area_km2 = (np.count_nonzero(~np.isnan(dem)) * pixel_area_m2) / 1e6
    print(f"   - Valid Analysis Area: {pmc_valid_area_km2:.2f} km²")
    
    try:
        w, s, e, n = transform_bounds(dem_crs, 'EPSG:4326', *rasterio.transform.array_bounds(dem.shape[0], dem.shape[1], out_transform))
        wgs84_bounds = {"west": w, "south": s, "east": e, "north": n}
    except:
        import pyproj
        transformer = pyproj.Transformer.from_crs(dem_crs, "EPSG:4326", always_xy=True)
        min_x, min_y, max_x, max_y = rasterio.transform.array_bounds(dem.shape[0], dem.shape[1], out_transform)
        w, s = transformer.transform(min_x, min_y)
        e, n = transformer.transform(max_x, max_y)
        wgs84_bounds = {"west": w, "south": s, "east": e, "north": n}

    print(f"   - WGS84 Bounds (E/N): Longitude {wgs84_bounds['west']:.4f}E to {wgs84_bounds['east']:.4f}E, Latitude {wgs84_bounds['south']:.4f}N to {wgs84_bounds['north']:.4f}N")

    # 3. BUILDINGS FIX
    print("\n3. PROCESSING BUILDINGS...")
    bld_layer = next((l for l in layers if 'building' in l.lower()), None)
    if bld_layer:
        bld_gdf = gpd.read_file(gdb_path, layer=bld_layer)
        orig_count = len(bld_gdf)
        # Explode MultiPolygons
        bld_gdf = bld_gdf.explode(index_parts=False).reset_index(drop=True)
        # Make valid and remove empty
        bld_gdf.geometry = bld_gdf.geometry.make_valid()
        bld_gdf = bld_gdf[~bld_gdf.geometry.is_empty]
        bld_gdf = bld_gdf.to_crs(dem_crs)
        print(f"   - Original feature count: {orig_count}")
        print(f"   - Exploded individual building count: {len(bld_gdf)}")
        print(f"   - Total footprint area: {(bld_gdf.geometry.area.sum() / 1e6):.2f} km2")
    else:
        bld_gdf = None
        print("   - No building layer found.")

    # 4. ROADS
    print("\n4. PROCESSING ROADS...")
    road_layer = next((l for l in layers if 'road' in l.lower()), None)
    if road_layer:
        road_gdf = gpd.read_file(gdb_path, layer=road_layer).to_crs(dem_crs)
        # Clip roads to PMC
        road_gdf = gpd.clip(road_gdf, pmc_gdf.to_crs(dem_crs))
        metric_road = road_gdf.to_crs(target_crs)
        print(f"   - Road segment count (clipped): {len(road_gdf)}")
        print(f"   - Total road length: {(metric_road.geometry.length.sum() / 1000):.2f} km")
    else:
        road_gdf = None

    # 5. WATER
    print("\n5. PROCESSING WATER...")
    water_layer = next((l for l in layers if 'water' in l.lower() or 'river' in l.lower()), None)
    if water_layer:
        water_gdf = gpd.read_file(gdb_path, layer=water_layer).to_crs(dem_crs)
        water_gdf = gpd.clip(water_gdf, pmc_gdf.to_crs(dem_crs))
        river_mask = rasterize([(geom, 1) for geom in water_gdf.geometry], out_shape=dem.shape, transform=out_transform, fill=0, dtype=np.uint8)
        perm_water_km2 = (np.sum(river_mask) * pixel_area_m2) / 1e6
        print(f"   - Permanent water area (clipped to PMC): {perm_water_km2:.2f} km2")
    else:
        river_mask = np.zeros(dem.shape, dtype=np.uint8)

    # 6. RUN SCENARIOS
    print("\n6. RE-RUNNING TEMPORAL FLOOD SCENARIOS...")
    from propagation import FloodPropagator
    dummy_res = np.zeros_like(dem); dummy_dist = np.zeros_like(dem); dummy_susc = np.ones_like(dem)
    config = {"propagation_weights": {"distance_penalty": 0.0, "surface_resistance": 0.0, "susceptibility_penalty": 0.0, "uphill_penalty": 500.0}}
    propagator = FloodPropagator(dem, river_mask, dummy_res, dummy_dist, dummy_susc, config)

    scenarios = [
        {"id": "normal", "rise": 0.2, "frames": 30},
        {"id": "moderate", "rise": 2.5, "frames": 35},
        {"id": "heavy", "rise": 6.0, "frames": 40},
        {"id": "extreme", "rise": 12.0, "frames": 45}
    ]

    final_comparison = {}
    
    # Pre-calculate building centroids and their row/col indices to save time
    if bld_gdf is not None:
        centroids = bld_gdf.to_crs(dem_crs).geometry.centroid
        b_rows, b_cols = rasterio.transform.rowcol(out_transform, centroids.x, centroids.y)
        b_rows = np.array(b_rows); b_cols = np.array(b_cols)
        valid_b = (b_rows >= 0) & (b_rows < dem.shape[0]) & (b_cols >= 0) & (b_cols < dem.shape[1])
        b_rows = b_rows[valid_b]; b_cols = b_cols[valid_b]

    for scen in scenarios:
        sid = scen["id"]
        print(f"\n -> Running {sid.upper()}...")
        scen_dir = os.path.join(out_dir, sid)
        os.makedirs(os.path.join(scen_dir, 'preview'), exist_ok=True)
        
        frames, _ = propagator.run_scenario({"max_cost_threshold": 1000.0, "water_level_rise_m": scen["rise"], "frames": scen["frames"]})
        
        stats = []
        for f in frames:
            idx = f["frame"]
            depth = f["depth"]
            
            temp_flood_mask = (depth > 0) & (river_mask == 0) & (~np.isnan(dem))
            temp_area_km2 = (np.sum(temp_flood_mask) * pixel_area_m2) / 1e6
            
            affected_buildings = 0
            critical_buildings = 0
            if bld_gdf is not None:
                b_depths = depth[b_rows, b_cols]
                affected_buildings = int(np.sum(b_depths > 0))
                critical_buildings = int(np.sum(b_depths > 2.0))
                
            affected_road_km = 0.0
            if road_gdf is not None:
                # Proportional road calculation (approximate intersection to save massive CPU time)
                affected_road_km = float((temp_area_km2 / pmc_valid_area_km2) * metric_road.geometry.length.sum() / 1000)

            stats.append({
                "frame": idx,
                "flooded_area_km2": temp_area_km2,
                "max_depth_m": float(np.max(depth)) if np.any(temp_flood_mask) else 0.0,
                "affected_buildings": affected_buildings,
                "critical_buildings": critical_buildings,
                "affected_road_km": affected_road_km
            })
            
            # Export PNG
            rgba = np.zeros((depth.shape[0], depth.shape[1], 4), dtype=np.uint8)
            rgba[(depth > 0) & (depth <= 0.3)] = [175, 238, 238, 200]
            rgba[(depth > 0.3) & (depth <= 1.0)] = [135, 206, 250, 210]
            rgba[(depth > 1.0) & (depth <= 2.5)] = [65, 105, 225, 230]
            rgba[depth > 2.5] = [0, 0, 139, 255]
            Image.fromarray(rgba).save(os.path.join(scen_dir, 'preview', f"frame_{idx:03d}.png"))
            
        with open(os.path.join(scen_dir, 'metadata.json'), 'w') as f:
            json.dump({
                "id": sid,
                "model_type": "GIS-driven DEM-constrained temporal inundation scenario model",
                "frame_count": len(frames),
                "bounds_wgs84": wgs84_bounds,
                "max_flooded_area_km2": stats[-1]["flooded_area_km2"],
                "max_depth_m": stats[-1]["max_depth_m"],
                "stats": stats
            }, f, indent=2)
            
        final_comparison[sid] = {
            "final_temporary_flood_km2": stats[-1]["flooded_area_km2"],
            "max_depth_m": stats[-1]["max_depth_m"],
            "affected_buildings": stats[-1]["affected_buildings"],
            "critical_buildings": stats[-1]["critical_buildings"],
            "affected_road_km": stats[-1]["affected_road_km"]
        }
        
    with open(os.path.join(out_dir, 'scenario_comparison.json'), 'w') as f:
        json.dump(final_comparison, f, indent=2)
        
    print("\n==================================================")
    print("PHASE 4.5 PROCESSING COMPLETE")
    print("==================================================")
    print("Please copy this terminal output back so the final report can be generated.")

if __name__ == "__main__":
    main()
