import { NextResponse } from 'next/server'
import { db, isDbAvailable } from '@/lib/db'
import { getAdminSession } from '@/lib/admin-auth'

// GET /api/digest/preview — Returns preview data for the admin dashboard (no email sent)
export async function GET() {
  try {
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 })
    }

    const dbReady = await isDbAvailable()
    if (!dbReady) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 503 })
    }

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    // Fetch top 5 startups by upvotes from the past 7 days
    let topStartups = await db.startup.findMany({
      where: {
        status: 'active',
        createdAt: { gte: sevenDaysAgo },
      },
      orderBy: { upvotes: 'desc' },
      take: 5,
      select: { name: true, slug: true, tagline: true, logo: true, upvotes: true, category: true },
    })

    // If fewer than 5 from past 7 days, fill with all-time top
    if (topStartups.length < 5) {
      const existingSlugs = new Set(topStartups.map(s => s.slug))
      const fallback = await db.startup.findMany({
        where: {
          status: 'active',
          slug: { notIn: Array.from(existingSlugs) },
        },
        orderBy: { upvotes: 'desc' },
        take: 5 - topStartups.length,
        select: { name: true, slug: true, tagline: true, logo: true, upvotes: true, category: true },
      })
      topStartups = [...topStartups, ...fallback]
    }

    // Fetch newest 3 startups
    const newestStartups = await db.startup.findMany({
      where: { status: 'active' },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: { name: true, slug: true, tagline: true, logo: true, upvotes: true, category: true },
    })

    // Fetch platform stats
    const [totalStartups, totalVotes, totalSubscribers] = await Promise.all([
      db.startup.count({ where: { status: 'active' } }),
      db.vote.count(),
      db.subscriber.count(),
    ])

    // Calculate next Monday at 9 AM UTC
    const now = new Date()
    const nextMonday = new Date(now)
    const dayOfWeek = now.getUTCDay()
    const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek
    nextMonday.setUTCDate(now.getUTCDate() + daysUntilMonday)
    nextMonday.setUTCHours(9, 0, 0, 0)

    return NextResponse.json({
      topStartups,
      newestStartups,
      stats: { totalStartups, totalVotes, totalSubscribers },
      lastSend: null, // In-memory, not available in preview
      nextScheduled: nextMonday.toISOString(),
    })
  } catch (error) {
    console.error('Digest preview error:', error)
    return NextResponse.json({ error: 'Failed to fetch digest preview' }, { status: 500 })
  }
}
