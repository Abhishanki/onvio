import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'
import { formatDate, generatePortalUrl } from '@/lib/utils'
import { z } from 'zod'

const resend = new Resend(process.env.RESEND_API_KEY)

function buildWelcomeEmail(opts: {
  clientName: string
  clientCompany: string
  projectCode: string
  omName: string
  omEmail: string
  leadName: string
  goLiveDate: string
  portalUrl: string
  orgName: string
  primaryColor: string
  customNote?: string
  teamMembers: { name: string; role: string; photoUrl?: string }[]
}): string {
  const { clientName, clientCompany, projectCode, omName, omEmail, leadName,
    goLiveDate, portalUrl, orgName, primaryColor, customNote, teamMembers } = opts

  const teamCards = teamMembers.map(m => `
    <div style="display:inline-block;text-align:center;width:160px;margin:0 8px 16px;vertical-align:top;">
      ${m.photoUrl
        ? `<img src="${m.photoUrl}" style="width:60px;height:60px;border-radius:50%;object-fit:cover;display:block;margin:0 auto 8px;" />`
        : `<div style="width:60px;height:60px;border-radius:50%;background:#e0e7ff;display:flex;align-items:center;justify-content:center;margin:0 auto 8px;font-size:22px;font-weight:700;color:${primaryColor};">${m.name?.[0] ?? '?'}</div>`
      }
      <p style="margin:0 0 2px;font-size:13px;font-weight:600;color:#1e293b;">${m.name}</p>
      <p style="margin:0;font-size:11px;color:#94a3b8;">${m.role}</p>
    </div>`).join('')

  const noteBlock = customNote ? `
    <div style="background:#f0f4ff;border-left:3px solid ${primaryColor};border-radius:0 8px 8px 0;padding:12px 16px;margin-bottom:24px;">
      <p style="margin:0;color:#3730a3;font-size:13px;">${customNote}</p>
    </div>` : ''

  return `<!DOCTYPE html>
<html>
<head><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:24px 16px;">
    <div style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">

      <div style="background:${primaryColor};padding:32px 36px;">
        <p style="margin:0 0 4px;color:rgba(255,255,255,0.7);font-size:12px;letter-spacing:0.05em;text-transform:uppercase;">${orgName}</p>
        <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">Welcome to your implementation journey 🚀</h1>
        <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Hi ${clientName}, we're excited to get ${clientCompany} live on ${orgName}!</p>
      </div>

      <div style="padding:32px 36px;">
        ${noteBlock}

        <div style="margin-bottom:24px;">
          <div style="display:flex;align-items:center;padding:10px 0;border-bottom:1px solid #f1f5f9;">
            <span style="font-size:12px;color:#94a3b8;width:120px;flex-shrink:0;">Project Code</span>
            <span style="font-size:13px;color:#334155;font-weight:500;background:#f1f5f9;border-radius:6px;padding:4px 10px;">${projectCode}</span>
          </div>
          <div style="display:flex;align-items:center;padding:10px 0;border-bottom:1px solid #f1f5f9;">
            <span style="font-size:12px;color:#94a3b8;width:120px;flex-shrink:0;">Your OM</span>
            <span style="font-size:13px;color:#334155;font-weight:500;">${omName} · <a href="mailto:${omEmail}" style="color:${primaryColor};">${omEmail}</a></span>
          </div>
          <div style="display:flex;align-items:center;padding:10px 0;border-bottom:1px solid #f1f5f9;">
            <span style="font-size:12px;color:#94a3b8;width:120px;flex-shrink:0;">Lead</span>
            <span style="font-size:13px;color:#334155;font-weight:500;">${leadName}</span>
          </div>
          <div style="display:flex;align-items:center;padding:10px 0;">
            <span style="font-size:12px;color:#94a3b8;width:120px;flex-shrink:0;">Go-Live Target</span>
            <span style="font-size:13px;color:#16a34a;font-weight:600;">🎯 ${goLiveDate}</span>
          </div>
        </div>

        <h2 style="margin:0 0 8px;color:#1e293b;font-size:16px;font-weight:600;">Meet Your Team</h2>
        <p style="margin:0 0 16px;color:#475569;font-size:14px;">These are the people who will guide you through your implementation:</p>
        <div style="text-align:center;margin:16px 0;">${teamCards}</div>

        <div style="text-align:center;margin:24px 0;">
          <p style="margin:0 0 4px;color:#475569;font-size:14px;">Track your project progress anytime:</p>
          <a href="${portalUrl}" style="display:inline-block;background:${primaryColor};color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px;margin:8px 0 12px;">Open Your Project Portal →</a>
          <p style="margin:0;font-size:11px;color:#94a3b8;">This link is unique to your project and never expires.</p>
        </div>
      </div>

      <div style="padding:20px 36px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
        <p style="margin:0;font-size:12px;color:#94a3b8;">
          Sent by ${omName} · ${orgName} Implementation Team<br/>
          Powered by Onvio · <a href="${portalUrl}" style="color:${primaryColor};">View Portal</a>
        </p>
      </div>

    </div>
  </div>
</body>
</html>`
}

const Schema = z.object({
  project_id: z.string().uuid(),
  custom_note: z.string().optional(),
  recipient_emails: z.array(z.string().email()).optional(),
})

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: sender } = await supabase
    .from('profiles')
    .select('*, organisation:organisations(*)')
    .eq('id', user.id).single()

  const body = await request.json()
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { data: project } = await admin
    .from('projects')
    .select(`
      *, organisation:organisations(*),
      om:profiles!projects_om_id_fkey(id,full_name,email,photo_url),
      lead:profiles!projects_lead_id_fkey(id,full_name,email,photo_url),
      manager:profiles!projects_manager_id_fkey(id,full_name,email,photo_url)
    `)
    .eq('id', parsed.data.project_id).single()

  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const portalUrl = generatePortalUrl(project.portal_token)
  const org = project.organisation as any
  const om = project.om as any
  const lead = project.lead as any
  const manager = project.manager as any

  const teamMembers = [
    { name: om?.full_name, role: 'Onboarding Manager', photoUrl: om?.photo_url },
    { name: lead?.full_name, role: 'Implementation Lead', photoUrl: lead?.photo_url },
    { name: manager?.full_name, role: 'Director', photoUrl: manager?.photo_url },
  ].filter(t => t.name)

  const html = buildWelcomeEmail({
    clientName: project.client_name,
    clientCompany: project.client_company,
    projectCode: project.project_code,
    omName: om?.full_name ?? '',
    omEmail: om?.email ?? '',
    leadName: lead?.full_name ?? '',
    goLiveDate: project.go_live_target ? formatDate(project.go_live_target) : 'TBD',
    portalUrl,
    orgName: org?.name ?? 'Unicommerce',
    primaryColor: org?.primary_color ?? '#6366f1',
    customNote: parsed.data.custom_note,
    teamMembers,
  })

  const toEmails = parsed.data.recipient_emails ?? [
    project.client_contact_l1_email,
    project.client_contact_l2_email,
  ].filter(Boolean) as string[]

  if (toEmails.length === 0) {
    return NextResponse.json({ error: 'No recipient email addresses found' }, { status: 400 })
  }

  const fromEmail = `${om?.full_name ?? 'Onvio'} <onboarding@${process.env.RESEND_FROM_DOMAIN ?? 'onvio.app'}>`

  const { data: emailData, error: emailError } = await resend.emails.send({
    from: fromEmail,
    to: toEmails,
    reply_to: om?.email,
    subject: `Welcome to ${org?.name ?? 'Unicommerce'} — Your implementation starts now 🚀`,
    html,
  })

  if (emailError) return NextResponse.json({ error: emailError.message }, { status: 500 })

  // Log email
  await admin.from('email_log').insert({
    project_id: project.id,
    org_id: project.org_id,
    type: 'welcome',
    sent_by_id: user.id,
    sent_from: fromEmail,
    sent_to: toEmails,
    subject: `Welcome to ${org?.name} — Your implementation starts now`,
    resend_id: emailData?.id,
    status: 'sent',
  })

  // Log activity
  await admin.from('activity_log').insert({
    project_id: project.id,
    actor_id: user.id,
    actor_name: sender?.full_name ?? 'System',
    action: 'Welcome email sent',
    entity_type: 'project',
    entity_id: project.id,
    is_client_visible: true,
  })

  return NextResponse.json({ success: true, email_id: emailData?.id })
}
