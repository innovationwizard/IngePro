import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { Signer } from '@aws-sdk/rds-signer'

export async function getPrismaWithIam() {
  const DATABASE_URL = process.env.DATABASE_URL!;
  if (!DATABASE_URL) throw new Error('DATABASE_URL is not set');
  
  const url = new URL(DATABASE_URL);
  const host = url.hostname;
  const port = Number(url.port || 5432);
  const region = process.env.AWS_REGION!;       // us-east-2
  const username = url.username;
  const database = url.pathname.slice(1); // Remove leading slash

  const signer = new Signer({ 
    region, 
    hostname: host, 
    port, 
    username 
  })
  
  const token = await signer.getAuthToken()

  const dbUrl =
    `postgresql://${username}:${encodeURIComponent(token)}@${host}:${port}/${database}` +
    `?sslmode=require` // keep SSL on for IAM

  return new PrismaClient({ datasources: { db: { url: dbUrl } } }).$extends(withAccelerate())
}
