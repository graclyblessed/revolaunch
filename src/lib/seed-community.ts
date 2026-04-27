import { db } from '@/lib/db'

const DEFAULT_BOARDS = [
  {
    slug: 'mrr',
    name: 'MRR Board',
    description: 'Share your monthly recurring revenue milestones and celebrate growth with the community.',
    icon: '💰',
    sortOrder: 0,
  },
  {
    slug: 'weekly',
    name: 'Weekly Wins',
    description: 'Post your weekly achievements, launches, and wins no matter how small.',
    icon: '🏆',
    sortOrder: 1,
  },
  {
    slug: 'raising-capital',
    name: 'Raising Capital',
    description: 'Connect with founders who are fundraising or looking for investment opportunities.',
    icon: '🚀',
    sortOrder: 2,
  },
  {
    slug: 'jobs',
    name: 'Job Board',
    description: 'Find talent or post job openings at your startup. Remote-friendly.',
    icon: '💼',
    sortOrder: 3,
  },
  {
    slug: 'open-acquisition',
    name: 'Open to Acquisition',
    description: 'For founders considering acquisition offers or looking to acquire.',
    icon: '🤝',
    sortOrder: 4,
  },
  {
    slug: 'perks-directory',
    name: 'Perks Directory',
    description: 'Exclusive deals, discounts, and perks from startups in our community.',
    icon: '🎁',
    sortOrder: 5,
  },
]

export async function seedCommunityBoards() {
  if (!db) {
    console.warn('[Seed] DB not available, skipping community board seed')
    return
  }

  for (const board of DEFAULT_BOARDS) {
    await db.communityBoard.upsert({
      where: { slug: board.slug },
      update: {},
      create: board,
    })
  }

  console.log('[Seed] Community boards seeded successfully')
}
