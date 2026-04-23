import { NextResponse } from 'next/server'
import { fallbackStartups } from '@/lib/fallback-data'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { sessionId } = await request.json()

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    // Try database first
    const { db } = await import('@/lib/db')
    const startup = await db.startup.findUnique({ where: { slug } }).catch(() => null)

    if (startup) {
      const existingVote = await db.vote.findUnique({
        where: { startupId_sessionId: { startupId: startup.id, sessionId } },
      }).catch(() => null)

      if (existingVote) {
        await db.vote.delete({ where: { id: existingVote.id } })
        await db.startup.update({ where: { id: startup.id }, data: { upvotes: { decrement: 1 } } })
        return NextResponse.json({ voted: false, upvotes: startup.upvotes - 1 })
      } else {
        await db.vote.create({ data: { startupId: startup.id, sessionId } })
        await db.startup.update({ where: { id: startup.id }, data: { upvotes: { increment: 1 } } })
        return NextResponse.json({ voted: true, upvotes: startup.upvotes + 1 })
      }
    }

    // Fallback: simulate vote with static data
    const fbStartup = fallbackStartups.find(s => s.slug === slug)
    if (!fbStartup) return NextResponse.json({ error: 'Startup not found' }, { status: 404 })

    // Always return "voted: true" for fallback (optimistic)
    return NextResponse.json({ voted: true, upvotes: fbStartup.upvotes + 1 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to vote' }, { status: 500 })
  }
}
