// src/lib/db.ts
// Database utility with AWS RDS IAM authentication

import { RDS } from '@aws-sdk/client-rds';
import { PrismaClient } from '@prisma/client';

// Extract database connection details from DATABASE_URL
const DATABASE_URL = process.env.DATABASE_URL!;
if (!DATABASE_URL) throw new Error('DATABASE_URL is not set');
const url = new URL(DATABASE_URL);

const RDS_HOSTNAME = url.hostname;
const RDS_PORT = parseInt(url.port || '5432', 10); // Fallback to 5432
const RDS_DATABASE = url.pathname.slice(1); // e.g., 'postgres'
const RDS_USERNAME = url.username;
const AWS_REGION = 'us-east-2'; // Hardcoded, or use process.env.AWS_REGION if re-added

const rdsClient = new RDS({ region: AWS_REGION });

// Create Prisma client with IAM authentication
export async function getPrismaClient(): Promise<PrismaClient> {
  try {
    const token = await rdsClient.generateDbAuthToken({
      hostname: RDS_HOSTNAME,
      port: RDS_PORT,
      username: RDS_USERNAME,
    });
    const dbUrl = `postgresql://${RDS_USERNAME}:${encodeURIComponent(token)}@${RDS_HOSTNAME}:${RDS_PORT}/${RDS_DATABASE}?sslmode=require`;

    return new PrismaClient({
      datasources: {
        db: {
          url: dbUrl,
        },
      },
    });
  } catch (error) {
    console.error('Failed to generate RDS auth token:', error);
    throw new Error('Database authentication failed');
  }
} 