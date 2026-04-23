'use client'

import { motion } from 'framer-motion'
import { Star, Trophy } from 'lucide-react'
import type { Startup } from '@/lib/fallback-data'
import { getCategoryIcon, getCategoryColor } from '@/lib/fallback-data'

interface WeeklyLeaderboardProps {
  winners: (Startup & { rank: number; medal: string; points: number })[]
}

export default function WeeklyLeaderboard({ winners }: WeeklyLeaderboardProps) {
  const medals: Record<string, { emoji: string; color: string; glow: string }> = {
    gold: { emoji: '🥇', color: 'text-yellow-500', glow: 'shadow-yellow-500/20' },
    silver: { emoji: '🥈', color: 'text-gray-400', glow: 'shadow-gray-400/20' },
    bronze: { emoji: '🥉', color: 'text-orange-500', glow: 'shadow-orange-600/20' },
  }

  return (
    <div className="rounded-xl border subtle-border surface overflow-hidden">
      <div className="p-4 border-b subtle-border">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-500" />
          <h2 className="text-sm font-semibold text-foreground">LAST WEEK</h2>
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5">Top ranked startups by community votes</p>
      </div>
      <div className="divide-y divide-border">
        {winners.map((winner, index) => {
          const medal = medals[winner.medal]
          const logoColor = winner.logoColor || '#3B82F6'
          const initial = winner.name.charAt(0).toUpperCase()

          return (
            <motion.div
              key={winner.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-3 surface-hover transition-colors ${index === 0 ? 'bg-yellow-500/[0.03]' : ''}`}
            >
              <div className="flex items-start gap-3">
                {/* Medal */}
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0 ${
                  index === 0 ? 'bg-yellow-500/20 shadow-lg ' + medal.glow : 'bg-muted'
                }`}>
                  {medal.emoji}
                </div>

                {/* Logo */}
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: logoColor + '22' }}
                >
                  <span className="text-xs font-bold" style={{ color: logoColor }}>
                    {initial}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground truncate">
                    {winner.name}
                  </h3>
                  <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                    {winner.tagline}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className={`inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-full font-medium ${getCategoryColor(winner.category)}`}>
                      {getCategoryIcon(winner.category)} {winner.category}
                    </span>
                    {winner.country && (
                      <span className="text-[10px] text-muted-foreground">
                        {winner.country.length > 12 ? winner.country.split(' ')[0] : winner.country}
                      </span>
                    )}
                  </div>
                </div>

                {/* Points */}
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star className="w-3 h-3 fill-amber-500" />
                    <span className="text-sm font-bold tabular-nums">{winner.points}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">points</span>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      <div className="p-3 border-t subtle-border">
        <a
          href="/community?type=weekly-board"
          className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-blue-500 transition-colors"
        >
          <Trophy className="w-3 h-3" />
          View full leaderboard
        </a>
      </div>
    </div>
  )
}
