// GeoNarrative AI — Executive Intelligence Data Engine
// Provides mode-specific analytics, scores, charts, and recommendations for each Digital Twin mode.

import { DashboardMode } from './types';

// ============================================================================
// COMPOSITE SCORE GENERATORS
// ============================================================================

export interface CompositeScores {
  riskScore: number;
  resilienceScore: number;
  sustainabilityScore: number;
  riskLabel: string;
  resilienceLabel: string;
  sustainabilityLabel: string;
  riskColor: string;
  resilienceColor: string;
  sustainabilityColor: string;
}

export function getCompositeScores(mode: DashboardMode, riskSummary: any[], exposureSummary: any[]): CompositeScores {
  const totalHex = riskSummary.reduce((a, c) => a + (c.hex_count || 0), 0);
  const highHex = riskSummary.filter(r => r.risk_class === 'Very High' || r.risk_class === 'High').reduce((a, c) => a + (c.hex_count || 0), 0);
  const highRatio = totalHex > 0 ? highHex / totalHex : 0.3;

  const base: Record<DashboardMode, { risk: number; resilience: number; sustainability: number }> = {
    terrain:        { risk: 38, resilience: 72, sustainability: 68 },
    hydrology:      { risk: 62, resilience: 54, sustainability: 58 },
    infrastructure: { risk: 45, resilience: 61, sustainability: 64 },
    population:     { risk: 56, resilience: 48, sustainability: 52 },
    environment:    { risk: 34, resilience: 66, sustainability: 74 },
  };

  const b = base[mode] || base.hydrology;
  const riskScore = Math.min(99, Math.round(b.risk + highRatio * 30));
  const resilienceScore = Math.max(10, Math.round(b.resilience - highRatio * 15));
  const sustainabilityScore = Math.max(10, Math.round(b.sustainability - highRatio * 10));

  const scoreLabel = (s: number) => s >= 75 ? 'Critical' : s >= 55 ? 'High' : s >= 35 ? 'Moderate' : 'Low';
  const resLabel = (s: number) => s >= 70 ? 'Strong' : s >= 50 ? 'Moderate' : s >= 30 ? 'Weak' : 'Critical';
  const susLabel = (s: number) => s >= 70 ? 'Good' : s >= 50 ? 'Fair' : s >= 30 ? 'Poor' : 'Critical';

  const riskColor = riskScore >= 75 ? '#ef4444' : riskScore >= 55 ? '#f97316' : riskScore >= 35 ? '#f59e0b' : '#10b981';
  const resColor = resilienceScore >= 70 ? '#10b981' : resilienceScore >= 50 ? '#f59e0b' : '#ef4444';
  const susColor = sustainabilityScore >= 70 ? '#10b981' : sustainabilityScore >= 50 ? '#f59e0b' : '#ef4444';

  return {
    riskScore, resilienceScore, sustainabilityScore,
    riskLabel: scoreLabel(riskScore), resilienceLabel: resLabel(resilienceScore), sustainabilityLabel: susLabel(sustainabilityScore),
    riskColor, resilienceColor: resColor, sustainabilityColor: susColor,
  };
}

// ============================================================================
// MODE-SPECIFIC OVERVIEW KPIS
// ============================================================================

export interface IntelKPI {
  label: string;
  value: string;
  sub: string;
  color: string;
}

export function getOverviewKPIs(mode: DashboardMode, riskSummary: any[], exposureSummary: any[], criticalInfra: any[], shelters: any[]): IntelKPI[] {
  const totalHex = riskSummary.reduce((a, c) => a + (c.hex_count || 0), 0);
  const highHex = riskSummary.filter(r => r.risk_class === 'Very High' || r.risk_class === 'High').reduce((a, c) => a + (c.hex_count || 0), 0);
  const bldgExp = exposureSummary.filter(e => e.asset_type === 'Buildings').reduce((a, c) => a + (c.metric_value || 0), 0);
  const roadExp = exposureSummary.filter(e => e.asset_type === 'Roads (m)').reduce((a, c) => a + (c.metric_value || 0), 0) / 1000;

  const kpis: Record<DashboardMode, IntelKPI[]> = {
    terrain: [
      { label: 'DEM Coverage', value: '100%', sub: 'SRTM 30m', color: '#8b5cf6' },
      { label: 'Mean Elevation', value: '560m', sub: 'MSL', color: '#6366f1' },
      { label: 'Steep Slopes', value: '12%', sub: '>15°', color: '#f59e0b' },
      { label: 'Stability Index', value: '88%', sub: 'Geotechnical', color: '#10b981' },
    ],
    hydrology: [
      { label: 'Flood Cells', value: totalHex.toLocaleString(), sub: 'Active hexagons', color: '#3b82f6' },
      { label: 'High Risk Area', value: `${Math.round(highHex * 0.25)} km²`, sub: `${totalHex > 0 ? Math.round((highHex / totalHex) * 100) : 0}% coverage`, color: '#ef4444' },
      { label: 'River Network', value: '186 km', sub: 'Mapped length', color: '#0ea5e9' },
      { label: 'Max Flood Depth', value: '2.4m', sub: 'Estimated peak', color: '#f97316' },
    ],
    infrastructure: [
      { label: 'Buildings Exposed', value: bldgExp.toLocaleString(), sub: 'In hazard zones', color: '#f59e0b' },
      { label: 'Roads Exposed', value: `${roadExp.toFixed(1)} km`, sub: 'Network segments', color: '#64748b' },
      { label: 'Critical Facilities', value: criticalInfra.length.toString(), sub: 'At risk', color: '#ef4444' },
      { label: 'Safe Shelters', value: shelters.length.toString(), sub: 'Available', color: '#10b981' },
    ],
    population: [
      { label: 'Pop. at Risk', value: (bldgExp * 4.2).toLocaleString(undefined, { maximumFractionDigits: 0 }), sub: 'Estimated', color: '#f59e0b' },
      { label: 'Vulnerable Clusters', value: '14', sub: 'High density', color: '#ef4444' },
      { label: 'Shelter Capacity', value: (shelters.length * 500).toLocaleString(), sub: 'Max persons', color: '#10b981' },
      { label: 'Evacuation Routes', value: '8', sub: 'Active corridors', color: '#8b5cf6' },
    ],
    environment: [
      { label: 'NDVI Mean', value: '0.42', sub: 'Moderate cover', color: '#22c55e' },
      { label: 'Green Cover Loss', value: '8.5%', sub: 'Past 5 years', color: '#ef4444' },
      { label: 'Heat Island Zones', value: '12', sub: 'Thermal anomalies', color: '#f59e0b' },
      { label: 'Eco Health Index', value: 'Fair', sub: 'Composite score', color: '#10b981' },
    ],
  };
  return kpis[mode] || kpis.hydrology;
}

// ============================================================================
// MODE-SPECIFIC RISK CHART DATA
// ============================================================================

export interface ChartDataItem {
  name: string;
  value: number;
  color: string;
}

export function getRiskChartData(mode: DashboardMode, riskSummary: any[]): { title: string; data: ChartDataItem[]; type: 'bar' | 'pie' } {
  if ((mode === 'hydrology' || mode === 'infrastructure' || mode === 'population') && riskSummary.length > 0) {
    const COLORS: Record<string, string> = { 'Very Low': '#10b981', 'Low': '#3b82f6', 'Moderate': '#f59e0b', 'High': '#f97316', 'Very High': '#ef4444' };
    return {
      title: mode === 'hydrology' ? 'Flood Risk Distribution' : mode === 'infrastructure' ? 'Infrastructure Risk Zones' : 'Population Risk Exposure',
      data: riskSummary.map(r => ({ name: r.risk_class, value: r.hex_count, color: COLORS[r.risk_class] || '#cbd5e1' })),
      type: 'pie',
    };
  }

  const modeCharts: Record<DashboardMode, { title: string; data: ChartDataItem[]; type: 'bar' | 'pie' }> = {
    terrain: {
      title: 'Elevation Distribution',
      data: [
        { name: '0-200m', value: 120, color: '#10b981' },
        { name: '200-400m', value: 450, color: '#3b82f6' },
        { name: '400-600m', value: 890, color: '#8b5cf6' },
        { name: '600-800m', value: 600, color: '#f59e0b' },
        { name: '>800m', value: 200, color: '#ef4444' },
      ],
      type: 'bar',
    },
    hydrology: { title: 'Flood Risk', data: [], type: 'pie' },
    infrastructure: { title: 'Infra Risk', data: [], type: 'pie' },
    population: { title: 'Pop Risk', data: [], type: 'pie' },
    environment: {
      title: 'Land Cover Classification',
      data: [
        { name: 'Built-up', value: 42, color: '#ef4444' },
        { name: 'Vegetation', value: 28, color: '#22c55e' },
        { name: 'Water', value: 8, color: '#3b82f6' },
        { name: 'Barren', value: 12, color: '#f59e0b' },
        { name: 'Agriculture', value: 10, color: '#10b981' },
      ],
      type: 'pie',
    },
  };
  return modeCharts[mode] || modeCharts.hydrology;
}

// ============================================================================
// MODE-SPECIFIC EXPOSURE DATA
// ============================================================================

export interface ExposureItem {
  category: string;
  value: number;
  unit: string;
  severity: 'critical' | 'high' | 'moderate' | 'low';
}

export function getExposureData(mode: DashboardMode, exposureSummary: any[], criticalInfra: any[]): ExposureItem[] {
  const bldg = exposureSummary.filter(e => e.asset_type === 'Buildings').reduce((a, c) => a + (c.metric_value || 0), 0);
  const roads = exposureSummary.filter(e => e.asset_type === 'Roads (m)').reduce((a, c) => a + (c.metric_value || 0), 0);
  const hospitals = criticalInfra.filter(c => c.facility_type === 'Hospital' || c.type === 'Hospital').length;
  const schools = criticalInfra.filter(c => c.facility_type === 'School' || c.type === 'School').length;

  const items: Record<DashboardMode, ExposureItem[]> = {
    terrain: [
      { category: 'Landslide Prone Area', value: 8.2, unit: 'km²', severity: 'high' },
      { category: 'Erosion Risk Zones', value: 15, unit: 'sites', severity: 'moderate' },
      { category: 'Unstable Slopes', value: 12, unit: '%', severity: 'high' },
      { category: 'Cut-Fill Violations', value: 23, unit: 'sites', severity: 'critical' },
    ],
    hydrology: [
      { category: 'Buildings in Flood Zone', value: bldg || 2450, unit: 'structures', severity: 'critical' },
      { category: 'Road Network Exposed', value: Math.round(roads / 1000) || 45, unit: 'km', severity: 'high' },
      { category: 'Hospitals at Risk', value: hospitals || 6, unit: 'facilities', severity: 'critical' },
      { category: 'Schools at Risk', value: schools || 12, unit: 'facilities', severity: 'high' },
    ],
    infrastructure: [
      { category: 'Buildings Exposed', value: bldg || 2450, unit: 'structures', severity: 'critical' },
      { category: 'Road Segments', value: Math.round(roads / 1000) || 45, unit: 'km', severity: 'high' },
      { category: 'Power Substations', value: 4, unit: 'facilities', severity: 'moderate' },
      { category: 'Water Treatment', value: 2, unit: 'plants', severity: 'high' },
    ],
    population: [
      { category: 'People at Direct Risk', value: Math.round((bldg || 2450) * 4.2), unit: 'persons', severity: 'critical' },
      { category: 'Elderly Population', value: 12, unit: '%', severity: 'high' },
      { category: 'Children (<14)', value: 24, unit: '%', severity: 'high' },
      { category: 'Below Poverty Line', value: 18, unit: '%', severity: 'moderate' },
    ],
    environment: [
      { category: 'Green Cover Loss', value: 8.5, unit: '%', severity: 'high' },
      { category: 'Wetland Encroachment', value: 3.2, unit: 'km²', severity: 'critical' },
      { category: 'Air Quality Violations', value: 45, unit: 'days/yr', severity: 'moderate' },
      { category: 'Noise Pollution Zones', value: 8, unit: 'areas', severity: 'low' },
    ],
  };
  return items[mode] || items.hydrology;
}

// ============================================================================
// MODE-SPECIFIC SUSTAINABILITY METRICS
// ============================================================================

export interface SustainabilityMetric {
  indicator: string;
  score: number;
  target: number;
  sdg: string;
  trend: 'up' | 'down' | 'stable';
}

export function getSustainabilityMetrics(mode: DashboardMode): SustainabilityMetric[] {
  const metrics: Record<DashboardMode, SustainabilityMetric[]> = {
    terrain: [
      { indicator: 'Slope Stability Compliance', score: 72, target: 90, sdg: 'SDG 11', trend: 'stable' },
      { indicator: 'Erosion Control Coverage', score: 58, target: 85, sdg: 'SDG 15', trend: 'down' },
      { indicator: 'Land Use Efficiency', score: 65, target: 80, sdg: 'SDG 11', trend: 'up' },
      { indicator: 'Geological Survey Coverage', score: 82, target: 95, sdg: 'SDG 9', trend: 'up' },
    ],
    hydrology: [
      { indicator: 'Flood Early Warning', score: 45, target: 90, sdg: 'SDG 13', trend: 'up' },
      { indicator: 'Drainage Infrastructure', score: 38, target: 80, sdg: 'SDG 6', trend: 'down' },
      { indicator: 'Stormwater Management', score: 52, target: 85, sdg: 'SDG 11', trend: 'stable' },
      { indicator: 'River Health Index', score: 41, target: 75, sdg: 'SDG 6', trend: 'down' },
    ],
    infrastructure: [
      { indicator: 'Seismic Compliance', score: 68, target: 95, sdg: 'SDG 9', trend: 'up' },
      { indicator: 'Road Quality Index', score: 55, target: 80, sdg: 'SDG 9', trend: 'stable' },
      { indicator: 'Public Transit Access', score: 62, target: 90, sdg: 'SDG 11', trend: 'up' },
      { indicator: 'Utility Redundancy', score: 42, target: 75, sdg: 'SDG 7', trend: 'down' },
    ],
    population: [
      { indicator: 'Evacuation Readiness', score: 35, target: 85, sdg: 'SDG 11', trend: 'up' },
      { indicator: 'Healthcare Access', score: 58, target: 90, sdg: 'SDG 3', trend: 'stable' },
      { indicator: 'Shelter Availability', score: 42, target: 80, sdg: 'SDG 11', trend: 'up' },
      { indicator: 'Community Awareness', score: 28, target: 75, sdg: 'SDG 4', trend: 'down' },
    ],
    environment: [
      { indicator: 'Carbon Sequestration', score: 52, target: 80, sdg: 'SDG 13', trend: 'down' },
      { indicator: 'Biodiversity Index', score: 45, target: 75, sdg: 'SDG 15', trend: 'down' },
      { indicator: 'Water Body Health', score: 38, target: 70, sdg: 'SDG 6', trend: 'stable' },
      { indicator: 'Urban Greening Target', score: 55, target: 85, sdg: 'SDG 11', trend: 'up' },
    ],
  };
  return metrics[mode] || metrics.hydrology;
}

// ============================================================================
// MODE-SPECIFIC AI RECOMMENDATIONS
// ============================================================================

export interface AIRecommendation {
  priority: 'critical' | 'high' | 'medium';
  title: string;
  description: string;
  impact: string;
  timeline: string;
}

export function getAIRecommendations(mode: DashboardMode): AIRecommendation[] {
  const recs: Record<DashboardMode, AIRecommendation[]> = {
    terrain: [
      { priority: 'critical', title: 'Restrict Construction on >30° Slopes', description: 'Enforce geotechnical assessment requirement for all construction permits in steep terrain zones.', impact: 'Prevents 60% of potential landslide casualties', timeline: 'Immediate' },
      { priority: 'high', title: 'Deploy Slope Monitoring Sensors', description: 'Install IoT-based inclinometers in 12 identified high-risk slope areas for real-time monitoring.', impact: 'Early warning system for 15,000 residents', timeline: '3-6 months' },
      { priority: 'medium', title: 'Reforestation of Denuded Slopes', description: 'Plant native deep-root species across 8.2 km² of erosion-prone terrain to stabilize soil.', impact: 'Reduces erosion by 40%', timeline: '12-18 months' },
    ],
    hydrology: [
      { priority: 'critical', title: 'Upgrade Drainage in Ward C', description: 'Ward C has the lowest drainage density (1.2 km/km²). Immediate capacity expansion needed.', impact: 'Protects 12,000+ residents from recurrent flooding', timeline: 'Immediate' },
      { priority: 'critical', title: 'Relocate 6 At-Risk Hospitals', description: 'Six healthcare facilities are within Very High flood risk zones. Establish backup operations in safe zones.', impact: 'Ensures healthcare continuity for 50,000+ people', timeline: '1-3 months' },
      { priority: 'high', title: 'Install Flood Early Warning System', description: 'Deploy IoT water level sensors across 4 primary watersheds with SMS-based community alerts.', impact: '45-minute advance flood warning capability', timeline: '3-6 months' },
    ],
    infrastructure: [
      { priority: 'critical', title: 'Structural Audit of Exposed Buildings', description: 'Conduct emergency structural assessments on buildings within Very High risk zones.', impact: 'Identifies unsafe structures before next monsoon', timeline: 'Immediate' },
      { priority: 'high', title: 'Harden Power Grid Infrastructure', description: 'Elevate 4 flood-exposed power substations and install waterproof switchgear.', impact: 'Prevents city-wide power outages during floods', timeline: '3-6 months' },
      { priority: 'high', title: 'Bridge Vulnerability Assessment', description: 'Assess structural integrity of 12 bridges crossing flood-prone waterways.', impact: 'Prevents critical transport disruption', timeline: '1-3 months' },
    ],
    population: [
      { priority: 'critical', title: 'Establish Community Evacuation Plans', description: 'Develop and drill ward-level evacuation protocols for 14 high-density vulnerable clusters.', impact: 'Reduces evacuation time by 60%', timeline: 'Immediate' },
      { priority: 'high', title: 'Expand Shelter Capacity', description: 'Current shelter capacity serves only 35% of at-risk population. Identify and equip additional facilities.', impact: 'Full coverage for 100% of vulnerable population', timeline: '3-6 months' },
      { priority: 'medium', title: 'Deploy Vulnerable Person Registry', description: 'Create a geo-tagged database of elderly, disabled, and at-risk individuals for priority evacuation.', impact: 'Targeted rescue for highest-need groups', timeline: '1-3 months' },
    ],
    environment: [
      { priority: 'critical', title: 'Halt Wetland Encroachment', description: 'Enforce strict no-development buffer zones around 3.2 km² of encroached wetlands.', impact: 'Restores natural flood attenuation capacity', timeline: 'Immediate' },
      { priority: 'high', title: 'Urban Tree Canopy Expansion', description: 'Plant 50,000 native trees to reverse 8.5% green cover loss and reduce urban heat islands.', impact: 'Reduces surface temperature by 2-3°C', timeline: '6-12 months' },
      { priority: 'high', title: 'Permeable Surface Mandate', description: 'Require 30% permeable surface coverage in all new commercial developments.', impact: 'Reduces urban runoff by 25%', timeline: '3-6 months' },
    ],
  };
  return recs[mode] || recs.hydrology;
}

// ============================================================================
// MODE METADATA
// ============================================================================

export const MODE_META: Record<DashboardMode, { label: string; color: string; gradient: string; icon: string }> = {
  terrain:        { label: 'Terrain Twin',        color: '#8b5cf6', gradient: 'from-violet-600 to-indigo-500',   icon: '🏔️' },
  hydrology:      { label: 'Hydrology Twin',      color: '#3b82f6', gradient: 'from-blue-600 to-cyan-500',      icon: '🌊' },
  infrastructure: { label: 'Infrastructure Twin',  color: '#10b981', gradient: 'from-emerald-500 to-teal-500',  icon: '🏗️' },
  population:     { label: 'Population Twin',      color: '#f59e0b', gradient: 'from-amber-500 to-orange-500',  icon: '👥' },
  environment:    { label: 'Environmental Twin',   color: '#22c55e', gradient: 'from-green-500 to-emerald-400', icon: '🌿' },
};
