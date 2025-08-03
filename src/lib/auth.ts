import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
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
              companySlug: 'demo-company',
              password: 'password123'
            },
            {
              id: '2', 
              email: 'supervisor@demo.com',
              name: 'Ricardo Supervisor',
              role: 'SUPERVISOR',
              companyId: 'demo-company',
              companySlug: 'demo-company',
              password: 'password123'
            },
            {
              id: '3',
              email: 'admin@demo.com', 
              name: 'Ricardo Administrador',
              role: 'ADMIN',
              companyId: 'demo-company',
              companySlug: 'demo-company',
              password: 'password123'
            },
            {
              id: '4',
              email: 'superuser@demo.com', 
              name: 'System SuperUser',
              role: 'SUPERUSER',
              companyId: 'demo-company',
              companySlug: 'demo-company',
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
              companyId: demoUser.companyId,
              companySlug: demoUser.companySlug
            } as any
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
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      console.log('=== JWT CALLBACK ===')
      console.log('JWT callback - user:', user)
      console.log('JWT callback - token before:', token)
      
      if (user) {
        console.log('JWT callback - Setting user data on token')
        token.role = user.role
        token.companyId = user.companyId
        token.companySlug = user.companySlug
      } else {
        console.log('JWT callback - No user data, keeping existing token')
      }
      
      console.log('JWT callback - token after:', token)
      console.log('=== END JWT CALLBACK ===')
      return token
    },
    async session({ session, token }) {
      console.log('=== SESSION CALLBACK ===')
      console.log('Session callback - token:', token)
      console.log('Session callback - session before:', session)
      
      if (token) {
        console.log('Session callback - Token exists, setting user data')
        // Ensure session.user exists with proper typing
        if (!session.user) {
          console.log('Session callback - Creating new session.user object')
          session.user = {
            id: '',
            name: '',
            email: '',
            role: '',
            companyId: '',
            companySlug: ''
          }
        }
        
        session.user.id = token.sub || ''
        session.user.role = (token.role as string) || ''
        session.user.companyId = (token.companyId as string) || ''
        session.user.companySlug = (token.companySlug as string) || ''
        
        console.log('Session callback - User data set:', session.user)
      } else {
        console.log('Session callback - No token provided')
      }
      
      console.log('Session callback - session after:', session)
      console.log('=== END SESSION CALLBACK ===')
      return session
    }
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error'
  },
  secret: process.env.NEXTAUTH_SECRET,
}