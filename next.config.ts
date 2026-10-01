import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // En Vercel NO usar output: "standalone"
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
