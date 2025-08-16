// src/app/api/signup/route.ts
// Production signup route for creating users and companies

import { NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/db';
import { hash } from 'bcryptjs';
import { z } from 'zod';

// Validation schema for signup data
const signupSchema = z.object({
  // Company information
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  companyNameEs: z.string().optional(),
  companySlug: z.string().min(2, 'Company slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Company slug must contain only lowercase letters, numbers, and hyphens'),
  
  // User information
  userEmail: z.string().email('Invalid email address'),
  userName: z.string().min(2, 'Name must be at least 2 characters'),
  userPassword: z.string().min(8, 'Password must be at least 8 characters'),
  
  // Optional fields
  userRole: z.enum(['WORKER', 'SUPERVISOR', 'ADMIN']).default('ADMIN'),
});

export async function POST(request: Request) {
  try {
    // Parse and validate request body
    const body = await request.json();
    console.log('📥 Received signup data:', body);
    
    const validatedData = signupSchema.parse(body);
    console.log('✅ Validated data:', validatedData);
    
    // Get Prisma client with IAM authentication
    const prisma = await getPrismaClient();
    console.log('🔌 Database connection established');
    
    // Check if company slug already exists
    const existingCompany = await prisma.company.findUnique({
      where: { slug: validatedData.companySlug }
    });
    
    if (existingCompany) {
      return NextResponse.json(
        { error: 'Company slug already exists' },
        { status: 409 }
      );
    }
    
    // Check if user email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.userEmail }
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'User email already exists' },
        { status: 409 }
      );
    }
    
    // Hash the password
    const hashedPassword = await hash(validatedData.userPassword, 12);
    
    // Create company and user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create company
      const company = await tx.company.create({
        data: {
          name: validatedData.companyName,
          nameEs: validatedData.companyNameEs,
          slug: validatedData.companySlug,
          status: 'ACTIVE',
        }
      });
      
      // Create user
      const user = await tx.user.create({
        data: {
          email: validatedData.userEmail,
          name: validatedData.userName,
          password: hashedPassword,
          role: validatedData.userRole,
          status: 'ACTIVE',
          companyId: company.id,
        }
      });
      
      // Create UserTenant relationship
      await tx.userTenant.create({
        data: {
          userId: user.id,
          companyId: company.id,
          startDate: new Date(),
        }
      });
      
      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'CREATE',
          entityType: 'COMPANY',
          entityId: company.id,
          newValues: JSON.stringify({
            name: company.name,
            slug: company.slug,
            status: company.status
          })
        }
      });
      
      return { company, user };
    });
    
    // Disconnect from database
    await prisma.$disconnect();
    
    // Return success response (without sensitive data)
    return NextResponse.json({
      success: true,
      message: 'Company and user created successfully',
      company: {
        id: result.company.id,
        name: result.company.name,
        slug: result.company.slug,
        status: result.company.status
      },
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role
      }
    });
    
  } catch (error) {
    console.error('Signup error:', error);
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      console.log('❌ Validation errors:', error.errors);
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    // Handle other errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: 'Failed to create an account', details: errorMessage },
      { status: 500 }
    );
  }
}