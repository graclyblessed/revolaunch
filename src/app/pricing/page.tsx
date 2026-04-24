'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check, X, ArrowLeft, Sparkles, Shield, TrendingUp,
  Headphones, ExternalLink, Clock, Globe, Search, Star,
  FileText, Zap, Crown, BarChart3,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { LAUNCH_TIERS, type LaunchTier } from '@/lib/launch-tiers'
import { isLemonSqueezyConfigured } from '@/lib/lemonsqueezy-client'

const tierOrder: LaunchTier[] = ['free', 'premium', 'premium-plus', 'seo-growth']

const featureIcons: Record<string, React.ReactNode> = {
  'queue': <Clock className="w-4 h-4" />,
  'backlink': <Globe className="w-4 h-4" />,
  'newsletter': <FileText className="w-4 h-4" />,
  'x-share': <ExternalLink className="w-4 h-4" />,
  'featured': <Star className="w-4 h-4" />,
  'seo': <Search className="w-4 h-4" />,
  'analytics': <BarChart3 className="w-4 h-4" />,
}

function getFeatureIcon(text: string) {
  const lower = text.toLowerCase()
  if (lower.includes('backlink')) return featureIcons.backlink
  if (lower.includes('queue') || lower.includes('skip')) return featureIcons.queue
  if (lower.includes('newsletter') || lower.includes('article')) return featureIcons.newsletter
  if (lower.includes('x account') || lower.includes('share')) return featureIcons['x-share']
  if (lower.includes('featured') || lower.includes('spotlight') || lower.includes('promoted')) return featureIcons.featured
  if (lower.includes('seo') || lower.includes('rank') || lower.includes('google')) return featureIcons.seo
  if (lower.includes('analytics') || lower.includes('traffic')) return featureIcons.analytics
  return null
}

export default function PricingPage() {
  const [selectedTier, setSelectedTier] = useState<LaunchTier | null>(null)
  const [loading, setLoading] = useState<string | null>(null)

  const handleLaunch = async (tier: LaunchTier) => {
    setSelectedTier(tier)

    if (tier === 'free') {
      // Navigate directly to submit
      window.location.href = '/submit?tier=free'
      return
    }

    if (!isLemonSqueezyConfigured) {
      // Demo mode
      window.location.href = `/submit?tier=${tier}`
      return
    }

    setLoading(tier)
    // In production, this would call LemonSqueezy checkout
    // For now, navigate to submit with tier pre-selected
    setTimeout(() => {
      window.location.href = `/submit?tier=${tier}`
    }, 500)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b subtle-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Startups
          </Link>
          <Badge variant="secondary" className="text-[10px] bg-orange-500/10 text-orange-500 border-orange-500/20">
            <Sparkles className="w-3 h-3 mr-1" />
            Launch Plans
          </Badge>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Choose Your <span className="text-orange-500">Launch Plan</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-3">
            Get the visibility your startup deserves with flexible launch options. 
            All launches go live at <span className="text-foreground font-medium">8:00 AM UTC</span>.
          </p>
          <p className="text-sm text-muted-foreground">
            Trusted by <span className="text-orange-500 font-medium">36+</span> startups and counting
          </p>
        </motion.div>

        {/* Launch Tiers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-7xl mx-auto mb-16">
          {tierOrder.map((tierKey, index) => {
            const tier = LAUNCH_TIERS[tierKey]
            const isFree = tierKey === 'free'
            const isLoading = loading === tierKey

            return (
              <motion.div
                key={tierKey}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.1 }}
                className={`relative rounded-2xl border-2 surface p-6 flex flex-col transition-all hover:shadow-lg ${
                  tier.highlight 
                    ? `${tier.borderColor} shadow-xl shadow-blue-500/5` 
                    : 'subtle-border'
                }`}
              >
                {/* Tag */}
                {tier.tag && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className={`text-[9px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-lg whitespace-nowrap ${
                      tierKey === 'premium' 
                        ? 'bg-blue-500 text-white shadow-blue-500/25' 
                        : tierKey === 'premium-plus'
                          ? 'bg-orange-500 text-white shadow-orange-500/25'
                          : 'bg-green-500 text-white shadow-green-500/25'
                    }`}>
                      {tier.tag}
                    </Badge>
                  </div>
                )}

                {/* Icon + Name */}
                <div className="mb-5">
                  <div className="text-2xl mb-2">{tier.icon}</div>
                  <h3 className="text-lg font-bold text-foreground">{tier.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{tier.subtitle}</p>
                </div>

                {/* Price */}
                <div className="mb-5">
                  {tier.originalPrice ? (
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-foreground">${tier.price}</span>
                      <span className="text-sm text-muted-foreground line-through">${tier.originalPrice}</span>
                      <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-[10px]">
                        Save {Math.round((1 - tier.price / tier.originalPrice) * 100)}%
                      </Badge>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-foreground">{tier.priceLabel}</span>
                      {!isFree && <span className="text-sm text-muted-foreground">/ launch</span>}
                    </div>
                  )}
                </div>

                {/* Slots info */}
                <div className="flex items-center gap-2 mb-5 px-3 py-2 rounded-lg bg-muted/50">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {tier.slotsPerDay} slots available daily
                  </span>
                </div>

                {/* Features */}
                <ul className="space-y-2.5 mb-6 flex-1">
                  {tier.features.map((feat) => (
                    <li key={feat.text} className="flex items-start gap-2.5 text-xs">
                      {feat.included ? (
                        <Check className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                          tierKey === 'free' ? 'text-green-500' : 
                          tierKey === 'premium' ? 'text-blue-500' :
                          tierKey === 'premium-plus' ? 'text-orange-500' : 'text-green-500'
                        }`} />
                      ) : (
                        <X className="w-3.5 h-3.5 mt-0.5 shrink-0 text-muted-foreground/50" />
                      )}
                      <span className={feat.included ? 'text-foreground/80' : 'text-muted-foreground/50'}>
                        {feat.text}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Button
                  className={`w-full h-10 rounded-xl text-sm font-semibold transition-all ${
                    isFree
                      ? 'bg-foreground text-background hover:bg-foreground/90'
                      : tierKey === 'premium'
                        ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                        : tierKey === 'premium-plus'
                          ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20'
                          : 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/20'
                  }`}
                  onClick={() => handleLaunch(tierKey)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Processing...
                    </span>
                  ) : isFree ? (
                    'Launch for Free'
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" />
                      Get {tier.name.replace('Launch', '').replace('Package', '').trim()}
                    </span>
                  )}
                </Button>
              </motion.div>
            )
          })}
        </div>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-16"
        >
          <h2 className="text-2xl font-bold text-foreground text-center mb-8">
            Compare All Features
          </h2>
          <div className="rounded-2xl border subtle-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b subtle-border bg-muted/30">
                    <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider min-w-[200px]">Feature</th>
                    {tierOrder.map(key => (
                      <th key={key} className="text-center p-4 text-xs font-semibold text-foreground">
                        <span className="text-lg block mb-1">{LAUNCH_TIERS[key].icon}</span>
                        {LAUNCH_TIERS[key].name.replace(' Launch', '').replace(' Package', '')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: 'Launch Queue', free: 'Standard', premium: 'Priority', 'premium-plus': 'Top Priority', 'seo-growth': 'Top Priority' },
                    { feature: 'Daily Slots', free: '10', premium: '5', 'premium-plus': '3', 'seo-growth': '2' },
                    { feature: 'Dofollow Backlink (DR 50)', free: 'Top 3 daily', premium: true, 'premium-plus': true, 'seo-growth': true },
                    { feature: 'Newsletter Feature', free: 'Top 5 weekly', premium: true, 'premium-plus': true, 'seo-growth': true },
                    { feature: 'Shared on Revolaunch X', free: '#1 daily', premium: false, 'premium-plus': true, 'seo-growth': true },
                    { feature: 'Homepage Spotlight', free: false, premium: false, 'premium-plus': true, 'seo-growth': true },
                    { feature: 'Promoted in Feed', free: false, premium: false, 'premium-plus': '14 days', 'seo-growth': true },
                    { feature: 'Premium Badge', free: false, premium: true, 'premium-plus': true, 'seo-growth': true },
                    { feature: 'Dedicated SEO Article', free: false, premium: false, 'premium-plus': false, 'seo-growth': true },
                    { feature: 'Google Ranking Strategy', free: false, premium: false, 'premium-plus': false, 'seo-growth': true },
                  ].map((row, i) => (
                    <tr key={row.feature} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                      <td className="p-4 text-xs text-foreground font-medium">{row.feature}</td>
                      {tierOrder.map(key => {
                        const val = row[key as keyof typeof row]
                        return (
                          <td key={key} className="text-center p-4">
                            {typeof val === 'boolean' ? (
                              val ? (
                                <Check className="w-4 h-4 text-green-500 mx-auto" />
                              ) : (
                                <X className="w-4 h-4 text-muted-foreground/30 mx-auto" />
                              )
                            ) : (
                              <span className="text-xs text-muted-foreground">{val}</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                  <tr className="border-t subtle-border bg-muted/30">
                    <td className="p-4 text-xs text-foreground font-bold">Price</td>
                    {tierOrder.map(key => (
                      <td key={key} className="text-center p-4">
                        <span className="text-sm font-bold text-foreground">
                          {LAUNCH_TIERS[key].price === 0 ? 'Free' : `$${LAUNCH_TIERS[key].price}`}
                        </span>
                        {LAUNCH_TIERS[key].originalPrice && (
                          <span className="text-xs text-muted-foreground line-through ml-1">
                            ${LAUNCH_TIERS[key].originalPrice}
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>

        {/* Trust Signals */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mb-16"
        >
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-500" />
              <span>Secure payments via LemonSqueezy</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-500" />
              <span>DR 50 domain authority</span>
            </div>
            <div className="flex items-center gap-2">
              <Headphones className="w-4 h-4 text-blue-500" />
              <span>Launch-day support</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-purple-500" />
              <span>Global startup community</span>
            </div>
          </div>
        </motion.div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="max-w-3xl mx-auto"
        >
          <h2 className="text-2xl font-bold text-foreground text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {[
              { q: 'How does the launch queue work?', a: 'Free launches are placed in the standard queue and scheduled based on availability. Premium launches skip the queue entirely and get earlier launch dates. Premium Plus and SEO Growth launches get top priority with the earliest available dates.' },
              { q: 'What is a dofollow backlink and why does it matter?', a: 'A dofollow backlink passes SEO authority from our domain (DR 50) to your website. This helps your startup rank higher on Google and other search engines, driving organic traffic over time. Free launches earn backlinks by reaching the top 3 daily ranking.' },
              { q: 'When do launches go live?', a: 'All launches are published at 8:00 AM UTC. This ensures maximum visibility as our community checks for new startups at the start of each day. Premium tiers get priority for the most visible positions.' },
              { q: 'What does the SEO Growth Package include?', a: 'The SEO Growth Package includes a custom-written article optimized to rank for "[Your Product] review" keywords on Google. It also includes everything from Premium Plus — homepage spotlight, promoted feed placement, guaranteed backlink, and premium badge.' },
              { q: 'Can I upgrade my launch tier later?', a: 'Yes! You can upgrade from Free to Premium at any time. If you want to add the SEO Growth Package to an existing launch, contact us and we will set it up for you.' },
              { q: 'What is the Revolaunch newsletter?', a: 'Our weekly newsletter reaches thousands of startup enthusiasts, investors, and tech professionals. Startups that rank in the top 5 weekly are automatically featured, giving you exposure beyond our website.' },
              { q: 'Do you offer refunds?', a: 'Yes. If your launch has not gone live yet, you can get a full refund. After the launch date, we offer partial refunds within 48 hours if you are unsatisfied with the results.' },
            ].map((faq, i) => (
              <details key={i} className="group rounded-xl border subtle-border">
                <summary className="flex items-center justify-between p-4 cursor-pointer text-sm font-medium text-foreground hover:text-orange-500 transition-colors">
                  {faq.q}
                  <span className="text-muted-foreground group-open:rotate-45 transition-transform text-lg">+</span>
                </summary>
                <p className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-16 py-12 rounded-2xl bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent border border-orange-500/10"
        >
          <h2 className="text-2xl font-bold text-foreground mb-2">Ready to Launch?</h2>
          <p className="text-muted-foreground mb-6">Join 36+ startups already gaining visibility on Revolaunch</p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/submit?tier=free">
              <Button variant="outline" className="h-11 rounded-xl text-sm font-medium">
                Launch for Free
              </Button>
            </Link>
            <Link href="/submit?tier=premium">
              <Button className="bg-blue-500 hover:bg-blue-600 text-white h-11 rounded-xl text-sm font-medium shadow-lg shadow-blue-500/20">
                <Zap className="w-4 h-4 mr-1.5" />
                Go Premium — $9
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
