import { NextResponse } from 'next/server'
import { isResendConfigured, resend, FROM_EMAIL, SITE_URL } from '@/lib/resend'
import { db, isDbAvailable } from '@/lib/db'

// In-memory tracker for last send (survives within server process)
let lastDigestSend: { sent: number; total: number; date: string } | null = null

function getDigestSecret(): string {
  return process.env.DIGEST_SECRET || 'revolaunch-digest-2026'
}

type DigestStartup = {
  name: string
  slug: string
  tagline: string
  logo: string | null
  website: string
  upvotes: number
  category: string
  votesCount: number
}

function buildDigestHtml(
  topStartups: DigestStartup[],
  newestStartups: DigestStartup[],
  stats: { totalStartups: number; totalVotes: number; totalSubscribers: number },
  unsubscribeUrl: string,
  siteUrl: string
): string {
  const now = new Date()
  const weekLabel = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  // Build top startups rows
  const topRows = topStartups.map((s, i) => {
    const rank = i + 1
    const rankColor = rank === 1 ? '#f97316' : rank === 2 ? '#fb923c' : rank === 3 ? '#fdba74' : '#737373'
    const startupUrl = `${siteUrl}/startup/${s.slug}`
    return `
      <tr>
        <td style="padding: 14px 0; border-bottom: 1px solid #1a1a1a;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="32" valign="top" style="padding-right: 12px;">
                <span style="display: inline-block; font-size: 16px; font-weight: 700; color: ${rankColor}; line-height: 40px; text-align: center; min-width: 32px;">${rank}</span>
              </td>
              <td width="40" valign="top" style="padding-right: 12px;">
                ${s.logo
                  ? `<img src="${s.logo}" alt="${s.name}" width="40" height="40" style="width: 40px; height: 40px; border-radius: 10px; object-fit: cover; display: block;" />`
                  : `<div style="width: 40px; height: 40px; border-radius: 10px; background: linear-gradient(135deg, #f97316, #ea580c); display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700; color: #fff; line-height: 40px; text-align: center;">${s.name.charAt(0).toUpperCase()}</div>`
                }
              </td>
              <td valign="top">
                <div style="margin-bottom: 4px;">
                  <a href="${startupUrl}" target="_blank" style="font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none;">${s.name}</a>
                  <span style="display: inline-block; margin-left: 8px; font-size: 12px; color: #a3a3a3; background: #1a1a1a; padding: 2px 8px; border-radius: 20px;">${s.category}</span>
                </div>
                <div style="font-size: 13px; color: #737373; margin-bottom: 6px;">${s.tagline}</div>
                <div style="display: inline-block; font-size: 12px; color: #f97316;">&#11088; ${s.upvotes.toLocaleString()} stars</div>
                <div style="display: inline-block; margin-left: 12px;">
                  <a href="${startupUrl}" target="_blank" style="font-size: 12px; color: #f97316; text-decoration: none;">View on Revolaunch &rarr;</a>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>`
  }).join('')

  // Build newest startups rows
  const newestRows = newestStartups.map((s) => {
    const startupUrl = `${siteUrl}/startup/${s.slug}`
    return `
      <tr>
        <td style="padding: 14px 0; border-bottom: 1px solid #1a1a1a;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="40" valign="top" style="padding-right: 12px;">
                ${s.logo
                  ? `<img src="${s.logo}" alt="${s.name}" width="40" height="40" style="width: 40px; height: 40px; border-radius: 10px; object-fit: cover; display: block;" />`
                  : `<div style="width: 40px; height: 40px; border-radius: 10px; background: linear-gradient(135deg, #f97316, #ea580c); display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700; color: #fff; line-height: 40px; text-align: center;">${s.name.charAt(0).toUpperCase()}</div>`
                }
              </td>
              <td valign="top">
                <div style="margin-bottom: 4px;">
                  <a href="${startupUrl}" target="_blank" style="font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none;">${s.name}</a>
                  <span style="display: inline-block; margin-left: 8px; font-size: 11px; color: #a3a3a3; background: #1a1a1a; padding: 2px 8px; border-radius: 20px;">${s.category}</span>
                </div>
                <div style="font-size: 13px; color: #737373; margin-bottom: 4px;">${s.tagline}</div>
                <a href="${startupUrl}" target="_blank" style="font-size: 12px; color: #f97316; text-decoration: none;">View on Revolaunch &rarr;</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>`
  }).join('')

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Revolaunch Weekly Digest</title></head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #ffffff; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0a0a0a;">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="560" style="max-width: 560px; width: 100%;">

          <!-- Header -->
          <tr>
            <td style="padding: 0 0 24px 0; border-bottom: 1px solid #1f1f1f;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <a href="${siteUrl}" target="_blank" style="text-decoration: none;">
                      <span style="font-size: 22px; font-weight: 700; color: #ffffff;">&#x1F680; Revolaunch</span>
                    </a>
                  </td>
                  <td align="right">
                    <span style="font-size: 12px; color: #737373;">${weekLabel}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td style="padding: 28px 0 8px 0;">
              <h1 style="font-size: 24px; font-weight: 700; color: #ffffff; margin: 0 0 6px 0;">Weekly Digest</h1>
              <p style="font-size: 14px; color: #737373; margin: 0;">The best new startups this week, curated for you.</p>
            </td>
          </tr>

          <!-- Stats Bar -->
          <tr>
            <td style="padding: 16px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #111111; border-radius: 10px; border: 1px solid #1f1f1f;">
                <tr>
                  <td align="center" style="padding: 14px 0; width: 33.33%;">
                    <div style="font-size: 20px; font-weight: 700; color: #f97316;">${stats.totalStartups.toLocaleString()}</div>
                    <div style="font-size: 11px; color: #737373; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px;">Startups</div>
                  </td>
                  <td align="center" style="padding: 14px 0; width: 33.33%; border-left: 1px solid #1f1f1f; border-right: 1px solid #1f1f1f;">
                    <div style="font-size: 20px; font-weight: 700; color: #f97316;">${stats.totalVotes.toLocaleString()}</div>
                    <div style="font-size: 11px; color: #737373; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px;">Stars</div>
                  </td>
                  <td align="center" style="padding: 14px 0; width: 33.33%;">
                    <div style="font-size: 20px; font-weight: 700; color: #f97316;">${stats.totalSubscribers.toLocaleString()}</div>
                    <div style="font-size: 11px; color: #737373; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px;">Subscribers</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${topStartups.length > 0 ? `
          <!-- Top Startups Section -->
          <tr>
            <td style="padding: 28px 0 12px 0;">
              <div style="font-size: 12px; color: #f97316; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">&#128293; Trending</div>
              <h2 style="font-size: 19px; font-weight: 600; color: #ffffff; margin: 0;">This Week's Top Startups</h2>
            </td>
          </tr>
          <tr>
            <td>
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #111111; border-radius: 12px; border: 1px solid #1f1f1f; padding: 8px 16px;">
                ${topRows}
              </table>
            </td>
          </tr>
          ` : ''}

          ${newestStartups.length > 0 ? `
          <!-- Newest Startups Section -->
          <tr>
            <td style="padding: 28px 0 12px 0;">
              <div style="font-size: 12px; color: #f97316; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">&#10024; New</div>
              <h2 style="font-size: 19px; font-weight: 600; color: #ffffff; margin: 0;">Latest Launches</h2>
            </td>
          </tr>
          <tr>
            <td>
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #111111; border-radius: 12px; border: 1px solid #1f1f1f; padding: 8px 16px;">
                ${newestRows}
              </table>
            </td>
          </tr>
          ` : ''}

          <!-- CTA Button -->
          <tr>
            <td style="padding: 28px 0 8px 0;" align="center">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius: 8px; background-color: #f97316;">
                    <a href="${siteUrl}" target="_blank" style="display: inline-block; padding: 12px 28px; font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px;">Explore All Startups &rarr;</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 28px 0 0 0; border-top: 1px solid #1f1f1f;">
              <p style="font-size: 13px; color: #737373; margin: 0 0 12px 0;">
                You're receiving this because you subscribed to <a href="${siteUrl}" style="color: #f97316; text-decoration: none;">Revolaunch</a> — where startups get seen.
              </p>
              <p style="font-size: 12px; color: #404040; margin: 0;">
                <a href="${unsubscribeUrl}" style="color: #525252; text-decoration: underline;">Unsubscribe from these emails</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body></html>`
}

async function sendDigestEmails(): Promise<{ sent: number; total: number; date: string }> {
  if (!isResendConfigured()) {
    throw new Error('Resend not configured. Set RESEND_API_KEY in environment variables.')
  }

  if (!db) {
    throw new Error('Database not available')
  }

  const dbReady = await isDbAvailable()
  if (!dbReady) {
    throw new Error('Database connection failed')
  }

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  // Fetch top 5 startups by upvotes from the past 7 days
  let topStartups = await db.startup.findMany({
    where: {
      status: 'active',
      createdAt: { gte: sevenDaysAgo },
    },
    orderBy: { upvotes: 'desc' },
    take: 5,
    include: { _count: { select: { votes: true } } },
  })

  // If fewer than 5 from past 7 days, fill with all-time top
  if (topStartups.length < 5) {
    const existingSlugs = new Set(topStartups.map(s => s.slug))
    const fallback = await db.startup.findMany({
      where: {
        status: 'active',
        slug: { notIn: Array.from(existingSlugs) },
      },
      orderBy: { upvotes: 'desc' },
      take: 5 - topStartups.length,
      include: { _count: { select: { votes: true } } },
    })
    topStartups = [...topStartups, ...fallback]
  }

  // Fetch newest 3 startups (most recent)
  const newestStartups = await db.startup.findMany({
    where: { status: 'active' },
    orderBy: { createdAt: 'desc' },
    take: 3,
    include: { _count: { select: { votes: true } } },
  })

  // Fetch platform stats
  const [totalStartups, totalVotes, totalSubscribers] = await Promise.all([
    db.startup.count({ where: { status: 'active' } }),
    db.vote.count(),
    db.subscriber.count(),
  ])

  const stats = { totalStartups, totalVotes, totalSubscribers }

  // Fetch all active subscribers
  const subscribers = await db.subscriber.findMany({
    select: { email: true, unsubscribeToken: true },
  })

  if (subscribers.length === 0) {
    throw new Error('No subscribers found')
  }

  const siteUrl = SITE_URL

  // Build batch payload (max 100 per request)
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
        subject: `&#x1F680; Weekly Digest — Top Startups on Revolaunch`,
        html: buildDigestHtml(topStartups, newestStartups, stats, unsubscribeUrl, siteUrl),
        headers: {
          'List-Unsubscribe': `<${unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      }
    })

    const { error } = await resend.batch.send({ payload })
    if (error) {
      console.error('Digest batch error:', error)
    } else {
      totalSent += batch.length
    }
  }

  const date = new Date().toISOString()

  return { sent: totalSent, total: subscribers.length, date }
}

// POST /api/digest/send — Send weekly digest
export async function POST(req: Request) {
  try {
    // Validate API key
    const authHeader = req.headers.get('authorization')
    const querySecret = new URL(req.url).searchParams.get('secret')

    const providedSecret = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : querySecret

    if (providedSecret !== getDigestSecret()) {
      return NextResponse.json({ error: 'Invalid or missing digest secret' }, { status: 401 })
    }

    const result = await sendDigestEmails()

    // Track last send
    lastDigestSend = result

    return NextResponse.json({
      message: `Weekly digest sent to ${result.sent} subscribers`,
      ...result,
    })
  } catch (error) {
    console.error('Failed to send digest:', error)
    const message = error instanceof Error ? error.message : 'Failed to send digest'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// GET /api/digest/send — Return status info
export async function GET(req: Request) {
  try {
    // Validate API key for GET as well
    const querySecret = new URL(req.url).searchParams.get('secret')
    const authHeader = req.headers.get('authorization')
    const providedSecret = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : querySecret

    if (providedSecret !== getDigestSecret()) {
      return NextResponse.json({ error: 'Invalid or missing digest secret' }, { status: 401 })
    }

    // Calculate next Monday at 9 AM UTC
    const now = new Date()
    const nextMonday = new Date(now)
    const dayOfWeek = now.getUTCDay()
    const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek
    nextMonday.setUTCDate(now.getUTCDate() + daysUntilMonday)
    nextMonday.setUTCHours(9, 0, 0, 0)

    return NextResponse.json({
      status: 'ok',
      cronSchedule: '0 9 * * 1',
      cronDescription: 'Every Monday at 9:00 AM UTC',
      lastSend: lastDigestSend
        ? {
            sent: lastDigestSend.sent,
            total: lastDigestSend.total,
            date: lastDigestSend.date,
          }
        : null,
      nextScheduled: nextMonday.toISOString(),
    })
  } catch (error) {
    console.error('Digest status error:', error)
    return NextResponse.json({ error: 'Failed to get digest status' }, { status: 500 })
  }
}

export { sendDigestEmails }
