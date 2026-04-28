import { NextResponse } from 'next/server'
export async function GET() {
  return NextResponse.json({ message: 'Use /api/cron/reminders instead' })
}
