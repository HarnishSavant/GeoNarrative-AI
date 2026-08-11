import os
import io
import json
import logging
import math
import numpy as np
from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel

try:
    import rasterio
    import rasterio.features
    from rasterio.warp import transform_bounds, transform_geom
    from PIL import Image
    from shapely.geometry import shape
    from shapely.ops import unary_union
except ImportError:
    rasterio = None

router = APIRouter()
logger = logging.getLogger("geonarrative_telemetry")

# __file__ is backend/app/api/v1/endpoints/raster.py
# Root is 6 levels up
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))), 'data')

def get_tif_path(layer_name: str) -> str:
    mapping = {
        "dem": "dem.tif",
        "slope": "sloop.tif",
        "lulc": "lulcc.tif",
        "flood": "flood.tif",
        "flood-risk": "flood.tif",
        "hillshade": "hill.tif",
        "hill": "hill.tif",
        "distance-to-river": "dist_to_river.tif",
        "dist_to_river": "dist_to_river.tif",
        "building-density": "builddens.tif",
        "builddens": "builddens.tif",
        "population": "output_hh.tif",
        "ndvi": "Pune_LULC_10m_2024.tif" # fallback
    }
    filename = mapping.get(layer_name.lower())
    if not filename:
        return None
    return os.path.join(DATA_DIR, filename)

def hex_to_rgb(hex_code):
    hex_code = hex_code.lstrip('#')
    return tuple(int(hex_code[i:i+2], 16) for i in (0, 2, 4))

def apply_colormap(data, mask, layer_name):
    # Initialize RGBA output array
    rgba = np.zeros((*data.shape, 4), dtype=np.uint8)
    
    if layer_name == 'lulc':
        colors = {
            1: hex_to_rgb('#0000ff'),  # Water
            2: hex_to_rgb('#006400'),  # Trees
            3: hex_to_rgb('#90ee90'),  # Grass
            4: hex_to_rgb('#40e0d0'),  # Flooded Vegetation
            5: hex_to_rgb('#ffff00'),  # Crops
            6: hex_to_rgb('#ff0000'),  # Built Area (Swapped from 7 based on TIF values)
            7: hex_to_rgb('#556b2f'),  # Shrub & Scrub (Swapped from 6 based on TIF values)
            8: hex_to_rgb('#8b4513'),  # Bare Ground
            9: hex_to_rgb('#d3d3d3'),  # Snow
            10: hex_to_rgb('#0000ff'), # Fallbacks...
            20: hex_to_rgb('#556b2f'),
            30: hex_to_rgb('#90ee90'),
            40: hex_to_rgb('#ffff00'),
            50: hex_to_rgb('#ff0000'),
            60: hex_to_rgb('#8b4513'),
            80: hex_to_rgb('#0000ff')
        }
        for val, color in colors.items():
            idx = (data == val) & mask
            rgba[idx, 0] = color[0]
            rgba[idx, 1] = color[1]
            rgba[idx, 2] = color[2]
            rgba[idx, 3] = 255
            
    elif layer_name in ['flood', 'flood-risk']:
        # Discrete mapping to fix swapped integer classes in the TIF
        colors = {
            1: hex_to_rgb('#a9a9a9'),  # Very Low Risk (Gray)
            2: hex_to_rgb('#ffd700'),  # Low Risk (Yellow)
            3: hex_to_rgb('#90ee90'),  # Moderate Risk (Green)
            4: hex_to_rgb('#483d8b'),  # High Risk (Purple)
            5: hex_to_rgb('#ff0000'),  # Very High Risk (Red)
        }
        for val, color in colors.items():
            idx = (data == val) & mask
            rgba[idx, 0] = color[0]
            rgba[idx, 1] = color[1]
            rgba[idx, 2] = color[2]
            rgba[idx, 3] = 255
            
    elif layer_name in ['dem', 'slope', 'distance-to-river', 'dist_to_river', 'building-density', 'builddens', 'population', 'ndvi']:
        # Continuous colormap
        d_min = np.percentile(data[mask], 2) if np.any(mask) else 0
        d_max = np.percentile(data[mask], 98) if np.any(mask) else 1
        if d_min == d_max: d_max = d_min + 1
        
        norm = np.clip((data - d_min) / (d_max - d_min), 0, 1)
        
        def interpolate_colors(norm_array, colors):
            # colors: list of RGB tuples
            n_colors = len(colors)
            idx = norm_array * (n_colors - 1)
            lower_idx = np.floor(idx).astype(int)
            upper_idx = np.ceil(idx).astype(int)
            frac = idx - lower_idx
            
            result = np.zeros((*norm_array.shape, 3))
            for i in range(3):
                lower_val = np.array([c[i] for c in colors])[lower_idx]
                upper_val = np.array([c[i] for c in colors])[upper_idx]
                result[..., i] = lower_val + (upper_val - lower_val) * frac
            return result
        
        if layer_name == 'dem':
            # Elevation ramp: Light Cyan -> Green -> Yellow -> Orange -> Red -> Brown
            cmap = [hex_to_rgb('#e0ffff'), hex_to_rgb('#00ff00'), hex_to_rgb('#ffff00'), hex_to_rgb('#ffa500'), hex_to_rgb('#ff0000'), hex_to_rgb('#8b4513')]
            c = interpolate_colors(norm, cmap)
            rgba[mask, :3] = c[mask]
            rgba[mask, 3] = 255
        elif layer_name in ['distance-to-river', 'dist_to_river']:
            # Distance to River: Light Blue -> Dark Blue -> Teal -> Sky Blue -> Cyan
            cmap = [hex_to_rgb('#add8e6'), hex_to_rgb('#00008b'), hex_to_rgb('#008080'), hex_to_rgb('#87ceeb'), hex_to_rgb('#00ffff')]
            c = interpolate_colors(norm, cmap)
            rgba[mask, :3] = c[mask]
            rgba[mask, 3] = 255
        elif layer_name in ['building-density', 'builddens']:
            # Building Density: Yellow -> Orange-Yellow -> Orange -> Red-Orange -> Dark Red
            cmap = [hex_to_rgb('#ffff00'), hex_to_rgb('#ffcc00'), hex_to_rgb('#ff9900'), hex_to_rgb('#ff6600'), hex_to_rgb('#cc0000')]
            c = interpolate_colors(norm, cmap)
            rgba[mask, :3] = c[mask]
            rgba[mask, 3] = 255
        elif layer_name == 'slope':
            cmap = [(40,140,40), (255,255,0), (255,0,0)]
            c = interpolate_colors(norm, cmap)
            rgba[mask, :3] = c[mask]
            rgba[mask, 3] = 255
        elif layer_name == 'ndvi':
            cmap = [(160,80,30), (255,255,100), (34,139,34)]
            c = interpolate_colors(norm, cmap)
            rgba[mask, :3] = c[mask]
            rgba[mask, 3] = 255
        else:
            v = (norm * 255).astype(np.uint8)
            rgba[mask, 0] = v[mask]
            rgba[mask, 1] = v[mask]
            rgba[mask, 2] = v[mask]
            rgba[mask, 3] = 255
            
    elif layer_name in ['hillshade', 'hill']:
        # Grayscale
        norm = np.clip(data / 255.0, 0, 1)
        v = (norm * 255).astype(np.uint8)
        rgba[mask, 0] = v[mask]
        rgba[mask, 1] = v[mask]
        rgba[mask, 2] = v[mask]
        rgba[mask, 3] = 255
    else:
        # Default grayscale
        norm = np.clip((data - np.min(data)) / (np.ptp(data) + 1e-5), 0, 1)
        v = (norm * 255).astype(np.uint8)
        rgba[mask, 0] = v[mask]
        rgba[mask, 1] = v[mask]
        rgba[mask, 2] = v[mask]
        rgba[mask, 3] = 255

    return rgba


@router.get("/{layer_name}/metadata")
async def get_raster_metadata(layer_name: str):
    if not rasterio:
        raise HTTPException(status_code=500, detail="rasterio not installed")
        
    tif_path = get_tif_path(layer_name)
    if not tif_path or not os.path.exists(tif_path):
        raise HTTPException(status_code=404, detail=f"Raster layer {layer_name} not found")
        
    try:
        with rasterio.open(tif_path) as src:
            bounds = transform_bounds(src.crs, 'EPSG:4326', *src.bounds)
            
            # Extract actual valid data polygon (for 'dem' or 'lulc' primarily to define study area)
            valid_polygon = None
            if layer_name in ['dem', 'lulc']:
                try:
                    # Read downsampled for speed
                    scale = max(src.width, src.height) / 100.0 # Downsample to ~100px max
                    out_shape = (1, max(1, int(src.height / scale)), max(1, int(src.width / scale)))
                    data = src.read(1, out_shape=out_shape, resampling=rasterio.enums.Resampling.nearest)
                    
                    nodata = src.nodatavals[0]
                    mask = (data != nodata).astype('uint8') if nodata is not None else (data != 0).astype('uint8')
                    
                    transform = src.transform * src.transform.scale(
                        (src.width / out_shape[2]),
                        (src.height / out_shape[1])
                    )
                    
                    shapes = rasterio.features.shapes(mask, mask=mask, transform=transform)
                    polygons = [shape(geom) for geom, val in shapes if val == 1]
                    
                    if polygons:
                        valid_area = unary_union(polygons)
                        # Simplify to make it smooth and not pixelated
                        pixel_size = abs(transform[0])
                        valid_area = valid_area.simplify(pixel_size * 1.5)
                        valid_polygon = transform_geom(src.crs, 'EPSG:4326', valid_area.__geo_interface__)
                except Exception as e:
                    logger.warning(f"Could not extract polygon for {layer_name}: {e}")

            return {
                "layer": layer_name,
                "bounds": [bounds[0], bounds[1], bounds[2], bounds[3]], # [minx, miny, maxx, maxy]
                "polygon": valid_polygon,
                "width": src.width,
                "height": src.height,
                "crs": "EPSG:4326"
            }
    except Exception as e:
        logger.error(f"Error reading raster metadata: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{layer_name}/image")
async def get_raster_image(layer_name: str):
    if not rasterio:
        raise HTTPException(status_code=500, detail="rasterio not installed")
        
    tif_path = get_tif_path(layer_name)
    if not tif_path or not os.path.exists(tif_path):
        raise HTTPException(status_code=404, detail=f"Raster layer {layer_name} not found")
        
    try:
        with rasterio.open(tif_path) as src:
            out_shape = (1, src.height, src.width)
            
            max_dim = 2048
            min_dim = 1024
            
            if src.width > max_dim or src.height > max_dim:
                scale = min(max_dim / src.width, max_dim / src.height)
                out_shape = (1, int(src.height * scale), int(src.width * scale))
            elif src.width < min_dim and src.height < min_dim:
                # Force upscaling for tiny rasters to completely eliminate WebGL blur
                scale = max(min_dim / src.width, min_dim / src.height)
                out_shape = (1, int(src.height * scale), int(src.width * scale))
                
            # Use nearest for categorical/analytical, bilinear for continuous terrain
            is_smooth = layer_name in ['dem', 'hill', 'hillshade']
            resamp_method = rasterio.enums.Resampling.bilinear if is_smooth else rasterio.enums.Resampling.nearest
                
            data = src.read(1, out_shape=out_shape, resampling=resamp_method)
            
            # Mask nodata
            nodata = src.nodatavals[0]
            if nodata is not None:
                mask = (data != nodata)
            else:
                # heuristic for 0 as nodata in many cases
                mask = (data != 0)
                
            # Render using pure numpy colormaps
            rgba = apply_colormap(data, mask, layer_name)
            
            img = Image.fromarray(rgba, 'RGBA')
            
            buf = io.BytesIO()
            img.save(buf, format='PNG', optimize=True)
            buf.seek(0)
            
            return Response(content=buf.getvalue(), media_type="image/png", headers={
                "Cache-Control": "public, max-age=86400"
            })
            
    except Exception as e:
        logger.error(f"Error rendering raster: {e}")
        raise HTTPException(status_code=500, detail=str(e))
