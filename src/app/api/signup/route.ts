// src/app/api/signup/route.ts
// Production signup route for creating users and companies

import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';
import { z } from 'zod';

export const runtime = 'nodejs';

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
    console.log('🚀 Starting signup process...');
    
    // Parse and validate request body
    const body = await request.json();
    console.log('📥 Received signup data:', body);
    
    const validatedData = signupSchema.parse(body);
    console.log('✅ Validated data:', validatedData);
    
    console.log('🔌 Attempting to get Prisma client...');
    // Get Prisma client with AWS Proxy
    const prisma = await getPrisma();
    console.log('🔌 Database connection established');
    
    console.log('🔍 Checking for existing company...');
    // Check if company slug already exists
    const existingCompany = await prisma.companies.findUnique({
      where: { slug: validatedData.companySlug }
    });
    
    if (existingCompany) {
      console.log('❌ Company slug already exists');
      return NextResponse.json(
        { error: 'Company slug already exists' },
        { status: 409 }
      );
    }
    console.log('✅ Company slug is available');
    
    console.log('🔍 Checking for existing person...');
    // Check if person email already exists
    const existingPerson = await prisma.people.findUnique({
      where: { email: validatedData.userEmail }
    });
    
    if (existingPerson) {
      console.log('❌ Person email already exists');
      return NextResponse.json(
        { error: 'Person email already exists' },
        { status: 409 }
      );
    }
    console.log('✅ Person email is available');
    
    console.log('🔐 Hashing password...');
    // Hash the password
    const hashedPassword = await hash(validatedData.userPassword, 12);
    console.log('✅ Password hashed');
    
    console.log('💾 Starting database transaction...');
    // Create company and user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create company
      const company = await tx.companies.create({
        data: {
          name: validatedData.companyName,
          nameEs: validatedData.companyNameEs,
          slug: validatedData.companySlug,
          status: 'ACTIVE',
        }
      });
      
      // Create person
      const person = await tx.people.create({
        data: {
          email: validatedData.userEmail,
          name: validatedData.userName,
          password: hashedPassword,
          role: validatedData.userRole,
          status: 'ACTIVE',
          companyId: company.id,
        }
      });
      
      // Create PersonTenants relationship
      await tx.personTenants.create({
        data: {
          personId: person.id,
          companyId: company.id,
          startDate: new Date(),
        }
      });
      
      // Create audit log
      await tx.auditLogs.create({
        data: {
          personId: person.id,
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
      
      return { company, person };
    });
    
    // Disconnect from database
    await prisma.$disconnect();
    
    // Return success response (without sensitive data)
    return NextResponse.json({
      success: true,
      message: 'Company and person created successfully',
      company: {
        id: result.company.id,
        name: result.company.name,
        slug: result.company.slug,
        status: result.company.status
      },
      person: {
        id: result.person.id,
        email: result.person.email,
        name: result.person.name,
        role: result.person.role
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