// src/app/api/signup/route.ts
// Replace the broken signup with the working signup-test logic

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Force dynamic rendering - prevents build-time database connections
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    console.log('Signup started');
    
    const body = await request.json();
    console.log('Body parsed:', body);
    
    const { companyName, companySlug, adminName, adminEmail, adminPassword } = body;
    
    // Basic validation
    if (!companyName || !companySlug || !adminName || !adminEmail || !adminPassword) {
      console.log('Validation failed');
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }
    
    console.log('Validation passed, starting database operations');
    
    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    console.log('Password hashed');

    // Database transaction
    const result = await prisma.$transaction(async (tx) => {
      console.log('Transaction started');
      
      // Create company
      const company = await tx.company.create({
        data: {
          name: companyName,
          nameEs: companyName,
          slug: companySlug,
          status: 'ACTIVE',
        }
      });
      console.log('Company created:', company.id);

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
      console.log('User created:', user.id);

      return { company, user };
    });
    
    console.log('Transaction completed successfully');
    
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
    console.error('Signup error:', error);
    return NextResponse.json({
      error: 'Error al crear cuenta',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1 as test`;
    return NextResponse.json({ 
      status: 'healthy',
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    return NextResponse.json({ 
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 503 });
  }
}