'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowUpDown, Star, Plus, X, Loader2, Briefcase, ChevronRight,
  TrendingUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { fallbackCommunityBoards, type CommunityBoard } from '@/lib/fallback-data'
import { toast } from 'sonner'

// Types matching API response
interface ApiBoard {
  id: string
  name: string
  description: string
  icon: string
  itemCount: number
}

interface ApiPost {
  id: string
  title: string
  description: string
  author: string
  createdAt: string
  upvotes: number
  tags: string[]
  startup?: string
  mrr?: number
}

function getSessionId(): string {
  if (typeof window === 'undefined') return 'anonymous'
  let id = localStorage.getItem('community-session-id')
  if (!id) {
    id = 'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36)
    localStorage.setItem('community-session-id', id)
  }
  return id
}

function formatMrr(mrrCents: number | undefined): string {
  if (!mrrCents) return ''
  const dollars = mrrCents / 100
  if (dollars >= 1_000_000) return `$${(dollars / 1_000_000).toFixed(1)}M`
  if (dollars >= 1_000) return `$${(dollars / 1_000).toFixed(0)}K`
  return `$${dollars.toFixed(0)}`
}

function CommunityContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const activeBoardId = searchParams.get('type') || 'weekly-board'
  const [sortBy, setSortBy] = useState<'newest' | 'popular'>('popular')

  // Data state
  const [boards, setBoards] = useState<ApiBoard[]>([])
  const [posts, setPosts] = useState<ApiPost[]>([])
  const [loading, setLoading] = useState(true)
  const [useFallback, setUseFallback] = useState(false)

  // Create post state
  const [createOpen, setCreateOpen] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [formTitle, setFormTitle] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formAuthor, setFormAuthor] = useState('')
  const [formStartup, setFormStartup] = useState('')
  const [formTags, setFormTags] = useState('')
  const [formMrr, setFormMrr] = useState('')

  // Upvote tracking
  const [upvoteLoading, setUpvoteLoading] = useState<Set<string>>(new Set())

  // Fetch boards
  const fetchBoards = useCallback(async () => {
    try {
      const res = await fetch('/api/community/boards')
      if (!res.ok) throw new Error('Failed to fetch boards')
      const data = await res.json()
      if (data.boards && data.boards.length > 0) {
        setBoards(data.boards)
        setUseFallback(false)
      } else {
        // Use fallback
        setBoards(fallbackCommunityBoards.map((b: CommunityBoard) => ({
          id: b.id,
          name: b.name,
          description: b.description,
          icon: b.icon,
          itemCount: b.itemCount,
        })))
        setUseFallback(true)
      }
    } catch {
      setBoards(fallbackCommunityBoards.map((b: CommunityBoard) => ({
        id: b.id,
        name: b.name,
        description: b.description,
        icon: b.icon,
        itemCount: b.itemCount,
      })))
      setUseFallback(true)
    }
  }, [])

  // Fetch posts
  const fetchPosts = useCallback(async (board: string, sort: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ board, sort, page: '1', limit: '50' })
      const res = await fetch(`/api/community/posts?${params}`)
      if (!res.ok) throw new Error('Failed to fetch posts')
      const data = await res.json()
      if (data.posts) {
        setPosts(data.posts)
        setUseFallback(false)
      } else {
        const fbBoard = fallbackCommunityBoards.find((b) => b.id === board) || fallbackCommunityBoards[0]
        setPosts(fbBoard.items.map((item) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          author: item.author,
          createdAt: item.createdAt,
          upvotes: item.upvotes,
          tags: item.tags,
          startup: item.startup,
          mrr: item.mrr,
        })))
        setUseFallback(true)
      }
    } catch {
      const fbBoard = fallbackCommunityBoards.find((b) => b.id === activeBoardId) || fallbackCommunityBoards[0]
      setPosts(fbBoard.items.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        author: item.author,
        createdAt: item.createdAt,
        upvotes: item.upvotes,
        tags: item.tags,
        startup: item.startup,
        mrr: item.mrr,
      })))
      setUseFallback(true)
    } finally {
      setLoading(false)
    }
  }, [activeBoardId])

  useEffect(() => {
    fetchBoards()
  }, [fetchBoards])

  useEffect(() => {
    fetchPosts(activeBoardId, sortBy)
  }, [activeBoardId, sortBy, fetchPosts])

  // Active board info
  const activeBoard = boards.find((b) => b.id === activeBoardId) || boards[0]

  // Sort posts client-side for fallback data
  const sortedItems = useFallback
    ? [...posts].sort((a, b) => {
        if (sortBy === 'popular') return b.upvotes - a.upvotes
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
    : posts

  // Upvote handler
  const handleUpvote = async (postId: string) => {
    if (upvoteLoading.has(postId)) return
    setUpvoteLoading((prev) => new Set(prev).add(postId))

    try {
      const sessionId = getSessionId()
      const res = await fetch(`/api/community/posts/${postId}/upvote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
        },
      })

      if (res.ok) {
        const data = await res.json()
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, upvotes: data.upvotes } : p
          )
        )
      } else {
        toast.error('Failed to upvote')
      }
    } catch {
      toast.error('Failed to upvote')
    } finally {
      setUpvoteLoading((prev) => {
        const next = new Set(prev)
        next.delete(postId)
        return next
      })
    }
  }

  // Create post handler
  const handleCreatePost = async () => {
    if (!formTitle.trim() || !formDescription.trim() || !formAuthor.trim()) {
      toast.error('Title, description, and author are required')
      return
    }

    setCreateLoading(true)
    try {
      const tags = formTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
      const mrrValue = formMrr ? parseFloat(formMrr) : undefined

      const res = await fetch('/api/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle.trim(),
          description: formDescription.trim(),
          boardId: activeBoardId,
          author: formAuthor.trim(),
          startupName: formStartup.trim() || undefined,
          tags,
          mrr: mrrValue,
        }),
      })

      if (res.ok) {
        toast.success('Post created successfully!')
        setCreateOpen(false)
        // Reset form
        setFormTitle('')
        setFormDescription('')
        setFormAuthor('')
        setFormStartup('')
        setFormTags('')
        setFormMrr('')
        // Refresh posts
        fetchPosts(activeBoardId, sortBy)
        fetchBoards()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to create post')
      }
    } catch {
      toast.error('Failed to create post')
    } finally {
      setCreateLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">Community</h1>
            <p className="text-sm text-muted-foreground">
              Connect, compete, and grow with the Revolaunch community.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Board Navigation */}
            <div className="lg:w-[220px] shrink-0">
              <div className="lg:sticky lg:top-[72px] space-y-1">
                {boards.map((board) => {
                  const isActive = board.id === activeBoardId
                  return (
                    <Link
                      key={board.id}
                      href={`/community?type=${board.id}`}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all ${
                        isActive
                          ? 'bg-muted text-foreground font-medium'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      <span className="text-base">{board.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="truncate">{board.name}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-medium tabular-nums">
                        {board.itemCount > 999 ? `${(board.itemCount / 1000).toFixed(1)}K` : board.itemCount}
                      </span>
                    </Link>
                  )
                })}
                {/* Job Board Link */}
                <div className="pt-2 border-t subtle-border mt-2">
                  <Link
                    href="/jobs"
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all text-orange-500 hover:text-orange-600 hover:bg-orange-500/5"
                  >
                    <Briefcase className="w-4 h-4" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium">Job Board</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Board Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{activeBoard?.icon || '📋'}</span>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">{activeBoard?.name || 'Community Board'}</h2>
                    <p className="text-xs text-muted-foreground">{activeBoard?.description || ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSortBy(sortBy === 'popular' ? 'newest' : 'popular')}
                    className="h-8 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <ArrowUpDown className="w-3 h-3 mr-1" />
                    {sortBy === 'popular' ? 'Most Stars' : 'Newest'}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setCreateOpen(true)}
                    className="h-8 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Create Post
                  </Button>
                </div>
              </div>

              {/* Investor Network Callout - shown when Raising Capital board is active */}
              {activeBoardId === 'raising-capital' && (
                <div className="mb-4 rounded-xl border border-orange-500/20 bg-orange-500/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                        <Briefcase className="w-4 h-4 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-foreground">Looking for investors?</p>
                        <p className="text-[10px] text-muted-foreground">Browse our curated Investor Network to find the right match.</p>
                      </div>
                    </div>
                    <Link href="/investors">
                      <Button variant="ghost" size="sm" className="h-7 text-[10px] text-orange-500 hover:text-orange-600 hover:bg-orange-500/10 px-2">
                        Investor Network
                        <ChevronRight className="w-3 h-3 ml-0.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              )}

              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : sortedItems.length === 0 ? (
                <div className="rounded-xl border subtle-border surface p-12 text-center">
                  <span className="text-3xl mb-3 block">{activeBoard?.icon || '📋'}</span>
                  <h3 className="text-sm font-medium text-foreground mb-1">No posts yet</h3>
                  <p className="text-xs text-muted-foreground mb-4">Be the first to post in {activeBoard?.name || 'this board'}</p>
                  <Button
                    size="sm"
                    onClick={() => setCreateOpen(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white text-xs h-8 rounded-lg"
                  >
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
                        className="rounded-xl border subtle-border surface hover:border-blue-500/30 transition-all p-4"
                      >
                        <div className="flex gap-4">
                          <div className="flex flex-col items-center gap-0.5 shrink-0 pt-1">
                            <button
                              onClick={() => handleUpvote(item.id)}
                              disabled={upvoteLoading.has(item.id)}
                              className="text-muted-foreground hover:text-blue-500 transition-colors disabled:opacity-50"
                            >
                              {upvoteLoading.has(item.id) ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Star className="w-4 h-4" />
                              )}
                            </button>
                            <span className="text-sm font-bold text-foreground tabular-nums">{item.upvotes}</span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-foreground mb-1">{item.title}</h3>
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{item.description}</p>
                            <div className="flex flex-wrap items-center gap-2">
                              {item.tags.map(tag => (
                                <Badge
                                  key={tag}
                                  variant="secondary"
                                  className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border h-5"
                                >
                                  {tag}
                                </Badge>
                              ))}
                              {item.startup && (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-300 border border-blue-500/20 h-5"
                                >
                                  {item.startup}
                                </Badge>
                              )}
                              <span className="text-[10px] text-muted-foreground ml-auto">
                                by {item.author}
                              </span>
                            </div>
                          </div>

                          {item.mrr != null && item.mrr > 0 && (
                            <div className="shrink-0 text-right">
                              <span className="text-xs font-bold text-green-500">
                                {formatMrr(item.mrr)}
                              </span>
                              <p className="text-[10px] text-muted-foreground">MRR</p>
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

      <Footer />

      {/* Create Post Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create a Post</DialogTitle>
            <DialogDescription>
              Share something with the {activeBoard?.name || 'community'} board.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Title <span className="text-red-500">*</span></label>
              <Input
                placeholder="e.g., My startup just hit $10K MRR!"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                maxLength={200}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Description <span className="text-red-500">*</span></label>
              <Textarea
                placeholder="Tell the community what happened..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={4}
                maxLength={2000}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Author Name <span className="text-red-500">*</span></label>
              <Input
                placeholder="Your name"
                value={formAuthor}
                onChange={(e) => setFormAuthor(e.target.value)}
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Startup Name</label>
              <Input
                placeholder="Your startup name (optional)"
                value={formStartup}
                onChange={(e) => setFormStartup(e.target.value)}
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">MRR ($)</label>
              <Input
                placeholder="e.g., 10000"
                value={formMrr}
                onChange={(e) => setFormMrr(e.target.value)}
                type="number"
                min="0"
              />
              <p className="text-[10px] text-muted-foreground">Monthly recurring revenue in USD</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Tags</label>
              <Input
                placeholder="e.g., AI, SaaS, Milestone (comma-separated)"
                value={formTags}
                onChange={(e) => setFormTags(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCreateOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleCreatePost}
                disabled={createLoading || !formTitle.trim() || !formDescription.trim() || !formAuthor.trim()}
                className="bg-blue-500 hover:bg-blue-600 text-white text-xs rounded-lg"
              >
                {createLoading ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Posting...
                  </>
                ) : (
                  'Create Post'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function CommunityPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    }>
      <CommunityContent />
    </Suspense>
  )
}
