import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OMDashboard } from '@/components/dashboard/OMDashboard'

export default async function OMPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const { data: projects } = await supabase
    .from('projects')
    .select(`*, lead:profiles!projects_lead_id_fkey(id, full_name), manager:profiles!projects_manager_id_fkey(id, full_name)`)
    .eq('om_id', user.id)
    .order('created_at', { ascending: false })

  return <OMDashboard profile={profile} projects={projects ?? []} />
}
