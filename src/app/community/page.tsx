'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart3, TrendingUp, Handshake, Briefcase, Building2, Gift, Users,
  ChevronRight, Star, ArrowUpDown, ExternalLink, Trophy, Filter
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Header from '@/components/Header'
import { fallbackCommunityBoards } from '@/lib/fallback-data'

function CommunityContent() {
  const searchParams = useSearchParams()
  const activeBoardId = searchParams.get('type') || 'weekly-board'
  const [sortBy, setSortBy] = useState<'newest' | 'popular'>('popular')

  const activeBoard = fallbackCommunityBoards.find(b => b.id === activeBoardId) || fallbackCommunityBoards[1]
  const sortedItems = [...activeBoard.items].sort((a, b) => {
    if (sortBy === 'popular') return b.upvotes - a.upvotes
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <Header />

      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">Community</h1>
            <p className="text-sm text-gray-400">
              Connect, compete, and grow with the Revolaunch community.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Board Navigation */}
            <div className="lg:w-[220px] shrink-0">
              <div className="lg:sticky lg:top-[72px] space-y-1">
                {fallbackCommunityBoards.map((board) => {
                  const isActive = board.id === activeBoardId
                  return (
                    <Link
                      key={board.id}
                      href={`/community?type=${board.id}`}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all ${
                        isActive
                          ? 'bg-white/[0.06] text-white font-medium'
                          : 'text-gray-400 hover:text-white hover:bg-white/[0.03]'
                      }`}
                    >
                      <span className="text-base">{board.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="truncate">{board.name}</p>
                      </div>
                      <span className="text-[10px] text-gray-600 font-medium tabular-nums">
                        {board.itemCount > 999 ? `${(board.itemCount / 1000).toFixed(1)}K` : board.itemCount}
                      </span>
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Board Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{activeBoard.icon}</span>
                  <div>
                    <h2 className="text-lg font-semibold text-white">{activeBoard.name}</h2>
                    <p className="text-xs text-gray-500">{activeBoard.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSortBy(sortBy === 'popular' ? 'newest' : 'popular')}
                    className="h-8 text-xs text-gray-400 hover:text-white"
                  >
                    <ArrowUpDown className="w-3 h-3 mr-1" />
                    {sortBy === 'popular' ? 'Most Stars' : 'Newest'}
                  </Button>
                </div>
              </div>

              {sortedItems.length === 0 ? (
                <div className="rounded-xl border border-white/[0.06] bg-[#0a0a0a] p-12 text-center">
                  <span className="text-3xl mb-3 block">{activeBoard.icon}</span>
                  <h3 className="text-sm font-medium text-white mb-1">No posts yet</h3>
                  <p className="text-xs text-gray-500 mb-4">Be the first to post in {activeBoard.name}</p>
                  <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white text-xs h-8 rounded-lg">
                    Create Post
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence>
                    {sortedItems.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="rounded-xl border border-white/[0.06] bg-[#0a0a0a] hover:border-white/[0.1] transition-all p-4"
                      >
                        <div className="flex gap-4">
                          <div className="flex flex-col items-center gap-0.5 shrink-0 pt-1">
                            <button className="text-gray-500 hover:text-blue-400 transition-colors">
                              <Star className="w-4 h-4" />
                            </button>
                            <span className="text-sm font-bold text-white tabular-nums">{item.upvotes}</span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-white mb-1">{item.title}</h3>
                            <p className="text-xs text-gray-500 line-clamp-2 mb-2">{item.description}</p>
                            <div className="flex flex-wrap items-center gap-2">
                              {item.tags.map(tag => (
                                <Badge
                                  key={tag}
                                  variant="secondary"
                                  className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] text-gray-400 border border-white/[0.06] h-5"
                                >
                                  {tag}
                                </Badge>
                              ))}
                              {item.startup && (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20 h-5"
                                >
                                  {item.startup}
                                </Badge>
                              )}
                              <span className="text-[10px] text-gray-600 ml-auto">
                                by {item.author}
                              </span>
                            </div>
                          </div>

                          {item.mrr && (
                            <div className="shrink-0 text-right">
                              <span className="text-xs font-bold text-green-400">
                                ${(item.mrr / 1000).toFixed(0)}K
                              </span>
                              <p className="text-[10px] text-gray-600">MRR</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function CommunityPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    }>
      <CommunityContent />
    </Suspense>
  )
}
