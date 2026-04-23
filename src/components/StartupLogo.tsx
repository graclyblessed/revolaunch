'use client'

import { useState } from 'react'

interface StartupLogoProps {
  name: string
  logo?: string | null
  logoColor?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * Renders a startup logo with automatic fallback.
 * If the logo URL is provided and loads successfully, it shows the real image.
 * Otherwise, it falls back to a colored letter (first character of the name).
 * If no explicit logo URL is provided, it auto-generates one from the website domain
 * using the Clearbit Logo API.
 */
export function getLogoFromWebsite(website: string): string | null {
  if (!website) return null
  try {
    const url = new URL(website)
    const domain = url.hostname.replace(/^www\./, '')
    // Extract root domain for subdomain-heavy sites
    const parts = domain.split('.')
    if (parts.length > 2) {
      // For things like dreamina.capcut.com → capcut.com
      const rootDomain = parts.slice(-2).join('.')
      return `https://logo.clearbit.com/${rootDomain}`
    }
    return `https://logo.clearbit.com/${domain}`
  } catch {
    return null
  }
}

export default function StartupLogo({ name, logo, logoColor, size = 'md', className = '' }: StartupLogoProps) {
  const [imgError, setImgError] = useState(false)

  const color = logoColor || '#F97316'
  const initial = name.charAt(0).toUpperCase()

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

  // If there's a logo URL and it hasn't errored yet, show the image
  if (logo && !imgError) {
    return (
      <div
        className={`${sizeClasses[size]} rounded-xl flex items-center justify-center shrink-0 overflow-hidden bg-muted ${className}`}
      >
        <img
          src={logo}
          alt={`${name} logo`}
          width={imgSizes[size]}
          height={imgSizes[size]}
          className="w-full h-full object-contain p-1.5"
          onError={() => setImgError(true)}
          loading="lazy"
        />
      </div>
    )
  }

  // Fallback: colored letter
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
