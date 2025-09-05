import { NextResponse } from 'next/server';
import { getDbConfig } from '@/lib/getDbConfig';
import { Pool } from 'pg';

export async function GET() {
  try {
    const config = await getDbConfig();
    const pool = new Pool(config);
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    await pool.end();
    return NextResponse.json(result.rows);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
