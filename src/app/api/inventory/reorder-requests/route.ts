import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getPrisma } from '@/lib/prisma'

export const runtime = 'nodejs'

// GET - Get reorder requests with filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['ADMIN', 'SUPERVISOR'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const materialId = searchParams.get('materialId')
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    const prisma = await getPrisma()
    
    // Get user's company context
    let companyId = session.user?.companyId
    
    if (!companyId) {
      const userTenant = await prisma.userTenant.findFirst({
        where: {
          userId: session.user?.id,
          status: 'ACTIVE'
        },
        orderBy: { startDate: 'desc' }
      })
      companyId = userTenant?.companyId
    }

    if (!companyId) {
      return NextResponse.json({ error: 'No company context available' }, { status: 400 })
    }

    // Build where clause
    const whereClause: any = {
      material: {
        projectMaterials: {
          some: {
            project: {
              companyId: companyId
            }
          }
        }
      }
    }

    if (materialId) {
      whereClause.materialId = materialId
    }

    if (status) {
      whereClause.status = status
    }

    if (startDate || endDate) {
      whereClause.createdAt = {}
      if (startDate) whereClause.createdAt.gte = new Date(startDate)
      if (endDate) whereClause.createdAt.lte = new Date(endDate)
    }

    const reorderRequests = await prisma.reorderRequest.findMany({
      where: whereClause,
      include: {
        material: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calculate summary statistics
    const summary = {
      totalRequests: reorderRequests.length,
      pendingRequests: reorderRequests.filter(req => req.status === 'PENDING').length,
      approvedRequests: reorderRequests.filter(req => req.status === 'APPROVED').length,
      orderedRequests: reorderRequests.filter(req => req.status === 'ORDERED').length,
      receivedRequests: reorderRequests.filter(req => req.status === 'RECEIVED').length,
      byStatus: reorderRequests.reduce((acc, req) => {
        if (!acc[req.status]) {
          acc[req.status] = {
            count: 0,
            totalQuantity: 0
          }
        }
        acc[req.status].count += 1
        acc[req.status].totalQuantity += req.requestedQuantity
        return acc
      }, {} as Record<string, any>)
    }

    return NextResponse.json({
      reorderRequests,
      summary
    })

  } catch (error) {
    console.error('Error fetching reorder requests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reorder requests' },
      { status: 500 }
    )
  }
}

// POST - Create new reorder request
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['ADMIN', 'SUPERVISOR'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { materialId, requestedQuantity, notes } = body

    if (!materialId || !requestedQuantity) {
      return NextResponse.json(
        { error: 'Missing required fields: materialId, requestedQuantity' },
        { status: 400 }
      )
    }

    const prisma = await getPrisma()
    
    // Get user's company context
    let companyId = session.user?.companyId
    
    if (!companyId) {
      const userTenant = await prisma.userTenant.findFirst({
        where: {
          userId: session.user?.id,
          status: 'ACTIVE'
        },
        orderBy: { startDate: 'desc' }
      })
      companyId = userTenant?.companyId
    }

    if (!companyId) {
      return NextResponse.json({ error: 'No company context available' }, { status: 400 })
    }

    // Verify material belongs to company
    const material = await prisma.material.findFirst({
      where: {
        id: materialId,
        projectMaterials: {
          some: {
            project: {
              companyId: companyId
            }
          }
        }
      }
    })

    if (!material) {
      return NextResponse.json(
        { error: 'Material not found or not accessible' },
        { status: 404 }
      )
    }

    // Check if there's already a pending request for this material
    const existingRequest = await prisma.reorderRequest.findFirst({
      where: {
        materialId,
        status: 'PENDING'
      }
    })

    if (existingRequest) {
      return NextResponse.json(
        { error: 'There is already a pending reorder request for this material' },
        { status: 400 }
      )
    }

    // Create reorder request
    const reorderRequest = await prisma.reorderRequest.create({
      data: {
        materialId,
        requestedQuantity,
        requestedBy: session.user?.id
      },
      include: {
        material: true
      }
    })

    return NextResponse.json({
      message: 'Reorder request created successfully',
      reorderRequest
    })

  } catch (error) {
    console.error('Error creating reorder request:', error)
    return NextResponse.json(
      { error: 'Failed to create reorder request' },
      { status: 500 }
    )
  }
}
