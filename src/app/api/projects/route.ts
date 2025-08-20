// src/app/api/projects/route.ts
// Production projects route for CRUD operations

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

// GET - Get projects for the user's companies
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const prisma = await getPrisma()
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')

    let projects

    if (session.user?.role === 'SUPERUSER') {
      // SUPERUSER can see all projects
      projects = await prisma.project.findMany({
        include: {
          company: true,
          userProjects: {
            include: {
              user: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    } else if (session.user?.role === 'ADMIN') {
      // ADMIN can see projects from their companies
      const userTenants = await prisma.userTenant.findMany({
        where: {
          userId: session.user?.id,
          status: 'ACTIVE'
        },
        select: { companyId: true }
      })
      
      const adminCompanyIds = userTenants.map(ut => ut.companyId)
      
      projects = await prisma.project.findMany({
        where: {
          companyId: {
            in: adminCompanyIds
          },
          ...(companyId && { companyId })
        },
        include: {
          company: true,
          userProjects: {
            include: {
              user: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    } else {
      // WORKER/SUPERVISOR can see projects they're assigned to
      projects = await prisma.project.findMany({
        where: {
          userProjects: {
            some: {
              userId: session.user?.id,
              status: 'ACTIVE'
            }
          }
        },
        include: {
          company: true,
          userProjects: {
            include: {
              user: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    }

    return NextResponse.json({ projects })

  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
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

    // Check if admin has access to the company
    if (session.user?.role === 'ADMIN') {
      const userTenant = await prisma.userTenant.findFirst({
        where: {
          userId: session.user?.id,
          companyId: validatedData.companyId,
          status: 'ACTIVE'
        }
      })
      
      if (!userTenant) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    // Check if project name already exists in the company
    const existingProject = await prisma.project.findFirst({
      where: {
        name: validatedData.name,
        companyId: validatedData.companyId
      }
    })

    if (existingProject) {
      return NextResponse.json(
        { error: 'A project with this name already exists in this company' },
        { status: 409 }
      )
    }

    const project = await prisma.project.create({
      data: {
        name: validatedData.name,
        description: validatedData.description || '',
        status: validatedData.status,
        companyId: validatedData.companyId
      },
      include: {
        company: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Project created successfully',
      project
    })

  } catch (error) {
    console.error('Error creating project:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
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
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    )
  }
}
