'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

interface StartupLogoProps {
  name: string
  logo?: string | null
  website?: string
  logoColor?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'w-9 h-9 text-xs',
  md: 'w-11 h-11 text-sm',
  lg: 'w-12 h-12 text-lg',
}

// Minimum dimensions to consider an image "real" (not a 1px transparent dot)
const MIN_VALID_SIZE = 8

export function getDomain(website: string): string | null {
  if (!website) return null
  try {
    const url = new URL(website)
    return url.hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

export function getClearbitLogoUrl(website: string): string | null {
  const domain = getDomain(website)
  if (!domain) return null
  return `https://logo.clearbit.com/${domain}`
}

export function getGoogleFaviconUrl(website: string): string | null {
  const domain = getDomain(website)
  if (!domain) return null
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
}

/**
 * Check if a stored logo URL looks like an og:image screenshot rather than a real logo.
 * og:image URLs often come from CDNs and contain paths like /og, /opengraph, /preview, /hero, etc.
 * Clearbit logos always come from logo.clearbit.com and are actual company logos.
 */
function isLikelyOgImage(url: string): boolean {
  // Clearbit and Google Favicon are always real logos
  if (url.includes('clearbit.com') || url.includes('google.com/s2/favicons')) return false
  // Common og:image patterns that indicate screenshots/banners
  const ogPatterns = [/\/og[_-]?/, /opengraph/i, /\/preview/i, /\/hero/i, /\/banner/i, /\/screenshot/i, /\.png\?.*width=/i, /\/social/i, /image\.uploadcare\./i, /cdn-images/i, /unsplash/i, /\/assets\/(?!logo)/i]
  return ogPatterns.some(p => p.test(url))
}

function buildLogoUrls(logo: string | null | undefined, website: string | undefined): string[] {
  const urls: string[] = []
  // Always prefer Clearbit (actual company logos) over stored og:image URLs
  const clearbitUrl = website ? getClearbitLogoUrl(website) : null
  if (clearbitUrl) urls.push(clearbitUrl)
  // Only include stored logo if it doesn't look like an og:image screenshot
  if (logo && logo !== clearbitUrl && !isLikelyOgImage(logo)) {
    urls.push(logo)
  }
  // Fallback to Google Favicon
  const faviconUrl = website ? getGoogleFaviconUrl(website) : null
  if (faviconUrl && faviconUrl !== clearbitUrl) urls.push(faviconUrl)
  return urls
}

export default function StartupLogo({ name, logo, website, logoColor, size = 'md', className = '' }: StartupLogoProps) {
  const color = logoColor || '#F97316'
  const initial = name.charAt(0).toUpperCase()
  const triedUrls = useRef<Set<string>>(new Set())
  const urlListRef = useRef<string[]>([])
  const [currentSrc, setCurrentSrc] = useState<string | null>(null)
  const [showImage, setShowImage] = useState(false)

  const tryNextUrl = useCallback(() => {
    const nextUrl = urlListRef.current.find(u => !triedUrls.current.has(u))
    if (nextUrl) {
      triedUrls.current.add(nextUrl)
      setCurrentSrc(nextUrl)
      setShowImage(false)
    } else {
      setCurrentSrc(null)
      setShowImage(false)
    }
  }, [])

  useEffect(() => {
    const urls = buildLogoUrls(logo, website)
    urlListRef.current = urls
    triedUrls.current.clear()
    setShowImage(false)
    if (urls.length > 0) {
      triedUrls.current.add(urls[0])
      setCurrentSrc(urls[0])
    } else {
      setCurrentSrc(null)
    }
  }, [logo, website])

  const handleImageError = () => {
    setShowImage(false)
    tryNextUrl()
  }

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    const w = img.naturalWidth
    const h = img.naturalHeight

    // Reject images that are too small (1px transparent favicons, empty SVGs, etc.)
    if (w < MIN_VALID_SIZE || h < MIN_VALID_SIZE) {
      setShowImage(false)
      tryNextUrl()
      return
    }

    setShowImage(true)
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-xl flex items-center justify-center shrink-0 overflow-hidden relative ${className}`}
      style={{ backgroundColor: color + '22' }}
    >
      <span
        className={`font-bold absolute transition-opacity duration-200 ${showImage ? 'opacity-0' : 'opacity-100'}`}
        style={{ color }}
      >
        {initial}
      </span>
      {currentSrc && (
        <img
          key={currentSrc}
          src={currentSrc}
          alt={`${name} logo`}
          width={32}
          height={32}
          className={`w-full h-full object-contain p-1.5 relative z-10 transition-opacity duration-200 ${showImage ? 'opacity-100' : 'opacity-0'}`}
          onError={handleImageError}
          onLoad={handleImageLoad}
          loading="lazy"
        />
      )}
    </div>
  )
}
