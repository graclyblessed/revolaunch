import { NextResponse } from 'next/server'
import { sendDigestEmails } from '@/app/api/digest/send/route'

// GET /api/cron/weekly-digest — Vercel cron endpoint
// Fires every Monday at 9:00 AM UTC via vercel.json cron config
export async function GET(req: Request) {
  try {
    // Validate via cron secret header (Vercel sends Authorization or custom header)
    const cronSecret = process.env.DIGEST_SECRET
    const providedSecret = req.headers.get('x-cron-secret') || req.headers.get('authorization')?.replace('Bearer ', '')

    if (!cronSecret) {
      return NextResponse.json(
        { error: 'DIGEST_SECRET not configured' },
        { status: 500 }
      )
    }

    if (providedSecret !== cronSecret) {
      return NextResponse.json(
        { error: 'Unauthorized — invalid or missing cron secret' },
        { status: 401 }
      )
    }

    const result = await sendDigestEmails()

    return NextResponse.json({
      status: 'ok',
      message: `Weekly digest sent to ${result.sent}/${result.total} subscribers`,
      sent: result.sent,
      total: result.total,
      date: result.date,
    })
  } catch (error) {
    console.error('[Cron /weekly-digest] Error:', error)
    const message = error instanceof Error ? error.message : 'Failed to send weekly digest'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
