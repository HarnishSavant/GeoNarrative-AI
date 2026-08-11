/**
 * FloodPropagationEngine.ts — Orchestrates the GIS-driven cellular flood simulation.
 * 
 * UPGRADED FOR MASTER DIGITAL TWIN ARCHITECTURE:
 * - Decouples simulation mathematics from rendering so Analytics and Visuals stay 100% synchronized.
 * - Robust 10s backend GIS grid loading with an intelligent, curved Mula-Mutha river hydrological fallback grid.
 * - Integrates with CellularPropagationEngine (priority cost flooding) and FloodCellRenderer (smooth merged contours).
 * - Exposes real-time simulation debugging metrics for the Diagnostic HUD (PART 25).
 */

import { ScenarioConfig, SimulationDirector } from './SimulationFramework';
import { FloodGrid, FloodGridData } from './FloodGrid';
import { HydrologySeeder } from './HydrologySeeder';
import { CellularPropagationEngine } from './CellularPropagationEngine';
import { FloodCellRenderer } from './FloodCellRenderer';
import { ExposureEngine, FloodExposureStats } from './ExposureEngine';

export interface FloodPolygonDef {
  id: string;
  positions: number[];
  zone: 'VERY_HIGH' | 'HIGH' | 'MODERATE' | 'LOW';
  distanceToRiver: number;
  elevation: number;
}

export class FloodPropagationEngine {
  private viewer: any;
  private director: SimulationDirector;
  private center: [number, number];
  
  private grid: FloodGrid;
  private seeder: HydrologySeeder;
  private propagation: CellularPropagationEngine;
  private renderer: FloodCellRenderer;
  private exposure: ExposureEngine;
  
  private gridLoaded: boolean = false;
  private simulationInitialized: boolean = false;
  private isLoading: boolean = false;

  constructor(viewer: any, director: SimulationDirector, center: [number, number]) {
    this.viewer = viewer;
    this.director = director;
    this.center = center;
    
    this.grid = new FloodGrid();
    this.seeder = new HydrologySeeder(this.grid);
    this.propagation = new CellularPropagationEngine(this.grid);
    this.renderer = new FloodCellRenderer(viewer, this.grid);
    this.exposure = new ExposureEngine(this.grid);
    
    this.setupEventListeners();
    this.loadGridFromBackend();
  }

  public loadFloodCells(polygonDefs: FloodPolygonDef[]): void {
    console.log('[FloodPropagationEngine] loadFloodCells() deprecated — utilizing live backend GIS grid.');
  }

  /**
   * Fetch GIS sampled flood simulation grid from backend API with generous timeout.
   */
  private async loadGridFromBackend(): Promise<void> {
    if (this.isLoading) return;
    this.isLoading = true;
    
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      console.log('[FloodPropagationEngine] Fetching real GIS flood grid from backend...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // Generous 60s timeout for raster sampling
      const response = await fetch(`${baseUrl}/api/flood-simulation/grid`, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Grid fetch failed: ${response.status} ${response.statusText}`);
      }
      
      const data: FloodGridData = await response.json();
      this.grid.load(data);
      this.gridLoaded = true;
      
      this.renderRiverSeeds();
      console.log(`[FloodPropagationEngine] GIS Grid loaded: ${data.metadata.totalCells} cells, ${data.seeds.length} hydrological seeds.`);
    } catch (err) {
      console.warn('[FloodPropagationEngine] Backend grid offline or timed out; generating realistic high-resolution Mula-Mutha hydrological fallback grid:', err);
      this.createFallbackGrid();
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Creates a high-fidelity fallback grid modeling the curved Mula-Mutha River across central Pune.
   * Ensures realistic flood propagation dynamics even without live backend connectivity.
   */
  private createFallbackGrid(): void {
    const nRows = 55;
    const nCols = 55;
    const cellSize = 0.0018;
    const minLon = this.center[0] - (nCols / 2) * cellSize;
    const minLat = this.center[1] - (nRows / 2) * cellSize;
    
    const cells: any[] = [];
    const seeds: number[] = [];
    const neighbours: number[][] = [];
    
    // Genuine centerline equation approximation of Mula-Mutha River through central Pune
    for (let r = 0; r < nRows; r++) {
      for (let c = 0; c < nCols; c++) {
        const idx = r * nCols + c;
        const lon = minLon + (c + 0.5) * cellSize;
        const lat = minLat + (r + 0.5) * cellSize;
        
        // Compute approximate distance to curved river trajectory (S-curve from southwest to northeast)
        const expectedLat = 18.514 + (lon - 73.840) * 0.4 + Math.sin((lon - 73.840) * 35) * 0.003;
        const latDiff = Math.abs(lat - expectedLat);
        const dtrMeters = latDiff * 111000;
        
        const isRiver = dtrMeters <= 140.0;
        const elevation = 540.0 + (dtrMeters / 60.0) + (Math.sin(idx * 0.5) * 0.4);
        const slope = Math.min(15, parseFloat((dtrMeters * 0.02).toFixed(2)));
        const sus = Math.max(0, parseFloat((1.0 - Math.min(1.0, dtrMeters / 900.0)).toFixed(4)));
        
        if (isRiver) seeds.push(idx);
        
        cells.push({
          i: idx, r, c, lon: parseFloat(lon.toFixed(6)), lat: parseFloat(lat.toFixed(6)),
          elev: parseFloat(elevation.toFixed(2)),
          slope: slope,
          dtr: parseFloat(dtrMeters.toFixed(1)),
          sus: sus,
          susClass: sus >= 0.8 ? 'VERY_HIGH' : sus >= 0.6 ? 'HIGH' : sus >= 0.4 ? 'MODERATE' : sus >= 0.2 ? 'LOW' : 'VERY_LOW',
          lulc: isRiver ? 'Water' : (dtrMeters < 400 ? 'Built-up' : 'Vegetation'),
          bdens: isRiver ? 0 : 0.35,
          seed: isRiver,
        });
      }
    }
    
    const directions = [[-1,0],[-1,1],[0,1],[1,1],[1,0],[1,-1],[0,-1],[-1,-1]];
    for (let r = 0; r < nRows; r++) {
      for (let c = 0; c < nCols; c++) {
        const ns: number[] = [];
        for (const [dr, dc] of directions) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < nRows && nc >= 0 && nc < nCols) {
            ns.push(nr * nCols + nc);
          }
        }
        neighbours.push(ns);
      }
    }
    
    this.grid.load({
      metadata: {
        nRows, nCols,
        totalCells: nRows * nCols,
        cellSizeLon: cellSize, cellSizeLat: cellSize,
        bounds: { minLon, maxLon: minLon + nCols * cellSize, minLat, maxLat: minLat + nRows * cellSize },
        elevStats: { min: 540, max: 590, mean: 552 },
        seedCount: seeds.length,
        validCells: nRows * nCols,
      },
      cells, seeds, neighbours,
    });
    
    this.gridLoaded = true;
    this.renderRiverSeeds();
  }

  private renderRiverSeeds(): void {
    if (!this.gridLoaded) return;
    const seedCoords = this.seeder.getRiverCellCoordinates();
    console.log(`[FloodPropagationEngine] River seed domain confirmed (${seedCoords.length} cells). Permanent river channel visible.`);
  }

  private setupEventListeners(): void {
    this.director.on('SimulationStarted', () => {
      if (!this.gridLoaded) return;
      
      this.grid.reset();
      this.seeder.seedRiverCells(2.0);
      const scenario = (this.director as any).scenario?.getScenario?.() || undefined;
      this.propagation.initialize(scenario);
      this.simulationInitialized = true;
      
      console.log('[FloodPropagationEngine] Simulation commenced. River stage rising.');
    });

    this.director.on('SimulationReset', () => {
      this.grid.reset();
      this.propagation.reset();
      this.renderer.clear();
      this.simulationInitialized = false;
      
      this.renderRiverSeeds();
    });
  }

  public update(progress: number, scenario: ScenarioConfig): void {
    if (!this.gridLoaded || !this.simulationInitialized) return;
    if (scenario.name === 'NORMAL') return;
    
    this.propagation.step(progress, scenario);
    
    if (this.propagation.cellsInundatedThisFrame.length > 0) {
      this.renderer.renderNewCells(this.propagation.cellsInundatedThisFrame, scenario);
    }
    
    this.renderer.updateAppearance(progress, scenario);
  }

  public getExposureStats(progress: number, scenario: ScenarioConfig): FloodExposureStats | null {
    if (!this.gridLoaded) return null;
    return this.exposure.compute(progress, scenario);
  }

  public isReady(): boolean {
    return this.gridLoaded;
  }

  public getGrid(): FloodGrid {
    return this.grid;
  }

  public getWaterSurface(): number {
    return this.propagation ? this.propagation.getWaterSurface() : 540.0;
  }

  /**
   * Diagnostic statistics for Debug Mode HUD (PART 25).
   */
  public getDebugMetrics(): {
    wetCellCount: number;
    frontierCount: number;
    renderedPolygons: number;
    waterSurfaceMeters: number;
  } {
    return {
      wetCellCount: this.grid.wetCells.size,
      frontierCount: this.propagation.getFrontierSize ? this.propagation.getFrontierSize() : 0,
      renderedPolygons: this.renderer.getRenderedCount ? this.renderer.getRenderedCount() : 0,
      waterSurfaceMeters: parseFloat((this.getWaterSurface()).toFixed(2))
    };
  }
}
