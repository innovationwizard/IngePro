// src/app/api/users/route.ts
// Production users route for CRUD operations

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getPrisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'
import { z } from 'zod'
import crypto from 'crypto'

export const runtime = 'nodejs'

// Validation schema for creating users
const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['WORKER', 'SUPERVISOR', 'ADMIN']),
  companyId: z.string().optional(), // Optional for cross-company invitations
})

// Validation schema for updating users
const updateUserSchema = z.object({
  id: z.string(),
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
  role: z.enum(['WORKER', 'SUPERVISOR', 'ADMIN']).optional(),
})

// GET - List users for the admin's company
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
        const adminUserTenant = await prisma.userTenant.findFirst({
          where: {
            userId: session.user?.id,
            companyId: requestedCompanyId,
            role: 'ADMIN',
            status: 'ACTIVE'
          }
        })
        if (adminUserTenant) {
          targetCompanyIds = [requestedCompanyId]
        }
      } else if (session.user?.role === 'SUPERVISOR') {
        const supervisorUserTenant = await prisma.userTenant.findFirst({
          where: {
            userId: session.user?.id,
            companyId: requestedCompanyId,
            status: 'ACTIVE'
          }
        })
        if (supervisorUserTenant) {
          targetCompanyIds = [requestedCompanyId]
        }
      }
    } else {
      // If no specific company requested, get all companies user has access to
      if (session.user?.role === 'SUPERUSER') {
        // SUPERUSER can see all companies
        const allCompanies = await prisma.company.findMany({
          where: { status: 'ACTIVE' },
          select: { id: true }
        })
        targetCompanyIds = allCompanies.map(c => c.id)
      } else {
        // ADMIN/SUPERVISOR see companies they're associated with
        const userTenants = await prisma.userTenant.findMany({
          where: {
            userId: session.user?.id,
            status: 'ACTIVE'
          },
          select: { companyId: true }
        })
        targetCompanyIds = userTenants.map(ut => ut.companyId)
      }
    }
    
    if (targetCompanyIds.length === 0) {
      console.log('No target company IDs found, returning empty users array');
      return NextResponse.json({ users: [] })
    }
    
    console.log('Target company IDs:', targetCompanyIds);
    
    const users = await prisma.user.findMany({
      where: {
        userTenants: {
          some: {
            companyId: { in: targetCompanyIds },
            status: 'ACTIVE'
          }
        }
      },
      include: {
        userTenants: {
          where: { companyId: { in: targetCompanyIds } },
          include: { company: true }
        },
        userTeams: {
          where: { status: 'ACTIVE' },
          include: { team: true }
        },
        userProjects: {
          where: { status: 'ACTIVE' },
          include: { project: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    console.log('Found users:', users.length);
    console.log('Users with userTenants:', users.map(u => ({ id: u.id, name: u.name, userTenants: u.userTenants.length })));

    const formattedUsers = users.map(user => {
      // Find the user tenant for the requested company (if specific company requested)
      const relevantUserTenant = requestedCompanyId 
        ? user.userTenants.find(ut => ut.companyId === requestedCompanyId)
        : user.userTenants[0];
      
      const formattedUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status,
        role: relevantUserTenant?.role || user.role,
        createdAt: user.createdAt,
        currentCompany: relevantUserTenant?.company.name || 'Unknown',
        currentTeams: user.userTeams.map(ut => ut.team.name),
        currentProjects: user.userProjects.map(up => up.project.name),
        hasPassword: !!user.password
      };
      
      console.log('Formatted user:', {
        id: formattedUser.id,
        name: formattedUser.name,
        role: formattedUser.role,
        userTenants: user.userTenants.map(ut => ({ companyId: ut.companyId, role: ut.role }))
      });
      
      return formattedUser;
    })
    
    console.log('Final formatted users:', formattedUsers.map(u => ({ id: u.id, name: u.name, role: u.role })));

    return NextResponse.json({ users: formattedUsers })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

// POST - Create new user with invitation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['ADMIN', 'SUPERUSER'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createUserSchema.parse(body)
    
    const prisma = await getPrisma()
    
    // Get admin's current active company (most recent UserTenant)
    const adminUserTenant = await prisma.userTenant.findFirst({
      where: {
        userId: session.user?.id,
        status: 'ACTIVE'
      },
      orderBy: { startDate: 'desc' }
    })
    
    if (!adminUserTenant) {
      return NextResponse.json(
        { error: 'Admin not associated with any company' },
        { status: 400 }
      )
    }
    
    const adminCompanyId = adminUserTenant.companyId

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Generate temporary password
    const tempPassword = crypto.randomBytes(8).toString('hex')
    const hashedPassword = await hash(tempPassword, 12)

    // Generate invitation token
    const invitationToken = crypto.randomBytes(32).toString('hex')
    const invitationExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    // Create user in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: validatedData.email,
          name: validatedData.name,
          password: hashedPassword,
          role: validatedData.role,
          status: 'ACTIVE',
          companyId: adminCompanyId,
        }
      })

      // Create UserTenant relationship
      await tx.userTenant.create({
        data: {
          userId: user.id,
          companyId: adminCompanyId,
          role: validatedData.role,
          startDate: new Date(),
        }
      })

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: session.user?.id || '',
          action: 'CREATE',
          entityType: 'USER',
          entityId: user.id,
          newValues: JSON.stringify({
            email: user.email,
            name: user.name,
            role: validatedData.role,
            status: user.status
          })
        }
      })

      return { user, tempPassword, invitationToken }
    })

    // Generate invitation link
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const invitationLink = `${baseUrl}/auth/invitation?token=${result.invitationToken}&email=${validatedData.email}`

    // TODO: Send email invitation (implement email service)
    console.log('Invitation link:', invitationLink)
    console.log('Temporary password:', result.tempPassword)

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: validatedData.role,
        status: result.user.status
      },
      invitation: {
        link: invitationLink,
        temporaryPassword: result.tempPassword,
        expiresAt: invitationExpires
      }
    })

  } catch (error) {
    console.error('Error creating user:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}

// PUT - Update user
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['ADMIN', 'SUPERUSER'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateUserSchema.parse(body)
    
    const prisma = await getPrisma()

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: validatedData.id },
      data: {
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.email && { email: validatedData.email }),
        ...(validatedData.status && { status: validatedData.status }),
        ...(validatedData.role && { role: validatedData.role }),
      }
    })

    // Update UserTenant role if role changed
    if (validatedData.role) {
      await prisma.userTenant.updateMany({
        where: { 
          userId: validatedData.id,
          companyId: session.user?.companyId,
          status: 'ACTIVE'
        },
        data: { role: validatedData.role }
      })
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user?.id || '',
        action: 'UPDATE',
        entityType: 'USER',
        entityId: validatedData.id,
        newValues: JSON.stringify(validatedData)
      }
    })

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        status: updatedUser.status
      }
    })

  } catch (error) {
    console.error('Error updating user:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}
