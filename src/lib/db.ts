// src/lib/db.ts
// Database utility with OIDC authentication for RDS

import { PrismaClient } from '@prisma/client';
import { awsCredentialsProvider } from '@vercel/functions/oidc';
import { Signer } from '@aws-sdk/rds-signer';

// RDS configuration
const RDS_PORT = parseInt(process.env.RDS_PORT!);
const RDS_HOSTNAME = process.env.RDS_HOSTNAME!;
const RDS_DATABASE = process.env.RDS_DATABASE!;
const RDS_USERNAME = process.env.RDS_USERNAME!;
const AWS_REGION = process.env.AWS_REGION!;
const AWS_ROLE_ARN = process.env.AWS_ROLE_ARN!;

// Initialize the RDS Signer for IAM authentication
const signer = new Signer({
  credentials: awsCredentialsProvider({
    roleArn: AWS_ROLE_ARN,
  }),
  region: AWS_REGION,
  port: RDS_PORT,
  hostname: RDS_HOSTNAME,
  username: RDS_USERNAME,
});

// Create Prisma client with OIDC authentication
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