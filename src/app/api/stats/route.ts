import { NextResponse } from 'next/server'
import { fallbackStats } from '@/lib/fallback-data'

export async function GET() {
  try {
    // Always use verified fallback stats (based on 36 real Product Hunt companies)
    return NextResponse.json(fallbackStats)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
