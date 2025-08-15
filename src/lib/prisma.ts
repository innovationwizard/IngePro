// src/lib/prisma.ts
// Prisma client configuration with OIDC authentication

import { PrismaClient } from '@prisma/client';

declare global {
  var __prisma: PrismaClient | undefined;
}

// Create Prisma client with placeholder for auth token
// The actual authentication will be handled in the API routes
export const prisma = globalThis.__prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://placeholder:placeholder@localhost:5432/placeholder',
    },
  },
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

// Safe database operation wrapper
export async function safeDbOperation<T>(operation: () => Promise<T>): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    console.error('❌ Database operation failed:', error);
    throw error;
  }
}