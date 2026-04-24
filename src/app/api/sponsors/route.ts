import { NextResponse } from 'next/server'
import { db, isDbAvailable } from '@/lib/db'

export async function GET() {
  try {
    const dbReady = await isDbAvailable()
    if (!dbReady) {
      return NextResponse.json({ sponsors: [] })
    }

    const sponsors = await db.sponsorSlot.findMany({
      where: { status: 'active' },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ sponsors })
  } catch (error) {
    console.error('Sponsors fetch error:', error)
    return NextResponse.json({ sponsors: [] })
  }
}
