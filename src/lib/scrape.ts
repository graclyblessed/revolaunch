/**
 * Comprehensive website scraper for startup auto-enrichment.
 * Extracts: Twitter handle, LinkedIn URL, description, favicon.
 * Note: og:image is NOT used as logo (it's a social preview, often a screenshot).
 *       Logo display is handled client-side via Clearbit + Google Favicon fallbacks.
 * Never throws — always returns partial data on errors.
 */

export interface ScrapedData {
  logo?: string | null       // Always null — logos are handled client-side via Clearbit
  twitter?: string | null    // Twitter handle (e.g. "@revolaunch" or full URL)
  linkedin?: string | null   // Full LinkedIn company URL
  description?: string | null// Meta description
  favicon?: string | null    // Favicon URL
  title?: string | null      // Page title
  tagline?: string | null    // Derived from og:title or title
}

const USER_AGENT = 'RevolaunchBot/1.0 (meta-fetch; +https://revolaunch.net)'
const TIMEOUT_MS = 8000

/** Decode common HTML entities */
function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)))
    .replace(/&apos;/g, "'")
}

/** Extract a meta tag content value (supports property and name attributes, both attribute orders) */
function extractMeta(html: string, attrName: string, attrValue: string): string | null {
  // Try property first, then name
  const patterns = [
    new RegExp(`<meta[^>]+${attrName}\\s*=\\s*["']${attrValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]+content\\s*=\\s*["']([^"']*?)["'][^>]*>`, 'i'),
    new RegExp(`<meta[^>]+content\\s*=\\s*["']([^"']*?)["'][^>]+${attrName}\\s*=\\s*["']${attrValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*>`, 'i'),
  ]
  for (const pat of patterns) {
    const m = html.match(pat)
    if (m) return decodeEntities(m[1].trim().replace(/\s+/g, ' '))
  }
  return null
}

/** Extract first match of a regex from HTML */
function extractFirst(html: string, regex: RegExp): string | null {
  const m = html.match(regex)
  return m ? decodeEntities(m[1].trim()) : null
}

/** Resolve a URL relative to a base URL */
function resolveUrl(base: string, href: string): string {
  if (!href) return ''
  if (href.startsWith('http://') || href.startsWith('https://')) return href
  if (href.startsWith('//')) return 'https:' + href
  if (href.startsWith('/')) {
    try {
      const url = new URL(base)
      return url.origin + href
    } catch {
      return href
    }
  }
  try {
    return new URL(href, base).href
  } catch {
    return href
  }
}

/** Extract Twitter handle from a URL or @mention string */
function extractTwitterHandle(text: string): string | null {
  if (!text) return null
  // Already a handle
  const handleMatch = text.match(/@([a-zA-Z0-9_]{1,15})$/)
  if (handleMatch) return '@' + handleMatch[1]
  // URL form: twitter.com/handle or x.com/handle
  const urlMatch = text.match(/(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]{1,15})(?:\?|\/|$)/i)
  if (urlMatch) {
    const handle = urlMatch[1]
    // Skip platform-specific handles
    if (['home', 'search', 'explore', 'settings', 'notifications', 'messages', 'i', 'status', 'compose'].includes(handle.toLowerCase())) {
      return null
    }
    return '@' + handle
  }
  return null
}

/** Extract LinkedIn company/showcase URL from a link href */
function extractLinkedinUrl(href: string): string | null {
  if (!href) return null
  // Match both /company/ and /showcase/ (showcase pages are legitimate company/product pages)
  const match = href.match(/linkedin\.com\/(company|showcase)\/([^?/&]+)/i)
  if (match) {
    const slug = match[2]
    // Skip generic paths
    if (['directory', 'search', 'updates', 'admin', 'learning'].includes(slug.toLowerCase())) {
      return null
    }
    // Ensure full URL
    if (href.startsWith('http')) return href.split('?')[0]
    return 'https://www.linkedin.com/' + match[1] + '/' + slug
  }
  return null
}

/**
 * Scrape a startup website for enrichment data.
 * Returns partial data on any error — never throws.
 */
export async function scrapeStartup(url: string): Promise<ScrapedData> {
  const empty: ScrapedData = { logo: null, twitter: null, linkedin: null, description: null, favicon: null, title: null, tagline: null }

  try {
    // Normalize URL
    let normalizedUrl = url.trim()
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl
    }

    // Validate URL
    try { new URL(normalizedUrl) } catch { return empty }

    // Fetch with timeout
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
    let html: string

    try {
      const res = await fetch(normalizedUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        redirect: 'follow',
      })
      clearTimeout(timeout)

      if (!res.ok) {
        console.warn(`[Scrape] HTTP ${res.status} for ${normalizedUrl}`)
        return empty
      }

      html = await res.text()
    } catch (err: any) {
      clearTimeout(timeout)
      if (err.name === 'AbortError') {
        console.warn(`[Scrape] Timeout for ${normalizedUrl}`)
      } else {
        console.warn(`[Scrape] Fetch error for ${normalizedUrl}: ${err.message}`)
      }
      return empty
    }

    // ─── Extract metadata ───

    // Title
    const title = extractFirst(html, /<title[^>]*>([\s\S]*?)<\/title>/i)

    // Description (meta description or og:description)
    const metaDesc = extractMeta(html, 'name', 'description')
    const ogDesc = extractMeta(html, 'property', 'og:description')
    const description = metaDesc || ogDesc

    // Tagline from og:title or title
    const ogTitle = extractMeta(html, 'property', 'og:title')
    let tagline = ogTitle || title || ''
    if (tagline.length > 100) {
      tagline = tagline.substring(0, 97).replace(/\s+\S*$/, '') + '...'
    }
    tagline = tagline.replace(/\s*[|\-–—]\s*(Home|Homepage|Welcome|Log in|Sign up).*/i, '').trim()
    tagline = tagline.replace(/\s*[|\-–—]\s*$/, '').trim()

    // Logo: intentionally NOT extracted from og:image.
    // og:image is a social sharing preview (often a screenshot/banner), NOT a company logo.
    // Logo display is handled client-side via Clearbit (logo.clearbit.com) and Google Favicon.
    // Storing og:image as "logo" causes screenshots to display instead of actual logos.
    const logo = null

    // Favicon
    let favicon: string | null = null
    // Try apple-touch-icon first (usually higher quality)
    const appleTouchIcon = extractFirst(html, /<link[^>]+rel\s*=\s*["']apple-touch-icon["'][^>]+href\s*=\s*["']([^"']+?)["'][^>]*>/i)
    if (appleTouchIcon) {
      favicon = resolveUrl(normalizedUrl, appleTouchIcon)
    }
    if (!favicon) {
      const iconHref = extractFirst(html, /<link[^>]+rel\s*=\s*["'](?:shortcut\s+)?icon["'][^>]+href\s*=\s*["']([^"']+?)["'][^>]*>/i)
      if (iconHref) {
        favicon = resolveUrl(normalizedUrl, iconHref)
      }
    }
    // Fallback: /favicon.ico
    if (!favicon) {
      try {
        const urlObj = new URL(normalizedUrl)
        favicon = urlObj.origin + '/favicon.ico'
      } catch { /* ignore */ }
    }

    // ─── Extract social links ───

    // Twitter: check meta tag first
    let twitter: string | null = null
    const twitterSite = extractMeta(html, 'name', 'twitter:site')
    if (twitterSite) {
      twitter = extractTwitterHandle(twitterSite)
    }
    // Fallback: twitter:creator (sometimes has the handle)
    if (!twitter) {
      const twitterCreator = extractMeta(html, 'name', 'twitter:creator')
      if (twitterCreator) {
        twitter = extractTwitterHandle(twitterCreator)
      }
    }

    // Also scan all <a href> for twitter/x.com links
    if (!twitter) {
      const linkPattern = /<a[^>]+href\s*=\s*["']([^"']*?)(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]{1,15})(?:[^"']*?)["'][^>]*>/gi
      let linkMatch: RegExpExecArray | null
      while ((linkMatch = linkPattern.exec(html)) !== null) {
        const handle = extractTwitterHandle('https://twitter.com/' + linkMatch[2])
        if (handle) {
          twitter = handle
          break
        }
      }
    }

    // LinkedIn: scan all <a href> for linkedin.com/company/ or /showcase/ links
    let linkedin: string | null = null
    const liPattern = /<a[^>]+href\s*=\s*["']([^"']*?linkedin\.com\/(?:company|showcase)\/[^"']+?)["'][^>]*>/gi
    let liMatch: RegExpExecArray | null
    while ((liMatch = liPattern.exec(html)) !== null) {
      const url = extractLinkedinUrl(liMatch[1])
      if (url) {
        linkedin = url
        break
      }
    }

    // Also check footer and header areas more aggressively for social links
    if (!twitter || !linkedin) {
      // Extract all href values from anchor tags
      const allHrefs = html.matchAll(/<a[^>]+href\s*=\s*["']([^"']+)["'][^>]*>/gi)
      for (const match of allHrefs) {
        const href = match[1]
        if (!twitter && /(?:twitter\.com|x\.com)\//i.test(href)) {
          const handle = extractTwitterHandle(href)
          if (handle) twitter = handle
        }
        if (!linkedin && /linkedin\.com\/(?:company|showcase)\//i.test(href)) {
          const url = extractLinkedinUrl(href)
          if (url) linkedin = url
        }
        if (twitter && linkedin) break
      }
    }

    return {
      logo: null,
      twitter: twitter || null,
      linkedin: linkedin || null,
      description: description || null,
      favicon: favicon || null,
      title: title || null,
      tagline: tagline || null,
    }
  } catch (error) {
    console.error(`[Scrape] Unexpected error for ${url}:`, error)
    return empty
  }
}
