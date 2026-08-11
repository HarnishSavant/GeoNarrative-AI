import mapboxgl from 'mapbox-gl';

export class UnifiedPopupManager {
  private map: mapboxgl.Map;
  private popup: mapboxgl.Popup | null = null;
  private registeredLayers: string[] = [];

  constructor(map: mapboxgl.Map) {
    this.map = map;
  }

  public registerLayer(layerId: string, popupType: 'point' | 'polygon', titleFallback: string, color: string) {
    if (this.registeredLayers.includes(layerId)) return;
    this.registeredLayers.push(layerId);

    this.map.on('click', layerId, (e: any) => {
      const props = e.features[0].properties;
      this.showPopup(e.lngLat, props, popupType, titleFallback, color);
    });

    this.map.on('mouseenter', layerId, () => {
      this.map.getCanvas().style.cursor = 'pointer';
    });

    this.map.on('mouseleave', layerId, () => {
      this.map.getCanvas().style.cursor = '';
    });
  }

  private showPopup(lngLat: mapboxgl.LngLat, props: any, type: 'point' | 'polygon', titleFallback: string, color: string) {
    if (this.popup) {
      this.popup.remove();
    }

    const title = props.name || titleFallback;
    
    // Safely extract properties, falling back to 'N/A' if missing
    const getVal = (key: string) => props[key] ?? 'N/A';
    
    // Calculate pseudo-area for polygons if turf isn't used directly here, but we can just show N/A or what's in props
    const area = props.area ? `${parseFloat(props.area).toFixed(2)} sq m` : 'N/A';
    
    // Ensure coordinates are formatted
    const coords = `${lngLat.lat.toFixed(5)}, ${lngLat.lng.toFixed(5)}`;
    const fields = [
      { label: 'Flood Susceptibility', value: getVal('flood_susceptibility') || getVal('susceptibility') },
      { label: 'Flood Risk', value: getVal('risk_level') || getVal('risk_class') },
      { label: 'Population', value: getVal('population') },
      { label: 'Buildings', value: getVal('buildings') || getVal('building_count') },
      { label: 'Road Length', value: getVal('road_length') ? `${getVal('road_length')} km` : 'N/A' },
      { label: 'LULC', value: getVal('lulc') || getVal('land_use') },
      { label: 'Coordinates', value: coords },
      { label: 'Area', value: area },
      { label: 'Geometry Type', value: type === 'point' ? 'Point' : 'Polygon' }
    ];

    let detailsStr = '';
    fields.forEach(f => {
      if (f.value !== 'N/A') {
        detailsStr += `
          <div style="color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em;">${f.label}</div>
          <div style="font-weight: 600; color: #1e293b; font-size: 13px; margin-bottom: 6px;">${f.value}</div>
        `;
      }
    });

    const html = `
      <div style="font-family: 'Inter', sans-serif; padding: 6px 4px;">
        <div style="display: flex; items-center; gap: 8px; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
          <div style="width: 12px; h-12px; background-color: ${color}; border-radius: 2px;"></div>
          <div style="font-weight: 700; font-size: 14px; color: #0f172a; margin-top: -2px;">${title}</div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; row-gap: 8px;">
          ${detailsStr}
        </div>
      </div>
    `;

    this.popup = new mapboxgl.Popup({ closeButton: true, className: "geo-popup-light", maxWidth: "320px" })
      .setLngLat(lngLat)
      .setHTML(html)
      .addTo(this.map);
  }

  public cleanup() {
    if (this.popup) {
      this.popup.remove();
    }
  }
}
