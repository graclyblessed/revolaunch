import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import { isResendConfigured, resend, FROM_EMAIL, SITE_URL } from '@/lib/resend'

// POST /api/admin/newsletter/send — Send newsletter to all subscribers
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
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 })
    }

    const body = await req.json()
    const { subject, content, featuredSlug } = body

    if (!subject || !content) {
      return NextResponse.json({ error: 'Subject and content are required' }, { status: 400 })
    }

    // Fetch all subscribers with their unsubscribe token
    const subscribers = await db.subscriber.findMany({
      select: { email: true, unsubscribeToken: true },
    })

    if (subscribers.length === 0) {
      return NextResponse.json({ error: 'No subscribers found' }, { status: 400 })
    }

    // Fetch featured startup if slug provided
    let featuredStartup = null
    if (featuredSlug) {
      featuredStartup = await db.startup.findUnique({
        where: { slug: featuredSlug },
        select: { name: true, tagline: true, logo: true, website: true, slug: true },
      })
    }

    const siteUrl = SITE_URL
    const startupSection = featuredStartup
      ? `\n\n<div style="margin: 24px 0; padding: 20px; border: 1px solid #333; border-radius: 12px; background: #111;">
        ${featuredStartup.logo ? `<img src="${featuredStartup.logo}" alt="${featuredStartup.name}" style="width: 48px; height: 48px; border-radius: 8px; margin-bottom: 12px;" />` : ''}
        <h3 style="font-size: 18px; font-weight: 600; color: #f97316; margin: 0 0 4px;">${featuredStartup.name}</h3>
        <p style="font-size: 14px; color: #a3a3a3; margin: 0 0 12px;">${featuredStartup.tagline}</p>
        <a href="${featuredStartup.website}" target="_blank" style="color: #f97316; font-size: 14px;">Visit &rarr;</a>
      </div>`
      : ''

    // Build HTML with per-subscriber unsubscribe placeholder
    const buildHtml = (unsubscribeUrl: string) => `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="background: #0a0a0a; color: #fff; font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 0; padding: 0;">
  <div style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">
    <div style="border-bottom: 1px solid #222; padding-bottom: 20px; margin-bottom: 24px;">
      <h1 style="font-size: 24px; font-weight: 700; color: #fff; margin: 0;">Revolaunch</h1>
      <p style="font-size: 14px; color: #737373; margin: 4px 0 0;">Where startups get seen</p>
    </div>
    <h2 style="font-size: 22px; font-weight: 600; margin: 0 0 16px;">${subject}</h2>
    <div style="font-size: 15px; color: #d4d4d4; line-height: 1.7; white-space: pre-wrap;">${content}</div>
    ${startupSection}
    <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #222;">
      <p style="font-size: 13px; color: #525252;">Browse more startups: <a href="${siteUrl}" style="color: #f97316;">${siteUrl.replace('https://', '')}</a></p>
      <p style="font-size: 12px; color: #404040; margin-top: 12px;">
        You received this email because you subscribed to Revolaunch. 
        <a href="${unsubscribeUrl}" style="color: #737373; text-decoration: underline;">Unsubscribe</a>
      </p>
    </div>
  </div>
</body></html>`

    // Build batch payload (max 100 per request)
    // Each email gets a personalized unsubscribe link and List-Unsubscribe header
    type SubscriberRecord = { email: string; unsubscribeToken: string }
    const batches: SubscriberRecord[][] = []
    for (let i = 0; i < subscribers.length; i += 100) {
      batches.push(subscribers.slice(i, i + 100))
    }

    let totalSent = 0
    for (const batch of batches) {
      const payload = batch.map(s => {
        const unsubscribeUrl = `${siteUrl}/unsubscribe/${s.unsubscribeToken}`
        return {
          from: FROM_EMAIL,
          to: [s.email],
          subject: `[Revolaunch] ${subject}`,
          html: buildHtml(unsubscribeUrl),
          headers: {
            'List-Unsubscribe': `<${unsubscribeUrl}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        }
      })

      const { error } = await resend.batch.send({ payload })
      if (error) {
        console.error('Newsletter batch error:', error)
      } else {
        totalSent += batch.length
      }
    }

    return NextResponse.json({
      message: `Newsletter sent to ${totalSent} subscribers`,
      sent: totalSent,
      total: subscribers.length,
    })
  } catch (error) {
    console.error('Failed to send newsletter:', error)
    return NextResponse.json({ error: 'Failed to send newsletter' }, { status: 500 })
  }
}
