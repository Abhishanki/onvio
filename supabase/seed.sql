-- ============================================================
-- ONVIO · Seed Data for Unicommerce
-- ============================================================

-- Organisation
insert into organisations (id, name, slug, website_url, primary_color, stale_task_hours, escalation_interval_hrs, hypercare_weeks)
values (
  'a0000000-0000-0000-0000-000000000001',
  'Unicommerce',
  'unicommerce',
  'https://unicommerce.com',
  '#6272f1',
  48,
  24,
  4
);

-- ============================================================
-- SOLUTION TEMPLATES
-- ============================================================

-- B2C Solution
insert into solution_templates (id, org_id, name, solution_type, description) values
('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'B2C (Direct to Consumer)', 'b2c', 'Standard B2C implementation for direct consumer brands'),
('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'B2B (Business to Business)', 'b2b', 'B2B implementation with bulk order handling'),
('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Marketplace', 'marketplace', 'Multi-channel marketplace seller implementation'),
('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Omnichannel', 'omnichannel', 'Full omnichannel with online + offline integration');

-- ============================================================
-- PHASE TEMPLATES (7 phases — same across all solutions)
-- ============================================================

-- B2C Phases
insert into phase_templates (id, solution_id, name, phase_number, sort_order, default_days) values
('c0000001-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Setting Up',             1, 1, 5),
('c0000001-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'Master Data',            2, 2, 7),
('c0000001-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'Warehouse Training',     3, 3, 5),
('c0000001-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 'Integration Testing',    4, 4, 7),
('c0000001-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000001', 'UAT',                    5, 5, 5),
('c0000001-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000001', 'Go-Live Prep',           6, 6, 3),
('c0000001-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000001', 'Hypercare',              7, 7, 28);

-- ============================================================
-- TASK TEMPLATES — Phase 1: Setting Up (B2C)
-- ============================================================

insert into task_templates (id, phase_id, name, default_owner, default_tat_days, is_required, sort_order) values
('d0000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001', 'Account Creation & Access',        'uc',       1, true, 1),
('d0000001-0000-0000-0000-000000000002', 'c0000001-0000-0000-0000-000000000001', 'Subscription & Module Setup',      'uc',       1, true, 2),
('d0000001-0000-0000-0000-000000000003', 'c0000001-0000-0000-0000-000000000001', 'User & Role Configuration',        'both',     2, true, 3),
('d0000001-0000-0000-0000-000000000004', 'c0000001-0000-0000-0000-000000000001', 'Facility & Warehouse Setup',       'customer', 2, true, 4);

-- Subtasks for "Account Creation & Access"
insert into subtask_templates (task_id, name, default_owner, default_tat_days, sort_order) values
('d0000001-0000-0000-0000-000000000001', 'Create Unicommerce account',             'uc',       0, 1),
('d0000001-0000-0000-0000-000000000001', 'Share login credentials with client',    'uc',       0, 2),
('d0000001-0000-0000-0000-000000000001', 'Client confirms access',                 'customer', 1, 3);

-- Subtasks for "Subscription & Module Setup"
insert into subtask_templates (task_id, name, default_owner, default_tat_days, sort_order) values
('d0000001-0000-0000-0000-000000000002', 'Configure subscription plan',            'uc',       1, 1),
('d0000001-0000-0000-0000-000000000002', 'Enable required modules (WMS, OMS)',     'uc',       1, 2),
('d0000001-0000-0000-0000-000000000002', 'Client confirms module access',          'customer', 1, 3);

-- Subtasks for "User & Role Configuration"
insert into subtask_templates (task_id, name, default_owner, default_tat_days, sort_order) values
('d0000001-0000-0000-0000-000000000003', 'Share user role document',               'uc',       1, 1),
('d0000001-0000-0000-0000-000000000003', 'Client provides user list',              'customer', 2, 2),
('d0000001-0000-0000-0000-000000000003', 'Create users and assign roles',          'uc',       1, 3),
('d0000001-0000-0000-0000-000000000003', 'Client confirms user logins',            'customer', 1, 4);

-- Subtasks for "Facility & Warehouse Setup"
insert into subtask_templates (task_id, name, default_owner, default_tat_days, sort_order) values
('d0000001-0000-0000-0000-000000000004', 'Client shares facility details',         'customer', 2, 1),
('d0000001-0000-0000-0000-000000000004', 'Create facility in platform',            'uc',       1, 2),
('d0000001-0000-0000-0000-000000000004', 'Configure bin locations & putaway',      'uc',       1, 3),
('d0000001-0000-0000-0000-000000000004', 'Client verifies facility configuration', 'customer', 1, 4);

-- ============================================================
-- TASK TEMPLATES — Phase 2: Master Data (B2C)
-- ============================================================

insert into task_templates (id, phase_id, name, default_owner, default_tat_days, is_required, sort_order) values
('d0000002-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000002', 'Product Catalogue Upload',         'customer', 3, true, 1),
('d0000002-0000-0000-0000-000000000002', 'c0000001-0000-0000-0000-000000000002', 'Inventory Upload',                 'customer', 2, true, 2),
('d0000002-0000-0000-0000-000000000003', 'c0000001-0000-0000-0000-000000000002', 'Vendor Master Setup',              'both',     2, false, 3),
('d0000002-0000-0000-0000-000000000004', 'c0000001-0000-0000-0000-000000000002', 'SKU Mapping & Barcode Setup',      'both',     3, true, 4);

insert into subtask_templates (task_id, name, default_owner, default_tat_days, sort_order) values
('d0000002-0000-0000-0000-000000000001', 'Share product upload template',          'uc',       0, 1),
('d0000002-0000-0000-0000-000000000001', 'Client fills and submits template',      'customer', 3, 2),
('d0000002-0000-0000-0000-000000000001', 'Validate and bulk upload products',      'uc',       1, 3),
('d0000002-0000-0000-0000-000000000001', 'Client verifies product listing',        'customer', 1, 4);

insert into subtask_templates (task_id, name, default_owner, default_tat_days, sort_order) values
('d0000002-0000-0000-0000-000000000002', 'Share inventory upload template',        'uc',       0, 1),
('d0000002-0000-0000-0000-000000000002', 'Client provides opening stock data',     'customer', 2, 2),
('d0000002-0000-0000-0000-000000000002', 'Upload and verify inventory',            'uc',       1, 3);

-- ============================================================
-- TASK TEMPLATES — Phase 3: Warehouse Training (B2C)
-- ============================================================

insert into task_templates (id, phase_id, name, default_owner, default_tat_days, is_required, sort_order) values
('d0000003-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000003', 'WMS Training — Inbound',           'uc',       1, true, 1),
('d0000003-0000-0000-0000-000000000002', 'c0000001-0000-0000-0000-000000000003', 'WMS Training — Outbound',          'uc',       1, true, 2),
('d0000003-0000-0000-0000-000000000003', 'c0000001-0000-0000-0000-000000000003', 'Returns Processing Training',      'uc',       1, true, 3),
('d0000003-0000-0000-0000-000000000004', 'c0000001-0000-0000-0000-000000000003', 'Training Sign-off',                'customer', 1, true, 4);

insert into subtask_templates (task_id, name, default_owner, default_tat_days, sort_order) values
('d0000003-0000-0000-0000-000000000001', 'Schedule inbound training session',      'uc',       0, 1),
('d0000003-0000-0000-0000-000000000001', 'Conduct inbound training',               'uc',       1, 2),
('d0000003-0000-0000-0000-000000000001', 'Client team completes inbound SOP',      'customer', 1, 3);

insert into subtask_templates (task_id, name, default_owner, default_tat_days, sort_order) values
('d0000003-0000-0000-0000-000000000002', 'Schedule outbound training session',     'uc',       0, 1),
('d0000003-0000-0000-0000-000000000002', 'Conduct outbound + picklist training',   'uc',       1, 2),
('d0000003-0000-0000-0000-000000000002', 'Client team completes outbound SOP',     'customer', 1, 3);

-- ============================================================
-- TASK TEMPLATES — Phase 4: Integration Testing (B2C)
-- ============================================================

insert into task_templates (id, phase_id, name, default_owner, default_tat_days, is_required, sort_order) values
('d0000004-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000004', 'Channel Integration Setup',        'both',     3, true, 1),
('d0000004-0000-0000-0000-000000000002', 'c0000001-0000-0000-0000-000000000004', 'Order Flow Testing',               'both',     3, true, 2),
('d0000004-0000-0000-0000-000000000003', 'c0000001-0000-0000-0000-000000000004', 'Inventory Sync Testing',           'both',     2, true, 3),
('d0000004-0000-0000-0000-000000000004', 'c0000001-0000-0000-0000-000000000004', 'Returns & Cancellation Testing',   'both',     2, true, 4),
('d0000004-0000-0000-0000-000000000005', 'c0000001-0000-0000-0000-000000000004', 'Courier Integration',              'both',     2, true, 5);

insert into subtask_templates (task_id, name, default_owner, default_tat_days, sort_order) values
('d0000004-0000-0000-0000-000000000001', 'Client provides API credentials',        'customer', 1, 1),
('d0000004-0000-0000-0000-000000000001', 'Configure channel integration',          'uc',       1, 2),
('d0000004-0000-0000-0000-000000000001', 'Test channel connectivity',              'uc',       1, 3),
('d0000004-0000-0000-0000-000000000001', 'Client confirms product/inventory sync', 'customer', 1, 4);

insert into subtask_templates (task_id, name, default_owner, default_tat_days, sort_order) values
('d0000004-0000-0000-0000-000000000002', 'Place test orders on channel',           'customer', 1, 1),
('d0000004-0000-0000-0000-000000000002', 'Verify order pull in platform',          'uc',       1, 2),
('d0000004-0000-0000-0000-000000000002', 'Process test order end-to-end',          'both',     1, 3),
('d0000004-0000-0000-0000-000000000002', 'Client confirms order flow',             'customer', 1, 4);

-- ============================================================
-- TASK TEMPLATES — Phase 5: UAT (B2C)
-- ============================================================

insert into task_templates (id, phase_id, name, default_owner, default_tat_days, is_required, sort_order) values
('d0000005-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000005', 'UAT Execution',                    'customer', 3, true, 1),
('d0000005-0000-0000-0000-000000000002', 'c0000001-0000-0000-0000-000000000005', 'Issue Resolution',                 'uc',       2, true, 2),
('d0000005-0000-0000-0000-000000000003', 'c0000001-0000-0000-0000-000000000005', 'UAT Sign-off',                     'customer', 1, true, 3);

-- ============================================================
-- TASK TEMPLATES — Phase 6: Go-Live Prep (B2C)
-- ============================================================

insert into task_templates (id, phase_id, name, default_owner, default_tat_days, is_required, sort_order) values
('d0000006-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000006', 'Final Data Reconciliation',        'both',     1, true, 1),
('d0000006-0000-0000-0000-000000000002', 'c0000001-0000-0000-0000-000000000006', 'Go-Live Checklist Review',         'both',     1, true, 2),
('d0000006-0000-0000-0000-000000000003', 'c0000001-0000-0000-0000-000000000006', 'Cutover Plan Confirmation',        'both',     1, true, 3),
('d0000006-0000-0000-0000-000000000004', 'c0000001-0000-0000-0000-000000000006', 'Go-Live Execution',                'both',     1, true, 4);

-- ============================================================
-- TASK TEMPLATES — Phase 7: Hypercare (B2C)
-- ============================================================

insert into task_templates (id, phase_id, name, default_owner, default_tat_days, is_required, sort_order) values
('d0000007-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000007', 'Daily Issue Monitoring',           'uc',       1, true, 1),
('d0000007-0000-0000-0000-000000000002', 'c0000001-0000-0000-0000-000000000007', 'Weekly Progress Calls',            'uc',       7, true, 2),
('d0000007-0000-0000-0000-000000000003', 'c0000001-0000-0000-0000-000000000007', 'Performance Benchmark Review',     'both',     14, false, 3),
('d0000007-0000-0000-0000-000000000004', 'c0000001-0000-0000-0000-000000000007', 'Hypercare Closure & Graduation',   'uc',       1, true, 4);
