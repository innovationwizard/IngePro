// src/lib/prisma.ts
// Build-safe Prisma client that doesn't connect during build

import { PrismaClient } from '@prisma/client';

declare global {
  var __prisma: PrismaClient | undefined;
}

// Only create Prisma client if not in build mode
export const prisma = process.env.SKIP_BUILD_STATIC_GENERATION === 'true' 
  ? null 
  : (globalThis.__prisma ?? new PrismaClient({
      log: ['error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    }));

if (process.env.NODE_ENV !== 'production' && prisma) {
  globalThis.__prisma = prisma;
}

// Safe database operation wrapper
export async function safeDbOperation<T>(operation: () => Promise<T>): Promise<T | null> {
  // Skip database operations during build
  if (process.env.SKIP_BUILD_STATIC_GENERATION === 'true' || !prisma) {
    console.log('⏭️ Skipping database operation during build');
    return null;
  }

  try {
    return await operation();
  } catch (error) {
    console.error('❌ Database operation failed:', error);
    throw error;
  }
}

// Example usage in API routes:
// import { safeDbOperation, prisma } from '@/lib/prisma';
// 
// const result = await safeDbOperation(async () => {
//   return await prisma.user.findMany();
// });
//
// if (!result) {
//   return NextResponse.json({ message: 'Build mode - no database' });
// }