// lib/getDbUrl.ts
import { awsCredentialsProvider } from '@vercel/functions/oidc';
import { Signer } from '@aws-sdk/rds-signer';

let cachedUrl: string | null = null;

export async function getDbUrl() {
  if (cachedUrl) return cachedUrl;

  const RDS_PORT = parseInt(process.env.RDS_PORT!);
  const RDS_HOSTNAME = process.env.RDS_HOSTNAME!;
  const RDS_DATABASE = process.env.RDS_DATABASE!;
  const RDS_USERNAME = process.env.RDS_USERNAME!;
  const AWS_REGION = process.env.AWS_REGION!;
  const AWS_ROLE_ARN = process.env.AWS_ROLE_ARN!;

  const signer = new Signer({
    credentials: awsCredentialsProvider({ roleArn: AWS_ROLE_ARN }),
    region: AWS_REGION,
    port: RDS_PORT,
    hostname: RDS_HOSTNAME,
    username: RDS_USERNAME,
  });

  const token = await signer.getAuthToken();

  cachedUrl =
    `postgresql://${encodeURIComponent(RDS_USERNAME)}:${encodeURIComponent(token)}` +
    `@${RDS_HOSTNAME}:${RDS_PORT}/${RDS_DATABASE}?sslmode=require`;

  return cachedUrl;
}
