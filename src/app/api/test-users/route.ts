import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });

    const projects = await prisma.project.findMany({
      select: {
        id: true,
        name: true,
        nameEs: true
      }
    });

    return NextResponse.json({
      users,
      projects,
      userCount: users.length,
      projectCount: projects.length
    });

  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Error al obtener datos de la base de datos', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 