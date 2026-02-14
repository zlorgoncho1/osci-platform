# Concepts clés

Ce document présente les notions fondamentales d'OSCI. Comprendre ces concepts permet de tirer le meilleur parti de la plateforme.

## Objets

Un **objet** représente un élément de votre système d'information soumis à des contrôles de sécurité. Chaque objet possède un type parmi :

- **Project** — Un projet applicatif ou organisationnel
- **Human** — Une identité humaine (collaborateur, prestataire)
- **Infrastructure** — Un composant d'infrastructure générique
- **Codebase** — Un dépôt de code source
- **Pipeline** — Un pipeline CI/CD
- **Cluster** — Un cluster de conteneurs (Kubernetes, Docker Swarm)
- **DataAsset** — Un jeu de données
- **Tool** — Un outil logiciel (SaaS, on-premise)
- **Network** — Un segment réseau
- **AISystem** — Un système d'intelligence artificielle
- **SystemTool** — Un outil système
- **AgentTool** — Un outil d'agent automatisé
- **Server** — Un serveur physique ou virtuel
- **Database** — Une base de données
- **Device** — Un équipement (poste de travail, BYOD, mobile)
- **Application** — Une application déployée
- **Cloud** — Un compte ou tenant cloud (AWS, Hetzner, IONOS, etc.)
- **ThirdParty** — Un prestataire, fournisseur ou sous-traitant
- **Site** — Un local physique ou datacenter
- **Domain** — Un nom de domaine (DNS)
- **Storage** — Un service de stockage (S3, serveur de fichiers, CDN)
- **PhysicalAsset** — Un matériel inventorié (connecté ou non au réseau)

Les objets peuvent être regroupés en **groupes d'objets** pour faciliter la gestion et appliquer des contrôles collectifs.

## Projets de sécurité

Un **projet de sécurité** regroupe des objets et des checklists autour d'un périmètre défini (un projet métier, un audit, une campagne de remédiation). Il fournit une vue consolidée du score et de l'avancement.

## Checklists et items

Une **checklist** est une liste d'**items** de sécurité à vérifier. Chaque item peut être lié à un **contrôle de framework** (exigence d'un référentiel) via le champ `controlCode`. Les checklists peuvent être créées manuellement, générées automatiquement depuis les exigences d'un référentiel, ou importées depuis la bibliothèque communautaire. Une checklist peut être associée à un ou plusieurs objets.

## Runs

Un **run** est l'exécution d'une checklist à un instant donné. Pour chaque contrôle, l'opérateur indique le statut (conforme, non conforme, non applicable, etc.) et peut attacher des preuves. Le run produit un score de conformité.

## Security Integrity Score

Le **Security Integrity Score** est un indicateur calculé à partir des résultats des runs. Il reflète le niveau de conformité d'un objet ou d'un projet. Ce score est visible dans le Cockpit et dans le détail de chaque objet.

## Preuves (Evidence)

Une **preuve** est un document, fichier ou lien attaché à un contrôle lors d'un run. Les preuves démontrent la conformité et facilitent les audits.

## Tâches de remédiation

Lorsqu'un contrôle est identifié comme non conforme, une **tâche de remédiation** est créée. Les tâches sont organisées dans un Kanban (À faire, En cours, Terminé) pour faciliter le suivi.

## Référentiels et contrôles de framework

Un **référentiel** est un ensemble structuré d'exigences de sécurité issu d'un framework reconnu (ISO 27001, NIST CSF, OWASP Top 10, CIS Benchmarks, SOC 2) ou défini en interne. Chaque référentiel contient des **contrôles de framework** (FrameworkControl) — les exigences individuelles identifiées par un code (ex. `A.5.12`, `AC-6`).

Les contrôles de framework sont **mappés** aux items des checklists via le champ `controlCode`. Ce mapping permet de calculer le **taux de couverture** : le pourcentage de contrôles du référentiel effectivement évalués dans des checklists.

OSCI propose une **bibliothèque communautaire** de référentiels hébergée sur [zlorgoncho1/osci-referentiel](https://github.com/zlorgoncho1/osci-referentiel). Vous pouvez importer un référentiel complet (métadonnées + contrôles + checklists de référence) en un clic, ou importer une checklist spécifique d'un référentiel.

Pour le détail, consultez [Référentiels](module-referentiels) et [Référentiels communautaires](referentiels-community).

## Authentification

OSCI propose deux modes d'authentification qui peuvent coexister :

- **Authentification locale** — Connexion par email et mot de passe. Les tokens JWT sont signés avec les secrets `API_JWT_SECRET` et `API_JWT_REFRESH_SECRET`. Tokens d'accès valables 15 minutes, refresh tokens valables 7 jours.
- **SSO via Keycloak (OIDC)** — Connexion via le fournisseur d'identité Keycloak avec le flux Authorization Code + PKCE. Support du MFA (TOTP). La session est rafraîchie automatiquement.

Les deux modes peuvent coexister : un administrateur peut se connecter en local tandis que les équipes utilisent le SSO d'entreprise.

## Modèle d'autorisation

OSCI utilise un modèle d'autorisation riche combinant :

- **Rôles** — Ensembles de permissions prédéfinis (SecurityAdmin, SecurityManager, Auditor, etc.)
- **Permissions directes** — Permissions individuelles sur un type de ressource
- **Groupes d'utilisateurs** — Regroupements dont les membres héritent des rôles et permissions du groupe
- **Permissions effectives** — Union de toutes les sources de permissions pour un utilisateur donné

Pour plus de détails, consultez [Rôles et permissions](roles-and-permissions).
