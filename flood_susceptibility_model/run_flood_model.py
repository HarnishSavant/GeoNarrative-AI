import os
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# Configuration
DB_HOST = "localhost"
DB_PORT = "5432"
DB_NAME = "geonarrative"
DB_USER = "postgres"
DB_PASSWORD = "root"

def run_flood_model():
    print("=========================================================")
    print("GeoNarrative AI: Re-Calibrated Urban Flood Modeler")
    print("=========================================================")
    
    sql_file = os.path.join(os.path.dirname(__file__), "flood_mcd_analysis.sql")
    
    with open(sql_file, 'r') as f:
        sql = f.read()
        
    try:
        conn = psycopg2.connect(f"host={DB_HOST} port={DB_PORT} dbname={DB_NAME} user={DB_USER} password={DB_PASSWORD}")
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()
        print("Executing Recalibrated MCDA logic inside PostGIS...")
        cur.execute(sql)
        print("Model execution completed successfully.")
        
        # Pull Summary Statistics
        cur.execute("""
            SELECT risk_class, COUNT(*) as hex_count, 
                   ROUND((COUNT(*) * 100.0 / SUM(COUNT(*)) OVER()), 2) as percentage
            FROM flood_susceptibility
            GROUP BY risk_class
            ORDER BY 
                CASE risk_class
                    WHEN 'Very Low' THEN 1
                    WHEN 'Low' THEN 2
                    WHEN 'Moderate' THEN 3
                    WHEN 'High' THEN 4
                    WHEN 'Very High' THEN 5
                END;
        """)
        
        rows = cur.fetchall()
        
        report_lines = [
            "# Urban Flood Susceptibility Model: Validation & Sensitivity Report",
            "**Methodology**: Multi-Criteria Decision Analysis (MCDA) with Statistical Quantile Classification",
            "---",
            "## 1. Classification Output Distribution",
            "| Risk Class | Hexagon Count | Percentage |",
            "|---|---|---|"
        ]
        
        print("\nFlood Susceptibility Breakdown:")
        print("---------------------------------")
        for r in rows:
            report_lines.append(f"| {r[0]} | {r[1]} | {r[2]}% |")
            print(f"[{r[0]}] Risk: {r[1]} hexagons ({r[2]}%)")
            
        report_lines.extend([
            "",
            "## 2. MCDA Calibration Audit",
            "### AHP Weights Applied:",
            "- **Elevation**: 0.35",
            "- **Distance to Waterways**: 0.25",
            "- **Slope**: 0.20",
            "- **Land Use / Land Cover (LULC)**: 0.10",
            "- **Building Density**: 0.10",
            "",
            "### Factor Normalization Strategy (1 to 5 Discrete Scale):",
            "Global Min-Max normalization was replaced with statistically and hydrologically robust discrete scaling to correct the right-tail skew:",
            "1. **Elevation**: Quantile Distribution (`NTILE(5)`). Lowest 20% = Score 5.",
            "2. **Slope**: Hydrologic limits. `< 2 deg` = Score 5, `> 15 deg` = Score 1.",
            "3. **Distance to Waterways**: Buffers. `< 100m` = Score 5, `> 2000m` = Score 1.",
            "4. **Building Density**: Quantile Distribution (`NTILE(5)`). Highest 20% = Score 5.",
            "5. **LULC**: Imperviousness mapping. Built-up/Water = Score 5, Forest = Score 1.",
            "",
            "### Final Classification Thresholds (FSI):",
            "The final Flood Susceptibility Index (FSI) ranges from 1.0 to 5.0.",
            "- **Very Low**: 1.0 - 1.8",
            "- **Low**: 1.8 - 2.6",
            "- **Moderate**: 2.6 - 3.4",
            "- **High**: 3.4 - 4.2",
            "- **Very High**: 4.2 - 5.0"
        ])
        
        report_path = os.path.join(os.path.dirname(__file__), "flood_model_validation.md")
        with open(report_path, 'w') as f:
            f.write("\n".join(report_lines))
            
        print(f"\nValidation report saved: {report_path}")
        conn.close()
        
    except Exception as e:
        print(f"Error executing flood model: {e}")

if __name__ == "__main__":
    run_flood_model()
