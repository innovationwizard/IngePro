import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';
import { Signer } from '@aws-sdk/rds-signer';
import { fromEnv } from '@aws-sdk/credential-providers';

// RDS configuration
const RDS_PORT = parseInt(process.env.RDS_PORT!);
const RDS_HOSTNAME = process.env.RDS_HOSTNAME!;
const RDS_DATABASE = process.env.RDS_DATABASE!;
const RDS_USERNAME = process.env.RDS_USERNAME!;
const AWS_REGION = process.env.AWS_REGION!;

// Initialize the RDS Signer with IAM user credentials
const signer = new Signer({
  credentials: fromEnv(), // This will use AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
  region: AWS_REGION,
  port: RDS_PORT,
  hostname: RDS_HOSTNAME,
  username: RDS_USERNAME,
});

export const dynamic = 'force-dynamic';

export async function GET() {
  const client = new Client({
    password: signer.getAuthToken,
    user: RDS_USERNAME,
    host: RDS_HOSTNAME,
    database: RDS_DATABASE,
    port: RDS_PORT,
  });

  try {
    await client.connect();
    const { rows } = await client.query('SELECT * FROM my_table');
    return Response.json(rows);
  } catch (error) {
    console.error('Database error:', error);
    return Response.json({ error: 'Database connection failed' }, { status: 500 });
  } finally {
    await client.end();
  }
}