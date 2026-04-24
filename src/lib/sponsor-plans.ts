export type SponsorPlan = '1month' | '3months' | '12months'

export interface SponsorPlanConfig {
  id: SponsorPlan
  name: string
  subtitle: string
  price: number
  priceLabel: string
  duration: string
  durationMonths: number
  badge?: string
  highlight?: boolean
  features: string[]
}

export const SPONSOR_PLANS: Record<SponsorPlan, SponsorPlanConfig> = {
  '1month': {
    id: '1month',
    name: '1 Month',
    subtitle: 'Ideal for short-term campaigns or launch announcements',
    price: 29,
    priceLabel: '$29',
    duration: '1 month',
    durationMonths: 1,
    features: [
      'Logo on homepage sidebar',
      'Visible on every startup page',
      'Direct link to your website',
      'Analytics dashboard access',
      '1 month of visibility',
    ],
  },
  '3months': {
    id: '3months',
    name: '3 Months',
    subtitle: 'Sustained visibility with the best value per month',
    price: 59,
    priceLabel: '$59',
    duration: '3 months',
    durationMonths: 3,
    badge: 'Best Value',
    highlight: true,
    features: [
      'Everything in 1 Month',
      'Priority logo placement',
      'Featured in weekly newsletter (1x)',
      'Social media shoutout on X',
      '3 months of visibility',
      'Save 32% vs monthly',
    ],
  },
  '12months': {
    id: '12months',
    name: '12 Months',
    subtitle: 'Maximum long-term exposure at the best annual rate',
    price: 199,
    priceLabel: '$199',
    duration: '12 months',
    durationMonths: 12,
    features: [
      'Everything in 3 Months',
      'Quarterly newsletter features (4x)',
      'Exclusive "Supporting Sponsor" badge',
      'Monthly analytics reports',
      'Priority support & changes',
      '12 months of visibility',
      'Save 43% vs monthly',
    ],
  },
}

export const MAX_SPONSOR_SLOTS = 4

export function getSlotsRemaining(usedSlots: number): number {
  return Math.max(0, MAX_SPONSOR_SLOTS - usedSlots)
}
