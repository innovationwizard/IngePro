import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getPrisma } from '@/lib/prisma'
import { z } from 'zod'

export const runtime = 'nodejs'

// Validation schema for updating user assignments
const updateAssignmentSchema = z.object({
  action: z.enum(['end-assignment', 'assign-company', 'assign-project']),
  assignmentId: z.string(),
  assignmentType: z.enum(['company', 'team', 'project']),
  companyId: z.string().optional(),
  projectId: z.string().optional(),
})

// GET - Get detailed user information
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['ADMIN', 'SUPERUSER'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const prisma = await getPrisma()
    const userId = params.id

    // Get user with all relationships
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userTenants: {
          include: { company: true },
          orderBy: { startDate: 'desc' }
        },
        userTeams: {
          include: { team: true },
          orderBy: { startDate: 'desc' }
        },
        userProjects: {
          include: { 
            project: {
              include: {
                company: true
              }
            }
          },
          orderBy: { startDate: 'desc' }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if admin has access to this user's companies
    if (session.user?.role === 'ADMIN') {
      const adminUserTenants = await prisma.userTenant.findMany({
        where: {
          userId: session.user?.id,
          status: 'ACTIVE'
        },
        select: { companyId: true }
      })
      
      const adminCompanyIds = adminUserTenants.map(ut => ut.companyId)
      const userCompanyIds = user.userTenants.map(ut => ut.companyId)
      
      const hasAccess = userCompanyIds.some(id => adminCompanyIds.includes(id))
      
      if (!hasAccess) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    // Format current assignments
    const currentAssignments = {
      companies: user.userTenants
        .filter(ut => ut.status === 'ACTIVE' && !ut.endDate)
        .map(ut => ({
          id: ut.id,
          name: ut.company.name,
          startDate: ut.startDate,
          endDate: ut.endDate
        })),
      teams: user.userTeams
        .filter(ut => ut.status === 'ACTIVE' && !ut.endDate)
        .map(ut => ({
          id: ut.id,
          name: ut.team.name,
          startDate: ut.startDate,
          endDate: ut.endDate,
          company: 'N/A' // TODO: Get company from team
        })),
      projects: user.userProjects
        .filter(up => up.status === 'ACTIVE' && !up.endDate)
        .map(up => ({
          id: up.id,
          name: up.project.name,
          startDate: up.startDate,
          endDate: up.endDate,
          company: up.project.company?.name || 'N/A'
        }))
    }

    // Format history (all assignments including ended ones)
    const history = [
      ...user.userTenants.map(ut => ({
        id: ut.id,
        name: ut.company.name,
        startDate: ut.startDate,
        endDate: ut.endDate
      })),
      ...user.userTeams.map(ut => ({
        id: ut.id,
        name: ut.team.name,
        startDate: ut.startDate,
        endDate: ut.endDate
      })),
      ...user.userProjects.map(up => ({
        id: up.id,
        name: up.project.name,
        startDate: up.startDate,
        endDate: up.endDate
      }))
    ].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status,
        role: user.role,
        createdAt: user.createdAt,
        currentAssignments,
        history
      }
    })

  } catch (error) {
    console.error('Error fetching user details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user details' },
      { status: 500 }
    )
  }
}

// PUT - Update user assignments (end assignment or assign to company)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['ADMIN', 'SUPERUSER'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateAssignmentSchema.parse(body)
    
    const prisma = await getPrisma()
    const userId = params.id

    if (validatedData.action === 'end-assignment') {
      // End an assignment
      if (validatedData.assignmentType === 'company') {
        await prisma.userTenant.update({
          where: { id: validatedData.assignmentId },
          data: { 
            endDate: new Date(),
            status: 'INACTIVE'
          }
        })
      } else if (validatedData.assignmentType === 'team') {
        await prisma.userTeam.update({
          where: { id: validatedData.assignmentId },
          data: { 
            endDate: new Date(),
            status: 'INACTIVE'
          }
        })
      } else if (validatedData.assignmentType === 'project') {
        await prisma.userProject.update({
          where: { id: validatedData.assignmentId },
          data: { 
            endDate: new Date(),
            status: 'INACTIVE'
          }
        })
      }

      return NextResponse.json({
        success: true,
        message: 'Assignment ended successfully'
      })

    } else if (validatedData.action === 'assign-company') {
      // Assign user to a company
      if (!validatedData.companyId) {
        return NextResponse.json(
          { error: 'Company ID is required' },
          { status: 400 }
        )
      }

      // Check if admin has access to the target company
      if (session.user?.role === 'ADMIN') {
        const adminUserTenants = await prisma.userTenant.findMany({
          where: {
            userId: session.user?.id,
            status: 'ACTIVE'
          },
          select: { companyId: true }
        })
        
        const adminCompanyIds = adminUserTenants.map(ut => ut.companyId)
        
        if (!adminCompanyIds.includes(validatedData.companyId)) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
      }

      // Check if user is already assigned to this company
      const existingAssignment = await prisma.userTenant.findFirst({
        where: {
          userId: userId,
          companyId: validatedData.companyId,
          status: 'ACTIVE'
        }
      })

      if (existingAssignment) {
        return NextResponse.json(
          { error: 'User is already assigned to this company' },
          { status: 409 }
        )
      }

      // Create new assignment
      await prisma.userTenant.create({
        data: {
          userId: userId,
          companyId: validatedData.companyId,
          startDate: new Date(),
          status: 'ACTIVE'
        }
      })

      return NextResponse.json({
        success: true,
        message: 'User assigned to company successfully'
      })
    } else if (validatedData.action === 'assign-project') {
      // Assign user to a project
      if (!validatedData.projectId) {
        return NextResponse.json(
          { error: 'Project ID is required' },
          { status: 400 }
        )
      }

      // Check if admin has access to the project's company
      if (session.user?.role === 'ADMIN') {
        const project = await prisma.project.findUnique({
          where: { id: validatedData.projectId },
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

      // Check if user is already assigned to this project
      const existingAssignment = await prisma.userProject.findFirst({
        where: {
          userId: userId,
          projectId: validatedData.projectId,
          status: 'ACTIVE'
        }
      })

      if (existingAssignment) {
        return NextResponse.json(
          { error: 'User is already assigned to this project' },
          { status: 409 }
        )
      }

      // Create new assignment
      await prisma.userProject.create({
        data: {
          userId: userId,
          projectId: validatedData.projectId,
          startDate: new Date(),
          status: 'ACTIVE'
        }
      })

      return NextResponse.json({
        success: true,
        message: 'User assigned to project successfully'
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Error updating user assignment:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update user assignment' },
      { status: 500 }
    )
  }
}
