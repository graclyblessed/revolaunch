import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Exclude Prisma from the serverless bundle
  serverExternalPackages: ["@prisma/client", "prisma"],
};

export default nextConfig;
