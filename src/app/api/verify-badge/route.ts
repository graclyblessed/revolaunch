import { NextResponse } from 'next/server'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'revolaunch.vercel.app'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { url } = body

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    // Normalize URL
    let normalizedUrl = url.trim()
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl
    }

    // Validate URL format
    try {
      new URL(normalizedUrl)
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    // Fetch the page HTML with a 10-second timeout
    let html: string
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const res = await fetch(normalizedUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Revolaunch-Badge-Verifier/1.0 (+https://' + SITE_URL + ')',
          Accept: 'text/html',
        },
        redirect: 'follow',
      })

      clearTimeout(timeoutId)

      if (!res.ok) {
        return NextResponse.json({
          verified: false,
          found: [],
          error: `Page returned status ${res.status}`,
        })
      }

      html = await res.text()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      if (message.includes('abort') || message.includes('timeout')) {
        return NextResponse.json({
          verified: false,
          found: [],
          error: 'Request timed out. Please check the URL and try again.',
        })
      }
      return NextResponse.json({
        verified: false,
        found: [],
        error: 'Could not fetch the page. Make sure the URL is correct and the page is publicly accessible.',
      })
    }

    // Check for various indicators
    const found: string[] = []
    const htmlLower = html.toLowerCase()

    // Check for "revolaunch" text
    if (htmlLower.includes('revolaunch')) {
      found.push('Found "revolaunch" text on the page')
    }

    // Check for revolaunch link href
    if (html.includes(SITE_URL) || html.includes('revolaunch')) {
      const hrefPattern = new RegExp(`href=["'][^"']*(${SITE_URL.replace('.', '\\.')}|revolaunch)[^"']*["']`, 'i')
      if (hrefPattern.test(html)) {
        found.push('Found link pointing to Revolaunch')
      }
    }

    // Check for badge image URL
    if (htmlLower.includes('/api/badge')) {
      found.push('Found Revolaunch badge image')
    }

    // Check for revolaunch.vercel.app specifically (legacy)
    if (html.includes('revolaunch.vercel.app')) {
      found.push('Found link to revolaunch.vercel.app')
    }

    // Check for SVG badge content
    if (htmlLower.includes('listed on revolaunch')) {
      found.push('Found "Listed on Revolaunch" text')
    }

    const verified = found.length > 0

    return NextResponse.json({ verified, found })
  } catch (error) {
    console.error('[API POST /verify-badge] Error:', error)
    return NextResponse.json(
      { error: 'Verification failed. Please try again.' },
      { status: 500 }
    )
  }
}
