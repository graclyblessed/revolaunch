'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Zap, Check, X, Crown, Sparkles, ArrowLeft,
  Rocket, TrendingUp, Shield, Headphones,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { usePlan, PLANS, type BillingCycle } from '@/hooks/use-plan'
import { isLemonSqueezyConfigured, VARIANTS } from '@/lib/lemonsqueezy-client'

const cycleLabels: Record<BillingCycle, string> = {
  monthly: 'Monthly',
  annual: 'Annual',
  lifetime: 'Lifetime',
}

const cycleSavings: Partial<Record<BillingCycle, string>> = {
  annual: 'Save 35%',
  lifetime: 'Best Value',
}

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly')
  const [loading, setLoading] = useState<string | null>(null)
  const { isPro, activePlan } = usePlan()

  const handleCheckout = async (variantId: string, cycle: BillingCycle) => {
    if (!isLemonSqueezyConfigured || !variantId) {
      // Demo mode — activate pro without payment
      if (typeof window !== 'undefined') {
        const { default: toast } = await import('sonner').then(m => m)
        toast.success(`🎉 Pro (${cycleLabels[cycle]}) activated! (Demo mode)`)
        const lsKey = 'revolaunch_user_plan'
        const now = new Date()
        let expiresAt: string | null = null
        if (cycle === 'monthly') expiresAt = new Date(now.getTime() + 30 * 86400000).toISOString()
        if (cycle === 'annual') expiresAt = new Date(now.getTime() + 365 * 86400000).toISOString()
        localStorage.setItem(lsKey, JSON.stringify({
          plan: 'pro', cycle, activatedAt: now.toISOString(), expiresAt,
          lemonSqueezySubscriptionId: null, lemonSqueezyOrderId: null,
        }))
        // Force a page reload to reflect changes
        setTimeout(() => window.location.reload(), 1000)
      }
      return
    }

    setLoading(cycle)
    try {
      const sessionId = localStorage.getItem('revolaunch_session') || 'anonymous'
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantId,
          customData: { sessionId, cycle },
        }),
      })
      const data = await res.json()
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      }
    } catch (err) {
      console.error('Checkout error:', err)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b subtle-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          {isPro && (
            <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20 text-xs">
              <Crown className="w-3 h-3 mr-1" />
              {activePlan === 'pro' ? 'Pro Member' : 'Free'}
            </Badge>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <Badge variant="secondary" className="mb-4 text-xs bg-orange-500/10 text-orange-500 border-orange-500/20">
            <Sparkles className="w-3 h-3 mr-1" />
            Pricing
          </Badge>
          <h1 className="text-4xl font-bold text-foreground mb-3">
            Launch Your Startup to the <span className="text-orange-500">Next Level</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            First 1,000 users are free. After that, upgrade to Pro for unlimited scheduling, advanced analytics, and priority visibility.
          </p>
        </motion.div>

        {/* Billing Cycle Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-center mb-10"
        >
          <div className="inline-flex items-center rounded-xl border subtle-border bg-muted/30 p-1 gap-1">
            {(['monthly', 'annual', 'lifetime'] as BillingCycle[]).map((cycle) => (
              <button
                key={cycle}
                onClick={() => setBillingCycle(cycle)}
                className={`relative rounded-lg px-5 py-2.5 text-sm font-medium transition-all ${
                  billingCycle === cycle
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {cycleLabels[cycle]}
                {cycleSavings[cycle] && (
                  <span className={`ml-1.5 text-[10px] font-semibold ${
                    billingCycle === cycle ? 'text-orange-100' : 'text-green-500'
                  }`}>
                    {cycleSavings[cycle]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Free Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border subtle-border surface p-8"
          >
            <div className="mb-6">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mb-4">
                <Rocket className="w-5 h-5 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Free</h2>
              <p className="text-sm text-muted-foreground mt-1">Perfect for getting started</p>
            </div>

            <div className="mb-6">
              <span className="text-4xl font-bold text-foreground">$0</span>
              <span className="text-muted-foreground ml-1">forever</span>
            </div>

            <ul className="space-y-3 mb-8">
              {PLANS.free.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  <span className="text-foreground/80">{feature}</span>
                </li>
              ))}
              <li className="flex items-start gap-3 text-sm">
                <X className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <span className="text-muted-foreground">Limited to 10 scheduled posts</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <X className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <span className="text-muted-foreground">Single platform only</span>
              </li>
            </ul>

            <Link href="/dashboard">
              <Button variant="outline" className="w-full h-11 rounded-xl text-sm font-medium">
                Current Plan
              </Button>
            </Link>
          </motion.div>

          {/* Pro Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative rounded-2xl border-2 border-orange-500/30 surface p-8 shadow-xl shadow-orange-500/5"
          >
            {/* Popular Badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-orange-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-lg shadow-orange-500/25">
                <Crown className="w-3 h-3 mr-1" />
                Most Popular
              </Badge>
            </div>

            <div className="mb-6 mt-2">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center mb-4">
                <Crown className="w-5 h-5 text-orange-500" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Pro</h2>
              <p className="text-sm text-muted-foreground mt-1">For serious founders</p>
            </div>

            <div className="mb-6">
              <span className="text-4xl font-bold text-foreground">
                ${PLANS.pro.price[billingCycle]}
              </span>
              <span className="text-muted-foreground ml-1">
                {billingCycle === 'lifetime' ? 'one-time' : `/${billingCycle === 'annual' ? 'year' : 'month'}`}
              </span>
              {billingCycle === 'annual' && (
                <p className="text-xs text-green-500 mt-1">
                  ${(PLANS.pro.price.monthly * 12 - PLANS.pro.price.annual)} savings vs monthly
                </p>
              )}
            </div>

            <ul className="space-y-3 mb-8">
              {PLANS.pro.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm">
                  <Check className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                  <span className="text-foreground/80">{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              className="w-full h-11 rounded-xl text-sm font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/25 transition-all hover:shadow-orange-500/40"
              onClick={() => handleCheckout(VARIANTS[billingCycle], billingCycle)}
              disabled={loading === billingCycle}
            >
              {loading === billingCycle ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Processing...
                </span>
              ) : isPro ? (
                <span className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Manage Subscription
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Upgrade to Pro
                </span>
              )}
            </Button>

            {!isLemonSqueezyConfigured && !isPro && (
              <p className="text-[10px] text-muted-foreground text-center mt-3">
                Demo mode — Pro will activate instantly
              </p>
            )}
          </motion.div>
        </div>

        {/* Trust Signals */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-16 text-center"
        >
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-500" />
              <span>Secure payments via LemonSqueezy</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-500" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <Headphones className="w-4 h-4 text-blue-500" />
              <span>Dedicated support</span>
            </div>
          </div>

          {/* FAQ teaser */}
          <div className="mt-12 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-foreground mb-4">Frequently Asked Questions</h3>
            <div className="space-y-4 text-left">
              {[
                { q: 'What happens when the free limit is reached?', a: 'The first 1,000 users get free access. After that, new users can still browse but scheduling and advanced features require a Pro plan.' },
                { q: 'How does the content scheduler work?', a: 'Free users can schedule up to 10 posts on a single platform (e.g., Twitter). Pro users get unlimited posts across all platforms — Twitter, LinkedIn, Blog, and Launch announcements.' },
                { q: 'Can I cancel my subscription?', a: 'Yes, you can cancel anytime from your LemonSqueezy dashboard. You\'ll keep Pro access until the end of your billing period.' },
                { q: 'Is there a refund policy?', a: 'Yes — LemonSqueezy handles all refunds. Contact us within 14 days for a full refund on monthly/annual plans.' },
              ].map((faq, i) => (
                <details key={i} className="group rounded-xl border subtle-border">
                  <summary className="flex items-center justify-between p-4 cursor-pointer text-sm font-medium text-foreground hover:text-orange-500 transition-colors">
                    {faq.q}
                    <span className="text-muted-foreground group-open:rotate-45 transition-transform text-lg">+</span>
                  </summary>
                  <p className="px-4 pb-4 text-sm text-muted-foreground">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
