import { useState, useCallback } from "react";
import { MapLayer, DashboardMode } from "@/lib/types";
import { getLayersForMode } from "@/lib/mockData";
import { config } from "@/lib/config";
import { toast } from "react-hot-toast";

export function useMapControl(initialLocation: string = "") {
  const [currentLocation, setCurrentLocation] = useState(initialLocation);
  const [mapCenter, setMapCenter] = useState<[number, number]>(config.mapbox.defaultCenter);
  const [dashboardMode, setDashboardMode] = useState<DashboardMode>("flood");
  const [mapLayers, setMapLayers] = useState<MapLayer[]>(getLayersForMode("flood"));
  const [layerOpacity, setLayerOpacity] = useState<number>(0.7);
  const [mapFullscreen, setMapFullscreen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Dynamic Real OSM Layer State
  const [osmData, setOsmData] = useState<Record<string, any>>({});
  const [isLoadingOSM, setIsLoadingOSM] = useState(false);

  const handleModeChange = useCallback((mode: DashboardMode) => {
    setDashboardMode(mode);
    setMapLayers(getLayersForMode(mode));
  }, []);

  const handleToggleLayer = useCallback((layerId: string) => {
    setMapLayers((prev) =>
      prev.map((l) => (l.id === layerId ? { ...l, visible: !l.visible } : l))
    );
  }, []);

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
    setMapLayers((prev) => [...prev, newCustomLayer]);
  }, []);

  // Fetch real GIS layers dynamically from Nominatim + Overpass APIs via our Backend Services
  const fetchRealOSMData = useCallback(async (city: string, bbox: any) => {
    setIsLoadingOSM(true);
    const categories = ["roads", "rivers", "hospitals", "schools", "buildings", "infrastructure"];
    const fetchedData: Record<string, any> = {};

    toast.loading(`Extracting live OSM layers for ${city}...`, { id: "osm-loader" });

    try {
      await Promise.all(
        categories.map(async (cat) => {
          const url = `${config.api.baseUrl}/api/v1/locations/osm?city=${encodeURIComponent(
            city
          )}&category=${cat}&lat_min=${bbox.lat_min}&lat_max=${bbox.lat_max}&lon_min=${bbox.lon_min}&lon_max=${bbox.lon_max}`;

          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            fetchedData[cat] = data;
          }
        })
      );
      setOsmData(fetchedData);
      toast.success(`Ingested real OSM city map for ${city}!`, { id: "osm-loader" });
    } catch (err) {
      console.error("OSM Live Ingestion Failed:", err);
      toast.error("Failed to load live OSM layers. Using fallback simulator.", { id: "osm-loader" });
    } finally {
      setIsLoadingOSM(false);
    }
  }, []);

  const handleLocationSearch = useCallback(async (location: string) => {
    if (!location.trim()) return;
    setCurrentLocation(location);
    setHasSearched(true);

    try {
      // 1. Geocode location using our backend dynamic Geocoder (OSM Nominatim API wrapper)
      const url = `${config.api.baseUrl}/api/v1/locations/search?q=${encodeURIComponent(location)}`;
      const res = await fetch(url);
      
      if (res.ok) {
        const geocodeResult = await res.json();
        const centerCoords: [number, number] = [geocodeResult.lon, geocodeResult.lat];
        setMapCenter(centerCoords);

        // 2. Load live OSM Overpass layers for the city bounding box!
        fetchRealOSMData(location, geocodeResult.bbox);
        return;
      }
    } catch (e) {
      console.error("Nominatim geocoding error:", e);
    }

    // Standard local fallback geocoding coordinates if backend geocoding fails or timeouts
    const LOCATION_COORDS: Record<string, [number, number]> = {
      "pune": [73.8567, 18.5204],
      "mumbai": [72.8777, 19.0760],
      "chennai": [80.2707, 13.0827],
      "delhi": [77.2090, 28.6139],
      "bangalore": [77.5946, 12.9716],
      "kolkata": [88.3639, 22.5726],
      "hyderabad": [78.4867, 17.3850],
      "new york": [-74.0060, 40.7128],
      "tokyo": [139.6917, 35.6895],
      "london": [-0.1276, 51.5074],
    };
    
    const key = Object.keys(LOCATION_COORDS).find((k) =>
      location.toLowerCase().includes(k)
    );
    if (key) {
      setMapCenter(LOCATION_COORDS[key]);
    }
  }, [fetchRealOSMData]);

  // No auto-trigger — app starts with welcome screen until user searches

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
    setLayerOpacity,
    setMapFullscreen,
    handleModeChange,
    handleToggleLayer,
    handleRegisterCustomLayer,
    handleLocationSearch,
  };
}
