import { create } from 'zustand';

export type SpatialFilter = {
  riskClass?: string[];
  infrastructureType?: string[];
  exposureLevel?: string[];
  poiType?: string[];
};

export type FeatureIdentifier = {
  id: string | number;
  source: string;
  sourceLayer?: string;
};

interface InteractionState {
  // Selection
  selectedFeatures: FeatureIdentifier[];
  activeFeature: Record<string, any> | null;
  
  // Filtering
  filters: SpatialFilter;
  
  // Highlighting
  highlightedFeatures: FeatureIdentifier[];
  hoveredFeature: FeatureIdentifier | null;

  // Actions
  selectFeature: (feature: FeatureIdentifier, properties: Record<string, any>, multi?: boolean) => void;
  clearSelection: () => void;
  
  setHoveredFeature: (feature: FeatureIdentifier | null) => void;
  
  setFilter: (key: keyof SpatialFilter, values: string[]) => void;
  clearFilters: () => void;
  
  setHighlightedFeatures: (features: FeatureIdentifier[]) => void;
}

export const useInteractionStore = create<InteractionState>((set, get) => ({
  selectedFeatures: [],
  activeFeature: null,
  
  filters: {},
  
  highlightedFeatures: [],
  hoveredFeature: null,

  selectFeature: (feature, properties, multi = false) => {
    set((state) => {
      // If multi-select is off, replace selection
      if (!multi) {
        return { 
          selectedFeatures: [feature],
          activeFeature: properties
        };
      }
      
      // If multi-select, check if already selected
      const isSelected = state.selectedFeatures.some(f => f.id === feature.id && f.source === feature.source);
      if (isSelected) {
        return {
          selectedFeatures: state.selectedFeatures.filter(f => !(f.id === feature.id && f.source === feature.source)),
          activeFeature: state.selectedFeatures.length === 1 ? null : state.activeFeature // Clear active if it was the last one
        };
      }
      
      return {
        selectedFeatures: [...state.selectedFeatures, feature],
        activeFeature: properties
      };
    });
  },

  clearSelection: () => {
    set({ selectedFeatures: [], activeFeature: null });
  },

  setHoveredFeature: (feature) => {
    set({ hoveredFeature: feature });
  },

  setFilter: (key, values) => {
    set((state) => ({
      filters: {
        ...state.filters,
        [key]: values.length > 0 ? values : undefined
      }
    }));
  },

  clearFilters: () => {
    set({ filters: {} });
  },

  setHighlightedFeatures: (features) => {
    set({ highlightedFeatures: features });
  }
}));
