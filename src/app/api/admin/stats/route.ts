import { NextResponse } from 'next/server'
import { db, isDbAvailable } from '@/lib/db'
import { getAdminSession } from '@/lib/admin-auth'

export async function GET() {
  try {
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbReady = await isDbAvailable()

    if (!dbReady) {
      return NextResponse.json({
        totalStartups: 0,
        totalVotes: 0,
        totalSubscribers: 0,
        activeSponsors: 0,
        featuredStartups: 0,
        pendingLaunches: 0,
        tierBreakdown: {},
        categoryBreakdown: {},
        recentStartups: [],
      })
    }

    const [
      totalStartups,
      totalVotes,
      totalSubscribers,
      activeSponsors,
      featuredStartups,
      allStartups,
      categories,
    ] = await Promise.all([
      db.startup.count(),
      db.vote.count(),
      db.subscriber.count(),
      db.sponsorSlot.count({ where: { status: 'active' } }),
      db.startup.count({ where: { featured: true } }),
      db.startup.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { _count: { select: { votes: true } } },
      }),
      db.startup.groupBy({
        by: ['category'],
        _count: { category: true },
        orderBy: { _count: { category: 'desc' } },
        take: 10,
      }),
    ])

    const tierGroups = await db.startup.groupBy({
      by: ['launchTier'],
      _count: { launchTier: true },
    })

    const tierBreakdown: Record<string, number> = {}
    tierGroups.forEach(g => {
      tierBreakdown[g.launchTier] = g._count.launchTier
    })

    const pendingLaunches = allStartups.filter(
      s => s.launchDate && new Date(s.launchDate) > new Date()
    ).length

    return NextResponse.json({
      totalStartups,
      totalVotes,
      totalSubscribers,
      activeSponsors,
      featuredStartups,
      pendingLaunches,
      tierBreakdown,
      categoryBreakdown: categories.reduce<Record<string, number>>((acc, c) => {
        acc[c.category] = c._count.category
        return acc
      }, {}),
      recentStartups: allStartups.map(s => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        category: s.category,
        launchTier: s.launchTier,
        featured: s.featured,
        upvotes: s.upvotes,
        status: s.status,
        createdAt: s.createdAt,
        votesCount: s._count.votes,
      })),
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
