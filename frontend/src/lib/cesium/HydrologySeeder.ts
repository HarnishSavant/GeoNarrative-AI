/**
 * HydrologySeeder.ts — Identifies and initializes river seed cells.
 * 
 * At t=0, seeds the river network cells as the origin points for flood propagation.
 * Uses the dist_to_river and LULC attributes from the GIS grid.
 */

import { FloodGrid } from './FloodGrid';

export class HydrologySeeder {
  private grid: FloodGrid;

  constructor(grid: FloodGrid) {
    this.grid = grid;
  }

  /**
   * Seed all river cells with initial water depth.
   * Called at t=0 to establish the baseline hydrological state.
   * 
   * @param baseDepth - Initial water depth for river cells (meters)
   * @returns Number of cells seeded
   */
  public seedRiverCells(baseDepth: number = 2.0): number {
    let count = 0;
    for (const idx of this.grid.seeds) {
      const cell = this.grid.cells[idx];
      if (cell && cell.elev !== null) {
        cell.wet = true;
        cell.waterDepth = baseDepth;
        cell.arrivalTime = 0;
        this.grid.wetCells.add(idx);
        count++;
      }
    }
    console.log(`[HydrologySeeder] Seeded ${count} river cells`);
    return count;
  }

  /**
   * Get the river seed cells for rendering.
   * Returns their coordinates for the RiverEngine to visualize.
   */
  public getRiverCellCoordinates(): Array<{ lon: number; lat: number; elev: number }> {
    const coords: Array<{ lon: number; lat: number; elev: number }> = [];
    for (const idx of this.grid.seeds) {
      const cell = this.grid.cells[idx];
      if (cell && cell.elev !== null) {
        coords.push({ lon: cell.lon, lat: cell.lat, elev: cell.elev });
      }
    }
    return coords;
  }
}
