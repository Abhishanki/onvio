import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BrandingSettings } from '@/components/settings/BrandingSettings'

export default async function BrandingPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('*, organisation:organisations(*)').eq('id', user.id).single()
  if (profile?.role !== 'manager') redirect('/dashboard')
  return <BrandingSettings org={profile.organisation} />
}
