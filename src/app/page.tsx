'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  Search, Star, ExternalLink, Rocket,
  ChevronRight, X, SlidersHorizontal
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import Header from '@/components/Header'
import { StartupCardFull } from '@/components/StartupCard'
import {
  fallbackStartups, fallbackWeeklyWinners, fallbackStats,
  fallbackCategories, getCategoryIcon,
} from '@/lib/fallback-data'
import type { Startup } from '@/lib/fallback-data'

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
  const [showFilters, setShowFilters] = useState(false)

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

  const displayedStartups = sortedStartups.slice(0, 12)

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
        {/* Hero — minimal, spacious */}
        <section className="relative overflow-hidden">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-28 pb-14 sm:pb-20 text-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground leading-tight">
                Where startups{' '}
                <span className="gradient-text-blue">get seen.</span>
              </h1>
              <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
                Discover, launch, and fund the most innovative startups. One community.
              </p>

              <div className="mt-8 flex items-center justify-center gap-3">
                <Link href="/submit">
                  <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl h-11 px-6">
                    <Rocket className="w-4 h-4 mr-2" />
                    Launch
                  </Button>
                </Link>
                <Link href="/about">
                  <Button variant="outline" size="lg" className="text-muted-foreground hover:text-foreground rounded-xl h-11 px-6">
                    Learn More
                  </Button>
                </Link>
              </div>

              {/* Stats — subtle, single line */}
              <p className="mt-10 text-xs text-muted-foreground">
                {stats.totalStartups}+ startups &middot; {stats.totalVotes}+ stars &middot; {stats.totalCategories} categories
              </p>
            </motion.div>
          </div>
        </section>

        {/* Startups Section */}
        <section id="startups" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          {/* Toolbar — search + sort, clean row */}
          <div className="flex items-center gap-3 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search startups..."
                className="pl-10 h-10 text-sm text-foreground rounded-xl"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-[130px] h-10 text-sm rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">Most Stars</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-xl shrink-0"
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="w-4 h-4" />
            </Button>
          </div>

          {/* Expandable filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 flex flex-wrap items-center gap-2"
              >
                <Select value={selectedCategory} onValueChange={v => setSelectedCategory(v)}>
                  <SelectTrigger className="w-[150px] h-9 text-xs rounded-lg">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(c => (
                      <SelectItem key={c.name} value={c.name}>
                        {getCategoryIcon(c.name)} {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedStage} onValueChange={v => setSelectedStage(v)}>
                  <SelectTrigger className="w-[120px] h-9 text-xs rounded-lg">
                    <SelectValue placeholder="Stage" />
                  </SelectTrigger>
                  <SelectContent>
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

          {/* Category pills — single clean row */}
          <div className="flex items-center gap-1.5 mb-8 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`text-xs px-3.5 py-1.5 rounded-full font-medium transition-colors whitespace-nowrap ${
                selectedCategory === 'all'
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All
            </button>
            {categories.map(c => (
              <button
                key={c.name}
                onClick={() => setSelectedCategory(c.name)}
                className={`text-xs px-3.5 py-1.5 rounded-full font-medium transition-colors whitespace-nowrap ${
                  selectedCategory === c.name
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {c.icon} {c.name}
              </button>
            ))}
          </div>

          {/* Startups Grid — single column, wider cards, more space */}
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-28 rounded-2xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : displayedStartups.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-sm">No startups found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {displayedStartups.map((startup) => (
                  <motion.div
                    key={startup.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="group rounded-2xl border border-border hover:border-orange-500/30 transition-all duration-200 p-5"
                  >
                    <div className="flex items-start gap-4">
                      {/* Logo */}
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: (startup.logoColor || '#F97316') + '18' }}
                      >
                        <span className="text-sm font-bold" style={{ color: startup.logoColor || '#F97316' }}>
                          {startup.name.charAt(0).toUpperCase()}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm text-foreground truncate group-hover:text-orange-500 transition-colors">
                            {startup.name}
                          </h3>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                            {startup.category}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium hidden sm:inline-flex">
                            {startup.stage}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                          {startup.tagline}
                        </p>
                      </div>

                      {/* Right side — star + link */}
                      <div className="flex items-center gap-4 shrink-0">
                        <button
                          onClick={() => handleVote(startup.slug)}
                          className={`flex items-center gap-1 transition-colors ${
                            votedStartups.has(startup.slug)
                              ? 'text-orange-500'
                              : 'text-muted-foreground hover:text-orange-500'
                          }`}
                        >
                          <Star className={`w-4 h-4 ${votedStartups.has(startup.slug) ? 'fill-orange-500' : ''}`} />
                          <span className="text-xs font-semibold tabular-nums">{startup.upvotes}</span>
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
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Load more hint */}
          {!loading && displayedStartups.length > 0 && (
            <div className="mt-10 text-center">
              <p className="text-xs text-muted-foreground">
                Showing {displayedStartups.length} of {filteredStartups.length} startups
              </p>
            </div>
          )}
        </section>
      </main>

      {/* Footer — minimal */}
      <footer className="border-t border-border mt-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center">
                <Rocket className="w-2.5 h-2.5 text-white" />
              </div>
              <span className="text-xs text-muted-foreground">
                Revolaunch &middot; Where startups begin
              </span>
            </div>
            <div className="flex items-center gap-5 text-xs text-muted-foreground">
              <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
              <Link href="/community" className="hover:text-foreground transition-colors">Community</Link>
              <Link href="/submit" className="hover:text-foreground transition-colors">Launch</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
