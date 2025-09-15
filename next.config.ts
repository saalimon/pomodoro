import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // If deploying to a subdirectory, uncomment and set the basePath
  // basePath: '/your-repo-name',
  // assetPrefix: '/your-repo-name',
};

export default nextConfig;
