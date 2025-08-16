import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';
import { RDS } from '@aws-sdk/client-rds';

// Extract database connection details from DATABASE_URL
const DATABASE_URL = process.env.DATABASE_URL!;
const url = new URL(DATABASE_URL);

const RDS_HOSTNAME = url.hostname;
const RDS_PORT = parseInt(url.port);
const RDS_DATABASE = url.pathname.slice(1); // Remove leading slash
const RDS_USERNAME = url.username;
const AWS_REGION = 'us-east-2'; // Hardcoded region

// Initialize RDS client for token generation
const rdsClient = new RDS({ region: AWS_REGION });

export const dynamic = 'force-dynamic';

export async function GET() {
  let client: Client | null = null;
  
  try {
    // Generate IAM authentication token
    const token = await rdsClient.generateDbAuthToken({
      hostname: RDS_HOSTNAME,
      port: RDS_PORT,
      username: RDS_USERNAME,
    });

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