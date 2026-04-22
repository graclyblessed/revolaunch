import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const startups = await db.startup.findMany({
      where: { status: 'active' },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    })

    const categories = startups.map(s => ({
      name: s.category,
      count: db.startup.count({ where: { category: s.category, status: 'active' } }),
    }))

    const result = await Promise.all(
      startups.map(async (s) => ({
        name: s.category,
        count: await db.startup.count({ where: { category: s.category, status: 'active' } }),
      }))
    )

    return NextResponse.json({ categories: result })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}
