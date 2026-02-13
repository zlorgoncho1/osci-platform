# Référentiels

Le module Référentiels est au coeur de la démarche de conformité dans OSCI. Il structure les exigences de sécurité en frameworks réutilisables et les connecte aux checklists opérationnelles.

## Rôle du module

Un **référentiel** est un ensemble structuré de **contrôles** (exigences de sécurité) issu d'un framework reconnu (ISO 27001, NIST CSF, OWASP Top 10, CIS Benchmarks, SOC 2) ou défini en interne. Les contrôles des référentiels alimentent les checklists et permettent de mesurer le taux de couverture de votre conformité.

## Structure d'un référentiel

Chaque référentiel contient :

| Champ | Description |
|-------|-------------|
| **Code** | Identifiant court (ex. `ISO27001`, `NIST_CSF`) |
| **Nom** | Nom complet (ex. "ISO/IEC 27001:2022") |
| **Type** | ISO, NIST, OWASP, SOC2, CIS ou Internal |
| **Domaine** | Domaine de sécurité principal (Governance, SecurityInfra, SecurityCode, etc.) |
| **Version** | Version du framework (ex. "2022", "v2.0") |
| **Contrôles** | Liste hiérarchique d'exigences (FrameworkControl) |
| **Checklists de référence** | Templates de checklists associées au référentiel |

## Contrôles (exigences)

Un **contrôle** (FrameworkControl) représente une exigence de sécurité individuelle :

- **Code** — Identifiant du contrôle dans le framework (ex. `A.5.12`, `AC-6`)
- **Titre** — Intitulé de l'exigence
- **Description** — Détail et recommandations
- **Hiérarchie** — Les contrôles peuvent être imbriqués (parent / enfants) pour refléter la structure du framework source
- **Ordre** — Position d'affichage dans le référentiel

Les contrôles sont **mappés** aux items de checklists via le champ `frameworkControlId`. Ce mapping permet de calculer le **taux de couverture** : pourcentage de contrôles du référentiel effectivement évalués dans des checklists.

## Ce que vous pouvez y faire

### Liste des référentiels

- **Consulter** tous les référentiels avec leur code, type, version et nombre de contrôles
- **Filtrer** par type (ISO, NIST, OWASP, SOC2, CIS, Internal)
- **Rechercher** par nom ou code
- **Créer** un nouveau référentiel interne

### Détail d'un référentiel

- **Statistiques** — Nombre de checklists, nombre d'exigences, exigences mappées, taux de couverture (%)
- **Checklists de référence** — Templates associés au référentiel, créer/modifier/supprimer
- **Exigences** — Table de tous les contrôles avec leur code, titre et nombre de mappings
- **Créer un contrôle** — Ajouter une nouvelle exigence au référentiel

### Actions clés

- **Créer une checklist utilisateur depuis les exigences** — Génère automatiquement une checklist contenant un item par contrôle du référentiel, pré-mappés. Prête à exécuter
- **Importer des contrôles depuis une checklist** — Extrait les items d'une checklist existante comme contrôles du référentiel
- **Copier les contrôles d'un autre référentiel** — Duplique les exigences d'un référentiel source

### Détail d'un contrôle

- **Description** complète de l'exigence
- **Items de checklist mappés** — Liste de tous les items de checklists liés à ce contrôle, avec lien vers la checklist

### Bibliothèque communautaire

Accédez à la section **Community** pour importer des référentiels partagés par la communauté OSCI. Voir [Référentiels communautaires](referentiels-community) pour le détail.

## Flux de travail typique

```
Importer un référentiel (Community ou création manuelle)
    │
    ▼
Consulter les contrôles / exigences
    │
    ▼
Créer une checklist depuis les exigences (auto-mapping)
    │
    ▼
Associer la checklist à des objets
    │
    ▼
Lancer des runs → évaluer chaque contrôle
    │
    ▼
Suivre le taux de couverture dans le détail du référentiel
```

## Accès

- **Lecture** : permission `read` sur `referentiel` et `framework_control`
- **Création / modification** : permission `create` ou `update` sur `referentiel`
- **Suppression** : permission `delete` sur `referentiel`
- **Création de checklists** : permission `create` sur `checklist`
