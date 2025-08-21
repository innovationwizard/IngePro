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
  companyId: z.string().min(1, 'Company ID is required'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'COMPLETED'])
})

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const prisma = await getPrisma();
    
    // Step 1: Determine company scope based on role
    let companyIds: string[] = [];
    
    if (session.user.role === 'SUPERUSER') {
      // SUPERUSER sees all projects - no company filter needed
      console.log('DEBUG: SUPERUSER - getting all projects');
    } else if (session.user.role === 'ADMIN') {
      // ADMIN sees projects from ALL their companies
      const userTenants = await prisma.userTenant.findMany({
        where: {
          userId: session.user.id,
          status: 'ACTIVE'
        },
        select: { companyId: true }
      });
      companyIds = userTenants.map(ut => ut.companyId);
      console.log('DEBUG: ADMIN - companies:', companyIds);
    } else {
      // SUPERVISOR/WORKER sees projects from their primary company
      const primaryCompanyId = session.user?.companyId;
      if (primaryCompanyId) {
        companyIds = [primaryCompanyId];
        console.log('DEBUG: SUPERVISOR/WORKER - company:', primaryCompanyId);
      }
    }
    
    // Step 2: Build query based on role
    let whereClause: any = {};
    
    if (companyIds.length > 0) {
      whereClause.companyId = { in: companyIds };
      console.log('DEBUG: Filtering by companies:', companyIds);
    } else if (session.user.role !== 'SUPERUSER') {
      // No companies found for non-SUPERUSER, return empty
      console.log('DEBUG: No companies found, returning empty');
      return NextResponse.json({
        projects: [],
        debug: { 
          message: 'No companies found',
          projectCount: 0,
          userRole: session.user.role,
          companyIds: companyIds
        }
      });
    }
    
    const projects = await prisma.project.findMany({
      where: whereClause,
      include: {
        company: true,
        users: {
          where: { status: 'ACTIVE' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true
              }
            }
          }
        }
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
        companyIds: companyIds
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
    const targetCompanyId = validatedData.companyId || currentCompanyId
    
    if (!targetCompanyId) {
      return NextResponse.json(
        { error: 'No company context available' },
        { status: 400 }
      )
    }
    
    // TypeScript guard to ensure targetCompanyId is string
    if (typeof targetCompanyId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid company context' },
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

    // Check if admin has access to both the current and new company (if changing)
    if (session.user?.role === 'ADMIN') {
      const project = await prisma.project.findUnique({
        where: { id },
        select: { companyId: true }
      })
      
      if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 })
      }

      // Check access to current company
      const currentCompanyAccess = await prisma.userTenant.findFirst({
        where: {
          userId: session.user?.id,
          companyId: project.companyId,
          status: 'ACTIVE'
        }
      })
      
      if (!currentCompanyAccess) {
        return NextResponse.json({ error: 'Unauthorized to current company' }, { status: 401 })
      }

      // If changing companies, check access to new company
      if (validatedData.companyId && validatedData.companyId !== project.companyId) {
        const newCompanyAccess = await prisma.userTenant.findFirst({
          where: {
            userId: session.user?.id,
            companyId: validatedData.companyId,
            status: 'ACTIVE'
          }
        })
        
        if (!newCompanyAccess) {
          return NextResponse.json({ error: 'Unauthorized to new company' }, { status: 401 })
        }
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
