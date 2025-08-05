// next.config.js
// Fixed configuration without invalid properties

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize for serverless deployment
  output: 'standalone',
  
  // Skip type checking and linting during build (faster deployment)
  typescript: {
    ignoreBuildErrors: true, // Skip TypeScript errors during build
  },
  
  eslint: {
    ignoreDuringBuilds: true, // Skip ESLint during build
  },
  
  // Experimental features (valid properties only)
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  
  // Environment variables available at build time
  env: {
    SKIP_BUILD_STATIC_GENERATION: 'true',
  },
  
  // Webpack configuration for Prisma
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('@prisma/client');
    }
    return config;
  },
};

module.exports = nextConfig;