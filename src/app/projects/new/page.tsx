import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NewProjectForm } from '@/components/tracker/NewProjectForm'

export default async function NewProjectPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*, organisation:organisations(*)').eq('id', user.id).single()
  if (!['manager', 'lead'].includes(profile?.role)) redirect('/dashboard')

  const { data: templates } = await supabase.from('solution_templates').select('*').eq('org_id', profile.org_id).eq('is_active', true)
  const { data: leads } = await supabase.from('profiles').select('id, full_name, email').eq('org_id', profile.org_id).eq('role', 'lead').eq('is_active', true)
  const { data: oms } = await supabase.from('profiles').select('id, full_name, email').eq('org_id', profile.org_id).eq('role', 'om').eq('is_active', true)

  return <NewProjectForm templates={templates ?? []} leads={leads ?? []} oms={oms ?? []} currentProfile={profile} />
}
