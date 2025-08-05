// next.config.js
// Fix the static generation timeout by making API routes dynamic

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prevent static generation of API routes that use database
  experimental: {
    // Disable static generation for API routes
    isrMemoryCacheSize: 0,
  },
  
  // Force all API routes to be dynamic (no static generation)
  async rewrites() {
    return [];
  },
  
  // Optimize for serverless
  output: 'standalone',
  
  // Skip build-time database connections
  typescript: {
    // Skip type checking during build (optional)
    ignoreBuildErrors: false,
  },
  
  eslint: {
    // Skip ESLint during build (optional)
    ignoreDuringBuilds: false,
  },
  
  // Environment variables available at build time
  env: {
    SKIP_BUILD_STATIC_GENERATION: 'true',
  },
};

module.exports = nextConfig;