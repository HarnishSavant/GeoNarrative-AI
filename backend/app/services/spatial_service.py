import json
import math
import random
from datetime import datetime

class SpatialService:
    @staticmethod
    def process_upload(file_name: str, file_content: bytes) -> dict:
        ext = "." + file_name.split(".")[-1].lower() if "." in file_name else ""
        size = len(file_content)
        
        # Process the file content to extract geometries features count
        features_count = 0
        if ext in [".geojson", ".json"]:
            try:
                data = json.loads(file_content)
                if "features" in data:
                    features_count = len(data["features"])
                elif "type" in data:
                    features_count = 1
            except json.JSONDecodeError:
                features_count = 0
        elif ext == ".csv":
            lines = file_content.decode("utf-8", errors="ignore").strip().split("\n")
            features_count = max(0, len(lines) - 1)  # exclude header
        else:
            features_count = random.randint(10, 200)
            
        return {
            "id": str(int(datetime.now().timestamp() * 1000)),
            "name": file_name,
            "type": ext.replace(".", "").upper(),
            "size": size,
            "features": features_count,
            "uploaded_at": datetime.now().isoformat(),
            "status": "processed",
        }

    @staticmethod
    def generate_random_geojson(center_lng: float, center_lat: float, layer: str, count: int) -> dict:
        features = []
        
        for i in range(count):
            angle = random.random() * 2 * math.pi
            distance = random.random() * 0.09  # ~10km
            lng = center_lng + distance * math.cos(angle)
            lat = center_lat + distance * math.sin(angle)
            risk_score = round(random.random() * 10, 1)
            risk_level = (
                "critical" if risk_score > 7.5
                else "high" if risk_score > 5
                else "medium" if risk_score > 2.5
                else "low"
            )
            
            features.append({
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [round(lng, 6), round(lat, 6)],
                },
                "properties": {
                    "id": i,
                    "riskScore": risk_score,
                    "riskLevel": risk_level,
                    "name": f"Sensor {i + 1}",
                    "elevation": round(300 + random.random() * 400),
                    "rainfall": round(50 + random.random() * 200),
                },
            })
        
        return {
            "type": "FeatureCollection",
            "features": features,
        }
