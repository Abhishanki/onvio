import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfilePage } from '@/components/settings/ProfilePage'

export default async function Profile() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('*, organisation:organisations(*)').eq('id', user.id).single()
  return <ProfilePage profile={profile} />
}
