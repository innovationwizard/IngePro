import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { work, project, thickness, sector, level, quantity, unit, materials, notes } = body;

    // Validate required fields
    if (!work || !project) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos: trabajo y proyecto' },
        { status: 400 }
      );
    }

    // Create work log in your existing database
    const workLog = await prisma.workLog.create({
      data: {
        work,
        project,
        thickness: thickness || null,
        sector: sector || null,
        level: level || null,
        quantity: quantity ? parseInt(quantity) : null,
        unit: unit || null,
        notes: notes || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      id: workLog.id,
      message: 'Registro guardado exitosamente',
      data: workLog
    });

  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Error al guardar en base de datos' },
      { status: 500 }
    );
  }
}