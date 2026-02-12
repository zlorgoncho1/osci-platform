#!/bin/sh
# Crée ou met à jour l'admin du realm osci avec les identifiants depuis .env
# (KEYCLOAK_REALM_ADMIN_USER / KEYCLOAK_REALM_ADMIN_EMAIL / KEYCLOAK_REALM_ADMIN_PASSWORD)

set -e
KEYCLOAK_URL="${KEYCLOAK_URL:-http://keycloak:8080}"
REALM="${KEYCLOAK_REALM:-osci}"
KEYCLOAK_CLIENT_ID="${KEYCLOAK_CLIENT_ID:-osci-web}"
WEB_APP_URL="${WEB_APP_URL:-}"

echo "Waiting for Keycloak..."
# /health/ready peut être absent sur l'image standard ; on attend que le realm master réponde
until curl -sf --max-time 5 "${KEYCLOAK_URL}/realms/master" > /dev/null; do
  sleep 2
done
echo "Keycloak is ready."

# Token master realm (admin principal)
RESP=$(curl -s -X POST "${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=${KEYCLOAK_ADMIN}" \
  -d "password=${KEYCLOAK_ADMIN_PASSWORD}" \
  -d "grant_type=password" \
  -d "client_id=admin-cli")
TOKEN=$(printf '%s' "$RESP" | sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p')

if [ -z "$TOKEN" ]; then
  echo "Failed to get admin token."
  exit 1
fi

csv_to_json_array() {
  printf '%s' "$1" | jq -R -s -c 'split(",") | map(gsub("^\\s+|\\s+$";"")) | map(select(length>0))'
}

csv_to_json_array_with_suffix() {
  suffix="$1"
  shift
  printf '%s' "$1" | jq -R -s -c --arg s "$suffix" 'split(",") | map(gsub("^\\s+|\\s+$";"")) | map(select(length>0) | . + $s)'
}

REDIRECT_URIS_JSON="null"
WEB_ORIGINS_JSON="null"
ROOT_URL=""

if [ -n "${KEYCLOAK_WEB_REDIRECT_URIS}" ]; then
  REDIRECT_URIS_JSON=$(csv_to_json_array "${KEYCLOAK_WEB_REDIRECT_URIS}")
elif [ -n "${WEB_APP_URL}" ]; then
  REDIRECT_URIS_JSON=$(csv_to_json_array_with_suffix "/*" "${WEB_APP_URL}")
fi

if [ -n "${KEYCLOAK_WEB_ORIGINS}" ]; then
  WEB_ORIGINS_JSON=$(csv_to_json_array "${KEYCLOAK_WEB_ORIGINS}")
elif [ -n "${WEB_APP_URL}" ]; then
  WEB_ORIGINS_JSON=$(csv_to_json_array "${WEB_APP_URL}")
fi

if [ "${REDIRECT_URIS_JSON}" = "[]" ]; then
  REDIRECT_URIS_JSON="null"
fi
if [ "${WEB_ORIGINS_JSON}" = "[]" ]; then
  WEB_ORIGINS_JSON="null"
fi

if [ -n "${WEB_APP_URL}" ]; then
  ROOT_URL=$(printf '%s' "${WEB_APP_URL}" | awk -F',' '{gsub(/^[ \t]+|[ \t]+$/, "", $1); print $1}')
fi

if [ "${REDIRECT_URIS_JSON}" != "null" ] || [ "${WEB_ORIGINS_JSON}" != "null" ] || [ -n "${ROOT_URL}" ]; then
  CLIENT_UUID=$(curl -s -X GET "${KEYCLOAK_URL}/admin/realms/${REALM}/clients?clientId=${KEYCLOAK_CLIENT_ID}" \
    -H "Authorization: Bearer ${TOKEN}" | jq -r ".[0].id // empty")
  if [ -z "$CLIENT_UUID" ]; then
    echo "Warning: Keycloak client not found: ${KEYCLOAK_CLIENT_ID}. Skipping redirect/origin update."
  else
    CLIENT_JSON=$(curl -s -X GET "${KEYCLOAK_URL}/admin/realms/${REALM}/clients/${CLIENT_UUID}" \
      -H "Authorization: Bearer ${TOKEN}")
    UPDATED_JSON=$(printf "%s" "$CLIENT_JSON" | jq \
      --argjson redirectUris "${REDIRECT_URIS_JSON}" \
      --argjson webOrigins "${WEB_ORIGINS_JSON}" \
      --arg rootUrl "${ROOT_URL}" \
      '.
      | (if $redirectUris != null and ($redirectUris | length) > 0 then .redirectUris = $redirectUris else . end)
      | (if $webOrigins != null and ($webOrigins | length) > 0 then .webOrigins = $webOrigins else . end)
      | (if ($rootUrl | length) > 0 then .rootUrl = $rootUrl | .baseUrl = $rootUrl | .adminUrl = $rootUrl else . end)
      | (if $redirectUris != null and ($redirectUris | length) > 0 then .attributes["post.logout.redirect.uris"] = ($redirectUris | join("##")) else . end)
      ' )
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "${KEYCLOAK_URL}/admin/realms/${REALM}/clients/${CLIENT_UUID}" \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json" \
      -d "${UPDATED_JSON}")
    if [ "$HTTP_CODE" = "204" ] || [ "$HTTP_CODE" = "200" ]; then
      echo "Keycloak client updated: ${KEYCLOAK_CLIENT_ID}"
    else
      echo "Warning: could not update Keycloak client (HTTP $HTTP_CODE)."
    fi
  fi
fi

# Email : pris depuis KEYCLOAK_REALM_ADMIN_EMAIL si défini, sinon déduit du username
if [ -n "${KEYCLOAK_REALM_ADMIN_EMAIL}" ]; then
  REALM_ADMIN_EMAIL="${KEYCLOAK_REALM_ADMIN_EMAIL}"
else
  case "${KEYCLOAK_REALM_ADMIN_USER}" in
    *@*) REALM_ADMIN_EMAIL="${KEYCLOAK_REALM_ADMIN_USER}" ;;
    *)   REALM_ADMIN_EMAIL="${KEYCLOAK_REALM_ADMIN_USER}@localhost" ;;
  esac
fi

# Email encodé pour les paramètres d'URL
REALM_ADMIN_EMAIL_ENC=$(printf '%s' "${REALM_ADMIN_EMAIL}" | sed 's/@/%40/g')

# Chercher si l'utilisateur existe déjà (par username puis par email)
USERS_JSON=$(curl -s -X GET "${KEYCLOAK_URL}/admin/realms/${REALM}/users?username=${KEYCLOAK_REALM_ADMIN_USER}&exact=true" \
  -H "Authorization: Bearer ${TOKEN}")
USER_ID=$(printf '%s' "$USERS_JSON" | sed -n 's/.*"id":"\([a-f0-9-]*\)".*/\1/p' | head -1)
if [ -z "$USER_ID" ]; then
  USERS_JSON=$(curl -s -X GET "${KEYCLOAK_URL}/admin/realms/${REALM}/users?email=${REALM_ADMIN_EMAIL_ENC}&exact=true" \
    -H "Authorization: Bearer ${TOKEN}")
  USER_ID=$(printf '%s' "$USERS_JSON" | sed -n 's/.*"id":"\([a-f0-9-]*\)".*/\1/p' | head -1)
fi

if [ -n "$USER_ID" ]; then
  echo "Realm admin already exists: ${KEYCLOAK_REALM_ADMIN_USER}. Skipping."
  exit 0
fi

echo "Creating realm admin user: ${KEYCLOAK_REALM_ADMIN_USER} (email: ${REALM_ADMIN_EMAIL})"
  # Création sans credentials ni realmRoles (Keycloak peut renvoyer 400 sinon)
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${KEYCLOAK_URL}/admin/realms/${REALM}/users" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{
      \"username\": \"${KEYCLOAK_REALM_ADMIN_USER}\",
      \"email\": \"${REALM_ADMIN_EMAIL}\",
      \"emailVerified\": true,
      \"enabled\": true,
      \"firstName\": \"OSCI\",
      \"lastName\": \"Administrator\"
    }")
  if [ "$HTTP_CODE" != "201" ] && [ "$HTTP_CODE" != "204" ]; then
    echo "Failed to create user (HTTP $HTTP_CODE)."
    exit 1
  fi
  echo "Realm admin user created."

  # Récupérer l'id du nouvel utilisateur (par email, puis par username — Keycloak peut stocker l'email comme username)
  sleep 1
  USERS_JSON=$(curl -s -X GET "${KEYCLOAK_URL}/admin/realms/${REALM}/users?email=${REALM_ADMIN_EMAIL_ENC}&exact=true" \
    -H "Authorization: Bearer ${TOKEN}")
  USER_ID=$(printf '%s' "$USERS_JSON" | sed -n 's/.*"id":"\([a-f0-9-]*\)".*/\1/p' | head -1)
  if [ -z "$USER_ID" ]; then
    USERS_JSON=$(curl -s -X GET "${KEYCLOAK_URL}/admin/realms/${REALM}/users?username=${KEYCLOAK_REALM_ADMIN_USER}&exact=true" \
      -H "Authorization: Bearer ${TOKEN}")
    USER_ID=$(printf '%s' "$USERS_JSON" | sed -n 's/.*"id":"\([a-f0-9-]*\)".*/\1/p' | head -1)
  fi
  if [ -z "$USER_ID" ]; then
    USERS_JSON=$(curl -s -X GET "${KEYCLOAK_URL}/admin/realms/${REALM}/users?username=${REALM_ADMIN_EMAIL_ENC}&exact=true" \
      -H "Authorization: Bearer ${TOKEN}")
    USER_ID=$(printf '%s' "$USERS_JSON" | sed -n 's/.*"id":"\([a-f0-9-]*\)".*/\1/p' | head -1)
  fi
  if [ -z "$USER_ID" ]; then
    echo "Could not find created user id (searched by email and username)."
    exit 1
  fi

  # Définir le mot de passe (requête séparée)
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "${KEYCLOAK_URL}/admin/realms/${REALM}/users/${USER_ID}/reset-password" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"type\":\"password\",\"value\":\"${KEYCLOAK_REALM_ADMIN_PASSWORD}\",\"temporary\":false}")
  if [ "$HTTP_CODE" != "204" ] && [ "$HTTP_CODE" != "200" ]; then
    echo "Failed to set password (HTTP $HTTP_CODE)."
    exit 1
  fi
  echo "Password set."

  # Assigner les rôles realm (SecurityAdmin + default-roles-osci) via l'API role-mappings
  ROLE_SECURITY_ADMIN=$(curl -s -X GET "${KEYCLOAK_URL}/admin/realms/${REALM}/roles/SecurityAdmin" -H "Authorization: Bearer ${TOKEN}" | tr -d '\n')
  ROLE_DEFAULT=$(curl -s -X GET "${KEYCLOAK_URL}/admin/realms/${REALM}/roles/default-roles-osci" -H "Authorization: Bearer ${TOKEN}" | tr -d '\n')
  if [ -n "$ROLE_SECURITY_ADMIN" ] && [ -n "$ROLE_DEFAULT" ]; then
    ROLES_JSON="[${ROLE_SECURITY_ADMIN},${ROLE_DEFAULT}]"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${KEYCLOAK_URL}/admin/realms/${REALM}/users/${USER_ID}/role-mappings/realm" \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json" \
      -d "$ROLES_JSON")
    if [ "$HTTP_CODE" = "204" ] || [ "$HTTP_CODE" = "200" ]; then
      echo "Realm roles assigned (SecurityAdmin, default-roles-osci)."
    else
      echo "Warning: could not assign realm roles (HTTP $HTTP_CODE)."
    fi
  else
    echo "Warning: could not fetch realm roles for assignment."
  fi
