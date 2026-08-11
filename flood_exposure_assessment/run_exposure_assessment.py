import os
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

DB_HOST = "localhost"
DB_PORT = "5432"
DB_NAME = "geonarrative"
DB_USER = "postgres"
DB_PASSWORD = "root"

def run_exposure():
    print("=========================================================")
    print("GeoNarrative AI: Urban Flood Exposure Assessment")
    print("=========================================================")
    
    sql_file = os.path.join(os.path.dirname(__file__), "flood_exposure_analysis.sql")
    with open(sql_file, 'r') as f:
        sql = f.read()
        
    try:
        conn = psycopg2.connect(f"host={DB_HOST} port={DB_PORT} dbname={DB_NAME} user={DB_USER} password={DB_PASSWORD}")
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()
        print("Executing Spatial Intersections in PostGIS (This may take a minute)...")
        cur.execute(sql)
        print("Exposure Assessment executed successfully.")
        
        # Build Report
        report_lines = [
            "# Urban Flood Exposure Validation Report",
            "**Module**: Digital Twin Disaster Risk Analytics",
            "---",
            "## 1. Building Exposure Statistics",
            "| Risk Class | Exposed Buildings | Percentage |",
            "|---|---|---|"
        ]
        
        print("\n--- Building Exposure ---")
        cur.execute("""
            SELECT risk_class, COUNT(*), ROUND((COUNT(*) * 100.0 / SUM(COUNT(*)) OVER()), 2)
            FROM building_exposure GROUP BY risk_class
            ORDER BY CASE risk_class WHEN 'Very Low' THEN 1 WHEN 'Low' THEN 2 WHEN 'Moderate' THEN 3 WHEN 'High' THEN 4 WHEN 'Very High' THEN 5 END;
        """)
        for r in cur.fetchall():
            report_lines.append(f"| {r[0]} | {r[1]} | {r[2]}% |")
            print(f"[{r[0]}]: {r[1]} buildings")
            
        report_lines.extend(["", "## 2. Road Network Exposure (Meters)", "| Risk Class | Road Length (m) | Percentage |", "|---|---|---|"])
        
        print("\n--- Road Exposure ---")
        cur.execute("""
            SELECT risk_class, ROUND(SUM(exposed_length_m)::numeric, 2), ROUND((SUM(exposed_length_m) * 100.0 / SUM(SUM(exposed_length_m)) OVER())::numeric, 2)
            FROM road_exposure GROUP BY risk_class
            ORDER BY CASE risk_class WHEN 'Very Low' THEN 1 WHEN 'Low' THEN 2 WHEN 'Moderate' THEN 3 WHEN 'High' THEN 4 WHEN 'Very High' THEN 5 END;
        """)
        for r in cur.fetchall():
            report_lines.append(f"| {r[0]} | {r[1]:,} m | {r[2]}% |")
            print(f"[{r[0]}]: {r[1]:,} meters")
            
        report_lines.extend(["", "## 3. Critical Infrastructure (POI) Exposure", "| Risk Class | Critical POIs |", "|---|---|"])
        
        print("\n--- Critical POI Exposure ---")
        cur.execute("""
            SELECT risk_class, COUNT(*)
            FROM poi_exposure GROUP BY risk_class
            ORDER BY CASE risk_class WHEN 'Very Low' THEN 1 WHEN 'Low' THEN 2 WHEN 'Moderate' THEN 3 WHEN 'High' THEN 4 WHEN 'Very High' THEN 5 END;
        """)
        for r in cur.fetchall():
            report_lines.append(f"| {r[0]} | {r[1]} |")
            print(f"[{r[0]}]: {r[1]} POIs")
            
        report_path = os.path.join(os.path.dirname(__file__), "exposure_validation_report.md")
        with open(report_path, 'w') as f:
            f.write("\n".join(report_lines))
            
        print(f"\nReport generated: {report_path}")
        conn.close()
        
    except Exception as e:
        print(f"Error executing exposure model: {e}")

if __name__ == "__main__":
    run_exposure()
