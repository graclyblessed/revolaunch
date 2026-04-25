import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing — Launch Plans | Revolaunch',
  description: 'Choose your launch plan. From free to premium SEO growth packages, get the visibility your startup deserves with flexible pricing.',
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children
}
