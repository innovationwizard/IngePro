import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { companyName, companySlug, adminName, adminEmail, adminPassword } = body

    // Validation
    if (!companyName || !companySlug || !adminName || !adminEmail || !adminPassword) {
      return NextResponse.json(
        { message: 'Todos los campos son requeridos' },
        { status: 400 }
      )
    }

    // Test database connection first
    try {
      await prisma.$queryRaw`SELECT 1 as test`
    } catch (dbError) {
      console.error('Database connection failed:', dbError)
      return NextResponse.json(
        { 
          message: 'Servicio temporalmente no disponible. Por favor, intente nuevamente en unos minutos.',
          error: 'DATABASE_CONNECTION_ERROR'
        },
        { status: 503 }
      )
    }

    // Check if company slug already exists
    const existingCompany = await prisma.company.findUnique({
      where: { slug: companySlug }
    })
    
    if (existingCompany) {
      return NextResponse.json(
        { message: 'Ya existe una empresa con este nombre' },
        { status: 400 }
      )
    }

    // Check if admin email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail }
    })
    
    if (existingUser) {
      return NextResponse.json(
        { message: 'Ya existe un usuario con este email' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 12)

    // Create company and admin user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create company
      const company = await tx.company.create({
        data: {
          name: companyName,
          nameEs: companyName,
          slug: companySlug,
          status: 'ACTIVE'
        }
      })

      // Create admin user
      const user = await tx.user.create({
        data: {
          email: adminEmail,
          name: adminName,
          password: hashedPassword,
          role: 'ADMIN',
          status: 'ACTIVE'
        }
      })

      // Create user-tenant relationship
      await tx.userTenant.create({
        data: {
          userId: user.id,
          companyId: company.id,
          role: 'ADMIN',
          status: 'ACTIVE',
          startDate: new Date()
        }
      })

      return { company, user }
    })

    return NextResponse.json({
      message: 'Cuenta creada exitosamente',
      tenant: result.company,
      user: { 
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
        companyId: result.company.id
      }
    })

  } catch (error) {
    console.error('Signup error:', error)
    
    // Check if it's a database connection error
    if (error instanceof Error && error.message.includes('Can\'t reach database server')) {
      return NextResponse.json(
        { 
          message: 'Servicio temporalmente no disponible. Por favor, intente nuevamente en unos minutos.',
          error: 'DATABASE_CONNECTION_ERROR'
        },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { message: 'Error interno del servidor', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}