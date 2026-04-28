import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { differenceInDays } from 'date-fns'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const admin = createAdminClient()
  const now = new Date()
  let updated = 0

  const { data: projects } = await admin
    .from('projects')
    .select('id, go_live_target, rag_override, created_at')
    .in('status', ['active', 'live', 'hypercare'])

  for (const project of projects ?? []) {
    if (project.rag_override) continue

    // Fetch stats
    const { data: subtasks } = await admin
      .from('project_subtasks')
      .select('status, sla_breached')
      .eq('project_id', project.id)

    if (!subtasks || subtasks.length === 0) continue

    const total = subtasks.length
    const completed = subtasks.filter(s => s.status === 'completed').length
    const blocked = subtasks.filter(s => s.status === 'blocked').length
    const breached = subtasks.filter(s => s.sla_breached).length
    const pct = (completed / total) * 100

    const daysToGoLive = project.go_live_target
      ? differenceInDays(new Date(project.go_live_target), now)
      : null
    const projectAgeDays = differenceInDays(now, new Date(project.created_at))
    const expectedPct = daysToGoLive !== null && projectAgeDays > 0
      ? Math.max(0, Math.min(100, (projectAgeDays / (projectAgeDays + Math.max(0, daysToGoLive))) * 100))
      : 50

    let rag: 'green' | 'amber' | 'red' = 'green'

    if (blocked > 2 || breached > 3 || (daysToGoLive !== null && daysToGoLive < 0) || pct < expectedPct - 30) {
      rag = 'red'
    } else if (blocked > 0 || breached > 0 || (daysToGoLive !== null && daysToGoLive < 7) || pct < expectedPct - 15) {
      rag = 'amber'
    }

    // Calculate health score
    const tasksScore = Math.round((completed / total) * 40)
    const blockedScore = Math.max(0, 20 - blocked * 5)
    const staleScore = Math.max(0, 20 - breached * 4)
    const healthScore = Math.min(100, tasksScore + blockedScore + staleScore + 20)

    await admin.from('projects').update({ rag, health_score: healthScore, rag_updated_at: now.toISOString() }).eq('id', project.id)
    updated++
  }

  return NextResponse.json({ ok: true, projects_updated: updated, ran_at: now.toISOString() })
}
