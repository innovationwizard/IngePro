import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';
import { Signer } from '@aws-sdk/rds-signer';
import { awsCredentialsProvider } from '@vercel/functions/oidc';

// Extract database connection details from DATABASE_URL
const DATABASE_URL = process.env.DATABASE_URL!;
const url = new URL(DATABASE_URL);

const RDS_HOSTNAME = url.hostname;
const RDS_PORT = parseInt(url.port);
const RDS_DATABASE = url.pathname.slice(1); // Remove leading slash
const RDS_USERNAME = url.username;
const AWS_REGION = process.env.AWS_REGION!;
const AWS_ROLE_ARN = process.env.AWS_ROLE_ARN!;

export const dynamic = 'force-dynamic';

export async function GET() {
  let client: Client | null = null;
  
  try {
    // Generate IAM authentication token using OIDC
    const signer = new Signer({
      hostname: RDS_HOSTNAME,
      port: RDS_PORT,
      username: RDS_USERNAME,
      region: AWS_REGION,
      // Use the Vercel AWS SDK credentials provider for OIDC
      credentials: awsCredentialsProvider({
        roleArn: AWS_ROLE_ARN,
      }),
    });
    
    const token = await signer.getAuthToken();

    client = new Client({
      password: token,
      user: RDS_USERNAME,
      host: RDS_HOSTNAME,
      database: RDS_DATABASE,
      port: RDS_PORT,
      ssl: {
        rejectUnauthorized: false
      }
    });

    await client.connect();
    const { rows } = await client.query('SELECT * FROM my_table');
    return Response.json(rows);
  } catch (error) {
    console.error('Database error:', error);
    return Response.json({ error: 'Database connection failed' }, { status: 500 });
  } finally {
    if (client) {
      await client.end();
    }
  }
}