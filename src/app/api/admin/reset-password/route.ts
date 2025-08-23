import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { getServerSession } from 'next-auth'

export const runtime = 'nodejs';
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      )
    }

    // Check if user is admin
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Acceso denegado. Solo administradores pueden resetear contraseñas.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { email, newPassword } = body

    // Validation
    if (!email || !newPassword) {
      return NextResponse.json(
        { message: 'Email y nueva contraseña son requeridos' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { message: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      )
    }

    // Find person by email
    const person = await prisma.people.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        personTenants: {
          where: { status: 'ACTIVE' },
          include: { company: true },
          orderBy: { startDate: 'desc' },
          take: 1
        }
      }
    })

    if (!person) {
      return NextResponse.json(
        { message: 'Persona no encontrada' },
        { status: 404 }
      )
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Update person's password
    await prisma.people.update({
      where: { id: person.id },
      data: { password: hashedPassword }
    })

    // Log the password reset action
    await prisma.auditLogs.create({
      data: {
        personId: person.id,
        action: 'PASSWORD_RESET',
        entityType: 'PERSON',
        entityId: person.id,
        oldValues: null,
        newValues: JSON.stringify({ passwordUpdated: true })
      }
    })

    return NextResponse.json({
      message: 'Contraseña actualizada exitosamente',
      person: {
        id: person.id,
        email: person.email,
        name: person.name,
        role: person.role
      }
    })

  } catch (error) {
    console.error('Password reset error:', error)
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    )
  } finally {
    // prisma.$disconnect() // This line is removed as per the new_code
  }
} 