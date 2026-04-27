import { NextRequest, NextResponse } from 'next/server'
import { db, isDbAvailable } from '@/lib/db'

// GET /api/investors — List active investors, filterable by focus/stage
export async function GET(req: NextRequest) {
  try {
    const dbReady = await isDbAvailable()
    if (!dbReady) {
      return NextResponse.json({ investors: [], total: 0 })
    }

    const { searchParams } = new URL(req.url)
    const focus = searchParams.get('focus')
    const stage = searchParams.get('stage')

    const where: Record<string, unknown> = { status: 'active' }

    if (focus) {
      where.focus = { has: focus }
    }
    if (stage) {
      where.stages = { has: stage }
    }

    const investors = await db.investorProfile.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ investors, total: investors.length })
  } catch (error) {
    console.error('Investors fetch error:', error)
    return NextResponse.json({ investors: [], total: 0 })
  }
}

// POST /api/investors — Create investor profile
export async function POST(req: NextRequest) {
  try {
    const dbReady = await isDbAvailable()
    if (!dbReady) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 })
    }

    const body = await req.json()
    const { name, email, company, website, focus, stages, checkSize, bio } = body

    if (!name || !email) {
      return NextResponse.json(
        { error: 'name and email are required' },
        { status: 400 }
      )
    }

    const investor = await db.investorProfile.create({
      data: {
        name,
        email,
        company: company || null,
        website: website || null,
        focus: focus && Array.isArray(focus) ? focus : [],
        stages: stages && Array.isArray(stages) ? stages : [],
        checkSize: checkSize || null,
        bio: bio || null,
        status: 'active',
      },
    })

    return NextResponse.json({ investor }, { status: 201 })
  } catch (error) {
    console.error('Investor create error:', error)
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2002') {
      return NextResponse.json({ error: 'An investor with this email already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to create investor profile' }, { status: 500 })
  }
}
