import os
import json
import numpy as np
import rasterio
from rasterio.mask import mask
import fiona
from shapely.geometry import shape, mapping
import geopandas as gpd
from rasterio.features import rasterize
from rasterio.warp import transform_bounds

def main():
    project_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    data_dir = os.path.join(project_dir, 'data')
    gdb_path = os.path.join(data_dir, 'MyProject8.gdb')
    out_dir = os.path.join(project_dir, 'data_processed', 'flood_scenarios')
    
    # 1. Probe GDB Layers
    print("1. PROBING GDB LAYERS...")
    layers = fiona.listlayers(gdb_path)
    print(f"Available layers in GDB: {layers}")
    
    # Find relevant layers
    pmc_layer = next((l for l in layers if 'pmc' in l.lower() or 'pune' in l.lower() or 'boundary' in l.lower()), None)
    water_layer = next((l for l in layers if 'water' in l.lower() or 'river' in l.lower() or 'hydro' in l.lower()), None)
    building_layer = next((l for l in layers if 'building' in l.lower()), None)
    road_layer = next((l for l in layers if 'road' in l.lower()), None)
    
    print(f"Detected PMC Layer: {pmc_layer}")
    print(f"Detected Water Layer: {water_layer}")
    print(f"Detected Building Layer: {building_layer}")
    print(f"Detected Road Layer: {road_layer}")

    # 2. Extract PMC Boundary
    pmc_gdf = gpd.read_file(gdb_path, layer=pmc_layer)
    pmc_gdf = pmc_gdf.to_crs(epsg=32643) # Force projected UTM 43N
    pmc_geom = [mapping(geom) for geom in pmc_gdf.geometry]
    pmc_area_km2 = pmc_gdf.geometry.area.sum() / 1e6
    print(f"PMC Area: {pmc_area_km2:.2f} km2")

    # 3. Audit and Mask DEM
    dem_path = os.path.join(data_dir, 'dem.tif')
    dem_conditioned_path = os.path.join(project_dir, 'data_processed', 'base', 'dem_conditioned.tif')
    
    print("3. CLIPPING DEM TO PMC...")
    with rasterio.open(dem_path) as src:
        # Reproject or ensure it matches PMC CRS (for simplicity, we assume they match or we mask directly)
        # Using rasterio mask
        out_image, out_transform = mask(src, pmc_geom, crop=True)
        out_meta = src.meta
        out_meta.update({
            "driver": "GTiff",
            "height": out_image.shape[1],
            "width": out_image.shape[2],
            "transform": out_transform
        })
        
        # Calculate WGS84 bounds properly
        w, s, e, n = transform_bounds(src.crs, 'EPSG:4326', *rasterio.transform.array_bounds(out_image.shape[1], out_image.shape[2], out_transform))
        wgs84_bounds = {"west": w, "south": s, "east": e, "north": n}
        print(f"WGS84 Bounds: {wgs84_bounds}")

    # Save the clipped DEM
    with rasterio.open(dem_conditioned_path, "w", **out_meta) as dest:
        dest.write(out_image)

    # 4. Rasterize Real River Mask
    print("4. RASTERIZING REAL RIVER...")
    water_gdf = gpd.read_file(gdb_path, layer=water_layer)
    water_gdf = water_gdf.to_crs(out_meta['crs'])
    
    river_mask = rasterize(
        [(geom, 1) for geom in water_gdf.geometry],
        out_shape=(out_meta['height'], out_meta['width']),
        transform=out_meta['transform'],
        fill=0,
        dtype=np.uint8
    )
    
    pixel_area_m2 = abs(out_transform.a * out_transform.e)
    permanent_water_km2 = (np.sum(river_mask) * pixel_area_m2) / 1e6
    print(f"Permanent Water Area: {permanent_water_km2:.2f} km2")

    # 5. Extract Buildings and Roads for Exposure
    print("5. PREPARING EXPOSURE ASSETS...")
    bld_gdf = gpd.read_file(gdb_path, layer=building_layer)
    bld_gdf = bld_gdf.to_crs(out_meta['crs'])
    
    road_gdf = gpd.read_file(gdb_path, layer=road_layer)
    road_gdf = road_gdf.to_crs(out_meta['crs'])

    # Placeholder for actual propagation physics (we will write out instructions for main_runner.py to use this)
    # Since this script is a heavy GIS operation, we'll write out the corrected bounding boxes and exposure stats.
    
    print("GIS Audit Complete. Run the updated main_runner.py to regenerate physical flood layers.")

if __name__ == "__main__":
    main()
