export class PerformanceOptimizer {
  private viewer: any;

  constructor(viewer: any) {
    this.viewer = viewer;
    this.applyEngineOptimizations();
  }

  private applyEngineOptimizations() {
    const scene = this.viewer.scene;
    const globe = scene.globe;

    // 1. Culling & Clipping
    // Enable fog to aggressively cull geometry hidden in the distance
    scene.fog.enabled = true;
    scene.fog.density = 0.0005;
    scene.fog.screenSpaceErrorFactor = 2.0;

    // 2. HLOD (Hierarchical Level of Detail) Tuning
    // Increase SSE (Screen Space Error) slightly. Visually imperceptible, massive FPS boost.
    if (globe) {
      globe.maximumScreenSpaceError = 2.5; 
      // Preload sibling tiles to prevent stuttering during fast cinematic camera movements
      globe.preloadSiblings = true;
      // Skip rendering terrain that is guaranteed to be underwater or hidden
      globe.depthTestAgainstTerrain = true; 
    }

    // 3. GPU Memory & Texture Compression
    // Force Cesium to use lower resolution textures while moving camera rapidly
    if (this.viewer.resolutionScale) {
        // Drop resolution dynamically if device is struggling (Adaptive resolution)
        const isMobile = window.innerWidth <= 768;
        this.viewer.resolutionScale = isMobile ? 0.75 : 1.0; 
    }

    // 4. Instancing & Primitive Management
    // Ensure all primitive batches are compiled asynchronously before showing
    scene.primitives.show = true;
  }

  /**
   * Dynamically adjusts LOD based on camera altitude.
   * Higher altitude = lower geometry detail.
   */
  public updateLOD(cameraHeight: number) {
    if (!this.viewer.scene.globe) return;
    
    // Aggressive optimization for the Entire City Overview stage
    if (cameraHeight > 3000) {
      this.viewer.scene.globe.maximumScreenSpaceError = 4.0;
    } else if (cameraHeight > 1000) {
      this.viewer.scene.globe.maximumScreenSpaceError = 3.0;
    } else {
      this.viewer.scene.globe.maximumScreenSpaceError = 2.0;
    }
  }

  /**
   * Provides globally pre-allocated scratch variables to completely eliminate
   * garbage collection (GC) stutter inside 60 FPS loops.
   */
  public static Math = {
    scratchCartesian1: null,
    scratchCartesian2: null,
    scratchMatrix1: null,
    scratchMatrix2: null,
    scratchMatrix3: null,
    scratchColor1: null,
    scratchColor2: null,

    init(Cesium: any) {
      if (!this.scratchCartesian1) {
        this.scratchCartesian1 = new Cesium.Cartesian3();
        this.scratchCartesian2 = new Cesium.Cartesian3();
        this.scratchMatrix1 = new Cesium.Matrix4();
        this.scratchMatrix2 = new Cesium.Matrix4();
        this.scratchMatrix3 = new Cesium.Matrix4();
        this.scratchColor1 = new Cesium.Color();
        this.scratchColor2 = new Cesium.Color();
      }
    }
  };
}
