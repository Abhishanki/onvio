import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TeamManagement } from '@/components/settings/TeamManagement'

export default async function TeamPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('*, organisation:organisations(*)').eq('id', user.id).single()
  if (profile?.role !== 'manager') redirect('/dashboard')
  const { data: members } = await supabase
    .from('profiles')
    .select('*, lead:profiles!profiles_lead_id_fkey(id, full_name)')
    .eq('org_id', profile.org_id)
    .order('role').order('full_name')
  return <TeamManagement members={members ?? []} leads={members?.filter(m => m.role === 'lead') ?? []} />
}
