import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { getPrismaWithIam } from '@/lib/prisma-iam'
import bcrypt from 'bcryptjs'

// Helper function for exponential backoff retry
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff: 1s, 2s, 4s
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
}

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
          console.log('🔍 Checking database for user:', credentials.email);
          const prisma = await getPrismaWithIam();
          const user = await retryWithBackoff(async () => {
            return await prisma.user.findUnique({
              where: { email: credentials.email },
              include: {
                userTenants: {
                  where: { status: 'ACTIVE' },
                  include: { company: true },
                  orderBy: { startDate: 'desc' },
                  take: 1
                }
              }
            });
          });

          console.log('👤 User found:', user ? 'Yes' : 'No');
          if (user) {
            console.log('🔑 User has password:', !!user.password);
            console.log('🏢 User tenants:', user.userTenants.length);
          }

          if (!user || !user.password) {
            console.log('❌ User not found or no password');
            return null
          }

          // Verify password
          const isValid = await bcrypt.compare(credentials.password, user.password)
          console.log('🔐 Password valid:', isValid);
          if (!isValid) {
            console.log('❌ Invalid password');
            return null
          }

          // Get user's current company (most recent active tenant relationship)
          const currentTenant = user.userTenants[0]
          console.log('🏢 Current tenant:', currentTenant ? 'Found' : 'Not found');
          
          // If no tenant relationship found (database connection issues), use direct user role
          if (!currentTenant) {
            console.log('⚠️ No tenant relationship, using direct user role');
            // Fallback: use user's direct role and companyId
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              companyId: user.companyId || 'unknown',
              companySlug: 'unknown'
            }
          }

          console.log('✅ Auth successful with tenant');
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
      if (user) {
        token.role = user.role
        token.companyId = user.companyId
        token.companySlug = user.companySlug
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        // Ensure session.user exists with proper typing
        if (!session.user) {
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
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error'
  },
  secret: process.env.NEXTAUTH_SECRET,
}