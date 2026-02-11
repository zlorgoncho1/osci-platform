package authz

import rego.v1

default allow := false

# =============================================================================
# SecurityAdmin - Full system access
# =============================================================================
allow if {
	"SecurityAdmin" in input.user.roles
}

# =============================================================================
# SecurityManager - Manage objects, checklists, tasks, evidence, incidents
# =============================================================================
allow if {
	"SecurityManager" in input.user.roles
	input.action in ["read", "create", "update", "delete"]
	input.resource.type in ["object", "checklist", "task", "evidence", "incident", "report", "referentiel", "framework-control"]
}

# =============================================================================
# ProjectOwner - Manage own objects and create related resources
# =============================================================================
allow if {
	"ProjectOwner" in input.user.roles
	input.action in ["read", "update"]
	input.resource.ownerId == input.user.id
}

allow if {
	"ProjectOwner" in input.user.roles
	input.action == "create"
	input.resource.type in ["object", "checklist-run", "task", "evidence"]
}

# =============================================================================
# Auditor - Read-only access to everything + export capability
# =============================================================================
allow if {
	"Auditor" in input.user.roles
	input.action in ["read", "export"]
}

# =============================================================================
# Developer - Read access + respond to assigned checklists/tasks
# =============================================================================
allow if {
	"Developer" in input.user.roles
	input.action == "read"
}

allow if {
	"Developer" in input.user.roles
	input.action in ["create", "update"]
	input.resource.type in ["checklist-run-item", "evidence", "task"]
	input.resource.assignedToId == input.user.id
}

# =============================================================================
# Viewer - Read-only access
# =============================================================================
allow if {
	"Viewer" in input.user.roles
	input.action == "read"
}

# =============================================================================
# Deny Rules
# =============================================================================

# Deny access to audit logs for non-admin/auditor
deny if {
	input.resource.type == "audit-log"
	not "SecurityAdmin" in input.user.roles
	not "Auditor" in input.user.roles
}

# =============================================================================
# Step-up Authentication
# =============================================================================

# Step-up MFA required for sensitive destructive/export actions
step_up_required if {
	input.action in ["delete", "export"]
	input.resource.type in ["object", "report", "evidence"]
}
