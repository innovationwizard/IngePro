import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getPrisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 })
    }

    const prisma = await getPrisma()
    const email = session.user.email

    // Get user with all relationships
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        userTenants: {
          include: { company: true }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        companyId: user.companyId,
        userTenants: user.userTenants.map(ut => ({
          id: ut.id,
          role: ut.role,
          status: ut.status,
          companyId: ut.companyId,
          companyName: ut.company.name,
          companySlug: ut.company.slug,
          startDate: ut.startDate,
          endDate: ut.endDate
        }))
      }
    })

  } catch (error) {
    console.error('Debug user error:', error)
    return NextResponse.json(
      { error: 'Failed to get user debug info' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 })
    }

    const body = await request.json()
    const { action, role } = body

    const prisma = await getPrisma()
    const email = session.user.email

    if (action === 'fix-role') {
      // Update user's direct role
      const updatedUser = await prisma.user.update({
        where: { email },
        data: { role: role || 'ADMIN' }
      })

      // Update UserTenant role if exists
      await prisma.userTenant.updateMany({
        where: { 
          userId: updatedUser.id,
          status: 'ACTIVE'
        },
        data: { role: role || 'ADMIN' }
      })

      return NextResponse.json({
        success: true,
        message: `Role updated to ${role || 'ADMIN'}`,
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          role: updatedUser.role
        }
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Debug user error:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}
