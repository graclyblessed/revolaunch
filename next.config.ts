import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // External packages for Neon PostgreSQL + Prisma on Vercel serverless
  serverExternalPackages: ["@prisma/client", "prisma", "@neondatabase/serverless", "ws"],
};

export default nextConfig;
