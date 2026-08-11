import asyncio
import os
import sys

# Add backend directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.core.database import engine
from sqlalchemy import text

async def update_heights():
    async with engine.begin() as conn:
        print("Checking buildings table schema in PostGIS...")
        
        try:
            result = await conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'buildings'"))
            columns = [row[0] for row in result.fetchall()]
        except Exception as e:
            print(f"Error connecting to database or querying schema: {e}")
            return
            
        if not columns:
            print("Buildings table not found in the database. Are you sure it's populated?")
            return

        # Add calculated_height column if it doesn't exist
        if 'calculated_height' not in columns:
            print("Adding calculated_height column to buildings table...")
            await conn.execute(text("ALTER TABLE buildings ADD COLUMN calculated_height FLOAT;"))
        
        # Determine available columns for priority logic to prevent SQL errors
        has_building_height = 'building:height' in columns
        has_osm_height = 'osm_height' in columns
        has_height = 'height' in columns
        
        has_building_levels = 'building:levels' in columns
        has_osm_levels = 'osm_levels' in columns
        has_levels = 'levels' in columns
        
        has_osm_building = 'osm_building' in columns
        has_building = 'building' in columns
        has_type = 'type' in columns
        
        # Priority 1: building:height or height
        priority_1 = "NULL"
        if has_building_height:
            priority_1 = "NULLIF(CAST(\"building:height\" AS VARCHAR), '')::FLOAT"
        elif has_height:
            priority_1 = "NULLIF(CAST(height AS VARCHAR), '')::FLOAT"
        elif has_osm_height:
            priority_1 = "NULLIF(CAST(osm_height AS VARCHAR), '')::FLOAT"
            
        # Priority 2: levels * 3
        priority_2 = "NULL"
        if has_building_levels:
            priority_2 = "(NULLIF(CAST(\"building:levels\" AS VARCHAR), '')::FLOAT * 3)"
        elif has_levels:
            priority_2 = "(NULLIF(CAST(levels AS VARCHAR), '')::FLOAT * 3)"
        elif has_osm_levels:
            priority_2 = "(NULLIF(CAST(osm_levels AS VARCHAR), '')::FLOAT * 3)"
            
        # Priority 3: Estimate from building type
        if has_osm_building:
            type_col = "osm_building"
        elif has_building:
            type_col = "building"
        elif has_type:
            type_col = "type"
        else:
            type_col = "NULL"
            
        priority_3 = f"""
            CASE lower(CAST({type_col} AS VARCHAR))
                WHEN 'house' THEN 9
                WHEN 'residential' THEN 12
                WHEN 'apartments' THEN 18
                WHEN 'apartment' THEN 18
                WHEN 'school' THEN 15
                WHEN 'hospital' THEN 24
                WHEN 'commercial' THEN 20
                WHEN 'industrial' THEN 18
                WHEN 'retail' THEN 30
                WHEN 'mall' THEN 30
                ELSE 12
            END
        """ if type_col != "NULL" else "12"
        
        update_sql = f"""
            UPDATE buildings
            SET calculated_height = COALESCE(
                {priority_1},
                {priority_2},
                {priority_3}
            )
        """
        
        print("Executing height calculation logic in PostGIS...")
        try:
            await conn.execute(text(update_sql))
            print("Successfully calculated and stored 3D building heights in PostGIS!")
        except Exception as e:
            print(f"Error executing update: {e}")

if __name__ == "__main__":
    asyncio.run(update_heights())
