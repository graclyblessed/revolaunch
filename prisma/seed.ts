import { PrismaClient } from '@prisma/client'
import { fallbackStartups, fallbackPerks } from '../src/lib/fallback-data'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding Neon PostgreSQL with 36 startups...')

  // 1. Seed startups
  for (const s of fallbackStartups) {
    await prisma.startup.upsert({
      where: { slug: s.slug },
      update: {
        name: s.name,
        tagline: s.tagline,
        description: s.description || null,
        logo: null, // Don't store Clearbit URLs — client generates them dynamically
        website: s.website,
        twitter: s.twitter || null,
        linkedin: s.linkedin || null,
        category: s.category,
        stage: s.stage,
        teamSize: s.teamSize,
        foundedYear: s.foundedYear || null,
        country: s.country || null,
        email: s.email || null,
        upvotes: s.upvotes,
        featured: s.featured,
        status: s.status,
      },
      create: {
        id: s.id,
        name: s.name,
        slug: s.slug,
        tagline: s.tagline,
        description: s.description || null,
        logo: null, // Don't store Clearbit URLs — client generates them dynamically
        website: s.website,
        twitter: s.twitter || null,
        linkedin: s.linkedin || null,
        category: s.category,
        stage: s.stage,
        teamSize: s.teamSize,
        foundedYear: s.foundedYear || null,
        country: s.country || null,
        email: s.email || null,
        upvotes: s.upvotes,
        featured: s.featured,
        status: s.status,
      },
    })
    console.log(`  ✓ ${s.name}`)
  }

  // 2. Seed perks
  for (const [slug, perks] of Object.entries(fallbackPerks)) {
    const startup = await prisma.startup.findUnique({ where: { slug } })
    if (startup) {
      for (const perk of perks) {
        await prisma.perk.upsert({
          where: { id: perk.id },
          update: {
            startupId: startup.id,
            title: perk.title,
            description: perk.description,
            discount: perk.discount || null,
            url: perk.url,
          },
          create: {
            id: perk.id,
            startupId: startup.id,
            title: perk.title,
            description: perk.description,
            discount: perk.discount || null,
            url: perk.url,
          },
        })
        console.log(`  ✓ Perk: ${perk.title} (${slug})`)
      }
    }
  }

  const totalStartups = await prisma.startup.count()
  const totalPerks = await prisma.perk.count()
  console.log(`\n🎉 Done! Seeded ${totalStartups} startups and ${totalPerks} perks.`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
