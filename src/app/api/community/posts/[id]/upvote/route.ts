import { NextResponse } from 'next/server'
import { db, isDbAvailable } from '@/lib/db'
import { headers } from 'next/headers'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const dbUp = await isDbAvailable()
    if (!dbUp || !db) {
      return NextResponse.json(
        { error: 'Database is currently unavailable.' },
        { status: 503 }
      )
    }

    // Get session ID from header or fall back to IP
    const headersList = await headers()
    const sessionId = headersList.get('x-session-id') ||
      headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      'anonymous'

    // Find the post
    const post = await db.communityPost.findUnique({ where: { id } })
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Simple upvote: if the stored sessionId matches, un-upvote; otherwise upvote
    if (post.sessionId === sessionId) {
      // Undo upvote
      const updated = await db.communityPost.update({
        where: { id },
        data: { upvotes: { decrement: 1 }, sessionId: null },
      })
      return NextResponse.json({ voted: false, upvotes: Math.max(0, updated.upvotes) })
    } else {
      // Upvote (only increment if not already the same user)
      const updated = await db.communityPost.update({
        where: { id },
        data: { upvotes: { increment: 1 }, sessionId },
      })
      return NextResponse.json({ voted: true, upvotes: updated.upvotes })
    }
  } catch (error) {
    console.error('[API POST /community/posts/upvote] Error:', error)
    return NextResponse.json({ error: 'Failed to upvote' }, { status: 500 })
  }
}
