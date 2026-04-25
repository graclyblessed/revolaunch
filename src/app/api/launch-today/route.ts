import { db, isDbAvailable } from '@/lib/db'
import { NextResponse } from 'next/server'

// Helper: format a DB startup record to match the Startup interface
function formatStartup(s: any) {
  return {
    ...s,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
    launchDate: s.launchDate?.toISOString() ?? null,
  }
}

export async function GET() {
  try {
    const today = new Date()
    // Start of today in UTC
    const startOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 0, 0, 0, 0))
    // End of today in UTC
    const endOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 23, 59, 59, 999))

    // 7 days ago in UTC
    const sevenDaysAgo = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - 7, 0, 0, 0, 0))

    const dbUp = await isDbAvailable()

    if (dbUp && db) {
      // Fetch startups launching today
      const launches = await db.startup.findMany({
        where: {
          launchDate: {
            gte: startOfDay,
            lte: endOfDay,
          },
          status: 'active',
        },
        orderBy: { upvotes: 'desc' },
        include: {
          _count: { select: { votes: true, perks: true } },
        },
      })

      // Fetch recently launched featured startups (last 7 days)
      const recentLaunches = await db.startup.findMany({
        where: {
          featured: true,
          status: 'active',
          createdAt: {
            gte: sevenDaysAgo,
          },
        },
        orderBy: { upvotes: 'desc' },
        include: {
          _count: { select: { votes: true, perks: true } },
        },
      })

      const dateStr = today.toISOString().split('T')[0]

      return NextResponse.json({
        launches: launches.map(formatStartup),
        recentLaunches: recentLaunches.map(formatStartup),
        date: dateStr,
      })
    }

    // Fallback: empty arrays when DB unavailable
    console.warn('[API /launch-today] Database unavailable, returning empty data')
    const dateStr = today.toISOString().split('T')[0]
    return NextResponse.json({
      launches: [],
      recentLaunches: [],
      date: dateStr,
    })
  } catch (error) {
    console.error('[API /launch-today] Error:', error)
    return NextResponse.json(
      { launches: [], recentLaunches: [], date: new Date().toISOString().split('T')[0] },
      { status: 500 }
    )
  }
}
