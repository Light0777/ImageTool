import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    domains: [],
    unoptimized: true,
  },
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }
    return config;
  },
};

export default nextConfig;