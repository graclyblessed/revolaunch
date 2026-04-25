import { NextRequest, NextResponse } from 'next/server'
import { db, isDbAvailable } from '@/lib/db'

export async function GET() {
  try {
    const dbReady = await isDbAvailable()
    if (!dbReady) {
      return NextResponse.json({ banner: null })
    }

    const now = new Date()

    // Find a single active banner that is within its date range
    const banner = await db.banner.findFirst({
      where: {
        status: 'active',
        startsAt: { lte: now },
        expiresAt: { gte: now },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Track impression (fire-and-forget within same request)
    if (banner) {
      await db.banner.update({
        where: { id: banner.id },
        data: { impressions: { increment: 1 } },
      })
    }

    return NextResponse.json({
      banner: banner ? {
        id: banner.id,
        headline: banner.headline,
        description: banner.description,
        ctaText: banner.ctaText,
        ctaUrl: banner.ctaUrl,
        imageUrl: banner.imageUrl,
        logoUrl: banner.logoUrl,
        position: banner.position,
      } : null,
    })
  } catch (error) {
    console.error('Banner fetch error:', error)
    return NextResponse.json({ banner: null })
  }
}
