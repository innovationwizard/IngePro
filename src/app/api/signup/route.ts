// src/app/api/signup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyName, companySlug, adminName, adminEmail, adminPassword } = body;

    // Validation
    if (!companyName || !companySlug || !adminName || !adminEmail || !adminPassword) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    // Simple creation without complex checks for now
    const result = await prisma.$transaction(async (tx) => {
      // Create company
      const company = await tx.company.create({
        data: {
          name: companyName,
          nameEs: companyName,
          slug: companySlug,
          status: 'ACTIVE',
        }
      });

      // Create admin user
      const user = await tx.user.create({
        data: {
          email: adminEmail,
          name: adminName,
          password: hashedPassword,
          role: 'ADMIN',
          status: 'ACTIVE',
          companyId: company.id,
        }
      });

      return { company, user };
    });

    return NextResponse.json({
      message: 'Cuenta creada exitosamente',
      tenant: {
        id: result.company.id,
        name: result.company.name,
        slug: result.company.slug
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Signup error:', error);
    
    return NextResponse.json(
      { 
        error: 'Servicio temporalmente no disponible. Por favor, intente nuevamente en unos minutos.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Health check
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1 as test`;
    return NextResponse.json({ status: 'healthy' });
  } catch (error) {
    return NextResponse.json({ status: 'unhealthy' }, { status: 503 });
  }
}