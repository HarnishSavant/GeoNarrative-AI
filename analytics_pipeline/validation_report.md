# GeoNarrative Spatial Validation & Analytics Report
**Database:** geonarrative | **PostGIS Version:** 3.3
---
## 1. Vector Layers Validation (Post-CRS Fix)
| Layer | Row Count | Valid Geoms | SRID | Extent |
|---|---|---|---|---|
| buildings | 339732 | 339732 | 4326 | POLYGON((73.36781530000007 17.... |
| roads | 146162 | 146162 | 4326 | POLYGON((73.33285889000007 17.... |
| railways | 1027 | 1027 | 4326 | POLYGON((73.36607751900004 18.... |
| waterways | 1444 | 1444 | 4326 | POLYGON((73.34236329700008 17.... |
| transport | 901 | 901 | 4326 | POLYGON((73.37670920000005 18.... |
| places | 1039 | 1039 | 4326 | POLYGON((73.33627220000005 17.... |
| pois | 14921 | 14921 | 4326 | POLYGON((73.33515500000004 17.... |
| landuse | 7451 | 7451 | 4326 | POLYGON((73.33301419900005 17.... |
| natural | 19325 | 19325 | 4326 | POLYGON((73.33460930000007 18.... |
| protected | 8 | 8 | 4326 | POLYGON((73.40695092500005 18.... |

## 2. Raster Validation & Terrain Statistics
| Raster Layer | SRID | Dimensions | Mean Stat | Min Stat | Max Stat |
|---|---|---|---|---|---|
| dem_raster | 4326 | 256x256 | 598.01 | 566.47 | 823.96 |
| lulc_raster | 4326 | 256x256 | 3.09 | N/A | 6.00 |
| dem_slope | 4326 | 256x256 | 2.76 | N/A | 42.23 |
| dem_aspect | 4326 | 256x256 | 169.73 | -1.00 | 360.00 |
| dem_hillshade | 4326 | 256x256 | 179.52 | 27.94 | 253.84 |

## 3. Hexagonal Analytical Layer Summary
Summary statistics for the 500m Pune Analytical Grid:
| Metric | Average | Maximum | Minimum |
|---|---|---|---|
| Building Density | 7.5 | 1887 | 0 |
| Distance to Waterways (m) | 11841.7 | 86394.8 | 0.0 |

**Total Hexagons:** 47310