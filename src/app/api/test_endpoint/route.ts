import { NextResponse } from 'next/server';
import { getDbUrl } from '@/lib/getDbUrl';
import { Pool } from 'pg';

export async function GET() {
  try {
    const url = await getDbUrl();
    const pool = new Pool({ connectionString: url });
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    await pool.end();
    return NextResponse.json(result.rows);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
