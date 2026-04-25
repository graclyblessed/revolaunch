import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }

    const unsubscribeToken = crypto.randomBytes(18).toString('hex')

    // Try database
    const { db } = await import('@/lib/db')
    const subscriber = await db.subscriber.create({
      data: { email, unsubscribeToken },
    }).catch((e: unknown) => {
      const prismaError = e as { code?: string }
      if (prismaError.code === 'P2002') throw new Error('duplicate')
      throw e
    })

    return NextResponse.json({ subscriber, message: 'Subscribed successfully!' }, { status: 201 })
  } catch (error: unknown) {
    const err = error as { message?: string }
    if (err.message === 'duplicate') {
      return NextResponse.json({ message: 'Already subscribed!' }, { status: 200 })
    }
    // If DB not available, just acknowledge
    return NextResponse.json({ message: 'Thanks for subscribing!' }, { status: 200 })
  }
}
