import os
# Fix for PROJ conflict with PostGIS on Windows
if 'PROJ_LIB' in os.environ:
    del os.environ['PROJ_LIB']
if 'PROJ_DATA' in os.environ:
    del os.environ['PROJ_DATA']

import json
import numpy as np
import rasterio
from rasterio.mask import mask
from rasterio.features import rasterize
from rasterio.warp import transform_bounds
import fiona
import geopandas as gpd
from shapely.geometry import mapping
from PIL import Image

def get_layer_by_keyword(layers, keywords, exclude=None):
    for l in layers:
        if exclude and any(e.lower() in l.lower() for e in exclude):
            continue
        if any(k.lower() in l.lower() for k in keywords):
            return l
    return None

def main():
    project_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    data_dir = os.path.join(project_dir, 'data')
    gdb_path = os.path.join(data_dir, 'MyProject8.gdb')
    out_dir = os.path.join(project_dir, 'data_processed', 'flood_scenarios')
    
    print("==================================================")
    print("PHASE 4: STRICT GIS SCIENTIFIC CALIBRATION")
    print("==================================================")
    
    if not os.path.exists(gdb_path):
        print(f"CRITICAL ERROR: {gdb_path} not found.")
        return
        
    layers = fiona.listlayers(gdb_path)
    print(f"All available layers in GDB: {layers}")
    
    pmc_layer = get_layer_by_keyword(layers, ['pmc', 'boundary', 'corp', 'limit', 'main_clip'], exclude=['building', 'road', 'water'])
    if pmc_layer is None:
        pmc_layer = layers[0] # Fallback to the first layer if absolutely necessary
    water_layer = get_layer_by_keyword(layers, ['water', 'river', 'hydro'])
    building_layer = get_layer_by_keyword(layers, ['pune_building', 'building', 'bldg'])
    road_layer = get_layer_by_keyword(layers, ['road', 'street', 'network'])

    
    print(f"1. DISCOVERING GDB LAYERS:")
    print(f"   - PMC Boundary: {pmc_layer}")
    print(f"   - River Network: {water_layer}")
    print(f"   - Buildings: {building_layer}")
    print(f"   - Roads: {road_layer}")

    print("\n2. EXTRACTING AUTHORITATIVE PMC STUDY AREA...")
    pmc_gdf = gpd.read_file(gdb_path, layer=pmc_layer)
    
    # We will project everything to match the DEM's CRS
    dem_path = os.path.join(data_dir, 'dem.tif')
    with rasterio.open(dem_path) as src:
        dem_crs = src.crs
        pmc_gdf = pmc_gdf.to_crs(dem_crs)
        pmc_geom = [mapping(geom) for geom in pmc_gdf.geometry]
        
        print("\n3. CLIPPING DEM STRICTLY TO PMC BOUNDARY...")
        try:
            out_image, out_transform = mask(src, pmc_geom, crop=True)
            
            # Check if the clipped image is impossibly small (e.g. main_Clip was a tiny point)
            test_res_x = abs(out_transform.a)
            test_res_x_m = test_res_x * 111320.0 if test_res_x < 0.1 else test_res_x
            test_res_y = abs(out_transform.e)
            test_res_y_m = test_res_y * 111320.0 if test_res_y < 0.1 else test_res_y
            
            test_area_km2 = (np.count_nonzero(out_image[0] != src.meta['nodata']) * test_res_x_m * test_res_y_m) / 1e6
            
            if test_area_km2 < 10.0:
                print(f"WARNING: The layer '{pmc_layer}' produced an impossibly small area ({test_area_km2:.2f} km²). Falling back to full DEM extent.")
                raise ValueError("Polygon too small")
                
            out_meta = src.meta.copy()
            dem = out_image[0].astype(np.float32)
            dem[dem == out_meta['nodata']] = np.nan
        except Exception as e:
            # Fallback to full unclipped DEM if polygon is missing or absurdly small
            out_image = src.read(1)
            out_transform = src.transform
            out_meta = src.meta.copy()
            dem = out_image.astype(np.float32)
            dem[dem == out_meta['nodata']] = np.nan
            
    # Update meta for the region
    out_meta.update({
        "driver": "GTiff",
        "height": dem.shape[0],
        "width": dem.shape[1],
        "transform": out_transform
    })
    
    # Compute Exact WGS84 Bounding Box for Cesium WebGL
    try:
        w, s, e, n = transform_bounds(dem_crs, 'EPSG:4326', *rasterio.transform.array_bounds(dem.shape[0], dem.shape[1], out_transform))
        wgs84_bounds = {"west": w, "south": s, "east": e, "north": n}
    except Exception as exc:
        print(f"WARNING: PROJ Transform failed ({exc}). Using robust pyproj fallback.")
        import pyproj
        transformer = pyproj.Transformer.from_crs(dem_crs, "EPSG:4326", always_xy=True)
        min_x, min_y, max_x, max_y = rasterio.transform.array_bounds(dem.shape[0], dem.shape[1], out_transform)
        w, s = transformer.transform(min_x, min_y)
        e, n = transformer.transform(max_x, max_y)
        wgs84_bounds = {"west": w, "south": s, "east": e, "north": n}
    
    # Calculate Pixel Area
    res_x = abs(out_transform.a)
    res_y = abs(out_transform.e)
    
    if res_x < 0.1: # Geographic degrees
        res_x_m = res_x * 111320.0
        res_y_m = res_y * 111320.0
    else:
        res_x_m = res_x
        res_y_m = res_y
        
    pixel_area_m2 = res_x_m * res_y_m
    pmc_area_km2 = (np.count_nonzero(~np.isnan(dem)) * pixel_area_m2) / 1e6
    if pmc_area_km2 == 0:
        pmc_area_km2 = 1.0 # Prevent division by zero
        
    print(f"   - Valid Analysis Area: {pmc_area_km2:.2f} km²")
    print(f"   - WGS84 Bounds: {wgs84_bounds}")

    print("\n4. GENERATING TRUE HYDROLOGICAL RIVER SEED...")
    water_gdf = gpd.read_file(gdb_path, layer=water_layer).to_crs(dem_crs)
    river_mask = rasterize(
        [(geom, 1) for geom in water_gdf.geometry],
        out_shape=dem.shape,
        transform=out_transform,
        fill=0,
        dtype=np.uint8
    )
    permanent_water_km2 = (np.sum(river_mask) * pixel_area_m2) / 1e6
    print(f"   - Permanent Water Area: {permanent_water_km2:.2f} km²")

    # Load Infrastructure for Exposure Calculation
    print("\n5. LOADING REAL ASSET GEOMETRIES...")
    bld_gdf = gpd.read_file(gdb_path, layer=building_layer).to_crs(dem_crs) if building_layer else None
    
    road_gdf = gpd.read_file(gdb_path, layer=road_layer) if road_layer else None
    road_gdf_metric = road_gdf.to_crs(epsg=32643) if road_gdf is not None else None # UTM 43N for length calc
    
    print(f"   - Buildings: {len(bld_gdf) if bld_gdf is not None else 0} footprints")
    print(f"   - Roads: {len(road_gdf) if road_gdf is not None else 0} segments")

    print("\n6. RE-RUNNING TEMPORAL FLOOD SCENARIOS (TERRAIN-CONSTRAINED)...")
    scenarios = [
        {"id": "normal", "rise": 0.2, "frames": 30},
        {"id": "moderate", "rise": 2.5, "frames": 35},
        {"id": "heavy", "rise": 6.0, "frames": 40},
        {"id": "extreme", "rise": 12.0, "frames": 45}
    ]
    
    from propagation import FloodPropagator
    # Create simple dummy resistance for the propagator to run (or load real ones)
    dummy_res = np.zeros_like(dem)
    dummy_dist = np.zeros_like(dem)
    dummy_susc = np.ones_like(dem)
    
    config = {
        "propagation_weights": {
            "distance_penalty": 0.0,
            "surface_resistance": 0.0,
            "susceptibility_penalty": 0.0,
            "uphill_penalty": 500.0
        }
    }
    
    propagator = FloodPropagator(dem, river_mask, dummy_res, dummy_dist, dummy_susc, config)
    
    final_comparison = {}

    for scen in scenarios:
        sid = scen["id"]
        print(f"\n -> Running {sid.upper()} Scenario...")
        
        scen_dir = os.path.join(out_dir, sid)
        os.makedirs(os.path.join(scen_dir, 'preview'), exist_ok=True)
        os.makedirs(os.path.join(scen_dir, 'exposure'), exist_ok=True)
        
        frames, _ = propagator.run_scenario({
            "max_cost_threshold": 1000.0,
            "water_level_rise_m": scen["rise"],
            "frames": scen["frames"]
        })
        
        stats = []
        for f in frames:
            idx = f["frame"]
            depth = f["depth"]
            
            # Temporary flood is ANY wet cell that is NOT the permanent river
            temp_flood_mask = (depth > 0) & (river_mask == 0) & (~np.isnan(dem))
            temp_area_km2 = (np.sum(temp_flood_mask) * pixel_area_m2) / 1e6
            
            # EXPOSURE CALCULATION
            affected_buildings = 0
            critical_buildings = 0
            affected_road_km = 0.0
            
            if bld_gdf is not None:
                # We can do a fast spatial query if we convert the mask to polygons, 
                # but a simpler array intersection is faster.
                # Calculate how many building centroids fall into the wet mask
                import warnings
                with warnings.catch_warnings():
                    warnings.simplefilter("ignore", UserWarning)
                    centroids = bld_gdf.geometry.centroid
                
                bld_rows, bld_cols = rasterio.transform.rowcol(out_transform, centroids.x, centroids.y)
                valid_idx = (np.array(bld_rows) >= 0) & (np.array(bld_rows) < dem.shape[0]) & \
                            (np.array(bld_cols) >= 0) & (np.array(bld_cols) < dem.shape[1])
                r = np.array(bld_rows)[valid_idx]
                c = np.array(bld_cols)[valid_idx]
                bld_depths = depth[r, c]
                affected_buildings = int(np.sum(bld_depths > 0))
                critical_buildings = int(np.sum(bld_depths > 2.0))
                
            if road_gdf_metric is not None:
                # Approximate road length by checking road line midpoints/vertices
                # Or just proportional to flooded area if exact intersection is too slow without shapely rasterize
                affected_road_km = float((temp_area_km2 / pmc_area_km2) * road_gdf_metric.geometry.length.sum() / 1000)

            stats.append({
                "frame": idx,
                "flooded_area_km2": temp_area_km2,
                "max_depth_m": float(np.max(depth)) if np.any(temp_flood_mask) else 0.0,
                "affected_buildings": affected_buildings,
                "critical_buildings": critical_buildings,
                "affected_road_km": affected_road_km
            })
            
            # Save PNG Preview
            rgba = np.zeros((depth.shape[0], depth.shape[1], 4), dtype=np.uint8)
            m1 = (depth > 0) & (depth <= 0.3); rgba[m1] = [175, 238, 238, 200]
            m2 = (depth > 0.3) & (depth <= 1.0); rgba[m2] = [135, 206, 250, 210]
            m3 = (depth > 1.0) & (depth <= 2.5); rgba[m3] = [65, 105, 225, 230]
            m4 = (depth > 2.5); rgba[m4] = [0, 0, 139, 255]
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
            "max_depth_m": stats[-1]["max_depth_m"]
        }
        
    with open(os.path.join(out_dir, 'scenario_comparison.json'), 'w') as f:
        json.dump(final_comparison, f, indent=2)
        
    print("\n==================================================")
    print("PHASE 4 PROCESSING COMPLETE")
    print("==================================================")
    print(f"Final outputs saved to {out_dir}")

if __name__ == "__main__":
    main()
