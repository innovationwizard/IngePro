// src/app/api/signup-test/route.ts
// Make this endpoint create REAL database records for login

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    console.log('Signup test started - creating REAL database records');
    
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
    
    console.log('Validation passed, starting REAL database operations');
    
    // Hash password for real database storage
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    console.log('Password hashed for database');

    // REAL Database transaction
    const result = await prisma.$transaction(async (tx) => {
      console.log('REAL database transaction started');
      
      // Check if company already exists
      const existingCompany = await tx.company.findFirst({
        where: {
          OR: [
            { name: companyName },
            { slug: companySlug }
          ]
        }
      });

      if (existingCompany) {
        throw new Error('Ya existe una empresa con este nombre o identificador');
      }

      // Check if user already exists
      const existingUser = await tx.user.findUnique({
        where: { email: adminEmail }
      });

      if (existingUser) {
        throw new Error('Ya existe un usuario con este correo electrónico');
      }
      
      // Create company in REAL database
      const company = await tx.company.create({
        data: {
          name: companyName,
          nameEs: companyName,
          slug: companySlug,
          status: 'ACTIVE',
        }
      });
      console.log('REAL company created:', company.id);

      // Create admin user in REAL database
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
      console.log('REAL user created:', user.id);

      return { company, user };
    });
    
    console.log('REAL database transaction completed successfully');
    
    return NextResponse.json({
      message: 'Cuenta creada exitosamente en base de datos real',
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
      },
      loginUrl: `https://ingepro.app/auth/login`
    }, { status: 201 });
    
  } catch (error) {
    console.error('REAL signup error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Error al crear cuenta',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'signup-test-healthy - creating REAL database records',
    timestamp: new Date().toISOString()
  });
}