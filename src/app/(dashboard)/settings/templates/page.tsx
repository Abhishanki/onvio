import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TemplateEditor } from '@/components/settings/TemplateEditor'

export default async function TemplatesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('*, organisation:organisations(*)').eq('id', user.id).single()
  if (profile?.role !== 'manager') redirect('/dashboard')
  const { data: templates } = await supabase
    .from('solution_templates')
    .select('*, phases:template_phases(*, tasks:template_tasks(*, subtasks:template_subtasks(*)))')
    .eq('org_id', profile.org_id)
    .order('sort_order')
  return <TemplateEditor templates={templates ?? []} orgId={profile.org_id} />
}
