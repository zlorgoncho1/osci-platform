# Checklists

Le module Checklists est le coeur opérationnel d'OSCI. Il permet de créer, gérer et exécuter des listes de contrôles de sécurité.

## Rôle du module

Les checklists structurent les vérifications de sécurité à appliquer à vos objets. Chaque checklist contient des contrôles issus de référentiels (ISO 27001, NIST, OWASP, etc.) ou définis manuellement.

## Ce que vous pouvez y faire

### Liste des checklists

- **Consulter** toutes les checklists disponibles
- **Filtrer** par référentiel, par objet associé ou par statut
- **Créer** une nouvelle checklist en sélectionnant des contrôles

### Détail d'une checklist

- **Voir les contrôles** — Liste des points de vérification avec leurs descriptions
- **Associer à des objets** — Lier la checklist aux objets à évaluer
- **Consulter l'historique des runs** — Résultats des exécutions précédentes

### Exécution d'un run

1. Depuis le détail d'une checklist, lancez un nouveau run
2. Pour chaque contrôle, indiquez le statut :
   - **Conforme** — Le contrôle est satisfait
   - **Non conforme** — Le contrôle n'est pas satisfait (génère une tâche de remédiation)
   - **Non applicable** — Le contrôle ne s'applique pas à cet objet
   - **En attente** — Évaluation reportée
3. Attachez des preuves si nécessaire
4. Finalisez le run pour calculer le score

## Accès

- **Lecture** : permission `read` sur `checklist`
- **Création / modification** : permission `create` ou `update` sur `checklist`
- **Exécution d'un run** : permission `create` sur `checklist_run`
