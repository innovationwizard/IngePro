import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

// Demo users for testing
const demoUsers = [
  {
    id: '1',
    email: 'worker@demo.com',
    name: 'Juan Pérez',
    role: 'WORKER',
    companyId: 'demo-company',
  },
  {
    id: '2',
    email: 'supervisor@demo.com',
    name: 'María González',
    role: 'SUPERVISOR',
    companyId: 'demo-company',
  },
  {
    id: '3',
    email: 'admin@demo.com',
    name: 'Carlos Rodríguez',
    role: 'ADMIN',
    companyId: 'demo-company',
  },
]

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Simple demo authentication
        const user = demoUsers.find(u => u.email === credentials.email)
        
        if (!user || credentials.password !== 'password123') {
          return null
        }

        return user
      },
    }),
  ],
  session: {
    strategy: 'jwt',
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
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.companyId = token.companyId as string
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/login',
  },
}
