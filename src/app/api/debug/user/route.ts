// src/app/api/debug/user/route.ts
// Debug endpoint to check and fix user company associations

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getPrisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['ADMIN', 'SUPERUSER'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const prisma = await getPrisma()
    
    // Get user's current company associations
    const personTenants = await prisma.personTenants.findMany({
      where: { 
        personId: session.user.id,
        status: 'ACTIVE'
      },
      include: {
        company: true
      },
      orderBy: { startDate: 'desc' }
    })

    // Get user's direct companyId (legacy field)
    const user = await prisma.people.findUnique({
      where: { id: session.user.id },
      select: { companyId: true }
    })

    return NextResponse.json({
      userId: session.user.id,
      userRole: session.user.role,
      sessionCompanyId: session.user.companyId,
      databaseCompanyId: user?.companyId,
      personTenants: personTenants.map(pt => ({
        id: pt.id,
        companyId: pt.companyId,
        companyName: pt.company.name,
        startDate: pt.startDate,
        status: pt.status
      }))
    })

  } catch (error) {
    console.error('Error in debug endpoint:', error)
    return NextResponse.json(
      { error: 'Failed to debug user' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['ADMIN', 'SUPERUSER'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, companyId } = body

    if (action === 'fix-association' && companyId) {
      const prisma = await getPrisma()
      
      // Check if association already exists
      const existingAssociation = await prisma.personTenants.findFirst({
        where: {
          personId: session.user.id,
          companyId: companyId,
          status: 'ACTIVE'
        }
      })

      if (!existingAssociation) {
        // Create the missing association
        const newAssociation = await prisma.personTenants.create({
          data: {
            personId: session.user.id,
            companyId: companyId,
            startDate: new Date(),
            status: 'ACTIVE'
          }
        })

        return NextResponse.json({
          success: true,
          message: 'Company association created',
          association: newAssociation
        })
      } else {
        return NextResponse.json({
          success: true,
          message: 'Association already exists',
          association: existingAssociation
        })
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Error in debug endpoint:', error)
    return NextResponse.json(
      { error: 'Failed to fix association' },
      { status: 500 }
    )
  }
}
