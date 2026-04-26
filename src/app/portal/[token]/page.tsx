import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { ClientPortal } from '@/components/portal/ClientPortal'

export default async function PortalPage({ params }: { params: { token: string } }) {
  const supabase = createAdminClient()

  const { data: project } = await supabase
    .from('projects')
    .select(`
      *,
      om:profiles!projects_om_id_fkey(id, full_name, email, photo_url, designation),
      lead:profiles!projects_lead_id_fkey(id, full_name, email, photo_url, designation),
      manager:profiles!projects_manager_id_fkey(id, full_name, email, photo_url, designation),
      organisation:organisations(name, logo_url, primary_color, website_url),
      phases:project_phases(
        *,
        tasks:project_tasks(
          *,
          subtasks:project_subtasks(*)
        )
      )
    `)
    .eq('portal_token', params.token)
    .eq('portal_enabled', true)
    .single()

  if (!project) notFound()

  return <ClientPortal project={project} token={params.token} />
}
