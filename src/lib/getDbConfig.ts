// lib/getDbConfig.ts
import fetch from 'node-fetch';
import { awsCredentialsProvider } from '@vercel/functions/oidc';
import { Signer } from '@aws-sdk/rds-signer';

let cachedConfig: any | null = null;
let cachedCertificate: string | null = null;

// Download AWS RDS global certificate bundle dynamically
async function getRdsCertificate(): Promise<string> {
  if (cachedCertificate) return cachedCertificate;
  
  try {
    const response = await fetch('https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem');
    if (!response.ok) {
      throw new Error(`Failed to download RDS certificate: ${response.status} ${response.statusText}`);
    }
    cachedCertificate = await response.text();
    return cachedCertificate;
  } catch (error) {
    throw new Error(`Error downloading RDS certificate: ${error}`);
  }
}

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
  const certificate = await getRdsCertificate();

  cachedConfig = {
    host: lease.hostname,
    port: lease.port,
    user: RDS_USERNAME,
    password: token,
    database: RDS_DATABASE,
    ssl: {
      rejectUnauthorized: true,
      ca: certificate,
      servername: RDS_HOSTNAME
    }
  };

  return cachedConfig;
}

// Helper function to convert config to connection string for Prisma
export async function getDbUrl() {
  const config = await getDbConfig();
  return `postgresql://${encodeURIComponent(config.user)}:${encodeURIComponent(config.password)}@${config.host}:${config.port}/${config.database}?sslmode=require&sslsni=${encodeURIComponent(config.ssl.servername)}`;
}
