import { NextResponse } from 'next/server'

// GET /api/unsubscribe/[token] — Return subscriber info for confirmation
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    const { db } = await import('@/lib/db')
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 })
    }

    const subscriber = await db.subscriber.findUnique({
      where: { unsubscribeToken: token },
      select: { id: true, email: true, createdAt: true },
    })

    if (!subscriber) {
      return NextResponse.json({ error: 'Invalid or expired unsubscribe link' }, { status: 404 })
    }

    // Mask email for privacy: show first 2 chars + ***@domain
    const [localPart, domain] = subscriber.email.split('@')
    const maskedEmail = localPart.length > 2
      ? `${localPart.slice(0, 2)}***@${domain}`
      : `${localPart[0]}***@${domain}`

    return NextResponse.json({
      email: maskedEmail,
      subscribedAt: subscriber.createdAt,
    })
  } catch (error) {
    console.error('Failed to fetch unsubscribe info:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

// POST /api/unsubscribe/[token] — Delete subscriber from DB
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    const { db } = await import('@/lib/db')
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 })
    }

    const subscriber = await db.subscriber.findUnique({
      where: { unsubscribeToken: token },
      select: { id: true },
    })

    if (!subscriber) {
      return NextResponse.json({ error: 'Invalid or expired unsubscribe link' }, { status: 404 })
    }

    await db.subscriber.delete({
      where: { id: subscriber.id },
    })

    return NextResponse.json({ message: 'Successfully unsubscribed' })
  } catch (error) {
    console.error('Failed to unsubscribe:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
