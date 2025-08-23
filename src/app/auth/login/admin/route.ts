import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { email, newPassword } = await request.json()

    if (!email || !newPassword) {
      return NextResponse.json(
        { message: 'Email y contraseña son requeridos' },
        { status: 400 }
      )
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { message: 'La contraseña debe tener al menos 8 caracteres' },
        { status: 400 }
      )
    }

    const prisma = await getPrisma()
    
    // Find person
    const person = await prisma.people.findUnique({
      where: { email }
    })

    if (!person) {
      return NextResponse.json(
        { message: 'Persona no encontrada' },
        { status: 404 }
      )
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Update person password
    await prisma.people.update({
      where: { id: person.id },
      data: { password: hashedPassword }
    })

    return NextResponse.json({
      message: 'Contraseña actualizada exitosamente'
    })

  } catch (error) {
    console.error('Password reset error:', error)
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    )
  } finally {
    // The original code had prisma.$disconnect(), but prisma is now imported directly.
    // If the intent was to close the connection, it should be removed or handled differently
    // if the prisma instance is global or managed elsewhere.
    // For now, removing as per the new_code.
  }
}