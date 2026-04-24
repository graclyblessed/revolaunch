'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { LAUNCH_TIERS, type LaunchTier } from '@/lib/launch-tiers'

// ─── Types ───
export type PlanType = 'free' | 'premium' | 'premium-plus' | 'seo-growth'

export interface LaunchRecord {
  id: string
  startupName: string
  tier: LaunchTier
  launchedAt: string
  status: 'pending' | 'live' | 'expired'
  amountPaid: number
}

interface UserLaunchState {
  launches: LaunchRecord[]
  totalSpent: number
  freeLaunchesUsed: number
}

interface PlanConfig {
  id: PlanType
  name: string
  pricePerLaunch: number
  slotsPerDay: number
  schedulesLimit: number
  platformsLimit: number
  features: string[]
}

// ─── Plan Configuration ───
export const PLANS: Record<PlanType, PlanConfig> = {
  free: {
    id: 'free',
    name: 'Free Launch',
    pricePerLaunch: 0,
    slotsPerDay: LAUNCH_TIERS.free.slotsPerDay,
    schedulesLimit: 10,
    platformsLimit: 1,
    features: [
      'Browse all startups',
      'Upvote & follow founders',
      'Dashboard with analytics',
      'Post up to 10 scheduled posts',
      'Single platform scheduling',
      'Basic inbox & reviews',
      '1 free launch per day',
    ],
  },
  premium: {
    id: 'premium',
    name: 'Premium Launch',
    pricePerLaunch: 9,
    slotsPerDay: LAUNCH_TIERS.premium.slotsPerDay,
    schedulesLimit: 50,
    platformsLimit: 4,
    features: [
      'Everything in Free',
      'Skip the launch queue',
      'Guaranteed dofollow backlink (DR 50)',
      'Premium badge on listing',
      '50 scheduled posts',
      'All platforms (Twitter, LinkedIn, Blog, Launch)',
      'Priority in search and filters',
    ],
  },
  'premium-plus': {
    id: 'premium-plus',
    name: 'Premium Plus',
    pricePerLaunch: 12.5,
    slotsPerDay: LAUNCH_TIERS['premium-plus'].slotsPerDay,
    schedulesLimit: Infinity,
    platformsLimit: Infinity,
    features: [
      'Everything in Premium',
      'Featured embed with badge forever',
      'Homepage spotlight placement',
      'Promoted in feed for 14 days',
      'Shared on Revolaunch X account',
      'Unlimited scheduled posts',
      'Advanced analytics & signals',
      'Fastest launch date priority',
    ],
  },
  'seo-growth': {
    id: 'seo-growth',
    name: 'SEO Growth Package',
    pricePerLaunch: 49,
    slotsPerDay: LAUNCH_TIERS['seo-growth'].slotsPerDay,
    schedulesLimit: Infinity,
    platformsLimit: Infinity,
    features: [
      'Everything in Premium Plus',
      'Dedicated SEO article for your product',
      'Google ranking strategy',
      'Long-term organic traffic',
      'Featured embed in article',
      'Priority support',
      'Unlimited scheduled posts',
      'All platforms unlocked',
    ],
  },
}

const LS_KEY_LAUNCHES = 'revolaunch_launches'

const DEFAULT_STATE: UserLaunchState = {
  launches: [],
  totalSpent: 0,
  freeLaunchesUsed: 0,
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

// ─── Hook ───
export function usePlan() {
  const [state, setState] = useState<UserLaunchState>(DEFAULT_STATE)
  const [loaded, setLoaded] = useState(false)
  const [serverSlots, setServerSlots] = useState<Record<LaunchTier, { used: number; total: number }>>({
    free: { used: 0, total: LAUNCH_TIERS.free.slotsPerDay },
    premium: { used: 0, total: LAUNCH_TIERS.premium.slotsPerDay },
    'premium-plus': { used: 0, total: LAUNCH_TIERS['premium-plus'].slotsPerDay },
    'seo-growth': { used: 0, total: LAUNCH_TIERS['seo-growth'].slotsPerDay },
  })

  useEffect(() => {
    const saved = getLS<UserLaunchState>(LS_KEY_LAUNCHES, DEFAULT_STATE)
    setState(saved)
    setLoaded(true)
    // Fetch server slot availability
    fetchSlots()
  }, [])

  const fetchSlots = useCallback(async () => {
    try {
      const res = await fetch('/api/launch/slots')
      if (res.ok) {
        const data = await res.json()
        setServerSlots(data.slots)
      }
    } catch {
      // Use local counts as fallback
    }
  }, [])

  const saveState = useCallback((newState: UserLaunchState) => {
    setState(newState)
    setLS(LS_KEY_LAUNCHES, newState)
  }, [])

  // Record a launch
  const recordLaunch = useCallback((startupName: string, tier: LaunchTier, amountPaid: number): LaunchRecord => {
    const record: LaunchRecord = {
      id: `launch-${Date.now()}`,
      startupName,
      tier,
      launchedAt: new Date().toISOString(),
      status: 'pending',
      amountPaid,
    }
    const newState: UserLaunchState = {
      launches: [record, ...state.launches],
      totalSpent: state.totalSpent + amountPaid,
      freeLaunchesUsed: tier === 'free' ? state.freeLaunchesUsed + 1 : state.freeLaunchesUsed,
    }
    saveState(newState)
    return record
  }, [state, saveState])

  // Check if user can launch with a given tier today
  const canLaunch = useCallback((tier: LaunchTier): { allowed: boolean; reason?: string } => {
    const today = new Date().toISOString().split('T')[0]
    const todaysLaunches = state.launches.filter(
      l => l.launchedAt.split('T')[0] === today && l.tier === tier
    )
    const tierConfig = LAUNCH_TIERS[tier]
    const slotsUsed = serverSlots[tier]?.used ?? todaysLaunches.length
    const slotsTotal = serverSlots[tier]?.total ?? tierConfig.slotsPerDay

    if (tier === 'free') {
      // Free users limited to 1 free launch per day locally
      if (todaysLaunches.length >= 1) {
        return { allowed: false, reason: 'You have already used your 1 free launch today. Upgrade to Premium for more launches.' }
      }
      if (slotsUsed >= slotsTotal) {
        return { allowed: false, reason: `All ${slotsTotal} free launch slots are taken today. Try again tomorrow or upgrade to Premium.` }
      }
    }

    if (slotsUsed >= slotsTotal) {
      return { allowed: false, reason: `All ${slotsTotal} ${tierConfig.name} slots are taken today. Try again tomorrow or choose a different plan.` }
    }

    return { allowed: true }
  }, [state.launches, serverSlots])

  // Get remaining slots for a tier
  const getSlotsRemaining = useCallback((tier: LaunchTier): number => {
    const tierConfig = LAUNCH_TIERS[tier]
    const slotsUsed = serverSlots[tier]?.used ?? 0
    const slotsTotal = serverSlots[tier]?.total ?? tierConfig.slotsPerDay
    return Math.max(0, slotsTotal - slotsUsed)
  }, [serverSlots])

  // Get plan label for user
  const getPlanLabel = useCallback((): string => {
    if (state.launches.length === 0) return 'Free Plan'
    const hasPaid = state.launches.some(l => l.amountPaid > 0)
    if (hasPaid) return 'Launch Customer'
    return 'Free Plan'
  }, [state.launches])

  // Content scheduler limits based on highest tier purchased
  const activeTier: PlanType = useMemo(() => {
    const tierOrder: LaunchTier[] = ['free', 'premium', 'premium-plus', 'seo-growth']
    let highest: LaunchTier = 'free'
    for (const l of state.launches) {
      const idx = tierOrder.indexOf(l.tier)
      const highestIdx = tierOrder.indexOf(highest)
      if (idx > highestIdx) highest = l.tier
    }
    return highest
  }, [state.launches])

  const planConfig = PLANS[activeTier]

  const canScheduleMore = useCallback((currentCount: number) => {
    if (planConfig.schedulesLimit === Infinity) return true
    return currentCount < planConfig.schedulesLimit
  }, [planConfig])

  const getSchedulesRemaining = useCallback((currentCount: number) => {
    if (planConfig.schedulesLimit === Infinity) return Infinity
    return Math.max(0, planConfig.schedulesLimit - currentCount)
  }, [planConfig])

  return {
    // State
    state,
    loaded,
    serverSlots,
    activeTier,
    planConfig: PLANS[activeTier],

    // Launch management
    recordLaunch,
    canLaunch,
    getSlotsRemaining,

    // Content scheduler (based on highest tier ever purchased)
    canScheduleMore,
    getSchedulesRemaining,

    // Info
    getPlanLabel,
    totalLaunches: state.launches.length,
    totalSpent: state.totalSpent,
    freeLaunchesUsed: state.freeLaunchesUsed,
    fetchSlots,
    saveState,
  }
}
