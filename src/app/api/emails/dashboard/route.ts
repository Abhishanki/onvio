import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'
import { differenceInDays, format } from 'date-fns'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { project_id } = await request.json()

  const { data: project } = await admin
    .from('projects')
    .select(`
      *, organisation:organisations(*),
      om:profiles!projects_om_id_fkey(id,full_name,email),
      phases:project_phases(*, tasks:project_tasks(*, subtasks:project_subtasks(*)))
    `)
    .eq('id', project_id).single()

  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const p = project as any
  const org = p.organisation
  const om = p.om
  const primary = org?.primary_color ?? '#6366f1'

  const allSubs = p.phases?.flatMap((ph: any) => ph.tasks?.flatMap((t: any) => t.subtasks ?? []) ?? []) ?? []
  const total = allSubs.length
  const completed = allSubs.filter((s: any) => s.status === 'completed').length
  const blocked = allSubs.filter((s: any) => s.status === 'blocked').length
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0
  const daysLeft = p.go_live_target ? differenceInDays(new Date(p.go_live_target), new Date()) : null

  const phaseRows = (p.phases ?? []).map((ph: any) => {
    const subs = ph.tasks?.flatMap((t: any) => t.subtasks ?? []) ?? []
    const done = subs.filter((s: any) => s.status === 'completed').length
    const phasePct = subs.length > 0 ? Math.round((done / subs.length) * 100) : 0
    return `
      <tr>
        <td style="padding:8px 12px;font-size:13px;color:#334155;">${ph.name}</td>
        <td style="padding:8px 12px;font-size:13px;color:#64748b;">${done}/${subs.length}</td>
        <td style="padding:8px 12px;">
          <div style="width:80px;height:6px;background:#f1f5f9;border-radius:3px;overflow:hidden;display:inline-block;">
            <div style="width:${phasePct}%;height:100%;background:${primary};border-radius:3px;"></div>
          </div>
          <span style="font-size:11px;color:#94a3b8;margin-left:6px;">${phasePct}%</span>
        </td>
      </tr>`
  }).join('')

  const html = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:24px 16px;">
  <div style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
    <div style="background:${primary};padding:28px 32px;">
      <p style="margin:0 0 4px;color:rgba(255,255,255,0.7);font-size:11px;text-transform:uppercase;letter-spacing:0.05em;">Project Dashboard</p>
      <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">${p.client_company}</h1>
      <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">${p.project_code} · ${p.solution_type}</p>
    </div>
    <div style="padding:28px 32px;">
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px;text-align:center;">
        <div style="background:#f8fafc;border-radius:8px;padding:16px;">
          <p style="margin:0;font-size:26px;font-weight:700;color:${primary};">${pct}%</p>
          <p style="margin:4px 0 0;font-size:11px;color:#94a3b8;">Complete</p>
        </div>
        <div style="background:#f8fafc;border-radius:8px;padding:16px;">
          <p style="margin:0;font-size:26px;font-weight:700;color:${blocked > 0 ? '#dc2626' : '#16a34a'};">${blocked}</p>
          <p style="margin:4px 0 0;font-size:11px;color:#94a3b8;">Blocked</p>
        </div>
        <div style="background:#f8fafc;border-radius:8px;padding:16px;">
          <p style="margin:0;font-size:26px;font-weight:700;color:${daysLeft !== null && daysLeft < 14 ? '#d97706' : '#334155'};">${daysLeft ?? '—'}</p>
          <p style="margin:4px 0 0;font-size:11px;color:#94a3b8;">Days to Go-Live</p>
        </div>
      </div>
      <h3 style="margin:0 0 12px;font-size:14px;font-weight:600;color:#1e293b;">Phase Progress</h3>
      <table style="width:100%;border-collapse:collapse;">
        <thead><tr style="background:#f8fafc;">
          <th style="text-align:left;padding:8px 12px;font-size:11px;color:#94a3b8;font-weight:500;">Phase</th>
          <th style="text-align:left;padding:8px 12px;font-size:11px;color:#94a3b8;font-weight:500;">Tasks</th>
          <th style="text-align:left;padding:8px 12px;font-size:11px;color:#94a3b8;font-weight:500;">Progress</th>
        </tr></thead>
        <tbody>${phaseRows}</tbody>
      </table>
      <div style="margin-top:24px;text-align:center;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/portal/${p.portal_token}"
          style="display:inline-block;background:${primary};color:#fff;text-decoration:none;padding:10px 24px;border-radius:8px;font-weight:600;font-size:14px;">
          View Full Portal →
        </a>
      </div>
    </div>
    <div style="padding:16px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
      <p style="margin:0;font-size:12px;color:#94a3b8;">Sent by ${om?.full_name} · ${org?.name} · Powered by Onvio</p>
    </div>
  </div>
</div>
</body>
</html>`

  const toEmails = [p.client_contact_l1_email, p.client_contact_l2_email].filter(Boolean)
  if (toEmails.length === 0) return NextResponse.json({ error: 'No recipient emails' }, { status: 400 })

  const { error } = await resend.emails.send({
    from: `${om?.full_name ?? org?.name} <onboarding@${process.env.RESEND_FROM_DOMAIN ?? 'onvio.app'}>`,
    to: toEmails,
    reply_to: om?.email,
    subject: `Dashboard Update: ${p.project_code} — ${format(new Date(), 'MMM d, yyyy')}`,
    html,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await admin.from('email_log').insert({
    project_id: p.id, org_id: p.org_id, type: 'dashboard',
    sent_by_id: user.id, sent_from: om?.email, sent_to: toEmails,
    subject: `Dashboard Update: ${p.project_code}`, status: 'sent',
  })

  return NextResponse.json({ success: true })
}
