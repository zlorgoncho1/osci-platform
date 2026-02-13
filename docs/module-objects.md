# Objets

Le module Objets permet de gérer les éléments de votre système d'information soumis à des contrôles de sécurité.

## Rôle du module

Chaque objet représente un composant concret (serveur, application, dépôt de code, identité, etc.) dont la sécurité doit être évaluée et suivie. Les objets sont au centre du modèle OSCI : c'est à eux que sont associés les checklists, les runs et le Security Integrity Score.

## Ce que vous pouvez y faire

### Liste des objets

- **Consulter** la liste de tous les objets avec leur type, score et projet associé
- **Filtrer** par type, par projet ou par score
- **Créer** un nouvel objet en choisissant son type et en renseignant ses informations

### Détail d'un objet

- **Voir le score** — Security Integrity Score de l'objet avec son historique
- **Gérer les checklists associées** — Voir et associer des checklists
- **Consulter les runs** — Historique des exécutions de checklists sur cet objet
- **Voir les tâches de remédiation** — Liste des actions correctives liées à cet objet

### Groupes d'objets

Les objets peuvent être organisés en **groupes** pour faciliter la gestion :

- **Créer un groupe** — Regrouper des objets par thématique, périmètre ou équipe
- **Associer des objets** — Ajouter ou retirer des objets d'un groupe
- **Vue consolidée** — Score et état agrégés du groupe

## Accès

- **Lecture** : permission `read` sur `object` ou `object_group`
- **Création / modification** : permission `create` ou `update` sur `object`
- **Suppression** : permission `delete` sur `object`
