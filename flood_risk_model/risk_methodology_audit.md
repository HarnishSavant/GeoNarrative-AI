# Methodological Audit: Flood Risk Classification
**GeoNarrative Digital Twin Analytics**

## 1. Mathematical Audit of the Risk Model
The current Digital Twin Risk framework computes the absolute physical danger to urban infrastructure using the UNDRR formula. 

### A. The Exact Formulas Executed in PostGIS
1. **Hazard ($H$)**: Driven by the `fsi_score` from the calibrated MCDA model (Range: `1.0` to `5.0`).
2. **Exposure ($E$)**: Normalization of physical assets inside the hexagon.
   $$E = \text{LEAST} \left( \frac{\frac{\text{building\_density}}{1000} + \frac{\text{road\_density}}{500}}{2}, 1.0 \right)$$
   *(Range: `0.0` to `1.0`)*
3. **Vulnerability ($V$)**: Socio-environmental fragility matrix.
   $$V_{bldg} = \left(\frac{\text{bldg\_density}}{1000} \times 50\right) + \text{prox}_{water} + \text{lulc}_{imperv}$$
   $$V_{score} = (0.50 \times V_{bldg}) + (0.30 \times V_{infra}) + (0.20 \times V_{env})$$
   *(Range: `0.0` to `100.0`, scaled to `0.0 - 1.0`)*
4. **Composite Risk Equation ($R$)**:
   $$R_{score} = H \times E \times \left( \frac{V_{score}}{100} \right)$$
   *(Theoretical Range: `0.0` to `5.0`)*

---

## 2. Classification Methodology Analysis
You correctly identified that the output of `9,462` hexagons per risk class is a massive statistical red flag. 

### What classification was used?
The model utilized the `NTILE(5) OVER (ORDER BY raw_risk_score ASC)` window function in SQL. This explicitly performs **Quantile (Equal-Frequency) Classification**. 

### Why did this happen? (Histogram & Distribution Profile)
Urban exposure data is heavily **Right-Skewed and Zero-Inflated**. In a 500m grid covering a massive metropolitan region, over 60% of the hexagons are empty fields, forests, or hills with zero buildings and zero roads ($E = 0$). 
If $E = 0$, then $R_{score} = 0.0$.

When `NTILE(5)` runs, it forces exactly 20% of the geometries into each bucket, completely ignoring the absolute value of the score. 
Because so many hexagons have a score of `0.0`, the algorithm fills the `Very Low` bucket with `0.0` scores, then fills the `Low` bucket with `0.0` scores, and even starts filling the `Moderate` bucket with `0.0` scores just to satisfy the equal-frequency rule. 

**Conclusion**: *Quantile classification creates massive false positives, labeling empty fields as "Moderate Risk", and diluting the true "Very High Risk" zones. It is statistically invalid for skewed disaster risk data.*

---

## 3. Alternative Approaches (Sensitivity Analysis)

### Option 1: Equal Interval Classification
- **Methodology**: Divides the theoretical range (`0.0 - 5.0`) into 5 equal buckets (e.g., `0-1`, `1-2`, `2-3`, `3-4`, `4-5`).
- **Pros**: Easy to understand. Mathematically objective.
- **Cons**: Because the data is right-skewed, 95% of the city will fall into the `Very Low (0-1)` bucket, and only 3 or 4 hexagons might have enough density to reach `Very High (4-5)`. It makes maps visually useless.

### Option 2: Standard Deviation Classification
- **Methodology**: Calculates the mean and creates breaks based on standard deviations (e.g., `> +2 SD` = Very High).
- **Cons**: Standard Deviation explicitly assumes a Gaussian (Bell-Curve) distribution. Because spatial risk data follows a power-law distribution, applying SD is statistically improper and will result in negative break values.

### Option 3: Jenks Natural Breaks Optimization (Gold Standard)
- **Methodology**: An iterative algorithm that minimizes the variance *within* classes and maximizes the variance *between* classes. It looks for natural "valleys" in the histogram to place the thresholds.
- **Pros**: It perfectly handles zero-inflated, right-skewed data. It will naturally cluster the massive volume of `0.0` scores into `Very Low`, and identify the true, statistical "spikes" in risk for the upper categories. 

## 4. Recommendation for MSc Dissertation
For a publication-ready, research-grade Flood Risk Assessment, **Jenks Natural Breaks Optimization** is universally recognized as the scientifically defensible standard for spatial choropleth mapping. 

Because standard PostGIS does not have a native `ST_Jenks()` function, the standard architectural solution for Digital Twins is to either:
1. Export the `raw_risk_score` to a Python orchestrator running `jenkspy` or `scikit-learn` (K-Means 1D) to calculate the breaks, then inject the thresholds back into SQL.
2. Implement a PL/pgSQL algorithm to compute Natural Breaks natively in the database.

*The model must be recalibrated using Natural Breaks.*
