'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  Rocket, Star, ExternalLink, Sparkles, Trophy,
  ArrowRight, Calendar, Clock, Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import StartupLogo from '@/components/StartupLogo'
import LaunchCountdown from '@/components/LaunchCountdown'
import type { Startup } from '@/lib/fallback-data'
import { getCategoryColor, getCategoryIcon } from '@/lib/fallback-data'

interface LaunchDayData {
  launches: Startup[]
  recentLaunches: Startup[]
  date: string
}

// Stagger animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Featured launch card with gradient border (matching homepage Premium Plus style)
function LaunchCard({ startup, index }: { startup: Startup; index: number }) {
  const [voted, setVoted] = useState(false)
  const [upvotes, setUpvotes] = useState(startup.upvotes)

  const handleVote = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (typeof window === 'undefined') return
    const sessionId = localStorage.getItem('revolaunch_session')
    if (!sessionId) return

    try {
      const res = await fetch(`/api/startups/${startup.slug}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })
      const data = await res.json()
      if (data.voted) {
        setVoted(true)
      } else {
        setVoted(false)
      }
      if (typeof data.upvotes === 'number') {
        setUpvotes(data.upvotes)
      }
    } catch {
      // silently fail
    }
  }

  return (
    <motion.div
      variants={cardVariants}
      className="group relative"
    >
      <Link href={`/startup/${startup.slug}`} className="block relative z-10 h-full">
        {/* Gradient border wrapper */}
        <div className="absolute -inset-[2px] rounded-2xl bg-gradient-to-br from-orange-400 via-amber-400 to-orange-500 opacity-70 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Card */}
        <div className="relative bg-background rounded-2xl p-6 h-full flex flex-col">
          {/* Launch Day badge + rank */}
          <div className="flex items-center justify-between mb-4">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-orange-500 bg-orange-500/10 px-2.5 py-1 rounded-full">
              <Rocket className="w-3 h-3" />
              Launch Day
            </span>
            <span className="text-[11px] font-medium text-muted-foreground">
              #{index + 1}
            </span>
          </div>

          {/* Logo + Name */}
          <div className="flex items-center gap-3 mb-3">
            <StartupLogo
              name={startup.name}
              logo={startup.logo}
              website={startup.website}
              logoColor={startup.logoColor}
              size="lg"
            />
            <div className="min-w-0">
              <h3 className="font-bold text-base text-foreground truncate group-hover:text-orange-500 transition-colors">
                {startup.name}
              </h3>
              <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium ${getCategoryColor(startup.category)}`}>
                {getCategoryIcon(startup.category)} {startup.category}
              </span>
            </div>
          </div>

          {/* Tagline */}
          <p className="text-sm text-muted-foreground line-clamp-2 mb-5 flex-1">
            {startup.tagline}
          </p>

          {/* Countdown if launchDate exists */}
          {startup.launchDate && (
            <div className="mb-4">
              <LaunchCountdown launchDate={startup.launchDate} />
            </div>
          )}

          {/* Footer: stars + link */}
          <div className="flex items-center justify-between pt-4 border-t border-border" onClick={e => e.stopPropagation()}>
            <button
              onClick={handleVote}
              className={`flex items-center gap-1.5 transition-colors ${
                voted
                  ? 'text-orange-500'
                  : 'text-muted-foreground hover:text-orange-500'
              }`}
            >
              <Star className={`w-4 h-4 ${voted ? 'fill-orange-500' : ''}`} />
              <span className="text-sm font-semibold tabular-nums">{upvotes}</span>
            </button>
            <a
              href={startup.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-orange-500 hover:text-orange-600 transition-colors"
            >
              Visit
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Subtle glow on hover */}
        <div className="absolute -inset-4 rounded-3xl bg-orange-500/0 group-hover:bg-orange-500/5 transition-all duration-300 -z-10 blur-xl" />
      </Link>
    </motion.div>
  )
}

// Recently launched card (simpler style)
function RecentLaunchCard({ startup }: { startup: Startup }) {
  const [voted, setVoted] = useState(false)
  const [upvotes, setUpvotes] = useState(startup.upvotes)

  const handleVote = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (typeof window === 'undefined') return
    const sessionId = localStorage.getItem('revolaunch_session')
    if (!sessionId) return

    try {
      const res = await fetch(`/api/startups/${startup.slug}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })
      const data = await res.json()
      if (data.voted) {
        setVoted(true)
      } else {
        setVoted(false)
      }
      if (typeof data.upvotes === 'number') {
        setUpvotes(data.upvotes)
      }
    } catch {
      // silently fail
    }
  }

  return (
    <motion.div
      variants={cardVariants}
      className="group"
    >
      <Link href={`/startup/${startup.slug}`} className="block">
        <div className="group rounded-xl border border-border hover:border-orange-500/30 transition-all duration-200 p-5">
          <div className="flex items-start gap-4">
            {/* Logo */}
            <StartupLogo
              name={startup.name}
              logo={startup.logo}
              website={startup.website}
              logoColor={startup.logoColor}
              size="md"
            />

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm text-foreground truncate group-hover:text-orange-500 transition-colors">
                  {startup.name}
                </h3>
                {startup.featured && (
                  <Sparkles className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                )}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                {startup.tagline}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`inline-flex items-center text-[10px] px-2 py-0.5 rounded-full font-medium ${getCategoryColor(startup.category)}`}>
                  {getCategoryIcon(startup.category)} {startup.category}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {startup.stage}
                </span>
              </div>
            </div>

            {/* Right side - vote + link */}
            <div className="flex items-center gap-3 shrink-0" onClick={e => e.stopPropagation()}>
              <button
                onClick={handleVote}
                className={`flex items-center gap-1 transition-colors ${
                  voted
                    ? 'text-orange-500'
                    : 'text-muted-foreground hover:text-orange-500'
                }`}
              >
                <Star className={`w-4 h-4 ${voted ? 'fill-orange-500' : ''}`} />
                <span className="text-xs font-semibold tabular-nums">{upvotes}</span>
              </button>
              <a
                href={startup.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-orange-500 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export default function LaunchDayPage() {
  const [data, setData] = useState<LaunchDayData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/launch-today')
        const json = await res.json()
        setData(json)
      } catch {
        // stay null
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const todayStr = data?.date || new Date().toISOString().split('T')[0]
  const launches = data?.launches || []
  const recentLaunches = data?.recentLaunches || []

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          {/* Subtle background gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 via-orange-500/0 to-transparent pointer-events-none" />

          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-28 pb-12 sm:pb-16 text-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Date badge */}
              <div className="inline-flex items-center gap-2 text-orange-500 mb-4">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-medium">{formatDate(todayStr)}</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground leading-tight">
                Today&apos;s{' '}
                <span className="text-orange-500">Launches</span>
              </h1>
              <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
                Be the first to discover and support the newest startups launching today.
              </p>

              {/* Live indicator */}
              <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-xs font-medium text-emerald-500">Live</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Loading State */}
        {loading && (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
          </div>
        )}

        {/* No Launches Today */}
        {!loading && launches.length === 0 && (
          <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-center py-16"
            >
              <div className="w-20 h-20 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto mb-6">
                <Rocket className="w-10 h-10 text-orange-500" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-3">
                No launches scheduled for today
              </h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mb-8">
                There are no startups launching today. Check back tomorrow or be the first to launch your startup!
              </p>
              <div className="flex items-center justify-center gap-3">
                <Link href="/submit">
                  <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl h-11 px-6">
                    <Rocket className="w-4 h-4 mr-2" />
                    Submit Your Startup
                  </Button>
                </Link>
                <Link href="/startups">
                  <Button variant="outline" size="lg" className="text-muted-foreground hover:text-foreground rounded-xl h-11 px-6">
                    Browse All Startups
                  </Button>
                </Link>
              </div>
            </motion.div>
          </section>
        )}

        {/* Today's Launches Grid */}
        {!loading && launches.length > 0 && (
          <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="mb-8"
            >
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="w-5 h-5 text-orange-500" />
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                  Launching Today
                </h2>
                <span className="text-sm text-muted-foreground font-normal ml-1">
                  ({launches.length})
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Startups scheduled to launch today — give them your support!
              </p>
            </motion.div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
            >
              {launches.map((startup, index) => (
                <LaunchCard key={startup.id} startup={startup} index={index} />
              ))}
            </motion.div>
          </section>
        )}

        {/* Recently Launched Section */}
        {!loading && recentLaunches.length > 0 && (
          <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="mb-8"
            >
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                  Recently Launched
                </h2>
                <span className="text-sm text-muted-foreground font-normal ml-1">
                  ({recentLaunches.length})
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Featured startups that launched in the last 7 days
              </p>
            </motion.div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="space-y-3"
            >
              {recentLaunches.map((startup) => (
                <RecentLaunchCard key={startup.id} startup={startup} />
              ))}
            </motion.div>
          </section>
        )}

        {/* CTA Section */}
        {!loading && (
          <section className="py-16 sm:py-20">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 via-orange-500 to-amber-500 p-8 sm:p-12 text-center"
              >
                {/* Background decoration */}
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
                  <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-amber-300/10 blur-3xl" />
                </div>

                <div className="relative z-10">
                  <h2 className="text-2xl sm:text-4xl font-bold text-white mb-3">
                    Ready to launch?
                  </h2>
                  <p className="text-sm sm:text-base text-white/80 max-w-md mx-auto mb-8">
                    Schedule your launch day and get discovered by thousands of founders, investors & early adopters.
                  </p>
                  <Link href="/pricing">
                    <Button
                      size="lg"
                      className="bg-white text-orange-600 hover:bg-white/90 font-semibold rounded-xl h-12 px-8 text-sm"
                    >
                      View Launch Plans
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  )
}
