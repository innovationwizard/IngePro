import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

// RDS configuration
const RDS_PORT = parseInt(process.env.RDS_PORT!);
const RDS_HOSTNAME = process.env.RDS_HOSTNAME!;
const RDS_DATABASE = process.env.RDS_DATABASE!;
const RDS_USERNAME = process.env.RDS_USERNAME!;
const RDS_PASSWORD = process.env.RDS_PASSWORD!;

export const dynamic = 'force-dynamic';

export async function GET() {
  const client = new Client({
    password: RDS_PASSWORD,
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