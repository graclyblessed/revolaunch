'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Rocket, Globe, Star, Users, TrendingUp, BarChart3,
  ArrowRight, Target, Zap, Shield, MessageCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const stats = [
  { label: 'Startups Listed', value: '57+', icon: Rocket, color: 'text-orange-500' },
  { label: 'Community Stars', value: '2K+', icon: Star, color: 'text-amber-500' },
  { label: 'Countries', value: '9+', icon: Globe, color: 'text-blue-500' },
  { label: 'Categories', value: '12+', icon: BarChart3, color: 'text-green-500' },
]

const values = [
  {
    icon: Target,
    title: 'Founder-First',
    description: 'Every feature is designed with founders in mind. From launch plans to analytics, we help startups get the visibility they deserve without breaking the bank.',
  },
  {
    icon: Zap,
    title: 'Weekly Competition',
    description: 'Our weekly leaderboard creates a gamified experience where startups compete for the top spots. The best startups get featured to 50K+ monthly visitors.',
  },
  {
    icon: Shield,
    title: 'Real Backlinks',
    description: 'We offer genuine dofollow backlinks from our DR 50 domain — a tangible SEO benefit that helps startups rank higher on Google.',
  },
  {
    icon: MessageCircle,
    title: 'Community Driven',
    description: 'Revolaunch is more than a directory. Our community boards connect founders with investors, job seekers, and fellow builders.',
  },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-28 pb-16 text-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground leading-tight">
                Where startups{' '}
                <span className="text-orange-500">begin.</span>
              </h1>
              <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
                Revolaunch is the next-generation startup directory built to help founders
                get discovered, get funded, and get acquired.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Stats */}
        <section className="pb-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.1 }}
                  className="rounded-xl border subtle-border surface p-5 text-center"
                >
                  <stat.icon className={`w-6 h-6 ${stat.color} mx-auto mb-2`} />
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Mission */}
        <section className="pb-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
            >
              <h2 className="text-2xl font-bold text-foreground mb-4 text-center">Our Mission</h2>
              <div className="rounded-2xl border subtle-border surface p-6 sm:p-8">
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  The startup world is noisy. Great products get lost in the noise of social media algorithms,
                  pay-to-play directories, and crowded launch platforms. We built Revolaunch to fix that.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Revolaunch is a curated, community-driven platform where the best startups rise to the top
                  based on merit — not marketing budgets. Every week, founders compete for visibility through
                  stars, reviews, and genuine community engagement. The winners get featured to tens of
                  thousands of founders, investors, and early adopters.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Whether you are a solo maker launching your first SaaS or a funded startup looking for your
                  next round of users, Revolaunch gives you the tools, the audience, and the backlinks to grow.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Values */}
        <section className="pb-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-10"
            >
              <h2 className="text-2xl font-bold text-foreground text-center mb-2">What Makes Us Different</h2>
              <p className="text-sm text-muted-foreground text-center">
                Not another launch platform. A growth engine for startups.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {values.map((value, i) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="rounded-xl border subtle-border surface p-6"
                >
                  <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center mb-4">
                    <value.icon className="w-5 h-5 text-orange-500" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-2">{value.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{value.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="pb-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-10"
            >
              <h2 className="text-2xl font-bold text-foreground text-center mb-2">How It Works</h2>
              <p className="text-sm text-muted-foreground text-center">
                Three steps to get your startup in front of thousands.
              </p>
            </motion.div>

            <div className="space-y-6">
              {[
                { step: '1', title: 'Submit Your Startup', description: 'Fill in your startup details — name, tagline, website, category. We auto-fill your description from your site meta tags to save you time.' },
                { step: '2', title: 'Get Discovered', description: 'Your startup goes live on our directory and is visible to 50K+ monthly visitors. Collect stars and reviews from the community to climb the rankings.' },
                { step: '3', title: 'Win the Week', description: 'Top 3 startups every week get featured on our homepage and newsletter. Premium tiers get guaranteed dofollow backlinks, X shares, and dedicated SEO articles.' },
              ].map((item, i) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -16 : 16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex gap-4"
                >
                  <div className="shrink-0 w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-sm">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="pb-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 via-orange-500 to-amber-500 p-8 sm:p-12 text-center"
            >
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-amber-300/10 blur-3xl" />
              </div>
              <div className="relative z-10">
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                  Ready to launch?
                </h2>
                <p className="text-sm sm:text-base text-white/80 max-w-md mx-auto mb-6">
                  Join 57+ startups already getting discovered on Revolaunch.
                </p>
                <Link href="/submit">
                  <Button className="bg-white text-orange-600 hover:bg-white/90 font-semibold rounded-xl h-11 px-8 text-sm">
                    Launch Your Startup
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
