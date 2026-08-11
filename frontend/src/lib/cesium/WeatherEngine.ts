import { ScenarioConfig, SimulationDirector } from './SimulationFramework';
import { PerformanceOptimizer } from './PerformanceOptimizer';

export class WeatherEngine {
  private viewer: any;
  private rainSystem: any = null;
  private baseFogDensity = 0.0001;

  constructor(viewer: any, director: SimulationDirector) {
    this.viewer = viewer;
    this.initRainSystem();
    director.on('SimulationReset', () => this.reset());
  }

  private initRainSystem() {
    const Cesium = (window as any).Cesium;
    this.rainSystem = this.viewer.scene.primitives.add(new Cesium.ParticleSystem({
        image: 'https://cesium.com/downloads/cesiumjs/releases/1.115/Build/Cesium/Assets/Textures/waterNormals.jpg',
        startColor: new Cesium.Color(0.8, 0.9, 1.0, 0.4),
        endColor: new Cesium.Color(0.8, 0.9, 1.0, 0.0),
        startScale: 0.2, endScale: 0.4,
        minimumParticleLife: 0.8, maximumParticleLife: 1.2,
        minimumSpeed: 20.0, maximumSpeed: 40.0,
        imageSize: new Cesium.Cartesian2(4, 25),
        emissionRate: 0, 
        lifetime: 16.0,
        emitter: new Cesium.SphereEmitter(3000.0),
        updateCallback: (p: any, dt: number) => { p.velocity.z -= 15.0 * dt; }
    }));
  }

  public reset() {
    if (this.rainSystem) this.rainSystem.emissionRate = 0;
    this.viewer.scene.fog.density = this.baseFogDensity;
  }

  public update(progress: number, scenario: ScenarioConfig) {
    const Cesium = (window as any).Cesium;
    if (!this.rainSystem) return;

    // Center rain around the camera position using scratch matrix to prevent GC stutter
    this.rainSystem.modelMatrix = Cesium.Matrix4.fromTranslation(
      this.viewer.camera.position, PerformanceOptimizer.Math.scratchMatrix1
    );

    // Ramps up over the first 20%
    const rainRamp = Math.min(progress / 0.2, 1.0);
    let targetRainRate = 0;
    let targetFog = this.baseFogDensity;

    if (scenario.name === 'MODERATE') { targetRainRate = 800; targetFog = 0.0003; }
    else if (scenario.name === 'HEAVY') { targetRainRate = 2500; targetFog = 0.0008; }
    else if (scenario.name === 'EXTREME') { targetRainRate = 6000; targetFog = 0.0015; }

    this.rainSystem.emissionRate = targetRainRate * rainRamp;
    this.viewer.scene.fog.density = this.baseFogDensity + ((targetFog - this.baseFogDensity) * rainRamp);
  }
}
