import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';
import { Signer } from '@aws-sdk/rds-signer';
import { awsCredentialsProvider } from '@vercel/functions/oidc';

// Extract database connection details from environment variables
const RDS_HOSTNAME = process.env.DB_HOST!;
const RDS_PORT = parseInt(process.env.DB_PORT || '5432');
const RDS_DATABASE = process.env.DB_NAME!;
const RDS_USERNAME = process.env.DB_USER!;
const AWS_REGION = process.env.AWS_REGION!;
const AWS_ROLE_ARN = process.env.AWS_ROLE_ARN!;

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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