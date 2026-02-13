# Remédiation

Le module Remédiation offre un Kanban pour suivre et prioriser les actions correctives issues des contrôles non conformes.

## Rôle du module

Chaque contrôle identifié comme non conforme lors d'un run génère une tâche de remédiation. Ce module permet de visualiser, organiser et suivre l'avancement de ces tâches jusqu'à leur résolution.

## Ce que vous pouvez y faire

- **Visualiser le Kanban** — Les tâches sont organisées en colonnes (À faire, En cours, Terminé)
- **Déplacer les tâches** — Faites glisser les cartes entre les colonnes pour refléter l'avancement
- **Prioriser** — Identifiez les tâches les plus critiques à traiter en premier
- **Consulter le détail** — Chaque tâche indique le contrôle d'origine, l'objet concerné et la checklist associée
- **Filtrer** — Par objet, projet, priorité ou assignation

## Flux de travail

1. Un run de checklist identifie des contrôles non conformes
2. Des tâches de remédiation sont automatiquement créées dans la colonne "À faire"
3. Les équipes prennent en charge les tâches et les déplacent vers "En cours"
4. Une fois la correction appliquée et vérifiée, la tâche passe en "Terminé"
5. Un nouveau run peut être lancé pour confirmer la conformité

## Accès

- **Lecture** : permission `read` sur `task`
- **Modification** : permission `update` sur `task`
- **Création manuelle** : permission `create` sur `task`
