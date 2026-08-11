/**
 * FloodGrid.ts — Data structure for the cellular flood simulation grid.
 * 
 * Holds all GIS-sampled attributes per cell and manages wet/dry state transitions.
 * This module is pure data — no Cesium dependencies.
 */

export interface FloodCell {
  i: number;          // flat index
  r: number;          // row
  c: number;          // column
  lon: number;        // longitude (EPSG:4326)
  lat: number;        // latitude (EPSG:4326)
  elev: number | null;     // terrain elevation (m)
  slope: number | null;    // terrain gradient
  dtr: number | null;      // distance to river (m)
  sus: number | null;      // flood susceptibility score (0-1)
  susClass: string;        // VERY_HIGH | HIGH | MODERATE | LOW | VERY_LOW | NONE
  lulc: string;            // land use/land cover class name
  bdens: number | null;    // building density
  seed: boolean;           // is this a river seed cell?
  
  // Simulation state (mutable during simulation)
  wet: boolean;            // currently inundated?
  waterDepth: number;      // current water depth above terrain (m)
  arrivalTime: number;     // simulation progress when cell was first inundated (0-1)
}

export interface FloodGridMetadata {
  nRows: number;
  nCols: number;
  totalCells: number;
  cellSizeLon: number;
  cellSizeLat: number;
  bounds: {
    minLon: number;
    maxLon: number;
    minLat: number;
    maxLat: number;
  };
  elevStats: {
    min: number;
    max: number;
    mean: number;
  };
  seedCount: number;
  validCells: number;
}

export interface FloodGridData {
  metadata: FloodGridMetadata;
  cells: FloodCell[];
  seeds: number[];       // indices of river seed cells
  neighbours: number[][]; // 8-connectivity adjacency list
}

export class FloodGrid {
  public metadata!: FloodGridMetadata;
  public cells: FloodCell[] = [];
  public seeds: number[] = [];
  public neighbours: number[][] = [];
  
  // Track which cells became wet this simulation
  public wetCells: Set<number> = new Set();
  public newlyWetCells: number[] = [];
  
  private loaded: boolean = false;

  /**
   * Load grid data from backend response.
   */
  public load(data: FloodGridData): void {
    this.metadata = data.metadata;
    this.seeds = data.seeds;
    this.neighbours = data.neighbours;
    
    // Initialize cells with simulation state
    this.cells = data.cells.map(c => ({
      ...c,
      wet: false,
      waterDepth: 0,
      arrivalTime: -1,
    }));
    
    this.wetCells = new Set();
    this.newlyWetCells = [];
    this.loaded = true;
    
    console.log(
      `[FloodGrid] Loaded: ${this.metadata.totalCells} cells, ` +
      `${this.seeds.length} seeds, ` +
      `elevation [${this.metadata.elevStats.min}-${this.metadata.elevStats.max}]m`
    );
  }

  public isLoaded(): boolean {
    return this.loaded;
  }

  /**
   * Reset all cells to dry state.
   */
  public reset(): void {
    for (const cell of this.cells) {
      cell.wet = false;
      cell.waterDepth = 0;
      cell.arrivalTime = -1;
    }
    this.wetCells = new Set();
    this.newlyWetCells = [];
  }

  /**
   * Mark a cell as wet and record its arrival time.
   */
  public inundateCell(index: number, depth: number, progress: number): boolean {
    const cell = this.cells[index];
    if (!cell || cell.wet || cell.elev === null) return false;
    
    cell.wet = true;
    cell.waterDepth = depth;
    cell.arrivalTime = progress;
    this.wetCells.add(index);
    this.newlyWetCells.push(index);
    return true;
  }

  /**
   * Get the count of wet cells by susceptibility class.
   */
  public getWetCellsByZone(): Record<string, number> {
    const counts: Record<string, number> = {
      VERY_HIGH: 0, HIGH: 0, MODERATE: 0, LOW: 0, VERY_LOW: 0, NONE: 0,
    };
    for (const idx of this.wetCells) {
      const cell = this.cells[idx];
      if (cell && cell.susClass in counts) {
        counts[cell.susClass]++;
      }
    }
    return counts;
  }

  /**
   * Get statistics for the current flood state.
   */
  public getStats(): { wetCount: number; maxDepth: number; avgDepth: number; byZone: Record<string, number> } {
    let maxDepth = 0;
    let totalDepth = 0;
    const byZone = this.getWetCellsByZone();
    
    for (const idx of this.wetCells) {
      const cell = this.cells[idx];
      if (cell) {
        totalDepth += cell.waterDepth;
        if (cell.waterDepth > maxDepth) maxDepth = cell.waterDepth;
      }
    }
    
    return {
      wetCount: this.wetCells.size,
      maxDepth,
      avgDepth: this.wetCells.size > 0 ? totalDepth / this.wetCells.size : 0,
      byZone,
    };
  }
}
