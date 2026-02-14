import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ConfirmService } from '../../shared/components/confirm/confirm.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { PermissionService } from '../../core/services/permission.service';

const DOMAINS = [
  { value: 'SecurityInfra', label: 'Security Infra' },
  { value: 'SecurityCode', label: 'Security Code' },
  { value: 'Governance', label: 'Governance' },
  { value: 'SecurityData', label: 'Security Data' },
  { value: 'SecurityCluster', label: 'Security Cluster' },
  { value: 'SecurityHuman', label: 'Security Human' },
  { value: 'SecurityPipeline', label: 'Security Pipeline' },
  { value: 'SecurityNetworking', label: 'Security Networking' },
  { value: 'SecurityTooling', label: 'Security Tooling' },
  { value: 'SecurityBackup', label: 'Security Backup' },
  { value: 'Audit', label: 'Audit' },
  { value: 'SecurityDevOps', label: 'Security DevOps' },
  { value: 'SecurityRepo', label: 'Security Repo' },
  { value: 'DisasterRecovery', label: 'Disaster Recovery' },
  { value: 'SecretsCredentials', label: 'Secrets & Credentials' },
  { value: 'IAPrompting', label: 'IA Prompting' },
  { value: 'Forensic', label: 'Forensic' },
  { value: 'Cartographie', label: 'Cartographie' },
  { value: 'Rapport', label: 'Rapport' },
  { value: 'DocumentsSecurity', label: 'Documents Security' },
  { value: 'PasswordSecurity', label: 'Password Security' },
  { value: 'PointSecurity', label: 'Point Security' },
  { value: 'FormationSecurity', label: 'Formation Security' },
  { value: 'NewTypeAttack', label: 'New Type Attack' },
  { value: 'AssuranceSecurity', label: 'Assurance Security' },
  { value: 'PolitiqueSecurity', label: 'Politique Security' },
  { value: 'SecurityPhysique', label: 'Sécurité Physique' },
  { value: 'SecuritySocialEngineering', label: 'Social Engineering' },
  { value: 'SecurityMalware', label: 'Malware' },
  { value: 'SecurityCrypto', label: 'Cryptographie' },
  { value: 'RiskManagement', label: 'Risk Management' },
  { value: 'ThirdPartyVendor', label: 'Third-Party / Vendor' },
  { value: 'AssetChangeManagement', label: 'Asset & Change Management' },
  { value: 'Resilience', label: 'Résilience' },
  { value: 'SecurityArchitecture', label: 'Security Architecture' },
  { value: 'IAMManagement', label: 'IAM Management' },
  { value: 'VulnerabilityManagement', label: 'Vulnerability Management' },
  { value: 'MaliciousActivityPrevention', label: 'Malicious Activity Prevention' },
  { value: 'Hardening', label: 'Hardening' },
  { value: 'AlertingMonitoring', label: 'Alerting & Monitoring' },
  { value: 'IncidentResponse', label: 'Incident Response' },
  { value: 'AutomationOrchestration', label: 'Automation & Orchestration' },
];

@Component({
  selector: 'app-referentiel-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="space-y-6" *ngIf="referentiel">
      <!-- Back + Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <a routerLink="/app/referentiels" class="p-2 rounded-lg hover:bg-white/5 transition-colors">
            <iconify-icon icon="solar:arrow-left-linear" width="18" class="text-zinc-500"></iconify-icon>
          </a>
          <div>
            <h1 class="text-2xl font-brand font-bold text-white">{{ referentiel.name }}</h1>
            <div class="flex items-center gap-3 mt-1">
              <span class="px-2 py-0.5 rounded border border-zinc-700 bg-zinc-800/50 text-zinc-400 text-[10px]">{{ referentiel.code }}</span>
              <span class="px-2 py-0.5 rounded border border-zinc-700 bg-zinc-800/50 text-zinc-400 text-[10px]">{{ referentiel.version }}</span>
              <span class="px-2 py-0.5 rounded text-[10px] bg-zinc-800/50 text-zinc-400">{{ referentiel.type }}</span>
              <a routerLink="/app/docs/module-referentiels"
                 class="inline-flex items-center gap-1 ml-1 text-zinc-600 hover:text-emerald-400 transition-colors">
                <iconify-icon icon="solar:book-2-linear" width="12"></iconify-icon>
                <span class="text-[10px]">Guide</span>
              </a>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button *ngIf="perm.canGlobal('framework_control', 'create')" (click)="showAddControlModal = true"
            class="px-3 py-1.5 rounded-lg border border-emerald-500/20 text-xs text-emerald-500 font-brand hover:bg-emerald-500/10 transition-colors flex items-center gap-2">
            <iconify-icon icon="solar:add-circle-linear" width="14"></iconify-icon>Ajouter une exigence
          </button>
          <button *ngIf="perm.canGlobal('framework_control', 'create')" (click)="showImportModal = true"
            class="px-3 py-1.5 rounded-lg border border-blue-500/20 text-xs text-blue-400 font-brand hover:bg-blue-500/10 transition-colors flex items-center gap-2">
            <iconify-icon icon="solar:import-linear" width="14"></iconify-icon>Importer
          </button>
          <button *ngIf="perm.canGlobal('referentiel', 'delete')" (click)="deleteReferentiel()"
            class="px-3 py-1.5 rounded-lg border border-rose-500/20 text-xs text-rose-500 font-brand hover:bg-rose-500/10 transition-colors flex items-center gap-2">
            <iconify-icon icon="solar:trash-bin-trash-linear" width="14"></iconify-icon>Delete
          </button>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-4 gap-4">
        <div class="glass-panel p-4">
          <p class="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Checklists</p>
          <p class="text-2xl font-mono font-bold text-white">{{ referentielChecklists?.length || 0 }}</p>
        </div>
        <div class="glass-panel p-4">
          <p class="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Exigences</p>
          <p class="text-2xl font-mono font-bold text-white">{{ stats?.totalControls || 0 }}</p>
        </div>
        <div class="glass-panel p-4">
          <p class="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Mappées</p>
          <p class="text-2xl font-mono font-bold text-emerald-500">{{ stats?.mappedControls || 0 }}</p>
        </div>
        <div class="glass-panel p-4">
          <p class="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Coverage</p>
          <p class="text-2xl font-mono font-bold" [ngClass]="getCoverageClass(stats?.coveragePercent)">
            {{ stats?.coveragePercent != null ? stats.coveragePercent + '%' : '---' }}
          </p>
        </div>
      </div>

      <!-- Checklists de référence -->
      <div class="glass-panel overflow-hidden">
        <div class="p-4 border-b border-white/5 flex items-center justify-between">
          <div>
            <p class="text-[10px] uppercase tracking-wider text-zinc-500">Checklists de référence</p>
            <p class="text-[10px] text-zinc-600 mt-0.5">Modèles de checklist de référence disponibles — créez, modifiez ou supprimez</p>
          </div>
          <div class="flex items-center gap-2">
            <button *ngIf="perm.canGlobal('checklist', 'create')" (click)="showCreateReferenceChecklistModal = true"
              class="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-xs text-emerald-500 font-brand hover:bg-emerald-500/30 transition-colors flex items-center gap-2">
              <iconify-icon icon="solar:add-circle-linear" width="14"></iconify-icon>Nouvelle checklist de référence
            </button>
            <button *ngIf="perm.canGlobal('checklist', 'create')" (click)="showCreateChecklistModal = true"
              class="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-zinc-400 font-brand hover:bg-white/5 transition-colors flex items-center gap-2">
              <iconify-icon icon="solar:document-add-linear" width="14"></iconify-icon>Checklist utilisateur depuis exigences
            </button>
            <a routerLink="/app/checklists" class="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-zinc-400 font-brand hover:bg-white/5 transition-colors">
              Voir toutes les checklists
            </a>
          </div>
        </div>
        <div class="divide-y divide-white/5">
          <div *ngFor="let cl of referentielChecklists" class="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
            <div class="flex items-center gap-4">
              <a [routerLink]="['/app/checklists', cl.id]" class="text-sm text-zinc-200 hover:text-white font-medium">
                {{ cl.title }}
              </a>
              <span class="text-[10px] text-zinc-500">{{ cl.items?.length || 0 }} items</span>
              <span class="px-2 py-0.5 rounded border border-zinc-700 bg-zinc-800/50 text-zinc-400 text-[10px]">{{ cl.domain }}</span>
            </div>
            <div class="flex items-center gap-2">
              <a [routerLink]="['/app/checklists', cl.id]" class="px-2 py-1 rounded text-[10px] text-blue-400 hover:bg-blue-500/10 font-brand">Modifier</a>
              <button *ngIf="perm.canGlobal('checklist', 'delete')" (click)="deleteChecklist(cl)" class="px-2 py-1 rounded text-[10px] text-rose-500 hover:bg-rose-500/10 font-brand">Supprimer</button>
            </div>
          </div>
          <div *ngIf="referentielChecklists?.length === 0" class="p-8 text-center text-xs text-zinc-500">
            <p>Aucune checklist de référence</p>
            <p class="text-[10px] text-zinc-600 mt-1">Créez une checklist de référence ou une checklist utilisateur depuis les exigences</p>
            <div class="flex justify-center gap-3 mt-3">
              <button *ngIf="perm.canGlobal('checklist', 'create')" (click)="showCreateReferenceChecklistModal = true" class="text-emerald-500 hover:underline text-sm">Nouvelle checklist de référence</button>
              <span *ngIf="perm.canGlobal('checklist', 'create')" class="text-zinc-600">|</span>
              <button *ngIf="perm.canGlobal('checklist', 'create')" (click)="showCreateChecklistModal = true" class="text-blue-400 hover:underline text-sm">Checklist utilisateur depuis exigences</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Description -->
      <div *ngIf="referentiel.description" class="glass-panel p-4">
        <p class="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">Description</p>
        <p class="text-sm text-zinc-400">{{ referentiel.description }}</p>
      </div>

      <!-- Exigences -->
      <div class="glass-panel overflow-hidden">
        <div class="p-4 border-b border-white/5 flex items-center justify-between">
          <div>
            <p class="text-[10px] uppercase tracking-wider text-zinc-500">Exigences</p>
            <p class="text-[10px] text-zinc-600 mt-0.5">Cadre du référentiel — cliquer pour voir le détail et le mapping</p>
          </div>
          <input type="text" [(ngModel)]="controlSearch" (ngModelChange)="filterControls()" placeholder="Rechercher..."
            class="bg-zinc-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-zinc-300 w-48 focus:border-white/20 focus:outline-none transition-colors" />
        </div>
        <table class="w-full">
          <thead>
            <tr class="border-b border-white/5">
              <th class="text-left text-[10px] uppercase tracking-wider text-zinc-500 p-4 font-medium">Code</th>
              <th class="text-left text-[10px] uppercase tracking-wider text-zinc-500 p-4 font-medium">Title</th>
              <th class="text-left text-[10px] uppercase tracking-wider text-zinc-500 p-4 font-medium">Mapped</th>
              <th class="text-left text-[10px] uppercase tracking-wider text-zinc-500 p-4 font-medium w-20"></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let ctrl of filteredControls" (click)="navigateToControl(ctrl.id)"
              class="border-b border-white/5 table-row-hover cursor-pointer">
              <td class="p-4 text-[11px] font-mono text-zinc-400">{{ ctrl.code }}</td>
              <td class="p-4 text-sm text-zinc-300">{{ ctrl.title }}</td>
              <td class="p-4">
                <span *ngIf="controlMappedCount[ctrl.id]" class="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[10px]">
                  {{ controlMappedCount[ctrl.id] }} mapped
                </span>
                <span *ngIf="!controlMappedCount[ctrl.id]" class="text-[10px] text-zinc-600">---</span>
              </td>
              <td class="p-4">
                <iconify-icon icon="solar:arrow-right-linear" width="14" class="text-zinc-500"></iconify-icon>
              </td>
            </tr>
            <tr *ngIf="filteredControls.length === 0">
              <td colspan="4" class="p-8 text-center text-xs text-zinc-500">
                <p>Aucune exigence</p>
                <p class="text-[10px] text-zinc-600 mt-1">Ajoutez des exigences manuellement ou importez depuis une checklist existante</p>
                <div class="flex justify-center gap-2 mt-3">
                  <button *ngIf="perm.canGlobal('framework_control', 'create')" (click)="showAddControlModal = true" class="text-emerald-500 hover:underline text-xs">Ajouter</button>
                  <span *ngIf="perm.canGlobal('framework_control', 'create')" class="text-zinc-600">|</span>
                  <button *ngIf="perm.canGlobal('framework_control', 'create')" (click)="showImportModal = true" class="text-blue-400 hover:underline text-xs">Importer</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Add Exigence Modal -->
      <div *ngIf="showAddControlModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" (click)="showAddControlModal = false">
        <div class="glass-panel p-6 w-full max-w-md space-y-4" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-brand font-bold text-white">Ajouter une exigence</h2>
            <button (click)="showAddControlModal = false" class="p-1 rounded hover:bg-white/5 transition-colors">
              <iconify-icon icon="solar:close-circle-linear" width="20" class="text-zinc-500"></iconify-icon>
            </button>
          </div>
          <div class="space-y-3">
            <div>
              <label class="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block">Code</label>
              <input type="text" [(ngModel)]="newControl.code" placeholder="e.g. A.5.12"
                class="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:border-white/20 focus:outline-none transition-colors" />
            </div>
            <div>
              <label class="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block">Question / Titre</label>
              <input type="text" [(ngModel)]="newControl.title" placeholder="Exigence ou question"
                class="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:border-white/20 focus:outline-none transition-colors" />
            </div>
            <div>
              <label class="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block">Description</label>
              <textarea [(ngModel)]="newControl.description" rows="2" placeholder="Optional"
                class="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:border-white/20 focus:outline-none transition-colors resize-none"></textarea>
            </div>
          </div>
          <div class="flex justify-end gap-3 pt-2">
            <button (click)="showAddControlModal = false"
              class="px-4 py-2 rounded-lg border border-white/10 text-sm text-zinc-400 font-brand hover:bg-white/5 transition-colors">Annuler</button>
            <button (click)="addControl()" [disabled]="!newControl.code || !newControl.title"
              class="px-4 py-2 bg-white text-black rounded-lg text-sm font-brand font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">Ajouter</button>
          </div>
        </div>
      </div>

      <!-- Import Modal -->
      <div *ngIf="showImportModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" (click)="showImportModal = false">
        <div class="glass-panel p-6 w-full max-w-lg space-y-4" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-brand font-bold text-white">Importer des exigences</h2>
            <button (click)="showImportModal = false" class="p-1 rounded hover:bg-white/5 transition-colors">
              <iconify-icon icon="solar:close-circle-linear" width="20" class="text-zinc-500"></iconify-icon>
            </button>
          </div>
          <div class="space-y-4">
            <div>
              <label class="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block">Depuis une checklist</label>
              <select [(ngModel)]="importChecklistId"
                class="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:border-white/20 focus:outline-none transition-colors">
                <option value="">— Choisir une checklist —</option>
                <option *ngFor="let cl of checklists" [value]="cl.id">{{ cl.title }}</option>
              </select>
              <button (click)="importFromChecklist()" [disabled]="!importChecklistId || importing"
                class="mt-2 px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 text-xs font-brand hover:bg-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed">
                {{ importing ? 'Import...' : 'Importer les questions' }}
              </button>
            </div>
            <div class="border-t border-white/10 pt-4">
              <label class="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block">Ou copier depuis un référentiel</label>
              <select [(ngModel)]="importReferentielId"
                class="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:border-white/20 focus:outline-none transition-colors">
                <option value="">— Choisir un référentiel —</option>
                <option *ngFor="let r of otherReferentiels" [value]="r.id">{{ r.name }} ({{ r.controls?.length || 0 }} exigences)</option>
              </select>
              <button (click)="importFromReferentiel()" [disabled]="!importReferentielId || importing"
                class="mt-2 px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 text-xs font-brand hover:bg-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed">
                {{ importing ? 'Import...' : 'Copier les exigences' }}
              </button>
            </div>
            <p *ngIf="importResult" class="text-xs text-emerald-500">{{ importResult }}</p>
          </div>
        </div>
      </div>

      <!-- Create Reference Checklist Modal -->
      <div *ngIf="showCreateReferenceChecklistModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" (click)="showCreateReferenceChecklistModal = false">
        <div class="glass-panel p-6 w-full max-w-md space-y-4" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-brand font-bold text-white">Nouvelle checklist de référence</h2>
            <button (click)="showCreateReferenceChecklistModal = false" class="p-1 rounded hover:bg-white/5 transition-colors">
              <iconify-icon icon="solar:close-circle-linear" width="20" class="text-zinc-500"></iconify-icon>
            </button>
          </div>
          <p class="text-xs text-zinc-500">Crée une checklist de référence vide liée à ce référentiel. Vous pourrez ajouter des items après création.</p>
          <div>
            <label class="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block">Titre</label>
            <input type="text" [(ngModel)]="newReferenceChecklist.title" placeholder="e.g. ISO 27001 - Infra"
              class="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:border-white/20 focus:outline-none transition-colors" />
          </div>
          <div>
            <label class="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block">Domaine</label>
            <select [(ngModel)]="newReferenceChecklist.domain"
              class="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:border-white/20 focus:outline-none transition-colors">
              <option *ngFor="let d of domains" [value]="d.value">{{ d.label }}</option>
            </select>
          </div>
          <div>
            <label class="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block">Criticité</label>
            <select [(ngModel)]="newReferenceChecklist.criticality"
              class="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:border-white/20 focus:outline-none transition-colors">
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
          <div>
            <label class="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block">Description</label>
            <textarea [(ngModel)]="newReferenceChecklist.description" rows="2" placeholder="Optional"
              class="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:border-white/20 focus:outline-none transition-colors resize-none"></textarea>
          </div>
          <div class="flex justify-end gap-3 pt-2">
            <button (click)="showCreateReferenceChecklistModal = false"
              class="px-4 py-2 rounded-lg border border-white/10 text-sm text-zinc-400 font-brand hover:bg-white/5 transition-colors">Annuler</button>
            <button (click)="createReferenceChecklist()" [disabled]="creatingReferenceChecklist || !newReferenceChecklist.title"
              class="px-4 py-2 bg-white text-black rounded-lg text-sm font-brand font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {{ creatingReferenceChecklist ? 'Création...' : 'Créer' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Create Checklist Modal (user checklist from controls) -->
      <div *ngIf="showCreateChecklistModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" (click)="showCreateChecklistModal = false">
        <div class="glass-panel p-6 w-full max-w-md space-y-4" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-brand font-bold text-white">Nouvelle checklist utilisateur</h2>
            <button (click)="showCreateChecklistModal = false" class="p-1 rounded hover:bg-white/5 transition-colors">
              <iconify-icon icon="solar:close-circle-linear" width="20" class="text-zinc-500"></iconify-icon>
            </button>
          </div>
          <p class="text-xs text-zinc-500">Crée une checklist avec {{ referentiel?.controls?.length || 0 }} items (une question par exigence), déjà mappés au référentiel.</p>
          <div>
            <label class="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block">Titre</label>
            <input type="text" [(ngModel)]="newChecklistTitle" placeholder="e.g. ISO 27001 - Mon audit"
              class="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:border-white/20 focus:outline-none transition-colors" />
          </div>
          <div class="flex justify-end gap-3 pt-2">
            <button (click)="showCreateChecklistModal = false"
              class="px-4 py-2 rounded-lg border border-white/10 text-sm text-zinc-400 font-brand hover:bg-white/5 transition-colors">Annuler</button>
            <button (click)="createChecklistFromReferentiel()" [disabled]="creatingChecklist"
              class="px-4 py-2 bg-white text-black rounded-lg text-sm font-brand font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {{ creatingChecklist ? 'Création...' : 'Créer' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div *ngIf="!referentiel && !error" class="flex items-center justify-center py-20">
      <iconify-icon icon="solar:refresh-linear" width="24" class="text-zinc-600 animate-spin"></iconify-icon>
    </div>
    <div *ngIf="error" class="flex items-center justify-center py-20">
      <p class="text-sm text-zinc-400">{{ error }}</p>
    </div>
  `,
})
export class ReferentielDetailComponent implements OnInit {
  referentiel: any = null;
  stats: any = null;
  controlSearch = '';
  filteredControls: any[] = [];
  controlMappedCount: Record<string, number> = {};
  showAddControlModal = false;
  showImportModal = false;
  showCreateChecklistModal = false;
  showCreateReferenceChecklistModal = false;
  newControl = { code: '', title: '', description: '' };
  newChecklistTitle = '';
  newReferenceChecklist = {
    title: '',
    domain: 'Governance',
    criticality: 'High',
    description: '',
    applicability: ['Project', 'Infrastructure'],
  };
  creatingChecklist = false;
  creatingReferenceChecklist = false;
  referentielChecklists: any[] = [];
  checklists: any[] = [];
  otherReferentiels: any[] = [];
  importChecklistId = '';
  importReferentielId = '';
  importing = false;
  importResult = '';
  error = '';
  private referentielId = '';
  domains = DOMAINS;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private confirmService: ConfirmService,
    private toast: ToastService,
    public perm: PermissionService,
  ) {}

  ngOnInit(): void {
    this.referentielId = this.route.snapshot.paramMap.get('id') || '';
    if (this.referentielId) this.load();
  }

  load(): void {
    this.api.getReferentiel(this.referentielId).subscribe({
      next: (ref) => {
        this.referentiel = ref;
        this.filteredControls = ref.controls || [];
        this.loadStats();
        (ref.controls || []).forEach((c: any) => this.loadMappedCount(c.id));
      },
      error: () => {
        this.error = 'Referentiel not found';
      },
    });
    this.api.getChecklists().subscribe({
      next: (data) => { this.checklists = data || []; },
      error: () => { this.checklists = []; },
    });
    this.api.getReferentiels({ limit: 100 }).subscribe({
      next: (res) => {
        const arr = res?.data || res || [];
        this.otherReferentiels = Array.isArray(arr) ? arr.filter((r: any) => r.id !== this.referentielId) : [];
      },
      error: () => { this.otherReferentiels = []; },
    });
    this.api.getReferentielChecklists(this.referentielId).subscribe({
      next: (data) => { this.referentielChecklists = data || []; },
      error: () => { this.referentielChecklists = []; },
    });
  }

  loadStats(): void {
    this.api.getReferentielStats(this.referentielId).subscribe({
      next: (s) => (this.stats = s),
    });
  }

  loadMappedCount(controlId: string): void {
    this.api.getMappedChecklistItems(this.referentielId, controlId).subscribe({
      next: (items) => (this.controlMappedCount[controlId] = items?.length || 0),
    });
  }

  filterControls(): void {
    const term = this.controlSearch?.toLowerCase() || '';
    this.filteredControls = (this.referentiel?.controls || []).filter(
      (c: any) =>
        (c.code && c.code.toLowerCase().includes(term)) ||
        (c.title && c.title.toLowerCase().includes(term)),
    );
  }

  getCoverageClass(pct: number): string {
    if (pct == null) return 'text-zinc-500';
    if (pct >= 80) return 'text-emerald-500';
    if (pct >= 50) return 'text-amber-500';
    return 'text-zinc-400';
  }

  navigateToControl(controlId: string): void {
    this.router.navigate(['/app/referentiels', this.referentielId, 'controls', controlId]);
  }

  addControl(): void {
    if (!this.newControl.code || !this.newControl.title) return;
    this.api.createReferentielControl(this.referentielId, this.newControl).subscribe({
      next: () => {
        this.showAddControlModal = false;
        this.newControl = { code: '', title: '', description: '' };
        this.load();
      },
      error: (err) => console.error(err),
    });
  }

  async deleteReferentiel(): Promise<void> {
    const ok = await this.confirmService.confirm({
      title: 'Supprimer le référentiel',
      message: 'Supprimer ce référentiel et toutes ses exigences ? Cette action est irréversible.',
      confirmText: 'Supprimer',
      variant: 'danger',
    });
    if (!ok) return;
    this.api.deleteReferentiel(this.referentielId).subscribe({
      next: () => this.router.navigate(['/app/referentiels']),
      error: (err) => console.error(err),
    });
  }

  importFromChecklist(): void {
    if (!this.importChecklistId) return;
    this.importing = true;
    this.importResult = '';
    this.api.importReferentielFromChecklist(this.referentielId, this.importChecklistId).subscribe({
      next: (res) => {
        this.importResult = `${res.imported} question(s) importée(s)`;
        this.importing = false;
        this.load();
      },
      error: () => {
        this.importResult = 'Erreur lors de l\'import';
        this.importing = false;
      },
    });
  }

  importFromReferentiel(): void {
    if (!this.importReferentielId) return;
    this.importing = true;
    this.importResult = '';
    this.api.importReferentielFromReferentiel(this.referentielId, this.importReferentielId).subscribe({
      next: (res) => {
        this.importResult = `${res.imported} exigence(s) copiée(s)`;
        this.importing = false;
        this.load();
      },
      error: () => {
        this.importResult = 'Erreur lors de la copie';
        this.importing = false;
      },
    });
  }

  createChecklistFromReferentiel(): void {
    if ((this.referentiel?.controls?.length || 0) === 0) {
      this.toast.warning('Ajoutez d\'abord des exigences au référentiel.');
      return;
    }
    this.creatingChecklist = true;
    this.api.createChecklistFromReferentiel(this.referentielId, { title: this.newChecklistTitle }).subscribe({
      next: (cl) => {
        this.showCreateChecklistModal = false;
        this.newChecklistTitle = '';
        this.creatingChecklist = false;
        this.load();
        this.router.navigate(['/app/checklists', cl.id]);
      },
      error: () => {
        this.creatingChecklist = false;
      },
    });
  }

  async deleteChecklist(cl: any): Promise<void> {
    const ok = await this.confirmService.confirm({
      title: 'Supprimer la checklist',
      message: `Supprimer la checklist « ${cl.title} » ?`,
      confirmText: 'Supprimer',
      variant: 'danger',
    });
    if (!ok) return;
    this.api.deleteChecklist(cl.id).subscribe({
      next: () => this.load(),
      error: (err) => console.error(err),
    });
  }

  createReferenceChecklist(): void {
    if (!this.newReferenceChecklist.title?.trim()) return;
    this.creatingReferenceChecklist = true;
    this.api.createReferenceChecklist(this.referentielId, {
      title: this.newReferenceChecklist.title.trim(),
      version: '1.0',
      domain: this.newReferenceChecklist.domain,
      criticality: this.newReferenceChecklist.criticality,
      applicability: this.newReferenceChecklist.applicability,
      description: this.newReferenceChecklist.description?.trim() || undefined,
      items: [],
    }).subscribe({
      next: (cl) => {
        this.showCreateReferenceChecklistModal = false;
        this.newReferenceChecklist = {
          title: '',
          domain: 'Governance',
          criticality: 'High',
          description: '',
          applicability: ['Project', 'Infrastructure'],
        };
        this.creatingReferenceChecklist = false;
        this.load();
        this.router.navigate(['/app/checklists', cl.id]);
      },
      error: () => {
        this.creatingReferenceChecklist = false;
      },
    });
  }
}
