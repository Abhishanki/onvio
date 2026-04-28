import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { HypercarePage } from '@/components/tracker/HypercarePage'

export default async function HypercarePageRoute({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: project } = await supabase
    .from('projects').select('*, om:profiles!projects_om_id_fkey(id,full_name,email), organisation:organisations(*)')
    .eq('id', params.id).single()
  if (!project) notFound()

  const { data: issues } = await supabase
    .from('hypercare_issues')
    .select('*, assigned_to:profiles(id,full_name)')
    .eq('project_id', params.id)
    .order('created_at', { ascending: false })

  const { data: crs } = await supabase
    .from('change_requests')
    .select('*')
    .eq('project_id', params.id)
    .order('created_at', { ascending: false })

  const { data: profile } = await supabase.from('profiles').select('role,full_name').eq('id', user.id).single()

  return <HypercarePage project={project} issues={issues ?? []} changeRequests={crs ?? []} userRole={profile?.role ?? 'om'} userName={profile?.full_name ?? ''} />
}
