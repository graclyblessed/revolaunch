import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { fallbackStartups, fallbackPerks } from '@/lib/fallback-data'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // ALWAYS use verified fallback data first (real companies with real logos)
    const startup = fallbackStartups.find(s => s.slug === slug)
    if (startup) {
      const perks = fallbackPerks[slug] || []
      return NextResponse.json({
        startup: {
          ...startup,
          perks,
          _count: { votes: startup.upvotes, perks: perks.length },
        },
      })
    }

    return NextResponse.json({ error: 'Startup not found' }, { status: 404 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch startup' }, { status: 500 })
  }
}
