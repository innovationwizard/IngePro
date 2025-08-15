// src/app/api/signup/route.ts

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getPrismaClient } from '@/lib/db';

// Force dynamic rendering - prevents build-time database connections
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const maxRetries = 3;
  const baseDelay = 1000; // 1 second base delay

  // Read body once at the beginning
  const body = await request.json();
  const { companyName, companySlug, adminName, adminEmail, adminPassword } = body;
  
  // Basic validation
  if (!companyName || !companySlug || !adminName || !adminEmail || !adminPassword) {
    return NextResponse.json(
      { error: 'Todos los campos son requeridos' },
      { status: 400 }
    );
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Get Prisma client with OIDC authentication
      const prisma = await getPrismaClient();
      
      // Hash password
      const hashedPassword = await bcrypt.hash(adminPassword, 12);

      // Database transaction
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

        // Create UserTenant relationship
        const userTenant = await tx.userTenant.create({
          data: {
            userId: user.id,
            companyId: company.id,
            role: 'ADMIN',
            status: 'ACTIVE',
            startDate: new Date(),
          }
        });

        return { company, user, userTenant };
      });
      
      // Close the Prisma client
      await prisma.$disconnect();
      
      return NextResponse.json({
        message: 'Cuenta creada exitosamente',
        tenant: {
          id: result.company.id,
          name: result.company.name,
          slug: result.company.slug
        },
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role
        }
      }, { status: 201 });
      
    } catch (error) {
      console.error(`Signup attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        return NextResponse.json({
          error: 'Error al crear cuenta',
          details: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }, { status: 500 });
      }
      
      // Exponential backoff: 1s, 2s, 4s
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

export async function GET() {
  try {
    const prisma = await getPrismaClient();
    await prisma.$queryRaw`SELECT 1 as test`;
    await prisma.$disconnect();
    
    return NextResponse.json({ 
      status: 'healthy',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({ 
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}