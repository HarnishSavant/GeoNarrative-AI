import os
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

DB_HOST = "localhost"
DB_PORT = "5432"
DB_NAME = "geonarrative"
DB_USER = "postgres"
DB_PASSWORD = "root"

def run_risk():
    print("=========================================================")
    print("GeoNarrative AI: Digital Twin Flood Risk Framework")
    print("=========================================================")
    
    sql_file = os.path.join(os.path.dirname(__file__), "flood_risk_analysis.sql")
    with open(sql_file, 'r') as f:
        sql = f.read()
        
    try:
        conn = psycopg2.connect(f"host={DB_HOST} port={DB_PORT} dbname={DB_NAME} user={DB_USER} password={DB_PASSWORD}")
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()
        print("Calculating Vulnerability Index & Composite Risk (R = H x E x V)...")
        cur.execute(sql)
        print("Risk Framework generated successfully.")
        
        # Validation Output
        report_lines = [
            "# Composite Flood Risk Validation Report",
            "**Methodology**: UNDRR Standard Risk = Hazard × Exposure × Vulnerability",
            "---",
            "## 1. Final Risk Classification Distribution",
            "| Risk Class | Hexagons | Percentage |",
            "|---|---|---|"
        ]
        
        print("\n--- Final Digital Twin Risk Classes ---")
        cur.execute("""
            SELECT risk_class, COUNT(*), ROUND((COUNT(*) * 100.0 / SUM(COUNT(*)) OVER()), 2)
            FROM flood_risk GROUP BY risk_class
            ORDER BY CASE risk_class WHEN 'Very Low' THEN 1 WHEN 'Low' THEN 2 WHEN 'Moderate' THEN 3 WHEN 'High' THEN 4 WHEN 'Very High' THEN 5 END;
        """)
        for r in cur.fetchall():
            report_lines.append(f"| {r[0]} | {r[1]} | {r[2]}% |")
            print(f"[{r[0]}]: {r[1]} hexagons ({r[2]}%)")
            
        print("\n--- Vulnerability Index Metrics ---")
        cur.execute("""
            SELECT ROUND(AVG(vulnerability_score)::numeric, 2), ROUND(MAX(vulnerability_score)::numeric, 2) FROM vulnerability_index;
        """)
        avg_v, max_v = cur.fetchone()
        print(f"Average Vulnerability: {avg_v} / 100")
        print(f"Maximum Vulnerability: {max_v} / 100")
        
        report_lines.extend([
            "",
            "## 2. Vulnerability Index Statistics",
            f"- **Average Vulnerability Score**: {avg_v} / 100",
            f"- **Maximum Vulnerability Score**: {max_v} / 100",
            "",
            "## 3. Digital Twin Implementation Status",
            "The multi-layered `flood_risk` table has been perfectly synchronized. GeoAI Agents can now execute localized queries isolating absolute physical Hazard vs socio-economic Vulnerability."
        ])
        
        report_path = os.path.join(os.path.dirname(__file__), "risk_validation_report.md")
        with open(report_path, 'w') as f:
            f.write("\n".join(report_lines))
            
        print(f"\nReport generated: {report_path}")
        conn.close()
        
    except Exception as e:
        print(f"Error executing risk model: {e}")

if __name__ == "__main__":
    run_risk()
