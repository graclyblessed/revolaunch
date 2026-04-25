import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'

// POST /api/admin/digest/send — Admin-triggered digest send (uses admin session auth)
export async function POST() {
  try {
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Dynamically import the send logic from the digest send route
    const { sendDigestEmails } = await import('../../digest/send/route')

    const result = await sendDigestEmails()

    return NextResponse.json({
      message: `Weekly digest sent to ${result.sent} subscribers`,
      ...result,
    })
  } catch (error) {
    console.error('Admin digest send error:', error)
    const message = error instanceof Error ? error.message : 'Failed to send digest'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
