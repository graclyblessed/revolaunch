import { db, isDbAvailable } from '@/lib/db'
import { NextResponse } from 'next/server'
import { fallbackCategories } from '@/lib/fallback-data'

const CATEGORY_ICONS: Record<string, string> = {
  'AI': '🤖',
  'Developer Tools': '🛠️',
  'Design': '🎨',
  'SaaS': '☁️',
  'Productivity': '⚡',
  'Business': '🏢',
  'Marketing': '📣',
  'Finance': '💰',
}

export async function GET() {
  try {
    // ── Try database first ──
    const dbUp = await isDbAvailable()
    if (dbUp && db) {
      const categories = await db.startup.groupBy({
        by: ['category'],
        where: { status: 'active' },
        _count: { category: true },
        orderBy: { _count: { category: 'desc' } },
      })

      const result = categories.map(c => ({
        name: c.category,
        count: c._count.category,
        icon: CATEGORY_ICONS[c.category] || '📌',
      }))

      return NextResponse.json({ categories: result })
    }

    // ── Fallback if DB is down ──
    console.warn('[API /categories] Database unavailable, using fallback data')
    return NextResponse.json({ categories: fallbackCategories })
  } catch (error) {
    console.error('[API /categories] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}
