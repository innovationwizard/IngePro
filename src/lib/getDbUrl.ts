// lib/getDbUrl.ts
import fetch from 'node-fetch';
import { awsCredentialsProvider } from '@vercel/functions/oidc';
import { Signer } from '@aws-sdk/rds-signer';

let cachedUrl: string | null = null;

export async function getDbUrl() {
  if (cachedUrl) return cachedUrl;

  const RDS_HOSTNAME = process.env.RDS_HOSTNAME!;
  const RDS_PORT = parseInt(process.env.RDS_PORT!);
  const RDS_DATABASE = process.env.RDS_DATABASE!;
  const RDS_USERNAME = process.env.RDS_USERNAME!;
  const AWS_REGION = process.env.AWS_REGION!;
  const AWS_ROLE_ARN = process.env.AWS_ROLE_ARN!;
  const NOBLE_PROXY_TOKEN = process.env.NOBLE_PROXY_TOKEN!;

  // Get lease from Noble IP proxy service
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
    throw new Error(`Noble IP lease failed: ${response.status} ${response.statusText}`);
  }

  const lease = await response.json();

  // Generate IAM token for the REAL RDS Proxy hostname (not the Noble IP proxy)
  const signer = new Signer({
    credentials: awsCredentialsProvider({ roleArn: AWS_ROLE_ARN }),
    region: AWS_REGION,
    port: 5432, // RDS Proxy always uses port 5432
    hostname: RDS_HOSTNAME, // Use original RDS Proxy hostname for token generation
    username: RDS_USERNAME,
  });

  const token = await signer.getAuthToken();

  // Connect through Noble IP proxy but use IAM token for authentication
  // TLS/SNI verification must be against the RDS Proxy hostname, not the proxy
  cachedUrl = `postgresql://${encodeURIComponent(RDS_USERNAME)}:${encodeURIComponent(token)}@${lease.hostname}:${lease.port}/${RDS_DATABASE}?sslmode=require&sslsni=${encodeURIComponent(RDS_HOSTNAME)}`;

  return cachedUrl;
}
