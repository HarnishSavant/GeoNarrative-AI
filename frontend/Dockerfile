# =====================================================================
#   1. STAGE: COMPILING FRONTEND DEPENDENCIES
# =====================================================================
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install standard packages
COPY package*.json ./
RUN npm ci || npm install

# =====================================================================
#   2. STAGE: BUILDING NEXT.JS OPTIMIZED TELEMETRY
# =====================================================================
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set dynamic API URL variable for production compilation
ENV NEXT_PUBLIC_API_URL=http://localhost:8000
RUN npm run build

# =====================================================================
#   3. STAGE: COMPACT RUNTIME DEPLOYMENT
# =====================================================================
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy static assets and compiled output
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nextjs

EXPOSE 3000

# Start production server
CMD ["npm", "run", "start"]
