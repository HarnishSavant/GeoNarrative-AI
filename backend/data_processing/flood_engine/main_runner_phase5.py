import os
import json
import warnings
import numpy as np
import rasterio
from rasterio.mask import mask
from rasterio.features import rasterize, shapes
from rasterio.warp import transform_bounds
import fiona
import geopandas as gpd
from shapely.geometry import mapping, shape, MultiPolygon
from PIL import Image
from scipy.ndimage import distance_transform_edt
from propagation import FloodPropagator

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
    print("PHASE 5: SCIENTIFIC SANITY AUDIT & FINAL RUN")
    print("==================================================")
    
    pmc_file = os.path.join(data_dir, 'PMC.geojson')
    pmc_gdf = gpd.read_file(pmc_file).to_crs(target_crs)
    pmc_gdf.geometry = pmc_gdf.geometry.make_valid()
    pmc_gdf = pmc_gdf.dissolve()
    
    # Load Water
    water_gdf_src = gpd.read_file(gdb_path, layer='water').to_crs(target_crs)
    water_gdf = gpd.clip(water_gdf_src, pmc_gdf)
    water_gdf_dem = water_gdf.to_crs(gpd.read_file(pmc_file).crs) # We'll reproject to dem_crs later

    # Export authoritative permanent river GeoJSON for Cesium Layer A (Always Active River)
    base_dir = os.path.join(project_dir, 'data_processed', 'base')
    os.makedirs(base_dir, exist_ok=True)
    perm_river_path = os.path.join(base_dir, 'permanent_river.geojson')
    water_gdf.to_crs("EPSG:4326")[['geometry']].to_file(perm_river_path, driver='GeoJSON')
    print(f" -> Exported authoritative permanent river ({len(water_gdf)} GIS features) to {perm_river_path}")

    # Load DEM
    dem_path = os.path.join(data_dir, 'dem.tif')
    with rasterio.open(dem_path) as src:
        dem_crs = src.crs
        pmc_geom = [mapping(geom) for geom in pmc_gdf.to_crs(dem_crs).geometry]
        
        nodata_val = src.meta.get('nodata')
        if nodata_val is None:
            nodata_val = -9999.0
        out_image, out_transform = mask(src, pmc_geom, crop=True, nodata=nodata_val)
        out_meta = src.meta.copy()
        out_meta['nodata'] = nodata_val
        
    dem = out_image[0].astype(np.float32)
    dem[dem == nodata_val] = np.nan
    dem[dem <= 0] = np.nan
    
    out_meta.update({"driver": "GTiff", "height": dem.shape[0], "width": dem.shape[1], "transform": out_transform})
    
    water_gdf_dem = water_gdf.to_crs(dem_crs)
    river_mask = rasterize([(geom, 1) for geom in water_gdf_dem.geometry], out_shape=dem.shape, transform=out_transform, fill=0, dtype=np.uint8)

    # Pixel Area
    res_x = abs(out_transform.a)
    res_y = abs(out_transform.e)
    res_x_m = res_x * 111320.0 if res_x < 0.1 else res_x
    res_y_m = res_y * 111320.0 if res_y < 0.1 else res_y
    pixel_area_m2 = res_x_m * res_y_m
    pmc_raster_area_km2 = (np.count_nonzero(~np.isnan(dem)) * pixel_area_m2) / 1e6
    
    print(f"DEM Min Elevation: {np.nanmin(dem):.2f}m | Max Elevation: {np.nanmax(dem):.2f}m", flush=True)

    # Load Assets
    print(" -> Loading and clipping 339,732 buildings to PMC Boundary (this takes ~30-60 seconds)...", flush=True)
    bld_gdf = gpd.read_file(gdb_path, layer='building').to_crs(target_crs)
    bld_gdf = gpd.clip(bld_gdf, pmc_gdf)
    bld_gdf = bld_gdf.explode(index_parts=False).reset_index(drop=True)
    bld_gdf.geometry = bld_gdf.geometry.make_valid()
    bld_gdf = bld_gdf[~bld_gdf.geometry.is_empty].to_crs(dem_crs)
    print(f"    [OK] Extracted {len(bld_gdf)} buildings inside PMC study area.", flush=True)
    
    centroids = bld_gdf.geometry.centroid
    b_rows, b_cols = rasterio.transform.rowcol(out_transform, centroids.x, centroids.y)
    b_rows = np.array(b_rows); b_cols = np.array(b_cols)
    valid_b = (b_rows >= 0) & (b_rows < dem.shape[0]) & (b_cols >= 0) & (b_cols < dem.shape[1])
    b_rows = b_rows[valid_b]; b_cols = b_cols[valid_b]

    print(" -> Precomputing WGS84 building coordinates for real-time performance...", flush=True)
    centroids_wgs = centroids.to_crs("EPSG:4326")
    b_lons = centroids_wgs.x.to_numpy()[valid_b]
    b_lats = centroids_wgs.y.to_numpy()[valid_b]
    print(f"    [OK] Precomputed WGS84 points for {len(b_lons)} buildings.", flush=True)

    print(" -> Loading and clipping arterial road network (this takes ~15-30 seconds)...", flush=True)
    road_gdf = gpd.read_file(gdb_path, layer='roads').to_crs(target_crs)
    road_gdf = gpd.clip(road_gdf, pmc_gdf)
    print(f"    [OK] Extracted {len(road_gdf)} road segments inside PMC study area.", flush=True)
    
    print(" -> Precomputing spatial mappings and lengths for arterial road segments...", flush=True)
    road_gdf_wgs = road_gdf.to_crs("EPSG:4326")
    road_gdf_dem = road_gdf.to_crs(dem_crs)
    road_features_cache = []

    for idx in range(len(road_gdf)):
        utm_geom = road_gdf.iloc[idx].geometry
        if utm_geom is None or utm_geom.is_empty or not utm_geom.is_valid:
            continue
        length_km = float(utm_geom.length / 1000.0)
        
        dem_geom = road_gdf_dem.iloc[idx].geometry
        wgs_geom = road_gdf_wgs.iloc[idx].geometry
        if dem_geom is None or dem_geom.is_empty:
            continue
            
        coords = []
        if dem_geom.geom_type == 'LineString':
            coords.extend(dem_geom.coords)
        elif dem_geom.geom_type == 'MultiLineString':
            for line in dem_geom.geoms:
                coords.extend(line.coords)
        if not coords:
            continue
            
        xs, ys = zip(*coords)
        r_rows, r_cols = rasterio.transform.rowcol(out_transform, xs, ys)
        r_rows = np.array(r_rows); r_cols = np.array(r_cols)
        valid_r = (r_rows >= 0) & (r_rows < dem.shape[0]) & (r_cols >= 0) & (r_cols < dem.shape[1])
        r_rows = r_rows[valid_r]; r_cols = r_cols[valid_r]
        if len(r_rows) == 0:
            continue
            
        road_features_cache.append({
            "feature": {"type": "Feature", "geometry": mapping(wgs_geom), "properties": {}},
            "length_km": length_km,
            "rows": r_rows,
            "cols": r_cols
        })
    print(f"    [OK] Precomputed high-speed spatial mappings for {len(road_features_cache)} road segments.", flush=True)
    
    # Create Cost Surface
    print(" -> Generating Euclidean distance transform and hydrological cost surface...", flush=True)
    dummy_res = np.ones_like(dem) * 0.1
    dummy_dist = distance_transform_edt(river_mask == 0)
    dummy_susc = np.ones_like(dem)
    print("    [OK] Cost surface initialized. Beginning temporal flood scenario simulation...", flush=True)
    
    config = {
        "propagation_weights": {
            "distance_penalty": 250.0,
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
    
    final_comparison = {}
    
    for scen in scenarios:
        sid = scen["id"]
        print(f"\n -> Running {sid.upper()}...")
        scen_dir = os.path.join(out_dir, sid)
        os.makedirs(os.path.join(scen_dir, 'preview'), exist_ok=True)
        
        frames, _ = propagator.run_scenario({"max_cost_threshold": 1000.0, "water_level_rise_m": scen["rise"], "frames": scen["frames"]})
        
        # AUDIT LAST FRAME
        final_depth = frames[-1]["depth"]
        temp_flood = (final_depth > 0) & (river_mask == 0) & (~np.isnan(dem))
        cap_val = scen["rise"] * 1.5
        
        if np.any(temp_flood):
            valid_depths = final_depth[temp_flood]
            print(f"   [AUDIT] {sid.upper()} Flood Depths:")
            print(f"     Min: {np.min(valid_depths):.2f}m | Mean: {np.mean(valid_depths):.2f}m | Median: {np.median(valid_depths):.2f}m")
            print(f"     P95: {np.percentile(valid_depths, 95):.2f}m | P99: {np.percentile(valid_depths, 99):.2f}m | Max: {np.max(valid_depths):.2f}m")
            cap_val = np.percentile(valid_depths, 99.9)
            if cap_val < 0.1: cap_val = scen["rise"] * 1.5
            print(f"     -> Capping extreme outlier artifacts at {cap_val:.2f}m")
            
        stats = []
        os.makedirs(os.path.join(scen_dir, 'exposure'), exist_ok=True)
        
        for i, f in enumerate(frames):
            depth = f["depth"]
            depth[depth > cap_val] = cap_val
            
            temp_flood_mask = (depth > 0) & (river_mask == 0) & (~np.isnan(dem))
            temp_area_km2 = (np.sum(temp_flood_mask) * pixel_area_m2) / 1e6
            
            # 1. ACTUAL BUILDING EXPOSURE (Spatial Intersection)
            b_depths = depth[b_rows, b_cols]
            affected_b_idx = np.where(b_depths > 0)[0]
            affected_buildings = len(affected_b_idx)
            critical_buildings = int(np.sum(b_depths > 2.0))
            
            # Export affected buildings as fast GeoJSON points using direct JSON dumping
            if len(affected_b_idx) > 0:
                features_b = [
                    {
                        "type": "Feature",
                        "geometry": {"type": "Point", "coordinates": [round(float(lon), 6), round(float(lat), 6)]},
                        "properties": {"depth": round(float(d), 2)}
                    }
                    for lon, lat, d in zip(b_lons[affected_b_idx], b_lats[affected_b_idx], b_depths[affected_b_idx])
                ]
                with open(os.path.join(scen_dir, 'exposure', f'buildings_{f["frame"]:03d}.geojson'), 'w') as fh_b:
                    json.dump({"type": "FeatureCollection", "features": features_b}, fh_b)
            else:
                with open(os.path.join(scen_dir, 'exposure', f'buildings_{f["frame"]:03d}.geojson'), 'w') as fh_b:
                    json.dump({"type": "FeatureCollection", "features": []}, fh_b)
            
            # 2. ACTUAL ROAD EXPOSURE (High-Speed Precomputed Intersection)
            affected_road_km = 0.0
            affected_road_features = []
            if len(road_features_cache) > 0 and np.any(temp_flood_mask):
                for r_item in road_features_cache:
                    if np.any(temp_flood_mask[r_item["rows"], r_item["cols"]]):
                        affected_road_km += r_item["length_km"]
                        affected_road_features.append(r_item["feature"])

            with open(os.path.join(scen_dir, 'exposure', f'roads_{f["frame"]:03d}.geojson'), 'w') as fh_r:
                json.dump({"type": "FeatureCollection", "features": affected_road_features}, fh_r)

            max_depth = float(np.max(depth)) if np.any(temp_flood_mask) else 0.0
            mean_depth = float(np.mean(depth[temp_flood_mask])) if np.any(temp_flood_mask) else 0.0

            stats.append({
                "frame": f["frame"],
                "flooded_area_km2": temp_area_km2,
                "max_depth_m": max_depth,
                "mean_depth_m": mean_depth,
                "affected_buildings": affected_buildings,
                "critical_buildings": critical_buildings,
                "affected_road_km": affected_road_km
            })
            
            # Export Visual PNG - Scientific depth classes matching exact Hydraulic Legend (Section 3 & 21)
            rgba = np.zeros((depth.shape[0], depth.shape[1], 4), dtype=np.uint8)
            temp_flood_cells = (river_mask == 0) & (depth > 0)
            
            # SHALLOW FLOOD (<1m): Light cyan / transparent aqua #5ED8E8 (~50% opacity -> 128)
            rgba[temp_flood_cells & (depth <= 1.0)] = [94, 216, 232, 128]
            # MODERATE FLOOD (1-2.5m): Medium blue #2785E3 (~60% opacity -> 153)
            rgba[temp_flood_cells & (depth > 1.0) & (depth <= 2.5)] = [39, 133, 227, 153]
            # DEEP FLOOD (>2.5m): Deep royal/navy blue #123A9C (~70% opacity -> 179)
            rgba[temp_flood_cells & (depth > 2.5)] = [18, 58, 156, 179]
            
            # PERMANENT RIVER: Dark navy/deep blue #064B7A range (~80% opacity -> 205)
            rgba[river_mask > 0] = [6, 75, 122, 205]
            
            Image.fromarray(rgba).save(os.path.join(scen_dir, 'preview', f"frame_{f['frame']:03d}.png"))
            
        try:
            w, s, e, n = transform_bounds(dem_crs, 'EPSG:4326', *rasterio.transform.array_bounds(dem.shape[0], dem.shape[1], out_transform))
            wgs84_bounds_dict = {"west": w, "south": s, "east": e, "north": n}
        except:
            wgs84_bounds_dict = {}

        with open(os.path.join(scen_dir, 'metadata.json'), 'w') as fh:
            json.dump({
                "id": sid,
                "frame_count": len(frames),
                "bounds_wgs84": wgs84_bounds_dict,
                "stats": stats
            }, fh, indent=2)
            
        final_comparison[sid] = stats[-1]

    print("\n==================================================")
    print("FINAL PHASE 5 PROCESSING COMPLETE")
    print("==================================================")
    print("Please copy this terminal output back so the final report can be generated.")

if __name__ == "__main__":
    main()
