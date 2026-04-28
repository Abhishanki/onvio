import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies()

  // Auth check with anon client
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {}
        },
      },
    }
  )

  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) redirect('/login')

  // Profile read with service role to bypass RLS
  const supabaseAdmin = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {}
        },
      },
    }
  )

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('*, organisation:organisations(*)')
    .eq('id', user.id)
    .single()

  if (!profile) {
    await supabaseAdmin.from('profiles').upsert({
      id: user.id,
      email: user.email,
      full_name: user.email?.split('@')[0] ?? 'User',
      role: 'manager',
      org_id: 'a0000000-0000-0000-0000-000000000001'
    })
    const { data: newProfile } = await supabaseAdmin
      .from('profiles')
      .select('*, organisation:organisations(*)')
      .eq('id', user.id)
      .single()
    if (!newProfile) redirect('/login')
    return <AppShell profile={newProfile}>{children}</AppShell>
  }

  return <AppShell profile={profile}>{children}</AppShell>
}
