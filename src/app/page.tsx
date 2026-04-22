'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Rocket, TrendingUp, Users, Globe, Search, ChevronUp, ExternalLink,
  Star, Filter, Grid, List, ArrowRight, Mail, Sparkles, Trophy,
  Building2, Zap, Target, Award, Clock, MapPin, ChevronDown,
  X, Check, Loader2, Heart, Share2, BookmarkPlus, Menu, XIcon, Gift
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

// ─── Types ───────────────────────────────────────────────────
interface Startup {
  id: string
  name: string
  slug: string
  tagline: string
  description: string | null
  logo: string | null
  website: string
  twitter: string | null
  linkedin: string | null
  category: string
  stage: string
  teamSize: string
  foundedYear: number | null
  country: string | null
  email: string | null
  upvotes: number
  featured: boolean
  status: string
  createdAt: string
  updatedAt: string
  _count?: { votes: number; perks: number }
  perks?: Perk[]
}

interface Perk {
  id: string
  title: string
  description: string
  discount: string | null
  url: string
}

interface Stats {
  totalStartups: number
  totalVotes: number
  totalCategories: number
  featuredCount: number
  topCategories: { name: string; count: number }[]
  stages: { name: string; count: number }[]
}

// ─── Session helper ──────────────────────────────────────────
function getSessionId() {
  if (typeof window === 'undefined') return ''
  let sid = localStorage.getItem('revolaunch_session')
  if (!sid) {
    sid = Math.random().toString(36).substring(2) + Date.now().toString(36)
    localStorage.setItem('revolaunch_session', sid)
  }
  return sid
}

// ─── Category colors ─────────────────────────────────────────
const categoryColors: Record<string, string> = {
  'AI / Machine Learning': 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  'SaaS': 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  'FinTech': 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  'HealthTech': 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  'EdTech': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  'E-Commerce': 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  'DevTools': 'bg-slate-100 text-slate-800 dark:bg-slate-900/40 dark:text-slate-300',
  'Cybersecurity': 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
  'Climate Tech': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  'Web3 / Blockchain': 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300',
  'Productivity': 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300',
  'Social / Community': 'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300',
  'Marketing': 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  'HR / Recruiting': 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
  'Real Estate Tech': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300',
  'Food & Beverage': 'bg-lime-100 text-lime-800 dark:bg-lime-900/40 dark:text-lime-300',
  'Gaming': 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/40 dark:text-fuchsia-300',
  'Mobility': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300',
  'Logistics': 'bg-stone-100 text-stone-800 dark:bg-stone-900/40 dark:text-stone-300',
  'Other': 'bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300',
}

const categoryIcons: Record<string, string> = {
  'AI / Machine Learning': '🤖',
  'SaaS': '☁️',
  'FinTech': '💰',
  'HealthTech': '🏥',
  'EdTech': '📚',
  'E-Commerce': '🛒',
  'DevTools': '🛠️',
  'Cybersecurity': '🔒',
  'Climate Tech': '🌱',
  'Web3 / Blockchain': '⛓️',
  'Productivity': '⚡',
  'Social / Community': '👥',
  'Marketing': '📣',
  'HR / Recruiting': '🤝',
  'Real Estate Tech': '🏠',
  'Food & Beverage': '🍽️',
  'Gaming': '🎮',
  'Mobility': '🚗',
  'Logistics': '📦',
  'Other': '💡',
}

function getCategoryColor(cat: string) {
  return categoryColors[cat] || categoryColors['Other']
}

function getCategoryIcon(cat: string) {
  return categoryIcons[cat] || '💡'
}

function getStageColor(stage: string) {
  switch (stage) {
    case 'Pre-seed': return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
    case 'Seed': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
    case 'Series A': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
    case 'Series B': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
    case 'Growth': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'
    default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
  }
}

// ─── Startup Card ────────────────────────────────────────────
function StartupCard({ startup, onVote, votedStartups }: { 
  startup: Startup; 
  onVote: (slug: string) => void;
  votedStartups: Set<string>;
}) {
  const isVoted = votedStartups.has(startup.slug)
  const [imgError, setImgError] = useState(false)
  const domain = startup.website.replace(/^https?:\/\//, '').replace(/\/$/, '')

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="h-full border border-border/60 hover:border-orange-300/50 dark:hover:border-orange-500/30 hover:shadow-lg dark:hover:shadow-orange-500/5 transition-all duration-300 bg-card group overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            {/* Vote button */}
            <button
              onClick={() => onVote(startup.slug)}
              className={`flex flex-col items-center gap-0.5 min-w-[48px] pt-1 group/vote transition-all duration-200 ${
                isVoted 
                  ? 'text-orange-500' 
                  : 'text-muted-foreground hover:text-orange-500'
              }`}
            >
              <motion.div
                whileTap={{ scale: 0.8 }}
                animate={isVoted ? { scale: [1, 1.3, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                <ChevronUp className={`w-6 h-6 ${isVoted ? 'fill-orange-500' : ''}`} />
              </motion.div>
              <span className="text-sm font-bold tabular-nums">{startup.upvotes}</span>
            </button>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-3">
                {/* Logo */}
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-100 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/20 flex items-center justify-center overflow-hidden shrink-0 border border-border/50">
                  {startup.logo && !imgError ? (
                    <img
                      src={startup.logo}
                      alt={startup.name}
                      className="w-full h-full object-cover"
                      onError={() => setImgError(true)}
                    />
                  ) : (
                    <span className="text-lg">{getCategoryIcon(startup.category)}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-base truncate group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                      {startup.name}
                    </h3>
                    {startup.featured && (
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                    {startup.tagline}
                  </p>
                </div>
              </div>

              {/* Meta info */}
              <div className="flex flex-wrap items-center gap-1.5 mt-3">
                <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium ${getCategoryColor(startup.category)}`}>
                  {startup.category}
                </span>
                <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium ${getStageColor(startup.stage)}`}>
                  {startup.stage}
                </span>
                {startup.country && (
                  <span className="inline-flex items-center text-xs text-muted-foreground gap-1">
                    <MapPin className="w-3 h-3" />{startup.country}
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-3">
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground" asChild>
                  <a href={startup.website} target="_blank" rel="noopener noreferrer">
                    Visit <ExternalLink className="w-3 h-3" />
                  </a>
                </Button>
                {startup.twitter && (
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground" asChild>
                    <a href={`https://x.com/${startup.twitter}`} target="_blank" rel="noopener noreferrer">
                      X/Twitter <ExternalLink className="w-3 h-3" />
                    </a>
                  </Button>
                )}
                {startup._count?.perks && startup._count.perks > 0 && (
                  <Badge variant="secondary" className="text-xs bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400 border-orange-200 dark:border-orange-800">
                    🎁 {startup._count.perks} perk{startup._count.perks > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── Featured Card (large) ───────────────────────────────────
function FeaturedCard({ startup, onVote, votedStartups, onViewDetails }: {
  startup: Startup
  onVote: (slug: string) => void
  votedStartups: Set<string>
  onViewDetails: (startup: Startup) => void
}) {
  const isVoted = votedStartups.has(startup.slug)
  const [imgError, setImgError] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden border-orange-200 dark:border-orange-800/50 hover:shadow-xl dark:hover:shadow-orange-500/10 transition-all duration-300 bg-gradient-to-br from-white to-orange-50/50 dark:from-card dark:to-orange-950/10">
        <CardContent className="p-6">
          <div className="flex items-start gap-5">
            {/* Vote */}
            <button
              onClick={() => onVote(startup.slug)}
              className={`flex flex-col items-center gap-1 min-w-[56px] pt-1 transition-all duration-200 ${
                isVoted ? 'text-orange-500' : 'text-muted-foreground hover:text-orange-500'
              }`}
            >
              <motion.div whileTap={{ scale: 0.8 }} animate={isVoted ? { scale: [1, 1.4, 1] } : {}}>
                <ChevronUp className={`w-7 h-7 ${isVoted ? 'fill-orange-500' : ''}`} />
              </motion.div>
              <span className="text-base font-bold tabular-nums">{startup.upvotes}</span>
            </button>

            {/* Logo */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/20 flex items-center justify-center overflow-hidden shrink-0 border border-orange-200/50 dark:border-orange-800/30">
              {startup.logo && !imgError ? (
                <img src={startup.logo} alt={startup.name} className="w-full h-full object-cover" onError={() => setImgError(true)} />
              ) : (
                <span className="text-2xl">{getCategoryIcon(startup.category)}</span>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-bold group-hover:text-orange-600">{startup.name}</h3>
                <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
                <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Featured</Badge>
              </div>
              <p className="text-muted-foreground mb-3">{startup.tagline}</p>
              {startup.description && (
                <p className="text-sm text-muted-foreground/80 line-clamp-2 mb-3">{startup.description}</p>
              )}

              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getCategoryColor(startup.category)}`}>{startup.category}</span>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStageColor(startup.stage)}`}>{startup.stage}</span>
                {startup.teamSize && <span className="text-xs text-muted-foreground"><Users className="w-3 h-3 inline mr-1" />{startup.teamSize} team</span>}
                {startup.country && <span className="text-xs text-muted-foreground"><Globe className="w-3 h-3 inline mr-1" />{startup.country}</span>}
                {startup.foundedYear && <span className="text-xs text-muted-foreground"><Clock className="w-3 h-3 inline mr-1" />{startup.foundedYear}</span>}
              </div>

              <div className="flex items-center gap-2">
                <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white gap-1.5" onClick={() => onViewDetails(startup)}>
                  View Details <ArrowRight className="w-3.5 h-3.5" />
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={startup.website} target="_blank" rel="noopener noreferrer">
                    Visit Website <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </Button>
                {startup._count?.perks && startup._count.perks > 0 && (
                  <Badge className="bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400 border-orange-200 dark:border-orange-800 px-3 py-1">
                    🎁 {startup._count.perks} perk{startup._count.perks > 1 ? 's' : ''} available
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── Submit Form ─────────────────────────────────────────────
function SubmitForm({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '', tagline: '', description: '', website: '', category: '', stage: 'Pre-seed',
    teamSize: '1-5', foundedYear: '', country: '', email: '', twitter: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.tagline || !form.website || !form.category) {
      toast.error('Please fill in all required fields')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/startups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, foundedYear: form.foundedYear ? parseInt(form.foundedYear) : null }),
      })
      if (res.ok) {
        toast.success('🎉 Startup submitted successfully! It will appear after review.')
        onClose()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to submit startup')
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Startup Name *</label>
          <Input placeholder="e.g., Acme Inc." value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Website *</label>
          <Input placeholder="https://yourstartup.com" value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} required />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Tagline *</label>
        <Input placeholder="One sentence that describes your startup" value={form.tagline} onChange={e => setForm({ ...form, tagline: e.target.value })} required />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <textarea
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Tell us more about your startup..."
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Category *</label>
          <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
            <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
            <SelectContent>
              {Object.keys(categoryIcons).map(cat => (
                <SelectItem key={cat} value={cat}>{getCategoryIcon(cat)} {cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Stage</label>
          <Select value={form.stage} onValueChange={v => setForm({ ...form, stage: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Pre-seed">Pre-seed</SelectItem>
              <SelectItem value="Seed">Seed</SelectItem>
              <SelectItem value="Series A">Series A</SelectItem>
              <SelectItem value="Series B">Series B</SelectItem>
              <SelectItem value="Growth">Growth</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Team Size</label>
          <Select value={form.teamSize} onValueChange={v => setForm({ ...form, teamSize: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1-5">1-5</SelectItem>
              <SelectItem value="6-20">6-20</SelectItem>
              <SelectItem value="21-50">21-50</SelectItem>
              <SelectItem value="51-200">51-200</SelectItem>
              <SelectItem value="200+">200+</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Founded Year</label>
          <Input type="number" placeholder="2024" value={form.foundedYear} onChange={e => setForm({ ...form, foundedYear: e.target.value })} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Country</label>
          <Input placeholder="United States" value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Contact Email</label>
          <Input type="email" placeholder="founder@startup.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Twitter Handle</label>
          <Input placeholder="@yourstartup" value={form.twitter} onChange={e => setForm({ ...form, twitter: e.target.value })} />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={loading} className="bg-orange-500 hover:bg-orange-600 text-white">
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Submit Startup
        </Button>
      </div>
    </form>
  )
}

// ─── Newsletter Form ─────────────────────────────────────────
function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      toast.success(data.message || 'Subscribed successfully!')
      setEmail('')
    } catch {
      toast.error('Failed to subscribe')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 w-full max-w-md">
      <Input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
        required
      />
      <Button type="submit" disabled={loading} variant="secondary" className="shrink-0 bg-white text-orange-600 hover:bg-white/90 font-semibold">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Subscribe'}
      </Button>
    </form>
  )
}

// ─── Main Page ───────────────────────────────────────────────
export default function Home() {
  const [startups, setStartups] = useState<Startup[]>([])
  const [featured, setFeatured] = useState<Startup[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [categories, setCategories] = useState<{ name: string; count: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [votedStartups, setVotedStartups] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedStage, setSelectedStage] = useState('all')
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showSubmit, setShowSubmit] = useState(false)
  const [selectedStartup, setSelectedStartup] = useState<Startup | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('featured')

  // Load initial data
  useEffect(() => {
    async function loadData() {
      try {
        const [startupsRes, featuredRes, statsRes, categoriesRes] = await Promise.all([
          fetch('/api/startups?limit=12&sort=popular'),
          fetch('/api/startups?featured=true&limit=4'),
          fetch('/api/stats'),
          fetch('/api/categories'),
        ])
        const startupsData = await startupsRes.json()
        const featuredData = await featuredRes.json()
        const statsData = await statsRes.json()
        const categoriesData = await categoriesRes.json()

        setStartups(startupsData.startups || [])
        setTotalPages(startupsData.totalPages || 1)
        setFeatured(featuredData.startups || [])
        setStats(statsData)
        setCategories(categoriesData.categories || [])
      } catch (err) {
        console.error('Failed to load data:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Load startups with filters
  const loadStartups = useCallback(async (newPage = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: newPage.toString(),
        limit: '12',
        sort,
      })
      if (selectedCategory !== 'all') params.set('category', selectedCategory)
      if (selectedStage !== 'all') params.set('stage', selectedStage)
      if (search) params.set('search', search)

      const res = await fetch(`/api/startups?${params}`)
      const data = await res.json()
      setStartups(data.startups || [])
      setTotalPages(data.totalPages || 1)
      setPage(newPage)
    } catch {
      toast.error('Failed to load startups')
    } finally {
      setLoading(false)
    }
  }, [sort, selectedCategory, selectedStage, search])

  useEffect(() => {
    if (activeTab === 'all') {
      loadStartups(1)
    }
  }, [activeTab, loadStartups])

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
      } else {
        setVotedStartups(prev => {
          const next = new Set(prev)
          next.delete(slug)
          return next
        })
      }
      // Update local state
      setStartups(prev => prev.map(s => s.slug === slug ? { ...s, upvotes: data.upvotes } : s))
      setFeatured(prev => prev.map(s => s.slug === slug ? { ...s, upvotes: data.upvotes } : s))
    } catch {
      toast.error('Failed to vote')
    }
  }

  const handleViewDetails = async (startup: Startup) => {
    try {
      const res = await fetch(`/api/startups/${startup.slug}`)
      const data = await res.json()
      setSelectedStartup(data.startup)
    } catch {
      setSelectedStartup(startup)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ─── Header ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center">
                <Rocket className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                Revolaunch
              </span>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={() => { setActiveTab('featured'); document.getElementById('startups-section')?.scrollIntoView({ behavior: 'smooth' }) }}>
                <TrendingUp className="w-4 h-4 mr-1.5" /> Featured
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setActiveTab('all'); document.getElementById('startups-section')?.scrollIntoView({ behavior: 'smooth' }) }}>
                <Grid className="w-4 h-4 mr-1.5" /> All Startups
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setActiveTab('categories'); document.getElementById('categories-section')?.scrollIntoView({ behavior: 'smooth' }) }}>
                <Building2 className="w-4 h-4 mr-1.5" /> Categories
              </Button>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Dialog open={showSubmit} onOpenChange={setShowSubmit}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/20 gap-1.5">
                    <Rocket className="w-4 h-4" /> Launch
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Rocket className="w-5 h-5 text-orange-500" />
                      Launch Your Startup
                    </DialogTitle>
                    <DialogDescription>Submit your startup to Revolaunch and reach thousands of potential users and investors.</DialogDescription>
                  </DialogHeader>
                  <SubmitForm onClose={() => setShowSubmit(false)} />
                </DialogContent>
              </Dialog>

              {/* Mobile menu */}
              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Nav */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.nav
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden pb-4 space-y-1"
              >
                <Button variant="ghost" className="w-full justify-start" onClick={() => { setActiveTab('featured'); setMobileMenuOpen(false); document.getElementById('startups-section')?.scrollIntoView({ behavior: 'smooth' }) }}>
                  <TrendingUp className="w-4 h-4 mr-2" /> Featured
                </Button>
                <Button variant="ghost" className="w-full justify-start" onClick={() => { setActiveTab('all'); setMobileMenuOpen(false); document.getElementById('startups-section')?.scrollIntoView({ behavior: 'smooth' }) }}>
                  <Grid className="w-4 h-4 mr-2" /> All Startups
                </Button>
                <Button variant="ghost" className="w-full justify-start" onClick={() => { setActiveTab('categories'); setMobileMenuOpen(false); document.getElementById('categories-section')?.scrollIntoView({ behavior: 'smooth' }) }}>
                  <Building2 className="w-4 h-4 mr-2" /> Categories
                </Button>
              </motion.nav>
            )}
          </AnimatePresence>
        </div>
      </header>

      <main className="flex-1">
        {/* ─── Hero Section ────────────────────────────────── */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-amber-500/5" />
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-1/4 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl" />
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-4xl mx-auto"
            >
              <Badge variant="secondary" className="mb-6 px-4 py-1.5 bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400 border-orange-200 dark:border-orange-800 text-sm font-medium">
                <Rocket className="w-3.5 h-3.5 mr-1.5" /> The Evolution of Startup Launching
              </Badge>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                Discover, Launch & Fund{' '}
                <span className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 bg-clip-text text-transparent">
                  the Next Big Thing
                </span>
              </h1>
              
              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
                The next-generation platform for startups, founders, and investors. Launch your product, gain visibility, and connect with the right people.
              </p>

              {/* Search bar */}
              <div className="max-w-xl mx-auto mb-10">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Search startups, categories, or keywords..."
                    className="pl-12 pr-4 h-12 text-base rounded-2xl border-2 border-border/50 focus:border-orange-400 dark:focus:border-orange-500 bg-card shadow-lg shadow-black/5 transition-all"
                    value={search}
                    onChange={e => { setSearch(e.target.value); setActiveTab('all') }}
                  />
                </div>
              </div>

              {/* Stats */}
              {stats && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="flex flex-wrap items-center justify-center gap-6 sm:gap-10"
                >
                  <div className="flex items-center gap-2">
                    <Rocket className="w-5 h-5 text-orange-500" />
                    <div className="text-left">
                      <div className="text-2xl font-bold">{stats.totalStartups}+</div>
                      <div className="text-xs text-muted-foreground">Startups</div>
                    </div>
                  </div>
                  <div className="w-px h-10 bg-border" />
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-orange-500" />
                    <div className="text-left">
                      <div className="text-2xl font-bold">{stats.totalVotes}+</div>
                      <div className="text-xs text-muted-foreground">Votes</div>
                    </div>
                  </div>
                  <div className="w-px h-10 bg-border hidden sm:block" />
                  <div className="hidden sm:flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-orange-500" />
                    <div className="text-left">
                      <div className="text-2xl font-bold">{stats.totalCategories}+</div>
                      <div className="text-xs text-muted-foreground">Categories</div>
                    </div>
                  </div>
                  <div className="w-px h-10 bg-border hidden sm:block" />
                  <div className="hidden sm:flex items-center gap-2">
                    <Globe className="w-5 h-5 text-orange-500" />
                    <div className="text-left">
                      <div className="text-2xl font-bold">50+</div>
                      <div className="text-xs text-muted-foreground">Countries</div>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>
        </section>

        {/* ─── Startups Section ────────────────────────────── */}
        <section id="startups-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
              <TabsList className="bg-muted/50">
                <TabsTrigger value="featured" className="gap-1.5">
                  <Trophy className="w-4 h-4" /> Featured
                </TabsTrigger>
                <TabsTrigger value="all" className="gap-1.5">
                  <Grid className="w-4 h-4" /> All Startups
                </TabsTrigger>
              </TabsList>

              {/* Filters (visible in All tab) */}
              {activeTab === 'all' && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex flex-wrap items-center gap-2"
                >
                  <Select value={selectedCategory} onValueChange={v => { setSelectedCategory(v); loadStartups(1) }}>
                    <SelectTrigger className="w-[160px] h-9 text-sm"><SelectValue placeholder="Category" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(c => (
                        <SelectItem key={c.name} value={c.name}>{getCategoryIcon(c.name)} {c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedStage} onValueChange={v => { setSelectedStage(v); loadStartups(1) }}>
                    <SelectTrigger className="w-[130px] h-9 text-sm"><SelectValue placeholder="Stage" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Stages</SelectItem>
                      <SelectItem value="Pre-seed">Pre-seed</SelectItem>
                      <SelectItem value="Seed">Seed</SelectItem>
                      <SelectItem value="Series A">Series A</SelectItem>
                      <SelectItem value="Series B">Series B</SelectItem>
                      <SelectItem value="Growth">Growth</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={sort} onValueChange={v => { setSort(v); loadStartups(1) }}>
                    <SelectTrigger className="w-[130px] h-9 text-sm"><SelectValue placeholder="Sort" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="popular">Most Voted</SelectItem>
                      <SelectItem value="oldest">Oldest</SelectItem>
                    </SelectContent>
                  </Select>
                </motion.div>
              )}
            </div>

            {/* Featured Tab */}
            <TabsContent value="featured">
              {loading && !featured.length ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-48 rounded-xl" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence mode="popLayout">
                    {featured.map(startup => (
                      <FeaturedCard
                        key={startup.id}
                        startup={startup}
                        onVote={handleVote}
                        votedStartups={votedStartups}
                        onViewDetails={handleViewDetails}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </TabsContent>

            {/* All Startups Tab */}
            <TabsContent value="all">
              {loading && !startups.length ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-44 rounded-xl" />
                  ))}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <AnimatePresence mode="popLayout">
                      {startups.map(startup => (
                        <StartupCard
                          key={startup.id}
                          startup={startup}
                          onVote={handleVote}
                          votedStartups={votedStartups}
                        />
                      ))}
                    </AnimatePresence>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-8">
                      <Button
                        variant="outline" size="sm"
                        disabled={page <= 1}
                        onClick={() => loadStartups(page - 1)}
                      >
                        Previous
                      </Button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                        <Button
                          key={p}
                          variant={p === page ? 'default' : 'outline'}
                          size="sm"
                          className={p === page ? 'bg-orange-500 hover:bg-orange-600 text-white' : ''}
                          onClick={() => loadStartups(p)}
                        >
                          {p}
                        </Button>
                      ))}
                      <Button
                        variant="outline" size="sm"
                        disabled={page >= totalPages}
                        onClick={() => loadStartups(page + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </section>

        {/* ─── Categories Section ──────────────────────────── */}
        <section id="categories-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-3xl font-bold mb-3">Browse by Category</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Explore startups across different industries and find the ones that match your interests.</p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {categories.map((cat, i) => (
              <motion.button
                key={cat.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.03 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setSelectedCategory(cat.name)
                  setActiveTab('all')
                  loadStartups(1)
                  document.getElementById('startups-section')?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border/60 bg-card hover:border-orange-300 dark:hover:border-orange-700 hover:shadow-md transition-all duration-200 group"
              >
                <span className="text-2xl">{getCategoryIcon(cat.name)}</span>
                <span className="text-sm font-medium text-center leading-tight">{cat.name}</span>
                <Badge variant="secondary" className="text-xs">{cat.count}</Badge>
              </motion.button>
            ))}
          </div>
        </section>

        {/* ─── Stages Section ──────────────────────────────── */}
        {stats && stats.stages.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-10"
            >
              <h2 className="text-3xl font-bold mb-3">By Funding Stage</h2>
              <p className="text-muted-foreground">From idea to growth — see where startups are in their journey.</p>
            </motion.div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {stats.stages.map((stage, i) => (
                <motion.div
                  key={stage.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="text-center p-6 rounded-xl border border-border/60 bg-card hover:shadow-md transition-all"
                >
                  <div className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">{stage.count}</div>
                  <div className="text-sm text-muted-foreground mt-1">{stage.name}</div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* ─── CTA Section ─────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 p-[2px]"
          >
            <div className="rounded-3xl bg-gradient-to-r from-orange-500 to-amber-600 px-8 sm:px-16 py-16 sm:py-20 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.15),transparent)]" />
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
              <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
              
              <div className="relative z-10">
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                  Ready to Launch?
                </h2>
                <p className="text-white/80 text-lg max-w-xl mx-auto mb-8">
                  Join hundreds of startups that are already getting discovered on Revolaunch. Submit your startup today — it&apos;s completely free.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Button
                    size="lg"
                    className="bg-white text-orange-600 hover:bg-white/90 font-semibold text-base px-8 gap-2 shadow-xl"
                    onClick={() => setShowSubmit(true)}
                  >
                    <Rocket className="w-5 h-5" /> Submit Your Startup
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/10 text-base px-8 gap-2"
                    onClick={() => { setActiveTab('all'); document.getElementById('startups-section')?.scrollIntoView({ behavior: 'smooth' }) }}
                  >
                    Browse Startups <ArrowRight className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ─── Newsletter Section ──────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-lg mx-auto"
          >
            <Mail className="w-8 h-8 text-orange-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">Stay in the Loop</h3>
            <p className="text-muted-foreground mb-6">Get weekly updates on the hottest new startups, exclusive perks, and founder stories.</p>
            <NewsletterForm />
          </motion.div>
        </section>
      </main>

      {/* ─── Footer ─────────────────────────────────────────── */}
      <footer className="border-t border-border/40 bg-muted/30 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center">
                  <Rocket className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-bold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">Revolaunch</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-xs">
                The evolution of startup launching. Discover, launch, and fund the most innovative startups worldwide.
              </p>
            </div>

            {/* Platform */}
            <div>
              <h4 className="font-semibold mb-4 text-sm">Platform</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><button className="hover:text-foreground transition-colors" onClick={() => { setActiveTab('featured'); document.getElementById('startups-section')?.scrollIntoView({ behavior: 'smooth' }) }}>Featured Startups</button></li>
                <li><button className="hover:text-foreground transition-colors" onClick={() => { setActiveTab('all'); document.getElementById('startups-section')?.scrollIntoView({ behavior: 'smooth' }) }}>All Startups</button></li>
                <li><button className="hover:text-foreground transition-colors" onClick={() => { document.getElementById('categories-section')?.scrollIntoView({ behavior: 'smooth' }) }}>Categories</button></li>
                <li><button className="hover:text-foreground transition-colors" onClick={() => setShowSubmit(true)}>Submit Startup</button></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-semibold mb-4 text-sm">Company</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><span className="hover:text-foreground transition-colors cursor-pointer">About</span></li>
                <li><span className="hover:text-foreground transition-colors cursor-pointer">Blog</span></li>
                <li><span className="hover:text-foreground transition-colors cursor-pointer">For Investors</span></li>
                <li><span className="hover:text-foreground transition-colors cursor-pointer">For Founders</span></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold mb-4 text-sm">Legal</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><span className="hover:text-foreground transition-colors cursor-pointer">Terms of Service</span></li>
                <li><span className="hover:text-foreground transition-colors cursor-pointer">Privacy Policy</span></li>
                <li><span className="hover:text-foreground transition-colors cursor-pointer">Cookie Policy</span></li>
              </ul>
            </div>
          </div>

          <Separator className="mb-6" />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Revolaunch. All rights reserved.</p>
            <p className="flex items-center gap-1">
              Built with <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> for founders everywhere
            </p>
          </div>
        </div>
      </footer>

      {/* ─── Startup Detail Dialog ──────────────────────────── */}
      <Dialog open={!!selectedStartup} onOpenChange={() => setSelectedStartup(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedStartup && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-100 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/20 flex items-center justify-center text-2xl">
                    {getCategoryIcon(selectedStartup.category)}
                  </div>
                  <div>
                    <DialogTitle className="text-xl flex items-center gap-2">
                      {selectedStartup.name}
                      {selectedStartup.featured && <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />}
                    </DialogTitle>
                    <DialogDescription>{selectedStartup.tagline}</DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {selectedStartup.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed">{selectedStartup.description}</p>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${getCategoryColor(selectedStartup.category)}`}>{selectedStartup.category}</span>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${getStageColor(selectedStartup.stage)}`}>{selectedStartup.stage}</span>
                  {selectedStartup.teamSize && (
                    <Badge variant="outline" className="text-xs"><Users className="w-3 h-3 mr-1" />{selectedStartup.teamSize}</Badge>
                  )}
                  {selectedStartup.foundedYear && (
                    <Badge variant="outline" className="text-xs"><Clock className="w-3 h-3 mr-1" />{selectedStartup.foundedYear}</Badge>
                  )}
                  {selectedStartup.country && (
                    <Badge variant="outline" className="text-xs"><Globe className="w-3 h-3 mr-1" />{selectedStartup.country}</Badge>
                  )}
                  <Badge variant="outline" className="text-xs"><ChevronUp className="w-3 h-3 mr-1" />{selectedStartup.upvotes} votes</Badge>
                </div>

                <div className="flex gap-2">
                  <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={() => { handleVote(selectedStartup.slug) }} asChild>
                    <span>
                      <ChevronUp className="w-4 h-4" />
                      {votedStartups.has(selectedStartup.slug) ? 'Unvote' : 'Upvote'}
                    </span>
                  </Button>
                  <Button variant="outline" asChild>
                    <a href={selectedStartup.website} target="_blank" rel="noopener noreferrer">
                      Visit Website <ExternalLink className="w-3.5 h-3.5 ml-1" />
                    </a>
                  </Button>
                </div>

                {/* Perks */}
                {selectedStartup.perks && selectedStartup.perks.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Gift className="w-4 h-4 text-orange-500" /> Community Perks
                    </h4>
                    <div className="space-y-2">
                      {selectedStartup.perks.map(perk => (
                        <div key={perk.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50">
                          <div>
                            <div className="font-medium text-sm">{perk.title}</div>
                            <div className="text-xs text-muted-foreground">{perk.description}</div>
                          </div>
                          {perk.discount && (
                            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs">{perk.discount}</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
