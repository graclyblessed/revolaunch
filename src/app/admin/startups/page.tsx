'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Search, Filter, Star, Eye, Trash2, RefreshCw, ChevronLeft, ChevronRight,
  Building2, ThumbsUp, Package, ExternalLink, X, Check
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface Startup {
  id: string
  name: string
  slug: string
  tagline: string
  logo: string | null
  website: string
  category: string
  stage: string
  launchTier: string
  launchDate: string | null
  featured: boolean
  upvotes: number
  status: string
  country: string | null
  teamSize: string | null
  email: string | null
  createdAt: string
  updatedAt: string
  votesCount: number
  perksCount: number
}

const tierLabels: Record<string, string> = {
  free: 'Free',
  premium: 'Premium',
  'premium-plus': 'Premium+',
  'seo-growth': 'SEO Growth',
}

const tierColors: Record<string, string> = {
  free: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  premium: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'premium-plus': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  'seo-growth': 'bg-green-500/10 text-green-400 border-green-500/20',
}

const statusColors: Record<string, string> = {
  active: 'bg-green-500/10 text-green-400',
  paused: 'bg-yellow-500/10 text-yellow-400',
  acquired: 'bg-purple-500/10 text-purple-400',
}

export default function AdminStartupsPage() {
  const [startups, setStartups] = useState<Startup[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterTier, setFilterTier] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [selectedStartup, setSelectedStartup] = useState<Startup | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const limit = 20

  const fetchStartups = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(filterTier && { tier: filterTier }),
        ...(filterStatus && { status: filterStatus }),
      })
      const res = await fetch(`/api/admin/startups?${params}`)
      if (res.ok) {
        const data = await res.json()
        setStartups(data.startups)
        setTotal(data.total)
        setTotalPages(data.totalPages)
      }
    } catch (err) {
      console.error('Failed to fetch startups:', err)
    } finally {
      setLoading(false)
    }
  }, [page, search, filterTier, filterStatus])

  useEffect(() => {
    fetchStartups()
  }, [fetchStartups])

  const handleToggleFeatured = async (startup: Startup) => {
    setActionLoading(startup.id)
    try {
      const res = await fetch('/api/admin/startups', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: startup.id, featured: !startup.featured }),
      })
      if (res.ok) {
        setStartups(prev => prev.map(s =>
          s.id === startup.id ? { ...s, featured: !s.featured } : s
        ))
        if (selectedStartup?.id === startup.id) {
          setSelectedStartup(prev => prev ? { ...prev, featured: !prev.featured } : null)
        }
      }
    } catch (err) {
      console.error('Failed to toggle featured:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleToggleStatus = async (startup: Startup, newStatus: string) => {
    setActionLoading(startup.id)
    try {
      const res = await fetch('/api/admin/startups', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: startup.id, status: newStatus }),
      })
      if (res.ok) {
        setStartups(prev => prev.map(s =>
          s.id === startup.id ? { ...s, status: newStatus } : s
        ))
        if (selectedStartup?.id === startup.id) {
          setSelectedStartup(prev => prev ? { ...prev, status: newStatus } : null)
        }
      }
    } catch (err) {
      console.error('Failed to update status:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this startup? This action cannot be undone.')) return

    setActionLoading(id)
    try {
      const res = await fetch(`/api/admin/startups?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setStartups(prev => prev.filter(s => s.id !== id))
        setTotal(prev => prev - 1)
        if (selectedStartup?.id === id) setSelectedStartup(null)
      }
    } catch (err) {
      console.error('Failed to delete startup:', err)
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Startups</h1>
          <p className="text-sm text-muted-foreground mt-1">{total} total startups</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchStartups}
          disabled={loading}
          className="h-8 text-xs"
        >
          <RefreshCw className={cn('w-3 h-3 mr-1.5', loading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search startups..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="h-9 pl-8 text-sm rounded-lg input-bg"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterTier}
            onChange={(e) => { setFilterTier(e.target.value); setPage(1) }}
            className="h-9 text-sm rounded-lg border border-border bg-card text-foreground px-3"
          >
            <option value="">All Tiers</option>
            <option value="free">Free</option>
            <option value="premium">Premium</option>
            <option value="premium-plus">Premium+</option>
            <option value="seo-growth">SEO Growth</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1) }}
            className="h-9 text-sm rounded-lg border border-border bg-card text-foreground px-3"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="acquired">Acquired</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Startup</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 hidden md:table-cell">Category</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Tier</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 hidden sm:table-cell">Votes</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Status</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 w-24 rounded bg-muted animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : startups.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <Building2 className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                    <p className="text-sm text-muted-foreground">No startups found</p>
                  </td>
                </tr>
              ) : (
                startups.map((startup) => (
                  <tr key={startup.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => setSelectedStartup(startup)}
                          className="flex items-center gap-2 text-left"
                        >
                          {startup.featured && (
                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 shrink-0" />
                          )}
                          <div>
                            <p className="text-sm font-medium text-foreground group-hover:text-orange-500 transition-colors truncate max-w-[160px]">
                              {startup.name}
                            </p>
                            <p className="text-[10px] text-faint truncate max-w-[160px]">
                              {startup.tagline}
                            </p>
                          </div>
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">
                      {startup.category}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'px-2 py-0.5 rounded-full text-[10px] font-medium border',
                        tierColors[startup.launchTier] || tierColors.free
                      )}>
                        {tierLabels[startup.launchTier] || startup.launchTier}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell">
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3" />
                        {startup.votesCount}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'px-2 py-0.5 rounded-full text-[10px] font-medium',
                        statusColors[startup.status] || statusColors.active
                      )}>
                        {startup.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleToggleFeatured(startup)}
                          disabled={actionLoading === startup.id}
                          className="p-1.5 rounded-md hover:bg-muted transition-colors"
                          title={startup.featured ? 'Unfeature' : 'Feature'}
                        >
                          <Star className={cn(
                            'w-3.5 h-3.5',
                            startup.featured ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'
                          )} />
                        </button>
                        <a
                          href={`/startup/${startup.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-md hover:bg-muted transition-colors"
                          title="View"
                        >
                          <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                        </a>
                        <button
                          onClick={() => handleDelete(startup.id)}
                          disabled={actionLoading === startup.id}
                          className="p-1.5 rounded-md hover:bg-red-500/10 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Panel */}
      {selectedStartup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/60"
            onClick={() => setSelectedStartup(null)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-lg rounded-xl border border-border surface p-5 max-h-[80vh] overflow-y-auto"
          >
            <button
              onClick={() => setSelectedStartup(null)}
              className="absolute top-4 right-4 p-1 rounded-md hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-foreground">{selectedStartup.name}</h2>
                    {selectedStartup.featured && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedStartup.tagline}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Category</p>
                  <p className="text-sm text-foreground font-medium">{selectedStartup.category}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Stage</p>
                  <p className="text-sm text-foreground font-medium">{selectedStartup.stage}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Tier</p>
                  <span className={cn(
                    'inline-block px-2 py-0.5 rounded-full text-[10px] font-medium border',
                    tierColors[selectedStartup.launchTier] || tierColors.free
                  )}>
                    {tierLabels[selectedStartup.launchTier] || selectedStartup.launchTier}
                  </span>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Votes</p>
                  <p className="text-sm text-foreground font-medium">{selectedStartup.votesCount}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Country</p>
                  <p className="text-sm text-foreground font-medium">{selectedStartup.country || 'N/A'}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Team Size</p>
                  <p className="text-sm text-foreground font-medium">{selectedStartup.teamSize || 'N/A'}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Actions</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={selectedStartup.featured ? 'outline' : 'default'}
                    className={cn(
                      'h-8 text-xs rounded-lg',
                      !selectedStartup.featured && 'bg-orange-500 hover:bg-orange-600 text-white'
                    )}
                    onClick={() => handleToggleFeatured(selectedStartup)}
                    disabled={actionLoading === selectedStartup.id}
                  >
                    <Star className="w-3 h-3 mr-1" />
                    {selectedStartup.featured ? 'Unfeature' : 'Feature'}
                  </Button>

                  {selectedStartup.status !== 'active' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs rounded-lg text-green-500 border-green-500/20 hover:bg-green-500/10"
                      onClick={() => handleToggleStatus(selectedStartup, 'active')}
                      disabled={actionLoading === selectedStartup.id}
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Activate
                    </Button>
                  )}

                  {selectedStartup.status !== 'paused' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs rounded-lg text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/10"
                      onClick={() => handleToggleStatus(selectedStartup, 'paused')}
                      disabled={actionLoading === selectedStartup.id}
                    >
                      Pause
                    </Button>
                  )}

                  <a href={selectedStartup.website} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="h-8 text-xs rounded-lg">
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Website
                    </Button>
                  </a>

                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs rounded-lg text-red-500 border-red-500/20 hover:bg-red-500/10"
                    onClick={() => { handleDelete(selectedStartup.id); setSelectedStartup(null) }}
                    disabled={actionLoading === selectedStartup.id}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>

              <div className="text-[10px] text-faint">
                Created: {new Date(selectedStartup.createdAt).toLocaleString()} | Updated: {new Date(selectedStartup.updatedAt).toLocaleString()}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
