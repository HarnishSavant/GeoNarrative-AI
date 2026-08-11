# Urban Flood Susceptibility Model: Validation & Sensitivity Report
**Methodology**: Multi-Criteria Decision Analysis (MCDA) with Statistical Quantile Classification
---
## 1. Classification Output Distribution
| Risk Class | Hexagon Count | Percentage |
|---|---|---|
| Very Low | 180 | 0.38% |
| Low | 5317 | 11.24% |
| Moderate | 25502 | 53.90% |
| High | 15943 | 33.70% |
| Very High | 368 | 0.78% |

## 2. MCDA Calibration Audit
### AHP Weights Applied:
- **Elevation**: 0.35
- **Distance to Waterways**: 0.25
- **Slope**: 0.20
- **Land Use / Land Cover (LULC)**: 0.10
- **Building Density**: 0.10

### Factor Normalization Strategy (1 to 5 Discrete Scale):
Global Min-Max normalization was replaced with statistically and hydrologically robust discrete scaling to correct the right-tail skew:
1. **Elevation**: Quantile Distribution (`NTILE(5)`). Lowest 20% = Score 5.
2. **Slope**: Hydrologic limits. `< 2 deg` = Score 5, `> 15 deg` = Score 1.
3. **Distance to Waterways**: Buffers. `< 100m` = Score 5, `> 2000m` = Score 1.
4. **Building Density**: Quantile Distribution (`NTILE(5)`). Highest 20% = Score 5.
5. **LULC**: Imperviousness mapping. Built-up/Water = Score 5, Forest = Score 1.

### Final Classification Thresholds (FSI):
The final Flood Susceptibility Index (FSI) ranges from 1.0 to 5.0.
- **Very Low**: 1.0 - 1.8
- **Low**: 1.8 - 2.6
- **Moderate**: 2.6 - 3.4
- **High**: 3.4 - 4.2
- **Very High**: 4.2 - 5.0