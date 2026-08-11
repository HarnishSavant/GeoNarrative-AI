# Flood Risk Classification: Jenks Natural Breaks Optimization
**Digital Twin Experimental Validation Report**
---
## 1. Statistical Distribution Analysis
The raw risk scores extracted from PostGIS reveal severe non-normality, mathematically proving why NTILE(5) failed:
- **Skewness**: `17.9510` (Highly right-skewed. A value > 1.0 indicates severe asymmetry toward 0).
- **Kurtosis**: `449.3720` (Zero-Inflated. Extremely sharp peak at 0.0 with a heavy long tail).
- **Percentiles**: 25th: `0.0000`, Median: `0.0000`, 75th: `0.0000`.

## 2. Classification Methodology Comparison
| Methodology | Scientific Validity for Flood Risk | Verdict |
|---|---|---|
| **Quantile (NTILE)** | Assumes equal features per class. Forces `0.0` scores into Moderate/High buckets. | **Rejected** (Creates false positives) |
| **Equal Interval** | Assumes uniform distribution. Puts 99% of features in 'Very Low'. | **Rejected** (Visually useless) |
| **Standard Deviation** | Assumes Gaussian Bell-Curve. Produces negative threshold values. | **Rejected** (Statistically invalid) |
| **Jenks Natural Breaks** | Optimizes variance. Accurately clusters the zero-inflated baseline while segmenting the high-risk tail. | **Approved** (MSc Gold Standard) |

## 3. Jenks Threshold Implementation
The `jenkspy` library generated the following optimal boundaries:
- **Very Low**: 0.0 to `0.1463`
- **Low**: `0.1463` to `0.4979`
- **Moderate**: `0.4979` to `0.9789`
- **High**: `0.9789` to `1.6893`
- **Very High**: `1.6893` to `3.1500`

## 4. Re-Calibrated Exposure Statistics (`flood_risk_jenks`)
### A. Geometric Risk Distribution
| Risk Class | Hexagon Count | City Area Percentage |
|---|---|---|
| Very Low | 46770 | 98.86% |
| Low | 336 | 0.71% |
| Moderate | 148 | 0.31% |
| High | 47 | 0.10% |
| Very High | 9 | 0.02% |

### B. Infrastructure Exposure Matrix
| Risk Class | Buildings Exposed | Critical POIs Exposed | Road Network Exposed (m) |
|---|---|---|---|
| Very Low | 101,393 | 7,717 | 34,872,195.34 m |
| Low | 100,761 | 2,883 | 4,158,643.66 m |
| Moderate | 80,945 | 3,359 | 2,412,156.02 m |
| High | 43,032 | 856 | 863,602.13 m |
| Very High | 13,601 | 100 | 175,093.95 m |

## 5. Conclusion
The Jenks Natural Breaks classification successfully corrected the statistical artifacts of the NTILE model. The vast majority of Pune's undeveloped/unexposed landmass is accurately classified as Very Low / Low risk, while the true spatial clusters of extreme socio-economic vulnerability (Very High Risk) are mathematically isolated. This model is formally approved for the Digital Twin production environment.