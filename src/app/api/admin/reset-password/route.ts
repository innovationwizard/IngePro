import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { getServerSession } from 'next-auth'
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

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        userTenants: {
          where: { status: 'ACTIVE' },
          include: { company: true },
          orderBy: { startDate: 'desc' },
          take: 1
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { message: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Update user's password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    })

    // Log the password reset action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'PASSWORD_RESET',
        entityType: 'USER',
        entityId: user.id,
        oldValues: null,
        newValues: JSON.stringify({ passwordUpdated: true })
      }
    })

    return NextResponse.json({
      message: 'Contraseña actualizada exitosamente',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.userTenants[0]?.role || user.role
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