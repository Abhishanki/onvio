import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ManagerWarRoom } from '@/components/dashboard/ManagerWarRoom'

export default async function ManagerDashboard() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (profile?.role !== 'manager') redirect('/dashboard')

  const { data: projects } = await supabase
    .from('projects')
    .select(`
      *,
      manager:profiles!projects_manager_id_fkey(id, full_name, email, photo_url),
      lead:profiles!projects_lead_id_fkey(id, full_name, email, photo_url),
      om:profiles!projects_om_id_fkey(id, full_name, email, photo_url)
    `)
    .eq('org_id', profile.org_id)
    .order('created_at', { ascending: false })

  const { data: teamMembers } = await supabase
    .from('profiles')
    .select('*')
    .eq('org_id', profile.org_id)
    .eq('is_active', true)

  return <ManagerWarRoom projects={projects ?? []} teamMembers={teamMembers ?? []} />
}
