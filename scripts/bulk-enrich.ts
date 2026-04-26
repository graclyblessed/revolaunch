/**
 * Bulk enrichment script.
 * Fetches all startups from DB, scrapes their websites, and fills in missing data.
 * 
 * Usage:
 *   DATABASE_URL="..." npx tsx scripts/bulk-enrich.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ─── Inline scraper ───

interface ScrapedData {
  logo?: string | null
  twitter?: string | null
  linkedin?: string | null
  description?: string | null
  favicon?: string | null
  title?: string | null
  tagline?: string | null
}

const USER_AGENT = 'RevolaunchBot/1.0 (meta-fetch; +https://revolaunch.net)'
const FETCH_TIMEOUT_MS = 6000
const HARD_TIMEOUT_MS = 12000 // Hard per-startup timeout

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

function extractMeta(html: string, attrName: string, attrValue: string): string | null {
  const escaped = attrValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const patterns = [
    new RegExp(`<meta[^>]+${attrName}\\s*=\\s*["']${escaped}["'][^>]+content\\s*=\\s*["']([^"']*?)["'][^>]*>`, 'i'),
    new RegExp(`<meta[^>]+content\\s*=\\s*["']([^"']*?)["'][^>]+${attrName}\\s*=\\s*["']${escaped}["'][^>]*>`, 'i'),
  ]
  for (const pat of patterns) {
    const m = html.match(pat)
    if (m) return decodeEntities(m[1].trim().replace(/\s+/g, ' '))
  }
  return null
}

function extractFirst(html: string, regex: RegExp): string | null {
  const m = html.match(regex)
  return m ? decodeEntities(m[1].trim()) : null
}

function resolveUrl(base: string, href: string): string {
  if (!href) return ''
  if (href.startsWith('http://') || href.startsWith('https://')) return href
  if (href.startsWith('//')) return 'https:' + href
  if (href.startsWith('/')) {
    try { return new URL(base).origin + href } catch { return href }
  }
  try { return new URL(href, base).href } catch { return href }
}

function extractTwitterHandle(text: string): string | null {
  if (!text) return null
  const handleMatch = text.match(/@([a-zA-Z0-9_]{1,15})$/)
  if (handleMatch) return '@' + handleMatch[1]
  const urlMatch = text.match(/(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]{1,15})(?:\?|\/|$)/i)
  if (urlMatch) {
    const handle = urlMatch[1]
    if (['home', 'search', 'explore', 'settings', 'notifications', 'messages', 'i', 'status', 'compose'].includes(handle.toLowerCase())) return null
    return '@' + handle
  }
  return null
}

function extractLinkedinUrl(href: string): string | null {
  if (!href) return null
  const match = href.match(/linkedin\.com\/(company|showcase)\/([^?/&]+)/i)
  if (match) {
    const slug = match[2]
    if (['directory', 'search', 'updates', 'admin', 'learning'].includes(slug.toLowerCase())) return null
    if (href.startsWith('http')) return href.split('?')[0]
    return 'https://www.linkedin.com/' + match[1] + '/' + slug
  }
  return null
}

async function scrapeStartup(url: string): Promise<ScrapedData> {
  const empty: ScrapedData = { logo: null, twitter: null, linkedin: null, description: null, favicon: null, title: null, tagline: null }

  try {
    let normalizedUrl = url.trim()
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl
    }
    try { new URL(normalizedUrl) } catch { return empty }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
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
      if (!res.ok) return empty
      html = await res.text()
    } catch (err: any) {
      clearTimeout(timeout)
      return empty
    }

    const title = extractFirst(html, /<title[^>]*>([\s\S]*?)<\/title>/i)
    const metaDesc = extractMeta(html, 'name', 'description')
    const ogDesc = extractMeta(html, 'property', 'og:description')
    const description = metaDesc || ogDesc
    const ogTitle = extractMeta(html, 'property', 'og:title')
    let tagline = ogTitle || title || ''
    if (tagline.length > 100) tagline = tagline.substring(0, 97).replace(/\s+\S*$/, '') + '...'
    tagline = tagline.replace(/\s*[|\-–—]\s*(Home|Homepage|Welcome|Log in|Sign up).*/i, '').trim().replace(/\s*[|\-–—]\s*$/, '').trim()

    let logo = extractMeta(html, 'property', 'og:image')
    if (!logo) logo = extractMeta(html, 'property', 'og:image:url')
    if (logo) logo = resolveUrl(normalizedUrl, logo)
    if (logo && (logo.startsWith('data:') || logo.length < 10)) logo = null

    let favicon: string | null = null
    const appleTouchIcon = extractFirst(html, /<link[^>]+rel\s*=\s*["']apple-touch-icon["'][^>]+href\s*=\s*["']([^"']+?)["'][^>]*>/i)
    if (appleTouchIcon) favicon = resolveUrl(normalizedUrl, appleTouchIcon)
    if (!favicon) {
      const iconHref = extractFirst(html, /<link[^>]+rel\s*=\s*["'](?:shortcut\s+)?icon["'][^>]+href\s*=\s*["']([^"']+?)["'][^>]*>/i)
      if (iconHref) favicon = resolveUrl(normalizedUrl, iconHref)
    }
    if (!favicon) {
      try { favicon = new URL(normalizedUrl).origin + '/favicon.ico' } catch { /* ignore */ }
    }

    let twitter: string | null = null
    const twitterSite = extractMeta(html, 'name', 'twitter:site')
    if (twitterSite) twitter = extractTwitterHandle(twitterSite)
    if (!twitter) {
      const twitterCreator = extractMeta(html, 'name', 'twitter:creator')
      if (twitterCreator) twitter = extractTwitterHandle(twitterCreator)
    }
    if (!twitter) {
      const linkPattern = /<a[^>]+href\s*=\s*["']([^"']*?)(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]{1,15})(?:[^"']*?)["'][^>]*>/gi
      let linkMatch: RegExpExecArray | null
      while ((linkMatch = linkPattern.exec(html)) !== null) {
        const handle = extractTwitterHandle('https://twitter.com/' + linkMatch[2])
        if (handle) { twitter = handle; break }
      }
    }

    let linkedin: string | null = null
    const liPattern = /<a[^>]+href\s*=\s*["']([^"']*?linkedin\.com\/(?:company|showcase)\/[^"']+?)["'][^>]*>/gi
    let liMatch: RegExpExecArray | null
    while ((liMatch = liPattern.exec(html)) !== null) {
      const liUrl = extractLinkedinUrl(liMatch[1])
      if (liUrl) { linkedin = liUrl; break }
    }
    if (!twitter || !linkedin) {
      const allHrefs = html.matchAll(/<a[^>]+href\s*=\s*["']([^"']+)["'][^>]*>/gi)
      for (const match of allHrefs) {
        const href = match[1]
        if (!twitter && /(?:twitter\.com|x\.com)\//i.test(href)) {
          const handle = extractTwitterHandle(href)
          if (handle) twitter = handle
        }
        if (!linkedin && /linkedin\.com\/(?:company|showcase)\//i.test(href)) {
          const liUrl = extractLinkedinUrl(href)
          if (liUrl) linkedin = liUrl
        }
        if (twitter && linkedin) break
      }
    }

    return { logo: logo || null, twitter: twitter || null, linkedin: linkedin || null, description: description || null, favicon: favicon || null, title: title || null, tagline: tagline || null }
  } catch {
    return empty
  }
}

// ─── Script ───

const DELAY_MS = 1200

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function withHardTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('HARD TIMEOUT')), ms))
  ])
}

async function main() {
  console.log('╔══════════════════════════════════════════════╗')
  console.log('║   Revolaunch Bulk Enrichment Script          ║')
  console.log('╚══════════════════════════════════════════════╝')
  console.log('')

  const startups = await prisma.startup.findMany({
    where: { status: 'active' },
    orderBy: { createdAt: 'asc' },
  })
  console.log(`Found ${startups.length} active startups.\n`)

  let totalUpdated = 0
  let totalFailed = 0
  let totalSkipped = 0
  let logFound = 0
  let twitterFound = 0
  let linkedinFound = 0
  const updatedNames: string[] = []

  for (let i = 0; i < startups.length; i++) {
    const s = startups[i]
    const num = `[${String(i + 1).padStart(2, '0')}/${startups.length}]`
    process.stdout.write(`${num} ${s.name}`)

    if (!s.website) {
      console.log(' — SKIP (no website)')
      totalSkipped++
      continue
    }

    // Check if already fully enriched
    if (s.logo && s.twitter && s.linkedin) {
      console.log(' — SKIP (already enriched)')
      totalSkipped++
      continue
    }

    try {
      const scraped = await withHardTimeout(scrapeStartup(s.website), HARD_TIMEOUT_MS)
      const updateData: Record<string, any> = {}
      const updatedFields: string[] = []

      if (!s.logo && scraped.logo) {
        updateData.logo = scraped.logo
        updatedFields.push('logo')
        logFound++
      }
      if (!s.twitter && scraped.twitter) {
        const twitterUrl = scraped.twitter.startsWith('@')
          ? `https://x.com/${scraped.twitter.slice(1)}`
          : scraped.twitter
        updateData.twitter = twitterUrl
        updatedFields.push('twitter')
        twitterFound++
      }
      if (!s.linkedin && scraped.linkedin) {
        updateData.linkedin = scraped.linkedin
        updatedFields.push('linkedin')
        linkedinFound++
      }
      if ((!s.description || s.description.trim() === '') && scraped.description) {
        updateData.description = scraped.description
        updatedFields.push('description')
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.startup.update({ where: { slug: s.slug }, data: updateData })
        totalUpdated++
        updatedNames.push(`${s.name}: ${updatedFields.join(', ')}`)
        console.log(` — UPDATED: ${updatedFields.join(', ')}`)
      } else {
        console.log(' — no new data found')
      }
    } catch (err: any) {
      totalFailed++
      console.log(` — ERROR: ${err.message}`)
    }

    if (i < startups.length - 1) await delay(DELAY_MS)
  }

  console.log('')
  console.log('══════════════════════════════════════════════')
  console.log('                  SUMMARY')
  console.log('══════════════════════════════════════════════')
  console.log(`  Total startups:     ${startups.length}`)
  console.log(`  Updated:            ${totalUpdated}`)
  console.log(`  Skipped:            ${totalSkipped}`)
  console.log(`  Failed:             ${totalFailed}`)
  console.log('')
  console.log('  Fields enriched:')
  console.log(`    Logos (og:image):  ${logFound}`)
  console.log(`    Twitter handles:   ${twitterFound}`)
  console.log(`    LinkedIn URLs:     ${linkedinFound}`)
  console.log('══════════════════════════════════════════════')

  if (updatedNames.length > 0) {
    console.log('')
    console.log('Updated startups:')
    for (const n of updatedNames) console.log(`  ✓ ${n}`)
  }

  await prisma.$disconnect()
  process.exit(0)
}

main().catch(async (err) => {
  console.error('Fatal error:', err)
  await prisma.$disconnect()
  process.exit(1)
})
