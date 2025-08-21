import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getPrisma } from '@/lib/prisma'

export const runtime = 'nodejs'

// POST - Approve or reject reorder request
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['ADMIN', 'SUPERVISOR'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, orderNumber, rejectionReason } = body

    if (!['approve', 'reject', 'order', 'receive'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be approve, reject, order, or receive' },
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

    // Get the reorder request
    const reorderRequest = await prisma.reorderRequest.findFirst({
      where: {
        id: params.id,
        material: {
          projectMaterials: {
            some: {
              project: {
                companyId: companyId
              }
            }
          }
        }
      },
      include: {
        material: true
      }
    })

    if (!reorderRequest) {
      return NextResponse.json(
        { error: 'Reorder request not found or not accessible' },
        { status: 404 }
      )
    }

    let updateData: any = {}

    switch (action) {
      case 'approve':
        if (reorderRequest.status !== 'PENDING') {
          return NextResponse.json(
            { error: 'Can only approve pending requests' },
            { status: 400 }
          )
        }
        updateData = {
          status: 'APPROVED',
          approvedBy: session.user?.id,
          approvedAt: new Date()
        }
        break

      case 'reject':
        if (reorderRequest.status !== 'PENDING') {
          return NextResponse.json(
            { error: 'Can only reject pending requests' },
            { status: 400 }
          )
        }
        if (!rejectionReason) {
          return NextResponse.json(
            { error: 'Rejection reason is required' },
            { status: 400 }
          )
        }
        updateData = {
          status: 'REJECTED',
          rejectedBy: session.user?.id,
          rejectedAt: new Date(),
          rejectionReason
        }
        break

      case 'order':
        if (reorderRequest.status !== 'APPROVED') {
          return NextResponse.json(
            { error: 'Can only order approved requests' },
            { status: 400 }
          )
        }
        if (!orderNumber) {
          return NextResponse.json(
            { error: 'Order number is required' },
            { status: 400 }
          )
        }
        updateData = {
          status: 'ORDERED',
          orderNumber,
          orderedAt: new Date()
        }
        break

      case 'receive':
        if (reorderRequest.status !== 'ORDERED') {
          return NextResponse.json(
            { error: 'Can only receive ordered requests' },
            { status: 400 }
          )
        }
        
        // Update material stock when receiving
        const newStock = reorderRequest.material.currentStock + reorderRequest.requestedQuantity
        
        updateData = {
          status: 'RECEIVED',
          receivedAt: new Date()
        }

        // Update both reorder request and material stock
        await prisma.$transaction([
          prisma.reorderRequest.update({
            where: { id: params.id },
            data: updateData
          }),
          prisma.material.update({
            where: { id: reorderRequest.materialId },
            data: { currentStock: newStock }
          }),
          prisma.inventoryMovement.create({
            data: {
              materialId: reorderRequest.materialId,
              type: 'PURCHASE',
              quantity: reorderRequest.requestedQuantity,
              reference: reorderRequest.orderNumber || 'Reorder',
              notes: `Received from reorder request ${params.id}`,
              recordedBy: session.user?.id
            }
          })
        ])

        return NextResponse.json({
          message: 'Reorder request received and stock updated successfully',
          newStock
        })
    }

    // Update reorder request for non-receive actions
    const updatedRequest = await prisma.reorderRequest.update({
      where: { id: params.id },
      data: updateData,
      include: {
        material: true
      }
    })

    return NextResponse.json({
      message: `Reorder request ${action}ed successfully`,
      reorderRequest: updatedRequest
    })

  } catch (error) {
    console.error('Error updating reorder request:', error)
    return NextResponse.json(
      { error: 'Failed to update reorder request' },
      { status: 500 }
    )
  }
}
