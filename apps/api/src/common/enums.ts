export enum ObjectType {
  Project = 'Project',
  Human = 'Human',
  Infrastructure = 'Infrastructure',
  Codebase = 'Codebase',
  Pipeline = 'Pipeline',
  Cluster = 'Cluster',
  DataAsset = 'DataAsset',
  Tool = 'Tool',
  Network = 'Network',
  AISystem = 'AISystem',
  SystemTool = 'SystemTool',
  AgentTool = 'AgentTool',
  Server = 'Server',
  Database = 'Database',
  Device = 'Device',
  Application = 'Application',
  Cloud = 'Cloud',
  ThirdParty = 'ThirdParty',
  Site = 'Site',
  Domain = 'Domain',
  Storage = 'Storage',
  PhysicalAsset = 'PhysicalAsset',
}

export enum ChecklistType {
  Compliance = 'Compliance',
  Actionable = 'Actionable',
}

export enum ChecklistDomain {
  SecurityInfra = 'SecurityInfra',
  SecurityCode = 'SecurityCode',
  SecurityDevOps = 'SecurityDevOps',
  SecurityRepo = 'SecurityRepo',
  SecurityCluster = 'SecurityCluster',
  SecurityPipeline = 'SecurityPipeline',
  SecurityNetworking = 'SecurityNetworking',
  SecurityTooling = 'SecurityTooling',
  SecurityBackup = 'SecurityBackup',
  DisasterRecovery = 'DisasterRecovery',
  SecurityHuman = 'SecurityHuman',
  FormationSecurity = 'FormationSecurity',
  AssuranceSecurity = 'AssuranceSecurity',
  PolitiqueSecurity = 'PolitiqueSecurity',
  Governance = 'Governance',
  Audit = 'Audit',
  Rapport = 'Rapport',
  DocumentsSecurity = 'DocumentsSecurity',
  SecurityData = 'SecurityData',
  SecretsCredentials = 'SecretsCredentials',
  NewTypeAttack = 'NewTypeAttack',
  IAPrompting = 'IAPrompting',
  Forensic = 'Forensic',
  Cartographie = 'Cartographie',
  PasswordSecurity = 'PasswordSecurity',
  PointSecurity = 'PointSecurity',
  SecurityPhysique = 'SecurityPhysique',
  SecuritySocialEngineering = 'SecuritySocialEngineering',
  SecurityMalware = 'SecurityMalware',
  SecurityCrypto = 'SecurityCrypto',
  RiskManagement = 'RiskManagement',
  ThirdPartyVendor = 'ThirdPartyVendor',
  AssetChangeManagement = 'AssetChangeManagement',
  Resilience = 'Resilience',
  SecurityArchitecture = 'SecurityArchitecture',
  IAMManagement = 'IAMManagement',
  VulnerabilityManagement = 'VulnerabilityManagement',
  MaliciousActivityPrevention = 'MaliciousActivityPrevention',
  Hardening = 'Hardening',
  AlertingMonitoring = 'AlertingMonitoring',
  IncidentResponse = 'IncidentResponse',
  AutomationOrchestration = 'AutomationOrchestration',
}

export enum ChecklistItemType {
  YesNo = 'YesNo',
  Score = 'Score',
  Evidence = 'Evidence',
  AutoCheck = 'AutoCheck',
}

export enum ReferenceType {
  ISO = 'ISO',
  NIST = 'NIST',
  OWASP = 'OWASP',
  Internal = 'Internal',
}

export enum ReferentielType {
  ISO = 'ISO',
  NIST = 'NIST',
  OWASP = 'OWASP',
  SOC2 = 'SOC2',
  CIS = 'CIS',
  Internal = 'Internal',
}

export enum Criticality {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Critical = 'Critical',
}

export enum TaskStatus {
  ToDo = 'ToDo',
  InProgress = 'InProgress',
  Review = 'Review',
  Done = 'Done',
}

export enum RunStatus {
  InProgress = 'InProgress',
  Completed = 'Completed',
}

export enum RunItemStatus {
  Pending = 'Pending',
  Conformant = 'Conformant',
  NonConformant = 'NonConformant',
  NotApplicable = 'NotApplicable',
}

export enum IncidentSeverity {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Critical = 'Critical',
}

export enum ProjectStatus {
  Planning = 'Planning',
  Active = 'Active',
  OnHold = 'OnHold',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
}

export enum MilestoneStatus {
  Pending = 'Pending',
  InProgress = 'InProgress',
  Completed = 'Completed',
}

export enum AssetType {
  Server = 'Server',
  Database = 'Database',
  Network = 'Network',
  Firewall = 'Firewall',
  Router = 'Router',
  Switch = 'Switch',
  Workstation = 'Workstation',
  Application = 'Application',
  Container = 'Container',
  CloudService = 'CloudService',
  Storage = 'Storage',
  Pipeline = 'Pipeline',
  Cluster = 'Cluster',
  AISystem = 'AISystem',
  Tool = 'Tool',
  Codebase = 'Codebase',
  Human = 'Human',
  DataAsset = 'DataAsset',
  Infrastructure = 'Infrastructure',
  Project = 'Project',
}

export enum RelationType {
  connects_to = 'connects_to',
  depends_on = 'depends_on',
  hosts = 'hosts',
  authenticates = 'authenticates',
  stores_data = 'stores_data',
  contains = 'contains',
  monitors = 'monitors',
  backs_up = 'backs_up',
  replicates_to = 'replicates_to',
  routes_traffic_to = 'routes_traffic_to',
}

export enum UserRole {
  SecurityAdmin = 'SecurityAdmin',
  SecurityManager = 'SecurityManager',
  ProjectOwner = 'ProjectOwner',
  Auditor = 'Auditor',
  Developer = 'Developer',
  Viewer = 'Viewer',
}

export enum ResourceType {
  Project = 'project',
  Object = 'object',
  ObjectGroup = 'object_group',
  Checklist = 'checklist',
  ChecklistRun = 'checklist_run',
  Task = 'task',
  Evidence = 'evidence',
  Incident = 'incident',
  Report = 'report',
  AuditLog = 'audit_log',
  Referentiel = 'referentiel',
  FrameworkControl = 'framework_control',
  CartographyAsset = 'cartography_asset',
  CartographyRelation = 'cartography_relation',
  Integration = 'integration',
  User = 'user',
  UserGroup = 'user_group',
}

export enum Action {
  Read = 'read',
  Create = 'create',
  Update = 'update',
  Delete = 'delete',
  Export = 'export',
  Manage = 'manage',
}

/**
 * Action hierarchy: each action implicitly grants the actions listed here.
 * manage → all actions ; create/update/delete/export → read
 */
const ACTION_IMPLIES: Record<string, string[]> = {
  [Action.Manage]: [Action.Read, Action.Create, Action.Update, Action.Delete, Action.Export],
  [Action.Create]: [Action.Read],
  [Action.Update]: [Action.Read],
  [Action.Delete]: [Action.Read],
  [Action.Export]: [Action.Read],
  [Action.Read]: [],
};

/**
 * Returns true if at least one of the granted actions satisfies the required action,
 * either directly or through the implicit hierarchy.
 */
export function actionSatisfies(grantedActions: string[], requiredAction: string): boolean {
  for (const granted of grantedActions) {
    if (granted === requiredAction) return true;
    const implied = ACTION_IMPLIES[granted];
    if (implied && implied.includes(requiredAction)) return true;
  }
  return false;
}
