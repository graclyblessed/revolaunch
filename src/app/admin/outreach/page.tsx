'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mail, Send, RefreshCw, CheckCircle2, AlertCircle, Clock,
  Eye, MousePointerClick, RotateCw, ChevronLeft, ChevronRight,
  Search, Filter, ExternalLink, Rocket, ShieldCheck, X,
  ImageIcon, BarChart3, Sparkles, XCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface StartupWithClaim {
  id: string
  name: string
  slug: string
  tagline: string
  logo: string | null
  email: string | null
  website: string
  category: string
  stage: string
  upvotes: number
  createdAt: string
  claimEmail: {
    id: string
    token: string
    status: string
    sentAt: string | null
    deliveredAt: string | null
    openedAt: string | null
    clickedAt: string | null
    claimedAt: string | null
    bouncedAt: string | null
    bounceReason: string | null
  } | null
  _count: { votes: number }
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: 'Unsent', color: 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20', icon: Clock },
  sent: { label: 'Sent', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20', icon: Send },
  delivered: { label: 'Delivered', color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20', icon: CheckCircle2 },
  opened: { label: 'Opened', color: 'text-purple-400 bg-purple-400/10 border-purple-400/20', icon: Eye },
  clicked: { label: 'Clicked', color: 'text-green-400 bg-green-400/10 border-green-400/20', icon: MousePointerClick },
  claimed: { label: 'Claimed', color: 'text-green-500 bg-green-500/10 border-green-500/20', icon: ShieldCheck },
  bounced: { label: 'Bounced', color: 'text-red-400 bg-red-400/10 border-red-400/20', icon: AlertCircle },
  failed: { label: 'Failed', color: 'text-red-500 bg-red-500/10 border-red-500/20', icon: XCircle },
}

const FILTER_TABS = [
  { key: 'unsent', label: 'Unsent' },
  { key: 'sent', label: 'Sent' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'opened', label: 'Opened' },
  { key: 'claimed', label: 'Claimed' },
  { key: 'bounced', label: 'Bounced' },
  { key: 'all', label: 'All' },
]

export default function AdminOutreachPage() {
  const [startups, setStartups] = useState<StartupWithClaim[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('unsent')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [sending, setSending] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewStartup, setPreviewStartup] = useState<StartupWithClaim | null>(null)
  const [resultToast, setResultToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const limit = 50

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        status: activeTab,
        search,
      })
      const res = await fetch(`/api/admin/outreach?${params}`)
      if (res.ok) {
        const data = await res.json()
        setStartups(data.startups)
        setTotal(data.total)
        setTotalPages(data.totalPages)
        setSelected(new Set())
      }
    } catch (err) {
      console.error('Failed to fetch outreach data:', err)
    } finally {
      setLoading(false)
    }
  }, [page, activeTab, search])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Toast auto-dismiss
  useEffect(() => {
    if (resultToast) {
      const timer = setTimeout(() => setResultToast(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [resultToast])

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selected.size === startups.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(startups.map(s => s.id)))
    }
  }

  const handleBatchSend = async () => {
    if (selected.size === 0) return
    setSending(true)
    try {
      const res = await fetch('/api/admin/outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startupIds: Array.from(selected) }),
      })
      const data = await res.json()
      if (res.ok) {
        setResultToast({ type: 'success', message: data.message })
        fetchData()
      } else {
        setResultToast({ type: 'error', message: data.error })
      }
    } catch {
      setResultToast({ type: 'error', message: 'Failed to send emails' })
    } finally {
      setSending(false)
    }
  }

  const handleResend = async (startupId: string) => {
    try {
      const res = await fetch('/api/admin/outreach', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startupId }),
      })
      const data = await res.json()
      if (res.ok) {
        setResultToast({ type: 'success', message: data.message })
        fetchData()
      } else {
        setResultToast({ type: 'error', message: data.error })
      }
    } catch {
      setResultToast({ type: 'error', message: 'Failed to resend' })
    }
  }

  const getEmailStatus = (startup: StartupWithClaim) => {
    if (!startup.claimEmail) return 'pending'
    return startup.claimEmail.status
  }

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending
    const Icon = config.icon
    return (
      <span className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border',
        config.color
      )}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    )
  }

  const getStats = () => {
    const stats = { unsent: 0, sent: 0, delivered: 0, opened: 0, clicked: 0, claimed: 0, bounced: 0 }
    startups.forEach(s => {
      const status = getEmailStatus(s)
      if (status in stats) stats[status as keyof typeof stats]++
    })
    return stats
  }

  const stats = getStats()

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Mail className="w-6 h-6 text-orange-500" />
            Email Outreach
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Reach out to founders to claim their startup profiles
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
            className="h-8 text-xs"
          >
            <RefreshCw className={cn('w-3 h-3 mr-1.5', loading && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
        {FILTER_TABS.filter(t => t.key !== 'all').map(tab => {
          const status = stats[tab.key as keyof typeof stats]
          const config = STATUS_CONFIG[tab.key]
          const Icon = config.icon
          return (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setPage(1) }}
              className={cn(
                'rounded-lg border p-2.5 text-center transition-all',
                activeTab === tab.key
                  ? 'border-orange-500/50 bg-orange-500/5'
                  : 'border-border surface hover:border-muted'
              )}
            >
              <Icon className={cn('w-4 h-4 mx-auto mb-1', activeTab === tab.key ? 'text-orange-500' : 'text-muted-foreground')} />
              <p className={cn('text-lg font-semibold leading-none', activeTab === tab.key ? 'text-foreground' : 'text-muted-foreground')}>
                {status}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">{tab.label}</p>
            </button>
          )
        })}
      </div>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1 max-w-sm">
          <Input
            placeholder="Search startups..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="h-9 text-sm rounded-lg input-bg pl-8"
          />
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1">
          {FILTER_TABS.map(tab => (
            <Button
              key={tab.key}
              variant={activeTab === tab.key ? 'default' : 'ghost'}
              size="sm"
              onClick={() => { setActiveTab(tab.key); setPage(1) }}
              className={cn(
                'h-8 text-xs shrink-0',
                activeTab === tab.key ? 'bg-orange-500 hover:bg-orange-600 text-white' : ''
              )}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Batch actions */}
      {selected.size > 0 && activeTab === 'unsent' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between rounded-xl border border-orange-500/30 bg-orange-500/5 px-4 py-3"
        >
          <p className="text-sm text-foreground">
            <strong>{selected.size}</strong> startup{selected.size > 1 ? 's' : ''} selected
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setSelected(new Set())}>
              Clear
            </Button>
            <Button
              size="sm"
              className="h-8 text-xs bg-orange-500 hover:bg-orange-600 text-white"
              onClick={handleBatchSend}
              disabled={sending}
            >
              {sending ? (
                <><RefreshCw className="w-3 h-3 mr-1.5 animate-spin" /> Sending...</>
              ) : (
                <><Send className="w-3 h-3 mr-1.5" /> Send Claim Emails</>
              )}
            </Button>
          </div>
        </motion.div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-border surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {activeTab === 'unsent' && (
                  <th className="w-10 px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selected.size === startups.length && startups.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-border"
                    />
                  </th>
                )}
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Startup</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 hidden md:table-cell">Email</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 hidden lg:table-cell">Category</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Status</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 hidden xl:table-cell">Date</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={activeTab === 'unsent' ? 7 : 6} className="px-4 py-3">
                      <div className="h-4 w-full rounded bg-muted animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : startups.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === 'unsent' ? 7 : 6} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <Mail className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {activeTab === 'unsent' ? 'No startups with emails to contact' : `No ${activeTab} emails`}
                      </p>
                      {activeTab === 'unsent' && (
                        <p className="text-xs text-muted-foreground">
                          Startups need an email address to be eligible for outreach
                        </p>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                startups.map((startup) => {
                  const status = getEmailStatus(startup)
                  return (
                    <tr key={startup.id} className="hover:bg-muted/30 transition-colors group">
                      {activeTab === 'unsent' && (
                        <td className="px-3 py-3">
                          <input
                            type="checkbox"
                            checked={selected.has(startup.id)}
                            onChange={() => toggleSelect(startup.id)}
                            className="rounded border-border"
                          />
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          {startup.logo ? (
                            <img src={startup.logo} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                              <Rocket className="w-4 h-4 text-orange-500" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{startup.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{startup.tagline}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs text-muted-foreground truncate block max-w-[180px]">
                          {startup.email}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-xs text-muted-foreground">{startup.category}</span>
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(status)}
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell">
                        {startup.claimEmail?.sentAt ? (
                          <span className="text-xs text-muted-foreground">
                            {new Date(startup.claimEmail.sentAt).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => { setPreviewStartup(startup); setPreviewOpen(true) }}
                            className="p-1.5 rounded-md hover:bg-muted transition-colors"
                            title="Preview email"
                          >
                            <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                          <a
                            href={`/startup/${startup.slug}`}
                            target="_blank"
                            className="p-1.5 rounded-md hover:bg-muted transition-colors"
                            title="View on site"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                          </a>
                          {(status === 'sent' || status === 'delivered' || status === 'opened' || status === 'bounced' || status === 'failed') && (
                            <button
                              onClick={() => handleResend(startup.id)}
                              className="p-1.5 rounded-md hover:bg-orange-500/10 transition-colors"
                              title="Resend email"
                            >
                              <RotateCw className="w-3.5 h-3.5 text-orange-500" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              {total} startups · Page {page} of {totalPages}
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

      {/* Email Preview Modal */}
      <AnimatePresence>
        {previewOpen && previewStartup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setPreviewOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="surface rounded-xl border border-border w-full max-w-2xl max-h-[80vh] overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Email Preview</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    To: {previewStartup.email}
                  </p>
                </div>
                <button
                  onClick={() => setPreviewOpen(false)}
                  className="p-1.5 rounded-md hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Preview content */}
              <div className="p-5 overflow-y-auto max-h-[calc(80vh-120px)]">
                <div className="rounded-lg overflow-hidden border border-border bg-[#0a0a0a] p-6">
                  {/* Orange header */}
                  <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-t-lg -mx-6 -mt-6 px-6 py-5 mb-6">
                    <p className="text-2xl font-bold text-white">Revolaunch</p>
                    <p className="text-sm text-white/80">Where startups get seen</p>
                  </div>

                  <div className="space-y-4 text-sm">
                    <p className="text-lg font-semibold text-white">Your startup is live on Revolaunch</p>
                    <p className="text-muted-foreground leading-relaxed">
                      Great news! <strong className="text-white">{previewStartup.name}</strong> has been listed on
                      Revolaunch, the platform where founders showcase their startups to thousands of
                      visitors, investors, and early adopters every month.
                    </p>

                    <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#262626]">
                      <p className="text-orange-500 font-semibold">{previewStartup.name}</p>
                      <p className="text-muted-foreground text-xs mt-1">{previewStartup.tagline}</p>
                    </div>

                    <p className="text-muted-foreground leading-relaxed">
                      By claiming your profile, you&apos;ll be able to update your description, add team
                      perks, verify your badge, track analytics, and connect with potential users and investors.
                    </p>

                    <div className="text-center py-2">
                      <span className="inline-block bg-orange-500 text-white px-8 py-3 rounded-lg font-semibold text-sm">
                        Claim Your Profile
                      </span>
                    </div>

                    <div className="border-t border-[#262626] pt-4 mt-4 space-y-1">
                      <p className="text-[10px] uppercase tracking-wider text-zinc-600 font-semibold mb-2">What you get when you claim</p>
                      {['Full control over your listing details', 'Analytics dashboard with views and clicks', 'Verified badge for credibility', 'Add team perks to attract early users', 'Priority support from our team'].map(b => (
                        <p key={b} className="text-xs text-muted-foreground">✅ {b}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {resultToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={cn(
              'fixed bottom-6 right-6 z-50 rounded-lg px-4 py-3 flex items-center gap-2 shadow-lg border',
              resultToast.type === 'success'
                ? 'bg-green-500/10 border-green-500/30 text-green-400'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            )}
          >
            {resultToast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <span className="text-sm">{resultToast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
