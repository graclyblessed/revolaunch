'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Megaphone, Plus, RefreshCw, ExternalLink, Trash2, Edit2,
  X, Check, Clock, Pause, Eye, MousePointerClick, BarChart3
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface Banner {
  id: string
  headline: string
  description: string | null
  ctaText: string
  ctaUrl: string
  imageUrl: string | null
  logoUrl: string | null
  position: number
  status: string
  impressions: number
  clicks: number
  startsAt: string
  expiresAt: string
  createdAt: string
  updatedAt: string
  sponsor?: { id: string; companyName: string; logo: string | null } | null
}

const statusColors: Record<string, string> = {
  active: 'bg-green-500/10 text-green-400',
  expired: 'bg-red-500/10 text-red-400',
  paused: 'bg-yellow-500/10 text-yellow-400',
}

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

function ctr(clicks: number, impressions: number): string {
  if (impressions === 0) return '0%'
  return `${((clicks / impressions) * 100).toFixed(1)}%`
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [form, setForm] = useState({
    headline: '',
    description: '',
    ctaText: 'Learn More',
    ctaUrl: '',
    imageUrl: '',
    logoUrl: '',
    position: 4,
    status: 'active',
    startsAt: new Date().toISOString().split('T')[0],
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  })

  const fetchBanners = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/banners')
      if (res.ok) {
        const data = await res.json()
        setBanners(data.banners)
      }
    } catch (err) {
      console.error('Failed to fetch banners:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBanners()
  }, [fetchBanners])

  const resetForm = () => {
    setForm({
      headline: '',
      description: '',
      ctaText: 'Learn More',
      ctaUrl: '',
      imageUrl: '',
      logoUrl: '',
      position: 4,
      status: 'active',
      startsAt: new Date().toISOString().split('T')[0],
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    })
    setEditingBanner(null)
    setShowForm(false)
  }

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner)
    setForm({
      headline: banner.headline,
      description: banner.description || '',
      ctaText: banner.ctaText,
      ctaUrl: banner.ctaUrl,
      imageUrl: banner.imageUrl || '',
      logoUrl: banner.logoUrl || '',
      position: banner.position,
      status: banner.status,
      startsAt: new Date(banner.startsAt).toISOString().split('T')[0],
      expiresAt: new Date(banner.expiresAt).toISOString().split('T')[0],
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    try {
      const method = editingBanner ? 'PATCH' : 'POST'
      const body = editingBanner
        ? { id: editingBanner.id, ...form }
        : form

      const res = await fetch('/api/admin/banners', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (res.ok) {
        resetForm()
        fetchBanners()
      } else {
        alert(data.error || 'Failed to save banner')
      }
    } catch (err) {
      console.error('Failed to save banner:', err)
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return
    try {
      const res = await fetch(`/api/admin/banners?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setBanners(prev => prev.filter(b => b.id !== id))
      }
    } catch (err) {
      console.error('Failed to delete banner:', err)
    }
  }

  const handleToggleStatus = async (banner: Banner) => {
    const newStatus = banner.status === 'active' ? 'paused' : 'active'
    try {
      const res = await fetch('/api/admin/banners', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: banner.id, status: newStatus }),
      })
      if (res.ok) {
        setBanners(prev => prev.map(b =>
          b.id === banner.id ? { ...b, status: newStatus } : b
        ))
      }
    } catch (err) {
      console.error('Failed to toggle banner status:', err)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">In-Feed Banners</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Native sponsored placement between startup listings
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchBanners}
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
            Add Banner
          </Button>
        </div>
      </div>

      {/* Info banner */}
      <div className="rounded-xl border border-border surface p-4">
        <div className="flex items-start gap-3">
          <BarChart3 className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground leading-relaxed">
            <p className="font-medium text-foreground mb-1">How it works</p>
            <p>Banners appear as native cards between startup listings on the homepage. Only <strong>1 active banner</strong> is shown at a time (the most recently created). Set the &quot;Position&quot; to control after which startup card it appears. Users can dismiss banners, and impressions/clicks are tracked automatically.</p>
          </div>
        </div>
      </div>

      {/* Banner Form Modal */}
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
              className="relative w-full max-w-lg rounded-xl border border-border surface p-5 max-h-[90vh] overflow-y-auto"
            >
              <button onClick={resetForm} className="absolute top-4 right-4 p-1 rounded-md hover:bg-muted">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>

              <h2 className="text-lg font-semibold text-foreground mb-4">
                {editingBanner ? 'Edit Banner' : 'Add New Banner'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Headline *</Label>
                  <Input
                    required
                    value={form.headline}
                    onChange={e => setForm(f => ({ ...f, headline: e.target.value }))}
                    className="h-9 text-sm rounded-lg input-bg"
                    placeholder="e.g., DigitalOcean Deploy 26"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Description</Label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    className="w-full min-h-[60px] rounded-lg border border-border bg-card text-foreground px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                    placeholder="Short description shown below the headline"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">CTA Text</Label>
                    <Input
                      value={form.ctaText}
                      onChange={e => setForm(f => ({ ...f, ctaText: e.target.value }))}
                      className="h-9 text-sm rounded-lg input-bg"
                      placeholder="Learn More"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Position (after card #)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={20}
                      value={form.position}
                      onChange={e => setForm(f => ({ ...f, position: parseInt(e.target.value) || 4 }))}
                      className="h-9 text-sm rounded-lg input-bg"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">CTA URL *</Label>
                  <Input
                    required
                    value={form.ctaUrl}
                    onChange={e => setForm(f => ({ ...f, ctaUrl: e.target.value }))}
                    className="h-9 text-sm rounded-lg input-bg"
                    placeholder="https://digitalocean.com/deploy"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Logo URL</Label>
                    <Input
                      value={form.logoUrl}
                      onChange={e => setForm(f => ({ ...f, logoUrl: e.target.value }))}
                      className="h-9 text-sm rounded-lg input-bg"
                      placeholder="https://.../logo.png"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Background Image URL</Label>
                    <Input
                      value={form.imageUrl}
                      onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                      className="h-9 text-sm rounded-lg input-bg"
                      placeholder="https://.../bg.jpg"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Status</Label>
                    <select
                      value={form.status}
                      onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                      className="h-9 text-sm rounded-lg border border-border bg-card text-foreground px-3 w-full"
                    >
                      <option value="active">Active</option>
                      <option value="paused">Paused</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Expires</Label>
                    <Input
                      type="date"
                      value={form.expiresAt}
                      onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                      className="h-9 text-sm rounded-lg input-bg"
                    />
                  </div>
                </div>

                {/* Preview */}
                <div className="rounded-xl border border-orange-500/20 bg-gradient-to-r from-orange-500/5 to-amber-500/5 p-4">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Preview</p>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                      <Megaphone className="w-4 h-4 text-orange-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground truncate">{form.headline || 'Headline'}</p>
                        <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full shrink-0">Sponsored</span>
                      </div>
                      {form.description && <p className="text-xs text-muted-foreground mt-0.5">{form.description}</p>}
                    </div>
                    <span className="text-xs font-medium text-orange-500 bg-orange-500/10 px-2.5 py-1 rounded-lg">{form.ctaText || 'Learn More'} &rarr;</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={resetForm} className="flex-1 h-9 text-sm rounded-lg">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={formLoading} className="flex-1 h-9 text-sm rounded-lg bg-orange-500 hover:bg-orange-600 text-white">
                    {formLoading ? 'Saving...' : editingBanner ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Banner Cards */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl border border-border surface animate-pulse" />
          ))}
        </div>
      ) : banners.length === 0 ? (
        <div className="rounded-xl border border-border surface p-12 text-center">
          <Megaphone className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-sm text-muted-foreground">No banners yet.</p>
          <p className="text-xs text-faint mt-1">Create a banner to show between startup listings.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {banners.map((banner) => {
            const isExpired = new Date(banner.expiresAt) < new Date()
            const daysLeft = Math.max(0, Math.ceil((new Date(banner.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
            const bannerCtr = ctr(banner.clicks, banner.impressions)

            return (
              <motion.div
                key={banner.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-border surface p-4 hover:border-orange-500/20 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {banner.logoUrl ? (
                      <img src={banner.logoUrl} alt="" className="w-10 h-10 rounded-lg object-cover border border-border" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                        <Megaphone className="w-4 h-4 text-orange-500" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-foreground">{banner.headline}</p>
                      <p className="text-[10px] text-faint">{banner.description || banner.ctaUrl}</p>
                      {banner.sponsor && (
                        <p className="text-[10px] text-orange-500 mt-0.5">Linked to: {banner.sponsor.companyName}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'px-2 py-0.5 rounded-full text-[10px] font-medium',
                      statusColors[banner.status] || statusColors.active
                    )}>
                      {banner.status}
                    </span>
                  </div>
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-4 mb-3 text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Eye className="w-3 h-3" />
                    <span>{formatNumber(banner.impressions)} impressions</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <MousePointerClick className="w-3 h-3" />
                    <span>{formatNumber(banner.clicks)} clicks</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <BarChart3 className="w-3 h-3" />
                    <span>{bannerCtr} CTR</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>Position: #{banner.position}</span>
                  </div>
                  {banner.status === 'active' && (
                    <span className={cn(
                      'text-[10px]',
                      daysLeft <= 3 ? 'text-red-400' : daysLeft <= 7 ? 'text-yellow-400' : 'text-muted-foreground'
                    )}>
                      {daysLeft}d left
                    </span>
                  )}
                </div>

                {/* CTA + Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <a
                      href={banner.ctaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-orange-500 hover:text-orange-400 flex items-center gap-1"
                    >
                      {banner.ctaText}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleToggleStatus(banner)}
                      className="p-1.5 rounded-md hover:bg-muted transition-colors"
                      title={banner.status === 'active' ? 'Pause' : 'Activate'}
                    >
                      {banner.status === 'active' ? (
                        <Pause className="w-3.5 h-3.5 text-muted-foreground" />
                      ) : (
                        <Check className="w-3.5 h-3.5 text-green-500" />
                      )}
                    </button>
                    <button
                      onClick={() => handleEdit(banner)}
                      className="p-1.5 rounded-md hover:bg-muted transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => handleDelete(banner.id)}
                      className="p-1.5 rounded-md hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-red-500" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
