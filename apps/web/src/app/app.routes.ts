import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { LayoutComponent } from './layout/layout.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'app',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'cockpit', pathMatch: 'full' },
      {
        path: 'cockpit',
        loadComponent: () => import('./features/dashboard/cockpit.component').then(m => m.CockpitComponent),
      },
      {
        path: 'objects',
        loadComponent: () => import('./features/objects/objects-list.component').then(m => m.ObjectsListComponent),
      },
      {
        path: 'objects/:id',
        loadComponent: () => import('./features/objects/object-detail.component').then(m => m.ObjectDetailComponent),
      },
      {
        path: 'object-groups/:id',
        loadComponent: () => import('./features/objects/object-group-detail.component').then(m => m.ObjectGroupDetailComponent),
      },
      {
        path: 'checklists',
        loadComponent: () => import('./features/checklists/checklists-list.component').then(m => m.ChecklistsListComponent),
      },
      {
        path: 'checklists/:id/run',
        loadComponent: () => import('./features/checklists/checklist-run.component').then(m => m.ChecklistRunComponent),
      },
      {
        path: 'checklists/:id',
        loadComponent: () => import('./features/checklists/checklist-detail.component').then(m => m.ChecklistDetailComponent),
      },
      {
        path: 'remediation',
        loadComponent: () => import('./features/remediation/remediation-kanban.component').then(m => m.RemediationKanbanComponent),
      },
      {
        path: 'projects',
        loadComponent: () => import('./features/projects/projects-list.component').then(m => m.ProjectsListComponent),
      },
      {
        path: 'projects/:id',
        loadComponent: () => import('./features/projects/project-detail.component').then(m => m.ProjectDetailComponent),
      },
      {
        path: 'cartography',
        loadComponent: () => import('./features/cartography/cartography.component').then(m => m.CartographyComponent),
      },
      {
        path: 'audit',
        loadComponent: () => import('./features/audit/audit.component').then(m => m.AuditComponent),
      },
      {
        path: 'referentiels',
        loadComponent: () => import('./features/referentiels/referentiels-list.component').then(m => m.ReferentielsListComponent),
      },
      {
        path: 'referentiels/:id/controls/:controlId',
        loadComponent: () => import('./features/referentiels/control-detail.component').then(m => m.ControlDetailComponent),
      },
      {
        path: 'referentiels/:id',
        loadComponent: () => import('./features/referentiels/referentiel-detail.component').then(m => m.ReferentielDetailComponent),
      },
      {
        path: 'reports',
        loadComponent: () => import('./features/reports/reports.component').then(m => m.ReportsComponent),
      },
      {
        path: 'incidents',
        loadComponent: () => import('./features/incidents/incidents.component').then(m => m.IncidentsComponent),
      },
    ],
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];
