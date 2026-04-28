import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ManagerWarRoom } from '@/components/dashboard/ManagerWarRoom'

export default async function ManagerPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const { data: projects } = await supabase
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
