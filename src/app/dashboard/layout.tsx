'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Sidebar from '@/components/dashboard/Sidebar'

export default function DashboardLayout({ children, }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Add debugging
  useEffect(() => {
    console.log('Dashboard Layout - Session:', session)
    console.log('Dashboard Layout - Status:', status)
    console.log('Dashboard Layout - User Role:', session?.user?.role)
  }, [session, status])

  useEffect(() => {
    // Only redirect if we're sure the user is not authenticated
    // AND we're not in a loading state
    if (status === 'unauthenticated' && !session) {
      console.log('Dashboard Layout - Unauthenticated, redirecting to login')
      router.push('/auth/login')
    }
  }, [status, session, router])

  // Show loading while checking authentication
  if (status === 'loading') {
    console.log('Dashboard Layout - Loading...')
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Don't render anything if not authenticated (will redirect)
  if (status === 'unauthenticated' || !session) {
    console.log('Dashboard Layout - Unauthenticated or no session, not rendering')
    return null
  }

  console.log('Dashboard Layout - Rendering dashboard with session:', session.user?.name)
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}