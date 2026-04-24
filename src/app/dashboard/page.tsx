'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Rocket, Plus, Star, TrendingUp, BarChart3, Briefcase, Handshake,
  Gift, Users, Calendar, Inbox, LayoutDashboard, ChevronRight, ExternalLink,
  Mail, Trash2, Pencil, Copy, Check, Search, Clock, MapPin, DollarSign,
  Trophy, MessageSquare, Share2, Linkedin, Twitter, Send, X, Eye, EyeOff,
  Zap, Target, ChevronDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Header from '@/components/Header'
import StartupLogo from '@/components/StartupLogo'
import FollowButton from '@/components/FollowButton'
import { useFollowing } from '@/hooks/use-following'
import type { FollowingActivity } from '@/hooks/use-following'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, AreaChart, Area, PieChart, Pie, Cell, CartesianGrid } from 'recharts'
import { toast } from 'sonner'
import {
  fallbackStartups, fallbackPerks, fallbackCommunityBoards,
  fallbackWeeklyWinners, fallbackStats
} from '@/lib/fallback-data'
import { getCategoryIcon, getCategoryColor, getStageColor } from '@/lib/fallback-data'

// ─── localStorage helpers ───
function getLS<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch { return fallback }
}
function setLS(key: string, value: any) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
}

// ─── Default data for initialization ───
const defaultMessages = [
  { id: 'm1', from: 'Revolaunch Team', subject: 'Welcome to Revolaunch!', body: 'Hi there! Your Revolaunch account is ready. List your first startup and start competing for the weekly leaderboard. We are excited to have you in our growing community of startup enthusiasts.', timestamp: new Date(Date.now() - 86400000).toISOString(), read: false, type: 'system' },
  { id: 'm2', from: 'Community Hub', subject: 'Weekly leaderboard results are in', body: 'Congratulations to MGX (Atoms) for winning this week with 800 points! Check out the full leaderboard and see how your startups are performing. Keep up the great work!', timestamp: new Date(Date.now() - 172800000).toISOString(), read: false, type: 'community' },
  { id: 'm3', from: 'Revolaunch Team', subject: 'New perks available for you', body: 'We have added 10 new exclusive perks from top startups including Atoms, Cursor, and Stripe. Head to My Perks to claim your discounts before they expire!', timestamp: new Date(Date.now() - 259200000).toISOString(), read: true, type: 'notification' },
  { id: 'm4', from: 'Community Hub', subject: 'Someone reviewed your startup', body: 'A community member left a 5-star review on one of your listed startups. Log in to see the review and respond. Reviews help build credibility with investors and users.', timestamp: new Date(Date.now() - 345600000).toISOString(), read: true, type: 'community' },
]

const defaultJobs = [
  { id: 'j1', title: 'Senior Full-Stack Engineer', company: 'Bolt.new', location: 'remote', type: 'full-time', salaryRange: '$150K - $200K', description: 'Join the team building the AI-powered full-stack web app builder. Work with cutting-edge AI and web technologies.', applyUrl: 'https://bolt.new/careers', postedDate: new Date(Date.now() - 86400000).toISOString() },
  { id: 'j2', title: 'Product Designer', company: 'Lovable', location: 'hybrid', type: 'full-time', salaryRange: '$120K - $160K', description: 'Design beautiful, intuitive interfaces for our AI software builder platform. You will shape how thousands of people create apps.', applyUrl: 'https://lovable.dev/careers', postedDate: new Date(Date.now() - 259200000).toISOString() },
  { id: 'j3', title: 'Developer Advocate', company: 'Supabase', location: 'remote', type: 'contract', salaryRange: '$100K - $140K', description: 'Help developers build with Supabase through tutorials, demos, and community engagement. Remote-first position.', applyUrl: 'https://supabase.com/careers', postedDate: new Date(Date.now() - 432000000).toISOString() },
]

const defaultProfile = {
  firstName: 'Alex',
  lastName: 'Johnson',
  role: 'Founder & CEO',
  email: 'alex@startup.io',
  twitter: '@alexjohnson',
  linkedin: 'linkedin.com/in/alexjohnson',
  bio: 'Passionate about building products that make a difference. Currently working on an AI-powered SaaS tool for small businesses.',
  country: 'United States',
}

// ─── Sidebar items ───
const sidebarItems = [
  { name: 'Dashboard', icon: LayoutDashboard },
  { name: 'Inbox', icon: Inbox },
  { name: 'Followed Founders', icon: Users },
  { name: 'My Startups', icon: Rocket },
  { name: 'My Profile', icon: Users },
  { name: 'My Reviews', icon: Star },
  { name: 'My Signals', icon: TrendingUp },
  { name: 'My Jobs', icon: Briefcase },
  { name: 'My Perks', icon: Gift },
  { name: 'My Affiliate', icon: Users },
  { name: 'Content Scheduler', icon: Calendar },
  { name: 'Earn $25', icon: Handshake },
]

// ─── Animation variants ───
const fadeIn = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } }
const scaleIn = { initial: { opacity: 0, scale: 0.96 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 0.25 } }

// ─── Chart configs ───
const activityChartConfig = { activity: { label: 'Activity', color: '#F97316' } } satisfies ChartConfig
const categoryDistConfig = { count: { label: 'Startups', color: '#F97316' } } satisfies ChartConfig
const perkChartConfig = { claimed: { label: 'Claimed', color: '#EC4899' }, total: { label: 'Total', color: '#64748B' } } satisfies ChartConfig

const CATEGORY_COLORS = ['#F97316', '#3B82F6', '#22C55E', '#8B5CF6', '#EF4444', '#06B6D4', '#F59E0B', '#EC4899']

// ─── Helper: format date ───
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
function fmtRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

// ─── Main component ───
export default function DashboardPage() {
  const [activeItem, setActiveItem] = useState('Dashboard')

  // ──── Dashboard state ────
  const [messages, setMessages] = useState<any[]>(() => getLS('revolaunch_messages', defaultMessages))
  const [myStartups, setMyStartups] = useState<any[]>(() => getLS('revolaunch_my_startups', []))
  const [profile, setProfile] = useState<any>(() => getLS('revolaunch_profile', defaultProfile))
  const [reviews, setReviews] = useState<any[]>(() => getLS('revolaunch_reviews', []))
  const [signals, setSignals] = useState<any[]>(() => getLS('revolaunch_signals', []))
  const [jobs, setJobs] = useState<any[]>(() => getLS('revolaunch_jobs', defaultJobs))
  const [claimedPerks, setClaimedPerks] = useState<string[]>(() => getLS('revolaunch_claimed_perks', []))
  const [affiliateCode, setAffiliateCode] = useState(() => {
    const existing = getLS('revolaunch_affiliate_code', '')
    if (existing) return existing
    if (typeof window !== 'undefined') {
      const code = 'REV-' + Math.random().toString(36).substring(2, 8).toUpperCase()
      try { localStorage.setItem('revolaunch_affiliate_code', JSON.stringify(code)) } catch {}
      return code
    }
    return 'REV-PENDING'
  })
  const [affiliateStats, setAffiliateStats] = useState(() => getLS('revolaunch_affiliate_stats', { clicks: 12, signups: 3 }))
  const [contentItems, setContentItems] = useState<any[]>(() => getLS('revolaunch_content', []))
  const [earnedTotal, setEarnedTotal] = useState(() => getLS('revolaunch_earned_total', 75))
  const [referralActivity, setReferralActivity] = useState<any[]>(() => getLS('revolaunch_referral_activity', [
    { id: 'ra1', name: 'Sarah K.', date: new Date(Date.now() - 86400000).toISOString(), earned: 25 },
    { id: 'ra2', name: 'Mike T.', date: new Date(Date.now() - 172800000).toISOString(), earned: 25 },
    { id: 'ra3', name: 'Lin W.', date: new Date(Date.now() - 432000000).toISOString(), earned: 25 },
  ]))

  // Follow hook
  const { isFollowing, toggleFollow, getFollowerCount, getFormattedFollowerCount, getActivityFeed, getFollowedStartups, followedIds } = useFollowing()

  // UI toggles
  const [expandedMsg, setExpandedMsg] = useState<string | null>(null)
  const [editingStartup, setEditingStartup] = useState<string | null>(null)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [showSignalSearch, setShowSignalSearch] = useState(false)
  const [signalSearch, setSignalSearch] = useState('')
  const [showJobForm, setShowJobForm] = useState(false)
  const [showContentForm, setShowContentForm] = useState(false)
  const [copied, setCopied] = useState(false)

  // Review form
  const [reviewStartup, setReviewStartup] = useState('')
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewComment, setReviewComment] = useState('')

  // Job form
  const [jobForm, setJobForm] = useState({ title: '', company: '', location: 'remote', type: 'full-time', salaryRange: '', description: '', applyUrl: '' })

  // Content form
  const [contentForm, setContentForm] = useState({ title: '', type: 'tweet', scheduledDate: '', status: 'draft' })

  // Profile edit state
  const [editProfile, setEditProfile] = useState(false)
  const [profileForm, setProfileForm] = useState(defaultProfile)

  // ──── Generate affiliate code if none exists (handled via lazy init) ────
  // Note: affiliate code is auto-generated on first render via the lazy useState initializer above

  // Persist helpers
  const saveMessages = (m: any[]) => { setMessages(m); setLS('revolaunch_messages', m) }
  const saveStartups = (s: any[]) => { setMyStartups(s); setLS('revolaunch_my_startups', s) }
  const saveProfile = (p: any) => { setProfile(p); setLS('revolaunch_profile', p) }
  const saveReviews = (r: any[]) => { setReviews(r); setLS('revolaunch_reviews', r) }
  const saveSignals = (s: any[]) => { setSignals(s); setLS('revolaunch_signals', s) }
  const saveJobs = (j: any[]) => { setJobs(j); setLS('revolaunch_jobs', j) }
  const saveClaimed = (c: string[]) => { setClaimedPerks(c); setLS('revolaunch_claimed_perks', c) }
  const saveContent = (c: any[]) => { setContentItems(c); setLS('revolaunch_content', c) }

  // ─── Derived values ───
  const unreadCount = messages.filter(m => !m.read).length
  const profileCompletion = Math.min(100, Math.round([
    !!profile.firstName, !!profile.lastName, !!profile.role, !!profile.email,
    !!profile.bio, !!profile.country, !!profile.twitter, !!profile.linkedin
  ].filter(Boolean).length / 8 * 100))

  // Sidebar badge data
  const getBadge = (name: string) => {
    if (name === 'Inbox' && unreadCount > 0) return String(unreadCount)
    if (name === 'My Reviews') return String(reviews.length)
    if (name === 'My Jobs') return String(jobs.length)
    if (name === 'My Signals') return String(signals.length)
    if (name === 'Followed Founders' && followedIds.length > 0) return String(followedIds.length)
    return undefined
  }

  // ─── Build all perks list ───
  const allPerks = Object.entries(fallbackPerks).flatMap(([slug, perks]) =>
    perks.map(p => {
      const startup = fallbackStartups.find(s => s.slug === slug)
      return { ...p, slug, startupName: startup?.name || slug, startupLogo: startup?.logo, startupWebsite: startup?.website, startupLogoColor: startup?.logoColor }
    })
  )

  // ─── Week days for content scheduler ───
  const getWeekDays = () => {
    const now = new Date()
    const day = now.getDay()
    const monday = new Date(now)
    monday.setDate(now.getDate() - ((day + 6) % 7))
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      return { date: d.toISOString().split('T')[0], label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }), dayName: d.toLocaleDateString('en-US', { weekday: 'long' }), isToday: d.toDateString() === now.toDateString() }
    })
  }

  // ═══════════════════════════════════════════
  // SECTION RENDERERS
  // ═══════════════════════════════════════════

  // ─── 1. Dashboard Overview ───
  const renderDashboard = () => (
    <motion.div {...fadeIn} className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground mb-1">Startup Panel</h1>
        <p className="text-xs text-muted-foreground">Overview of your activity and quick actions</p>
      </div>

      {/* Profile completion */}
      <div className="rounded-xl border subtle-border surface p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground">Profile Completion</h2>
          <span className="text-xs text-orange-500 font-medium">{profileCompletion}%</span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-3">
          <motion.div className="h-full bg-orange-500 rounded-full" initial={{ width: 0 }} animate={{ width: `${profileCompletion}%` }} transition={{ duration: 0.8 }} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Add name & role', done: !!(profile.firstName && profile.lastName && profile.role) },
            { label: 'List a startup', done: myStartups.length > 0 },
            { label: 'Complete bio', done: !!profile.bio },
            { label: 'Connect socials', done: !!(profile.twitter && profile.linkedin) },
          ].map((task) => (
            <div key={task.label} className="flex items-center gap-2 text-xs">
              <span className={`w-4 h-4 rounded-full flex items-center justify-center ${task.done ? 'bg-green-500/20 text-green-500' : 'bg-muted text-muted-foreground'}`}>
                {task.done ? '✓' : '○'}
              </span>
              <span className={task.done ? 'text-muted-foreground line-through' : 'text-foreground'}>{task.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'My Startups', value: myStartups.length, icon: Rocket, color: 'text-orange-500', bg: 'bg-orange-500/10' },
          { label: 'Reviews Given', value: reviews.length, icon: Star, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { label: 'Signals Tracked', value: signals.length, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Perks Claimed', value: claimedPerks.length, icon: Gift, color: 'text-pink-500', bg: 'bg-pink-500/10' },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl border subtle-border surface p-4">
            <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center mb-2`}>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <p className="text-lg font-bold text-foreground">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        <Link href="/submit"><Button className="bg-orange-500 hover:bg-orange-600 text-white text-xs h-8 rounded-lg"><Plus className="w-3.5 h-3.5 mr-1.5" />Add Startup</Button></Link>
        <Button variant="outline" className="text-xs h-8 rounded-lg" onClick={() => setActiveItem('My Perks')}><Gift className="w-3.5 h-3.5 mr-1.5" />Browse Perks</Button>
        <Button variant="outline" className="text-xs h-8 rounded-lg" onClick={() => setActiveItem('Dashboard')}><Trophy className="w-3.5 h-3.5 mr-1.5" />Leaderboard</Button>
      </div>

      {/* Recent Inbox */}
      <div className="rounded-xl border subtle-border surface overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b subtle-border">
          <div className="flex items-center gap-2">
            <Inbox className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Recent Inbox</h2>
          </div>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-600 dark:text-orange-300 border border-orange-500/30 h-5">
              {unreadCount} new
            </Badge>
          )}
        </div>
        <div className="divide-y divide-border">
          {messages.slice(0, 3).map(msg => (
            <button key={msg.id} className="w-full p-4 surface-hover transition-colors text-left" onClick={() => { setActiveItem('Inbox') }}>
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${msg.type === 'system' ? 'bg-orange-500/20' : msg.type === 'community' ? 'bg-emerald-500/20' : 'bg-amber-500/20'}`}>
                  <Mail className={`w-4 h-4 ${msg.type === 'system' ? 'text-orange-500' : msg.type === 'community' ? 'text-emerald-500' : 'text-amber-500'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className={`text-sm ${!msg.read ? 'font-semibold' : 'font-medium'} text-foreground truncate`}>{msg.subject}</p>
                    {!msg.read && <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-600 dark:text-orange-300 shrink-0">New</span>}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">{msg.body}</p>
                  <p className="text-[10px] text-faint mt-1">from {msg.from} · {fmtRelative(msg.timestamp)}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Weekly Activity chart */}
        <div className="rounded-xl border subtle-border surface p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-orange-500" />
            <h2 className="text-sm font-semibold text-foreground">Platform Activity</h2>
          </div>
          <ChartContainer config={activityChartConfig} className="h-[140px] w-full">
            <BarChart data={fallbackStats.weeklyGrowth.map(w => ({ week: w.week.replace('Week ', 'W'), activity: w.startups }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="activity" fill="var(--color-activity)" radius={[3, 3, 0, 0]} barSize={16} />
            </BarChart>
          </ChartContainer>
        </div>

        {/* Category distribution pie */}
        <div className="rounded-xl border subtle-border surface p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-orange-500" />
            <h2 className="text-sm font-semibold text-foreground">Startup Categories</h2>
          </div>
          <ChartContainer config={categoryDistConfig} className="h-[140px] w-full">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
              <Pie
                data={fallbackStats.topCategories.map((c, i) => ({ name: c.name, count: c.count, fill: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }))}
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={55}
                paddingAngle={2}
                dataKey="count"
                strokeWidth={0}
              />
            </PieChart>
          </ChartContainer>
        </div>
      </div>

      {/* Weekly Leaderboard mini-view */}
      <div className="rounded-xl border subtle-border surface overflow-hidden">
        <div className="flex items-center gap-2 p-4 border-b subtle-border">
          <Trophy className="w-4 h-4 text-amber-500" />
          <h2 className="text-sm font-semibold text-foreground">Weekly Leaderboard</h2>
        </div>
        <div className="divide-y divide-border">
          {fallbackWeeklyWinners.map((w) => (
            <div key={w.id} className="flex items-center gap-3 p-3 px-4">
              <span className={`text-sm font-bold w-5 text-center ${w.rank === 1 ? 'text-amber-500' : w.rank === 2 ? 'text-gray-400' : 'text-amber-700'}`}>
                {w.rank === 1 ? '🥇' : w.rank === 2 ? '🥈' : '🥉'}
              </span>
              <StartupLogo name={w.name} logo={w.logo} website={w.website} logoColor={w.logoColor} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{w.name}</p>
                <p className="text-[10px] text-muted-foreground">{w.tagline}</p>
              </div>
              <span className="text-xs font-bold text-orange-500 tabular-nums">{w.points.toLocaleString()} pts</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )

  // ─── 2. Followed Founders ───
  const renderFollowedFounders = () => {
    const followedStartups = getFollowedStartups(fallbackStartups)
    const activityFeed = getActivityFeed()

    const activityIcons: Record<string, string> = {
      launch: '🚀',
      update: '🔄',
      milestone: '🎯',
      perk: '🎁',
      funding: '💰',
    }

    return (
      <motion.div {...fadeIn} className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-foreground mb-1">Followed Founders</h1>
          <p className="text-xs text-muted-foreground">Track {followedStartups.length} startup{followedStartups.length !== 1 ? 's' : ''} and their latest activity</p>
        </div>

        {/* Follow stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border subtle-border surface p-4">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center mb-2">
              <Users className="w-4 h-4 text-orange-500" />
            </div>
            <p className="text-lg font-bold text-foreground">{followedStartups.length}</p>
            <p className="text-[10px] text-muted-foreground">Following</p>
          </div>
          <div className="rounded-xl border subtle-border surface p-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-2">
              <Zap className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-lg font-bold text-foreground">{activityFeed.length}</p>
            <p className="text-[10px] text-muted-foreground">Recent Updates</p>
          </div>
        </div>

        {/* Followed startups list */}
        {followedStartups.length > 0 ? (
          <div className="rounded-xl border subtle-border surface overflow-hidden">
            <div className="flex items-center gap-2 p-4 border-b subtle-border">
              <Users className="w-4 h-4 text-orange-500" />
              <h2 className="text-sm font-semibold text-foreground">Your Following List</h2>
            </div>
            <div className="divide-y divide-border">
              <AnimatePresence>
                {followedStartups.map(s => (
                  <motion.div key={s.id} {...scaleIn} layout className="flex items-center gap-3 p-3 px-4">
                    <StartupLogo name={s.name} logo={s.logo} website={s.website} logoColor={s.logoColor} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{s.name}</p>
                      <div className="flex items-center gap-2 text-[10px] text-faint">
                        <span>{s.category}</span>
                        <span>&middot;</span>
                        <span>{getFormattedFollowerCount(s.id)} followers</span>
                      </div>
                    </div>
                    <FollowButton
                      isFollowing={true}
                      followerCount={getFollowerCount(s.id)}
                      onToggle={() => toggleFollow(s.id)}
                      size="sm"
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border subtle-border surface p-12 text-center">
            <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <h2 className="text-sm font-medium text-foreground mb-1">Not following anyone yet</h2>
            <p className="text-xs text-muted-foreground mb-4">Follow startup founders to get updates on their progress</p>
            <Link href="/"><Button className="bg-orange-500 hover:bg-orange-600 text-white text-sm h-9 rounded-lg"><Plus className="w-4 h-4 mr-1.5" />Browse Startups</Button></Link>
          </div>
        )}

        {/* Activity feed */}
        {activityFeed.length > 0 && (
          <div className="rounded-xl border subtle-border surface overflow-hidden">
            <div className="flex items-center gap-2 p-4 border-b subtle-border">
              <TrendingUp className="w-4 h-4 text-orange-500" />
              <h2 className="text-sm font-semibold text-foreground">Activity Feed</h2>
            </div>
            <div className="divide-y divide-border">
              {activityFeed.map(activity => (
                <div key={activity.id} className="flex items-start gap-3 p-3 px-4">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-sm">{activityIcons[activity.type] || '📌'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground">
                      <span className="font-semibold">{activity.startupName}</span>{' '}
                      {activity.type === 'launch' ? 'launched something new' :
                       activity.type === 'update' ? 'posted an update' :
                       activity.type === 'milestone' ? 'hit a milestone' :
                       activity.type === 'perk' ? 'released a new perk' :
                       activity.type === 'funding' ? 'announced funding' : 'shared news'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{activity.message}</p>
                    <p className="text-[10px] text-faint mt-1">{fmtRelative(activity.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Discover more startups to follow */}
        <div className="rounded-xl border subtle-border surface p-6">
          <h2 className="text-sm font-semibold text-foreground mb-3">Discover Founders to Follow</h2>
          <div className="space-y-2">
            {fallbackStartups
              .filter(s => !isFollowing(s.id))
              .slice(0, 5)
              .map(s => (
                <div key={s.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors">
                  <StartupLogo name={s.name} logo={s.logo} website={s.website} logoColor={s.logoColor} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{s.name}</p>
                    <p className="text-[10px] text-muted-foreground">{s.category} &middot; {getFormattedFollowerCount(s.id)} followers</p>
                  </div>
                  <FollowButton
                    isFollowing={false}
                    followerCount={getFollowerCount(s.id)}
                    onToggle={() => toggleFollow(s.id)}
                    size="sm"
                  />
                </div>
              ))}
          </div>
        </div>
      </motion.div>
    )
  }

  // ─── 3. Inbox ───
  const renderInbox = () => {
    const markAllRead = () => {
      const updated = messages.map(m => ({ ...m, read: true }))
      saveMessages(updated)
      toast.success('All messages marked as read')
    }
    const markRead = (id: string) => {
      const updated = messages.map(m => m.id === id ? { ...m, read: true } : m)
      saveMessages(updated)
    }
    return (
      <motion.div {...fadeIn} className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground mb-1">Inbox</h1>
            <p className="text-xs text-muted-foreground">{messages.length} messages · {unreadCount} unread</p>
          </div>
          {unreadCount > 0 && <Button variant="outline" size="sm" className="text-xs h-8 rounded-lg" onClick={markAllRead}><Check className="w-3.5 h-3.5 mr-1.5" />Mark all as read</Button>}
        </div>
        <div className="space-y-2">
          <AnimatePresence>
            {messages.map(msg => (
              <motion.div key={msg.id} {...scaleIn} layout className="rounded-xl border subtle-border surface overflow-hidden">
                <button className="w-full p-4 text-left" onClick={() => { setExpandedMsg(expandedMsg === msg.id ? null : msg.id); markRead(msg.id) }}>
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${msg.type === 'system' ? 'bg-orange-500/20' : msg.type === 'community' ? 'bg-emerald-500/20' : 'bg-amber-500/20'}`}>
                      <Mail className={`w-4 h-4 ${msg.type === 'system' ? 'text-orange-500' : msg.type === 'community' ? 'text-emerald-500' : 'text-amber-500'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        {!msg.read && <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />}
                        <p className={`text-sm ${!msg.read ? 'font-semibold' : 'font-medium'} text-foreground`}>{msg.subject}</p>
                        <Badge variant="secondary" className="text-[9px] px-1.5 py-0 rounded-full bg-muted text-muted-foreground">{msg.type}</Badge>
                      </div>
                      <p className="text-[10px] text-faint">from {msg.from} · {fmtRelative(msg.timestamp)}</p>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expandedMsg === msg.id ? 'rotate-180' : ''}`} />
                  </div>
                </button>
                <AnimatePresence>
                  {expandedMsg === msg.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                      <div className="px-4 pb-4 ml-11">
                        <p className="text-sm text-muted-foreground leading-relaxed">{msg.body}</p>
                        <p className="text-[10px] text-faint mt-2">{fmtDate(msg.timestamp)}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>
    )
  }

  // ─── 4. My Startups ───
  const renderMyStartups = () => (
    <motion.div {...fadeIn} className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-foreground mb-1">My Startups</h1>
        <p className="text-xs text-muted-foreground">{myStartups.length} startup{myStartups.length !== 1 ? 's' : ''} listed</p>
      </div>

      {myStartups.length === 0 ? (
        <div className="text-center py-16">
          <Rocket className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h2 className="text-sm font-medium text-foreground mb-1">No startups yet</h2>
          <p className="text-xs text-muted-foreground mb-4">Launch your first startup to get started</p>
          <Link href="/submit"><Button className="bg-orange-500 hover:bg-orange-600 text-white text-sm h-9 rounded-lg"><Plus className="w-4 h-4 mr-1.5" />Add Your Startup</Button></Link>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {myStartups.map(s => (
              <motion.div key={s.id} {...scaleIn} layout className="rounded-xl border subtle-border surface p-4">
                <div className="flex items-start gap-3">
                  <StartupLogo name={s.name} logo={s.logo} website={s.website} logoColor={s.logoColor} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <p className="text-sm font-semibold text-foreground">{s.name}</p>
                      <Badge variant="secondary" className="text-[9px] px-1.5 py-0 rounded-full">{s.stage}</Badge>
                      <Badge variant="secondary" className="text-[9px] px-1.5 py-0 rounded-full">{getCategoryIcon(s.category)} {s.category}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1 mb-1">{s.tagline}</p>
                    <div className="flex items-center gap-3 text-[10px] text-faint">
                      <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" />{s.upvotes} upvotes</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Added {fmtRelative(s.dateAdded)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground" onClick={() => setEditingStartup(editingStartup === s.id ? null : s.id)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500" onClick={() => { saveStartups(myStartups.filter(x => x.id !== s.id)); toast.success('Startup removed') }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                {editingStartup === s.id && (
                  <motion.div {...scaleIn} className="mt-3 pt-3 border-t subtle-border space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Input placeholder="Tagline" value={s.tagline} className="text-xs h-8" onChange={e => saveStartups(myStartups.map(x => x.id === s.id ? { ...x, tagline: e.target.value } : x))} />
                      <Input placeholder="Category" value={s.category} className="text-xs h-8" onChange={e => saveStartups(myStartups.map(x => x.id === s.id ? { ...x, category: e.target.value } : x))} />
                      <Input placeholder="Stage" value={s.stage} className="text-xs h-8" onChange={e => saveStartups(myStartups.map(x => x.id === s.id ? { ...x, stage: e.target.value } : x))} />
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add New Startup card */}
      <Link href="/submit">
        <div className="rounded-xl border border-dashed border-border bg-muted/50 p-6 text-center hover:border-orange-500/40 transition-colors cursor-pointer">
          <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-2">
            <Plus className="w-5 h-5 text-orange-500" />
          </div>
          <p className="text-sm font-medium text-foreground mb-0.5">Add New Startup</p>
          <p className="text-xs text-muted-foreground">Click to launch a new startup on Revolaunch</p>
        </div>
      </Link>
    </motion.div>
  )

  // ─── 5. My Profile ───
  const renderMyProfile = () => {
    const initials = `${profile.firstName?.charAt(0) || ''}${profile.lastName?.charAt(0) || ''}`.toUpperCase() || '?'
    const handleSave = () => {
      saveProfile(profileForm)
      setEditProfile(false)
      toast.success('Profile saved successfully!')
    }
    return (
      <motion.div {...fadeIn} className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-foreground mb-1">My Profile</h1>
          <p className="text-xs text-muted-foreground">Manage your public profile information</p>
        </div>

        <div className="rounded-xl border subtle-border surface p-6">
          <div className="flex items-start gap-5 mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500/30 to-amber-500/30 border-2 border-border flex items-center justify-center shrink-0">
              <span className="text-xl font-bold text-foreground">{initials}</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">{profile.firstName} {profile.lastName}</h2>
              <p className="text-xs text-muted-foreground">{profile.role}</p>
              <p className="text-xs text-faint">{profile.email}</p>
            </div>
          </div>

          {editProfile ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: 'firstName', label: 'First Name' },
                  { key: 'lastName', label: 'Last Name' },
                  { key: 'role', label: 'Role' },
                  { key: 'email', label: 'Email' },
                  { key: 'twitter', label: 'Twitter' },
                  { key: 'linkedin', label: 'LinkedIn' },
                  { key: 'country', label: 'Country' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">{f.label}</label>
                    <Input value={profileForm[f.key as keyof typeof profileForm] || ''} onChange={e => setProfileForm({ ...profileForm, [f.key]: e.target.value })} className="text-xs h-9" />
                  </div>
                ))}
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Bio</label>
                <textarea value={profileForm.bio || ''} onChange={e => setProfileForm({ ...profileForm, bio: e.target.value })} className="w-full min-h-[80px] rounded-lg border subtle-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-orange-500" />
              </div>
              <div className="flex items-center gap-2">
                <Button className="bg-orange-500 hover:bg-orange-600 text-white text-xs h-8 rounded-lg" onClick={handleSave}>Save Profile</Button>
                <Button variant="ghost" className="text-xs h-8" onClick={() => setEditProfile(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: 'Role', value: profile.role },
                  { label: 'Email', value: profile.email },
                  { label: 'Twitter', value: profile.twitter },
                  { label: 'LinkedIn', value: profile.linkedin },
                  { label: 'Country', value: profile.country },
                ].map(f => (
                  <div key={f.label}>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{f.label}</p>
                    <p className="text-sm text-foreground mt-0.5">{f.value || '—'}</p>
                  </div>
                ))}
              </div>
              {profile.bio && (
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Bio</p>
                  <p className="text-sm text-foreground mt-0.5">{profile.bio}</p>
                </div>
              )}
              <Button className="bg-orange-500 hover:bg-orange-600 text-white text-xs h-8 rounded-lg" onClick={() => { setProfileForm({ ...profile }); setEditProfile(true) }}>
                <Pencil className="w-3.5 h-3.5 mr-1.5" />Edit Profile
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    )
  }

  // ─── 6. My Reviews ───
  const renderMyReviews = () => {
    const handleAddReview = () => {
      if (!reviewStartup || reviewRating === 0 || !reviewComment.trim()) {
        toast.error('Please fill in all fields')
        return
      }
      const startup = fallbackStartups.find(s => s.id === reviewStartup)
      const newReview = {
        id: `rev-${Date.now()}`,
        startupName: startup?.name || 'Unknown',
        startupId: reviewStartup,
        rating: reviewRating,
        comment: reviewComment.trim(),
        date: new Date().toISOString()
      }
      saveReviews([newReview, ...reviews])
      setReviewStartup(''); setReviewRating(0); setReviewComment(''); setShowReviewForm(false)
      toast.success('Review added!')
    }
    return (
      <motion.div {...fadeIn} className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground mb-1">My Reviews</h1>
            <p className="text-xs text-muted-foreground">{reviews.length} review{reviews.length !== 1 ? 's' : ''} given</p>
          </div>
          <Button className="bg-orange-500 hover:bg-orange-600 text-white text-xs h-8 rounded-lg" onClick={() => setShowReviewForm(!showReviewForm)}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />Write Review
          </Button>
        </div>

        {showReviewForm && (
          <motion.div {...scaleIn} className="rounded-xl border subtle-border surface p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Write a Review</h3>
            <Select value={reviewStartup} onValueChange={setReviewStartup}>
              <SelectTrigger className="text-xs h-9"><SelectValue placeholder="Select a startup" /></SelectTrigger>
              <SelectContent>
                {fallbackStartups.map(s => <SelectItem key={s.id} value={s.id} className="text-xs">{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map(i => (
                <button key={i} onClick={() => setReviewRating(i)} className="p-0.5">
                  <Star className={`w-5 h-5 ${i <= reviewRating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'}`} />
                </button>
              ))}
              {reviewRating > 0 && <span className="text-xs text-muted-foreground ml-1">{reviewRating}/5</span>}
            </div>
            <textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)} placeholder="Share your experience..." className="w-full min-h-[80px] rounded-lg border subtle-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-orange-500" />
            <div className="flex items-center gap-2">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white text-xs h-8 rounded-lg" onClick={handleAddReview}>Submit Review</Button>
              <Button variant="ghost" className="text-xs h-8" onClick={() => setShowReviewForm(false)}>Cancel</Button>
            </div>
          </motion.div>
        )}

        {reviews.length === 0 && !showReviewForm ? (
          <div className="text-center py-16">
            <Star className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <h2 className="text-sm font-medium text-foreground mb-1">No reviews yet</h2>
            <p className="text-xs text-muted-foreground">Share your experience with startups you have tried</p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {reviews.map(r => (
                <motion.div key={r.id} {...scaleIn} layout className="rounded-xl border subtle-border surface p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-foreground">{r.startupName}</p>
                        <div className="flex items-center gap-0.5">{[1,2,3,4,5].map(i => <Star key={i} className={`w-3 h-3 ${i <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'}`} />)}</div>
                      </div>
                      <p className="text-xs text-muted-foreground">{r.comment}</p>
                      <p className="text-[10px] text-faint mt-1">{fmtRelative(r.date)}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500 shrink-0" onClick={() => { saveReviews(reviews.filter(x => x.id !== r.id)); toast.success('Review deleted') }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    )
  }

  // ─── 7. My Signals ───
  const renderMySignals = () => {
    const addSignal = (startup: any) => {
      if (signals.find(s => s.id === startup.id)) return
      const newSignal = { id: startup.id, name: startup.name, logo: startup.logo, website: startup.website, logoColor: startup.logoColor, category: startup.category, tagline: startup.tagline, signalDate: new Date().toISOString() }
      saveSignals([newSignal, ...signals])
      toast.success(`Tracking ${startup.name}`)
    }
    const removeSignal = (id: string) => {
      saveSignals(signals.filter(s => s.id !== id))
      toast.success('Signal removed')
    }
    const availableStartups = fallbackStartups.filter(s => !signals.find(sig => sig.id === s.id))
    const filteredStartups = signalSearch ? availableStartups.filter(s => s.name.toLowerCase().includes(signalSearch.toLowerCase()) || s.category.toLowerCase().includes(signalSearch.toLowerCase())) : availableStartups
    return (
      <motion.div {...fadeIn} className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground mb-1">My Signals</h1>
            <p className="text-xs text-muted-foreground">{signals.length} startup{signals.length !== 1 ? 's' : ''} tracked</p>
          </div>
          <Button className="bg-orange-500 hover:bg-orange-600 text-white text-xs h-8 rounded-lg" onClick={() => setShowSignalSearch(!showSignalSearch)}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />Add Signal
          </Button>
        </div>

        {showSignalSearch && (
          <motion.div {...scaleIn} className="rounded-xl border subtle-border surface p-4 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={signalSearch} onChange={e => setSignalSearch(e.target.value)} placeholder="Search startups to track..." className="text-xs h-9 pl-9" />
            </div>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {filteredStartups.slice(0, 10).map(s => (
                <button key={s.id} className="flex items-center gap-2.5 w-full p-2 rounded-lg hover:bg-muted transition-colors text-left" onClick={() => addSignal(s)}>
                  <StartupLogo name={s.name} logo={s.logo} website={s.website} logoColor={s.logoColor} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{s.name}</p>
                    <p className="text-[10px] text-muted-foreground">{getCategoryIcon(s.category)} {s.category}</p>
                  </div>
                  <Plus className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                </button>
              ))}
              {filteredStartups.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No startups found</p>}
            </div>
          </motion.div>
        )}

        {signals.length === 0 && !showSignalSearch ? (
          <div className="text-center py-16">
            <TrendingUp className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <h2 className="text-sm font-medium text-foreground mb-1">No signals yet</h2>
            <p className="text-xs text-muted-foreground">Track startups you are interested in</p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {signals.map(s => (
                <motion.div key={s.id} {...scaleIn} layout className="rounded-xl border subtle-border surface p-4">
                  <div className="flex items-center gap-3">
                    <StartupLogo name={s.name} logo={s.logo} website={s.website} logoColor={s.logoColor} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{s.name}</p>
                      <div className="flex items-center gap-2 text-[10px] text-faint">
                        <span>{getCategoryIcon(s.category)} {s.category}</span>
                        <span>·</span>
                        <span>Tracked {fmtRelative(s.signalDate)}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500" onClick={() => removeSignal(s.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    )
  }

  // ─── 8. My Jobs ───
  const renderMyJobs = () => {
    const handlePostJob = () => {
      if (!jobForm.title || !jobForm.company) { toast.error('Title and company are required'); return }
      const newJob = { ...jobForm, id: `job-${Date.now()}`, postedDate: new Date().toISOString() }
      saveJobs([newJob, ...jobs])
      setJobForm({ title: '', company: '', location: 'remote', type: 'full-time', salaryRange: '', description: '', applyUrl: '' })
      setShowJobForm(false)
      toast.success('Job posted!')
    }
    const deleteJob = (id: string) => { saveJobs(jobs.filter(j => j.id !== id)); toast.success('Job deleted') }
    const locationIcon = (l: string) => l === 'remote' ? '🌍' : l === 'hybrid' ? '🏠' : '🏢'
    return (
      <motion.div {...fadeIn} className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground mb-1">My Jobs</h1>
            <p className="text-xs text-muted-foreground">{jobs.length} job{jobs.length !== 1 ? 's' : ''} listed</p>
          </div>
          <Button className="bg-orange-500 hover:bg-orange-600 text-white text-xs h-8 rounded-lg" onClick={() => setShowJobForm(!showJobForm)}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />Post a Job
          </Button>
        </div>

        {showJobForm && (
          <motion.div {...scaleIn} className="rounded-xl border subtle-border surface p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Post a New Job</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Title</label>
                <Input value={jobForm.title} onChange={e => setJobForm({ ...jobForm, title: e.target.value })} className="text-xs h-9" placeholder="e.g. Senior Engineer" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Company</label>
                <Input value={jobForm.company} onChange={e => setJobForm({ ...jobForm, company: e.target.value })} className="text-xs h-9" placeholder="e.g. Acme Inc" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Location</label>
                <Select value={jobForm.location} onValueChange={v => setJobForm({ ...jobForm, location: v })}>
                  <SelectTrigger className="text-xs h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="remote">Remote</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                    <SelectItem value="onsite">On-site</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Type</label>
                <Select value={jobForm.type} onValueChange={v => setJobForm({ ...jobForm, type: v })}>
                  <SelectTrigger className="text-xs h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Salary Range</label>
                <Input value={jobForm.salaryRange} onChange={e => setJobForm({ ...jobForm, salaryRange: e.target.value })} className="text-xs h-9" placeholder="e.g. $100K - $150K" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Apply URL</label>
                <Input value={jobForm.applyUrl} onChange={e => setJobForm({ ...jobForm, applyUrl: e.target.value })} className="text-xs h-9" placeholder="https://..." />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Description</label>
              <textarea value={jobForm.description} onChange={e => setJobForm({ ...jobForm, description: e.target.value })} className="w-full min-h-[80px] rounded-lg border subtle-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-orange-500" placeholder="Describe the role..." />
            </div>
            <div className="flex items-center gap-2">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white text-xs h-8 rounded-lg" onClick={handlePostJob}>Post Job</Button>
              <Button variant="ghost" className="text-xs h-8" onClick={() => setShowJobForm(false)}>Cancel</Button>
            </div>
          </motion.div>
        )}

        {jobs.length === 0 && !showJobForm ? (
          <div className="text-center py-16">
            <Briefcase className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <h2 className="text-sm font-medium text-foreground mb-1">No jobs listed</h2>
            <p className="text-xs text-muted-foreground">Post your first job opening</p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {jobs.map(j => (
                <motion.div key={j.id} {...scaleIn} layout className="rounded-xl border subtle-border surface p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground mb-0.5">{j.title}</p>
                      <p className="text-xs text-muted-foreground mb-2">{j.company}</p>
                      <div className="flex flex-wrap items-center gap-2 text-[10px] text-faint">
                        <Badge variant="secondary" className="text-[9px] px-1.5 py-0 rounded-full">{locationIcon(j.location)} {j.location}</Badge>
                        <Badge variant="secondary" className="text-[9px] px-1.5 py-0 rounded-full">{j.type}</Badge>
                        {j.salaryRange && <Badge variant="secondary" className="text-[9px] px-1.5 py-0 rounded-full text-emerald-600 dark:text-emerald-400">{j.salaryRange}</Badge>}
                        <span>Posted {fmtRelative(j.postedDate)}</span>
                      </div>
                      {j.description && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{j.description}</p>}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {j.applyUrl && <a href={j.applyUrl} target="_blank" rel="noopener noreferrer"><Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-orange-500"><ExternalLink className="w-3.5 h-3.5" /></Button></a>}
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500" onClick={() => deleteJob(j.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    )
  }

  // ─── 9. My Perks ───
  const renderMyPerks = () => {
    const toggleClaim = (perkId: string) => {
      if (claimedPerks.includes(perkId)) {
        saveClaimed(claimedPerks.filter(p => p !== perkId))
        toast.success('Perk unclaimed')
      } else {
        saveClaimed([...claimedPerks, perkId])
        toast.success('Perk claimed! Check the startup website to redeem.')
      }
    }
    return (
      <motion.div {...fadeIn} className="space-y-4">
        <div>
          <h1 className="text-xl font-bold text-foreground mb-1">My Perks</h1>
          <p className="text-xs text-muted-foreground">{allPerks.length} perks available · {claimedPerks.length} claimed</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <AnimatePresence>
            {allPerks.map(perk => {
              const isClaimed = claimedPerks.includes(perk.id)
              return (
                <motion.div key={perk.id} {...scaleIn} layout className="rounded-xl border subtle-border surface p-4 flex flex-col">
                  <div className="flex items-start gap-3 mb-3">
                    <StartupLogo name={perk.startupName} logo={perk.startupLogo} website={perk.startupWebsite} logoColor={perk.startupLogoColor} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground">{perk.startupName}</p>
                      <p className="text-sm font-semibold text-foreground truncate">{perk.title}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground flex-1 mb-3">{perk.description}</p>
                  <div className="flex items-center justify-between gap-2">
                    {perk.discount && <Badge variant="secondary" className="text-[9px] px-1.5 py-0 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">{perk.discount}</Badge>}
                    <Button size="sm" variant={isClaimed ? 'outline' : 'default'} className={`text-xs h-7 rounded-lg ml-auto ${isClaimed ? 'text-green-600 dark:text-green-400 border-green-500/30' : 'bg-orange-500 hover:bg-orange-600 text-white'}`} onClick={() => toggleClaim(perk.id)}>
                      {isClaimed ? <><Check className="w-3.5 h-3.5 mr-1" />Claimed</> : <><Gift className="w-3.5 h-3.5 mr-1" />Claim</>}
                    </Button>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </motion.div>
    )
  }

  // ─── 10. My Affiliate ───
  const renderMyAffiliate = () => {
    const refLink = `https://revolaunch.net/?ref=${affiliateCode}`
    const copyLink = () => {
      navigator.clipboard.writeText(refLink).then(() => { setCopied(true); toast.success('Link copied!'); setTimeout(() => setCopied(false), 2000) }).catch(() => toast.error('Failed to copy'))
    }
    return (
      <motion.div {...fadeIn} className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-foreground mb-1">My Affiliate</h1>
          <p className="text-xs text-muted-foreground">Earn rewards by referring others to Revolaunch</p>
        </div>

        {/* Referral link card */}
        <div className="rounded-xl border subtle-border surface p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-3">
            <Share2 className="w-7 h-7 text-orange-500" />
          </div>
          <h2 className="text-lg font-bold text-foreground mb-1">Your Referral Link</h2>
          <p className="text-xs text-muted-foreground mb-4">Share this link and earn $25 for each signup</p>
          <div className="flex items-center gap-2 max-w-md mx-auto">
            <div className="flex-1 bg-muted rounded-lg px-3 py-2 text-xs text-muted-foreground truncate font-mono">{refLink}</div>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white text-xs h-9 rounded-lg shrink-0" onClick={copyLink}>
              {copied ? <><Check className="w-3.5 h-3.5 mr-1" />Copied</> : <><Copy className="w-3.5 h-3.5 mr-1" />Copy</>}
            </Button>
          </div>
          <p className="text-[10px] text-faint mt-2">Your code: <span className="font-mono text-orange-500">{affiliateCode}</span></p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Link Clicks', value: affiliateStats.clicks, icon: Eye, color: 'text-blue-500', bg: 'bg-blue-500/10' },
            { label: 'Signups', value: affiliateStats.signups, icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
            { label: 'Total Earned', value: `$${affiliateStats.signups * 25}`, icon: DollarSign, color: 'text-orange-500', bg: 'bg-orange-500/10' },
          ].map(stat => (
            <div key={stat.label} className="rounded-xl border subtle-border surface p-4 text-center">
              <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center mx-auto mb-2`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <p className="text-lg font-bold text-foreground">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="rounded-xl border subtle-border surface p-6">
          <h2 className="text-sm font-semibold text-foreground mb-4">How It Works</h2>
          <div className="space-y-4">
            {[
              { step: '1', title: 'Share your link', desc: 'Copy your unique referral link and share it with your network, on social media, or in your community.' },
              { step: '2', title: 'They sign up', desc: 'When someone clicks your link and creates a free account on Revolaunch, it counts as a referral.' },
              { step: '3', title: 'You earn $25', desc: 'For every successful signup, you earn $25. Track your earnings and withdraw anytime.' },
            ].map(item => (
              <div key={item.step} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center shrink-0 text-white text-xs font-bold">{item.step}</div>
                <div>
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    )
  }

  // ─── 11. Content Scheduler ───
  const renderContentScheduler = () => {
    const weekDays = getWeekDays()
    const handleAddContent = () => {
      if (!contentForm.title || !contentForm.scheduledDate) { toast.error('Title and date are required'); return }
      const newItem = { ...contentForm, id: `c-${Date.now()}`, createdAt: new Date().toISOString() }
      saveContent([...contentItems, newItem])
      setContentForm({ title: '', type: 'tweet', scheduledDate: '', status: 'draft' })
      setShowContentForm(false)
      toast.success('Content scheduled!')
    }
    const deleteContent = (id: string) => { saveContent(contentItems.filter(c => c.id !== id)); toast.success('Content deleted') }
    const typeIcon = (t: string) => t === 'tweet' ? '🐦' : t === 'linkedin' ? '💼' : t === 'blog' ? '📝' : '🚀'
    const statusColor = (s: string) => s === 'published' ? 'text-green-600 bg-green-500/10' : s === 'scheduled' ? 'text-blue-600 bg-blue-500/10' : 'text-muted-foreground bg-muted'
    return (
      <motion.div {...fadeIn} className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground mb-1">Content Scheduler</h1>
            <p className="text-xs text-muted-foreground">{contentItems.length} items scheduled</p>
          </div>
          <Button className="bg-orange-500 hover:bg-orange-600 text-white text-xs h-8 rounded-lg" onClick={() => setShowContentForm(!showContentForm)}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />Add Content
          </Button>
        </div>

        {showContentForm && (
          <motion.div {...scaleIn} className="rounded-xl border subtle-border surface p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Schedule Content</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-3">
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Title</label>
                <Input value={contentForm.title} onChange={e => setContentForm({ ...contentForm, title: e.target.value })} className="text-xs h-9" placeholder="e.g. Launch day announcement" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Type</label>
                <Select value={contentForm.type} onValueChange={v => setContentForm({ ...contentForm, type: v })}>
                  <SelectTrigger className="text-xs h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tweet">🐦 Tweet</SelectItem>
                    <SelectItem value="linkedin">💼 LinkedIn</SelectItem>
                    <SelectItem value="blog">📝 Blog</SelectItem>
                    <SelectItem value="launch">🚀 Launch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Date</label>
                <Input type="date" value={contentForm.scheduledDate} onChange={e => setContentForm({ ...contentForm, scheduledDate: e.target.value })} className="text-xs h-9" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Status</label>
                <Select value={contentForm.status} onValueChange={v => setContentForm({ ...contentForm, status: v })}>
                  <SelectTrigger className="text-xs h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white text-xs h-8 rounded-lg" onClick={handleAddContent}>Add Content</Button>
              <Button variant="ghost" className="text-xs h-8" onClick={() => setShowContentForm(false)}>Cancel</Button>
            </div>
          </motion.div>
        )}

        {/* Weekly calendar */}
        <div className="grid grid-cols-7 gap-1.5">
          {weekDays.map(day => {
            const dayItems = contentItems.filter(c => c.scheduledDate === day.date)
            return (
              <div key={day.date} className={`rounded-xl border ${day.isToday ? 'border-orange-500/50 bg-orange-500/5' : 'subtle-border'} p-2 min-h-[120px]`}>
                <p className={`text-[10px] font-medium ${day.isToday ? 'text-orange-500' : 'text-muted-foreground'} mb-0.5`}>{day.dayName.slice(0, 3)}</p>
                <p className={`text-xs font-bold ${day.isToday ? 'text-orange-500' : 'text-foreground'}`}>{day.label.split(' ').pop()}</p>
                <div className="space-y-1 mt-1.5">
                  {dayItems.map(item => (
                    <div key={item.id} className="group relative">
                      <div className={`rounded-md px-1.5 py-1 text-[9px] ${statusColor(item.status)} leading-tight cursor-default`}>
                        <span>{typeIcon(item.type)} {item.title}</span>
                        <button className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 text-white items-center justify-center hidden group-hover:flex" onClick={() => deleteContent(item.id)}>
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Content list */}
        {contentItems.length > 0 && (
          <div className="rounded-xl border subtle-border surface overflow-hidden">
            <div className="p-3 border-b subtle-border"><p className="text-xs font-semibold text-foreground">All Content</p></div>
            <div className="divide-y divide-border max-h-64 overflow-y-auto">
              {contentItems.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(item => (
                <div key={item.id} className="flex items-center gap-3 p-3">
                  <span className="text-base">{typeIcon(item.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{item.title}</p>
                    <p className="text-[10px] text-faint">{item.scheduledDate || 'No date'}</p>
                  </div>
                  <Badge variant="secondary" className={`text-[9px] px-1.5 py-0 rounded-full ${statusColor(item.status)}`}>{item.status}</Badge>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-red-500" onClick={() => deleteContent(item.id)}><Trash2 className="w-3 h-3" /></Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    )
  }

  // ─── 12. Earn $25 ───
  const renderEarn25 = () => {
    const refLink = `https://revolaunch.net/?ref=${affiliateCode}`
    const copyLink = () => {
      navigator.clipboard.writeText(refLink).then(() => { setCopied(true); toast.success('Link copied!'); setTimeout(() => setCopied(false), 2000) }).catch(() => toast.error('Failed to copy'))
    }
    return (
      <motion.div {...fadeIn} className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-foreground mb-1">Earn $25</h1>
          <p className="text-xs text-muted-foreground">Refer friends and earn $25 for every signup</p>
        </div>

        {/* Earnings hero */}
        <div className="rounded-xl border subtle-border surface p-6 bg-gradient-to-br from-orange-500/10 to-amber-500/5">
          <div className="text-center">
            <div className="text-4xl font-black text-orange-500 mb-1">${earnedTotal}</div>
            <p className="text-sm font-medium text-foreground mb-0.5">Total Earned</p>
            <p className="text-xs text-muted-foreground">${affiliateStats.signups} successful referrals</p>
          </div>
        </div>

        {/* Share buttons */}
        <div className="rounded-xl border subtle-border surface p-4">
          <h2 className="text-sm font-semibold text-foreground mb-3">Share & Earn</h2>
          <div className="flex flex-wrap gap-2">
            <Button className="bg-orange-500 hover:bg-orange-600 text-white text-xs h-9 rounded-lg" onClick={copyLink}>
              {copied ? <><Check className="w-3.5 h-3.5 mr-1.5" />Copied</> : <><Copy className="w-3.5 h-3.5 mr-1.5" />Copy Link</>}
            </Button>
            <a href={`https://twitter.com/intent/tweet?text=Check out Revolaunch - the best place to discover and launch startups!&url=${encodeURIComponent(refLink)}`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="text-xs h-9 rounded-lg"><Twitter className="w-3.5 h-3.5 mr-1.5" />Share on Twitter</Button>
            </a>
            <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(refLink)}`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="text-xs h-9 rounded-lg"><Linkedin className="w-3.5 h-3.5 mr-1.5" />Share on LinkedIn</Button>
            </a>
          </div>
          <div className="mt-3 bg-muted rounded-lg px-3 py-2 text-xs text-muted-foreground truncate font-mono">{refLink}</div>
        </div>

        {/* Earning breakdown */}
        <div className="rounded-xl border subtle-border surface p-6">
          <h2 className="text-sm font-semibold text-foreground mb-4">Earning Breakdown</h2>
          <div className="space-y-3">
            {[
              { label: 'Per Referral', value: '$25', icon: Zap },
              { label: 'Your Referrals', value: String(affiliateStats.signups), icon: Users },
              { label: 'Pending', value: `$${Math.max(0, affiliateStats.clicks - affiliateStats.signups) * 0}`, icon: Clock },
              { label: 'Total Earned', value: `$${earnedTotal}`, icon: DollarSign },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div className="flex items-center gap-2">
                  <item.icon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{item.label}</span>
                </div>
                <span className={`text-sm font-bold ${item.label === 'Total Earned' ? 'text-orange-500' : 'text-foreground'}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent referral activity */}
        {referralActivity.length > 0 && (
          <div className="rounded-xl border subtle-border surface overflow-hidden">
            <div className="p-4 border-b subtle-border">
              <h2 className="text-sm font-semibold text-foreground">Recent Referral Activity</h2>
            </div>
            <div className="divide-y divide-border">
              {referralActivity.map(ra => (
                <div key={ra.id} className="flex items-center gap-3 p-4">
                  <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                    <DollarSign className="w-4 h-4 text-green-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{ra.name} signed up</p>
                    <p className="text-[10px] text-faint">{fmtRelative(ra.date)}</p>
                  </div>
                  <span className="text-sm font-bold text-green-500">+${ra.earned}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Terms */}
        <div className="rounded-xl border subtle-border surface p-6">
          <h2 className="text-sm font-semibold text-foreground mb-3">Terms & Conditions</h2>
          <ul className="space-y-2 text-xs text-muted-foreground">
            <li className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />Earn $25 for each unique referral who creates a verified account</li>
            <li className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />Minimum payout threshold of $50 (2 successful referrals)</li>
            <li className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />Earnings are tracked automatically via your unique referral link</li>
            <li className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />Self-referrals are not permitted and will be reversed</li>
            <li className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />Revolaunch reserves the right to modify the program at any time</li>
          </ul>
        </div>
      </motion.div>
    )
  }

  // ═══════════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════════
  const renderContent = () => {
    switch (activeItem) {
      case 'Dashboard': return renderDashboard()
      case 'Inbox': return renderInbox()
      case 'Followed Founders': return renderFollowedFounders()
      case 'My Startups': return renderMyStartups()
      case 'My Profile': return renderMyProfile()
      case 'My Reviews': return renderMyReviews()
      case 'My Signals': return renderMySignals()
      case 'My Jobs': return renderMyJobs()
      case 'My Perks': return renderMyPerks()
      case 'My Affiliate': return renderMyAffiliate()
      case 'Content Scheduler': return renderContentScheduler()
      case 'Earn $25': return renderEarn25()
      default: return renderDashboard()
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar */}
            <div className="lg:w-[240px] shrink-0">
              <div className="lg:sticky lg:top-[72px]">
                <nav className="space-y-0.5">
                  {sidebarItems.map((item) => {
                    const badge = getBadge(item.name)
                    return (
                      <button
                        key={item.name}
                        onClick={() => setActiveItem(item.name)}
                        className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-all ${
                          activeItem === item.name
                            ? 'bg-muted text-foreground font-medium'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        }`}
                      >
                        <item.icon className="w-4 h-4" />
                        <span className="flex-1 text-left">{item.name}</span>
                        {badge && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                            item.name === 'Inbox' && unreadCount > 0
                              ? 'bg-orange-500/20 text-orange-600 dark:text-orange-300'
                              : 'text-muted-foreground'
                          }`}>{badge}</span>
                        )}
                        {item.name === 'My Profile' && (
                          <span className="text-[10px] text-orange-500">{profileCompletion}%</span>
                        )}
                      </button>
                    )
                  })}
                </nav>

                {/* Quick boards */}
                <div className="mt-6 border-t subtle-border pt-4 space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider px-3 mb-2">Quick Boards</p>
                  {fallbackCommunityBoards.slice(0, 4).map((board) => (
                    <Link
                      key={board.id}
                      href={`/community?type=${board.id}`}
                      className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                    >
                      <span className="text-sm">{board.icon}</span>
                      <span className="flex-1">{board.name}</span>
                      <span className="tabular-nums">{board.itemCount > 999 ? `${(board.itemCount / 1000).toFixed(1)}K` : board.itemCount}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Main content */}
            <div className="flex-1 min-w-0">
              <AnimatePresence mode="wait">
                {renderContent()}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
