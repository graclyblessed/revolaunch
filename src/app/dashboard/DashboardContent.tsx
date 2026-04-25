'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Rocket, Plus, TrendingUp, BarChart3,
  Users, LayoutDashboard, Crown, Trophy, Clock, Trash2, Pencil,
  Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import Header from '@/components/Header'
import StartupLogo from '@/components/StartupLogo'
import FollowButton from '@/components/FollowButton'
import { useFollowing } from '@/hooks/use-following'
import { usePlan } from '@/hooks/use-plan'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, CartesianGrid } from 'recharts'
import { toast } from 'sonner'
import { fallbackStartups, fallbackWeeklyWinners, fallbackStats } from '@/lib/fallback-data'
import { getCategoryIcon } from '@/lib/fallback-data'

interface DashboardContentProps {
  user: {
    name: string | null
    email: string | null
    image: string | null
  }
}

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

// ─── Sidebar items (only 4 honest sections) ───
const sidebarItems = [
  { name: 'Dashboard', icon: LayoutDashboard },
  { name: 'Followed Founders', icon: Users },
  { name: 'My Startups', icon: Rocket },
  { name: 'Launch Plans', icon: Crown, href: '/pricing' },
]

// ─── Quick board links ───
const quickBoards = [
  { name: 'Weekly Board', icon: '🏆', href: '/community?type=weekly-board' },
  { name: 'MRR Board', icon: '📊', href: '/community?type=mrr-board' },
]

// ─── Animation variants ───
const fadeIn = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } }
const scaleIn = { initial: { opacity: 0, scale: 0.96 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 0.25 } }

// ─── Chart configs ───
const activityChartConfig = { activity: { label: 'Activity', color: '#F97316' } } satisfies ChartConfig
const categoryDistConfig = { count: { label: 'Startups', color: '#F97316' } } satisfies ChartConfig
const CATEGORY_COLORS = ['#F97316', '#3B82F6', '#22C55E', '#8B5CF6', '#EF4444', '#06B6D4', '#F59E0B', '#EC4899']

// ─── Helper: format relative time ───
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
export default function DashboardContent({ user }: DashboardContentProps) {
  const [activeItem, setActiveItem] = useState('Dashboard')

  // State
  const [myStartups, setMyStartups] = useState<any[]>(() => getLS('revolaunch_my_startups', []))
  const [editingStartup, setEditingStartup] = useState<string | null>(null)

  // Hooks
  const { isFollowing, toggleFollow, getFollowerCount, getFormattedFollowerCount, getActivityFeed, getFollowedStartups, followedIds } = useFollowing()
  const { totalLaunches } = usePlan()

  // Persist
  const saveStartups = (s: any[]) => { setMyStartups(s); setLS('revolaunch_my_startups', s) }

  // ═══════════════════════════════════════════
  // SECTION RENDERERS
  // ═══════════════════════════════════════════

  // ─── 1. Dashboard Overview ───
  const renderDashboard = () => (
    <motion.div {...fadeIn} className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
          <span className="text-sm font-bold text-orange-500">
            {user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : user.email?.[0]?.toUpperCase() || '?'}
          </span>
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground mb-0.5">
            Welcome back{user.name ? `, ${user.name.split(' ')[0]}` : ''} 👋
          </h1>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
      </div>

      {/* Quick stats — only real numbers */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { label: 'My Startups', value: myStartups.length, icon: Rocket, color: 'text-orange-500', bg: 'bg-orange-500/10' },
          { label: 'Following', value: followedIds.length, icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Platform Startups', value: fallbackStats.totalStartups, icon: Zap, color: 'text-amber-500', bg: 'bg-amber-500/10' },
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
        <Link href="/community?type=weekly-board"><Button variant="outline" className="text-xs h-8 rounded-lg"><Trophy className="w-3.5 h-3.5 mr-1.5" />Leaderboard</Button></Link>
        <Link href="/startups"><Button variant="outline" className="text-xs h-8 rounded-lg"><TrendingUp className="w-3.5 h-3.5 mr-1.5" />Browse Startups</Button></Link>
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
      launch: '🚀', update: '🔄', milestone: '🎯', perk: '🎁', funding: '💰',
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

  // ─── 3. My Startups ───
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

  // ═══════════════════════════════════════════
  // CONTENT ROUTER
  // ═══════════════════════════════════════════
  const renderContent = () => {
    switch (activeItem) {
      case 'Dashboard': return renderDashboard()
      case 'Followed Founders': return renderFollowedFounders()
      case 'My Startups': return renderMyStartups()
      default: return renderDashboard()
    }
  }

  // Sidebar badge data
  const getBadge = (name: string) => {
    if (name === 'Followed Founders' && followedIds.length > 0) return String(followedIds.length)
    return undefined
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
                    // 'Launch Plans' is an external link
                    if ('href' in item && item.href) {
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-all ${
                            totalLaunches > 0
                              ? 'bg-orange-500/10 text-orange-500 font-medium'
                              : 'bg-orange-500/5 text-orange-500 hover:bg-orange-500/10'
                          }`}
                        >
                          <item.icon className="w-4 h-4" />
                          <span className="flex-1 text-left">{totalLaunches > 0 ? 'Launch Plans' : item.name}</span>
                          {totalLaunches > 0 && (
                            <Badge variant="secondary" className="text-[9px] bg-orange-500/20 text-orange-500 h-5 px-1.5">
                              {totalLaunches} launch{totalLaunches !== 1 ? 'es' : ''}
                            </Badge>
                          )}
                        </Link>
                      )
                    }
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
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full text-muted-foreground">{badge}</span>
                        )}
                      </button>
                    )
                  })}
                </nav>

                {/* Quick Boards — limited to 2 */}
                <div className="mt-6 border-t subtle-border pt-4 space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider px-3 mb-2">Quick Boards</p>
                  {quickBoards.map((board) => (
                    <Link
                      key={board.name}
                      href={board.href}
                      className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                    >
                      <span className="text-sm">{board.icon}</span>
                      <span className="flex-1">{board.name}</span>
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
