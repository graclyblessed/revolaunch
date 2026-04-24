'use client'

import { useState, useEffect, useCallback } from 'react'

// ─── Types ───
export type PlanType = 'free' | 'pro'
export type BillingCycle = 'monthly' | 'annual' | 'lifetime'

export interface UserPlan {
  plan: PlanType
  cycle: BillingCycle | null
  activatedAt: string | null
  expiresAt: string | null
  lemonSqueezySubscriptionId: string | null
  lemonSqueezyOrderId: string | null
}

interface PlanConfig {
  id: PlanType
  name: string
  price: { monthly: number; annual: number; lifetime: number }
  features: string[]
  schedulesLimit: number
  platformsLimit: number
}

// ─── Plan Configuration ───
export const PLANS: Record<PlanType, PlanConfig> = {
  free: {
    id: 'free',
    name: 'Free',
    price: { monthly: 0, annual: 0, lifetime: 0 },
    features: [
      'Browse all startups',
      'Upvote & follow founders',
      'Dashboard with analytics',
      'Post up to 10 scheduled posts',
      'Single platform scheduling',
      'Basic inbox & reviews',
    ],
    schedulesLimit: 10,
    platformsLimit: 1,
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: { monthly: 19, annual: 149, lifetime: 399 },
    features: [
      'Everything in Free',
      'Unlimited scheduled posts',
      'All platforms (Twitter, LinkedIn, Blog, Launch)',
      'Priority listing for your startups',
      'Advanced analytics & signals',
      'Early access to new features',
      'Perk redemption & affiliate tracking',
      'Dedicated support',
    ],
    schedulesLimit: Infinity,
    platformsLimit: Infinity,
  },
}

const LS_KEY_PLAN = 'revolaunch_user_plan'

const DEFAULT_PLAN: UserPlan = {
  plan: 'free',
  cycle: null,
  activatedAt: null,
  expiresAt: null,
  lemonSqueezySubscriptionId: null,
  lemonSqueezyOrderId: null,
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
  const [userPlan, setUserPlan] = useState<UserPlan>(DEFAULT_PLAN)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const saved = getLS<UserPlan>(LS_KEY_PLAN, DEFAULT_PLAN)
    setUserPlan(saved)
    setLoaded(true)
  }, [])

  const savePlan = useCallback((plan: UserPlan) => {
    setUserPlan(plan)
    setLS(LS_KEY_PLAN, plan)
  }, [])

  const activatePro = useCallback((cycle: BillingCycle, subscriptionId?: string, orderId?: string) => {
    const now = new Date()
    let expiresAt: Date | null = null

    if (cycle === 'monthly') {
      expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    } else if (cycle === 'annual') {
      expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)
    }
    // lifetime has no expiry

    const newPlan: UserPlan = {
      plan: 'pro',
      cycle,
      activatedAt: now.toISOString(),
      expiresAt: expiresAt?.toISOString() || null,
      lemonSqueezySubscriptionId: subscriptionId || null,
      lemonSqueezyOrderId: orderId || null,
    }
    savePlan(newPlan)
    return newPlan
  }, [savePlan])

  const isPro = userPlan.plan === 'pro'
  const isExpired = userPlan.expiresAt ? new Date(userPlan.expiresAt) < new Date() : false
  const activePlan: PlanType = isPro && !isExpired ? 'pro' : 'free'

  const canScheduleMore = useCallback((currentCount: number) => {
    if (activePlan === 'pro') return true
    return currentCount < PLANS.free.schedulesLimit
  }, [activePlan])

  const getSchedulesRemaining = useCallback((currentCount: number) => {
    if (activePlan === 'pro') return Infinity
    return Math.max(0, PLANS.free.schedulesLimit - currentCount)
  }, [activePlan])

  const getPlanLabel = useCallback(() => {
    if (activePlan === 'pro') {
      const cycleLabel = userPlan.cycle === 'monthly' ? 'Monthly' : userPlan.cycle === 'annual' ? 'Annual' : 'Lifetime'
      return `Pro (${cycleLabel})`
    }
    return 'Free'
  }, [activePlan, userPlan.cycle])

  const getDaysRemaining = useCallback(() => {
    if (!userPlan.expiresAt) return userPlan.plan === 'pro' ? Infinity : 0
    const diff = new Date(userPlan.expiresAt).getTime() - Date.now()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }, [userPlan.expiresAt, userPlan.plan])

  return {
    userPlan,
    loaded,
    isPro: activePlan === 'pro',
    activePlan,
    activatePro,
    savePlan,
    canScheduleMore,
    getSchedulesRemaining,
    getPlanLabel,
    getDaysRemaining,
    planConfig: PLANS[activePlan],
  }
}
