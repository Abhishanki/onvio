import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { createResendClient } from '@/lib/resend'
import { formatDate } from '@/lib/utils'


export async function POST(request: NextRequest) {
  const resend = createResendClient()
  if (!resend) return NextResponse.json({ error: 'RESEND_API_KEY is not configured' }, { status: 500 })
  const supabase = createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { project_id } = await request.json()
  const { data: project } = await admin
    .from('projects')
    .select('*, organisation:organisations(*), om:profiles!projects_om_id_fkey(id,full_name,email)')
    .eq('id', project_id).single()
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const org = project.organisation as any
  const om = project.om as any
  const primary = org?.primary_color ?? '#6366f1'

  const toEmails = [project.client_contact_l1_email, project.client_contact_l2_email].filter(Boolean) as string[]
  if (toEmails.length === 0) return NextResponse.json({ error: 'No recipient' }, { status: 400 })

  await resend.emails.send({
    from: `${om?.full_name ?? org?.name} <onboarding@${process.env.RESEND_FROM_DOMAIN ?? 'onvio.app'}>`,
    to: toEmails,
    subject: `🎓 Congratulations! ${project.client_company} is officially live on ${org?.name}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <div style="background:${primary};border-radius:16px;padding:40px;text-align:center;margin-bottom:24px">
          <p style="margin:0 0 8px;font-size:48px">🎓</p>
          <h1 style="margin:0;color:#fff;font-size:24px;font-weight:800">Congratulations!</h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:16px">${project.client_company} has successfully graduated!</p>
        </div>
        <p>Dear ${project.client_name},</p>
        <p>We are thrilled to announce that your ${project.solution_type} implementation is now <strong>complete</strong>. 
        You've successfully completed the full onboarding journey and are now live on ${org?.name}.</p>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin:20px 0">
          <p style="margin:0 0 12px;font-weight:600;color:#166534">Implementation Summary</p>
          <div style="display:grid;gap:8px">
            <div style="display:flex;justify-content:space-between"><span style="color:#4b5563">Project Code</span><strong>${project.project_code}</strong></div>
            <div style="display:flex;justify-content:space-between"><span style="color:#4b5563">Solution</span><strong>${project.solution_type}</strong></div>
            <div style="display:flex;justify-content:space-between"><span style="color:#4b5563">Go-Live Date</span><strong>${formatDate(project.go_live_actual ?? project.go_live_target)}</strong></div>
          </div>
        </div>
        <p>Your dedicated support window has ended. For ongoing queries, please reach out to our customer success team.</p>
        <p>Thank you for trusting ${org?.name} with your operations. We look forward to a long and successful partnership!</p>
        <p style="margin-top:32px">Warm regards,<br/><strong>${om?.full_name}</strong><br/>${org?.name} Implementation Team</p>
        <p style="color:#94a3b8;font-size:12px;margin-top:24px;border-top:1px solid #e2e8f0;padding-top:16px">Sent via Onvio · ${org?.name}</p>
      </div>
    `
  })

  await admin.from('email_log').insert({
    project_id, org_id: project.org_id, type: 'graduation',
    sent_by_id: user.id, sent_from: om?.email, sent_to: toEmails,
    subject: `Congratulations! ${project.client_company} is live`, status: 'sent',
  })

  return NextResponse.json({ success: true })
}
