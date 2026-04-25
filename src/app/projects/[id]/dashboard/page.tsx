import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { ProjectDashboard } from '@/components/dashboard/ProjectDashboard'

export default async function ProjectDashboardPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: project } = await supabase
    .from('projects')
    .select(`
      *, organisation:organisations(*),
      om:profiles!projects_om_id_fkey(id,full_name,email,photo_url),
      lead:profiles!projects_lead_id_fkey(id,full_name,email,photo_url),
      manager:profiles!projects_manager_id_fkey(id,full_name,email,photo_url),
      phases:project_phases(*, tasks:project_tasks(*, subtasks:project_subtasks(*)))
    `)
    .eq('id', params.id).single()
  if (!project) notFound()

  const { data: channels } = await supabase.from('project_channels').select('*').eq('project_id', params.id).order('sort_order')
  const { data: activityLog } = await supabase.from('activity_log').select('*').eq('project_id', params.id).order('created_at', { ascending: false }).limit(50)
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()

  return <ProjectDashboard project={project} channels={channels ?? []} activityLog={activityLog ?? []} userRole={profile?.role ?? 'om'} />
}
