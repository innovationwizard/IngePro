import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getPrisma } from '@/lib/prisma'

export const runtime = 'nodejs'

// GET - Get current active worklog for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const prisma = await getPrisma()
    
    // Get person's company context
    let companyId = session.user?.companyId
    
    if (!companyId) {
      const personTenant = await prisma.personTenants.findFirst({
        where: {
          personId: session.user?.id,
          status: 'ACTIVE'
        },
        orderBy: { startDate: 'desc' }
      })
      companyId = personTenant?.companyId
    }

    console.log('DEBUG: Looking for worklog with companyId:', companyId, 'for user:', session.user?.id)

    // Find the current active worklog (no clockOut time)
    // Try to find by companyId first, then fallback to any active worklog for the person
    let currentWorkLog = await prisma.workLogs.findFirst({
      where: {
        personId: session.user.id,
        clockOut: null, // Active worklog (not clocked out)
        companyId: companyId
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            nameEs: true
          }
        },
        person: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // If no worklog found with companyId, try to find any active worklog for the person
    if (!currentWorkLog) {
      console.log('DEBUG: No worklog found with companyId, trying without company filter')
      currentWorkLog = await prisma.workLogs.findFirst({
        where: {
          personId: session.user.id,
          clockOut: null // Active worklog (not clocked out)
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              nameEs: true
            }
          },
          person: {
            select: {
              id: true,
              name: true,
              role: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    }

    console.log('DEBUG: Final worklog result:', currentWorkLog)

    return NextResponse.json({
      success: true,
      workLog: currentWorkLog
    })

  } catch (error) {
    console.error('Error fetching current worklog:', error)
    return NextResponse.json(
      { error: 'Failed to fetch current worklog' },
      { status: 500 }
    )
  }
}
