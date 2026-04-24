'use client'

import { useState, useEffect, useCallback } from 'react'

// ─── Types ───
export interface FollowingState {
  /** Set of startup IDs the current user is following */
  followedIds: string[]
  /** Follower count map: startupId → count (simulated) */
  followerCounts: Record<string, number>
  /** Activity feed from followed founders */
  activityFeed: FollowingActivity[]
}

export interface FollowingActivity {
  id: string
  startupId: string
  startupName: string
  startupLogo: string | null
  startupWebsite: string
  startupLogoColor?: string
  type: 'launch' | 'update' | 'milestone' | 'perk' | 'funding'
  message: string
  timestamp: string
}

// ─── Simulated follower counts (base counts for popular startups) ───
const BASE_FOLLOWER_COUNTS: Record<string, number> = {
  'ph-1': 2340, 'ph-2': 1876, 'ph-3': 1543, 'ph-4': 892, 'ph-5': 721,
  'ph-6': 534, 'ph-7': 467, 'ph-8': 389, 'ph-9': 312, 'ph-10': 1654,
  'ph-11': 245, 'ph-12': 423, 'ph-13': 578, 'ph-14': 334, 'ph-15': 198,
  'ph-16': 3201, 'ph-17': 2109, 'ph-18': 1890, 'ph-19': 1456, 'ph-20': 1323,
  'ph-21': 1123, 'ph-22': 567, 'ph-23': 1432, 'ph-24': 678, 'ph-25': 890,
  'ph-26': 432, 'ph-27': 356, 'ph-28': 289, 'ph-29': 198, 'ph-30': 567,
  'ph-31': 234, 'ph-32': 1789, 'ph-33': 2345, 'ph-34': 1567, 'ph-35': 1890,
  'ph-36': 2100,
}

// ─── Simulated activity feed entries ───
const SIMULATED_ACTIVITIES: Omit<FollowingActivity, 'id' | 'timestamp'>[] = [
  { startupId: 'ph-1', startupName: 'MGX (Now Atoms)', startupLogo: 'https://logo.clearbit.com/atoms.dev', startupWebsite: 'https://atoms.dev', startupLogoColor: '#4F46E5', type: 'milestone', message: 'Reached 10K users milestone this week!' },
  { startupId: 'ph-16', startupName: 'Cursor', startupLogo: 'https://logo.clearbit.com/cursor.com', startupWebsite: 'https://cursor.com', startupLogoColor: '#000000', type: 'update', message: 'Released new AI code completion engine v2.0' },
  { startupId: 'ph-17', startupName: 'Bolt.new', startupLogo: 'https://logo.clearbit.com/bolt.new', startupWebsite: 'https://bolt.new', startupLogoColor: '#F97316', type: 'launch', message: 'Launched real-time collaboration feature' },
  { startupId: 'ph-18', startupName: 'Lovable', startupLogo: 'https://logo.clearbit.com/lovable.dev', startupWebsite: 'https://lovable.dev', startupLogoColor: '#EC4899', type: 'funding', message: 'Announced Series A raise of $25M' },
  { startupId: 'ph-19', startupName: 'v0 by Vercel', startupLogo: 'https://logo.clearbit.com/v0.dev', startupWebsite: 'https://v0.dev', startupLogoColor: '#000000', type: 'update', message: 'New component library with 50+ templates' },
  { startupId: 'ph-2', startupName: 'Sider 5.0', startupLogo: 'https://logo.clearbit.com/sider.ai', startupWebsite: 'https://sider.ai', startupLogoColor: '#2563EB', type: 'perk', message: 'Exclusive 3-month Pro plan for Revolaunch users' },
  { startupId: 'ph-36', startupName: 'Stripe', startupLogo: 'https://logo.clearbit.com/stripe.com', startupWebsite: 'https://stripe.com', startupLogoColor: '#635BFF', type: 'update', message: 'New payment analytics dashboard is live' },
  { startupId: 'ph-23', startupName: 'Supabase', startupLogo: 'https://logo.clearbit.com/supabase.com', startupWebsite: 'https://supabase.com', startupLogoColor: '#3ECF8E', type: 'milestone', message: '1 million database projects created on Supabase' },
]

const LS_KEY_FOLLOWS = 'revolaunch_following'
const LS_KEY_FOLLOWER_COUNTS = 'revolaunch_follower_counts'

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

/**
 * Hook to manage "Follow Founder" state across the app.
 * Persisted to localStorage.
 */
export function useFollowing() {
  const [followedIds, setFollowedIds] = useState<string[]>([])
  const [followerCounts, setFollowerCounts] = useState<Record<string, number>>({})
  const [loaded, setLoaded] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    const saved = getLS<string[]>(LS_KEY_FOLLOWS, [])
    const savedCounts = getLS<Record<string, number>>(LS_KEY_FOLLOWER_COUNTS, {})
    setFollowedIds(saved)
    setFollowerCounts(savedCounts)
    setLoaded(true)
  }, [])

  // Persist follows
  const saveFollows = useCallback((ids: string[]) => {
    setFollowedIds(ids)
    setLS(LS_KEY_FOLLOWS, ids)
  }, [])

  // Persist follower counts
  const saveCounts = useCallback((counts: Record<string, number>) => {
    setFollowerCounts(counts)
    setLS(LS_KEY_FOLLOWER_COUNTS, counts)
  }, [])

  /** Check if a startup is followed */
  const isFollowing = useCallback((startupId: string) => {
    return followedIds.includes(startupId)
  }, [followedIds])

  /** Toggle follow/unfollow for a startup */
  const toggleFollow = useCallback((startupId: string) => {
    setFollowedIds(prev => {
      const next = prev.includes(startupId)
        ? prev.filter(id => id !== startupId)
        : [...prev, startupId]
      setLS(LS_KEY_FOLLOWS, next)

      // Update follower count
      const base = BASE_FOLLOWER_COUNTS[startupId] || Math.floor(Math.random() * 500) + 100
      setFollowerCounts(prevCounts => {
        const current = prevCounts[startupId] || base
        const updated = { ...prevCounts, [startupId]: current + (next.includes(startupId) ? 1 : -1) }
        setLS(LS_KEY_FOLLOWER_COUNTS, updated)
        return updated
      })

      return next
    })
  }, [])

  /** Get the follower count for a startup (base + localStorage delta) */
  const getFollowerCount = useCallback((startupId: string) => {
    const base = BASE_FOLLOWER_COUNTS[startupId] || Math.floor(Math.random() * 500) + 100
    return followerCounts[startupId] || base
  }, [followerCounts])

  /** Get formatted follower count (e.g., "1.2K") */
  const getFormattedFollowerCount = useCallback((startupId: string) => {
    const count = getFollowerCount(startupId)
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
    return String(count)
  }, [getFollowerCount])

  /** Get activity feed filtered to only followed founders */
  const getActivityFeed = useCallback((): FollowingActivity[] => {
    if (followedIds.length === 0) return []
    // Create timestamped activities
    const now = Date.now()
    return SIMULATED_ACTIVITIES
      .filter(a => followedIds.includes(a.startupId))
      .map((a, i) => ({
        ...a,
        id: `fa-${a.startupId}-${i}`,
        timestamp: new Date(now - i * 3600000 * (2 + Math.floor(Math.random() * 12))).toISOString(),
      }))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }, [followedIds])

  /** Get followed startup details */
  const getFollowedStartups = useCallback((allStartups: any[]) => {
    return allStartups.filter(s => followedIds.includes(s.id))
  }, [followedIds])

  return {
    followedIds,
    followerCounts,
    loaded,
    isFollowing,
    toggleFollow,
    getFollowerCount,
    getFormattedFollowerCount,
    getActivityFeed,
    getFollowedStartups,
    saveFollows,
  }
}
