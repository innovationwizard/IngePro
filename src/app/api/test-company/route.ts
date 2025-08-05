import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering - prevents build-time database connections
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  // Skip database connection during build
  if (process.env.SKIP_BUILD_STATIC_GENERATION === 'true') {
    return NextResponse.json({ 
      status: 'build-time-skip',
      message: 'Company creation skipped during build' 
    });
  }
  try {
    const body = await request.json();
    const { name, nameEs, slug } = body;

    // Create a company
    const company = await prisma.company.create({
      data: {
        name: name || 'Test Construction Company',
        nameEs: nameEs || 'Empresa de Construcción de Prueba',
        slug: slug || 'test-construction-company',
        status: 'ACTIVE'
      }
    });

    return NextResponse.json({
      message: 'Empresa creada exitosamente',
      company
    });

  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Error al crear empresa', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 