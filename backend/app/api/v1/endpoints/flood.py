from fastapi import APIRouter, HTTPException, Path, Depends
from fastapi.responses import FileResponse, JSONResponse
from app.services.flood_scenario_service import flood_scenario_service

router = APIRouter()

@router.get("/scenarios")
def get_all_scenarios():
    return flood_scenario_service.get_scenarios()

@router.get("/permanent-river")
def get_permanent_river():
    return flood_scenario_service.get_permanent_river()

@router.get("/scenarios/{scenario}/manifest")
def get_scenario_manifest(scenario: str = Path(..., description="Scenario ID (e.g., normal, heavy)")):
    manifest = flood_scenario_service.get_scenario_manifest(scenario)
    if not manifest:
        raise HTTPException(status_code=404, detail="Scenario manifest not found")
    return manifest

@router.get("/scenarios/{scenario}/frame/{frame}")
def get_scenario_frame(
    scenario: str = Path(..., description="Scenario ID"),
    frame: int = Path(..., description="Frame index")
):
    frame_path = flood_scenario_service.get_frame_path(scenario, frame)
    if not frame_path:
        raise HTTPException(status_code=404, detail="Frame not found")
        
    return FileResponse(
        frame_path, 
        media_type="image/png",
        headers={
            "Cache-Control": "public, max-age=31536000",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*"
        } # Cache for 1 year with guaranteed WebGL texture CORS access
    )

@router.get("/scenarios/{scenario}/stats/{frame}")
def get_scenario_stats(
    scenario: str = Path(..., description="Scenario ID"),
    frame: int = Path(..., description="Frame index")
):
    stats = flood_scenario_service.get_frame_stats(scenario, frame)
    if not stats:
        raise HTTPException(status_code=404, detail="Stats not found for frame")
    return stats

@router.get("/scenarios/{scenario}/exposure/{frame}")
def get_scenario_exposure(
    scenario: str = Path(..., description="Scenario ID"),
    frame: int = Path(..., description="Frame index")
):
    return flood_scenario_service.get_exposure(scenario, frame)

@router.get("/scenarios/{scenario}/buildings/{frame}")
def get_scenario_buildings(
    scenario: str = Path(..., description="Scenario ID"),
    frame: int = Path(..., description="Frame index")
):
    return flood_scenario_service.get_buildings(scenario, frame)

@router.get("/scenarios/{scenario}/roads/{frame}")
def get_scenario_roads(
    scenario: str = Path(..., description="Scenario ID"),
    frame: int = Path(..., description="Frame index")
):
    return flood_scenario_service.get_roads(scenario, frame)

@router.get("/scenarios/{scenario}/summary")
def get_scenario_summary(
    scenario: str = Path(..., description="Scenario ID")
):
    return flood_scenario_service.get_summary(scenario)
