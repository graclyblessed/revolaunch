import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Exclude Prisma from the bundle (not needed on Vercel with fallback data)
  serverExternalPackages: ["@prisma/client"],
};

export default nextConfig;
