"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Maximize2,
  Minimize2,
  Layers,
  Navigation,
  ZoomIn,
  ZoomOut,
  Crosshair,
  Satellite,
} from "lucide-react";
import { config, MAP_STYLES } from "@/lib/config";
import { generateRandomPoints, generateFloodZones } from "@/lib/mockData";
import { MapLayer, DashboardMode } from "@/lib/types";

// Helper to generate some vibrant static mock lines for rivers/roads
const generateMockLines = (center: [number, number], count: number, length: number): GeoJSON.FeatureCollection => {
  const features: any[] = [];
  for (let i = 0; i < count; i++) {
    const startAngle = Math.random() * 2 * Math.PI;
    const startDist = Math.random() * 0.04;
    const startLng = center[0] + startDist * Math.cos(startAngle);
    const startLat = center[1] + startDist * Math.sin(startAngle);
    
    const coords = [[startLng, startLat]];
    let curLng = startLng;
    let curLat = startLat;
    for (let j = 0; j < length; j++) {
      curLng += (Math.random() - 0.5) * 0.01;
      curLat += (Math.random() - 0.5) * 0.01;
      coords.push([curLng, curLat]);
    }
    
    const types = ["motorway", "trunk", "primary", "secondary", "unclassified"];
    features.push({
      type: "Feature",
      geometry: { type: "LineString", coordinates: coords },
      properties: { 
        id: i, 
        osm_highway: types[Math.floor(Math.random() * types.length)],
        level: ["low", "medium", "high"][Math.floor(Math.random() * 3)]
      }
    });
  }
  return { type: "FeatureCollection", features };
};

interface MapViewProps {
  center: [number, number];
  currentLocation: string;
  layers: MapLayer[];
  dashboardMode?: DashboardMode;
  onLocationChange?: (lng: number, lat: number) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  layerOpacity?: number;
  osmData?: Record<string, any>;
  boundaryData?: any;
}

export default function MapView({
  center,
  currentLocation,
  layers,
  dashboardMode = "flood",
  onLocationChange,
  isFullscreen,
  onToggleFullscreen,
  layerOpacity = 0.7,
  osmData = {},
  boundaryData = null,
}: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [currentStyle, setCurrentStyle] = useState("dark");
  const [showStylePicker, setShowStylePicker] = useState(false);
  const [mapError, setMapError] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const initMap = async () => {
      try {
        const mapboxgl = (await import("mapbox-gl")).default;

        // Check if token is available
        const token = config.mapbox.accessToken;
        if (!token) {
          setMapError(true);
          return;
        }

        mapboxgl.accessToken = token;

        const map = new mapboxgl.Map({
          container: mapContainerRef.current!,
          style: MAP_STYLES.dark,
          center: center,
          zoom: config.mapbox.defaultZoom,
          pitch: 30,
          bearing: -10,
          antialias: true,
        });

        map.addControl(new mapboxgl.NavigationControl({ showCompass: true }), "bottom-right");

        map.on("load", () => {
          setMapLoaded(true);

          // Premium Mapbox Visuals: 3D Buildings & Atmosphere
          try {
            if (map.setFog) {
              map.setFog({
                'range': [0.5, 10],
                'color': '#0f172a',
                'horizon-blend': 0.1,
                'high-color': '#1e1b4b',
                'space-color': '#020617',
                'star-intensity': 0.8
              });
            }

            const layers = map.getStyle().layers;
            let labelLayerId;
            for (let i = 0; i < layers.length; i++) {
              if (layers[i].type === 'symbol' && layers[i].layout['text-field']) {
                labelLayerId = layers[i].id;
                break;
              }
            }

            if (!map.getLayer('3d-buildings-premium')) {
              map.addLayer(
                {
                  'id': '3d-buildings-premium',
                  'source': 'composite',
                  'source-layer': 'building',
                  'filter': ['==', 'extrude', 'true'],
                  'type': 'fill-extrusion',
                  'minzoom': 14,
                  'paint': {
                    'fill-extrusion-color': '#1e293b',
                    'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 14, 0, 14.05, ['get', 'height']],
                    'fill-extrusion-base': ['interpolate', ['linear'], ['zoom'], 14, 0, 14.05, ['get', 'min_height']],
                    'fill-extrusion-opacity': 0.8
                  }
                },
                labelLayerId
              );
            }
          } catch(e) {
            console.warn("Failed to apply premium mapbox visuals:", e);
          }

          // Add all mock layers using the shared helper
          addMockLayersToMap(map, center, currentLocation);

          // Popups
          map.on("click", "risk-points-circle", (e: any) => {
            const props = e.features[0].properties;
            new mapboxgl.Popup({ closeButton: true, className: "geo-popup" })
              .setLngLat(e.lngLat)
              .setHTML(`
                <div style="font-family: Inter, sans-serif;">
                  <div style="font-weight: 600; font-size: 14px; margin-bottom: 8px;">${props.name}</div>
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 12px;">
                    <div style="color: #9ca3af;">Risk Score</div>
                    <div style="font-weight: 600; color: ${props.riskScore > 7 ? "#ef4444" : props.riskScore > 4 ? "#f59e0b" : "#10b981"};">${props.riskScore}/10</div>
                    <div style="color: #9ca3af;">Elevation</div>
                    <div>${props.elevation}m</div>
                    <div style="color: #9ca3af;">Rainfall</div>
                    <div>${props.rainfall}mm</div>
                    <div style="color: #9ca3af;">Risk Level</div>
                    <div style="text-transform: uppercase; font-size: 10px; font-weight: 700; letter-spacing: 0.05em;">${props.riskLevel}</div>
                  </div>
                </div>
              `)
              .addTo(map);
          });

          map.on("mouseenter", "risk-points-circle", () => {
            map.getCanvas().style.cursor = "pointer";
          });
          map.on("mouseleave", "risk-points-circle", () => {
            map.getCanvas().style.cursor = "";
          });

          // Helper for registering utility and specific point popups
          const registerPointPopup = (layerName: string, title: string, color: string) => {
            map.on("click", layerName, (e: any) => {
              const props = e.features[0].properties;
              new mapboxgl.Popup({ closeButton: true, className: "geo-popup" })
                .setLngLat(e.lngLat)
                .setHTML(`
                  <div style="font-family: Inter, sans-serif; padding: 4px;">
                    <div style="font-weight: 700; font-size: 14px; margin-bottom: 8px; color: ${color};">${title}</div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 12px; color: #f3f4f6;">
                      <div style="color: #9ca3af;">Node Name</div>
                      <div style="font-weight: 600;">${props.name || "Utility Node"}</div>
                      <div style="color: #9ca3af;">Asset ID</div>
                      <div style="font-family: monospace; font-size: 11px;">#QT-${props.id || 100 + Math.floor(Math.random() * 900)}</div>
                      <div style="color: #9ca3af;">Load / Signal</div>
                      <div>${props.rainfall || 85}%</div>
                      <div style="color: #9ca3af;">Health Index</div>
                      <div style="font-weight: 600; color: ${props.riskScore > 7 ? "#ef4444" : props.riskScore > 4 ? "#f59e0b" : "#10b981"};">${(10 - props.riskScore).toFixed(1)}/10</div>
                      <div style="color: #9ca3af;">Risk Level</div>
                      <div style="text-transform: uppercase; font-size: 10px; font-weight: 700; color: ${props.riskLevel === "critical" ? "#dc2626" : props.riskLevel === "high" ? "#fb923c" : "#10b981"};">${props.riskLevel}</div>
                    </div>
                  </div>
                `)
                .addTo(map);
            });
            map.on("mouseenter", layerName, () => {
              map.getCanvas().style.cursor = "pointer";
            });
            map.on("mouseleave", layerName, () => {
              map.getCanvas().style.cursor = "";
            });
          };

          registerPointPopup("telecom-towers-layer", "Telecom Tower Base Station", "#a78bfa");
          registerPointPopup("substations-layer", "Power Grid Substation", "#fbbf24");
          registerPointPopup("accident-hotspots-layer", "Accident Hotspot Node", "#f87171");
          registerPointPopup("construction-sites-layer", "Active Construction Permitted Site", "#fbbf24");

          // Click on flood zones / land use zones
          map.on("click", "flood-zones-fill", (e: any) => {
            const props = e.features[0].properties;
            const title = dashboardMode === "urban" ? "Zoning District" : dashboardMode === "utility" ? "Outage Subsector" : dashboardMode === "traffic" ? "Parking Zone" : "Flood Inundation Zone";
            const field = dashboardMode === "urban" ? "Zone Use" : "Inundation Risk";
            const val = dashboardMode === "urban" ? (props.riskLevel || "medium").toUpperCase() : (props.riskLevel || "medium");
            new mapboxgl.Popup({ closeButton: true })
              .setLngLat(e.lngLat)
              .setHTML(`
                <div style="font-family: Inter, sans-serif; padding: 4px;">
                  <div style="font-weight: 700; font-size: 14px; margin-bottom: 8px; color: #1e293b;">${title}</div>
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 12px; color: #334155;">
                    <div style="font-weight: 500; color: #64748b;">Name</div>
                    <div style="font-weight: 600;">${props.name || "Unnamed Area"}</div>
                    <div style="font-weight: 500; color: #64748b;">${field}</div>
                    <div style="font-weight: 600; text-transform: capitalize;">${val}</div>
                    <div style="font-weight: 500; color: #64748b;">Area</div>
                    <div style="font-weight: 600;">${props.area || (Math.random() * 5).toFixed(2)} km²</div>
                    <div style="font-weight: 500; color: #64748b;">Population</div>
                    <div style="font-weight: 600;">${Number(props.population || Math.floor(Math.random() * 10000)).toLocaleString()}</div>
                  </div>
                </div>
              `)
              .addTo(map);
          });
        });

        mapRef.current = map;
      } catch (error) {
        console.error("Map initialization error:", error);
        setMapError(true);
      }
    };

    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update center and dynamic OSM layers
  useEffect(() => {
    if (mapRef.current && mapLoaded) {
      // We don't fly to the point center immediately if we are going to fitBounds later, but we can do a default fly to
      mapRef.current.flyTo({
        center: center,
        zoom: 12,
        pitch: 30,
        duration: 2000,
      });

      // Re-generate and add mock/OSM data for the new location
      addMockLayersToMap(mapRef.current, center, currentLocation);
    }
  }, [center, mapLoaded, osmData]);

  // Fetch and render Dynamic City Boundary
  useEffect(() => {
    if (!boundaryData || !mapLoaded || !mapRef.current) return;
    
    try {
      const boundary = boundaryData;
      const map = mapRef.current;
      const c = currentLocation.toLowerCase();
      let color = "#0ea5e9";
      if (c.includes("pune")) color = "#06b6d4";
      else if (c.includes("mumbai")) color = "#3b82f6";
      else if (c.includes("surat")) color = "#10b981";
      else if (c.includes("delhi")) color = "#a855f7";

      const geojsonFeature = {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: boundary.geojson,
          properties: {}
        }]
      };

      if (map.getSource('city-boundary-source')) {
        map.getSource('city-boundary-source').setData(geojsonFeature);
      } else {
        map.addSource('city-boundary-source', {
          type: 'geojson',
          data: geojsonFeature
        });
        
        map.addLayer({
          id: 'city-boundary-fill',
          type: 'fill',
          source: 'city-boundary-source',
          paint: {
            'fill-color': color,
            'fill-opacity': ["interpolate", ["linear"], ["zoom"], 10, 0.08, 15, 0.02]
          }
        }, "waterway-label"); // render before labels
        
        map.addLayer({
          id: 'city-boundary-line',
          type: 'line',
          source: 'city-boundary-source',
          paint: {
            'line-color': color,
            'line-width': 2.5,
            'line-opacity': 0.9
          }
        }, "waterway-label");
        
        map.addLayer({
          id: 'city-boundary-glow',
          type: 'line',
          source: 'city-boundary-source',
          paint: {
            'line-color': color,
            'line-width': 12,
            'line-opacity': 0.3,
            'line-blur': 10
          }
        }, "waterway-label");

        // Popup logic
        map.on('click', 'city-boundary-fill', (e: any) => {
          new (window as any).mapboxgl.Popup({ closeButton: true, className: "geo-popup" })
            .setLngLat(e.lngLat)
            .setHTML(`
              <div style="font-family: Inter, sans-serif; padding: 4px;">
                <div style="font-weight: 800; font-size: 15px; margin-bottom: 8px; color: ${color}; text-transform: uppercase; letter-spacing: 0.5px;">${boundary.display_name.split(',')[0]}</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px; color: #f3f4f6;">
                  <div style="color: #9ca3af;">State/Region</div>
                  <div style="font-weight: 600;">${boundary.display_name.split(',')[1] || "Unknown"}</div>
                  <div style="color: #9ca3af;">Study Area</div>
                  <div style="font-weight: 600;">Approx. ${(boundary.importance * 1000).toFixed(0)} km²</div>
                  <div style="color: #9ca3af;">Type</div>
                  <div style="font-weight: 600; text-transform: capitalize;">${boundary.type}</div>
                  <div style="color: #9ca3af;">Importance</div>
                  <div style="font-weight: 600;">${(boundary.importance * 100).toFixed(1)}%</div>
                </div>
              </div>
            `)
            .addTo(map);
        });
      }
      
      // Fit Bounds using Nominatim bounding box
      const bbox = boundary.boundingbox;
      if (bbox) {
        map.fitBounds([
          [parseFloat(bbox[2]), parseFloat(bbox[0])], // [lonMin, latMin]
          [parseFloat(bbox[3]), parseFloat(bbox[1])]  // [lonMax, latMax]
        ], { padding: 60, duration: 2500, essential: true });
      }
    } catch(e) {
      console.error("Failed to load boundary:", e);
    }
  }, [boundaryData, mapLoaded]);

  // Handle Layer Opacity and Visibility for City Boundary
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const map = mapRef.current;
    
    const boundaryLayer = layers.find(l => l.id === "city-boundary");
    if (boundaryLayer && map.getLayer('city-boundary-fill')) {
      const visibility = boundaryLayer.visible ? 'visible' : 'none';
      map.setLayoutProperty('city-boundary-fill', 'visibility', visibility);
      map.setLayoutProperty('city-boundary-line', 'visibility', visibility);
      map.setLayoutProperty('city-boundary-glow', 'visibility', visibility);
    }
  }, [layers, mapLoaded]);

  // Listen for zone selection drill-down events to fly the camera
  useEffect(() => {
    const handleFly = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail) return;
      
      const zoneOffsets: Record<string, [number, number]> = {
        // Floodways
        "Deccan Hydrological Floodway A": [73.8450, 18.5280],
        "Koregaon-Bund Garden Floodway B": [73.8900, 18.5410],
        "Pune Hilltop Terraces": [73.8200, 18.5150],
        // Roads
        "Pune Karve Road Segment": [73.8400, 18.5150],
        "Pune Fergusson College Road Segment": [73.8420, 18.5200],
        "Pune Jangali Maharaj Road Segment": [73.8580, 18.5310],
        "Pune Pune Station Overpass Segment": [73.8750, 18.5380],
        // Urban Assets
        "Pune Sassoon General Hospital Zone": [73.8732, 18.5273],
        "Pune Deccan Power Grid Substation Zone": [73.8315, 18.5189],
        "Pune Deccan Gymkhana School Zone": [73.8405, 18.5192],
        "Pune Deccan Rescue Center Zone": [73.8398, 18.5177],
        // Substations (Utility)
        "Pune Deccan Power Grid Substation Sector": [73.8315, 18.5189],
        "Pune Bund Garden Substation Sector": [73.8905, 18.5412]
      };

      const targetCoords = zoneOffsets[detail.zoneName];
      if (mapRef.current && mapLoaded && targetCoords) {
        mapRef.current.flyTo({
          center: targetCoords,
          zoom: 14.5,
          pitch: 50,
          bearing: 35,
          duration: 2000,
        });

        // Trigger focal popup on map
        try {
          import("mapbox-gl").then((mapboxglModule) => {
            const mapboxgl = mapboxglModule.default;
            new mapboxgl.Popup({ closeButton: true, className: "geo-popup" })
              .setLngLat(targetCoords)
              .setHTML(`
                <div style="font-family: Inter, sans-serif; padding: 4px;">
                  <div style="font-weight: 700; font-size: 13px; margin-bottom: 4px; color: ${detail.level === "critical" ? "#ef4444" : "#f59e0b"};">📍 Focused: ${detail.zoneName}</div>
                  <p style="font-size: 10px; color: #d1d5db; margin: 0; line-height: 1.4;">Active digital twin camera focus. Querying PostGIS georeferenced boundary.</p>
                </div>
              `)
              .addTo(mapRef.current);
          });
        } catch (e) {
          console.warn("Failed to mount focal popup:", e);
        }
      }
    };

    const handleRenderRiskGeoJSON = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail || !detail.geojson) return;
      
      const mapInstance = mapRef.current;
      if (!mapInstance || !mapLoaded) return;
      
      try {
        // Remove existing custom risk layer/source if any
        if (mapInstance.getLayer("custom-urban-risk-layer-fill")) mapInstance.removeLayer("custom-urban-risk-layer-fill");
        if (mapInstance.getLayer("custom-urban-risk-layer-line")) mapInstance.removeLayer("custom-urban-risk-layer-line");
        if (mapInstance.getLayer("custom-urban-risk-layer-circle")) mapInstance.removeLayer("custom-urban-risk-layer-circle");
        if (mapInstance.getSource("custom-urban-risk-source")) mapInstance.removeSource("custom-urban-risk-source");
        
        mapInstance.addSource("custom-urban-risk-source", {
          type: "geojson",
          data: detail.geojson
        });
        
        // Add layers depending on GeoJSON feature types (polygons, lines, points)
        mapInstance.addLayer({
          id: "custom-urban-risk-layer-line",
          type: "line",
          source: "custom-urban-risk-source",
          filter: ["==", ["geometry-type"], "LineString"],
          paint: {
            "line-color": ["match", ["get", "risk_level"], "critical", "#ef4444", "high", "#fb923c", "medium", "#facc15", "#10b981"],
            "line-width": 4,
            "line-opacity": 0.85
          }
        });
        
        mapInstance.addLayer({
          id: "custom-urban-risk-layer-fill",
          type: "fill",
          source: "custom-urban-risk-source",
          filter: ["==", ["geometry-type"], "Polygon"],
          paint: {
            "fill-color": ["match", ["get", "risk_level"], "critical", "#ef4444", "high", "#fb923c", "medium", "#facc15", "#10b981"],
            "fill-opacity": 0.4
          }
        });
        
        mapInstance.addLayer({
          id: "custom-urban-risk-layer-circle",
          type: "circle",
          source: "custom-urban-risk-source",
          filter: ["==", ["geometry-type"], "Point"],
          paint: {
            "circle-radius": 8,
            "circle-color": ["match", ["get", "risk_level"], "critical", "#ef4444", "high", "#fb923c", "medium", "#facc15", "#10b981"],
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
            "circle-opacity": 0.9
          }
        });
        
        // Set fit bounds or fly to center of features
        if (detail.geojson.features && detail.geojson.features.length > 0) {
          const firstFeat = detail.geojson.features[0];
          let targetCoords = null;
          if (firstFeat.geometry.type === "Point") {
            targetCoords = firstFeat.geometry.coordinates;
          } else if (firstFeat.geometry.type === "LineString") {
            targetCoords = firstFeat.geometry.coordinates[0];
          } else if (firstFeat.geometry.type === "Polygon") {
            targetCoords = firstFeat.geometry.coordinates[0][0];
          }
          if (targetCoords) {
            mapInstance.flyTo({
              center: targetCoords,
              zoom: 13.5,
              pitch: 40,
              duration: 1500
            });
          }
        }
        
      } catch (err) {
        console.error("Failed to render custom risk GeoJSON on Map:", err);
      }
    };

    window.addEventListener("map-fly-to-zone", handleFly);
    window.addEventListener("map-render-risk-geojson", handleRenderRiskGeoJSON);
    return () => {
      window.removeEventListener("map-fly-to-zone", handleFly);
      window.removeEventListener("map-render-risk-geojson", handleRenderRiskGeoJSON);
    };
  }, [mapLoaded]);

  const updateMapLayerVisibility = useCallback((mapInstance: any, layerId: string, visibility: "visible" | "none") => {
    if (!mapInstance) return;
    try {
      const layerMapping: Record<string, string[]> = {
        "flood-zones": ["flood-zones-fill", "flood-zones-border"],
        "risk-heatmap": ["risk-heatmap", "risk-points-circle"],
        "rivers": ["custom-rivers-layer"],
        "infrastructure": ["infrastructure-pts-layer"],
        "elevation": ["custom-elevation-layer"],
        "population": ["population-heatmap"],
        "roads": ["custom-roads-layer"],
        "shelters": ["shelters-pts-layer"],

        // Traffic mode
        "traffic-heatmap": ["risk-heatmap", "risk-points-circle"],
        "accident-hotspots": ["accident-hotspots-layer"],
        "transit-routes": ["custom-rivers-layer"],
        "parking": ["parking-zones-fill"],
        "speed-zones": ["shelters-pts-layer"],

        // Urban mode
        "land-use-zones": ["land-use-zones-fill", "land-use-zones-border"],
        "zoning-overlay": ["custom-roads-layer"],
        "construction": ["construction-sites-layer"],
        "green-spaces": ["green-spaces-fill"],

        // Utility mode
        "power-grid": ["custom-roads-layer"],
        "water-pipes": ["custom-rivers-layer"],
        "gas-mains": ["custom-elevation-layer"],
        "telecom-towers": ["telecom-towers-layer"],
        "substations": ["substations-layer"],
        "outage-zones": ["outage-zones-fill", "outage-zones-border"]
      };

      const layersToToggle = layerMapping[layerId];
      if (layersToToggle) {
        layersToToggle.forEach((lId) => {
          if (mapInstance.getLayer(lId)) {
            mapInstance.setLayoutProperty(lId, "visibility", visibility);
          }
        });
      }
    } catch (e) {
      console.warn("Layer toggle warning:", e);
    }
  }, []);

  const addMockLayersToMap = useCallback((mapInstance: any, centerCoords: [number, number], locName: string) => {
    if (!mapInstance) return;

    // Safely remove existing mock layers and sources
    const layersToRemove = [
      "flood-zones-fill", "flood-zones-border",
      "land-use-zones-fill", "land-use-zones-border",
      "green-spaces-fill", "parking-zones-fill",
      "outage-zones-fill", "outage-zones-border",
      "risk-heatmap", "risk-points-circle",
      "infrastructure-pts-layer", "shelters-pts-layer",
      "population-heatmap", "custom-rivers-layer",
      "custom-roads-layer", "custom-elevation-layer",
      "accident-hotspots-layer", "construction-sites-layer",
      "telecom-towers-layer", "substations-layer"
    ];
    layersToRemove.forEach(l => { if (mapInstance.getLayer(l)) mapInstance.removeLayer(l); });

    const sourcesToRemove = [
      "flood-zones", "land-use-zones", "green-spaces", "parking-zones", "outage-zones",
      "risk-points", "infrastructure-pts", "shelters-pts", "population-pts",
      "custom-rivers", "custom-roads", "custom-elevation",
      "accident-hotspots", "construction-sites", "telecom-towers", "substations"
    ];
    sourcesToRemove.forEach(s => { if (mapInstance.getSource(s)) mapInstance.removeSource(s); });

    const emptyFC = { type: "FeatureCollection", features: [] };

    // Fallback static data if live OSM fails or is empty, ensuring best visualization
    const mockFloodZonesFC = generateFloodZones(centerCoords, locName);
    const mockRiskPointsFC = generateRandomPoints(centerCoords, 60, 10, locName);
    const mockSheltersFC = generateRandomPoints(centerCoords, 18, 12, locName);
    const mockHospitalsFC = generateRandomPoints(centerCoords, 12, 8, locName);
    const mockConstructionFC = generateRandomPoints(centerCoords, 16, 7, locName);
    const mockAccidentsFC = generateRandomPoints(centerCoords, 28, 8, locName);
    const mockTelecomFC = generateRandomPoints(centerCoords, 22, 14, locName);
    const mockSubstationsFC = generateRandomPoints(centerCoords, 14, 16, locName);
    const mockPopPointsFC = generateRandomPoints(centerCoords, 120, 18, locName);
    const mockRiversFC = generateMockLines(centerCoords, 5, 12);
    const mockRoadsFC = generateMockLines(centerCoords, 20, 6);
    const mockElevationFC = generateMockLines(centerCoords, 10, 10);

    // 1. Polygons Sources & Layers
    const floodZones = osmData?.buildings?.features?.length > 0 ? osmData.buildings : mockFloodZonesFC;
    mapInstance.addSource("flood-zones", { type: "geojson", data: floodZones as any });
    mapInstance.addLayer({
      id: "flood-zones-fill", type: "fill", source: "flood-zones",
      paint: { "fill-color": ["coalesce", ["get", "color"], "#3b82f6"], "fill-opacity": layerOpacity * 0.35 },
    });
    mapInstance.addLayer({
      id: "flood-zones-border", type: "line", source: "flood-zones",
      paint: { "line-color": ["coalesce", ["get", "color"], "#1d4ed8"], "line-width": 2, "line-opacity": layerOpacity * 0.8 },
    });

    // Land Use Zones
    mapInstance.addSource("land-use-zones", { type: "geojson", data: mockFloodZonesFC as any });
    mapInstance.addLayer({
      id: "land-use-zones-fill", type: "fill", source: "land-use-zones",
      paint: { "fill-color": ["coalesce", ["get", "color"], "#6366f1"], "fill-opacity": layerOpacity * 0.35 },
    });
    mapInstance.addLayer({
      id: "land-use-zones-border", type: "line", source: "land-use-zones",
      paint: { "line-color": ["coalesce", ["get", "color"], "#4338ca"], "line-width": 1.5, "line-opacity": layerOpacity * 0.7 },
    });

    // Green Spaces
    const greenZones = mockFloodZonesFC;
    mapInstance.addSource("green-spaces", { type: "geojson", data: greenZones as any });
    mapInstance.addLayer({
      id: "green-spaces-fill", type: "fill", source: "green-spaces",
      paint: { "fill-color": "#10b981", "fill-opacity": layerOpacity * 0.4 },
    });

    // Outage Zones
    mapInstance.addSource("outage-zones", { type: "geojson", data: mockFloodZonesFC as any });
    mapInstance.addLayer({
      id: "outage-zones-fill", type: "fill", source: "outage-zones",
      paint: { "fill-color": "#ef4444", "fill-opacity": layerOpacity * 0.3 },
    });
    mapInstance.addLayer({
      id: "outage-zones-border", type: "line", source: "outage-zones",
      paint: { "line-color": "#dc2626", "line-width": 2, "line-opacity": layerOpacity * 0.8 },
    });

    // Parking Zones
    mapInstance.addSource("parking-zones", { type: "geojson", data: mockFloodZonesFC as any });
    mapInstance.addLayer({
      id: "parking-zones-fill", type: "fill", source: "parking-zones",
      paint: { "fill-color": "#8b5cf6", "fill-opacity": layerOpacity * 0.3 },
    });

    // 2. Risk Points & Heatmap
    // Use buildings for a realistic Urban Density / Flood Exposure Heatmap
    const riskPoints = osmData?.buildings?.features?.length > 0 ? osmData.buildings : mockRiskPointsFC;
    mapInstance.addSource("risk-points", { type: "geojson", data: riskPoints as any });
    mapInstance.addLayer({
      id: "risk-heatmap", type: "heatmap", source: "risk-points",
      paint: {
        "heatmap-weight": ["coalesce", ["get", "riskScore"], 0.8], 
        "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 11, 0.3, 15, 1.2],
        "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 11, 15, 15, 45],
        "heatmap-color": ["interpolate", ["linear"], ["heatmap-density"], 0, "rgba(0,0,0,0)", 0.2, "#0ea5e9", 0.4, "#10b981", 0.6, "#f59e0b", 0.8, "#ef4444", 1, "#9f1239"],
        "heatmap-opacity": ["interpolate", ["linear"], ["zoom"], 13, layerOpacity, 15, 0.4],
      },
    });
    mapInstance.addLayer({
      id: "risk-points-circle", type: "circle", source: "risk-points", minzoom: 13.5,
      paint: { 
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 13.5, 3, 16, 8], 
        "circle-color": ["match", ["coalesce", ["get", "riskLevel"], "medium"], "critical", "#e11d48", "high", "#ea580c", "medium", "#059669", "#2563eb"], 
        "circle-stroke-width": 1.5, 
        "circle-stroke-color": "#ffffff", 
        "circle-opacity": layerOpacity 
      },
    });

    // 3. Infrastructure Point Layers
    const infraPoints = osmData?.hospitals?.features?.length > 0 ? osmData.hospitals : mockHospitalsFC;
    mapInstance.addSource("infrastructure-pts", { type: "geojson", data: infraPoints as any });
    mapInstance.addLayer({
      id: "infrastructure-pts-layer", type: "circle", source: "infrastructure-pts",
      paint: { 
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 4, 16, 10], 
        "circle-color": "#f59e0b", 
        "circle-stroke-width": 2, 
        "circle-stroke-color": "#fef3c7", 
        "circle-opacity": layerOpacity 
      }
    });

    // Shelters (Schools)
    const shelterPoints = osmData?.schools?.features?.length > 0 ? osmData.schools : mockSheltersFC;
    mapInstance.addSource("shelters-pts", { type: "geojson", data: shelterPoints as any });
    mapInstance.addLayer({
      id: "shelters-pts-layer", type: "circle", source: "shelters-pts",
      paint: { 
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 4, 16, 10], 
        "circle-color": "#06b6d4", 
        "circle-stroke-width": 2, 
        "circle-stroke-color": "#ecfeff", 
        "circle-opacity": layerOpacity 
      }
    });

    // Accident Hotspots
    const accidentPoints = mockAccidentsFC;
    mapInstance.addSource("accident-hotspots", { type: "geojson", data: accidentPoints as any });
    mapInstance.addLayer({
      id: "accident-hotspots-layer", type: "circle", source: "accident-hotspots",
      paint: { 
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 5, 16, 12], 
        "circle-color": "#ef4444", 
        "circle-blur": 0.2,
        "circle-stroke-width": 1.5, 
        "circle-stroke-color": "#fecaca", 
        "circle-opacity": layerOpacity 
      }
    });

    // Construction Sites
    const constructionPoints = mockConstructionFC;
    mapInstance.addSource("construction-sites", { type: "geojson", data: constructionPoints as any });
    mapInstance.addLayer({
      id: "construction-sites-layer", type: "circle", source: "construction-sites",
      paint: { 
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 4, 16, 9], 
        "circle-color": "#f97316", 
        "circle-stroke-width": 1.5, 
        "circle-stroke-color": "#ffedd5", 
        "circle-opacity": layerOpacity 
      }
    });

    // Telecom Towers (Utility)
    const telecomPoints = mockTelecomFC;
    mapInstance.addSource("telecom-towers", { type: "geojson", data: telecomPoints as any });
    mapInstance.addLayer({
      id: "telecom-towers-layer", type: "circle", source: "telecom-towers",
      paint: { 
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 5, 16, 11], 
        "circle-color": "#8b5cf6", 
        "circle-stroke-width": 2, 
        "circle-stroke-color": "#f3e8ff", 
        "circle-opacity": layerOpacity 
      }
    });

    // Substations (Utility)
    const substationPoints = osmData?.infrastructure?.features?.length > 0 ? osmData.infrastructure : mockSubstationsFC;
    mapInstance.addSource("substations", { type: "geojson", data: substationPoints as any });
    mapInstance.addLayer({
      id: "substations-layer", type: "circle", source: "substations",
      paint: { 
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 6, 16, 14], 
        "circle-color": "#f59e0b", 
        "circle-blur": 0.1,
        "circle-stroke-width": 2, 
        "circle-stroke-color": "#fef3c7", 
        "circle-opacity": layerOpacity 
      }
    });

    // Population Heatmap
    const popPoints = mockPopPointsFC;
    mapInstance.addSource("population-pts", { type: "geojson", data: popPoints as any });
    mapInstance.addLayer({
      id: "population-heatmap", type: "heatmap", source: "population-pts",
      paint: {
        "heatmap-weight": 1, 
        "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 10, 0.5, 15, 1.5], 
        "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 10, 20, 15, 60],
        "heatmap-color": ["interpolate", ["linear"], ["heatmap-density"], 0, "rgba(0,0,0,0)", 0.4, "#34d399", 0.7, "#10b981", 1, "#047857"],
        "heatmap-opacity": layerOpacity,
      }
    });

    // 4. Lines Sources & Layers
    // Custom Rivers
    const riverLines = osmData?.rivers?.features?.length > 0 ? osmData.rivers : mockRiversFC;
    mapInstance.addSource("custom-rivers", { type: "geojson", data: riverLines as any });
    mapInstance.addLayer({
      id: "custom-rivers-layer", type: "line", source: "custom-rivers",
      layout: { "line-join": "round", "line-cap": "round", "visibility": "visible" },
      paint: { "line-color": "#06b6d4", "line-width": 4, "line-opacity": layerOpacity * 0.9 }
    });

    // Custom Roads
    const roadLines = osmData?.roads?.features?.length > 0 ? osmData.roads : mockRoadsFC;
    mapInstance.addSource("custom-roads", { type: "geojson", data: roadLines as any });
    mapInstance.addLayer({
      id: "custom-roads-layer", type: "line", source: "custom-roads",
      layout: { "line-join": "round", "line-cap": "round", "visibility": "visible" },
      paint: {
        "line-color": ["match", ["coalesce", ["get", "osm_highway"], "unclassified"], "motorway", "#ef4444", "trunk", "#f59e0b", "primary", "#3b82f6", "#10b981"],
        "line-width": 3, "line-opacity": layerOpacity * 0.9
      }
    });

    // Custom Elevation Contours
    const elevationLines = mockElevationFC;
    mapInstance.addSource("custom-elevation", { type: "geojson", data: elevationLines as any });
    mapInstance.addLayer({
      id: "custom-elevation-layer", type: "line", source: "custom-elevation",
      layout: { "line-join": "round", "line-cap": "round", "visibility": "visible" },
      paint: {
        "line-color": ["match", ["coalesce", ["get", "level"], "low"], "high", "#fcd34d", "medium", "#fb923c", "#8b5cf6"],
        "line-width": 2, "line-opacity": layerOpacity * 0.8, "line-dasharray": [2, 2]
      }
    });

    // Enforce initial visibility based on state
    layers.forEach(layer => {
      updateMapLayerVisibility(mapInstance, layer.id, layer.visible ? "visible" : "none");
    });
  }, [layers, updateMapLayerVisibility, layerOpacity, osmData]);

  // Update layer visibility when toggled
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    layers.forEach((layer) => {
      updateMapLayerVisibility(mapRef.current, layer.id, layer.visible ? "visible" : "none");
    });
  }, [layers, mapLoaded, updateMapLayerVisibility]);

  // Update layer opacity in real-time when it changes
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    try {
      const map = mapRef.current;

      const layerOpacities: Record<string, { property: string, factor: number }> = {
        "flood-zones-fill": { property: "fill-opacity", factor: 0.35 },
        "flood-zones-border": { property: "line-opacity", factor: 0.8 },
        "land-use-zones-fill": { property: "fill-opacity", factor: 0.35 },
        "land-use-zones-border": { property: "line-opacity", factor: 0.7 },
        "green-spaces-fill": { property: "fill-opacity", factor: 0.4 },
        "outage-zones-fill": { property: "fill-opacity", factor: 0.3 },
        "outage-zones-border": { property: "line-opacity", factor: 0.8 },
        "parking-zones-fill": { property: "fill-opacity", factor: 0.3 },
        "risk-heatmap": { property: "heatmap-opacity", factor: 1.0 },
        "risk-points-circle": { property: "circle-opacity", factor: 1.0 },
        "infrastructure-pts-layer": { property: "circle-opacity", factor: 1.0 },
        "shelters-pts-layer": { property: "circle-opacity", factor: 1.0 },
        "accident-hotspots-layer": { property: "circle-opacity", factor: 1.0 },
        "construction-sites-layer": { property: "circle-opacity", factor: 1.0 },
        "telecom-towers-layer": { property: "circle-opacity", factor: 1.0 },
        "substations-layer": { property: "circle-opacity", factor: 1.0 },
        "population-heatmap": { property: "heatmap-opacity", factor: 1.0 },
        "custom-rivers-layer": { property: "line-opacity", factor: 0.9 },
        "custom-roads-layer": { property: "line-opacity", factor: 0.9 },
        "custom-elevation-layer": { property: "line-opacity", factor: 0.8 }
      };

      Object.entries(layerOpacities).forEach(([lId, config]) => {
        if (map.getLayer(lId)) {
          map.setPaintProperty(lId, config.property, layerOpacity * config.factor);
        }
      });
    } catch (e) {
      console.warn("Opacity paint update warning:", e);
    }
  }, [layerOpacity, mapLoaded]);



  const handleZoom = (direction: "in" | "out") => {
    if (mapRef.current) {
      const currentZoom = mapRef.current.getZoom();
      mapRef.current.zoomTo(currentZoom + (direction === "in" ? 1 : -1), { duration: 300 });
    }
  };

  const handleResetView = () => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: center,
        zoom: config.mapbox.defaultZoom,
        pitch: 30,
        bearing: -10,
        duration: 1500,
      });
    }
  };

  const styles = [
    { id: "dark", label: "Dark", icon: "🌙" },
    { id: "satellite", label: "Satellite", icon: "🛰️" },
    { id: "light", label: "Light", icon: "☀️" },
    { id: "streets", label: "Streets", icon: "🛣️" },
    { id: "outdoors", label: "Outdoors", icon: "🏔️" },
  ];

  const handleStyleChange = (styleId: string) => {
    if (mapRef.current) {
      mapRef.current.setStyle(MAP_STYLES[styleId as keyof typeof MAP_STYLES]);
      setCurrentStyle(styleId);
      setShowStylePicker(false);
      // Re-add layers after style change
      mapRef.current.once("style.load", () => {
        addMockLayersToMap(mapRef.current, center, currentLocation);
      });
    }
  };

  // Fallback UI when Mapbox token is missing
  if (mapError) {
    const isCustomActive = layers.some((l) => l.id.startsWith("custom-") && l.visible);

    return (
      <div className="w-full h-full rounded-xl overflow-hidden relative bg-geo-card border border-geo-border">
        {/* Animated HUD Grid scanner when custom data is active */}
        {isCustomActive && (
          <div className="absolute inset-0 pointer-events-none z-30 font-mono text-[9px] text-primary-400 p-4 flex flex-col justify-between select-none">
            {/* Top HUD Row */}
            <div className="flex justify-between items-start">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-geo-darker/90 border border-primary-500/35 rounded-xl px-3 py-2 backdrop-blur-xl shadow-lg shadow-black/40 space-y-0.5"
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-gray-100 font-bold uppercase tracking-wider text-[8px]">RAG VECTOR AUDIT ACTIVE</span>
                </div>
                <p className="text-primary-400 font-semibold font-mono text-[8px]">REFERENCE: EPSG:4326 (WGS84)</p>
                <p className="text-gray-500 text-[8px]">GRID: Pune Catchment Bounds</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-geo-darker/90 border border-primary-500/35 rounded-xl px-3 py-2 backdrop-blur-xl shadow-lg shadow-black/40 text-right space-y-0.5"
              >
                <span className="text-gray-100 font-bold uppercase tracking-wider block text-[8px]">SATELLITE LOCK SECURED</span>
                <p className="text-emerald-400 font-semibold font-mono text-[8px]">100% SIGNAL CALIBRATED</p>
                <p className="text-gray-500 font-mono text-[8px]">TEL: 18.5204° N, 73.8567° E</p>
              </motion.div>
            </div>

            {/* Bottom HUD Row */}
            <div className="flex justify-between items-end">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-geo-darker/90 border border-primary-500/35 rounded-xl px-3 py-2 backdrop-blur-xl shadow-lg shadow-black/40 space-y-0.5"
              >
                <span className="text-gray-100 font-bold uppercase tracking-wider block text-[8px]">HIGH-RESOLUTION SENSORS</span>
                <p className="text-gray-400 font-semibold font-mono text-[8px]">GEOMETRY: active scanning</p>
                <p className="text-gray-500 text-[8px]">INDEXED NODE CHUNKS: 223</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-geo-darker/90 border border-primary-500/35 rounded-xl px-3 py-2 backdrop-blur-xl shadow-lg shadow-black/40 text-right space-y-0.5"
              >
                <span className="text-gray-100 font-bold uppercase tracking-wider block text-[8px]">ZONING COINCIDENCE AUDIT</span>
                <p className="text-amber-400 font-semibold font-mono text-[8px]">18.39% ENVIRONMENTAL DEVIATION</p>
                <p className="text-gray-500 font-mono text-[8px]">DEM BUFFER: 100-yr flood inundation</p>
              </motion.div>
            </div>
          </div>
        )}

        {/* Laser Sweep Scanner scan-line */}
        {isCustomActive && (
          <motion.div
            className="absolute left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary-500 to-transparent shadow-[0_0_8px_rgba(99,102,241,0.8)] z-25 pointer-events-none"
            animate={{
              top: ["0%", "100%", "0%"],
            }}
            transition={{
              duration: 5,
              ease: "easeInOut",
              repeat: Infinity,
            }}
          />
        )}

        {/* Animated gradient background simulating a map */}
        <div className="absolute inset-0">
          <div
            className={`absolute inset-0 transition-all duration-1000 ${isCustomActive
                ? "bg-gradient-to-br from-[#02131e] via-[#051c2c] to-[#012a4a]"
                : "bg-gradient-to-br from-[#0c1929] via-[#0a2540] to-[#0c3547]"
              }`}
          />
          {/* Grid pattern */}
          <div
            className={`absolute inset-0 transition-opacity duration-1000 ${isCustomActive ? "opacity-25" : "opacity-10"
              }`}
            style={{
              backgroundImage:
                "linear-gradient(rgba(6,182,212,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.3) 1px, transparent 1px)",
              backgroundSize: isCustomActive ? "30px 30px" : "40px 40px",
            }}
          />
          {/* Animated dots representing data points */}
          {Array.from({ length: 30 }).map((_, i) => {
            const layer = layers[i % layers.length];
            const isVisible = layer ? layer.visible : true;
            if (!isVisible) return null;
            return (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  left: `${10 + (Math.sin(i) * 0.5 + 0.5) * 80}%`,
                  top: `${10 + (Math.cos(i) * 0.5 + 0.5) * 80}%`,
                  width: 5 + (i % 3) * 2,
                  height: 5 + (i % 3) * 2,
                  backgroundColor:
                    layer && layer.id.startsWith("custom-")
                      ? layer.color
                      : i % 4 === 0
                        ? "#8b5cf6" // purple (Telecom/Urban)
                        : i % 4 === 1
                          ? "#f59e0b" // amber (Substations)
                          : i % 4 === 2
                            ? "#10b981" // emerald (Rivers)
                            : "#ef4444", // red (Risk/Gas)
                  opacity: layerOpacity,
                }}
                animate={{
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 2 + (i % 3),
                  repeat: Infinity,
                  delay: (i % 2) * 0.5,
                }}
              />
            );
          })}

          {/* Custom Uploaded Geometries Cluster (Fallback Mode) */}
          {layers.filter(l => l.id.startsWith("custom-") && l.visible).map((layer) => {
            return Array.from({ length: 12 }).map((_, idx) => {
              const angle = (idx / 12) * Math.PI * 2;
              const r = 10 + (idx % 3) * 6; // distance from map center
              const x = 50 + r * Math.cos(angle);
              const y = 50 + r * Math.sin(angle);

              return (
                <div
                  key={`custom-marker-${layer.id}-${idx}`}
                  className="absolute"
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    transform: "translate(-50%, -50%)",
                    zIndex: 40,
                  }}
                >
                  <motion.div
                    className="w-3.5 h-3.5 rounded-full border border-white shadow-lg relative flex items-center justify-center"
                    style={{ backgroundColor: layer.color }}
                    animate={{
                      scale: [1, 1.15, 1],
                    }}
                    transition={{
                      duration: 1.5 + (idx % 2) * 0.5,
                      repeat: Infinity,
                    }}
                  >
                    <span className="w-1.5 h-1.5 bg-white rounded-full" />
                    {/* Glowing pulse ring */}
                    <motion.div
                      className="absolute inset-0 rounded-full border opacity-75"
                      style={{ borderColor: layer.color }}
                      animate={{
                        scale: [1, 2.5],
                        opacity: [0.75, 0],
                      }}
                      transition={{
                        duration: 1.8,
                        repeat: Infinity,
                        delay: (idx % 3) * 0.4,
                      }}
                    />
                  </motion.div>
                </div>
              );
            });
          })}

          {/* River lines / Pipes */}
          {(!layers.find(l => l.id === "rivers" || l.id === "transit-routes" || l.id === "water-pipes") || layers.find(l => l.id === "rivers" || l.id === "transit-routes" || l.id === "water-pipes")?.visible) && (
            <svg className="absolute inset-0 w-full h-full" style={{ opacity: layerOpacity * 0.35 }}>
              <motion.path
                d="M 100 0 Q 200 150 150 300 Q 100 450 200 600 Q 300 750 250 900"
                stroke="#06b6d4"
                strokeWidth="4"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 3, ease: "easeInOut" }}
              />
              <motion.path
                d="M 400 0 Q 350 200 450 400 Q 550 500 400 700"
                stroke="#3b82f6"
                strokeWidth="3"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 3, delay: 0.5, ease: "easeInOut" }}
              />
            </svg>
          )}
          {/* Flood / Land use overlays */}
          {(!layers.find(l => l.id === "flood-zones" || l.id === "land-use-zones" || l.id === "outage-zones") || layers.find(l => l.id === "flood-zones" || l.id === "land-use-zones" || l.id === "outage-zones")?.visible) && (
            <>
              <motion.div
                className="absolute rounded-full bg-red-500/10 border border-red-500/20"
                style={{ width: 200, height: 200, left: "30%", top: "40%", opacity: layerOpacity * 0.5 }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 4, repeat: Infinity }}
              />
              <motion.div
                className="absolute rounded-full bg-amber-500/10 border border-amber-500/20"
                style={{ width: 150, height: 150, left: "55%", top: "25%", opacity: layerOpacity * 0.4 }}
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 5, repeat: Infinity, delay: 1 }}
              />
              <motion.div
                className="absolute rounded-full bg-emerald-500/10 border border-emerald-500/20"
                style={{ width: 180, height: 180, left: "15%", top: "60%", opacity: layerOpacity * 0.35 }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 3.5, repeat: Infinity, delay: 0.5 }}
              />
            </>
          )}
        </div>

        {/* ACTIVE STUDY AREA BADGE */}
        {boundaryData && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-black/80 backdrop-blur-md border border-primary-500/50 rounded-2xl px-6 py-3 shadow-[0_0_30px_-5px_rgba(6,182,212,0.6)] flex flex-col items-center justify-center pointer-events-auto"
            >
              <div className="flex items-center gap-2 mb-0.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[9px] font-bold tracking-[0.15em] text-primary-400 uppercase">Active Study Area</span>
              </div>
              <h2 className="text-sm font-black text-white uppercase tracking-wider">{currentLocation.split(',')[0]}</h2>
              <div className="flex items-center gap-3 mt-1 text-[9px] text-gray-400 font-medium">
                <span>Area: Approx {(boundaryData.importance * 1000).toFixed(0)} km²</span>
                <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                <span className="flex items-center gap-1 text-emerald-400">Boundary Loaded <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span>
              </div>
            </motion.div>
          </div>
        )}

        {/* Center info */}
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8 text-center max-w-md"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-cyan-500 flex items-center justify-center mx-auto mb-4">
              <Satellite size={28} className="text-white" />
            </div>
            <h3 className="text-lg font-bold mb-2">Interactive Map View</h3>
            <p className="text-sm text-gray-400 mb-4">
              Add your Mapbox access token to enable the full interactive map experience with flood zones, heatmaps, and real-time data layers.
            </p>
            <div className="text-xs text-gray-500 bg-geo-dark/50 rounded-lg p-3 font-mono">
              Set NEXT_PUBLIC_MAPBOX_TOKEN in .env.local
            </div>
            <p className="text-xs text-gray-500 mt-3">
              The demo visualization above shows simulated flood risk data points and zone boundaries.
            </p>
          </motion.div>
        </div>

        {/* Map Controls (decorative) */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
          <button className="w-9 h-9 glass-card flex items-center justify-center text-gray-400 hover:text-primary-400 transition-colors">
            <ZoomIn size={16} />
          </button>
          <button className="w-9 h-9 glass-card flex items-center justify-center text-gray-400 hover:text-primary-400 transition-colors">
            <ZoomOut size={16} />
          </button>
          <button
            onClick={onToggleFullscreen}
            className="w-9 h-9 glass-card flex items-center justify-center text-gray-400 hover:text-primary-400 transition-colors"
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 glass-card p-3 z-20">
          <p className="text-xs font-semibold mb-2 text-gray-300">Risk Levels</p>
          <div className="space-y-1.5">
            {[
              { color: "#10b981", label: "Low Risk" },
              { color: "#f59e0b", label: "Medium Risk" },
              { color: "#ef4444", label: "High Risk" },
              { color: "#dc2626", label: "Critical" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-xs text-gray-400">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
                {item.label}
              </div>
            ))}
          </div>
        </div>

        {/* Coordinates display */}
        <div className="absolute bottom-4 right-4 glass-card px-3 py-1.5 z-20">
          <span className="text-xs font-mono text-gray-500">
            {center[1].toFixed(4)}°N, {center[0].toFixed(4)}°E
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full rounded-xl overflow-hidden relative">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Map Controls Overlay */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
        <button
          onClick={() => handleZoom("in")}
          className="w-9 h-9 glass-card flex items-center justify-center text-gray-400 hover:text-primary-400 transition-colors"
          title="Zoom In"
        >
          <ZoomIn size={16} />
        </button>
        <button
          onClick={() => handleZoom("out")}
          className="w-9 h-9 glass-card flex items-center justify-center text-gray-400 hover:text-primary-400 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut size={16} />
        </button>
        <button
          onClick={handleResetView}
          className="w-9 h-9 glass-card flex items-center justify-center text-gray-400 hover:text-primary-400 transition-colors"
          title="Reset View"
        >
          <Crosshair size={16} />
        </button>
        <button
          onClick={onToggleFullscreen}
          className="w-9 h-9 glass-card flex items-center justify-center text-gray-400 hover:text-primary-400 transition-colors"
          title="Fullscreen"
        >
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
        <div className="relative">
          <button
            onClick={() => setShowStylePicker(!showStylePicker)}
            className="w-9 h-9 glass-card flex items-center justify-center text-gray-400 hover:text-primary-400 transition-colors"
            title="Map Style"
          >
            <Layers size={16} />
          </button>
          {showStylePicker && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="absolute right-12 top-0 glass-card p-2 min-w-[140px] z-30"
            >
              {styles.map((style) => (
                <button
                  key={style.id}
                  onClick={() => handleStyleChange(style.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${currentStyle === style.id
                      ? "bg-primary-500/20 text-primary-300"
                      : "text-gray-400 hover:bg-white/5"
                    }`}
                >
                  <span>{style.icon}</span>
                  <span>{style.label}</span>
                </button>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 glass-card p-3 z-20 transition-all duration-300">
        <p className="text-xs font-semibold mb-2 text-gray-300">
          {layers.find(l => l.id === "population")?.visible ? "Population Density" :
            (layers.find(l => l.id === "roads")?.visible || layers.find(l => l.id === "power-grid")?.visible) && !layers.find(l => l.id === "flood-zones")?.visible && !layers.find(l => l.id === "land-use-zones")?.visible ? (dashboardMode === "traffic" ? "Road Congestion Levels" : dashboardMode === "utility" ? "Grid Power Load" : "Network Coverage") :
              layers.find(l => l.id === "elevation")?.visible ? "Elevation / Terrain" :
                dashboardMode === "traffic" ? "Congestion Levels" :
                  dashboardMode === "urban" ? "Zoning Classifications" :
                    dashboardMode === "utility" ? "Asset Outage Severity" :
                      "Risk Levels"}
        </p>
        <div className="space-y-1.5">
          {(layers.find(l => l.id === "population")?.visible ? [
            { color: "#047857", label: "High Density" },
            { color: "#10b981", label: "Medium Density" },
            { color: "#6ee7b7", label: "Low Density" },
          ] : (layers.find(l => l.id === "roads")?.visible || layers.find(l => l.id === "power-grid")?.visible) && !layers.find(l => l.id === "flood-zones")?.visible && !layers.find(l => l.id === "land-use-zones")?.visible ? [
            { color: "#dc2626", label: dashboardMode === "traffic" ? "High Congestion" : dashboardMode === "utility" ? "Peak Load (Critical)" : "High Risk" },
            { color: "#f59e0b", label: dashboardMode === "traffic" ? "Medium Traffic" : dashboardMode === "utility" ? "Moderate Load" : "Medium Risk" },
            { color: "#10b981", label: dashboardMode === "traffic" ? "Clear / Low" : dashboardMode === "utility" ? "Normal Load" : "Low Risk" },
          ] : layers.find(l => l.id === "elevation")?.visible && !layers.find(l => l.id === "flood-zones")?.visible && !layers.find(l => l.id === "land-use-zones")?.visible ? [
            { color: "#fcd34d", label: "High Elevation" },
            { color: "#fb923c", label: "Medium Elevation" },
            { color: "#8b5cf6", label: "Low / Basin" },
          ] : dashboardMode === "urban" ? [
            { color: "#8b5cf6", label: "Residential" },
            { color: "#f59e0b", label: "Commercial" },
            { color: "#ef4444", label: "Industrial" },
            { color: "#10b981", label: "Green Reserve" },
          ] : [
            { color: "#10b981", label: "Low Risk / Normal" },
            { color: "#f59e0b", label: "Medium Risk" },
            { color: "#ef4444", label: "High Risk" },
            { color: "#dc2626", label: "Critical" },
          ]).map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-xs text-gray-400">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
              {item.label}
            </div>
          ))}
        </div>
      </div>

      {/* Coordinates */}
      <div className="absolute bottom-4 right-4 glass-card px-3 py-1.5 z-20">
        <span className="text-xs font-mono text-gray-500">
          {center[1].toFixed(4)}°N, {center[0].toFixed(4)}°E
        </span>
      </div>

      {/* Loading overlay */}
      {!mapLoaded && !mapError && (
        <div className="absolute inset-0 bg-geo-dark/80 flex items-center justify-center z-30">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-10 h-10 border-2 border-primary-500/30 border-t-primary-500 rounded-full"
          />
        </div>
      )}
    </div>
  );
}
