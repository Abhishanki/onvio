import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ManagerWarRoom } from '@/components/dashboard/ManagerWarRoom'

export default async function ManagerDashboard() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')
  if (profile.role !== 'manager') redirect('/dashboard')

  // Safe query without specific FK names
  const { data: projects, error: projError } = await supabase
    .from('projects')
    .select('*')
    .eq('org_id', profile.org_id)
    .order('created_at', { ascending: false })

  const { data: teamMembers } = await supabase
    .from('profiles')
    .select('*')
    .eq('org_id', profile.org_id)

  return <ManagerWarRoom projects={projects ?? []} teamMembers={teamMembers ?? []} />
}
