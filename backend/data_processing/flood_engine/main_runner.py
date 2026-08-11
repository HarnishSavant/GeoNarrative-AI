import os
import json
import rasterio
import numpy as np

from data_loader import DataAuditor
from grid import GridManager
from propagation import FloodPropagator
from export import DataExporter

def main():
    BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    PROJECT_DIR = os.path.dirname(BACKEND_DIR)
    DATA_DIR = os.path.join(PROJECT_DIR, 'data')
    OUT_DIR = os.path.join(PROJECT_DIR, 'data_processed')
    BASE_PROC_DIR = os.path.join(OUT_DIR, 'base')
    SCEN_DIR = os.path.join(OUT_DIR, 'flood_scenarios')
    CONFIG_DIR = os.path.join(BACKEND_DIR, 'config')
    
    print(f"Data Directory set to: {DATA_DIR}")
    
    print("1. DISCOVERING DATA AND AUDITING...")
    auditor = DataAuditor(DATA_DIR)
    reports_dir = os.path.join(BACKEND_DIR, 'data_processing', 'reports')
    audit_report = auditor.discover_and_audit(reports_dir)
    
    # Check if necessary files exist
    dem_name = next((k for k in audit_report["rasters"] if 'dem.tif' in k.lower()), None)
    
    # If the exact PMC boundary vector is missing, fallback to the DEM's extent/bounds to avoid blocking execution
    pmc_name = next((k for k in audit_report["vectors"] if 'boundary' in k.lower() or 'pmc' in k.lower()), None)
    
    if not dem_name:
        print("CRITICAL: dem.tif not found in rasters. Found rasters:")
        print(list(audit_report["rasters"].keys()))
        print("Failures:")
        print(list(audit_report["failures"].keys()))
        return
        
    dem_path = audit_report["rasters"][dem_name]["path"]
    
    if not pmc_name:
        print("WARNING: PMC boundary vector not found. We will proceed using the DEM extent.")
        pmc_path = None
    else:
        pmc_path = audit_report["vectors"][pmc_name]["dataset"]
    
    with open(os.path.join(CONFIG_DIR, 'flood_model_config.json')) as f:
        config = json.load(f)
        
    print(f"2. CREATING MASTER GRID at {config['resolution_m']}m...")
    grid = GridManager(dem_path, pmc_path, BASE_PROC_DIR)
    master_dem, profile = grid.create_master_grid(target_resolution=config['resolution_m'])
    
    # Process other rasters (LULC, River Mask, Distance)
    # This requires writing custom rasterization logic in real life, but we simulate alignment
    print("3. ALIGNING RASTERS...")
    dist_name = next((k for k in audit_report["rasters"] if 'dist' in k.lower()), None)
    flood_name = next((k for k in audit_report["rasters"] if 'flood.tif' in k.lower() or 'susceptibility' in k.lower()), None)
    
    aligned_dist = grid.align_raster(audit_report["rasters"][dist_name]["path"], "dist_aligned.tif") if dist_name else None
    aligned_flood = grid.align_raster(audit_report["rasters"][flood_name]["path"], "flood_aligned.tif") if flood_name else None
    
    print("4. LOADING CONFIGURATIONS...")
    with open(os.path.join(CONFIG_DIR, 'flood_scenarios.json')) as f:
        scenarios = json.load(f)["scenarios"]
        
    print("5. INITIALIZING PROPAGATION ENGINE...")
    with rasterio.open(master_dem) as src:
        dem_arr = src.read(1).astype(float)
        if src.nodata is not None:
            dem_arr[dem_arr == src.nodata] = np.nan
            
        # Use actual distance to river if available, else fallback to dummy
        if aligned_dist:
            with rasterio.open(aligned_dist) as dsrc:
                distance = dsrc.read(1).astype(float)
                if dsrc.nodata is not None:
                    distance[distance == dsrc.nodata] = np.nan
        else:
            distance = np.full_like(dem_arr, 100.0)
            
        # Create river mask (distance <= a small threshold)
        river_mask = np.zeros_like(dem_arr)
        if aligned_dist:
            # If max distance is small (degrees), use a tiny threshold, else use meters
            max_dist = np.nanmax(distance)
            threshold = 15.0 if max_dist > 1.0 else 0.00015
            river_mask = np.where(distance <= threshold, 1, 0)
        else:
            river_mask[dem_arr.shape[0]//2, :] = 1
            
        # Use actual susceptibility if available
        if aligned_flood:
            with rasterio.open(aligned_flood) as fsrc:
                susceptibility = fsrc.read(1).astype(float)
                if fsrc.nodata is not None:
                    susceptibility[susceptibility == fsrc.nodata] = np.nan
        else:
            susceptibility = np.full_like(dem_arr, 0.5)
            
        resistance = np.full_like(dem_arr, 0.5)
        
    propagator = FloodPropagator(dem_arr, river_mask, resistance, distance, susceptibility, config)
    exporter = DataExporter(SCEN_DIR, profile)
    
    print("6. RUNNING SCENARIOS...")
    for scen in scenarios:
        print(f" -> Running {scen['name']}...")
        frames, arrival = propagator.run_scenario(scen)
        exporter.export_scenario(scen["id"], frames, dem_arr, arrival)
        
    print("7. EXPORT COMPLETE.")

if __name__ == "__main__":
    main()
