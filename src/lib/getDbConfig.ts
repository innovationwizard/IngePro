// lib/getDbConfig.ts
import fetch from 'node-fetch';
import { awsCredentialsProvider } from '@vercel/functions/oidc';
import { Signer } from '@aws-sdk/rds-signer';

let cachedConfig: any | null = null;

export async function getDbConfig() {
  if (cachedConfig) return cachedConfig;

  const RDS_HOSTNAME = process.env.RDS_HOSTNAME!;
  const RDS_PORT = parseInt(process.env.RDS_PORT!);
  const RDS_DATABASE = process.env.RDS_DATABASE!;
  const RDS_USERNAME = process.env.RDS_USERNAME!;
  const AWS_REGION = process.env.AWS_REGION!;
  const AWS_ROLE_ARN = process.env.AWS_ROLE_ARN!;
  const NOBLE_PROXY_TOKEN = process.env.NOBLE_PROXY_TOKEN!;

  // Get lease
  const response = await fetch('https://api.noble-ip.com/v1/leases', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      target_host: RDS_HOSTNAME,
      target_port: RDS_PORT,
      proxy_token: NOBLE_PROXY_TOKEN,
    }),
  });

  if (!response.ok) {
    throw new Error(`Lease failed: ${response.status} ${response.statusText}`);
  }

  const lease = await response.json();

  // Generate IAM token
  const signer = new Signer({
    credentials: awsCredentialsProvider({ roleArn: AWS_ROLE_ARN }),
    region: AWS_REGION,
    port: RDS_PORT,
    hostname: RDS_HOSTNAME,
    username: RDS_USERNAME,
  });

  const token = await signer.getAuthToken();

  cachedConfig = {
    host: lease.hostname,
    port: lease.port,
    user: RDS_USERNAME,
    password: token,
    database: RDS_DATABASE,
    ssl: {
      servername: RDS_HOSTNAME,
      rejectUnauthorized: false  // Temp; see below for secure fix
    }
  };

  return cachedConfig;
}

// Helper function to convert config to connection string for Prisma
export async function getDbUrl() {
  const config = await getDbConfig();
  return `postgresql://${encodeURIComponent(config.user)}:${encodeURIComponent(config.password)}@${config.host}:${config.port}/${config.database}?sslmode=require&sslsni=${encodeURIComponent(config.ssl.servername)}`;
}
