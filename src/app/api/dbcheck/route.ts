import { NextResponse } from 'next/server'
import { getPrisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const prisma = await getPrisma()
    
    // Get database connection info
    const info = await prisma.$queryRawUnsafe(`
      SELECT 
        current_database() as db, 
        current_user as usr, 
        current_schema() as sch, 
        inet_server_addr() as host, 
        inet_server_port() as port
    `)
    
    // Check if deleted_at columns exist
    const cols = await prisma.$queryRawUnsafe(`
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name IN ('materials','tasks')
        AND column_name IN ('deleted_at','deleted_by')
      ORDER BY 1,2
    `)
    
    // Check indexes
    const indexes = await prisma.$queryRawUnsafe(`
      SELECT indexname, tablename, indexdef
      FROM pg_indexes
      WHERE tablename IN ('materials', 'tasks')
        AND indexname LIKE '%deleted%'
      ORDER BY 1
    `)
    
    return NextResponse.json({ 
      info, 
      columns: cols,
      indexes,
      timestamp: new Date().toISOString()
    }, { status: 200 })
    
  } catch (error) {
    console.error('DB check error:', error)
    return NextResponse.json({ 
      error: 'Database check failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
