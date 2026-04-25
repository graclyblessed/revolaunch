import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import { isDbAvailable } from '@/lib/db'
import { isResendConfigured, resend, FROM_EMAIL, SITE_URL } from '@/lib/resend'
import { randomBytes } from 'crypto'
import ClaimProfileEmail from '@/emails/ClaimProfileEmail'

export async function GET(req: Request) {
  try {
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { db } = await import('@/lib/db')
    if (!db || !isDbAvailable()) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''

    // Build where clause
    const where: Record<string, unknown> = {}

    if (status === 'unsent') {
      where.claimEmail = { is: null }
    } else if (status !== 'all') {
      where.claimEmail = { is: { not: null }, status }
    } else {
      // 'all' — include startups with or without claim emails
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { tagline: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Only active startups with emails
    where.status = 'active'
    where.AND = [
      { email: { not: null } },
      { email: { not: '' } },
    ]

    const skip = (page - 1) * limit

    let startups
    let total

    try {
      [startups, total] = await Promise.all([
        db.startup.findMany({
          where,
          include: {
            claimEmail: true,
            _count: { select: { votes: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        db.startup.count({ where }),
      ])
    } catch (dbError: unknown) {
      // ClaimEmail table might not exist yet (schema not pushed to production)
      const errMsg = (dbError as { message?: string }).message || ''
      if (errMsg.includes('ClaimEmail') || errMsg.includes('claim_email') || errMsg.includes('does not exist') || errMsg.includes('relation')) {
        console.warn('[Outreach] ClaimEmail table missing — falling back to startups without claim data')
        // Remove claimEmail filter from where clause for the fallback query
        const safeWhere = { ...where }
        delete safeWhere.claimEmail
        const results = await Promise.all([
          db.startup.findMany({
            where: safeWhere,
            include: {
              _count: { select: { votes: true } },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
          }),
          db.startup.count({ where: safeWhere }),
        ])
        startups = results[0].map((s: Record<string, unknown>) => ({ ...s, claimEmail: null }))
        total = results[1]
      } else {
        throw dbError
      }
    }

    return NextResponse.json({
      startups,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Failed to fetch outreach data:', error)
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isResendConfigured()) {
      return NextResponse.json(
        { error: 'Resend not configured. Set RESEND_API_KEY in environment variables.' },
        { status: 503 }
      )
    }

    const { db } = await import('@/lib/db')
    if (!db || !isDbAvailable()) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 })
    }

    const body = await req.json()
    const { startupIds } = body

    if (!startupIds || !Array.isArray(startupIds) || startupIds.length === 0) {
      return NextResponse.json({ error: 'startupIds array is required' }, { status: 400 })
    }

    if (startupIds.length > 100) {
      return NextResponse.json({ error: 'Maximum 100 emails per batch' }, { status: 400 })
    }

    // Fetch startups and check they have emails
    const startups = await db.startup.findMany({
      where: {
        id: { in: startupIds },
        email: { not: null },
        status: 'active',
      },
    })

    if (startups.length === 0) {
      return NextResponse.json({ error: 'No valid startups found' }, { status: 400 })
    }

    // Filter out already sent
    const alreadySent = await db.claimEmail.findMany({
      where: { startupId: { in: startups.map(s => s.id) } },
      select: { startupId: true },
    })
    const alreadySentIds = new Set(alreadySent.map(c => c.startupId))
    const toSend = startups.filter(s => !alreadySentIds.has(s.id) && s.email)

    if (toSend.length === 0) {
      return NextResponse.json({
        message: 'All selected startups have already been sent claim emails',
        sent: 0,
        skipped: startups.length,
      })
    }

    // Prepare batch emails
    const batchPayload = []
    const claimEmailRecords = []

    for (const startup of toSend) {
      const token = randomBytes(32).toString('hex')
      const claimUrl = `${SITE_URL}/claim/${token}`

      batchPayload.push({
        from: FROM_EMAIL,
        to: [startup.email!],
        subject: `Your startup ${startup.name} is on Revolaunch — claim your profile`,
        react: ClaimProfileEmail({
          startupName: startup.name,
          tagline: startup.tagline,
          claimUrl,
          siteUrl: SITE_URL,
        }),
        idempotencyKey: `claim-${startup.id}`,
        tags: [{ name: 'type', value: 'claim_profile' }, { name: 'startup', value: startup.id }],
      })

      claimEmailRecords.push({
        startupId: startup.id,
        token,
        email: startup.email!,
        status: 'sent',
      })
    }

    // Send batch via Resend
    const { data, error } = await resend.batch.send({
      payload: batchPayload,
    })

    if (error) {
      console.error('Resend batch error:', error)
      // Still create records with failed status
      await db.claimEmail.createMany({
        data: claimEmailRecords.map(r => ({ ...r, status: 'failed' })),
      })
      return NextResponse.json({ error: 'Failed to send emails', details: error }, { status: 500 })
    }

    // Create claim email records with Resend IDs
    for (let i = 0; i < data.length; i++) {
      claimEmailRecords[i].resendId = data[i]?.id
    }

    await db.claimEmail.createMany({
      data: claimEmailRecords.map(r => ({
        startupId: r.startupId,
        token: r.token,
        email: r.email,
        status: r.status,
        resendId: r.resendId,
        sentAt: new Date(),
      })),
    })

    return NextResponse.json({
      message: `Sent ${toSend.length} claim emails`,
      sent: toSend.length,
      skipped: startups.length - toSend.length,
    })
  } catch (error) {
    console.error('Failed to send claim emails:', error)
    return NextResponse.json({ error: 'Failed to send emails' }, { status: 500 })
  }
}

// Resend a single claim email (re-generates token)
export async function PATCH(req: Request) {
  try {
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isResendConfigured()) {
      return NextResponse.json({ error: 'Resend not configured' }, { status: 503 })
    }

    const { db } = await import('@/lib/db')
    if (!db || !isDbAvailable()) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 })
    }

    const { startupId } = await req.json()

    if (!startupId) {
      return NextResponse.json({ error: 'startupId is required' }, { status: 400 })
    }

    const startup = await db.startup.findUnique({
      where: { id: startupId },
    })

    if (!startup || !startup.email) {
      return NextResponse.json({ error: 'Startup not found or has no email' }, { status: 404 })
    }

    // Delete existing claim email if any, create new token
    const newToken = randomBytes(32).toString('hex')
    const claimUrl = `${SITE_URL}/claim/${newToken}`

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [startup.email],
      subject: `Your startup ${startup.name} is on Revolaunch — claim your profile`,
      react: ClaimProfileEmail({
        startupName: startup.name,
        tagline: startup.tagline,
        claimUrl,
        siteUrl: SITE_URL,
      }),
      tags: [{ name: 'type', value: 'claim_profile' }, { name: 'startup', value: startup.id }],
    })

    if (error) {
      return NextResponse.json({ error: 'Failed to send email', details: error }, { status: 500 })
    }

    // Upsert claim email record
    await db.claimEmail.upsert({
      where: { startupId },
      create: {
        startupId,
        token: newToken,
        email: startup.email,
        status: 'sent',
        resendId: data?.id,
        sentAt: new Date(),
      },
      update: {
        token: newToken,
        status: 'sent',
        resendId: data?.id,
        sentAt: new Date(),
        bouncedAt: null,
        bounceReason: null,
      },
    })

    return NextResponse.json({ message: 'Claim email resent', resendId: data?.id })
  } catch (error) {
    console.error('Failed to resend claim email:', error)
    return NextResponse.json({ error: 'Failed to resend email' }, { status: 500 })
  }
}
