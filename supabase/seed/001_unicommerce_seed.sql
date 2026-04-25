-- ============================================================
-- ONVIO · Unicommerce Seed Data
-- Run AFTER 001_initial_schema.sql
-- ============================================================

-- 1. ORGANISATION
INSERT INTO organisations (
  id, name, slug, website_url, primary_color, accent_color,
  reminder_default_hours, escalation_l1_hours, escalation_l2_hours,
  escalation_l3_hours, escalation_l4_hours, hypercare_weeks
) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Unicommerce', 'unicommerce', 'https://unicommerce.com',
  '#6366f1', '#4f46e5', 48, 48, 96, 144, 192, 4
);

-- 2. SOLUTION TEMPLATES
INSERT INTO solution_templates (id, org_id, name, description, sort_order) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'B2C',         'Business to Consumer — direct brand implementation', 1),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'B2B',         'Business to Business — bulk order fulfilment', 2),
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Marketplace', 'Multi-channel marketplace seller onboarding', 3),
  ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Omni',        'Omnichannel — online + offline integration', 4);

-- 3. TEMPLATE PHASES — B2C (7 phases)
INSERT INTO template_phases (id, template_id, name, sort_order) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Setting Up',          1),
  ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'Master Data',         2),
  ('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'Warehouse Training',  3),
  ('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 'Integration Testing', 4),
  ('c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000001', 'UAT',                 5),
  ('c0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000001', 'Go-Live Prep',        6),
  ('c0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000001', 'Hypercare',           7);

-- 4. TEMPLATE TASKS

-- Phase 1: Setting Up
INSERT INTO template_tasks (id, phase_id, name, owner, tat_days, is_required, sort_order) VALUES
  ('d0000001-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Account Creation & Access',   'uc',       1, true, 1),
  ('d0000001-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'Subscription & Module Setup', 'uc',       1, true, 2),
  ('d0000001-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'User & Role Configuration',   'both',     2, true, 3),
  ('d0000001-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001', 'Facility & Warehouse Setup',  'customer', 2, true, 4);

-- Phase 2: Master Data
INSERT INTO template_tasks (id, phase_id, name, owner, tat_days, is_required, sort_order) VALUES
  ('d0000002-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'Product Catalogue Upload',    'customer', 3, true,  1),
  ('d0000002-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 'Inventory Upload',            'customer', 2, true,  2),
  ('d0000002-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000002', 'Vendor Master Setup',         'both',     2, false, 3),
  ('d0000002-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000002', 'SKU Mapping & Barcode Setup', 'both',     3, true,  4);

-- Phase 3: Warehouse Training
INSERT INTO template_tasks (id, phase_id, name, owner, tat_days, is_required, sort_order) VALUES
  ('d0000003-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 'WMS Training — Inbound',      'uc',       1, true, 1),
  ('d0000003-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000003', 'WMS Training — Outbound',     'uc',       1, true, 2),
  ('d0000003-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003', 'Returns Processing Training', 'uc',       1, true, 3),
  ('d0000003-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000003', 'Training Sign-off',           'customer', 1, true, 4);

-- Phase 4: Integration Testing
INSERT INTO template_tasks (id, phase_id, name, owner, tat_days, is_required, sort_order) VALUES
  ('d0000004-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000004', 'Channel Integration Setup',   'both', 3, true, 1),
  ('d0000004-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000004', 'Order Flow Testing',          'both', 3, true, 2),
  ('d0000004-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000004', 'Inventory Sync Testing',      'both', 2, true, 3),
  ('d0000004-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000004', 'Returns & Cancellation Test', 'both', 2, true, 4),
  ('d0000004-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000004', 'Courier Integration',         'both', 2, true, 5);

-- Phase 5: UAT
INSERT INTO template_tasks (id, phase_id, name, owner, tat_days, is_required, sort_order) VALUES
  ('d0000005-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000005', 'UAT Environment Setup',       'uc',       1, true, 1),
  ('d0000005-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000005', 'UAT Scenarios Execution',     'customer', 5, true, 2),
  ('d0000005-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000005', 'Issue Resolution',            'both',     3, true, 3),
  ('d0000005-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000005', 'UAT Sign-off',                'customer', 1, true, 4);

-- Phase 6: Go-Live Prep
INSERT INTO template_tasks (id, phase_id, name, owner, tat_days, is_required, sort_order) VALUES
  ('d0000006-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000006', 'Final Data Reconciliation',   'both', 1, true, 1),
  ('d0000006-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000006', 'Go-Live Checklist Review',    'both', 1, true, 2),
  ('d0000006-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000006', 'Cutover Plan Confirmation',   'both', 1, true, 3),
  ('d0000006-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000006', 'Go-Live Execution',           'both', 1, true, 4);

-- Phase 7: Hypercare
INSERT INTO template_tasks (id, phase_id, name, owner, tat_days, is_required, sort_order) VALUES
  ('d0000007-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000007', 'Daily Issue Monitoring',          'uc',   1,  true,  1),
  ('d0000007-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000007', 'Weekly Progress Calls',           'uc',   7,  true,  2),
  ('d0000007-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000007', 'Performance Benchmark Review',    'both', 14, false, 3),
  ('d0000007-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000007', 'Hypercare Closure & Graduation',  'uc',   1,  true,  4);

-- 5. TEMPLATE SUBTASKS

-- Phase 1 > Account Creation & Access
INSERT INTO template_subtasks (task_id, name, owner, tat_days, sort_order) VALUES
  ('d0000001-0000-0000-0000-000000000001', 'Create Unicommerce account',             'uc',       0, 1),
  ('d0000001-0000-0000-0000-000000000001', 'Share login credentials with client',    'uc',       0, 2),
  ('d0000001-0000-0000-0000-000000000001', 'Client confirms access',                 'customer', 1, 3);

-- Phase 1 > Subscription & Module Setup
INSERT INTO template_subtasks (task_id, name, owner, tat_days, sort_order) VALUES
  ('d0000001-0000-0000-0000-000000000002', 'Configure subscription plan',            'uc',       1, 1),
  ('d0000001-0000-0000-0000-000000000002', 'Enable required modules (WMS, OMS)',     'uc',       1, 2),
  ('d0000001-0000-0000-0000-000000000002', 'Client confirms module access',          'customer', 1, 3);

-- Phase 1 > User & Role Configuration
INSERT INTO template_subtasks (task_id, name, owner, tat_days, sort_order) VALUES
  ('d0000001-0000-0000-0000-000000000003', 'Share user role document',               'uc',       1, 1),
  ('d0000001-0000-0000-0000-000000000003', 'Client provides user list',              'customer', 2, 2),
  ('d0000001-0000-0000-0000-000000000003', 'Create users and assign roles',          'uc',       1, 3),
  ('d0000001-0000-0000-0000-000000000003', 'Client confirms user logins',            'customer', 1, 4);

-- Phase 1 > Facility & Warehouse Setup
INSERT INTO template_subtasks (task_id, name, owner, tat_days, sort_order) VALUES
  ('d0000001-0000-0000-0000-000000000004', 'Client shares facility details',         'customer', 2, 1),
  ('d0000001-0000-0000-0000-000000000004', 'Create facility in platform',            'uc',       1, 2),
  ('d0000001-0000-0000-0000-000000000004', 'Configure bin locations & putaway',      'uc',       1, 3),
  ('d0000001-0000-0000-0000-000000000004', 'Client verifies facility configuration', 'customer', 1, 4);

-- Phase 2 > Product Catalogue Upload
INSERT INTO template_subtasks (task_id, name, owner, tat_days, sort_order) VALUES
  ('d0000002-0000-0000-0000-000000000001', 'Share product upload template',          'uc',       0, 1),
  ('d0000002-0000-0000-0000-000000000001', 'Client fills and submits template',      'customer', 3, 2),
  ('d0000002-0000-0000-0000-000000000001', 'Validate and bulk upload products',      'uc',       1, 3),
  ('d0000002-0000-0000-0000-000000000001', 'Client verifies product listing',        'customer', 1, 4);

-- Phase 2 > Inventory Upload
INSERT INTO template_subtasks (task_id, name, owner, tat_days, sort_order) VALUES
  ('d0000002-0000-0000-0000-000000000002', 'Share inventory upload template',        'uc',       0, 1),
  ('d0000002-0000-0000-0000-000000000002', 'Client provides opening stock data',     'customer', 2, 2),
  ('d0000002-0000-0000-0000-000000000002', 'Upload and verify inventory',            'uc',       1, 3);

-- Phase 2 > SKU Mapping & Barcode Setup
INSERT INTO template_subtasks (task_id, name, owner, tat_days, sort_order) VALUES
  ('d0000002-0000-0000-0000-000000000004', 'Client provides SKU-barcode mapping',    'customer', 2, 1),
  ('d0000002-0000-0000-0000-000000000004', 'Configure barcode in platform',          'uc',       1, 2),
  ('d0000002-0000-0000-0000-000000000004', 'Test barcode scanning',                  'both',     1, 3);

-- Phase 3 > WMS Training — Inbound
INSERT INTO template_subtasks (task_id, name, owner, tat_days, sort_order) VALUES
  ('d0000003-0000-0000-0000-000000000001', 'Schedule inbound training session',      'uc',       0, 1),
  ('d0000003-0000-0000-0000-000000000001', 'Conduct inbound training',               'uc',       1, 2),
  ('d0000003-0000-0000-0000-000000000001', 'Client team completes inbound SOP',      'customer', 1, 3);

-- Phase 3 > WMS Training — Outbound
INSERT INTO template_subtasks (task_id, name, owner, tat_days, sort_order) VALUES
  ('d0000003-0000-0000-0000-000000000002', 'Schedule outbound training session',     'uc',       0, 1),
  ('d0000003-0000-0000-0000-000000000002', 'Conduct outbound + picklist training',   'uc',       1, 2),
  ('d0000003-0000-0000-0000-000000000002', 'Client team completes outbound SOP',     'customer', 1, 3);

-- Phase 3 > Training Sign-off
INSERT INTO template_subtasks (task_id, name, owner, tat_days, sort_order) VALUES
  ('d0000003-0000-0000-0000-000000000004', 'Client signs training completion form',  'customer', 1, 1),
  ('d0000003-0000-0000-0000-000000000004', 'OM uploads signed document',             'uc',       0, 2);

-- Phase 4 > Channel Integration Setup
INSERT INTO template_subtasks (task_id, name, owner, tat_days, sort_order) VALUES
  ('d0000004-0000-0000-0000-000000000001', 'Client provides API credentials',        'customer', 1, 1),
  ('d0000004-0000-0000-0000-000000000001', 'Configure channel integration',          'uc',       1, 2),
  ('d0000004-0000-0000-0000-000000000001', 'Test channel connectivity',              'uc',       1, 3),
  ('d0000004-0000-0000-0000-000000000001', 'Client confirms product/inventory sync', 'customer', 1, 4);

-- Phase 4 > Order Flow Testing
INSERT INTO template_subtasks (task_id, name, owner, tat_days, sort_order) VALUES
  ('d0000004-0000-0000-0000-000000000002', 'Place test orders on channel',           'customer', 1, 1),
  ('d0000004-0000-0000-0000-000000000002', 'Verify order pull in platform',          'uc',       1, 2),
  ('d0000004-0000-0000-0000-000000000002', 'Process test order end-to-end',          'both',     1, 3),
  ('d0000004-0000-0000-0000-000000000002', 'Client confirms order flow',             'customer', 1, 4);

-- Phase 4 > Courier Integration
INSERT INTO template_subtasks (task_id, name, owner, tat_days, sort_order) VALUES
  ('d0000004-0000-0000-0000-000000000005', 'Configure courier partner(s)',           'uc',       1, 1),
  ('d0000004-0000-0000-0000-000000000005', 'Test AWB generation',                   'uc',       1, 2),
  ('d0000004-0000-0000-0000-000000000005', 'Test label printing',                   'both',     1, 3),
  ('d0000004-0000-0000-0000-000000000005', 'Client confirms courier setup',          'customer', 1, 4);

-- Phase 5 > UAT Scenarios Execution
INSERT INTO template_subtasks (task_id, name, owner, tat_days, sort_order) VALUES
  ('d0000005-0000-0000-0000-000000000002', 'Share UAT test cases with client',       'uc',       0, 1),
  ('d0000005-0000-0000-0000-000000000002', 'Client executes all test scenarios',     'customer', 5, 2),
  ('d0000005-0000-0000-0000-000000000002', 'Client logs results in tracker',         'customer', 1, 3);

-- Phase 5 > UAT Sign-off
INSERT INTO template_subtasks (task_id, name, owner, tat_days, sort_order) VALUES
  ('d0000005-0000-0000-0000-000000000004', 'All critical UAT items passed',          'customer', 1, 1),
  ('d0000005-0000-0000-0000-000000000004', 'Client submits digital sign-off',        'customer', 0, 2),
  ('d0000005-0000-0000-0000-000000000004', 'OM confirms UAT closure',                'uc',       0, 3);

-- Phase 6 > Go-Live Checklist Review
INSERT INTO template_subtasks (task_id, name, owner, tat_days, sort_order) VALUES
  ('d0000006-0000-0000-0000-000000000002', 'OM completes internal checklist',        'uc',       1, 1),
  ('d0000006-0000-0000-0000-000000000002', 'Lead reviews and approves',              'uc',       0, 2),
  ('d0000006-0000-0000-0000-000000000002', 'Client confirms readiness',              'customer', 1, 3);

-- Phase 6 > Go-Live Execution
INSERT INTO template_subtasks (task_id, name, owner, tat_days, sort_order) VALUES
  ('d0000006-0000-0000-0000-000000000004', 'Switch to production environment',       'uc',       0, 1),
  ('d0000006-0000-0000-0000-000000000004', 'Disable staging configurations',         'uc',       0, 2),
  ('d0000006-0000-0000-0000-000000000004', 'Client places first live order',         'customer', 1, 3),
  ('d0000006-0000-0000-0000-000000000004', 'OM confirms go-live successful',         'uc',       0, 4);

-- Phase 7 > Daily Issue Monitoring
INSERT INTO template_subtasks (task_id, name, owner, tat_days, sort_order) VALUES
  ('d0000007-0000-0000-0000-000000000001', 'Check open issues daily',                'uc',       1, 1),
  ('d0000007-0000-0000-0000-000000000001', 'Send daily status update to client',     'uc',       1, 2);

-- Phase 7 > Hypercare Closure & Graduation
INSERT INTO template_subtasks (task_id, name, owner, tat_days, sort_order) VALUES
  ('d0000007-0000-0000-0000-000000000004', 'All P1/P2 issues resolved',              'uc',       1, 1),
  ('d0000007-0000-0000-0000-000000000004', 'Client confirms satisfaction',           'customer', 1, 2),
  ('d0000007-0000-0000-0000-000000000004', 'OM triggers graduation from portal',     'uc',       0, 3);
