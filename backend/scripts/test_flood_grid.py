"""Test script for flood grid generation."""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from gis.loader import load_gis_data
from gis.flood_grid_service import generate_flood_grid

if __name__ == "__main__":
    print("Loading GIS data...")
    load_gis_data()
    
    print("Generating flood grid...")
    g = generate_flood_grid()
    
    print(f"Total cells: {g['metadata']['totalCells']}")
    print(f"Seeds: {g['metadata']['seedCount']}")
    print(f"Valid cells: {g['metadata']['validCells']}")
    print(f"Elevation range: {g['metadata']['elevStats']}")
    print(f"Grid size: {g['metadata']['nRows']} x {g['metadata']['nCols']}")
    
    # Show a few seed cells
    if g['seeds']:
        print(f"\nFirst 5 seed cells:")
        for idx in g['seeds'][:5]:
            c = g['cells'][idx]
            print(f"  Cell {idx}: ({c['lon']}, {c['lat']}) elev={c['elev']}m dtr={c['dtr']}m sus={c['sus']}")
    
    print("\nGrid generation successful!")
