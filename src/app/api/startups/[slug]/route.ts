import { db, isDbAvailable } from '@/lib/db'
import { NextResponse } from 'next/server'
import { fallbackStartups, fallbackPerks } from '@/lib/fallback-data'

// Helper: format a DB startup record to match the API response shape
function formatStartup(s: any) {
  return {
    ...s,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // ── Try database first ──
    const dbUp = await isDbAvailable()
    if (dbUp && db) {
      const startup = await db.startup.findUnique({
        where: { slug },
        include: {
          _count: { select: { votes: true, perks: true } },
          perks: true,
        },
      })

      if (startup) {
        return NextResponse.json({ startup: formatStartup(startup) })
      }
    }

    // ── Fallback: static data if DB is down ──
    console.warn(`[API /startups/${slug}] Database unavailable, using fallback data`)
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
    console.error(`[API /startups/${slug}] Error:`, error)
    return NextResponse.json({ error: 'Failed to fetch startup' }, { status: 500 })
  }
}
