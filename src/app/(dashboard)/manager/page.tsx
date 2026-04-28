import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { ManagerWarRoom } from '@/components/dashboard/ManagerWarRoom'

export default async function ManagerPage() {
  const cookieStore = cookies()

  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll(c) { try { c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {} } } }
  )

  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) redirect('/login')

  const supabaseAdmin = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll(c) { try { c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {} } } }
  )

  const { data: profile } = await supabaseAdmin
    .from('profiles').select('*').eq('id', user.id).single()

  if (!profile) redirect('/login')

  const { data: projects } = await supabaseAdmin
    .from('projects').select('*').eq('org_id', profile.org_id)
    .order('created_at', { ascending: false })

  const { data: teamMembers } = await supabaseAdmin
    .from('profiles').select('*').eq('org_id', profile.org_id)

  return <ManagerWarRoom projects={projects ?? []} teamMembers={teamMembers ?? []} />
}
