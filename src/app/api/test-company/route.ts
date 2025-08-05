import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
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