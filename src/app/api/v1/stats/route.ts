import { db } from '@/lib/db'
import { validateApiKey, handlePreflight, apiResponse } from '@/lib/api-auth'

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

    const [totalStartups, totalVotes, totalCategories, featuredCount, totalSubscribers, totalApiKeys] =
      await Promise.all([
        db.startup.count({ where: { status: 'active' } }),
        db.vote.count(),
        db.startup.groupBy({ by: ['category'] }).then(r => r.length),
        db.startup.count({ where: { featured: true, status: 'active' } }),
        db.subscriber.count(),
        db.apiKey.count(),
      ])

    return apiResponse({
      totalStartups,
      totalVotes,
      totalCategories,
      featuredCount,
      totalSubscribers,
      totalApiKeys,
    })
  } catch (error) {
    console.error('[API v1 /stats] Error:', error)
    return apiResponse({ error: 'Failed to fetch stats' }, 500)
  }
}
