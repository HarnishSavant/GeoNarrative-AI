# GeoNarrative AI: Production Deployment Guide

This document outlines the standard operating procedures for deploying the GeoNarrative AI Digital Twin system into a production enterprise environment (e.g., AWS, Azure, On-Premise Municipal Servers).

---

## 1. System Requirements

### Hardware Specifications (Minimum Production)
- **Database Server (PostGIS):** 8 vCPUs, 32GB RAM, 500GB NVMe SSD (Optimized for raster/vector spatial queries).
- **Backend Application Server (FastAPI):** 4 vCPUs, 16GB RAM.
- **Frontend Web Server (Node/Nginx):** 2 vCPUs, 8GB RAM.
- **Network:** Minimum 1Gbps internal networking for heavy GIS payload delivery.

### Software Requirements
- OS: Ubuntu 22.04 LTS (Recommended)
- Docker (v24+) and Docker Compose (v2+)
- Nginx (Reverse Proxy & SSL Termination)
- SSL/TLS Certificates (Let's Encrypt / Enterprise Wildcard)

---

## 2. Environment Configuration

Before deployment, ensure all secrets are securely provisioned. Never commit `.env` files to version control.

### Frontend (`frontend/.env.production`)
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
NEXT_PUBLIC_ARCGIS_API_KEY=your_production_arcgis_key
NEXT_PUBLIC_CESIUM_ION_TOKEN=your_production_cesium_token
NEXT_PUBLIC_MAPBOX_TOKEN=your_production_mapbox_token
```

### Backend (`backend/.env`)
```env
DATABASE_URL=postgresql://user:password@db_host:5432/geonarrative_db
JWT_SECRET_KEY=your_secure_random_string
OPENAI_API_KEY=your_production_openai_key
ENVIRONMENT=production
ALLOWED_ORIGINS=https://yourdomain.com
```

---

## 3. Dockerized Deployment

GeoNarrative AI utilizes a multi-container Docker Compose architecture for seamless orchestration.

### Step 3.1: Build Images
```bash
docker-compose -f docker-compose.prod.yml build
```

### Step 3.2: Database Migration & Seeding
```bash
# Start the database specifically
docker-compose -f docker-compose.prod.yml up -d db

# Run Alembic migrations
docker-compose -f docker-compose.prod.yml run --rm backend alembic upgrade head

# Run the geospatial seed script
docker-compose -f docker-compose.prod.yml run --rm backend python scripts/seed_gis_data.py
```

### Step 3.3: Launch Services
```bash
docker-compose -f docker-compose.prod.yml up -d
```

---

## 4. Reverse Proxy Configuration (NGINX)

Configure NGINX to route traffic to the Frontend (Next.js) and Backend (FastAPI).

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Gzip Compression for heavy GIS payloads
    gzip on;
    gzip_types text/plain application/json application/javascript text/css;

    # Frontend Routing
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_addrs;
    }

    # Backend API Routing
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        
        # Extended timeouts for heavy ML/Geoprocessing tasks
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
```

---

## 5. Maintenance & Monitoring

### Logging
Backend logs are tracked via Python `logging` and accessible via Docker:
```bash
docker logs geonarrative_backend_1 -f
```

### Backup Routine (PostGIS)
Set up a daily cron job using `pg_dump`:
```bash
pg_dump -U postgres -h localhost -F c -b -v -f "/backups/geo_db_$(date +%F).backup" geonarrative_db
```

### CI/CD Pipeline
It is recommended to deploy GeoNarrative via GitHub Actions or GitLab CI. The pipeline should:
1. Run `pytest` on the backend.
2. Run `npm run lint` and `npm run build` on the frontend.
3. Build and push Docker images to your Enterprise Container Registry.
4. Trigger a rolling update on the production Swarm or Kubernetes cluster.
