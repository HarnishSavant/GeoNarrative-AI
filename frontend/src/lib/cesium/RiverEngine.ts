/**
 * RiverEngine.ts — Layer A: Permanent Hydrological River Water Engine.
 * 
 * ARCHITECTED FOR PHASE 5.6: TRUE RIVER-TO-FLOOD SPREAD ANIMATION:
 * - Serves as the stable, always-active VISUAL ORIGIN of the flood animation.
 * - Loads authentic GIS river/water polygon geometries directly from MyProject8.gdb ('water' layer) via /api/v1/flood/permanent-river.
 * - ZERO fake fixed-width corridors or glowing neon colors.
 * - Styled in solid dark navy blue (#064B7A at 85% opacity) matching the Hydraulic Legend.
 * - Completely visible before simulation START, throughout all temporal frames, and immediately on RESET without blinking or pulsing.
 */

import { ScenarioConfig } from './SimulationFramework';

export class RiverEngine {
  private viewer: any;
  private dataSource: any | null = null;
  private isLoading: boolean = false;

  constructor(viewer: any, center: [number, number]) {
    this.viewer = viewer;
    this.init();
  }

  private init() {
    const Cesium = (window as any).Cesium;
    if (!Cesium || !this.viewer) return;
    this.loadPermanentRiver();
  }

  /**
   * Ingests the authoritative GIS permanent river polygons (Layer A) and clamps them to the terrain.
   */
  private async loadPermanentRiver() {
    const Cesium = (window as any).Cesium;
    if (!Cesium || !this.viewer || this.isLoading) return;
    this.isLoading = true;

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const url = `${baseUrl}/api/v1/flood/permanent-river`;
      
      const dataSource = await Cesium.GeoJsonDataSource.load(url, {
        clampToGround: true,
        fill: true
      });

      const entities = dataSource.entities.values;
      const darkNavyColor = Cesium.Color.fromCssColorString('#064B7A').withAlpha(0.85);

      for (let i = 0; i < entities.length; i++) {
        const entity = entities[i];
        entity.billboard = undefined;
        entity.label = undefined;
        if (entity.polygon) {
          entity.polygon.material = new Cesium.ColorMaterialProperty(darkNavyColor);
          entity.polygon.outline = new Cesium.ConstantProperty(false);
          if (Cesium.ClassificationType) {
            entity.polygon.classificationType = new Cesium.ConstantProperty(Cesium.ClassificationType.BOTH);
          }
          entity.polygon.zIndex = new Cesium.ConstantProperty(1);
        }
      }

      this.viewer.dataSources.add(dataSource);
      this.dataSource = dataSource;
      console.log(`[RiverEngine] Layer A (Permanent River): Loaded ${entities.length} authoritative GIS water polygons.`);
    } catch (err) {
      console.warn('[RiverEngine] Failed to load permanent river GeoJSON:', err);
    } finally {
      this.isLoading = false;
    }
  }

  public reset() {
    // No-op: Permanent river stays solidly visible and intact at all times (before START, during playback, and on RESET)
  }

  public update(progress: number, scenario: ScenarioConfig) {
    // No-op: Layer A remains completely stable and active without blinking, pulsing, or opacity oscillations
  }
}
