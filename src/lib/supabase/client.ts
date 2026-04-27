import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

function createMissingEnvClient(): SupabaseClient {
  const message = '[env] Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL and/or NEXT_PUBLIC_SUPABASE_ANON_KEY'

  const throwMissingEnv = () => {
    throw new Error(message)
  }

  return new Proxy({} as SupabaseClient, {
    get() {
      return new Proxy(throwMissingEnv, {
        apply() {
          throwMissingEnv()
        },
      })
    },
  })
}

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    if (typeof window !== 'undefined') {
      console.error('[env] Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
    }
    return createMissingEnvClient()
  }

  return createBrowserClient(url, anonKey)
}
