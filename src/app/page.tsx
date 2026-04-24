'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  Search, Star, ExternalLink, Rocket,
  X, SlidersHorizontal, Sparkles, Trophy,
  ArrowRight, Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import Header from '@/components/Header'
import StartupLogo from '@/components/StartupLogo'
import FollowButton from '@/components/FollowButton'
import { useFollowing } from '@/hooks/use-following'
import {
  fallbackStartups, fallbackStats,
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
  const [sponsors, setSponsors] = useState<Array<{id:string,companyName:string,logo:string|null,website:string,tagline:string|null}>>([])
  const [loading, setLoading] = useState(true)
  const [votedStartups, setVotedStartups] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedStage, setSelectedStage] = useState('all')
  const [sort, setSort] = useState('popular')
  const [showFilters, setShowFilters] = useState(false)
  const { isFollowing, toggleFollow, getFollowerCount } = useFollowing()

  useEffect(() => {
    async function loadData() {
      try {
        const [startupsRes, statsRes, categoriesRes, sponsorsRes] = await Promise.allSettled([
          fetch('/api/startups?limit=24&sort=popular').then(r => r.json()),
          fetch('/api/stats').then(r => r.json()),
          fetch('/api/categories').then(r => r.json()),
          fetch('/api/sponsors').then(r => r.json()),
        ])

        const startupsData = startupsRes.status === 'fulfilled' ? startupsRes.value : {}
        const statsData = statsRes.status === 'fulfilled' ? statsRes.value : null
        const categoriesData = categoriesRes.status === 'fulfilled' ? categoriesRes.value : {}
        const sponsorsData = sponsorsRes.status === 'fulfilled' ? sponsorsRes.value : null

        if (sponsorsData && Array.isArray(sponsorsData.sponsors)) {
          setSponsors(sponsorsData.sponsors.filter((s: {status:string}) => s.status === 'active'))
        }

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

  // Get top 3 featured startups for Premium Plus section
  const premiumStartups = useMemo(() => {
    return [...startups]
      .filter(s => s.featured)
      .sort((a, b) => b.upvotes - a.upvotes)
      .slice(0, 3)
  }, [startups])

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
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-28 pb-16 sm:pb-24 text-center">
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

        {/* =============================================
            Premium Plus Spot — Featured Startups
            ============================================= */}
        {premiumStartups.length > 0 && (
          <section className="py-16 sm:py-20">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Section heading */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="text-center mb-10"
              >
                <div className="inline-flex items-center gap-2 text-orange-500 mb-3">
                  <Sparkles className="w-5 h-5" />
                  <span className="text-sm font-semibold tracking-wide uppercase">Premium Plus</span>
                  <Sparkles className="w-5 h-5" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                  Top featured startups this week
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Hand-picked by our team for exceptional innovation
                </p>
              </motion.div>

              {/* Premium cards grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {premiumStartups.map((startup, index) => (
                  <motion.div
                    key={startup.id}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="group relative"
                  >
                    {/* Gradient border wrapper */}
                    <div className="absolute -inset-[2px] rounded-2xl bg-gradient-to-br from-orange-400 via-amber-400 to-orange-500 opacity-70 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Card */}
                    <div className="relative bg-background rounded-2xl p-6 h-full flex flex-col">
                      {/* Featured badge */}
                      <div className="flex items-center justify-between mb-4">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-orange-500 bg-orange-500/10 px-2.5 py-1 rounded-full">
                          <Trophy className="w-3 h-3" />
                          Featured
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
                          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                            {startup.category}
                          </span>
                        </div>
                      </div>

                      {/* Tagline */}
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-5 flex-1">
                        {startup.tagline}
                      </p>

                      {/* Footer: stars + link */}
                      <div className="flex items-center justify-between pt-4 border-t border-border">
                        <button
                          onClick={() => handleVote(startup.slug)}
                          className={`flex items-center gap-1.5 transition-colors ${
                            votedStartups.has(startup.slug)
                              ? 'text-orange-500'
                              : 'text-muted-foreground hover:text-orange-500'
                          }`}
                        >
                          <Star className={`w-4 h-4 ${votedStartups.has(startup.slug) ? 'fill-orange-500' : ''}`} />
                          <span className="text-sm font-semibold tabular-nums">{startup.upvotes}</span>
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
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* =============================================
            Trending Startups + Right Sidebar
            ============================================= */}
        <section id="startups" className="py-16 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section heading */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="mb-8"
            >
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-orange-500" />
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                  Trending Startups
                </h2>
                {!loading && (
                  <span className="text-sm text-muted-foreground font-normal ml-1">
                    ({filteredStartups.length})
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Discover the latest and most popular startups in our community
              </p>
            </motion.div>

            <div className="flex gap-8">
            {/* Main content column */}
            <div className="flex-1 min-w-0">

            {/* Toolbar — search + sort, clean row */}
            <div className="flex items-center gap-3 mb-6">
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

                        {/* Right side — star + follow + link */}
                        <div className="flex items-center gap-3 shrink-0">
                          <FollowButton
                            isFollowing={isFollowing(startup.id)}
                            followerCount={getFollowerCount(startup.id)}
                            onToggle={() => toggleFollow(startup.id)}
                            size="sm"
                          />
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
            </div>
            {/* Floating Right Sidebar — Sponsors */}
            <aside className="hidden lg:block w-64 xl:w-72 shrink-0">
              <div className="sticky top-20 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Sponsors
                  </p>
                  <Link href="/sponsor" className="text-[10px] text-orange-500 hover:text-orange-400 font-medium transition-colors">
                    Become one
                  </Link>
                </div>
                {sponsors.length > 0 ? sponsors.slice(0, 4).map((sponsor) => (
                  <a
                    key={sponsor.id}
                    href={sponsor.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full aspect-[3/1] rounded-xl border border-border hover:border-orange-500/30 transition-all duration-200 group overflow-hidden"
                  >
                    <div className="w-full h-full flex items-center justify-center p-3 hover:bg-muted/30 transition-colors">
                      {sponsor.logo ? (
                        <img src={sponsor.logo} alt={sponsor.companyName} className="max-h-full max-w-full object-contain" />
                      ) : (
                        <span className="text-[11px] font-semibold text-muted-foreground group-hover:text-orange-500 transition-colors truncate">
                          {sponsor.companyName}
                        </span>
                      )}
                    </div>
                  </a>
                )) : [...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="w-full aspect-[3/1] rounded-xl border-2 border-dashed border-border flex items-center justify-center hover:border-orange-500/30 transition-colors group cursor-pointer"
                    onClick={() => window.location.href = '/sponsor'}
                  >
                    <span className="text-[11px] text-muted-foreground/40 font-medium group-hover:text-orange-500/50 transition-colors">Your Logo</span>
                  </div>
                ))}
                <div className="rounded-lg border subtle-border bg-muted/30 p-3">
                  <p className="text-[10px] text-muted-foreground leading-relaxed mb-2">
                    Get your brand seen by thousands of founders, investors &amp; tech enthusiasts every month.
                  </p>
                  <Link href="/sponsor">
                    <span className="text-[11px] font-semibold text-orange-500 hover:text-orange-400 transition-colors">
                      Learn more →
                    </span>
                  </Link>
                </div>
              </div>
            </aside>
            </div>
          </div>
        </section>

        {/* =============================================
            CTA — Ready to launch?
            ============================================= */}
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
                  Join thousands of startups getting discovered by investors, early adopters, and the tech community.
                </p>
                <Link href="/submit">
                  <Button
                    size="lg"
                    className="bg-white text-orange-600 hover:bg-white/90 font-semibold rounded-xl h-12 px-8 text-sm"
                  >
                    Submit your startup
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
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
                &copy; {new Date().getFullYear()} Revolaunch &middot; Where startups begin
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
