import json
import os
import asyncio
from app.core.database import AsyncSessionLocal
from app.models.db_models import Infrastructure, FloodZone
from sqlalchemy import select, func

CACHE_DIR = os.path.dirname(os.path.abspath(__file__))

def seed():
    print("Seeding Pune Geospatial Digital Twin vector cache...")
    
    # 1. RIVERS (Mula-Mutha River)
    rivers = {
        "type": "FeatureCollection",
        "category": "rivers",
        "features": [
            {
                "type": "Feature",
                "geometry": {
                    "type": "LineString",
                    "coordinates": [
                        [73.8012, 18.5204],
                        [73.8155, 18.5280],
                        [73.8312, 18.5325],
                        [73.8456, 18.5348],
                        [73.8589, 18.5312],
                        [73.8722, 18.5385],
                        [73.8890, 18.5410],
                        [73.9056, 18.5365]
                    ]
                },
                "properties": {
                    "id": 2001,
                    "name": "Mula-Mutha River",
                    "osm_type": "way",
                    "osm_waterway": "river"
                }
            }
        ]
    }
    
    # 2. HOSPITALS (Pune Healthcare Assets)
    hospitals = {
        "type": "FeatureCollection",
        "category": "hospitals",
        "features": [
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [73.8562, 18.5320]}, # Deccan (vulnerable)
                "properties": {"id": 1001, "name": "Sahyadri Hospital (Deccan)", "category": "hospitals", "osm_amenity": "hospital"}
            },
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [73.8752, 18.5392]}, # Near river (vulnerable)
                "properties": {"id": 1002, "name": "Jehangir Hospital", "category": "hospitals", "osm_amenity": "hospital"}
            },
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [73.8785, 18.5398]}, # Near river (vulnerable)
                "properties": {"id": 1003, "name": "Ruby Hall Clinic", "category": "hospitals", "osm_amenity": "hospital"}
            },
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [73.8354, 18.5125]}, # Safe high elevation
                "properties": {"id": 1004, "name": "Deenanath Mangeshkar Hospital", "category": "hospitals", "osm_amenity": "hospital"}
            },
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [73.8654, 18.5212]}, # Medium zone
                "properties": {"id": 1005, "name": "KEM Hospital Pune", "category": "hospitals", "osm_amenity": "hospital"}
            },
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [73.8420, 18.5285]}, # Deccan Gymkhana (Vulnerable)
                "properties": {"id": 1006, "name": "Poona Hospital & Research Centre", "category": "hospitals", "osm_amenity": "hospital"}
            }
        ]
    }
    
    # 3. BUILDINGS ( Pune Urban Structures )
    buildings = {
        "type": "FeatureCollection",
        "category": "buildings",
        "features": [
            {
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[[73.8550, 18.5310], [73.8580, 18.5310], [73.8580, 18.5330], [73.8550, 18.5330], [73.8550, 18.5310]]]
                },
                "properties": {"id": 3001, "name": "Deccan Municipal Plaza", "osm_building": "commercial"}
            },
            {
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[[73.8740, 18.5380], [73.8770, 18.5380], [73.8770, 18.5400], [73.8740, 18.5400], [73.8740, 18.5380]]]
                },
                "properties": {"id": 3002, "name": "Pune Junction Administrative Block", "osm_building": "public"}
            },
            {
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[[73.8320, 18.5110], [73.8360, 18.5110], [73.8360, 18.5140], [73.8320, 18.5140], [73.8320, 18.5110]]]
                },
                "properties": {"id": 3003, "name": "Erandwane Residential Tower A", "osm_building": "apartments"}
            },
            {
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[[73.8640, 18.5200], [73.8670, 18.5200], [73.8670, 18.5220], [73.8640, 18.5220], [73.8640, 18.5200]]]
                },
                "properties": {"id": 3004, "name": "Rasta Peth Power Office Complex", "osm_building": "industrial"}
            }
        ]
    }
    
    # 4. ROADS (Pune Traffic Corridors)
    roads = {
        "type": "FeatureCollection",
        "category": "roads",
        "features": [
            {
                "type": "Feature",
                "geometry": {
                    "type": "LineString",
                    "coordinates": [[73.8300, 18.5100], [73.8400, 18.5150], [73.8500, 18.5200], [73.8600, 18.5250]]
                },
                "properties": {"id": 4001, "name": "Karve Road", "osm_highway": "primary"}
            },
            {
                "type": "Feature",
                "geometry": {
                    "type": "LineString",
                    "coordinates": [[73.8400, 18.5300], [73.8420, 18.5200], [73.8450, 18.5100]]
                },
                "properties": {"id": 4002, "name": "Fergusson College Road (FC Road)", "osm_highway": "secondary"}
            },
            {
                "type": "Feature",
                "geometry": {
                    "type": "LineString",
                    "coordinates": [[73.8700, 18.5450], [73.8750, 18.5380], [73.8800, 18.5300]]
                },
                "properties": {"id": 4003, "name": "Pune Station Overpass Road", "osm_highway": "trunk"}
            },
            {
                "type": "Feature",
                "geometry": {
                    "type": "LineString",
                    "coordinates": [[73.8500, 18.5350], [73.8580, 18.5310], [73.8680, 18.5340]]
                },
                "properties": {"id": 4004, "name": "Jangali Maharaj Road (JM Road)", "osm_highway": "primary"}
            }
        ]
    }
    
    # 5. SCHOOLS (Incident nodes proxies for Traffic)
    schools = {
        "type": "FeatureCollection",
        "category": "schools",
        "features": [
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [73.8415, 18.5220]}, # FC Road intersection (Traffic buffer hotspot)
                "properties": {"id": 5001, "name": "Fergusson College Campus", "category": "schools", "osm_amenity": "school"}
            },
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [73.8525, 18.5180]}, # Karve road intersection (Traffic buffer hotspot)
                "properties": {"id": 5002, "name": "Abasaheb Garware College", "category": "schools", "osm_amenity": "school"}
            },
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [73.8760, 18.5385]}, # Pune station road bottleneck
                "properties": {"id": 5003, "name": "Wadia College Complex", "category": "schools", "osm_amenity": "school"}
            }
        ]
    }
    
    # 6. INFRASTRUCTURE (Utility substations)
    infrastructure = {
        "type": "FeatureCollection",
        "category": "infrastructure",
        "features": [
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [73.8660, 18.5210]}, # Deccan area Substation A (covers Sahara, KEM)
                "properties": {"id": 6001, "name": "Rasta Peth 220KV Substation", "category": "infrastructure", "osm_power": "substation"}
            },
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [73.8340, 18.5120]}, # Erandwane Substation B (covers DM Hospital)
                "properties": {"id": 6002, "name": "Erandwane Distribution Substation", "category": "infrastructure", "osm_power": "substation"}
            }
        ]
    }

    # Save to disk
    datasets = {
        "pune_rivers.json": rivers,
        "pune_hospitals.json": hospitals,
        "pune_buildings.json": buildings,
        "pune_roads.json": roads,
        "pune_schools.json": schools,
        "pune_infrastructure.json": infrastructure
    }
    
    for filename, data in datasets.items():
        filepath = os.path.join(CACHE_DIR, filename)
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"  - Saved {filename}")
            
    print("Seed complete! Pune digital twin is loaded.")


async def seed_database():
    """Asynchronously populates local PostgreSQL PostGIS tables with georeferenced records"""
    print("Seeding PostgreSQL PostGIS tables...")
    async with AsyncSessionLocal() as session:
        try:
            # Check if already seeded
            stmt = select(func.count(Infrastructure.id))
            res = await session.execute(stmt)
            count = res.scalar()
            if count > 0:
                print("PostGIS tables already seeded. Skipping.")
                return

            print("Adding Point Infrastructure features (Hospitals, Schools, Substations, Shelters)...")
            hospitals = [
                Infrastructure(name="Sahyadri Hospital (Deccan)", type="hospital", status="active", geom="SRID=4326;POINT(73.8562 18.5320)"),
                Infrastructure(name="Jehangir Hospital", type="hospital", status="warning", geom="SRID=4326;POINT(73.8752 18.5392)"),
                Infrastructure(name="Ruby Hall Clinic", type="hospital", status="warning", geom="SRID=4326;POINT(73.8785 18.5398)"),
                Infrastructure(name="Deenanath Mangeshkar Hospital", type="hospital", status="active", geom="SRID=4326;POINT(73.8354 18.5125)"),
                Infrastructure(name="KEM Hospital Pune", type="hospital", status="active", geom="SRID=4326;POINT(73.8654 18.5212)"),
                Infrastructure(name="Poona Hospital & Research Centre", type="hospital", status="warning", geom="SRID=4326;POINT(73.8420 18.5285)")
            ]
            session.add_all(hospitals)

            schools = [
                Infrastructure(name="Fergusson College Campus", type="school", status="active", geom="SRID=4326;POINT(73.8415 18.5220)"),
                Infrastructure(name="Abasaheb Garware College", type="school", status="active", geom="SRID=4326;POINT(73.8525 18.5180)"),
                Infrastructure(name="Wadia College Complex", type="school", status="active", geom="SRID=4326;POINT(73.8760 18.5385)")
            ]
            session.add_all(schools)

            substations = [
                Infrastructure(name="Rasta Peth 220KV Substation", type="substation", status="active", geom="SRID=4326;POINT(73.8660 18.5210)"),
                Infrastructure(name="Erandwane Distribution Substation", type="substation", status="active", geom="SRID=4326;POINT(73.8340 18.5120)")
            ]
            session.add_all(substations)

            shelters = [
                Infrastructure(name="Deccan Emergency Shelter", type="shelter", status="active", geom="SRID=4326;POINT(73.8510 18.5290)"),
                Infrastructure(name="Erandwane Rescue Center", type="shelter", status="active", geom="SRID=4326;POINT(73.8315 18.5090)"),
                Infrastructure(name="Pune Station Shelter", type="shelter", status="active", geom="SRID=4326;POINT(73.8730 18.5410)")
            ]
            session.add_all(shelters)

            print("Adding MultiPolygon FloodZone features...")
            floodways = [
                FloodZone(
                    name="Deccan Hydrological Floodway A", 
                    risk_level="critical", 
                    inundation_depth=2.8, 
                    geom="SRID=4326;MULTIPOLYGON(((73.845 18.528, 73.860 18.528, 73.860 18.535, 73.845 18.535, 73.845 18.528)))"
                ),
                FloodZone(
                    name="Koregaon-Bund Garden Floodway B", 
                    risk_level="high", 
                    inundation_depth=1.7, 
                    geom="SRID=4326;MULTIPOLYGON(((73.870 18.536, 73.882 18.536, 73.882 18.542, 73.870 18.542, 73.870 18.536)))"
                )
            ]
            session.add_all(floodways)

            await session.commit()
            print("PostGIS tables successfully populated.")
        except Exception as e:
            await session.rollback()
            print(f"Error seeding PostGIS tables: {e}")

if __name__ == "__main__":
    # Test execution
    seed()
