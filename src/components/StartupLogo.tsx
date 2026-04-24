'use client'

import { useState, useRef, useEffect } from 'react'

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

function buildLogoUrls(logo: string | null | undefined, website: string | undefined): string[] {
  const urls: string[] = []
  const clearbitUrl = logo || (website ? getClearbitLogoUrl(website) : null)
  if (clearbitUrl) urls.push(clearbitUrl)
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
  const [imageLoaded, setImageLoaded] = useState(false)

  useEffect(() => {
    const urls = buildLogoUrls(logo, website)
    urlListRef.current = urls
    triedUrls.current.clear()
    setImageLoaded(false)
    if (urls.length > 0) {
      setCurrentSrc(urls[0])
      triedUrls.current.add(urls[0])
    } else {
      setCurrentSrc(null)
    }
  }, [logo, website])

  const handleImageError = () => {
    setImageLoaded(false)
    const nextUrl = urlListRef.current.find(u => !triedUrls.current.has(u))
    if (nextUrl) {
      triedUrls.current.add(nextUrl)
      setCurrentSrc(nextUrl)
    } else {
      setCurrentSrc(null)
    }
  }

  const handleImageLoad = () => {
    setImageLoaded(true)
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-xl flex items-center justify-center shrink-0 overflow-hidden relative ${className}`}
      style={{ backgroundColor: color + '22' }}
    >
      <span
        className={`font-bold absolute transition-opacity duration-200 ${imageLoaded ? 'opacity-0' : 'opacity-100'}`}
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
          className={`w-full h-full object-contain p-1.5 relative z-10 transition-opacity duration-200 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          onError={handleImageError}
          onLoad={handleImageLoad}
          loading="lazy"
        />
      )}
    </div>
  )
}
