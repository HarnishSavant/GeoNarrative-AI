import { create } from 'zustand';
import { MapLayer } from '@/lib/types';
import { config } from '@/lib/config';

interface MapState {
  currentLocation: string;
  mapCenter: [number, number];
  mapLayers: MapLayer[];
  layerOpacity: number;
  mapFullscreen: boolean;
  mapFilters: any;
  highlightedFeature: any;

  setCurrentLocation: (location: string | ((prev: string) => string)) => void;
  setMapCenter: (center: [number, number]) => void;
  setMapLayers: (layers: MapLayer[] | ((prev: MapLayer[]) => MapLayer[])) => void;
  setLayerOpacity: (opacity: number) => void;
  setMapFullscreen: (fullscreen: boolean) => void;
  setMapFilters: (filters: any) => void;
  setHighlightedFeature: (feature: any) => void;
}

export const useMapStore = create<MapState>((set) => ({
  currentLocation: 'Pune Municipal Corporation (PMC)',
  mapCenter: config.mapbox.defaultCenter,
  mapLayers: [],
  layerOpacity: 0.7,
  mapFullscreen: false,
  mapFilters: {},
  highlightedFeature: null,

  setCurrentLocation: (location) => set((state) => ({ 
    currentLocation: typeof location === 'function' ? location(state.currentLocation) : location 
  })),
  setMapCenter: (center) => set({ mapCenter: center }),
  setMapLayers: (layers) => set((state) => ({
    mapLayers: typeof layers === 'function' ? layers(state.mapLayers) : layers
  })),
  setLayerOpacity: (opacity) => set({ layerOpacity: opacity }),
  setMapFullscreen: (fullscreen) => set({ mapFullscreen: fullscreen }),
  setMapFilters: (filters) => set({ mapFilters: filters }),
  setHighlightedFeature: (feature) => set({ highlightedFeature: feature }),
}));
