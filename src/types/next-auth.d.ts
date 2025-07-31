import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role: string
      companyId: string
      companySlug: string
    }
  }

  interface User {
    id: string
    email: string
    name: string
    role: string
    companyId: string
    companySlug: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string
    companyId: string
    companySlug: string
  }
} 