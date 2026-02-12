import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ConfirmService } from '../../shared/components/confirm/confirm.service';
import { PermissionService } from '../../core/services/permission.service';

@Component({
  selector: 'app-checklist-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="space-y-6" *ngIf="checklist">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <a routerLink="/app/checklists" class="p-2 rounded-lg hover:bg-white/5 transition-colors">
            <iconify-icon icon="solar:arrow-left-linear" width="18" class="text-zinc-500"></iconify-icon>
          </a>
          <div>
            <h1 *ngIf="!isEditing" class="text-2xl font-brand font-bold text-white">{{ checklist.title }}</h1>
            <input *ngIf="isEditing" type="text" [(ngModel)]="editData.title"
              class="text-2xl font-brand font-bold text-white bg-zinc-900 border border-white/10 rounded-lg px-3 py-1 focus:border-white/20 focus:outline-none transition-colors" />
            <div class="flex items-center gap-3 mt-1">
              <span class="px-2 py-0.5 rounded border border-zinc-700 bg-zinc-800/50 text-zinc-400 text-[10px]">{{ getDomainLabel(checklist.domain) }}</span>
              <span class="px-2 py-0.5 rounded text-[10px]"
                [ngClass]="{
                  'bg-rose-500/15 border border-rose-500/20 text-rose-500': checklist.criticality === 'Critical',
                  'bg-amber-500/15 border border-amber-500/20 text-amber-500': checklist.criticality === 'High',
                  'bg-blue-500/15 border border-blue-500/20 text-blue-500': checklist.criticality === 'Medium',
                  'bg-zinc-500/15 border border-zinc-500/20 text-zinc-400': checklist.criticality === 'Low'
                }">{{ checklist.criticality }}</span>
              <span class="text-[10px] text-zinc-600 font-mono">v{{ checklist.version || '1.0' }}</span>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button *ngIf="!isEditing && perm.canGlobal('checklist_run', 'create')" (click)="openRunModal()"
            class="px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-brand font-semibold hover:bg-emerald-600 transition-colors flex items-center gap-2">
            <iconify-icon icon="solar:play-linear" width="14"></iconify-icon>Start Run
          </button>
          <button *ngIf="!isEditing && perm.canGlobal('checklist', 'update')" (click)="enterEditMode()"
            class="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-zinc-400 font-brand hover:bg-white/5 transition-colors flex items-center gap-2">
            <iconify-icon icon="solar:pen-linear" width="14"></iconify-icon>Edit
          </button>
          <button *ngIf="isEditing" (click)="saveChanges()"
            class="px-3 py-1.5 rounded-lg bg-white text-black text-xs font-brand font-semibold hover:bg-zinc-200 transition-colors flex items-center gap-2">
            <iconify-icon icon="solar:check-circle-linear" width="14"></iconify-icon>Save
          </button>
          <button *ngIf="isEditing" (click)="cancelEdit()"
            class="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-zinc-400 font-brand hover:bg-white/5 transition-colors">Cancel</button>
          <button *ngIf="perm.canGlobal('checklist', 'delete')" (click)="deleteChecklist()"
            class="px-3 py-1.5 rounded-lg border border-rose-500/20 text-xs text-rose-500 font-brand hover:bg-rose-500/10 transition-colors flex items-center gap-2">
            <iconify-icon icon="solar:trash-bin-trash-linear" width="14"></iconify-icon>Delete
          </button>
        </div>
      </div>

      <!-- Metadata Panel -->
      <div class="glass-panel p-6 space-y-4">
        <p class="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">Metadata</p>
        <div class="grid grid-cols-12 gap-6">
          <div class="col-span-8 space-y-3">
            <div>
              <p class="text-[10px] text-zinc-600 mb-1">Description</p>
              <p *ngIf="!isEditing" class="text-sm text-zinc-300">{{ checklist.description || 'No description provided' }}</p>
              <textarea *ngIf="isEditing" [(ngModel)]="editData.description" rows="3"
                class="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:border-white/20 focus:outline-none transition-colors resize-none"></textarea>
            </div>
            <div>
              <p class="text-[10px] text-zinc-600 mb-1">Applicability</p>
              <div *ngIf="!isEditing" class="flex flex-wrap gap-2">
                <span *ngFor="let tag of checklist.applicability"
                  class="px-2 py-0.5 rounded border border-white/10 bg-white/5 text-zinc-300 text-[10px]">{{ tag }}</span>
                <span *ngIf="!checklist.applicability?.length" class="text-[10px] text-zinc-600">None specified</span>
              </div>
              <div *ngIf="isEditing" class="flex flex-wrap gap-2">
                <label *ngFor="let t of objectTypes"
                  class="flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] cursor-pointer transition-colors"
                  [ngClass]="editData.applicability.includes(t) ? 'border-white/20 bg-white/5 text-zinc-200' : 'border-white/10 text-zinc-500 hover:bg-white/[0.03]'">
                  <input type="checkbox" class="hidden" [checked]="editData.applicability.includes(t)" (change)="toggleApplicability(t)" />
                  {{ t }}
                </label>
              </div>
            </div>
          </div>
          <div class="col-span-4 space-y-3">
            <div *ngIf="isEditing">
              <p class="text-[10px] text-zinc-600 mb-1">Domain</p>
              <select [(ngModel)]="editData.domain"
                class="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:border-white/20 focus:outline-none transition-colors">
                <option *ngFor="let d of domains" [value]="d.value">{{ d.label }}</option>
              </select>
            </div>
            <div *ngIf="isEditing">
              <p class="text-[10px] text-zinc-600 mb-1">Criticality</p>
              <select [(ngModel)]="editData.criticality"
                class="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:border-white/20 focus:outline-none transition-colors">
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
            <div *ngIf="isEditing">
              <p class="text-[10px] text-zinc-600 mb-1">Version</p>
              <input type="text" [(ngModel)]="editData.version"
                class="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:border-white/20 focus:outline-none transition-colors" />
            </div>
            <div *ngIf="!isEditing">
              <p class="text-[10px] text-zinc-600 mb-0.5">Created</p>
              <p class="text-sm text-zinc-300 font-mono">{{ checklist.createdAt | date:'yyyy-MM-dd' }}</p>
            </div>
            <div *ngIf="!isEditing">
              <p class="text-[10px] text-zinc-600 mb-0.5">Last Updated</p>
              <p class="text-sm text-zinc-300 font-mono">{{ checklist.updatedAt | date:'yyyy-MM-dd' }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Run History -->
      <div class="glass-panel p-6">
        <p class="text-[10px] uppercase tracking-wider text-zinc-500 mb-4">Run History</p>
        <table *ngIf="runs.length > 0" class="w-full">
          <thead>
            <tr class="border-b border-white/[0.08]">
              <th class="text-left text-[10px] uppercase tracking-wider text-zinc-400 p-3 font-medium">Object</th>
              <th class="text-left text-[10px] uppercase tracking-wider text-zinc-400 p-3 font-medium">Score</th>
              <th class="text-left text-[10px] uppercase tracking-wider text-zinc-400 p-3 font-medium">Status</th>
              <th class="text-left text-[10px] uppercase tracking-wider text-zinc-400 p-3 font-medium">Date</th>
              <th class="text-left text-[10px] uppercase tracking-wider text-zinc-400 p-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let run of runs" class="border-b border-white/[0.06] table-row-hover">
              <td class="p-3 text-sm text-zinc-200">{{ run.object?.name || 'Unknown' }}</td>
              <td class="p-3">
                <span class="text-sm font-mono font-bold"
                  [ngClass]="run.score >= 80 ? 'text-emerald-500' : run.score >= 60 ? 'text-amber-500' : 'text-rose-500'">
                  {{ run.score !== null && run.score !== undefined ? (run.score | number:'1.0-0') + '%' : '---' }}
                </span>
              </td>
              <td class="p-3">
                <span class="px-2 py-0.5 rounded text-[10px]"
                  [ngClass]="{
                    'bg-emerald-500/15 border border-emerald-500/20 text-emerald-500': run.status === 'Completed',
                    'bg-blue-500/15 border border-blue-500/20 text-blue-500': run.status === 'InProgress'
                  }">{{ run.status }}</span>
              </td>
              <td class="p-3 text-xs text-zinc-400 font-mono">{{ run.createdAt | date:'yyyy-MM-dd HH:mm' }}</td>
              <td class="p-3">
                <a [routerLink]="['/app/checklists', run.id, 'run']"
                  class="text-[10px] text-zinc-400 hover:text-zinc-200 transition-colors">View</a>
              </td>
            </tr>
          </tbody>
        </table>
        <p *ngIf="runs.length === 0" class="text-[10px] text-zinc-600 text-center py-4">No runs recorded for this checklist</p>
      </div>

      <!-- Linked Objects -->
      <div class="glass-panel p-6">
        <p class="text-[10px] uppercase tracking-wider text-zinc-500 mb-4">Linked Objects</p>
        <div *ngIf="linkedObjects.length > 0" class="space-y-2">
          <div *ngFor="let obj of linkedObjects"
            class="flex items-center justify-between p-3 bg-white/[0.02] rounded-lg border border-white/5 hover:bg-white/[0.04] transition-colors">
            <a [routerLink]="['/app/objects', obj.id]" class="flex items-center gap-3 flex-1 min-w-0">
              <iconify-icon icon="solar:shield-check-linear" width="16" class="text-zinc-500"></iconify-icon>
              <div>
                <p class="text-sm text-zinc-300">{{ obj.name }}</p>
                <span class="text-[10px] text-zinc-600">{{ obj.type }}</span>
              </div>
            </a>
            <div class="flex items-center gap-3">
              <div class="text-right">
                <p class="text-xs text-zinc-400 font-mono">{{ obj.runCount }} run{{ obj.runCount !== 1 ? 's' : '' }}</p>
                <span *ngIf="obj.latestScore !== null" class="text-[10px] font-mono"
                  [ngClass]="obj.latestScore >= 80 ? 'text-emerald-500' : obj.latestScore >= 60 ? 'text-amber-500' : 'text-rose-500'">
                  Latest: {{ obj.latestScore | number:'1.0-0' }}%
                </span>
              </div>
              <button *ngIf="perm.canGlobal('checklist', 'update')" (click)="detachObject(obj.id)" title="Détacher cet objet"
                class="p-1.5 rounded-lg border border-white/10 hover:bg-rose-500/10 hover:border-rose-500/20 transition-colors">
                <iconify-icon icon="solar:link-broken-linear" width="14" class="text-zinc-500 hover:text-rose-500"></iconify-icon>
              </button>
            </div>
          </div>
        </div>
        <p *ngIf="linkedObjects.length === 0" class="text-[10px] text-zinc-600 text-center py-4">No objects have been assessed with this checklist</p>
      </div>

      <!-- Items Table -->
      <div class="glass-panel p-6">
        <div class="flex items-center justify-between mb-4">
          <p class="text-[10px] uppercase tracking-wider text-zinc-500">Checklist Items ({{ checklist.items?.length || 0 }})</p>
          <div *ngIf="isEditing" class="flex items-center gap-3">
            <button (click)="toggleImportPanel()" class="text-[10px] transition-colors flex items-center gap-1"
              [ngClass]="showImportPanel ? 'text-blue-400' : 'text-blue-500/70 hover:text-blue-400'">
              <iconify-icon icon="solar:library-linear" width="12"></iconify-icon>Import from Reference
            </button>
            <button *ngIf="perm.canGlobal('checklist', 'update')" (click)="addItem()"
              class="text-[10px] text-emerald-500 hover:text-emerald-400 transition-colors flex items-center gap-1">
              <iconify-icon icon="solar:add-circle-linear" width="12"></iconify-icon>Add Item
            </button>
          </div>
        </div>

        <!-- Import from Reference Panel -->
        <div *ngIf="showImportPanel && isEditing" class="mb-4 p-3 rounded-lg border border-blue-500/20 bg-blue-500/[0.03]">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <button *ngIf="selectedRefChecklist" (click)="backToRefList()"
                class="p-1 rounded hover:bg-white/5 transition-colors">
                <iconify-icon icon="solar:arrow-left-linear" width="14" class="text-zinc-400"></iconify-icon>
              </button>
              <p class="text-[10px] uppercase tracking-wider text-blue-400">
                {{ selectedRefChecklist ? selectedRefChecklist.title : 'Select a reference checklist' }}
              </p>
            </div>
            <button (click)="showImportPanel = false" class="p-1 rounded hover:bg-white/5 transition-colors">
              <iconify-icon icon="solar:close-circle-linear" width="14" class="text-zinc-500"></iconify-icon>
            </button>
          </div>

          <ng-container *ngIf="!selectedRefChecklist">
            <div class="relative mb-2">
              <iconify-icon icon="solar:magnifer-linear" width="12" class="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-600"></iconify-icon>
              <input type="text" [(ngModel)]="importSearch" placeholder="Search reference checklists..."
                class="w-full bg-zinc-900 border border-white/10 rounded-lg pl-7 pr-3 py-1.5 text-[11px] text-zinc-300 placeholder-zinc-600 focus:border-white/20 focus:outline-none transition-colors" />
            </div>
            <div class="max-h-48 overflow-y-auto space-y-1">
              <div *ngFor="let ref of filteredRefChecklists"
                (click)="selectRefChecklist(ref)"
                class="flex items-center justify-between p-2.5 rounded-lg hover:bg-white/[0.05] cursor-pointer transition-colors">
                <div>
                  <p class="text-xs text-zinc-300">{{ ref.title }}</p>
                  <p class="text-[9px] text-zinc-600">{{ getDomainLabel(ref.domain) }} · {{ ref.items?.length || '?' }} items</p>
                </div>
                <iconify-icon icon="solar:arrow-right-linear" width="14" class="text-zinc-600"></iconify-icon>
              </div>
              <p *ngIf="filteredRefChecklists.length === 0" class="text-[10px] text-zinc-600 text-center py-3">No reference checklists found</p>
            </div>
          </ng-container>

          <ng-container *ngIf="selectedRefChecklist">
            <div *ngIf="loadingRefItems" class="text-center py-6">
              <iconify-icon icon="solar:refresh-linear" width="18" class="text-zinc-600 animate-spin"></iconify-icon>
            </div>
            <ng-container *ngIf="!loadingRefItems">
              <div class="flex items-center justify-between mb-2">
                <button (click)="toggleAllImportItems()" class="text-[10px] text-zinc-400 hover:text-zinc-200 transition-colors">
                  {{ selectedImportItems.size === refChecklistItems.length ? 'Deselect All' : 'Select All (' + refChecklistItems.length + ')' }}
                </button>
                <span class="text-[10px] text-zinc-500">{{ selectedImportItems.size }}/{{ refChecklistItems.length }} selected</span>
              </div>
              <div class="max-h-48 overflow-y-auto space-y-1">
                <label *ngFor="let item of refChecklistItems; let i = index"
                  class="flex items-start gap-2 p-2 rounded-lg cursor-pointer transition-colors"
                  [ngClass]="selectedImportItems.has(i) ? 'bg-blue-500/10' : 'hover:bg-white/[0.03]'">
                  <input type="checkbox" [checked]="selectedImportItems.has(i)" (change)="toggleImportItem(i)"
                    class="mt-0.5 w-3.5 h-3.5 rounded border-white/20 bg-zinc-900 accent-blue-500 cursor-pointer" />
                  <div class="flex-1 min-w-0">
                    <p class="text-[11px] text-zinc-300 leading-snug">{{ item.question }}</p>
                    <div class="flex items-center gap-2 mt-0.5">
                      <span class="text-[9px] text-zinc-600">{{ item.itemType }}</span>
                      <span *ngIf="item.referenceType" class="text-[9px] text-zinc-600">{{ item.referenceType }}: {{ item.reference }}</span>
                    </div>
                  </div>
                </label>
              </div>
              <button (click)="importSelectedItems()" [disabled]="selectedImportItems.size === 0"
                class="mt-2 w-full px-3 py-1.5 rounded-lg bg-blue-500 text-white text-[11px] font-brand font-semibold hover:bg-blue-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                Import {{ selectedImportItems.size }} item{{ selectedImportItems.size !== 1 ? 's' : '' }}
              </button>
            </ng-container>
          </ng-container>
        </div>

        <table class="w-full">
          <thead>
            <tr class="border-b border-white/[0.08]">
              <th class="text-left text-[10px] uppercase tracking-wider text-zinc-400 p-3 font-medium w-10">#</th>
              <th class="text-left text-[10px] uppercase tracking-wider text-zinc-400 p-3 font-medium">Question</th>
              <th class="text-left text-[10px] uppercase tracking-wider text-zinc-400 p-3 font-medium w-24">Type</th>
              <th class="text-left text-[10px] uppercase tracking-wider text-zinc-400 p-3 font-medium w-16">Weight</th>
              <th class="text-left text-[10px] uppercase tracking-wider text-zinc-400 p-3 font-medium w-32">Reference</th>
              <th class="text-left text-[10px] uppercase tracking-wider text-zinc-400 p-3 font-medium">Expected Evidence</th>
              <th *ngIf="isEditing" class="text-center text-[10px] uppercase tracking-wider text-zinc-400 p-3 font-medium w-20">Delete</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of checklist.items; let i = index" class="border-b border-white/[0.06]">
              <td class="p-3 text-xs text-zinc-500 font-mono">{{ i + 1 }}</td>
              <td class="p-3">
                <span *ngIf="!isEditing" class="text-sm text-zinc-200">{{ item.question }}</span>
                <input *ngIf="isEditing" type="text" [(ngModel)]="item.question"
                  class="w-full bg-zinc-900 border border-white/10 rounded px-2 py-1 text-xs text-zinc-300 focus:border-white/20 focus:outline-none transition-colors" />
              </td>
              <td class="p-3">
                <span *ngIf="!isEditing" class="text-[10px] px-1.5 py-0.5 rounded border border-white/10 text-zinc-400">{{ item.itemType }}</span>
                <select *ngIf="isEditing" [(ngModel)]="item.itemType"
                  class="bg-zinc-900 border border-white/10 rounded px-2 py-1 text-[10px] text-zinc-300 focus:border-white/20 focus:outline-none transition-colors">
                  <option value="YesNo">YesNo</option>
                  <option value="Score">Score</option>
                  <option value="Evidence">Evidence</option>
                  <option value="AutoCheck">AutoCheck</option>
                </select>
              </td>
              <td class="p-3">
                <span *ngIf="!isEditing" class="text-xs text-zinc-400 font-mono">{{ item.weight }}</span>
                <input *ngIf="isEditing" type="number" [(ngModel)]="item.weight" step="0.1" min="0"
                  class="w-14 bg-zinc-900 border border-white/10 rounded px-2 py-1 text-xs text-zinc-300 font-mono focus:border-white/20 focus:outline-none transition-colors" />
              </td>
              <td class="p-3">
                <span *ngIf="!isEditing">
                  <a *ngIf="item.frameworkControlId && item.frameworkControl"
                    [routerLink]="['/app/referentiels', item.frameworkControl.referentiel?.id, 'controls', item.frameworkControl.id]"
                    class="text-[10px] text-blue-400 hover:text-blue-300 hover:underline">
                    {{ item.referenceType || item.frameworkControl.referentiel?.type }}: {{ item.frameworkControl.code }} - {{ item.frameworkControl.title }}
                  </a>
                  <span *ngIf="!item.frameworkControlId && item.referenceType" class="text-[10px] text-zinc-400">{{ item.referenceType }}: {{ item.reference }}</span>
                  <span *ngIf="!item.frameworkControlId && !item.referenceType" class="text-[10px] text-zinc-600">---</span>
                </span>
                <div *ngIf="isEditing" class="space-y-1">
                  <select [(ngModel)]="item.frameworkControlId" (ngModelChange)="onControlSelect(item)"
                    class="w-full bg-zinc-900 border border-white/10 rounded px-2 py-1 text-[10px] text-zinc-300 focus:border-white/20 focus:outline-none transition-colors">
                    <option [ngValue]="null">-- None / Manual --</option>
                    <optgroup *ngFor="let ref of referentielsForSelect" [label]="ref.name">
                      <option *ngFor="let ctrl of ref.controls" [ngValue]="ctrl.id">
                        {{ ctrl.code }} - {{ ctrl.title }}
                      </option>
                    </optgroup>
                  </select>
                  <div *ngIf="!item.frameworkControlId" class="flex gap-2">
                    <select [(ngModel)]="item.referenceType" class="flex-1 bg-zinc-900 border border-white/10 rounded px-2 py-1 text-[10px] text-zinc-300">
                      <option [ngValue]="null">--</option>
                      <option value="ISO">ISO</option>
                      <option value="NIST">NIST</option>
                      <option value="OWASP">OWASP</option>
                      <option value="Internal">Internal</option>
                    </select>
                    <input type="text" [(ngModel)]="item.reference" placeholder="Reference"
                      class="flex-1 bg-zinc-900 border border-white/10 rounded px-2 py-1 text-[10px] text-zinc-300 min-w-0" />
                  </div>
                </div>
              </td>
              <td class="p-3 text-xs text-zinc-400">{{ item.expectedEvidence || '---' }}</td>
              <td *ngIf="isEditing" class="p-3 text-center">
                <button *ngIf="perm.canGlobal('checklist', 'update')" (click)="removeItem(item, i)" class="p-1.5 rounded-lg hover:bg-rose-500/10 border border-rose-500/20 transition-colors inline-flex items-center">
                  <iconify-icon icon="solar:trash-bin-trash-linear" width="14" class="text-rose-500"></iconify-icon>
                </button>
              </td>
            </tr>
            <tr *ngIf="!checklist.items?.length">
              <td [attr.colspan]="isEditing ? 7 : 6" class="p-8 text-center text-xs text-zinc-500">No items in this checklist</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Run Modal -->
    <div *ngIf="showRunModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" (click)="showRunModal = false">
      <div class="glass-panel p-6 w-full max-w-md space-y-4" (click)="$event.stopPropagation()">
        <h2 class="text-lg font-brand font-bold text-white">Start Checklist Run</h2>
        <p class="text-xs text-zinc-400">Choose to run on a single object or on all objects in a group.</p>
        <div class="flex gap-2">
          <button (click)="runMode = 'object'; selectedObjectId = ''; selectedGroupId = ''"
            class="flex-1 px-3 py-2 rounded-lg text-xs font-brand transition-colors"
            [ngClass]="runMode === 'object' ? 'bg-white/10 border border-white/20 text-white' : 'border border-white/10 text-zinc-400 hover:bg-white/5'">
            Object
          </button>
          <button (click)="runMode = 'group'; selectedObjectId = ''; selectedGroupId = ''"
            class="flex-1 px-3 py-2 rounded-lg text-xs font-brand transition-colors"
            [ngClass]="runMode === 'group' ? 'bg-white/10 border border-white/20 text-white' : 'border border-white/10 text-zinc-400 hover:bg-white/5'">
            Group
          </button>
        </div>
        <div *ngIf="runMode === 'object'">
          <label class="text-[10px] text-zinc-500 mb-1 block">Object</label>
          <select [(ngModel)]="selectedObjectId"
            class="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-zinc-300 focus:border-white/20 focus:outline-none transition-colors">
            <option value="" disabled>Select an object...</option>
            <option *ngFor="let obj of availableObjects" [value]="obj.id">{{ obj.name }} ({{ obj.type }})</option>
          </select>
        </div>
        <div *ngIf="runMode === 'group'">
          <label class="text-[10px] text-zinc-500 mb-1 block">Group</label>
          <select [(ngModel)]="selectedGroupId"
            class="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-zinc-300 focus:border-white/20 focus:outline-none transition-colors">
            <option value="" disabled>Select a group...</option>
            <option *ngFor="let g of availableGroups" [value]="g.id">{{ g.name }} ({{ g.objects?.length || 0 }} objects)</option>
          </select>
        </div>
        <div class="flex justify-end gap-3">
          <button (click)="showRunModal = false"
            class="px-4 py-2 rounded-lg border border-white/10 text-sm text-zinc-400 font-brand hover:bg-white/5 transition-colors">Cancel</button>
          <button (click)="startRun()" [disabled]="!canStartRun"
            class="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-brand font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Start Run</button>
        </div>
      </div>
    </div>

    <!-- Loading state -->
    <div *ngIf="!checklist && !loadError" class="flex items-center justify-center py-20">
      <div class="text-center space-y-3">
        <iconify-icon icon="solar:refresh-linear" width="24" class="text-zinc-600 animate-spin"></iconify-icon>
        <p class="text-xs text-zinc-600">Loading checklist...</p>
      </div>
    </div>

    <!-- Error state -->
    <div *ngIf="loadError" class="flex items-center justify-center py-20">
      <div class="text-center space-y-3">
        <iconify-icon icon="solar:danger-triangle-linear" width="32" class="text-rose-500"></iconify-icon>
        <p class="text-sm text-zinc-400">Checklist not found</p>
        <a routerLink="/app/checklists" class="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">&larr; Back to Checklists</a>
      </div>
    </div>
  `,
})
export class ChecklistDetailComponent implements OnInit {
  checklist: any = null;
  runs: any[] = [];
  linkedObjects: any[] = [];
  isEditing = false;
  loadError = false;
  editData: any = {};

  domains = [
    { value: 'SecurityInfra', label: 'Security Infra' },
    { value: 'SecurityCode', label: 'Security Code' },
    { value: 'SecurityDevOps', label: 'Security DevOps' },
    { value: 'SecurityRepo', label: 'Security Repo' },
    { value: 'SecurityCluster', label: 'Security Cluster' },
    { value: 'SecurityPipeline', label: 'Security Pipeline' },
    { value: 'SecurityNetworking', label: 'Security Networking' },
    { value: 'SecurityTooling', label: 'Security Tooling' },
    { value: 'SecurityBackup', label: 'Security Backup' },
    { value: 'DisasterRecovery', label: 'Disaster Recovery' },
    { value: 'SecurityHuman', label: 'Security Human' },
    { value: 'FormationSecurity', label: 'Formation Security' },
    { value: 'AssuranceSecurity', label: 'Assurance Security' },
    { value: 'PolitiqueSecurity', label: 'Politique Security' },
    { value: 'Governance', label: 'Governance' },
    { value: 'Audit', label: 'Audit' },
    { value: 'Rapport', label: 'Rapport' },
    { value: 'DocumentsSecurity', label: 'Documents Security' },
    { value: 'SecurityData', label: 'Security Data' },
    { value: 'SecretsCredentials', label: 'Secrets & Credentials' },
    { value: 'NewTypeAttack', label: 'New Type Attack' },
    { value: 'IAPrompting', label: 'IA Prompting' },
    { value: 'Forensic', label: 'Forensic' },
    { value: 'Cartographie', label: 'Cartographie' },
    { value: 'PasswordSecurity', label: 'Password Security' },
    { value: 'PointSecurity', label: 'Point Security' },
  ];
  objectTypes = ['Project', 'Human', 'Infrastructure', 'Codebase', 'Pipeline', 'Cluster', 'DataAsset', 'Tool', 'Network', 'AISystem', 'SystemTool', 'AgentTool', 'Server', 'Database'];

  // Import from reference
  showImportPanel = false;
  allChecklists: any[] = [];
  selectedRefChecklist: any = null;
  refChecklistItems: any[] = [];
  selectedImportItems = new Set<number>();
  loadingRefItems = false;
  importSearch = '';

  // Run modal
  showRunModal = false;
  runMode: 'object' | 'group' = 'object';
  availableObjects: any[] = [];
  availableGroups: any[] = [];
  selectedObjectId = '';
  selectedGroupId = '';

  // Referentiels for item mapping
  referentielsForSelect: { id: string; name: string; controls: any[] }[] = [];

  private checklistId = '';
  private pendingItemDeletions: string[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private confirmService: ConfirmService,
    public perm: PermissionService,
  ) {}

  ngOnInit(): void {
    this.checklistId = this.route.snapshot.paramMap.get('id') || '';
    if (this.checklistId) {
      this.loadChecklist();
    }
  }

  private loadChecklist(): void {
    this.api.getChecklist(this.checklistId).subscribe({
      next: (data) => {
        this.checklist = data;
        this.runs = data.runs || [];
        this.buildLinkedObjects();
      },
      error: () => {
        this.loadError = true;
      },
    });
  }

  private buildLinkedObjects(): void {
    const objectMap = new Map<string, { id: string; name: string; type: string; runCount: number; latestScore: number | null }>();
    for (const run of this.runs) {
      if (!run.object) continue;
      const existing = objectMap.get(run.object.id);
      if (existing) {
        existing.runCount++;
        if (run.score !== null && run.score !== undefined) {
          existing.latestScore = run.score;
        }
      } else {
        objectMap.set(run.object.id, {
          id: run.object.id,
          name: run.object.name || 'Unknown',
          type: run.object.type || '',
          runCount: 1,
          latestScore: run.score ?? null,
        });
      }
    }
    this.linkedObjects = Array.from(objectMap.values());
  }

  getDomainLabel(value: string): string {
    return this.domains.find(d => d.value === value)?.label || value;
  }

  enterEditMode(): void {
    this.editData = {
      title: this.checklist.title,
      description: this.checklist.description || '',
      domain: this.checklist.domain,
      criticality: this.checklist.criticality,
      version: this.checklist.version || '1.0',
      applicability: [...(this.checklist.applicability || [])],
    };
    this.pendingItemDeletions = [];
    this.isEditing = true;
    this.loadReferentielsForSelect();
  }

  loadReferentielsForSelect(): void {
    this.api.getReferentiels({ limit: 100 }).subscribe({
      next: (res) => {
        const data = res.data || res || [];
        const arr = Array.isArray(data) ? data : [data];
        this.referentielsForSelect = arr.map((r: any) => ({
          id: r.id,
          name: `${r.name} (${r.code})`,
          controls: r.controls || [],
        }));
      },
    });
  }

  onControlSelect(item: any): void {
    if (!item.frameworkControlId) {
      item.referenceType = null;
      item.reference = null;
      return;
    }
    for (const ref of this.referentielsForSelect) {
      const ctrl = ref.controls.find((c: any) => c.id === item.frameworkControlId);
      if (ctrl) {
        item.referenceType = ref.name.includes('ISO') ? 'ISO' : ref.name.includes('NIST') ? 'NIST' : ref.name.includes('OWASP') ? 'OWASP' : 'Internal';
        item.reference = `${ctrl.code} - ${ctrl.title}`;
        break;
      }
    }
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.showImportPanel = false;
    this.loadChecklist();
  }

  toggleApplicability(type: string): void {
    const idx = this.editData.applicability.indexOf(type);
    if (idx >= 0) {
      this.editData.applicability.splice(idx, 1);
    } else {
      this.editData.applicability.push(type);
    }
  }

  saveChanges(): void {
    this.api.updateChecklist(this.checklistId, {
      title: this.editData.title,
      description: this.editData.description,
      domain: this.editData.domain,
      criticality: this.editData.criticality,
      version: this.editData.version,
      applicability: this.editData.applicability,
    }).subscribe({
      next: () => {
        const items = this.checklist.items || [];
        const deletions = this.pendingItemDeletions;
        let pending = items.length + deletions.length;

        if (pending === 0) {
          this.isEditing = false;
          this.pendingItemDeletions = [];
          this.loadChecklist();
          return;
        }

        const done = () => {
          if (--pending === 0) {
            this.isEditing = false;
            this.pendingItemDeletions = [];
            this.loadChecklist();
          }
        };

        // Process deletions
        for (const itemId of deletions) {
          this.api.deleteChecklistItem(this.checklistId, itemId).subscribe({
            next: done,
            error: done,
          });
        }

        // Process item updates/creates
        for (const item of items) {
          const payload: any = {
            question: item.question,
            itemType: item.itemType,
            weight: item.weight,
          };
          if (item.frameworkControlId) {
            payload.frameworkControlId = item.frameworkControlId;
          } else {
            payload.frameworkControlId = null;
            payload.referenceType = item.referenceType || null;
            payload.reference = item.reference || null;
          }
          if (item.id) {
            this.api.updateChecklistItem(this.checklistId, item.id, payload).subscribe({ next: done, error: done });
          } else {
            this.api.addChecklistItem(this.checklistId, payload).subscribe({ next: done, error: done });
          }
        }
      },
      error: (err) => console.error('[OSCI] Failed to update checklist:', err),
    });
  }

  addItem(): void {
    if (!this.checklist.items) this.checklist.items = [];
    this.checklist.items.push({
      question: '',
      itemType: 'YesNo',
      weight: 1.0,
      frameworkControlId: null,
      referenceType: null,
      reference: null,
    });
  }

  removeItem(item: any, index: number): void {
    if (item.id) {
      this.pendingItemDeletions.push(item.id);
    }
    this.checklist.items.splice(index, 1);
  }

  // Import from reference methods
  toggleImportPanel(): void {
    this.showImportPanel = !this.showImportPanel;
    this.selectedRefChecklist = null;
    this.refChecklistItems = [];
    this.selectedImportItems.clear();
    this.importSearch = '';
    if (this.showImportPanel && this.allChecklists.length === 0) {
      this.api.getReferenceChecklists().subscribe({
        next: (data) => { this.allChecklists = (data || []).filter((cl: any) => cl.id !== this.checklistId); },
        error: () => { this.allChecklists = []; },
      });
    }
  }

  get filteredRefChecklists(): any[] {
    let refs = this.allChecklists;
    // Filter by current checklist domain
    if (this.checklist?.domain) {
      refs = refs.filter((cl: any) => cl.domain === this.checklist.domain);
    }
    if (this.importSearch) {
      const term = this.importSearch.toLowerCase();
      refs = refs.filter((cl: any) => cl.title?.toLowerCase().includes(term) || cl.domain?.toLowerCase().includes(term));
    }
    return refs;
  }

  selectRefChecklist(cl: any): void {
    this.loadingRefItems = true;
    this.selectedRefChecklist = cl;
    this.selectedImportItems.clear();
    this.api.getChecklist(cl.id).subscribe({
      next: (data) => {
        this.refChecklistItems = data.items || [];
        this.loadingRefItems = false;
      },
      error: () => {
        this.refChecklistItems = [];
        this.loadingRefItems = false;
      },
    });
  }

  backToRefList(): void {
    this.selectedRefChecklist = null;
    this.refChecklistItems = [];
    this.selectedImportItems.clear();
  }

  toggleImportItem(index: number): void {
    if (this.selectedImportItems.has(index)) {
      this.selectedImportItems.delete(index);
    } else {
      this.selectedImportItems.add(index);
    }
  }

  toggleAllImportItems(): void {
    if (this.selectedImportItems.size === this.refChecklistItems.length) {
      this.selectedImportItems.clear();
    } else {
      this.refChecklistItems.forEach((_, i) => this.selectedImportItems.add(i));
    }
  }

  importSelectedItems(): void {
    if (!this.checklist.items) this.checklist.items = [];
    for (const idx of Array.from(this.selectedImportItems).sort((a, b) => a - b)) {
      const item = this.refChecklistItems[idx];
      if (item) {
        this.checklist.items.push({
          question: item.question,
          itemType: item.itemType || 'YesNo',
          weight: item.weight || 1.0,
          expectedEvidence: item.expectedEvidence || '',
          referenceType: item.referenceType || '',
          reference: item.reference || '',
        });
      }
    }
    this.showImportPanel = false;
    this.selectedRefChecklist = null;
    this.selectedImportItems.clear();
  }

  get canStartRun(): boolean {
    return this.runMode === 'object' ? !!this.selectedObjectId : !!this.selectedGroupId;
  }

  openRunModal(): void {
    this.runMode = 'object';
    this.selectedObjectId = '';
    this.selectedGroupId = '';
    this.showRunModal = true;
    if (this.availableObjects.length === 0) {
      this.api.getObjects().subscribe({
        next: (data) => { this.availableObjects = data || []; },
        error: () => { this.availableObjects = []; },
      });
    }
    if (this.availableGroups.length === 0) {
      this.api.getObjectGroups().subscribe({
        next: (data) => { this.availableGroups = data || []; },
        error: () => { this.availableGroups = []; },
      });
    }
  }

  startRun(): void {
    if (!this.canStartRun) return;
    const options = this.runMode === 'group'
      ? { objectGroupId: this.selectedGroupId }
      : { objectId: this.selectedObjectId };
    this.api.startChecklistRun(this.checklistId, options).subscribe({
      next: (res) => {
        this.showRunModal = false;
        const run = res?.runs?.length ? res.runs[0] : res;
        if (run?.id) {
          this.router.navigate(['/app/checklists', run.id, 'run']);
        } else {
          this.loadChecklist();
        }
      },
      error: (err) => console.error('[OSCI] Failed to start run:', err),
    });
  }

  async detachObject(objectId: string): Promise<void> {
    const ok = await this.confirmService.confirm({
      title: 'Détacher l\'objet',
      message: 'Détacher cet objet de la checklist ? Tous les runs associés à cet objet pour cette checklist seront supprimés.',
      confirmText: 'Détacher',
      variant: 'danger',
    });
    if (!ok) return;
    this.api.detachObjectFromChecklist(this.checklistId, objectId).subscribe({
      next: () => this.loadChecklist(),
      error: (err) => console.error('[OSCI] Failed to detach object:', err),
    });
  }

  async deleteChecklist(): Promise<void> {
    const ok = await this.confirmService.confirm({
      title: 'Supprimer la checklist',
      message: 'Supprimer cette checklist et tous les runs associés ? Cette action est irréversible.',
      confirmText: 'Supprimer',
      variant: 'danger',
    });
    if (!ok) return;
    this.api.deleteChecklist(this.checklistId).subscribe({
      next: () => { this.router.navigate(['/app/checklists']); },
      error: (err) => console.error('[OSCI] Failed to delete checklist:', err),
    });
  }
}
