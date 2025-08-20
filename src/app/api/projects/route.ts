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
    console.log('GET /api/projects - Starting request')
    const session = await getServerSession(authOptions)
    
    if (!session) {
      console.log('GET /api/projects - No session found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.log('GET /api/projects - Session found for user:', session.user?.id, 'role:', session.user?.role)

    const prisma = await getPrisma()
    
    // Step 1: Determine current company context
    let currentCompanyId = session.user?.companyId
    
    console.log('GET /api/projects - Session company ID:', currentCompanyId)
    
    // If no company in session, try to get from UserTenant (most recent active)
    if (!currentCompanyId) {
      console.log('GET /api/projects - No company in session, checking UserTenant')
      const userTenant = await prisma.userTenant.findFirst({
        where: {
          userId: session.user?.id,
          status: 'ACTIVE'
        },
        orderBy: { createdAt: 'desc' },
        select: { companyId: true }
      })
      currentCompanyId = userTenant?.companyId
      console.log('GET /api/projects - UserTenant company ID:', currentCompanyId)
    }
    
    // Step 2: Get user's role for current company
    let userRole = 'WORKER'
    
    if (currentCompanyId) {
      const userTenant = await prisma.userTenant.findFirst({
        where: {
          userId: session.user?.id,
          companyId: currentCompanyId,
          status: 'ACTIVE'
        },
        select: { role: true }
      })
      
      userRole = userTenant?.role || 'WORKER'
      console.log('GET /api/projects - User role for company:', userRole)
    } else {
      console.log('GET /api/projects - No company context found, using session role:', session.user?.role)
      userRole = session.user?.role || 'WORKER'
    }
    
    // Step 3: Branch based on role
    let projects
    
    if (userRole === 'ADMIN' || userRole === 'SUPERUSER') {
      // ADMIN/SUPERUSER: Return all projects for the current company (or all if no company context)
      console.log('GET /api/projects - ADMIN/SUPERUSER: Fetching projects')
      const whereClause = currentCompanyId ? { companyId: currentCompanyId } : {}
      
      projects = await prisma.project.findMany({
        where: whereClause,
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
      // WORKER/SUPERVISOR: Return only projects they're assigned to
      console.log('GET /api/projects - WORKER/SUPERVISOR: Fetching assigned projects')
      const whereClause = currentCompanyId ? {
        companyId: currentCompanyId,
        userProjects: {
          some: {
            userId: session.user?.id,
            status: 'ACTIVE'
          }
        }
      } : {
        userProjects: {
          some: {
            userId: session.user?.id,
            status: 'ACTIVE'
          }
        }
      }
      
      projects = await prisma.project.findMany({
        where: whereClause,
        include: {
          company: true,
          userProjects: {
            where: {
              userId: session.user?.id,
              status: 'ACTIVE'
            },
            include: {
              user: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    }
    
    console.log('GET /api/projects - Successfully returning', projects.length, 'projects')
    return NextResponse.json({ projects })

  } catch (error) {
    console.error('Error fetching projects:', error)
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error')
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { error: 'Failed to fetch projects', details: error instanceof Error ? error.message : 'Unknown error' },
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
