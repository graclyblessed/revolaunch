'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Briefcase, MapPin, Clock, DollarSign, Search, Plus,
  Star, Building2, ExternalLink, ChevronLeft, ChevronRight,
  Sparkles, Filter, X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Skeleton } from '@/components/ui/skeleton'

const CATEGORIES = [
  'Engineering',
  'Design',
  'Product',
  'Marketing',
  'Sales',
  'Operations',
  'Finance',
  'Customer Success',
]

const JOB_TYPES = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
]

const TYPE_COLORS: Record<string, string> = {
  'full-time': 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
  'part-time': 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  'contract': 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  'internship': 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
}

interface Job {
  id: string
  title: string
  company: string
  logo?: string | null
  website?: string | null
  location?: string | null
  type: string
  salaryMin?: number | null
  salaryMax?: number | null
  currency: string
  description: string
  tags: string[]
  category: string
  isFeatured: boolean
  createdAt: string
  expiresAt: string
}

function formatSalary(min?: number | null, max?: number | null, currency: string = 'USD') {
  const sym = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : `${currency} `
  if (min && max) return `${sym}${(min / 1000).toFixed(0)}K – ${sym}${(max / 1000).toFixed(0)}K`
  if (min) return `From ${sym}${(min / 1000).toFixed(0)}K`
  if (max) return `Up to ${sym}${(max / 1000).toFixed(0)}K`
  return null
}

function timeAgo(dateStr: string) {
  const now = new Date()
  const date = new Date(dateStr)
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

function JobCard({ job, index }: { job: Job; index: number }) {
  const salary = formatSalary(job.salaryMin, job.salaryMax, job.currency)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className={`rounded-xl border p-4 sm:p-5 transition-all hover:border-orange-500/30 group ${
        job.isFeatured
          ? 'border-orange-500/40 bg-orange-500/[0.03] relative overflow-hidden'
          : 'subtle-border surface'
      }`}
    >
      {/* Featured indicator */}
      {job.isFeatured && (
        <div className="absolute top-0 right-0">
          <div className="bg-orange-500 text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-bl-lg flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Featured
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
        {/* Logo / Avatar */}
        <div className="shrink-0">
          {job.logo ? (
            <img
              src={job.logo}
              alt={`${job.company} logo`}
              className="w-10 h-10 rounded-lg object-cover border subtle-border"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
                ;(e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden')
              }}
            />
          ) : null}
          <div className={`w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center ${job.logo ? 'hidden' : ''}`}>
            <Building2 className="w-5 h-5 text-orange-500" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-orange-500 transition-colors">
                {job.website ? (
                  <a href={job.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:underline">
                    {job.title}
                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </a>
                ) : (
                  job.title
                )}
              </h3>
              <p className="text-xs text-muted-foreground">{job.company}</p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
            {job.description}
          </p>

          <div className="flex flex-wrap items-center gap-2">
            {/* Location */}
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <MapPin className="w-3 h-3" />
              {job.location || 'Remote'}
            </span>

            {/* Type */}
            <Badge
              variant="secondary"
              className={`text-[10px] px-2 py-0.5 rounded-full border h-5 ${TYPE_COLORS[job.type] || ''}`}
            >
              {job.type}
            </Badge>

            {/* Category */}
            <Badge
              variant="secondary"
              className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border h-5"
            >
              {job.category}
            </Badge>

            {/* Salary */}
            {salary && (
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                <DollarSign className="w-3 h-3" />
                {salary}
              </span>
            )}

            {/* Tags */}
            {job.tags.slice(0, 3).map(tag => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border h-5"
              >
                {tag}
              </Badge>
            ))}

            {/* Time ago */}
            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground ml-auto">
              <Clock className="w-3 h-3" />
              {timeAgo(job.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function JobSkeleton() {
  return (
    <div className="rounded-xl border subtle-border surface p-5">
      <div className="flex items-start gap-4">
        <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
        <div className="flex-1 space-y-2.5">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-full max-w-md" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState<string>('')
  const [type, setType] = useState<string>('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [total, setTotal] = useState(0)
  const limit = 20

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      })
      if (category) params.set('category', category)
      if (type) params.set('type', type)
      if (search) params.set('search', search)

      const res = await fetch(`/api/jobs?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setJobs(data.jobs || [])
        setTotalPages(data.totalPages || 0)
        setTotal(data.total || 0)
      }
    } catch (err) {
      console.error('Failed to fetch jobs:', err)
    } finally {
      setLoading(false)
    }
  }, [page, category, type, search])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [category, type, search])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
  }

  const clearFilters = () => {
    setCategory('')
    setType('')
    setSearch('')
    setSearchInput('')
    setPage(1)
  }

  const hasActiveFilters = category || type || search

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="hero-gradient border-b subtle-border">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase className="w-6 h-6 text-orange-500" />
                  <span className="text-xs font-medium text-orange-500 uppercase tracking-wider">Community</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                  Startup Jobs
                </h1>
                <p className="text-sm text-muted-foreground max-w-md">
                  Find your next role at the most innovative startups. From engineering to design, discover opportunities that matter.
                </p>
              </div>
              <Link href="/jobs/post">
                <Button className="bg-orange-500 hover:bg-orange-600 text-white h-9 text-sm font-medium rounded-lg px-5 shrink-0">
                  <Plus className="w-4 h-4 mr-1.5" />
                  Post a Job
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="border-b subtle-border">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <form onSubmit={handleSearch} className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search jobs by title, company, or keyword..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9 h-9 text-sm rounded-lg input-bg"
                />
              </form>

              {/* Category */}
              <Select value={category} onValueChange={(v) => setCategory(v === '_all' ? '' : v)}>
                <SelectTrigger className="w-full sm:w-[170px] h-9 text-sm rounded-lg input-bg">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">All Categories</SelectItem>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Type */}
              <Select value={type} onValueChange={(v) => setType(v === '_all' ? '' : v)}>
                <SelectTrigger className="w-full sm:w-[150px] h-9 text-sm rounded-lg input-bg">
                  <SelectValue placeholder="Job Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">All Types</SelectItem>
                  {JOB_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Clear */}
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-9 text-xs text-muted-foreground hover:text-foreground shrink-0"
                >
                  <X className="w-3 h-3 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* Job Listings */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Results count */}
          <div className="flex items-center justify-between mb-5">
            <p className="text-xs text-muted-foreground">
              {loading ? (
                'Loading jobs...'
              ) : total > 0 ? (
                <>
                  Showing <span className="font-medium text-foreground">{total}</span> job{total !== 1 ? 's' : ''}
                  {hasActiveFilters && ' (filtered)'}
                </>
              ) : (
                'No jobs found'
              )}
            </p>
          </div>

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <JobSkeleton key={i} />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border subtle-border surface p-12 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-8 h-8 text-orange-500" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">No jobs found</h3>
              <p className="text-xs text-muted-foreground mb-4 max-w-sm mx-auto">
                {hasActiveFilters
                  ? 'Try adjusting your filters or search query to find more opportunities.'
                  : 'No jobs have been posted yet. Be the first to list an opening at your startup!'}
              </p>
              {hasActiveFilters ? (
                <Button variant="outline" size="sm" onClick={clearFilters} className="text-sm h-8 rounded-lg">
                  <Filter className="w-3.5 h-3.5 mr-1.5" />
                  Clear Filters
                </Button>
              ) : (
                <Link href="/jobs/post">
                  <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white text-sm h-8 rounded-lg">
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Post a Job
                  </Button>
                </Link>
              )}
            </motion.div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={`${category}-${type}-${search}-${page}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                {jobs.map((job, index) => (
                  <JobCard key={job.id} job={job} index={index} />
                ))}
              </motion.div>
            </AnimatePresence>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="h-8 text-xs rounded-lg"
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                Previous
              </Button>
              <span className="text-xs text-muted-foreground px-3">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="h-8 text-xs rounded-lg"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  )
}
