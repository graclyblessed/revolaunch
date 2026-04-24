import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { LAUNCH_TIERS, type LaunchTier } from '@/lib/launch-tiers'

// GET /api/launch/slots — check daily slot availability per tier
export async function GET() {
  try {
    // Get start and end of today (UTC — launches go live at 8:00 AM UTC)
    const now = new Date()
    const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999))

    // Try to count launches per tier from the database
    let tierCounts: Record<string, number> = {
      free: 0,
      premium: 0,
      'premium-plus': 0,
      'seo-growth': 0,
    }

    try {
      const launches = await db.startup.groupBy({
        by: ['launchTier'],
        where: {
          launchTier: { in: ['free', 'premium', 'premium-plus', 'seo-growth'] },
          createdAt: { gte: startOfDay, lte: endOfDay },
        },
        _count: { id: true },
      })

      for (const launch of launches) {
        const tier = launch.launchTier as string
        if (tierCounts[tier] !== undefined) {
          tierCounts[tier] = launch._count.id
        }
      }
    } catch {
      // DB not available — return defaults (all slots available)
    }

    // Build slots object
    const tiers: LaunchTier[] = ['free', 'premium', 'premium-plus', 'seo-growth']
    const slots: Record<LaunchTier, { used: number; total: number; remaining: number }> = {} as any

    for (const tier of tiers) {
      const config = LAUNCH_TIERS[tier]
      const used = tierCounts[tier] || 0
      const total = config.slotsPerDay
      slots[tier] = {
        used,
        total,
        remaining: Math.max(0, total - used),
      }
    }

    return NextResponse.json({
      slots,
      date: startOfDay.toISOString().split('T')[0],
      source: tierCounts.free === 0 ? 'fallback' : 'database',
    })
  } catch (error) {
    // Return fallback data
    const tiers: LaunchTier[] = ['free', 'premium', 'premium-plus', 'seo-growth']
    const slots: Record<LaunchTier, { used: number; total: number; remaining: number }> = {} as any
    for (const tier of tiers) {
      const config = LAUNCH_TIERS[tier]
      slots[tier] = { used: 0, total: config.slotsPerDay, remaining: config.slotsPerDay }
    }
    return NextResponse.json({ slots, source: 'fallback' })
  }
}
