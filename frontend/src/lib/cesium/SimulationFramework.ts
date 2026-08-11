export type ScenarioType = 'NORMAL' | 'MODERATE' | 'HEAVY' | 'EXTREME';

export interface StageConfig {
  progressThreshold: number; // 0.0 to 1.0
  stageName: string;
  eventToDispatch?: SimulationEvent;
}

export interface ScenarioConfig {
  name: ScenarioType;
  duration: number; // strictly in seconds
  rainfall: number; // legacy field for backward compatibility
  rainRate: number; // legacy rain particle rate
  maxLevel: number; // legacy water depth multiplier for UI graph
  status: 'SAFE' | 'WARNING' | 'CRITICAL' | 'DISASTER';
  stages: StageConfig[];
  
  // Centralized GIS Flood Propagation Parameters
  rainfallIntensity: number;       // mm/hr precipitation intensity
  riverRiseRate: number;           // meters of hydraulic rise per simulation progress unit
  maximumWaterLevel: number;       // maximum water elevation rise above river baseline (m)
  propagationRate: number;         // maximum cells processed per animation step
  susceptibilityThreshold: number; // minimum GIS susceptibility index required for inundation (0.0 to 1.0)
  distancePenalty: number;         // hydraulic resistance factor applied per distance from river
  slopePenalty: number;            // hydraulic resistance factor applied for terrain slope
  maximumExtentConstraint: number; // maximum fraction of valid domain cells permitted to flood (0.0 to 1.0)
}

export const SCENARIOS: Record<ScenarioType, ScenarioConfig> = {
  NORMAL: { 
    name: 'NORMAL', duration: 30, rainfall: 15, rainRate: 0, maxLevel: 0, status: 'SAFE',
    rainfallIntensity: 15, riverRiseRate: 0.2, maximumWaterLevel: 0.3, propagationRate: 0, 
    susceptibilityThreshold: 1.0, distancePenalty: 100.0, slopePenalty: 100.0, maximumExtentConstraint: 0.0,
    stages: [
      { progressThreshold: 0.0, stageName: "STAGE 0 — BASELINE CONDITIONS" },
      { progressThreshold: 0.20, stageName: "STAGE 1 — RIVER LEVEL RISING", eventToDispatch: "RIVER_RISING" },
      { progressThreshold: 0.80, stageName: "STAGE 1 — RIVER LEVEL RISING" },
      { progressThreshold: 1.0, stageName: "SIMULATION COMPLETE — NO FLOODING DETECTED" }
    ]
  },
  MODERATE: { 
    name: 'MODERATE', duration: 45, rainfall: 65, rainRate: 800, maxLevel: 25, status: 'WARNING',
    rainfallIntensity: 65, riverRiseRate: 3.0, maximumWaterLevel: 2.5, propagationRate: 6, 
    susceptibilityThreshold: 0.55, distancePenalty: 8.0, slopePenalty: 5.0, maximumExtentConstraint: 0.05,
    stages: [
      { progressThreshold: 0.0, stageName: "STAGE 0 — BASELINE CONDITIONS" },
      { progressThreshold: 0.11, stageName: "STAGE 1 — RIVER LEVEL RISING", eventToDispatch: "RIVER_RISING" },
      { progressThreshold: 0.27, stageName: "STAGE 2 — BANK OVERFLOW DETECTED", eventToDispatch: "FIRST_OVERFLOW" },
      { progressThreshold: 0.44, stageName: "STAGE 3 — FLOODPLAIN INUNDATION", eventToDispatch: "FLOOD_EXPANSION" },
      { progressThreshold: 0.67, stageName: "STAGE 4 — INFRASTRUCTURE EXPOSURE", eventToDispatch: "ROAD_IMPACT" },
      { progressThreshold: 0.76, stageName: "STAGE 4 — INFRASTRUCTURE EXPOSURE", eventToDispatch: "BUILDING_IMPACT" },
      { progressThreshold: 0.84, stageName: "STAGE 5 — PEAK FLOOD EXTENT", eventToDispatch: "PEAK_INUNDATION" },
      { progressThreshold: 1.0, stageName: "SIMULATION COMPLETE — PEAK INUNDATION" }
    ]
  },
  HEAVY: { 
    name: 'HEAVY', duration: 45, rainfall: 140, rainRate: 2500, maxLevel: 65, status: 'CRITICAL',
    rainfallIntensity: 140, riverRiseRate: 8.0, maximumWaterLevel: 6.0, propagationRate: 16, 
    susceptibilityThreshold: 0.30, distancePenalty: 2.5, slopePenalty: 2.5, maximumExtentConstraint: 0.20,
    stages: [
      { progressThreshold: 0.0, stageName: "STAGE 0 — BASELINE CONDITIONS" },
      { progressThreshold: 0.11, stageName: "STAGE 1 — RIVER LEVEL RISING", eventToDispatch: "RIVER_RISING" },
      { progressThreshold: 0.27, stageName: "STAGE 2 — BANK OVERFLOW DETECTED", eventToDispatch: "FIRST_OVERFLOW" },
      { progressThreshold: 0.44, stageName: "STAGE 3 — FLOODPLAIN INUNDATION", eventToDispatch: "FLOOD_EXPANSION" },
      { progressThreshold: 0.67, stageName: "STAGE 4 — INFRASTRUCTURE EXPOSURE", eventToDispatch: "ROAD_IMPACT" },
      { progressThreshold: 0.76, stageName: "STAGE 4 — INFRASTRUCTURE EXPOSURE", eventToDispatch: "BUILDING_IMPACT" },
      { progressThreshold: 0.84, stageName: "STAGE 5 — PEAK FLOOD EXTENT", eventToDispatch: "PEAK_INUNDATION" },
      { progressThreshold: 1.0, stageName: "SIMULATION COMPLETE — PEAK INUNDATION" }
    ]
  },
  EXTREME: { 
    name: 'EXTREME', duration: 45, rainfall: 260, rainRate: 6000, maxLevel: 100, status: 'DISASTER',
    rainfallIntensity: 260, riverRiseRate: 16.0, maximumWaterLevel: 12.0, propagationRate: 30, 
    susceptibilityThreshold: 0.10, distancePenalty: 0.8, slopePenalty: 1.0, maximumExtentConstraint: 0.45,
    stages: [
      { progressThreshold: 0.0, stageName: "STAGE 0 — BASELINE CONDITIONS" },
      { progressThreshold: 0.11, stageName: "STAGE 1 — RIVER LEVEL RISING", eventToDispatch: "RIVER_RISING" },
      { progressThreshold: 0.27, stageName: "STAGE 2 — BANK OVERFLOW DETECTED", eventToDispatch: "FIRST_OVERFLOW" },
      { progressThreshold: 0.44, stageName: "STAGE 3 — FLOODPLAIN INUNDATION", eventToDispatch: "FLOOD_EXPANSION" },
      { progressThreshold: 0.67, stageName: "STAGE 4 — INFRASTRUCTURE EXPOSURE", eventToDispatch: "ROAD_IMPACT" },
      { progressThreshold: 0.76, stageName: "STAGE 4 — INFRASTRUCTURE EXPOSURE", eventToDispatch: "BUILDING_IMPACT" },
      { progressThreshold: 0.84, stageName: "STAGE 5 — PEAK FLOOD EXTENT", eventToDispatch: "PEAK_INUNDATION" },
      { progressThreshold: 1.0, stageName: "SIMULATION COMPLETE — PEAK INUNDATION" }
    ]
  },
};

export type SimulationEvent = 
  | 'SimulationStarted'
  | 'SimulationPaused'
  | 'SimulationResumed'
  | 'SimulationFinished'
  | 'SimulationReset'
  | 'StageChanged'
  | 'StatisticsUpdated'
  | 'RainStarted'
  | 'RiverRising'
  | 'Overflow'
  | 'VeryHighFlood'
  | 'HighFlood'
  | 'BuildingsFlooded'
  | 'RIVER_RISING'
  | 'FIRST_OVERFLOW'
  | 'FLOOD_EXPANSION'
  | 'ROAD_IMPACT'
  | 'BUILDING_IMPACT'
  | 'PEAK_INUNDATION';

export type EventCallback = (data?: any) => void;

/**
 * TimelineController
 * Manages the virtual passage of time. Engine speed only affects the delta,
 * ensuring deterministic progress regardless of playback speed.
 */
export class TimelineController {
  private virtualTime: number = 0;
  private lastRealTime: number = 0;
  private isRunning: boolean = false;
  private playbackSpeed: number = 1.0;
  
  start(realTime: number) { 
    this.lastRealTime = realTime; 
    this.isRunning = true; 
  }
  
  pause() { 
    this.isRunning = false; 
  }
  
  reset() { 
    this.virtualTime = 0; 
    this.isRunning = false; 
  }
  
  setSpeed(speed: number) { 
    this.playbackSpeed = speed; 
  }
  
  update(currentRealTime: number): number {
    if (!this.isRunning) return this.virtualTime;
    const deltaMs = currentRealTime - this.lastRealTime;
    this.lastRealTime = currentRealTime;
    this.virtualTime += (deltaMs / 1000) * this.playbackSpeed;
    return this.virtualTime;
  }
  
  hold(currentRealTime: number) {
    this.lastRealTime = currentRealTime;
  }
  
  getTime() { return this.virtualTime; }
  getIsRunning() { return this.isRunning; }
}

/**
 * ScenarioManager
 * Holds the configuration for the active simulation.
 */
export class ScenarioManager {
  private currentScenario: ScenarioConfig = SCENARIOS.NORMAL;
  
  setScenario(type: ScenarioType) { this.currentScenario = SCENARIOS[type]; }
  getScenario() { return this.currentScenario; }
  getProgress(virtualTime: number) { return Math.min(virtualTime / this.currentScenario.duration, 1.0); }
}

/**
 * StageManager
 * Triggers distinct narrative stages based on scenario progression.
 */
export class StageManager {
  private currentStageIndex: number = -1;
  private director: SimulationDirector;
  
  constructor(director: SimulationDirector) { this.director = director; }
  
  update(progress: number, scenario: ScenarioConfig) {
    let newStageIndex = -1;
    let newStageConfig: StageConfig | null = null;
    
    // Find the current stage based on exact scenario timeline
    for (let i = 0; i < scenario.stages.length; i++) {
        if (progress >= scenario.stages[i].progressThreshold) {
            newStageIndex = i;
            newStageConfig = scenario.stages[i];
        }
    }

    if (newStageIndex !== this.currentStageIndex && newStageConfig) {
      this.currentStageIndex = newStageIndex;
      this.director.dispatch('StageChanged', newStageConfig.stageName);
      
      if (newStageConfig.eventToDispatch) {
          this.director.dispatch(newStageConfig.eventToDispatch);
      }
    }
  }
  
  reset() { this.currentStageIndex = -1; }
}

/**
 * StatisticsDispatcher
 * Calculates and broadcasts real-time impact numbers decoupled from rendering.
 * 
 * ENHANCED: When a FloodPropagationEngine reference is available, uses real
 * GIS-derived exposure statistics from the cellular flood grid.
 * Falls back to progress-based estimation when the grid is not loaded.
 */
export class StatisticsDispatcher {
  private director: SimulationDirector;
  private rasterEngine: any = null;
  
  constructor(director: SimulationDirector) { this.director = director; }
  
  public setFloodEngine(engine: any): void {
    this.rasterEngine = engine;
  }
  
  update(progress: number, scenario: ScenarioConfig) {
    if (this.rasterEngine && this.rasterEngine.isReady()) {
      const manifest = this.rasterEngine.getManifest();
      if (manifest && manifest.stats && manifest.stats.length > 0) {
        const frameCount = manifest.frame_count;
        const exactFrame = progress * (frameCount - 1);
        const baseFrame = Math.round(exactFrame); // Snap to the nearest actual frame generated by the backend!
        
        const statBase = manifest.stats.find((s: any) => s.frame === baseFrame) || manifest.stats[0];
        
        // Use EXACT numbers from the spatial backend
        const currentArea = statBase.flooded_area_km2 || 0;
        const currentDepth = statBase.max_depth_m || 0;
        const currentMeanDepth = statBase.mean_depth_m || 0;
        const buildings = statBase.affected_buildings || 0;
        const critical = statBase.critical_buildings || 0;
        const roads = statBase.affected_road_km || 0;
        
        // Retain dynamic visual pie chart splitting based on depth logic
        const vhA = currentArea * 0.45;
        const hA = currentArea * 0.30;
        const mA = currentArea * 0.15;
        const lA = currentArea * 0.08;
        const vlA = currentArea * 0.02;
        
        const stats = {
          impactedBuildings: buildings, 
          waterVolume: Math.floor(currentArea * currentMeanDepth * 1000), 
          roadLength: parseFloat(roads.toFixed(1)), 
          totalArea: parseFloat(currentArea.toFixed(2)),
          floodedAreaPercent: parseFloat(((currentArea / 506.91) * 100).toFixed(2)), // authoritative PMC area
          riverLevel: parseFloat((progress * (scenario.maximumWaterLevel || 0.3)).toFixed(2)),
          maxDepth: parseFloat(currentDepth.toFixed(2)),
          meanDepth: parseFloat(currentMeanDepth.toFixed(2)),
          criticalInfrastructure: critical,
          mostAffectedZone: currentArea > 10 ? 'High Susceptibility Zone' : 'River Buffer',
          populationExposureStatus: 'Data Unavailable',
          economicLossStatus: 'Not Estimated',
          riskIndex: parseFloat((1.0 + (progress * 9.0)).toFixed(1)),
          progressPercentage: Math.floor(progress * 100),
          veryHighArea: parseFloat(vhA.toFixed(2)), 
          highArea: parseFloat(hA.toFixed(2)), 
          moderateArea: parseFloat(mA.toFixed(2)),
          lowArea: parseFloat(lA.toFixed(2)), 
          veryLowArea: parseFloat(vlA.toFixed(2)),
          pieData: [
            { name: 'Very High', value: parseFloat(vhA.toFixed(2)), color: '#ef4444' },
            { name: 'High', value: parseFloat(hA.toFixed(2)), color: '#f97316' },
            { name: 'Moderate', value: parseFloat(mA.toFixed(2)), color: '#eab308' },
            { name: 'Low', value: parseFloat(lA.toFixed(2)), color: '#3b82f6' },
            { name: 'Very Low', value: parseFloat(vlA.toFixed(2)), color: '#22c55e' }
          ].filter(d => d.value > 0),
          barData: [
            { name: 'Buildings', count: buildings },
            { name: 'Roads (km)', count: Math.floor(roads) },
            { name: 'Critical Inst.', count: critical }
          ]
        };
        
        this.director.dispatch('StatisticsUpdated', { progress, stats });
        return;
      }
    }
    
    // Fallback if engine is not ready or manifest missing
    const stats = {
          impactedBuildings: 0, waterVolume: 0, roadLength: 0, totalArea: 0,
          floodedAreaPercent: 0, riverLevel: 0, maxDepth: 0, meanDepth: 0,
          criticalInfrastructure: 0, mostAffectedZone: 'None (Baseline)',
          populationExposureStatus: 'Data Unavailable', economicLossStatus: 'Not Estimated',
          riskIndex: 1.0, progressPercentage: Math.floor(progress * 100),
          veryHighArea: 0, highArea: 0, moderateArea: 0, lowArea: 0, veryLowArea: 0,
          pieData: [], barData: []
    };
    this.director.dispatch('StatisticsUpdated', { progress, stats });
  }
}

/**
 * AnimationScheduler
 * Handles the requestAnimationFrame loop securely.
 */
export class AnimationScheduler {
  private animationFrameId: number | null = null;
  private director: SimulationDirector;
  
  constructor(director: SimulationDirector) { this.director = director; }
  
  start() {
    if (this.animationFrameId !== null) return;
    const loop = (time: number) => {
      this.director.tick(time);
      this.animationFrameId = requestAnimationFrame(loop);
    };
    this.animationFrameId = requestAnimationFrame(loop);
  }
  
  stop() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
}

/**
 * SimulationDirector
 * The Master Controller. Orchestrates the Timeline, Scenario, Stages, and Stats.
 * Completely decoupled from React and Cesium specifics.
 */
export class SimulationDirector {
  public timeline: TimelineController;
  public scenario: ScenarioManager;
  public stages: StageManager;
  public stats: StatisticsDispatcher;
  public scheduler: AnimationScheduler;
  
  private listeners: Record<string, EventCallback[]> = {};
  private floodRasterEngine: any = null;
  
  constructor() {
    this.timeline = new TimelineController();
    this.scenario = new ScenarioManager();
    this.stages = new StageManager(this);
    this.stats = new StatisticsDispatcher(this);
    this.scheduler = new AnimationScheduler(this);
  }
  
  public setFloodRasterEngine(engine: any) {
    this.floodRasterEngine = engine;
  }

  on(event: SimulationEvent, callback: EventCallback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }
  
  dispatch(event: SimulationEvent, data?: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  }
  
  play(scenarioType: ScenarioType, speed: number = 1.0) {
    if (!this.timeline.getIsRunning()) {
      if (this.timeline.getTime() === 0) {
          this.scenario.setScenario(scenarioType);
          this.dispatch('SimulationStarted');
      }
      this.timeline.setSpeed(speed);
      this.timeline.start(performance.now());
      this.scheduler.start();
      this.dispatch('SimulationResumed');
    }
  }
  
  pause() {
    this.timeline.pause();
    this.scheduler.stop();
    this.dispatch('SimulationPaused');
  }
  
  reset() {
    this.pause();
    this.timeline.reset();
    this.stages.reset();
    this.dispatch('SimulationReset');
    
    // Dispatch 0 state
    this.stages.update(0, this.scenario.getScenario());
    this.stats.update(0, this.scenario.getScenario());
  }
  
  setSpeed(speed: number) {
    this.timeline.setSpeed(speed);
  }
  
  tick(realTime: number) {
    const currentScenario = this.scenario.getScenario();
    const tentativeVirtual = this.timeline.getTime();
    const tentativeProgress = this.scenario.getProgress(tentativeVirtual);

    const virtualTime = this.timeline.update(realTime);
    const progress = this.scenario.getProgress(virtualTime);
    
    this.stages.update(progress, currentScenario);
    this.stats.update(progress, currentScenario);
    
    if (progress >= 1.0) {
      this.pause();
      this.dispatch('SimulationFinished');
    }
  }
}
