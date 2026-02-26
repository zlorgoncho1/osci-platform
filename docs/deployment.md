# Déploiement

Ce guide explique comment déployer OSCI Platform sur votre infrastructure avec Docker Compose.

## Prérequis

- **Docker** et **Docker Compose** installés
- **Git** pour cloner le dépôt
- Un minimum de **4 Go de RAM** disponibles pour l'ensemble des services

## Cloner le dépôt

```bash
git clone https://github.com/zlorgoncho1/osci-platform.git
cd osci-platform
```

## Configurer les variables d'environnement

Copiez le fichier d'exemple et adaptez les valeurs :

```bash
cp env.example .env
```

Ouvrez `.env` et modifiez les paramètres suivants :

### Base de données

| Variable | Description | Exemple |
|----------|-------------|---------|
| `DB_USER` | Utilisateur PostgreSQL | `osci` |
| `DB_PASSWORD` | Mot de passe PostgreSQL | `un_mot_de_passe_fort` |
| `DB_NAME` | Nom de la base | `osci` |

### Keycloak (SSO / OIDC)

| Variable | Description | Exemple |
|----------|-------------|---------|
| `KEYCLOAK_ADMIN` | Administrateur master Keycloak | `admin` |
| `KEYCLOAK_ADMIN_PASSWORD` | Mot de passe admin master | `un_mot_de_passe_fort` |
| `KEYCLOAK_REALM_ADMIN_USER` | Nom d'utilisateur admin OSCI | `osci-admin` |
| `KEYCLOAK_REALM_ADMIN_EMAIL` | Email de connexion admin OSCI | `admin@example.com` |
| `KEYCLOAK_REALM_ADMIN_PASSWORD` | Mot de passe admin OSCI (12+ car., majuscule, minuscule, chiffre, spécial) | `Osc1-Admin-Pwd!` |

### Authentification locale (JWT)

| Variable | Description | Exemple |
|----------|-------------|---------|
| `API_JWT_SECRET` | Secret pour les tokens d'accès (min. 32 caractères) | `changeme_jwt_secret_min_32_chars` |
| `API_JWT_REFRESH_SECRET` | Secret pour les tokens de refresh (min. 32 caractères) | `changeme_jwt_refresh_secret_32c` |

Ces deux variables activent le mode d'authentification locale (email / mot de passe). Si elles ne sont pas définies, seule l'authentification Keycloak est disponible.

### Stockage objet (MinIO)

| Variable | Description | Exemple |
|----------|-------------|---------|
| `MINIO_ROOT_USER` | Utilisateur MinIO | `osci-minio` |
| `MINIO_ROOT_PASSWORD` | Mot de passe MinIO | `un_mot_de_passe_fort` |

### URLs et réseau

| Variable | Description | Exemple |
|----------|-------------|---------|
| `API_URL` | URL de l'API vue par le frontend | `/api` |
| `KEYCLOAK_URL` | URL Keycloak vue par le frontend | `http://localhost/auth` |
| `KEYCLOAK_REALM` | Nom du realm Keycloak | `osci` |
| `KEYCLOAK_CLIENT_ID` | Client ID Keycloak | `osci-web` |
| `API_CORS_ORIGIN` | Origine CORS autorisée | `http://localhost` |
| `TRUST_PROXY` | Mettre à `1` lorsque l'API est derrière un reverse proxy (Nginx, Traefik, etc.) pour que l'IP client réelle soit utilisée dans les logs d'audit et le rate limiting (X-Forwarded-For / X-Real-IP). En dev sans proxy, laisser à `0`. | `0` |
| `GITHUB_REFERENTIEL_REPO` | Dépôt GitHub des référentiels communautaires | `zlorgoncho1/osci-referentiel` |

## Lancer la plateforme

```bash
docker compose up -d
```

Au premier démarrage, les services suivants sont initialisés automatiquement :

1. **PostgreSQL** — Création des bases de données (OSCI + Keycloak)
2. **Keycloak** — Initialisation du realm `osci` et du compte administrateur
3. **OPA** — Moteur de politiques d'autorisation
4. **MinIO** — Stockage objet pour les preuves et fichiers
5. **API** — Backend NestJS avec migration automatique de la base
6. **Web** — Frontend Angular servi par Nginx

## Architecture des services

```
┌─────────────────────────────────────────────────────┐
│  Navigateur (port 80)                               │
│  ┌───────────────────────────────────────────────┐  │
│  │  Nginx (frontend)                             │  │
│  │  /       → SPA Angular                        │  │
│  │  /api/   → proxy vers API (port 3000)         │  │
│  │  /auth/  → proxy vers Keycloak (port 8080)    │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
         │            │              │
    ┌────┘       ┌────┘         ┌────┘
    ▼            ▼              ▼
 ┌──────┐   ┌──────┐      ┌──────────┐
 │ API  │   │ OPA  │      │ Keycloak │
 │ 3000 │──▶│ 8181 │      │   8080   │
 └──┬───┘   └──────┘      └────┬─────┘
    │                           │
    ▼                           ▼
 ┌──────────┐            ┌──────────┐
 │PostgreSQL│            │PostgreSQL│
 │  (osci)  │            │(keycloak)│
 └──────────┘            └──────────┘
    │
    ▼
 ┌──────┐
 │MinIO │
 │ 9000 │
 └──────┘
```

| Service | Port interne | Port exposé | Usage |
|---------|-------------|-------------|-------|
| Web (Nginx) | 80 | **80** | Point d'entrée unique |
| API (NestJS) | 3000 | — | Backend, proxié via `/api` |
| Keycloak | 8080 | 8080 | Console admin (optionnel) |
| PostgreSQL | 5432 | — | Base de données |
| MinIO API | 9000 | — | Stockage fichiers |
| MinIO Console | 9001 | 9001 | Administration MinIO |
| OPA | 8181 | — | Moteur de politiques |

### Logs d'audit et IP client

Les logs d'audit enregistrent pour chaque action l'**acteur** (utilisateur connecté, ou `anonymous` si non authentifié) et l'**adresse IP** du client. Lorsque l'API est derrière un reverse proxy (Nginx dans le déploiement Docker), définir `TRUST_PROXY=1` dans l'environnement du conteneur API pour que l'IP réelle du client soit utilisée (le proxy doit envoyer les en-têtes `X-Real-IP` et `X-Forwarded-For`, ce qui est déjà le cas avec le `nginx.conf` fourni). Sans cette variable, l'IP enregistrée serait celle du proxy.

## Vérifier le déploiement

Après le démarrage, accédez à :

- **Application** : `http://localhost`
- **Console Keycloak** : `http://localhost:8080` (identifiants `KEYCLOAK_ADMIN`)
- **Console MinIO** : `http://localhost:9001` (identifiants `MINIO_ROOT_USER`)

Connectez-vous à l'application avec l'email et le mot de passe définis dans `KEYCLOAK_REALM_ADMIN_EMAIL` / `KEYCLOAK_REALM_ADMIN_PASSWORD`, ou utilisez le bouton **SSO** pour passer par Keycloak.

## Mise en production

### HTTPS / TLS

En production, placez un reverse proxy (Traefik, Caddy ou un Nginx externe) devant le port 80 avec un certificat TLS. Mettez à jour les URLs dans `.env` et activez la confiance au proxy pour l'IP client (logs d'audit, rate limiting) :

```
API_CORS_ORIGIN=https://votre-domaine.com
TRUST_PROXY=1
WEB_APP_URL=https://votre-domaine.com
KEYCLOAK_URL=https://votre-domaine.com/auth
KEYCLOAK_ISSUER=https://votre-domaine.com/auth/realms/osci
KEYCLOAK_ISSUER_EXTERNAL=https://votre-domaine.com/auth/realms/osci
```

### Checklist de sécurité

- Tous les mots de passe de `.env` ont été modifiés
- HTTPS activé avec un certificat valide
- Les ports internes (5432, 8181, 9000) ne sont **pas** exposés sur le réseau
- Les sauvegardes sont configurées pour les volumes `postgres_data` et `minio_data`
- Les limites CPU/mémoire sont définies sur les conteneurs
- La politique CSP dans `nginx.conf` référence votre domaine de production

## Mise à jour

```bash
git pull
docker compose down
docker compose up -d --build
```

Les migrations de base de données sont appliquées automatiquement au démarrage de l'API.
