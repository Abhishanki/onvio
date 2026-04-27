const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
] as const

export type RequiredEnvVar = (typeof requiredEnvVars)[number]

export function getEnv(name: RequiredEnvVar): string {
  const value = process.env[name]

  if (!value) {
    throw new Error(`[env] Missing required environment variable: ${name}`)
  }

  return value
}

export function getEnvHealth() {
  const checks = {
    NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    NEXT_PUBLIC_APP_URL: Boolean(process.env.NEXT_PUBLIC_APP_URL),
    RESEND_API_KEY: Boolean(process.env.RESEND_API_KEY),
    CRON_SECRET: Boolean(process.env.CRON_SECRET),
  }

  const missing = Object.entries(checks)
    .filter(([, ok]) => !ok)
    .map(([name]) => name)

  return {
    ok: missing.length === 0,
    checks,
    missing,
  }
}

export function hasPublicSupabaseEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}
