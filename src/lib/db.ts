// src/lib/db.ts
// Database utility with AWS RDS IAM authentication

import { PrismaClient } from '@prisma/client';
import { RDS } from '@aws-sdk/client-rds';

// RDS configuration
const RDS_HOSTNAME = process.env.RDS_HOSTNAME!;
const RDS_PORT = parseInt(process.env.RDS_PORT!);
const RDS_DATABASE = process.env.RDS_DATABASE!;
const RDS_USERNAME = process.env.RDS_USERNAME!;
const AWS_REGION = process.env.AWS_REGION!;

// Initialize RDS client for token generation
const rdsClient = new RDS({ region: AWS_REGION });

// Generate database URL with IAM authentication token
async function getDbUrl(): Promise<string> {
  try {
    const token = await rdsClient.generateDbAuthToken({
      hostname: RDS_HOSTNAME,
      port: RDS_PORT,
      username: RDS_USERNAME,
    });
    
    return `postgresql://${RDS_USERNAME}:${encodeURIComponent(token)}@${RDS_HOSTNAME}:${RDS_PORT}/${RDS_DATABASE}?sslmode=require`;
  } catch (error) {
    console.error('Failed to generate RDS auth token:', error);
    throw new Error('Database authentication failed');
  }
}

// Create Prisma client with IAM authentication
export async function getPrismaClient(): Promise<PrismaClient> {
  const dbUrl = await getDbUrl();
  
  return new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
  });
} 