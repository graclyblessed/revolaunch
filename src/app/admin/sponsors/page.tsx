'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Megaphone, Plus, RefreshCw, ExternalLink, Trash2, Edit2,
  X, Check, Clock, Pause, AlertTriangle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface Sponsor {
  id: string
  companyName: string
  logo: string | null
  website: string
  tagline: string | null
  plan: string
  status: string
  startsAt: string
  expiresAt: string
  createdAt: string
  updatedAt: string
}

const planLabels: Record<string, string> = {
  '1month': '1 Month ($29)',
  '3months': '3 Months ($59)',
  '12months': '12 Months ($199)',
}

const planColors: Record<string, string> = {
  '1month': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  '3months': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  '12months': 'bg-green-500/10 text-green-400 border-green-500/20',
}

const statusColors: Record<string, string> = {
  active: 'bg-green-500/10 text-green-400',
  expired: 'bg-red-500/10 text-red-400',
  paused: 'bg-yellow-500/10 text-yellow-400',
}

export default function AdminSponsorsPage() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [form, setForm] = useState({
    companyName: '',
    logo: '',
    website: '',
    tagline: '',
    plan: '1month',
    status: 'active',
    startsAt: new Date().toISOString().split('T')[0],
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  })

  const fetchSponsors = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/sponsors')
      if (res.ok) {
        const data = await res.json()
        setSponsors(data.sponsors)
      }
    } catch (err) {
      console.error('Failed to fetch sponsors:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSponsors()
  }, [fetchSponsors])

  const resetForm = () => {
    setForm({
      companyName: '',
      logo: '',
      website: '',
      tagline: '',
      plan: '1month',
      status: 'active',
      startsAt: new Date().toISOString().split('T')[0],
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    })
    setEditingSponsor(null)
    setShowForm(false)
  }

  const handleEdit = (sponsor: Sponsor) => {
    setEditingSponsor(sponsor)
    setForm({
      companyName: sponsor.companyName,
      logo: sponsor.logo || '',
      website: sponsor.website,
      tagline: sponsor.tagline || '',
      plan: sponsor.plan,
      status: sponsor.status,
      startsAt: new Date(sponsor.startsAt).toISOString().split('T')[0],
      expiresAt: new Date(sponsor.expiresAt).toISOString().split('T')[0],
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    try {
      const url = editingSponsor ? '/api/admin/sponsors' : '/api/admin/sponsors'
      const method = editingSponsor ? 'PATCH' : 'POST'
      const body = editingSponsor
        ? { id: editingSponsor.id, ...form }
        : form

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (res.ok) {
        resetForm()
        fetchSponsors()
      } else {
        alert(data.error || 'Failed to save sponsor')
      }
    } catch (err) {
      console.error('Failed to save sponsor:', err)
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this sponsor?')) return
    try {
      const res = await fetch(`/api/admin/sponsors?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setSponsors(prev => prev.filter(s => s.id !== id))
      }
    } catch (err) {
      console.error('Failed to delete sponsor:', err)
    }
  }

  const handleToggleStatus = async (sponsor: Sponsor) => {
    const newStatus = sponsor.status === 'active' ? 'paused' : 'active'
    try {
      const res = await fetch('/api/admin/sponsors', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: sponsor.id, status: newStatus }),
      })
      if (res.ok) {
        setSponsors(prev => prev.map(s =>
          s.id === sponsor.id ? { ...s, status: newStatus } : s
        ))
      }
    } catch (err) {
      console.error('Failed to toggle sponsor status:', err)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sponsors</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage sponsorship slots ({sponsors.filter(s => s.status === 'active').length} active)
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSponsors}
            disabled={loading}
            className="h-8 text-xs"
          >
            <RefreshCw className={cn('w-3 h-3 mr-1.5', loading && 'animate-spin')} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => { resetForm(); setShowForm(true) }}
            className="h-8 text-xs bg-orange-500 hover:bg-orange-600 text-white rounded-lg"
          >
            <Plus className="w-3 h-3 mr-1.5" />
            Add Sponsor
          </Button>
        </div>
      </div>

      {/* Sponsor Form Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-black/60"
              onClick={resetForm}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="relative w-full max-w-md rounded-xl border border-border surface p-5"
            >
              <button onClick={resetForm} className="absolute top-4 right-4 p-1 rounded-md hover:bg-muted">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>

              <h2 className="text-lg font-semibold text-foreground mb-4">
                {editingSponsor ? 'Edit Sponsor' : 'Add New Sponsor'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Company Name *</Label>
                  <Input
                    required
                    value={form.companyName}
                    onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))}
                    className="h-9 text-sm rounded-lg input-bg"
                    placeholder="Acme Inc."
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Website *</Label>
                  <Input
                    required
                    value={form.website}
                    onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                    className="h-9 text-sm rounded-lg input-bg"
                    placeholder="https://acme.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Logo URL</Label>
                  <Input
                    value={form.logo}
                    onChange={e => setForm(f => ({ ...f, logo: e.target.value }))}
                    className="h-9 text-sm rounded-lg input-bg"
                    placeholder="https://acme.com/logo.png"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Tagline</Label>
                  <Input
                    value={form.tagline}
                    onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))}
                    className="h-9 text-sm rounded-lg input-bg"
                    placeholder="The best startup tool"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Plan</Label>
                    <select
                      value={form.plan}
                      onChange={e => setForm(f => ({ ...f, plan: e.target.value }))}
                      className="h-9 text-sm rounded-lg border border-border bg-card text-foreground px-3 w-full"
                    >
                      <option value="1month">1 Month ($29)</option>
                      <option value="3months">3 Months ($59)</option>
                      <option value="12months">12 Months ($199)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Status</Label>
                    <select
                      value={form.status}
                      onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                      className="h-9 text-sm rounded-lg border border-border bg-card text-foreground px-3 w-full"
                    >
                      <option value="active">Active</option>
                      <option value="paused">Paused</option>
                      <option value="expired">Expired</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Start Date</Label>
                    <Input
                      type="date"
                      value={form.startsAt}
                      onChange={e => setForm(f => ({ ...f, startsAt: e.target.value }))}
                      className="h-9 text-sm rounded-lg input-bg"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Expiry Date</Label>
                    <Input
                      type="date"
                      value={form.expiresAt}
                      onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                      className="h-9 text-sm rounded-lg input-bg"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={resetForm} className="flex-1 h-9 text-sm rounded-lg">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={formLoading} className="flex-1 h-9 text-sm rounded-lg bg-orange-500 hover:bg-orange-600 text-white">
                    {formLoading ? 'Saving...' : editingSponsor ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sponsor Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-40 rounded-xl border border-border surface animate-pulse" />
          ))}
        </div>
      ) : sponsors.length === 0 ? (
        <div className="rounded-xl border border-border surface p-12 text-center">
          <Megaphone className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-sm text-muted-foreground">No sponsors yet.</p>
          <p className="text-xs text-faint mt-1">Add a sponsor to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {sponsors.map((sponsor) => {
            const isExpired = new Date(sponsor.expiresAt) < new Date()
            const daysLeft = Math.max(0, Math.ceil((new Date(sponsor.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))

            return (
              <motion.div
                key={sponsor.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-border surface p-4 hover:border-orange-500/20 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    {sponsor.logo ? (
                      <img src={sponsor.logo} alt={sponsor.companyName} className="w-9 h-9 rounded-lg object-cover" />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center">
                        <Megaphone className="w-4 h-4 text-orange-500" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-foreground">{sponsor.companyName}</p>
                      <p className="text-[10px] text-faint">{sponsor.tagline || sponsor.website}</p>
                    </div>
                  </div>
                  <span className={cn(
                    'px-2 py-0.5 rounded-full text-[10px] font-medium',
                    statusColors[sponsor.status] || statusColors.active
                  )}>
                    {sponsor.status}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className={cn(
                    'px-2 py-0.5 rounded-full text-[10px] font-medium border',
                    planColors[sponsor.plan] || planColors['1month']
                  )}>
                    {planLabels[sponsor.plan] || sponsor.plan}
                  </span>
                  {sponsor.status === 'active' && (
                    <span className={cn(
                      'flex items-center gap-1 text-[10px]',
                      daysLeft <= 7 ? 'text-red-400' : daysLeft <= 14 ? 'text-yellow-400' : 'text-muted-foreground'
                    )}>
                      <Clock className="w-3 h-3" />
                      {daysLeft}d left
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleToggleStatus(sponsor)}
                      className="p-1.5 rounded-md hover:bg-muted transition-colors"
                      title={sponsor.status === 'active' ? 'Pause' : 'Activate'}
                    >
                      {sponsor.status === 'active' ? (
                        <Pause className="w-3.5 h-3.5 text-muted-foreground" />
                      ) : (
                        <Check className="w-3.5 h-3.5 text-green-500" />
                      )}
                    </button>
                    <a
                      href={sponsor.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-md hover:bg-muted transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                    </a>
                    <button
                      onClick={() => handleEdit(sponsor)}
                      className="p-1.5 rounded-md hover:bg-muted transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </div>
                  <button
                    onClick={() => handleDelete(sponsor.id)}
                    className="p-1.5 rounded-md hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-red-500" />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
