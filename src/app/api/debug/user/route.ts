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

    // Get person with all relationships
    const person = await prisma.people.findUnique({
      where: { email },
      include: {
        personTenants: {
          include: { company: true }
        }
      }
    })

    if (!person) {
      return NextResponse.json({ error: 'Person not found' }, { status: 404 })
    }

    return NextResponse.json({
      person: {
        id: person.id,
        email: person.email,
        name: person.name,
        role: person.role,
        status: person.status,
        companyId: person.companyId,
        personTenants: person.personTenants.map(pt => ({
          id: pt.id,
          role: pt.role,
          status: pt.status,
          companyId: pt.companyId,
          companyName: pt.company.name,
          companySlug: pt.company.slug,
          startDate: pt.startDate,
          endDate: pt.endDate
        }))
      }
    })

  } catch (error) {
    console.error('Debug person error:', error)
    return NextResponse.json(
      { error: 'Failed to get person debug info' },
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
      // Update person's direct role
      const updatedPerson = await prisma.people.update({
        where: { email },
        data: { role: role || 'ADMIN' }
      })

              // PersonTenants no longer stores role
      await prisma.personTenants.updateMany({
        where: { 
          personId: updatedPerson.id,
          status: 'ACTIVE'
        },
        data: { role: role || 'ADMIN' }
      })

      return NextResponse.json({
        success: true,
        message: `Role updated to ${role || 'ADMIN'}`,
        person: {
          id: updatedPerson.id,
          email: updatedPerson.email,
          name: updatedPerson.name,
          role: updatedPerson.role
        }
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Debug person error:', error)
    return NextResponse.json(
      { error: 'Failed to update person' },
      { status: 500 }
    )
  }
}
