'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Building2, ThumbsUp, Users, Megaphone, Star, Clock,
  TrendingUp, ArrowUpRight, ArrowDownRight, Database, Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Stats {
  totalStartups: number
  totalVotes: number
  totalSubscribers: number
  activeSponsors: number
  featuredStartups: number
  pendingLaunches: number
  tierBreakdown: Record<string, number>
  categoryBreakdown: Record<string, number>
  recentStartups: Array<{
    id: string
    name: string
    slug: string
    category: string
    launchTier: string
    featured: boolean
    upvotes: number
    status: string
    createdAt: string
    votesCount: number
  }>
}

const statCards = [
  { key: 'totalStartups' as const, label: 'Total Startups', icon: Building2, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { key: 'totalVotes' as const, label: 'Total Votes', icon: ThumbsUp, color: 'text-green-500', bg: 'bg-green-500/10' },
  { key: 'totalSubscribers' as const, label: 'Subscribers', icon: Users, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { key: 'activeSponsors' as const, label: 'Active Sponsors', icon: Megaphone, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  { key: 'featuredStartups' as const, label: 'Featured', icon: Star, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  { key: 'pendingLaunches' as const, label: 'Pending Launches', icon: Clock, color: 'text-pink-500', bg: 'bg-pink-500/10' },
]

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

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [seedResult, setSeedResult] = useState<string | null>(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleReseed = async () => {
    if (!confirm('This will DELETE all fake/user-submitted startups and re-seed 36 real Product Hunt companies. Are you sure?')) return
    setSeeding(true)
    setSeedResult(null)
    try {
      const res = await fetch('/api/admin/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: 'clean-and-reseed' }),
      })
      const data = await res.json()
      if (res.ok) {
        setSeedResult(data.message || 'Database cleaned and reseeded!')
        fetchStats()
      } else {
        setSeedResult(data.error || 'Failed to reseed database')
      }
    } catch (err) {
      setSeedResult('Error: ' + (err as Error).message)
    } finally {
      setSeeding(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Welcome back! Here is an overview of your platform.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl border border-border surface animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome back! Here is an overview of your platform.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReseed}
            disabled={seeding}
            className="text-xs bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 border border-orange-500/20 rounded-lg px-3 py-1.5 transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            {seeding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Database className="w-3 h-3" />}
            {seeding ? 'Reseeding...' : 'Clean & Reseed DB'}
          </button>
          <button
            onClick={fetchStats}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <TrendingUp className="w-3 h-3" />
            Refresh
          </button>
        </div>
      </div>

      {seedResult && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/5 px-4 py-3">
          <p className="text-sm text-green-600 dark:text-green-400">{seedResult}</p>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.2 }}
            className="rounded-xl border border-border surface p-4 hover:border-orange-500/20 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', card.bg)}>
                <card.icon className={cn('w-4 h-4', card.color)} />
              </div>
              <div className="flex items-center gap-1 text-xs text-green-500">
                <ArrowUpRight className="w-3 h-3" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-foreground">
                {stats?.[card.key]?.toLocaleString() ?? '0'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tier Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.2 }}
          className="rounded-xl border border-border surface p-5"
        >
          <h3 className="text-sm font-semibold text-foreground mb-4">Launch Tier Breakdown</h3>
          {stats && Object.keys(stats.tierBreakdown).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(stats.tierBreakdown).map(([tier, count]) => {
                const total = Object.values(stats.tierBreakdown).reduce((a, b) => a + b, 0)
                const pct = total > 0 ? Math.round((count / total) * 100) : 0
                return (
                  <div key={tier} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-medium border', tierColors[tier] || tierColors.free)}>
                        {tierLabels[tier] || tier}
                      </span>
                      <span className="text-muted-foreground">{count} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                        className={cn(
                          'h-full rounded-full',
                          tier === 'free' ? 'bg-gray-400' :
                          tier === 'premium' ? 'bg-blue-500' :
                          tier === 'premium-plus' ? 'bg-orange-500' :
                          'bg-green-500'
                        )}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No launch data yet.</p>
          )}
        </motion.div>

        {/* Top Categories */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.2 }}
          className="rounded-xl border border-border surface p-5"
        >
          <h3 className="text-sm font-semibold text-foreground mb-4">Top Categories</h3>
          {stats && Object.keys(stats.categoryBreakdown).length > 0 ? (
            <div className="space-y-2.5">
              {Object.entries(stats.categoryBreakdown)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 6)
                .map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-orange-500" />
                      <span className="text-sm text-foreground">{category}</span>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">{count}</span>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No category data yet.</p>
          )}
        </motion.div>
      </div>

      {/* Recent Startups */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.2 }}
        className="rounded-xl border border-border surface p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">Recent Startups</h3>
          <a href="/admin/startups" className="text-xs text-orange-500 hover:text-orange-400 transition-colors">
            View all
          </a>
        </div>
        {stats && stats.recentStartups.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground pb-2 pr-4">Name</th>
                  <th className="text-left text-xs font-medium text-muted-foreground pb-2 pr-4">Category</th>
                  <th className="text-left text-xs font-medium text-muted-foreground pb-2 pr-4">Tier</th>
                  <th className="text-left text-xs font-medium text-muted-foreground pb-2 pr-4">Votes</th>
                  <th className="text-left text-xs font-medium text-muted-foreground pb-2">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stats.recentStartups.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/50 transition-colors">
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-2">
                        {s.featured && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 shrink-0" />}
                        <span className="text-sm text-foreground font-medium truncate max-w-[140px]">{s.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-4 text-xs text-muted-foreground">{s.category}</td>
                    <td className="py-2.5 pr-4">
                      <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-medium border', tierColors[s.launchTier] || tierColors.free)}>
                        {tierLabels[s.launchTier] || s.launchTier}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-xs text-muted-foreground">{s.votesCount}</td>
                    <td className="py-2.5 text-xs text-muted-foreground">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No startups yet. Start by submitting one!</p>
        )}
      </motion.div>
    </div>
  )
}
