# Cartographie

Le module Cartographie fournit une visualisation topologique des relations entre vos assets.

## Rôle du module

La cartographie permet de représenter graphiquement les liens entre les objets de votre système d'information (dépendances, flux réseau, relations hiérarchiques). Cette vue aide à identifier les points critiques et à comprendre les impacts en cas d'incident.

## Ce que vous pouvez y faire

- **Visualiser le graphe** — Vue interactive des objets et de leurs relations
- **Naviguer** — Zoom, pan et sélection d'éléments dans le graphe
- **Explorer les relations** — Cliquer sur un noeud pour voir ses connexions
- **Créer des relations** — Ajouter des liens entre objets pour modéliser les dépendances
- **Filtrer** — Par type d'objet, par projet ou par nature de relation

## Lecture du graphe

- Chaque **noeud** représente un objet (avec son type et son score)
- Chaque **lien** représente une relation (dépendance, flux, inclusion)
- Les couleurs indiquent le niveau de conformité (emerald = conforme, amber = attention, rose = critique)

## Accès

- **Lecture** : permission `read` sur `cartography_asset`
- **Création de relations** : permission `create` sur `cartography_relation`
- **Modification** : permission `update` sur `cartography_asset` ou `cartography_relation`
