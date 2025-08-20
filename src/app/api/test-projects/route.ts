import { NextResponse } from 'next/server'
import { getPrisma } from '@/lib/prisma'

export async function GET() {
  try {
    console.log('TEST: Starting test projects endpoint')
    
    const prisma = await getPrisma()
    console.log('TEST: Prisma client obtained')
    
    // Simple query to test database connection
    const projects = await prisma.project.findMany({
      take: 10,
      include: {
        company: true
      }
    })
    
    console.log('TEST: Found projects:', projects.length)
    console.log('TEST: Projects:', projects.map(p => ({ id: p.id, name: p.name, company: p.company?.name })))
    
    return NextResponse.json({
      success: true,
      count: projects.length,
      projects: projects,
      debug: {
        message: 'Test endpoint working',
        timestamp: new Date().toISOString()
      }
    })
    
  } catch (error) {
    console.error('TEST: Error in test endpoint:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      debug: {
        message: 'Test endpoint failed',
        timestamp: new Date().toISOString()
      }
    }, { status: 500 })
  }
}
