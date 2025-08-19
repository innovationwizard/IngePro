// src/lib/prisma.ts
// Prisma client configuration - now uses getPrismaClient from db.ts

import { PrismaClient } from '@prisma/client';
import { getPrismaClient } from './db';

declare global {
  var __prisma: PrismaClient | undefined;
}

// Export the getPrismaClient function for backward compatibility
export { getPrismaClient };

// For backward compatibility, create a prisma instance
// but this should not be used in new code
export const prisma = globalThis.__prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL ,
    },
  },
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

// Safe database operation wrapper
export async function safeDbOperation<T>(operation: () => Promise<T>): Promise<T | null> {
  try {
    const client = await getPrismaClient();
    const result = await operation();
    await client.$disconnect();
    return result;
  } catch (error) {
    console.error('❌ Database operation failed:', error);
    throw error;
  }
}