"""
Flood Grid Service — Generates a cellular simulation grid from real GIS rasters.

Samples DEM, slope, distance-to-river, flood susceptibility, and LULC
at regular intervals to produce a JSON grid for the frontend propagation engine.
"""

import numpy as np
import logging
import math
from typing import List, Dict, Any, Optional, Tuple
from .cache import gis_cache
from .raster_manager import RasterManager

logger = logging.getLogger("flood_grid_service")

# Pune study area bounding box (EPSG:4326)
PUNE_BOUNDS = {
    "min_lon": 73.76,
    "max_lon": 73.95,
    "min_lat": 18.43,
    "max_lat": 18.60,
}

# Grid resolution: ~200m cells
# At latitude 18.5°: 1° lon ≈ 105.6 km, 1° lat ≈ 110.6 km
# 200m ≈ 0.00189° lon, 0.00181° lat
CELL_SIZE_LON = 0.002  # ~211m
CELL_SIZE_LAT = 0.002  # ~221m

# River seed threshold in the distance-to-river raster units
RIVER_SEED_DISTANCE_THRESHOLD = 300.0  # meters — cells within 300m of river are seeds


def _sample_raster_at(raster_name: str, lat: float, lon: float) -> Optional[float]:
    """Sample a single raster pixel at a geographic coordinate."""
    val = RasterManager.get_pixel_value(raster_name, lat, lon)
    if val is not None:
        fval = float(val)
        if not math.isnan(fval) and not math.isinf(fval):
            return fval
    return None


def _classify_susceptibility(flood_val: Optional[float]) -> str:
    """Classify flood susceptibility value into discrete zones."""
    if flood_val is None:
        return "NONE"
    if flood_val >= 0.8:
        return "VERY_HIGH"
    elif flood_val >= 0.6:
        return "HIGH"
    elif flood_val >= 0.4:
        return "MODERATE"
    elif flood_val >= 0.2:
        return "LOW"
    else:
        return "VERY_LOW"


def _classify_lulc(lulc_val: Optional[float]) -> str:
    """Classify LULC code to a human-readable category."""
    if lulc_val is None:
        return "Unknown"
    code = int(lulc_val)
    mapping = {
        10: "Tree cover",
        20: "Shrubland",
        30: "Grassland",
        40: "Cropland",
        50: "Built-up",
        60: "Bare",
        70: "Snow/Ice",
        80: "Water",
        90: "Wetland",
        95: "Mangroves",
        100: "Moss/Lichen",
    }
    return mapping.get(code, f"Class_{code}" if code != 0 else "Unknown")


def generate_flood_grid(
    min_lon: float = PUNE_BOUNDS["min_lon"],
    max_lon: float = PUNE_BOUNDS["max_lon"],
    min_lat: float = PUNE_BOUNDS["min_lat"],
    max_lat: float = PUNE_BOUNDS["max_lat"],
    cell_size_lon: float = CELL_SIZE_LON,
    cell_size_lat: float = CELL_SIZE_LAT,
) -> Dict[str, Any]:
    """
    Generate a flood simulation grid by sampling all available GIS rasters.
    
    Returns a JSON-serializable dictionary containing:
    - metadata: grid dimensions, bounds, cell size
    - cells: flat array of cell objects with all GIS attributes
    - seeds: indices of river seed cells
    - neighbours: precomputed 8-connectivity adjacency list
    """
    logger.info(f"Generating flood grid: [{min_lon},{min_lat}] to [{max_lon},{max_lat}] at ~{cell_size_lon*111000:.0f}m resolution")
    
    # Calculate grid dimensions
    n_cols = int(math.ceil((max_lon - min_lon) / cell_size_lon))
    n_rows = int(math.ceil((max_lat - min_lat) / cell_size_lat))
    total_cells = n_rows * n_cols
    
    logger.info(f"Grid dimensions: {n_cols} cols × {n_rows} rows = {total_cells} cells")
    
    cells = []
    lats = []
    lons = []
    for row in range(n_rows):
        for col in range(n_cols):
            lons.append(min_lon + (col + 0.5) * cell_size_lon)
            lats.append(min_lat + (row + 0.5) * cell_size_lat)
            
    # Ultra-fast vectorized batch sampling across all rasters simultaneously (<0.2s total)
    dems = RasterManager.sample_batch("dem", lats, lons)
    slopes = RasterManager.sample_batch("slope", lats, lons)
    dist_rivers = RasterManager.sample_batch("dist_to_river", lats, lons)
    floods = RasterManager.sample_batch("flood", lats, lons)
    lulcs = RasterManager.sample_batch("lulcc", lats, lons)
    builds = RasterManager.sample_batch("builddens", lats, lons)

    for idx in range(total_cells):
        row = idx // n_cols
        col = idx % n_cols
        lon = lons[idx]
        lat = lats[idx]
        
        elev = dems[idx]
        if elev is not None:
            elev = float(elev)
            if math.isnan(elev) or math.isinf(elev) or elev < 400.0:
                elev = None

        slope_val = slopes[idx]
        slope = float(slope_val) if (slope_val is not None and not math.isnan(float(slope_val))) else None

        dtr_val = dist_rivers[idx]
        dtr = float(dtr_val) if (dtr_val is not None and not math.isnan(float(dtr_val))) else None

        flood_val = floods[idx]
        flood_sus = float(flood_val) if (flood_val is not None and not math.isnan(float(flood_val))) else None

        lulc_val = lulcs[idx]
        lulc_f = float(lulc_val) if (lulc_val is not None and not math.isnan(float(lulc_val))) else None

        build_val = builds[idx]
        build_dens = float(build_val) if (build_val is not None and not math.isnan(float(build_val))) else None
        
        cell = {
            "i": idx,
            "r": row,
            "c": col,
            "lon": round(lon, 6),
            "lat": round(lat, 6),
            "elev": round(elev, 2) if elev is not None else None,
            "slope": round(slope, 3) if slope is not None else None,
            "dtr": round(dtr, 5) if dtr is not None else None,
            "sus": round(flood_sus, 4) if flood_sus is not None else None,
            "susClass": _classify_susceptibility(flood_sus),
            "lulc": _classify_lulc(lulc_f),
            "bdens": round(build_dens, 4) if build_dens is not None else None,
            "seed": False,
        }
        cells.append(cell)
    
    # Determine accurate river seed threshold across whatever unit dist_to_river is in (degrees or meters)
    valid_dtr = sorted([c["dtr"] for c in cells if c["dtr"] is not None and c["elev"] is not None])
    dtr_threshold = 300.0
    if valid_dtr:
        # The main Mula-Mutha river corridors represent ~2.5% of total surface area cells
        dtr_threshold = valid_dtr[int(len(valid_dtr) * 0.025)]
    
    seed_indices = []
    for c in cells:
        if c["elev"] is not None:
            is_seed = False
            if c["dtr"] is not None and c["dtr"] <= dtr_threshold:
                is_seed = True
            if c["lulc"] == "Water":
                is_seed = True
            if is_seed:
                c["seed"] = True
                seed_indices.append(c["i"])

    # Precompute 8-neighbour connectivity
    neighbours = _compute_neighbours(n_rows, n_cols, cells)
    
    # Compute terrain elevation statistics for normalization on the frontend
    elevations = [c["elev"] for c in cells if c["elev"] is not None]
    min_elev = min(elevations) if elevations else 535.0
    max_elev = max(elevations) if elevations else 750.0
    mean_elev = sum(elevations) / len(elevations) if elevations else 560.0
    
    result = {
        "metadata": {
            "nRows": n_rows,
            "nCols": n_cols,
            "totalCells": total_cells,
            "cellSizeLon": cell_size_lon,
            "cellSizeLat": cell_size_lat,
            "bounds": {
                "minLon": min_lon,
                "maxLon": max_lon,
                "minLat": min_lat,
                "maxLat": max_lat,
            },
            "elevStats": {
                "min": round(min_elev, 2),
                "max": round(max_elev, 2),
                "mean": round(mean_elev, 2),
            },
            "seedCount": len(seed_indices),
            "validCells": len(elevations),
        },
        "cells": cells,
        "seeds": seed_indices,
        "neighbours": neighbours,
    }
    
    logger.info(
        f"Grid generated: {total_cells} cells, {len(seed_indices)} seeds (dtr_threshold={dtr_threshold}), "
        f"elevation range [{min_elev:.1f}, {max_elev:.1f}]m"
    )
    
    return result


def _compute_neighbours(
    n_rows: int, n_cols: int, cells: List[Dict]
) -> List[List[int]]:
    """
    Precompute 8-connected neighbour indices for each cell.
    Excludes neighbours with no elevation data (outside study area).
    """
    neighbours = []
    
    # 8 directions: N, NE, E, SE, S, SW, W, NW
    directions = [
        (-1, 0), (-1, 1), (0, 1), (1, 1),
        (1, 0), (1, -1), (0, -1), (-1, -1),
    ]
    
    for row in range(n_rows):
        for col in range(n_cols):
            cell_neighbours = []
            for dr, dc in directions:
                nr, nc = row + dr, col + dc
                if 0 <= nr < n_rows and 0 <= nc < n_cols:
                    ni = nr * n_cols + nc
                    # Only include if the neighbour has valid elevation
                    if cells[ni]["elev"] is not None:
                        cell_neighbours.append(ni)
            neighbours.append(cell_neighbours)
    
    return neighbours
