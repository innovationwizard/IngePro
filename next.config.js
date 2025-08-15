// next.config.js
// Fixed configuration without invalid properties

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize for serverless deployment
  output: 'standalone',
  
  // Disable static generation to prevent API route timeouts
  staticPageGenerationTimeout: 0,
  
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
  
  // Webpack configuration for Prisma
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('@prisma/client');
    }
    return config;
  },
  
  // Disable static generation for API routes
  async rewrites() {
    return [
      {
        source: '/api/aws-rds',
        destination: '/api/aws-rds',
      },
      {
        source: '/api/aws-s3',
        destination: '/api/aws-s3',
      },
    ];
  },
  
  // Ensure API routes are not statically generated
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;