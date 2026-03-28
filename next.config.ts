import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  // Allow Ngrok to access Next.js dev resources for Hot Reloading
  // @ts-ignore - Some TS versions don't have it explicitly typed yet
  allowedDevOrigins: [
    'knurlier-drillable-jayce.ngrok-free.dev',
    'localhost:3000',
  ]
};

export default nextConfig;
