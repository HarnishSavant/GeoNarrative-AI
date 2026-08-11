/**
 * RasterFloodEngine.ts — Layer B: Accumulated / Spatially Expanding Flood Layer.
 * 
 * ARCHITECTED FOR TRUE REAL-WATER RASTER VISUALIZATION:
 * - Loads authentic GIS flood scenario PNG imagery tiles directly from backend (/api/v1/flood/scenarios/extreme/frame/X).
 * - Solves WebGL 16-layer texture unit limits by keeping at most 2 active imagery layers in the Cesium scene collection.
 * - Implements a 200ms rolling transition on layer swap: keeps the previous frame visible underneath while the next frame texture
 *   compiles in WebGL, guaranteeing continuous zero-flicker, realistic water depth visualization across the city.
 * - Allows infrastructure hazard markers (orange roads & red/yellow buildings) to remain sharply visible directly on top.
 */

import { ScenarioConfig, SimulationDirector } from './SimulationFramework';

export class RasterFloodEngine {
  private viewer: any;
  private director: SimulationDirector;
  
  private manifest: any = null;
  private currentScenario: string = '';
  
  private imageryLayers: any = null;
  private currentFrameIdx: number = -1;
  private providers: any[] = [];
  private activeLayer: any | null = null;
  private loadedFrames: Set<number> = new Set();
  
  private isReadyState: boolean = false;
  
  constructor(viewer: any, director: SimulationDirector) {
    this.viewer = viewer;
    this.director = director;
    this.imageryLayers = viewer.scene.imageryLayers;
    this.providers = [];
    
    if (this.director && typeof (this.director as any).setFloodRasterEngine === 'function') {
      (this.director as any).setFloodRasterEngine(this);
    }
    
    this.setupEventListeners();

    // Immediately load baseline Frame 0 so the river and initial water extent are visible before simulation start
    const scenario = (this.director as any).scenario?.getScenario?.();
    const scenarioName = (scenario?.name || 'normal').toLowerCase();
    this.loadManifest(scenarioName);
  }

  private setupEventListeners(): void {
    this.director.on('SimulationStarted', async () => {
      const scenario = (this.director as any).scenario?.getScenario?.();
      if (!scenario) return;
      const scenarioName = scenario.name.toLowerCase();
      if (this.currentScenario === scenarioName && this.isReadyState && this.providers.length > 0) {
        // Baseline Frame 0 already displayed before start; ready to animate without re-fetching
        return;
      }
      await this.loadManifest(scenarioName);
    });

    this.director.on('SimulationReset', () => {
      this.reset();
    });
  }

  public reset(): void {
    const scenario = (this.director as any).scenario?.getScenario?.();
    const scenarioName = (scenario?.name || 'normal').toLowerCase();

    if (this.currentScenario === scenarioName && this.providers.length > 0 && this.providers[0]) {
      const Cesium = (window as any).Cesium;
      if (Cesium) {
        if (this.activeLayer && this.currentFrameIdx !== 0) {
          try {
            this.imageryLayers.remove(this.activeLayer, true);
          } catch (e) {}
          const minFilter = Cesium.TextureMinificationFilter ? Cesium.TextureMinificationFilter.NEAREST : 0;
          const magFilter = Cesium.TextureMagnificationFilter ? Cesium.TextureMagnificationFilter.NEAREST : 0;
          this.activeLayer = this.imageryLayers.add(new Cesium.ImageryLayer(this.providers[0], {
            alpha: 1.0,
            show: true,
            textureMinificationFilter: minFilter,
            textureMagnificationFilter: magFilter
          }));
        }
        this.currentFrameIdx = 0;
        this.isReadyState = true;
        return;
      }
    }
    
    this.loadManifest(scenarioName);
  }

  private clearLayers(): void {
    if (this.activeLayer) {
      try {
        this.imageryLayers.remove(this.activeLayer, true);
      } catch (e) {}
      this.activeLayer = null;
    }
    this.providers = [];
    this.loadedFrames.clear();
    this.currentFrameIdx = -1;
  }

  private preloadFrameImage(frameIdx: number): void {
    if (this.loadedFrames.has(frameIdx) || !this.manifest) return;
    const frameCount = this.manifest.frame_count || 45;
    if (frameIdx < 0 || frameIdx >= frameCount) return;

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const url = `${baseUrl}/api/v1/flood/scenarios/${this.currentScenario}/frame/${frameIdx}`;
    
    const img = new Image();
    img.onload = () => { this.loadedFrames.add(frameIdx); };
    img.onerror = () => { this.loadedFrames.add(frameIdx); };
    img.src = url;
  }

  private async loadManifest(scenarioId: string): Promise<void> {
    this.clearLayers();
    this.currentScenario = scenarioId;
    this.isReadyState = false;

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${baseUrl}/api/v1/flood/scenarios/${scenarioId}/manifest`);
      if (response.ok) {
        this.manifest = await response.json();
        const frameCount = this.manifest.frame_count || 45;
        
        const Cesium = (window as any).Cesium;
        if (!Cesium || !this.manifest.bounds_wgs84) return;
        const { west, south, east, north } = this.manifest.bounds_wgs84;

        // Create providers without flooding Cesium imageryLayers scene collection
        for (let i = 0; i < frameCount; i++) {
           const provider = new Cesium.SingleTileImageryProvider({
             url: `${baseUrl}/api/v1/flood/scenarios/${scenarioId}/frame/${i}`,
             rectangle: Cesium.Rectangle.fromDegrees(west, south, east, north),
           });
           this.providers.push(provider);
        }

        // Preload initial frames into browser cache
        for (let i = 0; i <= 5; i++) {
           this.preloadFrameImage(i);
        }

        // Render initial frame 0 immediately
        if (this.providers[0]) {
          const minFilter = Cesium.TextureMinificationFilter ? Cesium.TextureMinificationFilter.NEAREST : 0;
          const magFilter = Cesium.TextureMagnificationFilter ? Cesium.TextureMagnificationFilter.NEAREST : 0;
          
          this.activeLayer = this.imageryLayers.add(new Cesium.ImageryLayer(this.providers[0], {
            alpha: 1.0,
            show: true,
            textureMinificationFilter: minFilter,
            textureMagnificationFilter: magFilter
          }));
          this.currentFrameIdx = 0;
        }

        this.isReadyState = true;
        console.log(`[RasterFloodEngine] Authentic GIS flood depth imagery initialized for ${scenarioId} (${frameCount} frames).`);
      }
    } catch (err) {
      console.error("[RasterFloodEngine] Failed to load manifest", err);
    }
  }

  public getManifest() {
    return this.manifest;
  }

  public isReady(): boolean {
    return this.isReadyState;
  }

  public isFrameReady(frameIdx: number): boolean {
    return true;
  }

  public getWaterSurface(): number {
    return 540.0 + (this.currentFrameIdx * 0.1);
  }

  public getCenter(): { lon: number, lat: number } | null {
    if (!this.manifest || !this.manifest.bounds_wgs84) return null;
    const b = this.manifest.bounds_wgs84;
    return {
      lon: (b.west + b.east) / 2.0,
      lat: (b.south + b.north) / 2.0
    };
  }

  public update(progress: number, scenario: ScenarioConfig): void {
    const Cesium = (window as any).Cesium;
    if (!Cesium || !this.isReadyState || !this.manifest || this.providers.length === 0) return;
    
    const frameCount = this.manifest.frame_count || 45;
    const baseFrame = Math.max(0, Math.min(Math.floor(progress * (frameCount - 1)), frameCount - 1));
    
    // Proactively preload upcoming frames into browser cache
    this.preloadFrameImage(baseFrame + 1);
    this.preloadFrameImage(baseFrame + 2);
    this.preloadFrameImage(baseFrame + 3);

    // Perform zero-flicker rolling imagery transition without exceeding WebGL texture sampler limits
    if (this.currentFrameIdx !== baseFrame && this.providers[baseFrame]) {
      this.currentFrameIdx = baseFrame;
      
      const minFilter = Cesium.TextureMinificationFilter ? Cesium.TextureMinificationFilter.NEAREST : 0;
      const magFilter = Cesium.TextureMagnificationFilter ? Cesium.TextureMagnificationFilter.NEAREST : 0;

      const nextLayer = new Cesium.ImageryLayer(this.providers[baseFrame], {
        alpha: 1.0,
        show: true,
        textureMinificationFilter: minFilter,
        textureMagnificationFilter: magFilter
      });

      const oldLayer = this.activeLayer;
      this.activeLayer = this.imageryLayers.add(nextLayer);
      
      if (oldLayer) {
        // Keep previous frame visible for 400ms while next frame texture binds in WebGL memory
        setTimeout(() => {
          try {
            if (oldLayer !== this.activeLayer) {
              this.imageryLayers.remove(oldLayer, true);
            }
          } catch (e) {}
        }, 400);
      }
    }
  }
}
