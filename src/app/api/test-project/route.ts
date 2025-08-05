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
      message: 'Project creation skipped during build' 
    });
  }
  try {
    const body = await request.json();
    const { name, nameEs, description, descriptionEs, companyId } = body;

    // Create a project
    const project = await prisma.project.create({
      data: {
        name: name || 'Test Project',
        nameEs: nameEs || 'Proyecto de Prueba',
        description: description || 'Test project description',
        descriptionEs: descriptionEs || 'Descripción del proyecto de prueba',
        companyId: companyId || null,
        status: 'ACTIVE'
      }
    });

    return NextResponse.json({
      message: 'Proyecto creado exitosamente',
      project
    });

  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Error al crear proyecto', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 