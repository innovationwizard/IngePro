import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getPrisma } from '@/lib/prisma'

export const runtime = 'nodejs'

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
          include: { project: true },
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
          role: ut.role,
          startDate: ut.startDate,
          endDate: ut.endDate
        })),
      teams: user.userTeams
        .filter(ut => ut.status === 'ACTIVE' && !ut.endDate)
        .map(ut => ({
          id: ut.id,
          name: ut.team.name,
          role: 'MEMBER',
          startDate: ut.startDate,
          endDate: ut.endDate,
          company: 'N/A' // TODO: Get company from team
        })),
      projects: user.userProjects
        .filter(up => up.status === 'ACTIVE' && !up.endDate)
        .map(up => ({
          id: up.id,
          name: up.project.name,
          role: up.role,
          startDate: up.startDate,
          endDate: up.endDate,
          company: 'N/A' // TODO: Get company from project
        }))
    }

    // Format history (all assignments including ended ones)
    const history = [
      ...user.userTenants.map(ut => ({
        id: ut.id,
        name: ut.company.name,
        role: ut.role,
        startDate: ut.startDate,
        endDate: ut.endDate
      })),
      ...user.userTeams.map(ut => ({
        id: ut.id,
        name: ut.team.name,
        role: 'MEMBER',
        startDate: ut.startDate,
        endDate: ut.endDate
      })),
      ...user.userProjects.map(up => ({
        id: up.id,
        name: up.project.name,
        role: up.role,
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
