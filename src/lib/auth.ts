import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async authorize(credentials) {
  if (!credentials?.email || !credentials?.password) {
    return null
  }

  try {
    // Check demo users first (for testing)
    const demoUsers = [
      {
        id: '1',
        email: 'worker@demo.com',
        name: 'Ricardo Trabajador',
        role: 'WORKER',
        companyId: 'demo-company',
        password: 'password123'
      },
      {
        id: '2', 
        email: 'supervisor@demo.com',
        name: 'Ricardo Supervisor',
        role: 'SUPERVISOR',
        companyId: 'demo-company',
        password: 'password123'
      },
      {
        id: '3',
        email: 'admin@demo.com', 
        name: 'Ricardo Administrador',
        role: 'ADMIN',
        companyId: 'demo-company',
        password: 'password123'
      }
    ]

    // Check demo users
    const demoUser = demoUsers.find(u => u.email === credentials.email)
    if (demoUser && credentials.password === demoUser.password) {
      return {
        id: demoUser.id,
        email: demoUser.email,
        name: demoUser.name,
        role: demoUser.role,
        companyId: demoUser.companyId
      }
    }

    // Check real users from database
    const user = await prisma.user.findUnique({
      where: { email: credentials.email },
      include: {
        userTenants: {
          where: { status: 'ACTIVE' },
          include: { company: true },
          orderBy: { startDate: 'desc' },
          take: 1
        }
      }
    })

    if (!user || !user.password) {
      return null
    }

    // Verify password
    const isValid = await bcrypt.compare(credentials.password, user.password)
    if (!isValid) {
      return null
    }

    // Get user's current company (most recent active tenant relationship)
    const currentTenant = user.userTenants[0]
    if (!currentTenant) {
      return null
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: currentTenant.role,
      companyId: currentTenant.companyId,
      companySlug: currentTenant.company.slug
    }

  } catch (error) {
    console.error('Auth error:', error)
    return null
  } finally {
    await prisma.$disconnect()
  }
}