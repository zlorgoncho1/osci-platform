# =============================================================================
# OSCI Platform - Web Dockerfile (Angular + Nginx)
# Multi-stage build for minimal production image
# =============================================================================
# Build context: project root (.)
# WORKDIR mirrors the repo layout so angular.json "../../docs" resolves.
# =============================================================================

# ---------------------------------------------------------------------------
# Stage 1: Build
# ---------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /build/apps/web

COPY apps/web/package*.json ./
RUN npm ci --ignore-scripts

# Copy web application source
COPY apps/web/ .

# Copy docs directory (angular.json asset: "input": "../../docs" → /build/docs/)
COPY docs/ /build/docs/

ARG KEYCLOAK_URL=http://localhost:8080
ARG KEYCLOAK_REALM=osci
ARG KEYCLOAK_CLIENT_ID=osci-web
ARG API_URL=http://localhost:3000

# Write environment config at build time
RUN echo "window.__env = { KEYCLOAK_URL: '${KEYCLOAK_URL}', KEYCLOAK_REALM: '${KEYCLOAK_REALM}', KEYCLOAK_CLIENT_ID: '${KEYCLOAK_CLIENT_ID}', API_URL: '${API_URL}' };" > src/assets/env.js

RUN npm run build -- --configuration=production

# ---------------------------------------------------------------------------
# Stage 2: Production (Nginx)
# ---------------------------------------------------------------------------
FROM nginx:1.27-alpine

RUN apk add --no-cache bash

COPY --from=builder /build/apps/web/dist/osci-web/browser /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# Runtime env substitution script
COPY apps/web/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1:80/ || exit 1

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
