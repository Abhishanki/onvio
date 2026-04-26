import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const InviteSchema = z.object({
  email: z.string().email(),
  full_name: z.string().min(1),
  role: z.enum(['manager', 'lead', 'om']),
  lead_id: z.string().uuid().optional(),
  designation: z.string().optional(),
})

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: inviter } = await supabase.from('profiles').select('*, organisation:organisations(*)').eq('id', user.id).single()
  if (inviter?.role !== 'manager') return NextResponse.json({ error: 'Only managers can invite team members' }, { status: 403 })

  const body = await request.json()
  const parsed = InviteSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { email, full_name, role, lead_id, designation } = parsed.data

  // Invite via Supabase Auth (sends email)
  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?type=invite`,
    data: { full_name, role }
  })
  if (inviteError) return NextResponse.json({ error: inviteError.message }, { status: 500 })

  // Create profile row
  await admin.from('profiles').insert({
    id: invited.user.id,
    org_id: inviter.org_id,
    full_name,
    email,
    role,
    lead_id: lead_id ?? null,
    designation: designation ?? null,
  })

  return NextResponse.json({ success: true, user_id: invited.user.id })
}
