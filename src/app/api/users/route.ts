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
    
    if (!session || !['ADMIN', 'SUPERUSER'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const prisma = await getPrisma()
    const companyId = session.user?.companyId

    // Get users for all companies the admin has access to
    const adminUserTenants = await prisma.userTenant.findMany({
      where: {
        userId: session.user?.id,
        status: 'ACTIVE'
      },
      select: { companyId: true }
    })
    
    const adminCompanyIds = adminUserTenants.map(ut => ut.companyId)
    
    const users = await prisma.user.findMany({
      where: {
        userTenants: {
          some: {
            companyId: { in: adminCompanyIds },
            status: 'ACTIVE'
          }
        }
      },
      include: {
        userTenants: {
          where: { companyId: companyId },
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

    const formattedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      status: user.status,
      role: user.userTenants[0]?.role || user.role,
      createdAt: user.createdAt,
      currentCompany: user.userTenants[0]?.company.name || 'Unknown',
      currentTeams: user.userTeams.map(ut => ut.team.name),
      currentProjects: user.userProjects.map(up => up.project.name),
      hasPassword: !!user.password
    }))

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
        { error: 'Validation failed', details: error.errors },
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
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}
