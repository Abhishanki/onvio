import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { ProjectTracker } from '@/components/tracker/ProjectTracker'

export default async function TrackerPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: project } = await supabase
    .from('projects')
    .select(`
      *,
      om:profiles!projects_om_id_fkey(id, full_name, email, photo_url),
      lead:profiles!projects_lead_id_fkey(id, full_name, email, photo_url),
      manager:profiles!projects_manager_id_fkey(id, full_name, email, photo_url),
      organisation:organisations(name, logo_url, primary_color),
      phases:project_phases(
        *,
        tasks:project_tasks(
          *,
          subtasks:project_subtasks(*)
        )
      )
    `)
    .eq('id', params.id)
    .single()

  if (!project) notFound()

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()

  return <ProjectTracker project={project} userRole={profile?.role ?? 'om'} />
}
