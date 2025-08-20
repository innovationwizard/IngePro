import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { Signer } from '@aws-sdk/rds-signer'

export async function getPrismaWithIam() {
  const DATABASE_URL = process.env.DATABASE_URL!;
  if (!DATABASE_URL) throw new Error('DATABASE_URL is not set');
  
  // For Accelerate, use the DATABASE_URL directly as it should be a prisma:// URL
  // Accelerate handles the authentication automatically
  return new PrismaClient().$extends(withAccelerate())
}
