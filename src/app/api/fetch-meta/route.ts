import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { url } = await request.json()

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Normalize URL — ensure it has a protocol
    let normalizedUrl = url.trim()
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl
    }

    // Basic URL validation
    try {
      new URL(normalizedUrl)
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    // Fetch the page with a timeout (5s)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    let html: string
    try {
      const res = await fetch(normalizedUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'RevolaunchBot/1.0 (meta-fetch; +https://revolaunch.net)',
          'Accept': 'text/html,application/xhtml+xml',
        },
        redirect: 'follow',
      })
      clearTimeout(timeout)

      if (!res.ok) {
        return NextResponse.json({ error: `Could not fetch page (HTTP ${res.status})` }, { status: 422 })
      }

      const contentType = res.headers.get('content-type') || ''
      if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
        return NextResponse.json({ error: 'URL does not point to an HTML page' }, { status: 422 })
      }

      html = await res.text()
    } catch (err: any) {
      clearTimeout(timeout)
      if (err.name === 'AbortError') {
        return NextResponse.json({ error: 'Request timed out' }, { status: 422 })
      }
      return NextResponse.json({ error: 'Could not reach the website' }, { status: 422 })
    }

    // Extract <title>
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
    const rawTitle = titleMatch ? titleMatch[1].trim().replace(/\s+/g, ' ') : ''

    // Extract <meta name="description" content="...">
    const descMatch = html.match(/<meta[^>]+name\s*=\s*["']description["'][^>]+content\s*=\s*["']([^"']*?)["'][^>]*>/i)
      || html.match(/<meta[^>]+content\s*=\s*["']([^"']*?)["'][^>]+name\s*=\s*["']description["'][^>]*>/i)
    const rawDescription = descMatch ? descMatch[1].trim().replace(/\s+/g, ' ') : ''

    // Extract og:title as fallback for tagline if <title> is generic
    const ogTitleMatch = html.match(/<meta[^>]+property\s*=\s*["']og:title["'][^>]+content\s*=\s*["']([^"']*?)["'][^>]*>/i)
      || html.match(/<meta[^>]+content\s*=\s*["']([^"']*?)["'][^>]+property\s*=\s*=\s*["']og:title["'][^>]*>/i)
    const ogTitle = ogTitleMatch ? ogTitleMatch[1].trim().replace(/\s+/g, ' ') : ''

    // Extract og:description as fallback
    const ogDescMatch = html.match(/<meta[^>]+property\s*=\s*["']og:description["'][^>]+content\s*=\s*["']([^"']*?)["'][^>]*>/i)
      || html.match(/<meta[^>]+content\s*=\s*["']([^"']*?)["'][^>]+property\s*=\s*["']og:description["'][^>]*>/i)
    const ogDescription = ogDescMatch ? ogDescMatch[1].trim().replace(/\s+/g, ' ') : ''

    // Decode HTML entities
    const decodeEntities = (text: string): string => {
      return text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&#x27;/g, "'")
        .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)))
    }

    const title = decodeEntities(rawTitle)
    const description = decodeEntities(rawDescription) || decodeEntities(ogDescription)
    const ogTitleClean = decodeEntities(ogTitle)

    // Generate a tagline from title (truncate to ~100 chars, no trailing punctuation)
    let tagline = title || ogTitleClean || ''
    if (tagline.length > 100) {
      tagline = tagline.substring(0, 97).replace(/\s+\S*$/, '') + '...'
    }
    // Strip common suffixes like " — Company Name" or " | Home"
    tagline = tagline.replace(/\s*[|\-–—]\s*(Home|Homepage|Welcome|Log in|Sign up).*/i, '').trim()
    tagline = tagline.replace(/\s*[|\-–—]\s*$/, '').trim()

    if (!title && !description) {
      return NextResponse.json({ error: 'No metadata found on this page' }, { status: 422 })
    }

    return NextResponse.json({
      title: title || null,
      tagline: tagline || null,
      description: description || null,
    })
  } catch (error) {
    console.error('[API /fetch-meta] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch metadata' }, { status: 500 })
  }
}
