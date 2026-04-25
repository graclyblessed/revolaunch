'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  Search, Star, ExternalLink, Rocket,
  X, ArrowRight, ChevronLeft, ChevronRight, Zap, Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import StartupLogo from '@/components/StartupLogo'
import FollowButton from '@/components/FollowButton'
import {
  getCategoryIcon, getCategoryColor, getStageColor,
} from '@/lib/fallback-data'
import type { Startup } from '@/lib/fallback-data'
import { useFollowing } from '@/hooks/use-following'

function getSessionId() {
  if (typeof window === 'undefined') return ''
  let sid = localStorage.getItem('revolaunch_session')
  if (!sid) {
    sid = Math.random().toString(36).substring(2) + Date.now().toString(36)
    localStorage.setItem('revolaunch_session', sid)
  }
  return sid
}

const STAGES = ['Pre-seed', 'Seed', 'Series A', 'Series B', 'Growth']
const LIMIT = 24

export default function StartupsPage() {
  return (
    <Suspense fallback={<StartupsLoadingSkeleton />}>
      <StartupsContent />
    </Suspense>
  )
}

function StartupsLoadingSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <div className="text-center mb-12">
          <Skeleton className="h-10 w-64 mx-auto mb-4" />
          <Skeleton className="h-5 w-48 mx-auto" />
        </div>
        <Skeleton className="h-12 w-full max-w-xl mx-auto mb-8 rounded-2xl" />
        <div className="flex gap-3 mb-8 justify-center">
          <Skeleton className="h-10 w-40 rounded-xl" />
          <Skeleton className="h-10 w-36 rounded-xl" />
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      </main>
      <Footer />
    </div>
  )
}

function StartupsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  // Read initial values from URL
  const pageParam = parseInt(searchParams.get('page') || '1')
  const searchParam = searchParams.get('search') || ''
  const categoryParam = searchParams.get('category') || 'all'
  const stageParam = searchParams.get('stage') || 'all'
  const sortParam = searchParams.get('sort') || 'popular'

  const [startups, setStartups] = useState<Startup[]>([])
  const [categories, setCategories] = useState<Array<{ name: string; count: number; icon: string }>>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [votedStartups, setVotedStartups] = useState<Set<string>>(new Set())

  const [search, setSearch] = useState(searchParam)
  const [category, setCategory] = useState(categoryParam)
  const [stage, setStage] = useState(stageParam)
  const [sort, setSort] = useState(sortParam)
  const [page, setPage] = useState(pageParam)

  const { isFollowing, toggleFollow, getFollowerCount } = useFollowing()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync URL params -> state on navigation (back/forward)
  useEffect(() => {
    setSearch(searchParams.get('search') || '')
    setCategory(searchParams.get('category') || 'all')
    setStage(searchParams.get('stage') || 'all')
    setSort(searchParams.get('sort') || 'popular')
    setPage(parseInt(searchParams.get('page') || '1'))
  }, [searchParams])

  // Build query params and push to URL
  const updateUrl = useCallback((params: {
    page?: number
    search?: string
    category?: string
    stage?: string
    sort?: string
  }) => {
    const sp = new URLSearchParams()
    if (params.page && params.page > 1) sp.set('page', String(params.page))
    if (params.search && params.search.trim()) sp.set('search', params.search.trim())
    if (params.category && params.category !== 'all') sp.set('category', params.category)
    if (params.stage && params.stage !== 'all') sp.set('stage', params.stage)
    if (params.sort && params.sort !== 'popular') sp.set('sort', params.sort)

    const qs = sp.toString()
    router.push(qs ? `/startups?${qs}` : '/startups', { scroll: false })
  }, [router])

  // Fetch startups and categories
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('limit', String(LIMIT))
      params.set('page', String(page))
      params.set('sort', sort)
      if (search.trim()) params.set('search', search.trim())
      if (category !== 'all') params.set('category', category)
      if (stage !== 'all') params.set('stage', stage)

      const [startupsRes, categoriesRes] = await Promise.allSettled([
        fetch(`/api/startups?${params.toString()}`).then(r => r.json()),
        fetch('/api/categories').then(r => r.json()),
      ])

      const startupsData = startupsRes.status === 'fulfilled' ? startupsRes.value : {}
      const categoriesData = categoriesRes.status === 'fulfilled' ? categoriesRes.value : {}

      if (Array.isArray(startupsData.startups)) {
        setStartups(startupsData.startups)
        setTotal(startupsData.total || 0)
        setTotalPages(startupsData.totalPages || 1)
      } else {
        setStartups([])
        setTotal(0)
        setTotalPages(1)
      }

      if (Array.isArray(categoriesData.categories)) {
        setCategories(categoriesData.categories)
      }
    } catch {
      toast.error('Failed to load startups')
    } finally {
      setLoading(false)
    }
  }, [page, sort, search, category, stage])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Handlers that reset page to 1
  const handleSearchChange = (value: string) => {
    setSearch(value)
    // Debounce URL update + data fetch
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      updateUrl({ page: 1, search: value, category, stage, sort })
    }, 400)
  }

  const handleCategoryChange = (value: string) => {
    setCategory(value)
    updateUrl({ page: 1, search, category: value, stage, sort })
  }

  const handleStageChange = (value: string) => {
    setStage(value)
    updateUrl({ page: 1, search, category, stage: value, sort })
  }

  const handleSortChange = (value: string) => {
    setSort(value)
    updateUrl({ page: 1, search, category, stage, sort: value })
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    updateUrl({ page: newPage, search, category, stage, sort })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const clearFilters = () => {
    setSearch('')
    setCategory('all')
    setStage('all')
    setSort('popular')
    setPage(1)
    updateUrl({ page: 1, search: '', category: 'all', stage: 'all', sort: 'popular' })
  }

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

  const hasActiveFilters = search || category !== 'all' || stage !== 'all' || sort !== 'popular'

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* Hero section */}
        <section className="relative overflow-hidden">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-28 pb-12 sm:pb-16 text-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 text-orange-500 mb-3">
                <Zap className="w-5 h-5" />
                <span className="text-sm font-semibold tracking-wide uppercase">Directory</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground leading-tight">
                All Startups
              </h1>
              <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
                {!loading && (
                  <>Browse {total}+ innovative startups across {categories.length} categories</>
                )}
                {loading && (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading startups...
                  </span>
                )}
              </p>
            </motion.div>
          </div>
        </section>

        {/* Main content */}
        <section className="pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Search bar */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="mb-6"
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search startups by name, tagline, or category..."
                  className="pl-12 h-12 text-sm text-foreground rounded-2xl bg-muted/30 border-border"
                  value={search}
                  onChange={e => handleSearchChange(e.target.value)}
                />
                {search && (
                  <button
                    onClick={() => handleSearchChange('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>

            {/* Filter row */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="flex flex-wrap items-center gap-3 mb-8"
            >
              {/* Category dropdown */}
              <Select value={category} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-[170px] h-10 text-sm rounded-xl">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(c => (
                    <SelectItem key={c.name} value={c.name}>
                      {c.icon || getCategoryIcon(c.name)} {c.name}
                      <span className="ml-auto text-xs text-muted-foreground">{c.count}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Stage dropdown */}
              <Select value={stage} onValueChange={handleStageChange}>
                <SelectTrigger className="w-[140px] h-10 text-sm rounded-xl">
                  <SelectValue placeholder="Stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stages</SelectItem>
                  {STAGES.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort dropdown */}
              <Select value={sort} onValueChange={handleSortChange}>
                <SelectTrigger className="w-[130px] h-10 text-sm rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Most Stars</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                </SelectContent>
              </Select>

              {/* Active filter pills */}
              {hasActiveFilters && (
                <div className="flex items-center gap-2 ml-auto">
                  {category !== 'all' && (
                    <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-orange-500/10 text-orange-500 font-medium">
                      {getCategoryIcon(category)} {category}
                      <button onClick={() => handleCategoryChange('all')} className="hover:text-orange-600">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {stage !== 'all' && (
                    <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-orange-500/10 text-orange-500 font-medium">
                      {stage}
                      <button onClick={() => handleStageChange('all')} className="hover:text-orange-600">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {search && (
                    <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-orange-500/10 text-orange-500 font-medium">
                      &quot;{search}&quot;
                      <button onClick={() => handleSearchChange('')} className="hover:text-orange-600">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-muted-foreground hover:text-foreground"
                    onClick={clearFilters}
                  >
                    Clear all
                  </Button>
                </div>
              )}
            </motion.div>

            {/* Results count */}
            {!loading && startups.length > 0 && (
              <p className="text-xs text-muted-foreground mb-4">
                Showing {startups.length} of {total} startups
                {totalPages > 1 && ` · Page ${page} of ${totalPages}`}
              </p>
            )}

            {/* Startups Grid */}
            {loading ? (
              <div className="space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-5 rounded-2xl border border-border">
                    <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                    <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-64" />
                    </div>
                    <Skeleton className="h-8 w-20 rounded-lg" />
                  </div>
                ))}
              </div>
            ) : startups.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="text-center py-24"
              >
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <Search className="w-7 h-7 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No startups found</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                  Try adjusting your search or filters to discover more startups.
                </p>
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="rounded-xl text-sm text-orange-500 border-orange-500/30 hover:bg-orange-500/10 hover:text-orange-500"
                  >
                    Clear all filters
                  </Button>
                )}
              </motion.div>
            ) : (
              <>
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {startups.map((startup, index) => (
                      <motion.div
                        key={startup.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.3) }}
                      >
                        <Link href={`/startup/${startup.slug}`} className="block">
                          <div className="group rounded-2xl border border-border hover:border-orange-500/30 transition-all duration-200 p-5">
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
                                  <span className={`inline-flex items-center text-[10px] px-2 py-0.5 rounded-full font-medium ${getCategoryColor(startup.category)}`}>
                                    {getCategoryIcon(startup.category)} {startup.category}
                                  </span>
                                  <span className={`inline-flex items-center text-[10px] px-2 py-0.5 rounded-full font-medium ${getStageColor(startup.stage)}`}>
                                    {startup.stage}
                                  </span>
                                  {startup.country && (
                                    <span className="text-[10px] text-muted-foreground hidden sm:inline">
                                      {startup.country.length > 12 ? startup.country.split(' ')[0] : startup.country}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                                  {startup.tagline}
                                </p>
                              </div>

                              {/* Right side — follow + star + link */}
                              <div className="flex items-center gap-3 shrink-0" onClick={e => e.stopPropagation()}>
                                <FollowButton
                                  isFollowing={isFollowing(startup.id)}
                                  followerCount={getFollowerCount(startup.id)}
                                  onToggle={() => toggleFollow(startup.id)}
                                  size="sm"
                                />
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleVote(startup.slug) }}
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
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    className="mt-10 flex items-center justify-center gap-3"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl h-10 px-4 text-sm disabled:opacity-40"
                      disabled={page <= 1}
                      onClick={() => handlePageChange(page - 1)}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>

                    {/* Page numbers */}
                    <div className="hidden sm:flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(p => {
                          // Show first, last, current, and neighbors
                          if (p === 1 || p === totalPages) return true
                          if (Math.abs(p - page) <= 1) return true
                          return false
                        })
                        .reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
                          if (idx > 0) {
                            const prev = arr[idx - 1]
                            if (p - prev > 1) acc.push('ellipsis')
                          }
                          acc.push(p)
                          return acc
                        }, [])
                        .map((item, idx) =>
                          item === 'ellipsis' ? (
                            <span key={`ellipsis-${idx}`} className="px-2 text-sm text-muted-foreground">
                              ...
                            </span>
                          ) : (
                            <Button
                              key={item}
                              variant={page === item ? 'default' : 'outline'}
                              size="sm"
                              className={`rounded-lg h-9 w-9 p-0 text-sm ${
                                page === item
                                  ? 'bg-orange-500 hover:bg-orange-600 text-white'
                                  : 'hover:bg-muted'
                              }`}
                              onClick={() => handlePageChange(item)}
                            >
                              {item}
                            </Button>
                          )
                        )}
                    </div>

                    <span className="text-xs text-muted-foreground sm:hidden">
                      Page {page} of {totalPages}
                    </span>

                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl h-10 px-4 text-sm disabled:opacity-40"
                      disabled={page >= totalPages}
                      onClick={() => handlePageChange(page + 1)}
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </motion.div>
                )}
              </>
            )}

            {/* CTA at bottom */}
            {!loading && startups.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="mt-20 relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 via-orange-500 to-amber-500 p-8 sm:p-12 text-center"
              >
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
                  <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-amber-300/10 blur-3xl" />
                </div>
                <div className="relative z-10">
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                    Don&apos;t see your startup?
                  </h2>
                  <p className="text-sm sm:text-base text-white/80 max-w-md mx-auto mb-8">
                    Submit your startup and get discovered by thousands of founders, investors, and early adopters.
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
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
