// src/lib/db.ts
// Database utility with IAM authentication for RDS

import { PrismaClient } from '@prisma/client';
import { Signer } from '@aws-sdk/rds-signer';

// RDS configuration
const RDS_PORT = parseInt(process.env.RDS_PORT!);
const RDS_HOSTNAME = process.env.RDS_HOSTNAME!;
const RDS_DATABASE = process.env.RDS_DATABASE!;
const RDS_USERNAME = process.env.RDS_USERNAME!;
const AWS_REGION = process.env.AWS_REGION!;

// Initialize the RDS Signer with AWS credentials
const signer = new Signer({
  region: AWS_REGION,
  port: RDS_PORT,
  hostname: RDS_HOSTNAME,
  username: RDS_USERNAME,
});

// Create Prisma client with IAM authentication
export async function getPrismaClient(): Promise<PrismaClient> {
  const authToken = await signer.getAuthToken();
  
  return new PrismaClient({
    datasources: {
      db: {
        url: `postgresql://${RDS_USERNAME}:${encodeURIComponent(authToken)}@${RDS_HOSTNAME}:${RDS_PORT}/${RDS_DATABASE}?schema=public`,
      },
    },
  });
} 