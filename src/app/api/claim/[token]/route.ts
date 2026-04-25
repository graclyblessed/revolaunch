import { NextResponse } from 'next/server'
import { isDbAvailable } from '@/lib/db'
import { SITE_URL } from '@/lib/resend'

// GET: Validate claim token and return startup info
export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const { db } = await import('@/lib/db')
    if (!db || !isDbAvailable()) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
    }

    const claimEmail = await db.claimEmail.findUnique({
      where: { token },
      include: {
        startup: {
          select: {
            id: true,
            name: true,
            slug: true,
            tagline: true,
            logo: true,
            website: true,
            category: true,
            stage: true,
          },
        },
      },
    })

    if (!claimEmail) {
      return NextResponse.redirect(`${SITE_URL}/claim/expired`)
    }

    if (claimEmail.status === 'claimed') {
      return NextResponse.redirect(`${SITE_URL}/claim/already-claimed`)
    }

    return NextResponse.json({
      token: claimEmail.token,
      startup: claimEmail.startup,
      email: claimEmail.email,
    })
  } catch (error) {
    console.error('Failed to validate claim token:', error)
    return NextResponse.redirect(`${SITE_URL}/claim/expired`)
  }
}

// POST: Mark startup as claimed
export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const { db } = await import('@/lib/db')
    if (!db || !isDbAvailable()) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
    }

    const claimEmail = await db.claimEmail.findUnique({
      where: { token },
    })

    if (!claimEmail) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 404 })
    }

    if (claimEmail.status === 'claimed') {
      return NextResponse.json({ error: 'Already claimed' }, { status: 400 })
    }

    // Mark as claimed and verify the startup badge
    await db.claimEmail.update({
      where: { id: claimEmail.id },
      data: {
        status: 'claimed',
        claimedAt: new Date(),
      },
    })

    await db.startup.update({
      where: { id: claimEmail.startupId },
      data: {
        badgeVerified: true,
        badgeVerifiedAt: new Date(),
      },
    })

    return NextResponse.json({
      message: 'Profile claimed successfully!',
      slug: (await db.startup.findUnique({ where: { id: claimEmail.startupId }, select: { slug: true } }))?.slug,
    })
  } catch (error) {
    console.error('Failed to claim profile:', error)
    return NextResponse.json({ error: 'Failed to claim profile' }, { status: 500 })
  }
}
