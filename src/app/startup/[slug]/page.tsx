'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Star,
  ExternalLink,
  Globe,
  Calendar,
  Users,
  MapPin,
  Building2,
  CheckCircle2,
  Gift,
  Twitter,
  Linkedin,
  Sparkles,
  Trophy,
  Tag,
  ArrowUpRight,
  Flame,
  Share2,
  Link2,
  Check,
  Code2,
  Copy,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import StartupLogo from '@/components/StartupLogo'
import { cn } from '@/lib/utils'
import { getCategoryIcon, getCategoryColor, getStageColor } from '@/lib/fallback-data'
import { LAUNCH_TIERS } from '@/lib/launch-tiers'
import type { LaunchTier } from '@/lib/launch-tiers'
import { toast } from 'sonner'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Perk {
  id: string
  title: string
  description: string
  discount: string | null
  url: string
  createdAt?: string
}

interface StartupData {
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
  launchTier?: string
  badgeVerified?: boolean
  launchDate?: string | null
  status: string
  createdAt: string
  updatedAt: string
  _count: { votes: number; perks: number }
  perks: Perk[]
  logoColor?: string
}

/* ------------------------------------------------------------------ */
/*  Session helper (same as homepage)                                  */
/* ------------------------------------------------------------------ */

function getSessionId() {
  if (typeof window === 'undefined') return ''
  let sid = localStorage.getItem('revolaunch_session')
  if (!sid) {
    sid = Math.random().toString(36).substring(2) + Date.now().toString(36)
    localStorage.setItem('revolaunch_session', sid)
  }
  return sid
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function getDomain(website: string): string {
  try {
    return new URL(website).hostname.replace(/^www\./, '')
  } catch {
    return website
  }
}

function getTwitterUrl(handle: string): string {
  if (handle.startsWith('http')) return handle
  return `https://twitter.com/${handle}`
}

function getLinkedinUrl(handle: string): string {
  if (handle.startsWith('http')) return handle
  return `https://linkedin.com/company/${handle}`
}

/* ------------------------------------------------------------------ */
/*  Animation variants                                                 */
/* ------------------------------------------------------------------ */

const fadeIn = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
}

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
}

/* ------------------------------------------------------------------ */
/*  Loading skeleton                                                   */
/* ------------------------------------------------------------------ */

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header skeleton */}
      <div className="border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-6 w-40" />
          </div>
        </div>
      </div>

      {/* Hero skeleton */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <Skeleton className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl shrink-0" />
          <div className="flex-1 space-y-3 w-full">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-56" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="h-5 w-80" />
            <div className="flex gap-3 pt-2">
              <Skeleton className="h-10 w-32 rounded-xl" />
              <Skeleton className="h-10 w-36 rounded-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Body skeleton */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 space-y-8">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  404 / Not Found                                                    */
/* ------------------------------------------------------------------ */

function NotFoundState() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="text-center px-4"
      >
        <div className="w-20 h-20 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">🚀</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Startup not found</h1>
        <p className="text-muted-foreground text-sm mb-8 max-w-sm mx-auto">
          The startup you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <Link href="/">
          <Button className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Revolaunch
          </Button>
        </Link>
      </motion.div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Detail row component                                               */
/* ------------------------------------------------------------------ */

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/40 border border-border/50">
      <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-orange-500" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground font-medium mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-foreground truncate">{value || '—'}</p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Perk card component                                                */
/* ------------------------------------------------------------------ */

function PerkCard({ perk }: { perk: Perk }) {
  return (
    <motion.div
      variants={fadeIn}
      className="group relative overflow-hidden rounded-xl border border-border bg-muted/20 hover:border-orange-500/30 hover:bg-muted/40 transition-all duration-200"
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
              <Gift className="w-4 h-4 text-orange-500" />
            </div>
            <h4 className="font-semibold text-sm text-foreground">{perk.title}</h4>
          </div>
          {perk.discount && (
            <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20 text-[10px] font-semibold shrink-0">
              {perk.discount}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed ml-[42px]">
          {perk.description}
        </p>
        {perk.url && perk.url !== '#' && (
          <div className="ml-[42px] mt-3">
            <a
              href={perk.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-orange-500 hover:text-orange-400 transition-colors"
            >
              Claim Perk
              <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main page component                                                */
/* ------------------------------------------------------------------ */

export default function StartupProfilePage() {
  const params = useParams<{ slug: string }>()
  const router = useRouter()
  const slug = params.slug

  const [startup, setStartup] = useState<StartupData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [isVoted, setIsVoted] = useState(false)
  const [upvotes, setUpvotes] = useState(0)
  const [voting, setVoting] = useState(false)
  const [relatedStartups, setRelatedStartups] = useState<StartupData[]>([])
  const [copied, setCopied] = useState(false)
  const [embedOpen, setEmbedOpen] = useState(false)
  const [embedCopied, setEmbedCopied] = useState<string | null>(null)

  /* ---- Fetch startup data ---- */
  useEffect(() => {
    if (!slug) return
    let cancelled = false

    async function fetchStartup() {
      try {
        const res = await fetch(`/api/startups/${slug}`)
        if (!res.ok) {
          if (res.status === 404) {
            if (!cancelled) setNotFound(true)
          }
          return
        }
        const data = await res.json()
        if (!cancelled && data.startup) {
          setStartup(data.startup)
          setUpvotes(data.startup.upvotes)
          // Check if already voted
          const sessionId = getSessionId()
          const votedKey = `revolaunch_voted_${slug}`
          const voted = localStorage.getItem(votedKey)
          if (voted === sessionId) {
            setIsVoted(true)
          }
        }
      } catch {
        if (!cancelled) setNotFound(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchStartup()
    return () => { cancelled = true }
  }, [slug])

  /* ---- Vote handler ---- */
  const handleVote = useCallback(async () => {
    if (voting) return
    setVoting(true)
    const sessionId = getSessionId()
    try {
      const res = await fetch(`/api/startups/${slug}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })
      const data = await res.json()
      if (data.voted) {
        setIsVoted(true)
        const votedKey = `revolaunch_voted_${slug}`
        localStorage.setItem(votedKey, sessionId)
        toast.success('Starred!')
      } else {
        setIsVoted(false)
        const votedKey = `revolaunch_voted_${slug}`
        localStorage.removeItem(votedKey)
      }
      if (typeof data.upvotes === 'number') {
        setUpvotes(data.upvotes)
      }
    } catch {
      toast.error('Failed to vote')
    } finally {
      setVoting(false)
    }
  }, [slug, voting])

  /* ---- Fetch related startups ---- */
  useEffect(() => {
    if (!startup) return
    async function fetchRelated() {
      try {
        const res = await fetch(`/api/startups?category=${encodeURIComponent(startup.category)}&limit=4&sort=popular`)
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data.startups)) {
            setRelatedStartups(data.startups.filter((s: StartupData) => s.slug !== startup.slug).slice(0, 3))
          }
        }
      } catch { /* silent */ }
    }
    fetchRelated()
  }, [startup])

  /* ---- Share handlers ---- */
  const pageUrl = typeof window !== 'undefined' ? window.location.href : ''
  const shareText = `Check out ${startup.name} on Revolaunch — ${startup.tagline}`

  const handleShareTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(pageUrl)}`, '_blank')
  }

  const handleShareLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`, '_blank')
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl)
      setCopied(true)
      toast.success('Link copied!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy')
    }
  }

  /* ---- Embed helpers ---- */
  const siteUrl = typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_SITE_URL || 'revolaunch.net')
    : 'revolaunch.net'

  const embedHtml = `<!-- ${startup.name} on Revolaunch -->
<iframe src="https://${siteUrl}/embed?slug=${startup.slug}&embed=1" width="480" height="300" frameborder="0" scrolling="no" style="border:none;border-radius:12px;" title="${startup.name} on Revolaunch"></iframe>`

  const embedReact = `export function RevolaunchEmbed() {
  return (
    <iframe
      src="https://${siteUrl}/embed?slug=${startup.slug}&embed=1"
      width={480}
      height={300}
      style={{ border: 'none', borderRadius: 12 }}
      title="${startup.name} on Revolaunch"
    />
  )
}`

  const handleEmbedCopy = async (code: string, key: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setEmbedCopied(key)
      toast.success('Copied!')
      setTimeout(() => setEmbedCopied(null), 2500)
    } catch {
      toast.error('Failed to copy')
    }
  }

  /* ---- Render states ---- */
  if (loading) return <LoadingSkeleton />
  if (notFound || !startup) return <NotFoundState />

  /* ---- Derived values ---- */
  const tier = LAUNCH_TIERS[(startup.launchTier as LaunchTier) || 'free'] || LAUNCH_TIERS.free
  const categoryColor = getCategoryColor(startup.category)
  const stageColor = getStageColor(startup.stage)

  return (
    <div className="min-h-screen bg-background">
      {/* ================================================================
          HEADER — sticky top bar with back button and tags
          ================================================================ */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => router.back()}
                className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-muted transition-colors shrink-0"
                aria-label="Go back"
              >
                <ArrowLeft className="w-4 h-4 text-muted-foreground" />
              </button>
              <div className="flex items-center gap-2 min-w-0">
                <h1 className="font-semibold text-sm sm:text-base text-foreground truncate">
                  {startup.name}
                </h1>
                {startup.badgeVerified && (
                  <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0" />
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span
                className="inline-flex items-center text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-medium"
                style={{
                  backgroundColor: categoryColor + '18',
                  color: categoryColor,
                }}
              >
                {getCategoryIcon(startup.category)} {startup.category}
              </span>
              <span
                className="hidden sm:inline-flex items-center text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-medium"
                style={{
                  backgroundColor: stageColor + '18',
                  color: stageColor,
                }}
              >
                {startup.stage}
              </span>
            </div>
          </div>
        </div>
      </header>

      <motion.main
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20"
        variants={stagger}
        initial="initial"
        animate="animate"
      >
        {/* ================================================================
            HERO SECTION — Logo, name, tagline, website, action buttons
            ================================================================ */}
        <motion.section variants={fadeIn} transition={{ duration: 0.5 }} className="pt-8 sm:pt-12 pb-8">
          <div className="flex flex-col sm:flex-row items-start gap-5 sm:gap-6">
            {/* Large logo */}
            <div className="shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center overflow-hidden shadow-lg shadow-orange-500/5"
                style={{ backgroundColor: (startup.logoColor || '#F97316') + '15' }}
              >
                <StartupLogo
                  name={startup.name}
                  logo={startup.logo}
                  website={startup.website}
                  logoColor={startup.logoColor}
                  size="lg"
                  className="!w-20 !h-20 sm:!w-24 sm:!h-24"
                />
              </div>
            </div>

            {/* Name, tagline, links */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                  {startup.name}
                </h2>
                {startup.featured && (
                  <Sparkles className="w-5 h-5 text-amber-400 fill-amber-400" />
                )}
                {startup.badgeVerified && (
                  <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20 text-[10px] font-semibold gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified
                  </Badge>
                )}
              </div>

              <p className="text-base sm:text-lg text-muted-foreground mt-1.5 leading-relaxed">
                {startup.tagline}
              </p>

              {/* Website link */}
              {startup.website && (
                <a
                  href={startup.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-orange-500 hover:text-orange-400 transition-colors mt-3"
                >
                  <Globe className="w-3.5 h-3.5" />
                  {getDomain(startup.website)}
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              )}

              {/* Action buttons */}
              <div className="flex items-center gap-3 mt-5 flex-wrap">
                {/* Vote / Star button */}
                <Button
                  onClick={handleVote}
                  disabled={voting}
                  variant={isVoted ? 'default' : 'outline'}
                  className={cn(
                    'rounded-xl h-10 px-5 font-semibold text-sm transition-all duration-200',
                    isVoted
                      ? 'bg-orange-500 hover:bg-orange-600 text-white border-orange-500'
                      : 'text-orange-500 border-orange-500/30 hover:bg-orange-500/10 hover:border-orange-500/50 hover:text-orange-500'
                  )}
                >
                  <Star className={cn('w-4 h-4', isVoted && 'fill-white')} />
                  {isVoted ? 'Starred' : 'Star'}
                  <span className="tabular-nums ml-1">{upvotes}</span>
                </Button>

                {/* Visit website button */}
                {startup.website && (
                  <a href={startup.website} target="_blank" rel="noopener noreferrer">
                    <Button
                      variant="outline"
                      className="rounded-xl h-10 px-5 text-sm text-muted-foreground hover:text-foreground"
                    >
                      <ExternalLink className="w-4 h-4 mr-1.5" />
                      Visit Website
                    </Button>
                  </a>
                )}

                {/* Social links */}
                <div className="flex items-center gap-1.5">
                  {startup.twitter && (
                    <a
                      href={getTwitterUrl(startup.twitter)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-xl border border-border hover:border-orange-500/30 flex items-center justify-center text-muted-foreground hover:text-orange-500 transition-all duration-200"
                      aria-label="Twitter"
                    >
                      <Twitter className="w-4 h-4" />
                    </a>
                  )}
                  {startup.linkedin && (
                    <a
                      href={getLinkedinUrl(startup.linkedin)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-xl border border-border hover:border-orange-500/30 flex items-center justify-center text-muted-foreground hover:text-orange-500 transition-all duration-200"
                      aria-label="LinkedIn"
                    >
                      <Linkedin className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        <Separator className="opacity-50" />

        {/* ================================================================
            DESCRIPTION
            ================================================================ */}
        {startup.description && (
          <motion.section variants={fadeIn} transition={{ duration: 0.4 }} className="py-8">
            <div className="rounded-2xl border border-border bg-muted/20 p-6 sm:p-8">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-orange-500" />
                About {startup.name}
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed whitespace-pre-line">
                {startup.description}
              </p>
            </div>
          </motion.section>
        )}

        {/* ================================================================
            DETAILS GRID
            ================================================================ */}
        <motion.section variants={fadeIn} transition={{ duration: 0.4 }} className="pb-8">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Tag className="w-4 h-4 text-orange-500" />
            Details
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <DetailItem
              icon={Flame}
              label="Category"
              value={
                <span className="inline-flex items-center gap-1.5" style={{ color: categoryColor }}>
                  {getCategoryIcon(startup.category)} {startup.category}
                </span>
              }
            />
            <DetailItem
              icon={Trophy}
              label="Stage"
              value={
                <span style={{ color: stageColor }}>
                  {startup.stage}
                </span>
              }
            />
            <DetailItem
              icon={Users}
              label="Team Size"
              value={startup.teamSize || '—'}
            />
            <DetailItem
              icon={Calendar}
              label="Founded"
              value={startup.foundedYear ? String(startup.foundedYear) : '—'}
            />
            <DetailItem
              icon={MapPin}
              label="Country"
              value={startup.country || '—'}
            />
            <DetailItem
              icon={Sparkles}
              label="Launch Tier"
              value={
                <span className="inline-flex items-center gap-1.5">
                  {tier.icon}{' '}
                  <span style={{ color: tier.badgeColor.includes('orange') ? '#F97316' : tier.badgeColor.includes('blue') ? '#3B82F6' : tier.badgeColor.includes('green') ? '#22C55E' : undefined }}>
                    {tier.name}
                  </span>
                </span>
              }
            />
          </div>
        </motion.section>

        {/* ================================================================
            PERKS
            ================================================================ */}
        {startup.perks && startup.perks.length > 0 && (
          <motion.section variants={fadeIn} transition={{ duration: 0.4 }} className="pb-8">
            <div className="flex items-center gap-2 mb-4">
              <Gift className="w-4 h-4 text-orange-500" />
              <h3 className="text-sm font-semibold text-foreground">
                Perks & Offers
              </h3>
              <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20 text-[10px] font-semibold">
                {startup.perks.length} available
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {startup.perks.map((perk) => (
                <PerkCard key={perk.id} perk={perk} />
              ))}
            </div>
          </motion.section>
        )}

        {/* ================================================================
            SHARE
            ================================================================ */}
        <motion.section variants={fadeIn} transition={{ duration: 0.4 }} className="pb-8">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Share2 className="w-4 h-4 text-orange-500" />
            Share
          </h3>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleShareTwitter}
              variant="outline"
              className="rounded-xl h-10 px-4 text-sm text-muted-foreground hover:text-foreground gap-2"
            >
              <Twitter className="w-4 h-4" />
              <span className="hidden sm:inline">Share on X</span>
            </Button>
            <Button
              onClick={handleShareLinkedIn}
              variant="outline"
              className="rounded-xl h-10 px-4 text-sm text-muted-foreground hover:text-foreground gap-2"
            >
              <Linkedin className="w-4 h-4" />
              <span className="hidden sm:inline">Share on LinkedIn</span>
            </Button>
            <Button
              onClick={handleCopyLink}
              variant="outline"
              className={cn(
                'rounded-xl h-10 px-4 text-sm gap-2 transition-all duration-200',
                copied
                  ? 'text-green-500 border-green-500/30 bg-green-500/10'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {copied ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy link'}
            </Button>
            <Button
              onClick={() => setEmbedOpen(true)}
              variant="outline"
              className="rounded-xl h-10 px-4 text-sm text-muted-foreground hover:text-foreground gap-2"
            >
              <Code2 className="w-4 h-4" />
              <span className="hidden sm:inline">Embed</span>
            </Button>
          </div>
        </motion.section>

        {/* ================================================================
            EMBED DIALOG
            ================================================================ */}
        <Dialog open={embedOpen} onOpenChange={setEmbedOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-orange-500" />
                Embed {startup.name}
              </DialogTitle>
              <DialogDescription>
                Copy the code below to embed this startup card on your website.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Preview */}
              <div className="rounded-xl border border-border bg-muted/20 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500 font-bold text-sm shrink-0">
                    {startup.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">{startup.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{startup.tagline}</p>
                  </div>
                </div>
              </div>

              {/* HTML snippet */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-muted-foreground">HTML</span>
                  <button
                    onClick={() => handleEmbedCopy(embedHtml, 'html')}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {embedCopied === 'html' ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                    {embedCopied === 'html' ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <pre className="rounded-lg bg-muted/40 border border-border p-3 overflow-x-auto max-h-32">
                  <code className="text-xs font-mono text-foreground/80 leading-relaxed whitespace-pre">{embedHtml}</code>
                </pre>
              </div>

              {/* React snippet */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-muted-foreground">React Component</span>
                  <button
                    onClick={() => handleEmbedCopy(embedReact, 'react')}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {embedCopied === 'react' ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                    {embedCopied === 'react' ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <pre className="rounded-lg bg-muted/40 border border-border p-3 overflow-x-auto max-h-32">
                  <code className="text-xs font-mono text-foreground/80 leading-relaxed whitespace-pre">{embedReact}</code>
                </pre>
              </div>

              <p className="text-xs text-muted-foreground">
                This widget supports the{' '}
                <a href="/embed" className="text-orange-500 hover:text-orange-400 font-medium">
                  oEmbed standard
                </a>{' '}
                — paste the startup URL into Notion, Medium, or WordPress for auto-embedding.
              </p>
            </div>
          </DialogContent>
        </Dialog>

        {/* ================================================================
            RELATED STARTUPS
            ================================================================ */}
        {relatedStartups.length > 0 && (
          <motion.section variants={fadeIn} transition={{ duration: 0.4 }} className="pb-8">
            <div className="flex items-center gap-2 mb-4">
              <Flame className="w-4 h-4 text-orange-500" />
              <h3 className="text-sm font-semibold text-foreground">
                Related in {startup.category}
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {relatedStartups.map((related) => (
                <Link
                  key={related.id}
                  href={`/startup/${related.slug}`}
                  className="group rounded-xl border border-border hover:border-orange-500/30 bg-muted/20 hover:bg-muted/40 p-4 transition-all duration-200"
                >
                  <div className="flex items-start gap-3">
                    <StartupLogo
                      name={related.name}
                      logo={related.logo}
                      website={related.website}
                      logoColor={related.logoColor}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-foreground truncate group-hover:text-orange-500 transition-colors">
                        {related.name}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{related.tagline}</p>
                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                        <Star className="w-3 h-3 text-amber-500" />
                        <span className="tabular-nums font-medium">{related.upvotes}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.section>
        )}

        {/* ================================================================
            FOOTER — Listed on Revolaunch
            ================================================================ */}
        <motion.section
          variants={fadeIn}
          transition={{ duration: 0.4 }}
          className="pt-4 pb-8"
        >
          <Separator className="opacity-50 mb-6" />
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
            <Link href="/" className="flex items-center gap-1.5 hover:text-orange-500 transition-colors">
              <span className="font-bold text-orange-500">R</span>
              <span className="font-semibold text-foreground">Revolaunch</span>
            </Link>
            <div className="flex items-center gap-1.5">
              <span>Listed on Revolaunch</span>
              <span className="text-border">·</span>
              <span>{formatDate(startup.createdAt)}</span>
            </div>
          </div>
        </motion.section>
      </motion.main>
    </div>
  )
}
