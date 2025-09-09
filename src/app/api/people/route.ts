// src/app/api/people/route.ts
// Production people route for CRUD operations

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getPrisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'
import { z } from 'zod'
import crypto from 'crypto'

export const runtime = 'nodejs'

// Validation schema for creating people
const createPersonSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['WORKER', 'SUPERVISOR', 'ADMIN']),
  companyId: z.string().optional(), // Optional for cross-company invitations
})

// Validation schema for updating people
const updatePersonSchema = z.object({
  id: z.string(),
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
  role: z.enum(['WORKER', 'SUPERVISOR', 'ADMIN']).optional(),
})

// GET - List people for the admin's company
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['ADMIN', 'SUPERUSER', 'SUPERVISOR'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const prisma = await getPrisma()
    
    // Check if a specific companyId is requested
    const { searchParams } = new URL(request.url)
    const requestedCompanyId = searchParams.get('companyId')
    
    let targetCompanyIds: string[] = []
    
    if (requestedCompanyId) {
      // If a specific company is requested, check if user has access to it
      if (session.user?.role === 'SUPERUSER') {
        targetCompanyIds = [requestedCompanyId]
      } else if (session.user?.role === 'ADMIN') {
        const adminPersonTenant = await prisma.personTenants.findFirst({
          where: {
            personId: session.user?.id,
            companyId: requestedCompanyId,
            status: 'ACTIVE'
          }
        })
        if (adminPersonTenant) {
          targetCompanyIds = [requestedCompanyId]
        }
      } else if (session.user?.role === 'SUPERVISOR') {
        const supervisorPersonTenant = await prisma.personTenants.findFirst({
          where: {
            personId: session.user?.id,
            companyId: requestedCompanyId,
            status: 'ACTIVE'
          }
        })
        if (supervisorPersonTenant) {
          targetCompanyIds = [requestedCompanyId]
        }
      }
    } else {
      // If no specific company requested, get all companies user has access to
      if (session.user?.role === 'SUPERUSER') {
        // SUPERUSER can see all companies
        const allCompanies = await prisma.companies.findMany({
          where: { status: 'ACTIVE' },
          select: { id: true }
        })
        targetCompanyIds = allCompanies.map(c => c.id)
      } else {
        // ADMIN/SUPERVISOR see companies they're associated with
        const personTenants = await prisma.personTenants.findMany({
          where: {
            personId: session.user?.id,
            status: 'ACTIVE'
          },
          select: { companyId: true }
        })
        targetCompanyIds = personTenants.map(ut => ut.companyId)
        
        // If admin has no PersonTenants but has a companyId, use that
        if (targetCompanyIds.length === 0 && session.user?.companyId) {
          targetCompanyIds = [session.user.companyId]
        }
      }
    }
    
    if (targetCompanyIds.length === 0) {
      return NextResponse.json({ people: [] })
    }
    
    const people = await prisma.people.findMany({
      where: {
        OR: [
          // Check PersonTenants relationship
          {
            personTenants: {
              some: {
                companyId: { in: targetCompanyIds },
                status: 'ACTIVE'
              }
            }
          },
          // Also check direct companyId relationship
          {
            companyId: { in: targetCompanyIds }
          }
        ]
      },
      include: {
        personTenants: {
          where: { companyId: { in: targetCompanyIds } },
          include: { company: true }
        },
        personTeams: {
          where: { status: 'ACTIVE' },
          include: { team: true }
        },
        personProjects: {
          where: { status: 'ACTIVE' },
          include: { project: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const formattedPeople = people.map(person => {
      // Find the person tenant for the requested company (if specific company requested)
      const relevantPersonTenant = requestedCompanyId 
        ? person.personTenants.find(ut => ut.companyId === requestedCompanyId)
        : person.personTenants[0];
      
      const formattedPerson = {
        id: person.id,
        name: person.name,
        email: person.email,
        status: person.status,
        role: person.role,
        createdAt: person.createdAt,
        currentCompany: relevantPersonTenant?.company.name || 'Unknown',
        currentTeams: person.personTeams.map(ut => ut.team.name),
        currentProjects: person.personProjects.map(up => up.project.name),
        hasPassword: !!person.password
      };
      
      return formattedPerson;
    })

    return NextResponse.json({ people: formattedPeople })
  } catch (error) {
    console.error('Error fetching people:', error)
    return NextResponse.json(
      { error: 'Failed to fetch people' },
      { status: 500 }
    )
  }
}

// POST - Create new person with invitation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['ADMIN', 'SUPERUSER'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createPersonSchema.parse(body)
    
    const prisma = await getPrisma()
    
    // Get admin's current active company (most recent PersonTenant)
    const adminPersonTenant = await prisma.personTenants.findFirst({
      where: {
        personId: session.user?.id,
        status: 'ACTIVE'
      },
      orderBy: { startDate: 'desc' }
    })
    
    if (!adminPersonTenant) {
      return NextResponse.json(
        { error: 'Admin not associated with any company' },
        { status: 400 }
      )
    }
    
    const adminCompanyId = adminPersonTenant.companyId

    // Check if person already exists
    const existingPerson = await prisma.people.findUnique({
      where: { email: validatedData.email }
    })

    if (existingPerson) {
      return NextResponse.json(
        { error: 'Person with this email already exists' },
        { status: 409 }
      )
    }

    // Generate temporary password
    const tempPassword = crypto.randomBytes(8).toString('hex')
    const hashedPassword = await hash(tempPassword, 12)

    // Generate invitation token
    const invitationToken = crypto.randomBytes(32).toString('hex')
    const invitationExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    // Create person in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create person
      const person = await tx.people.create({
        data: {
          email: validatedData.email,
          name: validatedData.name,
          password: hashedPassword,
          role: validatedData.role,
          status: 'ACTIVE',
          companyId: adminCompanyId,
        }
      })

      // Create PersonTenant relationship
      await tx.personTenants.create({
        data: {
          personId: person.id,
          companyId: adminCompanyId,
          startDate: new Date(),
        }
      })

      // Create audit log
      await tx.auditLogs.create({
        data: {
          personId: session.user?.id || '',
          action: 'CREATE',
          entityType: 'PERSON',
          entityId: person.id,
          newValues: {
            email: person.email,
            name: person.name,
            role: validatedData.role,
            status: person.status
          }
        }
      })

      return { person, tempPassword, invitationToken }
    })

    // Generate invitation link
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const invitationLink = `${baseUrl}/auth/invitation?token=${result.invitationToken}&email=${validatedData.email}`

    // TODO: Send email invitation (implement email service)
    console.log('Invitation link:', invitationLink)
    console.log('Temporary password:', result.tempPassword)

    return NextResponse.json({
      success: true,
      message: 'Person created successfully',
      person: {
        id: result.person.id,
        name: result.person.name,
        email: result.person.email,
        role: validatedData.role,
        status: result.person.status
      },
      invitation: {
        link: invitationLink,
        temporaryPassword: result.tempPassword,
        expiresAt: invitationExpires
      }
    })

  } catch (error) {
    console.error('Error creating person:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create person' },
      { status: 500 }
    )
  }
}

// PUT - Update person
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['ADMIN', 'SUPERUSER'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updatePersonSchema.parse(body)
    
    const prisma = await getPrisma()

    // Update person
    const updatedPerson = await prisma.people.update({
      where: { id: validatedData.id },
      data: {
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.email && { email: validatedData.email }),
        ...(validatedData.status && { status: validatedData.status }),
        ...(validatedData.role && { role: validatedData.role }),
      }
    })

    // Role is now only stored in People table, no need to update PersonTenant

    // Create audit log
    await prisma.auditLogs.create({
      data: {
        personId: session.user?.id || '',
        action: 'UPDATE',
        entityType: 'PERSON',
        entityId: validatedData.id,
        newValues: validatedData
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Person updated successfully',
      person: {
        id: updatedPerson.id,
        name: updatedPerson.name,
        email: updatedPerson.email,
        role: updatedPerson.role,
        status: updatedPerson.status
      }
    })

  } catch (error) {
    console.error('Error updating person:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update person' },
      { status: 500 }
    )
  }
}
