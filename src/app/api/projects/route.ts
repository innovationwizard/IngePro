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

// GET /api/projects?companyId=...&q=...&cursor=...&take=20
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const prisma = await getPrisma();
    const { searchParams } = new URL(req.url);

    const companyId = searchParams.get('companyId') || req.headers.get('x-company-id');
    if (!companyId) {
      return NextResponse.json({ error: 'companyId required' }, { status: 400 });
    }

    const q = searchParams.get('q')?.trim();
    const take = Math.min(Number(searchParams.get('take') ?? 20), 100);
    const cursor = searchParams.get('cursor') || undefined;

    // 1) Read membership/role from UserTenant
    const membership = await prisma.userTenant.findFirst({
      where: {
        userId: session.user.id,
        companyId,
        status: 'ACTIVE',
        endDate: null,
      },
      select: { role: true },
    });

    // SUPERUSER shortcut (if you keep a global role on the user)
    const isSuperuser = session.user.role === 'SUPERUSER';
    const isAdmin = isSuperuser || membership?.role === 'ADMIN';

    // Common filters
    const baseWhere: any = {
      companyId,
      status: 'ACTIVE',
      ...(q ? { name: { contains: q, mode: 'insensitive' as const } } : {}),
    };

    // 2) Branch by role
    let where: any;
    if (isAdmin) {
      // Admins: all projects in the company
      where = baseWhere;
    } else {
      // Non-admins: only assigned projects
      // Minimal path: through UserProject
      where = {
        ...baseWhere,
        userProjects: {
          some: {
            userId: session.user.id,
            status: 'ACTIVE',
          },
        },
      };
    }

    // 3) Pagination
    const queryArgs: any = {
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
      take: take + 1,
    };
    if (cursor) queryArgs.cursor = { id: cursor };
    if (cursor) queryArgs.skip = 1;

    const rows = await prisma.project.findMany(queryArgs);

    const hasNextPage = rows.length > take;
    const data = hasNextPage ? rows.slice(0, take) : rows;
    const nextCursor = hasNextPage ? data[data.length - 1].id : null;

    return NextResponse.json({ projects: data, nextCursor });

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
