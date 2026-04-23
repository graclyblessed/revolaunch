'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  Search, Star, ExternalLink, Rocket, TrendingUp, Globe,
  Building2, ChevronRight, Filter, SlidersHorizontal, Loader2, X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import Header from '@/components/Header'
import StartupCard, { StartupCardFull } from '@/components/StartupCard'
import WeeklyLeaderboard from '@/components/WeeklyLeaderboard'
import {
  fallbackStartups, fallbackWeeklyWinners, fallbackStats,
  fallbackCategories, getCategoryColor, getCategoryIcon, getStageColor,
} from '@/lib/fallback-data'
import type { Startup } from '@/lib/fallback-data'

// Session helper
function getSessionId() {
  if (typeof window === 'undefined') return ''
  let sid = localStorage.getItem('revolaunch_session')
  if (!sid) {
    sid = Math.random().toString(36).substring(2) + Date.now().toString(36)
    localStorage.setItem('revolaunch_session', sid)
  }
  return sid
}

export default function Home() {
  const [startups, setStartups] = useState<Startup[]>([])
  const [stats, setStats] = useState(fallbackStats)
  const [categories, setCategories] = useState(fallbackCategories)
  const [loading, setLoading] = useState(true)
  const [votedStartups, setVotedStartups] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedStage, setSelectedStage] = useState('all')
  const [sort, setSort] = useState('popular')
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  // Load data
  useEffect(() => {
    async function loadData() {
      try {
        const [startupsRes, statsRes, categoriesRes] = await Promise.allSettled([
          fetch('/api/startups?limit=24&sort=popular').then(r => r.json()),
          fetch('/api/stats').then(r => r.json()),
          fetch('/api/categories').then(r => r.json()),
        ])

        const startupsData = startupsRes.status === 'fulfilled' ? startupsRes.value : {}
        const statsData = statsRes.status === 'fulfilled' ? statsRes.value : null
        const categoriesData = categoriesRes.status === 'fulfilled' ? categoriesRes.value : {}

        if (Array.isArray(startupsData.startups) && startupsData.startups.length > 0) {
          setStartups(startupsData.startups)
        } else {
          setStartups(fallbackStartups)
        }
        if (statsData && typeof statsData === 'object' && !statsData.error) {
          setStats(statsData)
        }
        if (Array.isArray(categoriesData.categories) && categoriesData.categories.length > 0) {
          setCategories(categoriesData.categories)
        }
      } catch {
        setStartups(fallbackStartups)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Filter startups client-side
  const filteredStartups = startups.filter(s => {
    if (selectedCategory !== 'all' && s.category !== selectedCategory) return false
    if (selectedStage !== 'all' && s.stage !== selectedStage) return false
    if (search) {
      const q = search.toLowerCase()
      return s.name.toLowerCase().includes(q) || s.tagline.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)
    }
    return true
  })

  const sortedStartups = [...filteredStartups].sort((a, b) => {
    if (sort === 'popular') return b.upvotes - a.upvotes
    if (sort === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    return 0
  })

  const displayedStartups = sortedStartups.slice(0, 24)

  const handleVote = async (slug: string) => {
    const sessionId = getSessionId()
    try {
      const res = await fetch(`/api/startups/${slug}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })
      const data = await res.json()
      if (data.voted) {
        setVotedStartups(prev => new Set([...prev, slug]))
        toast.success('Starred!')
      } else {
        setVotedStartups(prev => {
          const next = new Set(prev)
          next.delete(slug)
          return next
        })
      }
      if (typeof data.upvotes === 'number') {
        setStartups(prev => prev.map(s => s.slug === slug ? { ...s, upvotes: data.upvotes } : s))
      }
    } catch {
      toast.error('Failed to vote')
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b subtle-border">
          <div className="absolute inset-0 hero-gradient" />
          <div className="absolute top-0 left-1/4 w-96 h-96 glow-blob-blue rounded-full blur-[100px]" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 glow-blob-purple rounded-full blur-[100px]" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center max-w-3xl mx-auto"
            >
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-4">
                Get funded. Get acquired.{' '}
                <span className="gradient-text-blue">Get seen.</span>
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground mb-8">
                Rank higher with stars. Invite network or boost.
              </p>

              <div className="flex items-center justify-center gap-3">
                <Link href="/submit">
                  <Button size="lg" className="bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl h-11 px-6 shadow-lg shadow-blue-500/20">
                    <Rocket className="w-4 h-4 mr-2" />
                    List Your Startup
                  </Button>
                </Link>
                <Link href="/inside">
                  <Button variant="outline" size="lg" className="text-muted-foreground hover:text-foreground rounded-xl h-11 px-6">
                    For Investors
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>

              {/* Quick stats */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex items-center justify-center gap-6 mt-10"
              >
                <div className="text-center">
                  <div className="text-xl font-bold text-foreground">{stats.totalStartups}+</div>
                  <div className="text-xs text-muted-foreground">Startups</div>
                </div>
                <div className="w-px h-8 bg-border" />
                <div className="text-center">
                  <div className="text-xl font-bold text-foreground">{stats.totalVotes}+</div>
                  <div className="text-xs text-muted-foreground">Stars</div>
                </div>
                <div className="w-px h-8 bg-border hidden sm:block" />
                <div className="hidden sm:block text-center">
                  <div className="text-xl font-bold text-foreground">{stats.totalCategories}+</div>
                  <div className="text-xs text-muted-foreground">Categories</div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Main Content - Two Column Layout */}
        <section id="startups" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Column - Main Content */}
            <div className="flex-1 min-w-0">
              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search startups..."
                    className="pl-10 h-10 input-bg input-bg-focus text-sm text-foreground rounded-xl"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Select value={sort} onValueChange={setSort}>
                    <SelectTrigger className="w-[140px] h-10 input-bg text-sm rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="popover-bg border-border">
                      <SelectItem value="popular">Most Stars</SelectItem>
                      <SelectItem value="newest">Newest</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 text-muted-foreground hover:text-foreground rounded-xl"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Filter chips */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 flex flex-wrap gap-2"
                  >
                    <Select value={selectedCategory} onValueChange={v => setSelectedCategory(v)}>
                      <SelectTrigger className="w-[160px] h-9 input-bg text-xs rounded-lg">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent className="popover-bg border-border">
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map(c => (
                          <SelectItem key={c.name} value={c.name}>
                            {getCategoryIcon(c.name)} {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={selectedStage} onValueChange={v => setSelectedStage(v)}>
                      <SelectTrigger className="w-[130px] h-9 input-bg text-xs rounded-lg">
                        <SelectValue placeholder="Stage" />
                      </SelectTrigger>
                      <SelectContent className="popover-bg border-border">
                        <SelectItem value="all">All Stages</SelectItem>
                        <SelectItem value="Pre-seed">Pre-seed</SelectItem>
                        <SelectItem value="Seed">Seed</SelectItem>
                        <SelectItem value="Series A">Series A</SelectItem>
                        <SelectItem value="Series B">Series B</SelectItem>
                      </SelectContent>
                    </Select>
                    {(selectedCategory !== 'all' || selectedStage !== 'all' || search) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => { setSelectedCategory('all'); setSelectedStage('all'); setSearch('') }}
                      >
                        <X className="w-3 h-3 mr-1" />
                        Clear
                      </Button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Category pills */}
              <div className="flex flex-wrap gap-1.5 mb-6 overflow-x-auto pb-1">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`text-[11px] px-3 py-1.5 rounded-full font-medium transition-colors shrink-0 ${
                    selectedCategory === 'all'
                      ? 'bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-500/30'
                      : 'bg-muted text-muted-foreground hover:text-foreground border border-transparent'
                  }`}
                >
                  All
                </button>
                {categories.map(c => (
                  <button
                    key={c.name}
                    onClick={() => setSelectedCategory(c.name)}
                    className={`text-[11px] px-3 py-1.5 rounded-full font-medium transition-colors shrink-0 ${
                      selectedCategory === c.name
                        ? 'bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-500/30'
                        : 'bg-muted text-muted-foreground hover:text-foreground border border-transparent'
                    }`}
                  >
                    {c.icon} {c.name}
                  </button>
                ))}
              </div>

              {/* Startups Grid */}
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-32 rounded-xl skeleton-bg animate-pulse" />
                  ))}
                </div>
              ) : displayedStartups.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-muted-foreground">No startups found matching your criteria.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <AnimatePresence>
                    {displayedStartups.map((startup) => (
                      <StartupCardFull
                        key={startup.id}
                        startup={startup}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Right Column - Sidebar */}
            <div className="w-full lg:w-[340px] shrink-0 space-y-4">
              {/* Weekly Leaderboard */}
              <div className="lg:sticky lg:top-[72px]">
                <WeeklyLeaderboard winners={fallbackWeeklyWinners} />

                {/* Quick community boards */}
                <div className="mt-4 rounded-xl border subtle-border surface overflow-hidden">
                  <div className="p-4 border-b subtle-border">
                    <h2 className="text-sm font-semibold text-foreground">Community Boards</h2>
                  </div>
                  <div className="divide-y divide-border">
                    {[
                      { name: 'MRR Board', count: '42', icon: '📊', href: '/community?type=mrr-board' },
                      { name: 'Weekly Board', count: '1.4K', icon: '🏆', href: '/community?type=weekly-board' },
                      { name: 'Raising Capital', count: '89', icon: '💰', href: '/community?type=raising-capital' },
                      { name: 'Job Board', count: '0', icon: '💼', href: '/community?type=job-board' },
                    ].map((board) => (
                      <Link
                        key={board.name}
                        href={board.href}
                        className="flex items-center gap-3 px-4 py-3 surface-hover transition-colors"
                      >
                        <span className="text-lg">{board.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground">{board.name}</p>
                        </div>
                        <span className="text-xs text-muted-foreground font-medium">{board.count}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                      </Link>
                    ))}
                  </div>
                </div>

                {/* CTA */}
                <div className="mt-4 rounded-xl border border-blue-500/20 card-active-bg p-4">
                  <h3 className="text-sm font-semibold text-foreground mb-1">Win the Week</h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    Rank #1 on the weekly leaderboard and get featured to 50K+ visitors.
                  </p>
                  <Link href="/submit">
                    <Button size="sm" className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg h-9 text-xs">
                      <Rocket className="w-3.5 h-3.5 mr-1.5" />
                      Launch Now
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t subtle-border mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                <Rocket className="w-3 h-3 text-white" />
              </div>
              <span className="text-sm text-muted-foreground">
                Where startups begin.
              </span>
            </div>
            <div className="flex items-center gap-6 text-xs text-muted-foreground">
              <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
              <Link href="/community" className="hover:text-foreground transition-colors">Community</Link>
              <Link href="/inside" className="hover:text-foreground transition-colors">Inside</Link>
              <Link href="/submit" className="hover:text-foreground transition-colors">Launch</Link>
            </div>
            <p className="text-xs text-muted-foreground">
              © 2025 Revolaunch
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
