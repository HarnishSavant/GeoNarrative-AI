import { useCallback, useEffect } from "react";
import { MapLayer, DashboardMode } from "@/lib/types";
import { getLayersForMode } from "@/lib/mockData";
import { config } from "@/lib/config";
import { toast } from "react-hot-toast";

import { useUIStore } from "@/store/uiStore";
import { useMapStore } from "@/store/mapStore";
import { useDataStore } from "@/store/dataStore";

export function useMapControl(initialLocation: string = "") {
  // UI State
  const dashboardMode = useUIStore((state) => state.dashboardMode);
  const setDashboardMode = useUIStore((state) => state.setDashboardMode);
  const hasSearched = useUIStore((state) => state.hasSearched);
  const setHasSearched = useUIStore((state) => state.setHasSearched);

  // Map State
  const currentLocation = useMapStore((state) => state.currentLocation);
  const setCurrentLocation = useMapStore((state) => state.setCurrentLocation);
  const mapCenter = useMapStore((state) => state.mapCenter);
  const setMapCenter = useMapStore((state) => state.setMapCenter);
  const mapLayers = useMapStore((state) => state.mapLayers);
  const setMapLayers = useMapStore((state) => state.setMapLayers);
  const layerOpacity = useMapStore((state) => state.layerOpacity);
  const setLayerOpacity = useMapStore((state) => state.setLayerOpacity);
  const mapFullscreen = useMapStore((state) => state.mapFullscreen);
  const setMapFullscreen = useMapStore((state) => state.setMapFullscreen);

  // Data State
  const osmData = useDataStore((state) => state.osmData);
  const setOsmData = useDataStore((state) => state.setOsmData);
  const isLoadingOSM = useDataStore((state) => state.isLoadingOSM);
  const setIsLoadingOSM = useDataStore((state) => state.setIsLoadingOSM);
  const boundaryData = useDataStore((state) => state.boundaryData);
  const setBoundaryData = useDataStore((state) => state.setBoundaryData);

  const defaultBoundaryLayer: MapLayer = {
    id: "city-boundary",
    name: "Study Area Boundary",
    type: "line",
    visible: true,
    color: "#0ea5e9",
    icon: "shield",
    description: "Official administrative boundary polygon"
  };

  // Initialize if empty
  if (mapLayers.length === 0) {
    setMapLayers([defaultBoundaryLayer, ...getLayersForMode("terrain")]);
  }
  if (currentLocation === "" && initialLocation !== "") {
    setCurrentLocation(initialLocation);
  }

  const handleModeChange = useCallback((mode: DashboardMode) => {
    setDashboardMode(mode);
    setMapLayers([defaultBoundaryLayer, ...getLayersForMode(mode)]);
  }, [setDashboardMode, setMapLayers]);

  const handleToggleLayer = useCallback((layerId: string) => {
    setMapLayers((prev: MapLayer[]) =>
      prev.map((l) => (l.id === layerId ? { ...l, visible: !l.visible } : l))
    );
  }, [setMapLayers]);

  const handleRegisterCustomLayer = useCallback((file: any) => {
    setHasSearched(true);
    setCurrentLocation((prev) => prev || file.name);
    const newCustomLayer: MapLayer = {
      id: `custom-uploaded-${file.id}`,
      name: `Uploaded: ${file.name}`,
      type: "circle",
      visible: true,
      color: "#ec4899", // custom neon hot pink
      icon: "shield",
      description: `Custom GIS layer with ${file.features || 142} features.`
    };
    setMapLayers((prev: MapLayer[]) => [...prev, newCustomLayer]);
  }, [setHasSearched, setCurrentLocation, setMapLayers]);



  const handleLocationSearch = useCallback(async (location: string) => {
    if (!location.trim()) return;
    setCurrentLocation(location);
    setHasSearched(true);

    // Comprehensive local geocode lookup — no backend required
    const LOCATION_COORDS: Record<string, [number, number]> = {
      "pune":         [73.8567, 18.5204],
      "pimpri":       [73.7997, 18.6298],
      "chinchwad":    [73.7997, 18.6298],
      "hinjawadi":    [73.7389, 18.5913],
      "hinjewadi":    [73.7389, 18.5913],
      "wakad":        [73.7646, 18.5989],
      "baner":        [73.7800, 18.5590],
      "aundh":        [73.8073, 18.5588],
      "kothrud":      [73.8070, 18.5074],
      "hadapsar":     [73.9260, 18.5050],
      "viman nagar":  [73.9145, 18.5679],
      "koregaon":     [73.8942, 18.5362],
      "shivajinagar": [73.8475, 18.5314],
      "deccan":       [73.8400, 18.5180],
      "swargate":     [73.8580, 18.5015],
      "kharadi":      [73.9400, 18.5530],
      "yerawada":     [73.8860, 18.5560],
      "warje":        [73.8080, 18.4850],
      "kondhwa":      [73.8680, 18.4700],
      "katraj":       [73.8640, 18.4520],
      "bibwewadi":    [73.8550, 18.4820],
    };

    const key = Object.keys(LOCATION_COORDS).find(k =>
      location.toLowerCase().includes(k)
    );
    const coords = key ? LOCATION_COORDS[key] : LOCATION_COORDS["pune"];
    setMapCenter(coords);

    // Try backend geocoding silently in background — don't block or crash UI
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const baseUrl = config.api.baseUrl;
      const token = typeof window !== "undefined" ? localStorage.getItem("geonarrative_token") : null;
      const res = await fetch(`${baseUrl}/api/v1/locations/search?q=${encodeURIComponent(location)}`, {
        signal: controller.signal,
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      clearTimeout(timeout);
      if (res.ok) {
        const geocodeResult = await res.json();
        if (geocodeResult?.lon && geocodeResult?.lat) {
          setMapCenter([geocodeResult.lon, geocodeResult.lat]);
        }
        if (geocodeResult?.geojson) {
          setBoundaryData({
            geojson: geocodeResult.geojson,
            boundingbox: [geocodeResult.bbox?.lat_min, geocodeResult.bbox?.lat_max, geocodeResult.bbox?.lon_min, geocodeResult.bbox?.lon_max],
            display_name: geocodeResult.display_name,
            type: geocodeResult.type,
            importance: geocodeResult.importance,
          });
          return; // Success, exit
        }
      }
    } catch {
      // Backend offline — proceed to fallback below
    }

    // ── FALLBACK: Generate local study area boundary ──
    try {
      const turf = await import('@turf/turf');
      const radiusKm = 4.5; 
      const centerPt = turf.point(coords);
      const circle = turf.circle(centerPt, radiusKm, { steps: 64 });
      const bbox = turf.bbox(circle);
      setBoundaryData({
        geojson: circle.geometry,
        boundingbox: [bbox[1], bbox[3], bbox[0], bbox[2]], // lat_min, lat_max, lon_min, lon_max
        display_name: `${location} Study Area`,
        type: "administrative",
        importance: 0.8
      });
    } catch (e) {
      console.warn("Fallback boundary generation failed:", e);
    }
  }, [setCurrentLocation, setHasSearched, setMapCenter, setBoundaryData]);


  // Auto-trigger on mount for Phase 1 (Fixed Study Area)
  useEffect(() => {
    if (currentLocation === 'Pune Municipal Corporation (PMC)' && !boundaryData) {
      // Query "Pune City" instead of "Pune Municipal Corporation" to get the full administrative boundary,
      // otherwise Nominatim returns just the PMC headquarters building (the tiny purple polygon).
      handleLocationSearch("Pune City");
    }
  }, [currentLocation, boundaryData, handleLocationSearch]);


  return {
    currentLocation,
    mapCenter,
    dashboardMode,
    mapLayers,
    layerOpacity,
    mapFullscreen,
    osmData,
    isLoadingOSM,
    hasSearched,
    boundaryData,
    setLayerOpacity,
    setMapFullscreen,
    handleModeChange,
    handleToggleLayer,
    handleRegisterCustomLayer,
    handleLocationSearch,
  };
}
