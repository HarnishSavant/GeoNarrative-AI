import os
import rasterio
import fiona
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent.parent / "Data"

def audit():
    print("=" * 60)
    print("GIS DATA AUDIT FOR PUNE FLOOD DIGITAL TWIN")
    print("=" * 60)
    
    rasters = ["dem.tif", "sloop.tif", "dist_to_river.tif", "flood.tif", "lulcc.tif", "builddens.tif", "hill.tif"]
    for r in rasters:
        p = DATA_DIR / r
        if not p.exists():
            print(f"[RASTER] {r}: NOT FOUND at {p}")
            continue
        with rasterio.open(p) as src:
            print(f"[RASTER] {r}:")
            print(f"         CRS: {src.crs}")
            print(f"         Bounds: {src.bounds}")
            print(f"         Size: {src.width} x {src.height}, Res: {src.res}")
            print(f"         NoData: {src.nodata}")
            
    gdb = DATA_DIR / "MyProject8.gdb"
    if gdb.exists():
        print(f"\n[GEODATABASE] {gdb.name}:")
        layers = fiona.listlayers(str(gdb))
        for lyr in layers:
            with fiona.open(str(gdb), layer=lyr) as src:
                print(f"  - Layer '{lyr}': {len(src)} features, CRS={src.crs}, Schema={list(src.schema['properties'].keys())[:5]}")
    else:
        print(f"[GEODATABASE] {gdb} NOT FOUND")

if __name__ == "__main__":
    audit()
