'use client'

import { motion } from 'framer-motion'
import { UserPlus, UserMinus, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FollowButtonProps {
  isFollowing: boolean
  followerCount: number
  onToggle: () => void
  size?: 'sm' | 'md'
  showCount?: boolean
  className?: string
}

/**
 * Reusable Follow/Unfollow button for startup founder profiles.
 * Shows follower count and toggles between follow/unfollow states.
 */
export default function FollowButton({
  isFollowing,
  followerCount,
  onToggle,
  size = 'sm',
  showCount = true,
  className,
}: FollowButtonProps) {
  const formatCount = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
    return String(n)
  }

  if (size === 'sm') {
    return (
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={(e) => { e.stopPropagation(); onToggle() }}
        className={cn(
          'inline-flex items-center gap-1 text-[10px] font-medium rounded-full px-2 py-0.5 transition-all duration-200',
          isFollowing
            ? 'bg-orange-500/15 text-orange-600 dark:text-orange-300 border border-orange-500/25 hover:bg-orange-500/25'
            : 'bg-muted text-muted-foreground hover:bg-orange-500/10 hover:text-orange-500 border border-transparent',
          className
        )}
      >
        {isFollowing ? (
          <>
            <UserMinus className="w-3 h-3" />
            Following
          </>
        ) : (
          <>
            <UserPlus className="w-3 h-3" />
            Follow
          </>
        )}
        {showCount && (
          <span className="text-[9px] opacity-70">{formatCount(followerCount)}</span>
        )}
      </motion.button>
    )
  }

  // md size
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={(e) => { e.stopPropagation(); onToggle() }}
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-medium rounded-lg px-3 py-1.5 transition-all duration-200',
        isFollowing
          ? 'bg-orange-500/15 text-orange-600 dark:text-orange-300 border border-orange-500/25 hover:bg-orange-500/25'
          : 'bg-orange-500 text-white hover:bg-orange-600 shadow-sm',
        className
      )}
    >
      {isFollowing ? (
        <>
          <UserMinus className="w-3.5 h-3.5" />
          Following
        </>
      ) : (
        <>
          <UserPlus className="w-3.5 h-3.5" />
          Follow
        </>
      )}
      {showCount && (
        <span className={cn('flex items-center gap-0.5 text-[10px]', isFollowing ? 'opacity-70' : 'text-white/80')}>
          <Users className="w-3 h-3" />
          {formatCount(followerCount)}
        </span>
      )}
    </motion.button>
  )
}
