'use client'

import { useState } from 'react'

interface StartupLogoProps {
  name: string
  logo?: string | null
  website?: string
  logoColor?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * Renders a startup logo with a reliable fallback chain:
 * 1. Google Favicon API (most reliable, works for any domain)
 * 2. Clearbit logo (high quality when available)
 * 3. Letter initial (always shown as background, never leaves blank space)
 */

const sizeClasses = {
  sm: 'w-9 h-9 text-xs',
  md: 'w-11 h-11 text-sm',
  lg: 'w-12 h-12 text-lg',
}

/** Extract domain from a URL, strips 'www.' prefix */
export function getDomain(website: string): string | null {
  if (!website) return null
  try {
    const url = new URL(website)
    return url.hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

/** Generate a Google Favicon URL — the most reliable free logo source */
export function getGoogleFaviconUrl(website: string): string | null {
  const domain = getDomain(website)
  if (!domain) return null
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
}

/** Generate a Clearbit logo URL */
export function getClearbitLogoUrl(website: string): string | null {
  const domain = getDomain(website)
  if (!domain) return null
  return `https://logo.clearbit.com/${domain}`
}

export default function StartupLogo({ name, logo, website, logoColor, size = 'md', className = '' }: StartupLogoProps) {
  // Track fallback: 0 = google favicon, 1 = clearbit, 2 = show letter only
  const [fallbackLevel, setFallbackLevel] = useState(0)

  const color = logoColor || '#F97316'
  const initial = name.charAt(0).toUpperCase()

  // Source 1: Google Favicon (most reliable)
  const googleFavicon = website ? getGoogleFaviconUrl(website) : null
  // Source 2: Clearbit or explicit logo
  const clearbitLogo = logo || (website ? getClearbitLogoUrl(website) : null)

  // Determine which URL to try based on fallback level
  const currentUrl = fallbackLevel === 0 ? googleFavicon : clearbitLogo
  const showLetter = fallbackLevel >= 2 || !currentUrl

  return (
    <div
      className={`${sizeClasses[size]} rounded-xl flex items-center justify-center shrink-0 overflow-hidden relative ${className}`}
      style={{ backgroundColor: color + '22' }}
    >
      {/* Letter initial — always rendered as background, hidden when image loads */}
      <span
        className={`font-bold absolute ${!showLetter && currentUrl ? 'opacity-0' : 'opacity-100'}`}
        style={{ color }}
      >
        {initial}
      </span>

      {/* Try to load image, fall back on error */}
      {!showLetter && currentUrl && (
        <img
          src={currentUrl}
          alt={`${name} logo`}
          width={32}
          height={32}
          className="w-full h-full object-contain p-1.5 relative z-10"
          onError={() => setFallbackLevel(prev => prev + 1)}
          onLoad={() => setFallbackLevel(0)}
          loading="lazy"
        />
      )}
    </div>
  )
}
