# Rôles et permissions

Ce document décrit le modèle d'autorisation complet d'OSCI. Le système combine rôles, permissions directes, groupes d'utilisateurs et permissions effectives pour offrir un contrôle d'accès granulaire.

## Rôles prédéfinis

Chaque rôle porte un ensemble de permissions globales (type de ressource + actions). Un rôle peut être assigné directement à un utilisateur ou à un groupe d'utilisateurs.

| Rôle | Description | Périmètre |
|------|-------------|-----------|
| SecurityAdmin | Administrateur complet | Toutes les permissions sur toutes les ressources, y compris la gestion des utilisateurs et des groupes |
| SecurityManager | Gestionnaire sécurité | Création, modification et suivi des projets, objets, checklists, référentiels et rapports |
| ProjectOwner | Propriétaire de projet | Gestion complète des projets dont il est propriétaire et des objets associés |
| Auditor | Auditeur | Lecture seule sur les projets, objets, checklists, runs, preuves et journal d'audit |
| Developer | Développeur | Lecture et exécution sur les checklists, objets et tâches de remédiation dans son périmètre |
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

## Visibilité dans l'interface

La barre latérale filtre automatiquement les modules affichés en fonction des permissions effectives de l'utilisateur. Un utilisateur ne voit que les sections auxquelles il a accès en lecture.
