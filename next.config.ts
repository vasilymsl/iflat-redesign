import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.media.24h.tv",
      },
      {
        protocol: "https",
        hostname: "cdn.static.24h.tv",
      },
    ],
  },
};

export default nextConfig;
