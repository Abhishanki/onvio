import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const { email, password } = await request.json()
  const supabase = createClient()

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }

  // Get user profile to determine redirect
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single()

  const routes: Record<string, string> = {
    manager: '/manager',
    lead: '/lead',
    om: '/om'
  }
  const redirectTo = routes[profile?.role ?? 'om'] ?? '/om'

  return NextResponse.json({ redirectTo })
}
