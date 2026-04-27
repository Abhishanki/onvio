import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createResendClient } from '@/lib/resend'

export const dynamic = 'force-dynamic'
export async function GET(request: Request) {
  const resend = createResendClient()
  if (!resend) return NextResponse.json({ error: 'RESEND_API_KEY is not configured' }, { status: 500 })
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const now = new Date()
  const results = { sla_breached: 0, escalated: 0, emails_sent: 0 }

  // 1. Find subtasks past due date not yet marked SLA breached
  const { data: overdue } = await admin
    .from('project_subtasks')
    .select(`
      *, project:projects(
        id, project_code, client_company, org_id,
        om:profiles!projects_om_id_fkey(id,full_name,email),
        lead:profiles!projects_lead_id_fkey(id,full_name,email),
        manager:profiles!projects_manager_id_fkey(id,full_name,email)
      )
    `)
    .in('status', ['not_started', 'in_progress'])
    .eq('sla_breached', false)
    .not('due_date', 'is', null)
    .lt('due_date', now.toISOString().split('T')[0])

  for (const sub of overdue ?? []) {
    await admin.from('project_subtasks').update({
      sla_breached: true,
      sla_breached_at: now.toISOString(),
      escalation_level: 'om'
    }).eq('id', sub.id)
    results.sla_breached++
  }

  // 2. Escalate subtasks that have been breached but ignored
  const { data: breached } = await admin
    .from('project_subtasks')
    .select(`
      *, project:projects(
        id, project_code, client_company, org_id,
        organisation:organisations(escalation_l1_hours,escalation_l2_hours,escalation_l3_hours,escalation_l4_hours),
        om:profiles!projects_om_id_fkey(id,full_name,email),
        lead:profiles!projects_lead_id_fkey(id,full_name,email),
        manager:profiles!projects_manager_id_fkey(id,full_name,email)
      )
    `)
    .eq('sla_breached', true)
    .in('status', ['not_started', 'in_progress'])
    .not('escalation_level', 'is', null)

  for (const sub of breached ?? []) {
    const p = sub.project as any
    const org = p?.organisation
    const lastEsc = sub.last_escalation_at ? new Date(sub.last_escalation_at) : new Date(sub.sla_breached_at)
    const hoursSince = (now.getTime() - lastEsc.getTime()) / (1000 * 60 * 60)

    const escalationMap: Record<string, { hours: number; next: string; to: any }> = {
      om: { hours: org?.escalation_l1_hours ?? 48, next: 'lead', to: p?.lead },
      lead: { hours: org?.escalation_l2_hours ?? 96, next: 'manager', to: p?.manager },
      manager: { hours: org?.escalation_l3_hours ?? 144, next: 'sales', to: p?.manager },
    }

    const esc = escalationMap[sub.escalation_level ?? 'om']
    if (!esc || hoursSince < esc.hours) continue

    // Escalate
    await admin.from('project_subtasks').update({
      escalation_level: esc.next,
      last_escalation_at: now.toISOString(),
    }).eq('id', sub.id)

    await admin.from('escalation_log').insert({
      project_id: p.id,
      subtask_id: sub.id,
      escalation_level: esc.next,
      escalated_to_id: esc.to?.id,
      escalated_to_email: esc.to?.email,
      reason: `Task "${sub.name}" in ${p.project_code} unresolved after ${esc.hours}h`,
      email_sent: false,
    })

    // Send escalation email
    if (esc.to?.email) {
      try {
        await resend.emails.send({
          from: `Onvio Alerts <alerts@${process.env.RESEND_FROM_DOMAIN ?? 'onvio.app'}>`,
          to: [esc.to.email],
          cc: [p.om?.email, p.lead?.email].filter(Boolean),
          subject: `⚠️ Escalation: "${sub.name}" — ${p.project_code}`,
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
              <div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;padding:16px;margin-bottom:20px">
                <strong style="color:#92400e">⚠️ Task Escalated to ${esc.next.charAt(0).toUpperCase()+esc.next.slice(1)} Level</strong>
              </div>
              <p>Hi ${esc.to.full_name},</p>
              <p>The following task in <strong>${p.project_code} (${p.client_company})</strong> has been unresolved for over ${esc.hours} hours and requires your attention:</p>
              <div style="background:#f8fafc;border-radius:8px;padding:16px;margin:16px 0">
                <p style="margin:0;font-weight:600;color:#1e293b">${sub.name}</p>
                <p style="margin:4px 0 0;color:#64748b;font-size:13px">Status: ${sub.status?.replace('_',' ')} · Due: ${sub.due_date ?? 'overdue'}</p>
              </div>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/projects/${p.id}/tracker"
                style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:10px 20px;border-radius:6px;font-weight:600">
                View Tracker →
              </a>
              <p style="color:#94a3b8;font-size:12px;margin-top:24px">Sent by Onvio · Auto-escalation engine</p>
            </div>
          `
        })
        results.emails_sent++
        await admin.from('escalation_log').update({ email_sent: true })
          .eq('project_id', p.id).eq('subtask_id', sub.id).order('created_at', { ascending: false }).limit(1)
      } catch (e) { console.error('Email send failed:', e) }
    }
    results.escalated++
  }

  // 3. Sales intervention flag check — re-notify if still flagged
  const { data: flagged } = await admin
    .from('projects')
    .select(`
      id, project_code, client_company, sales_flag_reason,
      om:profiles!projects_om_id_fkey(id,full_name,email),
      lead:profiles!projects_lead_id_fkey(id,full_name,email),
      manager:profiles!projects_manager_id_fkey(id,full_name,email),
      organisation:organisations(name)
    `)
    .eq('is_sales_flagged', true)
    .in('status', ['active', 'live'])

  for (const project of flagged ?? []) {
    const p = project as any
    if (p.lead?.email) {
      try {
        await resend.emails.send({
          from: `Onvio Alerts <alerts@${process.env.RESEND_FROM_DOMAIN ?? 'onvio.app'}>`,
          to: [p.lead.email],
          cc: [p.om?.email, p.manager?.email].filter(Boolean),
          subject: `🚩 Sales Intervention Still Required — ${p.project_code}`,
          html: `<div style="font-family:sans-serif;padding:24px">
            <p>Project <strong>${p.project_code} (${p.client_company})</strong> still has an open sales flag.</p>
            <p>Reason: ${p.sales_flag_reason ?? 'Not specified'}</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/projects/${p.id}/tracker"
              style="display:inline-block;background:#dc2626;color:#fff;text-decoration:none;padding:10px 20px;border-radius:6px;font-weight:600">
              View Project →
            </a>
          </div>`
        })
        results.emails_sent++
      } catch (e) { console.error('Sales flag email failed:', e) }
    }
  }

  return NextResponse.json({ ok: true, ...results, ran_at: now.toISOString() })
}
