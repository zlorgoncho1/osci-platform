# Administration

Le module Administration permet de gérer les utilisateurs, les groupes d'utilisateurs et les rôles de la plateforme.

## Rôle du module

L'administration centralise la gestion des accès et des habilitations. Elle est réservée aux utilisateurs disposant des permissions appropriées (typiquement le rôle SecurityAdmin ou des permissions `read`/`manage` sur les ressources `user` et `user_group`).

## Utilisateurs

### Liste des utilisateurs

- **Consulter** la liste de tous les utilisateurs avec leurs rôles et statut
- **Rechercher** un utilisateur par nom ou email via la barre de recherche

### Filtres par source

La barre de filtres permet d'afficher les utilisateurs selon leur origine :

| Filtre | Description |
|---|---|
| **All** | Tous les utilisateurs actifs (enabled) |
| **Keycloak** | Utilisateurs actifs synchronisés avec Keycloak (SSO) |
| **Local** | Utilisateurs actifs créés localement (sans lien Keycloak) |
| **Disabled** | Utilisateurs désactivés |

Les filtres se combinent avec la recherche textuelle (nom, prénom, email).

### Détection de doublons

Le bouton **Duplicates** (visible pour les administrateurs) ouvre un panneau listant les groupes de doublons potentiels. Un badge indique le nombre de groupes détectés.

Trois critères de détection sont appliqués automatiquement :

1. **Email identique** — Même adresse email (cas rare, possible en cas d'import manuel)
2. **Nom similaire** — Même combinaison prénom + nom (normalisée, insensible à la casse)
3. **Préfixe email identique** — Même partie locale d'email (avant @) avec des domaines différents

Pour chaque groupe, un bouton **Merge** pré-remplit le formulaire de fusion en sélectionnant automatiquement l'utilisateur à conserver (priorité au compte Keycloak, sinon au dernier connecté).

### Fusion d'utilisateurs (Merge)

Permet de fusionner deux comptes utilisateur. Tous les rôles, accès et références sont transférés vers le compte conservé, et le compte source est supprimé. Accessible via le bouton **Merge Users** dans l'en-tête ou via le panneau de doublons.

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
