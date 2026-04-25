'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Code2,
  Copy,
  Check,
  Globe,
  Monitor,
  Moon,
  Sun,
  SlidersHorizontal,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const SITE_URL = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_SITE_URL || 'revolaunch.net')
  : 'revolaunch.net'

const CATEGORIES = [
  'All', 'SaaS', 'AI', 'Developer Tools', 'Fintech', 'Healthcare',
  'E-Commerce', 'Productivity', 'Security', 'Education',
]

function IframeEmbed({ slug, theme }: { slug: string; theme: string }) {
  const [startup, setStartup] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/startups/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.startup) setStartup(data.startup)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: theme === 'dark' ? '#0a0a0a' : '#ffffff',
      }}>
        <div style={{ color: theme === 'dark' ? '#a3a3a3' : '#737373', fontSize: 13 }}>Loading...</div>
      </div>
    )
  }

  if (!startup) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: theme === 'dark' ? '#0a0a0a' : '#ffffff',
      }}>
        <div style={{ color: theme === 'dark' ? '#a3a3a3' : '#737373', fontSize: 13 }}>Startup not found</div>
      </div>
    )
  }

  const isDark = theme === 'dark'
  const bg = isDark ? '#0a0a0a' : '#ffffff'
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'
  const text = isDark ? '#f5f5f5' : '#171717'
  const sub = isDark ? '#a3a3a3' : '#737373'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: bg, padding: 16,
    }}>
      <a
        href={`/startup/${startup.slug}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          textDecoration: 'none', display: 'block', maxWidth: 480, width: '100%',
          borderRadius: 16, overflow: 'hidden', border: `1px solid ${border}`,
          background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
        }}
      >
        <div style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 14, background: '#f9731618',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 700, color: '#f97316', flexShrink: 0,
            }}>
              {startup.name.split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: text }}>{startup.name}</span>
                {startup.badgeVerified && <span style={{ color: '#22c55e', fontSize: 11, fontWeight: 600 }}>✓</span>}
              </div>
              <p style={{
                fontSize: 13, color: sub, marginTop: 3, lineHeight: 1.5,
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>
                {startup.tagline}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                <span style={{ fontSize: 12, color: '#f97316', fontWeight: 600 }}>★ {startup.upvotes}</span>
                <span style={{
                  fontSize: 11, color: sub, padding: '2px 10px', borderRadius: 20,
                  background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                }}>
                  {startup.category}
                </span>
              </div>
            </div>
          </div>
          {startup.description && (
            <p style={{
              fontSize: 13, color: sub, lineHeight: 1.6, marginTop: 14,
              display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {startup.description}
            </p>
          )}
          <div style={{
            marginTop: 14, paddingTop: 12, borderTop: `1px solid ${border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <a href={`/startup/${startup.slug}`} target="_blank" rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{ fontSize: 12, fontWeight: 600, color: '#f97316', textDecoration: 'none' }}>
              View on Revolaunch →
            </a>
            <span style={{ fontSize: 11, color: sub }}>
              powered by <span style={{ fontWeight: 700, color: '#f97316' }}>Revolaunch</span>
            </span>
          </div>
        </div>
      </a>
    </div>
  )
}

/* ─── Code block with copy button ─── */

function CodeBlock({
  code, language, copied, onCopy,
}: {
  code: string; language: string; copied: boolean; onCopy: () => void
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/30">
        <span className="text-xs font-mono text-muted-foreground">{language}</span>
        <Button onClick={onCopy} variant="ghost" size="sm"
          className="h-7 px-2.5 text-xs gap-1.5 text-muted-foreground hover:text-foreground">
          {copied ? (<><Check className="w-3 h-3 text-green-500" />Copied</>)
            : (<><Copy className="w-3 h-3" />Copy</>)}
        </Button>
      </div>
      <pre className="p-4 overflow-x-auto max-h-72">
        <code className="text-xs sm:text-sm font-mono text-foreground/90 leading-relaxed whitespace-pre">{code}</code>
      </pre>
    </div>
  )
}

/* ─── Embed customizer page ─── */

function EmbedCustomizerPage() {
  const [limit, setLimit] = useState(6)
  const [category, setCategory] = useState('All')
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [sort, setSort] = useState('popular')
  const [featured, setFeatured] = useState(false)
  const [copiedTab, setCopiedTab] = useState<string | null>(null)

  const handleCopy = useCallback(async (code: string, tab: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedTab(tab)
      toast.success('Copied to clipboard!')
      setTimeout(() => setCopiedTab(null), 2500)
    } catch {
      toast.error('Failed to copy')
    }
  }, [])

  const categoryFilter = category === 'All' ? '' : category
  const iframeSrc = `/?embed_preview=1&limit=${limit}&category=${encodeURIComponent(categoryFilter)}&theme=${theme}&sort=${sort}&featured=${featured}`

  const htmlSnippet = `<!-- Revolaunch Widget -->
<script async src="https://${SITE_URL}/widget.js"></script>
<div class="revolaunch-widget"${categoryFilter ? ` data-category="${categoryFilter}"` : ''} data-limit="${limit}" data-sort="${sort}" data-theme="${theme}"${featured ? ' data-featured="true"' : ''}></div>`

  const reactSnippet = `// Install: npx revolaunch-widget@latest
// Or use this component:

import { useEffect, useRef } from 'react';

export function RevolaunchWidget({ limit = ${limit}, category = ${categoryFilter ? `'${categoryFilter}'` : 'undefined'}, theme = '${theme}' }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const existing = ref.current?.querySelector('script');
    if (existing) existing.remove();
    const script = document.createElement('script');
    script.src = 'https://${SITE_URL}/widget.js';
    script.async = true;
    script.onload = () => {
      const el = ref.current?.querySelector('.revolaunch-widget');
      if (el) {
        el.setAttribute('data-limit', String(limit));
        ${categoryFilter ? `el.setAttribute('data-category', '${categoryFilter}');` : ''}
        el.setAttribute('data-theme', theme);
        el.setAttribute('data-sort', '${sort}');
        ${featured ? `el.setAttribute('data-featured', 'true');` : ''}
      }
    };
    ref.current?.appendChild(script);
  }, [limit, category, theme]);
  return <div ref={ref}><div className="revolaunch-widget" data-limit={limit} ${categoryFilter ? `data-category="${categoryFilter}"` : ''} data-theme={theme} data-sort="${sort}"${featured ? ' data-featured="true"' : ''} /></div>;
}`

  const wordpressSnippet = `<!-- Revolaunch Widget — add to a Custom HTML block -->
<script async src="https://${SITE_URL}/widget.js"></script>
<div class="revolaunch-widget"${categoryFilter ? ` data-category="${categoryFilter}"` : ''} data-limit="${limit}" data-sort="${sort}" data-theme="${theme}"${featured ? ' data-featured="true"' : ''}></div>`

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }} className="text-center mb-10">
          <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20 text-xs font-semibold mb-4">
            <Sparkles className="w-3 h-3 mr-1" />
            Widget System
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
            Embed Revolaunch on Your Site
          </h1>
          <p className="text-base text-muted-foreground mt-3 max-w-xl mx-auto">
            Display trending startups on your blog, portfolio, or documentation.
            Free, customizable, and takes just one line of code.
          </p>
        </motion.div>

        {/* Live Preview */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }} className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-4 h-4 text-orange-500" />
            <h2 className="text-sm font-semibold text-foreground">Live Preview</h2>
          </div>
          <div className="rounded-2xl border border-border bg-muted/20 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-muted/30">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
                <div className="w-3 h-3 rounded-full bg-green-400/60" />
              </div>
              <div className="flex-1 mx-4 px-3 py-1 rounded-md bg-background/60 text-xs text-muted-foreground text-center truncate">
                yourwebsite.com
              </div>
            </div>
            <div className="p-4 flex items-center justify-center" style={{ minHeight: 380 }}>
              <iframe src={iframeSrc} width="100%" height="360"
                style={{ border: 'none', borderRadius: 12 }} title="Widget Preview" sandbox="allow-scripts" />
            </div>
          </div>
        </motion.div>

        {/* Customization */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }} className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <SlidersHorizontal className="w-4 h-4 text-orange-500" />
            <h2 className="text-sm font-semibold text-foreground">Customize</h2>
          </div>
          <div className="rounded-2xl border border-border bg-muted/20 p-5 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Number of startups</label>
                <select value={limit} onChange={(e) => setLimit(Number(e.target.value))}
                  className="w-full h-9 rounded-lg border border-border bg-background text-sm text-foreground px-3 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500/50">
                  {[3, 6, 9, 12, 18, 24].map((n) => (<option key={n} value={n}>{n} startups</option>))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-9 rounded-lg border border-border bg-background text-sm text-foreground px-3 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500/50">
                  {CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Theme</label>
                <div className="flex gap-2">
                  <button onClick={() => setTheme('dark')}
                    className={cn('flex items-center gap-1.5 px-3 h-9 rounded-lg border text-sm font-medium transition-all',
                      theme === 'dark' ? 'border-orange-500 bg-orange-500/10 text-orange-500' : 'border-border text-muted-foreground hover:border-orange-500/30')}>
                    <Moon className="w-3.5 h-3.5" />Dark
                  </button>
                  <button onClick={() => setTheme('light')}
                    className={cn('flex items-center gap-1.5 px-3 h-9 rounded-lg border text-sm font-medium transition-all',
                      theme === 'light' ? 'border-orange-500 bg-orange-500/10 text-orange-500' : 'border-border text-muted-foreground hover:border-orange-500/30')}>
                    <Sun className="w-3.5 h-3.5" />Light
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Sort by</label>
                <div className="flex gap-2">
                  <button onClick={() => { setSort('popular'); setFeatured(false) }}
                    className={cn('flex-1 px-3 h-9 rounded-lg border text-sm font-medium transition-all',
                      sort === 'popular' && !featured ? 'border-orange-500 bg-orange-500/10 text-orange-500' : 'border-border text-muted-foreground hover:border-orange-500/30')}>
                    ★ Popular
                  </button>
                  <button onClick={() => { setSort('newest'); setFeatured(false) }}
                    className={cn('flex-1 px-3 h-9 rounded-lg border text-sm font-medium transition-all',
                      sort === 'newest' && !featured ? 'border-orange-500 bg-orange-500/10 text-orange-500' : 'border-border text-muted-foreground hover:border-orange-500/30')}>
                    🆕 Newest
                  </button>
                </div>
              </div>
            </div>
            <label className="flex items-center gap-2 mt-4 cursor-pointer select-none">
              <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)}
                className="w-4 h-4 rounded border-border accent-orange-500" />
              <span className="text-sm text-muted-foreground">
                Show only <span className="font-semibold text-foreground">featured</span> startups
              </span>
            </label>
          </div>
        </motion.div>

        {/* Code Snippets */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}>
          <div className="flex items-center gap-2 mb-3">
            <Code2 className="w-4 h-4 text-orange-500" />
            <h2 className="text-sm font-semibold text-foreground">Installation</h2>
          </div>
          <Tabs defaultValue="html" className="w-full">
            <TabsList className="mb-2">
              <TabsTrigger value="html"><Globe className="w-3.5 h-3.5 mr-1" />HTML</TabsTrigger>
              <TabsTrigger value="react"><Monitor className="w-3.5 h-3.5 mr-1" />React</TabsTrigger>
              <TabsTrigger value="wordpress"><Code2 className="w-3.5 h-3.5 mr-1" />WordPress</TabsTrigger>
            </TabsList>
            <TabsContent value="html">
              <CodeBlock code={htmlSnippet} language="html" copied={copiedTab === 'html'}
                onCopy={() => handleCopy(htmlSnippet, 'html')} />
            </TabsContent>
            <TabsContent value="react">
              <CodeBlock code={reactSnippet} language="tsx" copied={copiedTab === 'react'}
                onCopy={() => handleCopy(reactSnippet, 'react')} />
            </TabsContent>
            <TabsContent value="wordpress">
              <CodeBlock code={wordpressSnippet} language="html" copied={copiedTab === 'wordpress'}
                onCopy={() => handleCopy(wordpressSnippet, 'wordpress')} />
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* oEmbed notice */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="mt-8 rounded-2xl border border-border bg-muted/20 p-5 sm:p-6">
          <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <ArrowRight className="w-4 h-4 text-orange-500" />
            oEmbed Support
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Revolaunch supports the{' '}
            <a href="https://oembed.com" target="_blank" rel="noopener noreferrer"
              className="text-orange-500 hover:text-orange-400 font-medium">oEmbed standard</a>.
            Paste any startup URL (e.g.,{' '}
            <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
              https://{SITE_URL}/startup/example
            </code>
            ) into platforms like Notion, Medium, WordPress, or any oEmbed-compatible editor
            and it will automatically render a rich embed card.
          </p>
        </motion.div>
      </div>
    </div>
  )
}

/* ─── Router: switch between embed mode and customizer page ─── */

function EmbedPageInner() {
  const searchParams = useSearchParams()
  const embedSlug = searchParams.get('slug')
  const isEmbed = searchParams.get('embed') === '1'

  if (isEmbed && embedSlug) {
    return <IframeEmbed slug={embedSlug} theme="dark" />
  }

  return <EmbedCustomizerPage />
}

/* ─── Export with Suspense ─── */

export default function EmbedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Skeleton className="h-8 w-64 mx-auto mb-3" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
      </div>
    }>
      <EmbedPageInner />
    </Suspense>
  )
}
