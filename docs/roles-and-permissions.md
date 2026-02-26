# Rôles et permissions

Ce document décrit le modèle d'autorisation complet d'OSCI. Le système combine rôles, permissions directes, groupes d'utilisateurs et permissions effectives pour offrir un contrôle d'accès granulaire.

## Rôles prédéfinis

Chaque rôle porte un ensemble de permissions globales (type de ressource + actions). Un rôle peut être assigné directement à un utilisateur ou à un groupe d'utilisateurs.

| Rôle | Description | Périmètre |
|------|-------------|-----------|
| SecurityAdmin | Administrateur complet | Toutes les permissions sur toutes les ressources, y compris la gestion des utilisateurs et des groupes |
| SecurityManager | Gestionnaire sécurité | Création, modification et suivi des projets, objets, checklists, référentiels et rapports |
| ProjectOwner | Propriétaire de projet | Gestion complète des projets dont il est propriétaire (lead/owner) ou auxquels il est assigné comme owner ; peut gérer les concernés de ces projets |
| Auditor | Auditeur | Lecture seule sur les projets, objets, checklists, runs, preuves et journal d'audit |
| Developer | Développeur | Lecture et exécution sur les checklists, objets et tâches dans son périmètre ; peut voir et traiter les tâches où il est assigné, lead ou concerné |
| Viewer | Observateur | Lecture seule sur les ressources auxquelles il a accès |

## Types de ressources

Les permissions s'appliquent à un type de ressource :

| Type | Description |
|------|-------------|
| `project` | Projets de sécurité |
| `object` | Objets (assets du SI) |
| `object_group` | Groupes d'objets |
| `checklist` | Checklists de contrôles |
| `checklist_run` | Exécutions de checklists |
| `task` | Tâches de remédiation |
| `evidence` | Preuves |
| `incident` | Incidents de sécurité |
| `report` | Rapports |
| `audit_log` | Journal d'audit |
| `referentiel` | Référentiels de contrôles |
| `framework_control` | Contrôles individuels |
| `cartography_asset` | Assets de la cartographie |
| `cartography_relation` | Relations dans la cartographie |
| `integration` | Intégrations externes |
| `user` | Utilisateurs |
| `user_group` | Groupes d'utilisateurs |

## Actions

Chaque permission autorise une ou plusieurs actions :

| Action | Description |
|--------|-------------|
| `read` | Consulter la ressource |
| `create` | Créer une nouvelle ressource |
| `update` | Modifier une ressource existante |
| `delete` | Supprimer une ressource |
| `export` | Exporter les données de la ressource |
| `manage` | Administration complète (inclut toutes les actions) |

### Hiérarchie implicite des actions

Les actions suivent une hiérarchie : accorder une action de niveau supérieur accorde automatiquement les actions qu'elle implique, sans avoir à les cocher explicitement.

```
manage  →  read, create, update, delete, export
create  →  read
update  →  read
delete  →  read
export  →  read
read    →  (aucune)
```

**Exemples concrets :**

- Accorder `update` sur un projet → l'utilisateur **voit** le projet dans la liste et peut le modifier, mais ne peut ni le supprimer ni l'exporter
- Accorder `manage` sur un objet → l'utilisateur dispose de toutes les actions sur cet objet, y compris la gestion des accès
- Accorder `export` sur un rapport → l'utilisateur peut le consulter et le télécharger, mais pas le modifier ni le supprimer

Cette hiérarchie s'applique à **tous les niveaux** de permission : rôles globaux, permissions directes, permissions de groupe et accès par ressource (ResourceAccess).

## Permissions directes

En plus des rôles, des permissions peuvent être attribuées **directement à un utilisateur** sur un type de ressource. Cela permet de gérer des cas particuliers sans créer de rôle dédié.

Exemple : accorder la permission `read` sur `audit_log` à un utilisateur spécifique qui n'est pas auditeur mais doit consulter les journaux.

Les permissions directes se gèrent dans **Administration > Utilisateurs** lors de l'édition d'un compte.

## Groupes d'utilisateurs

Un **groupe d'utilisateurs** regroupe des utilisateurs partageant des besoins d'accès communs. Chaque groupe peut porter :

- **Des rôles** — Tous les membres héritent de ces rôles
- **Des permissions** — Tous les membres héritent de ces permissions

### Exemple

Le groupe "Équipe Audit SI" peut avoir :
- Le rôle **Auditor** assigné au niveau du groupe
- Une permission supplémentaire `read` sur `incident`

Tous les membres de ce groupe bénéficieront automatiquement des permissions de l'Auditor et de la lecture des incidents.

Les groupes se gèrent dans **Administration > Groupes**.

## Permissions effectives

Les **permissions effectives** d'un utilisateur sont l'union de toutes ses sources de permissions :

1. **Rôles directs** — Rôles assignés directement à l'utilisateur
2. **Rôles hérités des groupes** — Rôles portés par les groupes dont l'utilisateur est membre
3. **Permissions des groupes** — Permissions globales portées par les groupes
4. **Permissions directes** — Permissions attribuées individuellement à l'utilisateur
5. **Accès par ressource** — Accès accordé à des instances spécifiques d'une ressource
6. **Créateur** — L'utilisateur qui a créé une ressource dispose d'un accès implicite

Le système évalue ces sources dans l'ordre et accorde l'accès dès qu'une source l'autorise. Un SecurityAdmin dispose de toutes les permissions sans restriction.

Être listé comme **concerné** sur un projet ou une tâche n'accorde pas de permission en soi ; les droits restent ceux définis par les rôles et l'accès ressource. En revanche, les concernés peuvent utiliser les filtres « Mes tâches » et « Projets où je suis concerné » pour retrouver ces éléments.

## Visibilité par ressource (instance-level)

La visibilité par ressource s'applique à **tous** les types "par instance" :

| Type | Champ créateur | Filtrage liste | Accès Panel |
|------|---------------|----------------|-------------|
| `project` | `createdById` | Oui | Oui |
| `object` | `createdById` | Oui | Oui |
| `object_group` | `createdById` | Oui | Oui |
| `checklist` | `createdById` | Oui | Oui |
| `task` | `createdById` | Oui | Oui |
| `incident` | `createdById` | Oui | Non |
| `report` | `generatedById` | Oui | Non |
| `evidence` | `uploadedById` | Oui | Non |
| `cartography_asset` | `createdById` | Oui | Non |
| `integration` | `createdById` | Oui | Non |

### Règle de visibilité

Les listes ne retournent que les entrées pour lesquelles l'utilisateur a au moins `read` (directement ou par hiérarchie implicite — par exemple un accès `update` suffit puisqu'il implique `read`) :
- Via un **rôle global** (toutes les instances sont visibles)
- Via un **ResourceAccess** explicite sur l'instance (toute action accorde la visibilité grâce à la hiérarchie)
- En tant que **créateur** de l'instance (champ `createdById`, `uploadedById` ou `generatedById`)

### Gestion des accès

L'utilisateur peut gérer les accès sur une ressource s'il dispose de la permission `manage` :
- Via le rôle **SecurityAdmin** (manage sur tout)
- Via un **ResourceAccess** avec l'action `manage`
- En tant que **créateur** de la ressource (accès complet implicite)

Le panneau "Access Control" (ResourceAccessPanel) s'affiche sur les pages de détail lorsque l'utilisateur a `manage` sur l'instance.

### Action Export

Les routes d'export (audit CSV, téléchargement de rapport) requièrent explicitement l'action **export** :
- `GET /audit-logs/export` → `RequirePermission(audit_log, export)`
- `GET /reports/:id/download` → `RequirePermission(report, export)`
- Les rôles **SecurityAdmin**, **SecurityManager** et **Auditor** disposent de cette permission.

### Identifiant utilisateur

Toutes les clés étrangères liées au créateur (createdById, uploadedById, generatedById, grantedById) utilisent **user.userId** (ID interne dans la base User) et non `user.sub` (identifiant Keycloak).

## Visibilité dans l'interface

La barre latérale filtre automatiquement les modules affichés en fonction des permissions effectives de l'utilisateur. Un utilisateur ne voit que les sections auxquelles il a accès en lecture.

Les pages de détail utilisent `canResource(resourceType, resourceId, action)` pour afficher les boutons d'action (Modifier, Supprimer, Gérer les accès) selon les permissions sur l'instance spécifique, et non plus uniquement les permissions globales.
