# OSCI Platform — Document de Présentation

*Plateforme de pilotage de la sécurité Zero Trust*

---

## Table des matières

1. [Résumé exécutif](#1-résumé-exécutif)
2. [Le problème adressé](#2-le-problème-adressé)
3. [La solution OSCI](#3-la-solution-osci)
4. [Proposition de valeur](#4-proposition-de-valeur)
5. [Public cible et cas d'usage](#5-public-cible-et-cas-dusage)
6. [Architecture technique](#6-architecture-technique)
7. [Fonctionnalités détaillées](#7-fonctionnalités-détaillées)
   - 7.1 [Cockpit — Tableau de bord](#71-cockpit--tableau-de-bord)
   - 7.2 [Gestion des Objets](#72-gestion-des-objets)
   - 7.3 [Checklists et Runs](#73-checklists-et-runs)
   - 7.4 [Security Integrity Score](#74-security-integrity-score)
   - 7.5 [Remédiation (Kanban)](#75-remédiation-kanban)
   - 7.6 [Projets de sécurité](#76-projets-de-sécurité)
   - 7.7 [Cartographie topologique](#77-cartographie-topologique)
   - 7.8 [Audit et preuves](#78-audit-et-preuves)
   - 7.9 [Référentiels de sécurité](#79-référentiels-de-sécurité)
   - 7.10 [Rapports](#710-rapports)
   - 7.11 [Gestion des incidents](#711-gestion-des-incidents)
   - 7.12 [Administration](#712-administration)
8. [Modèle d'autorisation (RBAC)](#8-modèle-dautorisation-rbac)
9. [Référentiels communautaires](#9-référentiels-communautaires)
10. [Stack technique](#10-stack-technique)
11. [Déploiement et infrastructure](#11-déploiement-et-infrastructure)
12. [Sécurité de la plateforme](#12-sécurité-de-la-plateforme)
13. [Parcours utilisateur type](#13-parcours-utilisateur-type)
14. [Bonnes pratiques recommandées](#14-bonnes-pratiques-recommandées)
15. [Glossaire](#15-glossaire)

---

## 1. Résumé exécutif

**OSCI** est une plateforme de pilotage de la sécurité Zero Trust qui centralise les contrôles de sécurité, mesure la posture de conformité et fournit une **source de vérité unique** pour toutes les parties prenantes d'une organisation.

La plateforme permet de :

- **Centraliser** les contrôles de sécurité dans un référentiel unique
- **Mesurer** la conformité de chaque actif via le **Security Integrity Score**
- **Piloter** la remédiation grâce à un Kanban de tâches correctives
- **Prouver** la conformité avec un système de preuves et un journal d'audit complet
- **Visualiser** les relations entre les actifs avec une cartographie topologique interactive

OSCI s'appuie sur une architecture microservices moderne (Angular, NestJS, PostgreSQL, Keycloak, OPA, MinIO) et propose un modèle d'autorisation granulaire basé sur les rôles, les groupes et les politiques as-code.

---

## 2. Le problème adressé

Dans de nombreuses organisations, les contrôles de sécurité sont dispersés entre des tableurs, des outils hétérogènes et des processus manuels. Cette fragmentation engendre :

| Problème | Impact |
|----------|--------|
| **Manque de visibilité** | Impossible d'avoir une vue d'ensemble fiable de la posture de sécurité globale |
| **Audits difficiles à préparer** | Preuves dispersées, pas de centralisation des résultats de contrôle |
| **Remédiation non suivie** | Les vulnérabilités identifiées persistent faute de suivi structuré |
| **Décideurs sans indicateurs** | Pas de métriques objectives pour arbitrer les investissements sécurité |
| **Hétérogénéité des pratiques** | Chaque équipe applique ses propres contrôles sans standardisation |
| **Perte de traçabilité** | Aucun historique fiable des actions et décisions de sécurité |

---

## 3. La solution OSCI

OSCI répond à ces défis en proposant une approche structurée en **cinq piliers** :

### Centraliser

Regroupez tous vos contrôles de sécurité dans des **checklists** structurées, organisées par **référentiels** (ISO 27001, NIST CSF, OWASP Top 10, CIS Benchmarks, ou vos propres frameworks internes).

### Standardiser

Appliquez des contrôles homogènes à vos **objets** (projets, infrastructures, dépôts de code, identités, applications) grâce à des référentiels partagés par la communauté ou créés en interne.

### Mesurer

Le **Security Integrity Score** fournit un indicateur objectif et comparable de la conformité de chaque objet. Suivez son évolution dans le temps depuis le Cockpit.

### Piloter

Chaque écart identifié lors d'un run de checklist génère une **tâche de remédiation**. Le Kanban intégré permet de suivre l'avancement et de prioriser les corrections.

### Prouver

Attachez des **preuves** (fichiers, captures, liens) à chaque contrôle. Le **journal d'audit** trace automatiquement toutes les actions pour préparer vos audits en toute sérénité.

---

## 4. Proposition de valeur

### Pour les organisations

| Bénéfice | Description |
|----------|-------------|
| **Source de vérité unique** | Un seul endroit pour tous les contrôles, scores, preuves et audits |
| **Conformité mesurable** | Indicateurs quantifiés et évolution dans le temps |
| **Audit-ready** | Preuves centralisées et journal d'audit exhaustif |
| **Gain de temps** | Automatisation des tâches de remédiation et suivi structuré |
| **Standardisation** | Référentiels communautaires et workflows homogènes |

### Pour les équipes sécurité

- Exécution des checklists guidée et traçable
- Preuves attachées directement aux contrôles
- Kanban de remédiation pour organiser le travail
- Scores objectifs pour prioriser les efforts

### Pour les décideurs

- Cockpit avec indicateurs synthétiques
- Security Integrity Score global et par périmètre
- Rapports de conformité exportables
- Visibilité sur l'avancement de la remédiation

---

## 5. Public cible et cas d'usage

### Profils d'utilisateurs

| Profil | Usage principal |
|--------|----------------|
| **RSSI / Responsable sécurité** | Pilotage global, tableaux de bord, arbitrage des priorités |
| **Équipe sécurité** | Exécution des checklists, remédiation, gestion des preuves |
| **Auditeur** | Consultation des runs, preuves et journaux d'audit |
| **Chef de projet** | Suivi de la conformité des projets dont il est responsable |
| **Développeur** | Vérification des contrôles sur ses dépôts et services |
| **Décideur / Direction** | Indicateurs synthétiques et rapports de conformité |

### Cas d'usage

1. **Campagne d'audit interne** — Créer un projet, associer les objets du périmètre, exécuter les checklists, générer un rapport
2. **Préparation à une certification ISO 27001** — Importer le référentiel communautaire ISO 27001, appliquer les checklists, suivre le score
3. **Suivi de la remédiation** — Identifier les non-conformités, suivre les tâches correctives dans le Kanban, relancer les runs
4. **Onboarding d'un nouveau projet** — Créer les objets (infra, code, pipeline), associer les checklists adaptées, évaluer le niveau initial
5. **Reporting à la direction** — Exporter les scores et rapports de conformité pour les comités de sécurité

---

## 6. Architecture technique

### Vue d'ensemble

```
                    ┌───────────────────┐
                    │   Web (Angular)   │  :80
                    │    via Nginx      │
                    └────────┬──────────┘
                             │
                    ┌────────┴──────────┐
                    │   API (NestJS)    │  :3000
                    └──┬─────┬─────┬───┘
                       │     │     │
          ┌────────┐ ┌─┴───┐ ┌┴────────┐ ┌────────┐
          │Postgres│ │ OPA │ │Keycloak │ │ MinIO  │
          │ :5432  │ │     │ │  :8080  │ │ :9000  │
          └────────┘ └─────┘ └─────────┘ └────────┘
```

### Composants

| Composant | Technologie | Rôle |
|-----------|-------------|------|
| **Web** | Angular 18 + Nginx | SPA frontend avec authentification OIDC, Tailwind CSS, Cytoscape.js pour la cartographie |
| **API** | NestJS 10 + TypeORM | Backend RESTful — logique métier, accès DB, intégration OPA et MinIO |
| **PostgreSQL** | PostgreSQL 16 | Base relationnelle pour les objets, checklists, scores, audit et données Keycloak |
| **Keycloak** | Keycloak 26 | Fournisseur d'identité OpenID Connect avec RBAC, TOTP/MFA et flux PKCE |
| **OPA** | Open Policy Agent | Moteur d'autorisation policy-as-code via politiques Rego |
| **MinIO** | MinIO (S3-compatible) | Stockage objet pour les fichiers de preuves (captures, documents, rapports) |

### Flux de données

```
Utilisateur  →  Angular (SPA)
                    │
                    ├── Authentification → Keycloak (OIDC / PKCE)
                    │                         └── JWT Token
                    │
                    └── Requêtes API → NestJS
                                         │
                                         ├── Vérification JWT → Keycloak (introspection)
                                         ├── Autorisation → OPA (Rego policies)
                                         ├── Données → PostgreSQL (TypeORM)
                                         ├── Fichiers → MinIO (S3)
                                         └── Audit → PostgreSQL (intercepteur automatique)
```

---

## 7. Fonctionnalités détaillées

### 7.1 Cockpit — Tableau de bord

Le Cockpit est la page d'accueil de la plateforme. Il centralise les indicateurs clés pour un pilotage rapide et efficace.

**Fonctionnalités :**

- **Indicateurs globaux** — Nombre d'objets, projets actifs, score moyen, tâches en attente
- **Security Integrity Score** — Évolution du score global et par périmètre
- **Priorités identifiées** — Objets les moins conformes, tâches urgentes
- **Accès rapide** — Liens directs vers les projets récents et en cours

**Audience :** Tous les utilisateurs authentifiés. S'adresse principalement aux responsables sécurité et décideurs.

---

### 7.2 Gestion des Objets

Un **objet** représente un élément du système d'information soumis à des contrôles de sécurité. C'est l'entité centrale du modèle OSCI : les checklists, runs et scores s'y rattachent.

**Types d'objets supportés :**

| Type | Description |
|------|-------------|
| Project | Projet applicatif ou organisationnel |
| Human | Identité humaine (collaborateur, prestataire) |
| Infrastructure | Composant d'infrastructure (serveur, réseau, cloud) |
| Repository | Dépôt de code source |
| Application | Application déployée |
| Device | Équipement physique ou virtuel |
| Data | Jeu de données ou base de données |
| Network | Segment réseau |
| Cloud | Ressource cloud (compte, VPC, subscription) |
| Third Party | Prestataire ou service tiers |
| Pipeline | Pipeline CI/CD |
| Cluster | Cluster de conteneurs |
| Server | Serveur physique ou virtuel |
| Database | Base de données |

**Fonctionnalités :**

- **Liste et filtrage** — Par type, projet, score
- **Détail d'un objet** — Score, checklists associées, historique des runs, tâches de remédiation
- **Groupes d'objets** — Regroupement par thématique, périmètre ou équipe avec score consolidé

---

### 7.3 Checklists et Runs

Le module Checklists est le coeur opérationnel d'OSCI. Il structure les vérifications de sécurité à appliquer aux objets.

**Concepts :**

- **Checklist** — Liste de contrôles issus de référentiels (ISO 27001, NIST, OWASP, etc.) ou définis manuellement
- **Contrôle** — Point de vérification individuel avec type (YesNo, Score, Evidence, AutoCheck), poids et référence au framework
- **Run** — Exécution d'une checklist à un instant donné

**Processus d'exécution d'un run :**

```
1. Sélection de la checklist
         │
2. Lancement du run
         │
3. Pour chaque contrôle :
   ├── Conforme         → Score positif
   ├── Non conforme     → Score négatif + tâche de remédiation créée
   ├── Non applicable   → Exclu du calcul
   └── En attente       → Évaluation reportée
         │
4. Attachement des preuves (fichiers, captures, liens)
         │
5. Finalisation → Calcul du Security Integrity Score
```

**Fonctionnalités :**

- Création de checklists depuis un référentiel ou manuellement
- Association à un ou plusieurs objets
- Historique complet des runs avec comparaison dans le temps
- Preuves attachées à chaque contrôle

---

### 7.4 Security Integrity Score

Le **Security Integrity Score** est l'indicateur central de la plateforme. Il fournit une mesure objective et comparable de la conformité.

**Caractéristiques :**

- **Calculé automatiquement** à partir des résultats des runs
- **Pondéré** selon le poids de chaque contrôle
- **Évolutif** — Suivi de la progression dans le temps
- **Multi-niveaux** — Score par objet, par groupe d'objets, par projet et score global
- **Visible partout** — Cockpit, détail objet, détail projet, cartographie

**Interprétation visuelle :**

| Couleur | Niveau | Signification |
|---------|--------|---------------|
| Emerald (vert) | Conforme | Niveau de conformité satisfaisant |
| Amber (orange) | Attention | Des écarts nécessitent une action |
| Rose (rouge) | Critique | Non-conformités importantes à traiter en priorité |

---

### 7.5 Remédiation (Kanban)

Le module Remédiation propose un Kanban visuel pour suivre et prioriser les actions correctives.

**Colonnes du Kanban :**

```
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│  À faire │ → │ En cours │ → │  Revue   │ → │ Terminé  │
│  (ToDo)  │   │(InProg.) │   │ (Review) │   │  (Done)  │
└──────────┘   └──────────┘   └──────────┘   └──────────┘
```

**Flux de travail :**

1. Un run de checklist identifie des contrôles non conformes
2. Des tâches de remédiation sont **automatiquement créées** dans "À faire"
3. Les équipes prennent en charge les tâches → "En cours"
4. Après correction et vérification → "Terminé"
5. Un nouveau run peut être lancé pour confirmer la conformité

**Fonctionnalités :**

- Glisser-déposer entre les colonnes
- Filtrage par objet, projet, priorité ou assignation
- Détail de chaque tâche : contrôle d'origine, objet, checklist
- Commentaires et suivi de discussion
- Création manuelle de tâches

---

### 7.6 Projets de sécurité

Un projet de sécurité regroupe des objets et checklists autour d'un périmètre défini.

**Statuts d'un projet :**

| Statut | Description |
|--------|-------------|
| Planning | En phase de planification |
| Active | En cours d'exécution |
| OnHold | Suspendu temporairement |
| Completed | Terminé |
| Cancelled | Annulé |

**Fonctionnalités :**

- **Vue d'ensemble** — Score consolidé, nombre d'objets, progression globale
- **Gestion du périmètre** — Ajouter/retirer des objets
- **Suivi des checklists** — Checklists appliquées aux objets du projet
- **Historique des runs** — Évolution du score dans le temps
- **Jalons** (Milestones) — Points de passage et dates clés
- **Tâches liées** — Vue consolidée des tâches de remédiation du périmètre

---

### 7.7 Cartographie topologique

Le module Cartographie fournit une visualisation interactive en graphe des relations entre les actifs du SI.

**Technologie :** Cytoscape.js — Bibliothèque de visualisation de graphes interactive

**Types de relations supportées :**

| Relation | Description |
|----------|-------------|
| `connects_to` | Connexion réseau entre deux actifs |
| `depends_on` | Dépendance fonctionnelle |
| `hosts` | Hébergement (serveur → application) |
| `authenticates` | Relation d'authentification |
| `stores_data` | Stockage de données |
| `contains` | Inclusion hiérarchique |
| `monitors` | Supervision |
| `backs_up` | Sauvegarde |
| `replicates_to` | Réplication de données |
| `routes_traffic_to` | Routage réseau |

**Lecture du graphe :**

- Chaque **noeud** = un actif (avec son type et son score de conformité)
- Chaque **lien** = une relation (dépendance, flux, inclusion)
- Les **couleurs** reflètent le niveau de conformité (vert = conforme, orange = attention, rouge = critique)

**Fonctionnalités :**

- Navigation interactive (zoom, pan, sélection)
- Exploration des connexions d'un noeud
- Création de relations entre objets
- Filtrage par type d'objet, projet ou nature de relation
- Identification des points critiques et impacts en cas d'incident

---

### 7.8 Audit et preuves

La traçabilité est essentielle dans une démarche de sécurité. Ce module assure un suivi complet de toutes les actions.

**Journal d'audit :**

- Enregistrement **automatique** de toutes les actions (création, modification, suppression, exécution de runs, etc.)
- Chaque entrée contient : utilisateur, action, ressource concernée, horodatage
- Filtrage par utilisateur, type d'action, date ou ressource
- Recherche plein texte dans l'historique
- Export pour audit externe

**Gestion des preuves (Evidence) :**

- Upload de fichiers (captures d'écran, documents, exports de configuration)
- Association directe à un contrôle spécifique d'un run
- Stockage sécurisé dans MinIO (S3-compatible)
- Consultation et téléchargement depuis le détail des runs

---

### 7.9 Référentiels de sécurité

Un référentiel est un ensemble structuré de contrôles de sécurité.

**Référentiels supportés :**

| Framework | Domaine |
|-----------|---------|
| ISO 27001 | Gouvernance et sécurité de l'information |
| NIST CSF | Cadre de cybersécurité |
| OWASP Top 10 | Sécurité applicative |
| CIS Benchmarks | Durcissement des configurations |
| Frameworks internes | Standards spécifiques à l'organisation |

**Fonctionnalités :**

- Parcours hiérarchique des contrôles dans chaque référentiel
- Import depuis la bibliothèque communautaire
- Création de référentiels internes personnalisés
- Détail de chaque contrôle : description, objectif, recommandations
- Liaison automatique entre contrôles et checklists

---

### 7.10 Rapports

Le module Rapports fournit des vues synthétiques exportables.

**Fonctionnalités :**

- Génération de rapports par projet, objet ou périmètre
- Vue consolidée des scores et de la conformité
- Export dans un format adapté à la diffusion
- Partage avec d'autres utilisateurs de la plateforme
- Historique des rapports générés

**Destinataires :** Décideurs, auditeurs, parties prenantes nécessitant une vision consolidée.

---

### 7.11 Gestion des incidents

Le module Incidents permet d'enregistrer et suivre les incidents de sécurité.

**Niveaux de gravité :**

| Gravité | Description |
|---------|-------------|
| Low | Impact mineur, pas d'urgence |
| Medium | Impact modéré, à traiter dans un délai raisonnable |
| High | Impact significatif, traitement prioritaire |
| Critical | Impact majeur, intervention immédiate requise |

**Fonctionnalités :**

- Déclaration d'incident avec description, gravité et objets impactés
- Suivi du statut (ouvert → en cours → résolu → clos)
- Historique des incidents passés et en cours
- Filtrage par gravité, statut, date ou objets impactés
- Capitalisation et retour d'expérience

---

### 7.12 Administration

Le module Administration centralise la gestion des accès et habilitations.

**Gestion des utilisateurs :**

- Liste complète avec rôles et statut
- Édition des informations, rôles assignés et permissions directes
- Recherche par nom ou email

**Gestion des groupes d'utilisateurs :**

- Création de groupes (nom, slug, description)
- Gestion des membres (ajout/retrait)
- Attribution de rôles et permissions au niveau du groupe
- Héritage automatique pour tous les membres

**Gestion des rôles :**

- Consultation des rôles prédéfinis et leurs permissions associées
- Vue détaillée des types de ressources et actions autorisées

---

## 8. Modèle d'autorisation (RBAC)

OSCI implémente un modèle d'autorisation granulaire combinant rôles, permissions directes, groupes et politiques as-code (OPA/Rego).

### Rôles prédéfinis

| Rôle | Description | Périmètre |
|------|-------------|-----------|
| **SecurityAdmin** | Administrateur complet | Toutes les permissions sur toutes les ressources, y compris gestion des utilisateurs et groupes |
| **SecurityManager** | Gestionnaire sécurité | Création, modification et suivi des projets, objets, checklists, référentiels et rapports |
| **ProjectOwner** | Propriétaire de projet | Gestion complète des projets dont il est propriétaire et des objets associés |
| **Auditor** | Auditeur | Lecture seule sur projets, objets, checklists, runs, preuves et journal d'audit + export |
| **Developer** | Développeur | Lecture et exécution sur les checklists, objets et tâches dans son périmètre |
| **Viewer** | Observateur | Lecture seule sur les ressources auxquelles il a accès |

### Types de ressources (17)

`project` · `object` · `object_group` · `checklist` · `checklist_run` · `task` · `evidence` · `incident` · `report` · `audit_log` · `referentiel` · `framework_control` · `cartography_asset` · `cartography_relation` · `integration` · `user` · `user_group`

### Actions disponibles

| Action | Description |
|--------|-------------|
| `read` | Consulter la ressource |
| `create` | Créer une nouvelle ressource |
| `update` | Modifier une ressource existante |
| `delete` | Supprimer une ressource |
| `export` | Exporter les données |
| `manage` | Administration complète (inclut toutes les actions) |

### Calcul des permissions effectives

Les **permissions effectives** d'un utilisateur sont l'union de toutes ses sources :

```
Permissions effectives = Rôles directs
                       ∪ Rôles hérités des groupes
                       ∪ Permissions des groupes
                       ∪ Permissions directes individuelles
                       ∪ Accès par ressource spécifique
                       ∪ Privilège créateur (accès implicite)
```

Le système évalue ces sources et accorde l'accès dès qu'une source l'autorise. Un **SecurityAdmin** dispose de toutes les permissions sans restriction.

### Policy-as-Code (OPA / Rego)

L'autorisation fine est appliquée via **Open Policy Agent** avec des politiques Rego :

- Évaluation en temps réel à chaque requête API
- Règles déclaratives et auditables
- Step-up MFA requis pour les actions sensibles (suppression, export)
- Journal d'audit accessible uniquement aux Admin et Auditor
- Politiques personnalisables par organisation

---

## 9. Référentiels communautaires

OSCI dispose d'une **bibliothèque communautaire de référentiels** partagés et ouverts aux contributions.

**Dépôt communautaire :** [github.com/zlorgoncho1/osci-referentiel](https://github.com/zlorgoncho1/osci-referentiel)

### Fonctionnement

1. Les référentiels sont stockés en JSON dans le dépôt communautaire
2. Depuis l'interface OSCI → **Référentiels** → onglet **Community**
3. Parcourir les frameworks disponibles avec leurs contrôles
4. **Importer** un référentiel complet en un clic
5. Le référentiel importé est indépendant — il peut être adapté sans affecter la version communautaire

### Structure d'un référentiel communautaire

```json
{
  "code": "ISO-27001",
  "name": "ISO 27001",
  "description": "Système de management de la sécurité de l'information",
  "version": "1.0",
  "type": "ISO",
  "domain": "Governance",
  "controls": [
    {
      "code": "A.5.1",
      "title": "Politiques de sécurité de l'information",
      "description": "...",
      "orderIndex": 0
    }
  ],
  "checklists": [
    {
      "title": "Checklist ISO 27001 - Gouvernance",
      "criticality": "High",
      "items": [
        {
          "question": "La politique de sécurité est-elle formalisée ?",
          "itemType": "YesNo",
          "weight": 1.0,
          "controlCode": "A.5.1"
        }
      ]
    }
  ]
}
```

### Contribuer

Tout expert sécurité peut contribuer :
- Nouveaux référentiels (frameworks, régulations)
- Mises à jour de contrôles existants
- Traductions
- Corrections et améliorations

---

## 10. Stack technique

### Technologies principales

| Couche | Technologie | Version |
|--------|-------------|---------|
| **Frontend** | Angular | 18 |
| **UI Framework** | Tailwind CSS | 3.x |
| **Graphe / Cartographie** | Cytoscape.js | — |
| **Backend** | NestJS | 10 |
| **ORM** | TypeORM | — |
| **Base de données** | PostgreSQL | 16 |
| **Identité** | Keycloak | 26 |
| **Autorisation** | Open Policy Agent (Rego) | — |
| **Stockage objets** | MinIO (S3-compatible) | — |
| **Reverse proxy** | Nginx | — |
| **Conteneurisation** | Docker + Docker Compose | v2 |
| **Langage** | TypeScript | — |

### Librairies et outils clés

**Backend :**
- Passport.js — Stratégies d'authentification JWT
- bcryptjs — Hashage des mots de passe
- Axios — Appels HTTP (OPA, Keycloak, MinIO)
- Helmet — En-têtes de sécurité HTTP
- Rate Limiting — 100 requêtes / 60 secondes par défaut

**Frontend :**
- angular-oauth2-oidc — Intégration OpenID Connect
- RxJS — Programmation réactive
- Solar Icons — Iconographie
- Cytoscape.js — Visualisation de graphes (cartographie)

---

## 11. Déploiement et infrastructure

### Services Docker

| Service | Image | Rôle | Ports exposés |
|---------|-------|------|---------------|
| **web** | Angular + Nginx | Frontend SPA | :80 |
| **api** | NestJS | Backend REST | :3000 |
| **postgres** | PostgreSQL 16 | Base de données | :5432 (interne) |
| **keycloak** | Keycloak 26 | Fournisseur d'identité | :8080 |
| **keycloak-realm-init** | Script init | Création du realm admin | — (one-shot) |
| **opa** | Open Policy Agent | Moteur d'autorisation | interne uniquement |
| **minio** | MinIO | Stockage S3 | :9001 (console) |

### Démarrage rapide

```bash
# 1. Cloner le dépôt
git clone <repository-url>
cd security-checklist-idp

# 2. Configurer l'environnement
cp env.example .env
# Éditer .env et changer TOUS les mots de passe par défaut

# 3. Démarrer tous les services
docker compose up -d
```

La plateforme est opérationnelle en environ 60 à 90 secondes. Le compte administrateur realm est créé automatiquement au premier démarrage à partir des variables `KEYCLOAK_REALM_ADMIN_USER` et `KEYCLOAK_REALM_ADMIN_PASSWORD` du fichier `.env`.

### Mode développement

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

- **API** : `npm run start:dev` avec hot-reload et débugueur sur le port 9229
- **Web** : `ng serve` avec live reload sur le port 4200
- **MinIO API** exposé sur le port 9000
- **OPA** exposé sur le port 8181 pour tester les politiques

### Variables d'environnement clés

| Variable | Description |
|----------|-------------|
| `DB_PASSWORD` | Mot de passe PostgreSQL |
| `KEYCLOAK_ADMIN` / `KEYCLOAK_ADMIN_PASSWORD` | Compte admin Keycloak master |
| `KEYCLOAK_REALM_ADMIN_USER` / `KEYCLOAK_REALM_ADMIN_EMAIL` / `KEYCLOAK_REALM_ADMIN_PASSWORD` | Compte admin realm OSCI |
| `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` | Credentials MinIO |
| `API_PORT` | Port de l'API (défaut : 3000) |
| `KEYCLOAK_URL` / `KEYCLOAK_REALM` / `KEYCLOAK_CLIENT_ID` | Configuration OIDC |
| `API_URL` / `WEB_APP_URL` | URLs de l'application |
| `GITHUB_REFERENTIEL_REPO` | Dépôt GitHub des référentiels communautaires |

---

## 12. Sécurité de la plateforme

### Mécanismes de sécurité intégrés

| Mécanisme | Description |
|-----------|-------------|
| **Authentification OIDC** | Flux OpenID Connect avec PKCE via Keycloak |
| **JWT** | Tokens signés pour l'authentification API |
| **MFA / TOTP** | Authentification multi-facteurs configurable |
| **Policy-as-Code** | Autorisation fine via OPA / Rego |
| **RBAC** | Contrôle d'accès basé sur les rôles |
| **Audit trail** | Journal automatique de toutes les actions |
| **Hashage** | Mots de passe hashés avec bcryptjs |
| **CORS** | Protection cross-origin via Nginx |
| **Helmet** | En-têtes de sécurité HTTP |
| **Rate Limiting** | Protection contre les abus (100 req/60s) |
| **Isolation réseau** | OPA, PostgreSQL et MinIO non exposés publiquement |

### Recommandations de durcissement pour la production

1. **Changer tous les mots de passe** du `.env` avec des valeurs fortes et uniques
2. **Activer TLS/HTTPS** via un reverse proxy (Traefik, Caddy ou Nginx) avec terminaison TLS
3. **Configurer Keycloak** : `sslRequired = "external"` ou `"all"` sur le realm
4. **Mettre à jour les URLs** dans `.env` pour utiliser `https://`
5. **Configurer Content-Security-Policy** dans `nginx.conf` avec le domaine de production
6. **Activer l'email** dans Keycloak pour les flux de réinitialisation de mot de passe
7. **Sauvegardes régulières** des volumes Docker `postgres_data` et `minio_data`
8. **Monitoring** — Intégrer Prometheus/Grafana ou un stack d'observabilité existant
9. **Ne pas exposer** MinIO console (9001), OPA (8181) et PostgreSQL (5432) en externe
10. **Limites de ressources** — Ajouter des limites CPU/mémoire aux services Docker

### Politique de sécurité

- Les vulnérabilités doivent être signalées via **GitHub Security Advisories** (ne pas ouvrir d'issue publique)
- Accusé de réception sous 48h, mise à jour sous 7 jours
- Périmètre couvert : contournements auth/authz, injections (SQL, XSS, commande), exposition de données, mauvaises configurations, vulnérabilités des politiques OPA

---

## 13. Parcours utilisateur type

### Scénario : Campagne d'audit de sécurité

```
┌─────────────────────────────────────────────────────────┐
│ ÉTAPE 1 — Connexion                                     │
│ L'utilisateur se connecte via Keycloak (OIDC + MFA)     │
│ et accède au Cockpit                                    │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│ ÉTAPE 2 — Création du projet                            │
│ Créer un projet de sécurité avec un périmètre défini    │
│ (ex. "Audit SI Finance Q1 2025")                        │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│ ÉTAPE 3 — Ajout des objets                              │
│ Créer ou associer les objets du périmètre               │
│ (serveurs, applications, bases de données, etc.)        │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│ ÉTAPE 4 — Import des référentiels                       │
│ Importer les référentiels adaptés depuis la communauté  │
│ (ISO 27001, NIST CSF, CIS Benchmarks...)                │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│ ÉTAPE 5 — Association des checklists                    │
│ Créer ou sélectionner des checklists et les associer    │
│ aux objets du projet                                    │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│ ÉTAPE 6 — Exécution des runs                            │
│ Lancer les runs : évaluer chaque contrôle               │
│ (Conforme / Non conforme / Non applicable)              │
│ et attacher les preuves                                 │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│ ÉTAPE 7 — Analyse du score                              │
│ Consulter le Security Integrity Score dans le Cockpit   │
│ et le détail par objet                                  │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│ ÉTAPE 8 — Remédiation                                   │
│ Les tâches non conformes apparaissent dans le Kanban    │
│ → Prioriser, assigner, suivre l'avancement              │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│ ÉTAPE 9 — Re-run et validation                          │
│ Après corrections, relancer les runs pour vérifier      │
│ la conformité et l'évolution du score                   │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│ ÉTAPE 10 — Rapport et audit                             │
│ Générer un rapport de conformité, exporter le journal   │
│ d'audit et les preuves pour l'auditeur externe          │
└─────────────────────────────────────────────────────────┘
```

---

## 14. Bonnes pratiques recommandées

### Structurer les projets

- **Un projet = un périmètre clair** — Créez un projet par initiative, système ou domaine fonctionnel
- **Nommez explicitement** — Ex. "Audit SI Finance Q1 2025" plutôt que "Projet 1"
- **Associez tous les objets concernés** — Un projet complet donne un score représentatif

### Nommer les objets

- Adoptez une convention de nommage cohérente dans toute l'organisation
- Indiquez le type réel de l'objet
- Ajoutez suffisamment de contexte dans la description

### Choisir les bons référentiels

- Utilisez les référentiels communautaires adaptés à votre contexte réglementaire
- Commencez par un périmètre restreint puis élargissez progressivement
- Associez les checklists aux types d'objets pertinents (un référentiel réseau sur un objet Network)

### Exécuter les runs régulièrement

- Planifiez des campagnes de contrôle à intervalles réguliers
- Documentez systématiquement vos observations avec des preuves
- Un contrôle "Non applicable" est préférable à un contrôle ignoré

### Suivre la remédiation

- Traitez les tâches dans l'ordre de priorité
- Ne laissez pas les tâches s'accumuler sans suivi
- Relancez un run après correction pour vérifier la conformité
- Utilisez le Kanban comme outil de pilotage lors des réunions d'équipe

### Gérer les accès

- Appliquez le **principe du moindre privilège** : uniquement les permissions nécessaires
- Utilisez les **groupes** pour simplifier la gestion des habilitations
- Préférez les **rôles prédéfinis** aux permissions directes
- Révisez régulièrement les accès et appartenances aux groupes

### Capitaliser sur les preuves

- Attachez une preuve à **chaque contrôle** évalué, même conforme
- Utilisez des captures horodatées, exports de configuration ou liens vers des documents
- Les preuves facilitent les audits et la traçabilité dans le temps

---

## 15. Glossaire

| Terme | Définition |
|-------|------------|
| **Action** | Opération autorisée sur un type de ressource : `read`, `create`, `update`, `delete`, `export`, `manage` |
| **Checklist** | Liste de contrôles de sécurité à vérifier sur un ou plusieurs objets |
| **Cockpit** | Tableau de bord principal affichant les indicateurs globaux de sécurité |
| **Contrôle** | Point de vérification de sécurité issu d'un référentiel (ex. "Le chiffrement TLS est activé") |
| **Evidence (Preuve)** | Document, fichier ou lien attaché à un contrôle lors d'un run pour démontrer la conformité |
| **Groupe d'utilisateurs** | Regroupement d'utilisateurs partageant des rôles et permissions communs ; les membres héritent automatiquement des habilitations du groupe |
| **Objet** | Élément du SI soumis à des contrôles (serveur, application, dépôt, identité, etc.) |
| **Groupe d'objets** | Regroupement logique d'objets pour faciliter la gestion et les contrôles collectifs |
| **OPA** | Open Policy Agent — Moteur d'autorisation policy-as-code utilisant le langage Rego |
| **Permission directe** | Permission attribuée individuellement à un utilisateur sur un type de ressource |
| **Permissions effectives** | Ensemble des permissions d'un utilisateur, calculé par union de toutes ses sources |
| **Projet de sécurité** | Périmètre regroupant des objets et checklists pour un suivi consolidé |
| **Référentiel** | Ensemble structuré de contrôles de sécurité (ISO 27001, NIST, OWASP, etc.) |
| **ResourceType** | Catégorie de ressource sur laquelle s'appliquent les permissions |
| **Rôle** | Ensemble prédéfini de permissions assignable à un utilisateur ou un groupe |
| **Run** | Exécution d'une checklist à un instant donné, produisant un score de conformité |
| **Security Integrity Score** | Indicateur de conformité calculé à partir des résultats des runs |
| **Tâche de remédiation** | Action corrective générée lorsqu'un contrôle est non conforme lors d'un run |
| **Zero Trust** | Modèle de sécurité qui n'accorde aucune confiance implicite et vérifie systématiquement |

---

*Document généré à partir de la documentation officielle OSCI Platform.*
*Version : Février 2026*
