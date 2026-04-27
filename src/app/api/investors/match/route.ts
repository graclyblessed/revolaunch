import { NextRequest, NextResponse } from 'next/server'
import { db, isDbAvailable } from '@/lib/db'

// GET /api/investors/match?startupStage=Seed&category=AI — Match investors based on startup criteria
export async function GET(req: NextRequest) {
  try {
    const dbReady = await isDbAvailable()
    if (!dbReady) {
      return NextResponse.json({ matches: [], total: 0 })
    }

    const { searchParams } = new URL(req.url)
    const startupStage = searchParams.get('startupStage')
    const category = searchParams.get('category')

    if (!startupStage && !category) {
      return NextResponse.json(
        { error: 'At least one of startupStage or category is required' },
        { status: 400 }
      )
    }

    const where: Record<string, unknown> = { status: 'active' }

    // Match investors whose stages include the startup's stage
    if (startupStage) {
      where.stages = { has: startupStage }
    }

    // Match investors whose focus areas include the category
    if (category) {
      where.focus = { has: category }
    }

    const matches = await db.investorProfile.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    // Score and rank matches: investors matching both criteria come first
    const scored = matches.map((investor) => {
      let score = 0
      if (startupStage && investor.stages.includes(startupStage)) score += 1
      if (category && investor.focus.includes(category)) score += 1
      return { ...investor, _matchScore: score }
    })

    scored.sort((a, b) => b._matchScore - a._matchScore)

    return NextResponse.json({ matches: scored, total: scored.length })
  } catch (error) {
    console.error('Investor match error:', error)
    return NextResponse.json({ matches: [], total: 0 })
  }
}
