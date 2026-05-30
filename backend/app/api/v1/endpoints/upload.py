from fastapi import APIRouter, File, UploadFile, HTTPException
from app.services.spatial_service import SpatialService

router = APIRouter()

@router.post("")
async def upload_file(file: UploadFile = File(...)):
    """Upload a GIS data file (GeoJSON, CSV, Shapefile)"""
    allowed_extensions = [".geojson", ".json", ".csv", ".shp", ".kml"]
    ext = "." + file.filename.split(".")[-1].lower() if "." in file.filename else ""
    
    if ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")
    
    content = await file.read()
    result = SpatialService.process_upload(file.filename, content)
    return result
