'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Rocket, User, Star, Trophy, ChevronRight, ChevronLeft, Loader2,
  ExternalLink, Sparkles, Camera, X, Linkedin, Twitter, Globe, Zap, Check, Crown, Lock, Clock, Copy, CheckCircle2, AlertCircle, ShieldCheck
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import Header from '@/components/Header'
import { LAUNCH_TIERS, type LaunchTier } from '@/lib/launch-tiers'
import { usePlan } from '@/hooks/use-plan'
import Link from 'next/link'

const categories = ['AI', 'SaaS', 'Finance', 'Developer Tools', 'Productivity', 'Marketing', 'Business', 'Healthcare', 'Education', 'Other']
const stages = ['Pre-seed', 'Seed', 'Series A', 'Series B', 'Growth']
const SITE_URL = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_SITE_URL || 'revolaunch.vercel.app') : 'revolaunch.vercel.app'

export default function SubmitPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col bg-background">
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
        </div>
      </div>
    }>
      <SubmitPageContent />
    </Suspense>
  )
}

function SubmitPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedTier = (searchParams.get('tier') as LaunchTier) || 'free'

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [checkingOut, setCheckingOut] = useState(false)
  const [profile, setProfile] = useState({
    firstName: '', lastName: '', role: '', twitter: '', linkedin: '', roleType: 'founder'
  })
  const [startup, setStartup] = useState({
    name: '', website: '', tagline: '', description: '', category: '', stage: 'Pre-seed',
    teamSize: '1-5', foundedYear: '', country: '', email: ''
  })
  const [selectedTier, setSelectedTier] = useState<LaunchTier>(preselectedTier)
  const [submissionSettings, setSubmissionSettings] = useState<{
    freeListingsEnabled: boolean
    backlinkRequired: boolean
    startupCount: number
    threshold: number
  } | null>(null)
  const [badgeUrl, setBadgeUrl] = useState('')
  const [badgeVerified, setBadgeVerified] = useState(false)
  const [verifyingBadge, setVerifyingBadge] = useState(false)
  const [copiedBadge, setCopiedBadge] = useState<string | null>(null)
  const [fetchingMeta, setFetchingMeta] = useState(false)
  const metaFetchedRef = useRef<string | null>(null)

  // Plan hook for launch enforcement
  const { canLaunch, getSlotsRemaining, recordLaunch, serverSlots, loaded: planLoaded } = usePlan()

  // Read preselected tier from URL on mount + fetch submission settings
  useEffect(() => {
    const tier = searchParams.get('tier') as LaunchTier
    if (tier && LAUNCH_TIERS[tier]) {
      setSelectedTier(tier)
    }

    fetch('/api/admin/submission-settings')
      .then(res => res.ok ? res.json() : null)
      .then(data => data && setSubmissionSettings(data))
  }, [searchParams])

  const needsBadgeStep = selectedTier === 'free' && submissionSettings?.freeListingsEnabled && submissionSettings?.backlinkRequired
  const totalSteps = needsBadgeStep ? 4 : 3
  const progress = (step / totalSteps) * 100

  // Auto-fetch meta description + title when URL is entered
  const handleWebsiteBlur = useCallback(async (url: string) => {
    if (!url.trim()) return
    // Avoid re-fetching the same URL
    if (metaFetchedRef.current === url.trim()) return

    setFetchingMeta(true)
    try {
      const res = await fetch('/api/fetch-meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })
      const data = await res.json()

      if (res.ok && data.tagline) {
        metaFetchedRef.current = url.trim()
        setStartup(prev => ({
          ...prev,
          // Only auto-fill tagline if user hasn't typed one yet
          tagline: prev.tagline || data.tagline,
          // Only auto-fill description if user hasn't typed one yet
          description: prev.description || data.description || '',
        }))
        toast.success('Auto-filled from your website')
      }
    } catch {
      // Silently fail — user can type manually
    } finally {
      setFetchingMeta(false)
    }
  }, [])

  const handleProfileNext = () => {
    if (!profile.firstName || !profile.lastName) {
      toast.error('Please enter your name')
      return
    }
    setStep(2)
  }

  const handleStartupNext = () => {
    if (!startup.name || !startup.website || !startup.tagline || !startup.category) {
      toast.error('Please fill in all required fields')
      return
    }
    setStep(3)
  }

  const handleTierSelect = (tier: LaunchTier) => {
    setSelectedTier(tier)
    // Reset badge state when switching tiers
    if (tier !== 'free') {
      setBadgeVerified(false)
      setBadgeUrl('')
      if (step === 4) setStep(3)
    }
  }

  const handleSubmit = async () => {
    // Check slot availability before proceeding
    const launchCheck = canLaunch(selectedTier)
    if (!launchCheck.allowed) {
      toast.error(launchCheck.reason || 'Launch slot not available')
      return
    }

    const tierConfig = LAUNCH_TIERS[selectedTier]

    // If paid tier, trigger checkout first
    if (tierConfig.price > 0) {
      setCheckingOut(true)
      try {
        const res = await fetch('/api/billing/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tier: selectedTier,
            startupName: startup.name,
            founderEmail: startup.email || profile.firstName,
          }),
        })
        const data = await res.json()

        if (data.checkoutUrl) {
          // Redirect to LemonSqueezy checkout
          window.location.href = data.checkoutUrl
          return
        }

        // Demo mode — no checkout URL, proceed directly
        if (data.demo || !data.checkoutUrl) {
          setCheckingOut(false)
          proceedWithLaunch()
          return
        }

        toast.error('Failed to create checkout')
        setCheckingOut(false)
      } catch {
        toast.error('Payment processing failed')
        setCheckingOut(false)
      }
      return
    }

    // Free tier — check if badge verification needed
    if (tierConfig.price === 0 && needsBadgeStep && !badgeVerified) {
      setStep(4)
      return
    }

    proceedWithLaunch()
  }

  const proceedWithLaunch = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/startups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: startup.name,
          tagline: startup.tagline,
          description: startup.description,
          website: startup.website,
          category: startup.category,
          stage: startup.stage,
          teamSize: startup.teamSize,
          foundedYear: startup.foundedYear ? parseInt(startup.foundedYear) : null,
          country: startup.country,
          email: startup.email,
          twitter: profile.twitter || null,
          tier: selectedTier,
        }),
      })

      if (res.ok) {
        // Record the launch locally
        recordLaunch(startup.name, selectedTier, LAUNCH_TIERS[selectedTier].price)

        router.push(`/launch-confirmation?name=${encodeURIComponent(startup.name)}&url=${encodeURIComponent(startup.website)}&founder=${encodeURIComponent(profile.firstName + ' ' + profile.lastName)}&email=${encodeURIComponent(startup.email || '')}&tier=${encodeURIComponent(selectedTier)}`)
      } else {
        toast.error('Failed to submit startup')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyBadge = async () => {
    if (!badgeUrl.trim()) {
      toast.error('Please enter a URL where you added our badge')
      return
    }

    setVerifyingBadge(true)
    try {
      const res = await fetch('/api/verify-badge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: badgeUrl.trim() }),
      })
      const data = await res.json()

      if (data.verified) {
        setBadgeVerified(true)
        toast.success('Badge verified successfully!')
      } else {
        setBadgeVerified(false)
        toast.error(data.error || 'Badge not found. Please make sure the badge HTML is on the page and try again.')
      }
    } catch {
      toast.error('Verification failed. Please try again.')
    } finally {
      setVerifyingBadge(false)
    }
  }

  const copyBadgeHtml = (theme: 'light' | 'dark') => {
    const html = theme === 'light'
      ? `<a href="https://${SITE_URL}" target="_blank" rel="noopener noreferrer"><img src="https://${SITE_URL}/api/badge?theme=light" alt="Listed on Revolaunch" width="220" height="48" /></a>`
      : `<a href="https://${SITE_URL}" target="_blank" rel="noopener noreferrer"><img src="https://${SITE_URL}/api/badge?theme=dark" alt="Listed on Revolaunch" width="220" height="48" /></a>`
    navigator.clipboard.writeText(html)
    setCopiedBadge(theme)
    setTimeout(() => setCopiedBadge(null), 2000)
  }

  // Get slot info for display
  const getSlotInfo = (tier: LaunchTier) => {
    const remaining = getSlotsRemaining(tier)
    const total = LAUNCH_TIERS[tier].slotsPerDay
    const isSoldOut = remaining === 0
    return { remaining, total, isSoldOut }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Step {step} of {totalSteps}</span>
              <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-orange-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1: Profile */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col lg:flex-row gap-8"
              >
                {/* Form */}
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-foreground mb-1">
                    Let&apos;s personalize your experience, {profile.firstName || 'founder'}.
                  </h1>
                  <p className="text-sm text-muted-foreground mb-6">
                    Tell us about yourself so we can tailor your Revolaunch experience.
                  </p>

                  {/* Profile photo placeholder */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500/30 to-amber-500/30 border-2 border-border flex items-center justify-center">
                      <Camera className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground text-xs h-8">
                        <Camera className="w-3.5 h-3.5 mr-1.5" />
                        Upload Photo
                      </Button>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Optional - helps build trust</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground">First name *</label>
                        <Input
                          placeholder="John"
                          value={profile.firstName}
                          onChange={e => setProfile({ ...profile, firstName: e.target.value })}
                          className="input-bg input-bg-focus text-foreground h-10 rounded-lg"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground">Last name *</label>
                        <Input
                          placeholder="Doe"
                          value={profile.lastName}
                          onChange={e => setProfile({ ...profile, lastName: e.target.value })}
                          className="input-bg input-bg-focus text-foreground h-10 rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground">Role</label>
                      <Input
                        placeholder="Co-founder at SpaceX"
                        value={profile.role}
                        onChange={e => setProfile({ ...profile, role: e.target.value })}
                        className="input-bg input-bg-focus text-foreground h-10 rounded-lg"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground">
                          X (Twitter) <span className="text-muted-foreground">optional</span>
                        </label>
                        <div className="relative">
                          <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                          <Input
                            placeholder="https://x.com/handle"
                            value={profile.twitter}
                            onChange={e => setProfile({ ...profile, twitter: e.target.value })}
                            className="pl-9 input-bg input-bg-focus text-foreground h-10 rounded-lg"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground">
                          LinkedIn <span className="text-muted-foreground">optional</span>
                        </label>
                        <div className="relative">
                          <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                          <Input
                            placeholder="https://linkedin.com/in/profile"
                            value={profile.linkedin}
                            onChange={e => setProfile({ ...profile, linkedin: e.target.value })}
                            className="pl-9 input-bg input-bg-focus text-foreground h-10 rounded-lg"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground mb-2 block">You are here as</label>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setProfile({ ...profile, roleType: 'founder' })}
                          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all border ${
                            profile.roleType === 'founder'
                              ? 'bg-orange-500 text-white border-orange-500'
                              : 'bg-muted text-muted-foreground border-border hover:border-orange-500/20'
                          }`}
                        >
                          <Rocket className="w-4 h-4 inline mr-1.5" />
                          I&apos;m a Founder / Maker
                        </button>
                        <button
                          onClick={() => setProfile({ ...profile, roleType: 'investor' })}
                          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all border ${
                            profile.roleType === 'investor'
                              ? 'bg-orange-500 text-white border-orange-500'
                              : 'bg-muted text-muted-foreground border-border hover:border-orange-500/20'
                          }`}
                        >
                          <Trophy className="w-4 h-4 inline mr-1.5" />
                          I&apos;m an Investor / Buyer
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end mt-6">
                    <Button onClick={handleProfileNext} className="bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg h-10 px-6">
                      Next <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>

                {/* Live preview card */}
                <div className="lg:w-[300px] shrink-0">
                  <div className="lg:sticky lg:top-[72px]">
                    <p className="text-xs text-muted-foreground mb-3">Preview</p>
                    <div className="rounded-xl border-2 border-orange-500/30 surface p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center">
                          <Rocket className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">revolaunch.net</span>
                      </div>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500/30 to-amber-500/30 flex items-center justify-center text-foreground font-bold text-lg">
                          {profile.firstName ? profile.firstName[0].toUpperCase() : '?'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {profile.firstName} {profile.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">{profile.role || 'Your role'}</p>
                        </div>
                      </div>
                      {profile.twitter && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Twitter className="w-3 h-3" />
                          <span>{profile.twitter}</span>
                        </div>
                      )}
                      {profile.linkedin && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Linkedin className="w-3 h-3" />
                          <span>{profile.linkedin}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Win the Week */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col lg:flex-row gap-8"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-4xl">🏅</span>
                  </div>
                  <h1 className="text-2xl font-bold text-foreground mb-2">
                    Win the Week. Every Single Week.
                  </h1>
                  <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                    Collect stars and reviews from the community to climb the weekly leaderboard.
                    The top 3 startups every week get featured to 50K+ visitors.
                  </p>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-muted border subtle-border">
                      <span className="text-xl">⭐</span>
                      <div>
                        <p className="text-sm font-medium text-foreground">Collect Stars</p>
                        <p className="text-xs text-muted-foreground">Every star from the community counts toward your weekly ranking</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-muted border subtle-border">
                      <span className="text-xl">🏆</span>
                      <div>
                        <p className="text-sm font-medium text-foreground">Win the Week</p>
                        <p className="text-xs text-muted-foreground">Top 3 every week get featured on our homepage and newsletter</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-muted border subtle-border">
                      <span className="text-xl">🚀</span>
                      <div>
                        <p className="text-sm font-medium text-foreground">Get Discovered</p>
                        <p className="text-xs text-muted-foreground">Investors and early adopters browse Revolaunch daily</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between mt-6">
                    <Button variant="ghost" onClick={() => setStep(1)} className="text-muted-foreground hover:text-foreground h-10">
                      <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                    </Button>
                    <Button onClick={() => setStep(3)} className="bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg h-10 px-6">
                      Next <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>

                {/* Leaderboard preview */}
                <div className="lg:w-[300px] shrink-0">
                  <div className="lg:sticky lg:top-[72px]">
                    <div className="rounded-xl border subtle-border surface overflow-hidden">
                      <div className="p-4 border-b subtle-border">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Current Leaders</p>
                      </div>
                      <div className="divide-y divide-border">
                        {[
                          { name: 'Your Startup', pts: 0, medal: '🥇', color: 'bg-yellow-500/20' },
                          { name: 'NeuralForge', pts: 340, medal: '🥈', color: 'bg-gray-400/20' },
                          { name: 'PayStream', pts: 290, medal: '🥉', color: 'bg-orange-700/20' },
                        ].map((item, i) => (
                          <div key={i} className={`flex items-center gap-3 p-3 ${i === 0 ? 'card-active-bg' : ''}`}>
                            <div className={`w-8 h-8 rounded-lg ${item.color} flex items-center justify-center text-base`}>
                              {item.medal}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-amber-500" />
                              <span className="text-sm font-bold text-foreground tabular-nums">{item.pts}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Launch with Tier Selection */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col lg:flex-row gap-8"
              >
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-foreground mb-2">
                    Ready to launch?
                  </h1>
                  <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                    Choose your launch plan and submit. All launches go live at <span className="text-orange-500 font-medium">8:00 AM UTC</span>.
                  </p>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground">Startup Name *</label>
                        <Input
                          placeholder="e.g., Acme Inc."
                          value={startup.name}
                          onChange={e => setStartup({ ...startup, name: e.target.value })}
                          className="input-bg input-bg-focus text-foreground h-10 rounded-lg"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground">Startup URL *</label>
                        <div className="relative">
                          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                          <Input
                            placeholder="example.com"
                            value={startup.website}
                            onChange={e => setStartup({ ...startup, website: e.target.value })}
                            onBlur={() => handleWebsiteBlur(startup.website)}
                            disabled={fetchingMeta}
                            className="pl-9 input-bg input-bg-focus text-foreground h-10 rounded-lg"
                          />
                          {fetchingMeta && (
                            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-orange-500" />
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          {fetchingMeta ? 'Fetching details from your website...' : 'We\'ll auto-fill your tagline and description from your site'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground">Tagline *</label>
                      <Input
                        placeholder="One sentence that describes your startup"
                        value={startup.tagline}
                        onChange={e => setStartup({ ...startup, tagline: e.target.value })}
                        className="input-bg input-bg-focus text-foreground h-10 rounded-lg"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground">Description</label>
                      <textarea
                        placeholder="Tell us more about what you're building..."
                        value={startup.description}
                        onChange={e => setStartup({ ...startup, description: e.target.value })}
                        className="w-full min-h-[80px] input-bg input-bg-focus text-foreground rounded-lg px-3 py-2 text-sm resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground">Category *</label>
                        <Select value={startup.category} onValueChange={v => setStartup({ ...startup, category: v })}>
                          <SelectTrigger className="input-bg text-foreground h-10 rounded-lg">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent className="popover-bg border-border">
                            {categories.map(c => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground">Stage</label>
                        <Select value={startup.stage} onValueChange={v => setStartup({ ...startup, stage: v })}>
                          <SelectTrigger className="input-bg text-foreground h-10 rounded-lg">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="popover-bg border-border">
                            {stages.map(s => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground">Team Size</label>
                        <Select value={startup.teamSize} onValueChange={v => setStartup({ ...startup, teamSize: v })}>
                          <SelectTrigger className="input-bg text-foreground h-10 rounded-lg">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="popover-bg border-border">
                            {['1-5', '6-20', '21-50', '51-200', '200+'].map(s => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground">Founded Year</label>
                        <Input
                          type="number"
                          placeholder="2024"
                          value={startup.foundedYear}
                          onChange={e => setStartup({ ...startup, foundedYear: e.target.value })}
                          className="input-bg input-bg-focus text-foreground h-10 rounded-lg"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground">Country</label>
                        <Input
                          placeholder="United States"
                          value={startup.country}
                          onChange={e => setStartup({ ...startup, country: e.target.value })}
                          className="input-bg input-bg-focus text-foreground h-10 rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground">Contact Email</label>
                      <Input
                        type="email"
                        placeholder="founder@startup.com"
                        value={startup.email}
                        onChange={e => setStartup({ ...startup, email: e.target.value })}
                        className="input-bg input-bg-focus text-foreground h-10 rounded-lg"
                      />
                    </div>

                    {/* ─── Tier Selection with Slot Enforcement ─── */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-foreground">
                          Choose Your Launch Plan
                        </label>
                        <Link href="/pricing" className="text-orange-500 hover:text-orange-400 text-[10px] font-medium">
                          View full comparison
                        </Link>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {(['free', 'premium', 'premium-plus', 'seo-growth'] as LaunchTier[]).map(key => {
                          const tier = LAUNCH_TIERS[key]
                          const isSelected = selectedTier === key
                          const slotInfo = getSlotInfo(key)
                          const isSoldOut = slotInfo.isSoldOut
                          const isLocked = isSoldOut && key !== 'free'

                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => !isLocked && handleTierSelect(key)}
                              disabled={isLocked}
                              className={`relative rounded-xl border-2 p-3 text-left transition-all ${
                                isLocked
                                  ? 'border-border bg-muted/30 opacity-50 cursor-not-allowed'
                                  : isSelected
                                    ? `${tier.borderColor} bg-muted/30`
                                    : 'border-border hover:border-muted-foreground/30 cursor-pointer'
                              }`}
                            >
                              {isSelected && (
                                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center">
                                  <Check className="w-3 h-3 text-white" />
                                </div>
                              )}
                              {isLocked && (
                                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-muted flex items-center justify-center">
                                  <Lock className="w-3 h-3 text-muted-foreground" />
                                </div>
                              )}
                              <div className="text-lg mb-1">{tier.icon}</div>
                              <p className="text-xs font-semibold text-foreground">{tier.name}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] text-muted-foreground">
                                  {tier.price === 0 ? 'Free' : `$${tier.price}/launch`}
                                </span>
                              </div>
                              {/* Slot indicator */}
                              <div className={`flex items-center gap-1 mt-1.5 text-[9px] ${
                                slotInfo.remaining <= 2 && slotInfo.remaining > 0
                                  ? 'text-amber-500'
                                  : slotInfo.remaining === 0
                                    ? 'text-red-500'
                                    : 'text-muted-foreground'
                              }`}>
                                <Clock className="w-2.5 h-2.5" />
                                <span>
                                  {slotInfo.remaining === 0
                                    ? 'Sold out today'
                                    : `${slotInfo.remaining}/${slotInfo.total} slots left`
                                  }
                                </span>
                              </div>
                            </button>
                          )
                        })}
                      </div>

                      {/* Selected tier summary */}
                      {selectedTier && (
                        <motion.div
                          key={selectedTier}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="rounded-lg border subtle-border bg-muted/30 p-3 mt-2"
                        >
                          <div className="flex items-center gap-2 mb-1.5">
                            <span>{LAUNCH_TIERS[selectedTier].icon}</span>
                            <span className="text-xs font-semibold text-foreground">
                              {LAUNCH_TIERS[selectedTier].name}
                            </span>
                            {LAUNCH_TIERS[selectedTier].price > 0 && (
                              <Badge variant="secondary" className="text-[9px] bg-orange-500/10 text-orange-500 border-orange-500/20 ml-auto">
                                ${LAUNCH_TIERS[selectedTier].price} one-time
                              </Badge>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground leading-relaxed">
                            {selectedTier === 'free' && submissionSettings?.freeListingsEnabled && submissionSettings?.backlinkRequired && 'Free submission requires adding a Revolaunch badge to your website before launching.'}
                            {selectedTier === 'free' && !(submissionSettings?.freeListingsEnabled && submissionSettings?.backlinkRequired) && 'Your startup will join the standard queue. Earn a backlink by reaching the top 3 daily ranking.'}
                            {selectedTier === 'premium' && 'Skip the queue, get a guaranteed dofollow backlink (DR 50), and receive a premium badge on your listing.'}
                            {selectedTier === 'premium-plus' && 'Get everything in Premium plus homepage spotlight, 14-day feed promotion, and a share on our X account.'}
                            {selectedTier === 'seo-growth' && 'Includes a dedicated SEO article that ranks for your product keywords, plus everything in Premium Plus.'}
                          </p>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between mt-6">
                    <Button variant="ghost" onClick={() => setStep(2)} className="text-muted-foreground hover:text-foreground h-10">
                      <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                    </Button>
                    <div className="flex items-center gap-3">
                      <Button variant="ghost" onClick={() => router.push('/')} className="text-muted-foreground hover:text-foreground text-sm h-10">
                        I&apos;ll do this later
                      </Button>
                      <Button
                        onClick={handleSubmit}
                        disabled={loading || checkingOut}
                        className="bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg h-10 px-6"
                      >
                        {loading || checkingOut ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {checkingOut ? 'Processing payment...' : 'Launching...'}
                          </span>
                        ) : (
                          <>
                            <Rocket className="w-4 h-4 mr-1.5" />
                            {LAUNCH_TIERS[selectedTier].price > 0
                              ? `Pay $${LAUNCH_TIERS[selectedTier].price} & Launch`
                              : needsBadgeStep
                                ? 'Next: Verify Badge'
                                : 'Launch Now'
                            }
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Launch Now CTA */}
                <div className="lg:w-[300px] shrink-0">
                  <div className="lg:sticky lg:top-[72px] space-y-4">
                    <div className="rounded-xl border border-orange-500/20 card-active-bg p-6 text-center">
                      <h2 className="text-3xl font-bold gradient-text-blue mb-2">LAUNCH NOW</h2>
                      <p className="text-xs text-muted-foreground mb-4">
                        Join 36 startups already competing for the top spot this week.
                      </p>
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="rounded-lg bg-muted p-3">
                          <p className="text-lg font-bold text-foreground">50K+</p>
                          <p className="text-[10px] text-muted-foreground">Monthly Visitors</p>
                        </div>
                        <div className="rounded-lg bg-muted p-3">
                          <p className="text-lg font-bold text-foreground">200+</p>
                          <p className="text-[10px] text-muted-foreground">Investors Active</p>
                        </div>
                      </div>
                    </div>

                    {/* Daily slot overview */}
                    <div className="rounded-xl border subtle-border surface p-4">
                      <p className="text-xs font-semibold text-foreground mb-3">Today&apos;s Availability</p>
                      <div className="space-y-2">
                        {(['free', 'premium', 'premium-plus', 'seo-growth'] as LaunchTier[]).map(tier => {
                          const info = getSlotInfo(tier)
                          const pct = (info.remaining / info.total) * 100
                          return (
                            <div key={tier} className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-muted-foreground">{LAUNCH_TIERS[tier].icon} {LAUNCH_TIERS[tier].name.replace(' Launch', '').replace(' Package', '')}</span>
                                <span className={`text-[10px] font-medium ${
                                  info.remaining === 0 ? 'text-red-500' : info.remaining <= 2 ? 'text-amber-500' : 'text-muted-foreground'
                                }`}>
                                  {info.remaining}/{info.total}
                                </span>
                              </div>
                              <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    info.remaining === 0 ? 'bg-red-500' : info.remaining <= 2 ? 'bg-amber-500' : 'bg-green-500'
                                  }`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            {/* Step 4: Badge Verification (free tier only) */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col lg:flex-row gap-8"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <ShieldCheck className="w-6 h-6 text-orange-500" />
                  </div>
                  <h1 className="text-2xl font-bold text-foreground mb-1">
                    Add our badge to your website
                  </h1>
                  <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                    To submit for free, please add the Revolaunch badge to your website. Copy the HTML snippet below, paste it on your site, then verify.
                  </p>

                  {/* Badge previews and snippets */}
                  <div className="space-y-4 mb-6">
                    <div className="p-4 rounded-xl border subtle-border bg-muted/30">
                      <p className="text-xs font-medium text-foreground mb-3">Step 1: Copy the badge HTML</p>
                      <div className="space-y-3">
                        {/* Light badge */}
                        <div>
                          <p className="text-[10px] text-muted-foreground mb-1.5">Light theme</p>
                          <div className="flex items-center gap-3">
                            <div className="bg-white rounded-lg border border-border p-2">
                              <img src="/api/badge?theme=light" alt="Light badge" width={220} height={48} />
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyBadgeHtml('light')}
                              className="h-8 text-xs shrink-0"
                            >
                              {copiedBadge === 'light' ? (
                                <><CheckCircle2 className="w-3 h-3 mr-1 text-green-500" /> Copied</>
                              ) : (
                                <><Copy className="w-3 h-3 mr-1" /> Copy HTML</>
                              )}
                            </Button>
                          </div>
                        </div>
                        {/* Dark badge */}
                        <div>
                          <p className="text-[10px] text-muted-foreground mb-1.5">Dark theme</p>
                          <div className="flex items-center gap-3">
                            <div className="bg-[#1a1a1a] rounded-lg border border-border p-2">
                              <img src="/api/badge?theme=dark" alt="Dark badge" width={220} height={48} />
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyBadgeHtml('dark')}
                              className="h-8 text-xs shrink-0"
                            >
                              {copiedBadge === 'dark' ? (
                                <><CheckCircle2 className="w-3 h-3 mr-1 text-green-500" /> Copied</>
                              ) : (
                                <><Copy className="w-3 h-3 mr-1" /> Copy HTML</>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Verification input */}
                    <div className="p-4 rounded-xl border subtle-border bg-muted/30">
                      <p className="text-xs font-medium text-foreground mb-3">Step 2: Verify your badge</p>
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <Input
                            placeholder="https://yourwebsite.com/page-with-badge"
                            value={badgeUrl}
                            onChange={e => { setBadgeUrl(e.target.value); setBadgeVerified(false) }}
                            className="input-bg input-bg-focus text-foreground h-10 rounded-lg flex-1"
                          />
                          <Button
                            onClick={handleVerifyBadge}
                            disabled={verifyingBadge || !badgeUrl.trim()}
                            className="bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg h-10 px-4 shrink-0"
                          >
                            {verifyingBadge ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              'Verify'
                            )}
                          </Button>
                        </div>

                        {/* Verification result */}
                        {badgeVerified && (
                          <motion.div
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-start gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20"
                          >
                            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-green-600 dark:text-green-400">
                              Badge verified! Your website contains a link to Revolaunch. You can now proceed with your free launch.
                            </p>
                          </motion.div>
                        )}

                        {!badgeVerified && badgeUrl && !verifyingBadge && (
                          <div className="flex items-start gap-2 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                            <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-orange-600 dark:text-orange-400">
                              Badge not found. Make sure you&apos;ve added the HTML snippet to the page and the page is publicly accessible. Some websites may take a few minutes to update.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between mt-6">
                    <Button variant="ghost" onClick={() => setStep(3)} className="text-muted-foreground hover:text-foreground h-10">
                      <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                    </Button>
                    <Button
                      onClick={proceedWithLaunch}
                      disabled={loading || !badgeVerified}
                      className="bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg h-10 px-6"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Launching...
                        </span>
                      ) : (
                        <>
                          <Rocket className="w-4 h-4 mr-1.5" />
                          Launch Now
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Sidebar */}
                <div className="lg:w-[300px] shrink-0">
                  <div className="lg:sticky lg:top-[72px] space-y-4">
                    <div className="rounded-xl border border-orange-500/20 card-active-bg p-6 text-center">
                      <h2 className="text-3xl font-bold gradient-text-blue mb-2">ALMOST THERE</h2>
                      <p className="text-xs text-muted-foreground mb-4">
                        Just add our badge and you&apos;re ready to launch!
                      </p>
                      <div className="rounded-lg bg-muted p-3">
                        <p className="text-sm font-bold text-foreground">Free forever</p>
                        <p className="text-[10px] text-muted-foreground">No credit card needed</p>
                      </div>
                    </div>

                    <div className="rounded-xl border subtle-border surface p-4">
                      <p className="text-xs font-semibold text-foreground mb-3">Why a badge?</p>
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <span className="text-base">🔗</span>
                          <p className="text-[10px] text-muted-foreground">Helps us grow so we can send more traffic to your startup</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-base">📈</span>
                          <p className="text-[10px] text-muted-foreground">Gives you a dofollow backlink from our directory</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-base">⭐</span>
                          <p className="text-[10px] text-muted-foreground">Shows community trust and boosts your listing</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
