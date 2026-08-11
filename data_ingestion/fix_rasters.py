import os
import subprocess
import glob
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# Configuration
DB_HOST = "localhost"
DB_PORT = "5432"
DB_NAME = "geonarrative"
DB_USER = "postgres"
DB_PASSWORD = "root"

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "Data"))
DEM_PATH = os.path.join(DATA_DIR, "output_hh.tif")
LULC_PATH = os.path.join(DATA_DIR, "Pune_LULC_10m_2024.tif")

rasters = [
    (DEM_PATH, "dem_raster"),
    (LULC_PATH, "lulc_raster")
]

def find_executable(exe_name):
    """Finds an executable in common Windows installation paths."""
    search_paths = []
    
    if exe_name == "raster2pgsql.exe":
        search_paths = [
            r"C:\Program Files\PostgreSQL\*\bin\raster2pgsql.exe",
            r"C:\Program Files (x86)\PostgreSQL\*\bin\raster2pgsql.exe"
        ]
    elif exe_name == "docker.exe":
        search_paths = [
            r"C:\Program Files\Docker\Docker\resources\bin\docker.exe",
            r"C:\Program Files\Docker\Docker\resources\docker.exe"
        ]
        
    for path_pattern in search_paths:
        matches = glob.glob(path_pattern)
        if matches:
            matches.sort(reverse=True)
            return matches[0]
            
    return None

def enable_postgis_raster():
    print("Connecting to database to enable 'postgis_raster' extension...")
    try:
        conn = psycopg2.connect(f"host={DB_HOST} port={DB_PORT} dbname={DB_NAME} user={DB_USER} password={DB_PASSWORD}")
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()
        cur.execute("CREATE EXTENSION IF NOT EXISTS postgis;")
        cur.execute("CREATE EXTENSION IF NOT EXISTS postgis_raster;")
        conn.close()
        print("Success: postgis_raster extension is enabled.")
        return True
    except Exception as e:
        print(f"Warning: Could not enable extension via Python: {e}")
        return False

def ingest_with_local_postgres():
    raster2pgsql_exe = find_executable("raster2pgsql.exe")
    psql_exe = find_executable("psql.exe") if raster2pgsql_exe else None
    if not psql_exe and raster2pgsql_exe:
        psql_exe = os.path.join(os.path.dirname(raster2pgsql_exe), "psql.exe")

    if not raster2pgsql_exe or not psql_exe:
        return False

    print(f"Found local PostgreSQL tools at: {os.path.dirname(raster2pgsql_exe)}")
    env = os.environ.copy()
    env["PGPASSWORD"] = DB_PASSWORD

    for raster_file, table_name in rasters:
        print(f"\nIngesting {table_name} using local raster2pgsql...")
        # The `--quiet` or `-q` flag isn't heavily supported in older raster2pgsql, 
        # so we pipe standard output but let errors show.
        cmd = f'"{raster2pgsql_exe}" -I -C -M -t auto "{raster_file}" public.{table_name} | "{psql_exe}" -h {DB_HOST} -p {DB_PORT} -U {DB_USER} -d {DB_NAME}'
        
        # We redirect stderr to suppress the massive stream of queries if it fails, but we already fixed the extension issue
        result = subprocess.run(cmd, shell=True, env=env)
        if result.returncode == 0:
            print(f"Success: {table_name} ingested.")
        else:
            print(f"Failed to ingest {table_name}")
            
    return True

def ingest_with_docker():
    docker_exe = find_executable("docker.exe")
    if not docker_exe:
        return False

    print(f"Found Docker at: {docker_exe}")
    
    for raster_file, table_name in rasters:
        print(f"\nIngesting {table_name} using Docker...")
        tmp_path = f"/tmp/{os.path.basename(raster_file)}"
        
        try:
            print("1. Copying file to container...")
            subprocess.run(f'"{docker_exe}" cp "{raster_file}" geonarrative_db:{tmp_path}', shell=True, check=True)
            
            print("2. Running raster2pgsql inside container...")
            cmd_docker = f'"{docker_exe}" exec -e PGPASSWORD={DB_PASSWORD} geonarrative_db sh -c "raster2pgsql -I -C -M -t auto {tmp_path} public.{table_name} | psql -U {DB_USER} -d {DB_NAME}"'
            subprocess.run(cmd_docker, shell=True, check=True)
            
            print("3. Cleaning up...")
            subprocess.run(f'"{docker_exe}" exec geonarrative_db rm {tmp_path}', shell=True)
            print(f"Success: {table_name} ingested.")
        except Exception as e:
            print(f"Failed Docker ingestion for {table_name}: {e}")

    return True

if __name__ == "__main__":
    print("===================================================")
    print("GeoNarrative Raster Fixer")
    print("===================================================")
    
    # FIX: Enable the raster extension first!
    enable_postgis_raster()
    
    print("\nAttempting to find the correct tools automatically...")
    
    # Try local PostgreSQL installation first
    if not ingest_with_local_postgres():
        print("\nLocal PostgreSQL tools not found. Attempting Docker...")
        # Try Docker by explicit path next
        if not ingest_with_docker():
            print("\nCould not find Docker or PostgreSQL installations in default C:\\Program Files\\ paths.")
            print("Please restart your VS Code so it can detect Docker in the PATH environment variables.")
    
    print("\nProcess finished. Check pgAdmin and refresh your tables list!")
