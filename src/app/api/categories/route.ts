import { NextResponse } from 'next/server'
import { fallbackCategories } from '@/lib/fallback-data'

export async function GET() {
  try {
    // Try database first
    const { db } = await import('@/lib/db')
    const startups = await db.startup.findMany({
      where: { status: 'active' },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    }).catch(() => null)

    if (startups && startups.length > 0) {
      const result = await Promise.all(
        startups.map(async (s) => ({
          name: s.category,
          count: await db.startup.count({ where: { category: s.category, status: 'active' } }),
        }))
      )
      return NextResponse.json({ categories: result })
    }

    // Fallback
    return NextResponse.json({ categories: fallbackCategories })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}
