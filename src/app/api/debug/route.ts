import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = cookies()
  const allCookies = cookieStore.getAll()
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    user: user ? { id: user.id, email: user.email } : null,
    error: error?.message ?? null,
    cookieCount: allCookies.length,
    cookieNames: allCookies.map(c => c.name),
    env: {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ set' : '❌ missing',
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ set' : '❌ missing',
      appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'not set',
    }
  })
}
