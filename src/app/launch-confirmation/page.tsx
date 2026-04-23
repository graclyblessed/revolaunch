'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Rocket, ExternalLink, Star, Mail, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

function LaunchConfirmationContent() {
  const searchParams = useSearchParams()
  const startupName = searchParams.get('name') || 'Your Startup'
  const startupUrl = searchParams.get('url') || ''
  const founderName = searchParams.get('founder') || 'founder'
  const founderEmail = searchParams.get('email') || ''

  const domain = startupUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-[80vh] flex items-center justify-center p-4"
    >
      <div className="max-w-lg w-full">
        {/* Email-style card */}
        <div className="rounded-2xl border subtle-border surface overflow-hidden">
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b subtle-border">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                <Rocket className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Where startups begin.</p>
                <p className="text-sm font-medium text-foreground">Revolaunch</p>
              </div>
            </div>
            <h1 className="text-lg font-bold text-foreground">
              Your listing for {domain} is live on Revolaunch, but not complete yet.
            </h1>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-4">
            <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
              <p>Hi {founderName},</p>
              <p>
                Your listing for <span className="text-blue-500 font-medium">{startupName}</span> is live on Revolaunch, but not complete yet.
              </p>
              <p>
                Finish it by adding photos, highlights, and links so visitors quickly understand what you do.
              </p>
              <p className="text-faint text-xs">
                Complete your listing
              </p>
              <p className="text-faint text-xs">
                It only takes about a minute.
              </p>
            </div>

            {/* CTA */}
            <Button
              asChild
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl h-12"
            >
              <Link href="/dashboard">
                Complete your listing
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>

            {/* Stats preview */}
            <div className="rounded-xl border subtle-border bg-muted p-4 mt-4">
              <p className="text-xs text-muted-foreground mb-3">Your listing is ready to collect:</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <Star className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-foreground">0</p>
                  <p className="text-[10px] text-muted-foreground">Stars</p>
                </div>
                <div className="text-center">
                  <Rocket className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-foreground">#0</p>
                  <p className="text-[10px] text-muted-foreground">Weekly Rank</p>
                </div>
                <div className="text-center">
                  <Mail className="w-4 h-4 text-green-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-foreground">0</p>
                  <p className="text-[10px] text-muted-foreground">Views</p>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="space-y-2 mt-4">
              <p className="text-xs text-muted-foreground font-medium">Tips to rank higher:</p>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">→</span>
                  Add a logo and cover image
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">→</span>
                  Share your listing with your network
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">→</span>
                  Offer exclusive perks to the community
                </li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t subtle-border bg-muted/50">
            <p className="text-[11px] text-muted-foreground">
              - Taylor<br />
              Founder, Revolaunch
            </p>
          </div>
        </div>

        {/* Back to home */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to homepage
          </Link>
        </div>
      </div>
    </motion.div>
  )
}

export default function LaunchConfirmationPage() {
  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      }>
        <LaunchConfirmationContent />
      </Suspense>
    </div>
  )
}
