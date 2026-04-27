'use client'

import { useState, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import {
  Key,
  Copy,
  Check,
  Zap,
  Shield,
  ChevronRight,
  ExternalLink,
  Terminal,
  BarChart3,
  Trophy,
  Layers,
  AlertTriangle,
  BookOpen,
  Globe,
  Clock,
  CreditCard,
  Users,
  Headphones,
  Webhook,
  Info,
  Star,
} from 'lucide-react'

/* ────────────── Types ────────────── */
interface EndpointDoc {
  method: string
  path: string
  description: string
  auth: boolean
  params?: { name: string; type: string; required: boolean; description: string }[]
  response: Record<string, unknown>
}

/* ────────────── Endpoint Definitions ────────────── */
const endpoints: EndpointDoc[] = [
  {
    method: 'GET',
    path: '/api/v1/startups',
    description: 'Get a paginated, filterable list of startups.',
    auth: true,
    params: [
      { name: 'page', type: 'integer', required: false, description: 'Page number (default: 1)' },
      { name: 'limit', type: 'integer', required: false, description: 'Items per page, max 100 (default: 20)' },
      { name: 'category', type: 'string', required: false, description: 'Filter by category (e.g. "AI", "SaaS")' },
      { name: 'stage', type: 'string', required: false, description: 'Filter by stage: Pre-seed, Seed, Series A, Series B, Growth' },
      { name: 'sort', type: 'string', required: false, description: 'Sort order: newest, oldest, popular (default: newest)' },
      { name: 'search', type: 'string', required: false, description: 'Search term (matches name, tagline, category, country)' },
      { name: 'featured', type: 'boolean', required: false, description: 'Only show featured startups (true/false)' },
    ],
    response: {
      startups: [
        {
          id: 'clx...',
          name: 'Acme AI',
          slug: 'acme-ai',
          tagline: 'AI-powered analytics',
          logo: 'https://...',
          website: 'https://acme.ai',
          category: 'AI',
          stage: 'Seed',
          upvotes: 42,
          featured: true,
          _count: { votes: 42, perks: 2 },
          createdAt: '2025-01-15T00:00:00.000Z',
        },
      ],
      total: 150,
      page: 1,
      limit: 20,
      totalPages: 8,
    },
  },
  {
    method: 'GET',
    path: '/api/v1/startups/[slug]',
    description: 'Get full details for a single startup by slug.',
    auth: true,
    params: [
      { name: 'slug', type: 'string', required: true, description: 'Startup slug (path parameter)' },
    ],
    response: {
      startup: {
        id: 'clx...',
        name: 'Acme AI',
        slug: 'acme-ai',
        tagline: 'AI-powered analytics for modern teams',
        description: 'Full description here...',
        logo: 'https://...',
        website: 'https://acme.ai',
        twitter: '@acme_ai',
        category: 'AI',
        stage: 'Seed',
        teamSize: '6-20',
        country: 'United States',
        upvotes: 42,
        featured: true,
        badgeVerified: true,
        launchTier: 'premium',
        perks: [
          { id: 'pk1', title: '20% off first year', description: 'Use code ACME20', url: 'https://...' },
        ],
        _count: { votes: 42, perks: 2 },
      },
    },
  },
  {
    method: 'GET',
    path: '/api/v1/categories',
    description: 'Get all categories with startup counts.',
    auth: true,
    response: {
      categories: [
        { name: 'AI', count: 35, icon: '🤖' },
        { name: 'SaaS', count: 28, icon: '☁️' },
        { name: 'Developer Tools', count: 22, icon: '🛠️' },
      ],
    },
  },
  {
    method: 'GET',
    path: '/api/v1/leaderboard',
    description: 'Get top startups ranked by upvotes.',
    auth: true,
    params: [
      { name: 'period', type: 'string', required: false, description: 'Time period: weekly, monthly, all (default: weekly)' },
      { name: 'limit', type: 'integer', required: false, description: 'Number of results, max 100 (default: 10)' },
    ],
    response: {
      leaderboard: [
        {
          id: 'clx...',
          name: 'Acme AI',
          slug: 'acme-ai',
          tagline: 'AI-powered analytics',
          upvotes: 42,
          category: 'AI',
          stage: 'Seed',
          _count: { votes: 42, perks: 2 },
        },
      ],
      period: 'weekly',
      count: 10,
    },
  },
  {
    method: 'GET',
    path: '/api/v1/stats',
    description: 'Get platform-wide statistics.',
    auth: true,
    response: {
      totalStartups: 150,
      totalVotes: 3200,
      totalCategories: 12,
      featuredCount: 8,
      totalSubscribers: 500,
      totalApiKeys: 3,
    },
  },
  {
    method: 'POST',
    path: '/api/v1/keys',
    description: 'Create a new API key. No authentication required (rate-limited by IP).',
    auth: false,
    params: [
      { name: 'name', type: 'string', required: true, description: 'A label for this key (max 50 chars)' },
      { name: 'rateLimit', type: 'integer', required: false, description: 'Max requests per hour, 1–10000 (default: 1000)' },
    ],
    response: {
      id: 'clx...',
      name: 'My App',
      key: 'rvl_aBcDeFgH...',
      rateLimit: 1000,
      createdAt: '2025-01-15T00:00:00.000Z',
      message: 'Save this key now — it cannot be retrieved again.',
    },
  },
  {
    method: 'GET',
    path: '/api/v1/keys/[key]',
    description: 'View API key usage details (requires the key itself).',
    auth: true,
    response: {
      id: 'clx...',
      name: 'My App',
      rateLimit: 1000,
      callsCount: 42,
      lastUsedAt: '2025-01-15T12:00:00.000Z',
      createdAt: '2025-01-15T00:00:00.000Z',
    },
  },
  {
    method: 'DELETE',
    path: '/api/v1/keys/[key]',
    description: 'Delete an API key (requires the key itself).',
    auth: true,
    response: {
      message: 'API key deleted successfully',
      id: 'clx...',
    },
  },
]

/* ────────────── Helper Components ────────────── */
const methodColor: Record<string, string> = {
  GET: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  POST: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  DELETE: 'bg-red-500/20 text-red-400 border-red-500/30',
  PUT: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  PATCH: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
}

function MethodBadge({ method }: { method: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold border uppercase tracking-wider ${methodColor[method] || methodColor.GET}`}>
      {method}
    </span>
  )
}

function JsonBlock({ data }: { data: Record<string, unknown> }) {
  const [copied, setCopied] = useState(false)
  const json = JSON.stringify(data, null, 2)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(json)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [json])

  return (
    <div className="relative group">
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 rounded-md bg-white/5 hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"
        aria-label="Copy JSON"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
      </button>
      <pre className="bg-black/40 border border-white/5 rounded-lg p-4 text-sm text-zinc-300 overflow-x-auto font-mono leading-relaxed">
        <code>{json}</code>
      </pre>
    </div>
  )
}

function EndpointCard({ endpoint }: { endpoint: EndpointDoc }) {
  const [open, setOpen] = useState(false)

  return (
    <Card className="bg-zinc-900/50 border-zinc-800/80 hover:border-orange-500/30 transition-colors">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left"
      >
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3 flex-wrap">
            <MethodBadge method={endpoint.method} />
            <code className="text-sm font-mono text-orange-400">{endpoint.path}</code>
            {endpoint.auth && (
              <Badge variant="outline" className="border-amber-500/30 text-amber-400 text-[10px] px-1.5 py-0">
                <Key className="w-2.5 h-2.5 mr-1" />Auth
              </Badge>
            )}
            <ChevronRight className={`w-4 h-4 text-zinc-500 ml-auto transition-transform ${open ? 'rotate-90' : ''}`} />
          </div>
          <CardDescription className="text-zinc-400 mt-1">{endpoint.description}</CardDescription>
        </CardHeader>
      </button>

      {open && (
        <CardContent className="pt-0 space-y-4">
          <Separator className="bg-zinc-800" />

          {/* Parameters */}
          {endpoint.params && endpoint.params.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Parameters</h4>
              <div className="rounded-lg border border-zinc-800 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-zinc-800/50">
                      <th className="text-left px-3 py-2 text-zinc-400 font-medium">Name</th>
                      <th className="text-left px-3 py-2 text-zinc-400 font-medium hidden sm:table-cell">Type</th>
                      <th className="text-left px-3 py-2 text-zinc-400 font-medium">Required</th>
                      <th className="text-left px-3 py-2 text-zinc-400 font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {endpoint.params.map((p) => (
                      <tr key={p.name} className="border-t border-zinc-800/60">
                        <td className="px-3 py-2 font-mono text-orange-300 text-xs">{p.name}</td>
                        <td className="px-3 py-2 text-zinc-500 text-xs hidden sm:table-cell">{p.type}</td>
                        <td className="px-3 py-2">
                          {p.required ? (
                            <span className="text-red-400 text-xs font-medium">Yes</span>
                          ) : (
                            <span className="text-zinc-600 text-xs">No</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-zinc-400 text-xs">{p.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Example Response */}
          <div>
            <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Example Response</h4>
            <JsonBlock data={endpoint.response} />
          </div>
        </CardContent>
      )}
    </Card>
  )
}

/* ────────────── Sections ────────────── */
const navSections = [
  { id: 'overview', label: 'Overview' },
  { id: 'authentication', label: 'Authentication' },
  { id: 'rate-limits', label: 'Rate Limits' },
  { id: 'endpoints', label: 'Endpoints' },
  { id: 'pricing', label: 'API Pricing' },
  { id: 'get-key', label: 'Get API Key' },
]

/* ────────────── Pricing Tiers ────────────── */
const pricingTiers = [
  {
    name: 'Free',
    price: '$0',
    period: '/mo',
    rateLimit: '1,000',
    features: [
      { icon: Zap, label: '1,000 req/hr' },
      { icon: Users, label: 'Community support' },
      { icon: Globe, label: 'Full API access' },
    ],
    tier: 'free',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$19',
    period: '/mo',
    rateLimit: '10,000',
    features: [
      { icon: Zap, label: '10,000 req/hr' },
      { icon: Headphones, label: 'Priority support' },
      { icon: Webhook, label: 'Webhook access' },
    ],
    tier: 'pro',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: '$99',
    period: '/mo',
    rateLimit: '100,000',
    features: [
      { icon: Zap, label: '100,000 req/hr' },
      { icon: Headphones, label: 'Dedicated support' },
      { icon: Shield, label: 'Custom SLA' },
    ],
    tier: 'enterprise',
    highlighted: false,
  },
]

/* ────────────── Main Page ────────────── */
export default function ApiDocsPage() {
  const [keyName, setKeyName] = useState('')
  const [selectedTier, setSelectedTier] = useState('free')
  const [createdKey, setCreatedKey] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const handleCreateKey = async () => {
    if (!keyName.trim()) {
      toast.error('Please enter a name for your API key')
      return
    }

    setIsCreating(true)
    try {
      const res = await fetch('/api/v1/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: keyName.trim(), tier: selectedTier }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to create API key')
        return
      }

      setCreatedKey(data.key)
      setKeyName('')
      toast.success('API key created! Save it now — it won\'t be shown again.')
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  const copyKey = useCallback(() => {
    navigator.clipboard.writeText(createdKey)
    toast.success('API key copied to clipboard!')
  }, [createdKey])

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setMobileNavOpen(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Terminal className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">API Documentation</h1>
                <p className="text-xs text-zinc-500">Revolaunch Public API v1</p>
              </div>
            </div>
            <a
              href="https://revolaunch.net"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-zinc-400 hover:text-orange-400 transition-colors flex items-center gap-1.5"
            >
              Revolaunch <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-8">
        {/* Sidebar Navigation */}
        <aside className="hidden md:block w-56 shrink-0">
          <nav className="sticky top-24 space-y-1">
            {navSections.map((s) => (
              <button
                key={s.id}
                onClick={() => scrollToSection(s.id)}
                className="w-full text-left px-3 py-2 rounded-md text-sm text-zinc-400 hover:text-orange-400 hover:bg-orange-500/5 transition-colors"
              >
                {s.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Mobile Nav Toggle */}
        <div className="md:hidden fixed bottom-6 right-6 z-50">
          <Button
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="rounded-full w-12 h-12 bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/25"
          >
            <BookOpen className="w-5 h-5" />
          </Button>
        </div>

        {/* Mobile Nav Drawer */}
        {mobileNavOpen && (
          <div className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setMobileNavOpen(false)}>
            <nav
              className="absolute bottom-20 right-4 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-2 min-w-48"
              onClick={(e) => e.stopPropagation()}
            >
              {navSections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => scrollToSection(s.id)}
                  className="w-full text-left px-4 py-2.5 rounded-lg text-sm text-zinc-300 hover:text-orange-400 hover:bg-orange-500/10 transition-colors"
                >
                  {s.label}
                </button>
              ))}
            </nav>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 min-w-0 space-y-12 pb-24">
          {/* Overview */}
          <section id="overview" className="scroll-mt-24">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Globe className="w-5 h-5 text-orange-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Overview</h2>
            </div>
            <div className="prose prose-invert prose-sm max-w-none">
              <p className="text-zinc-400 leading-relaxed">
                The Revolaunch API provides programmatic access to the startup directory data.
                Use it to fetch startups, categories, leaderboard rankings, and platform statistics.
              </p>
              <p className="text-zinc-400 leading-relaxed">
                All API endpoints are prefixed with <code className="text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded text-xs">/api/v1</code> and
                return JSON responses. Most endpoints require an API key for authentication.
              </p>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              {[
                { icon: Layers, label: 'Endpoints', value: '8' },
                { icon: Shield, label: 'Auth', value: 'Bearer Token' },
                { icon: Clock, label: 'Rate Limit', value: '1000/hr' },
                { icon: Zap, label: 'Format', value: 'JSON' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="bg-zinc-900/60 border border-zinc-800/80 rounded-lg p-3 text-center">
                  <Icon className="w-4 h-4 text-orange-400 mx-auto mb-1.5" />
                  <div className="text-xs text-zinc-500">{label}</div>
                  <div className="text-sm font-semibold text-white mt-0.5">{value}</div>
                </div>
              ))}
            </div>
          </section>

          <Separator className="bg-zinc-800" />

          {/* Authentication */}
          <section id="authentication" className="scroll-mt-24">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Key className="w-5 h-5 text-amber-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Authentication</h2>
            </div>
            <p className="text-zinc-400 text-sm leading-relaxed mb-4">
              Most endpoints require an API key. Pass it using one of two methods:
            </p>

            <div className="space-y-3">
              <Card className="bg-zinc-900/50 border-zinc-800/80">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm text-white">Authorization Header (Recommended)</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <pre className="bg-black/40 border border-white/5 rounded-lg p-3 text-xs font-mono text-zinc-300 overflow-x-auto">
{`curl -H "Authorization: Bearer rvl_your_key_here" \\
  https://revolaunch.net/api/v1/startups`}
                  </pre>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900/50 border-zinc-800/80">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm text-white">Query Parameter</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <pre className="bg-black/40 border border-white/5 rounded-lg p-3 text-xs font-mono text-zinc-300 overflow-x-auto">
{`curl "https://revolaunch.net/api/v1/startups?api_key=rvl_your_key_here"`}
                  </pre>
                </CardContent>
              </Card>
            </div>
          </section>

          <Separator className="bg-zinc-800" />

          {/* Rate Limits */}
          <section id="rate-limits" className="scroll-mt-24">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-red-500/10">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Rate Limits</h2>
            </div>
            <div className="space-y-3 text-sm text-zinc-400 leading-relaxed">
              <p>
                Each API key has a configurable rate limit (default: <span className="text-white font-medium">1,000 requests per hour</span>).
                When the rate limit is exceeded, the API returns a <code className="text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded text-xs">429 Too Many Requests</code> error.
              </p>
              <p>
                Key creation is rate-limited by IP address: <span className="text-white font-medium">5 keys per hour</span>.
              </p>
              <p>
                Rate limit counters reset at the start of each hour window from the first request.
              </p>
            </div>

            <Card className="bg-zinc-900/50 border-zinc-800/80 mt-4">
              <CardContent className="pt-4 px-4">
                <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Rate Limit Response</h4>
                <JsonBlock data={{
                  error: 'Rate limit exceeded (1000 requests per hour). Try again later.',
                }} />
              </CardContent>
            </Card>
          </section>

          <Separator className="bg-zinc-800" />

          {/* Endpoints */}
          <section id="endpoints" className="scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Terminal className="w-5 h-5 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Endpoints</h2>
            </div>

            {/* Endpoint category groups */}
            <div className="space-y-6">
              {/* Startup Endpoints */}
              <div>
                <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5" /> Startups
                </h3>
                <div className="space-y-3">
                  {endpoints.filter(e => e.path.includes('/startups')).map((e) => (
                    <EndpointCard key={e.method + e.path} endpoint={e} />
                  ))}
                </div>
              </div>

              {/* Discovery Endpoints */}
              <div>
                <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <BarChart3 className="w-3.5 h-3.5" /> Discovery
                </h3>
                <div className="space-y-3">
                  {endpoints.filter(e => e.path.includes('/categories') || e.path.includes('/leaderboard') || e.path.includes('/stats')).map((e) => (
                    <EndpointCard key={e.method + e.path} endpoint={e} />
                  ))}
                </div>
              </div>

              {/* Key Management */}
              <div>
                <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Key className="w-3.5 h-3.5" /> Key Management
                </h3>
                <div className="space-y-3">
                  {endpoints.filter(e => e.path.includes('/keys')).map((e) => (
                    <EndpointCard key={e.method + e.path} endpoint={e} />
                  ))}
                </div>
              </div>
            </div>
          </section>

          <Separator className="bg-zinc-800" />

          {/* API Pricing */}
          <section id="pricing" className="scroll-mt-24">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <CreditCard className="w-5 h-5 text-amber-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">API Pricing</h2>
            </div>
            <p className="text-zinc-400 text-sm leading-relaxed mb-6">
              Choose the plan that fits your needs. All tiers include access to the full API.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {pricingTiers.map((tier) => (
                <Card
                  key={tier.tier}
                  className={`bg-zinc-900/50 border transition-colors ${
                    tier.highlighted
                      ? 'border-orange-500/50 ring-1 ring-orange-500/20 relative'
                      : 'border-zinc-800/80 hover:border-zinc-700'
                  }`}
                >
                  {tier.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-orange-500 text-white text-[10px] px-2.5 py-0.5 font-bold">
                        <Star className="w-3 h-3 mr-1" />Popular
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="pt-6 pb-3 px-5">
                    <CardTitle className="text-base text-white">{tier.name}</CardTitle>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className={`text-3xl font-bold ${tier.highlighted ? 'text-orange-400' : 'text-white'}`}>{tier.price}</span>
                      <span className="text-zinc-500 text-sm">{tier.period}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="px-5 pb-5">
                    <div className="space-y-3">
                      {tier.features.map(({ icon: Icon, label }) => (
                        <div key={label} className="flex items-center gap-2.5 text-sm">
                          <Icon className={`w-4 h-4 shrink-0 ${tier.highlighted ? 'text-orange-400' : 'text-zinc-500'}`} />
                          <span className="text-zinc-300">{label}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-6 flex items-start gap-2.5 p-4 rounded-lg bg-zinc-900/50 border border-zinc-800/80">
              <Info className="w-4 h-4 text-zinc-500 mt-0.5 shrink-0" />
              <p className="text-sm text-zinc-400 leading-relaxed">
                All tiers start free. Upgrade anytime from your dashboard.
              </p>
            </div>
          </section>

          <Separator className="bg-zinc-800" />

          {/* Get API Key */}
          <section id="get-key" className="scroll-mt-24">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Key className="w-5 h-5 text-orange-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Get Your API Key</h2>
            </div>
            <p className="text-zinc-400 text-sm leading-relaxed mb-6">
              Create a free API key to start using the Revolaunch API. Your key is shown only once — save it securely.
            </p>

            <Card className="bg-zinc-900/50 border-zinc-800/80">
              <CardHeader>
                <CardTitle className="text-base text-white flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-orange-400" />
                  Create API Key
                </CardTitle>
                <CardDescription className="text-zinc-500">
                  Enter a name and select a tier for your API key.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Input
                      placeholder="Key name (e.g. My App)"
                      value={keyName}
                      onChange={(e) => setKeyName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateKey()}
                      className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-600 max-w-xs"
                      maxLength={50}
                    />
                    <Select value={selectedTier} onValueChange={setSelectedTier}>
                      <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white w-[160px]">
                        <SelectValue placeholder="Select tier" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800">
                        <SelectItem value="free" className="text-zinc-300 focus:text-white focus:bg-zinc-800">
                          Free
                        </SelectItem>
                        <SelectItem value="pro" className="text-zinc-300 focus:text-white focus:bg-zinc-800">
                          Pro ($19/mo)
                        </SelectItem>
                        <SelectItem value="enterprise" className="text-zinc-300 focus:text-white focus:bg-zinc-800">
                          Enterprise ($99/mo)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={handleCreateKey}
                      disabled={isCreating || !keyName.trim()}
                      className="bg-orange-500 hover:bg-orange-600 text-white font-semibold shrink-0"
                    >
                      {isCreating ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Creating...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Zap className="w-4 h-4" />
                          Generate Key
                        </span>
                      )}
                    </Button>
                  </div>

                  {(selectedTier === 'pro' || selectedTier === 'enterprise') && (
                    <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                      <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                      <p className="text-sm text-amber-200/80 leading-relaxed">
                        Payment required. Contact us to upgrade to the {selectedTier === 'pro' ? 'Pro' : 'Enterprise'} tier.
                      </p>
                    </div>
                  )}

                  {/* Show created key */}
                  {createdKey && (
                    <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <p className="text-sm font-semibold text-emerald-400">API Key Created!</p>
                          <p className="text-xs text-zinc-500 mt-0.5">
                            Save this key now — it cannot be retrieved again.
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={copyKey}
                          className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white shrink-0"
                        >
                          <Copy className="w-3.5 h-3.5 mr-1.5" />
                          Copy
                        </Button>
                      </div>
                      <pre className="bg-black/60 border border-white/5 rounded-md p-3 text-xs font-mono text-orange-400 overflow-x-auto select-all break-all">
                        {createdKey}
                      </pre>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </section>
        </main>
      </div>
    </div>
  )
}
