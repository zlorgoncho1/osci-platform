# Glossaire

Définitions des termes clés utilisés dans OSCI.

| Terme | Définition |
|-------|------------|
| **Action** | Opération autorisée sur un type de ressource : `read`, `create`, `update`, `delete`, `export`, `manage` |
| **Authentification locale** | Mode de connexion par email et mot de passe, utilisant des tokens JWT signés avec `API_JWT_SECRET`. Tokens d'accès valables 15 minutes, refresh tokens valables 7 jours |
| **Authentification SSO** | Mode de connexion via Keycloak (OIDC) avec le flux Authorization Code + PKCE. Support du MFA (TOTP) |
| **Checklist** | Liste de contrôles de sécurité à vérifier sur un ou plusieurs objets |
| **Checklist de référence** | Template de checklist associé à un référentiel, importable depuis la bibliothèque communautaire. Contient des items pré-mappés aux contrôles du référentiel |
| **Contrôle** | Point de vérification de sécurité issu d'un référentiel (ex. "Le chiffrement TLS est activé") |
| **controlCode** | Champ d'un item de checklist qui établit le lien avec un contrôle de framework du référentiel (ex. `A.5.12`). Permet le calcul automatique du taux de couverture |
| **Evidence (Preuve)** | Document, fichier ou lien attaché à un contrôle lors d'un run pour démontrer la conformité |
| **FrameworkControl** | Exigence de sécurité individuelle au sein d'un référentiel, identifiée par un code (ex. `A.5.12`, `AC-6`). Les contrôles peuvent être hiérarchiques (parent / enfants) |
| **Groupe d'utilisateurs** | Regroupement d'utilisateurs partageant des rôles et permissions communs. Les membres héritent automatiquement des habilitations du groupe |
| **Objet** | Élément du système d'information soumis à des contrôles (serveur, application, dépôt, identité, etc.) |
| **Groupe d'objets** | Regroupement logique d'objets pour faciliter la gestion et les contrôles collectifs |
| **Permission directe** | Permission attribuée individuellement à un utilisateur sur un type de ressource, indépendamment des rôles et des groupes |
| **Permissions effectives** | Ensemble des permissions dont dispose un utilisateur, calculé par union de ses rôles directs, rôles hérités des groupes, permissions des groupes, permissions directes et accès par ressource |
| **Projet de sécurité** | Périmètre regroupant des objets et checklists pour un suivi consolidé |
| **Référentiel** | Ensemble structuré de contrôles de sécurité issu d'un framework reconnu (ISO 27001, NIST CSF, OWASP, SOC 2, CIS) ou défini en interne. Contient des contrôles de framework et peut avoir des checklists de référence associées |
| **Référentiel communautaire** | Référentiel partagé via le dépôt GitHub [zlorgoncho1/osci-referentiel](https://github.com/zlorgoncho1/osci-referentiel), importable en un clic dans votre instance OSCI |
| **ResourceType** | Catégorie de ressource sur laquelle s'appliquent les permissions (project, object, checklist, user, etc.) |
| **Rôle** | Ensemble prédéfini de permissions (SecurityAdmin, Auditor, Developer, etc.) assignable à un utilisateur ou un groupe |
| **Run** | Exécution d'une checklist à un instant donné, produisant un score de conformité |
| **Security Integrity Score** | Indicateur de conformité calculé à partir des résultats des runs, reflétant le niveau de sécurité d'un objet ou projet |
| **Tâche de remédiation** | Action corrective générée lorsqu'un contrôle est identifié comme non conforme lors d'un run |
| **Taux de couverture** | Pourcentage de contrôles d'un référentiel effectivement évalués dans des checklists (contrôles mappés / total des contrôles). Visible dans le détail d'un référentiel |
