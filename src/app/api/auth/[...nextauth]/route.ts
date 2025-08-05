import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

// Force dynamic rendering - prevents build-time database connections
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
