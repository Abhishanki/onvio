import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import * as XLSX from 'xlsx'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: project } = await admin
    .from('projects')
    .select(`
      *, om:profiles!projects_om_id_fkey(full_name,email),
      lead:profiles!projects_lead_id_fkey(full_name),
      phases:project_phases(*, tasks:project_tasks(*, subtasks:project_subtasks(*)))
    `)
    .eq('id', params.id).single()
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const wb = XLSX.utils.book_new()
  const p = project as any

  // Sheet 1: Project Overview
  const overviewData = [
    ['Project Code', p.project_code],
    ['Client', p.client_company],
    ['Contact', p.client_name],
    ['Solution Type', p.solution_type],
    ['Status', p.status],
    ['RAG Status', p.rag.toUpperCase()],
    ['Health Score', p.health_score],
    ['Onboarding Manager', p.om?.full_name],
    ['Team Lead', p.lead?.full_name],
    ['Go-Live Target', p.go_live_target ?? ''],
    ['Go-Live Actual', p.go_live_actual ?? ''],
    ['L1 Contact', `${p.client_contact_l1_name ?? ''} <${p.client_contact_l1_email ?? ''}>`],
    ['L2 Contact', `${p.client_contact_l2_name ?? ''} <${p.client_contact_l2_email ?? ''}>`],
  ]
  const wsOverview = XLSX.utils.aoa_to_sheet(overviewData)
  XLSX.utils.book_append_sheet(wb, wsOverview, 'Project Info')

  // Sheet 2: Full Task Tracker
  const trackerRows: any[][] = [
    ['Phase', 'Task', 'Subtask', 'Owner', 'Status', 'TAT (days)', 'Start Date', 'Due Date', 'Completed Date', 'Jira ID', 'Kapture ID', 'SLA Breached']
  ]
  for (const phase of p.phases ?? []) {
    for (const task of phase.tasks ?? []) {
      for (const sub of task.subtasks ?? []) {
        trackerRows.push([
          phase.name, task.name, sub.name, sub.owner, sub.status,
          sub.tat_days, sub.start_date ?? '', sub.due_date ?? '',
          sub.completed_date ?? '', sub.jira_ticket_id ?? '',
          sub.kapture_ticket_id ?? '', sub.sla_breached ? 'Yes' : 'No'
        ])
      }
    }
  }
  const wsTracker = XLSX.utils.aoa_to_sheet(trackerRows)
  wsTracker['!cols'] = trackerRows[0].map(() => ({ wch: 20 }))
  XLSX.utils.book_append_sheet(wb, wsTracker, 'Tracker')

  // Sheet 3: Phase Summary
  const summaryRows = [['Phase', 'Total Tasks', 'Completed', 'Blocked', '% Complete']]
  for (const phase of p.phases ?? []) {
    const subs = phase.tasks?.flatMap((t: any) => t.subtasks ?? []) ?? []
    const done = subs.filter((s: any) => s.status === 'completed').length
    const blocked = subs.filter((s: any) => s.status === 'blocked').length
    const pct = subs.length > 0 ? `${Math.round((done / subs.length) * 100)}%` : '0%'
    summaryRows.push([phase.name, subs.length, done, blocked, pct])
  }
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows)
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Phase Summary')

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${p.project_code}.xlsx"`,
    }
  })
}
