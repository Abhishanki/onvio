-- ============================================================
-- ONVIO · Initial Database Schema
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('manager', 'lead', 'om', 'client');
CREATE TYPE project_status AS ENUM ('active', 'go_live_ready', 'live', 'hypercare', 'completed', 'on_hold', 'cancelled');
CREATE TYPE rag_status AS ENUM ('green', 'amber', 'red');
CREATE TYPE task_status AS ENUM ('not_started', 'in_progress', 'completed', 'blocked', 'na');
CREATE TYPE task_owner AS ENUM ('uc', 'customer', 'both');
CREATE TYPE solution_type AS ENUM ('B2B', 'B2C', 'Omni', 'Marketplace');
CREATE TYPE cr_status AS ENUM ('draft', 'pending_client', 'approved', 'rejected');
CREATE TYPE issue_severity AS ENUM ('P1', 'P2', 'P3', 'P4');
CREATE TYPE issue_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE escalation_level AS ENUM ('om', 'lead', 'manager', 'sales');
CREATE TYPE comment_visibility AS ENUM ('internal', 'external');

-- ============================================================
-- ORGANISATIONS (multi-tenant)
-- ============================================================

CREATE TABLE organisations (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,
  website_url   TEXT,
  logo_url      TEXT,
  primary_color TEXT DEFAULT '#6366f1',
  accent_color  TEXT DEFAULT '#4f46e5',
  reminder_default_hours  INTEGER DEFAULT 48,
  escalation_l1_hours     INTEGER DEFAULT 48,
  escalation_l2_hours     INTEGER DEFAULT 96,
  escalation_l3_hours     INTEGER DEFAULT 144,
  escalation_l4_hours     INTEGER DEFAULT 192,
  hypercare_weeks         INTEGER DEFAULT 4,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- USERS / PROFILES
-- ============================================================

CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id        UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  full_name     TEXT NOT NULL,
  email         TEXT NOT NULL,
  role          user_role NOT NULL DEFAULT 'om',
  photo_url     TEXT,
  phone         TEXT,
  designation   TEXT,
  lead_id       UUID REFERENCES profiles(id),  -- OM's reporting lead
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SOLUTION TYPES & TEMPLATES
-- ============================================================

CREATE TABLE solution_templates (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id        UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,  -- e.g. "B2B", "B2C", "Omni", "Marketplace"
  description   TEXT,
  is_active     BOOLEAN DEFAULT TRUE,
  sort_order    INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE template_phases (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id   UUID NOT NULL REFERENCES solution_templates(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE template_tasks (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phase_id      UUID NOT NULL REFERENCES template_phases(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  owner         task_owner NOT NULL DEFAULT 'uc',
  tat_days      INTEGER DEFAULT 1,
  support_doc_url TEXT,
  support_doc_title TEXT,
  is_required   BOOLEAN DEFAULT TRUE,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE template_subtasks (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id       UUID NOT NULL REFERENCES template_tasks(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  owner         task_owner NOT NULL DEFAULT 'uc',
  tat_days      INTEGER DEFAULT 1,
  support_doc_url TEXT,
  support_doc_title TEXT,
  is_required   BOOLEAN DEFAULT TRUE,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PROJECTS
-- ============================================================

CREATE TABLE projects (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  project_code    TEXT UNIQUE NOT NULL,  -- e.g. UC-2024-0843
  client_name     TEXT NOT NULL,
  client_company  TEXT NOT NULL,
  solution_type   TEXT NOT NULL,
  template_id     UUID REFERENCES solution_templates(id),
  
  -- Team
  manager_id      UUID NOT NULL REFERENCES profiles(id),
  lead_id         UUID NOT NULL REFERENCES profiles(id),
  om_id           UUID NOT NULL REFERENCES profiles(id),
  
  -- Client contacts
  client_contact_l1_name  TEXT,
  client_contact_l1_email TEXT,
  client_contact_l1_phone TEXT,
  client_contact_l2_name  TEXT,
  client_contact_l2_email TEXT,
  client_contact_l2_phone TEXT,
  
  -- Dates
  kickoff_date    DATE,
  go_live_target  DATE,
  go_live_actual  DATE,
  hypercare_end   DATE,
  
  -- Status
  status          project_status NOT NULL DEFAULT 'active',
  rag             rag_status NOT NULL DEFAULT 'green',
  rag_override    BOOLEAN DEFAULT FALSE,
  rag_override_reason TEXT,
  rag_updated_at  TIMESTAMPTZ,
  
  -- Portal
  portal_token    TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  portal_enabled  BOOLEAN DEFAULT TRUE,
  
  -- Scores
  health_score    INTEGER DEFAULT 100,
  
  -- Misc
  notes           TEXT,
  is_sales_flagged BOOLEAN DEFAULT FALSE,
  sales_flag_reason TEXT,
  
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PROJECT PHASES (cloned from template)
-- ============================================================

CREATE TABLE project_phases (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  template_phase_id UUID REFERENCES template_phases(id),
  name          TEXT NOT NULL,
  description   TEXT,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  is_active     BOOLEAN DEFAULT FALSE,
  started_at    TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PROJECT TASKS
-- ============================================================

CREATE TABLE project_tasks (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  phase_id        UUID NOT NULL REFERENCES project_phases(id) ON DELETE CASCADE,
  template_task_id UUID REFERENCES template_tasks(id),
  name            TEXT NOT NULL,
  description     TEXT,
  owner           task_owner NOT NULL DEFAULT 'uc',
  status          task_status NOT NULL DEFAULT 'not_started',
  sort_order      INTEGER NOT NULL DEFAULT 0,
  
  -- Dates & TAT
  tat_days        INTEGER DEFAULT 1,
  start_date      DATE,
  due_date        DATE,
  completed_date  DATE,
  
  -- Docs & tickets
  support_doc_url   TEXT,
  support_doc_title TEXT,
  jira_ticket_id    TEXT,
  jira_ticket_url   TEXT,
  kapture_ticket_id TEXT,
  internal_ticket_id TEXT,
  
  -- SLA
  sla_breached    BOOLEAN DEFAULT FALSE,
  sla_breached_at TIMESTAMPTZ,
  last_escalation_at TIMESTAMPTZ,
  escalation_level escalation_level,
  
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PROJECT SUBTASKS
-- ============================================================

CREATE TABLE project_subtasks (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  task_id             UUID NOT NULL REFERENCES project_tasks(id) ON DELETE CASCADE,
  template_subtask_id UUID REFERENCES template_subtasks(id),
  name                TEXT NOT NULL,
  description         TEXT,
  owner               task_owner NOT NULL DEFAULT 'uc',
  status              task_status NOT NULL DEFAULT 'not_started',
  sort_order          INTEGER NOT NULL DEFAULT 0,
  
  -- Dates & TAT
  tat_days            INTEGER DEFAULT 1,
  start_date          DATE,
  due_date            DATE,
  completed_date      DATE,
  
  -- Docs & tickets
  support_doc_url     TEXT,
  support_doc_title   TEXT,
  jira_ticket_id      TEXT,
  jira_ticket_url     TEXT,
  kapture_ticket_id   TEXT,
  internal_ticket_id  TEXT,
  
  -- SLA
  sla_breached        BOOLEAN DEFAULT FALSE,
  sla_breached_at     TIMESTAMPTZ,
  last_escalation_at  TIMESTAMPTZ,
  escalation_level    escalation_level,
  
  -- Client
  client_notes        TEXT,
  
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TASK COMMENTS
-- ============================================================

CREATE TABLE task_comments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  task_id         UUID REFERENCES project_tasks(id) ON DELETE CASCADE,
  subtask_id      UUID REFERENCES project_subtasks(id) ON DELETE CASCADE,
  author_id       UUID REFERENCES profiles(id),
  author_name     TEXT NOT NULL,  -- for client comments (no profile)
  visibility      comment_visibility NOT NULL DEFAULT 'internal',
  content         TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT comment_has_parent CHECK (task_id IS NOT NULL OR subtask_id IS NOT NULL)
);

-- ============================================================
-- ACTIVITY LOG
-- ============================================================

CREATE TABLE activity_log (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  actor_id        UUID REFERENCES profiles(id),
  actor_name      TEXT NOT NULL,
  action          TEXT NOT NULL,
  entity_type     TEXT,  -- 'task', 'subtask', 'project', 'cr', 'issue'
  entity_id       UUID,
  entity_name     TEXT,
  old_value       TEXT,
  new_value       TEXT,
  jira_id         TEXT,
  kapture_id      TEXT,
  remarks         TEXT,
  is_client_visible BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CHANGE REQUESTS
-- ============================================================

CREATE TABLE change_requests (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  raised_by_id    UUID REFERENCES profiles(id),
  cr_number       TEXT NOT NULL,  -- e.g. CR-001
  title           TEXT NOT NULL,
  description     TEXT NOT NULL,
  scope_impact    TEXT,
  timeline_impact TEXT,
  status          cr_status NOT NULL DEFAULT 'draft',
  client_response TEXT,
  approved_at     TIMESTAMPTZ,
  rejected_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- UAT CHECKLIST
-- ============================================================

CREATE TABLE uat_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  scenario        TEXT NOT NULL,
  description     TEXT,
  sort_order      INTEGER DEFAULT 0,
  status          TEXT DEFAULT 'pending',  -- pending, pass, fail
  tested_at       TIMESTAMPTZ,
  remarks         TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE uat_signoffs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  signed_by_name  TEXT NOT NULL,
  signed_by_email TEXT NOT NULL,
  signature_data  TEXT,  -- base64 or typed name
  signed_at       TIMESTAMPTZ DEFAULT NOW(),
  ip_address      TEXT
);

-- ============================================================
-- HYPERCARE ISSUES
-- ============================================================

CREATE TABLE hypercare_issues (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  raised_by_name  TEXT NOT NULL,
  raised_by_email TEXT,
  is_client_raised BOOLEAN DEFAULT FALSE,
  title           TEXT NOT NULL,
  description     TEXT NOT NULL,
  severity        issue_severity NOT NULL DEFAULT 'P3',
  status          issue_status NOT NULL DEFAULT 'open',
  assigned_to_id  UUID REFERENCES profiles(id),
  jira_ticket_id  TEXT,
  sla_hours       INTEGER,  -- P1=4, P2=8, P3=24, P4=72
  sla_breached    BOOLEAN DEFAULT FALSE,
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CHANNEL STATUS
-- ============================================================

CREATE TABLE project_channels (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  channel_name    TEXT NOT NULL,  -- e.g. Shopify, Amazon FBA
  is_active       BOOLEAN DEFAULT TRUE,
  order_sync      BOOLEAN DEFAULT FALSE,
  inventory_sync  BOOLEAN DEFAULT FALSE,
  go_live_date    DATE,
  notes           TEXT,
  sort_order      INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ESCALATION LOG
-- ============================================================

CREATE TABLE escalation_log (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  task_id         UUID REFERENCES project_tasks(id),
  subtask_id      UUID REFERENCES project_subtasks(id),
  escalation_level escalation_level NOT NULL,
  escalated_to_id UUID REFERENCES profiles(id),
  escalated_to_email TEXT,
  reason          TEXT,
  email_sent      BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- EMAIL LOG
-- ============================================================

CREATE TABLE email_log (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id      UUID REFERENCES projects(id) ON DELETE SET NULL,
  org_id          UUID REFERENCES organisations(id),
  type            TEXT NOT NULL,  -- welcome, dashboard, reminder, weekly_report, graduation
  sent_by_id      UUID REFERENCES profiles(id),
  sent_from       TEXT NOT NULL,
  sent_to         TEXT[] NOT NULL,
  cc              TEXT[],
  subject         TEXT NOT NULL,
  resend_id       TEXT,
  status          TEXT DEFAULT 'sent',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_projects_org ON projects(org_id);
CREATE INDEX idx_projects_om ON projects(om_id);
CREATE INDEX idx_projects_lead ON projects(lead_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_project_phases_project ON project_phases(project_id);
CREATE INDEX idx_project_tasks_project ON project_tasks(project_id);
CREATE INDEX idx_project_tasks_phase ON project_tasks(phase_id);
CREATE INDEX idx_project_tasks_status ON project_tasks(status);
CREATE INDEX idx_project_subtasks_task ON project_subtasks(task_id);
CREATE INDEX idx_project_subtasks_status ON project_subtasks(status);
CREATE INDEX idx_activity_log_project ON activity_log(project_id);
CREATE INDEX idx_profiles_org ON profiles(org_id);
CREATE INDEX idx_profiles_lead ON profiles(lead_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE uat_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE hypercare_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE solution_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_subtasks ENABLE ROW LEVEL SECURITY;

-- Org isolation: users only see their own org's data
CREATE POLICY "org_isolation_profiles" ON profiles
  FOR ALL USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "org_isolation_projects" ON projects
  FOR ALL USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- Manager sees all projects in org
CREATE POLICY "manager_all_projects" ON projects
  FOR SELECT USING (
    org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'manager'
  );

-- Lead sees only their team's projects
CREATE POLICY "lead_team_projects" ON projects
  FOR SELECT USING (
    lead_id = auth.uid()
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'lead'
  );

-- OM sees only their own projects
CREATE POLICY "om_own_projects" ON projects
  FOR SELECT USING (
    om_id = auth.uid()
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'om'
  );

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Generate project code (e.g. UC-2024-0843)
CREATE OR REPLACE FUNCTION generate_project_code(org_slug TEXT)
RETURNS TEXT AS $$
DECLARE
  year_str TEXT := TO_CHAR(NOW(), 'YYYY');
  seq_num  INTEGER;
  prefix   TEXT;
BEGIN
  prefix := UPPER(LEFT(org_slug, 2));
  SELECT COUNT(*) + 1 INTO seq_num
  FROM projects p
  JOIN organisations o ON p.org_id = o.id
  WHERE o.slug = org_slug
    AND EXTRACT(YEAR FROM p.created_at) = EXTRACT(YEAR FROM NOW());
  RETURN prefix || '-' || year_str || '-' || LPAD(seq_num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Calculate health score
CREATE OR REPLACE FUNCTION calculate_health_score(p_project_id UUID)
RETURNS INTEGER AS $$
DECLARE
  total_tasks     INTEGER := 0;
  completed_tasks INTEGER := 0;
  blocked_tasks   INTEGER := 0;
  stale_tasks     INTEGER := 0;
  tasks_score     INTEGER := 0;
  blocked_score   INTEGER := 0;
  stale_score     INTEGER := 0;
  client_score    INTEGER := 20;  -- default full
  health          INTEGER := 0;
BEGIN
  SELECT COUNT(*), 
         COUNT(*) FILTER (WHERE status = 'completed'),
         COUNT(*) FILTER (WHERE status = 'blocked'),
         COUNT(*) FILTER (WHERE sla_breached = TRUE)
  INTO total_tasks, completed_tasks, blocked_tasks, stale_tasks
  FROM project_subtasks
  WHERE project_id = p_project_id;

  IF total_tasks > 0 THEN
    tasks_score   := ROUND((completed_tasks::FLOAT / total_tasks) * 40);
    blocked_score := GREATEST(0, 20 - (blocked_tasks * 5));
    stale_score   := GREATEST(0, 20 - (stale_tasks * 4));
  ELSE
    tasks_score := 40; blocked_score := 20; stale_score := 20;
  END IF;

  health := tasks_score + blocked_score + stale_score + client_score;
  RETURN LEAST(100, GREATEST(0, health));
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TRIGGERS
-- ============================================================

CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_tasks_updated_at
  BEFORE UPDATE ON project_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_subtasks_updated_at
  BEFORE UPDATE ON project_subtasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ============================================================
-- STORAGE BUCKETS
-- ============================================================

INSERT INTO storage.buckets (id, name, public) VALUES
  ('profiles', 'profiles', true),
  ('org-assets', 'org-assets', true)
ON CONFLICT DO NOTHING;

CREATE POLICY "Public profile photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'profiles');

CREATE POLICY "Auth users upload photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'profiles' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own photo" ON storage.objects
  FOR UPDATE USING (bucket_id = 'profiles' AND auth.uid()::text = (storage.foldername(name))[1]);
