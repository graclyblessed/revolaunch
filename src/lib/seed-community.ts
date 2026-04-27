import { db } from '@/lib/db'

const DEFAULT_BOARDS = [
  {
    slug: 'weekly-board',
    name: 'Weekly Board',
    description: 'Track your weekly progress and compete for top rankings',
    icon: '📅',
    sortOrder: 0,
  },
  {
    slug: 'mrr-board',
    name: 'MRR Board',
    description: 'Share your monthly recurring revenue milestones',
    icon: '💰',
    sortOrder: 1,
  },
  {
    slug: 'raising-capital',
    name: 'Raising Capital',
    description: 'Connect with investors and showcase your fundraising journey',
    icon: '🤝',
    sortOrder: 2,
  },
  {
    slug: 'launch-reviews',
    name: 'Launch Reviews',
    description: 'Get feedback on your product launch from the community',
    icon: '🚀',
    sortOrder: 3,
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
