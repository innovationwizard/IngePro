import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

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

        // Demo users for production
        const demoUsers = [
          {
            id: '1',
            email: 'worker@demo.com',
            name: 'Juan Pérez',
            role: 'WORKER',
            companyId: 'demo-company'
          },
          {
            id: '2',
            email: 'supervisor@demo.com',
            name: 'María González',
            role: 'SUPERVISOR',
            companyId: 'demo-company'
          },
          {
            id: '3',
            email: 'admin@demo.com',
            name: 'Carlos Rodríguez',
            role: 'ADMIN',
            companyId: 'demo-company'
          }
        ]

        const user = demoUsers.find(
          (u) => u.email === credentials.email && credentials.password === 'password123'
        )

        if (user) {
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            companyId: user.companyId
          }
        }

        return null
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
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub
        session.user.role = token.role as string
        session.user.companyId = token.companyId as string
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