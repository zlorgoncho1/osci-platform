# OSCI Platform

**Open Security Checklist IDP** -- A Zero Trust security checklist platform for managing, tracking, and auditing security compliance across your organization.

OSCI provides a structured approach to security assessments with role-based access control, evidence management, policy-as-code authorization, and full audit trails.

---

## Quick Start

**Prerequisites:** Docker and Docker Compose v2 installed.

```bash
# 1. Clone the repository
git clone <repository-url>
cd security-checklist-idp

# 2. Configure environment
cp env.example .env
# Edit .env and change ALL default passwords

# 3. Start all services
docker compose up -d
```

The platform will be ready in approximately 60-90 seconds. The **realm admin** (OSCI application admin) is created automatically at first start from `KEYCLOAK_REALM_ADMIN_USER` and `KEYCLOAK_REALM_ADMIN_PASSWORD` in `.env`.

---

## Access URLs

| Service          | URL                          | Description                     |
|------------------|------------------------------|---------------------------------|
| Web Application  | http://localhost              | Angular frontend                |
| Keycloak Admin   | http://localhost:8080         | Identity provider admin console |
| API              | http://localhost:3000         | NestJS REST API                 |
| MinIO Console    | http://localhost:9001         | Object storage admin            |

### Default Credentials

| Account              | Username / Variable              | Password / Variable                  | Purpose                      |
|----------------------|----------------------------------|--------------------------------------|------------------------------|
| OSCI Admin           | **Email** (see below)            | `KEYCLOAK_REALM_ADMIN_PASSWORD`      | Platform admin (realm osci)  |
| Keycloak Admin       | `KEYCLOAK_ADMIN`                 | `KEYCLOAK_ADMIN_PASSWORD`            | Keycloak master console      |

Both are configured in `.env`. The **OSCI admin** (realm "osci" user) is created automatically when you run `docker compose up -d` by the `keycloak-realm-init` service. Change the realm admin credentials in `.env` before first start.

- **Login on the OSCI web app:** use the **email** as username (e.g. `KEYCLOAK_REALM_ADMIN_EMAIL` or `osci-admin@localhost` if not set), not `KEYCLOAK_REALM_ADMIN_USER`.
- **Realm password policy:** the realm "osci" requires passwords with at least 12 characters, one uppercase, one lowercase, one digit, and one special character. Set `KEYCLOAK_REALM_ADMIN_PASSWORD` accordingly (e.g. `Osc1-Admin-Pwd!`).

**Important:** The OSCI admin user may be prompted to configure TOTP (time-based one-time password) on first login.

---

## Architecture Overview

The OSCI Platform follows a microservices architecture with the following components:

```
                    +-------------------+
                    |    Web (Angular)  |  :80
                    |     via Nginx     |
                    +---------+---------+
                              |
                    +---------+---------+
                    |   API (NestJS)    |  :3000
                    +---------+---------+
                       /    |    \    \
            +---------+  +--+--+  +---+------+  +--------+
            |Postgres |  | OPA |  | Keycloak |  | MinIO  |
            | :5432   |  |     |  |  :8080   |  | :9000  |
            +---------+  +-----+  +----------+  +--------+
```

- **Web (Angular + Nginx):** Single-page application with Keycloak OIDC authentication, served via Nginx with security headers and API proxying.
- **API (NestJS):** RESTful backend handling business logic, database operations, and integrations with OPA and MinIO.
- **PostgreSQL:** Primary relational database storing security objects, checklists, tasks, and audit logs. Also hosts the Keycloak database.
- **Keycloak:** OpenID Connect identity provider with RBAC, TOTP/MFA, and PKCE-secured flows. A one-off `keycloak-realm-init` service creates the realm admin user from `.env` on first start.
- **OPA (Open Policy Agent):** Policy-as-code authorization engine enforcing fine-grained access control via Rego policies.
- **MinIO:** S3-compatible object storage for evidence files (screenshots, documents, reports).

### Security Roles

| Role              | Permissions                                                    |
|-------------------|----------------------------------------------------------------|
| SecurityAdmin     | Full unrestricted access to all features and settings          |
| SecurityManager   | Manage objects, checklists, tasks, evidence, incidents, reports|
| ProjectOwner      | Manage own objects and create associated checklists/tasks      |
| Auditor           | Read-only access to all data with export capabilities          |
| Developer         | Read access + respond to assigned checklists and manage tasks  |
| Viewer            | Read-only access (default role for new users)                  |

---

## Community Referentiels

OSCI uses a **community-driven referentiel system**. Security frameworks (ISO 27001, NIST CSF, OWASP Top 10, CIS Controls, etc.) and their associated checklists are maintained in a separate public repository.

### How It Works

1. Referentiels are stored as JSON files in the community repository (configured via `GITHUB_REFERENTIEL_REPO` in `.env`)
2. From the OSCI web interface, go to **Referentiels** and click **Community**
3. Browse available frameworks with their controls and checklists
4. Import an entire referentiel or individual checklists as needed
5. Imported checklists are linked to framework controls for compliance tracking

### Contributing Referentiels

Anyone can contribute new security frameworks or checklists by submitting a PR to the community referentiel repository. See the repository's README for the JSON format specification.

---

## Environment Variables

| Variable                        | Default                    | Description                              |
|---------------------------------|----------------------------|------------------------------------------|
| `DB_PASSWORD`                   | (required)                 | PostgreSQL password                      |
| `DB_NAME`                       | `osci`                     | Primary database name                    |
| `DB_USER`                       | `osci`                     | Database username                        |
| `KEYCLOAK_ADMIN`                | `admin`                    | Keycloak **master** admin username       |
| `KEYCLOAK_ADMIN_PASSWORD`       | (required)                 | Keycloak **master** admin password       |
| `KEYCLOAK_REALM_ADMIN_USER`     | (see `.env`)               | **Realm osci** admin username (internal)  |
| `KEYCLOAK_REALM_ADMIN_EMAIL`   | (optional)                 | **Realm osci** admin email = **login** on web app |
| `KEYCLOAK_REALM_ADMIN_PASSWORD` | (required)                 | **Realm osci** admin password (must match policy: 12+ chars, upper, lower, digit, special) |
| `KEYCLOAK_DB_NAME`              | `keycloak`                 | Keycloak database name                   |
| `MINIO_ROOT_USER`               | `osci-minio`               | MinIO access key                         |
| `MINIO_ROOT_PASSWORD`           | (required)                 | MinIO secret key                         |
| `API_PORT`                      | `3000`                     | API server port                          |
| `KEYCLOAK_ISSUER`               | `http://localhost:8080/...`| JWT token issuer URL (internal)          |
| `KEYCLOAK_ISSUER_EXTERNAL`      | `http://localhost:8080/...`| JWT token issuer URL (as seen by users)  |
| `API_CORS_ORIGIN`               | `http://localhost`         | Allowed CORS origin                      |
| `OPA_URL`                       | `http://opa:8181`          | OPA server URL (internal)                |
| `KEYCLOAK_URL`                  | `http://localhost:8080`    | Keycloak external URL                    |
| `KEYCLOAK_REALM`                | `osci`                     | Keycloak realm name                      |
| `KEYCLOAK_CLIENT_ID`            | `osci-web`                 | Keycloak client ID for frontend          |
| `API_URL`                       | `/api`                     | API URL for frontend                     |
| `GITHUB_REFERENTIEL_REPO`       | (see `.env`)               | GitHub repo for community referentiels   |

---

## Development

### Running in Development Mode

Create a `docker-compose.dev.yml` override to enable hot-reload for both the API and Web applications, then run:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

A typical development override would:
- Run the **API** with `npm run start:dev` (NestJS watch mode) with a Node.js debugger on port 9229.
- Run the **Web** with `ng serve` on port 4200 with live reload.
- Expose **MinIO API** on port 9000 for direct access.
- Expose **OPA** on port 8181 for policy testing.
- Volume-mount source code so changes in `apps/api/src/` and `apps/web/src/` are reflected immediately.

### Testing OPA Policies

With OPA exposed in development mode, you can test policies directly:

```bash
curl -X POST http://localhost:8181/v1/data/authz/allow \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "user": { "id": "user-1", "roles": ["Developer"] },
      "action": "read",
      "resource": { "type": "checklist" }
    }
  }'
```

### Project Structure

```
security-checklist-idp/
  apps/
    api/                  # NestJS backend
    web/                  # Angular frontend
  docker/
    keycloak/             # Keycloak realm configuration
    opa/policies/         # OPA Rego authorization policies
    postgres/             # Database initialization scripts
  docker-compose.yml      # Production compose
  env.example             # Environment variable template
```

---

## Production Deployment Notes

Before deploying to production, ensure the following:

1. **Change all passwords** in `.env` to strong, unique values. Never use the defaults.

2. **Enable TLS/HTTPS:**
   - Place the platform behind a reverse proxy (e.g., Traefik, Caddy, or Nginx) with TLS termination.
   - Update `sslRequired` in Keycloak realm to `"external"` or `"all"`.
   - Update all URLs in `.env` to use `https://`.
   - Update `redirectUris` and `webOrigins` in Keycloak client configuration.

3. **Update Content-Security-Policy** in `apps/web/nginx.conf` to reference your production domain instead of `localhost`.

4. **Configure email** in Keycloak for password reset and email verification flows.

5. **Backup strategy:** Set up regular backups for the `postgres_data` and `minio_data` Docker volumes.

6. **Monitoring:** Consider adding Prometheus/Grafana for monitoring, or integrate with your existing observability stack.

7. **Network security:** In production, do not expose MinIO console (port 9001), OPA (port 8181), or database (port 5432) externally. The default `docker-compose.yml` already keeps OPA and the database internal.

8. **Resource limits:** Add CPU and memory limits to Docker Compose services for production workloads.

---

## Licence

Voir le fichier [LICENCE](./LICENCE) pour plus d'informations.
