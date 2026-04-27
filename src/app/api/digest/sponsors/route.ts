import { NextRequest, NextResponse } from 'next/server'
import { db, isDbAvailable } from '@/lib/db'

// GET /api/digest/sponsors — Return active digest sponsors (status=active, expiresAt > now)
export async function GET() {
  try {
    const dbReady = await isDbAvailable()
    if (!dbReady) {
      return NextResponse.json({ sponsors: [] })
    }

    const sponsors = await db.digestSponsor.findMany({
      where: {
        status: 'active',
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ sponsors })
  } catch (error) {
    console.error('Digest sponsors fetch error:', error)
    return NextResponse.json({ sponsors: [] })
  }
}

// POST /api/digest/sponsors — Admin-only route to create a sponsor
export async function POST(req: NextRequest) {
  try {
    // Validate admin secret
    const authHeader = req.headers.get('authorization')
    const providedSecret = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null

    const digestSecret = process.env.DIGEST_SECRET || 'revolaunch-digest-2026'

    if (providedSecret !== digestSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbReady = await isDbAvailable()
    if (!dbReady) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 })
    }

    const body = await req.json()
    const { companyName, logo, website, tagline, expiresAt } = body

    if (!companyName || !website || !expiresAt) {
      return NextResponse.json(
        { error: 'companyName, website, and expiresAt are required' },
        { status: 400 }
      )
    }

    const sponsor = await db.digestSponsor.create({
      data: {
        companyName,
        logo: logo || null,
        website,
        tagline: tagline || null,
        status: 'active',
        startsAt: new Date(),
        expiresAt: new Date(expiresAt),
      },
    })

    return NextResponse.json({ sponsor }, { status: 201 })
  } catch (error) {
    console.error('Digest sponsor create error:', error)
    return NextResponse.json({ error: 'Failed to create sponsor' }, { status: 500 })
  }
}
