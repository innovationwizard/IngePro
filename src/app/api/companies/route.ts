// src/app/api/companies/route.ts
// Production companies route for CRUD operations

import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { z } from 'zod';

export const runtime = 'nodejs';

// Validation schema for company data
const companySchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters'),
  nameEs: z.string().optional(),
  slug: z.string().min(2, 'Company slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Company slug must contain only lowercase letters, numbers, and hyphens'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'TRIAL']).default('ACTIVE'),
});

// GET - List all companies
export async function GET() {
  try {
    const prisma = await getPrisma();
    
    const companies = await prisma.company.findMany({
      select: {
        id: true,
        name: true,
        nameEs: true,
        slug: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            users: true,
            projects: true,
            teams: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    await prisma.$disconnect();
    
    return NextResponse.json({ companies });
  } catch (error) {
    console.error('Error fetching companies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch companies' },
      { status: 500 }
    );
  }
}

// POST - Create a new company
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = companySchema.parse(body);
    
    const prisma = await getPrisma();
    
    // Check if company slug already exists
    const existingCompany = await prisma.company.findUnique({
      where: { slug: validatedData.slug }
    });
    
    if (existingCompany) {
      await prisma.$disconnect();
      return NextResponse.json(
        { error: 'Company slug already exists' },
        { status: 409 }
      );
    }
    
    // Create company
    const company = await prisma.company.create({
      data: validatedData
    });
    
    await prisma.$disconnect();
    
    return NextResponse.json({
      success: true,
      company
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating company:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create company' },
      { status: 500 }
    );
  }
}
