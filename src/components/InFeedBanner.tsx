'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, ExternalLink, Megaphone } from 'lucide-react'

export interface BannerData {
  id: string
  headline: string
  description: string | null
  ctaText: string
  ctaUrl: string
  imageUrl: string | null
  logoUrl: string | null
  position: number
}

const STORAGE_KEY = 'revolaunch_banner_dismissed'

export default function InFeedBanner({ banner }: { banner: BannerData }) {
  const [dismissed, setDismissed] = useState(false)
  const [visible, setVisible] = useState(false)

  // Check if this specific banner was already dismissed
  useEffect(() => {
    try {
      const dismissedId = localStorage.getItem(STORAGE_KEY)
      if (dismissedId === banner.id) {
        setDismissed(true)
        return
      }
      // Auto-show after a small delay for smooth UX
      const timer = setTimeout(() => setVisible(true), 300)
      return () => clearTimeout(timer)
    } catch {
      setVisible(true)
    }
  }, [banner.id])

  const handleDismiss = () => {
    setDismissed(true)
    setVisible(false)
    try {
      localStorage.setItem(STORAGE_KEY, banner.id)
    } catch {}
  }

  const handleClick = async () => {
    // Track click in background
    try {
      await fetch('/api/banners/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bannerId: banner.id }),
      })
    } catch {}
    // Open sponsor link in new tab
    window.open(banner.ctaUrl, '_blank', 'noopener,noreferrer')
  }

  if (dismissed || !visible) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      className="relative group"
    >
      <div
        className={`
          relative rounded-2xl border overflow-hidden transition-all duration-300
          ${banner.imageUrl
            ? 'border-border hover:border-orange-500/30'
            : 'border-orange-500/20 bg-gradient-to-r from-orange-500/5 via-orange-500/10 to-amber-500/5 hover:border-orange-500/40'
          }
        `}
      >
        {/* Background image (optional) */}
        {banner.imageUrl && (
          <div className="absolute inset-0 z-0">
            <img
              src={banner.imageUrl}
              alt=""
              className="w-full h-full object-cover opacity-20 group-hover:opacity-30 transition-opacity"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/70" />
          </div>
        )}

        {/* Content */}
        <div className="relative z-10 p-5">
          <div className="flex items-start gap-4">
            {/* Logo */}
            <div className="shrink-0">
              {banner.logoUrl ? (
                <img
                  src={banner.logoUrl}
                  alt=""
                  className="w-11 h-11 rounded-xl object-cover border border-border"
                />
              ) : (
                <div className="w-11 h-11 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <Megaphone className="w-5 h-5 text-orange-500" />
                </div>
              )}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-sm text-foreground truncate">
                  {banner.headline}
                </h3>
                <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full shrink-0">
                  Sponsored
                </span>
              </div>
              {banner.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {banner.description}
                </p>
              )}
            </div>

            {/* CTA + Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleClick}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-orange-500 hover:text-orange-600 bg-orange-500/10 hover:bg-orange-500/20 px-3 py-1.5 rounded-lg transition-all"
              >
                {banner.ctaText || 'Learn More'}
                <ExternalLink className="w-3 h-3" />
              </button>
              <button
                onClick={handleDismiss}
                className="p-1 rounded-md text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/50 transition-colors"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
