// src/lib/prisma.ts
// Prisma client configuration

import { PrismaClient } from '@prisma/client';

declare global {
  var __prisma: PrismaClient | undefined;
}

// Create Prisma client
export const prisma = globalThis.__prisma ?? new PrismaClient({
  log: ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
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