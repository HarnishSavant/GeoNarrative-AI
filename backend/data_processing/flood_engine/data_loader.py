import os
import json
import glob
try:
    import rasterio
    import geopandas as gpd
    import numpy as np
except ImportError as e:
    print(f"Missing required dependency: {e}")

class DataAuditor:
    def __init__(self, data_dir):
        self.data_dir = data_dir
        self.report = {"rasters": {}, "vectors": {}, "failures": {}}

    def discover_and_audit(self, out_dir):
        os.makedirs(out_dir, exist_ok=True)
        extensions = ['*.tif', '*.tiff', '*.shp', '*.geojson']
        files = []
        for ext in extensions:
            files.extend(glob.glob(os.path.join(self.data_dir, '**', ext), recursive=True))
        
        # Also check geodatabase
        gdb_paths = glob.glob(os.path.join(self.data_dir, '**', '*.gdb'), recursive=True)
        
        for f in files:
            if f.endswith('.tif') or f.endswith('.tiff'):
                self._audit_raster(f)
            else:
                self._audit_vector(f)
                
        for gdb in gdb_paths:
            self._audit_gdb(gdb)

        report_path_json = os.path.join(out_dir, 'gis_data_audit.json')
        report_path_md = os.path.join(out_dir, 'gis_data_audit.md')
        
        with open(report_path_json, 'w') as jf:
            json.dump(self.report, jf, indent=2)
            
        self._write_markdown_report(report_path_md)
        return self.report

    def _audit_raster(self, filepath):
        try:
            with rasterio.open(filepath) as src:
                self.report["rasters"][os.path.basename(filepath)] = {
                    "path": filepath,
                    "width": src.width,
                    "height": src.height,
                    "band_count": src.count,
                    "dtype": src.dtypes[0],
                    "CRS": src.crs.to_string() if src.crs else "Unknown",
                    "EPSG": src.crs.to_epsg() if src.crs else None,
                    "transform": [src.transform.a, src.transform.b, src.transform.c, src.transform.d, src.transform.e, src.transform.f],
                    "pixel_size_x": src.res[0],
                    "pixel_size_y": src.res[1],
                    "extent": src.bounds,
                    "NoData": src.nodata
                }
        except Exception as e:
            self.report["failures"][filepath] = str(e)

    def _audit_vector(self, filepath, layer=None):
        try:
            gdf = gpd.read_file(filepath, layer=layer) if layer else gpd.read_file(filepath)
            name = f"{os.path.basename(filepath)}_{layer}" if layer else os.path.basename(filepath)
            self.report["vectors"][name] = {
                "dataset": filepath,
                "layer": layer,
                "geometry_type": str(gdf.geom_type.unique().tolist()),
                "feature_count": len(gdf),
                "CRS": gdf.crs.to_string() if gdf.crs else "Unknown",
                "EPSG": gdf.crs.to_epsg() if gdf.crs else None,
                "extent": gdf.total_bounds.tolist() if not gdf.empty else None,
                "attributes": gdf.columns.tolist()
            }
        except Exception as e:
            self.report["failures"][filepath + (f":{layer}" if layer else "")] = str(e)

    def _audit_gdb(self, gdb_path):
        import fiona
        try:
            layers = fiona.listlayers(gdb_path)
            for layer in layers:
                self._audit_vector(gdb_path, layer)
        except Exception as e:
            self.report["failures"][gdb_path] = str(e)

    def _write_markdown_report(self, path):
        with open(path, 'w') as f:
            f.write("# GIS Data Audit Report\n\n")
            f.write("## Rasters\n")
            for k, v in self.report["rasters"].items():
                f.write(f"### {k}\n")
                for key, val in v.items():
                    f.write(f"- **{key}**: {val}\n")
            f.write("## Vectors\n")
            for k, v in self.report["vectors"].items():
                f.write(f"### {k}\n")
                for key, val in v.items():
                    f.write(f"- **{key}**: {val}\n")
            f.write("## Failures\n")
            for k, v in self.report["failures"].items():
                f.write(f"- **{k}**: {v}\n")
