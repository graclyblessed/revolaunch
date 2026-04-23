'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Rocket, ExternalLink, Star, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface LaunchConfirmationProps {
  startupName: string
  startupUrl: string
  founderName: string
  founderEmail: string
}

export default function LaunchConfirmation({ startupName, startupUrl, founderEmail }: LaunchConfirmationProps) {
  const domain = startupUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen flex items-center justify-center p-4 bg-black"
    >
      <div className="max-w-lg w-full">
        {/* Email-style card */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#0a0a0a] overflow-hidden">
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                <Rocket className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-500">from</p>
                <p className="text-sm font-medium text-white">Revolaunch</p>
              </div>
            </div>
            <h1 className="text-xl font-bold text-white">
              Your listing for {domain} is live
            </h1>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-4">
            <div className="space-y-3 text-sm text-gray-300 leading-relaxed">
              <p>
                Hi {founderName},
              </p>
              <p>
                Your listing for <span className="text-blue-400 font-medium">{startupName}</span> is now live on Revolaunch, but not complete yet.
              </p>
              <p>
                Finish it by adding photos, highlights, and links so visitors quickly understand what you do.
              </p>
              <p className="text-gray-400 text-xs">
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
                <ExternalLink className="w-4 h-4 ml-2" />
              </Link>
            </Button>

            {/* Stats preview */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 mt-4">
              <p className="text-xs text-gray-500 mb-3">Your listing is ready to collect:</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <Star className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                  <p className="text-lg font-bold text-white">0</p>
                  <p className="text-[10px] text-gray-500">Stars</p>
                </div>
                <div className="text-center">
                  <Rocket className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                  <p className="text-lg font-bold text-white">#0</p>
                  <p className="text-[10px] text-gray-500">Weekly Rank</p>
                </div>
                <div className="text-center">
                  <Mail className="w-4 h-4 text-green-400 mx-auto mb-1" />
                  <p className="text-lg font-bold text-white">0</p>
                  <p className="text-[10px] text-gray-500">Views</p>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="space-y-2 mt-4">
              <p className="text-xs text-gray-500 font-medium">Tips to rank higher:</p>
              <ul className="space-y-1.5 text-xs text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">→</span>
                  Add a logo and cover image
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">→</span>
                  Share your listing with your network
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">→</span>
                  Offer exclusive perks to the community
                </li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-white/[0.06] bg-white/[0.01]">
            <p className="text-[11px] text-gray-600">
              - Taylor, Founder at Revolaunch
            </p>
          </div>
        </div>

        {/* Back to home */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-white transition-colors"
          >
            ← Back to homepage
          </Link>
        </div>
      </div>
    </motion.div>
  )
}
