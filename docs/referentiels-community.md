# Référentiels communautaires

OSCI dispose d'une bibliothèque de référentiels partagés par la communauté, hébergée sur GitHub. Ce système permet d'importer en un clic des frameworks de sécurité complets avec leurs contrôles et checklists pré-construites.

## Dépôt source

Les référentiels communautaires sont hébergés dans le dépôt GitHub :

**[zlorgoncho1/osci-referentiel](https://github.com/zlorgoncho1/osci-referentiel)**

Chaque dossier du dépôt contient un fichier `referentiel.json` décrivant un framework complet : métadonnées, contrôles et checklists de référence.

La variable d'environnement `GITHUB_REFERENTIEL_REPO` permet de pointer vers un autre dépôt si vous maintenez votre propre bibliothèque.

## Parcourir les référentiels disponibles

1. Accédez à **Référentiels** dans la barre latérale
2. Cliquez sur le bouton **Community** en haut de page
3. La liste des référentiels disponibles s'affiche avec pour chacun :
   - **Nom**, **type**, **version** et **description**
   - **Nombre de contrôles** et **nombre de checklists** incluses
   - Badge **All Imported** si tout est déjà importé dans votre instance

## Importer un référentiel complet

1. Dans le panneau Community, cliquez sur **Import All** sur le référentiel souhaité
2. Le système importe :
   - Le référentiel (métadonnées)
   - Tous les contrôles (exigences) avec leur hiérarchie
   - Toutes les checklists de référence avec leurs items
   - Le mapping automatique entre les items de checklist et les contrôles (via le code du contrôle)
3. Si le référentiel existe déjà (même code), seules les checklists manquantes sont ajoutées

## Importer une checklist spécifique

Vous pouvez importer une seule checklist sans prendre l'ensemble du référentiel :

1. Cliquez sur le référentiel pour le déplier
2. Consultez la liste des checklists avec leur titre, nombre d'items et domaine
3. Cliquez sur **Import** à côté de la checklist souhaitée
4. Le référentiel et ses contrôles sont créés si nécessaire, puis la checklist est importée

Les checklists déjà importées affichent un badge **Imported**.

## Structure d'un référentiel communautaire

Chaque fichier `referentiel.json` suit cette structure :

```json
{
  "code": "ISO27001",
  "name": "ISO/IEC 27001:2022",
  "type": "ISO",
  "domain": "Governance",
  "version": "2022",
  "description": "...",
  "controls": [
    {
      "code": "A.5.12",
      "title": "Classification de l'information",
      "description": "...",
      "orderIndex": 0
    }
  ],
  "checklists": [
    {
      "title": "ISO 27001 - Audit Infrastructure",
      "domain": "SecurityInfra",
      "checklistType": "Compliance",
      "criticality": "High",
      "items": [
        {
          "question": "Le contrôle d'accès est-il en place ?",
          "itemType": "YesNo",
          "controlCode": "A.5.12"
        }
      ]
    }
  ]
}
```

Le champ `controlCode` dans les items de checklist crée automatiquement le lien entre l'item et le contrôle correspondant du référentiel.

## Contribuer

Le dépôt communautaire est ouvert aux contributions. Pour proposer un nouveau référentiel :

1. Forkez le dépôt [zlorgoncho1/osci-referentiel](https://github.com/zlorgoncho1/osci-referentiel)
2. Créez un dossier pour votre référentiel (ex. `mon-referentiel/`)
3. Ajoutez un fichier `referentiel.json` suivant la structure ci-dessus
4. Soumettez une pull request

Les types de référentiels supportés sont : `ISO`, `NIST`, `OWASP`, `SOC2`, `CIS` et `Internal`.

Les domaines disponibles couvrent l'ensemble du périmètre sécurité : Governance, SecurityInfra, SecurityCode, SecurityDevOps, SecurityRepo, SecurityCluster, SecurityPipeline, SecurityNetworking, SecurityTooling, SecurityBackup, DisasterRecovery, SecurityHuman, SecurityData, et bien d'autres.
