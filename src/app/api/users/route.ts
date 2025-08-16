// src/app/api/users/route.ts
// Production users route for CRUD operations

import { NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/db';
import { z } from 'zod';

// Validation schema for user data
const userSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['WORKER', 'SUPERVISOR', 'ADMIN']).default('WORKER'),
  companyId: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).default('ACTIVE'),
});

// GET - List all users
export async function GET() {
  try {
    const prisma = await getPrismaClient();
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        },
        _count: {
          select: {
            workLogs: true,
            userTenants: true,
            userTeams: true,
            userProjects: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    await prisma.$disconnect();
    
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST - Create a new user
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = userSchema.parse(body);
    
    const prisma = await getPrismaClient();
    
    // Check if user email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });
    
    if (existingUser) {
      await prisma.$disconnect();
      return NextResponse.json(
        { error: 'User email already exists' },
        { status: 409 }
      );
    }
    
    // Hash the password
    const { hash } = await import('bcryptjs');
    const hashedPassword = await hash(validatedData.password, 12);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        ...validatedData,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        companyId: true,
        createdAt: true,
        updatedAt: true,
      }
    });
    
    await prisma.$disconnect();
    
    return NextResponse.json({
      success: true,
      user
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating user:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
