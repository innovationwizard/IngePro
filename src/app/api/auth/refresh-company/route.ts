// src/app/api/auth/refresh-company/route.ts
// Simple endpoint to refresh admin's company association

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getPrisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const prisma = await getPrisma()
    
    // Get the admin's most recent active company association
    const activePersonTenant = await prisma.personTenants.findFirst({
      where: {
        personId: session.user.id,
        status: 'ACTIVE'
      },
      orderBy: { startDate: 'desc' },
      include: { company: true }
    })

    if (!activePersonTenant) {
      return NextResponse.json({ 
        error: 'No active company association found' 
      }, { status: 404 })
    }

    // Update the admin's direct companyId to match their active PersonTenant
    await prisma.people.update({
      where: { id: session.user.id },
      data: { companyId: activePersonTenant.companyId }
    })

    return NextResponse.json({
      success: true,
      message: 'Company association updated',
      company: {
        id: activePersonTenant.companyId,
        name: activePersonTenant.company.name,
        slug: activePersonTenant.company.slug
      }
    })

  } catch (error) {
    console.error('Error refreshing company association:', error)
    return NextResponse.json(
      { error: 'Failed to refresh company association' },
      { status: 500 }
    )
  }
}
