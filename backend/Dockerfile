# =====================================================================
#   PRODUCTION BUILD FOR GEONARRATIVE BACKEND
# =====================================================================
FROM python:3.11-slim as builder

# Set system build parameters
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install system-level build tools and network utils
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies in a isolated path
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt


# =====================================================================
#   FINAL COMPACT PRODUCTION IMAGE RUNNER
# =====================================================================
FROM python:3.11-slim

WORKDIR /app

# Copy compiled dependencies and system dynamic libraries
COPY --from=builder /install /usr/local
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy backend codebase
COPY . .

# Expose microservices routing port
EXPOSE 8000

# Run FastAPI under Uvicorn in production cluster mode
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
