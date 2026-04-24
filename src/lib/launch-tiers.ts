export type LaunchTier = 'free' | 'premium' | 'premium-plus' | 'seo-growth'

export interface LaunchTierConfig {
  id: LaunchTier
  name: string
  subtitle: string
  price: number
  originalPrice?: number
  priceLabel: string
  slotsPerDay: number
  badge: string
  badgeColor: string
  borderColor: string
  icon: string
  features: { text: string; included: boolean; note?: string }[]
  highlight?: boolean
  tag?: string
}

export const LAUNCH_TIERS: Record<LaunchTier, LaunchTierConfig> = {
  free: {
    id: 'free',
    name: 'Free Launch',
    subtitle: 'Standard launch with community visibility',
    price: 0,
    priceLabel: 'Free',
    slotsPerDay: 10,
    badge: 'Free',
    badgeColor: 'bg-muted text-muted-foreground',
    borderColor: 'border-border',
    icon: '🚀',
    features: [
      { text: 'Listed in the startup directory', included: true },
      { text: 'Community upvotes and follows', included: true },
      { text: 'Standard launch queue', included: true },
      { text: 'Weekly leaderboard participation', included: true },
      { text: 'Backlink (DR 50) if Top 3 daily ranking', included: true, note: 'Top 3 required' },
      { text: 'Featured in weekly newsletter', included: true, note: 'Top 5 weekly required' },
      { text: 'Shared on Revolaunch X account', included: true, note: '#1 daily only' },
      { text: 'Priority placement', included: false },
      { text: 'Guaranteed backlink', included: false },
    ],
  },
  premium: {
    id: 'premium',
    name: 'Premium Launch',
    subtitle: 'Priority scheduling with faster visibility',
    price: 9,
    priceLabel: '$9',
    slotsPerDay: 5,
    badge: 'Premium',
    badgeColor: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    borderColor: 'border-blue-500/30',
    icon: '⚡',
    highlight: true,
    tag: 'Most Popular',
    features: [
      { text: 'Skip the free queue entirely', included: true },
      { text: 'Guaranteed dofollow backlink (DR 50)', included: true },
      { text: 'Earlier launch date assigned', included: true },
      { text: 'Premium badge on listing', included: true },
      { text: '5 premium slots per day', included: true },
      { text: 'Featured in weekly newsletter', included: true },
      { text: 'Priority in search and filters', included: true },
      { text: 'Highlighted in category pages', included: true },
    ],
  },
  'premium-plus': {
    id: 'premium-plus',
    name: 'Premium Plus',
    subtitle: 'Maximum visibility with homepage spotlight',
    price: 12.5,
    originalPrice: 25,
    priceLabel: '$12.5',
    slotsPerDay: 3,
    badge: 'Premium Plus',
    badgeColor: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    borderColor: 'border-orange-500/30',
    icon: '👑',
    tag: '50% off for early users',
    features: [
      { text: 'Everything in Premium', included: true },
      { text: 'Featured embed with border and badge forever', included: true },
      { text: 'Promoted in listing feed for 14 days', included: true, note: 'Special styling + guaranteed visibility' },
      { text: 'Premium spotlight placement on homepage', included: true },
      { text: 'Guaranteed dofollow backlink (DR 50)', included: true },
      { text: 'Exclusive 3 slots per day', included: true },
      { text: 'Fastest launch date priority', included: true },
      { text: 'Share on Revolaunch X account', included: true },
    ],
  },
  'seo-growth': {
    id: 'seo-growth',
    name: 'SEO Growth Package',
    subtitle: 'Rank on Google with a dedicated SEO article',
    price: 49,
    originalPrice: 99,
    priceLabel: '$49',
    slotsPerDay: 2,
    badge: 'SEO Growth',
    badgeColor: 'bg-green-500/10 text-green-500 border-green-500/20',
    borderColor: 'border-green-500/30',
    icon: '📈',
    tag: '50% off — only 2 slots remaining',
    features: [
      { text: 'Dedicated SEO article for your product', included: true, note: 'Ranks for "[Product] review" keywords' },
      { text: 'Premium Launch included', included: true },
      { text: 'Dofollow backlink from DR 50 domain', included: true },
      { text: 'Google ranking strategy', included: true, note: 'Optimized to capture search traffic' },
      { text: 'Long-term organic traffic', included: true, note: 'Content that compounds over time' },
      { text: 'Featured embed in article', included: true },
      { text: 'Premium badge forever', included: true },
      { text: 'Priority support', included: true },
    ],
  },
}

export function getTierColor(tier: LaunchTier): string {
  const colors: Record<LaunchTier, string> = {
    free: 'text-muted-foreground',
    premium: 'text-blue-500',
    'premium-plus': 'text-orange-500',
    'seo-growth': 'text-green-500',
  }
  return colors[tier] || 'text-muted-foreground'
}

export function getTierBg(tier: LaunchTier): string {
  const bgs: Record<LaunchTier, string> = {
    free: 'bg-muted',
    premium: 'bg-blue-500/10',
    'premium-plus': 'bg-orange-500/10',
    'seo-growth': 'bg-green-500/10',
  }
  return bgs[tier] || 'bg-muted'
}

export function getTierBorder(tier: LaunchTier): string {
  const borders: Record<LaunchTier, string> = {
    free: '',
    premium: 'border-blue-500/30',
    'premium-plus': 'border-orange-500/30',
    'seo-growth': 'border-green-500/30',
  }
  return borders[tier] || ''
}

export function getTierIcon(tier: LaunchTier): string {
  return LAUNCH_TIERS[tier]?.icon || '🚀'
}

export function getTierLabel(tier: LaunchTier): string {
  return LAUNCH_TIERS[tier]?.name || 'Free Launch'
}
