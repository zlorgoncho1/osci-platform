# Bonnes pratiques

Ce document rassemble les recommandations d'usage pour tirer le meilleur parti d'OSCI.

## Structurer vos projets

- **Un projet = un périmètre clair** — Créez un projet par initiative, système ou domaine fonctionnel
- **Nommez explicitement** — Utilisez des noms descriptifs qui identifient sans ambiguïté le périmètre (ex. "Audit SI Finance Q1 2025")
- **Associez tous les objets concernés** — Un projet complet donne un score représentatif

## Bien nommer les objets

- Adoptez une convention de nommage cohérente dans votre organisation
- Indiquez le type réel de l'objet (Infrastructure, Application, Repository, etc.)
- Ajoutez suffisamment de contexte dans la description pour qu'un autre utilisateur comprenne de quoi il s'agit

## Choisir les bons référentiels

- Utilisez les référentiels communautaires adaptés à votre contexte réglementaire et technique
- Commencez par un périmètre restreint de contrôles puis élargissez progressivement
- Associez les checklists aux types d'objets pertinents (un référentiel réseau sur un objet Network, pas sur un Human)

## Exécuter les runs régulièrement

- Planifiez des campagnes de contrôle à intervalles réguliers
- Documentez systématiquement vos observations avec des preuves
- Un contrôle "Non applicable" est préférable à un contrôle ignoré

## Suivre la remédiation

- Traitez les tâches de remédiation dans l'ordre de priorité
- Ne laissez pas les tâches s'accumuler sans suivi
- Relancez un run après correction pour vérifier la conformité
- Utilisez le Kanban comme outil de pilotage lors des réunions d'équipe

## Gérer les accès

- Appliquez le principe du moindre privilège : attribuez uniquement les permissions nécessaires
- Utilisez les groupes d'utilisateurs pour simplifier la gestion des habilitations
- Préférez les rôles prédéfinis aux permissions directes quand c'est possible
- Révisez régulièrement les accès et les appartenances aux groupes

## Capitaliser sur les preuves

- Attachez une preuve à chaque contrôle évalué, même conforme
- Utilisez des captures d'écran horodatées, des exports de configuration ou des liens vers des documents
- Les preuves facilitent les audits et la traçabilité dans le temps
