// ============================================================
// ONVIO · Core TypeScript Types
// ============================================================

export type UserRole = 'manager' | 'lead' | 'om' | 'client'
export type ProjectStatus = 'active' | 'go_live_ready' | 'live' | 'hypercare' | 'completed' | 'on_hold' | 'cancelled'
export type RAGStatus = 'green' | 'amber' | 'red'
export type TaskStatus = 'not_started' | 'in_progress' | 'completed' | 'blocked' | 'na'
export type TaskOwner = 'uc' | 'customer' | 'both'
export type IssueSeverity = 'P1' | 'P2' | 'P3' | 'P4'
export type EscalationLevel = 'om' | 'lead' | 'manager' | 'sales'
export type CommentVisibility = 'internal' | 'external'
export type CRStatus = 'draft' | 'pending_client' | 'approved' | 'rejected'

export interface Organisation {
  id: string
  name: string
  slug: string
  website_url?: string
  logo_url?: string
  primary_color: string
  accent_color: string
  reminder_default_hours: number
  escalation_l1_hours: number
  escalation_l2_hours: number
  escalation_l3_hours: number
  escalation_l4_hours: number
  hypercare_weeks: number
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  org_id: string
  full_name: string
  email: string
  role: UserRole
  photo_url?: string
  phone?: string
  designation?: string
  lead_id?: string
  is_active: boolean
  created_at: string
  updated_at: string
  // Relations
  organisation?: Organisation
  lead?: Profile
}

export interface SolutionTemplate {
  id: string
  org_id: string
  name: string
  description?: string
  is_active: boolean
  sort_order: number
  phases?: TemplatePhase[]
}

export interface TemplatePhase {
  id: string
  template_id: string
  name: string
  description?: string
  sort_order: number
  tasks?: TemplateTask[]
}

export interface TemplateTask {
  id: string
  phase_id: string
  name: string
  description?: string
  owner: TaskOwner
  tat_days: number
  support_doc_url?: string
  support_doc_title?: string
  is_required: boolean
  sort_order: number
  subtasks?: TemplateSubtask[]
}

export interface TemplateSubtask {
  id: string
  task_id: string
  name: string
  description?: string
  owner: TaskOwner
  tat_days: number
  support_doc_url?: string
  support_doc_title?: string
  is_required: boolean
  sort_order: number
}

export interface Project {
  id: string
  org_id: string
  project_code: string
  client_name: string
  client_company: string
  solution_type: string
  template_id?: string
  manager_id: string
  lead_id: string
  om_id: string
  client_contact_l1_name?: string
  client_contact_l1_email?: string
  client_contact_l1_phone?: string
  client_contact_l2_name?: string
  client_contact_l2_email?: string
  client_contact_l2_phone?: string
  kickoff_date?: string
  go_live_target?: string
  go_live_actual?: string
  hypercare_end?: string
  status: ProjectStatus
  rag: RAGStatus
  rag_override: boolean
  rag_override_reason?: string
  portal_token: string
  portal_enabled: boolean
  health_score: number
  notes?: string
  is_sales_flagged: boolean
  sales_flag_reason?: string
  created_at: string
  updated_at: string
  // Relations
  manager?: Profile
  lead?: Profile
  om?: Profile
  phases?: ProjectPhase[]
}

export interface ProjectPhase {
  id: string
  project_id: string
  template_phase_id?: string
  name: string
  description?: string
  sort_order: number
  is_active: boolean
  started_at?: string
  completed_at?: string
  tasks?: ProjectTask[]
}

export interface ProjectTask {
  id: string
  project_id: string
  phase_id: string
  template_task_id?: string
  name: string
  description?: string
  owner: TaskOwner
  status: TaskStatus
  sort_order: number
  tat_days: number
  start_date?: string
  due_date?: string
  completed_date?: string
  support_doc_url?: string
  support_doc_title?: string
  jira_ticket_id?: string
  jira_ticket_url?: string
  kapture_ticket_id?: string
  internal_ticket_id?: string
  sla_breached: boolean
  created_at: string
  updated_at: string
  subtasks?: ProjectSubtask[]
}

export interface ProjectSubtask {
  id: string
  project_id: string
  task_id: string
  template_subtask_id?: string
  name: string
  description?: string
  owner: TaskOwner
  status: TaskStatus
  sort_order: number
  tat_days: number
  start_date?: string
  due_date?: string
  completed_date?: string
  support_doc_url?: string
  support_doc_title?: string
  jira_ticket_id?: string
  jira_ticket_url?: string
  kapture_ticket_id?: string
  internal_ticket_id?: string
  sla_breached: boolean
  client_notes?: string
  created_at: string
  updated_at: string
}

export interface HypercareIssue {
  id: string
  project_id: string
  raised_by_name: string
  raised_by_email?: string
  is_client_raised: boolean
  title: string
  description: string
  severity: IssueSeverity
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  assigned_to_id?: string
  jira_ticket_id?: string
  sla_hours: number
  sla_breached: boolean
  resolved_at?: string
  created_at: string
  updated_at: string
}

export interface ChangeRequest {
  id: string
  project_id: string
  raised_by_id?: string
  cr_number: string
  title: string
  description: string
  scope_impact?: string
  timeline_impact?: string
  status: CRStatus
  client_response?: string
  approved_at?: string
  rejected_at?: string
  created_at: string
  updated_at: string
}

export interface ProjectChannel {
  id: string
  project_id: string
  channel_name: string
  is_active: boolean
  order_sync: boolean
  inventory_sync: boolean
  go_live_date?: string
  notes?: string
  sort_order: number
}

export interface ActivityLogEntry {
  id: string
  project_id: string
  actor_id?: string
  actor_name: string
  action: string
  entity_type?: string
  entity_id?: string
  entity_name?: string
  old_value?: string
  new_value?: string
  jira_id?: string
  kapture_id?: string
  remarks?: string
  is_client_visible: boolean
  created_at: string
}

// Dashboard types
export interface ProjectSummary {
  project: Project
  total_tasks: number
  completed_tasks: number
  blocked_tasks: number
  sla_breached_count: number
  completion_percentage: number
  days_to_go_live: number
}

export interface ManagerDashboard {
  total_projects: number
  active_projects: number
  rag_counts: { green: number; amber: number; red: number }
  projects: ProjectSummary[]
}
