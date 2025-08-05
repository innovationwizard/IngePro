import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyName, companySlug, adminName, adminEmail, adminPassword } = body;

    // Test database connection
    console.log('Testing database connection...');
    
    try {
      const testQuery = await prisma.$queryRaw`SELECT 1 as test`;
      console.log('Database connection successful:', testQuery);
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      return NextResponse.json(
        { message: 'Database connection failed', details: dbError instanceof Error ? dbError.message : 'Unknown error' },
        { status: 500 }
      );
    }

    // Validation
    if (!companyName || !companySlug || !adminName || !adminEmail || !adminPassword) {
      return NextResponse.json(
        { message: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    // Test password hashing
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    console.log('Password hashed successfully');

    return NextResponse.json({
      message: 'Test successful',
      hashedPassword: hashedPassword.substring(0, 20) + '...',
      inputData: {
        companyName,
        companySlug,
        adminName,
        adminEmail,
        passwordLength: adminPassword.length
      }
    });

  } catch (error) {
    console.error('Test signup error:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 