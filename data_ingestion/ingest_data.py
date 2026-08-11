import os
import subprocess
import fiona
import geopandas as gpd
from sqlalchemy import create_engine
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# --- Configuration ---
DB_HOST = "localhost"
DB_PORT = "5432"
DB_NAME = "geonarrative"
DB_USER = "postgres"
DB_PASSWORD = "root"

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "Data"))
GDB_PATH = os.path.join(DATA_DIR, "MyProject8.gdb")
DEM_PATH = os.path.join(DATA_DIR, "output_hh.tif")
LULC_PATH = os.path.join(DATA_DIR, "Pune_LULC_10m_2024.tif")

# SQLAlchemy Engine for GeoPandas
engine = create_engine(f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}")

def get_psycopg2_conn():
    conn = psycopg2.connect(f"host={DB_HOST} port={DB_PORT} dbname={DB_NAME} user={DB_USER} password={DB_PASSWORD}")
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    return conn

def ingest_vector_data():
    print(f"\n[VECTOR] Reading Geodatabase: {GDB_PATH}")
    
    if not os.path.exists(GDB_PATH):
        print(f"Error: GDB not found at {GDB_PATH}")
        return

    available_layers = fiona.listlayers(GDB_PATH)
    print(f"Available layers in GDB: {available_layers}")
    
    for gdb_layer in available_layers:
        # Standardize layer names to target tables
        layer_lower = gdb_layer.lower()
        if 'building' in layer_lower: table_name = 'buildings'
        elif 'road' in layer_lower: table_name = 'roads'
        elif 'railway' in layer_lower: table_name = 'railways'
        elif 'water' in layer_lower: table_name = 'waterways'
        elif 'place' in layer_lower: table_name = 'places'
        elif 'poi' in layer_lower: table_name = 'pois'
        elif 'landue' in layer_lower or 'landuse' in layer_lower: table_name = 'landuse'
        elif 'natural' in layer_lower: table_name = 'natural'
        elif 'protect' in layer_lower: table_name = 'protected'
        elif 'transport' in layer_lower or 'trafic' in layer_lower: table_name = 'transport'
        else:
            print(f"Skipping unmapped layer: {gdb_layer}")
            continue
            
        print(f"\n--- Ingesting {gdb_layer} -> public.{table_name} ---")
        try:
            # 1. Read Feature Class
            gdf = gpd.read_file(GDB_PATH, layer=gdb_layer)
            if gdf.empty:
                print(f"Warning: Layer {gdb_layer} is empty. Skipping.")
                continue
                
            # 2. Normalize columns & fix invalid geometries
            gdf.columns = [col.lower() for col in gdf.columns]
            # Rename 'geometry' column if it's different
            geom_col = gdf.active_geometry_name
            if geom_col != 'geometry':
                gdf = gdf.rename_geometry('geometry')
            
            print(f"Fixing invalid geometries (if any)...")
            gdf['geometry'] = gdf.geometry.make_valid()
            
            print(f"Rows: {len(gdf)} | CRS: {gdf.crs}")
            
            # 3. Push to PostGIS (preserves geometry type, CRS, and creates GiST indexes)
            gdf.to_postgis(
                name=table_name,
                con=engine,
                if_exists='replace',
                index=False,
                chunksize=5000
            )
            print(f"Success: {table_name} ingested.")
            
            # 4. Analyze table for query planner optimizations
            conn = get_psycopg2_conn()
            cur = conn.cursor()
            # Quote natural as it's a reserved keyword in SQL
            safe_table_name = f'"{table_name}"' if table_name == 'natural' else table_name
            cur.execute(f"ANALYZE {safe_table_name};")
            conn.close()
            print(f"Success: {table_name} analyzed.")
                
        except Exception as e:
            print(f"Error ingesting {gdb_layer}: {e}")

def ingest_raster_data():
    print("\n[RASTER] Starting Raster Ingestion")
    
    rasters = [
        (DEM_PATH, "dem_raster"),
        (LULC_PATH, "lulc_raster")
    ]
    
    env = os.environ.copy()
    env["PGPASSWORD"] = DB_PASSWORD
    
    for raster_file, table_name in rasters:
        print(f"\n--- Ingesting {raster_file} -> public.{table_name} ---")
        
        if not os.path.exists(raster_file):
            print(f"Error: Raster file not found at {raster_file}")
            continue
            
        # Drop table if exists before running raster2pgsql
        try:
            conn = get_psycopg2_conn()
            cur = conn.cursor()
            cur.execute(f"DROP TABLE IF EXISTS {table_name};")
            conn.close()
        except Exception as e:
            print(f"Error dropping table {table_name}: {e}")
                
        # First attempt: Local raster2pgsql and psql
        cmd_local = f'raster2pgsql -I -C -M -t auto "{raster_file}" public.{table_name} | psql -h {DB_HOST} -p {DB_PORT} -U {DB_USER} -d {DB_NAME}'
        print(f"Executing: {cmd_local[:100]}...")
        result = subprocess.run(cmd_local, shell=True, env=env, capture_output=True, text=True)
        
        if result.returncode != 0:
            print("Local raster2pgsql failed (maybe tools are not in PATH). Attempting Docker Exec fallback...")
            
            # Docker Exec fallback
            container_name = "geonarrative_db"
            tmp_path = f"/tmp/{os.path.basename(raster_file)}"
            
            try:
                # 1. Copy file to container
                subprocess.run(f'docker cp "{raster_file}" {container_name}:{tmp_path}', shell=True, check=True)
                
                # 2. Run raster2pgsql inside container
                cmd_docker = f'docker exec -e PGPASSWORD={DB_PASSWORD} {container_name} sh -c "raster2pgsql -I -C -M -t auto {tmp_path} public.{table_name} | psql -U {DB_USER} -d {DB_NAME}"'
                subprocess.run(cmd_docker, shell=True, check=True)
                
                # 3. Cleanup
                subprocess.run(f'docker exec {container_name} rm {tmp_path}', shell=True)
                
                print(f"Success: {table_name} ingested via Docker.")
            except subprocess.CalledProcessError as e:
                print(f"Docker fallback failed: {e}")
        else:
            print(f"Success: {table_name} ingested.")

if __name__ == "__main__":
    print("===================================================")
    print("GeoNarrative PostGIS Automated Ingestion Pipeline")
    print("===================================================")
    ingest_vector_data()
    ingest_raster_data()
    print("\nIngestion Pipeline Completed.")
