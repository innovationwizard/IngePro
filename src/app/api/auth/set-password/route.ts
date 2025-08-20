import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'
import { z } from 'zod'

export const runtime = 'nodejs'

const setPasswordSchema = z.object({
  token: z.string(),
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = setPasswordSchema.parse(body)
    
    const prisma = await getPrisma()

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // For now, we'll skip token validation since we're not storing tokens
    // In a production system, you'd validate the invitation token
    // TODO: Implement proper token validation

    // Hash the new password
    const hashedPassword = await hash(validatedData.password, 12)

    // Update user password
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        password: hashedPassword,
        updatedAt: new Date()
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE',
        entityType: 'USER',
        entityId: user.id,
        newValues: JSON.stringify({ passwordChanged: true })
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Password set successfully'
    })

  } catch (error) {
    console.error('Error setting password:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to set password' },
      { status: 500 }
    )
  }
}
