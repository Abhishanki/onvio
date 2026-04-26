import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = cookies()
  const allCookies = cookieStore.getAll()
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  return NextResponse.json({
    user: user?.email ?? null,
    error: error?.message ?? null,
    cookies: allCookies.map(c => ({ name: c.name, length: c.value.length })),
    env: {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    }
  })
}
