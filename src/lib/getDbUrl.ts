// lib/getDbUrl.ts
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import { awsCredentialsProvider } from '@vercel/functions/oidc';

let cachedUrl: string | null = null;

export async function getDbUrl() {
  if (cachedUrl) return cachedUrl;

  const sm = new SecretsManagerClient({
    region: process.env.AWS_REGION!,
    credentials: awsCredentialsProvider({ roleArn: process.env.AWS_ROLE_ARN! }),
  });
  
  const cmd = new GetSecretValueCommand({
    SecretId: "arn:aws:secretsmanager:us-east-2:524390297512:secret:ingepro-IAM-secret-NLApH7",
  });

  const { SecretString } = await sm.send(cmd);
  if (!SecretString) throw new Error("Secret has no string value");

  const s = JSON.parse(SecretString);

  cachedUrl =
    `postgresql://${encodeURIComponent(s.username)}:${encodeURIComponent(s.password)}` +
    `@${s.host}:${s.port}/${s.dbInstanceIdentifier}?sslmode=require`;

  return cachedUrl;
}
