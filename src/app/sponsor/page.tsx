'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Check,
  X,
  Zap,
  Megaphone,
  Star,
  Shield,
  CreditCard,
  Mail,
  Globe,
  BarChart3,
  Trophy,
  HelpCircle,
  ChevronDown,
  ExternalLink,
  Sparkles,
  LayoutDashboard,
  Newspaper,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { SPONSOR_PLANS, type SponsorPlan } from '@/lib/sponsor-plans'
import { toast } from 'sonner'
import Footer from '@/components/Footer'

const plans = [SPONSOR_PLANS['1month'], SPONSOR_PLANS['3months'], SPONSOR_PLANS['12months']]

const stats = [
  { label: 'Startups Listed', value: '36+' },
  { label: 'Monthly Visitors', value: '50K+' },
  { label: 'Active Investors', value: '200+' },
]

const faqs = [
  {
    question: 'How quickly will my sponsorship go live?',
    answer:
      'Typically within 24 hours of approval. We review all sponsor submissions to ensure they align with our community.',
  },
  {
    question: 'What do I need to provide?',
    answer:
      'A logo (SVG or high-res PNG), your website URL, and optionally a short tagline. We handle the rest.',
  },
  {
    question: 'Where exactly will my logo appear?',
    answer:
      'Your logo appears in the homepage sidebar (visible to all visitors), on every startup listing page, and in our weekly newsletter for 3-month and 12-month plans.',
  },
  {
    question: 'How do I send my info?',
    answer:
      'After checkout, you will receive a confirmation email with instructions to submit your logo and link.',
  },
  {
    question: 'Can I upgrade my plan later?',
    answer:
      'Yes! Contact us and we will apply the difference as credit toward a longer plan.',
  },
]

const placements = [
  {
    icon: LayoutDashboard,
    title: 'Homepage Sidebar',
    description:
      'Your logo is prominently displayed in the sidebar of our homepage, visible to every visitor browsing the startup directory.',
  },
  {
    icon: Globe,
    title: 'Every Startup Page',
    description:
      'Your sponsorship appears alongside every startup listing, giving you reach across the entire platform.',
  },
  {
    icon: Newspaper,
    title: 'Weekly Newsletter',
    description:
      'Included with 3-month and 12-month plans. Your brand is featured in our weekly newsletter sent to thousands of subscribers.',
  },
]

const comparisonFeatures = [
  { feature: 'Logo on homepage sidebar', '1month': true, '3months': true, '12months': true },
  { feature: 'Visible on every startup page', '1month': true, '3months': true, '12months': true },
  { feature: 'Direct link to your website', '1month': true, '3months': true, '12months': true },
  { feature: 'Analytics dashboard access', '1month': true, '3months': true, '12months': true },
  { feature: 'Priority logo placement', '1month': false, '3months': true, '12months': true },
  { feature: 'Featured in weekly newsletter', '1month': false, '3months': true, '12months': true },
  { feature: 'Social media shoutout on X', '1month': false, '3months': true, '12months': true },
  { feature: '"Supporting Sponsor" badge', '1month': false, '3months': false, '12months': true },
  { feature: 'Monthly analytics reports', '1month': false, '3months': false, '12months': true },
  { feature: 'Quarterly newsletter features', '1month': false, '3months': false, '12months': true },
  { feature: 'Priority support & changes', '1month': false, '3months': false, '12months': true },
]

const planIcons: Record<string, React.ReactNode> = {
  '1month': <Zap className="h-6 w-6" />,
  '3months': <Megaphone className="h-6 w-6" />,
  '12months': <Trophy className="h-6 w-6" />,
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' },
  }),
}

export default function SponsorPage() {
  const router = useRouter()
  const [loadingPlan, setLoadingPlan] = useState<SponsorPlan | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<SponsorPlan | null>(null)
  const [form, setForm] = useState({ companyName: '', website: '' })

  function openCheckout(plan: SponsorPlan) {
    setSelectedPlan(plan)
    setShowForm(true)
  }

  async function handleCheckout() {
    if (!selectedPlan || !form.companyName.trim()) {
      toast.error('Please enter your company name')
      return
    }
    setLoadingPlan(selectedPlan)
    try {
      const res = await fetch('/api/sponsor/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: selectedPlan,
          sponsorName: form.companyName.trim(),
          website: form.website.trim(),
        }),
      })

      const data = await res.json()

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else {
        // Demo mode
        toast.success('Sponsorship activated! (Demo mode)')
        setShowForm(false)
        router.push('/')
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation bar */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Startups
          </Link>
          <Link href="/" className="text-lg font-bold text-[#F97316]">
            Revolaunch
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 pb-20">
        {/* ─── Hero Section ─── */}
        <motion.section
          className="pt-16 pb-12 text-center"
          initial="hidden"
          animate="visible"
        >
          <motion.div custom={0} variants={fadeUp}>
            <Badge className="mb-4 bg-orange-100 text-[#F97316] hover:bg-orange-100 border-orange-200">
              <Sparkles className="mr-1 h-3 w-3" />
              Support Indie Makers
            </Badge>
          </motion.div>
          <motion.h1
            custom={1}
            variants={fadeUp}
            className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl"
          >
            Become a{' '}
            <span className="bg-gradient-to-r from-[#F97316] to-orange-400 bg-clip-text text-transparent">
              Sponsor
            </span>
          </motion.h1>
          <motion.p
            custom={2}
            variants={fadeUp}
            className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground sm:text-xl"
          >
            Get your brand in front of thousands of founders, investors, and early adopters.
            Sponsoring Revolaunch is the most targeted way to reach the startup community.
          </motion.p>
        </motion.section>

        {/* ─── Stats Bar ─── */}
        <motion.section
          className="mb-16 grid grid-cols-1 divide-y rounded-2xl border bg-card sm:grid-cols-3 sm:divide-x sm:divide-y-0"
          initial="hidden"
          animate="visible"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              custom={i + 3}
              variants={fadeUp}
              className="flex flex-col items-center gap-1 py-6 px-4"
            >
              <span className="text-3xl font-bold text-[#F97316]">{stat.value}</span>
              <span className="text-sm text-muted-foreground">{stat.label}</span>
            </motion.div>
          ))}
        </motion.section>

        {/* ─── Pricing Cards ─── */}
        <motion.section
          className="mb-24"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <motion.h2
            custom={0}
            variants={fadeUp}
            className="mb-2 text-center text-3xl font-bold"
          >
            Choose Your Plan
          </motion.h2>
          <motion.p
            custom={1}
            variants={fadeUp}
            className="mb-10 text-center text-muted-foreground"
          >
            One-time payment. No recurring charges. Cancel anytime.
          </motion.p>

          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.id}
                custom={i + 2}
                variants={fadeUp}
                className={`relative flex flex-col rounded-2xl border-2 bg-card p-6 transition-shadow hover:shadow-lg ${
                  plan.highlight
                    ? 'border-[#F97316] shadow-orange-100 shadow-lg'
                    : 'border-border'
                }`}
              >
                {plan.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#F97316] px-3 py-0.5 text-xs font-semibold text-white">
                    {plan.badge}
                  </span>
                )}

                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-[#F97316]">
                  {planIcons[plan.id]}
                </div>

                <h3 className="text-xl font-bold">{plan.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{plan.subtitle}</p>

                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold">{plan.priceLabel}</span>
                  <span className="text-muted-foreground">/ {plan.duration}</span>
                </div>

                <ul className="mt-6 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#F97316]" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => openCheckout(plan.id)}
                  disabled={loadingPlan === plan.id}
                  className={`mt-6 w-full font-semibold ${
                    plan.highlight
                      ? 'bg-[#F97316] text-white hover:bg-orange-600'
                      : 'bg-muted text-foreground hover:bg-muted/80'
                  }`}
                  size="lg"
                >
                  {loadingPlan === plan.id ? (
                    <span className="flex items-center gap-2">
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                      Processing…
                    </span>
                  ) : (
                    'Get Started'
                  )}
                </Button>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ─── Comparison Table ─── */}
        <motion.section
          className="mb-24"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <motion.h2
            custom={0}
            variants={fadeUp}
            className="mb-2 text-center text-3xl font-bold"
          >
            Feature Comparison
          </motion.h2>
          <motion.p
            custom={1}
            variants={fadeUp}
            className="mb-10 text-center text-muted-foreground"
          >
            See exactly what's included in each plan
          </motion.p>

          <motion.div custom={2} variants={fadeUp} className="overflow-x-auto rounded-2xl border">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-6 py-4 text-left font-semibold">Feature</th>
                  <th className="px-6 py-4 text-center font-semibold">1 Month</th>
                  <th className="px-6 py-4 text-center font-semibold">
                    <span className="inline-flex items-center gap-1">
                      3 Months
                      <Badge className="bg-[#F97316] text-white border-none text-[10px] px-1.5 py-0">
                        Best
                      </Badge>
                    </span>
                  </th>
                  <th className="px-6 py-4 text-center font-semibold">12 Months</th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((row, idx) => (
                  <tr
                    key={row.feature}
                    className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/30'}
                  >
                    <td className="px-6 py-3 text-muted-foreground">{row.feature}</td>
                    {(['1month', '3months', '12months'] as const).map((planId) => (
                      <td key={planId} className="px-6 py-3 text-center">
                        {row[planId] ? (
                          <Check className="mx-auto h-5 w-5 text-[#F97316]" />
                        ) : (
                          <X className="mx-auto h-5 w-5 text-muted-foreground/40" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </motion.section>

        {/* ─── Where Your Logo Appears ─── */}
        <motion.section
          className="mb-24"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <motion.h2
            custom={0}
            variants={fadeUp}
            className="mb-2 text-center text-3xl font-bold"
          >
            Where Your Logo Appears
          </motion.h2>
          <motion.p
            custom={1}
            variants={fadeUp}
            className="mb-10 text-center text-muted-foreground"
          >
            Your brand gets seen across the entire Revolaunch platform
          </motion.p>

          <div className="grid gap-6 sm:grid-cols-3">
            {placements.map((placement, i) => (
              <motion.div
                key={placement.title}
                custom={i + 2}
                variants={fadeUp}
                className="rounded-2xl border bg-card p-6 text-center transition-shadow hover:shadow-md"
              >
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-[#F97316]">
                  <placement.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold">{placement.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{placement.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ─── FAQ Section ─── */}
        <motion.section
          className="mb-24"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <motion.div custom={0} variants={fadeUp} className="text-center">
            <HelpCircle className="mx-auto mb-2 h-8 w-8 text-[#F97316]" />
            <h2 className="mb-2 text-3xl font-bold">Frequently Asked Questions</h2>
            <p className="text-muted-foreground">Everything you need to know about sponsoring Revolaunch</p>
          </motion.div>

          <motion.div custom={1} variants={fadeUp} className="mx-auto mt-10 max-w-2xl">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger className="text-left text-sm font-medium hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </motion.section>

        {/* ─── Bottom CTA ─── */}
        <motion.section
          className="mb-16 rounded-3xl bg-gradient-to-br from-[#F97316] to-orange-400 p-8 text-center text-white sm:p-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.h2 custom={0} variants={fadeUp} className="text-3xl font-bold sm:text-4xl">
            Ready to Get Started?
          </motion.h2>
          <motion.p
            custom={1}
            variants={fadeUp}
            className="mx-auto mt-3 max-w-lg text-orange-100"
          >
            Join the growing list of sponsors supporting the Revolaunch community. Limited slots
            available — secure yours today.
          </motion.p>
          <motion.div custom={2} variants={fadeUp} className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button
              onClick={() => openCheckout('3months')}
              disabled={loadingPlan === '3months'}
              size="lg"
              className="bg-white text-[#F97316] font-semibold hover:bg-orange-50"
            >
              {loadingPlan === '3months' ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Processing…
                </span>
              ) : (
                <>
                  Sponsor Now — $59 for 3 months
                  <ExternalLink className="ml-1 h-4 w-4" />
                </>
              )}
            </Button>
            <Link
              href="mailto:sponsors@revolaunch.net"
              className="inline-flex items-center gap-1 text-sm text-orange-100 underline underline-offset-4 hover:text-white transition-colors"
            >
              <Mail className="h-4 w-4" />
              Contact us
            </Link>
          </motion.div>
        </motion.section>

        {/* ─── Trust Signals Bar ─── */}
        <motion.section
          className="flex flex-col items-center justify-center gap-4 rounded-2xl border bg-card px-6 py-6 sm:flex-row sm:gap-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
        >
          <motion.div custom={0} variants={fadeUp} className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-5 w-5 text-green-600" />
            Secure Checkout
          </motion.div>
          <motion.div custom={1} variants={fadeUp} className="flex items-center gap-2 text-sm text-muted-foreground">
            <CreditCard className="h-5 w-5 text-blue-500" />
            Powered by LemonSqueezy
          </motion.div>
          <motion.div custom={2} variants={fadeUp} className="flex items-center gap-2 text-sm text-muted-foreground">
            <BarChart3 className="h-5 w-5 text-[#F97316]" />
            Analytics Included
          </motion.div>
          <motion.div custom={3} variants={fadeUp} className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-5 w-5 text-purple-500" />
            50K+ Monthly Reach
          </motion.div>
        </motion.section>
      </main>
      <Footer />

      {/* Sponsor Info Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60"
              onClick={() => setShowForm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6"
            >
              <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 p-1 rounded-md hover:bg-muted">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>

              <div className="mb-5">
                <div className="flex items-center gap-2 mb-1">
                  <Megaphone className="w-5 h-5 text-[#F97316]" />
                  <h2 className="text-lg font-semibold text-foreground">Almost there!</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  Tell us about your company so we can set up your sponsorship.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Company Name *</label>
                  <Input
                    required
                    placeholder="e.g., DigitalOcean"
                    value={form.companyName}
                    onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))}
                    className="h-10 rounded-lg"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Website URL</label>
                  <Input
                    placeholder="https://yourcompany.com"
                    value={form.website}
                    onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                    className="h-10 rounded-lg"
                  />
                </div>

                <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                  <p><strong>Selected plan:</strong> {SPONSOR_PLANS[selectedPlan!]?.name} ({SPONSOR_PLANS[selectedPlan!]?.priceLabel})</p>
                </div>

                <div className="flex gap-2 pt-1">
                  <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1 h-10 rounded-lg">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCheckout}
                    disabled={loadingPlan !== null}
                    className="flex-1 h-10 rounded-lg bg-[#F97316] text-white hover:bg-orange-600 font-semibold"
                  >
                    {loadingPlan ? (
                      <span className="flex items-center gap-2">
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                        </svg>
                        Processing…
                      </span>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 mr-1.5" />
                        Continue to Payment
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
