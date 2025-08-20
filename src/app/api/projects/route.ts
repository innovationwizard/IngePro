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
    
    // Step 1: Get company context from session or UserTenant
    let companyId = session.user?.companyId;
    
    if (!companyId) {
      const userTenant = await prisma.userTenant.findFirst({
        where: {
          userId: session.user.id,
          status: 'ACTIVE'
        },
        orderBy: { startDate: 'desc' },
        select: { companyId: true }
      });
      companyId = userTenant?.companyId;
    }
    
    console.log('DEBUG: Company context:', companyId, 'User role:', session.user.role);
    
    // Step 2: Build query based on role
    let whereClause: any = {};
    
    if (session.user.role === 'SUPERUSER') {
      // SUPERUSER sees all projects
      console.log('DEBUG: SUPERUSER - getting all projects');
    } else if (companyId) {
      // ADMIN and SUPERVISOR see projects from their company
      whereClause.companyId = companyId;
      console.log('DEBUG: Company-scoped query for company:', companyId);
    } else {
      // No company context, return empty
      console.log('DEBUG: No company context, returning empty');
      return NextResponse.json({
        projects: [],
        debug: { 
          message: 'No company context',
          projectCount: 0,
          userRole: session.user.role
        }
      });
    }
    
    const projects = await prisma.project.findMany({
      where: whereClause,
      include: {
        company: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('DEBUG: Found projects:', projects.length);
    
    return NextResponse.json({
      projects: projects,
      debug: { 
        message: 'Role-based query working',
        projectCount: projects.length,
        userRole: session.user.role,
        companyId: companyId
      }
    });

  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects', details: error instanceof Error ? error.message : 'Unknown error' },
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
