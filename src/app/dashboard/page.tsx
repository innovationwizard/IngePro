'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ClockInCard } from '@/components/dashboard/ClockInCard'
import { ProjectSelector } from '@/components/dashboard/ProjectSelector'
import { LocationTracker } from '@/components/dashboard/LocationTracker'
import { RecentWorkLogs } from '@/components/dashboard/RecentWorkLogs'
import { useWorkLogStore } from '@/store'
import { es } from '@/lib/translations/es'

export default function DashboardPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { isClockedIn, currentWorkLog } = useWorkLogStore()
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Redirect superusers to their dashboard
  useEffect(() => {
    if (session?.user?.role === 'SUPERUSER') {
      router.push('/dashboard/superuser')
    }
  }, [session, router])

  // Don't render the regular dashboard for superusers
  if (session?.user?.role === 'SUPERUSER') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {es.dashboard.welcome}, {session?.user?.name}
          </h1>
          <p className="text-gray-600">
            {currentTime.toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-blue-600">
            {currentTime.toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false,
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <ClockInCard />
          <ProjectSelector />
          <LocationTracker />
        </div>
        <div>
          <RecentWorkLogs />
        </div>
      </div>
    </div>
  )
}
