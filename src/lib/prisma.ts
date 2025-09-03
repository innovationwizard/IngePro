// lib/prisma.ts
import { PrismaClient } from "@prisma/client";
import { getDbUrl } from "./getDbUrl";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

// Middleware to prevent hard deletes for critical models
const denyHardDelete = async (params: any, next: any) => {
  // Prevent hard deletes for Materials and Tasks
  if ((params.model === 'Materials' || params.model === 'Tasks') && 
      (params.action === 'delete' || params.action === 'deleteMany')) {
    throw new Error(`Hard delete disabled for ${params.model}. Use soft delete (deletedAt/deleted) instead.`);
  }
  return next(params);
};

let prismaClient: PrismaClient | null = null;

export async function getPrisma() {
  if (!prismaClient) {
    const url = await getDbUrl(); // builds from Secrets Manager
    prismaClient = new PrismaClient({ datasources: { db: { url } } });
    
    // Add middleware to prevent hard deletes
    try {
      prismaClient.$use(denyHardDelete);
    } catch (error) {
      console.error('Error adding Prisma middleware:', error);
      // Continue without middleware if it fails
    }
  }
  return prismaClient;
}