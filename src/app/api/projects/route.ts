// src/app/api/projects/route.ts
// Production projects route for CRUD operations

import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { z } from 'zod';

export const runtime = 'nodejs';

// Validation schema for project data
const projectSchema = z.object({
  name: z.string().min(2, 'Project name must be at least 2 characters'),
  nameEs: z.string().optional(),
  description: z.string().optional(),
  descriptionEs: z.string().optional(),
  companyId: z.string().min(1, 'Company ID is required'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'COMPLETED', 'CANCELLED']).default('ACTIVE'),
});

// GET - List all projects
export async function GET() {
  try {
    const prisma = await getPrisma();
    
    const projects = await prisma.project.findMany({
      select: {
        id: true,
        name: true,
        nameEs: true,
        description: true,
        descriptionEs: true,
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
            users: true,
            teams: true,
            workLogs: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    await prisma.$disconnect();
    
    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// POST - Create a new project
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = projectSchema.parse(body);
    
    const prisma = await getPrisma();
    
    // Verify company exists
    const company = await prisma.company.findUnique({
      where: { id: validatedData.companyId }
    });
    
    if (!company) {
      await prisma.$disconnect();
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }
    
    // Create project
    const project = await prisma.project.create({
      data: validatedData,
      select: {
        id: true,
        name: true,
        nameEs: true,
        description: true,
        descriptionEs: true,
        status: true,
        companyId: true,
        createdAt: true,
        updatedAt: true,
      }
    });
    
    await prisma.$disconnect();
    
    return NextResponse.json({
      success: true,
      project
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating project:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
