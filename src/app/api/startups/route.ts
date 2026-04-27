import { db, isDbAvailable } from '@/lib/db'
import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { fallbackStartups } from '@/lib/fallback-data'

// Helper: format a DB startup record to match the API response shape
function formatStartup(s: any) {
  return {
    ...s,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const category = searchParams.get('category') || ''
    const stage = searchParams.get('stage') || ''
    const sort = searchParams.get('sort') || 'newest'
    const search = searchParams.get('search') || ''
    const featuredOnly = searchParams.get('featured') === 'true'
    const skip = (page - 1) * limit

    // ── Try database first ──
    const dbUp = await isDbAvailable()
    if (dbUp && db) {
      const where: Prisma.StartupWhereInput = {}

      if (featuredOnly) where.featured = true
      if (category) where.category = category
      if (stage) where.stage = stage
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { tagline: { contains: search, mode: 'insensitive' } },
          { category: { contains: search, mode: 'insensitive' } },
          { country: { contains: search, mode: 'insensitive' } },
        ]
      }

      const orderBy: Prisma.StartupOrderByWithRelationInput =
        sort === 'popular'
          ? { upvotes: 'desc' }
          : sort === 'oldest'
          ? { createdAt: 'asc' }
          : { createdAt: 'desc' }

      const [startups, total] = await Promise.all([
        db.startup.findMany({
          where,
          orderBy,
          skip,
          take: limit,
          include: {
            _count: { select: { votes: true, perks: true } },
          },
        }),
        db.startup.count({ where }),
      ])

      return NextResponse.json({
        startups: startups.map(formatStartup),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      })
    }

    // ── Fallback: serve from static data if DB is down ──
    console.warn('[API /startups] Database unavailable, using fallback data')
    let filtered = [...fallbackStartups]
    if (featuredOnly) filtered = filtered.filter(s => s.featured)
    if (category) filtered = filtered.filter(s => s.category === category)
    if (stage) filtered = filtered.filter(s => s.stage === stage)
    if (search) {
      const q = search.toLowerCase()
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.tagline.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        (s.country && s.country.toLowerCase().includes(q))
      )
    }

    if (sort === 'popular') filtered.sort((a, b) => b.upvotes - a.upvotes)
    else if (sort === 'oldest') filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    else filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    const total = filtered.length
    const paged = filtered.slice(skip, skip + limit)

    return NextResponse.json({
      startups: paged,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('[API /startups] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch startups' }, { status: 500 })
  }
}

// ─── URL & Submission Validation ───

/** Blocked/spam TLDs and domains */
const BLOCKED_TLDS = ['.xyz', '.top', '.click', '.buzz', '.surf', '.monster', '.icu', '.club', '.work', '.info', '.biz', '.online', '.site', '.space', '.website', '.tech', '.cc', '.tk', '.ml', '.ga', '.cf', '.pw', '.bar', '.life', '.gq', '.win', '.bid', '.stream', '.download', '.racing', '.party', '.review', '.trade', '.date', '.loan', '.cricket', '.science', '.men', '.pro', '.faith', '.zip', '.mov', '.mp4', '.ong']
const BLOCKED_DOMAINS = ['mexty.fr', 'stellaflow.io']

/** Allowed TLDs — only these can be used for new submissions */
const ALLOWED_TLDS = ['.com', '.io', '.co', '.dev', '.ai', '.app', '.me', '.ly', '.so', '.is', '.sh', '.it', '.de', '.fr', '.uk', '.eu', '.es', '.nl', '.be', '.ch', '.at', '.se', '.no', '.dk', '.fi', '.ie', '.pt', '.pl', '.cz', '.ro', '.hu', '.gr', '.ca', '.us', '.mx', '.br', '.ar', '.cl', '.co', '.com.au', '.co.nz', '.co.za', '.com.br', '.co.uk', '.org', '.net', '.cloud', '.tech', '.health', '.law', '.phd', '.live', '.studio', '.design', '.world', '.group', '.inc', '.corp', '.llc', '.nz', '.au', '.in', '.jp', '.kr', '.sg', '.id', '.vn', '.th', '.hk', '.tw']

/** List of well-known free hosting / link-in-bio platforms */
const FREE_HOSTING_DOMAINS = [
  'github.io', 'gitlab.io', 'vercel.app', 'netlify.app', 'herokuapp.com',
  'wordpress.com', 'blogspot.com', 'medium.com', 'wixsite.com', 'squarespace.com',
  'notion.site', 'carrd.co', 'linktr.ee', 'bio.link', 'myportfolio.com',
]

/** Normalize a URL and extract its hostname */
function normalizeAndParseUrl(raw: string): { normalized: string; hostname: string; pathname: string } | null {
  try {
    let url = raw.trim()
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url
    }
    const parsed = new URL(url)
    // Reject URLs with paths that look like deep links (e.g., /nav3/entree.htm)
    const pathParts = parsed.pathname.split('/').filter(Boolean)
    if (pathParts.length > 2) return null
    if (pathParts.some(p => p.includes('.')) && !pathParts[pathParts.length - 1].match(/^(index|home|app)?(\.html?)?$/i)) {
      return null
    }
    return { normalized: url, hostname: parsed.hostname.replace(/^www\./, ''), pathname: parsed.pathname }
  } catch {
    return null
  }
}

/** Validate that a website URL looks legitimate */
function isValidStartupUrl(raw: string): { valid: boolean; error?: string } {
  const parsed = normalizeAndParseUrl(raw)
  if (!parsed) return { valid: false, error: 'Please provide a valid startup homepage URL (not a deep link or file path).' }

  const { hostname, pathname } = parsed

  // Reject deep-link URLs (e.g., mexty.fr/nav3/entree.htm)
  if (pathname !== '/' && pathname !== '') {
    return { valid: false, error: 'Only root domain URLs are accepted (e.g., https://example.com). Deep links and file paths are not allowed.' }
  }

  // Check blocked TLDs
  if (BLOCKED_TLDS.some(tld => hostname.endsWith(tld))) {
    return { valid: false, error: 'This domain extension is not allowed. Please use a standard domain (.com, .io, .co, .dev, etc.).' }
  }

  // Whitelist check: domain must use a known TLD
  const hasAllowedTld = ALLOWED_TLDS.some(tld => {
    if (tld.startsWith('.')) return hostname.endsWith(tld)
    return hostname === tld
  })
  if (!hasAllowedTld) {
    return { valid: false, error: 'This domain extension is not recognized. Please use a standard domain (e.g., .com, .io, .co, .dev, .ai, .app).' }
  }

  // Check blocked domains
  if (BLOCKED_DOMAINS.some(d => hostname === d || hostname.endsWith('.' + d))) {
    return { valid: false, error: 'This domain has been flagged and cannot be listed.' }
  }

  // Check free hosting
  if (FREE_HOSTING_DOMAINS.some(d => hostname === d || hostname.endsWith('.' + d))) {
    return { valid: false, error: 'Custom domains are required. Free hosting platforms (GitHub Pages, Vercel, etc.) are not accepted. Please use your own domain.' }
  }

  // Require a real domain (not an IP address)
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
    return { valid: false, error: 'Please use a domain name, not an IP address.' }
  }

  return { valid: true }
}

/** Verify that a URL is actually reachable (returns a real webpage) */
async function verifyUrlReachable(url: string): Promise<{ reachable: boolean; error?: string }> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000) // 8s timeout

    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'RevolaunchBot/1.0 (Startup Directory Verification)',
        'Accept': 'text/html,application/xhtml+xml,*/*',
      },
    })
    clearTimeout(timeout)

    // Accept any 2xx or 3xx (redirects were followed)
    if (response.status >= 200 && response.status < 400) {
      return { reachable: true }
    }

    return { reachable: false, error: `The website returned HTTP ${response.status}. Please verify the URL is correct and the site is live.` }
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return { reachable: false, error: 'The website took too long to respond. Please verify the URL and try again.' }
    }
    return { reachable: false, error: 'Could not reach the website. Please verify the URL is correct and the site is accessible.' }
  }
}

/** Basic email validation */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)
}

// POST /api/startups — Submit a new startup (uses DB)
export async function POST(request: Request) {
  try {
    const dbUp = await isDbAvailable()
    if (!dbUp || !db) {
      return NextResponse.json(
        { error: 'Database is currently unavailable. Please try again later.' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { name, tagline, description, website, category, twitter, linkedin, country, stage, teamSize, foundedYear, email, tier } = body

    if (!name || !tagline || !website || !category) {
      return NextResponse.json(
        { error: 'Name, tagline, website, and category are required.' },
        { status: 400 }
      )
    }

    // ─── URL validation ───
    const urlCheck = isValidStartupUrl(website)
    if (!urlCheck.valid) {
      return NextResponse.json({ error: urlCheck.error }, { status: 400 })
    }

    // ─── URL reachability check (verify the site actually exists) ───
    const parsedUrl = normalizeAndParseUrl(website)
    if (parsedUrl) {
      const reachable = await verifyUrlReachable(parsedUrl.normalized)
      if (!reachable.reachable) {
        return NextResponse.json({ error: reachable.error }, { status: 400 })
      }
    }

    // ─── Email validation (required for submission) ───
    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: 'A valid contact email is required to submit a startup.' },
        { status: 400 }
      )
    }

    // ─── Name validation ───
    const trimmedName = name.trim()
    if (trimmedName.length < 2 || trimmedName.length > 60) {
      return NextResponse.json(
        { error: 'Startup name must be between 2 and 60 characters.' },
        { status: 400 }
      )
    }

    // ─── Tagline validation ───
    const trimmedTagline = tagline.trim()
    if (trimmedTagline.length < 10 || trimmedTagline.length > 200) {
      return NextResponse.json(
        { error: 'Tagline must be between 10 and 200 characters.' },
        { status: 400 }
      )
    }

    // Normalize the website URL (parsedUrl already declared above)
    const normalizedWebsite = parsedUrl!.normalized

    // Generate slug from name
    const slug = trimmedName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    // Check for duplicate slug
    const existing = await db.startup.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json(
        { error: 'A startup with a similar name already exists.' },
        { status: 409 }
      )
    }

    const startup = await db.startup.create({
      data: {
        name: trimmedName,
        slug,
        tagline: trimmedTagline,
        description: description || null,
        logo: null,
        website: normalizedWebsite,
        twitter: twitter || null,
        linkedin: linkedin || null,
        category,
        stage: stage || 'Pre-seed',
        teamSize: teamSize || '1-5',
        foundedYear: foundedYear ? parseInt(foundedYear, 10) : null,
        country: country || null,
        email: email.trim(),
        launchTier: tier || 'free',
      },
      include: {
        _count: { select: { votes: true, perks: true } },
      },
    })

    // Send confirmation email
    try {
      const { isResendConfigured, resend, FROM_EMAIL, SITE_URL } = await import('@/lib/resend')
      if (isResendConfigured()) {
        const SubmissionConfirmationEmail = (await import('@/emails/SubmissionConfirmationEmail')).default
        await resend.emails.send({
          from: FROM_EMAIL,
          to: [email],
          subject: `${trimmedName} is live on Revolaunch!`,
          react: SubmissionConfirmationEmail({
            startupName: trimmedName,
            tagline: trimmedTagline,
            tier: tier || 'free',
            siteUrl: SITE_URL,
          }),
        })
        console.log(`[Submit] Confirmation email sent to ${email}`)
      }
    } catch (emailErr) {
      // Don't fail the submission if email fails
      console.warn('[Submit] Failed to send confirmation email:', emailErr)
    }

    // Auto-enrich in the background (fire-and-forget — don't block the response)
    if (normalizedWebsite) {
      // Use setImmediate-like approach with a microtask so we return immediately
      ;(async () => {
        try {
          const { scrapeStartup } = await import('@/lib/scrape')
          const scraped = await scrapeStartup(normalizedWebsite)

          const updateData: Record<string, any> = {}
          if (scraped.logo) updateData.logo = scraped.logo
          if (scraped.twitter) {
            updateData.twitter = scraped.twitter.startsWith('@')
              ? `https://x.com/${scraped.twitter.slice(1)}`
              : scraped.twitter
          }
          if (scraped.linkedin) updateData.linkedin = scraped.linkedin
          if (scraped.description) updateData.description = scraped.description

          if (Object.keys(updateData).length > 0) {
            await db.startup.update({
              where: { slug },
              data: updateData,
            })
            console.log(`[AutoEnrich] Updated ${trimmedName}: ${Object.keys(updateData).join(', ')}`)
          }
        } catch (err) {
          // Auto-enrichment failure should never affect the user experience
          console.warn(`[AutoEnrich] Background enrichment failed for ${trimmedName}:`, err)
        }
      })()
    }

    return NextResponse.json({ startup: formatStartup(startup) }, { status: 201 })
  } catch (error) {
    console.error('[API POST /startups] Error:', error)
    return NextResponse.json({ error: 'Failed to create startup' }, { status: 500 })
  }
}
