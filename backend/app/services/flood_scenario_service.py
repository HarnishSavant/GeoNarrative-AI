import os
import json
from pathlib import Path

# Try to get raster bounds for accurate WGS84 Cesium mapping
try:
    import rasterio
    from rasterio.warp import transform_bounds
    HAS_RASTERIO = True
except ImportError:
    HAS_RASTERIO = False

class FloodScenarioService:
    def __init__(self):
        self.project_dir = Path(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
        self.data_processed = self.project_dir / "data_processed"
        self.scenarios_dir = self.data_processed / "flood_scenarios"
        self.base_dir = self.data_processed / "base"
        
        # Hardcoded Pune WGS84 fallback bounding box
        self.fallback_bounds = {
            "west": 73.7,
            "south": 18.4,
            "east": 74.0,
            "north": 18.7
        }

    def get_wgs84_bounds(self):
        dem_path = self.base_dir / "dem_conditioned.tif"
        if HAS_RASTERIO and dem_path.exists():
            try:
                with rasterio.open(dem_path) as src:
                    # Convert DEM CRS bounds to EPSG:4326 (WGS84)
                    w, s, e, n = transform_bounds(src.crs, 'EPSG:4326', *src.bounds)
                    return {
                        "west": w,
                        "south": s,
                        "east": e,
                        "north": n
                    }
            except Exception as e:
                print(f"Error reading DEM bounds: {e}")
        return self.fallback_bounds

    def get_scenarios(self):
        scenarios = []
        if not self.scenarios_dir.exists():
            return scenarios
            
        bounds = self.get_wgs84_bounds()
            
        for d in self.scenarios_dir.iterdir():
            if d.is_dir():
                meta_path = d / "metadata.json"
                if meta_path.exists():
                    with open(meta_path, 'r') as f:
                        meta = json.load(f)
                        meta["bounds_wgs84"] = bounds
                        scenarios.append(meta)
        
        # Sort Normal, Moderate, Heavy, Extreme
        order = {"normal": 1, "moderate": 2, "heavy": 3, "extreme": 4}
        scenarios.sort(key=lambda x: order.get(x.get("id"), 99))
        return scenarios

    def get_scenario_manifest(self, scenario_id: str):
        meta_path = self.scenarios_dir / scenario_id / "metadata.json"
        if not meta_path.exists():
            return None
            
        with open(meta_path, 'r') as f:
            meta = json.load(f)
            
        meta["bounds_wgs84"] = self.get_wgs84_bounds()
        return meta

    def get_frame_path(self, scenario_id: str, frame_idx: int):
        # We serve from preview since those are transparent PNGs with the color ramp
        frame_path = self.scenarios_dir / scenario_id / "preview" / f"frame_{frame_idx:03d}.png"
        if frame_path.exists():
            return str(frame_path)
        return None

    def get_frame_stats(self, scenario_id: str, frame_idx: int):
        meta = self.get_scenario_manifest(scenario_id)
        if meta and "stats" in meta:
            for stat in meta["stats"]:
                if stat["frame"] == frame_idx:
                    return stat
        return None

    def _read_exposure_file(self, scenario_id: str, filename: str):
        path = self.scenarios_dir / scenario_id / "exposure" / filename
        if path.exists():
            with open(path, 'r') as f:
                return json.load(f)
        return {}

    def get_summary(self, scenario_id: str):
        return self._read_exposure_file(scenario_id, "summary.json")

    def get_buildings(self, scenario_id: str, frame_idx: int):
        # Check both naming conventions just in case, prioritizing the newest phase 5 .geojson output
        data = self._read_exposure_file(scenario_id, f"buildings_{frame_idx:03d}.geojson")
        if not data:
            data = self._read_exposure_file(scenario_id, f"buildings_frame_{frame_idx:03d}.json")
        return data

    def get_roads(self, scenario_id: str, frame_idx: int):
        data = self._read_exposure_file(scenario_id, f"roads_{frame_idx:03d}.geojson")
        if not data:
            data = self._read_exposure_file(scenario_id, f"roads_frame_{frame_idx:03d}.json")
        return data

    def get_exposure(self, scenario_id: str, frame_idx: int):
        return {
            "buildings": self.get_buildings(scenario_id, frame_idx),
            "roads": self.get_roads(scenario_id, frame_idx)
        }

    def get_permanent_river(self):
        base_path = self.scenarios_dir.parent / "base" / "permanent_river.geojson"
        if base_path.exists():
            with open(base_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {}

flood_scenario_service = FloodScenarioService()
