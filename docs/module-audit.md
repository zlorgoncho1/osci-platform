# Audit et preuves

Le module Audit centralise le journal d'audit et la gestion des preuves pour garantir la traçabilité de toutes les actions.

## Rôle du module

La traçabilité est essentielle dans une démarche de sécurité. Ce module enregistre automatiquement toutes les actions réalisées sur la plateforme et permet de gérer les preuves attachées aux contrôles.

## Ce que vous pouvez y faire

### Journal d'audit

- **Consulter les événements** — Liste chronologique de toutes les actions (création, modification, suppression, exécution de runs, etc.)
- **Filtrer** — Par utilisateur, par type d'action, par date ou par ressource concernée
- **Rechercher** — Trouver un événement spécifique dans l'historique
- **Exporter** — Extraire le journal pour un audit externe

### Preuves (Evidence)

- **Consulter les preuves** — Liste des fichiers et liens attachés aux contrôles
- **Ajouter une preuve** — Joindre un fichier, une capture d'écran ou un lien lors d'un run
- **Associer à un contrôle** — Chaque preuve est liée à un contrôle spécifique d'un run

## Accès

- **Journal d'audit** : permission `read` sur `audit_log`
- **Preuves** : permission `read` sur `evidence`
- **Ajout de preuves** : permission `create` sur `evidence`
- **Export** : permission `export` sur `audit_log`
