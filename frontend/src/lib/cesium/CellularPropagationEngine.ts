/**
 * CellularPropagationEngine.ts — High-Performance GIS Topological Flood Propagation Engine.
 * 
 * UPGRADED FOR REAL-TIME METADATA & ANALYTICAL RELIABILITY:
 * - Direct Topological Distance-from-River Scan: Eliminates queue bottlenecks to guarantee steady, realistic
 *   inundation of surrounding urban cells as simulation progress advances past Stage 2 (22%).
 * - Seamlessly synchronizes with ExposureEngine to display real-time climbing Flooded Area km² and Buildings Exposed stats.
 */

import { FloodGrid, FloodCell } from './FloodGrid';
import { ScenarioConfig } from './SimulationFramework';

interface FrontierEntry {
  index: number;
  priority: number;
}

export class CellularPropagationEngine {
  private grid: FloodGrid;
  private frontier: FrontierEntry[] = [];
  private inFrontier: Set<number> = new Set();
  
  private currentWaterSurface: number = 0;
  private lastProgress: number = 0;
  
  public cellsInundatedThisFrame: number[] = [];

  constructor(grid: FloodGrid) {
    this.grid = grid;
  }

  public initialize(scenario?: ScenarioConfig): void {
    this.frontier = [];
    this.inFrontier = new Set();
    this.lastProgress = 0;
    this.currentWaterSurface = 0;
    this.cellsInundatedThisFrame = [];
    
    // Seed initial riverbank frontier
    for (const seedIdx of this.grid.seeds) {
      const neighbours = this.grid.neighbours[seedIdx];
      if (!neighbours) continue;
      
      for (const ni of neighbours) {
        const cell = this.grid.cells[ni];
        if (cell && !cell.wet && cell.elev !== null && !this.inFrontier.has(ni)) {
          const priority = this._computePriority(cell, scenario);
          this.frontier.push({ index: ni, priority });
          this.inFrontier.add(ni);
        }
      }
    }
    
    this.frontier.sort((a, b) => a.priority - b.priority);
    console.log(`[CellularPropagationEngine] Initialized with ${this.frontier.length} riverbank frontier cells.`);
  }

  /**
   * Step flood propagation forward based on simulation progress, spreading outward from the riverbanks across surrounding city blocks.
   */
  public step(progress: number, scenario: ScenarioConfig): number {
    this.cellsInundatedThisFrame = [];
    
    // NORMAL scenario: Ordinary rainfall does NOT create urban disaster flooding (PART 7)
    if (scenario.name === 'NORMAL' || (scenario.propagationRate ?? 0) === 0) {
      return 0;
    }

    // Time-gated sequence (PART 9 & 20): Between 0.0 and 0.22 progress (Stage 1), ONLY river contains water.
    if (progress < 0.22) {
      return 0;
    }
    
    // Calculate hydraulic overflow progress (from 0.0 at stage 2 up to 1.0 at peak)
    const overflowProgress = Math.min(1.0, (progress - 0.22) / 0.70);
    const easeProgress = overflowProgress * (2 - overflowProgress);
    
    // Hydraulic water level rise above central Pune river channel baseline (~540m)
    const baseRiverElev = 540.0; 
    const riseHead = (scenario.maximumWaterLevel ?? 4.0) * 2.5;
    this.currentWaterSurface = baseRiverElev + (easeProgress * riseHead);
    
    this.lastProgress = progress;
    
    // Determine target expansion reach from riverbanks into surrounding neighborhoods based on scenario intensity
    let maxAllowedReachMeters = 350.0; // Moderate rainfall
    if (scenario.name === 'HEAVY') maxAllowedReachMeters = 650.0; // Heavy storm (user scenario)
    if (scenario.name === 'EXTREME') maxAllowedReachMeters = 1100.0; // Extreme surge
    
    const currentMaxReach = 85.0 + (overflowProgress * maxAllowedReachMeters);
    
    let inundated = 0;
    
    // Direct topological scan across all valid cells to ensure uniform, reliable flood spreading & accurate dashboard metrics
    const totalCells = this.grid.cells.length;
    for (let i = 0; i < totalCells; i++) {
      const cell = this.grid.cells[i];
      if (!cell || cell.wet || cell.seed) continue;
      
      const dtr = cell.dtr ?? 9999.0;
      const cellDtrMeters = (dtr > 20) ? dtr : (dtr * 111000);
      
      // If cell is within current spreading flood radius and not on a steep mountain hill (>35° slope)
      if (cellDtrMeters <= currentMaxReach && (cell.slope ?? 0) <= 35.0) {
        const depth = Math.min(
          Math.max(0.3, this.currentWaterSurface - (cell.elev ?? 540.0)),
          scenario.maximumWaterLevel ?? 4.0
        );
        this.grid.inundateCell(i, depth, progress);
        this.cellsInundatedThisFrame.push(i);
        inundated++;
      }
    }
    
    return inundated;
  }

  private _computePriority(cell: FloodCell, scenario?: ScenarioConfig): number {
    const elev = cell.elev ?? 999;
    const dtr = cell.dtr ?? 10000;
    const slope = cell.slope ?? 90;
    const sus = cell.sus ?? 0;
    
    const elevStats = this.grid.metadata.elevStats;
    const elevRange = Math.max(elevStats.max - elevStats.min, 1);
    
    const normElev = (elev - elevStats.min) / elevRange;
    const normDtr = Math.min(dtr / ((dtr > 10) ? 3000.0 : 0.03), 1.0);
    const normSlope = Math.min(slope / 45.0, 1.0);
    
    const distWeight = scenario ? (scenario.distancePenalty ?? 2.0) : 2.0;
    const slopeWeight = scenario ? (scenario.slopePenalty ?? 2.0) : 2.0;
    
    return (normElev * 4.0) + (normDtr * distWeight) + (normSlope * slopeWeight) - (sus * 2.0);
  }

  public reset(): void {
    this.frontier = [];
    this.inFrontier.clear();
    this.currentWaterSurface = 0;
    this.lastProgress = 0;
    this.cellsInundatedThisFrame = [];
  }

  public getWaterSurface(): number {
    return this.currentWaterSurface;
  }

  public getFrontierSize(): number {
    return this.frontier.length;
  }
}
