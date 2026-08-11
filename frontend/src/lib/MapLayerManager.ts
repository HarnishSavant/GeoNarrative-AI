import mapboxgl from 'mapbox-gl';
import { UnifiedPopupManager } from './UnifiedPopupManager';
import { useInteractionStore, FeatureIdentifier } from '@/store/interactionStore';
import { DashboardMode } from '@/lib/types';

// ============================================================================
// MODE-SPECIFIC COLOR PALETTES
// ============================================================================
const MODE_COLORS: Record<DashboardMode, {
  buildings: string; buildingExtrusion: string; buildingHover: string;
  roads: string; roadGlow: string;
  waterways: string; waterwayGlow: string;
  floodFill: string; floodBorder: string;
  pois: string; poisGlow: string;
  accent: string;
  boundaryFill: string; boundaryLine: string; boundaryGlow: string;
  maskColor: string;
}> = {
  terrain: {
    buildings: '#a78bfa', buildingExtrusion: '#7c3aed', buildingHover: '#c4b5fd',
    roads: '#8b5cf6', roadGlow: '#7c3aed',
    waterways: '#38bdf8', waterwayGlow: '#0ea5e9',
    floodFill: '#8b5cf6', floodBorder: '#6d28d9',
    pois: '#a78bfa', poisGlow: '#8b5cf6',
    accent: '#8b5cf6',
    boundaryFill: '#8b5cf6', boundaryLine: '#a78bfa', boundaryGlow: '#7c3aed',
    maskColor: '#0a0e1a',
  },
  hydrology: {
    buildings: '#60a5fa', buildingExtrusion: '#2563eb', buildingHover: '#93c5fd',
    roads: '#64748b', roadGlow: '#475569',
    waterways: '#38bdf8', waterwayGlow: '#0ea5e9',
    floodFill: '#3b82f6', floodBorder: '#1d4ed8',
    pois: '#ef4444', poisGlow: '#dc2626',
    accent: '#3b82f6',
    boundaryFill: '#3b82f6', boundaryLine: '#60a5fa', boundaryGlow: '#2563eb',
    maskColor: '#070b16',
  },
  infrastructure: {
    buildings: '#34d399', buildingExtrusion: '#059669', buildingHover: '#6ee7b7',
    roads: '#fbbf24', roadGlow: '#f59e0b',
    waterways: '#67e8f9', waterwayGlow: '#22d3ee',
    floodFill: '#10b981', floodBorder: '#047857',
    pois: '#f59e0b', poisGlow: '#d97706',
    accent: '#10b981',
    boundaryFill: '#10b981', boundaryLine: '#34d399', boundaryGlow: '#059669',
    maskColor: '#060d12',
  },
  population: {
    buildings: '#fbbf24', buildingExtrusion: '#d97706', buildingHover: '#fde68a',
    roads: '#94a3b8', roadGlow: '#64748b',
    waterways: '#38bdf8', waterwayGlow: '#0ea5e9',
    floodFill: '#f59e0b', floodBorder: '#b45309',
    pois: '#ef4444', poisGlow: '#dc2626',
    accent: '#f59e0b',
    boundaryFill: '#f59e0b', boundaryLine: '#fbbf24', boundaryGlow: '#d97706',
    maskColor: '#0c0a06',
  },
  environment: {
    buildings: '#4ade80', buildingExtrusion: '#16a34a', buildingHover: '#86efac',
    roads: '#6b7280', roadGlow: '#4b5563',
    waterways: '#2dd4bf', waterwayGlow: '#14b8a6',
    floodFill: '#22c55e', floodBorder: '#15803d',
    pois: '#f59e0b', poisGlow: '#d97706',
    accent: '#22c55e',
    boundaryFill: '#22c55e', boundaryLine: '#4ade80', boundaryGlow: '#16a34a',
    maskColor: '#060e0a',
  },
};

export class MapLayerManager {
  private map: mapboxgl.Map;
  private popupManager: UnifiedPopupManager;
  private registeredSources: Set<string> = new Set();
  private registeredLayers: Set<string> = new Set();
  private lastHoveredFeature: string | null = null;
  private throttleTimeout: ReturnType<typeof setTimeout> | null = null;
  private currentMode: DashboardMode = 'hydrology';
  private animationFrameId: number | null = null;
  private floodVisMode: 'map' | 'columns' | 'both' = 'both';
  private loadingRasters: Set<string> = new Set();
  
  // Local cache for feature state management
  private _prevHovered: FeatureIdentifier | null = null;
  private _prevSelected: FeatureIdentifier[] = [];
  private _unsubscribeZustand: () => void;
  private _interactionsSetup = false;

  constructor(map: mapboxgl.Map) {
    this.map = map;
    this.popupManager = new UnifiedPopupManager(map);
    
    // Subscribe to Interaction Store to decouple MapView re-renders
    this._unsubscribeZustand = useInteractionStore.subscribe((state, prevState) => {
      if (state.hoveredFeature !== prevState.hoveredFeature || state.selectedFeatures !== prevState.selectedFeatures) {
        this.syncFeatureState(state.selectedFeatures, state.hoveredFeature);
      }
      if (state.filters !== prevState.filters) {
        this.applyFilters(state.filters);
      }
    });
  }

  // ========================================================================
  // SOURCE & LAYER MANAGEMENT
  // ========================================================================

  public updateSource(id: string, data: any) {
    if (!data || Object.keys(data).length === 0) {
      data = { type: "FeatureCollection", features: [] };
    }
    try {
      if (this.map) {
        const source = this.map.getSource(id) as mapboxgl.GeoJSONSource;
        if (source) {
          source.setData(data);
        } else {
          this.map.addSource(id, { type: "geojson", data, generateId: true });
          this.registeredSources.add(id);
        }
      }
    } catch (e) {
      console.warn(`MapLayerManager: Error updating source ${id}`, e);
    }
  }

  private addLayer(layerConfig: mapboxgl.AnyLayer, beforeId?: string) {
    try {
      if (!this.map) return;
      // Always remove existing layer first to allow color/paint updates
      if (this.map.getLayer(layerConfig.id)) {
        this.map.removeLayer(layerConfig.id);
        this.registeredLayers.delete(layerConfig.id);
      }
      this.map.addLayer(layerConfig, beforeId);
      this.registeredLayers.add(layerConfig.id);
    } catch (e: any) {
      console.warn(`MapLayerManager: Error adding layer ${layerConfig.id}`, e?.message);
    }
  }

  public addLayerIfNotExists(layerConfig: mapboxgl.AnyLayer, beforeId?: string) {
    try {
      if (this.map && !this.map.getLayer(layerConfig.id)) {
        this.map.addLayer(layerConfig, beforeId);
        this.registeredLayers.add(layerConfig.id);
      }
    } catch (e: any) {
      console.error(`MapLayerManager: Error adding layer ${layerConfig.id}`, e);
    }
  }

  private safeRemoveLayer(layerId: string) {
    try {
      if (this.map && this.map.getLayer(layerId)) {
        this.map.removeLayer(layerId);
        this.registeredLayers.delete(layerId);
      }
    } catch {}
  }

  public setGlobalOpacity(opacity: number) {
    if (!this.map) return;
    this.registeredLayers.forEach(layerId => {
      try {
        const layer = this.map.getLayer(layerId);
        if (!layer) return;
        // Don't touch mask opacities
        if (layerId === 'city-mask-fill') return;
        const t = layer.type;
        if (['fill', 'line', 'circle', 'heatmap', 'fill-extrusion'].includes(t)) {
          this.map.setPaintProperty(layerId, `${t}-opacity`, opacity);
        }
      } catch {}
    });
  }

  public setLayerVisibility(layerId: string, visible: boolean) {
    try {
      if (this.map && this.map.getLayer(layerId)) {
        let isVisible = visible;
        if (layerId === 'floodRisk-fill' && this.floodVisMode === 'columns') isVisible = false;
        if (layerId === 'floodRisk-columns' && this.floodVisMode === 'map') isVisible = false;
        this.map.setLayoutProperty(layerId, 'visibility', isVisible ? 'visible' : 'none');
      }
    } catch {}
  }
  
  public setFloodVisMode(mode: 'map' | 'columns' | 'both') {
    // 3D Flood Columns removed for 2D GIS version.
  }

  // ========================================================================
  // UI LAYER ID → MAPBOX LAYER ID BRIDGE
  // Maps the panel toggle IDs to actual Mapbox GL layer IDs
  // ========================================================================
  public setUILayerVisibility(uiLayerId: string, visible: boolean) {
    const mapping: Record<string, string[]> = {
      // Base layers
      'city-boundary':   ['city-boundary-line'],
      'study-area':      ['city-boundary-line', 'city-mask-fill'],
      'dem':             ['dem-raster'], 
      'hill':            ['hill-raster'], 
      'flood':           ['flood-raster'],
      'dist_to_river':   ['dist_to_river-raster'],
      'lulc':            ['lulc-raster'],
      'builddens':       ['builddens-raster'],
      'rivers':          ['waterways-line', 'waterways-label'],
      'roads':           ['roads-case', 'roads-line', 'roads-label'],
    };

    // Load real rasters dynamically on toggle
    const rasterKeys = ['dem', 'hill', 'flood', 'dist_to_river', 'lulc', 'builddens'];
    if (rasterKeys.includes(uiLayerId) && visible) {
      this.ensureRasterLayerLoaded(uiLayerId);
    }

    const mapboxIds = mapping[uiLayerId] || [];
    mapboxIds.forEach(id => this.setLayerVisibility(id, visible));
  }

  private async ensureRasterLayerLoaded(uiLayerId: string) {
    if (!this.map || !this.map.style || typeof this.map.getLayer !== 'function') return;
    try { if (!this.map.isStyleLoaded()) return; } catch { return; }
    const mapboxId = uiLayerId + '-raster';
    if (this.map.getLayer(mapboxId) || this.loadingRasters.has(mapboxId)) return;
    this.loadingRasters.add(mapboxId);
    try {
        const res = await fetch(`http://localhost:8000/api/v1/geodata/raster/${uiLayerId}/metadata`);
        if (res.ok) {
            const meta = await res.json();
            const bounds = meta.bounds; // [minx, miny, maxx, maxy]
            const sourceId = mapboxId + '-src';
            
            if (!this.map || !(this.map as any).style) return;
            try { if (!this.map.isStyleLoaded()) return; } catch { return; }

            if (!this.map.getSource(sourceId)) {
              this.map.addSource(sourceId, {
                  type: 'image',
                  url: `http://localhost:8000/api/v1/geodata/raster/${uiLayerId}/image?t=${Date.now()}`,
                  coordinates: [
                      [bounds[0], bounds[3]], // top-left
                      [bounds[2], bounds[3]], // top-right
                      [bounds[2], bounds[1]], // bottom-right
                      [bounds[0], bounds[1]]  // bottom-left
                  ]
              });
              this.registeredSources.add(sourceId);
            }
            
            if (uiLayerId === 'dem' || uiLayerId === 'lulc') {
                // Update the Study Area Boundary to precisely match the Raster polygon (or fallback to bounds)
                let featureGeometry = meta.polygon;
                if (!featureGeometry) {
                    featureGeometry = {
                        type: "Polygon",
                        coordinates: [[
                            [bounds[0], bounds[1]],
                            [bounds[2], bounds[1]],
                            [bounds[2], bounds[3]],
                            [bounds[0], bounds[3]],
                            [bounds[0], bounds[1]]
                        ]]
                    };
                }
                const boundaryGeoJson = {
                    type: "FeatureCollection",
                    features: [{
                        type: "Feature",
                        geometry: featureGeometry,
                        properties: {}
                    }]
                };
                this.updateSource('city-boundary', boundaryGeoJson);
                
                // Automatically generate a perfect world-mask with a hole matching the exact raster shape!
                try {
                    const turf = await import('@turf/turf');
                    // Create a giant world polygon
                    const worldPoly = turf.polygon([[[ -180, 90 ], [ 180, 90 ], [ 180, -90 ], [ -180, -90 ], [ -180, 90 ]]]);
                    
                    let holeFeat;
                    if (featureGeometry.type === 'Polygon') {
                        holeFeat = turf.polygon(featureGeometry.coordinates);
                    } else if (featureGeometry.type === 'MultiPolygon') {
                        holeFeat = turf.multiPolygon(featureGeometry.coordinates);
                    }
                    
                    if (holeFeat) {
                        const maskPoly = turf.difference(turf.featureCollection([worldPoly, holeFeat]));
                        if (maskPoly) {
                            this.updateSource('city-mask', maskPoly);
                        }
                    }
                } catch (err) {
                    console.warn("Failed to generate exact mask polygon", err);
                }
            }
            
            // Add raster below labels
            const labelLayerId = this.map.getStyle().layers?.find(l => l.type === 'symbol' && l.id.includes('label'))?.id;
            
            if (this.map.getLayer(mapboxId)) return; // Double check after await
            
            const isSmooth = uiLayerId === 'dem' || uiLayerId === 'hill';
            
            this.map.addLayer({
                id: mapboxId,
                type: 'raster',
                source: sourceId,
                paint: {
                    'raster-opacity': 0.75,
                    'raster-fade-duration': 300,
                    'raster-resampling': isSmooth ? 'linear' : 'nearest'
                }
            }, labelLayerId);
            this.registeredLayers.add(mapboxId);
        }
    } catch (e) {
        console.warn(`Failed to load real raster for ${uiLayerId}`, e);
    } finally {
        this.loadingRasters.delete(mapboxId);
    }
  }

  // ========================================================================
  // FILTERS & FEATURE STATE
  // ========================================================================

  public applyFilters(filters: any) {
    if (!this.map) return;
    try { if (!this.map.isStyleLoaded()) return; } catch { return; }
    try {
      if (filters.riskClass && filters.riskClass.length > 0) {
        if (this.map.getLayer('floodRisk-fill'))
          this.map.setFilter('floodRisk-fill', ['in', ['get', 'risk_class'], ['literal', filters.riskClass]]);
        if (this.map.getLayer('floodRisk-border'))
          this.map.setFilter('floodRisk-border', ['in', ['get', 'risk_class'], ['literal', filters.riskClass]]);
      } else {
        if (this.map.getLayer('floodRisk-fill')) this.map.setFilter('floodRisk-fill', null);
        if (this.map.getLayer('floodRisk-border')) this.map.setFilter('floodRisk-border', null);
      }
    } catch {}
  }

  public syncFeatureState(selected: FeatureIdentifier[], hovered: FeatureIdentifier | null) {
    if (!this.map || typeof this.map.setFeatureState !== 'function') return;
    try { if (!this.map.isStyleLoaded()) return; } catch { return; }

    if (this._prevHovered && (!hovered || this._prevHovered.id !== hovered.id)) {
      try { this.map.setFeatureState({ source: this._prevHovered.source, id: this._prevHovered.id }, { hover: false }); } catch {}
    }
    this._prevSelected.forEach(prev => {
      if (!selected.find(s => s.id === prev.id && s.source === prev.source)) {
        try { this.map.setFeatureState({ source: prev.source, id: prev.id }, { selected: false }); } catch {}
      }
    });
    if (hovered) {
      try { this.map.setFeatureState({ source: hovered.source, id: hovered.id }, { hover: true }); } catch {}
    }
    selected.forEach(curr => {
      try { this.map.setFeatureState({ source: curr.source, id: curr.id }, { selected: true }); } catch {}
    });
    this._prevHovered = hovered;
    this._prevSelected = [...selected];
  }

  // ========================================================================
  // CORE LAYER INITIALIZATION — Mode-Aware
  // ========================================================================

  public initializeCoreLayers(opacity: number, mode: DashboardMode = 'hydrology') {
    this.currentMode = mode;
    const colors = MODE_COLORS[mode];

    // Ensure all required sources exist
    const requiredSources = ["floodRisk", "riskGrid", "waterways", "roads", "railways", "pois", "buildings", "city-mask", "city-boundary", "vegetation-grid"];
    requiredSources.forEach(sourceId => {
      try {
        if (!this.map.getSource(sourceId)) {
          this.map.addSource(sourceId, { type: "geojson", data: { type: "FeatureCollection", features: [] }, generateId: true });
          this.registeredSources.add(sourceId);
        }
      } catch {}
    });

    // Ensure text labels stay on top
    const labelLayerId = this.map.getStyle().layers?.find(l => l.type === 'symbol' && l.id.includes('label'))?.id;

    // ── Rivers / Waterways ──
    this.addLayer({
      id: "waterways-line", type: "line", source: "waterways", 
      minzoom: 5,
      paint: {
        "line-color": "#08519c",
        "line-width": ["interpolate", ["linear"], ["zoom"], 5, 0.5, 10, 1.5, 16, 4],
        "line-opacity": opacity * 0.85
      },
      layout: { "line-cap": "round", "line-join": "round" } as any
    }, labelLayerId);
    
    this.addLayer({
      id: "waterways-label", type: "symbol", source: "waterways",
      minzoom: 12,
      layout: {
        "symbol-placement": "line",
        "text-field": ["get", "name"],
        "text-font": ["Inter Medium", "Arial Unicode MS Regular"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 12, 10, 16, 14],
        "text-letter-spacing": 0.1
      },
      paint: {
        "text-color": "#0284c7",
        "text-halo-color": "#ffffff",
        "text-halo-width": 2
      }
    });

    // ── Roads ──
    this.addLayer({
      id: "roads-case", type: "line", source: "roads", minzoom: 11,
      paint: {
        "line-color": "#a8a8a8",
        "line-width": ["interpolate", ["linear"], ["zoom"],
          11, ["match", ["get", "highway"], "motorway", 3, "trunk", 2.5, "primary", 2, 1.5],
          16, ["match", ["get", "highway"], "motorway", 12, "trunk", 9, "primary", 7, "secondary", 5, 3]
        ],
        "line-opacity": opacity
      },
      layout: { "line-cap": "round", "line-join": "round" } as any
    }, labelLayerId);

    this.addLayer({
      id: "roads-line", type: "line", source: "roads", minzoom: 11,
      paint: {
        "line-color": ["match", ["get", "highway"],
          "motorway", "#ffcc99",
          "trunk", "#ffcc99",
          "primary", "#ffffb3",
          "#ffffff"
        ],
        "line-width": ["interpolate", ["linear"], ["zoom"],
          11, ["match", ["get", "highway"], "motorway", 2, "trunk", 1.5, "primary", 1, 0.5],
          16, ["match", ["get", "highway"], "motorway", 10, "trunk", 7, "primary", 5, "secondary", 3.5, 1.5]
        ],
        "line-opacity": opacity
      },
      layout: { "line-cap": "round", "line-join": "round" } as any
    }, labelLayerId);

    this.addLayer({
      id: "roads-label", type: "symbol", source: "roads",
      minzoom: 14,
      layout: {
        "symbol-placement": "line",
        "text-field": ["get", "name"],
        "text-font": ["Inter Regular", "Arial Unicode MS Regular"],
        "text-size": 11
      },
      paint: {
        "text-color": "#475569",
        "text-halo-color": "#ffffff",
        "text-halo-width": 2
      }
    });

    // City Mask has been removed as per user request to keep the map white/light.

    this.addLayer({
      id: 'city-boundary-line', type: 'line', source: 'city-boundary',
      paint: { 
        'line-color': colors.boundaryLine, 
        'line-width': ["interpolate", ["linear"], ["zoom"], 8, 2, 14, 4],
        'line-opacity': 0.9,
        'line-dasharray': [2, 2]
      }
    }, labelLayerId);

    if (!this._interactionsSetup) {
      this.setupInteractions();
      this._interactionsSetup = true;
    }
    
    // Water animation removed to satisfy professional GIS cartography standard (no fake effects).
  }

  private startWaterAnimation(baseOpacity: number) {
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    
    const animate = () => {
      let hasLayer = false;
      try {
        hasLayer = !!(this.map && this.map.isStyleLoaded() && this.map.getLayer('floodRisk-fill'));
      } catch (e) {
        hasLayer = false;
      }

      if (hasLayer) {
        const time = Date.now() / 600;
        // Pulse opacity to simulate shimmering wave effect
        const pulse = (baseOpacity * 0.65) + Math.sin(time) * 0.15;
        try {
          this.map.setPaintProperty('floodRisk-fill', 'fill-opacity', Math.max(0, pulse));
        } catch (e) {}
      }
      
      this.animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();
  }

  // ========================================================================
  // MOUSE INTERACTIONS
  // ========================================================================

  private setupInteractions() {
    const interactiveLayers = ["floodRisk-fill", "floodRisk-columns", "pois-circle", "buildings-fill", "population-extrusion", "vegetation-extrusion", "vegetation-points"];
    this.popupManager.registerLayer('population-extrusion', 'polygon', 'Demographics (WorldPop)', '#eab308');
    this.popupManager.registerLayer('vegetation-extrusion', 'polygon', 'Vegetation & Parks', '#22c55e');
    this.popupManager.registerLayer('vegetation-points', 'point', 'Tree / Vegetation', '#22c55e');
    interactiveLayers.forEach(layer => {
      this.map.on('click', layer, (e) => {
        if (!e.features || e.features.length === 0) return;
        const feature = e.features[0];
        if (feature.id === undefined) return;
        useInteractionStore.getState().selectFeature(
          { id: feature.id, source: feature.source },
          feature.properties || {},
          e.originalEvent.shiftKey
        );
      });
      this.map.on('mousemove', layer, (e) => {
        this.map.getCanvas().style.cursor = 'pointer';
        if (!e.features || e.features.length === 0) return;
        const feature = e.features[0];
        if (feature.id === undefined) return;
        const featureKey = `${feature.source}-${feature.id}`;
        if (this.lastHoveredFeature === featureKey) return;
        if (this.throttleTimeout) return;
        this.throttleTimeout = setTimeout(() => {
          this.lastHoveredFeature = featureKey;
          useInteractionStore.getState().setHoveredFeature({ id: feature.id as string | number, source: feature.source });
          this.throttleTimeout = null;
        }, 16);
      });
      this.map.on('mouseleave', layer, () => {
        this.map.getCanvas().style.cursor = '';
        this.lastHoveredFeature = null;
        if (this.throttleTimeout) { clearTimeout(this.throttleTimeout); this.throttleTimeout = null; }
        useInteractionStore.getState().setHoveredFeature(null);
      });
    });
  }

  // ========================================================================
  // DATA SYNC
  // ========================================================================

  public syncData(osmData: Record<string, any>) {
    if (!osmData) return;
    const endpoints = ["floodRisk", "riskGrid", "buildings", "roads", "pois", "waterways", "railways"];
    endpoints.forEach(key => {
      const data = osmData[key] || { type: "FeatureCollection", features: [] };
      this.updateSource(key, data);
    });
    
    if (osmData.vegetationGrid) this.updateSource("vegetation-grid", osmData.vegetationGrid);
  }

  public cleanup() {
    if (this._unsubscribeZustand) this._unsubscribeZustand();
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    this.popupManager.cleanup();
  }

  // ========================================================================
  // RUNTIME AUDIT (kept for debugging)
  // ========================================================================
  public runRuntimeAudit() {
    if (!this.map || !this.map.isStyleLoaded()) { console.warn("Audit: Map not loaded."); return; }
    console.group("=== RUNTIME MAPBOX AUDIT ===");
    const sources = ["buildings", "roads", "waterways", "railways", "pois", "floodRisk", "city-boundary", "city-mask"];
    const zoom = this.map.getZoom();
    console.log(`Zoom: ${zoom.toFixed(2)} | Mode: ${this.currentMode}`);
    const allLayers = this.map.getStyle().layers || [];
    sources.forEach(sourceId => {
      const source = this.map.getSource(sourceId);
      const srcLayers = allLayers.filter(l => (l as any).source === sourceId);
      let count = 0;
      try { count = this.map.querySourceFeatures(sourceId).length; } catch {}
      console.log(`${sourceId}: exists=${!!source}, features=${count}, layers=[${srcLayers.map(l => l.id).join(',')}], visibility=[${srcLayers.map(l => { try { return this.map.getLayoutProperty(l.id, 'visibility') || 'visible'; } catch { return '?'; } }).join(',')}]`);
    });
    console.groupEnd();
  }
}
