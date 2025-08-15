// src/lib/db.ts
// Database utility with password authentication for RDS (temporary fix)

import { PrismaClient } from '@prisma/client';

// RDS configuration
const RDS_PORT = parseInt(process.env.RDS_PORT!);
const RDS_HOSTNAME = process.env.RDS_HOSTNAME!;
const RDS_DATABASE = process.env.RDS_DATABASE!;
const RDS_USERNAME = process.env.RDS_USERNAME!;
const RDS_PASSWORD = process.env.RDS_PASSWORD!;

// Create Prisma client with password authentication
export async function getPrismaClient(): Promise<PrismaClient> {
  return new PrismaClient({
    datasources: {
      db: {
        url: `postgresql://${RDS_USERNAME}:${encodeURIComponent(RDS_PASSWORD)}@${RDS_HOSTNAME}:${RDS_PORT}/${RDS_DATABASE}`,
      },
    },
  });
} 