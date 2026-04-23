'use client'

import { motion } from 'framer-motion'
import { Star, MessageSquare, ExternalLink, Trophy, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { Startup } from '@/lib/fallback-data'
import { getCategoryIcon, getCategoryColor, getStageColor } from '@/lib/fallback-data'
import StartupLogo from '@/components/StartupLogo'

interface StartupCardProps {
  startup: Startup
  rank?: number
  onVote?: (slug: string) => void
  isVoted?: boolean
  compact?: boolean
}

export default function StartupCard({ startup, rank, onVote, isVoted, compact }: StartupCardProps) {

  const medals: Record<number, { emoji: string; bg: string }> = {
    1: { emoji: '🥇', bg: 'bg-yellow-500/20' },
    2: { emoji: '🥈', bg: 'bg-gray-400/20' },
    3: { emoji: '🥉', bg: 'bg-orange-700/20' },
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="group rounded-xl border subtle-border surface hover:border-orange-500/30 transition-all duration-200 overflow-hidden"
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Medal / Vote */}
          <div className="flex flex-col items-center gap-1 shrink-0">
            {rank && medals[rank] ? (
              <div className={`w-10 h-10 rounded-xl ${medals[rank].bg} flex items-center justify-center text-lg`}>
                {medals[rank].emoji}
              </div>
            ) : onVote ? (
              <button
                onClick={() => onVote(startup.slug)}
                className={`flex flex-col items-center gap-0.5 transition-all duration-200 ${
                  isVoted ? 'text-orange-500' : 'text-muted-foreground hover:text-orange-500'
                }`}
              >
                <Star className={`w-5 h-5 ${isVoted ? 'fill-orange-500' : ''}`} />
                <span className="text-xs font-semibold tabular-nums">{startup.upvotes}</span>
              </button>
            ) : (
              <button
                onClick={() => onVote?.(startup.slug)}
                className="flex flex-col items-center gap-0.5 text-muted-foreground hover:text-orange-500 transition-colors"
              >
                <Star className="w-5 h-5" />
                <span className="text-xs font-semibold tabular-nums">{startup.upvotes}</span>
              </button>
            )}
          </div>

          {/* Logo */}
          <StartupLogo
            name={startup.name}
            logo={startup.logo}
            website={startup.website}
            logoColor={startup.logoColor}
            size="md"
          />

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm text-foreground truncate group-hover:text-orange-500 transition-colors">
                {startup.name}
              </h3>
              {startup.featured && (
                <Sparkles className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
              )}
            </div>
            {!compact && (
              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                {startup.tagline}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className={`inline-flex items-center text-[10px] px-2 py-0.5 rounded-full font-medium ${getCategoryColor(startup.category)}`}>
                {getCategoryIcon(startup.category)} {startup.category}
              </span>
              {startup.country && (
                <span className="inline-flex items-center text-[10px] text-muted-foreground gap-0.5">
                  {startup.country.length > 12 ? startup.country.split(' ')[0] : startup.country}
                </span>
              )}
            </div>
          </div>

          {/* Right meta */}
          {!compact && (
            <div className="flex flex-col items-end gap-1 shrink-0">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="w-3 h-3" />
                <span className="tabular-nums font-medium">{startup.upvotes}</span>
              </div>
              {startup.weeklyPoints && (
                <span className="text-[10px] text-amber-500 font-medium">{startup.weeklyPoints} pts</span>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export function StartupCardFull({ startup }: { startup: Startup }) {

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="group rounded-xl border subtle-border surface hover:border-orange-500/30 transition-all duration-200 overflow-hidden"
    >
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Logo */}
          <StartupLogo
            name={startup.name}
            logo={startup.logo}
            website={startup.website}
            logoColor={startup.logoColor}
            size="lg"
          />

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-foreground truncate group-hover:text-orange-500 transition-colors">
                {startup.name}
              </h3>
              {startup.featured && (
                <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {startup.tagline}
            </p>
            <div className="flex flex-wrap items-center gap-1.5 mt-3">
              <span className={`inline-flex items-center text-xs px-2.5 py-0.5 rounded-full font-medium ${getCategoryColor(startup.category)}`}>
                {getCategoryIcon(startup.category)} {startup.category}
              </span>
              <span className={`inline-flex items-center text-xs px-2.5 py-0.5 rounded-full font-medium ${getStageColor(startup.stage)}`}>
                {startup.stage}
              </span>
              {startup.country && (
                <span className="inline-flex items-center text-xs text-muted-foreground gap-1">
                  {startup.country}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="w-3 h-3 text-amber-500" />
                <span className="tabular-nums font-medium">{startup.upvotes}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MessageSquare className="w-3 h-3" />
                <span className="tabular-nums font-medium">{Math.floor(startup.upvotes * 0.3)}</span>
              </div>
              {startup._count?.perks && startup._count.perks > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 font-medium">
                  {startup._count.perks} perk{startup._count.perks > 1 ? 's' : ''}
                </span>
              )}
              <a
                href={startup.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-orange-500 transition-colors ml-auto"
              >
                Visit <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
