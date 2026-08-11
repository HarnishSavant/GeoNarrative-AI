import asyncio
import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import SessionLocal, engine, Base
from app.models.db_models import DatasetMetadata, SpatialDataset

DATASETS_CONFIG = [
    {
        "layer_name": "DEM (Copernicus)",
        "purpose": "Elevation, Slope, Aspect",
        "source": "Copernicus GLO-30 DEM",
        "resolution": "30m",
        "coverage": "Pune Metropolitan Region",
        "is_raster": True,
    },
    {
        "layer_name": "Rainfall Data",
        "purpose": "Flood Modelling",
        "source": "IMD (Indian Meteorological Department) & Local IoT Sensors",
        "resolution": "Daily / Hourly",
        "coverage": "Pune Metropolitan Region",
        "is_raster": True,
    },
    {
        "layer_name": "Rivers and Water Bodies",
        "purpose": "Hydrology Analysis",
        "source": "Pune Municipal Corporation & OpenStreetMap",
        "resolution": "1:1000 Scale Vector",
        "coverage": "Pune Metropolitan Region",
        "is_raster": False,
    },
    {
        "layer_name": "Land Use / Land Cover",
        "purpose": "Urban Expansion",
        "source": "Sentinel-2 Classification & Bhuvan LULC",
        "resolution": "10m Pixel Size",
        "coverage": "Pune Metropolitan Region",
        "is_raster": True,
    },
    {
        "layer_name": "Buildings",
        "purpose": "Urban Density",
        "source": "OSM Building Footprints & PMC Surveys",
        "resolution": "Sub-meter Object Vector",
        "coverage": "Pune Metropolitan Region",
        "is_raster": False,
    },
    {
        "layer_name": "Road Network",
        "purpose": "Mobility Analysis",
        "source": "OpenStreetMap High-Resolution Routing Network",
        "resolution": "Vector Polyline",
        "coverage": "Pune Metropolitan Region",
        "is_raster": False,
    },
    {
        "layer_name": "Population Density",
        "purpose": "Exposure Analysis",
        "source": "Census of India Projection & WorldPop",
        "resolution": "100m Hexagon Grid",
        "coverage": "Pune Metropolitan Region",
        "is_raster": True,
    },
    {
        "layer_name": "NDVI",
        "purpose": "Environmental Health",
        "source": "Sentinel-2 Multi-Spectral Imagery",
        "resolution": "10m Spatial Resolution",
        "coverage": "Pune Metropolitan Region",
        "is_raster": True,
    }
]

class GeospatialDataPipeline:
    """
    Research-Grade Geospatial Data Pipeline for the Pune Metropolitan Region.
    Handles ingestion and metadata registration for Digital Twin assets.
    """
    
    @staticmethod
    async def initialize_metadata_catalog(db: AsyncSession):
        """
        Idempotent initialization of the DatasetMetadata catalog in PostGIS.
        Creates missing metadata records if they don't exist.
        """
        print("🌍 Initializing Geospatial Data Pipeline Metadata for Pune Metropolitan Region...")
        
        for config in DATASETS_CONFIG:
            stmt = select(DatasetMetadata).where(DatasetMetadata.layer_name == config["layer_name"])
            result = await db.execute(stmt)
            existing_record = result.scalars().first()
            
            if existing_record:
                # Update existing records to reflect new configurations
                existing_record.purpose = config["purpose"]
                existing_record.source = config["source"]
                existing_record.resolution = config["resolution"]
                existing_record.coverage = config["coverage"]
                existing_record.is_raster = config["is_raster"]
                print(f"✅ Updated existing metadata for: {config['layer_name']}")
            else:
                # Insert new records
                new_metadata = DatasetMetadata(
                    layer_name=config["layer_name"],
                    purpose=config["purpose"],
                    source=config["source"],
                    resolution=config["resolution"],
                    coverage=config["coverage"],
                    date_acquired=datetime.datetime.utcnow(),
                    is_raster=config["is_raster"]
                )
                db.add(new_metadata)
                print(f"✨ Registered new dataset metadata: {config['layer_name']}")
        
        await db.commit()
        print("🚀 Pipeline Metadata Initialization Complete.")


    @staticmethod
    async def ingest_vector_dataset(db: AsyncSession, layer_name: str, geojson_features: list):
        """
        Ingests parsed GeoJSON features into the SpatialDataset table, 
        linked to the overarching metadata catalog.
        """
        stmt = select(DatasetMetadata).where(DatasetMetadata.layer_name == layer_name)
        result = await db.execute(stmt)
        metadata_ref = result.scalars().first()
        
        if not metadata_ref:
            raise ValueError(f"DatasetMetadata for '{layer_name}' not found. Cannot ingest vectors.")
        
        if metadata_ref.is_raster:
            raise ValueError(f"Dataset '{layer_name}' is classified as raster. Cannot ingest vector features.")
            
        print(f"📥 Ingesting {len(geojson_features)} spatial features into {layer_name}...")
        
        # Convert GeoJSON features to WKT/EWKT or let geoalchemy2 parse it
        # Assuming we insert them sequentially
        for feature in geojson_features:
            # Here we would convert the feature geometry to a format GeoAlchemy2 understands
            # Typically using ST_GeomFromGeoJSON in raw SQL or similar functions
            # e.g.: ST_GeomFromGeoJSON(json.dumps(feature['geometry']))
            pass
            
        # Placeholder for actual insertion logic to keep this simulation clean
        await db.commit()


async def run_pipeline_init():
    async with SessionLocal() as session:
        await GeospatialDataPipeline.initialize_metadata_catalog(session)

if __name__ == "__main__":
    asyncio.run(run_pipeline_init())
