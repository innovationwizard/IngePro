// src/lib/db.ts
// Database utility with AWS RDS IAM authentication

import { RDS } from '@aws-sdk/client-rds'; // Explicit import
import { Signer } from '@aws-sdk/rds-signer';
import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

config(); // Load .env

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error('DATABASE_URL is not set');
const url = new URL(DATABASE_URL);

const RDS_HOSTNAME = url.hostname;
const RDS_PORT = parseInt(url.port || '5432', 10);
const RDS_DATABASE = url.pathname.slice(1);
const RDS_USERNAME = url.username;
const AWS_REGION = 'us-east-2';

const rdsClient = new RDS({ region: AWS_REGION }); // Ensure this line executes

async function getPrismaClient() {
  try {
    console.log(`Generating token for ${RDS_USERNAME}@${RDS_HOSTNAME}:${RDS_PORT}/${RDS_DATABASE}`);
    
    const signer = new Signer({
      hostname: RDS_HOSTNAME,
      port: RDS_PORT,
      username: RDS_USERNAME,
      region: AWS_REGION,
    });
    
    const token = await signer.getAuthToken();
    console.log('Token generated successfully');
    
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
    
    // Fallback: Try to use the original DATABASE_URL if IAM auth fails
    console.log('Falling back to direct connection...');
    try {
      return new PrismaClient({
        datasources: {
          db: {
            url: DATABASE_URL,
          },
        },
      });
    } catch (fallbackError) {
      console.error('Fallback connection also failed:', fallbackError);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error('Database authentication failed: ' + errorMessage);
    }
  }
}

// Export the function instead of top-level await
export { getPrismaClient }; 