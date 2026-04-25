import { db } from '@/lib/db'
import { validateApiKey, handlePreflight, apiResponse } from '@/lib/api-auth'

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

export async function OPTIONS() {
  return handlePreflight(new Request('')) || new Response(null, { status: 204 })
}

export async function GET(request: Request) {
  const preflight = handlePreflight(request)
  if (preflight) return preflight

  try {
    const auth = await validateApiKey(request)
    if (!auth.valid) {
      return apiResponse({ error: auth.error }, 401)
    }

    if (!db) {
      return apiResponse({ error: 'Database unavailable' }, 503)
    }

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

    return apiResponse({ categories: result })
  } catch (error) {
    console.error('[API v1 /categories] Error:', error)
    return apiResponse({ error: 'Failed to fetch categories' }, 500)
  }
}
