#!/bin/bash
# =============================================================================
# OSCI Platform - Runtime Environment Variable Substitution
# =============================================================================
# This script replaces environment variables in env.js and nginx.conf at
# container startup, allowing the same Docker image to be used across
# environments without rebuilding.
# =============================================================================

set -e

ENV_FILE="/usr/share/nginx/html/assets/env.js"
NGINX_CONF="/etc/nginx/conf.d/default.conf"

# Inject runtime environment variables into env.js
if [ -n "$KEYCLOAK_URL" ] || [ -n "$API_URL" ]; then
  echo "Injecting runtime environment variables into ${ENV_FILE}..."
  cat > "$ENV_FILE" << EOF
window.__env = {
  KEYCLOAK_URL: '${KEYCLOAK_URL:-http://localhost:8080}',
  KEYCLOAK_REALM: '${KEYCLOAK_REALM:-osci}',
  KEYCLOAK_CLIENT_ID: '${KEYCLOAK_CLIENT_ID:-osci-web}',
  API_URL: '${API_URL:-/api}'
};
EOF
  echo "Environment variables injected successfully."
fi

# Update nginx CSP to allow connections to the Keycloak URL
KEYCLOAK_CSP_URL="${KEYCLOAK_URL:-http://localhost:8080}"
sed -i "s|__KEYCLOAK_CSP_URL__|${KEYCLOAK_CSP_URL}|g" "$NGINX_CONF"
echo "Nginx CSP updated with Keycloak URL: ${KEYCLOAK_CSP_URL}"

exec "$@"
