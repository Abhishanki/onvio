import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const Schema = z.object({
  email: z.string().email(),
  project_id: z.string().uuid(),
})

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  // Get portal token for this project
  const { data: project } = await admin.from('projects').select('portal_token, client_company').eq('id', parsed.data.project_id).single()
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL}/portal/${project.portal_token}`

  // Generate magic link
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: parsed.data.email,
    options: { redirectTo: portalUrl }
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ magic_link: data.properties?.action_link, portal_url: portalUrl })
}
