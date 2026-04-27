import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createResendClient } from '@/lib/resend'
import { differenceInDays, format } from 'date-fns'

export const dynamic = 'force-dynamic'
export async function GET(request: Request) {
  const resend = createResendClient()
  if (!resend) return NextResponse.json({ error: 'RESEND_API_KEY is not configured' }, { status: 500 })
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const admin = createAdminClient()
  let sent = 0

  const { data: projects } = await admin
    .from('projects')
    .select(`
      *, organisation:organisations(*),
      om:profiles!projects_om_id_fkey(id,full_name,email),
      lead:profiles!projects_lead_id_fkey(id,full_name,email)
    `)
    .in('status', ['active', 'live', 'hypercare'])

  for (const project of projects ?? []) {
    const p = project as any
    if (!p.client_contact_l1_email) continue

    const { data: subtasks } = await admin
      .from('project_subtasks')
      .select('status, sla_breached')
      .eq('project_id', project.id)

    const total = subtasks?.length ?? 0
    const completed = subtasks?.filter(s => s.status === 'completed').length ?? 0
    const blocked = subtasks?.filter(s => s.status === 'blocked').length ?? 0
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0
    const daysLeft = project.go_live_target ? differenceInDays(new Date(project.go_live_target), new Date()) : null
    const org = p.organisation

    try {
      await resend.emails.send({
        from: `${p.om?.full_name ?? 'Onvio'} <weekly@${process.env.RESEND_FROM_DOMAIN ?? 'onvio.app'}>`,
        to: [p.client_contact_l1_email],
        reply_to: p.om?.email,
        subject: `Weekly Update: ${project.project_code} — ${format(new Date(), 'MMM d, yyyy')}`,
        html: `
          <div style="font-family:sans-serif;max-width:580px;margin:0 auto;padding:24px;color:#334155">
            <div style="background:${org?.primary_color ?? '#6366f1'};border-radius:10px;padding:24px;margin-bottom:20px">
              <p style="margin:0;color:rgba(255,255,255,0.8);font-size:12px;text-transform:uppercase;letter-spacing:0.05em">Weekly Status Report</p>
              <h2 style="margin:4px 0 0;color:#fff;font-size:20px">${project.client_company}</h2>
            </div>
            <div style="background:#f8fafc;border-radius:8px;padding:20px;margin-bottom:20px">
              <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;text-align:center">
                <div><p style="margin:0;font-size:28px;font-weight:700;color:#6366f1">${pct}%</p><p style="margin:4px 0 0;font-size:12px;color:#94a3b8">Complete</p></div>
                <div><p style="margin:0;font-size:28px;font-weight:700;color:${blocked > 0 ? '#dc2626' : '#16a34a'}">${blocked}</p><p style="margin:4px 0 0;font-size:12px;color:#94a3b8">Blocked</p></div>
                <div><p style="margin:0;font-size:28px;font-weight:700;color:${daysLeft && daysLeft < 14 ? '#d97706' : '#334155'}">${daysLeft ?? '—'}</p><p style="margin:4px 0 0;font-size:12px;color:#94a3b8">Days to Go-Live</p></div>
              </div>
            </div>
            <p>Hi ${project.client_name},</p>
            <p>Here's a quick summary of where your implementation stands this week. ${pct >= 70 ? 'Great progress!' : 'Keep an eye on the blocked items below.'}</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/portal/${project.portal_token}"
              style="display:inline-block;background:${org?.primary_color ?? '#6366f1'};color:#fff;text-decoration:none;padding:10px 20px;border-radius:6px;font-weight:600;margin:8px 0 20px">
              View Full Dashboard →
            </a>
            <p style="color:#94a3b8;font-size:12px">Sent by ${p.om?.full_name} · Reply to this email to reach your OM directly.</p>
          </div>
        `
      })
      sent++
    } catch (e) { console.error(`Weekly report failed for ${project.project_code}:`, e) }
  }

  return NextResponse.json({ ok: true, reports_sent: sent, ran_at: new Date().toISOString() })
}
