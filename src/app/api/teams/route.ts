// src/app/api/teams/route.ts
// Production teams route for CRUD operations

import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { z } from 'zod';

export const runtime = 'nodejs';

// Validation schema for team data
const teamSchema = z.object({
  name: z.string().min(2, 'Team name must be at least 2 characters'),
  nameEs: z.string().optional(),
  description: z.string().optional(),
  companyId: z.string().min(1, 'Company ID is required'),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

// GET - List all teams
export async function GET() {
  try {
    const prisma = await getPrisma();
    
    const teams = await prisma.teams.findMany({
      select: {
        id: true,
        name: true,
        nameEs: true,
        description: true,
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
            people: true,
            projects: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    await prisma.$disconnect();
    
    return NextResponse.json({ teams });
  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teams' },
      { status: 500 }
    );
  }
}

// POST - Create a new team
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = teamSchema.parse(body);
    
    const prisma = await getPrisma();
    
    // Verify company exists
    const company = await prisma.companies.findUnique({
      where: { id: validatedData.companyId }
    });
    
    if (!company) {
      await prisma.$disconnect();
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }
    
    // Create team
    const team = await prisma.teams.create({
      data: validatedData,
      select: {
        id: true,
        name: true,
        nameEs: true,
        description: true,
        status: true,
        companyId: true,
        createdAt: true,
        updatedAt: true,
      }
    });
    
    await prisma.$disconnect();
    
    return NextResponse.json({
      success: true,
      team
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating team:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create team' },
      { status: 500 }
    );
  }
}
