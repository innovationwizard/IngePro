// src/lib/db.ts
// Database utility with AWS RDS IAM authentication

import { config } from 'dotenv';
import { RDS } from '@aws-sdk/client-rds';
import { PrismaClient } from '@prisma/client';

// Load environment variables from .env
config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error('DATABASE_URL is not set');
const url = new URL(DATABASE_URL);

const RDS_HOSTNAME = url.hostname;
const RDS_PORT = parseInt(url.port || '5432', 10);
const RDS_DATABASE = url.pathname.slice(1);
const RDS_USERNAME = url.username;
const AWS_REGION = 'us-east-2';

const rdsClient = new RDS({ region: AWS_REGION });

async function getPrismaClient() {
  try {
    console.log(`Generating token for ${RDS_USERNAME}@${RDS_HOSTNAME}:${RDS_PORT}/${RDS_DATABASE}`);
    const token = await rdsClient.generateDbAuthToken({
      hostname: RDS_HOSTNAME,
      port: RDS_PORT,
      username: RDS_USERNAME,
    });
    console.log('Token generated:', token);
    const dbUrl = `postgresql://${RDS_USERNAME}:${encodeURIComponent(token)}@${RDS_HOSTNAME}:${RDS_PORT}/${RDS_DATABASE}?sslmode=require`;

    return new PrismaClient({
      datasources: {
        db: {
          url: dbUrl,
        },
      },
    });
  } catch (error) {
    console.error('RDS auth token error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error('Database authentication failed: ' + errorMessage);
  }
}

// Export the function instead of top-level await
export { getPrismaClient }; 