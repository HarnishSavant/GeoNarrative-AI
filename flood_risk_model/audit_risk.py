import psycopg2

conn = psycopg2.connect("host=localhost port=5432 dbname=geonarrative user=postgres password=root")
cur = conn.cursor()
cur.execute("SELECT raw_risk_score FROM flood_risk")
scores = sorted([float(r[0]) for r in cur.fetchall() if r[0] is not None])

n = len(scores)
print("--- Score Statistics ---")
print(f"Total Features: {n}")
print(f"Min Score: {scores[0]:.4f}")
print(f"Max Score: {scores[-1]:.4f}")
print(f"Mean Score: {sum(scores)/n:.4f}")
print(f"Median Score: {scores[n//2]:.4f}")

print("\n--- Histogram (10 Bins) ---")
min_s, max_s = scores[0], scores[-1]
if max_s == min_s: max_s += 0.001
bin_w = (max_s - min_s) / 10
bins = [min_s + i*bin_w for i in range(11)]
counts = [0]*10
for s in scores:
    for i in range(10):
        if i == 9:
            if bins[i] <= s <= bins[i+1]: counts[i]+=1
        else:
            if bins[i] <= s < bins[i+1]: counts[i]+=1
            
for i in range(10):
    print(f"Bin {bins[i]:.4f} - {bins[i+1]:.4f}: {counts[i]} features")

print("\n--- NTILE(5) Boundaries (Quantiles) ---")
q = [scores[int(n*0.2)], scores[int(n*0.4)], scores[int(n*0.6)], scores[int(n*0.8)], scores[-1]]
print(f"Very Low (<20%): < {q[0]:.4f}")
print(f"Low (20-40%): {q[0]:.4f} - {q[1]:.4f}")
print(f"Moderate (40-60%): {q[1]:.4f} - {q[2]:.4f}")
print(f"High (60-80%): {q[2]:.4f} - {q[3]:.4f}")
print(f"Very High (>80%): > {q[3]:.4f}")
