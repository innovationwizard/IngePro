import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
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