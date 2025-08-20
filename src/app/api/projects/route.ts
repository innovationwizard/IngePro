// src/app/api/projects/route.ts
// Projects route for CRUD operations

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getPrisma } from '@/lib/prisma'
import { z } from 'zod'

export const runtime = 'nodejs'

// Validation schemas
const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  companyId: z.string().min(1, 'Company ID is required'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'COMPLETED']).default('ACTIVE')
})

const updateProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'COMPLETED'])
})

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const prisma = await getPrisma();
    const { searchParams } = new URL(req.url);

    // 0) Resolve companyId from several fallbacks
    let companyId =
      searchParams.get('companyId') ||
      req.headers.get('x-company-id') ||
      (session as any).currentCompanyId || // if you store it in session
      null;

    // Fallback to user's primary company or first active membership
    if (!companyId) {
      const me = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { companyId: true }, // User.companyId exists and FKs to companies
      });
      companyId = me?.companyId ?? undefined;

      if (!companyId) {
        const firstMembership = await prisma.userTenant.findFirst({
          where: { userId: session.user.id, status: 'ACTIVE', endDate: null },
          orderBy: { startDate: 'desc' },
          select: { companyId: true, role: true },
        }); // UserTenant carries companyId/role per tenant
        companyId = firstMembership?.companyId;
      }
    }

    if (!companyId) return NextResponse.json({ error: 'No company in context' }, { status: 400 });

    // 1) Membership/role for this company (don't 500 if absent)
    const membership = await prisma.userTenant.findFirst({
      where: { userId: session.user.id, companyId, status: 'ACTIVE', endDate: null },
      select: { role: true },
    });

    // Global role exists on User; tenant role lives in UserTenant
    const userRow = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    }); // Roles: WORKER, SUPERVISOR, ADMIN, SUPERUSER
    const isSuperuser = userRow?.role === 'SUPERUSER';
    const isAdmin = isSuperuser || membership?.role === 'ADMIN';

    // 2) Common filters
    const q = searchParams.get('q')?.trim();
    const take = Math.min(Number(searchParams.get('take') ?? 20), 100);
    const cursor = searchParams.get('cursor') || undefined;

    const baseWhere: any = {
      companyId,
      status: 'ACTIVE', // ProjectStatus enum includes ACTIVE
      ...(q ? { name: { contains: q, mode: 'insensitive' as const } } : {}),
    };

    // 3) RBAC: admins see all company projects; others only assigned
    const where: any = isAdmin
      ? baseWhere
      : {
          ...baseWhere,
          userProjects: { some: { userId: session.user.id, status: 'ACTIVE' } },
        }; // UserProject gate; updatedAt is NOT NULL when inserting rows

    // 4) Pagination and query
    const args: any = { 
      where, 
      include: {
        company: true,
        userProjects: {
          include: {
            user: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }, 
      take: take + 1 
    };
    if (cursor) Object.assign(args, { cursor: { id: cursor }, skip: 1 });

    const rows = await prisma.project.findMany(args); // Projects are tied to companyId via FK

    const hasNext = rows.length > take;
    const data = hasNext ? rows.slice(0, take) : rows;
    const nextCursor = hasNext ? data[data.length - 1].id : null;

    return NextResponse.json({ projects: data, nextCursor, debug: { isAdmin, companyId } });

  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// POST - Create a new project
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['ADMIN', 'SUPERUSER'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createProjectSchema.parse(body)
    
    const prisma = await getPrisma()

    // Step 1: Determine current company context
    let currentCompanyId = session.user?.companyId
    
    // If no company in session, try to get from UserTenant (most recent active)
    if (!currentCompanyId) {
      const userTenant = await prisma.userTenant.findFirst({
        where: {
          userId: session.user?.id,
          status: 'ACTIVE'
        },
        orderBy: { createdAt: 'desc' },
        select: { companyId: true }
      })
      currentCompanyId = userTenant?.companyId
    }
    
    // Step 2: Get user's role for current company
    const userTenant = await prisma.userTenant.findFirst({
      where: {
        userId: session.user?.id,
        companyId: currentCompanyId,
        status: 'ACTIVE'
      },
      select: { role: true }
    })
    
    const userRole = userTenant?.role || 'WORKER'
    
    // Step 3: Check permissions
    if (userRole !== 'ADMIN' && userRole !== 'SUPERUSER') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }
    
    // Use current company context if no specific company provided
    const targetCompanyId = validatedData.companyId || currentCompanyId || ''
    
    if (!targetCompanyId) {
      return NextResponse.json(
        { error: 'No company context available' },
        { status: 400 }
      )
    }

    // Check if project name already exists in the company
    const existingProject = await prisma.project.findFirst({
      where: {
        name: validatedData.name,
        companyId: targetCompanyId
      }
    })

    if (existingProject) {
      return NextResponse.json(
        { error: 'A project with this name already exists in this company' },
        { status: 409 }
      )
    }

    console.log('POST /api/projects - Creating project for company:', targetCompanyId)
    
    const project = await prisma.project.create({
      data: {
        name: validatedData.name,
        description: validatedData.description || '',
        status: validatedData.status,
        companyId: targetCompanyId
      },
      include: {
        company: true
      }
    })
    
    console.log('POST /api/projects - Project created:', project.id, 'Company:', project.company.name)

    return NextResponse.json({
      success: true,
      message: 'Project created successfully',
      project
    })

  } catch (error) {
    console.error('Error creating project:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}

// PUT - Update a project
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['ADMIN', 'SUPERUSER'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updateData } = body
    const validatedData = updateProjectSchema.parse(updateData)
    
    const prisma = await getPrisma()

    // Check if admin has access to the project's company
    if (session.user?.role === 'ADMIN') {
      const project = await prisma.project.findUnique({
        where: { id },
        select: { companyId: true }
      })
      
      if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 })
      }

      const userTenant = await prisma.userTenant.findFirst({
        where: {
          userId: session.user?.id,
          companyId: project.companyId,
          status: 'ACTIVE'
        }
      })
      
      if (!userTenant) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: validatedData,
      include: {
        company: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Project updated successfully',
      project: updatedProject
    })

  } catch (error) {
    console.error('Error updating project:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    )
  }
}
