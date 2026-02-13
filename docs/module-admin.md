# Administration

Le module Administration permet de gérer les utilisateurs, les groupes d'utilisateurs et les rôles de la plateforme.

## Rôle du module

L'administration centralise la gestion des accès et des habilitations. Elle est réservée aux utilisateurs disposant des permissions appropriées (typiquement le rôle SecurityAdmin ou des permissions `read`/`manage` sur les ressources `user` et `user_group`).

## Utilisateurs

### Liste des utilisateurs

- **Consulter** la liste de tous les utilisateurs avec leurs rôles et statut
- **Rechercher** un utilisateur par nom ou email

### Édition d'un utilisateur

- **Informations générales** — Nom, email, statut du compte
- **Rôles assignés** — Ajouter ou retirer des rôles prédéfinis (SecurityAdmin, SecurityManager, ProjectOwner, Auditor, Developer, Viewer)
- **Permissions directes** — Configurer des permissions spécifiques par type de ressource et actions, indépendamment des rôles. Utile pour des cas particuliers sans créer de rôle dédié

### Accès

- **Lecture** : permission `read` sur `user`
- **Modification** : permission `manage` sur `user`

## Groupes d'utilisateurs

### Liste des groupes

- **Consulter** tous les groupes avec leur nombre de membres
- **Créer** un nouveau groupe (nom, slug, description)

### Détail d'un groupe

- **Membres** — Ajouter ou retirer des utilisateurs du groupe
- **Rôles du groupe** — Assigner des rôles au groupe ; tous les membres héritent de ces rôles
- **Permissions du groupe** — Configurer des permissions globales au niveau du groupe ; tous les membres héritent de ces permissions

Les membres d'un groupe bénéficient automatiquement de l'union des rôles et permissions du groupe, en plus de leurs propres rôles et permissions individuels.

### Accès

- **Lecture** : permission `read` sur `user_group`
- **Création / modification** : permission `create`, `update` ou `delete` sur `user_group`

## Rôles

### Liste des rôles

- **Consulter** les rôles prédéfinis et leurs permissions associées
- **Voir le détail** d'un rôle : types de ressources et actions autorisées

### Accès

- **Lecture** : permission `manage` sur `user`

Pour une description complète du modèle d'autorisation, consultez [Rôles et permissions](roles-and-permissions).
