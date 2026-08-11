import asyncio
from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.asyncio import create_async_engine

DB_URL = "postgresql://postgres:root@localhost:5432/geonarrative"

def audit_db():
    engine = create_engine(DB_URL)
    metadata = MetaData()
    metadata.reflect(bind=engine)
    
    tables_to_check = [
        'flood_risk',
        'flood_risk_jenks',
        'building_exposure',
        'road_exposure',
        'poi_exposure',
        'analytics_hex_grid',
        'hex_grid_500m',
        'analytics_hex_features',
        'buildings',
        'roads',
        'pois'
    ]
    
    print("Database Tables Audit:")
    print("======================")
    
    for table_name in tables_to_check:
        if table_name in metadata.tables:
            table = metadata.tables[table_name]
            print(f"\n[TABLE] {table_name}")
            for column in table.columns:
                print(f"  - {column.name}: {column.type}")
        else:
            print(f"\n[TABLE NOT FOUND] {table_name}")

if __name__ == "__main__":
    audit_db()
