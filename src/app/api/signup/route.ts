// src/app/api/signup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  let retryCount = 0;
  const maxRetries = 3;

  while (retryCount < maxRetries) {
    try {
      // Test database connection first
      await prisma.$queryRaw`SELECT 1 as test`;
      
      const body = await request.json();
      const { companyName, companySlug, adminName, adminEmail, adminPassword } = body;

      // Validation
      if (!companyName || !companySlug || !adminName || !adminEmail || !adminPassword) {
        return NextResponse.json(
          { error: 'Todos los campos son requeridos' },
          { status: 400 }
        );
      }

      // Check if company already exists
      const existingCompany = await prisma.company.findFirst({
        where: {
          OR: [
            { name: companyName },
            { slug: companySlug }
          ]
        }
      });

      if (existingCompany) {
        return NextResponse.json(
          { error: 'Ya existe una empresa con este nombre o identificador' },
          { status: 409 }
        );
      }

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: adminEmail }
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'Ya existe un usuario con este correo electrónico' },
          { status: 409 }
        );
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(adminPassword, 12);

      // Create company and admin user in transaction
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

        // Create user-tenant relationship
        await tx.userTenant.create({
          data: {
            userId: user.id,
            companyId: company.id,
            role: 'ADMIN',
            status: 'ACTIVE',
            startDate: new Date(),
          }
        });

        return { company, user };
      });

      return NextResponse.json({
        message: 'Cuenta creada exitosamente',
        tenant: {
          id: result.company.id,
          name: result.company.name,
          slug: result.company.slug,
          status: result.company.status
        },
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role,
          companyId: result.user.companyId
        }
      }, { status: 201 });

    } catch (error) {
      console.error(`Signup attempt ${retryCount + 1} failed:`, error);
      
      if (retryCount === maxRetries - 1) {
        // Final attempt failed
        if (error instanceof Error && error.message.includes('P1001')) {
          return NextResponse.json(
            { 
              error: 'Servicio temporalmente no disponible. Por favor, intente nuevamente en unos minutos.',
              code: 'DATABASE_CONNECTION_FAILED',
              retryAfter: 60
            },
            { 
              status: 503,
              headers: {
                'Retry-After': '60'
              }
            }
          );
        }

        return NextResponse.json(
          { 
            error: 'Error interno del servidor. Por favor, contacte soporte.',
            code: 'INTERNAL_SERVER_ERROR'
          },
          { status: 500 }
        );
      }

      retryCount++;
      // Wait 1 second before retry
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

// Add health check endpoint
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1 as test`;
    return NextResponse.json({ status: 'healthy', database: 'connected' });
  } catch (error) {
    return NextResponse.json(
      { status: 'unhealthy', database: 'disconnected', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 503 }
    );
  }
}