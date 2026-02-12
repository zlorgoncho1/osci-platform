import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { CanAccessGuard } from './core/guards/can-access.guard';
import { LayoutComponent } from './layout/layout.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'change-password',
    loadComponent: () => import('./features/auth/change-password.component').then(m => m.ChangePasswordComponent),
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
        canActivate: [CanAccessGuard],
        data: { resourceType: 'object', action: 'read' },
      },
      {
        path: 'objects/:id',
        loadComponent: () => import('./features/objects/object-detail.component').then(m => m.ObjectDetailComponent),
        canActivate: [CanAccessGuard],
        data: { resourceType: 'object', action: 'read' },
      },
      {
        path: 'object-groups/:id',
        loadComponent: () => import('./features/objects/object-group-detail.component').then(m => m.ObjectGroupDetailComponent),
        canActivate: [CanAccessGuard],
        data: { resourceType: 'object_group', action: 'read' },
      },
      {
        path: 'checklists',
        loadComponent: () => import('./features/checklists/checklists-list.component').then(m => m.ChecklistsListComponent),
        canActivate: [CanAccessGuard],
        data: { resourceType: 'checklist', action: 'read' },
      },
      {
        path: 'checklists/:id/run',
        loadComponent: () => import('./features/checklists/checklist-run.component').then(m => m.ChecklistRunComponent),
        canActivate: [CanAccessGuard],
        data: { resourceType: 'checklist_run', action: 'read' },
      },
      {
        path: 'checklists/:id',
        loadComponent: () => import('./features/checklists/checklist-detail.component').then(m => m.ChecklistDetailComponent),
        canActivate: [CanAccessGuard],
        data: { resourceType: 'checklist', action: 'read' },
      },
      {
        path: 'remediation',
        loadComponent: () => import('./features/remediation/remediation-kanban.component').then(m => m.RemediationKanbanComponent),
        canActivate: [CanAccessGuard],
        data: { resourceType: 'task', action: 'read' },
      },
      {
        path: 'projects',
        loadComponent: () => import('./features/projects/projects-list.component').then(m => m.ProjectsListComponent),
        canActivate: [CanAccessGuard],
        data: { resourceType: 'project', action: 'read' },
      },
      {
        path: 'projects/:id',
        loadComponent: () => import('./features/projects/project-detail.component').then(m => m.ProjectDetailComponent),
        canActivate: [CanAccessGuard],
        data: { resourceType: 'project', action: 'read' },
      },
      {
        path: 'cartography',
        loadComponent: () => import('./features/cartography/cartography.component').then(m => m.CartographyComponent),
        canActivate: [CanAccessGuard],
        data: { resourceType: 'cartography_asset', action: 'read' },
      },
      {
        path: 'audit',
        loadComponent: () => import('./features/audit/audit.component').then(m => m.AuditComponent),
        canActivate: [CanAccessGuard],
        data: { resourceType: 'audit_log', action: 'read' },
      },
      {
        path: 'referentiels',
        loadComponent: () => import('./features/referentiels/referentiels-list.component').then(m => m.ReferentielsListComponent),
        canActivate: [CanAccessGuard],
        data: { resourceType: 'referentiel', action: 'read' },
      },
      {
        path: 'referentiels/:id/controls/:controlId',
        loadComponent: () => import('./features/referentiels/control-detail.component').then(m => m.ControlDetailComponent),
        canActivate: [CanAccessGuard],
        data: { resourceType: 'referentiel', action: 'read' },
      },
      {
        path: 'referentiels/:id',
        loadComponent: () => import('./features/referentiels/referentiel-detail.component').then(m => m.ReferentielDetailComponent),
        canActivate: [CanAccessGuard],
        data: { resourceType: 'referentiel', action: 'read' },
      },
      {
        path: 'reports',
        loadComponent: () => import('./features/reports/reports.component').then(m => m.ReportsComponent),
        canActivate: [CanAccessGuard],
        data: { resourceType: 'report', action: 'read' },
      },
      {
        path: 'incidents',
        loadComponent: () => import('./features/incidents/incidents.component').then(m => m.IncidentsComponent),
        canActivate: [CanAccessGuard],
        data: { resourceType: 'incident', action: 'read' },
      },
      // Admin routes
      {
        path: 'admin/users',
        loadComponent: () => import('./features/admin/users-admin.component').then(m => m.UsersAdminComponent),
        canActivate: [CanAccessGuard],
        data: { resourceType: 'user', action: 'read' },
      },
      {
        path: 'admin/user-groups',
        loadComponent: () => import('./features/admin/user-groups-admin.component').then(m => m.UserGroupsAdminComponent),
        canActivate: [CanAccessGuard],
        data: { resourceType: 'user_group', action: 'read' },
      },
      {
        path: 'admin/roles',
        loadComponent: () => import('./features/admin/roles-admin.component').then(m => m.RolesAdminComponent),
        canActivate: [CanAccessGuard],
        data: { resourceType: 'user', action: 'manage' },
      },
    ],
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];
