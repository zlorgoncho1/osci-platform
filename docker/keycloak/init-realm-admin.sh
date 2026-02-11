#!/bin/sh
# Crée ou met à jour l'admin du realm osci avec les identifiants depuis .env
# (KEYCLOAK_REALM_ADMIN_USER / KEYCLOAK_REALM_ADMIN_EMAIL / KEYCLOAK_REALM_ADMIN_PASSWORD)

set -e
KEYCLOAK_URL="${KEYCLOAK_URL:-http://keycloak:8080}"
REALM="${KEYCLOAK_REALM:-osci}"

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
