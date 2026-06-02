# syntax=docker/dockerfile:1
# LexOS monorepo — multi-target build (api / web / workers / migrate / seed)
# Build: docker compose build
# Targets: api | web | worker-pipeline | worker-scheduler | migrate | seed-admin

FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY workers/pipeline/package.json workers/pipeline/
COPY workers/scheduler/package.json workers/scheduler/
COPY packages/shared/package.json packages/shared/
RUN npm ci

FROM deps AS build-shared
COPY packages/shared packages/shared
COPY tsconfig.json ./
RUN npm run build -w @lexos/shared

FROM build-shared AS build-web
ARG API_URL=http://api:4000
ENV API_URL=${API_URL}
ENV NODE_ENV=production
COPY apps/web apps/web
RUN npm run build -w @lexos/web

# --- Shared runtime base (API / workers / CLI) ---
FROM node:20-bookworm-slim AS runtime-base
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build-shared /app/packages/shared ./packages/shared
COPY package.json package-lock.json ./
COPY tsconfig.json ./
COPY supabase ./supabase
COPY apps/api ./apps/api
COPY workers/pipeline ./workers/pipeline
COPY workers/scheduler ./workers/scheduler

FROM runtime-base AS api
EXPOSE 4000
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:4000/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["npm", "run", "start", "-w", "@lexos/api"]

FROM runtime-base AS worker-pipeline
RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg \
  && rm -rf /var/lib/apt/lists/* \
  && mkdir -p /tmp/lexos
ENV FFMPEG_PATH=ffmpeg
ENV WORKER_TMP_DIR=/tmp/lexos
VOLUME ["/tmp/lexos"]
CMD ["npm", "run", "start", "-w", "@lexos/worker-pipeline"]

FROM runtime-base AS worker-scheduler
CMD ["npm", "run", "start", "-w", "@lexos/worker-scheduler"]

FROM runtime-base AS migrate
CMD ["npm", "run", "db:push"]

FROM runtime-base AS seed-admin
CMD ["npm", "run", "seed:admin"]

# --- Next.js standalone (U1 Web) ---
FROM node:20-bookworm-slim AS web
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
COPY --from=build-web /app/apps/web/.next/standalone ./
COPY --from=build-web /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build-web /app/apps/web/public ./apps/web/public
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=5s --start-period=45s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:3000/').then((r)=>process.exit(r.ok||r.status===307||r.status===308?0:1)).catch(()=>process.exit(1))"
CMD ["node", "apps/web/server.js"]
