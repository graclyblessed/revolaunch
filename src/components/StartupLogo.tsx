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
 * Renders a startup logo with a 3-tier cascading fallback:
 * 1. Explicit logo URL from data (Clearbit)
 * 2. Google Favicon API (most reliable, always works)
 * 3. Colored letter fallback
 */

const sizeClasses = {
  sm: 'w-9 h-9 text-xs',
  md: 'w-11 h-11 text-sm',
  lg: 'w-12 h-12 text-lg',
}

const imgSizes = {
  sm: 20,
  md: 24,
  lg: 32,
}

/** Extract root domain from a URL string */
export function getDomain(website: string): string | null {
  if (!website) return null
  try {
    const url = new URL(website)
    const domain = url.hostname.replace(/^www\./, '')
    const parts = domain.split('.')
    if (parts.length > 2) {
      return parts.slice(-2).join('.')
    }
    return domain
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
  // Track which source failed: 0 = not tried yet, 1 = primary failed, 2 = secondary failed
  const [fallbackLevel, setFallbackLevel] = useState(0)

  const color = logoColor || '#F97316'
  const initial = name.charAt(0).toUpperCase()

  // Build the secondary URL (Google Favicon) from website
  const secondaryLogo = website ? getGoogleFaviconUrl(website) : null

  // Determine current source
  const primaryUrl = logo || (website ? getClearbitLogoUrl(website) : null)
  const currentUrl = fallbackLevel === 0 ? primaryUrl : secondaryLogo
  const showLetter = fallbackLevel >= 2 || !currentUrl

  if (showLetter) {
    return (
      <div
        className={`${sizeClasses[size]} rounded-xl flex items-center justify-center shrink-0 ${className}`}
        style={{ backgroundColor: color + '22' }}
      >
        <span className="font-bold" style={{ color }}>
          {initial}
        </span>
      </div>
    )
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-xl flex items-center justify-center shrink-0 overflow-hidden bg-muted ${className}`}
    >
      <img
        src={currentUrl}
        alt={`${name} logo`}
        width={imgSizes[size]}
        height={imgSizes[size]}
        className="w-full h-full object-contain p-1.5"
        onError={() => setFallbackLevel(prev => prev + 1)}
        loading="lazy"
      />
    </div>
  )
}
