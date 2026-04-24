import { db, isDbAvailable } from '@/lib/db'
import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { fallbackStats } from '@/lib/fallback-data'

export async function GET() {
  try {
    // ── Try database first ──
    const dbUp = await isDbAvailable()
    if (dbUp && db) {
      const [totalCount, totalVotes, featuredCount, startups] = await Promise.all([
        db.startup.count({ where: { status: 'active' } }),
        db.vote.count(),
        db.startup.count({ where: { featured: true, status: 'active' } }),
        db.startup.findMany({ where: { status: 'active' } }),
      ])

      // Derive categories from DB data
      const categoryMap: Record<string, number> = {}
      const stageMap: Record<string, number> = {}
      const countryMap: Record<string, number> = {}

      for (const s of startups) {
        categoryMap[s.category] = (categoryMap[s.category] || 0) + 1
        stageMap[s.stage] = (stageMap[s.stage] || 0) + 1
        if (s.country) countryMap[s.country] = (countryMap[s.country] || 0) + 1
      }

      const topCategories = Object.entries(categoryMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      const stages = Object.entries(stageMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)

      const countries = Object.entries(countryMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)

      return NextResponse.json({
        totalStartups: totalCount,
        totalVotes,
        totalCategories: Object.keys(categoryMap).length,
        featuredCount,
        topCategories,
        stages,
        countries,
      })
    }

    // ── Fallback if DB is down ──
    console.warn('[API /stats] Database unavailable, using fallback data')
    return NextResponse.json(fallbackStats)
  } catch (error) {
    console.error('[API /stats] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
