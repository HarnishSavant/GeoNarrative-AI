/**
 * InfrastructureEffectEngine.ts — Professional visual styling for Buildings and Roads during flood scenarios.
 * 
 * ARCHITECTED FOR PHASE 5.6 & CRITICAL RENDER FIXES:
 * - Eliminates giant default blue pushpin symbols by explicitly clearing entity.billboard and entity.label.
 * - Prevents Cesium 'Cannot read properties of undefined' crashes by avoiding destructive remove/re-add loops;
 *   uses non-destructive dataSource.show toggling during temporal animation frame updates.
 * - Strictly follows Section 3 & 18 & 19 & 20 exact Hex colors (#FFD21F Affected, #E53935 Critical, #FF8C00 Roads)
 *   rendered above flood layers with positive infinity depth disabling.
 */

import { ScenarioConfig, SimulationDirector } from './SimulationFramework';

export class InfrastructureEffectEngine {
  private viewer: any;
  private director: SimulationDirector;
  private floodEngine: any | null = null;
  
  private baseImageryLayer: any | null = null;
  
  private currentFrameIdx: number = -1;
  private currentScenario: string = '';
  
  private activeBuildingsSource: any | null = null;
  private activeRoadsSource: any | null = null;
  
  // Memory-safe exposure cache: { "extreme_5": { buildings: GeoJsonDataSource, roads: GeoJsonDataSource } }
  private exposureCache: Map<string, { buildings: any; roads: any }> = new Map();
  private isFetching: boolean = false;

  constructor(viewer: any, director: SimulationDirector) {
    this.viewer = viewer;
    this.director = director;
    this.setupEventListeners();
  }

  public setFloodEngine(floodEngine: any): void {
    this.floodEngine = floodEngine;
  }

  public registerAssets(buildings: any, baseImagery: any, roads: any[]) {
    this.baseImageryLayer = baseImagery;
    this.reset();
  }

  private setupEventListeners() {
    this.director.on('SimulationReset', () => this.reset());
    this.director.on('SimulationStarted', () => {
       const scenario = (this.director as any).scenario?.getScenario?.();
       if (scenario) {
           this.currentScenario = scenario.name.toLowerCase();
       }
    });
  }

  public reset() {
    const Cesium = (window as any).Cesium;
    if (!Cesium) return;

    this.currentFrameIdx = -1;
    this.clearActiveSources();

    if (this.baseImageryLayer) {
      this.baseImageryLayer.brightness = 1.0;
      this.baseImageryLayer.gamma = 1.0;
    }
  }

  private clearActiveSources() {
    // Safely hide active sources instead of destructively detaching primitives during render loop
    if (this.activeBuildingsSource) {
      this.activeBuildingsSource.show = false;
    }
    if (this.activeRoadsSource) {
      this.activeRoadsSource.show = false;
    }
    this.activeBuildingsSource = null;
    this.activeRoadsSource = null;
  }

  public update(progress: number, scenario: ScenarioConfig) {
    const Cesium = (window as any).Cesium;
    if (!Cesium || !this.floodEngine) return;

    if (this.baseImageryLayer) {
      const wetnessFactor = Math.min(progress / 0.2, 1.0);
      this.baseImageryLayer.brightness = 1.0 - (wetnessFactor * 0.20);
      this.baseImageryLayer.gamma = 1.0 + (wetnessFactor * 0.25);
    }

    const manifest = this.floodEngine.getManifest();
    if (!manifest) return;
    
    const scenarioId = scenario.name.toLowerCase();
    this.currentScenario = scenarioId;

    const frameCount = manifest.frame_count || 30;
    const exactFrame = Math.max(0, Math.min(progress * (frameCount - 1), frameCount - 1));
    const baseFrame = Math.floor(exactFrame);

    // Only update infrastructure exposure when integer temporal frame changes (Section 9)
    if (this.currentFrameIdx !== baseFrame) {
      this.currentFrameIdx = baseFrame;
      this.loadAndApplyExposure(scenarioId, baseFrame);
    }
  }

  private async loadAndApplyExposure(scenarioId: string, frameIdx: number) {
    const Cesium = (window as any).Cesium;
    if (!Cesium || !this.viewer) return;

    const cacheKey = `${scenarioId}_${frameIdx}`;
    
    // If we have cached DataSources for this exact frame, simply toggle show=true!
    if (this.exposureCache.has(cacheKey)) {
       const cached = this.exposureCache.get(cacheKey)!;
       this.clearActiveSources();
       this.activeBuildingsSource = cached.buildings;
       this.activeRoadsSource = cached.roads;
       if (this.activeBuildingsSource) {
         if (!this.viewer.dataSources.contains(this.activeBuildingsSource)) {
           this.viewer.dataSources.add(this.activeBuildingsSource);
         }
         this.activeBuildingsSource.show = true;
       }
       if (this.activeRoadsSource) {
         if (!this.viewer.dataSources.contains(this.activeRoadsSource)) {
           this.viewer.dataSources.add(this.activeRoadsSource);
         }
         this.activeRoadsSource.show = true;
       }
       return;
    }

    if (this.isFetching) return;
    this.isFetching = true;

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      
      // Load affected buildings and roads without forcing expensive synchronous clamping during load
      const buildingsPromise = Cesium.GeoJsonDataSource.load(`${baseUrl}/api/v1/flood/scenarios/${scenarioId}/buildings/${frameIdx}`, {
         clampToGround: false
      }).catch(() => null);
      
      const roadsPromise = Cesium.GeoJsonDataSource.load(`${baseUrl}/api/v1/flood/scenarios/${scenarioId}/roads/${frameIdx}`, {
         clampToGround: false
      }).catch(() => null);

      const [bSource, rSource] = await Promise.all([buildingsPromise, roadsPromise]);

      // Style Buildings: remove default blue pins, apply exact Section 3 & 19 hazard colors (#FFD21F and #E53935)
      if (bSource) {
        bSource.show = false; // keep hidden until ready to show
        const entities = bSource.entities.values;
        for (let i = 0; i < entities.length; i++) {
           const entity = entities[i];
           const depth = entity.properties?.depth?.getValue() || 0.5;
           
           // CRITICAL FIX: Delete default blue pushpin billboards and labels so only hazard indicator renders!
           entity.billboard = undefined;
           entity.label = undefined;

           let color = Cesium.Color.fromCssColorString('#FFD21F'); // Affected Building Yellow
           let pointSize = 8;

           if (depth > 1.0) {
             color = Cesium.Color.fromCssColorString('#E53935'); // Critical Building Red (> 1.0m)
             pointSize = 11;
           }

           entity.point = new Cesium.PointGraphics({
             color: color,
             pixelSize: pointSize,
             outlineColor: Cesium.Color.BLACK,
             outlineWidth: 1,
             heightReference: Cesium.HeightReference ? Cesium.HeightReference.CLAMP_TO_GROUND : undefined,
             disableDepthTestDistance: Number.POSITIVE_INFINITY // Section 18: Render above flood layers & buildings!
           });
        }
      }

      // Style Roads: Affected=Orange (#FF8C00)
      if (rSource) {
        rSource.show = false;
        const rEntities = rSource.entities.values;
        for (let j = 0; j < rEntities.length; j++) {
          const rEntity = rEntities[j];
          if (rEntity.polyline) {
            rEntity.billboard = undefined;
            rEntity.label = undefined;
            rEntity.polyline.width = new Cesium.ConstantProperty(6);
            rEntity.polyline.material = new Cesium.ColorMaterialProperty(Cesium.Color.fromCssColorString('#FF8C00').withAlpha(0.95));
            rEntity.polyline.clampToGround = new Cesium.ConstantProperty(true);
          }
        }
      }

      // Save to cache (limit size to 50 to securely hold entire scenario in RAM without re-fetching on loops)
      if (this.exposureCache.size > 50) {
         const firstKey = this.exposureCache.keys().next().value;
         const old = this.exposureCache.get(firstKey);
         if (old) {
           if (old.buildings && this.viewer.dataSources.contains(old.buildings)) {
             this.viewer.dataSources.remove(old.buildings, true);
           }
           if (old.roads && this.viewer.dataSources.contains(old.roads)) {
             this.viewer.dataSources.remove(old.roads, true);
           }
         }
         this.exposureCache.delete(firstKey);
      }
      
      this.exposureCache.set(cacheKey, { buildings: bSource, roads: rSource });

      // Add to viewer dataSources
      if (bSource && !this.viewer.dataSources.contains(bSource)) {
         this.viewer.dataSources.add(bSource);
      }
      if (rSource && !this.viewer.dataSources.contains(rSource)) {
         this.viewer.dataSources.add(rSource);
      }

      // Ensure loaded frame becomes visible immediately without hiding due to slight network latency drift!
      if (frameIdx <= this.currentFrameIdx || this.currentFrameIdx === -1) {
         this.clearActiveSources();
         this.activeBuildingsSource = bSource;
         this.activeRoadsSource = rSource;
         if (this.activeBuildingsSource) {
           if (!this.viewer.dataSources.contains(this.activeBuildingsSource)) {
             this.viewer.dataSources.add(this.activeBuildingsSource);
           }
           this.activeBuildingsSource.show = true;
         }
         if (this.activeRoadsSource) {
           if (!this.viewer.dataSources.contains(this.activeRoadsSource)) {
             this.viewer.dataSources.add(this.activeRoadsSource);
           }
           this.activeRoadsSource.show = true;
         }
      } else {
         // If frame moved far into future, keep hidden in cache until clock reaches it
         if (bSource) bSource.show = false;
         if (rSource) rSource.show = false;
      }
    } catch (error) {
      console.warn("[InfrastructureEffectEngine] Exposure loading error:", error);
    } finally {
      this.isFetching = false;
    }
  }
}
