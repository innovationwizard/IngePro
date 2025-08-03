import { PrismaClient } from '@prisma/client'

// Create a properly encoded connection string
function getConnectionString(): string {
  const originalUrl = process.env.DATABASE_URL
  if (!originalUrl) {
    throw new Error('DATABASE_URL environment variable is not set')
  }
  
  // Ensure proper URL encoding for special characters
  const encodedUrl = originalUrl
    .replace(/\$/g, '%24')  // Encode $ as %24
    .replace(/,/g, '%2C')   // Encode , as %2C
  
  console.log('Original DATABASE_URL:', originalUrl)
  console.log('Encoded DATABASE_URL:', encodedUrl)
  
  return encodedUrl
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: getConnectionString()
    }
  }
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma 