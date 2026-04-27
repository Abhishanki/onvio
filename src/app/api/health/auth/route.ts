import { NextResponse } from 'next/server'
import { getEnvHealth } from '@/lib/env'

export async function GET() {
  const health = getEnvHealth()
  const status = health.ok ? 200 : 503

  return NextResponse.json(
    {
      service: 'onvio-auth',
      checkedAt: new Date().toISOString(),
      ...health,
    },
    { status }
  )
}
