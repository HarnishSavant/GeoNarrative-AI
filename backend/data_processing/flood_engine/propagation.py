import numpy as np
import heapq

class FloodPropagator:
    def __init__(self, dem, river_mask, resistance, distance, susceptibility, config):
        self.dem = dem
        self.river_mask = river_mask
        self.resistance = resistance
        self.distance = distance
        self.susceptibility = susceptibility
        self.config = config
        
        self.rows, self.cols = dem.shape
        self.weights = config["propagation_weights"]
        
        # Calculate cost surface
        self.cost_surface = self._build_cost_surface()

    def _build_cost_surface(self):
        # Normalize inputs 0-1
        def normalize(arr):
            min_val = np.nanmin(arr)
            max_val = np.nanmax(arr)
            if max_val == min_val: return np.zeros_like(arr)
            return (arr - min_val) / (max_val - min_val)
            
        dist_norm = normalize(self.distance)
        res_norm = normalize(self.resistance)
        susc_norm = normalize(self.susceptibility)
        
        # Invert susceptibility (high susceptibility = low cost penalty)
        susc_penalty = 1.0 - susc_norm
        
        cost = (self.weights["distance_penalty"] * dist_norm +
                self.weights["surface_resistance"] * res_norm +
                self.weights["susceptibility_penalty"] * susc_penalty)
        return cost

    def run_scenario(self, scenario):
        frames = []
        max_cost = scenario["max_cost_threshold"]
        water_level_rise = scenario["water_level_rise_m"]
        num_frames = scenario["frames"]
        
        # Priority Queue for cost-distance
        # Format: (cost, r, c, water_level)
        pq = []
        visited = np.zeros((self.rows, self.cols), dtype=bool)
        arrival_time = np.full((self.rows, self.cols), -1, dtype=int)
        water_depth = np.zeros((self.rows, self.cols), dtype=float)
        
        # Initialize with river
        river_cells = np.argwhere(self.river_mask == 1)
        for r, c in river_cells:
            if not np.isnan(self.dem[r, c]):
                # Initial water level at river is DEM + base depth. We add scenario rise.
                base_wl = self.dem[r, c] + water_level_rise
                heapq.heappush(pq, (0.0, r, c, base_wl))
                visited[r, c] = True
                
        # Simulate temporal progression over frames
        cost_increment = max_cost / num_frames
        
        for frame_idx in range(num_frames):
            current_max_cost = cost_increment * (frame_idx + 1)
            
            # Pop elements while cost <= current_max_cost
            while pq and pq[0][0] <= current_max_cost:
                current_cost, r, c, current_wl = heapq.heappop(pq)
                
                # Calculate depth
                if self.dem[r, c] < current_wl:
                    water_depth[r, c] = current_wl - self.dem[r, c]
                    arrival_time[r, c] = frame_idx if arrival_time[r, c] == -1 else arrival_time[r, c]
                
                # Expand 8-neighbours
                for dr in [-1, 0, 1]:
                    for dc in [-1, 0, 1]:
                        if dr == 0 and dc == 0: continue
                        nr, nc = r + dr, c + dc
                        
                        if 0 <= nr < self.rows and 0 <= nc < self.cols:
                            if not visited[nr, nc] and not np.isnan(self.dem[nr, nc]):
                                neighbor_elev = self.dem[nr, nc]
                                
                                # Hydrological constraint: Water can only flow if it can reach the cell
                                # Allow uphill flow if water level > neighbor elevation, else heavy penalty
                                elev_diff = neighbor_elev - current_wl
                                
                                elev_penalty = 0
                                if elev_diff > 0:
                                    elev_penalty = elev_diff * self.weights["uphill_penalty"]
                                else:
                                    # Downhill flow should not be heavily penalized
                                    elev_penalty = 0.0 
                                
                                step_cost = self.cost_surface[nr, nc] + elev_penalty
                                new_cost = current_cost + step_cost
                                
                                # Slight reduction in water level as it propagates (friction)
                                next_wl = current_wl - (step_cost * 0.05)
                                
                                if next_wl > neighbor_elev and new_cost <= max_cost:
                                    visited[nr, nc] = True
                                    heapq.heappush(pq, (new_cost, nr, nc, next_wl))
            
            # Save frame state
            frame_depth = np.copy(water_depth)
            frames.append({
                "frame": frame_idx,
                "depth": frame_depth,
                "wet_mask": frame_depth > 0
            })
            
        return frames, arrival_time
