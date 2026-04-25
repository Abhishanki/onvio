-- ============================================================
-- ONVIO · Complete Database Schema
-- Run this in your Supabase SQL editor
-- ============================================================

-- Enable extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_cron";

-- ============================================================
-- ENUMS
-- ============================================================

create type user_role as enum ('manager', 'lead', 'om', 'client');
create type project_status as enum ('active', 'on_hold', 'go_live_ready', 'hypercare', 'completed', 'cancelled');
create type rag_status as enum ('green', 'amber', 'red');
create type task_status as enum ('not_started', 'in_progress', 'completed', 'blocked', 'na');
create type task_owner as enum ('uc', 'customer', 'both');
create type escalation_level as enum ('om', 'lead', 'manager', 'sales');
create type cr_status as enum ('draft', 'pending_client', 'approved', 'rejected');
create type issue_severity as enum ('p1', 'p2', 'p3', 'p4');
create type issue_status as enum ('open', 'in_progress', 'resolved', 'closed');
create type solution_type as enum ('b2b', 'b2c', 'marketplace', 'omnichannel');
create type comment_visibility as enum ('internal', 'external');

-- ============================================================
-- ORGANISATIONS (multi-tenant)
-- ============================================================

create table organisations (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  slug          text unique not null,           -- e.g. "unicommerce"
  website_url   text,
  logo_url      text,
  primary_color text default '#6272f1',
  resend_domain text,                           -- custom email domain
  -- Reminder defaults
  stale_task_hours        integer default 48,
  escalation_interval_hrs integer default 24,
  hypercare_weeks         integer default 4,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ============================================================
-- USERS (extends Supabase auth.users)
-- ============================================================

create table users (
  id            uuid primary key references auth.users(id) on delete cascade,
  org_id        uuid references organisations(id) on delete cascade,
  email         text not null,
  full_name     text not null,
  role          user_role not null default 'om',
  title         text,                            -- "Onboarding Manager", "Team Lead" etc.
  photo_url     text,
  phone         text,
  is_active     boolean default true,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ============================================================
-- SOLUTION TEMPLATES
-- ============================================================

create table solution_templates (
  id            uuid primary key default uuid_generate_v4(),
  org_id        uuid references organisations(id) on delete cascade,
  name          text not null,                  -- "B2B", "B2C", "Marketplace", "Omnichannel"
  solution_type solution_type not null,
  description   text,
  is_active     boolean default true,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Phase templates
create table phase_templates (
  id              uuid primary key default uuid_generate_v4(),
  solution_id     uuid references solution_templates(id) on delete cascade,
  name            text not null,                -- "Setting Up", "Master Data" etc.
  phase_number    integer not null,
  description     text,
  default_days    integer default 7,
  sort_order      integer not null,
  created_at      timestamptz default now()
);

-- Task templates
create table task_templates (
  id              uuid primary key default uuid_generate_v4(),
  phase_id        uuid references phase_templates(id) on delete cascade,
  name            text not null,
  description     text,
  default_owner   task_owner not null default 'uc',
  default_tat_days integer default 2,
  support_doc_url text,
  support_doc_title text,
  is_required     boolean default true,
  sort_order      integer not null,
  created_at      timestamptz default now()
);

-- Subtask templates
create table subtask_templates (
  id              uuid primary key default uuid_generate_v4(),
  task_id         uuid references task_templates(id) on delete cascade,
  name            text not null,
  description     text,
  default_owner   task_owner not null default 'uc',
  default_tat_days integer default 1,
  support_doc_url text,
  support_doc_title text,
  is_required     boolean default true,
  sort_order      integer not null,
  created_at      timestamptz default now()
);

-- ============================================================
-- PROJECTS
-- ============================================================

create table projects (
  id              uuid primary key default uuid_generate_v4(),
  org_id          uuid references organisations(id) on delete cascade,
  project_code    text unique not null,         -- UC-2024-0843
  client_name     text not null,
  solution_id     uuid references solution_templates(id),
  solution_type   solution_type not null,
  
  -- Team
  manager_id      uuid references users(id),
  lead_id         uuid references users(id),
  om_id           uuid references users(id),

  -- Client contacts
  client_contact_l1_name  text,
  client_contact_l1_email text,
  client_contact_l1_phone text,
  client_contact_l2_name  text,
  client_contact_l2_email text,
  client_contact_l2_phone text,

  -- Dates
  kickoff_date    date,
  go_live_date    date,
  actual_go_live  date,
  hypercare_end   date,

  -- Status
  status          project_status default 'active',
  rag_status      rag_status default 'green',
  rag_override    boolean default false,
  rag_override_reason text,
  health_score    integer default 100,          -- 0-100

  -- Portal
  portal_token    text unique default encode(gen_random_bytes(32), 'hex'),
  portal_enabled  boolean default true,

  -- Sales handoff
  sales_handoff_email text,
  hubspot_deal_id text,

  -- Metadata
  notes           text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ============================================================
-- PROJECT PHASES (cloned from templates)
-- ============================================================

create table project_phases (
  id              uuid primary key default uuid_generate_v4(),
  project_id      uuid references projects(id) on delete cascade,
  template_phase_id uuid references phase_templates(id),
  name            text not null,
  phase_number    integer not null,
  sort_order      integer not null,
  start_date      date,
  end_date        date,
  progress_pct    integer default 0,
  is_collapsed    boolean default false,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ============================================================
-- PROJECT TASKS
-- ============================================================

create table project_tasks (
  id              uuid primary key default uuid_generate_v4(),
  project_id      uuid references projects(id) on delete cascade,
  phase_id        uuid references project_phases(id) on delete cascade,
  template_task_id uuid references task_templates(id),
  name            text not null,
  description     text,
  owner           task_owner not null default 'uc',
  status          task_status default 'not_started',
  tat_days        integer default 2,
  start_date      date,
  due_date        date,
  completed_date  date,
  support_doc_url text,
  support_doc_title text,
  sort_order      integer not null,
  is_required     boolean default true,
  -- Ticket IDs
  jira_id         text,
  jira_url        text,
  kapture_id      text,
  internal_ticket_id text,
  -- Escalation
  last_updated_at timestamptz default now(),
  escalation_level escalation_level,
  escalation_sent_at timestamptz,
  is_sales_flagged boolean default false,
  sales_flag_reason text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ============================================================
-- PROJECT SUBTASKS
-- ============================================================

create table project_subtasks (
  id              uuid primary key default uuid_generate_v4(),
  project_id      uuid references projects(id) on delete cascade,
  task_id         uuid references project_tasks(id) on delete cascade,
  template_subtask_id uuid references subtask_templates(id),
  name            text not null,
  description     text,
  owner           task_owner not null default 'uc',
  status          task_status default 'not_started',
  tat_days        integer default 1,
  start_date      date,
  due_date        date,
  completed_date  date,
  support_doc_url text,
  support_doc_title text,
  sort_order      integer not null,
  is_required     boolean default true,
  -- Ticket IDs
  jira_id         text,
  jira_url        text,
  kapture_id      text,
  internal_ticket_id text,
  -- Escalation
  last_updated_at timestamptz default now(),
  escalation_level escalation_level,
  escalation_sent_at timestamptz,
  is_sales_flagged boolean default false,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ============================================================
-- TASK COMMENTS
-- ============================================================

create table task_comments (
  id              uuid primary key default uuid_generate_v4(),
  project_id      uuid references projects(id) on delete cascade,
  task_id         uuid references project_tasks(id) on delete cascade,
  subtask_id      uuid references project_subtasks(id) on delete cascade,
  author_id       uuid references users(id),
  author_name     text not null,                -- denormalised for client comments
  author_role     user_role,
  visibility      comment_visibility default 'internal',
  content         text not null,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ============================================================
-- ACTIVITY LOG
-- ============================================================

create table activity_log (
  id              uuid primary key default uuid_generate_v4(),
  project_id      uuid references projects(id) on delete cascade,
  actor_id        uuid references users(id),
  actor_name      text not null,
  actor_role      user_role,
  action          text not null,               -- "task_updated", "comment_added" etc.
  entity_type     text,                        -- "task", "subtask", "project" etc.
  entity_id       uuid,
  entity_name     text,
  old_value       jsonb,
  new_value       jsonb,
  is_client_visible boolean default false,
  jira_id         text,
  kapture_id      text,
  remarks         text,
  created_at      timestamptz default now()
);

-- ============================================================
-- CHANNEL STATUS TRACKER
-- ============================================================

create table channel_statuses (
  id              uuid primary key default uuid_generate_v4(),
  project_id      uuid references projects(id) on delete cascade,
  channel_name    text not null,               -- "Shopify", "Amazon FBA" etc.
  is_active       boolean default false,
  order_sync      boolean default false,
  inventory_sync  boolean default false,
  notes           text,
  sort_order      integer default 0,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ============================================================
-- UAT CHECKLIST
-- ============================================================

create table uat_items (
  id              uuid primary key default uuid_generate_v4(),
  project_id      uuid references projects(id) on delete cascade,
  scenario        text not null,
  description     text,
  is_passed       boolean,
  tested_by       text,
  tested_at       timestamptz,
  notes           text,
  sort_order      integer not null,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create table uat_signoffs (
  id              uuid primary key default uuid_generate_v4(),
  project_id      uuid references projects(id) on delete cascade unique,
  signed_by_name  text not null,
  signed_by_email text not null,
  signature_data  text,                        -- base64 or typed name
  signed_at       timestamptz default now(),
  ip_address      text,
  notes           text
);

-- ============================================================
-- CHANGE REQUESTS
-- ============================================================

create table change_requests (
  id              uuid primary key default uuid_generate_v4(),
  project_id      uuid references projects(id) on delete cascade,
  cr_number       text not null,               -- CR-001, CR-002 etc.
  title           text not null,
  description     text not null,
  scope_impact    text,
  timeline_impact_days integer default 0,
  raised_by_id    uuid references users(id),
  raised_by_name  text not null,
  status          cr_status default 'draft',
  client_response text,
  approved_by     text,
  approved_at     timestamptz,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ============================================================
-- HYPERCARE ISSUES
-- ============================================================

create table hypercare_issues (
  id              uuid primary key default uuid_generate_v4(),
  project_id      uuid references projects(id) on delete cascade,
  issue_number    text not null,               -- HCI-001
  title           text not null,
  description     text not null,
  severity        issue_severity not null default 'p3',
  status          issue_status default 'open',
  raised_by       text not null,              -- name
  raised_by_type  text default 'client',      -- 'client' | 'internal'
  assigned_to_id  uuid references users(id),
  sla_hours       integer,                    -- p1=4, p2=8, p3=24, p4=72
  sla_breach_at   timestamptz,
  resolved_at     timestamptz,
  resolution_notes text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ============================================================
-- ESCALATION LOG
-- ============================================================

create table escalation_log (
  id              uuid primary key default uuid_generate_v4(),
  project_id      uuid references projects(id) on delete cascade,
  entity_type     text not null,              -- 'task' | 'subtask'
  entity_id       uuid not null,
  entity_name     text not null,
  escalation_level escalation_level not null,
  sent_to_email   text not null,
  sent_at         timestamptz default now(),
  resolved_at     timestamptz,
  is_resolved     boolean default false
);

-- ============================================================
-- EMAIL LOG
-- ============================================================

create table email_log (
  id              uuid primary key default uuid_generate_v4(),
  project_id      uuid references projects(id) on delete cascade,
  email_type      text not null,              -- 'welcome', 'dashboard', 'weekly_report', 'escalation', 'graduation'
  sent_to         text[] not null,
  sent_from       text not null,
  subject         text not null,
  resend_id       text,
  status          text default 'sent',
  sent_at         timestamptz default now(),
  opened_at       timestamptz,
  error           text
);

-- ============================================================
-- WEEKLY REPORTS CONFIG
-- ============================================================

create table weekly_report_config (
  id              uuid primary key default uuid_generate_v4(),
  project_id      uuid references projects(id) on delete cascade unique,
  is_enabled      boolean default true,
  send_day        integer default 1,          -- 0=Sun, 1=Mon
  send_hour       integer default 9,
  include_om_note boolean default true,
  last_sent_at    timestamptz,
  created_at      timestamptz default now()
);

-- ============================================================
-- INDEXES
-- ============================================================

create index idx_projects_org on projects(org_id);
create index idx_projects_om on projects(om_id);
create index idx_projects_lead on projects(lead_id);
create index idx_projects_status on projects(status);
create index idx_project_tasks_project on project_tasks(project_id);
create index idx_project_tasks_phase on project_tasks(phase_id);
create index idx_project_subtasks_task on project_subtasks(task_id);
create index idx_activity_log_project on activity_log(project_id);
create index idx_escalation_log_project on escalation_log(project_id);
create index idx_users_org on users(org_id);
create index idx_users_role on users(role);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table organisations enable row level security;
alter table users enable row level security;
alter table projects enable row level security;
alter table project_phases enable row level security;
alter table project_tasks enable row level security;
alter table project_subtasks enable row level security;
alter table task_comments enable row level security;
alter table activity_log enable row level security;
alter table channel_statuses enable row level security;
alter table uat_items enable row level security;
alter table uat_signoffs enable row level security;
alter table change_requests enable row level security;
alter table hypercare_issues enable row level security;
alter table escalation_log enable row level security;
alter table email_log enable row level security;
alter table solution_templates enable row level security;
alter table phase_templates enable row level security;
alter table task_templates enable row level security;
alter table subtask_templates enable row level security;

-- Helper function: get current user's role
create or replace function get_user_role()
returns user_role as $$
  select role from users where id = auth.uid();
$$ language sql security definer stable;

-- Helper function: get current user's org
create or replace function get_user_org()
returns uuid as $$
  select org_id from users where id = auth.uid();
$$ language sql security definer stable;

-- Helper function: get current user's lead_id (for leads seeing their team)
create or replace function get_user_managed_oms()
returns setof uuid as $$
  select id from users 
  where org_id = get_user_org() 
  and role = 'om';
$$ language sql security definer stable;

-- ORGANISATIONS: users see only their own org
create policy "users see own org" on organisations
  for select using (
    id = get_user_org()
  );

-- USERS: internal users see everyone in their org
create policy "internal users see org members" on users
  for select using (
    org_id = get_user_org()
    and get_user_role() in ('manager', 'lead', 'om')
  );

-- PROJECTS: role-based access
create policy "manager sees all org projects" on projects
  for all using (
    org_id = get_user_org() and get_user_role() = 'manager'
  );

create policy "lead sees team projects" on projects
  for select using (
    org_id = get_user_org()
    and get_user_role() = 'lead'
    and lead_id = auth.uid()
  );

create policy "om sees own projects" on projects
  for select using (
    org_id = get_user_org()
    and get_user_role() = 'om'
    and om_id = auth.uid()
  );

-- CLIENT portal access via token (no auth.uid required)
create policy "client portal token access" on projects
  for select using (
    portal_enabled = true
    and portal_token = current_setting('app.portal_token', true)
  );

-- PROJECT TASKS: inherit project access
create policy "project task access" on project_tasks
  for all using (
    project_id in (select id from projects)
  );

create policy "project subtask access" on project_subtasks
  for all using (
    project_id in (select id from projects)
  );

create policy "phase access" on project_phases
  for all using (
    project_id in (select id from projects)
  );

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply to all tables with updated_at
create trigger trg_organisations_updated before update on organisations for each row execute function update_updated_at();
create trigger trg_users_updated before update on users for each row execute function update_updated_at();
create trigger trg_projects_updated before update on projects for each row execute function update_updated_at();
create trigger trg_tasks_updated before update on project_tasks for each row execute function update_updated_at();
create trigger trg_subtasks_updated before update on project_subtasks for each row execute function update_updated_at();

-- Generate project code: UC-2024-0001
create or replace function generate_project_code(org_slug text, year int)
returns text as $$
declare
  count int;
  code text;
begin
  select count(*) into count
  from projects p
  join organisations o on o.id = p.org_id
  where o.slug = org_slug
  and extract(year from p.created_at) = year;
  
  code := upper(org_slug) || '-' || year || '-' || lpad((count + 1)::text, 4, '0');
  return code;
end;
$$ language plpgsql;

-- Clone template into project (called on project creation)
create or replace function clone_solution_template(
  p_project_id uuid,
  p_solution_id uuid
) returns void as $$
declare
  v_phase phase_templates%rowtype;
  v_task  task_templates%rowtype;
  v_sub   subtask_templates%rowtype;
  v_phase_id uuid;
  v_task_id  uuid;
begin
  for v_phase in
    select * from phase_templates where solution_id = p_solution_id order by sort_order
  loop
    insert into project_phases (project_id, template_phase_id, name, phase_number, sort_order)
    values (p_project_id, v_phase.id, v_phase.name, v_phase.phase_number, v_phase.sort_order)
    returning id into v_phase_id;

    for v_task in
      select * from task_templates where phase_id = v_phase.id order by sort_order
    loop
      insert into project_tasks (
        project_id, phase_id, template_task_id, name, description,
        owner, tat_days, support_doc_url, support_doc_title, is_required, sort_order
      ) values (
        p_project_id, v_phase_id, v_task.id, v_task.name, v_task.description,
        v_task.default_owner, v_task.default_tat_days,
        v_task.support_doc_url, v_task.support_doc_title, v_task.is_required, v_task.sort_order
      ) returning id into v_task_id;

      for v_sub in
        select * from subtask_templates where task_id = v_task.id order by sort_order
      loop
        insert into project_subtasks (
          project_id, task_id, template_subtask_id, name, description,
          owner, tat_days, support_doc_url, support_doc_title, is_required, sort_order
        ) values (
          p_project_id, v_task_id, v_sub.id, v_sub.name, v_sub.description,
          v_sub.default_owner, v_sub.default_tat_days,
          v_sub.support_doc_url, v_sub.support_doc_title, v_sub.is_required, v_sub.sort_order
        );
      end loop;
    end loop;
  end loop;
end;
$$ language plpgsql;

-- Calculate health score
create or replace function calculate_health_score(p_project_id uuid)
returns integer as $$
declare
  total_tasks     integer;
  completed_tasks integer;
  blocked_tasks   integer;
  stale_tasks     integer;
  score           integer := 100;
  completion_pts  integer;
  blocked_pts     integer;
  stale_pts       integer;
begin
  select count(*) into total_tasks from project_subtasks where project_id = p_project_id;
  select count(*) into completed_tasks from project_subtasks where project_id = p_project_id and status = 'completed';
  select count(*) into blocked_tasks from project_subtasks where project_id = p_project_id and status = 'blocked';
  select count(*) into stale_tasks from project_subtasks 
    where project_id = p_project_id 
    and status not in ('completed', 'na')
    and last_updated_at < now() - interval '48 hours';

  if total_tasks = 0 then return 100; end if;

  -- Completion: 40 pts
  completion_pts := round(40.0 * completed_tasks / total_tasks);
  -- No blocked: 20 pts (lose 2 pts per blocked task, min 0)
  blocked_pts := greatest(0, 20 - (blocked_tasks * 2));
  -- No stale: 20 pts (lose 4 pts per stale task, min 0)
  stale_pts := greatest(0, 20 - (stale_tasks * 4));
  -- Client responsiveness: 20 pts (static for now, will be dynamic in phase 2)

  score := completion_pts + blocked_pts + stale_pts + 20;
  return least(100, greatest(0, score));
end;
$$ language plpgsql;
