import { NextResponse } from 'next/server'
import { fallbackStats } from '@/lib/fallback-data'

export async function GET() {
  try {
    // Try database first
    const { db } = await import('@/lib/db')
    const totalStartups = await db.startup.count({ where: { status: 'active' } }).catch(() => 0)

    if (totalStartups > 0) {
      const [totalVotes, totalCategories, featuredCount] = await Promise.all([
        db.vote.count(),
        db.startup.findMany({ where: { status: 'active' }, select: { category: true }, distinct: ['category'] }),
        db.startup.count({ where: { status: 'active', featured: true } }),
      ])

      const topCategories = await db.startup.groupBy({
        by: ['category'],
        where: { status: 'active' },
        _count: true,
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      })

      const stages = await db.startup.groupBy({
        by: ['stage'],
        where: { status: 'active' },
        _count: true,
        orderBy: { _count: { id: 'desc' } },
      })

      return NextResponse.json({
        totalStartups,
        totalVotes,
        totalCategories: totalCategories.length,
        featuredCount,
        topCategories: topCategories.map(c => ({ name: c.category, count: c._count })),
        stages: stages.map(s => ({ name: s.stage, count: s._count })),
      })
    }

    // Fallback
    return NextResponse.json(fallbackStats)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
