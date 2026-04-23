# 🚀 Revolaunch

**The Evolution of Startup Launching**

Revolaunch is a next-generation platform for discovering, launching, and funding the most innovative startups. Think Product Hunt meets AngelList — but better.

## Features

- 🚀 **Launch Your Startup** — Submit your startup for free and gain visibility
- ⬆️ **Community Voting** — Upvote the startups you love
- 🏆 **Featured Startups** — Curated selection of the hottest new launches
- 📂 **Category Browsing** — Filter by 20+ categories (AI, FinTech, SaaS, etc.)
- 📊 **Funding Stage Filters** — Pre-seed to Growth stage filtering
- 🔍 **Smart Search** — Find startups by name, tagline, category, or country
- 🎁 **Community Perks** — Exclusive discounts and offers from startups
- 📧 **Newsletter** — Stay updated on the latest launches
- 📱 **Fully Responsive** — Beautiful on mobile, tablet, and desktop
- 🌙 **Dark Mode Ready** — Theme support built-in

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Database**: SQLite + Prisma ORM
- **Animations**: Framer Motion
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- Bun (recommended) or npm

### Installation

```bash
# Clone the repository
git clone https://github.com/graclyblessed/revolaunch.git
cd revolaunch

# Install dependencies
bun install

# Set up environment variables
cp .env.example .env.local

# Push database schema
bun run db:push

# Seed the database with sample data
bunx tsx prisma/seed.ts

# Start development server
bun run dev
```

### Environment Variables

Create a `.env.local` file with:

```env
DATABASE_URL="file:./db/custom.db"
```

## Project Structure

```
revolaunch/
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts             # Seed data
├── public/
│   └── logo.png            # App logo
├── src/
│   ├── app/
│   │   ├── page.tsx        # Homepage (main SPA)
│   │   ├── layout.tsx      # Root layout
│   │   ├── globals.css     # Global styles
│   │   └── api/
│   │       ├── startups/   # Startup CRUD endpoints
│   │       ├── categories/ # Category listing
│   │       ├── stats/      # Platform statistics
│   │       └── subscribe/  # Newsletter signup
│   ├── components/ui/      # shadcn/ui components
│   └── lib/
│       └── db.ts           # Prisma client
├── package.json
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/startups` | List startups (with filters & pagination) |
| POST | `/api/startups` | Create a new startup |
| GET | `/api/startups/[slug]` | Get startup details |
| POST | `/api/startups/[slug]/vote` | Toggle vote on a startup |
| GET | `/api/categories` | List all categories |
| GET | `/api/stats` | Get platform statistics |
| POST | `/api/subscribe` | Subscribe to newsletter |

## License

MIT License — feel free to use this project as a starting point for your own startup directory.

---

Built with ❤️ for founders everywhere.
