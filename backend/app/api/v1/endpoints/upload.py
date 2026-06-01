from fastapi import APIRouter, File, UploadFile, HTTPException, Depends
from app.services.spatial_service import SpatialService
from app.api.v1.endpoints.auth import get_current_user
from app.models.db_models import User

router = APIRouter()

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB Limit

@router.post("")
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload a GIS data file (GeoJSON, CSV, Shapefile)"""
    allowed_extensions = [".geojson", ".json", ".csv", ".shp", ".kml"]
    ext = "." + file.filename.split(".")[-1].lower() if "." in file.filename else ""
    
    if ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")
    
    # Secure upload limit checking
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Maximum size allowed is 10MB.")
        
    result = SpatialService.process_upload(file.filename, content)
    return result
