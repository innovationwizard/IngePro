import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { getPrisma } from '@/lib/prisma'
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
          // Check real people from database
          console.log('🔍 Checking database for person:', credentials.email);
          const prisma = await getPrisma();
          // Temporary diagnostics: confirm effective DB and user
          try {
            const diag = await prisma.$queryRaw<any[]>`SELECT current_user AS user, current_database() AS db`;
            if (Array.isArray(diag) && diag[0]) {
              console.log(`🧭 DB diagnostics → user: ${diag[0].user}, db: ${diag[0].db}`);
            }
          } catch (e) {
            console.log('⚠️ DB diagnostics failed');
          }
          const user = await retryWithBackoff(async () => {
            return await prisma.people.findUnique({
              where: { email: credentials.email },
              include: {
                personTenants: {
                  where: { status: 'ACTIVE' },
                  include: { company: true },
                  orderBy: { startDate: 'desc' },
                  take: 1
                }
              }
            });
          });

          console.log('👤 Person found:', user ? 'Yes' : 'No');
          if (user) {
            console.log('🔑 Person has password:', !!user.password);
            console.log('🏢 Person tenants:', user.personTenants.length);
          }

          if (!user || !user.password) {
            console.log('❌ Person not found or no password');
            return null
          }

          // Verify password
          const isValid = await bcrypt.compare(credentials.password, user.password)
          console.log('🔐 Password valid:', isValid);
          if (!isValid) {
            console.log('❌ Invalid password');
            return null
          }

          // Get person's current company (most recent active tenant relationship)
          const activeTenants = user.personTenants.filter(ut => ut.status === 'ACTIVE');
          const currentTenant = activeTenants[0];
          console.log('🏢 Current tenant:', currentTenant ? 'Found' : 'Not found');
          console.log('👤 Person role:', user.role);
          console.log('🏢 Tenant status:', currentTenant?.status);
          
          // If no tenant relationship found, use person's single role
          if (!currentTenant) {
            console.log('⚠️ No tenant relationship, using person role');
            console.log('🔍 Person role from database:', user.role);
            
            // Special handling for superusers - they don't need company relationships
            if (user.role === 'SUPERUSER') {
              console.log('🔑 Superuser detected - no company relationship needed');
              return {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                companyId: 'system',
                companySlug: 'system'
              }
            }
            
            // For other roles without company relationships
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              companyId: user.companyId || 'unknown',
              companySlug: 'unknown'
            }
          }

          // Person has only one role - use it
          console.log('✅ Auth successful with person role:', user.role);
          
          return {
            id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
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
        
        // Special handling for superusers in session
        if (token.role === 'SUPERUSER') {
          session.user.companyId = 'system'
          session.user.companySlug = 'system'
        }
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