import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Objects
  getObjects(params?: any): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/objects`, { params });
  }
  getObject(id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/objects/${id}`);
  }
  createObject(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/objects`, data);
  }
  updateObject(id: string, data: any): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/objects/${id}`, data);
  }
  deleteObject(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/objects/${id}`);
  }

  // Checklists
  getChecklists(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/checklists`);
  }
  getReferenceChecklists(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/checklists/references`);
  }
  getChecklist(id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/checklists/${id}`);
  }
  createChecklist(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/checklists`, data);
  }
  startChecklistRun(checklistId: string, options: { objectId?: string; objectGroupId?: string }): Observable<any> {
    const body = options.objectGroupId
      ? { objectGroupId: options.objectGroupId }
      : { objectId: options.objectId };
    return this.http.post<any>(`${this.baseUrl}/checklists/${checklistId}/run`, body);
  }
  getChecklistRun(runId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/checklists/runs/${runId}`);
  }
  updateRunItem(runId: string, itemId: string, data: any): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/checklists/runs/${runId}/items/${itemId}`, data);
  }
  completeChecklistRun(runId: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/checklists/runs/${runId}/complete`, {});
  }
  getRunsByObject(objectId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/checklists/runs/by-object/${objectId}`);
  }
  deduplicateTasks(objectId: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/checklists/deduplicate-tasks/${objectId}`, {});
  }
  updateChecklist(id: string, data: any): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/checklists/${id}`, data);
  }
  detachObjectFromChecklist(checklistId: string, objectId: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/checklists/${checklistId}/objects/${objectId}`);
  }
  deleteChecklist(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/checklists/${id}`);
  }
  bulkDeleteChecklists(ids: string[]): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/checklists/bulk-delete`, { ids });
  }
  getChecklistsByObjectType(objectType: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/checklists/by-type/${objectType}`);
  }
  addChecklistItem(checklistId: string, data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/checklists/${checklistId}/items`, data);
  }
  updateChecklistItem(checklistId: string, itemId: string, data: any): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/checklists/${checklistId}/items/${itemId}`, data);
  }
  deleteChecklistItem(checklistId: string, itemId: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/checklists/${checklistId}/items/${itemId}`);
  }
  syncChecklistItems(checklistId: string, body: { deletions: string[]; items: any[] }): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/checklists/${checklistId}/items/sync`, body);
  }

  // Scores
  getObjectScore(objectId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/scores/object/${objectId}`);
  }
  getGlobalScore(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/scores/global`);
  }
  computeScore(objectId: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/scores/compute/${objectId}`, {});
  }

  // Tasks
  getTasks(params?: any): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/tasks`, { params });
  }
  getTask(id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/tasks/${id}`);
  }
  createTask(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/tasks`, data);
  }
  updateTask(id: string, data: any): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/tasks/${id}`, data);
  }
  deleteTask(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/tasks/${id}`);
  }

  // Projects
  getProjects(params?: any): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/projects`, { params });
  }
  getProject(id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/projects/${id}`);
  }
  createProject(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/projects`, data);
  }
  updateProject(id: string, data: any): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/projects/${id}`, data);
  }
  deleteProject(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/projects/${id}`);
  }
  getProjectStats(id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/projects/${id}/stats`);
  }
  getProjectTasks(id: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/projects/${id}/tasks`);
  }

  // Project Concerned
  getProjectConcerned(projectId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/projects/${projectId}/concerned`);
  }
  addProjectConcerned(projectId: string, userId: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/projects/${projectId}/concerned`, { userId });
  }
  removeProjectConcerned(projectId: string, userId: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/projects/${projectId}/concerned/${userId}`);
  }

  // Milestones
  createMilestone(projectId: string, data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/projects/${projectId}/milestones`, data);
  }
  updateMilestone(projectId: string, milestoneId: string, data: any): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/projects/${projectId}/milestones/${milestoneId}`, data);
  }
  deleteMilestone(projectId: string, milestoneId: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/projects/${projectId}/milestones/${milestoneId}`);
  }

  // Task Concerned
  getTaskConcerned(taskId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/tasks/${taskId}/concerned`);
  }
  addTaskConcerned(taskId: string, userId: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/tasks/${taskId}/concerned`, { userId });
  }
  removeTaskConcerned(taskId: string, userId: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/tasks/${taskId}/concerned/${userId}`);
  }

  // Task Comments
  getTaskComments(taskId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/tasks/${taskId}/comments`);
  }
  createTaskComment(taskId: string, data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/tasks/${taskId}/comments`, data);
  }
  deleteTaskComment(taskId: string, commentId: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/tasks/${taskId}/comments/${commentId}`);
  }

  // Audit
  getAuditLogs(params?: any): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/audit-logs`, { params });
  }

  // Evidence
  uploadEvidence(file: File, objectId?: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    if (objectId) formData.append('objectId', objectId);
    return this.http.post<any>(`${this.baseUrl}/evidence`, formData);
  }
  getEvidenceList(params?: any): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/evidence`, { params });
  }
  downloadEvidence(id: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/evidence/${id}/download`, { responseType: 'blob' });
  }

  // Incidents
  getIncidents(params?: any): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/incidents`, { params });
  }
  createIncident(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/incidents`, data);
  }
  updateIncident(id: string, data: any): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/incidents/${id}`, data);
  }

  // Cartography
  getAssets(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/cartography/assets`);
  }
  createAsset(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/cartography/assets`, data);
  }
  updateAsset(id: string, data: any): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/cartography/assets/${id}`, data);
  }
  deleteAsset(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/cartography/assets/${id}`);
  }
  getRelations(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/cartography/relations`);
  }
  createRelation(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/cartography/relations`, data);
  }
  updateRelation(id: string, data: any): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/cartography/relations/${id}`, data);
  }
  deleteRelation(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/cartography/relations/${id}`);
  }
  getTopologyGraph(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/cartography/topology`);
  }
  getEnrichedTopology(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/cartography/topology/enriched`);
  }
  getImpactAnalysis(assetId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/cartography/impact/${assetId}`);
  }

  // Reports
  getReports(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/reports`);
  }
  generateReport(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/reports`, data);
  }
  getReport(id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/reports/${id}`);
  }
  downloadReport(id: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/reports/${id}/download`, { responseType: 'blob' });
  }

  // Object Groups
  getObjectGroups(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/object-groups`);
  }
  getObjectGroup(id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/object-groups/${id}`);
  }
  createObjectGroup(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/object-groups`, data);
  }
  updateObjectGroup(id: string, data: any): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/object-groups/${id}`, data);
  }
  deleteObjectGroup(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/object-groups/${id}`);
  }
  addGroupMembers(groupId: string, objectIds: string[]): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/object-groups/${groupId}/members`, { objectIds });
  }
  removeGroupMembers(groupId: string, objectIds: string[]): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/object-groups/${groupId}/members`, { body: { objectIds } });
  }
  getGroupScore(groupId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/object-groups/${groupId}/score`);
  }

  // Referentiels
  getReferentiels(params?: { type?: string; search?: string; page?: number; limit?: number }): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/referentiels`, { params: params as any });
  }
  getReferentiel(id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/referentiels/${id}`);
  }
  getReferentielStats(id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/referentiels/${id}/stats`);
  }
  getReferentielChecklists(referentielId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/referentiels/${referentielId}/checklists`);
  }
  createReferenceChecklist(referentielId: string, data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/referentiels/${referentielId}/checklists`, data);
  }
  createChecklistFromReferentiel(referentielId: string, data: { title?: string; domain?: string }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/referentiels/${referentielId}/create-checklist`, data);
  }
  createReferentiel(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/referentiels`, data);
  }
  updateReferentiel(id: string, data: any): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/referentiels/${id}`, data);
  }
  deleteReferentiel(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/referentiels/${id}`);
  }
  getReferentielControls(referentielId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/referentiels/${referentielId}/controls`);
  }
  getReferentielControl(referentielId: string, controlId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/referentiels/${referentielId}/controls/${controlId}`);
  }
  createReferentielControl(referentielId: string, data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/referentiels/${referentielId}/controls`, data);
  }
  updateReferentielControl(referentielId: string, controlId: string, data: any): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/referentiels/${referentielId}/controls/${controlId}`, data);
  }
  deleteReferentielControl(referentielId: string, controlId: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/referentiels/${referentielId}/controls/${controlId}`);
  }
  getMappedChecklistItems(referentielId: string, controlId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/referentiels/${referentielId}/controls/${controlId}/mapped-items`);
  }
  getReferentielMappedCounts(referentielId: string): Observable<Record<string, number>> {
    return this.http.get<Record<string, number>>(`${this.baseUrl}/referentiels/${referentielId}/controls/mapped-counts`);
  }
  importReferentielFromChecklist(referentielId: string, checklistId: string): Observable<{ imported: number }> {
    return this.http.post<any>(`${this.baseUrl}/referentiels/${referentielId}/import-from-checklist`, { checklistId });
  }
  importReferentielFromReferentiel(referentielId: string, sourceReferentielId: string): Observable<{ imported: number }> {
    return this.http.post<any>(`${this.baseUrl}/referentiels/${referentielId}/import-from-referentiel`, { sourceReferentielId });
  }

  // Community Referentiels
  getCommunityReferentiels(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/referentiels/community`);
  }
  importCommunityReferentiel(folder: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/referentiels/community/import`, { folder });
  }
  importCommunityChecklist(folder: string, checklistIndex: number): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/referentiels/community/import-checklist`, { folder, checklistIndex });
  }

  // RBAC - Auth Me
  getAuthMe(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/auth/me`);
  }

  // RBAC - Roles
  getRoles(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/roles`);
  }
  getRole(id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/roles/${id}`);
  }
  createRole(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/roles`, data);
  }
  updateRole(id: string, data: any): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/roles/${id}`, data);
  }
  deleteRole(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/roles/${id}`);
  }

  // RBAC - User Roles
  getUserRoles(userId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/users/${userId}/roles`);
  }
  setUserRoles(userId: string, roleIds: string[]): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/users/${userId}/roles`, { roleIds });
  }

  // RBAC - Resource Access
  getResourceAccess(resourceType: string, resourceId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/resources/${resourceType}/${resourceId}/access`);
  }
  grantResourceAccess(resourceType: string, resourceId: string, userId: string, actions: string[]): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/resources/${resourceType}/${resourceId}/access`, { userId, actions });
  }
  updateResourceAccess(resourceType: string, resourceId: string, userId: string, actions: string[]): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/resources/${resourceType}/${resourceId}/access/${userId}`, { actions });
  }
  revokeResourceAccess(resourceType: string, resourceId: string, userId: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/resources/${resourceType}/${resourceId}/access/${userId}`);
  }

  // Users
  getUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/users`);
  }
  getUser(id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/users/${id}`);
  }
  createUser(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/users`, data);
  }
  updateUser(id: string, data: any): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/users/${id}`, data);
  }
  deleteUser(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/users/${id}`);
  }

  // Auth
  changePassword(oldPassword: string, newPassword: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/auth/change-password`, { oldPassword, newPassword });
  }

  // User Admin Actions
  resetUserPassword(userId: string, temporaryPassword?: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/users/${userId}/reset-password`, { temporaryPassword });
  }
  toggleUserEnabled(userId: string, enabled: boolean): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/users/${userId}/toggle-enabled`, { enabled });
  }
  setUserRequiredActions(userId: string, actions: string[]): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/users/${userId}/required-actions`, { actions });
  }
  sendUserVerifyEmail(userId: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/users/${userId}/send-verify-email`, {});
  }
  mergeUsers(keepUserId: string, removeUserId: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/users/merge`, { keepUserId, removeUserId });
  }

  // User Permissions (direct)
  getUserPermissions(userId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/users/${userId}/permissions`);
  }
  setUserPermissions(userId: string, permissions: { resourceType: string; actions: string[] }[]): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/users/${userId}/permissions`, { permissions });
  }

  // User Groups
  getUserGroups(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/user-groups`);
  }
  getUserGroup(id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/user-groups/${id}`);
  }
  createUserGroup(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/user-groups`, data);
  }
  updateUserGroup(id: string, data: any): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/user-groups/${id}`, data);
  }
  deleteUserGroup(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/user-groups/${id}`);
  }
  getGroupMembers(groupId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/user-groups/${groupId}/members`);
  }
  addUserGroupMembers(groupId: string, userIds: string[]): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/user-groups/${groupId}/members`, { userIds });
  }
  removeUserGroupMember(groupId: string, userId: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/user-groups/${groupId}/members/${userId}`);
  }
  getGroupRoles(groupId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/user-groups/${groupId}/roles`);
  }
  setGroupRoles(groupId: string, roleIds: string[]): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/user-groups/${groupId}/roles`, { roleIds });
  }
  getGroupPermissions(groupId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/user-groups/${groupId}/permissions`);
  }
  setGroupPermissions(groupId: string, permissions: { resourceType: string; actions: string[] }[]): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/user-groups/${groupId}/permissions`, { permissions });
  }

  // Integrations
  getIntegrations(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/integrations`);
  }
  createIntegration(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/integrations`, data);
  }
  updateIntegration(id: string, data: any): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/integrations/${id}`, data);
  }
}
