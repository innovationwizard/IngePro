import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getPrisma } from '@/lib/prisma'
import { z } from 'zod'

export const runtime = 'nodejs'

// Validation schema for updating person assignments
const updateAssignmentSchema = z.object({
  action: z.enum(['end-assignment', 'assign-company', 'assign-project']),
  assignmentId: z.string(),
  assignmentType: z.enum(['company', 'team', 'project']),
  companyId: z.string().optional(),
  projectId: z.string().optional(),
})

// GET - Get detailed person information
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
    const personId = params.id

    // Get person with all relationships
    const person = await prisma.people.findUnique({
      where: { id: personId },
      include: {
        personTenants: {
          include: { company: true },
          orderBy: { startDate: 'desc' }
        },
        personTeams: {
          include: { team: true },
          orderBy: { startDate: 'desc' }
        },
        personProjects: {
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

    if (!person) {
      return NextResponse.json({ error: 'Person not found' }, { status: 404 })
    }

    // Check if admin has access to this person's companies
    if (session.user?.role === 'ADMIN') {
      const adminPersonTenants = await prisma.personTenants.findMany({
        where: {
          personId: session.user?.id,
          status: 'ACTIVE'
        },
        select: { companyId: true }
      })
      
      const adminCompanyIds = adminPersonTenants.map(ut => ut.companyId)
      const personCompanyIds = person.personTenants.map(ut => ut.companyId)
      
      const hasAccess = personCompanyIds.some(id => adminCompanyIds.includes(id))
      
      if (!hasAccess) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    // Format current assignments
    const currentAssignments = {
      companies: person.personTenants
        .filter(ut => ut.status === 'ACTIVE' && !ut.endDate)
        .map(ut => ({
          id: ut.id,
          name: ut.company.name,
          startDate: ut.startDate,
          endDate: ut.endDate
        })),
      teams: person.personTeams
        .filter(ut => ut.status === 'ACTIVE' && !ut.endDate)
        .map(ut => ({
          id: ut.id,
          name: ut.team.name,
          startDate: ut.startDate,
          endDate: ut.endDate,
          company: 'N/A' // TODO: Get company from team
        })),
      projects: person.personProjects
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
      ...person.personTenants.map(ut => ({
        id: ut.id,
        name: ut.company.name,
        startDate: ut.startDate,
        endDate: ut.endDate
      })),
      ...person.personTeams.map(ut => ({
        id: ut.id,
        name: ut.team.name,
        startDate: ut.startDate,
        endDate: ut.endDate
      })),
      ...person.personProjects.map(up => ({
        id: up.id,
        name: up.project.name,
        startDate: up.startDate,
        endDate: up.endDate
      }))
    ].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())

    return NextResponse.json({
      person: {
        id: person.id,
        name: person.name,
        email: person.email,
        status: person.status,
        role: person.role,
        createdAt: person.createdAt,
        currentAssignments,
        history
      }
    })

  } catch (error) {
    console.error('Error fetching person details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch person details' },
      { status: 500 }
    )
  }
}

// PUT - Update person assignments (end assignment or assign to company)
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
    const personId = params.id

    if (validatedData.action === 'end-assignment') {
      // End an assignment
      if (validatedData.assignmentType === 'company') {
        await prisma.personTenants.update({
          where: { id: validatedData.assignmentId },
          data: { 
            endDate: new Date(),
            status: 'INACTIVE'
          }
        })
      } else if (validatedData.assignmentType === 'team') {
        await prisma.personTeams.update({
          where: { id: validatedData.assignmentId },
          data: { 
            endDate: new Date(),
            status: 'INACTIVE'
          }
        })
      } else if (validatedData.assignmentType === 'project') {
        await prisma.personProjects.update({
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
      // Assign person to a company
      if (!validatedData.companyId) {
        return NextResponse.json(
          { error: 'Company ID is required' },
          { status: 400 }
        )
      }

      // Check if admin has access to the target company
      if (session.user?.role === 'ADMIN') {
        const adminPersonTenants = await prisma.personTenants.findMany({
          where: {
            personId: session.user?.id,
            status: 'ACTIVE'
          },
          select: { companyId: true }
        })
        
        const adminCompanyIds = adminPersonTenants.map(ut => ut.companyId)
        
        if (!adminCompanyIds.includes(validatedData.companyId)) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
      }

      // Check if person is already assigned to this company
      const existingAssignment = await prisma.personTenants.findFirst({
        where: {
          personId: personId,
          companyId: validatedData.companyId,
          status: 'ACTIVE'
        }
      })

      if (existingAssignment) {
        return NextResponse.json(
          { error: 'Person is already assigned to this company' },
          { status: 409 }
        )
      }

      // Create new assignment
      await prisma.personTenants.create({
        data: {
          personId: personId,
          companyId: validatedData.companyId,
          startDate: new Date(),
          status: 'ACTIVE'
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Person assigned to company successfully'
      })
    } else if (validatedData.action === 'assign-project') {
      // Assign person to a project
      if (!validatedData.projectId) {
        return NextResponse.json(
          { error: 'Project ID is required' },
          { status: 400 }
        )
      }

      // Check if admin has access to the project's company
      if (session.user?.role === 'ADMIN') {
        const project = await prisma.projects.findUnique({
          where: { id: validatedData.projectId },
          select: { companyId: true }
        })
        
        if (!project) {
          return NextResponse.json({ error: 'Project not found' }, { status: 404 })
        }

        const personTenant = await prisma.personTenants.findFirst({
          where: {
            personId: session.user?.id,
            companyId: project.companyId,
            status: 'ACTIVE'
          }
        })
        
        if (!personTenant) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
      }

      // Check if person is already assigned to this project
      const existingAssignment = await prisma.personProjects.findFirst({
        where: {
          personId: personId,
          projectId: validatedData.projectId,
          status: 'ACTIVE'
        }
      })

      if (existingAssignment) {
        return NextResponse.json(
          { error: 'Person is already assigned to this project' },
          { status: 409 }
        )
      }

      // Create new assignment
      await prisma.personProjects.create({
        data: {
          personId: personId,
          projectId: validatedData.projectId,
          startDate: new Date(),
          status: 'ACTIVE'
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Person assigned to project successfully'
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Error updating person assignment:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update person assignment' },
      { status: 500 }
    )
  }
}
