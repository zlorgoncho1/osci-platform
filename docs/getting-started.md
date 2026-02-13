# Premiers pas

Ce guide vous accompagne de la connexion à votre première évaluation de sécurité.

## Connexion

OSCI propose deux modes d'authentification :

### Authentification locale (email / mot de passe)

1. Sur la page de connexion, saisissez votre **email** et votre **mot de passe**
2. Cliquez sur **Sign In**
3. Lors de la première connexion, vous serez invité à changer votre mot de passe (minimum 8 caractères)

L'authentification locale est disponible dès lors que les variables `API_JWT_SECRET` et `API_JWT_REFRESH_SECRET` sont configurées dans l'environnement. Les tokens d'accès ont une durée de vie de 15 minutes et sont rafraîchis automatiquement (refresh token valable 7 jours).

### Authentification SSO via Keycloak (OIDC)

1. Sur la page de connexion, cliquez sur **Authenticate with SSO**
2. Vous êtes redirigé vers Keycloak (le fournisseur d'identité)
3. Saisissez vos identifiants Keycloak
4. Si le MFA (TOTP) est activé sur votre compte, saisissez le code
5. Vous êtes redirigé vers le Cockpit OSCI

Le flux OIDC utilise le protocole PKCE (Authorization Code Flow) pour une sécurité maximale. La session est rafraîchie automatiquement en arrière-plan.

Les deux modes peuvent coexister : un administrateur peut se connecter en local tandis que les équipes utilisent le SSO d'entreprise.

## Découvrir le Cockpit

Après connexion, vous arrivez sur le **Cockpit**. Cette page d'accueil présente :

- Les indicateurs globaux de sécurité (nombre d'objets, projets actifs, score moyen)
- Le **Security Integrity Score** global avec visualisation circulaire
- La répartition par domaine de sécurité (Infrastructure, Code, DevOps, etc.)
- Les tâches de remédiation en attente par priorité
- Les objets surveillés avec leur score individuel
- Les projets actifs et leur progression
- Le flux d'audit en temps réel

## Importer un référentiel

Avant de créer des checklists, importez un référentiel de contrôles depuis la communauté :

1. Accédez à **Référentiels** dans la barre latérale
2. Cliquez sur **Community** pour ouvrir la bibliothèque communautaire
3. Parcourez les référentiels disponibles (ISO 27001, NIST CSF, OWASP, CIS, etc.)
4. Cliquez sur **Import All** pour importer un référentiel complet, ou dépliez-le pour importer une checklist spécifique
5. Le référentiel et ses contrôles sont copiés dans votre instance

Les référentiels communautaires proviennent du dépôt [zlorgoncho1/osci-referentiel](https://github.com/zlorgoncho1/osci-referentiel).

## Créer un projet

1. Rendez-vous dans **Projects** depuis la barre latérale
2. Cliquez sur **New Project**
3. Renseignez le nom, la description et le périmètre
4. Validez la création

## Ajouter des objets

1. Accédez à **Objects** dans la barre latérale
2. Créez un nouvel objet en choisissant son type (Infrastructure, Application, Repository, etc.)
3. Renseignez les informations demandées
4. Associez l'objet à un projet si nécessaire

## Utiliser une checklist

1. Accédez à **Checklists** dans la barre latérale
2. Créez une nouvelle checklist en sélectionnant des contrôles manuellement, ou
3. Depuis le détail d'un référentiel, cliquez sur **Checklist utilisateur depuis exigences** pour générer automatiquement une checklist à partir de tous les contrôles du référentiel
4. Associez la checklist aux objets à évaluer

## Lancer un run

1. Depuis le détail d'une checklist, cliquez sur **Run**
2. Sélectionnez l'objet cible
3. Pour chaque contrôle, indiquez le statut (Conforme, Non conforme, Non applicable, En attente)
4. Attachez les preuves pertinentes (fichiers, captures, liens)
5. Finalisez le run pour mettre à jour le score

## Suivre la remédiation

Les contrôles non conformes génèrent des tâches de remédiation. Retrouvez-les dans le **Kanban de remédiation** accessible depuis la barre latérale. Faites glisser les tâches entre les colonnes (À faire, En cours, Terminé) pour suivre l'avancement.

## Consulter le score

Le **Security Integrity Score** se met à jour après chaque run. Consultez-le dans :

- Le **Cockpit** pour une vue globale et par domaine
- Le détail d'un **objet** pour son score individuel
- Le détail d'un **projet** pour le score consolidé
- Le détail d'un **référentiel** pour le taux de couverture (pourcentage de contrôles mappés)
