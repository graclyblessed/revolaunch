import { NextResponse } from 'next/server'

function getDigestSecret(): string {
  return process.env.DIGEST_SECRET || 'revolaunch-digest-2026'
}

// GET /api/digest/trigger — Called by Vercel Cron or any scheduler
export async function GET(req: Request) {
  try {
    // Validate secret from query parameter
    const { searchParams } = new URL(req.url)
    const providedSecret = searchParams.get('secret')

    if (providedSecret !== getDigestSecret()) {
      return NextResponse.json({ error: 'Invalid or missing digest secret' }, { status: 401 })
    }

    // Dynamically import the send logic to reuse the same function
    const { sendDigestEmails } = await import('../send/route')

    console.log('[Digest] Cron triggered — sending weekly digest...')
    const result = await sendDigestEmails()

    console.log(`[Digest] Sent to ${result.sent}/${result.total} subscribers`)

    return NextResponse.json({
      triggeredBy: 'cron',
      ...result,
    })
  } catch (error) {
    console.error('[Digest] Cron trigger failed:', error)
    const message = error instanceof Error ? error.message : 'Cron trigger failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
